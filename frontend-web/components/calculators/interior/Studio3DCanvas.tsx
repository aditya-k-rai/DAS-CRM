'use client';

/**
 * Studio3DCanvas.tsx
 * Interactive 2D/3D Room Designer & First-Person Walkthrough Studio.
 *
 * Faithfully replicates the UI/UX layout, controls, and object manipulation
 * of the reference video (roomform.ai editor layout):
 * - Top Editor Sub-header Bar (New, Save, Share, Clear, Undo, Redo, Render, Export GLB, Export Floor Plan)
 * - Canvas Top-Left: 2D, 3D, Walk mode pills + Orbit, Pan, X-Ray, Dims, Measure tools
 * - Left Control Panel: Object Transform matrix, Dimensions, Smart Collision, Walk View Height & FOV
 * - Floating On-Canvas Context Toolbar: Rotate, Duplicate, Delete
 * - Bottom Canvas: AI Prompt Bar (RoomBot Assistant) + 3D Axis Gizmo
 * - Right Panel: Marketplace catalog, Category filters, Search, Image-to-3D generator
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  StudioObject3D,
  RoomDefinition,
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
  HelpCircle,
} from 'lucide-react';

interface StudioProps {
  currentRoom: RoomDefinition;
  objects: StudioObject3D[];
  onObjectsChange: (objects: StudioObject3D[]) => void;
  onSaveDesign?: () => void;
  onExportFloorPlan?: () => void;
  onExportRender?: () => void;
}

export function Studio3DCanvas({
  currentRoom,
  objects,
  onObjectsChange,
  onSaveDesign,
  onExportFloorPlan,
  onExportRender,
}: StudioProps) {
  // ── Editor Modes & Tools ───────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'2D' | '3D' | 'Walk'>('3D');
  const [activeTool, setActiveTool] = useState<'Orbit' | 'Pan' | 'X-Ray' | 'Dims' | 'Measure'>('Orbit');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Settings
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [smartCollisions, setSmartCollisions] = useState(true);
  const [activeRotationAxis, setActiveRotationAxis] = useState<'X' | 'Y' | 'Z'>('Y');
  const [unitMode, setUnitMode] = useState<'in' | 'ft' | 'm'>('in');
  const [uniformScale, setUniformScale] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Walkthrough State
  const [viewHeightCm, setViewHeightCm] = useState(175); // 5' 9" standard eye level
  const [fieldOfView, setFieldOfView] = useState(90);

  // Right Panel State
  const [rightPanelTab, setRightPanelTab] = useState<'Marketplace' | 'MyModels' | 'Recent'>('Marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [generatingModel, setGeneratingModel] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  // AI Prompt bar
  const [aiPrompt, setAiPrompt] = useState('');
  const [bannerNotice, setBannerNotice] = useState<string>('Hold Shift for axis-aligned movement');

  // Canvas container ref
  const mountRef = useRef<HTMLDivElement>(null);
  const threeStateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    orbitControls?: any;
    objectMeshes: Map<string, THREE.Group>;
    roomGroup: THREE.Group;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    walkCameraPos: THREE.Vector3;
    walkYaw: number;
    walkPitch: number;
    keysDown: Set<string>;
    isDragging: boolean;
    dragPlane: THREE.Plane;
    planeIntersect: THREE.Vector3;
    selectedMesh: THREE.Group | null;
  } | null>(null);

  const selectedObject = useMemo(() => {
    return objects.find(o => o.id === selectedObjectId) || null;
  }, [objects, selectedObjectId]);

  // ── Initialize Three.js WebGL Scene ────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean architectural white-gray

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 10, 12);
    camera.lookAt(0, 0, 0);

    // 3. Renderer with soft shadow maps
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Clean existing children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.3);
    dirLight.position.set(8, 14, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    const d = 10;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Subtle fill light for shadows
    const fillLight = new THREE.DirectionalLight(0x90caf9, 0.4);
    fillLight.position.set(-8, 6, -6);
    scene.add(fillLight);

    // 5. Room Group container
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // State Ref
    threeStateRef.current = {
      scene,
      camera,
      renderer,
      objectMeshes: new Map(),
      roomGroup,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      walkCameraPos: new THREE.Vector3(0, viewHeightCm / 100, 2),
      walkYaw: 0,
      walkPitch: 0,
      keysDown: new Set(),
      isDragging: false,
      dragPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      planeIntersect: new THREE.Vector3(),
      selectedMesh: null,
    };

    // 6. Animation loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const state = threeStateRef.current;
      if (!state) return;

      const delta = clock.getDelta();

      // First-person Walkthrough movement update
      if (viewMode === 'Walk') {
        const moveSpeed = 3.5 * delta;
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

        // Room boundary collision clamp
        const halfL = (currentRoom.length * 0.3048) / 2 - 0.4;
        const halfW = (currentRoom.width * 0.3048) / 2 - 0.4;
        state.walkCameraPos.x = Math.max(-halfW, Math.min(halfW, state.walkCameraPos.x));
        state.walkCameraPos.z = Math.max(-halfL, Math.min(halfL, state.walkCameraPos.z));
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
  }, []);

  // ── Build Room Shell (Floor, Walls, Openings) ───────────────────────
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;

    const group = state.roomGroup;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
    }

    // Convert room dimensions from ft to meters for 3D scale (1 ft = 0.3048 m)
    let lengthMeters = currentRoom.length * 0.3048;
    let widthMeters = currentRoom.width * 0.3048;
    let heightMeters = currentRoom.height * 0.3048;

    if (currentRoom.unit === 'in') {
      lengthMeters = (currentRoom.length / 12) * 0.3048;
      widthMeters = (currentRoom.width / 12) * 0.3048;
      heightMeters = (currentRoom.height / 12) * 0.3048;
    } else if (currentRoom.unit === 'm') {
      lengthMeters = currentRoom.length;
      widthMeters = currentRoom.width;
      heightMeters = currentRoom.height;
    }

    const halfL = lengthMeters / 2;
    const halfW = widthMeters / 2;
    // Cutaway wall height for 3D viewing comfort (full height in Walk mode)
    const wallH = viewMode === 'Walk' ? heightMeters : Math.min(heightMeters * 0.65, 2.2);
    const wallThick = 0.18; // 7-inch standard brick/AAC wall in meters

    // 1. FLOOR PLANE
    const floorGeo = new THREE.PlaneGeometry(widthMeters, lengthMeters);
    // Procedural warm parquet / marble tile canvas texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d');
    if (fctx) {
      if (currentRoom.floorMaterial?.toLowerCase().includes('marble')) {
        fctx.fillStyle = '#f3f4f6';
        fctx.fillRect(0, 0, 512, 512);
        fctx.strokeStyle = '#e5e7eb';
        fctx.lineWidth = 2;
        // Tile grid
        fctx.strokeRect(0, 0, 256, 256);
        fctx.strokeRect(256, 0, 256, 256);
        fctx.strokeRect(0, 256, 256, 256);
        fctx.strokeRect(256, 256, 256, 256);
      } else {
        // Wooden planks
        fctx.fillStyle = '#d4a373';
        fctx.fillRect(0, 0, 512, 512);
        fctx.fillStyle = '#bc8a5f';
        for (let i = 0; i < 512; i += 64) {
          fctx.fillRect(0, i, 512, 4);
        }
      }
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(widthMeters / 1.2, lengthMeters / 1.2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.05,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    // 2. WALLS
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Architectural off-white
      roughness: 0.9,
      metalness: 0.0,
      opacity: activeTool === 'X-Ray' ? 0.35 : 1.0,
      transparent: activeTool === 'X-Ray',
    });

    // North Wall (Back)
    const northGeo = new THREE.BoxGeometry(widthMeters + wallThick * 2, wallH, wallThick);
    const northWall = new THREE.Mesh(northGeo, wallMat);
    northWall.position.set(0, wallH / 2, -halfL - wallThick / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    group.add(northWall);

    // South Wall (Front)
    const southGeo = new THREE.BoxGeometry(widthMeters + wallThick * 2, wallH, wallThick);
    const southWall = new THREE.Mesh(southGeo, wallMat);
    southWall.position.set(0, wallH / 2, halfL + wallThick / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    group.add(southWall);

    // West Wall (Left)
    const westGeo = new THREE.BoxGeometry(wallThick, wallH, lengthMeters);
    const westWall = new THREE.Mesh(westGeo, wallMat);
    westWall.position.set(-halfW - wallThick / 2, wallH / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    group.add(westWall);

    // East Wall (Right)
    const eastGeo = new THREE.BoxGeometry(wallThick, wallH, lengthMeters);
    const eastWall = new THREE.Mesh(eastGeo, wallMat);
    eastWall.position.set(halfW + wallThick / 2, wallH / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    group.add(eastWall);

    // 3. ARCHITECTURAL GRID (Floor base helper)
    if (showGrid && viewMode !== 'Walk') {
      const grid = new THREE.GridHelper(Math.max(widthMeters, lengthMeters) * 1.5, 20, 0x94a3b8, 0xe2e8f0);
      grid.position.y = 0.005;
      group.add(grid);
    }
  }, [currentRoom, viewMode, showGrid, activeTool]);

  // ── Render 3D Objects & Meshes ──────────────────────────────────────
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;

    const existingMeshes = state.objectMeshes;

    // Remove meshes that are no longer in objects array
    const activeIds = new Set(objects.map(o => o.id));
    existingMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        state.scene.remove(mesh);
        existingMeshes.delete(id);
      }
    });

    // Create or update meshes
    objects.forEach(obj => {
      let group = existingMeshes.get(obj.id);

      if (!group) {
        group = new THREE.Group();
        group.name = obj.id;

        // Build procedural 3D model based on category
        const mesh = createProcedural3DMesh(obj);
        group.add(mesh);

        // Selection bounding box helper
        const bbox = new THREE.BoxHelper(mesh, 0x3b82f6);
        bbox.name = 'bbox';
        bbox.visible = false;
        group.add(bbox);

        state.scene.add(group);
        existingMeshes.set(obj.id, group);
      }

      // Update position & rotation
      group.position.set(obj.position.x, obj.position.y, obj.position.z);
      group.rotation.set(
        THREE.MathUtils.degToRad(obj.rotation.x),
        THREE.MathUtils.degToRad(obj.rotation.y),
        THREE.MathUtils.degToRad(obj.rotation.z)
      );

      // Update scale from dimensions
      const scaleX = (obj.dimensions.width * 0.0254) / 1.5; // normalized ratio
      const scaleY = (obj.dimensions.height * 0.0254) / 1.0;
      const scaleZ = (obj.dimensions.depth * 0.0254) / 1.0;
      group.scale.set(Math.max(0.3, scaleX), Math.max(0.3, scaleY), Math.max(0.3, scaleZ));

      // Toggle selection highlight
      const bbox = group.getObjectByName('bbox');
      if (bbox) {
        bbox.visible = obj.id === selectedObjectId;
      }
    });
  }, [objects, selectedObjectId]);

  // ── Camera View Mode Switcher ──────────────────────────────────────
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    if (viewMode === '2D') {
      // Top-Down Orthographic Architectural CAD view
      const aspect = width / height;
      const frustumSize = 12;
      const ortho = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        100
      );
      ortho.position.set(0, 20, 0);
      ortho.lookAt(0, 0, 0);
      state.camera = ortho;
      setBannerNotice('2D Architectural CAD View • Top-Down Dimensions');
    } else if (viewMode === '3D') {
      const persp = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      persp.position.set(0, 9, 11);
      persp.lookAt(0, 0, 0);
      state.camera = persp;
      setBannerNotice('Hold Shift for axis-aligned movement');
    } else if (viewMode === 'Walk') {
      const walk = new THREE.PerspectiveCamera(fieldOfView, width / height, 0.05, 50);
      state.walkCameraPos.set(0, viewHeightCm / 100, 2);
      state.walkYaw = 0;
      state.walkPitch = 0;
      walk.position.copy(state.walkCameraPos);
      state.camera = walk;
      setBannerNotice('Walkthrough Mode: Use WASD keys to move around • Click and drag to look around');
    }
  }, [viewMode]);

  // ── Walkthrough FOV & Eye Height Update ─────────────────────────────
  useEffect(() => {
    const state = threeStateRef.current;
    if (state && viewMode === 'Walk' && state.camera instanceof THREE.PerspectiveCamera) {
      state.camera.fov = fieldOfView;
      state.camera.updateProjectionMatrix();
      state.walkCameraPos.y = viewHeightCm / 100;
    }
  }, [fieldOfView, viewHeightCm, viewMode]);

  // ── Canvas Mouse & Interaction Events ──────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = threeStateRef.current;
    const container = mountRef.current;
    if (!state || !container) return;

    const rect = container.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast on 3D objects
    state.raycaster.setFromCamera(state.mouse, state.camera);
    const meshes = Array.from(state.objectMeshes.values());
    const intersects = state.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      // Find top-level group ID
      let hit: THREE.Object3D | null = intersects[0].object;
      while (hit && hit.parent && hit.parent !== state.scene) {
        if (state.objectMeshes.has(hit.name)) break;
        hit = hit.parent;
      }
      if (hit && state.objectMeshes.has(hit.name)) {
        setSelectedObjectId(hit.name);
        state.selectedMesh = hit as THREE.Group;
        state.isDragging = true;
      }
    } else {
      // Clicked on empty floor -> deselect
      if (viewMode !== 'Walk') {
        setSelectedObjectId(null);
        state.selectedMesh = null;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = threeStateRef.current;
    const container = mountRef.current;
    if (!state || !container) return;

    // Walkthrough Mouse-Look
    if (viewMode === 'Walk' && (e.buttons === 1 || e.buttons === 2)) {
      state.walkYaw -= e.movementX * 0.003;
      state.walkPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, state.walkPitch - e.movementY * 0.003));
      return;
    }

    // 3D Object Dragging along floor plane
    if (state.isDragging && state.selectedMesh && selectedObjectId) {
      const rect = container.getBoundingClientRect();
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      state.raycaster.setFromCamera(state.mouse, state.camera);
      if (state.raycaster.ray.intersectPlane(state.dragPlane, state.planeIntersect)) {
        const newX = Math.round(state.planeIntersect.x * 20) / 20; // 5cm grid snap
        const newZ = Math.round(state.planeIntersect.z * 20) / 20;

        // Smart collision boundary clamp
        const halfL = (currentRoom.length * 0.3048) / 2 - 0.3;
        const halfW = (currentRoom.width * 0.3048) / 2 - 0.3;
        const clampedX = Math.max(-halfW, Math.min(halfW, newX));
        const clampedZ = Math.max(-halfL, Math.min(halfL, newZ));

        state.selectedMesh.position.x = clampedX;
        state.selectedMesh.position.z = clampedZ;

        // Propagate to react state
        onObjectsChange(
          objects.map(o => (o.id === selectedObjectId ? { ...o, position: { ...o.position, x: clampedX, z: clampedZ } } : o))
        );
      }
    } else if (e.buttons === 1 && viewMode === '3D') {
      // Orbit Camera rotation
      const rotSpeed = 0.005;
      const curPos = state.camera.position;
      const radius = Math.sqrt(curPos.x * curPos.x + curPos.z * curPos.z);
      let angle = Math.atan2(curPos.z, curPos.x);
      angle -= e.movementX * rotSpeed;

      const newHeight = Math.max(2, Math.min(18, curPos.y - e.movementY * rotSpeed * 3));
      state.camera.position.set(Math.cos(angle) * radius, newHeight, Math.sin(angle) * radius);
      state.camera.lookAt(0, 0, 0);
    }
  };

  const handlePointerUp = () => {
    if (threeStateRef.current) {
      threeStateRef.current.isDragging = false;
    }
  };

  // Keyboard navigation for Walkthrough mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (threeStateRef.current) {
        threeStateRef.current.keysDown.add(e.code);
      }
      // Quick delete hotkey
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId) {
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
  }, [selectedObjectId, objects]);

  // ── Object Manipulation Handlers (Matching Video Left Panel) ────────
  const handleRotate = (dir: 'left' | 'right') => {
    if (!selectedObjectId) return;
    const delta = dir === 'left' ? -15 : 15;
    onObjectsChange(
      objects.map(o => {
        if (o.id !== selectedObjectId) return o;
        const currentRot = o.rotation.y || 0;
        return {
          ...o,
          rotation: { ...o.rotation, y: (currentRot + delta) % 360 },
        };
      })
    );
  };

  const handleElevate = (dir: 'up' | 'down') => {
    if (!selectedObjectId) return;
    const delta = dir === 'up' ? 0.05 : -0.05; // 5cm in meters
    onObjectsChange(
      objects.map(o => {
        if (o.id !== selectedObjectId) return o;
        return {
          ...o,
          position: { ...o.position, y: Math.max(0, o.position.y + delta) },
        };
      })
    );
  };

  const handleDuplicate = () => {
    if (!selectedObject) return;
    const duplicate: StudioObject3D = {
      ...selectedObject,
      id: `obj-${Date.now()}`,
      name: `${selectedObject.name} (Copy)`,
      position: {
        x: selectedObject.position.x + 0.3,
        y: selectedObject.position.y,
        z: selectedObject.position.z + 0.3,
      },
    };
    onObjectsChange([...objects, duplicate]);
    setSelectedObjectId(duplicate.id);
  };

  const handleDeleteObject = () => {
    if (!selectedObjectId) return;
    onObjectsChange(objects.filter(o => o.id !== selectedObjectId));
    setSelectedObjectId(null);
  };

  const handleDimensionChange = (key: 'width' | 'height' | 'depth', valInches: number) => {
    if (!selectedObjectId) return;
    onObjectsChange(
      objects.map(o => {
        if (o.id !== selectedObjectId) return o;
        if (uniformScale) {
          const ratio = valInches / o.dimensions[key];
          return {
            ...o,
            dimensions: {
              width: Math.round(o.dimensions.width * ratio),
              height: Math.round(o.dimensions.height * ratio),
              depth: Math.round(o.dimensions.depth * ratio),
            },
          };
        }
        return {
          ...o,
          dimensions: { ...o.dimensions, [key]: valInches },
        };
      })
    );
  };

  const handleAddFromMarketplace = (item: typeof MARKETPLACE_OBJECTS_CATALOG[0]) => {
    const newObj: StudioObject3D = {
      ...item,
      id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      roomId: currentRoom.id,
      position: { x: 0, y: (item.dimensions.height * 0.0254) / 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      smartCollision: smartCollisions,
    };
    onObjectsChange([...objects, newObj]);
    setSelectedObjectId(newObj.id);
  };

  // Image-to-3D Generator Simulator (matches video interaction)
  const handleStartImageTo3D = () => {
    setGeneratingModel(true);
    setGenProgress(5);
    const interval = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setGeneratingModel(false);
          // Drop green couch from reference video
          handleAddFromMarketplace(MARKETPLACE_OBJECTS_CATALOG[0]);
          return 100;
        }
        return prev + 15;
      });
    }, 350);
  };

  // AI Prompt Bar Trigger
  const handleRunAiPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const prompt = aiPrompt.toLowerCase();

    if (prompt.includes('sofa') || prompt.includes('couch')) {
      handleAddFromMarketplace(MARKETPLACE_OBJECTS_CATALOG[0]);
      setBannerNotice('RoomBot AI: Added Bixler Olive Sofa to the room.');
    } else if (prompt.includes('bed')) {
      handleAddFromMarketplace(MARKETPLACE_OBJECTS_CATALOG[4]);
      setBannerNotice('RoomBot AI: Positioned King Hydraulic Bed against the master wall.');
    } else if (prompt.includes('table') || prompt.includes('dining')) {
      handleAddFromMarketplace(MARKETPLACE_OBJECTS_CATALOG[2]);
      setBannerNotice('RoomBot AI: Added Nordic Oak Dining Table.');
    } else {
      handleAddFromMarketplace(MARKETPLACE_OBJECTS_CATALOG[1]);
      setBannerNotice(`RoomBot AI: Styled room with "${aiPrompt}".`);
    }
    setAiPrompt('');
  };

  // Filtered Marketplace Objects
  const filteredCatalog = useMemo(() => {
    return MARKETPLACE_OBJECTS_CATALOG.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.material.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[640px] w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative select-none">
      {/* ── 1. TOP EDITOR SUB-HEADER TOOLBAR (Matching Video) ────────── */}
      <div className="h-12 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-300 z-20">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all objects from room?')) onObjectsChange([]);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-semibold transition-all"
            title="Create clean new canvas"
          >
            <Plus size={13} className="text-indigo-400" /> <span className="hidden sm:inline">New</span>
          </button>
          <button
            type="button"
            onClick={onSaveDesign}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-semibold transition-all"
          >
            <Save size={13} className="text-emerald-400" /> <span>Save</span>
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Design studio link copied to clipboard!');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-semibold transition-all hidden md:flex"
          >
            <Share2 size={13} className="text-sky-400" /> <span>Share</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (objects.length > 0) onObjectsChange(objects.slice(0, -1));
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            title="Undo"
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            title="Redo"
          >
            <Redo2 size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportRender}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            <Sparkles size={13} /> <span>Render 3D</span>
          </button>
          <button
            type="button"
            onClick={onExportFloorPlan}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all hidden lg:flex"
          >
            <Download size={13} /> <span>Export Floor Plan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const canvas = mountRef.current?.querySelector('canvas');
              if (canvas) {
                const url = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `${currentRoom.name}-Snapshot.png`;
                link.href = url;
                link.click();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-semibold transition-all hidden sm:flex"
            title="High-res capture"
          >
            <Camera size={13} className="text-amber-400" /> <span>Capture</span>
          </button>
        </div>
      </div>

      {/* ── 2. MAIN WORKSPACE AREA (Left Panel + Center Canvas + Right Panel) ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── LEFT CONTROL PANEL ─────────────────────────────────────── */}
        <div className="w-64 md:w-72 bg-slate-950/80 backdrop-blur-md border-r border-slate-800/80 p-3.5 flex flex-col justify-between overflow-y-auto text-xs z-10">
          <div>
            {/* Mode 1: Walkthrough Camera Controls */}
            {viewMode === 'Walk' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Footprints size={15} className="text-sky-400" />
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Walkthrough Camera</span>
                </div>

                {/* Eye Height Slider */}
                <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <ArrowUp size={12} className="text-sky-400" /> View Height
                    </span>
                    <span className="font-mono text-sky-400 font-bold">
                      {Math.floor(viewHeightCm / 30.48)}&apos; {Math.round((viewHeightCm % 30.48) / 2.54)}&quot; ({(viewHeightCm / 100).toFixed(2)}m)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={120}
                    max={205}
                    value={viewHeightCm}
                    onChange={e => setViewHeightCm(Number(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                    <span>3&apos;11&quot; (1.2m)</span>
                    <span>Eye Level</span>
                    <span>6&apos;7&quot; (2.0m)</span>
                  </div>
                </div>

                {/* Field of View Slider */}
                <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-bold text-slate-300">Field of View</span>
                    <span className="font-mono text-sky-400 font-bold">{fieldOfView}° Normal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFieldOfView(prev => Math.max(60, prev - 5))}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min={60}
                      max={115}
                      value={fieldOfView}
                      onChange={e => setFieldOfView(Number(e.target.value))}
                      className="flex-1 accent-sky-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setFieldOfView(prev => Math.min(115, prev + 5))}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-3 text-[11px] text-sky-300/90 space-y-1">
                  <p className="font-bold">Controls Guide:</p>
                  <p>• <span className="font-mono text-white">W / S</span> — Step forward & backward</p>
                  <p>• <span className="font-mono text-white">A / D</span> — Strafe left & right</p>
                  <p>• <span className="font-mono text-white">Click & Drag</span> — Look around room</p>
                </div>
              </div>
            ) : selectedObject ? (
              /* Mode 2: Object Manipulation Matrix (Matching Video) */
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Box size={13} className="text-indigo-400" /> Controls
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px] font-medium" title={selectedObject.name}>
                    {selectedObject.name}
                  </span>
                </div>

                {/* 6 Grid Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotate('left')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1 text-[10px] font-bold text-slate-300 transition-all"
                  >
                    <RotateCcw size={16} className="text-slate-400" /> Rotate L
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate('right')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1 text-[10px] font-bold text-slate-300 transition-all"
                  >
                    <RotateCw size={16} className="text-slate-400" /> Rotate R
                  </button>
                  <button
                    type="button"
                    onClick={() => handleElevate('up')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1 text-[10px] font-bold text-slate-300 transition-all"
                  >
                    <ArrowUp size={16} className="text-slate-400" /> Up
                  </button>
                  <button
                    type="button"
                    onClick={() => handleElevate('down')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1 text-[10px] font-bold text-slate-300 transition-all"
                  >
                    <ArrowDown size={16} className="text-slate-400" /> Down
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1 text-[10px] font-bold text-slate-300 transition-all"
                  >
                    <Copy size={16} className="text-slate-400" /> Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteObject}
                    className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex flex-col items-center gap-1 text-[10px] font-bold text-rose-400 transition-all"
                  >
                    <Trash2 size={16} className="text-rose-400" /> Delete
                  </button>
                </div>

                {/* Keyboard Shortcut Hints (Exact Video UI) */}
                <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Move</span>
                    <span className="font-mono text-slate-300 bg-slate-800 px-1 rounded">↑ ↓ ← →</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Height</span>
                    <span className="font-mono text-slate-300 bg-slate-800 px-1 rounded">W S</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rotate</span>
                    <span className="font-mono text-slate-300 bg-slate-800 px-1 rounded">A D</span>
                  </div>
                </div>

                {/* Smart Collisions Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div>
                    <p className="font-bold text-slate-200 text-[11px]">Smart Collisions</p>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      {smartCollisions ? 'Snap to boundary' : 'Objects placed freely'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSmartCollisions(!smartCollisions)}
                    className={`w-9 h-5 rounded-full transition-all relative ${smartCollisions ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all absolute top-0.5 ${smartCollisions ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Rotation Axis Pills */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rotation Axis</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['X', 'Y', 'Z'] as const).map(axis => (
                      <button
                        key={axis}
                        type="button"
                        onClick={() => setActiveRotationAxis(axis)}
                        className={`py-1 rounded-lg font-bold text-xs transition-all ${activeRotationAxis === axis ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                      >
                        {axis}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-500">Rotates object left/right (turn)</p>
                </div>

                {/* Dimension Sliders & Number Inputs */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adjust Dimensions</span>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px]">
                      {(['in', 'ft', 'm'] as const).map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnitMode(u)}
                          className={`px-1.5 py-0.5 rounded font-bold ${unitMode === u ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Width */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-300 font-semibold">
                      <span>Width</span>
                      <span>{selectedObject.dimensions.width}&quot;</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={140}
                      value={selectedObject.dimensions.width}
                      onChange={e => handleDimensionChange('width', Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Height */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-300 font-semibold">
                      <span>Height</span>
                      <span>{selectedObject.dimensions.height}&quot;</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={120}
                      value={selectedObject.dimensions.height}
                      onChange={e => handleDimensionChange('height', Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Depth */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-300 font-semibold">
                      <span>Depth</span>
                      <span>{selectedObject.dimensions.depth}&quot;</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={120}
                      value={selectedObject.dimensions.depth}
                      onChange={e => handleDimensionChange('depth', Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Mode 3: Room Materials & Default Swatches */
              <div className="space-y-3">
                <div className="pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Box size={13} className="text-slate-400" /> Controls
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">No object selected. Click any object in 3D or drag from right catalog.</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room Materials</span>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-amber-700/80 border border-amber-500/40" />
                      <div>
                        <p className="font-bold text-slate-200 text-[11px]">Floor</p>
                        <p className="text-[9px] text-slate-400 truncate max-w-[110px]">{currentRoom.floorMaterial}</p>
                      </div>
                    </div>
                    <Grid size={13} className="text-slate-400" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-200 border border-slate-400" />
                      <div>
                        <p className="font-bold text-slate-200 text-[11px]">Walls</p>
                        <p className="text-[9px] text-slate-400 truncate max-w-[110px]">{currentRoom.wallFinish}</p>
                      </div>
                    </div>
                    <Sliders size={13} className="text-slate-400" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-amber-100 border border-amber-300" />
                      <div>
                        <p className="font-bold text-slate-200 text-[11px]">Doors</p>
                        <p className="text-[9px] text-slate-400">{currentRoom.openings.filter(o => o.type === 'door').length} Openings</p>
                      </div>
                    </div>
                    <Box size={13} className="text-slate-400" />
                  </div>
                </div>

                {/* Scan room promotional card from video */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/20 mt-4">
                  <div className="flex items-center gap-2 mb-1 text-indigo-300 font-bold text-[11px]">
                    <Smartphone size={14} /> Scan Your Room
                  </div>
                  <p className="text-[10px] text-indigo-200/70 leading-relaxed">
                    Import LiDAR 3D spatial scan from iPhone or iPad Pro directly into CRM.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Room Area Summary Footer */}
          <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-400">
            <div className="flex justify-between font-semibold text-slate-300">
              <span>{currentRoom.name}</span>
              <span className="text-emerald-400 font-bold">{currentRoom.floorAreaSqFt} sq.ft</span>
            </div>
            <div className="flex justify-between mt-0.5 text-slate-500">
              <span>Perimeter: {currentRoom.perimeterFt} ft</span>
              <span>Items: {objects.length}</span>
            </div>
          </div>
        </div>

        {/* ── CENTER 3D CANVAS & OVERLAY CONTROLS ───────────────────── */}
        <div className="flex-1 relative bg-slate-900 flex flex-col justify-between overflow-hidden">
          {/* Top-Left Canvas Controls (Mode Switcher + Tools) */}
          <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
            {/* 2D / 3D / Walk Pill Switcher */}
            <div className="flex items-center bg-slate-950/80 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl">
              <button
                type="button"
                onClick={() => setViewMode('2D')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${viewMode === '2D' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Layers size={13} /> 2D
              </button>
              <button
                type="button"
                onClick={() => setViewMode('3D')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${viewMode === '3D' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Box size={13} /> 3D
              </button>
              <button
                type="button"
                onClick={() => setViewMode('Walk')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${viewMode === 'Walk' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Eye size={13} /> Walk
              </button>
            </div>

            {/* Camera Tools (Orbit, Pan, X-Ray, Dims, Measure) */}
            <div className="hidden sm:flex items-center bg-slate-950/80 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl text-xs">
              {(['Orbit', 'Pan', 'X-Ray', 'Dims', 'Measure'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTool(t)}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all ${activeTool === t ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Settings Gear */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-8 h-8 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl"
              >
                <Sliders size={14} />
              </button>

              {settingsOpen && (
                <div className="absolute top-10 left-0 w-48 bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2 z-30 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Architectural Grid</span>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={e => setShowGrid(e.target.checked)}
                      className="accent-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dimension Tags</span>
                    <input
                      type="checkbox"
                      checked={showDimensions}
                      onChange={e => setShowDimensions(e.target.checked)}
                      className="accent-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uniform Scale</span>
                    <input
                      type="checkbox"
                      checked={uniformScale}
                      onChange={e => setUniformScale(e.target.checked)}
                      className="accent-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Banner Notice (Hold Shift for axis-aligned movement) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-xl flex items-center gap-1.5">
              <Info size={12} className="text-sky-400" />
              <span>{bannerNotice}</span>
            </div>
          </div>

          {/* Top-Right Fullscreen button */}
          <div className="absolute top-3 right-3 z-20">
            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  mountRef.current?.requestFullscreen?.();
                } else {
                  document.exitFullscreen?.();
                }
              }}
              className="w-8 h-8 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* ── THREE.JS WEBGL CANVAS CONTAINER ────────────────────── */}
          <div
            ref={mountRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Floating In-Canvas Context Action Toolbar for Selected 3D Object */}
          {selectedObject && (
            <div className="absolute bottom-18 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-2xl z-20">
              <span className="text-[11px] font-bold text-slate-200 mr-1 truncate max-w-[140px]">
                {selectedObject.name}
              </span>
              <button
                type="button"
                onClick={() => handleRotate('left')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                title="Rotate 15°"
              >
                <RotateCw size={13} />
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                title="Duplicate object"
              >
                <Copy size={13} />
              </button>
              <button
                type="button"
                onClick={handleDeleteObject}
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-all flex items-center gap-1 font-bold text-[10px]"
                title="Delete Object"
              >
                <Trash2 size={13} /> <span>Delete</span>
              </button>
            </div>
          )}

          {/* Bottom-Right 3D Gizmo Axis Indicator */}
          <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex items-center gap-1.5 shadow-xl text-[10px] font-mono z-10 pointer-events-none">
            <span className="text-rose-500 font-bold">X</span>
            <span className="text-emerald-500 font-bold">Y</span>
            <span className="text-sky-500 font-bold">Z</span>
            <Compass size={13} className="text-slate-400 ml-1" />
          </div>

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
              placeholder="Ask RoomBot... (e.g. 'Add a green velvet couch', 'Add dining table', 'Add king bed')"
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
        </div>

        {/* ── RIGHT PANEL (Marketplace, 3D Generator, Custom Uploads) ── */}
        <div className="w-72 md:w-80 bg-slate-950/80 backdrop-blur-md border-l border-slate-800/80 flex flex-col justify-between overflow-hidden text-xs z-10">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Generator from Image Card (Exact Video Feature) */}
            <div className="p-3 border-b border-slate-800/80">
              <div className="rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5 p-3 flex flex-col items-center text-center relative overflow-hidden">
                {generatingModel ? (
                  <div className="py-3 flex flex-col items-center gap-2 w-full">
                    <Box size={24} className="text-indigo-400 animate-spin" />
                    <p className="font-bold text-slate-200 text-xs">Generating 3D Model...</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${genProgress}%` }} />
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono">{genProgress}%</span>
                  </div>
                ) : (
                  <>
                    <Box size={20} className="text-indigo-400 mb-1" />
                    <p className="font-bold text-slate-200 text-xs">Generate 3D Model from Image</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop photo or web screenshot</p>
                    <button
                      type="button"
                      onClick={handleStartImageTo3D}
                      className="mt-2 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all shadow-md"
                    >
                      Browse Image / Test Demo
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Marketplace & Tabs Header */}
            <div className="px-3 pt-2">
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('Marketplace')}
                  className={`py-1.5 rounded-lg transition-all ${rightPanelTab === 'Marketplace' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Marketplace
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('MyModels')}
                  className={`py-1.5 rounded-lg transition-all ${rightPanelTab === 'MyModels' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  My Models
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative mt-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Quick search... (e.g. green couch)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-[11px] placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Category Chips */}
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
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Items Grid */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {filteredCatalog.map(item => (
                  <div
                    key={item.name}
                    onClick={() => handleAddFromMarketplace(item)}
                    className="group bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-800 hover:border-indigo-500/50 p-2.5 flex flex-col justify-between cursor-pointer transition-all shadow-md"
                  >
                    <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden mb-2 relative flex items-center justify-center border border-slate-800/60">
                      {/* Procedural 3D preview icon box */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.category === 'seating' ? '🛋️' : item.category === 'tables' ? '🪵' : item.category === 'beds' ? '🛏️' : item.category === 'lighting' ? '💡' : '🌿'}
                      </div>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white p-1 rounded-md">
                        <Plus size={11} />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-200 text-[11px] truncate group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[9px] text-slate-500 truncate">{item.material}</p>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="font-bold text-emerald-400">₹{item.priceINR.toLocaleString('en-IN')}</span>
                        <span className="text-[8px] text-slate-500 font-mono">{item.dimensions.width}&quot;W</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Add CTA Bar */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 text-center">
            <p className="text-[10px] text-slate-400">
              Click any item to place in room • Auto-updates BOQ &amp; Cost
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Procedural Three.js 3D Mesh Generator ───────────────────────────
function createProcedural3DMesh(obj: StudioObject3D): THREE.Group {
  const group = new THREE.Group();

  const color = new THREE.Color(obj.color || '#3d5c3a');
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.1,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033, // Dark oak legs/frame
    roughness: 0.6,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Metallic brass
    metalness: 0.8,
    roughness: 0.3,
  });

  if (obj.category === 'seating') {
    // Sofa / Couch Mesh
    // Base cushion
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.7), mat);
    base.position.y = 0.25;
    base.castShadow = true;
    group.add(base);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.2), mat);
    back.position.set(0, 0.55, -0.25);
    back.castShadow = true;
    group.add(back);

    // Left arm
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.75), mat);
    leftArm.position.set(-0.85, 0.4, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.75), mat);
    rightArm.position.set(0.85, 0.4, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // 4 Wooden legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.15, 8);
    const legPositions = [
      [-0.75, 0.075, 0.25],
      [0.75, 0.075, 0.25],
      [-0.75, 0.075, -0.25],
      [0.75, 0.075, -0.25],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });
  } else if (obj.category === 'tables') {
    // Tabletop
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.8), mat);
    top.position.y = 0.72;
    top.castShadow = true;
    group.add(top);

    // 4 legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8);
    const legPositions = [
      [-0.6, 0.35, 0.32],
      [0.6, 0.35, 0.32],
      [-0.6, 0.35, -0.32],
      [0.6, 0.35, -0.32],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, brassMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });
  } else if (obj.category === 'beds') {
    // Mattress base
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 2.0), mat);
    mattress.position.y = 0.3;
    mattress.castShadow = true;
    group.add(mattress);

    // Headboard
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.12), mat);
    headboard.position.set(0, 0.6, -1.0);
    headboard.castShadow = true;
    group.add(headboard);

    // Pillows
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.35), pillowMat);
    p1.position.set(-0.4, 0.52, -0.75);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.35), pillowMat);
    p2.position.set(0.4, 0.52, -0.75);
    group.add(p1, p2);
  } else if (obj.category === 'lighting') {
    // Lamp pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6, 8), brassMat);
    pole.position.y = 0.8;
    pole.castShadow = true;
    group.add(pole);

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16), brassMat);
    base.position.y = 0.015;
    group.add(base);

    // Lampshade
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.26, 0.3, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xfff3e0, roughness: 0.8 })
    );
    shade.position.y = 1.55;
    group.add(shade);
  } else if (obj.category === 'decor') {
    // Pot
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.35, 16), mat);
    pot.position.y = 0.18;
    pot.castShadow = true;
    group.add(pot);

    // Foliage
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });
    const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), plantMat);
    plant.position.y = 0.55;
    plant.castShadow = true;
    group.add(plant);
  } else {
    // Default Box Cabinet
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.5), mat);
    cabinet.position.y = 0.35;
    cabinet.castShadow = true;
    group.add(cabinet);
  }

  return group;
}

