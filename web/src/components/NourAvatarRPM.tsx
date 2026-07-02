import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import NourAvatar, { type NourState } from './NourAvatar';
import type { MouthShape } from '../lib/visemes';
import { REST } from '../lib/visemes';

/**
 * ─────────────────────────────────────────────────────────
 * REDP — "Nour" as a Ready Player Me avatar (real 3D + visemes)
 *
 * Loads a Ready Player Me .glb (which ships ARKit/Oculus viseme morph
 * targets) and drives its mouth from the viseme engine, so it forms the
 * shapes of the words. Head bone gets subtle body language; eyes blink.
 *
 * The avatar URL comes from (in order): localStorage 'nour_avatar_url',
 * env VITE_NOUR_AVATAR_URL. If none is set — or the model fails to load —
 * it gracefully falls back to the built-in procedural character so the
 * widget is never empty.
 *
 * Create your avatar at https://readyplayer.me, then set the URL (append
 *   ?morphTargets=ARKit,Oculus%20Visemes
 * so lip-sync works), e.g. in the browser console:
 *   localStorage.setItem('nour_avatar_url',
 *     'https://models.readyplayer.me/<id>.glb?morphTargets=ARKit,Oculus%20Visemes')
 * ─────────────────────────────────────────────────────────
 */

export type { NourState };

interface Props {
  state: NourState;
  mouth?: MouthShape;
  size?: number;
}

function resolveUrl(): string {
  let url = '';
  try {
    url = localStorage.getItem('nour_avatar_url') || '';
  } catch {
    /* ignore */
  }
  if (!url) url = (import.meta.env.VITE_NOUR_AVATAR_URL as string) || '';
  if (url && !/morphTargets=/i.test(url)) {
    url += (url.includes('?') ? '&' : '?') + 'morphTargets=ARKit,Oculus%20Visemes';
  }
  return url;
}

// Cache the loaded gltf per url so multiple avatars share one download.
const modelCache = new Map<string, Promise<any>>();
function loadModel(url: string): Promise<any> {
  if (!modelCache.has(url)) {
    const loader = new GLTFLoader();
    modelCache.set(url, loader.loadAsync(url));
  }
  return modelCache.get(url)!;
}

const NourAvatarRPM: React.FC<Props> = ({ state, mouth, size = 120 }) => {
  const url = resolveUrl();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef<{ state: NourState; mouth: MouthShape }>({ state, mouth: mouth || REST });
  propsRef.current = { state, mouth: mouth || REST };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const sceneRef = useRef<any>(null);

  // Load the GLB.
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    loadModel(url)
      .then((gltf) => {
        if (cancelled) return;
        sceneRef.current = gltf.scene;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Build the three.js scene once the model is ready and the mount exists.
  useEffect(() => {
    if (!ready || !mountRef.current || !sceneRef.current) return;
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(1, 2, 2.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xcfd8ff, 0.5);
    fill.position.set(-2, 1, 1);
    scene.add(fill);

    const model = cloneSkeleton(sceneRef.current);
    scene.add(model);
    model.updateWorldMatrix(true, true);

    // Frame the head.
    const headBone = model.getObjectByName('Head');
    const headPos = new THREE.Vector3();
    if (headBone) headBone.getWorldPosition(headPos);
    else {
      const box = new THREE.Box3().setFromObject(model);
      box.getCenter(headPos);
      headPos.y = box.max.y - 0.15;
    }
    camera.position.set(headPos.x, headPos.y + 0.04, headPos.z + 0.62);
    camera.lookAt(headPos.x, headPos.y - 0.02, headPos.z);

    // Collect morph-capable meshes.
    const morphMeshes: THREE.Mesh[] = [];
    model.traverse((o: any) => {
      if (o.isMesh && o.morphTargetDictionary && o.morphTargetInfluences) morphMeshes.push(o);
      if (o.isMesh) o.frustumCulled = false;
    });
    const setMorph = (name: string, val: number) => {
      for (const m of morphMeshes) {
        const idx = (m.morphTargetDictionary as any)[name];
        if (idx !== undefined) (m.morphTargetInfluences as number[])[idx] = val;
      }
    };

    const baseRot = headBone ? headBone.rotation.clone() : new THREE.Euler();

    let raf = 0;
    const clock = new THREE.Clock();
    let nextBlink = 1.2;
    let blinkT = -1;
    const cur = { ...REST };

    const animate = () => {
      const t = clock.getElapsedTime();
      const { state: st, mouth: m } = propsRef.current;

      cur.open += (m.open - cur.open) * 0.5;
      cur.wide += (m.wide - cur.wide) * 0.5;
      cur.round += (m.round - cur.round) * 0.5;

      // Visemes → ARKit blendshapes (RPM). Names no-op if absent.
      setMorph('jawOpen', Math.min(1, cur.open));
      setMorph('mouthOpen', Math.min(1, cur.open * 0.8));
      setMorph('mouthFunnel', cur.round * 0.8);
      setMorph('mouthPucker', cur.round * 0.6);
      setMorph('mouthSmileLeft', cur.wide * 0.35);
      setMorph('mouthSmileRight', cur.wide * 0.35);
      // Oculus viseme fallbacks
      setMorph('viseme_aa', cur.open * (1 - cur.round));
      setMorph('viseme_O', cur.round);
      setMorph('viseme_E', cur.wide * 0.5);

      // Blink
      if (t > nextBlink && blinkT < 0) blinkT = t;
      let blink = 0;
      if (blinkT >= 0) {
        const dt = t - blinkT;
        blink = dt < 0.06 ? dt / 0.06 : dt < 0.13 ? 1 - (dt - 0.06) / 0.07 : 0;
        if (dt > 0.13) {
          blinkT = -1;
          nextBlink = t + 2 + Math.random() * 3;
        }
      }
      setMorph('eyeBlinkLeft', blink);
      setMorph('eyeBlinkRight', blink);

      // Head body language
      if (headBone) {
        let tilt = Math.sin(t * 0.7) * 0.03;
        let nod = 0;
        if (st === 'listening') tilt = 0.12 + Math.sin(t * 1.3) * 0.02;
        else if (st === 'thinking') { tilt = -0.08; nod = -0.06; }
        else if (st === 'speaking') nod = Math.sin(t * 9) * 0.03;
        headBone.rotation.set(baseRot.x + nod, baseRot.y + Math.sin(t * 0.5) * 0.05, baseRot.z + tilt);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [ready, size]);

  if (!url || failed) return <NourAvatar state={state} amplitude={mouth?.open ?? 0} size={size} />;
  if (!ready) return <NourAvatar state={state} amplitude={mouth?.open ?? 0} size={size} />;
  return <div ref={mountRef} style={{ width: size, height: size }} />;
};

export default NourAvatarRPM;
