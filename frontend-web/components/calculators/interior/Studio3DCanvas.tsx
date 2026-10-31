'use client';

/**
 * Studio3DCanvas.tsx
 * Interactive 2D/3D Room Designer & First-Person Walkthrough Studio.
 *
 * Implements full video parity (Roomform & Interior Designer reference):
 * - Top Editor Toolbar (2D CAD, 3D Orbit, Walkthrough modes, Dims, Measure, X-Ray, Ceiling toggle)
 * - Fixed cursor drag coordinates (no inverted axes, camera-aligned ground plane dragging)
 * - First-Person Walkthrough with WASD keyboard movement + mouse-look + collision boundary detection
 * - Clickable & Selectable Elements: Objects, North/South/East/West Walls, Floor Carpet Area, Ceiling
 * - Element Locking: Lock/unlock any object, wall, or floor (locked elements cannot move or resize)
 * - Real-time dimensions display for selected Wall (L × H, Area) & Floor (L × W, Carpet Area, Perimeter)
 * - Wall Openings Tool: Select area on wall to place Doors and Windows with live 3D cutouts
 * - Sub-element customization: Change colors and textures of parts inside objects (e.g., Bed Pillows, Sofa Cushions, Legs)
 * - Pre-insert dimension configurator in right catalog + edit-mode dimension sliders
 * - Real 3D GLB model loading (from backend/3D asserts via /api/interior/models) with fallback procedural meshes
 * - Ceiling mesh with lighting mounting support
 * - Live Dims annotations + Interactive 2-Click Tape Measure tool
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  StudioObject3D,
  RoomDefinition,
  RoomOpening,
  SubElementCustomization,
  MeasurementUnit,
} from '@/types/interiorStudio';
import { MARKETPLACE_OBJECTS_CATALOG } from '@/lib/interiorProjectsStore';
import {
  RotateCcw,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Box,
  Layers,
  Eye,
  Sliders,
  Sparkles,
  Search,
  Maximize2,
  Undo2,
  Redo2,
  Download,
  Share2,
  Save,
  Plus,
  Compass,
  Check,
  X,
  Camera,
  Grid,
  Sun,
  Ruler,
  Footprints,
  Smartphone,
  ChevronRight,
  Info,
  Lock,
  Unlock,
  Palette,
  DoorOpen,
  AppWindow,
  Maximize,
  Minimize,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface StudioProps {
  currentRoom: RoomDefinition;
  objects: StudioObject3D[];
  onObjectsChange: (objects: StudioObject3D[]) => void;
  onRoomChange?: (room: RoomDefinition) => void;
  onSaveDesign?: () => void;
  onExportFloorPlan?: () => void;
  onExportRender?: () => void;
}

type SelectedElementType =
  | { type: 'object'; id: string }
  | { type: 'wall'; orientation: 'north' | 'south' | 'east' | 'west' }
  | { type: 'floor' }
  | { type: 'ceiling' }
  | null;

// GLTF model cache to avoid re-fetching
const gltfCache = new Map<string, THREE.Group>();

export function Studio3DCanvas({
  currentRoom,
  objects,
  onObjectsChange,
  onRoomChange,
  onSaveDesign,
  onExportFloorPlan,
  onExportRender,
}: StudioProps) {
  // ── Editor Modes & Tools ───────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'2D' | '3D' | 'Walk'>('3D');
  const [activeTool, setActiveTool] = useState<'Orbit' | 'Pan' | 'X-Ray' | 'Dims' | 'Measure'>('Orbit');
  const [selectedTarget, setSelectedTarget] = useState<SelectedElementType>(null);

  // Settings
  const [showGrid, setShowGrid] = useState(true);
  const [showCeiling, setShowCeiling] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [smartCollisions, setSmartCollisions] = useState(true);
  const [unitMode, setUnitMode] = useState<'in' | 'ft' | 'm'>('in');
  const [lockedElements, setLockedElements] = useState<Set<string>>(new Set());

  // Walkthrough State
  const [viewHeightCm, setViewHeightCm] = useState(175); // 5' 9" eye level
  const [fieldOfView, setFieldOfView] = useState(90);

  // Tape Measure Tool State
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [measureDistanceMeters, setMeasureDistanceMeters] = useState<number | null>(null);

  // Wall Opening Modal / Tool State
  const [openingConfigOpen, setOpeningConfigOpen] = useState(false);
  const [newOpeningType, setNewOpeningType] = useState<'door' | 'window' | 'arch'>('window');
  const [newOpeningWidth, setNewOpeningWidth] = useState(4); // in ft
  const [newOpeningHeight, setNewOpeningHeight] = useState(4.5);
  const [newOpeningSill, setNewOpeningSill] = useState(3);
  const [newOpeningOffsetPct, setNewOpeningOffsetPct] = useState(50); // percentage along wall

  // Pre-insert Configuration for Marketplace items
  const [preInsertItem, setPreInsertItem] = useState<typeof MARKETPLACE_OBJECTS_CATALOG[0] | null>(null);
  const [preInsertDims, setPreInsertDims] = useState<{ width: number; height: number; depth: number }>({
    width: 60,
    height: 34,
    depth: 36,
  });

  // Right Panel State
  const [rightPanelTab, setRightPanelTab] = useState<'Marketplace' | 'MyModels' | 'Recent'>('Marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [generatingModel, setGeneratingModel] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  // AI Prompt bar
  const [aiPrompt, setAiPrompt] = useState('');
  const [bannerNotice, setBannerNotice] = useState<string>('Select any object, wall, or floor to view measurements & customize');

  // Canvas refs: dedicated Three.js canvas mount and interactive wrapper
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const threeStateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    objectMeshes: Map<string, THREE.Group>;
    roomGroup: THREE.Group;
    measureGroup: THREE.Group;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    walkCameraPos: THREE.Vector3;
    walkYaw: number;
    walkPitch: number;
    keysDown: Set<string>;
    isDragging: boolean;
    dragPlane: THREE.Plane;
    planeIntersect: THREE.Vector3;
    dragOffset: THREE.Vector3;
    selectedMesh: THREE.Group | null;
    wallMeshes: Map<string, THREE.Mesh>;
    floorMesh: THREE.Mesh | null;
    ceilingMesh: THREE.Mesh | null;
  } | null>(null);

  // Selected Object lookup
  const selectedObject = useMemo(() => {
    if (selectedTarget?.type === 'object') {
      return objects.find(o => o.id === selectedTarget.id) || null;
    }
    return null;
  }, [objects, selectedTarget]);

  // Is current selected element locked?
  const isElementLocked = useMemo(() => {
    if (!selectedTarget) return false;
    if (selectedTarget.type === 'object') {
      return !!selectedObject?.locked || lockedElements.has(selectedTarget.id);
    }
    if (selectedTarget.type === 'wall') {
      return lockedElements.has(`wall_${selectedTarget.orientation}`);
    }
    if (selectedTarget.type === 'floor') {
      return lockedElements.has('floor');
    }
    if (selectedTarget.type === 'ceiling') {
      return lockedElements.has('ceiling');
    }
    return false;
  }, [selectedTarget, selectedObject, lockedElements]);

  // Toggle lock for current selected element
  const toggleElementLock = () => {
    if (!selectedTarget) return;
    if (selectedTarget.type === 'object' && selectedObject) {
      const newLocked = !selectedObject.locked;
      onObjectsChange(
        objects.map(o => (o.id === selectedObject.id ? { ...o, locked: newLocked } : o))
      );
      setLockedElements(prev => {
        const next = new Set(prev);
        if (newLocked) next.add(selectedObject.id);
        else next.delete(selectedObject.id);
        return next;
      });
    } else {
      const key =
        selectedTarget.type === 'wall'
          ? `wall_${selectedTarget.orientation}`
          : selectedTarget.type;
      setLockedElements(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    }
  };

  // Convert room dimensions to meters (1 ft = 0.3048 m)
  const roomMeters = useMemo(() => {
    let length = currentRoom.length * 0.3048;
    let width = currentRoom.width * 0.3048;
    let height = currentRoom.height * 0.3048;
    if (currentRoom.unit === 'in') {
      length = (currentRoom.length / 12) * 0.3048;
      width = (currentRoom.width / 12) * 0.3048;
      height = (currentRoom.height / 12) * 0.3048;
    } else if (currentRoom.unit === 'm') {
      length = currentRoom.length;
      width = currentRoom.width;
      height = currentRoom.height;
    }
    return { length, width, height, halfL: length / 2, halfW: width / 2 };
  }, [currentRoom]);

  // ── Initialize Three.js WebGL Scene ────────────────────────────────
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth || canvasWrapperRef.current?.clientWidth || 800;
    const height = container.clientHeight || canvasWrapperRef.current?.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Architectural slate-50

    // 2. Camera (default 3D Perspective)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 8.5, 11);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.35);
    dirLight.position.set(9, 14, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    const d = 12;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
    fillLight.position.set(-9, 6, -6);
    scene.add(fillLight);

    // 5. Container Groups
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const measureGroup = new THREE.Group();
    scene.add(measureGroup);

    // Three State Ref
    threeStateRef.current = {
      scene,
      camera,
      renderer,
      objectMeshes: new Map(),
      roomGroup,
      measureGroup,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      walkCameraPos: new THREE.Vector3(0, viewHeightCm / 100, 2),
      walkYaw: 0,
      walkPitch: 0,
      keysDown: new Set(),
      isDragging: false,
      dragPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      planeIntersect: new THREE.Vector3(),
      dragOffset: new THREE.Vector3(),
      selectedMesh: null,
      wallMeshes: new Map(),
      floorMesh: null,
      ceilingMesh: null,
    };

    // 6. Animation loop (Persistent Walkthrough WASD movement)
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const state = threeStateRef.current;
      if (!state) return;

      const delta = clock.getDelta();

      // First-person Walkthrough movement
      if (viewMode === 'Walk') {
        const moveSpeed = 3.6 * delta;
        const forward = new THREE.Vector3(
          -Math.sin(state.walkYaw),
          0,
          -Math.cos(state.walkYaw)
        ).normalize();
        const right = new THREE.Vector3(
          Math.cos(state.walkYaw),
          0,
          -Math.sin(state.walkYaw)
        ).normalize();

        if (state.keysDown.has('KeyW') || state.keysDown.has('ArrowUp')) {
          state.walkCameraPos.addScaledVector(forward, moveSpeed);
        }
        if (state.keysDown.has('KeyS') || state.keysDown.has('ArrowDown')) {
          state.walkCameraPos.addScaledVector(forward, -moveSpeed);
        }
        if (state.keysDown.has('KeyA') || state.keysDown.has('ArrowLeft')) {
          state.walkCameraPos.addScaledVector(right, -moveSpeed);
        }
        if (state.keysDown.has('KeyD') || state.keysDown.has('ArrowRight')) {
          state.walkCameraPos.addScaledVector(right, moveSpeed);
        }

        // Keep inside room walls with 0.35m clearance
        const boundaryX = roomMeters.halfW - 0.35;
        const boundaryZ = roomMeters.halfL - 0.35;
        state.walkCameraPos.x = Math.max(-boundaryX, Math.min(boundaryX, state.walkCameraPos.x));
        state.walkCameraPos.z = Math.max(-boundaryZ, Math.min(boundaryZ, state.walkCameraPos.z));
        state.walkCameraPos.y = viewHeightCm / 100;

        state.camera.position.copy(state.walkCameraPos);
        const lookDir = new THREE.Vector3(
          -Math.sin(state.walkYaw) * Math.cos(state.walkPitch),
          Math.sin(state.walkPitch),
          -Math.cos(state.walkYaw) * Math.cos(state.walkPitch)
        );
        state.camera.lookAt(state.walkCameraPos.clone().add(lookDir));
      }

      state.renderer.render(state.scene, state.camera);
    };

    animate();

    // 7. Resize handler
    const handleResize = () => {
      if (!container || !threeStateRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const st = threeStateRef.current;
      if (st.camera instanceof THREE.PerspectiveCamera) {
        st.camera.aspect = w / h;
        st.camera.updateProjectionMatrix();
      } else if (st.camera instanceof THREE.OrthographicCamera) {
        const aspect = w / h;
        const frustumSize = 14;
        st.camera.left = (-frustumSize * aspect) / 2;
        st.camera.right = (frustumSize * aspect) / 2;
        st.camera.top = frustumSize / 2;
        st.camera.bottom = -frustumSize / 2;
        st.camera.updateProjectionMatrix();
      }
      st.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      threeStateRef.current = null;
    };
  }, [roomMeters]);

  // ── Build Room Shell (Floor, Selectable Walls, Openings, Ceiling) ────
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;

    const group = state.roomGroup;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
    }
    state.wallMeshes.clear();

    const { length, width, height, halfL, halfW } = roomMeters;
    // Cutaway wall height in 3D orbit for visibility; full height in Walk mode
    const wallH = viewMode === 'Walk' ? height : Math.min(height * 0.72, 2.5);
    const wallThick = 0.2; // 8-inch architectural wall thickness

    // 1. FLOOR PLANE (Interactive Element)
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d');
    if (fctx) {
      if (currentRoom.floorMaterial?.toLowerCase().includes('marble')) {
        fctx.fillStyle = '#f8fafc';
        fctx.fillRect(0, 0, 512, 512);
        fctx.strokeStyle = '#e2e8f0';
        fctx.lineWidth = 3;
        fctx.strokeRect(0, 0, 256, 256);
        fctx.strokeRect(256, 0, 256, 256);
        fctx.strokeRect(0, 256, 256, 256);
        fctx.strokeRect(256, 256, 256, 256);
      } else {
        // Hardwood Planks
        fctx.fillStyle = '#d4a373';
        fctx.fillRect(0, 0, 512, 512);
        fctx.fillStyle = '#bc8a5f';
        for (let i = 0; i < 512; i += 64) {
          fctx.fillRect(0, i, 512, 3);
        }
      }
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(width / 1.2, length / 1.2);

    const isFloorSelected = selectedTarget?.type === 'floor';
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.05,
      color: isFloorSelected ? 0xdbeafe : 0xffffff,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    floorMesh.name = 'element_floor';
    floorMesh.userData = { elementType: 'floor' };
    group.add(floorMesh);
    state.floorMesh = floorMesh;

    // Floor outline highlight when selected
    if (isFloorSelected) {
      const edges = new THREE.EdgesGeometry(floorGeo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 3 })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.y = 0.01;
      group.add(line);
    }

    // 2. WALL MATERIALS & HIGHLIGHTS
    const getWallMaterial = (orientation: string) => {
      const isSelected =
        selectedTarget?.type === 'wall' && selectedTarget.orientation === orientation;
      return new THREE.MeshStandardMaterial({
        color: isSelected ? 0xbfdbfe : 0xf1f5f9,
        roughness: 0.85,
        metalness: 0.0,
        opacity: activeTool === 'X-Ray' ? 0.35 : 1.0,
        transparent: activeTool === 'X-Ray',
      });
    };

    // North Wall (Back)
    const northGeo = new THREE.BoxGeometry(width + wallThick * 2, wallH, wallThick);
    const northWall = new THREE.Mesh(northGeo, getWallMaterial('north'));
    northWall.position.set(0, wallH / 2, -halfL - wallThick / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    northWall.name = 'wall_north';
    northWall.userData = { elementType: 'wall', orientation: 'north' };
    group.add(northWall);
    state.wallMeshes.set('north', northWall);

    // South Wall (Front)
    const southGeo = new THREE.BoxGeometry(width + wallThick * 2, wallH, wallThick);
    const southWall = new THREE.Mesh(southGeo, getWallMaterial('south'));
    southWall.position.set(0, wallH / 2, halfL + wallThick / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    southWall.name = 'wall_south';
    southWall.userData = { elementType: 'wall', orientation: 'south' };
    group.add(southWall);
    state.wallMeshes.set('south', southWall);

    // West Wall (Left)
    const westGeo = new THREE.BoxGeometry(wallThick, wallH, length);
    const westWall = new THREE.Mesh(westGeo, getWallMaterial('west'));
    westWall.position.set(-halfW - wallThick / 2, wallH / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    westWall.name = 'wall_west';
    westWall.userData = { elementType: 'wall', orientation: 'west' };
    group.add(westWall);
    state.wallMeshes.set('west', westWall);

    // East Wall (Right)
    const eastGeo = new THREE.BoxGeometry(wallThick, wallH, length);
    const eastWall = new THREE.Mesh(eastGeo, getWallMaterial('east'));
    eastWall.position.set(halfW + wallThick / 2, wallH / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    eastWall.name = 'wall_east';
    eastWall.userData = { elementType: 'wall', orientation: 'east' };
    group.add(eastWall);
    state.wallMeshes.set('east', eastWall);

    // 3. WALL OPENINGS (Doors, Windows, Arches)
    if (currentRoom.openings && currentRoom.openings.length > 0) {
      currentRoom.openings.forEach((op, idx) => {
        const opW = (op.width * 0.3048); // in meters
        const opH = (op.height * 0.3048);
        const opSill = ((op.sillHeight || 0) * 0.3048);
        const offsetRatio = (op.offsetPct ?? 50) / 100 - 0.5; // -0.5 to +0.5

        const frameMat = new THREE.MeshStandardMaterial({
          color: op.type === 'door' ? 0x5c3a21 : 0x1e293b,
          roughness: 0.4,
        });
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          roughness: 0.1,
          metalness: 0.1,
          transparent: true,
          opacity: 0.45,
        });

        const frameGroup = new THREE.Group();
        frameGroup.name = `opening_${op.id || idx}`;

        // Frame outer box
        const frameMesh = new THREE.Mesh(
          new THREE.BoxGeometry(opW, opH, wallThick * 1.05),
          frameMat
        );
        frameGroup.add(frameMesh);

        // Glass pane for windows
        if (op.type === 'window') {
          const glass = new THREE.Mesh(
            new THREE.BoxGeometry(opW * 0.9, opH * 0.88, 0.02),
            glassMat
          );
          frameGroup.add(glass);
        }

        // Position on respective wall
        const posY = opSill + opH / 2;
        if (op.wall === 'north') {
          frameGroup.position.set(width * offsetRatio, posY, -halfL - wallThick / 2);
        } else if (op.wall === 'south') {
          frameGroup.position.set(width * offsetRatio, posY, halfL + wallThick / 2);
        } else if (op.wall === 'west') {
          frameGroup.rotation.y = Math.PI / 2;
          frameGroup.position.set(-halfW - wallThick / 2, posY, length * offsetRatio);
        } else if (op.wall === 'east') {
          frameGroup.rotation.y = Math.PI / 2;
          frameGroup.position.set(halfW + wallThick / 2, posY, length * offsetRatio);
        }

        group.add(frameGroup);
      });
    }

    // 4. CEILING MESH (Interactive & Tilt-up Visible)
    if (showCeiling || viewMode === 'Walk') {
      const ceilGeo = new THREE.PlaneGeometry(width + wallThick * 2, length + wallThick * 2);
      const isCeilSelected = selectedTarget?.type === 'ceiling';
      const ceilMat = new THREE.MeshStandardMaterial({
        color: isCeilSelected ? 0xc7d2fe : 0xffffff,
        roughness: 0.9,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: viewMode === 'Walk' ? 1.0 : 0.75,
      });
      const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
      ceilMesh.rotation.x = Math.PI / 2;
      ceilMesh.position.y = height;
      ceilMesh.name = 'element_ceiling';
      ceilMesh.userData = { elementType: 'ceiling' };
      group.add(ceilMesh);
      state.ceilingMesh = ceilMesh;

      // Cove Lighting effect
      const coveLight = new THREE.PointLight(0xfff5e6, 0.8, Math.max(width, length) * 2);
      coveLight.position.set(0, height - 0.2, 0);
      group.add(coveLight);
    }

    // 5. ARCHITECTURAL CAD GRID
    if (showGrid && viewMode !== 'Walk') {
      const grid = new THREE.GridHelper(
        Math.max(width, length) * 1.6,
        24,
        0x6366f1,
        0x94a3b8
      );
      grid.position.y = 0.005;
      group.add(grid);
    }
  }, [currentRoom, roomMeters, viewMode, showGrid, showCeiling, activeTool, selectedTarget]);

  // ── Render 3D Objects & Meshes (GLTF Models & Procedural) ───────────
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;

    const existingMeshes = state.objectMeshes;
    const activeIds = new Set(objects.map(o => o.id));

    // Remove defunct meshes
    existingMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        state.scene.remove(mesh);
        existingMeshes.delete(id);
      }
    });

    const loader = new GLTFLoader();

    // Create or update meshes
    objects.forEach(obj => {
      let group = existingMeshes.get(obj.id);

      if (!group) {
        group = new THREE.Group();
        group.name = obj.id;
        group.userData = { elementType: 'object', objectId: obj.id };

        // Selection Bounding Box
        const bbox = new THREE.BoxHelper(new THREE.Mesh(), 0x3b82f6);
        bbox.name = 'bbox';
        bbox.visible = false;
        group.add(bbox);

        // Check if object specifies a real GLB modelUrl
        if (obj.modelUrl) {
          const cached = gltfCache.get(obj.modelUrl);
          if (cached) {
            const clone = cached.clone(true);
            applySubElementsToMesh(clone, obj);
            group.add(clone);
            bbox.setFromObject(clone);
          } else {
            // Render fast procedural placeholder while model downloads
            const placeholder = createProcedural3DMesh(obj);
            placeholder.name = 'placeholder_mesh';
            group.add(placeholder);
            bbox.setFromObject(placeholder);

            // Fetch GLB asynchronously
            loader.load(
              obj.modelUrl,
              gltf => {
                gltfCache.set(obj.modelUrl!, gltf.scene);
                const currentGrp = state.objectMeshes.get(obj.id);
                if (currentGrp) {
                  const oldMesh = currentGrp.getObjectByName('placeholder_mesh');
                  if (oldMesh) currentGrp.remove(oldMesh);

                  const modelScene = gltf.scene.clone(true);
                  // Normalize scale to fit object dimensions
                  const box = new THREE.Box3().setFromObject(modelScene);
                  const size = box.getSize(new THREE.Vector3());
                  const targetX = (obj.dimensions.width * 0.0254);
                  const targetY = (obj.dimensions.height * 0.0254);
                  const targetZ = (obj.dimensions.depth * 0.0254);

                  const scaleFactor = Math.min(
                    targetX / (size.x || 1),
                    targetY / (size.y || 1),
                    targetZ / (size.z || 1)
                  );
                  modelScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
                  modelScene.traverse(child => {
                    if ((child as THREE.Mesh).isMesh) {
                      child.castShadow = true;
                      child.receiveShadow = true;
                    }
                  });

                  applySubElementsToMesh(modelScene, obj);
                  currentGrp.add(modelScene);
                  bbox.setFromObject(modelScene);
                }
              },
              undefined,
              _err => {
                // If GLB fails to load, fallback stays active smoothly
              }
            );
          }
        } else {
          // Standard procedural mesh
          const mesh = createProcedural3DMesh(obj);
          group.add(mesh);
          bbox.setFromObject(mesh);
        }

        state.scene.add(group);
        existingMeshes.set(obj.id, group);
      } else {
        // Update sub-element colors on existing mesh
        applySubElementsToMesh(group, obj);
      }

      // Update position & rotation
      group.position.set(obj.position.x, obj.position.y, obj.position.z);
      group.rotation.set(
        THREE.MathUtils.degToRad(obj.rotation.x),
        THREE.MathUtils.degToRad(obj.rotation.y),
        THREE.MathUtils.degToRad(obj.rotation.z)
      );

      // Update selection bounding box
      const isSelected = selectedTarget?.type === 'object' && selectedTarget.id === obj.id;
      const bbox = group.getObjectByName('bbox') as THREE.BoxHelper;
      if (bbox) {
        bbox.visible = isSelected;
        // Turn locked bounding box orange/red to indicate lock status
        if (isSelected && (obj.locked || lockedElements.has(obj.id))) {
          (bbox.material as THREE.LineBasicMaterial).color.set(0xef4444);
        } else if (isSelected) {
          (bbox.material as THREE.LineBasicMaterial).color.set(0x3b82f6);
        }
      }
    });
  }, [objects, selectedTarget, lockedElements]);

  // ── Camera View Mode Switching ──────────────────────────────────────
  useEffect(() => {
    const state = threeStateRef.current;
    const container = canvasMountRef.current || canvasWrapperRef.current;
    if (!state || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    if (viewMode === '2D') {
      // Top-Down Orthographic CAD View
      const aspect = width / height;
      const frustumSize = 14;
      const ortho = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        (-frustumSize * aspect) / 2,
        0.1,
        100
      );
      // Crucial: Set up vector to (0, 0, -1) so Top is -Z and Right is +X
      ortho.up.set(0, 0, -1);
      ortho.position.set(0, 25, 0);
      ortho.lookAt(0, 0, 0);
      state.camera = ortho;
      setBannerNotice('2D Architectural CAD Floor Plan • Top-down dimensions active');
    } else if (viewMode === '3D') {
      const persp = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      persp.up.set(0, 1, 0);
      persp.position.set(0, 8.5, 11);
      persp.lookAt(0, 0, 0);
      state.camera = persp;
      setBannerNotice('3D Studio • Click any element to configure or drag to reposition');
    } else if (viewMode === 'Walk') {
      const walk = new THREE.PerspectiveCamera(fieldOfView, width / height, 0.05, 50);
      walk.up.set(0, 1, 0);
      state.walkCameraPos.set(0, viewHeightCm / 100, 2);
      state.walkYaw = 0;
      state.walkPitch = 0;
      walk.position.copy(state.walkCameraPos);
      state.camera = walk;
      setBannerNotice('First-Person Walkthrough: Use WASD / Arrows to walk • Click & drag mouse to look around');
      canvasWrapperRef.current?.focus();
    }
  }, [viewMode]);

  // ── Tape Measure Overlay Update ─────────────────────────────────────
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;
    const group = state.measureGroup;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (measurePoints.length === 1) {
      // Marker A
      const pA = measurePoints[0];
      const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const markerA = new THREE.Mesh(markerGeo, markerMat);
      markerA.position.copy(pA);
      group.add(markerA);
    } else if (measurePoints.length === 2) {
      // Line between A and B
      const [pA, pB] = measurePoints;
      const points = [pA, pB];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        dashSize: 0.15,
        gapSize: 0.08,
        linewidth: 3,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      group.add(line);

      // End markers
      const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const mA = new THREE.Mesh(markerGeo, markerMat);
      mA.position.copy(pA);
      const mB = new THREE.Mesh(markerGeo, markerMat);
      mB.position.copy(pB);
      group.add(mA, mB);
    }
  }, [measurePoints]);

  // ── Canvas Interaction Handlers ────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = threeStateRef.current;
    const container = canvasWrapperRef.current;
    if (!state || !container) return;

    container.focus();

    const rect = container.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    state.raycaster.setFromCamera(state.mouse, state.camera);

    // 1. TAPE MEASURE TOOL CLICK
    if (activeTool === 'Measure') {
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersect = new THREE.Vector3();
      if (state.raycaster.ray.intersectPlane(plane, intersect)) {
        if (measurePoints.length === 0 || measurePoints.length === 2) {
          setMeasurePoints([intersect.clone()]);
          setMeasureDistanceMeters(null);
        } else {
          const ptA = measurePoints[0];
          const dist = ptA.distanceTo(intersect);
          setMeasurePoints([ptA, intersect.clone()]);
          setMeasureDistanceMeters(dist);
        }
      }
      return;
    }

    // 2. OBJECT SELECTION & DRAGGING
    const objectMeshes = Array.from(state.objectMeshes.values());
    const objIntersects = state.raycaster.intersectObjects(objectMeshes, true);

    if (objIntersects.length > 0) {
      let hit: THREE.Object3D | null = objIntersects[0].object;
      while (hit && hit.parent && hit.parent !== state.scene) {
        if (state.objectMeshes.has(hit.name)) break;
        hit = hit.parent;
      }
      if (hit && state.objectMeshes.has(hit.name)) {
        const objId = hit.name;
        setSelectedTarget({ type: 'object', id: objId });
        state.selectedMesh = hit as THREE.Group;

        // Check if object is locked
        const targetObj = objects.find(o => o.id === objId);
        const isLocked = !!targetObj?.locked || lockedElements.has(objId);

        if (!isLocked && viewMode !== 'Walk') {
          state.isDragging = true;
          // Set drag plane at object Y elevation
          state.dragPlane.set(new THREE.Vector3(0, 1, 0), -targetObj!.position.y);
          if (state.raycaster.ray.intersectPlane(state.dragPlane, state.planeIntersect)) {
            // Drag offset prevents jumping to object center
            state.dragOffset.copy(state.planeIntersect).sub(state.selectedMesh.position);
          }
        }
        return;
      }
    }

    // 3. WALL, FLOOR, & CEILING SELECTION
    const wallMeshes = Array.from(state.wallMeshes.values());
    const wallHits = state.raycaster.intersectObjects(wallMeshes, false);
    if (wallHits.length > 0) {
      const wallOrientation = wallHits[0].object.userData.orientation as
        | 'north'
        | 'south'
        | 'east'
        | 'west';
      setSelectedTarget({ type: 'wall', orientation: wallOrientation });
      state.selectedMesh = null;
      return;
    }

    if (state.floorMesh) {
      const floorHits = state.raycaster.intersectObject(state.floorMesh, false);
      if (floorHits.length > 0) {
        setSelectedTarget({ type: 'floor' });
        state.selectedMesh = null;
        return;
      }
    }

    if (state.ceilingMesh) {
      const ceilHits = state.raycaster.intersectObject(state.ceilingMesh, false);
      if (ceilHits.length > 0) {
        setSelectedTarget({ type: 'ceiling' });
        state.selectedMesh = null;
        return;
      }
    }

    // Clicked in empty space -> Deselect
    if (viewMode !== 'Walk') {
      setSelectedTarget(null);
      state.selectedMesh = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = threeStateRef.current;
    const container = canvasWrapperRef.current;
    if (!state || !container) return;

    // First-person mouse look in Walk mode
    if (viewMode === 'Walk' && (e.buttons === 1 || e.buttons === 2)) {
      state.walkYaw -= e.movementX * 0.003;
      state.walkPitch = Math.max(
        -Math.PI / 2.8,
        Math.min(Math.PI / 2.8, state.walkPitch - e.movementY * 0.003)
      );
      return;
    }

    // 3D Object Dragging (Fixed Camera-Aligned Math)
    if (state.isDragging && state.selectedMesh && selectedObject) {
      if (selectedObject.locked || lockedElements.has(selectedObject.id)) {
        state.isDragging = false;
        return;
      }

      const rect = container.getBoundingClientRect();
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      state.raycaster.setFromCamera(state.mouse, state.camera);
      if (state.raycaster.ray.intersectPlane(state.dragPlane, state.planeIntersect)) {
        // Desired target position factoring the initial click offset
        const targetPos = state.planeIntersect.clone().sub(state.dragOffset);

        // 5cm architectural grid snap
        const snappedX = Math.round(targetPos.x * 20) / 20;
        const snappedZ = Math.round(targetPos.z * 20) / 20;

        // Room boundary containment clamp
        const halfObjW = (selectedObject.dimensions.width * 0.0254) / 2;
        const halfObjD = (selectedObject.dimensions.depth * 0.0254) / 2;
        const maxX = roomMeters.halfW - halfObjW;
        const maxZ = roomMeters.halfL - halfObjD;

        const clampedX = Math.max(-maxX, Math.min(maxX, snappedX));
        const clampedZ = Math.max(-maxZ, Math.min(maxZ, snappedZ));

        state.selectedMesh.position.x = clampedX;
        state.selectedMesh.position.z = clampedZ;

        // Propagate to React state
        onObjectsChange(
          objects.map(o =>
            o.id === selectedObject.id
              ? { ...o, position: { ...o.position, x: clampedX, z: clampedZ } }
              : o
          )
        );
      }
    } else if (e.buttons === 1 && viewMode === '3D' && activeTool === 'Orbit') {
      // Smooth Orbit Camera: cursor moving right rotates the scene to the right
      const rotSpeed = 0.005;
      const curPos = state.camera.position;
      const radius = Math.sqrt(curPos.x * curPos.x + curPos.z * curPos.z);
      let angle = Math.atan2(curPos.z, curPos.x);
      angle += e.movementX * rotSpeed;

      const newHeight = Math.max(1.2, Math.min(22, curPos.y - e.movementY * rotSpeed * 3));
      state.camera.position.set(Math.cos(angle) * radius, newHeight, Math.sin(angle) * radius);
      state.camera.lookAt(0, 0, 0);
    } else if (e.buttons === 1 && viewMode === '3D' && activeTool === 'Pan') {
      // Pan Camera
      const panSpeed = 0.01;
      state.camera.position.x -= e.movementX * panSpeed;
      state.camera.position.y += e.movementY * panSpeed;
    }
  };

  const handlePointerUp = () => {
    if (threeStateRef.current) {
      threeStateRef.current.isDragging = false;
    }
  };

  // Keyboard Navigation for Walkthrough Mode + Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (threeStateRef.current) {
        threeStateRef.current.keysDown.add(e.code);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject && !isElementLocked) {
        handleDeleteObject();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (threeStateRef.current) {
        threeStateRef.current.keysDown.delete(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedObject, isElementLocked]);

  // ── Object Manipulation Controls ────────────────────────────────────
  const handleRotate = (dir: 'left' | 'right') => {
    if (!selectedObject || isElementLocked) return;
    const delta = dir === 'left' ? -15 : 15;
    onObjectsChange(
      objects.map(o =>
        o.id === selectedObject.id
          ? { ...o, rotation: { ...o.rotation, y: (o.rotation.y + delta) % 360 } }
          : o
      )
    );
  };

  const handleElevate = (dir: 'up' | 'down') => {
    if (!selectedObject || isElementLocked) return;
    const delta = dir === 'up' ? 0.05 : -0.05; // 5cm
    onObjectsChange(
      objects.map(o =>
        o.id === selectedObject.id
          ? { ...o, position: { ...o.position, y: Math.max(0, o.position.y + delta) } }
          : o
      )
    );
  };

  const handleDuplicate = () => {
    if (!selectedObject) return;
    const duplicate: StudioObject3D = {
      ...selectedObject,
      id: `obj-${Date.now()}`,
      name: `${selectedObject.name} (Copy)`,
      locked: false,
      position: {
        x: selectedObject.position.x + 0.35,
        y: selectedObject.position.y,
        z: selectedObject.position.z + 0.35,
      },
    };
    onObjectsChange([...objects, duplicate]);
    setSelectedTarget({ type: 'object', id: duplicate.id });
  };

  const handleDeleteObject = () => {
    if (!selectedObject || isElementLocked) return;
    onObjectsChange(objects.filter(o => o.id !== selectedObject.id));
    setSelectedTarget(null);
  };

  const handleDimensionChange = (key: 'width' | 'height' | 'depth', valInches: number) => {
    if (!selectedObject || isElementLocked) return;
    onObjectsChange(
      objects.map(o =>
        o.id === selectedObject.id
          ? { ...o, dimensions: { ...o.dimensions, [key]: Math.max(4, valInches) } }
          : o
      )
    );
  };

  // ── Sub-Element Material / Color Customization Handler ──────────────
  const handleSubElementChange = (partId: string, colorHex: string, materialName?: string) => {
    if (!selectedObject || isElementLocked) return;
    const currentSubs = selectedObject.subElements || [];
    const existingIndex = currentSubs.findIndex(s => s.id === partId);

    let updatedSubs: SubElementCustomization[];
    if (existingIndex >= 0) {
      updatedSubs = currentSubs.map((s, idx) =>
        idx === existingIndex
          ? { ...s, color: colorHex, material: materialName || s.material }
          : s
      );
    } else {
      updatedSubs = [
        ...currentSubs,
        { id: partId, name: partId, color: colorHex, material: materialName },
      ];
    }

    onObjectsChange(
      objects.map(o => (o.id === selectedObject.id ? { ...o, subElements: updatedSubs } : o))
    );
  };

  // ── Add Wall Opening (Door / Window) Handler ────────────────────────
  const handleAddWallOpening = () => {
    if (selectedTarget?.type !== 'wall' || !onRoomChange) return;
    const orientation = selectedTarget.orientation;

    const newOpening: RoomOpening = {
      id: `op-${Date.now()}`,
      type: newOpeningType,
      wall: orientation,
      width: newOpeningWidth,
      height: newOpeningHeight,
      sillHeight: newOpeningType === 'door' ? 0 : newOpeningSill,
      offsetPct: newOpeningOffsetPct,
    };

    const updatedOpenings = [...(currentRoom.openings || []), newOpening];
    onRoomChange({
      ...currentRoom,
      openings: updatedOpenings,
    });
    setOpeningConfigOpen(false);
  };

  // ── Add Object from Marketplace ─────────────────────────────────────
  const handleInsertMarketplaceItem = (
    item: typeof MARKETPLACE_OBJECTS_CATALOG[0],
    customDims?: { width: number; height: number; depth: number }
  ) => {
    const dims = customDims || item.dimensions;
    const newObj: StudioObject3D = {
      id: `obj-${Date.now()}`,
      roomId: currentRoom.id,
      name: item.name,
      category: item.category as any,
      thumbnailUrl: item.thumbnailUrl,
      modelUrl: item.modelUrl,
      dimensions: { ...dims },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      color: item.color,
      material: item.material,
      priceINR: item.priceINR,
      brand: item.brand,
      vendor: item.vendor,
      locked: false,
      subElements: item.subElements ? [...item.subElements] : undefined,
    };

    onObjectsChange([...objects, newObj]);
    setSelectedTarget({ type: 'object', id: newObj.id });
    setPreInsertItem(null);
  };

  // ── AI RoomBot Assistant ───────────────────────────────────────────
  const handleRunAiPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const lower = aiPrompt.toLowerCase();

    // Match prompt against catalog items
    const match = MARKETPLACE_OBJECTS_CATALOG.find(
      cat =>
        lower.includes(cat.name.toLowerCase()) ||
        lower.includes(cat.category.toLowerCase()) ||
        cat.name.toLowerCase().split(' ').some(word => lower.includes(word))
    );

    if (match) {
      handleInsertMarketplaceItem(match);
      setAiPrompt('');
      setBannerNotice(`RoomBot: Added ${match.name} to the center of the room.`);
    } else {
      setBannerNotice(`RoomBot: Generating layout recommendation for "${aiPrompt}"...`);
    }
  };

  // Filtered Marketplace catalog
  const filteredCatalog = useMemo(() => {
    return MARKETPLACE_OBJECTS_CATALOG.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.material.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* ── TOP EDITOR SUB-HEADER ──────────────────────────────────── */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          {/* View Modes */}
          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === '2D' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              2D CAD
            </button>
            <button
              type="button"
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === '3D' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Orbit
            </button>
            <button
              type="button"
              onClick={() => setViewMode('Walk')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'Walk' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Footprints size={13} />
              Walkthrough
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Navigation & Camera Tools */}
          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTool('Orbit')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTool === 'Orbit' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Orbit
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('Pan')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTool === 'Pan' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pan
            </button>
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === 'X-Ray' ? 'Orbit' : 'X-Ray')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTool === 'X-Ray' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              X-Ray
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDimensions(!showDimensions);
                setActiveTool('Dims');
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                showDimensions ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dims
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTool('Measure');
                setMeasurePoints([]);
                setMeasureDistanceMeters(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                activeTool === 'Measure' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ruler size={13} />
              Measure
            </button>
          </div>

          {/* Ceiling Toggle */}
          <button
            type="button"
            onClick={() => setShowCeiling(!showCeiling)}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium border border-slate-800 transition-all ${
              showCeiling ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Ceiling {showCeiling ? 'On' : 'Off'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onExportFloorPlan && (
            <button
              type="button"
              onClick={onExportFloorPlan}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Download size={13} />
              Floor Plan
            </button>
          )}
          {onExportRender && (
            <button
              type="button"
              onClick={onExportRender}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Camera size={13} />
              Render 3D
            </button>
          )}
          {onSaveDesign && (
            <button
              type="button"
              onClick={onSaveDesign}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Save size={13} />
              Save
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTAINER ───────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── LEFT CONTROL PANEL (Element Inspector, Measurements, Locking) ── */}
        <div className="w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between overflow-y-auto text-xs z-10 shrink-0">
          <div className="p-4 space-y-4">
            {/* Header: Element Type & Lock Status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400">
                  {selectedTarget?.type ? `${selectedTarget.type.toUpperCase()} INSPECTOR` : 'ROOM OVERVIEW'}
                </span>
                <h3 className="font-bold text-sm text-white">
                  {selectedTarget?.type === 'object' && selectedObject?.name}
                  {selectedTarget?.type === 'wall' && `${selectedTarget.orientation.toUpperCase()} WALL`}
                  {selectedTarget?.type === 'floor' && 'FLOOR / CARPET AREA'}
                  {selectedTarget?.type === 'ceiling' && 'CEILING & LIGHTING'}
                  {!selectedTarget && currentRoom.name}
                </h3>
              </div>

              {selectedTarget && (
                <button
                  type="button"
                  onClick={toggleElementLock}
                  className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 text-[11px] font-bold ${
                    isElementLocked
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title={isElementLocked ? 'Element is Locked' : 'Lock Element'}
                >
                  {isElementLocked ? <Lock size={13} /> : <Unlock size={13} />}
                  <span>{isElementLocked ? 'Locked' : 'Unlocked'}</span>
                </button>
              )}
            </div>

            {/* Locked Element Notice Banner */}
            {isElementLocked && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                <Lock size={14} className="shrink-0 text-rose-400" />
                <span>This element is locked. Unlock it above to change position, dimensions, or delete.</span>
              </div>
            )}

            {/* ── CASE 1: SELECTED 3D OBJECT ────────────────────── */}
            {selectedTarget?.type === 'object' && selectedObject && (
              <div className="space-y-4">
                {/* Object Position & Elevation */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Position & Elevation</span>
                    <span className="text-[10px] text-slate-500">Meters</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-slate-900 rounded-xl text-center border border-slate-800">
                      <span className="text-[10px] text-rose-400 font-bold block">X</span>
                      <span className="font-mono text-white text-xs">{selectedObject.position.x.toFixed(2)}m</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl text-center border border-slate-800">
                      <span className="text-[10px] text-emerald-400 font-bold block">Y (Elev)</span>
                      <span className="font-mono text-white text-xs">{selectedObject.position.y.toFixed(2)}m</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl text-center border border-slate-800">
                      <span className="text-[10px] text-sky-400 font-bold block">Z</span>
                      <span className="font-mono text-white text-xs">{selectedObject.position.z.toFixed(2)}m</span>
                    </div>
                  </div>

                  {/* Elevate & Rotate buttons */}
                  {!isElementLocked && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleRotate('left')}
                          className="flex-1 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1"
                        >
                          <RotateCcw size={12} />
                          -15°
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotate('right')}
                          className="flex-1 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1"
                        >
                          <RotateCw size={12} />
                          +15°
                        </button>
                      </div>

                      <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleElevate('up')}
                          className="flex-1 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1"
                        >
                          <ArrowUp size={12} />
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => handleElevate('down')}
                          className="flex-1 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1"
                        >
                          <ArrowDown size={12} />
                          Down
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dimensions (Length, Width, Height) */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Dimensions (Inches)</span>
                    <span className="text-[10px] text-slate-500">Live 3D Scale</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Width (L)</span>
                        <span className="font-mono text-white">{selectedObject.dimensions.width}&quot;</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={144}
                        disabled={isElementLocked}
                        value={selectedObject.dimensions.width}
                        onChange={e => handleDimensionChange('width', Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Depth (W)</span>
                        <span className="font-mono text-white">{selectedObject.dimensions.depth}&quot;</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={96}
                        disabled={isElementLocked}
                        value={selectedObject.dimensions.depth}
                        onChange={e => handleDimensionChange('depth', Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Height (H)</span>
                        <span className="font-mono text-white">{selectedObject.dimensions.height}&quot;</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={120}
                        disabled={isElementLocked}
                        value={selectedObject.dimensions.height}
                        onChange={e => handleDimensionChange('height', Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-Elements Customization (Pillows, Cushions, Tabletops, Legs) */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Palette size={14} className="text-indigo-400" />
                      <span className="font-bold text-slate-200">Sub-Parts Customization</span>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono">Pillows • Fabric • Legs</span>
                  </div>

                  <div className="space-y-2.5">
                    {(selectedObject.subElements || [
                      { id: 'main', name: 'Main Body / Fabric', color: selectedObject.color },
                      { id: 'pillows', name: 'Pillows / Cushions', color: '#ffffff' },
                      { id: 'legs', name: 'Base / Legs', color: '#1e293b' },
                    ]).map(sub => (
                      <div key={sub.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-300">{sub.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{sub.color}</span>
                        </div>

                        {/* Quick Color Swatches */}
                        <div className="flex items-center gap-1.5">
                          {['#ffffff', '#1e293b', '#8b4513', '#3d5c3a', '#0284c7', '#d4af37', '#e11d48', '#818cf8'].map(hex => (
                            <button
                              key={hex}
                              type="button"
                              disabled={isElementLocked}
                              onClick={() => handleSubElementChange(sub.id, hex)}
                              style={{ backgroundColor: hex }}
                              className={`w-5 h-5 rounded-full border border-slate-700 transition-all ${
                                sub.color === hex ? 'ring-2 ring-indigo-400 scale-110' : 'hover:scale-105'
                              }`}
                            />
                          ))}
                          <input
                            type="color"
                            disabled={isElementLocked}
                            value={sub.color}
                            onChange={e => handleSubElementChange(sub.id, e.target.value)}
                            className="w-5 h-5 rounded-full border-0 bg-transparent cursor-pointer ml-auto"
                            title="Custom color picker"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Object Action Controls */}
                {!isElementLocked && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDuplicate}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5"
                    >
                      <Copy size={13} />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteObject}
                      className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── CASE 2: SELECTED WALL ─────────────────────────── */}
            {selectedTarget?.type === 'wall' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300">Wall Measurements</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Length</span>
                      <span className="font-mono text-white text-xs font-bold">
                        {['north', 'south'].includes(selectedTarget.orientation)
                          ? `${currentRoom.width} ft`
                          : `${currentRoom.length} ft`}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Height</span>
                      <span className="font-mono text-white text-xs font-bold">{currentRoom.height} ft</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/30 text-indigo-300 flex justify-between items-center">
                    <span className="font-bold">Total Wall Surface Area</span>
                    <span className="font-mono font-bold text-xs">
                      {(['north', 'south'].includes(selectedTarget.orientation)
                        ? currentRoom.width * currentRoom.height
                        : currentRoom.length * currentRoom.height
                      ).toFixed(0)}{' '}
                      sq.ft
                    </span>
                  </div>
                </div>

                {/* Wall Openings Tool Button */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Openings on this Wall</span>
                    <span className="text-[10px] text-indigo-400">Doors & Windows</span>
                  </div>

                  {/* List existing openings on this wall */}
                  <div className="space-y-1.5">
                    {(currentRoom.openings || [])
                      .filter(op => op.wall === selectedTarget.orientation)
                      .map((op, idx) => (
                        <div
                          key={op.id || idx}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300"
                        >
                          <div className="flex items-center gap-2">
                            {op.type === 'door' ? <DoorOpen size={14} className="text-amber-400" /> : <AppWindow size={14} className="text-sky-400" />}
                            <span className="capitalize font-semibold">{op.type}</span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              {op.width}&apos; × {op.height}&apos;
                            </span>
                          </div>
                          {!isElementLocked && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onRoomChange) {
                                  onRoomChange({
                                    ...currentRoom,
                                    openings: (currentRoom.openings || []).filter(o => o.id !== op.id),
                                  });
                                }
                              }}
                              className="text-slate-500 hover:text-rose-400"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Button to configure new opening */}
                  {!isElementLocked && (
                    <button
                      type="button"
                      onClick={() => setOpeningConfigOpen(true)}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <Plus size={13} />
                      Punch Door / Window on Wall
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── CASE 3: SELECTED FLOOR ────────────────────────── */}
            {selectedTarget?.type === 'floor' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300">Carpet Area & Perimeter</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Length × Width</span>
                      <span className="font-mono text-white text-xs font-bold">
                        {currentRoom.length}&apos; × {currentRoom.width}&apos;
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Perimeter</span>
                      <span className="font-mono text-white text-xs font-bold">{currentRoom.perimeterFt} ft</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-300 flex justify-between items-center">
                    <span className="font-bold">Net Carpet Area</span>
                    <span className="font-mono font-bold text-xs">{currentRoom.floorAreaSqFt} sq.ft</span>
                  </div>
                </div>

                {/* Floor Material Selector */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300">Floor Surface Material</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Italian Botticino Marble', color: '#f8fafc' },
                      { name: 'Hardwood White Oak', color: '#d4a373' },
                      { name: 'Polished Granite', color: '#334155' },
                      { name: 'Terrazzo Tiles', color: '#e2e8f0' },
                    ].map(mat => (
                      <button
                        key={mat.name}
                        type="button"
                        disabled={isElementLocked}
                        onClick={() => {
                          if (onRoomChange) {
                            onRoomChange({ ...currentRoom, floorMaterial: mat.name });
                          }
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          currentRoom.floorMaterial === mat.name
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: mat.color }} />
                        <span className="text-[11px] truncate">{mat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── CASE 4: SELECTED CEILING ──────────────────────── */}
            {selectedTarget?.type === 'ceiling' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300">Ceiling Specifications</span>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Ceiling Height</span>
                    <span className="font-mono font-bold text-white">{currentRoom.height} ft</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Ceiling Area</span>
                    <span className="font-mono font-bold text-white">{currentRoom.ceilingAreaSqFt} sq.ft</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── CASE 5: NO ELEMENT SELECTED (ROOM OVERVIEW) ──── */}
            {!selectedTarget && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Room Summary</span>
                    <span className="text-[10px] text-indigo-400 font-bold">{currentRoom.type}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Carpet Area</span>
                      <span className="font-mono text-white text-xs font-bold">{currentRoom.floorAreaSqFt} sq.ft</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Objects Placed</span>
                      <span className="font-mono text-white text-xs font-bold">{objects.length} Items</span>
                    </div>
                  </div>
                </div>

                {/* Walkthrough Eye-Level & FOV Controls */}
                {viewMode === 'Walk' && (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Camera View Controls</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Walk Active</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Eye Level Height</span>
                        <span className="font-mono text-white">{viewHeightCm} cm</span>
                      </div>
                      <input
                        type="range"
                        min={120}
                        max={210}
                        value={viewHeightCm}
                        onChange={e => setViewHeightCm(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Field of View (FOV)</span>
                        <span className="font-mono text-white">{fieldOfView}°</span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={110}
                        value={fieldOfView}
                        onChange={e => setFieldOfView(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Left Panel Footer Notice */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[10px] text-slate-400 flex items-center gap-1.5">
            <Info size={12} className="text-indigo-400 shrink-0" />
            <span>Click any object, wall, or floor in 3D to edit dimensions & materials.</span>
          </div>
        </div>

        {/* ── CENTER 3D / 2D CANVAS CONTAINER ─────────────────────── */}
        <div
          ref={canvasWrapperRef}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex-1 h-full bg-slate-950 outline-none relative cursor-grab active:cursor-grabbing overflow-hidden"
        >
          {/* Isolated WebGL Canvas Mount — completely separate from React child nodes */}
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Top Banner Notice */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl px-3 py-1 flex items-center gap-2 shadow-xl z-10 pointer-events-none text-xs text-slate-300 font-medium">
            <Sparkles size={13} className="text-indigo-400" />
            <span>{bannerNotice}</span>
          </div>

          {/* Tape Measure Real-Time Distance Badge */}
          {activeTool === 'Measure' && measureDistanceMeters !== null && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-amber-500/90 backdrop-blur-md border border-amber-400 text-slate-950 font-bold px-3 py-1 rounded-xl shadow-xl z-20 text-xs flex items-center gap-2">
              <Ruler size={14} />
              <span>
                Span: {(measureDistanceMeters * 3.28084).toFixed(2)} ft ({measureDistanceMeters.toFixed(2)} m)
              </span>
              <button
                type="button"
                onClick={() => {
                  setMeasurePoints([]);
                  setMeasureDistanceMeters(null);
                }}
                className="ml-1 p-0.5 rounded-full hover:bg-amber-600/50"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Floating On-Canvas Context Toolbar for Selected Object */}
          {selectedObject && (
            <div className="absolute top-3 left-4 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl z-10">
              <span className="text-[11px] font-bold text-white px-2 truncate max-w-[140px]">
                {selectedObject.name}
              </span>

              <button
                type="button"
                onClick={toggleElementLock}
                className={`p-1.5 rounded-xl border ${
                  isElementLocked ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
                title={isElementLocked ? 'Locked' : 'Unlock'}
              >
                {isElementLocked ? <Lock size={13} /> : <Unlock size={13} />}
              </button>

              {!isElementLocked && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRotate('right')}
                    className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white"
                    title="Rotate 15°"
                  >
                    <RotateCw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white"
                    title="Duplicate"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteObject}
                    className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Bottom-Center AI Prompt Bar (RoomBot Assistant) */}
          <form
            onSubmit={handleRunAiPrompt}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-1.5 flex items-center gap-2 shadow-2xl z-20"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0">
              <Sparkles size={14} />
            </div>
            <input
              type="text"
              placeholder="Ask RoomBot... (e.g. 'Add king bed', 'Add green sofa', 'Add dining table')"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              AI
            </span>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Apply
            </button>
          </form>

          {/* Bottom-Right 3D Gizmo */}
          <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex items-center gap-1.5 shadow-xl text-[10px] font-mono z-10 pointer-events-none">
            <span className="text-rose-500 font-bold">X</span>
            <span className="text-emerald-500 font-bold">Y</span>
            <span className="text-sky-500 font-bold">Z</span>
            <Compass size={13} className="text-slate-400 ml-1" />
          </div>
        </div>

        {/* ── RIGHT PANEL (Marketplace, 3D Assets, Pre-insert Sizing) ── */}
        <div className="w-80 bg-slate-950/90 backdrop-blur-md border-l border-slate-800 flex flex-col justify-between overflow-hidden text-xs z-10 shrink-0">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Tabs */}
            <div className="px-3 pt-3">
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('Marketplace')}
                  className={`py-1.5 rounded-lg transition-all ${
                    rightPanelTab === 'Marketplace' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Marketplace
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('MyModels')}
                  className={`py-1.5 rounded-lg transition-all ${
                    rightPanelTab === 'MyModels' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3D Assets ({MARKETPLACE_OBJECTS_CATALOG.length})
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative mt-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Quick search... (e.g. bed, sofa, chair)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-[11px] placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'seating', label: 'Seating' },
                  { id: 'tables', label: 'Tables' },
                  { id: 'beds', label: 'Beds' },
                  { id: 'storage', label: 'Storage' },
                  { id: 'lighting', label: 'Lighting' },
                  { id: 'decor', label: 'Decor' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5">
              {filteredCatalog.map(item => (
                <div
                  key={item.name}
                  className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/60 transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-[12px] group-hover:text-indigo-300 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[190px]">{item.material}</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-[11px]">
                      ₹{(item.priceINR || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span>
                      {item.dimensions.width}&quot; × {item.dimensions.depth}&quot; × {item.dimensions.height}&quot;
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Pre-insert Size Config button */}
                      <button
                        type="button"
                        onClick={() => {
                          setPreInsertItem(item);
                          setPreInsertDims({ ...item.dimensions });
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1"
                        title="Configure dimensions before placing"
                      >
                        <Sliders size={11} />
                        Size
                      </button>

                      {/* Instant Add */}
                      <button
                        type="button"
                        onClick={() => handleInsertMarketplaceItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 shadow-md"
                      >
                        <Plus size={11} />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel Footer */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-[10px] text-slate-400 flex items-center justify-between">
            <span>{objects.length} Objects in Room</span>
            <span className="font-mono text-emerald-400 font-bold">
              Total: ₹{objects.reduce((sum, o) => sum + (o.priceINR || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: PRE-INSERT DIMENSION CONFIGURATOR ─────────────── */}
      {preInsertItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  PRE-INSERT SIZING
                </span>
                <h3 className="font-bold text-sm text-white">{preInsertItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreInsertItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Configure dimensions before inserting into room. These can also be adjusted later in the 3D editor.
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Width / Length (inches)</span>
                  <span className="font-mono font-bold text-white">{preInsertDims.width}&quot;</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={144}
                  value={preInsertDims.width}
                  onChange={e => setPreInsertDims({ ...preInsertDims, width: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Depth / Width (inches)</span>
                  <span className="font-mono font-bold text-white">{preInsertDims.depth}&quot;</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={96}
                  value={preInsertDims.depth}
                  onChange={e => setPreInsertDims({ ...preInsertDims, depth: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Height (inches)</span>
                  <span className="font-mono font-bold text-white">{preInsertDims.height}&quot;</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={120}
                  value={preInsertDims.height}
                  onChange={e => setPreInsertDims({ ...preInsertDims, height: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreInsertItem(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleInsertMarketplaceItem(preInsertItem, preInsertDims)}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
              >
                Insert into Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: WALL OPENING PUNCH TOOL (DOOR / WINDOW) ─────────── */}
      {openingConfigOpen && selectedTarget?.type === 'wall' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  PUNCH WALL OPENING
                </span>
                <h3 className="font-bold text-sm text-white">
                  Add Door or Window on {selectedTarget.orientation.toUpperCase()} Wall
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpeningConfigOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['window', 'door', 'arch'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewOpeningType(type)}
                  className={`py-2 rounded-xl border text-center font-bold capitalize transition-all ${
                    newOpeningType === type
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Opening Width (ft)</span>
                  <span className="font-mono font-bold text-white">{newOpeningWidth} ft</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={0.5}
                  value={newOpeningWidth}
                  onChange={e => setNewOpeningWidth(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Opening Height (ft)</span>
                  <span className="font-mono font-bold text-white">{newOpeningHeight} ft</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={8}
                  step={0.5}
                  value={newOpeningHeight}
                  onChange={e => setNewOpeningHeight(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              {newOpeningType !== 'door' && (
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Sill Height from Floor (ft)</span>
                    <span className="font-mono font-bold text-white">{newOpeningSill} ft</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={5}
                    step={0.5}
                    value={newOpeningSill}
                    onChange={e => setNewOpeningSill(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Position Offset Along Wall</span>
                  <span className="font-mono font-bold text-white">{newOpeningOffsetPct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={newOpeningOffsetPct}
                  onChange={e => setNewOpeningOffsetPct(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOpeningConfigOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddWallOpening}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
              >
                Punch Opening in 3D
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper: Apply Sub-Element Customization to Mesh ──────────────────
function applySubElementsToMesh(root: THREE.Object3D, obj: StudioObject3D) {
  if (!obj.subElements || obj.subElements.length === 0) return;

  obj.subElements.forEach(sub => {
    root.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const nameLower = (mesh.name || '').toLowerCase();
        const subIdLower = sub.id.toLowerCase();
        const subNameLower = sub.name.toLowerCase();

        // Match part name or id
        if (
          nameLower.includes(subIdLower) ||
          nameLower.includes(subNameLower) ||
          (subIdLower.includes('pillow') && nameLower.includes('pillow')) ||
          (subIdLower.includes('cushion') && nameLower.includes('cushion')) ||
          (subIdLower.includes('leg') && nameLower.includes('leg')) ||
          (subIdLower.includes('top') && nameLower.includes('top'))
        ) {
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => {
                if ((m as THREE.MeshStandardMaterial).color) {
                  (m as THREE.MeshStandardMaterial).color.set(sub.color);
                }
              });
            } else if ((mesh.material as THREE.MeshStandardMaterial).color) {
              (mesh.material as THREE.MeshStandardMaterial).color.set(sub.color);
            }
          }
        }
      }
    });
  });
}

// ── Helper: Procedural 3D Mesh Generator with Sub-Part Tagging ────────
function createProcedural3DMesh(obj: StudioObject3D): THREE.Group {
  const group = new THREE.Group();

  const mainColor = new THREE.Color(obj.color || '#3b82f6');
  const mat = new THREE.MeshStandardMaterial({
    color: mainColor,
    roughness: 0.6,
    metalness: 0.1,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.7,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.8,
    roughness: 0.3,
  });

  if (obj.category === 'seating') {
    // Couch / Sofa with tagged sub-parts
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.75), mat);
    base.name = 'upholstery_base';
    base.position.y = 0.25;
    base.castShadow = true;
    group.add(base);

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.22), mat);
    back.name = 'upholstery_back';
    back.position.set(0, 0.55, -0.26);
    back.castShadow = true;
    group.add(back);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.78), mat);
    leftArm.name = 'upholstery_left_arm';
    leftArm.position.set(-0.95, 0.4, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.78), mat);
    rightArm.name = 'upholstery_right_arm';
    rightArm.position.set(0.95, 0.4, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Pillows / Cushions
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.8 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.12), pillowMat);
    p1.name = 'pillows_accent_1';
    p1.position.set(-0.6, 0.45, -0.15);
    p1.rotation.y = 0.25;
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.12), pillowMat);
    p2.name = 'pillows_accent_2';
    p2.position.set(0.6, 0.45, -0.15);
    p2.rotation.y = -0.25;
    group.add(p1, p2);

    // Wooden legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.15, 8);
    const legPositions = [
      [-0.85, 0.075, 0.28],
      [0.85, 0.075, 0.28],
      [-0.85, 0.075, -0.28],
      [0.85, 0.075, -0.28],
    ];
    legPositions.forEach(([x, y, z], idx) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.name = `legs_${idx}`;
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });
  } else if (obj.category === 'beds') {
    // Bed with Pillows, Mattress, and Headboard
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 2.1), mat);
    mattress.name = 'mattress';
    mattress.position.y = 0.3;
    mattress.castShadow = true;
    group.add(mattress);

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.95, 0.14), mat);
    headboard.name = 'frame_headboard';
    headboard.position.set(0, 0.65, -1.05);
    headboard.castShadow = true;
    group.add(headboard);

    // Pillows
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.38), pillowMat);
    p1.name = 'pillows_1';
    p1.position.set(-0.45, 0.54, -0.75);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.38), pillowMat);
    p2.name = 'pillows_2';
    p2.position.set(0.45, 0.54, -0.75);
    group.add(p1, p2);

    // Duvet / Blanket
    const duvetMat = new THREE.MeshStandardMaterial({ color: 0x818cf8, roughness: 0.85 });
    const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.06, 1.3), duvetMat);
    duvet.name = 'duvet';
    duvet.position.set(0, 0.49, 0.35);
    group.add(duvet);
  } else if (obj.category === 'tables') {
    // Tabletop + 4 Legs
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.85), mat);
    top.name = 'top_tabletop';
    top.position.y = 0.72;
    top.castShadow = true;
    group.add(top);

    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8);
    const legPositions = [
      [-0.65, 0.35, 0.35],
      [0.65, 0.35, 0.35],
      [-0.65, 0.35, -0.35],
      [0.65, 0.35, -0.35],
    ];
    legPositions.forEach(([x, y, z], idx) => {
      const leg = new THREE.Mesh(legGeo, brassMat);
      leg.name = `legs_${idx}`;
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });
  } else if (obj.category === 'storage') {
    // Cabinet / Credenza
    const carcass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.5), mat);
    carcass.name = 'carcass';
    carcass.position.y = 0.38;
    carcass.castShadow = true;
    group.add(carcass);

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.04, 0.52), woodMat);
    top.name = 'top';
    top.position.y = 0.77;
    group.add(top);
  } else if (obj.category === 'lighting') {
    // Floor Lamp
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6, 8), brassMat);
    pole.name = 'pole';
    pole.position.y = 0.8;
    pole.castShadow = true;
    group.add(pole);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16), brassMat);
    base.name = 'base';
    base.position.y = 0.015;
    group.add(base);

    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.26, 0.3, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xfff3e0, roughness: 0.8 })
    );
    shade.name = 'shade';
    shade.position.y = 1.55;
    group.add(shade);
  } else {
    // Default Decor / Fixture
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mat);
    box.position.y = 0.3;
    box.castShadow = true;
    group.add(box);
  }

  // Apply custom sub-element colors if provided
  applySubElementsToMesh(group, obj);

  return group;
}
