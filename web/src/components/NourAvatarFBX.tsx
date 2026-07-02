import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import NourAvatar, { type NourState } from './NourAvatar';
import type { MouthShape } from '../lib/visemes';
import { REST } from '../lib/visemes';

/**
 * ─────────────────────────────────────────────────────────
 * REDP — "Nour" from the user's rigged FBX (textured hijab head)
 *
 * Loads /nour.fbx (a facially-rigged, textured female head + hijab) and
 * lip-syncs by rotating the JAW bone to the viseme "open" amount, so her
 * mouth moves with the words. Head bone gets body language.
 *
 * Because the FBX is authored blind (generic mesh names, unknown bone axes,
 * unknown scale), all the fiddly bits are tunable live from the browser
 * console (no rebuild), then reload:
 *   localStorage.setItem('nour_scale','0.01')   // model scale
 *   localStorage.setItem('nour_ty','0.02')      // camera vertical aim offset
 *   localStorage.setItem('nour_cd','0.55')      // camera distance from head
 *   localStorage.setItem('nour_jaw','0.35')     // jaw-open angle (radians)
 *   localStorage.setItem('nour_jawaxis','x')    // jaw rotation axis x|y|z
 *   localStorage.setItem('nour_hide','Plane.015,Plane.016')  // hide meshes (extra hijab styles)
 * On load it logs every bone + mesh name to the console so you can pick.
 * ─────────────────────────────────────────────────────────
 */

const FBX_URL = '/nour.fbx';

interface Props {
  state: NourState;
  mouth?: MouthShape;
  size?: number;
}

const num = (k: string, d: number) => {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null;
  const n = v == null ? NaN : parseFloat(v);
  return isNaN(n) ? d : n;
};
const str = (k: string, d: string) => {
  try {
    return localStorage.getItem(k) || d;
  } catch {
    return d;
  }
};

let cached: Promise<THREE.Group> | null = null;
const loadFbx = (): Promise<THREE.Group> => {
  if (!cached) cached = new FBXLoader().loadAsync(FBX_URL);
  return cached;
};

const NourAvatarFBX: React.FC<Props> = ({ state, mouth, size = 120 }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef<{ state: NourState; mouth: MouthShape }>({ state, mouth: mouth || REST });
  propsRef.current = { state, mouth: mouth || REST };
  const modelRef = useRef<THREE.Group | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFbx()
      .then((g) => {
        if (cancelled) return;
        modelRef.current = g;
        setReady(true);
      })
      .catch((e) => {
        console.warn('[Nour FBX] load failed:', e);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mountRef.current || !modelRef.current) return;
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.001, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(1, 2, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
    fill.position.set(-2, 1, 1.5);
    scene.add(fill);

    // Clone so multiple instances are independent.
    const model = modelRef.current.clone(true);

    // Auto-scale (FBX is usually in cm → huge). Normalize height ~1.7.
    let box = new THREE.Box3().setFromObject(model);
    const sizeV = box.getSize(new THREE.Vector3());
    const autoScale = sizeV.y > 0 ? 1.7 / sizeV.y : 1;
    const scale = num('nour_scale', autoScale);
    model.scale.setScalar(scale);
    scene.add(model);
    model.updateWorldMatrix(true, true);

    // Collect bones + meshes; log for tuning.
    const bones: THREE.Bone[] = [];
    const meshes: THREE.Mesh[] = [];
    model.traverse((o: any) => {
      if (o.isBone) bones.push(o);
      if (o.isMesh) {
        meshes.push(o);
        o.frustumCulled = false;
      }
    });
    const hide = str('nour_hide', '').split(',').map((s) => s.trim()).filter(Boolean);
    if (hide.length) meshes.forEach((m) => { if (hide.includes(m.name)) m.visible = false; });
    console.log('[Nour FBX] bones:', bones.map((b) => b.name));
    console.log('[Nour FBX] meshes:', meshes.map((m) => m.name));

    const jaw = bones.find((b) => /jaw/i.test(b.name)) || null;
    const head = bones.find((b) => /head/i.test(b.name) && !/headtop|end/i.test(b.name)) || null;
    console.log('[Nour FBX] jaw bone:', jaw?.name, ' head bone:', head?.name);

    const jawBase = jaw ? jaw.rotation.clone() : new THREE.Euler();
    const headBase = head ? head.rotation.clone() : new THREE.Euler();

    // Frame the head.
    box = new THREE.Box3().setFromObject(model);
    const target = new THREE.Vector3();
    if (head) head.getWorldPosition(target);
    else {
      box.getCenter(target);
      target.y = box.max.y - (box.max.y - box.min.y) * 0.08;
    }
    const cd = num('nour_cd', 0.55);
    const ty = num('nour_ty', 0.0);
    camera.position.set(target.x, target.y + ty + 0.03, target.z + cd);
    camera.lookAt(target.x, target.y + ty, target.z);

    const jawAngle = num('nour_jaw', 0.35);
    const jawAxis = str('nour_jawaxis', 'x');

    let raf = 0;
    const clock = new THREE.Clock();
    const cur = { ...REST };

    const animate = () => {
      const t = clock.getElapsedTime();
      const { state: st, mouth: m } = propsRef.current;
      cur.open += (m.open - cur.open) * 0.5;

      // Jaw-based lip-sync
      if (jaw) {
        const a = cur.open * jawAngle;
        jaw.rotation.set(jawBase.x, jawBase.y, jawBase.z);
        if (jawAxis === 'y') jaw.rotation.y = jawBase.y + a;
        else if (jawAxis === 'z') jaw.rotation.z = jawBase.z + a;
        else jaw.rotation.x = jawBase.x + a;
      }

      // Head body language
      if (head) {
        let tilt = Math.sin(t * 0.7) * 0.02;
        let nod = 0;
        if (st === 'listening') tilt = 0.08 + Math.sin(t * 1.3) * 0.02;
        else if (st === 'thinking') { tilt = -0.06; nod = -0.05; }
        else if (st === 'speaking') nod = Math.sin(t * 9) * 0.025;
        head.rotation.set(headBase.x + nod, headBase.y + Math.sin(t * 0.5) * 0.04, headBase.z + tilt);
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

  if (failed) return <NourAvatar state={state} amplitude={mouth?.open ?? 0} size={size} />;
  if (!ready) return <NourAvatar state={state} amplitude={mouth?.open ?? 0} size={size} />;
  return <div ref={mountRef} style={{ width: size, height: size }} />;
};

export default NourAvatarFBX;
