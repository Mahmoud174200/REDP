/**
 * ─────────────────────────────────────────────────────────
 * REDP — Live Voice Client (Gemini Live API)
 *
 * Real-time, interruptible voice for the Aiva assistant:
 *   • streams mic audio (PCM16 @ 16kHz) to the Gemini Live WebSocket,
 *   • plays the model's streamed audio (PCM @ 24kHz) with barge-in,
 *   • relays the model's tool calls to the REDP backend (/assistant/live-tool)
 *     so every action stays role-scoped and grounded,
 *   • surfaces live transcripts of both sides.
 *
 * Config (model, api key, system instruction, tools) comes from
 * POST /assistant/live-config, so the raw key is only handed to an
 * authenticated browser. (Production hardening: swap in an ephemeral token.)
 * ─────────────────────────────────────────────────────────
 */

export type LiveState = 'connecting' | 'live' | 'ended' | 'error';

export interface LiveConfig {
  configured: boolean;
  model: string;
  api_key: string;
  system_instruction: string;
  tools: any[];
  voice_name?: string;
}

export interface LiveCallbacks {
  onState: (s: LiveState) => void;
  onUserTranscript: (text: string) => void;
  onBotTranscript: (text: string) => void;
  onSpeaking: (speaking: boolean) => void;
  onError: (msg: string) => void;
  onAmplitude?: (level: number) => void; // 0..1 loudness of Nour's voice (lip-sync)
}

const IN_RATE = 16000;
const OUT_RATE = 24000;

function floatToPCM16(input: Float32Array, inRate: number, outRate = IN_RATE): Int16Array {
  const ratio = inRate / outRate;
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)] || 0));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

export class LiveVoiceClient {
  private ws?: WebSocket;
  private cfg: LiveConfig;
  private cbs: LiveCallbacks;
  private toolExec: (name: string, args: any) => Promise<any>;

  private micStream?: MediaStream;
  private ctxIn?: AudioContext;
  private ctxOut?: AudioContext;
  private processor?: ScriptProcessorNode;
  private muteGain?: GainNode;

  private playHead = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private analyser?: AnalyserNode;
  private ampRaf = 0;
  private stopped = false;

  constructor(cfg: LiveConfig, cbs: LiveCallbacks, toolExec: (name: string, args: any) => Promise<any>) {
    this.cfg = cfg;
    this.cbs = cbs;
    this.toolExec = toolExec;
  }

  async start(): Promise<void> {
    this.cbs.onState('connecting');
    const url =
      'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=' +
      encodeURIComponent(this.cfg.api_key);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.ws!.send(
        JSON.stringify({
          setup: {
            model: this.cfg.model.startsWith('models/') ? this.cfg.model : 'models/' + this.cfg.model,
            generationConfig: {
              responseModalities: ['AUDIO'],
              ...(this.cfg.voice_name
                ? { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: this.cfg.voice_name } } } }
                : {}),
            },
            systemInstruction: { parts: [{ text: this.cfg.system_instruction }] },
            tools: this.cfg.tools?.length ? [{ functionDeclarations: this.cfg.tools }] : undefined,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        })
      );
    };

    this.ws.onmessage = (ev) => this.onMessage(ev);
    this.ws.onerror = () => this.fail('Voice connection error.');
    this.ws.onclose = (e) => {
      if (!this.stopped) {
        if (e.code !== 1000) this.fail(`Voice connection closed (${e.code}).`);
        else this.cbs.onState('ended');
      }
    };
  }

  private async onMessage(ev: MessageEvent) {
    let text: string;
    if (typeof ev.data === 'string') text = ev.data;
    else if (ev.data instanceof Blob) text = await ev.data.text();
    else text = new TextDecoder().decode(ev.data);

    let msg: any;
    try {
      msg = JSON.parse(text);
    } catch {
      return;
    }

    if (msg.setupComplete) {
      await this.startMic();
      this.cbs.onState('live');
      return;
    }

    if (msg.toolCall) {
      for (const fc of msg.toolCall.functionCalls || []) {
        let result: any;
        try {
          result = await this.toolExec(fc.name, fc.args || {});
        } catch (e: any) {
          result = { error: 'Tool failed: ' + (e?.message || 'unknown') };
        }
        this.send({
          toolResponse: { functionResponses: [{ id: fc.id, name: fc.name, response: { result } }] },
        });
      }
      return;
    }

    const sc = msg.serverContent;
    if (!sc) return;

    if (sc.interrupted) {
      this.stopPlayback(); // barge-in
    }

    if (sc.inputTranscription?.text) this.cbs.onUserTranscript(sc.inputTranscription.text);
    if (sc.outputTranscription?.text) this.cbs.onBotTranscript(sc.outputTranscription.text);

    const parts = sc.modelTurn?.parts || [];
    for (const p of parts) {
      const data = p.inlineData?.data;
      if (data) this.enqueueAudio(data);
    }
  }

  private send(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }

  // ── Microphone → stream ──
  private async startMic() {
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    this.ctxIn = new AudioContext();
    const source = this.ctxIn.createMediaStreamSource(this.micStream);
    this.processor = this.ctxIn.createScriptProcessor(4096, 1, 1);
    // Route through a muted gain so onaudioprocess fires without echoing the mic.
    this.muteGain = this.ctxIn.createGain();
    this.muteGain.gain.value = 0;

    this.processor.onaudioprocess = (e) => {
      if (this.stopped || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      const pcm = floatToPCM16(input, this.ctxIn!.sampleRate, IN_RATE);
      // NOTE: if the model doesn't hear you, switch `audio` → `mediaChunks:[...]`.
      this.send({ realtimeInput: { audio: { data: int16ToBase64(pcm), mimeType: `audio/pcm;rate=${IN_RATE}` } } });
    };

    source.connect(this.processor);
    this.processor.connect(this.muteGain);
    this.muteGain.connect(this.ctxIn.destination);
  }

  // ── Streamed playback (24kHz) with scheduling ──
  private enqueueAudio(b64: string) {
    if (!this.ctxOut) {
      this.ctxOut = new AudioContext({ sampleRate: OUT_RATE });
      this.analyser = this.ctxOut.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.ctxOut.destination);
      this.startAmpLoop();
    }
    const int16 = base64ToInt16(b64);
    const float = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float[i] = int16[i] / 0x8000;

    const buffer = this.ctxOut.createBuffer(1, float.length, OUT_RATE);
    buffer.getChannelData(0).set(float);
    const src = this.ctxOut.createBufferSource();
    src.buffer = buffer;
    src.connect(this.analyser || this.ctxOut.destination);

    const now = this.ctxOut.currentTime;
    const startAt = Math.max(now, this.playHead);
    src.start(startAt);
    this.playHead = startAt + buffer.duration;

    this.cbs.onSpeaking(true);
    this.activeSources.push(src);
    src.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== src);
      if (this.activeSources.length === 0) this.cbs.onSpeaking(false);
    };
  }

  private startAmpLoop() {
    if (!this.analyser || !this.cbs.onAmplitude) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    let smooth = 0;
    const tick = () => {
      if (this.stopped || !this.analyser) return;
      this.analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      smooth += (rms - smooth) * 0.5;
      this.cbs.onAmplitude!(Math.min(1, smooth * 3.2));
      this.ampRaf = requestAnimationFrame(tick);
    };
    this.ampRaf = requestAnimationFrame(tick);
  }

  private stopPlayback() {
    for (const s of this.activeSources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.activeSources = [];
    this.playHead = this.ctxOut?.currentTime || 0;
    this.cbs.onSpeaking(false);
  }

  private fail(msg: string) {
    if (this.stopped) return;
    this.cbs.onError(msg);
    this.cbs.onState('error');
    this.stop();
  }

  stop() {
    this.stopped = true;
    cancelAnimationFrame(this.ampRaf);
    this.cbs.onAmplitude?.(0);
    try {
      this.stopPlayback();
    } catch {
      /* ignore */
    }
    try {
      this.processor?.disconnect();
      this.muteGain?.disconnect();
    } catch {
      /* ignore */
    }
    this.micStream?.getTracks().forEach((t) => t.stop());
    try {
      this.ctxIn?.close();
      this.ctxOut?.close();
    } catch {
      /* ignore */
    }
    try {
      this.ws?.close(1000);
    } catch {
      /* ignore */
    }
    this.cbs.onState('ended');
  }
}
