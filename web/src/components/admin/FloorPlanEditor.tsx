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
    if (!mountRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f3f4f6');
    sceneRef.current = scene;

    // Create camera (initially with default aspect ratio, updated by ResizeObserver)
    const initialWidth = mountRef.current.clientWidth || 300;
    const initialHeight = mountRef.current.clientHeight || 300;
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
    mountRef.current.appendChild(renderer.domElement);
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
      if (!mountRef.current) return;
      for (const entry of entries) {
        const w = entry.contentRect.width || mountRef.current.clientWidth;
        const h = entry.contentRect.height || mountRef.current.clientHeight;
        if (w === 0 || h === 0) continue;

        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(mountRef.current);

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
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
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
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

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
    const metalMat = new THREE.MeshStandardMaterial({ color: '#9ca3af', metalness: 0.8, roughness: 0.2 });
    const bedFabricMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.8 });
    const sofaFabricMat = new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.8 });
    const pillowMat = new THREE.MeshStandardMaterial({ color: '#f9fafb', roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: '#059669', roughness: 0.9 });
    const potMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.8 });

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
            // Bed Frame
            const frameGeo = new THREE.BoxGeometry(0.9, 0.3, 0.95);
            const frame = new THREE.Mesh(frameGeo, woodMat);
            frame.position.set(0, 0.15, 0);
            frame.castShadow = true;
            furnGroup.add(frame);

            // Mattress
            const matGeo = new THREE.BoxGeometry(0.85, 0.25, 0.9);
            const mattress = new THREE.Mesh(matGeo, pillowMat);
            mattress.position.set(0, 0.3, -0.02);
            mattress.castShadow = true;
            furnGroup.add(mattress);

            // Blanket/Sheets
            const blanketGeo = new THREE.BoxGeometry(0.86, 0.26, 0.6);
            const blanket = new THREE.Mesh(blanketGeo, bedFabricMat);
            blanket.position.set(0, 0.31, 0.15);
            blanket.castShadow = true;
            furnGroup.add(blanket);

            // Pillow
            const pillowGeo = new THREE.BoxGeometry(0.7, 0.1, 0.2);
            const pillow = new THREE.Mesh(pillowGeo, pillowMat);
            pillow.position.set(0, 0.45, -0.3);
            furnGroup.add(pillow);

            // Headboard
            const hbGeo = new THREE.BoxGeometry(0.9, 0.7, 0.05);
            const headboard = new THREE.Mesh(hbGeo, woodMat);
            headboard.position.set(0, 0.35, -0.47);
            furnGroup.add(headboard);

          } else if (cell.furniture === 'sofa') {
            // Base Cushion
            const baseGeo = new THREE.BoxGeometry(0.9, 0.25, 0.65);
            const base = new THREE.Mesh(baseGeo, sofaFabricMat);
            base.position.set(0, 0.125, 0.05);
            base.castShadow = true;
            furnGroup.add(base);

            // Backrest
            const backGeo = new THREE.BoxGeometry(0.9, 0.5, 0.15);
            const back = new THREE.Mesh(backGeo, sofaFabricMat);
            back.position.set(0, 0.4, -0.22);
            back.castShadow = true;
            furnGroup.add(back);

            // Left Arm
            const armLGeo = new THREE.BoxGeometry(0.12, 0.4, 0.65);
            const armL = new THREE.Mesh(armLGeo, sofaFabricMat);
            armL.position.set(-0.4, 0.3, 0.05);
            furnGroup.add(armL);

            // Right Arm
            const armRGeo = new THREE.BoxGeometry(0.12, 0.4, 0.65);
            const armR = new THREE.Mesh(armRGeo, sofaFabricMat);
            armR.position.set(0.4, 0.3, 0.05);
            furnGroup.add(armR);

          } else if (cell.furniture === 'table') {
            // Table Top
            const topGeo = new THREE.BoxGeometry(0.85, 0.05, 0.85);
            const top = new THREE.Mesh(topGeo, woodMat);
            top.position.set(0, 0.6, 0);
            top.castShadow = true;
            furnGroup.add(top);

            // Legs
            const legGeo = new THREE.BoxGeometry(0.06, 0.6, 0.06);
            const positions = [
              [-0.38, 0.3, -0.38],
              [0.38, 0.3, -0.38],
              [-0.38, 0.3, 0.38],
              [0.38, 0.3, 0.38]
            ];
            positions.forEach(pos => {
              const leg = new THREE.Mesh(legGeo, woodMat);
              leg.position.set(pos[0], pos[1], pos[2]);
              furnGroup.add(leg);
            });

          } else if (cell.furniture === 'chair') {
            // Seat
            const seatGeo = new THREE.BoxGeometry(0.4, 0.04, 0.4);
            const seat = new THREE.Mesh(seatGeo, woodMat);
            seat.position.set(0, 0.4, 0);
            seat.castShadow = true;
            furnGroup.add(seat);

            // Backrest
            const backGeo = new THREE.BoxGeometry(0.4, 0.4, 0.04);
            const back = new THREE.Mesh(backGeo, woodMat);
            back.position.set(0, 0.6, -0.18);
            back.castShadow = true;
            furnGroup.add(back);

            // Legs
            const legGeo = new THREE.BoxGeometry(0.04, 0.4, 0.04);
            const positions = [
              [-0.17, 0.2, -0.17],
              [0.17, 0.2, -0.17],
              [-0.17, 0.2, 0.17],
              [0.17, 0.2, 0.17]
            ];
            positions.forEach(pos => {
              const leg = new THREE.Mesh(legGeo, woodMat);
              leg.position.set(pos[0], pos[1], pos[2]);
              furnGroup.add(leg);
            });

          } else if (cell.furniture === 'plant') {
            // Pot
            const potGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.35, 8);
            const pot = new THREE.Mesh(potGeo, potMat);
            pot.position.set(0, 0.175, 0);
            pot.castShadow = true;
            furnGroup.add(pot);

            // Soil
            const soilGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 8);
            const soil = new THREE.Mesh(soilGeo, new THREE.MeshStandardMaterial({ color: '#45220c' }));
            soil.position.set(0, 0.33, 0);
            furnGroup.add(soil);

            // Stem & Foliage
            const leavesGeo1 = new THREE.SphereGeometry(0.22, 8, 8);
            const leafGroup1 = new THREE.Mesh(leavesGeo1, leavesMat);
            leafGroup1.position.set(0, 0.5, 0);
            leafGroup1.castShadow = true;
            furnGroup.add(leafGroup1);

            const leavesGeo2 = new THREE.SphereGeometry(0.18, 8, 8);
            const leafGroup2 = new THREE.Mesh(leavesGeo2, leavesMat);
            leafGroup2.position.set(0.08, 0.65, -0.05);
            leafGroup2.castShadow = true;
            furnGroup.add(leafGroup2);

          } else if (cell.furniture === 'toilet') {
            // Toilet bowl Base
            const baseGeo = new THREE.BoxGeometry(0.35, 0.4, 0.5);
            const base = new THREE.Mesh(baseGeo, pillowMat);
            base.position.set(0, 0.2, 0.05);
            base.castShadow = true;
            furnGroup.add(base);

            // Lid / seat cover
            const seatGeo = new THREE.BoxGeometry(0.36, 0.02, 0.45);
            const seat = new THREE.Mesh(seatGeo, defaultFloorMat);
            seat.position.set(0, 0.41, 0.08);
            furnGroup.add(seat);

            // Tank
            const tankGeo = new THREE.BoxGeometry(0.42, 0.45, 0.2);
            const tank = new THREE.Mesh(tankGeo, pillowMat);
            tank.position.set(0, 0.55, -0.15);
            tank.castShadow = true;
            furnGroup.add(tank);

            // Flush Button
            const btnGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8);
            const btn = new THREE.Mesh(btnGeo, metalMat);
            btn.position.set(0.1, 0.78, -0.15);
            btn.rotation.x = Math.PI / 2;
            furnGroup.add(btn);

          } else if (cell.furniture === 'bath') {
            // Tub main box
            const tubGeo = new THREE.BoxGeometry(0.9, 0.48, 0.9);
            const tub = new THREE.Mesh(tubGeo, pillowMat);
            tub.position.set(0, 0.24, 0);
            tub.castShadow = true;
            furnGroup.add(tub);

            // Water plane (translucent)
            const waterGeo = new THREE.BoxGeometry(0.8, 0.01, 0.8);
            const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: '#38bdf8', transparent: true, opacity: 0.6, roughness: 0.1 }));
            water.position.set(0, 0.42, 0);
            furnGroup.add(water);

            // Faucet
            const faucetGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
            const faucet = new THREE.Mesh(faucetGeo, metalMat);
            faucet.position.set(0, 0.54, -0.4);
            furnGroup.add(faucet);

          } else if (cell.furniture === 'sink') {
            // Cabinet Vanity
            const vanGeo = new THREE.BoxGeometry(0.75, 0.75, 0.5);
            const vanity = new THREE.Mesh(vanGeo, woodMat);
            vanity.position.set(0, 0.375, 0);
            vanity.castShadow = true;
            furnGroup.add(vanity);

            // Ceramic basin top
            const basinGeo = new THREE.BoxGeometry(0.77, 0.08, 0.52);
            const basin = new THREE.Mesh(basinGeo, pillowMat);
            basin.position.set(0, 0.79, 0);
            basin.castShadow = true;
            furnGroup.add(basin);

            // Faucet
            const faucetGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8);
            const faucet = new THREE.Mesh(faucetGeo, metalMat);
            faucet.position.set(0, 0.89, -0.15);
            furnGroup.add(faucet);

          } else if (cell.furniture === 'counter') {
            // Kitchen Counter Cabinet
            const countGeo = new THREE.BoxGeometry(0.95, 0.85, 0.75);
            const cabinet = new THREE.Mesh(countGeo, woodMat);
            cabinet.position.set(0, 0.425, 0);
            cabinet.castShadow = true;
            furnGroup.add(cabinet);

            // Top surface/countertop
            const topGeo = new THREE.BoxGeometry(0.97, 0.05, 0.77);
            const top = new THREE.Mesh(topGeo, tileFloorMat);
            top.position.set(0, 0.875, 0);
            top.receiveShadow = true;
            furnGroup.add(top);

            // Stove burners details (procedural dark circles)
            const burnerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.005, 8);
            const burnerMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 });
            
            const burner1 = new THREE.Mesh(burnerGeo, burnerMat);
            burner1.position.set(-0.2, 0.905, -0.1);
            furnGroup.add(burner1);

            const burner2 = new THREE.Mesh(burnerGeo, burnerMat);
            burner2.position.set(0.2, 0.905, 0.1);
            furnGroup.add(burner2);
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
