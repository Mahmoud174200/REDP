import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { X, Save, Trash2, RotateCw, HelpCircle, Layers, PenTool, Eraser } from 'lucide-react';
import api from '../../services/api';

interface FloorPlanEditorProps {
  unitId: string;
  unitNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

type CellType = 'empty' | 'wall' | 'door' | 'window';
type FloorType = 'default' | 'wood' | 'tile' | 'carpet' | 'balcony' | 'grass';
type FurnitureType = 'bed' | 'sofa' | 'table' | 'chair' | 'plant' | 'toilet' | 'bath' | 'sink' | 'counter' | null;

interface GridCell {
  type: CellType;
  floor: FloorType;
  furniture: FurnitureType;
  rotation: number; // 0, 90, 180, 270
}

const GRID_SIZE = 14;

const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ unitId, unitNumber, onClose, onSuccess }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      setRuntimeError(e.message + '\n' + e.filename + ':' + e.lineno);
    };
    const handleRejection = (e: PromiseRejectionEvent) => {
      setRuntimeError('Unhandled Rejection: ' + e.reason);
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // ── Grid State ──
  const [grid, setGrid] = useState<GridCell[][]>(() => {
    return Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        type: 'empty',
        floor: 'default',
        furniture: null,
        rotation: 0
      }))
    );
  });

  // ── Editor Controls State ──
  const [activeTool, setActiveTool] = useState<'wall' | 'window' | 'door' | 'floor' | 'furniture' | 'eraser'>('wall');
  const [selectedFloor, setSelectedFloor] = useState<FloorType>('wood');
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureType>('bed');
  const [furnitureRotation, setFurnitureRotation] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<any>(null); // 'draw' or 'erase'
  const [isInitialized, setIsInitialized] = useState(false);

  // ── Three.js Refs ──
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  // ── Initialize Three.js Scene ──
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f3f4f6');
    sceneRef.current = scene;

    // Create camera (initially with default aspect ratio, updated by ResizeObserver)
    const initialWidth = container.clientWidth || 300;
    const initialHeight = container.clientHeight || 300;
    const camera = new THREE.PerspectiveCamera(
      45,
      initialWidth / initialHeight,
      0.1,
      1000
    );
    camera.position.set(12, 15, 12);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(initialWidth, initialHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1; // Don't go below ground
    controls.minDistance = 3;
    controls.maxDistance = 40;

    // Add main group for the floor plan
    const floorPlanGroup = new THREE.Group();
    scene.add(floorPlanGroup);
    groupRef.current = floorPlanGroup;

    // Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 0.8);
    dirLight.position.set(15, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    // Add a subtle grid/helper plane below everything
    const helperGrid = new THREE.GridHelper(30, 30, '#d1d5db', '#e5e7eb');
    helperGrid.position.y = -0.01;
    scene.add(helperGrid);

    // Use ResizeObserver for robust layout container size monitoring
    const resizeObserver = new ResizeObserver((entries) => {
      if (!container) return;
      for (const entry of entries) {
        const w = entry.contentRect.width || container.clientWidth;
        const h = entry.contentRect.height || container.clientHeight;
        if (w === 0 || h === 0) continue;

        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Render loop
    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setIsInitialized(true);

    return () => {
      setIsInitialized(false);
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // ── Rebuild 3D Model whenever grid changes or initialized ──
  useEffect(() => {
    if (isInitialized) {
      rebuild3DModel();
    }
  }, [grid, isInitialized]);

  // ── Procedural Meshes Factory for 3D Elements ──
  const rebuild3DModel = () => {
    const group = groupRef.current;
    if (!group) return;

    // Clear old elements
    group.clear();

    const cellWidth = 1;
    const cellHeight = 2.5; // height of walls
    const wallThickness = 0.15;
    const offset = (GRID_SIZE * cellWidth) / 2;

    // Common Materials
    const wallMat = new THREE.MeshStandardMaterial({ color: '#f3f4f6', roughness: 0.8 });
    const woodFloorMat = new THREE.MeshStandardMaterial({ color: '#c4a482', roughness: 0.6 });
    const tileFloorMat = new THREE.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.3 });
    const carpetFloorMat = new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 0.9 });
    const balconyFloorMat = new THREE.MeshStandardMaterial({ color: '#60a5fa', roughness: 0.5 });
    const grassFloorMat = new THREE.MeshStandardMaterial({ color: '#34d399', roughness: 0.9 });
    const defaultFloorMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
    const glassMat = new THREE.MeshStandardMaterial({ color: '#a5f3fc', transparent: true, opacity: 0.5, roughness: 0.1 });
    const woodMat = new THREE.MeshStandardMaterial({ color: '#8b5a2b', roughness: 0.7 });
    const metalMat = new THREE.MeshStandardMaterial({ color: '#9ca3af', metalness: 0.9, roughness: 0.15 });
    const bedFabricMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.85 });
    const sofaFabricMat = new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.85 });
    const pillowMat = new THREE.MeshStandardMaterial({ color: '#f9fafb', roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: '#059669', roughness: 0.9 });
    const potMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.85 });
    const hedgeMat = new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.9 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.8 });
    const fabricGoldMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.85 });
    const fabricRedMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.85 });
    const fabricGreyMat = new THREE.MeshStandardMaterial({ color: '#d1d5db', roughness: 0.8 });
    const lampGlowMat = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: new THREE.Color('#fef08a'), emissiveIntensity: 0.8, roughness: 0.2 });
    const stemMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const waterMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', transparent: true, opacity: 0.6, roughness: 0.1 });
    const drainMat = new THREE.MeshStandardMaterial({ color: '#374151', metalness: 0.9, roughness: 0.1 });

    // Loop through grid cells and build geometry
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = grid[r][c];
        const posX = c * cellWidth - offset + cellWidth / 2;
        const posZ = r * cellWidth - offset + cellWidth / 2;

        // 1. Draw Floor Plate
        if (cell.floor !== 'default' || cell.type !== 'empty') {
          let currentFloorMat = defaultFloorMat;
          if (cell.floor === 'wood') currentFloorMat = woodFloorMat;
          else if (cell.floor === 'tile') currentFloorMat = tileFloorMat;
          else if (cell.floor === 'carpet') currentFloorMat = carpetFloorMat;
          else if (cell.floor === 'balcony') currentFloorMat = balconyFloorMat;
          else if (cell.floor === 'grass') currentFloorMat = grassFloorMat;

          const floorGeo = new THREE.BoxGeometry(cellWidth, 0.05, cellWidth);
          const floorMesh = new THREE.Mesh(floorGeo, currentFloorMat);
          floorMesh.position.set(posX, -0.025, posZ);
          floorMesh.receiveShadow = true;
          group.add(floorMesh);

          // Detailed organic garden layout (tufted grass, flowers, stepping stones, bushes, and hedges)
          if (cell.floor === 'grass') {
            const gardenGroup = new THREE.Group();
            gardenGroup.position.set(posX, 0, posZ);

            // Deterministic pseudo-random generation based on row/col index
            const seed = (r * 13 + c * 37) % 100;

            // 1. Boundary Hedges if on the outer edge of the grass layout
            if (r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1) {
              const hedgeGeo = new THREE.BoxGeometry(cellWidth, 0.4, 0.25);
              const hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
              hedge.position.set(0, 0.2, (r === 0) ? -0.375 : (r === GRID_SIZE - 1) ? 0.375 : 0);
              if (c === 0 || c === GRID_SIZE - 1) {
                hedge.rotation.y = Math.PI / 2;
                hedge.position.set((c === 0) ? -0.375 : 0.375, 0.2, 0);
              }
              hedge.castShadow = true;
              gardenGroup.add(hedge);
            }

            // 2. Stepping Stones (flat grey circular stones)
            const stoneCount = 1 + (seed % 2);
            for (let i = 0; i < stoneCount; i++) {
              const stoneGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 8);
              const stone = new THREE.Mesh(stoneGeo, stoneMat);
              const sx = ((seed + i * 17) % 7) / 10 - 0.3;
              const sz = ((seed + i * 23) % 7) / 10 - 0.3;
              stone.position.set(sx, 0.01, sz);
              stone.rotation.y = ((seed + i) * 25 * Math.PI) / 180;
              stone.receiveShadow = true;
              gardenGroup.add(stone);
            }

            // 3. Small bushes (clusters of dark green overlapping spheres)
            const bushCount = 1 + ((seed + 3) % 2);
            for (let i = 0; i < bushCount; i++) {
              const bx = ((seed + i * 11) % 8) / 10 - 0.35;
              const bz = ((seed + i * 19) % 8) / 10 - 0.35;
              const bushGroup = new THREE.Group();
              bushGroup.position.set(bx, 0, bz);

              const bGeo1 = new THREE.SphereGeometry(0.09 + (i * 0.02), 8, 8);
              const b1 = new THREE.Mesh(bGeo1, leavesMat);
              b1.position.set(0, 0.07, 0);
              b1.castShadow = true;
              bushGroup.add(b1);

              const bGeo2 = new THREE.SphereGeometry(0.07, 8, 8);
              const b2 = new THREE.Mesh(bGeo2, leavesMat);
              b2.position.set(0.05, 0.1, -0.03);
              b2.castShadow = true;
              bushGroup.add(b2);

              gardenGroup.add(bushGroup);
            }

            // 4. Flowers (colored heads on green stems)
            const fColors = ['#ef4444', '#f59e0b', '#ec4899', '#a855f7'];
            const flowerCount = 2 + (seed % 3);
            for (let i = 0; i < flowerCount; i++) {
              const fx = ((seed + i * 13) % 8) / 10 - 0.35;
              const fz = ((seed + i * 29) % 8) / 10 - 0.35;

              // Green stem
              const stemGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 4);
              const stem = new THREE.Mesh(stemGeo, leavesMat);
              stem.position.set(fx, 0.06, fz);
              gardenGroup.add(stem);

              // Flower petal head
              const flowerColor = fColors[(seed + i) % fColors.length];
              const fHeadGeo = new THREE.SphereGeometry(0.03, 6, 6);
              const fHeadMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.95 });
              const fHead = new THREE.Mesh(fHeadGeo, fHeadMat);
              fHead.position.set(fx, 0.12, fz);
              gardenGroup.add(fHead);
            }

            group.add(gardenGroup);
          }
        }

        // 2. Draw Walls, Windows, and Doors
        if (cell.type === 'wall') {
          const wallGeo = new THREE.BoxGeometry(cellWidth, cellHeight, cellWidth);
          const wallMesh = new THREE.Mesh(wallGeo, wallMat);
          wallMesh.position.set(posX, cellHeight / 2, posZ);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          group.add(wallMesh);
        } else if (cell.type === 'window') {
          // Bottom wall segment
          const bottomGeo = new THREE.BoxGeometry(cellWidth, 0.8, cellWidth);
          const bottomMesh = new THREE.Mesh(bottomGeo, wallMat);
          bottomMesh.position.set(posX, 0.4, posZ);
          bottomMesh.castShadow = true;
          bottomMesh.receiveShadow = true;
          group.add(bottomMesh);

          // Top wall segment
          const topGeo = new THREE.BoxGeometry(cellWidth, 0.5, cellWidth);
          const topMesh = new THREE.Mesh(topGeo, wallMat);
          topMesh.position.set(posX, cellHeight - 0.25, posZ);
          topMesh.castShadow = true;
          topMesh.receiveShadow = true;
          group.add(topMesh);

          // Glass Pane
          const glassGeo = new THREE.BoxGeometry(cellWidth - 0.05, 1.2, 0.1);
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          glassMesh.position.set(posX, 1.4, posZ);
          group.add(glassMesh);
        } else if (cell.type === 'door') {
          // Top lintel segment
          const lintelGeo = new THREE.BoxGeometry(cellWidth, 0.6, cellWidth);
          const lintelMesh = new THREE.Mesh(lintelGeo, wallMat);
          lintelMesh.position.set(posX, cellHeight - 0.3, posZ);
          lintelMesh.castShadow = true;
          lintelMesh.receiveShadow = true;
          group.add(lintelMesh);

          // Side door frames
          const frameLeftGeo = new THREE.BoxGeometry(0.1, 1.9, 0.1);
          const frameLeft = new THREE.Mesh(frameLeftGeo, woodMat);
          frameLeft.position.set(posX - cellWidth / 2 + 0.05, 0.95, posZ);
          group.add(frameLeft);

          const frameRightGeo = new THREE.BoxGeometry(0.1, 1.9, 0.1);
          const frameRight = new THREE.Mesh(frameRightGeo, woodMat);
          frameRight.position.set(posX + cellWidth / 2 - 0.05, 0.95, posZ);
          group.add(frameRight);
        }

        // 3. Draw Furniture
        if (cell.furniture) {
          const furnGroup = new THREE.Group();
          furnGroup.position.set(posX, 0, posZ);
          furnGroup.rotation.y = (cell.rotation * Math.PI) / 180;

          if (cell.furniture === 'bed') {
            // 1. Bed Frame Legs (4 short wood cylinders)
            const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8);
            const legPositions = [
              [-0.4, 0.06, -0.4],
              [0.4, 0.06, -0.4],
              [-0.4, 0.06, 0.4],
              [0.4, 0.06, 0.4]
            ];
            legPositions.forEach(pos => {
              const leg = new THREE.Mesh(legGeo, woodMat);
              leg.position.set(pos[0], pos[1], pos[2]);
              leg.castShadow = true;
              furnGroup.add(leg);
            });

            // 2. Bed Frame
            const frameGeo = new THREE.BoxGeometry(0.9, 0.18, 0.95);
            const frame = new THREE.Mesh(frameGeo, woodMat);
            frame.position.set(0, 0.21, 0);
            frame.castShadow = true;
            furnGroup.add(frame);

            // 3. Mattress (soft comfort layer)
            const matGeo = new THREE.BoxGeometry(0.85, 0.22, 0.9);
            const mattress = new THREE.Mesh(matGeo, pillowMat);
            mattress.position.set(0, 0.35, -0.02);
            mattress.castShadow = true;
            furnGroup.add(mattress);

            // 4. Main Blanket / Duvet
            const blanketGeo = new THREE.BoxGeometry(0.87, 0.23, 0.65);
            const blanket = new THREE.Mesh(blanketGeo, bedFabricMat);
            blanket.position.set(0, 0.36, 0.125);
            blanket.castShadow = true;
            furnGroup.add(blanket);

            // 5. Folded duvet sheet (contrasting style)
            const foldGeo = new THREE.BoxGeometry(0.87, 0.24, 0.12);
            const fold = new THREE.Mesh(foldGeo, fabricGreyMat);
            fold.position.set(0, 0.365, -0.18);
            furnGroup.add(fold);

            // 6. Pillows (squeezed organic spheres)
            const pillowGeo = new THREE.SphereGeometry(0.12, 16, 16);
            
            const pillowL = new THREE.Mesh(pillowGeo, pillowMat);
            pillowL.scale.set(1.6, 0.5, 1.0);
            pillowL.position.set(-0.2, 0.47, -0.32);
            pillowL.rotation.x = -0.15;
            furnGroup.add(pillowL);

            const pillowR = new THREE.Mesh(pillowGeo, pillowMat);
            pillowR.scale.set(1.6, 0.5, 1.0);
            pillowR.position.set(0.2, 0.47, -0.32);
            pillowR.rotation.x = -0.15;
            furnGroup.add(pillowR);

            // 7. Headboard
            const hbGeo = new THREE.BoxGeometry(0.95, 0.65, 0.05);
            const headboard = new THREE.Mesh(hbGeo, woodMat);
            headboard.position.set(0, 0.425, -0.47);
            headboard.castShadow = true;
            furnGroup.add(headboard);

            // 8. Bedside Nightstands & Table Lamps (Left & Right)
            const nsGeo = new THREE.BoxGeometry(0.2, 0.32, 0.25);
            
            // Left nightstand
            const nsL = new THREE.Mesh(nsGeo, woodMat);
            nsL.position.set(-0.54, 0.16, -0.34);
            nsL.castShadow = true;
            furnGroup.add(nsL);

            const drawerLineGeo = new THREE.BoxGeometry(0.18, 0.015, 0.01);
            const dlL = new THREE.Mesh(drawerLineGeo, metalMat);
            dlL.position.set(-0.54, 0.22, -0.21);
            furnGroup.add(dlL);

            const lampBaseGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8);
            const lampBaseL = new THREE.Mesh(lampBaseGeo, metalMat);
            lampBaseL.position.set(-0.54, 0.36, -0.34);
            furnGroup.add(lampBaseL);

            const lampShadeGeo = new THREE.ConeGeometry(0.055, 0.1, 12);
            const shadeL = new THREE.Mesh(lampShadeGeo, lampGlowMat);
            shadeL.position.set(-0.54, 0.44, -0.34);
            furnGroup.add(shadeL);

            // Right nightstand
            const nsR = new THREE.Mesh(nsGeo, woodMat);
            nsR.position.set(0.54, 0.16, -0.34);
            nsR.castShadow = true;
            furnGroup.add(nsR);

            const dlR = new THREE.Mesh(drawerLineGeo, metalMat);
            dlR.position.set(0.54, 0.22, -0.21);
            furnGroup.add(dlR);

            const lampBaseR = new THREE.Mesh(lampBaseGeo, metalMat);
            lampBaseR.position.set(0.54, 0.36, -0.34);
            furnGroup.add(lampBaseR);

            const shadeR = new THREE.Mesh(lampShadeGeo, lampGlowMat);
            shadeR.position.set(0.54, 0.44, -0.34);
            furnGroup.add(shadeR);

          } else if (cell.furniture === 'sofa') {
            // 1. Chrome Legs (4 short cylinders)
            const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
            const legPositions = [
              [-0.41, 0.04, -0.22],
              [0.41, 0.04, -0.22],
              [-0.41, 0.04, 0.32],
              [0.41, 0.04, 0.32]
            ];
            legPositions.forEach(pos => {
              const leg = new THREE.Mesh(legGeo, metalMat);
              leg.position.set(pos[0], pos[1], pos[2]);
              leg.castShadow = true;
              furnGroup.add(leg);
            });

            // 2. Main sofa base frame
            const sofaBaseGeo = new THREE.BoxGeometry(0.9, 0.1, 0.65);
            const sofaBase = new THREE.Mesh(sofaBaseGeo, sofaFabricMat);
            sofaBase.position.set(0, 0.13, 0.05);
            sofaBase.castShadow = true;
            furnGroup.add(sofaBase);

            // 3. Separate cozy seat cushions (2 cushions side-by-side)
            const seatGeo = new THREE.BoxGeometry(0.33, 0.14, 0.52);
            
            const seatL = new THREE.Mesh(seatGeo, sofaFabricMat);
            seatL.position.set(-0.17, 0.22, 0.08);
            seatL.castShadow = true;
            furnGroup.add(seatL);

            const seatR = new THREE.Mesh(seatGeo, sofaFabricMat);
            seatR.position.set(0.17, 0.22, 0.08);
            seatR.castShadow = true;
            furnGroup.add(seatR);

            // 4. Separate back cushions (2 cushions side-by-side)
            const backCushionGeo = new THREE.BoxGeometry(0.33, 0.38, 0.12);
            
            const backL = new THREE.Mesh(backCushionGeo, sofaFabricMat);
            backL.position.set(-0.17, 0.44, -0.2);
            backL.castShadow = true;
            furnGroup.add(backL);

            const backR = new THREE.Mesh(backCushionGeo, sofaFabricMat);
            backR.position.set(0.17, 0.44, -0.2);
            backR.castShadow = true;
            furnGroup.add(backR);

            // Back frame support
            const backFrameGeo = new THREE.BoxGeometry(0.9, 0.45, 0.06);
            const backFrame = new THREE.Mesh(backFrameGeo, sofaFabricMat);
            backFrame.position.set(0, 0.355, -0.27);
            backFrame.castShadow = true;
            furnGroup.add(backFrame);

            // 5. Rounded Armrests (rotated horizontal cylinders)
            const armrestGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12);

            const armrestL = new THREE.Mesh(armrestGeo, sofaFabricMat);
            armrestL.rotation.x = Math.PI / 2;
            armrestL.position.set(-0.41, 0.28, 0.06);
            armrestL.castShadow = true;
            furnGroup.add(armrestL);

            const armrestR = new THREE.Mesh(armrestGeo, sofaFabricMat);
            armrestR.rotation.x = Math.PI / 2;
            armrestR.position.set(0.41, 0.28, 0.06);
            armrestR.castShadow = true;
            furnGroup.add(armrestR);

            // Armrest under panel filler
            const armPanelGeo = new THREE.BoxGeometry(0.08, 0.2, 0.6);
            
            const armPanelL = new THREE.Mesh(armPanelGeo, sofaFabricMat);
            armPanelL.position.set(-0.41, 0.18, 0.06);
            furnGroup.add(armPanelL);

            const armPanelR = new THREE.Mesh(armPanelGeo, sofaFabricMat);
            armPanelR.position.set(0.41, 0.18, 0.06);
            furnGroup.add(armPanelR);

            // 6. Throw pillows in the corners (squeezed spheres, rotated)
            const throwPillowGeo = new THREE.SphereGeometry(0.09, 12, 12);

            const pillow1 = new THREE.Mesh(throwPillowGeo, fabricGoldMat);
            pillow1.scale.set(1.3, 0.6, 1.3);
            pillow1.position.set(-0.29, 0.31, -0.1);
            pillow1.rotation.set(0.2, 0.4, 0.5);
            furnGroup.add(pillow1);

            const pillow2 = new THREE.Mesh(throwPillowGeo, fabricRedMat);
            pillow2.scale.set(1.3, 0.6, 1.3);
            pillow2.position.set(0.29, 0.31, -0.1);
            pillow2.rotation.set(0.2, -0.4, -0.5);
            furnGroup.add(pillow2);

          } else if (cell.furniture === 'table') {
            // Table Top
            const topGeo = new THREE.BoxGeometry(0.85, 0.04, 0.85);
            const top = new THREE.Mesh(topGeo, woodMat);
            top.position.set(0, 0.58, 0);
            top.castShadow = true;
            furnGroup.add(top);

            // Contrast runner cloth in the center
            const runnerGeo = new THREE.BoxGeometry(0.25, 0.006, 0.86);
            const runner = new THREE.Mesh(runnerGeo, fabricRedMat);
            runner.position.set(0, 0.603, 0);
            furnGroup.add(runner);

            // Table Legs (slightly angled outwards)
            const legGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.58, 8);
            const positions = [
              [-0.36, 0.29, -0.36],
              [0.36, 0.29, -0.36],
              [-0.36, 0.29, 0.36],
              [0.36, 0.29, 0.36]
            ];
            positions.forEach(pos => {
              const leg = new THREE.Mesh(legGeo, woodMat);
              leg.position.set(pos[0], pos[1], pos[2]);
              leg.rotation.z = pos[0] > 0 ? -0.06 : 0.06;
              leg.rotation.x = pos[2] > 0 ? -0.06 : 0.06;
              leg.castShadow = true;
              furnGroup.add(leg);
            });

          } else if (cell.furniture === 'chair') {
            // Seat Base
            const seatBaseGeo = new THREE.BoxGeometry(0.38, 0.03, 0.38);
            const seatBase = new THREE.Mesh(seatBaseGeo, woodMat);
            seatBase.position.set(0, 0.38, 0);
            seatBase.castShadow = true;
            furnGroup.add(seatBase);

            // Thick fabric seat cushion
            const seatPadGeo = new THREE.BoxGeometry(0.35, 0.05, 0.35);
            const seatPad = new THREE.Mesh(seatPadGeo, fabricGreyMat);
            seatPad.position.set(0, 0.42, 0);
            furnGroup.add(seatPad);

            // Backrest wooden frame
            const backFrameGeo = new THREE.BoxGeometry(0.38, 0.38, 0.03);
            const backFrame = new THREE.Mesh(backFrameGeo, woodMat);
            backFrame.position.set(0, 0.59, -0.17);
            backFrame.castShadow = true;
            furnGroup.add(backFrame);

            // Fabric backrest cushion pad
            const backPadGeo = new THREE.BoxGeometry(0.32, 0.32, 0.03);
            const backPad = new THREE.Mesh(backPadGeo, fabricGreyMat);
            backPad.position.set(0, 0.59, -0.14);
            furnGroup.add(backPad);

            // Angled legs
            const chairLegGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.38, 6);
            const positions = [
              [-0.15, 0.19, -0.15],
              [0.15, 0.19, -0.15],
              [-0.15, 0.19, 0.15],
              [0.15, 0.19, 0.15]
            ];
            positions.forEach(pos => {
              const leg = new THREE.Mesh(chairLegGeo, woodMat);
              leg.position.set(pos[0], pos[1], pos[2]);
              leg.rotation.z = pos[0] > 0 ? -0.08 : 0.08;
              leg.rotation.x = pos[2] > 0 ? -0.08 : 0.08;
              leg.castShadow = true;
              furnGroup.add(leg);
            });

          } else if (cell.furniture === 'plant') {
            // Pot (tapered)
            const potGeo = new THREE.CylinderGeometry(0.16, 0.11, 0.3, 10);
            const pot = new THREE.Mesh(potGeo, potMat);
            pot.position.set(0, 0.15, 0);
            pot.castShadow = true;
            furnGroup.add(pot);

            // Soil
            const soilGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 10);
            const soil = new THREE.Mesh(soilGeo, new THREE.MeshStandardMaterial({ color: '#45220c', roughness: 0.9 }));
            soil.position.set(0, 0.29, 0);
            furnGroup.add(soil);

            // Main plant stem trunk
            const trunkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
            const trunk = new THREE.Mesh(trunkGeo, stemMat);
            trunk.position.set(0, 0.42, 0);
            trunk.castShadow = true;
            furnGroup.add(trunk);

            // Snake plant style branching leaves (spheres scaled as flat leafy layers, rotated)
            const leafGeo = new THREE.SphereGeometry(1, 8, 8);
            const leafPositions = [
              { x: 0, y: 0.52, z: 0, rx: 0.2, ry: 0, rz: 0.3, sx: 0.15, sy: 0.22, sz: 0.06 },
              { x: 0.08, y: 0.58, z: 0.08, rx: -0.3, ry: 1.2, rz: 0.2, sx: 0.12, sy: 0.18, sz: 0.05 },
              { x: -0.08, y: 0.62, z: -0.06, rx: 0.4, ry: -1.5, rz: -0.3, sx: 0.14, sy: 0.2, sz: 0.06 },
              { x: 0.05, y: 0.68, z: -0.08, rx: -0.2, ry: 2.5, rz: 0.4, sx: 0.1, sy: 0.16, sz: 0.04 },
              { x: -0.04, y: 0.72, z: 0.05, rx: 0.1, ry: -0.5, rz: -0.2, sx: 0.09, sy: 0.15, sz: 0.04 }
            ];

            leafPositions.forEach(lp => {
              const leaf = new THREE.Mesh(leafGeo, leavesMat);
              leaf.position.set(lp.x, lp.y, lp.z);
              leaf.rotation.set(lp.rx, lp.ry, lp.rz);
              leaf.scale.set(lp.sx, lp.sy, lp.sz);
              leaf.castShadow = true;
              furnGroup.add(leaf);
            });

          } else if (cell.furniture === 'toilet') {
            // Rounded tapered toilet bowl base
            const baseGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.38, 12);
            const base = new THREE.Mesh(baseGeo, pillowMat);
            base.position.set(0, 0.19, 0.06);
            base.scale.set(1.0, 1.0, 1.25);
            base.castShadow = true;
            furnGroup.add(base);

            // Toilet seat cover ring
            const seatGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.02, 12);
            const seat = new THREE.Mesh(seatGeo, defaultFloorMat);
            seat.position.set(0, 0.39, 0.06);
            seat.scale.set(1.0, 1.0, 1.25);
            furnGroup.add(seat);

            // Water tank at the back
            const tankGeo = new THREE.BoxGeometry(0.38, 0.45, 0.18);
            const tank = new THREE.Mesh(tankGeo, pillowMat);
            tank.position.set(0, 0.525, -0.14);
            tank.castShadow = true;
            furnGroup.add(tank);

            // Chrome flush button
            const btnGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 8);
            const btn = new THREE.Mesh(btnGeo, metalMat);
            btn.position.set(0.08, 0.755, -0.14);
            btn.rotation.x = Math.PI / 2;
            furnGroup.add(btn);

          } else if (cell.furniture === 'bath') {
            // Hollow tub constructed from 5 box walls
            const wThickness = 0.06;
            const tHeight = 0.48;

            // 1. Tub Bottom
            const bottomGeo = new THREE.BoxGeometry(0.9, wThickness, 0.9);
            const bottom = new THREE.Mesh(bottomGeo, pillowMat);
            bottom.position.set(0, wThickness / 2, 0);
            bottom.receiveShadow = true;
            furnGroup.add(bottom);

            // 2. Tub Back wall
            const backGeo = new THREE.BoxGeometry(0.9, tHeight, wThickness);
            const back = new THREE.Mesh(backGeo, pillowMat);
            back.position.set(0, tHeight / 2, -0.45 + wThickness / 2);
            back.castShadow = true;
            furnGroup.add(back);

            // 3. Tub Front wall
            const front = new THREE.Mesh(backGeo, pillowMat);
            front.position.set(0, tHeight / 2, 0.45 - wThickness / 2);
            front.castShadow = true;
            furnGroup.add(front);

            // 4. Tub Left wall
            const leftGeo = new THREE.BoxGeometry(wThickness, tHeight, 0.9 - 2 * wThickness);
            const left = new THREE.Mesh(leftGeo, pillowMat);
            left.position.set(-0.45 + wThickness / 2, tHeight / 2, 0);
            left.castShadow = true;
            furnGroup.add(left);

            // 5. Tub Right wall
            const right = new THREE.Mesh(leftGeo, pillowMat);
            right.position.set(0.45 - wThickness / 2, tHeight / 2, 0);
            right.castShadow = true;
            furnGroup.add(right);

            // 6. Translucent water plane inside, halfway down
            const waterWidth = 0.9 - 2 * wThickness - 0.01;
            const waterGeo = new THREE.BoxGeometry(waterWidth, 0.01, waterWidth);
            const water = new THREE.Mesh(waterGeo, waterMat);
            water.position.set(0, tHeight * 0.6, 0);
            furnGroup.add(water);

            // 7. Chrome drain cover
            const drainGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.005, 12);
            const drain = new THREE.Mesh(drainGeo, drainMat);
            drain.position.set(0, wThickness, 0.2);
            furnGroup.add(drain);

            // 8. Gooseneck curves faucet
            const fBaseGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8);
            const fBase = new THREE.Mesh(fBaseGeo, metalMat);
            fBase.position.set(0, tHeight + 0.05, -0.41);
            furnGroup.add(fBase);

            const fCurveGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8);
            const fCurve = new THREE.Mesh(fCurveGeo, metalMat);
            fCurve.rotation.x = Math.PI / 2;
            fCurve.position.set(0, tHeight + 0.15, -0.37);
            furnGroup.add(fCurve);

            const fSpoutGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8);
            const fSpout = new THREE.Mesh(fSpoutGeo, metalMat);
            fSpout.position.set(0, tHeight + 0.12, -0.32);
            furnGroup.add(fSpout);

          } else if (cell.furniture === 'sink') {
            // Cabinet Vanity
            const vanGeo = new THREE.BoxGeometry(0.75, 0.72, 0.5);
            const vanity = new THREE.Mesh(vanGeo, woodMat);
            vanity.position.set(0, 0.36, 0);
            vanity.castShadow = true;
            furnGroup.add(vanity);

            // Door line divider
            const divider = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.7, 0.008), new THREE.MeshStandardMaterial({ color: '#2b1b0c' }));
            divider.position.set(0, 0.36, 0.252);
            furnGroup.add(divider);

            // Door Handles (chrome cylinders)
            const handleGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8);
            
            const handleL = new THREE.Mesh(handleGeo, metalMat);
            handleL.position.set(-0.06, 0.45, 0.26);
            furnGroup.add(handleL);

            const handleR = new THREE.Mesh(handleGeo, metalMat);
            handleR.position.set(0.06, 0.45, 0.26);
            furnGroup.add(handleR);

            // White basin top
            const basinGeo = new THREE.BoxGeometry(0.77, 0.08, 0.52);
            const basin = new THREE.Mesh(basinGeo, pillowMat);
            basin.position.set(0, 0.76, 0);
            basin.castShadow = true;
            furnGroup.add(basin);

            // Inset hollow basin (contrast color inside)
            const innerGeo = new THREE.BoxGeometry(0.65, 0.01, 0.4);
            const inner = new THREE.Mesh(innerGeo, new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.1 }));
            inner.position.set(0, 0.801, 0);
            furnGroup.add(inner);

            // Chrome curved faucet
            const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8), metalMat);
            faucetBase.position.set(0, 0.86, -0.18);
            furnGroup.add(faucetBase);

            const faucetCurve = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8), metalMat);
            faucetCurve.rotation.x = Math.PI / 2;
            faucetCurve.position.set(0, 0.91, -0.14);
            furnGroup.add(faucetCurve);

          } else if (cell.furniture === 'counter') {
            // Cabinet Vanity
            const countGeo = new THREE.BoxGeometry(0.95, 0.82, 0.75);
            const cabinet = new THREE.Mesh(countGeo, woodMat);
            cabinet.position.set(0, 0.41, 0);
            cabinet.castShadow = true;
            furnGroup.add(cabinet);

            // Countertop surface
            const topGeo = new THREE.BoxGeometry(0.97, 0.04, 0.77);
            const top = new THREE.Mesh(topGeo, tileFloorMat);
            top.position.set(0, 0.84, 0);
            top.receiveShadow = true;
            furnGroup.add(top);

            // Door / drawer divider lines
            const divGeo = new THREE.BoxGeometry(0.01, 0.76, 0.01);
            const divMat = new THREE.MeshStandardMaterial({ color: '#2b1b0c', roughness: 0.9 });
            const divider = new THREE.Mesh(divGeo, divMat);
            divider.position.set(0, 0.41, 0.376);
            furnGroup.add(divider);

            const horGeo = new THREE.BoxGeometry(0.93, 0.01, 0.01);
            const horLine = new THREE.Mesh(horGeo, divMat);
            horLine.position.set(0, 0.6, 0.376);
            furnGroup.add(horLine);

            // Drawer Handles
            const handleGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8);
            
            const handleL = new THREE.Mesh(handleGeo, metalMat);
            handleL.position.set(-0.06, 0.35, 0.385);
            furnGroup.add(handleL);

            const handleR = new THREE.Mesh(handleGeo, metalMat);
            handleR.position.set(0.06, 0.35, 0.385);
            furnGroup.add(handleR);

            const handleDrawL = new THREE.Mesh(handleGeo, metalMat);
            handleDrawL.rotation.z = Math.PI / 2;
            handleDrawL.position.set(-0.23, 0.7, 0.385);
            furnGroup.add(handleDrawL);

            const handleDrawR = new THREE.Mesh(handleGeo, metalMat);
            handleDrawR.rotation.z = Math.PI / 2;
            handleDrawR.position.set(0.23, 0.7, 0.385);
            furnGroup.add(handleDrawR);

            // Inset Sink
            const basinGeo = new THREE.BoxGeometry(0.32, 0.01, 0.42);
            const basin = new THREE.Mesh(basinGeo, metalMat);
            basin.position.set(-0.22, 0.861, 0);
            furnGroup.add(basin);

            const innerGeo = new THREE.BoxGeometry(0.26, 0.005, 0.36);
            const inner = new THREE.Mesh(innerGeo, new THREE.MeshStandardMaterial({ color: '#4b5563', roughness: 0.3 }));
            inner.position.set(-0.22, 0.864, 0);
            furnGroup.add(inner);

            // Faucet
            const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8), metalMat);
            faucetBase.position.set(-0.22, 0.92, -0.2);
            furnGroup.add(faucetBase);

            const faucetSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8), metalMat);
            faucetSpout.rotation.x = Math.PI / 2;
            faucetSpout.position.set(-0.22, 0.98, -0.13);
            furnGroup.add(faucetSpout);

            // Stove burners
            const burnerGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.005, 8);
            const burnerMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 });

            const b1 = new THREE.Mesh(burnerGeo, burnerMat);
            b1.position.set(0.22, 0.865, -0.1);
            furnGroup.add(b1);

            const b2 = new THREE.Mesh(burnerGeo, burnerMat);
            b2.position.set(0.22, 0.865, 0.12);
            furnGroup.add(b2);

            // Knobs
            const knobGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 6);
            for (let i = 0; i < 2; i++) {
              const knob = new THREE.Mesh(knobGeo, metalMat);
              knob.rotation.x = Math.PI / 2;
              knob.position.set(0.15 + i * 0.12, 0.81, 0.38);
              furnGroup.add(knob);
            }
          }

          group.add(furnGroup);
        }
      }
    }
  };

  // ── Mouse Painting and Eraser Handlers ──
  const handleCellInteraction = (rowIndex: number, colIndex: number) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      const cell = newGrid[rowIndex][colIndex];

      if (activeTool === 'eraser') {
        cell.type = 'empty';
        cell.furniture = null;
      } else if (activeTool === 'wall') {
        cell.type = 'wall';
        cell.furniture = null; // Clear furniture on wall
      } else if (activeTool === 'window') {
        cell.type = 'window';
        cell.furniture = null;
      } else if (activeTool === 'door') {
        cell.type = 'door';
        cell.furniture = null;
      } else if (activeTool === 'floor') {
        cell.floor = selectedFloor;
      } else if (activeTool === 'furniture') {
        if (cell.type === 'empty') { // Only place furniture on empty tiles
          cell.furniture = selectedFurniture;
          cell.rotation = furnitureRotation;
        }
      }

      return newGrid;
    });
  };

  const handleMouseDown = (rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    
    // Determine drag mode based on tool and cell state
    const cell = grid[rowIndex][colIndex];
    if (activeTool === 'eraser' || (activeTool === 'wall' && cell.type === 'wall')) {
      setDragMode('erase');
    } else {
      setDragMode('draw');
    }

    handleCellInteraction(rowIndex, colIndex);
  };

  const handleMouseEnter = (rowIndex: number, colIndex: number) => {
    if (!isDragging) return;

    if (dragMode === 'erase') {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
        newGrid[rowIndex][colIndex].type = 'empty';
        newGrid[rowIndex][colIndex].furniture = null;
        return newGrid;
      });
    } else {
      handleCellInteraction(rowIndex, colIndex);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const clearGrid = () => {
    if (!confirm('Are you sure you want to clear the entire floor plan?')) return;
    setGrid(
      Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          type: 'empty',
          floor: 'default',
          furniture: null,
          rotation: 0
        }))
      )
    );
  };

  // ── Save/Export the Three.js Scene as GLB and upload ──
  const save3DModel = async () => {
    const scene = sceneRef.current;
    const group = groupRef.current;
    if (!scene || !group) return;

    setIsSaving(true);
    try {
      // Export only the floor plan group
      const exporter = new GLTFExporter();
      exporter.parse(
        group,
        async (gltf) => {
          try {
            // gltf is an ArrayBuffer containing the binary GLB data when binary is true
            const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
            const file = new File([blob], `${unitId}.glb`, { type: 'model/gltf-binary' });

            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post(`/admin/units/${unitId}/upload-3d-model`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

            if (res.data?.success) {
              alert('3D Floor Plan saved successfully!');
              onSuccess();
              onClose();
            }
          } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to upload generated GLB model.');
          } finally {
            setIsSaving(false);
          }
        },
        (error) => {
          console.error('GLTF Export failed', error);
          alert('Failed to compile 3D model geometry.');
          setIsSaving(false);
        },
        { binary: true }
      );
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred during export.');
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 300,
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {runtimeError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#ef4444',
          color: '#ffffff',
          padding: '12px 20px',
          zIndex: 9999,
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div><strong>Runtime Error:</strong> {runtimeError}</div>
          <button onClick={() => setRuntimeError(null)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>X</button>
        </div>
      )}
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(30, 41, 59, 0.5)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔨 Interactive 3D Floor Plan Builder: Unit {unitNumber}
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
            Draw walls, place doors, windows, flooring, and drag furniture. Export directly to public 3D interactive viewer.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={clearGrid}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={14} /> Clear All
          </button>
          <button
            onClick={save3DModel}
            disabled={isSaving}
            className="btn-primary"
            style={{
              padding: '8px 20px',
              fontSize: '0.8rem',
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSaving ? (
              <>
                <div className="animate-spin" style={{ width: '12px', height: '12px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} /> Save 3D Model
              </>
            )}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#94a3b8'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side: Toolbox & Grid Canvas */}
        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(15, 23, 42, 0.6)',
          overflowY: 'auto',
          padding: '20px'
        }}>
          {/* Tool selectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Draw Tools */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                1. Structural Drawing Tools (أدوات الهيكل الإنشائي)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[
                  { id: 'wall', label: 'Wall / حائط', icon: PenTool, color: '#6b7280' },
                  { id: 'window', label: 'Window / شباك', icon: Layers, color: '#3b82f6' },
                  { id: 'door', label: 'Door / باب', icon: Layers, color: '#d97706' },
                  { id: 'eraser', label: 'Erase / مسح', icon: Eraser, color: '#ef4444' }
                ].map(tool => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id as any)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '6px',
                        background: isActive ? tool.color : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid ' + (isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'),
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Icon size={16} />
                      {tool.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flooring selectors */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                2. Floor Material / الأرضيات
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[
                  { id: 'wood', label: 'Wood / خشب', color: '#c4a482' },
                  { id: 'tile', label: 'Tile / سيراميك', color: '#e5e7eb' },
                  { id: 'carpet', label: 'Carpet / موكيت', color: '#9ca3af' },
                  { id: 'balcony', label: 'Balcony / بلكونة', color: '#60a5fa' },
                  { id: 'grass', label: 'Garden / حديقة', color: '#34d399' }
                ].map(floor => {
                  const isActive = activeTool === 'floor' && selectedFloor === floor.id;
                  return (
                    <button
                      key={floor.id}
                      onClick={() => {
                        setActiveTool('floor');
                        setSelectedFloor(floor.id as FloorType);
                      }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '6px',
                        background: isActive ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid ' + (isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'),
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <div style={{ width: '16px', height: '16px', background: floor.color, borderRadius: '3px', border: '1px solid rgba(0,0,0,0.2)' }} />
                      {floor.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Furniture selectors */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  3. Place Furniture / الأثاث
                </span>
                <button
                  type="button"
                  onClick={() => setFurnitureRotation(prev => (prev + 90) % 360)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCw size={10} /> Rotate: {furnitureRotation}°
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[
                  { id: 'bed', label: 'Bed / سرير' },
                  { id: 'sofa', label: 'Sofa / كنب' },
                  { id: 'table', label: 'Table / طاولة' },
                  { id: 'chair', label: 'Chair / كرسي' },
                  { id: 'plant', label: 'Plant / زرع' },
                  { id: 'toilet', label: 'Toilet / حمام' },
                  { id: 'bath', label: 'Bath / بانيو' },
                  { id: 'sink', label: 'Sink / حوض' },
                  { id: 'counter', label: 'Counter / مطبخ' }
                ].map(furn => {
                  const isActive = activeTool === 'furniture' && selectedFurniture === furn.id;
                  return (
                    <button
                      key={furn.id}
                      onClick={() => {
                        setActiveTool('furniture');
                        setSelectedFurniture(furn.id as FurnitureType);
                      }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '6px',
                        background: isActive ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid ' + (isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'),
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '48px'
                      }}
                    >
                      {furn.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Grid Canvas */}
          <div style={{
            marginTop: '25px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={14} /> Click and drag to draw walls or erase. Furniture can only be placed on empty tiles.
            </span>

            {/* Drawing Board grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gap: '2px',
              padding: '6px',
              background: '#1e293b',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              userSelect: 'none'
            }}>
              {grid.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  // Render color helper based on type/floor/furniture
                  let cellBg = '#334155'; // empty default
                  let cellBorder = '1px solid rgba(255,255,255,0.05)';

                  // Apply floor type colors
                  if (cell.floor === 'wood') cellBg = '#7c2d12';
                  else if (cell.floor === 'tile') cellBg = '#64748b';
                  else if (cell.floor === 'carpet') cellBg = '#475569';
                  else if (cell.floor === 'balcony') cellBg = '#1d4ed8';
                  else if (cell.floor === 'grass') cellBg = '#065f46';

                  // Apply structure types on top
                  if (cell.type === 'wall') {
                    cellBg = '#f3f4f6';
                    cellBorder = '1px solid #d1d5db';
                  } else if (cell.type === 'window') {
                    cellBg = '#67e8f9';
                    cellBorder = '1px solid #0891b2';
                  } else if (cell.type === 'door') {
                    cellBg = '#f59e0b';
                    cellBorder = '1px solid #b45309';
                  }

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      onMouseDown={(e) => handleMouseDown(rIdx, cIdx, e)}
                      onMouseEnter={() => handleMouseEnter(rIdx, cIdx)}
                      style={{
                        width: '24px',
                        height: '24px',
                        background: cellBg,
                        border: cellBorder,
                        borderRadius: '3px',
                        cursor: 'crosshair',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.55rem',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        position: 'relative'
                      }}
                    >
                      {/* Draw furniture label abbreviated */}
                      {cell.furniture && (
                        <div style={{
                          position: 'absolute',
                          inset: '1px',
                          background: 'rgba(0,0,0,0.5)',
                          borderRadius: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.45rem',
                          textTransform: 'uppercase'
                        }}>
                          {cell.furniture.substring(0, 2)}
                          {cell.rotation > 0 && <span style={{ fontSize: '0.35rem', color: '#fbbf24', marginLeft: '1px' }}>{cell.rotation}°</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Color Legend Map */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.68rem', justifyContent: 'center', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '2px' }} />
                <span>Wall</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#67e8f9', border: '1px solid #0891b2', borderRadius: '2px' }} />
                <span>Window</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#f59e0b', border: '1px solid #b45309', borderRadius: '2px' }} />
                <span>Door</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#7c2d12', borderRadius: '2px' }} />
                <span>Wood</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#64748b', borderRadius: '2px' }} />
                <span>Tile</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#1d4ed8', borderRadius: '2px' }} />
                <span>Balcony</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', background: '#065f46', borderRadius: '2px' }} />
                <span>Garden</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Interactive 3D Preview */}
        <div style={{ width: '50%', height: '100%', position: 'relative', background: '#111827' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
          
          {/* Legend / Overlay */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px',
            borderRadius: '6px',
            pointerEvents: 'none',
            fontSize: '0.7rem'
          }}>
            <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>Live 3D Preview:</strong>
            <span style={{ display: 'block', color: '#cbd5e1' }}>• Left click + drag to rotate camera</span>
            <span style={{ display: 'block', color: '#cbd5e1' }}>• Scroll wheel to zoom in/out</span>
            <span style={{ display: 'block', color: '#cbd5e1' }}>• Right click + drag to pan view</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanEditor;
