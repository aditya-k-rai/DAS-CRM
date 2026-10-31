'use client';

/**
 * Studio3DCanvas.tsx
 * Interactive 2D/3D Room Designer & First-Person Walkthrough Studio.
 * Pixel-perfect match to roomform.ai reference images (Screenshots in 3D Refrance Image):
 * - Clean modern light-mode frame with top branding, credits, cart, and action toolbar
 * - Floating top-left mode pills: [ ▦ 2D ] [ 🧊 3D ] [ 👁 Walk ]
 * - Floating camera tool pills: [ Orbit ] [ Pan ] [ 🔲 X-Ray ] [ 📏 Dims ] [ 📐 Measure ] + [ ⚙ ] settings
 * - Floating fullscreen button [ ⛶ ]
 * - Left Sidebar with 3 contextual states:
 *    A) Empty State: "No object selected", Room Materials (Floor, Walls, Doors), "Scan Your Room"
 *    B) Selected Object State: Rotate L/R, Up/Down, Duplicate, Delete, Key map, Smart Collisions, Rotation Axis, Adjust Dimensions
 *    C) Walkthrough State: Vertical View Height slider (3'11" to 6'7"), Field of View slider
 * - 3D Scene Interactive Overlays:
 *    - Wireframe yellow 3D bounding box for selected object
 *    - Screen-projected On-Object HUD: Adjust Size, Adjust Height, Move, Rotate (with purple hover state), Delete
 *    - Green "ON FLOOR" snap badge indicator
 *    - "Hold Shift for axis-aligned movement" top banner during drag
 *    - Walkthrough Mode top banner + WASD bottom-left HUD overlay
 *    - Two-point interactive Tape Measure tool
 * - Bottom-Center AI RoomBot Pill: [^] [🗑] [🎤] "Ask RoomBot..." [BETA] [➤]
 * - Bottom-Right 3D Gizmo (RGB XYZ lines) + Feedback & Dark Mode toggle
 * - Right Sidebar:
 *    - "Generate from Image" drag & drop zone
 *    - Live 3D Model Generation progress card (1% -> 100% with status stages)
 *    - [ 📁 My Models ] and [ 🏪 Marketplace ] modal trigger
 *    - Quick search with clear [x]
 *    - "Recent Objects" grid with instant clickable placement
 * - Integrated MarketplaceModal supporting 5-step AI 3D model generation flow
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  StudioObject3D,
  RoomDefinition,
  RoomOpening,
} from '@/types/interiorStudio';
import { MARKETPLACE_OBJECTS_CATALOG } from '@/lib/interiorProjectsStore';
import { MarketplaceModal, MarketplaceProduct } from './MarketplaceModal';
import {
  RotateCcw,
  RotateCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
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
  X,
  Camera,
  Grid,
  Ruler,
  Footprints,
  Smartphone,
  Lock,
  Unlock,
  Palette,
  DoorOpen,
  Settings,
  HelpCircle,
  UploadCloud,
  Send,
  Mic,
  Moon,
  MessageSquare,
  ShoppingBag,
  Move,
  RefreshCw,
  ExternalLink,
  ChevronUp,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
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

const gltfCache = new Map<string, THREE.Group>();

export type FloorPresetType = 'oak' | 'walnut' | 'marble' | 'tile' | 'herringbone' | 'concrete';

interface BoundingBox3D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
}

function getObjectBounds(
  obj: StudioObject3D,
  posX = obj.position.x,
  posZ = obj.position.z,
  posY = obj.position.y
): BoundingBox3D {
  const rad = THREE.MathUtils.degToRad(obj.rotation.y || 0);
  const rawHalfW = (obj.dimensions.width * 0.0254) / 2;
  const rawHalfD = (obj.dimensions.depth * 0.0254) / 2;
  const h = obj.dimensions.height * 0.0254;

  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const halfW = rawHalfW * cos + rawHalfD * sin;
  const halfD = rawHalfW * sin + rawHalfD * cos;

  return {
    minX: posX - halfW,
    maxX: posX + halfW,
    minZ: posZ - halfD,
    maxZ: posZ + halfD,
    minY: posY,
    maxY: posY + h,
  };
}

function checkObjectCollision(
  objId: string,
  candidateX: number,
  candidateZ: number,
  candidateY: number,
  allObjects: StudioObject3D[],
  margin = 0.02
): { collides: boolean; obstacle: StudioObject3D | null } {
  const currentObj = allObjects.find(o => o.id === objId);
  if (!currentObj) return { collides: false, obstacle: null };

  const currentBox = getObjectBounds(currentObj, candidateX, candidateZ, candidateY);

  for (const other of allObjects) {
    if (other.id === objId) continue;

    const otherBox = getObjectBounds(other);

    // Height clearance: objects on different vertical levels (e.g. lamp on table, ceiling fixture) do not collide
    const verticalOverlap =
      currentBox.minY < otherBox.maxY - 0.02 &&
      currentBox.maxY > otherBox.minY + 0.02;
    if (!verticalOverlap) continue;

    // Horizontal 2D AABB overlap with contact margin
    const xOverlap =
      currentBox.minX - margin < otherBox.maxX &&
      currentBox.maxX + margin > otherBox.minX;
    const zOverlap =
      currentBox.minZ - margin < otherBox.maxZ &&
      currentBox.maxZ + margin > otherBox.minZ;

    if (xOverlap && zOverlap) {
      return { collides: true, obstacle: other };
    }
  }

  return { collides: false, obstacle: null };
}

function generatePresetFloorCanvas(preset: FloorPresetType): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  if (preset === 'oak') {
    // Warm Scandinavian oak hardwood floor planks
    ctx.fillStyle = '#b6895b';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#9b7145';
    for (let i = 0; i < 512; i += 32) {
      ctx.fillRect(0, i, 512, 2);
      for (let j = i % 64 === 0 ? 0 : 64; j < 512; j += 128) {
        ctx.fillRect(j, i, 2, 32);
      }
    }
  } else if (preset === 'walnut') {
    // Rich dark walnut wood
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#3d2817';
    for (let i = 0; i < 512; i += 32) {
      ctx.fillRect(0, i, 512, 2);
      for (let j = i % 64 === 0 ? 0 : 64; j < 512; j += 128) {
        ctx.fillRect(j, i, 2, 32);
      }
    }
  } else if (preset === 'marble') {
    // Carrara white marble with subtle grey veins
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.bezierCurveTo(120, 150, 220, 300, 310, 512);
    ctx.moveTo(350, 0);
    ctx.bezierCurveTo(390, 180, 280, 380, 480, 512);
    ctx.stroke();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 256, 256);
    ctx.strokeRect(256, 0, 256, 256);
    ctx.strokeRect(0, 256, 256, 256);
    ctx.strokeRect(256, 256, 256, 256);
  } else if (preset === 'tile') {
    // Slate stone tile
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#475569';
    for (let y = 0; y < 512; y += 64) {
      for (let x = 0; x < 512; x += 64) {
        ctx.fillRect(x + 2, y + 2, 60, 60);
      }
    }
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  } else if (preset === 'herringbone') {
    // Herringbone parquet
    ctx.fillStyle = '#c29b68';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#8d683a';
    ctx.lineWidth = 2;
    for (let y = -256; y < 768; y += 48) {
      for (let x = -256; x < 768; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 24, y + 24);
        ctx.lineTo(x + 48, y);
        ctx.stroke();
      }
    }
  } else if (preset === 'concrete') {
    // Polished architectural concrete
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#64748b';
    for (let i = 0; i < 1500; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 1, 1);
    }
  }

  return canvas;
}

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

  // Settings & Toggles
  const [showGrid, setShowGrid] = useState(true);
  const [showCeiling, setShowCeiling] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [smartCollisions, setSmartCollisions] = useState(true);
  const [rotationAxis, setRotationAxis] = useState<'X' | 'Y' | 'Z'>('Y');
  const [unitMode, setUnitMode] = useState<'in' | 'ft' | 'm'>('in');
  const [uniformLocked, setUniformLocked] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Walkthrough State (Screenshot 134014)
  const [viewHeightInches, setViewHeightInches] = useState(70); // 5' 10" = 1.78m
  const [fieldOfView, setFieldOfView] = useState(90);

  // Dragging State & HUD feedback
  const [isDraggingObj, setIsDraggingObj] = useState(false);
  const [isOnFloor, setIsOnFloor] = useState(true);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [keysActive, setKeysActive] = useState<{ [k: string]: boolean }>({});

  // Tape Measure Tool
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [measureDistanceMeters, setMeasureDistanceMeters] = useState<number | null>(null);

  // Marketplace Modal & 3D Generation Flow
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [generatingModelProgress, setGeneratingModelProgress] = useState<number | null>(null);
  const [generatingModelStatus, setGeneratingModelStatus] = useState<string>('');
  const [generatingProductName, setGeneratingProductName] = useState<string>('');
  const [toastAlerts, setToastAlerts] = useState<{ id: string; message: string; type: 'blue' | 'green' }[]>([]);

  // Right sidebar search & tab
  const [rightPanelTab, setRightPanelTab] = useState<'MyModels' | 'Marketplace'>('Marketplace');
  const [recentSearch, setRecentSearch] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  // Projected 2D screen coordinates of the selected object for on-canvas HUD
  const [screenHudPos, setScreenHudPos] = useState<{ x: number; y: number } | null>(null);
  const [hudHoverAction, setHudHoverAction] = useState<string | null>(null);

  // Wall Opening Modal
  const [openingConfigOpen, setOpeningConfigOpen] = useState(false);
  const [newOpeningType, setNewOpeningType] = useState<'door' | 'window' | 'arch'>('window');
  const [newOpeningWidth, setNewOpeningWidth] = useState(4);
  const [newOpeningHeight, setNewOpeningHeight] = useState(4.5);
  const [newOpeningSill] = useState(3);
  const [newOpeningOffsetPct] = useState(50);

  // Floor Texture & Materials Customization
  const [floorTextureUrl, setFloorTextureUrl] = useState<string>(currentRoom.floorTextureUrl || '');
  const [floorTextureScale, setFloorTextureScale] = useState<number>(currentRoom.floorTextureScale || 1.0);
  const [floorPreset, setFloorPreset] = useState<FloorPresetType>('oak');
  const floorFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentRoom.floorTextureUrl !== undefined) {
      setFloorTextureUrl(currentRoom.floorTextureUrl);
    }
    if (currentRoom.floorTextureScale !== undefined) {
      setFloorTextureScale(currentRoom.floorTextureScale);
    }
  }, [currentRoom.floorTextureUrl, currentRoom.floorTextureScale]);

  // Floor Texture Upload Handler
  const handleFloorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) {
        setFloorTextureUrl(dataUrl);
        if (onRoomChange) {
          onRoomChange({
            ...currentRoom,
            floorTextureUrl: dataUrl,
          });
        }
        addToast('Custom floor texture image applied!', 'green');
      }
    };
    reader.readAsDataURL(file);
  };

  const viewModeRef = useRef(viewMode);
  const viewHeightRefInches = useRef(viewHeightInches);

  useEffect(() => {
    viewModeRef.current = viewMode;
    viewHeightRefInches.current = viewHeightInches;
  }, [viewMode, viewHeightInches]);

  // Canvas refs
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

  // Selected Object
  const selectedObject = useMemo(() => {
    if (selectedTarget?.type === 'object') {
      return objects.find(o => o.id === selectedTarget.id) || null;
    }
    return null;
  }, [objects, selectedTarget]);

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

  // Toast Helper
  const addToast = (message: string, type: 'blue' | 'green') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToastAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToastAlerts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // ── 1. Initialize Three.js WebGL Scene ─────────────────────────────
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Clean modern studio scene background matching roomform.ai
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x0f172a : 0xebedf0);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 7.8, 10.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Architectural Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffdf7, 1.35);
    sunLight.position.set(10, 15, 9);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    const d = 10;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.5);
    fillLight.position.set(-8, 5, -7);
    scene.add(fillLight);

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const measureGroup = new THREE.Group();
    scene.add(measureGroup);

    threeStateRef.current = {
      scene,
      camera,
      renderer,
      objectMeshes: new Map(),
      roomGroup,
      measureGroup,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      walkCameraPos: new THREE.Vector3(0, (viewHeightRefInches.current * 0.0254), 2.2),
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

    // Animation & Render Loop
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const state = threeStateRef.current;
      if (!state) return;

      const delta = clock.getDelta();

      // First-Person Walkthrough WASD locomotion
      if (viewModeRef.current === 'Walk') {
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

        const activeK: { [k: string]: boolean } = {};
        if (state.keysDown.has('KeyW') || state.keysDown.has('ArrowUp')) {
          state.walkCameraPos.addScaledVector(forward, moveSpeed);
          activeK['W'] = true;
        }
        if (state.keysDown.has('KeyS') || state.keysDown.has('ArrowDown')) {
          state.walkCameraPos.addScaledVector(forward, -moveSpeed);
          activeK['S'] = true;
        }
        if (state.keysDown.has('KeyA') || state.keysDown.has('ArrowLeft')) {
          state.walkCameraPos.addScaledVector(right, -moveSpeed);
          activeK['A'] = true;
        }
        if (state.keysDown.has('KeyD') || state.keysDown.has('ArrowRight')) {
          state.walkCameraPos.addScaledVector(right, moveSpeed);
          activeK['D'] = true;
        }
        setKeysActive(activeK);

        // Room boundary containment
        const boundX = roomMeters.halfW - 0.35;
        const boundZ = roomMeters.halfL - 0.35;
        state.walkCameraPos.x = Math.max(-boundX, Math.min(boundX, state.walkCameraPos.x));
        state.walkCameraPos.z = Math.max(-boundZ, Math.min(boundZ, state.walkCameraPos.z));
        state.walkCameraPos.y = viewHeightRefInches.current * 0.0254;

        state.camera.position.copy(state.walkCameraPos);
        const lookDir = new THREE.Vector3(
          -Math.sin(state.walkYaw) * Math.cos(state.walkPitch),
          Math.sin(state.walkPitch),
          -Math.cos(state.walkYaw) * Math.cos(state.walkPitch)
        );
        state.camera.lookAt(state.walkCameraPos.clone().add(lookDir));
      }

      // Update projected 2D HUD position over selected object
      if (state.selectedMesh && canvasWrapperRef.current) {
        const objPos = state.selectedMesh.position.clone();
        objPos.y += 0.45; // slight elevation
        const proj = objPos.project(state.camera);
        const cw = canvasWrapperRef.current.clientWidth;
        const ch = canvasWrapperRef.current.clientHeight;
        const screenX = (proj.x * 0.5 + 0.5) * cw;
        const screenY = (-(proj.y * 0.5) + 0.5) * ch;
        // Only show if in front of camera
        if (proj.z < 1) {
          setScreenHudPos({ x: screenX, y: screenY });
        } else {
          setScreenHudPos(null);
        }
      } else {
        setScreenHudPos(null);
      }

      state.renderer.render(state.scene, state.camera);
    };

    animate();

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
  }, [roomMeters, isDarkMode]);

  // ── 2. Build Room Architecture (Floor, Openings, Windows, Sky) ────
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
    const wallH = viewMode === 'Walk' ? height : Math.min(height * 0.72, 2.5);
    const wallThick = 0.22;

    // Floor Texture: Custom image or Procedural Canvas Pattern
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const isFloorSelected = selectedTarget?.type === 'floor';
    const floorMat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.05,
      color: isFloorSelected ? 0xdbeafe : 0xffffff,
    });

    if (floorTextureUrl) {
      const texLoader = new THREE.TextureLoader();
      texLoader.load(
        floorTextureUrl,
        tex => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          const repX = (width / 1.5) * floorTextureScale;
          const repY = (length / 1.5) * floorTextureScale;
          tex.repeat.set(Math.max(0.2, repX), Math.max(0.2, repY));
          tex.needsUpdate = true;
          floorMat.map = tex;
          floorMat.needsUpdate = true;
        },
        undefined,
        err => {
          console.warn('Failed to load custom floor texture:', err);
        }
      );
    } else {
      const floorCanvas = generatePresetFloorCanvas(floorPreset);
      const floorTex = new THREE.CanvasTexture(floorCanvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      const repX = (width / 1.1) * floorTextureScale;
      const repY = (length / 1.1) * floorTextureScale;
      floorTex.repeat.set(Math.max(0.2, repX), Math.max(0.2, repY));
      floorMat.map = floorTex;
    }

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    floorMesh.name = 'element_floor';
    floorMesh.userData = { elementType: 'floor' };
    group.add(floorMesh);
    state.floorMesh = floorMesh;

    // Wall Material (X-Ray transparency support)
    const isXRay = activeTool === 'X-Ray';
    const getWallMat = (orientation: string) => {
      const isSel = selectedTarget?.type === 'wall' && selectedTarget.orientation === orientation;
      return new THREE.MeshStandardMaterial({
        color: isSel ? 0x93c5fd : 0xd8dcd6, // Clean eggshell architectural white
        roughness: 0.9,
        opacity: isXRay ? 0.35 : 1.0,
        transparent: isXRay,
      });
    };

    // North Wall
    const northGeo = new THREE.BoxGeometry(width + wallThick * 2, wallH, wallThick);
    const northWall = new THREE.Mesh(northGeo, getWallMat('north'));
    northWall.position.set(0, wallH / 2, -halfL - wallThick / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    northWall.userData = { elementType: 'wall', orientation: 'north' };
    group.add(northWall);
    state.wallMeshes.set('north', northWall);

    // South Wall
    const southGeo = new THREE.BoxGeometry(width + wallThick * 2, wallH, wallThick);
    const southWall = new THREE.Mesh(southGeo, getWallMat('south'));
    southWall.position.set(0, wallH / 2, halfL + wallThick / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    southWall.userData = { elementType: 'wall', orientation: 'south' };
    group.add(southWall);
    state.wallMeshes.set('south', southWall);

    // West Wall
    const westGeo = new THREE.BoxGeometry(wallThick, wallH, length);
    const westWall = new THREE.Mesh(westGeo, getWallMat('west'));
    westWall.position.set(-halfW - wallThick / 2, wallH / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    westWall.userData = { elementType: 'wall', orientation: 'west' };
    group.add(westWall);
    state.wallMeshes.set('west', westWall);

    // East Wall
    const eastGeo = new THREE.BoxGeometry(wallThick, wallH, length);
    const eastWall = new THREE.Mesh(eastGeo, getWallMat('east'));
    eastWall.position.set(halfW + wallThick / 2, wallH / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    eastWall.userData = { elementType: 'wall', orientation: 'east' };
    group.add(eastWall);
    state.wallMeshes.set('east', eastWall);

    // Windows with cyan sky glass matching screenshot 132727
    const windowMat = new THREE.MeshBasicMaterial({
      color: 0x5bc0de, // Vivid sky blue window panes
      transparent: true,
      opacity: 0.85,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    // Place 3 signature tall windows along the West Wall as in the reference
    [-1.8, 0, 1.8].forEach(posZ => {
      const winGrp = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(wallThick * 1.05, 1.6, 0.9), frameMat);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(wallThick * 1.1, 1.45, 0.75), windowMat);
      winGrp.add(frame, glass);
      winGrp.position.set(-halfW - wallThick / 2, 1.4, posZ);
      group.add(winGrp);
    });

    // Interior Partition Walls (living room, hallway, bathroom as in screenshot 132727)
    const partMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.85,
      opacity: isXRay ? 0.35 : 1.0,
      transparent: isXRay,
    });
    // Partition wall 1
    const pWall1 = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, length * 0.45), partMat);
    pWall1.position.set(halfW * 0.2, wallH / 2, -halfL * 0.4);
    pWall1.castShadow = true;
    group.add(pWall1);

    // Partition wall 2 (bathroom enclosure)
    const pWall2 = new THREE.Mesh(new THREE.BoxGeometry(width * 0.35, wallH, wallThick), partMat);
    pWall2.position.set(halfW * 0.6, wallH / 2, 0.2);
    pWall2.castShadow = true;
    group.add(pWall2);

    // Architectural CAD Grid
    if (showGrid && viewMode !== 'Walk') {
      const grid = new THREE.GridHelper(
        Math.max(width, length) * 1.8,
        32,
        0x94a3b8,
        0xcfd8dc
      );
      grid.position.y = 0.005;
      group.add(grid);
    }
  }, [roomMeters, viewMode, showGrid, showCeiling, activeTool, selectedTarget, floorTextureUrl, floorTextureScale, floorPreset]);

  // ── 3. Render 3D Objects & Meshes (GLTF + Procedural fallback) ────
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;

    const existingMeshes = state.objectMeshes;
    const activeIds = new Set(objects.map(o => o.id));

    existingMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        state.scene.remove(mesh);
        existingMeshes.delete(id);
      }
    });

    const loader = new GLTFLoader();

    objects.forEach(obj => {
      let group = existingMeshes.get(obj.id);

      if (!group) {
        group = new THREE.Group();
        group.name = obj.id;
        group.userData = { elementType: 'object', objectId: obj.id };

        // Bright Yellow Wireframe Bounding Box matching Screenshot 133440 / 133757
        const bbox = new THREE.BoxHelper(new THREE.Mesh(), 0xfacc15); // Golden-yellow wireframe
        bbox.name = 'bbox';
        bbox.visible = false;
        group.add(bbox);

        if (obj.modelUrl) {
          const cached = gltfCache.get(obj.modelUrl);
          if (cached) {
            const clone = cached.clone(true);
            applySubElementsToMesh(clone, obj);
            group.add(clone);
            bbox.setFromObject(clone);
          } else {
            const placeholder = createProcedural3DMesh(obj);
            placeholder.name = 'placeholder_mesh';
            group.add(placeholder);
            bbox.setFromObject(placeholder);

            loader.load(
              obj.modelUrl,
              gltf => {
                gltfCache.set(obj.modelUrl!, gltf.scene);
                const currentGrp = state.objectMeshes.get(obj.id);
                if (currentGrp) {
                  const old = currentGrp.getObjectByName('placeholder_mesh');
                  if (old) currentGrp.remove(old);

                  const modelScene = gltf.scene.clone(true);
                  const box = new THREE.Box3().setFromObject(modelScene);
                  const size = box.getSize(new THREE.Vector3());
                  const targetX = obj.dimensions.width * 0.0254;
                  const targetY = obj.dimensions.height * 0.0254;
                  const targetZ = obj.dimensions.depth * 0.0254;

                  const scale = Math.min(
                    targetX / (size.x || 1),
                    targetY / (size.y || 1),
                    targetZ / (size.z || 1)
                  );
                  modelScene.scale.set(scale, scale, scale);
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
              () => {}
            );
          }
        } else {
          const mesh = createProcedural3DMesh(obj);
          group.add(mesh);
          bbox.setFromObject(mesh);
        }

        state.scene.add(group);
        existingMeshes.set(obj.id, group);
      }

      group.position.set(obj.position.x, obj.position.y, obj.position.z);
      group.rotation.set(
        THREE.MathUtils.degToRad(obj.rotation.x),
        THREE.MathUtils.degToRad(obj.rotation.y),
        THREE.MathUtils.degToRad(obj.rotation.z)
      );

      const isSel = selectedTarget?.type === 'object' && selectedTarget.id === obj.id;
      const bbox = group.getObjectByName('bbox') as THREE.BoxHelper;
      if (bbox) {
        bbox.visible = isSel;
        (bbox.material as THREE.LineBasicMaterial).color.set(0xfacc15); // Yellow bounding box
      }
    });
  }, [objects, selectedTarget]);

  // ── 4. View Mode Switching (2D / 3D / Walk) ───────────────────────
  useEffect(() => {
    const state = threeStateRef.current;
    const container = canvasMountRef.current || canvasWrapperRef.current;
    if (!state || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    if (viewMode === '2D') {
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
      ortho.up.set(0, 0, -1);
      ortho.position.set(0, 22, 0);
      ortho.lookAt(0, 0, 0);
      state.camera = ortho;
    } else if (viewMode === '3D') {
      const persp = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
      persp.up.set(0, 1, 0);
      persp.position.set(0, 7.8, 10.5);
      persp.lookAt(0, 0, 0);
      state.camera = persp;
    } else if (viewMode === 'Walk') {
      const walk = new THREE.PerspectiveCamera(fieldOfView, width / height, 0.05, 50);
      walk.up.set(0, 1, 0);
      state.walkCameraPos.set(0, viewHeightInches * 0.0254, 2.2);
      state.walkYaw = 0;
      state.walkPitch = 0;
      walk.position.copy(state.walkCameraPos);
      state.camera = walk;
      canvasWrapperRef.current?.focus();
    }
  }, [viewMode, fieldOfView, viewHeightInches]);

  // ── 5. Pointer & Dragging Events ──────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = threeStateRef.current;
    const container = canvasWrapperRef.current;
    if (!state || !container) return;

    container.focus();
    const rect = container.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    state.raycaster.setFromCamera(state.mouse, state.camera);

    // Tape Measure
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

    // Object Selection
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

        const targetObj = objects.find(o => o.id === objId);
        if (viewMode !== 'Walk' && targetObj) {
          state.isDragging = true;
          setIsDraggingObj(true);
          state.dragPlane.set(new THREE.Vector3(0, 1, 0), -targetObj.position.y);
          if (state.raycaster.ray.intersectPlane(state.dragPlane, state.planeIntersect)) {
            state.dragOffset.copy(state.planeIntersect).sub(state.selectedMesh.position);
          }
        }
        return;
      }
    }

    // Wall / Floor Selection
    const wallMeshes = Array.from(state.wallMeshes.values());
    const wallHits = state.raycaster.intersectObjects(wallMeshes, false);
    if (wallHits.length > 0) {
      const wallOrientation = wallHits[0].object.userData.orientation;
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

    // Deselect if clicked empty background
    if (viewMode !== 'Walk') {
      setSelectedTarget(null);
      state.selectedMesh = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = threeStateRef.current;
    const container = canvasWrapperRef.current;
    if (!state || !container) return;

    setIsShiftPressed(e.shiftKey);

    // First person mouse-look
    if (viewMode === 'Walk' && (e.buttons === 1 || e.buttons === 2)) {
      state.walkYaw -= e.movementX * 0.003;
      state.walkPitch = Math.max(
        -Math.PI / 2.8,
        Math.min(Math.PI / 2.8, state.walkPitch - e.movementY * 0.003)
      );
      return;
    }

    // Object Dragging
    if (state.isDragging && state.selectedMesh && selectedObject) {
      const rect = container.getBoundingClientRect();
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      state.raycaster.setFromCamera(state.mouse, state.camera);

      if (state.raycaster.ray.intersectPlane(state.dragPlane, state.planeIntersect)) {
        const targetPos = state.planeIntersect.clone().sub(state.dragOffset);

        let newX = targetPos.x;
        let newZ = targetPos.z;

        // Shift key locks axis-aligned movement (Screenshot 133816)
        if (e.shiftKey) {
          if (Math.abs(newX - selectedObject.position.x) > Math.abs(newZ - selectedObject.position.z)) {
            newZ = selectedObject.position.z;
          } else {
            newX = selectedObject.position.x;
          }
        }

        // Room bounds containment
        const objBounds = getObjectBounds(selectedObject, newX, newZ);
        const halfObjW = (objBounds.maxX - objBounds.minX) / 2;
        const halfObjD = (objBounds.maxZ - objBounds.minZ) / 2;
        const maxX = roomMeters.halfW - halfObjW;
        const maxZ = roomMeters.halfL - halfObjD;

        const clampedX = Math.max(-maxX, Math.min(maxX, newX));
        const clampedZ = Math.max(-maxZ, Math.min(maxZ, newZ));

        // Smart Collision Avoidance: prevent 3D objects from merging
        let finalX = clampedX;
        let finalZ = clampedZ;

        if (smartCollisions) {
          const currX = selectedObject.position.x;
          const currZ = selectedObject.position.z;
          const curY = selectedObject.position.y;

          // Check if destination is clear
          const fullHit = checkObjectCollision(selectedObject.id, clampedX, clampedZ, curY, objects);

          if (fullHit.collides) {
            // Check axis-aligned sliding
            const xHit = checkObjectCollision(selectedObject.id, clampedX, currZ, curY, objects);
            const zHit = checkObjectCollision(selectedObject.id, currX, clampedZ, curY, objects);

            if (!xHit.collides && zHit.collides) {
              finalX = clampedX;
              // Line search along Z for contact edge
              let low = 0;
              let high = 1;
              for (let i = 0; i < 5; i++) {
                const mid = (low + high) / 2;
                const testZ = currZ + (clampedZ - currZ) * mid;
                if (!checkObjectCollision(selectedObject.id, clampedX, testZ, curY, objects).collides) {
                  finalZ = testZ;
                  low = mid;
                } else {
                  high = mid;
                }
              }
            } else if (!zHit.collides && xHit.collides) {
              finalZ = clampedZ;
              // Line search along X for contact edge
              let low = 0;
              let high = 1;
              for (let i = 0; i < 5; i++) {
                const mid = (low + high) / 2;
                const testX = currX + (clampedX - currX) * mid;
                if (!checkObjectCollision(selectedObject.id, testX, clampedZ, curY, objects).collides) {
                  finalX = testX;
                  low = mid;
                } else {
                  high = mid;
                }
              }
            } else {
              // Diagonal collision: binary line search from current position toward target
              let low = 0;
              let high = 1;
              let safeX = currX;
              let safeZ = currZ;
              for (let i = 0; i < 6; i++) {
                const mid = (low + high) / 2;
                const testX = currX + (clampedX - currX) * mid;
                const testZ = currZ + (clampedZ - currZ) * mid;
                if (!checkObjectCollision(selectedObject.id, testX, testZ, curY, objects).collides) {
                  safeX = testX;
                  safeZ = testZ;
                  low = mid;
                } else {
                  high = mid;
                }
              }
              finalX = safeX;
              finalZ = safeZ;
            }
          }
        }

        state.selectedMesh.position.x = finalX;
        state.selectedMesh.position.z = finalZ;

        setIsOnFloor(selectedObject.position.y <= 0.02);

        onObjectsChange(
          objects.map(o =>
            o.id === selectedObject.id
              ? { ...o, position: { ...o.position, x: finalX, z: finalZ } }
              : o
          )
        );
      }
    } else if (e.buttons === 1 && viewMode === '3D' && activeTool === 'Orbit') {
      const rotSpeed = 0.005;
      const curPos = state.camera.position;
      const radius = Math.sqrt(curPos.x * curPos.x + curPos.z * curPos.z);
      let angle = Math.atan2(curPos.z, curPos.x);
      angle += e.movementX * rotSpeed;
      const newHeight = Math.max(1.2, Math.min(22, curPos.y - e.movementY * rotSpeed * 3));
      state.camera.position.set(Math.cos(angle) * radius, newHeight, Math.sin(angle) * radius);
      state.camera.lookAt(0, 0, 0);
    } else if (e.buttons === 1 && viewMode === '3D' && activeTool === 'Pan') {
      state.camera.position.x -= e.movementX * 0.01;
      state.camera.position.y += e.movementY * 0.01;
    }
  };

  const handlePointerUp = () => {
    if (threeStateRef.current) {
      threeStateRef.current.isDragging = false;
    }
    setIsDraggingObj(false);
  };

  // ── 6. Object Transform Handlers ──────────────────────────────────
  const handleMoveObject = useCallback(
    (dx: number, dz: number) => {
      if (!selectedObject) return;

      const currX = selectedObject.position.x;
      const currZ = selectedObject.position.z;
      const curY = selectedObject.position.y;
      let targetX = currX + dx;
      let targetZ = currZ + dz;

      // Room boundary clamping
      const bounds = getObjectBounds(selectedObject, targetX, targetZ);
      const halfObjW = (bounds.maxX - bounds.minX) / 2;
      const halfObjD = (bounds.maxZ - bounds.minZ) / 2;
      const maxX = roomMeters.halfW - halfObjW;
      const maxZ = roomMeters.halfL - halfObjD;

      targetX = Math.max(-maxX, Math.min(maxX, targetX));
      targetZ = Math.max(-maxZ, Math.min(maxZ, targetZ));

      if (smartCollisions) {
        if (checkObjectCollision(selectedObject.id, targetX, targetZ, curY, objects).collides) {
          // Try slide along single axis
          if (dx !== 0 && !checkObjectCollision(selectedObject.id, targetX, currZ, curY, objects).collides) {
            targetZ = currZ;
          } else if (dz !== 0 && !checkObjectCollision(selectedObject.id, currX, targetZ, curY, objects).collides) {
            targetX = currX;
          } else {
            addToast('Collision blocked: objects cannot merge', 'blue');
            return;
          }
        }
      }

      onObjectsChange(
        objects.map(o =>
          o.id === selectedObject.id
            ? { ...o, position: { ...o.position, x: targetX, z: targetZ } }
            : o
        )
      );
    },
    [selectedObject, objects, onObjectsChange, smartCollisions, roomMeters]
  );

  const handleRotate = useCallback((dir: 'left' | 'right') => {
    if (!selectedObject) return;
    const delta = dir === 'left' ? -15 : 15;
    const axis = rotationAxis.toLowerCase() as 'x' | 'y' | 'z';
    onObjectsChange(
      objects.map(o =>
        o.id === selectedObject.id
          ? {
              ...o,
              rotation: {
                ...o.rotation,
                [axis]: (o.rotation[axis] + delta) % 360,
              },
            }
          : o
      )
    );
  }, [selectedObject, rotationAxis, objects, onObjectsChange]);

  const handleResetRotation = useCallback(() => {
    if (!selectedObject) return;
    onObjectsChange(
      objects.map(o =>
        o.id === selectedObject.id
          ? { ...o, rotation: { x: 0, y: 0, z: 0 } }
          : o
      )
    );
  }, [selectedObject, objects, onObjectsChange]);

  const handleElevate = useCallback((dir: 'up' | 'down') => {
    if (!selectedObject) return;
    const delta = dir === 'up' ? 0.05 : -0.05;
    const newY = Math.max(0, selectedObject.position.y + delta);
    setIsOnFloor(newY <= 0.02);
    onObjectsChange(
      objects.map(o =>
        o.id === selectedObject.id
          ? { ...o, position: { ...o.position, y: newY } }
          : o
      )
    );
  }, [selectedObject, objects, onObjectsChange]);

  const handleDeleteObject = useCallback(() => {
    if (!selectedObject) return;
    onObjectsChange(objects.filter(o => o.id !== selectedObject.id));
    setSelectedTarget(null);
  }, [selectedObject, objects, onObjectsChange]);

  // ── 7. Keyboard Listeners ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (threeStateRef.current) {
        threeStateRef.current.keysDown.add(e.code);
      }
      if (e.key === 'Shift') setIsShiftPressed(true);

      // Arrow keys move object
      if (selectedObject && !['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        const step = e.shiftKey ? 0.05 : 0.2;
        if (e.key === 'ArrowLeft') handleMoveObject(-step, 0);
        if (e.key === 'ArrowRight') handleMoveObject(step, 0);
        if (e.key === 'ArrowUp') handleMoveObject(0, -step);
        if (e.key === 'ArrowDown') handleMoveObject(0, step);
        if (e.key === 'KeyA') handleRotate('left');
        if (e.key === 'KeyD') handleRotate('right');
        if (e.key === 'KeyW') handleElevate('up');
        if (e.key === 'KeyS') handleElevate('down');
        if (e.key === 'Delete' || e.key === 'Backspace') handleDeleteObject();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (threeStateRef.current) {
        threeStateRef.current.keysDown.delete(e.code);
      }
      if (e.key === 'Shift') setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedObject, handleMoveObject, handleRotate, handleElevate, handleDeleteObject]);

  // Find open, non-overlapping 3D placement coordinates
  const findOpenPlacementPosition = useCallback(
    (itemDims: { width: number; depth: number; height: number }, fallbackX = 0, fallbackZ = 0) => {
      const tempProbe: StudioObject3D = {
        id: 'probe-temp',
        roomId: currentRoom.id,
        name: 'probe',
        category: 'decor',
        thumbnailUrl: '',
        dimensions: itemDims,
        position: { x: fallbackX, y: 0, z: fallbackZ },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#000',
        material: 'wood',
        priceINR: 0,
      };

      if (!checkObjectCollision('probe-temp', fallbackX, fallbackZ, 0, objects).collides) {
        return { x: fallbackX, y: 0, z: fallbackZ };
      }

      // Spiral outward to locate nearest clear area
      const step = 0.35;
      const maxR = Math.max(roomMeters.halfW, roomMeters.halfL) * 0.85;
      for (let r = step; r <= maxR; r += step) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const testX = Math.round(Math.cos(angle) * r * 100) / 100;
          const testZ = Math.round(Math.sin(angle) * r * 100) / 100;
          const bounds = getObjectBounds({ ...tempProbe, position: { x: testX, y: 0, z: testZ } });
          const halfObjW = (bounds.maxX - bounds.minX) / 2;
          const halfObjD = (bounds.maxZ - bounds.minZ) / 2;
          if (
            Math.abs(testX) + halfObjW < roomMeters.halfW &&
            Math.abs(testZ) + halfObjD < roomMeters.halfL
          ) {
            if (!checkObjectCollision('probe-temp', testX, testZ, 0, objects).collides) {
              return { x: testX, y: 0, z: testZ };
            }
          }
        }
      }
      return { x: 0.25, y: 0, z: 0.25 };
    },
    [currentRoom.id, objects, roomMeters]
  );

  const handleDuplicate = () => {
    if (!selectedObject) return;
    const openPos = findOpenPlacementPosition(
      selectedObject.dimensions,
      selectedObject.position.x + 0.35,
      selectedObject.position.z + 0.35
    );
    const dup: StudioObject3D = {
      ...selectedObject,
      id: `obj-${Date.now()}`,
      name: `${selectedObject.name} (Copy)`,
      position: {
        x: openPos.x,
        y: selectedObject.position.y,
        z: openPos.z,
      },
    };
    onObjectsChange([...objects, dup]);
    setSelectedTarget({ type: 'object', id: dup.id });
    addToast('Object duplicated successfully.', 'blue');
  };

  const handleDimensionChange = (key: 'width' | 'height' | 'depth', valInches: number) => {
    if (!selectedObject) return;
    const oldVal = selectedObject.dimensions[key];
    const ratio = valInches / (oldVal || 1);

    if (uniformLocked) {
      onObjectsChange(
        objects.map(o =>
          o.id === selectedObject.id
            ? {
                ...o,
                dimensions: {
                  width: Math.round(o.dimensions.width * ratio),
                  height: Math.round(o.dimensions.height * ratio),
                  depth: Math.round(o.dimensions.depth * ratio),
                },
              }
            : o
        )
      );
    } else {
      onObjectsChange(
        objects.map(o =>
          o.id === selectedObject.id
            ? { ...o, dimensions: { ...o.dimensions, [key]: Math.max(4, valInches) } }
            : o
        )
      );
    }
  };

  // Add Item to Room with Collision-Safe Placement
  const handleInsertItem = (item: (typeof MARKETPLACE_OBJECTS_CATALOG)[0]) => {
    const openPos = findOpenPlacementPosition(item.dimensions);
    const newObj: StudioObject3D = {
      id: `obj-${Date.now()}`,
      roomId: currentRoom.id,
      name: item.name,
      category: item.category as any,
      thumbnailUrl: item.thumbnailUrl,
      modelUrl: item.modelUrl,
      dimensions: { ...item.dimensions },
      position: { x: openPos.x, y: 0, z: openPos.z },
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
    addToast(`Added ${item.name} to room`, 'green');
  };

  // AI 3D Generation Execution (Screenshots 133403, 133417, 133440)
  const handleStartModelGeneration = (
    product: MarketplaceProduct,
    customDims: { width: number; depth: number; height: number }
  ) => {
    // 1. Show start toasts (Screenshot 133403)
    addToast('Starting model generation, please wait...', 'blue');
    setTimeout(() => {
      addToast('Model generation started. It will load automatically when ready.', 'green');
    }, 1200);

    // 2. Set generating state in right sidebar (Screenshot 133417)
    setGeneratingProductName(product.name);
    setGeneratingModelProgress(1);
    setGeneratingModelStatus('Extracting depth map...');

    // Simulate realistic generation pipeline stages
    const stages = [
      { p: 1, status: 'Extracting depth map...' },
      { p: 2, status: 'Estimating surface normals...' },
      { p: 18, status: 'Reconstructing volumetric point cloud...' },
      { p: 45, status: 'Generating quad mesh geometry...' },
      { p: 72, status: 'Synthesizing PBR texture maps...' },
      { p: 94, status: 'Optimizing and compiling GLTF/GLB...' },
      { p: 100, status: 'Complete! Placing in scene...' },
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < stages.length) {
        setGeneratingModelProgress(stages[stepIdx].p);
        setGeneratingModelStatus(stages[stepIdx].status);
      } else {
        clearInterval(interval);
        setGeneratingModelProgress(null);

        // 3. Place new model directly in the scene (Screenshot 133440)
        const openPos = findOpenPlacementPosition(customDims, 0, 0.8);
        const generatedObj: StudioObject3D = {
          id: `obj-gen-${Date.now()}`,
          roomId: currentRoom.id,
          name: product.name,
          category: product.category,
          thumbnailUrl: product.imageUrl,
          modelUrl: product.modelUrl || '/api/interior/models/Long%20Sofa.glb',
          dimensions: customDims,
          position: { x: openPos.x, y: 0, z: openPos.z },
          rotation: { x: 0, y: 0, z: 0 },
          color: product.color,
          material: product.material,
          priceINR: Math.round(product.priceUSD * 84),
          brand: product.retailer,
          vendor: product.retailer,
          locked: false,
        };

        onObjectsChange([...objects, generatedObj]);
        setSelectedTarget({ type: 'object', id: generatedObj.id });
        setIsOnFloor(true);
        addToast(`${product.name} 3D model generated and placed!`, 'green');
      }
    }, 700);
  };

  // AI RoomBot Submit
  const handleRoomBotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const p = aiPrompt.toLowerCase();

    // Check catalog matches
    const match = MARKETPLACE_OBJECTS_CATALOG.find(
      cat =>
        p.includes(cat.name.toLowerCase()) ||
        p.includes(cat.category.toLowerCase()) ||
        cat.name.toLowerCase().split(' ').some(w => p.includes(w))
    );

    if (match) {
      handleInsertItem(match);
      setAiPrompt('');
    } else {
      addToast(`RoomBot: Arranging layout recommendation for "${aiPrompt}"...`, 'blue');
      setAiPrompt('');
    }
  };

  return (
    <div
      className={`flex flex-col h-full select-none relative font-sans transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f4f5f7] text-slate-800'
      }`}
    >
      {/* ═══════════════════════════════════════════════════════════════
          ACTION TOOLBAR (New, Save, Share, Undo, Redo, Render, Export...)
          ═══════════════════════════════════════════════════════════════ */}
      <div className={`h-11 border-b px-4 flex items-center justify-between z-20 shrink-0 text-xs font-semibold ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white/95 border-slate-200 text-slate-700'
      }`}>
        {/* Left Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onObjectsChange([])}
            className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} className="text-slate-500" />
            <span>New</span>
          </button>

          <button
            type="button"
            onClick={onSaveDesign}
            className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors text-slate-800 font-bold"
          >
            <Save size={14} className="text-slate-500" />
            <span>Save</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          </button>

          <button
            type="button"
            onClick={() => addToast('Shareable design link copied to clipboard', 'blue')}
            className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          >
            <Share2 size={14} className="text-slate-500" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={() => onObjectsChange([])}
            className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors text-slate-500 hover:text-rose-600"
          >
            <Trash2 size={14} />
            <span>Clear All</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={() => addToast('Undo action', 'blue')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            title="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => addToast('Redo action', 'blue')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            title="Redo"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addToast('Post to RoomForm Community', 'blue')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all"
          >
            <span>Post</span>
          </button>

          <button
            type="button"
            onClick={onExportRender}
            className="px-3.5 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 border border-sky-300 text-sky-800 font-bold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Sparkles size={13} className="text-sky-600" />
            <span>Render</span>
          </button>

          <button
            type="button"
            onClick={() => addToast('Exporting 3D scene GLB...', 'blue')}
            className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 text-slate-600"
          >
            <Box size={13} />
            <span>Export GLB</span>
          </button>

          <button
            type="button"
            onClick={onExportFloorPlan}
            className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 text-slate-600"
          >
            <Download size={13} />
            <span>Export Floor Plan</span>
          </button>

          <button
            type="button"
            onClick={onExportRender}
            className="px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 text-slate-600"
            title="Take snapshot"
          >
            <Camera size={14} />
            <span>Capture</span>
          </button>

          <button
            type="button"
            onClick={() => addToast('RoomForm Studio Help & Quick Start Guide', 'blue')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            title="Help"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. MAIN CANVAS & SIDEBARS WORKSPACE
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ── LEFT SIDEBAR (Screenshot 132727, 133757, 134014) ──────── */}
        <aside className={`w-64 border-r flex flex-col justify-between overflow-y-auto z-10 shrink-0 text-xs p-3 space-y-4 ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="space-y-4">
            {/* Header: Controls Title */}
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
              <Box size={14} className="text-slate-500" />
              <span>Controls</span>
            </div>

            {/* ── STATE A: NO OBJECT / OVERVIEW (Screenshot 132727) ─────── */}
            {!selectedObject && selectedTarget?.type !== 'floor' && selectedTarget?.type !== 'wall' && viewMode !== 'Walk' && (
              <div className="space-y-4">
                {/* Empty State Box */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <Box size={20} />
                  </div>
                  <span className="font-semibold text-xs text-slate-600">No object selected</span>
                  <span className="text-[10px] text-slate-400">Click any object in the 3D room to inspect & transform</span>
                </div>

                {/* Room Materials (Screenshot 132727) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500">Room Materials</span>
                  
                  {/* Floor */}
                  <div
                    onClick={() => setSelectedTarget({ type: 'floor' })}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[#b6895b] border border-slate-300 overflow-hidden flex items-center justify-center">
                        {floorTextureUrl ? (
                          <ImageIcon size={12} className="text-white drop-shadow" />
                        ) : null}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block group-hover:text-blue-600 transition-colors">Floor</span>
                        <span className="text-[9px] text-slate-400 block">
                          {floorTextureUrl ? 'Custom Image Texture' : `${floorPreset.toUpperCase()} Wood`}
                        </span>
                      </div>
                    </div>
                    <Grid size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>

                  {/* Walls */}
                  <div
                    onClick={() => setSelectedTarget({ type: 'wall', orientation: 'north' })}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[#d8dcd6] border border-slate-300" />
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">Walls</span>
                    </div>
                    <Sliders size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>

                  {/* Doors & Windows */}
                  <div
                    onClick={() => setOpeningConfigOpen(true)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[#fef3c7] border border-slate-300" />
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">Doors & Windows</span>
                    </div>
                    <Palette size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>

                {/* Scan Your Room Card (Screenshot 132727) */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <Smartphone size={20} className="text-slate-500" />
                    <div>
                      <span className="font-bold text-xs block text-slate-800">Scan Your Room</span>
                      <span className="text-[10px] text-slate-400">iPhone & iPad</span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-slate-400" />
                </div>
              </div>
            )}

            {/* ── STATE D: FLOOR MATERIAL & TEXTURE INSPECTOR ─────────── */}
            {selectedTarget?.type === 'floor' && viewMode !== 'Walk' && (
              <div className="space-y-3.5">
                {/* Header with Back button */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Grid size={15} className="text-blue-600" />
                    <span>Floor Texture</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Custom Image Upload Card */}
                <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Custom Texture Image</span>
                    <span className="text-[10px] text-blue-600 font-semibold">Image Upload</span>
                  </div>

                  <input
                    type="file"
                    ref={floorFileInputRef}
                    accept="image/*"
                    onChange={handleFloorImageUpload}
                    className="hidden"
                  />

                  {floorTextureUrl ? (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 h-24 bg-slate-100 flex items-center justify-center group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={floorTextureUrl}
                          alt="Floor Texture"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => floorFileInputRef.current?.click()}
                            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-xs"
                            title="Change Image"
                          >
                            <RefreshCw size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFloorTextureUrl('');
                              if (onRoomChange) {
                                onRoomChange({ ...currentRoom, floorTextureUrl: undefined });
                              }
                              addToast('Reverted to procedural floor texture', 'blue');
                            }}
                            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-rose-600 shadow-xs"
                            title="Remove Custom Image"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold block text-center">
                        ✓ Custom floor image active
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => floorFileInputRef.current?.click()}
                      className="w-full py-4 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 text-slate-600 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center text-slate-500 transition-colors">
                        <UploadCloud size={16} />
                      </div>
                      <span className="font-bold text-xs text-slate-700 group-hover:text-blue-700">
                        Upload Floor Image
                      </span>
                      <span className="text-[10px] text-slate-400">
                        JPG, PNG, WebP patterns
                      </span>
                    </button>
                  )}
                </div>

                {/* Preset Floor Materials */}
                <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <span className="font-bold text-xs text-slate-800 block">Preset Textures</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { key: 'oak', name: 'Oak Wood', color: '#b6895b' },
                      { key: 'walnut', name: 'Dark Walnut', color: '#5c4033' },
                      { key: 'marble', name: 'White Marble', color: '#e2e8f0' },
                      { key: 'tile', name: 'Slate Tile', color: '#64748b' },
                      { key: 'herringbone', name: 'Herringbone', color: '#c29b68' },
                      { key: 'concrete', name: 'Concrete', color: '#94a3b8' },
                    ].map(preset => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => {
                          setFloorPreset(preset.key as FloorPresetType);
                          setFloorTextureUrl('');
                          if (onRoomChange) {
                            onRoomChange({
                              ...currentRoom,
                              floorMaterial: preset.name,
                              floorTextureUrl: undefined,
                            });
                          }
                          addToast(`Applied ${preset.name} floor texture`, 'green');
                        }}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          !floorTextureUrl && floorPreset === preset.key
                            ? 'border-blue-600 bg-blue-50/50 shadow-2xs font-bold text-blue-700'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-md border border-slate-300 shrink-0 shadow-2xs"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-[11px] truncate">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tile Repeat / Texture Scale */}
                <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-800">Texture Repeat / Scale</span>
                    <span className="font-mono font-bold text-xs text-blue-600">{floorTextureScale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={4.0}
                    step={0.25}
                    value={floorTextureScale}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setFloorTextureScale(val);
                      if (onRoomChange) {
                        onRoomChange({ ...currentRoom, floorTextureScale: val });
                      }
                    }}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>Large Slabs (0.5x)</span>
                    <span>Standard (1.0x)</span>
                    <span>Fine Tiles (4.0x)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── STATE E: WALL FINISH INSPECTOR ──────────────────────── */}
            {selectedTarget?.type === 'wall' && viewMode !== 'Walk' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 capitalize">
                    <Sliders size={15} className="text-blue-600" />
                    <span>{selectedTarget.orientation} Wall</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                  <span className="font-bold text-xs text-slate-800 block">Wall Finishes</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Eggshell White', color: '#f8fafc' },
                      { name: 'Warm Greige', color: '#e5e5e0' },
                      { name: 'Sage Green', color: '#c2cfb2' },
                      { name: 'Nordic Navy', color: '#334155' },
                    ].map(finish => (
                      <button
                        key={finish.name}
                        type="button"
                        onClick={() => {
                          if (onRoomChange) {
                            onRoomChange({ ...currentRoom, wallFinish: finish.name });
                          }
                          addToast(`Wall finish set to ${finish.name}`, 'blue');
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center gap-2 text-left"
                      >
                        <div className="w-4 h-4 rounded-md border border-slate-300" style={{ backgroundColor: finish.color }} />
                        <span className="text-[11px] font-semibold text-slate-700 truncate">{finish.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpeningConfigOpen(true)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <DoorOpen size={14} />
                  <span>Add Door or Window</span>
                </button>
              </div>
            )}

            {/* ── STATE B: OBJECT SELECTED (Screenshot 133757) ────────── */}
            {selectedObject && viewMode !== 'Walk' && (
              <div className="space-y-3.5">
                {/* Selected Object Header Tag */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      <Box size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {selectedObject.name}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize block">
                        {selectedObject.category} • ₹{selectedObject.priceINR.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    title="Deselect"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Smart Collisions Guard Status Card */}
                <div
                  className={`p-3 rounded-2xl border transition-all shadow-2xs ${
                    smartCollisions
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {smartCollisions ? (
                        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                      )}
                      <span className="font-bold text-xs">
                        {smartCollisions ? 'Collision Guard: Active' : 'Collision Guard: Off'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={smartCollisions}
                      onChange={e => {
                        setSmartCollisions(e.target.checked);
                        addToast(
                          e.target.checked
                            ? 'Collision Guard ON: objects cannot merge'
                            : 'Collision Guard OFF: free movement',
                          e.target.checked ? 'green' : 'blue'
                        );
                      }}
                      className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] mt-1 block opacity-85 leading-snug">
                    {smartCollisions
                      ? 'Objects stop at boundary and cannot merge into each other.'
                      : 'Free movement enabled. Objects can overlap.'}
                  </span>
                </div>

                {/* Directional Nudge D-Pad (Left items precision controls) */}
                <div className="p-2.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Nudge Position</span>
                    <span className="text-[10px] text-slate-400">0.15m steps</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 w-36 mx-auto text-center py-1">
                    <div />
                    <button
                      type="button"
                      onClick={() => handleMoveObject(0, -0.15)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 flex items-center justify-center transition-all"
                      title="Move Forward / North"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <div />
                    <button
                      type="button"
                      onClick={() => handleMoveObject(-0.15, 0)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 flex items-center justify-center transition-all"
                      title="Move Left / West"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <div className="flex items-center justify-center text-[10px] font-bold text-slate-400">
                      <Move size={12} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMoveObject(0.15, 0)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 flex items-center justify-center transition-all"
                      title="Move Right / East"
                    >
                      <ArrowRight size={14} />
                    </button>
                    <div />
                    <button
                      type="button"
                      onClick={() => handleMoveObject(0, 0.15)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 flex items-center justify-center transition-all"
                      title="Move Backward / South"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <div />
                  </div>
                </div>

                {/* 6 Actions Grid (Rotate L/R, Up/Down, Duplicate, Delete) */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold text-slate-700">
                  <button
                    type="button"
                    onClick={() => handleRotate('left')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-1"
                  >
                    <RotateCcw size={15} className="text-slate-600" />
                    <span>Rotate L</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRotate('right')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-1"
                  >
                    <RotateCw size={15} className="text-slate-600" />
                    <span>Rotate R</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleElevate('up')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-1"
                  >
                    <ArrowUp size={15} className="text-slate-600" />
                    <span>Up</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleElevate('down')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-1"
                  >
                    <ArrowDown size={15} className="text-slate-600" />
                    <span>Down</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDuplicate}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-1"
                  >
                    <Copy size={15} className="text-slate-600" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteObject}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 flex flex-col items-center justify-center gap-1"
                  >
                    <Trash2 size={15} className="text-slate-600 hover:text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Keyboard Shortcuts Table (Screenshot 133757) */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[10px] text-slate-500 font-mono">
                  <div className="flex justify-between items-center">
                    <span>Move</span>
                    <div className="flex gap-1 font-bold text-slate-700">
                      <span className="px-1 bg-white border rounded">↑</span>
                      <span className="px-1 bg-white border rounded">↓</span>
                      <span className="px-1 bg-white border rounded">←</span>
                      <span className="px-1 bg-white border rounded">→</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Height</span>
                    <div className="flex gap-1 font-bold text-slate-700">
                      <span className="px-1 bg-white border rounded">W</span>
                      <span className="px-1 bg-white border rounded">S</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rotate</span>
                    <div className="flex gap-1 font-bold text-slate-700">
                      <span className="px-1 bg-white border rounded">A</span>
                      <span className="px-1 bg-white border rounded">D</span>
                    </div>
                  </div>
                </div>

                {/* Rotation Axis (Screenshot 133757) */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs">Rotation Axis</span>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                      {(['X', 'Y', 'Z'] as const).map(axis => (
                        <button
                          key={axis}
                          type="button"
                          onClick={() => setRotationAxis(axis)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                            rotationAxis === axis
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {axis}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Rotates object around selected 3D axis</span>
                  <button
                    type="button"
                    onClick={handleResetRotation}
                    className="w-full py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    Reset Rotation
                  </button>
                </div>

                {/* Adjust Dimensions (Screenshot 133757) */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">Adjust Dimensions</span>
                    <span className="text-[9px] text-slate-400 block">Fine-tune object scale in real time</span>
                  </div>

                  {/* Units & Uniform lock */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Units</span>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                      {(['in', 'ft', 'm'] as const).map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnitMode(u)}
                          className={`px-2 py-0.5 rounded transition-all ${
                            unitMode === u ? 'bg-blue-600 text-white' : 'text-slate-600'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Uniform</span>
                    <button
                      type="button"
                      onClick={() => setUniformLocked(!uniformLocked)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1"
                    >
                      {uniformLocked ? <Lock size={11} /> : <Unlock size={11} />}
                      <span>{uniformLocked ? 'Locked' : 'Unlocked'}</span>
                    </button>
                  </div>

                  {/* Dimension sliders/inputs */}
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Width</span>
                      <span className="font-mono font-bold text-slate-900">{selectedObject.dimensions.width}&quot;</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={144}
                      value={selectedObject.dimensions.width}
                      onChange={e => handleDimensionChange('width', Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Depth</span>
                      <span className="font-mono font-bold text-slate-900">{selectedObject.dimensions.depth}&quot;</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={96}
                      value={selectedObject.dimensions.depth}
                      onChange={e => handleDimensionChange('depth', Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Height</span>
                      <span className="font-mono font-bold text-slate-900">{selectedObject.dimensions.height}&quot;</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      value={selectedObject.dimensions.height}
                      onChange={e => handleDimensionChange('height', Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STATE C: WALKTHROUGH MODE (Screenshot 134014) ───────── */}
            {viewMode === 'Walk' && (
              <div className="space-y-5">
                {/* View Height Vertical Slider (Screenshot 134014) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Footprints size={16} />
                  </div>
                  <span className="font-bold text-slate-800 text-xs">View Height</span>

                  <button
                    type="button"
                    onClick={() => setViewHeightInches(Math.min(79, viewHeightInches + 2))}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                  >
                    <ArrowUp size={16} />
                  </button>

                  <span className="text-[10px] text-slate-400 font-mono">6&apos; 7&quot; (2.0m)</span>

                  {/* Vertical Slider Bar */}
                  <div className="h-40 flex items-center justify-center">
                    <input
                      type="range"
                      min={47} // 3' 11"
                      max={79} // 6' 7"
                      value={viewHeightInches}
                      onChange={e => setViewHeightInches(Number(e.target.value))}
                      className="h-36 accent-blue-600 -rotate-90"
                    />
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">3&apos; 11&quot; (1.2m)</span>

                  <button
                    type="button"
                    onClick={() => setViewHeightInches(Math.max(47, viewHeightInches - 2))}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                  >
                    <ArrowDown size={16} />
                  </button>

                  {/* Big Readout */}
                  <div className="text-center pt-2 border-t border-slate-100 w-full">
                    <span className="text-base font-extrabold text-slate-900 block font-mono">
                      {Math.floor(viewHeightInches / 12)}&apos; {viewHeightInches % 12}&quot;
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(viewHeightInches * 0.0254).toFixed(2)} m
                    </span>
                  </div>
                </div>

                {/* Field of View (Screenshot 134014) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <span className="font-bold text-slate-800 text-xs block text-center">Field of View</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFieldOfView(Math.max(60, fieldOfView - 5))}
                      className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min={60}
                      max={120}
                      value={fieldOfView}
                      onChange={e => setFieldOfView(Number(e.target.value))}
                      className="flex-1 accent-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setFieldOfView(Math.min(120, fieldOfView + 5))}
                      className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="font-extrabold text-slate-900 text-sm block font-mono">{fieldOfView}°</span>
                    <span className="text-[10px] text-slate-400">
                      {fieldOfView === 90 ? 'Normal' : fieldOfView < 90 ? 'Telephoto' : 'Wide Angle'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER 3D / 2D CANVAS CONTAINER ─────────────────────── */}
        <div
          ref={canvasWrapperRef}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex-1 h-full outline-none relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#ebedf0]"
        >
          {/* Isolated WebGL Mount */}
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* ── FLOATING TOP-LEFT MODE & CAMERA TOOL PILLS (Screenshot 132727) ── */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 pointer-events-auto">
            <div className="flex items-center gap-2">
              {/* 2D / 3D / Walk Mode Pill */}
              <div className="flex bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-md text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('2D')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    viewMode === '2D' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                  }`}
                >
                  <Grid size={13} />
                  <span>2D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('3D')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    viewMode === '3D' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                  }`}
                >
                  <Box size={13} />
                  <span>3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('Walk')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    viewMode === 'Walk' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                  }`}
                >
                  <Eye size={13} />
                  <span>Walk</span>
                </button>
              </div>

              {/* Camera Tools Pill: Orbit, Pan, X-Ray, Dims, Measure */}
              <div className="flex bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-md text-xs font-semibold text-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTool('Orbit')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    activeTool === 'Orbit' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                  }`}
                >
                  Orbit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('Pan')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    activeTool === 'Pan' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                  }`}
                >
                  Pan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'X-Ray' ? 'Orbit' : 'X-Ray')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                    activeTool === 'X-Ray' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                  }`}
                >
                  <Layers size={13} />
                  <span>X-Ray</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDimensions(!showDimensions)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                    showDimensions ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                  }`}
                >
                  <Ruler size={13} />
                  <span>Dims</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool('Measure');
                    setMeasurePoints([]);
                    setMeasureDistanceMeters(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                    activeTool === 'Measure' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100'
                  }`}
                >
                  <Ruler size={13} />
                  <span>Measure</span>
                </button>
              </div>
            </div>

            {/* Floating Settings Gear (Screenshot 132727) */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(!showSettingsModal)}
              className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all hover:scale-105"
              title="Studio Settings"
            >
              <Settings size={16} />
            </button>
          </div>

          {/* ── FLOATING TOP-RIGHT FULLSCREEN BUTTON (Screenshot 132727) ── */}
          <div className="absolute top-4 right-4 z-20">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all hover:scale-105"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* ── TOP BANNER 1: AXIS-ALIGNED DRAG HINT (Screenshot 133816) ── */}
          {isDraggingObj && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-3.5 py-1.5 rounded-xl shadow-xl text-xs font-medium z-30 pointer-events-none flex items-center gap-2 animate-in fade-in">
              <span>{isShiftPressed ? 'Axis Lock Active' : 'Hold'}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${isShiftPressed ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                Shift
              </span>
              <span>{isShiftPressed ? '(1-Axis Only)' : 'for axis-aligned movement'}</span>
            </div>
          )}

          {/* ── TOP BANNER 2: WALKTHROUGH MODE HUD (Screenshot 134014) ── */}
          {viewMode === 'Walk' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 px-4 py-2 rounded-2xl shadow-xl text-xs z-30 pointer-events-none flex items-center gap-3">
              <span className="text-amber-500 font-bold">⚡</span>
              <div>
                <span className="font-bold text-slate-900 block">Walkthrough Mode</span>
                <span className="text-[11px] text-slate-500">
                  Use <span className="font-bold text-blue-600 font-mono">WASD</span> keys to move around • Click and drag to look around
                </span>
              </div>
            </div>
          )}

          {/* ── ON-CANVAS PROJECTED 3D HUD (Screenshots 133440, 133516, 133736, 133835, 133846) ── */}
          {selectedObject && screenHudPos && viewMode !== 'Walk' && (
            <div
              style={{
                left: `${screenHudPos.x}px`,
                top: `${screenHudPos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-30 pointer-events-auto flex items-center justify-center"
            >
              {/* HUD Center Cross Container */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Center Move Indicator */}
                <div
                  onMouseEnter={() => setHudHoverAction('Move')}
                  onMouseLeave={() => setHudHoverAction(null)}
                  className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center text-slate-700 cursor-move hover:scale-110 transition-transform"
                >
                  <Move size={14} />
                </div>

                {/* Top: Adjust Height (Screenshot 133516 / 133835) */}
                <button
                  type="button"
                  onClick={() => handleElevate('up')}
                  onMouseEnter={() => setHudHoverAction('Adjust Height')}
                  onMouseLeave={() => setHudHoverAction(null)}
                  className="absolute -top-1 w-6 h-6 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  title="Adjust Height"
                >
                  <ArrowUp size={12} />
                </button>

                {/* Left: Adjust Size (Screenshot 133516) */}
                <button
                  type="button"
                  onClick={() => handleDimensionChange('width', selectedObject.dimensions.width + 2)}
                  onMouseEnter={() => setHudHoverAction('Adjust Size')}
                  onMouseLeave={() => setHudHoverAction(null)}
                  className="absolute -left-1 w-6 h-6 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  title="Adjust Size"
                >
                  <Maximize2 size={11} />
                </button>

                {/* Right: Rotate Object Y-Axis (Purple hover circle, Screenshot 133736) */}
                <button
                  type="button"
                  onClick={() => handleRotate('right')}
                  onMouseEnter={() => setHudHoverAction('Rotate Object (Y-axis)')}
                  onMouseLeave={() => setHudHoverAction(null)}
                  className="absolute -right-1 w-6 h-6 rounded-full bg-purple-600 text-white shadow-md flex items-center justify-center hover:scale-115 transition-all"
                  title="Rotate Object (Y-axis)"
                >
                  <RotateCw size={12} />
                </button>

                {/* Bottom: Delete Object (Screenshot 133736) */}
                <button
                  type="button"
                  onClick={handleDeleteObject}
                  onMouseEnter={() => setHudHoverAction('Delete Object')}
                  onMouseLeave={() => setHudHoverAction(null)}
                  className="absolute -bottom-1 w-6 h-6 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
                  title="Delete Object"
                >
                  <Trash2 size={11} />
                </button>

                {/* Floating Tooltip Label (Screenshots 133516, 133736) */}
                {hudHoverAction && (
                  <div className="absolute -top-8 bg-slate-900/90 text-white px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap shadow-md pointer-events-none">
                    {hudHoverAction}
                  </div>
                )}

                {/* Green ON FLOOR Badge (Screenshot 133846) */}
                {isOnFloor && !hudHoverAction && (
                  <div className="absolute top-10 bg-emerald-700 text-white px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider shadow-md pointer-events-none">
                    ON FLOOR
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── WALKTHROUGH WASD KEYS OVERLAY (Screenshot 134014) ──────── */}
          {viewMode === 'Walk' && (
            <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
              <div className="flex flex-col items-center gap-1 font-mono font-bold text-xs">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                    keysActive['W'] ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-white/80 border-slate-300 text-slate-600'
                  }`}
                >
                  W
                </div>
                <div className="flex gap-1">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      keysActive['A'] ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-white/80 border-slate-300 text-slate-600'
                    }`}
                  >
                    A
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      keysActive['S'] ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-white/80 border-slate-300 text-slate-600'
                    }`}
                  >
                    S
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      keysActive['D'] ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-white/80 border-slate-300 text-slate-600'
                    }`}
                  >
                    D
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAPE MEASURE LIVE DISTANCE BADGE ───────────────────────── */}
          {activeTool === 'Measure' && measureDistanceMeters !== null && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold px-4 py-1.5 rounded-2xl shadow-xl z-30 text-xs flex items-center gap-2">
              <Ruler size={14} />
              <span>
                Distance: {(measureDistanceMeters * 3.28084).toFixed(2)} ft ({measureDistanceMeters.toFixed(2)} m)
              </span>
              <button
                type="button"
                onClick={() => {
                  setMeasurePoints([]);
                  setMeasureDistanceMeters(null);
                }}
                className="ml-1 p-0.5 rounded-full hover:bg-white/20"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* ── BOTTOM-CENTER AI ROOMBOT PILL (Screenshot 132727, 133440) ── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-lg pointer-events-auto">
            <form
              onSubmit={handleRoomBotSubmit}
              className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full px-4 py-2 flex items-center gap-2 shadow-xl"
            >
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Expand"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => setAiPrompt('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => addToast('Listening for voice command...', 'blue')}
                className="text-slate-400 hover:text-blue-600 p-0.5"
                title="Voice input"
              >
                <Mic size={15} />
              </button>

              <input
                type="text"
                placeholder="Ask RoomBot..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />

              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold tracking-wider">
                BETA
              </span>

              <button
                type="submit"
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-blue-600 text-white flex items-center justify-center transition-all shadow-2xs"
              >
                <Send size={12} className="ml-0.5" />
              </button>
            </form>
          </div>

          {/* ── BOTTOM-RIGHT 3D GIZMO & FOOTER LINKS (Screenshot 132727) ── */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
            {/* 3D Coordinate Axis Gizmo */}
            <div className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="stroke-2">
                <line x1="12" y1="12" x2="20" y2="12" stroke="#ef4444" strokeWidth="2" />
                <line x1="12" y1="12" x2="12" y2="4" stroke="#22c55e" strokeWidth="2" />
                <line x1="12" y1="12" x2="6" y2="18" stroke="#3b82f6" strokeWidth="2" />
              </svg>
            </div>

            {/* Feedback & Dark Mode Toggle */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <button
                type="button"
                onClick={() => addToast('Feedback modal opened', 'blue')}
                className="flex items-center gap-1 hover:text-slate-800 bg-white/80 px-2 py-1 rounded-lg border border-slate-200 shadow-2xs"
              >
                <MessageSquare size={12} />
                <span>Feedback</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1 rounded-lg hover:text-slate-800 bg-white/80 border border-slate-200 shadow-2xs text-slate-500"
                title="Toggle Dark Mode"
              >
                <Moon size={14} />
              </button>
            </div>
          </div>

          {/* ── TOAST ALERTS (Bottom-Left, Screenshot 133403) ──────────── */}
          <div className="absolute bottom-4 left-4 z-40 space-y-2 pointer-events-none">
            {toastAlerts.map(toast => (
              <div
                key={toast.id}
                className={`px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border shadow-lg text-xs font-semibold text-slate-800 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 pointer-events-auto ${
                  toast.type === 'blue'
                    ? 'border-l-4 border-l-blue-600 border-slate-200'
                    : 'border-l-4 border-l-emerald-600 border-slate-200'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    toast.type === 'blue' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}
                />
                <span>{toast.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR (Screenshot 132727, 133417, 133757) ──────── */}
        <aside className={`w-72 border-l flex flex-col justify-between overflow-y-auto z-10 shrink-0 text-xs p-3 space-y-4 ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="space-y-4">
            {/* Generate from Image (Screenshot 132727) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                <ImageIcon size={14} className="text-slate-500" />
                <span>Generate from Image</span>
              </div>

              {/* Generating 3D Model Card (Screenshot 133417) */}
              {generatingModelProgress !== null ? (
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-center space-y-3 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center">
                    <Box size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      {generatingProductName ? `Generating ${generatingProductName}` : 'Generating 3D Model'}
                    </span>
                    <span className="text-[10px] text-sky-700 block font-mono mt-0.5">
                      {generatingModelProgress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-sky-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${generatingModelProgress}%` }}
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 block">{generatingModelStatus}</span>
                </div>
              ) : (
                /* Drag & drop upload box (Screenshot 132727) */
                <div
                  onClick={() => setIsMarketplaceOpen(true)}
                  className="p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-500/70 bg-slate-50/60 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group"
                >
                  <UploadCloud size={24} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-[11px] font-semibold text-slate-700">Drag & drop an image or</span>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                  >
                    Browse Files
                  </button>
                  <span className="text-[9px] text-slate-400 mt-0.5">JPG, PNG, HEIC, WEBP • Max 5MB</span>
                </div>
              )}
            </div>

            {/* Mode Tabs: My Models & Marketplace (Screenshot 132727) */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setRightPanelTab('MyModels')}
                className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  rightPanelTab === 'MyModels'
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-2xs font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Box size={14} />
                <span>My Models</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMarketplaceOpen(true)}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100 transition-all shadow-2xs"
              >
                <ShoppingBag size={14} className="text-sky-600" />
                <span>Marketplace</span>
              </button>
            </div>

            {/* Quick Search Bar (Screenshot 132727, 133440) */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Quick search..."
                value={recentSearch}
                onChange={e => setRecentSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {recentSearch && (
                <button
                  type="button"
                  onClick={() => setRecentSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Recent Objects Grid (Screenshot 132727, 133440) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs">Recent Objects</span>
                <button
                  type="button"
                  onClick={() => onObjectsChange([])}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear recent"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* 2x3 Grid of Clickable Furniture Tiles */}
              <div className="grid grid-cols-2 gap-2.5">
                {MARKETPLACE_OBJECTS_CATALOG.filter(item =>
                  !recentSearch || item.name.toLowerCase().includes(recentSearch.toLowerCase())
                ).slice(0, 6).map(item => (
                  <div
                    key={item.name}
                    onClick={() => handleInsertItem(item)}
                    className="p-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-500/80 hover:bg-white hover:shadow-md cursor-pointer transition-all flex flex-col items-center justify-between aspect-square group"
                  >
                    <div className="w-full flex-1 flex items-center justify-center p-1">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-2xs group-hover:scale-110 transition-transform">
                        {item.category === 'seating' && '🛋️'}
                        {item.category === 'beds' && '🛏️'}
                        {item.category === 'tables' && '🪵'}
                        {item.category === 'storage' && '🚪'}
                        {item.category === 'decor' && '🪴'}
                        {item.category === 'lighting' && '💡'}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                      {item.name.split(' ')[0]} {item.name.split(' ')[1] || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          4. MARKETPLACE MODAL (Screenshots 133111 - 133403)
          ═══════════════════════════════════════════════════════════════ */}
      <MarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        onStartModelGeneration={handleStartModelGeneration}
      />

      {/* ═══════════════════════════════════════════════════════════════
          5. WALL OPENING MODAL (Doors / Windows / Arches)
          ═══════════════════════════════════════════════════════════════ */}
      {openingConfigOpen && onRoomChange && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Wall Opening</h3>
              <button type="button" onClick={() => setOpeningConfigOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['window', 'door', 'arch'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewOpeningType(t)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    newOpeningType === t
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Width</span>
                  <span className="font-mono font-bold text-slate-900">{newOpeningWidth} ft</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={0.5}
                  value={newOpeningWidth}
                  onChange={e => setNewOpeningWidth(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Height</span>
                  <span className="font-mono font-bold text-slate-900">{newOpeningHeight} ft</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={8}
                  step={0.5}
                  value={newOpeningHeight}
                  onChange={e => setNewOpeningHeight(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpeningConfigOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const op: RoomOpening = {
                    id: `op-${Date.now()}`,
                    type: newOpeningType,
                    wall: selectedTarget?.type === 'wall' ? selectedTarget.orientation : 'north',
                    width: newOpeningWidth,
                    height: newOpeningHeight,
                    sillHeight: newOpeningType === 'door' ? 0 : newOpeningSill,
                    offsetPct: newOpeningOffsetPct,
                  };
                  onRoomChange({
                    ...currentRoom,
                    openings: [...(currentRoom.openings || []), op],
                  });
                  setOpeningConfigOpen(false);
                  addToast(`Added ${newOpeningType} to wall`, 'green');
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-500"
              >
                Insert Opening
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          6. STUDIO SETTINGS MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Settings size={16} />
                <span>Studio View Settings</span>
              </h3>
              <button type="button" onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span>Display Architectural Grid</span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={e => setShowGrid(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span>Render Ceiling Mesh</span>
                <input
                  type="checkbox"
                  checked={showCeiling}
                  onChange={e => setShowCeiling(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span>Show Real-time Dimensions</span>
                <input
                  type="checkbox"
                  checked={showDimensions}
                  onChange={e => setShowDimensions(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                <span>Dark Theme Canvas</span>
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={e => setIsDarkMode(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper: Apply Sub-Elements to Three.js Mesh ─────────────────────
function applySubElementsToMesh(root: THREE.Object3D, obj: StudioObject3D) {
  if (!obj.subElements || obj.subElements.length === 0) return;

  obj.subElements.forEach(sub => {
    root.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const nameLower = (mesh.name || '').toLowerCase();
        const subIdLower = sub.id.toLowerCase();
        const subNameLower = sub.name.toLowerCase();

        if (
          nameLower.includes(subIdLower) ||
          nameLower.includes(subNameLower) ||
          (subIdLower.includes('pillow') && nameLower.includes('pillow')) ||
          (subIdLower.includes('cushion') && nameLower.includes('cushion')) ||
          (subIdLower.includes('leg') && nameLower.includes('leg'))
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

// ── Helper: Procedural 3D Mesh Generator ────────────────────────────
function createProcedural3DMesh(obj: StudioObject3D): THREE.Group {
  const group = new THREE.Group();
  const mainColor = new THREE.Color(obj.color || '#3d5c3a'); // Olive green default
  const mat = new THREE.MeshStandardMaterial({
    color: mainColor,
    roughness: 0.6,
    metalness: 0.1,
  });

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });

  if (obj.category === 'seating') {
    // Green Couch as in Screenshot 133440
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 0.8), mat);
    base.position.y = 0.25;
    base.castShadow = true;
    group.add(base);

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 0.25), mat);
    back.position.set(0, 0.55, -0.28);
    back.castShadow = true;
    group.add(back);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.82), mat);
    leftArm.position.set(-1.0, 0.4, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.82), mat);
    rightArm.position.set(1.0, 0.4, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Pillows
    const pMat = new THREE.MeshStandardMaterial({ color: 0x4a6b47, roughness: 0.7 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.12), pMat);
    p1.position.set(-0.65, 0.45, -0.16);
    p1.rotation.y = 0.25;
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.12), pMat);
    p2.position.set(0.65, 0.45, -0.16);
    p2.rotation.y = -0.25;
    group.add(p1, p2);

    // Wooden legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.15, 8);
    [
      [-0.9, 0.075, 0.3],
      [0.9, 0.075, 0.3],
      [-0.9, 0.075, -0.3],
      [0.9, 0.075, -0.3],
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });
  } else if (obj.category === 'beds') {
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 2.1), mat);
    mattress.position.y = 0.3;
    mattress.castShadow = true;
    group.add(mattress);

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.95, 0.14), mat);
    headboard.position.set(0, 0.65, -1.05);
    headboard.castShadow = true;
    group.add(headboard);
  } else if (obj.category === 'tables') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.85), mat);
    top.position.y = 0.72;
    top.castShadow = true;
    group.add(top);

    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8);
    [
      [-0.65, 0.35, 0.35],
      [0.65, 0.35, 0.35],
      [-0.65, 0.35, -0.35],
      [0.65, 0.35, -0.35],
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, brassMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });
  } else {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mat);
    box.position.y = 0.3;
    box.castShadow = true;
    group.add(box);
  }

  return group;
}
