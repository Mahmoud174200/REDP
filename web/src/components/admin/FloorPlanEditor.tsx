import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { X, Save, Trash2, RotateCw, HelpCircle, Layers, PenTool, Eraser, CheckCircle, AlertTriangle, AlertCircle, UploadCloud } from 'lucide-react';
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

const GRID_SIZE = 28;

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

  const [layoutImageUrl, setLayoutImageUrl] = useState<string | null>(null);
  const [isUploadingLayout, setIsUploadingLayout] = useState(false);
  const [isAutodetecting, setIsAutodetecting] = useState(false);

  // Load saved floor plan grid layout from backend on mount
  useEffect(() => {
    const loadSavedGrid = async () => {
      try {
        const unitRes = await api.get(`/finance/units/${unitId}`);
        if (unitRes.data?.success && unitRes.data?.data) {
          setLayoutImageUrl(unitRes.data.data.layout_image_url);
        }
      } catch (err) {
        console.error('Failed to load unit details', err);
      }

      try {
        const res = await api.get(`/admin/units/${unitId}/3d-model/grid`);
        if (res.data?.success && res.data?.grid) {
          const loadedGrid = res.data.grid;
          if (loadedGrid.length !== GRID_SIZE) {
            // Normalize grid structure by padding or truncating to GRID_SIZE
            const newGrid = Array(GRID_SIZE).fill(null).map((_, r) =>
              Array(GRID_SIZE).fill(null).map((_, c) => {
                if (loadedGrid[r] && loadedGrid[r][c]) {
                  return loadedGrid[r][c];
                }
                return {
                  type: 'empty',
                  floor: 'default',
                  furniture: null,
                  rotation: 0
                };
              })
            );
            setGrid(newGrid);
          } else {
            setGrid(loadedGrid);
          }
        }
      } catch (err) {
        console.log('No saved floor plan grid found, starting fresh.');
      }
    };
    loadSavedGrid();
  }, [unitId]);

  // ── Editor Controls State ──
  const [activeTool, setActiveTool] = useState<'wall' | 'window' | 'door' | 'floor' | 'furniture' | 'eraser'>('wall');
  const [selectedFloor, setSelectedFloor] = useState<FloorType>('wood');
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureType>('bed');
  const [furnitureRotation, setFurnitureRotation] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<any>(null); // 'draw' or 'erase'
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ── Custom Dialog / Modal State ──
  interface DialogState {
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
    onClose?: () => void;
  }

  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showSuccess = (message: string, onClose?: () => void) => {
    setDialog({
      isOpen: true,
      type: 'success',
      title: 'Success / نجاح',
      message,
      onClose
    });
  };

  const showError = (message: string, onClose?: () => void) => {
    setDialog({
      isOpen: true,
      type: 'error',
      title: 'Error / خطأ',
      message,
      onClose
    });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmation / تأكيد',
      message,
      onConfirm
    });
  };

  // ── Render Custom Dialog ──
  const renderDialog = () => {
    if (!dialog.isOpen) return null;

    const overlayStyle: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    };

    const containerStyle: React.CSSProperties = {
      background: '#1e293b',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      width: '90%',
      maxWidth: '420px',
      padding: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    };

    const headerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    };

    const titleStyle: React.CSSProperties = {
      fontSize: '1.2rem',
      fontWeight: 700,
      margin: 0,
    };

    const messageStyle: React.CSSProperties = {
      fontSize: '0.9rem',
      color: '#cbd5e1',
      lineHeight: '1.5',
      margin: 0,
      whiteSpace: 'pre-line'
    };

    const actionsStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '8px',
    };

    const btnBaseStyle: React.CSSProperties = {
      padding: '8px 18px',
      borderRadius: '8px',
      fontSize: '0.82rem',
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none',
      transition: 'background-color 0.2s',
    };

    const btnConfirmStyle: React.CSSProperties = {
      ...btnBaseStyle,
      background: dialog.type === 'confirm' ? '#ef4444' : (dialog.type === 'success' ? '#10b981' : '#ef4444'),
      color: '#ffffff',
    };

    const btnCancelStyle: React.CSSProperties = {
      ...btnBaseStyle,
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#cbd5e1',
    };

    return (
      <div style={overlayStyle}>
        <div style={containerStyle}>
          <div style={headerStyle}>
            {dialog.type === 'success' && <CheckCircle size={22} color="#10b981" />}
            {dialog.type === 'error' && <AlertCircle size={22} color="#ef4444" />}
            {dialog.type === 'confirm' && <AlertTriangle size={22} color="#f59e0b" />}
            <h3 style={titleStyle}>{dialog.title}</h3>
          </div>
          <p style={messageStyle}>{dialog.message}</p>
          <div style={actionsStyle}>
            {dialog.type === 'confirm' ? (
              <>
                <button
                  style={btnCancelStyle}
                  onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                >
                  Cancel / إلغاء
                </button>
                <button
                  style={btnConfirmStyle}
                  onClick={() => {
                    setDialog(prev => ({ ...prev, isOpen: false }));
                    if (dialog.onConfirm) dialog.onConfirm();
                  }}
                >
                  Confirm / تأكيد
                </button>
              </>
            ) : (
              <button
                style={btnConfirmStyle}
                onClick={() => {
                  setDialog(prev => ({ ...prev, isOpen: false }));
                  if (dialog.onClose) dialog.onClose();
                }}
              >
                OK / موافق
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

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
    const cellHeight = 1.8; // height of walls
    const wallThickness = 0.15;
    const offset = (GRID_SIZE * cellWidth) / 2;

    // Common Materials
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#f3f4f6',
      roughness: 0.6,
      transparent: true,
      opacity: 0.45,
      depthWrite: true
    });
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
          // Bottom wall segment (height 0.5)
          const bottomGeo = new THREE.BoxGeometry(cellWidth, 0.5, cellWidth);
          const bottomMesh = new THREE.Mesh(bottomGeo, wallMat);
          bottomMesh.position.set(posX, 0.25, posZ);
          bottomMesh.castShadow = true;
          bottomMesh.receiveShadow = true;
          group.add(bottomMesh);

          // Top wall segment (height 0.3)
          const topGeo = new THREE.BoxGeometry(cellWidth, 0.3, cellWidth);
          const topMesh = new THREE.Mesh(topGeo, wallMat);
          topMesh.position.set(posX, cellHeight - 0.15, posZ);
          topMesh.castShadow = true;
          topMesh.receiveShadow = true;
          group.add(topMesh);

          // Glass Pane (height 1.0)
          const glassGeo = new THREE.BoxGeometry(cellWidth - 0.05, 1.0, 0.1);
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          glassMesh.position.set(posX, 1.0, posZ);
          group.add(glassMesh);
        } else if (cell.type === 'door') {
          // Top lintel segment (height 0.4)
          const lintelGeo = new THREE.BoxGeometry(cellWidth, 0.4, cellWidth);
          const lintelMesh = new THREE.Mesh(lintelGeo, wallMat);
          lintelMesh.position.set(posX, cellHeight - 0.2, posZ);
          lintelMesh.castShadow = true;
          lintelMesh.receiveShadow = true;
          group.add(lintelMesh);

          // Side door frames (height 1.4)
          const frameLeftGeo = new THREE.BoxGeometry(0.1, 1.4, 0.1);
          const frameLeft = new THREE.Mesh(frameLeftGeo, woodMat);
          frameLeft.position.set(posX - cellWidth / 2 + 0.05, 0.7, posZ);
          group.add(frameLeft);

          const frameRightGeo = new THREE.BoxGeometry(0.1, 1.4, 0.1);
          const frameRight = new THREE.Mesh(frameRightGeo, woodMat);
          frameRight.position.set(posX + cellWidth / 2 - 0.05, 0.7, posZ);
          group.add(frameRight);
        }

        // 3. Draw Furniture
        if (cell.furniture) {
          const furnGroup = new THREE.Group();
          furnGroup.position.set(posX, 0, posZ);
          furnGroup.rotation.y = (cell.rotation * Math.PI) / 180;
          furnGroup.scale.set(1.25, 1.25, 1.25); // Scale up furniture by 25% to make them prominent and highly visible!

          if (cell.furniture === 'bed') {
            // 1. Sleek low base box (under-support)
            const baseBoxGeo = new THREE.BoxGeometry(0.46, 0.08, 0.75);
            const baseBox = new THREE.Mesh(baseBoxGeo, woodMat);
            baseBox.position.set(0, 0.04, 0);
            baseBox.castShadow = true;
            furnGroup.add(baseBox);

            // 2. LED Under-Glow Strip
            const ledGeo = new THREE.BoxGeometry(0.48, 0.02, 0.77);
            const ledMesh = new THREE.Mesh(ledGeo, lampGlowMat);
            ledMesh.position.set(0, 0.01, 0);
            furnGroup.add(ledMesh);

            // 3. Floating Platform Bed Frame
            const frameGeo = new THREE.BoxGeometry(0.6, 0.14, 0.88);
            const frame = new THREE.Mesh(frameGeo, woodMat);
            frame.position.set(0, 0.15, 0);
            frame.castShadow = true;
            furnGroup.add(frame);

            // 4. Mattress (comfort layer)
            const matGeo = new THREE.BoxGeometry(0.54, 0.22, 0.84);
            const mattress = new THREE.Mesh(matGeo, pillowMat);
            mattress.position.set(0, 0.29, -0.01);
            mattress.castShadow = true;
            furnGroup.add(mattress);

            // 5. Main Blanket / Duvet
            const blanketGeo = new THREE.BoxGeometry(0.55, 0.23, 0.58);
            const blanket = new THREE.Mesh(blanketGeo, bedFabricMat);
            blanket.position.set(0, 0.3, 0.12);
            blanket.castShadow = true;
            furnGroup.add(blanket);

            // 6. Folded top sheet (hotel detail)
            const foldGeo = new THREE.BoxGeometry(0.55, 0.235, 0.12);
            const fold = new THREE.Mesh(foldGeo, pillowMat);
            fold.position.set(0, 0.302, -0.15);
            furnGroup.add(fold);

            // 7. Duvet accent throw runner (luxury gold strip)
            const runnerGeo = new THREE.BoxGeometry(0.56, 0.24, 0.14);
            const runner = new THREE.Mesh(runnerGeo, fabricGoldMat);
            runner.position.set(0, 0.31, 0.28);
            runner.castShadow = true;
            furnGroup.add(runner);

            // 8. Draped blanket hanging off the foot of the bed
            const drapeGeo = new THREE.BoxGeometry(0.56, 0.18, 0.08);
            const drape = new THREE.Mesh(drapeGeo, fabricRedMat);
            drape.position.set(0, 0.22, 0.39);
            furnGroup.add(drape);

            // 9. Pillows (4 Pillows: 2 sleeping + 2 decorative red accent pillows)
            const pillowGeo = new THREE.SphereGeometry(0.08, 16, 16);
            
            // White sleeping pillows
            const pillowL = new THREE.Mesh(pillowGeo, pillowMat);
            pillowL.scale.set(1.2, 0.5, 0.9);
            pillowL.position.set(-0.14, 0.42, -0.28);
            pillowL.rotation.x = -0.15;
            furnGroup.add(pillowL);

            const pillowR = new THREE.Mesh(pillowGeo, pillowMat);
            pillowR.scale.set(1.2, 0.5, 0.9);
            pillowR.position.set(0.14, 0.42, -0.28);
            pillowR.rotation.x = -0.15;
            furnGroup.add(pillowR);

            // Red decorative pillows in front
            const pillowDecoL = new THREE.Mesh(pillowGeo, fabricRedMat);
            pillowDecoL.scale.set(1.0, 0.4, 0.9);
            pillowDecoL.position.set(-0.14, 0.44, -0.18);
            pillowDecoL.rotation.set(-0.2, 0.1, 0.15);
            furnGroup.add(pillowDecoL);

            const pillowDecoR = new THREE.Mesh(pillowGeo, fabricRedMat);
            pillowDecoR.scale.set(1.0, 0.4, 0.9);
            pillowDecoR.position.set(0.14, 0.44, -0.18);
            pillowDecoR.rotation.set(-0.2, -0.1, -0.15);
            furnGroup.add(pillowDecoR);

            // 10. Luxurious Channel-Tufted Velvet Headboard
            const hbFrameGeo = new THREE.BoxGeometry(0.84, 0.7, 0.06);
            const headboard = new THREE.Mesh(hbFrameGeo, woodMat);
            headboard.position.set(0, 0.45, -0.45);
            headboard.castShadow = true;
            furnGroup.add(headboard);

            const segmentWidth = 0.74 / 6;
            const colGeo = new THREE.CylinderGeometry(segmentWidth / 2, segmentWidth / 2, 0.58, 8);
            for (let i = 0; i < 6; i++) {
              const col = new THREE.Mesh(colGeo, fabricGoldMat);
              col.position.set(-0.31 + i * segmentWidth + segmentWidth / 2, 0.49, -0.41);
              col.castShadow = true;
              furnGroup.add(col);
            }

            // 11. Floating Bedside Nightstands & Cylinder Table Lamps
            const nsGeo = new THREE.BoxGeometry(0.12, 0.14, 0.22);
            
            // Left floating nightstand
            const nsL = new THREE.Mesh(nsGeo, woodMat);
            nsL.position.set(-0.38, 0.24, -0.32);
            nsL.castShadow = true;
            furnGroup.add(nsL);

            const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.06), metalMat);
            handleL.position.set(-0.38, 0.24, -0.205);
            furnGroup.add(handleL);

            const lampBaseGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8);
            const lampBaseL = new THREE.Mesh(lampBaseGeo, metalMat);
            lampBaseL.position.set(-0.38, 0.35, -0.32);
            furnGroup.add(lampBaseL);

            const lampShadeGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.09, 12, 1, true);
            const shadeL = new THREE.Mesh(lampShadeGeo, lampGlowMat);
            shadeL.position.set(-0.38, 0.43, -0.32);
            furnGroup.add(shadeL);

            // Left table cup accessory
            const cupGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8);
            const cup = new THREE.Mesh(cupGeo, pillowMat);
            cup.position.set(-0.38, 0.325, -0.24);
            furnGroup.add(cup);

            // Right floating nightstand
            const nsR = new THREE.Mesh(nsGeo, woodMat);
            nsR.position.set(0.38, 0.24, -0.32);
            nsR.castShadow = true;
            furnGroup.add(nsR);

            const handleR = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.06), metalMat);
            handleR.position.set(0.38, 0.24, -0.205);
            furnGroup.add(handleR);

            const lampBaseR = new THREE.Mesh(lampBaseGeo, metalMat);
            lampBaseR.position.set(0.38, 0.35, -0.32);
            furnGroup.add(lampBaseR);

            const shadeR = new THREE.Mesh(lampShadeGeo, lampGlowMat);
            shadeR.position.set(0.38, 0.43, -0.32);
            furnGroup.add(shadeR);

            // Right table digital clock accessory
            const clockGeo = new THREE.BoxGeometry(0.05, 0.02, 0.02);
            const clock = new THREE.Mesh(clockGeo, new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.5 }));
            clock.position.set(0.38, 0.32, -0.24);
            furnGroup.add(clock);
            const faceGeo = new THREE.BoxGeometry(0.045, 0.015, 0.002);
            const clockFace = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.8 }));
            clockFace.position.set(0.38, 0.32, -0.229);
            furnGroup.add(clockFace);

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

            // 6. Cozy thrown blanket on sofa arm
            const throwBlanketGeo = new THREE.BoxGeometry(0.12, 0.28, 0.34);
            const throwBlanket = new THREE.Mesh(throwBlanketGeo, fabricRedMat);
            throwBlanket.position.set(-0.408, 0.24, 0.2);
            throwBlanket.rotation.z = 0.08;
            furnGroup.add(throwBlanket);

            // 7. Throw pillows in the corners (squeezed spheres, rotated)
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

            // 8. Modern coffee table in front of the sofa
            const coffeeTableGeo = new THREE.BoxGeometry(0.55, 0.14, 0.35);
            const coffeeTable = new THREE.Mesh(coffeeTableGeo, woodMat);
            coffeeTable.position.set(0, 0.07, 0.52);
            coffeeTable.castShadow = true;
            furnGroup.add(coffeeTable);
            
            const ctTray = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 0.18), metalMat);
            ctTray.position.set(-0.06, 0.145, 0.52);
            furnGroup.add(ctTray);
            
            const ctBook = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.08), fabricGoldMat);
            ctBook.position.set(0.1, 0.148, 0.52);
            ctBook.rotation.y = -0.15;
            furnGroup.add(ctBook);

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
            // Wall-Hung Floating Smart Toilet
            const bowlGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.32, 16);
            const toiletBowl = new THREE.Mesh(bowlGeo, pillowMat);
            toiletBowl.position.set(0, 0.3, 0.05); // Elevated, floating effect
            toiletBowl.scale.set(1.0, 1.0, 1.28);
            toiletBowl.castShadow = true;
            furnGroup.add(toiletBowl);

            // LED Nightlight glow under the toilet bowl (cool blue)
            const toiletGlowGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16);
            const toiletGlow = new THREE.Mesh(toiletGlowGeo, new THREE.MeshStandardMaterial({
              color: '#0ea5e9',
              emissive: '#0ea5e9',
              emissiveIntensity: 0.9,
              transparent: true,
              opacity: 0.8
            }));
            toiletGlow.position.set(0, 0.13, 0.05);
            toiletGlow.scale.set(1.0, 1.0, 1.28);
            furnGroup.add(toiletGlow);

            // Slim seat
            const seatGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 12);
            const seat = new THREE.Mesh(seatGeo, defaultFloorMat);
            seat.position.set(0, 0.46, 0.08);
            seat.scale.set(1.0, 1.0, 1.25);
            furnGroup.add(seat);

            // Soft-close seat lid (half-open leaning back)
            const lidGeo = new THREE.BoxGeometry(0.3, 0.02, 0.4);
            const lid = new THREE.Mesh(lidGeo, defaultFloorMat);
            lid.position.set(0, 0.54, -0.06);
            lid.rotation.x = -0.3;
            lid.castShadow = true;
            furnGroup.add(lid);

            // Wall-mounted Concealed Tank Flush Plate
            const wallPlateGeo = new THREE.BoxGeometry(0.24, 0.16, 0.01);
            const wallPlate = new THREE.Mesh(wallPlateGeo, metalMat);
            wallPlate.position.set(0, 0.75, -0.19);
            furnGroup.add(wallPlate);

            // Chrome dual-flush buttons
            const btn1 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.005, 8), defaultFloorMat);
            btn1.position.set(-0.03, 0.75, -0.182);
            btn1.rotation.x = Math.PI / 2;
            furnGroup.add(btn1);
            const btn2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.005, 8), defaultFloorMat);
            btn2.position.set(0.03, 0.75, -0.182);
            btn2.rotation.x = Math.PI / 2;
            furnGroup.add(btn2);

            // Designer metal toilet paper stand next to the toilet
            const baseStand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.01, 12), metalMat);
            baseStand.position.set(-0.28, 0.005, 0.15);
            furnGroup.add(baseStand);
            const poleStand = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 8), metalMat);
            poleStand.position.set(-0.28, 0.25, 0.15);
            furnGroup.add(poleStand);
            const armStand = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), metalMat);
            armStand.position.set(-0.24, 0.5, 0.15);
            armStand.rotation.z = Math.PI / 2;
            furnGroup.add(armStand);
            
            // Active paper roll
            const activeRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 10), defaultFloorMat);
            activeRoll.position.set(-0.21, 0.5, 0.15);
            activeRoll.rotation.x = Math.PI / 2;
            furnGroup.add(activeRoll);

            // Spare paper roll on bottom of stand
            const spareRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 10), defaultFloorMat);
            spareRoll.position.set(-0.28, 0.12, 0.15);
            spareRoll.rotation.x = Math.PI / 2;
            furnGroup.add(spareRoll);

            // Chrome toilet brush holder
            const brushHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.15, 8), metalMat);
            brushHolder.position.set(0.28, 0.075, -0.05);
            furnGroup.add(brushHolder);
            const brushHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 8), metalMat);
            brushHandle.position.set(0.28, 0.22, -0.05);
            furnGroup.add(brushHandle);

          } else if (cell.furniture === 'bath') {
            // Freestanding Oval Luxury Tub
            const tubGeo = new THREE.CylinderGeometry(0.48, 0.44, 0.42, 24, 1);
            const tub = new THREE.Mesh(tubGeo, pillowMat);
            tub.scale.set(1.6, 1.0, 0.95); // oval shape
            tub.position.set(0, 0.21, 0);
            tub.castShadow = true;
            furnGroup.add(tub);

            // Oval smooth rim
            const rimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.03, 24);
            const rim = new THREE.Mesh(rimGeo, pillowMat);
            rim.scale.set(1.6, 1.0, 0.95);
            rim.position.set(0, 0.42, 0);
            furnGroup.add(rim);

            // Inner water volume
            const waterGeo = new THREE.CylinderGeometry(0.45, 0.41, 0.32, 24);
            const water = new THREE.Mesh(waterGeo, waterMat);
            water.scale.set(1.56, 1.0, 0.92);
            water.position.set(0, 0.25, 0);
            furnGroup.add(water);

            // Chrome drain cover at the bottom
            const drainGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.005, 12);
            const drain = new THREE.Mesh(drainGeo, drainMat);
            drain.position.set(0, 0.08, 0.2);
            furnGroup.add(drain);

            // Floor-Standing Gooseneck Tub Filler (tall floor tap)
            const pipeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8);
            const pipe = new THREE.Mesh(pipeGeo, metalMat);
            pipe.position.set(0, 0.3, -0.44);
            pipe.castShadow = true;
            furnGroup.add(pipe);

            const faucetCurve = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), metalMat);
            faucetCurve.rotation.x = Math.PI / 2;
            faucetCurve.position.set(0, 0.6, -0.36);
            furnGroup.add(faucetCurve);

            const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8), metalMat);
            spout.position.set(0, 0.54, -0.28);
            furnGroup.add(spout);

            // Hot/cold knobs on floor base
            const floorKnobGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 6);
            const floorHot = new THREE.Mesh(floorKnobGeo, fabricRedMat);
            floorHot.position.set(-0.06, 0.6, -0.44);
            furnGroup.add(floorHot);
            const floorCold = new THREE.Mesh(floorKnobGeo, bedFabricMat);
            floorCold.position.set(0.06, 0.6, -0.44);
            furnGroup.add(floorCold);

            // Bathtub Wooden Tray / Caddy spanning across
            const trayGeo = new THREE.BoxGeometry(1.0, 0.02, 0.14);
            const tray = new THREE.Mesh(trayGeo, woodMat);
            tray.position.set(0, 0.43, 0.05);
            tray.castShadow = true;
            furnGroup.add(tray);

            const bookGeo = new THREE.BoxGeometry(0.12, 0.02, 0.09);
            const book = new THREE.Mesh(bookGeo, fabricGoldMat);
            book.position.set(0.02, 0.45, 0.05);
            book.rotation.y = 0.12;
            furnGroup.add(book);

            // Scented candle with glowing flame on tray
            const candleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 8);
            const candle = new THREE.Mesh(candleGeo, pillowMat);
            candle.position.set(-0.16, 0.46, 0.05);
            furnGroup.add(candle);
            const flameGeo = new THREE.SphereGeometry(0.008, 6, 6);
            const flame = new THREE.Mesh(flameGeo, lampGlowMat);
            flame.scale.set(1.0, 1.8, 1.0);
            flame.position.set(-0.16, 0.495, 0.05);
            furnGroup.add(flame);
            
            // Glass of wine on tray
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.04, 6), glassMat);
            stem.position.set(0.2, 0.46, 0.05);
            furnGroup.add(stem);
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 8), glassMat);
            base.position.set(0.2, 0.44, 0.05);
            furnGroup.add(base);
            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.03, 8), glassMat);
            bowl.position.set(0.2, 0.495, 0.05);
            furnGroup.add(bowl);
            const wine = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.015, 8), fabricRedMat);
            wine.position.set(0.2, 0.485, 0.05);
            furnGroup.add(wine);

            // Spa Accents: small wooden step stool with a rolled white towel
            const stoolGeo = new THREE.BoxGeometry(0.24, 0.02, 0.24);
            const stool = new THREE.Mesh(stoolGeo, woodMat);
            stool.position.set(0.68, 0.16, 0.2);
            stool.castShadow = true;
            furnGroup.add(stool);
            const stoolLeg = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6);
            const sLegPositions = [
              [0.58, 0.08, 0.1],
              [0.78, 0.08, 0.1],
              [0.58, 0.08, 0.3],
              [0.78, 0.08, 0.3]
            ];
            sLegPositions.forEach(sp => {
              const leg = new THREE.Mesh(stoolLeg, woodMat);
              leg.position.set(sp[0], sp[1], sp[2]);
              leg.castShadow = true;
              furnGroup.add(leg);
            });

            const towelGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.18, 10);
            const rolledTowel = new THREE.Mesh(towelGeo, pillowMat);
            rolledTowel.rotation.z = Math.PI / 2;
            rolledTowel.position.set(0.68, 0.21, 0.2);
            rolledTowel.castShadow = true;
            furnGroup.add(rolledTowel);

            // Small potted plant on the other side of the tub
            const plantPot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.12, 8), potMat);
            plantPot.position.set(-0.68, 0.06, -0.2);
            furnGroup.add(plantPot);
            const plantGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const plantFoliage = new THREE.Mesh(plantGeo, leavesMat);
            plantFoliage.position.set(-0.68, 0.14, -0.2);
            plantFoliage.scale.set(1.0, 1.4, 1.0);
            furnGroup.add(plantFoliage);

          } else if (cell.furniture === 'sink') {
            // Modern Floating Wood Vanity (floats off the floor)
            const vanGeo = new THREE.BoxGeometry(0.85, 0.48, 0.48);
            const vanity = new THREE.Mesh(vanGeo, woodMat);
            vanity.position.set(0, 0.38, 0); // floats off the floor (0.14 gap below)
            vanity.castShadow = true;
            furnGroup.add(vanity);

            // Dark wood drawer panels with gold inlays
            const drawerGeo = new THREE.BoxGeometry(0.81, 0.2, 0.01);
            const drawerUpper = new THREE.Mesh(drawerGeo, new THREE.MeshStandardMaterial({ color: '#2b1b0c', roughness: 0.8 }));
            drawerUpper.position.set(0, 0.5, 0.241);
            furnGroup.add(drawerUpper);
            const drawerLower = new THREE.Mesh(drawerGeo, new THREE.MeshStandardMaterial({ color: '#2b1b0c', roughness: 0.8 }));
            drawerLower.position.set(0, 0.26, 0.241);
            furnGroup.add(drawerLower);
            
            // Sleek horizontal gold handles
            const handleGeo = new THREE.BoxGeometry(0.24, 0.015, 0.015);
            const handleU = new THREE.Mesh(handleGeo, metalMat);
            handleU.position.set(0, 0.5, 0.25);
            furnGroup.add(handleU);
            const handleL = new THREE.Mesh(handleGeo, metalMat);
            handleL.position.set(0, 0.26, 0.25);
            furnGroup.add(handleL);

            // White marble countertop slab
            const marbleTopGeo = new THREE.BoxGeometry(0.87, 0.05, 0.5);
            const marbleTop = new THREE.Mesh(marbleTopGeo, tileFloorMat); // tile mat gives white stone marble texture
            marbleTop.position.set(0, 0.645, 0);
            marbleTop.castShadow = true;
            furnGroup.add(marbleTop);

            // Round ceramic vessel bowl sink sitting on top of the marble counter
            const bowlOuterGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.1, 16);
            const bowlOuter = new THREE.Mesh(bowlOuterGeo, pillowMat);
            bowlOuter.position.set(0, 0.72, 0);
            bowlOuter.castShadow = true;
            furnGroup.add(bowlOuter);
            
            // Water layer inside vessel
            const bowlInnerGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.08, 16);
            const bowlInner = new THREE.Mesh(bowlInnerGeo, waterMat);
            bowlInner.position.set(0, 0.725, 0);
            furnGroup.add(bowlInner);

            // Tall curved chrome gooseneck faucet
            const tapGeo1 = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8);
            const tapBase = new THREE.Mesh(tapGeo1, metalMat);
            tapBase.position.set(0, 0.745, -0.16);
            furnGroup.add(tapBase);
            
            const tapGeo2 = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8);
            const tapCurve = new THREE.Mesh(tapGeo2, metalMat);
            tapCurve.rotation.x = Math.PI / 2;
            tapCurve.position.set(0, 0.82, -0.1);
            furnGroup.add(tapCurve);
            
            const tapGeo3 = new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8);
            const tapSpout = new THREE.Mesh(tapGeo3, metalMat);
            tapSpout.position.set(0, 0.805, -0.04);
            furnGroup.add(tapSpout);

            // Round Backlit smart mirror on wall
            const mirrorFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24), woodMat);
            mirrorFrame.position.set(0, 1.25, -0.22);
            mirrorFrame.rotation.x = Math.PI / 2;
            furnGroup.add(mirrorFrame);

            const mirrorFace = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.01, 24), glassMat);
            mirrorFace.position.set(0, 1.25, -0.208);
            mirrorFace.rotation.x = Math.PI / 2;
            furnGroup.add(mirrorFace);

            const mirrorGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.01, 24), lampGlowMat);
            mirrorGlow.position.set(0, 1.25, -0.23);
            mirrorGlow.rotation.x = Math.PI / 2;
            furnGroup.add(mirrorGlow);

            // Chrome hand towel ring on the left vanity side
            const ringHolder = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.01), metalMat);
            ringHolder.position.set(-0.45, 0.5, 0);
            furnGroup.add(ringHolder);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 12), metalMat);
            ring.position.set(-0.49, 0.45, 0);
            ring.rotation.y = Math.PI / 2;
            furnGroup.add(ring);
            
            // Folded white towel
            const towelGeo = new THREE.BoxGeometry(0.02, 0.16, 0.08);
            const towel = new THREE.Mesh(towelGeo, pillowMat);
            towel.position.set(-0.49, 0.37, 0);
            towel.castShadow = true;
            furnGroup.add(towel);

            // Soap dispenser & accessory tray on marble top
            const trayGeo = new THREE.BoxGeometry(0.12, 0.01, 0.22);
            const soapTray = new THREE.Mesh(trayGeo, woodMat);
            soapTray.position.set(0.26, 0.675, 0.08);
            furnGroup.add(soapTray);
            
            const dispenser = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.04), glassMat);
            dispenser.position.set(0.26, 0.72, 0.02);
            furnGroup.add(dispenser);
            const pump = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.02), metalMat);
            pump.position.set(0.26, 0.77, 0.02);
            furnGroup.add(pump);
            
            const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8), glassMat);
            jar.position.set(0.26, 0.71, 0.14);
            furnGroup.add(jar);
            const sprig = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.1, 4), leavesMat);
            sprig.position.set(0.26, 0.78, 0.14);
            sprig.rotation.z = 0.2;
            furnGroup.add(sprig);

          } else if (cell.furniture === 'counter') {
            // Cabinet Vanity
            const countGeo = new THREE.BoxGeometry(0.95, 0.82, 0.75);
            const cabinet = new THREE.Mesh(countGeo, woodMat);
            cabinet.position.set(0, 0.41, 0);
            cabinet.castShadow = true;
            furnGroup.add(cabinet);

            // Countertop surface - white quartz countertop
            const topGeo = new THREE.BoxGeometry(0.97, 0.04, 0.77);
            const top = new THREE.Mesh(topGeo, defaultFloorMat); // pure white quartz countertop
            top.position.set(0, 0.84, 0);
            top.receiveShadow = true;
            furnGroup.add(top);

            // Integrated Appliance: Built-in oven on the left side
            const ovenFrameGeo = new THREE.BoxGeometry(0.44, 0.48, 0.02);
            const ovenFrame = new THREE.Mesh(ovenFrameGeo, metalMat);
            ovenFrame.position.set(-0.2, 0.38, 0.376);
            furnGroup.add(ovenFrame);

            const ovenGlassGeo = new THREE.BoxGeometry(0.36, 0.36, 0.01);
            const ovenGlass = new THREE.Mesh(ovenGlassGeo, glassMat);
            ovenGlass.position.set(-0.2, 0.38, 0.387);
            furnGroup.add(ovenGlass);

            // Internal glowing heating light
            const ovenGlowGeo = new THREE.BoxGeometry(0.34, 0.34, 0.01);
            const ovenGlow = new THREE.Mesh(ovenGlowGeo, lampGlowMat);
            ovenGlow.position.set(-0.2, 0.38, 0.378);
            furnGroup.add(ovenGlow);

            const ovenHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), metalMat);
            ovenHandle.rotation.z = Math.PI / 2;
            ovenHandle.position.set(-0.2, 0.54, 0.395);
            furnGroup.add(ovenHandle);

            // Clean cabinet panel on the right side
            const cabGeo = new THREE.BoxGeometry(0.44, 0.48, 0.01);
            const cabR = new THREE.Mesh(cabGeo, woodMat);
            cabR.position.set(0.2, 0.38, 0.376);
            furnGroup.add(cabR);

            const cabHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), metalMat);
            cabHandle.position.set(0.36, 0.38, 0.382);
            furnGroup.add(cabHandle);

            // Inset sink basin
            const basinGeo = new THREE.BoxGeometry(0.32, 0.01, 0.42);
            const basin = new THREE.Mesh(basinGeo, metalMat);
            basin.position.set(-0.22, 0.861, 0);
            furnGroup.add(basin);

            const innerGeo = new THREE.BoxGeometry(0.26, 0.005, 0.36);
            const inner = new THREE.Mesh(innerGeo, new THREE.MeshStandardMaterial({ color: '#4b5563', roughness: 0.3 }));
            inner.position.set(-0.22, 0.864, 0);
            furnGroup.add(inner);

            // Professional pull-down coiled faucet
            const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), metalMat);
            faucetBase.position.set(-0.22, 0.94, -0.2);
            furnGroup.add(faucetBase);

            const coilGeo = new THREE.TorusGeometry(0.05, 0.01, 8, 16, Math.PI);
            const coil = new THREE.Mesh(coilGeo, metalMat);
            coil.position.set(-0.22, 1.02, -0.15);
            coil.rotation.y = Math.PI / 2;
            furnGroup.add(coil);

            const faucetSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), metalMat);
            faucetSpout.position.set(-0.22, 0.98, -0.1);
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

            // Modern Coffee Maker appliance on counter
            const coffeeMachineBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.5 }));
            coffeeMachineBase.position.set(0.24, 0.97, 0.1);
            coffeeMachineBase.castShadow = true;
            furnGroup.add(coffeeMachineBase);

            const coffeeSpout = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.04), metalMat);
            coffeeSpout.position.set(0.24, 1.02, 0.15);
            furnGroup.add(coffeeSpout);

            const coffeeCarafe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 8), glassMat);
            coffeeCarafe.position.set(0.24, 0.9, 0.15);
            furnGroup.add(coffeeCarafe);

            const carafeLid = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.01, 0.07), metalMat);
            carafeLid.position.set(0.24, 0.94, 0.15);
            furnGroup.add(carafeLid);
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
    showConfirm(
      'Are you sure you want to clear the entire floor plan?\nهل أنت متأكد من رغبتك في مسح مخطط الطابق بالكامل؟',
      () => {
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
      }
    );
  };

  const handleLayoutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setIsUploadingLayout(true);
    try {
      const res = await api.post(`/admin/units/${unitId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setLayoutImageUrl(res.data.data.image_url);
        showSuccess('Layout image uploaded successfully!\nتم رفع مخطط الشقة بنجاح!');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Upload failed.\nفشل في رفع الصورة.');
    } finally {
      setIsUploadingLayout(false);
    }
  };

  const handleAIAutodetect = async () => {
    if (!layoutImageUrl) {
      showError('Please upload a 2D layout image first.\nيرجى رفع صورة مخطط الشقة أولاً.');
      return;
    }

    showConfirm(
      'Are you sure you want to autodetect the layout? This will overwrite your current draft.\nهل أنت متأكد من رغبتك في استخدام الرسم التلقائي؟ سيؤدي هذا لمسح الرسم الحالي.',
      async () => {
        setIsAutodetecting(true);
        try {
          const res = await api.post(`/admin/units/${unitId}/autodetect-layout`);
          if (res.data?.success && res.data?.grid) {
            setGrid(res.data.grid);
            showSuccess('AI autodetected floor plan layout successfully!\nقام الذكاء الاصطناعي برسم مخطط الشقة بنجاح!');
          } else {
            showError(res.data?.message || 'AI returned no grid data.\nلم يُرجع الذكاء الاصطناعي بيانات.');
          }
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to detect layout.\nفشل الذكاء الاصطناعي في تمييز المخطط.';
          showError(msg);
        } finally {
          setIsAutodetecting(false);
        }
      }
    );
  };

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
            formData.append('grid_json', JSON.stringify(grid));

            const res = await api.post(`/admin/units/${unitId}/upload-3d-model`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

            if (res.data?.success) {
              showSuccess('3D Floor Plan saved successfully!\nتم حفظ مخطط الطابق ثلاثي الأبعاد بنجاح!', () => {
                onSuccess();
                onClose();
              });
            }
          } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to upload generated GLB model.\nفشل في رفع النموذج ثلاثي الأبعاد.');
          } finally {
            setIsSaving(false);
          }
        },
        (error) => {
          console.error('GLTF Export failed', error);
          showError('Failed to compile 3D model geometry.\nفشل في تجميع هندسة النموذج ثلاثي الأبعاد.');
          setIsSaving(false);
        },
        { binary: true }
      );
    } catch (err) {
      console.error(err);
      showError('An unexpected error occurred during export.\nحدث خطأ غير متوقع أثناء التصدير.');
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
            
            {/* AI Autocomplete & Upload Panel */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'block' }}>
                🪄 AI Floor Plan Autodetection (الرسم التلقائي بالذكاء الاصطناعي)
              </span>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                Upload a 2D floor plan layout image, then click Autodetect to have Gemini trace the walls, doors, and windows automatically onto your 28x28 grid!
              </p>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  <UploadCloud size={14} />
                  {isUploadingLayout ? 'Uploading...' : (layoutImageUrl ? 'Change Layout Image' : 'Upload 2D Layout')}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLayoutImageUpload}
                    disabled={isUploadingLayout}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAIAutodetect}
                  disabled={isAutodetecting || !layoutImageUrl}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.75rem',
                    background: layoutImageUrl ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                    color: layoutImageUrl ? '#ffffff' : '#64748b',
                    cursor: layoutImageUrl ? 'pointer' : 'not-allowed',
                    border: '1px solid ' + (layoutImageUrl ? '#8b5cf6' : 'rgba(255,255,255,0.1)'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700
                  }}
                >
                  {isAutodetecting ? (
                    <>
                      <div className="animate-spin" style={{ width: '12px', height: '12px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      Analyzing...
                    </>
                  ) : (
                    '🪄 Autodetect Layout'
                  )}
                </button>
              </div>

              {layoutImageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <img
                    src={layoutImageUrl.startsWith('http') ? layoutImageUrl : `http://127.0.0.1:8000/storage/${layoutImageUrl}`}
                    alt="2D Layout Reference"
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>✓ Layout Loaded</span>
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Ready for Gemini Autodetection</span>
                  </div>
                </div>
              )}
            </div>

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

            {/* Drawing Board grid wrapper for horizontal scrolling if needed */}
            <div style={{ maxWidth: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
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
                          width: '15px',
                          height: '15px',
                          background: cellBg,
                          border: cellBorder,
                          borderRadius: '2px',
                          cursor: 'crosshair',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.45rem',
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
                            borderRadius: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.35rem',
                            textTransform: 'uppercase'
                          }}>
                            {cell.furniture.substring(0, 2)}
                            {cell.rotation > 0 && <span style={{ fontSize: '0.25rem', color: '#fbbf24', marginLeft: '1px' }}>{cell.rotation}°</span>}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
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
      {renderDialog()}
    </div>
  );
};

export default FloorPlanEditor;
