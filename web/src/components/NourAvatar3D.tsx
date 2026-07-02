import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { MouthShape } from '../lib/visemes';
import { REST } from '../lib/visemes';

/**
 * ─────────────────────────────────────────────────────────
 * REDP — "Nour" as a real-time 3D character (three.js)
 *
 * A procedurally-built hijab girl (head, hijab, face, eyes, brows, nose,
 * mouth). Her mouth is driven by `mouth` (open/wide/round visemes) so it
 * forms the actual shapes of the words being spoken; `state` drives body
 * language (idle sway + breathing, attentive listening tilt, thinking
 * glance, speaking bob), plus natural blinking.
 * ─────────────────────────────────────────────────────────
 */

export type NourState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Props {
  state: NourState;
  mouth?: MouthShape;
  size?: number;
}

const NourAvatar3D: React.FC<Props> = ({ state, mouth, size = 120 }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef<{ state: NourState; mouth: MouthShape }>({ state, mouth: mouth || REST });
  propsRef.current = { state, mouth: mouth || REST };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.12, 4.4);
    camera.lookAt(0, 0.05, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(1.5, 2.5, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb9a8ff, 0.5);
    rim.position.set(-2, 1, -1.5);
    scene.add(rim);

    // Materials
    const skin = new THREE.MeshStandardMaterial({ color: 0xf1caa6, roughness: 0.75, metalness: 0 });
    const hijabMat = new THREE.MeshStandardMaterial({ color: 0x6d5ce0, roughness: 0.85, metalness: 0 });
    const hijabDark = new THREE.MeshStandardMaterial({ color: 0x5a49c4, roughness: 0.85 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x7a2e38, roughness: 0.5 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x2a2016, roughness: 0.2 });
    const browMat = new THREE.MeshStandardMaterial({ color: 0x5a3d2b, roughness: 0.6 });

    const char = new THREE.Group();
    char.position.y = 0.05;
    scene.add(char);

    // Hijab (covers the head)
    const hijab = new THREE.Mesh(new THREE.SphereGeometry(1.16, 44, 44), hijabMat);
    hijab.scale.set(1.02, 1.12, 1.0);
    char.add(hijab);

    // Shoulder drape (hint of body below)
    const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.5, 1.1, 40, 1, true), hijabDark);
    drape.position.set(0, -1.55, 0.05);
    char.add(drape);

    // Face (skin oval in front, framed by the hijab)
    const face = new THREE.Mesh(new THREE.SphereGeometry(1, 44, 44), skin);
    face.scale.set(0.72, 0.9, 0.55);
    face.position.set(0, -0.04, 0.64);
    char.add(face);

    // Cheeks blush
    const blushMat = new THREE.MeshStandardMaterial({ color: 0xf4a9a0, roughness: 0.8, transparent: true, opacity: 0.4 });
    for (const x of [-0.34, 0.34]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 20), blushMat);
      b.scale.set(1, 0.7, 0.3);
      b.position.set(x, -0.16, 1.02);
      char.add(b);
    }

    // Eyes (whites + pupils) — grouped so we can blink/scale
    const eyes: THREE.Mesh[] = [];
    const pupils = new THREE.Group();
    for (const x of [-0.27, 0.27]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), white);
      w.scale.set(1, 0.72, 0.55);
      w.position.set(x, 0.12, 1.0);
      char.add(w);
      eyes.push(w);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 20), pupilMat);
      p.position.set(x, 0.12, 1.08);
      pupils.add(p);
    }
    char.add(pupils);

    // Eyebrows
    const brows: THREE.Mesh[] = [];
    for (const [x, r] of [[-0.27, 0.12] as const, [0.27, -0.12] as const]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.06), browMat);
      brow.position.set(x, 0.32, 1.02);
      brow.rotation.z = r;
      char.add(brow);
      brows.push(brow);
    }

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 16), skin);
    nose.position.set(0, -0.02, 1.12);
    nose.rotation.x = Math.PI / 2.1;
    char.add(nose);

    // Mouth (viseme-driven)
    const mouthMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 20), dark);
    mouthMesh.position.set(0, -0.36, 1.02);
    char.add(mouthMesh);

    // Animation state
    let raf = 0;
    const clock = new THREE.Clock();
    let nextBlink = 1.2;
    let blinkT = -1;
    let swayZ = 0;
    let m = { ...REST };

    const animate = () => {
      const t = clock.getElapsedTime();
      const { state: st, mouth: target } = propsRef.current;

      // ── Mouth (smoothed) ──
      m.open += (target.open - m.open) * 0.5;
      m.wide += (target.wide - m.wide) * 0.5;
      m.round += (target.round - m.round) * 0.5;
      const sx = 0.16 + m.wide * (1 - m.round) * 0.16 + m.round * 0.03;
      const sy = 0.05 + m.open * 0.32;
      mouthMesh.scale.set(sx, sy, 0.12);
      mouthMesh.position.y = -0.34 - m.open * 0.05;

      // ── Blink ──
      if (t > nextBlink && blinkT < 0) blinkT = t;
      let lid = 1;
      if (blinkT >= 0) {
        const dt = t - blinkT;
        lid = dt < 0.06 ? 1 - dt / 0.06 : dt < 0.13 ? (dt - 0.06) / 0.07 : 1;
        if (dt > 0.13) {
          blinkT = -1;
          nextBlink = t + 2 + Math.random() * 3;
        }
      }
      for (const e of eyes) e.scale.y = 0.72 * Math.max(0.06, lid);

      // ── Eyebrows (expression) ──
      const browUp = st === 'listening' ? 0.05 : st === 'thinking' ? 0.03 : st === 'speaking' ? 0.02 : 0;
      brows.forEach((b, i) => (b.position.y = 0.32 + browUp + (st === 'idle' ? Math.sin(t * 0.8 + i) * 0.004 : 0)));

      // ── Pupils (look direction) ──
      const lookX = st === 'thinking' ? 0.05 : Math.sin(t * 0.5) * 0.03;
      const lookY = st === 'thinking' ? 0.06 : 0;
      pupils.position.x = lookX;
      pupils.position.y = lookY;

      // ── Head body language ──
      let targetZ = Math.sin(t * 0.7) * 0.03; // idle sway
      let bob = 0;
      let lift = 0;
      if (st === 'listening') targetZ = 0.1 + Math.sin(t * 1.3) * 0.02;
      else if (st === 'thinking') { targetZ = -0.08; lift = 0.02; }
      else if (st === 'speaking') bob = Math.sin(t * 9) * 0.02;
      swayZ += (targetZ - swayZ) * 0.06;
      char.rotation.z = swayZ;
      char.rotation.y = st === 'thinking' ? 0.12 : Math.sin(t * 0.5) * 0.05;
      char.position.y = 0.05 + bob + lift + Math.sin(t * 1.6) * 0.006; // + breathing
      char.scale.setScalar(1 + Math.sin(t * 1.6) * 0.004);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [size]);

  return <div ref={mountRef} style={{ width: size, height: size }} />;
};

export default NourAvatar3D;
