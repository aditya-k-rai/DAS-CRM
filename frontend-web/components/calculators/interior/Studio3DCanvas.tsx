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
  RoomShape,
} from '@/types/interiorStudio';

export type MetricUnit = 'mm' | 'cm' | 'm';

export interface HistorySnapshot {
  actionName: string;
  objects: StudioObject3D[];
  roomDef: RoomDefinition;
}

export function inchesToUnit(inches: number, unit: MetricUnit): number {
  if (unit === 'mm') {
    return Math.round(inches * 25.4);
  }
  if (unit === 'cm') {
    return Math.round(inches * 2.54 * 10) / 10;
  }
  return Math.round(inches * 0.0254 * 100) / 100;
}

export function unitToInches(val: number, unit: MetricUnit): number {
  if (unit === 'mm') {
    return val / 25.4;
  }
  if (unit === 'cm') {
    return val / 2.54;
  }
  return val / 0.0254;
}

export function formatMetricDistance(meters: number, unit: MetricUnit): string {
  if (unit === 'mm') return `${Math.round(meters * 1000)} mm`;
  if (unit === 'cm') return `${(meters * 100).toFixed(1)} cm`;
  return `${meters.toFixed(2)} m`;
}
import { MARKETPLACE_OBJECTS_CATALOG, computeRoomMetrics } from '@/lib/interiorProjectsStore';
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
  Minimize2,
  LayoutDashboard,
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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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
  isExpanded,
  onToggleExpand,
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
  const [unitMode, setUnitMode] = useState<MetricUnit>('mm');
  const [uniformLocked, setUniformLocked] = useState(false);
  const [customSizeStep, setCustomSizeStep] = useState<number>(50); // Default 50mm

  // Undo / Redo History Stack with Action Tracking
  const undoStackRef = useRef<HistorySnapshot[]>([]);
  const redoStackRef = useRef<HistorySnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [lastUndoName, setLastUndoName] = useState('');
  const [lastRedoName, setLastRedoName] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isExpandedView = isExpanded ?? internalFullscreen;
  const toggleFullscreen = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalFullscreen(prev => !prev);
    }
  };
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
        setShowGrid(false); // Clean floor without CAD grid lines overlaying the texture
        const updatedRoom = {
          ...roomDef,
          floorTextureUrl: dataUrl,
        };
        setRoomDef(updatedRoom);
        onRoomChange?.(updatedRoom);
        pushHistory('Applied Floor Texture Image', undefined, updatedRoom);
        addToast('Custom floor texture image applied! Grid lining removed.', 'green');
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

  // Canvas & HUD refs
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const dragLastPosRef = useRef<{ x: number; z: number } | null>(null);
  const selectedTargetRef = useRef<SelectedElementType>(selectedTarget);

  useEffect(() => {
    selectedTargetRef.current = selectedTarget;
  }, [selectedTarget]);

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
    selectionBox: THREE.BoxHelper | null;
    orbitTarget: THREE.Vector3;
    orbitRadius: number;
    orbitTheta: number;
    orbitPhi: number;
  } | null>(null);

  // Dynamic 3D orientation gizmo & live camera angles
  const gizmoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraAngles, setCameraAngles] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  // Reactive Room State for instantaneous live re-rendering without page refresh
  const [roomDef, setRoomDef] = useState<RoomDefinition>(currentRoom);

  useEffect(() => {
    setRoomDef(currentRoom);
  }, [currentRoom]);

  // Selected Object
  const selectedObject = useMemo(() => {
    if (selectedTarget?.type === 'object') {
      return objects.find(o => o.id === selectedTarget.id) || null;
    }
    return null;
  }, [objects, selectedTarget]);

  // Convert room dimensions to meters (1 ft = 0.3048 m) - reactive to roomDef
  const roomMeters = useMemo(() => {
    let length = roomDef.length * 0.3048;
    let width = roomDef.width * 0.3048;
    let height = roomDef.height * 0.3048;
    if (roomDef.unit === 'in') {
      length = (roomDef.length / 12) * 0.3048;
      width = (roomDef.width / 12) * 0.3048;
      height = (roomDef.height / 12) * 0.3048;
    } else if (roomDef.unit === 'm') {
      length = roomDef.length;
      width = roomDef.width;
      height = roomDef.height;
    }
    const shape = roomDef.shape || 'rectangle';
    if (shape === 'square') {
      width = length;
    }
    const wallThick = ((roomDef.wallWidthInches || 4.5) / 12) * 0.3048;
    const cutoutL = ((roomDef.lShapeParams?.cutoutLength || roomDef.length * 0.45) / (roomDef.unit === 'in' ? 12 : 1)) * 0.3048;
    const cutoutW = ((roomDef.lShapeParams?.cutoutWidth || roomDef.width * 0.45) / (roomDef.unit === 'in' ? 12 : 1)) * 0.3048;

    return {
      length,
      width,
      height,
      halfL: length / 2,
      halfW: width / 2,
      wallThick,
      shape,
      cutoutL,
      cutoutW,
    };
  }, [roomDef]);

  // Synchronized Room Architecture Modification Handler with instant local 60 FPS update
  const handleRoomParamChange = useCallback(
    (updates: Partial<RoomDefinition>) => {
      setRoomDef(prev => {
        const nextRoom: RoomDefinition = {
          ...prev,
          ...updates,
        };
        if (nextRoom.shape === 'square') {
          nextRoom.width = nextRoom.length;
        }
        const metrics = computeRoomMetrics(
          nextRoom.length,
          nextRoom.width,
          nextRoom.height,
          nextRoom.unit || 'ft',
          nextRoom.openings || [],
          nextRoom.shape || 'rectangle',
          nextRoom.wallWidthInches || 4.5,
          nextRoom.lShapeParams,
          nextRoom.customVertices
        );
        const finalized = {
          ...nextRoom,
          ...metrics,
        };
        onRoomChange?.(finalized);
        return finalized;
      });
    },
    [onRoomChange]
  );

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

    const selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0xfacc15);
    selectionBox.name = 'scene_selection_box';
    selectionBox.visible = false;
    scene.add(selectionBox);

    const orbitTarget = new THREE.Vector3(0, 0.8, 0);
    const camOffset = camera.position.clone().sub(orbitTarget);
    const orbitRadius = Math.max(1.5, camOffset.length());
    const orbitPhi = Math.acos(Math.max(-1, Math.min(1, camOffset.y / orbitRadius)));
    const orbitTheta = Math.atan2(camOffset.x, camOffset.z);

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
      selectionBox,
      orbitTarget,
      orbitRadius,
      orbitTheta,
      orbitPhi,
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

      // Update yellow selection box (hugs the selected mesh cleanly in place)
      if (state.selectionBox) {
        if (state.selectedMesh && selectedTargetRef.current?.type === 'object') {
          state.selectionBox.setFromObject(state.selectedMesh);
          state.selectionBox.visible = true;
          state.selectionBox.update();
        } else {
          state.selectionBox.visible = false;
        }
      }

      // Update projected 2D HUD position over selected object (direct DOM transform, zero React re-renders)
      if (hudRef.current) {
        if (
          state.selectedMesh &&
          canvasWrapperRef.current &&
          selectedTargetRef.current?.type === 'object' &&
          viewModeRef.current !== 'Walk'
        ) {
          const targetObj = objects.find(o => o.id === (selectedTargetRef.current as any)?.id);
          const objPos = state.selectedMesh.position.clone();
          const objH = (targetObj?.dimensions?.height || 30) * 0.0254;
          objPos.y += Math.max(0.35, objH * 0.5 + 0.15);
          const proj = objPos.project(state.camera);
          if (proj.z < 1) {
            const cw = canvasWrapperRef.current.clientWidth;
            const ch = canvasWrapperRef.current.clientHeight;
            const screenX = (proj.x * 0.5 + 0.5) * cw;
            const screenY = (-(proj.y * 0.5) + 0.5) * ch;
            hudRef.current.style.display = 'flex';
            hudRef.current.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)`;
          } else {
            hudRef.current.style.display = 'none';
          }
        } else {
          hudRef.current.style.display = 'none';
        }
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

    // Smooth mouse wheel zoom handler (both 3D spherical orbit and 2D orthographic)
    const onCanvasWheel = (e: WheelEvent) => {
      e.preventDefault();
      const st = threeStateRef.current;
      if (!st) return;

      if (viewModeRef.current === '3D') {
        const zoomSpeed = 0.0012;
        const factor = Math.exp(e.deltaY * zoomSpeed);
        st.orbitRadius = Math.max(1.8, Math.min(42.0, (st.orbitRadius || 10) * factor));
        const target = st.orbitTarget || new THREE.Vector3(0, 0.8, 0);
        const theta = st.orbitTheta ?? 0;
        const phi = st.orbitPhi ?? 1.0;
        const x = target.x + st.orbitRadius * Math.sin(phi) * Math.sin(theta);
        const y = target.y + st.orbitRadius * Math.cos(phi);
        const z = target.z + st.orbitRadius * Math.sin(phi) * Math.cos(theta);
        st.camera.position.set(x, y, z);
        st.camera.lookAt(target);
      } else if (viewModeRef.current === '2D') {
        if ((st.camera as any).isOrthographicCamera) {
          const ortho = st.camera as THREE.OrthographicCamera;
          const factor = e.deltaY > 0 ? 0.9 : 1.1;
          ortho.zoom = Math.max(0.2, Math.min(6.0, ortho.zoom * factor));
          ortho.updateProjectionMatrix();
        } else {
          st.camera.position.y = Math.max(2, Math.min(40, st.camera.position.y + e.deltaY * 0.01));
        }
      }
    };

    container.addEventListener('wheel', onCanvasWheel, { passive: false });
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(() => handleResize());
    ro.observe(container);

    return () => {
      cancelAnimationFrame(reqId);
      container.removeEventListener('wheel', onCanvasWheel);
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
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

    const { length, width, height, halfL, halfW, wallThick, shape, cutoutL, cutoutW } = roomMeters;
    const wallH = viewMode === 'Walk' ? height : Math.min(height * 0.72, 2.5);

    // Floor Texture: Custom image or Procedural Canvas Pattern
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

    // Wall Material (X-Ray transparency support)
    const isXRay = activeTool === 'X-Ray';
    const getWallMat = (orientation?: string) => {
      const isSel = selectedTarget?.type === 'wall' && (orientation ? selectedTarget.orientation === orientation : true);
      return new THREE.MeshStandardMaterial({
        color: isSel ? 0x93c5fd : 0xd8dcd6, // Clean eggshell architectural white
        roughness: 0.9,
        opacity: isXRay ? 0.35 : 1.0,
        transparent: isXRay,
      });
    };

    if (shape === 'rectangle' || shape === 'square') {
      const floorGeo = new THREE.PlaneGeometry(width, length);
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.receiveShadow = true;
      floorMesh.name = 'element_floor';
      floorMesh.userData = { elementType: 'floor' };
      group.add(floorMesh);
      state.floorMesh = floorMesh;

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
    } else {
      // Polygon-based Floor & Walls (L-Shape, T-Shape, Custom)
      const polyPts: [number, number][] = [];
      if (shape === 'l-shape') {
        const xCut = halfW - cutoutW;
        const zCut = -halfL + cutoutL;
        polyPts.push([-halfW, -halfL]);
        polyPts.push([xCut, -halfL]);
        polyPts.push([xCut, zCut]);
        polyPts.push([halfW, zCut]);
        polyPts.push([halfW, halfL]);
        polyPts.push([-halfW, halfL]);
      } else if (shape === 't-shape') {
        const stemW = width * 0.45;
        const stemH = length * 0.5;
        polyPts.push([-halfW, -halfL]);
        polyPts.push([halfW, -halfL]);
        polyPts.push([halfW, -halfL + stemH]);
        polyPts.push([stemW / 2, -halfL + stemH]);
        polyPts.push([stemW / 2, halfL]);
        polyPts.push([-stemW / 2, halfL]);
        polyPts.push([-stemW / 2, -halfL + stemH]);
        polyPts.push([-halfW, -halfL + stemH]);
      } else if (currentRoom.customVertices && currentRoom.customVertices.length >= 3) {
        currentRoom.customVertices.forEach(v => {
          const vx = (v.x / (currentRoom.unit === 'in' ? 12 : 1)) * 0.3048;
          const vz = (v.y / (currentRoom.unit === 'in' ? 12 : 1)) * 0.3048;
          polyPts.push([vx - halfW, vz - halfL]);
        });
      } else {
        polyPts.push([-halfW, -halfL], [halfW, -halfL], [halfW, halfL], [-halfW, halfL]);
      }

      const threeShape = new THREE.Shape();
      polyPts.forEach((pt, idx) => {
        if (idx === 0) threeShape.moveTo(pt[0], pt[1]);
        else threeShape.lineTo(pt[0], pt[1]);
      });
      threeShape.closePath();

      const floorGeo = new THREE.ShapeGeometry(threeShape);
      floorGeo.rotateX(-Math.PI / 2);
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.receiveShadow = true;
      floorMesh.name = 'element_floor';
      floorMesh.userData = { elementType: 'floor' };
      group.add(floorMesh);
      state.floorMesh = floorMesh;

      // Perimeter walls along polygon edges
      for (let i = 0; i < polyPts.length; i++) {
        const p1 = polyPts[i];
        const p2 = polyPts[(i + 1) % polyPts.length];
        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const segLen = Math.hypot(dx, dz);
        if (segLen < 0.01) continue;

        const midX = (p1[0] + p2[0]) / 2;
        const midZ = (p1[1] + p2[1]) / 2;
        const angle = Math.atan2(dz, dx);
        const nx = -dz / segLen;
        const nz = dx / segLen;

        const wallGeo = new THREE.BoxGeometry(segLen + wallThick * 0.5, wallH, wallThick);
        const wallMesh = new THREE.Mesh(wallGeo, getWallMat());
        wallMesh.position.set(midX + (nx * wallThick) / 2, wallH / 2, midZ + (nz * wallThick) / 2);
        wallMesh.rotation.y = -angle;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        wallMesh.userData = { elementType: 'wall', edgeIdx: i };
        group.add(wallMesh);
        state.wallMeshes.set(`edge_${i}`, wallMesh);
      }
    }

    // Windows with cyan sky glass matching reference
    const windowMat = new THREE.MeshBasicMaterial({
      color: 0x5bc0de, // Vivid sky blue window panes
      transparent: true,
      opacity: 0.85,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    // Place windows along the West Wall
    [-Math.min(1.8, halfL * 0.6), 0, Math.min(1.8, halfL * 0.6)].forEach(posZ => {
      const winGrp = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(wallThick * 1.05, 1.6, 0.9), frameMat);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(wallThick * 1.1, 1.45, 0.75), windowMat);
      winGrp.add(frame, glass);
      winGrp.position.set(-halfW - wallThick / 2, 1.4, posZ);
      group.add(winGrp);
    });

    // Architectural CAD Grid (Automatically hides over applied floor textures for clean unobstructed rendering)
    const hasAppliedFloorTexture = Boolean(floorTextureUrl);
    if (showGrid && !hasAppliedFloorTexture && viewMode !== 'Walk') {
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
      const modelKey = `${obj.modelUrl || ''}_${obj.category}_${obj.color || ''}`;

      if (!group || group.userData?.modelKey !== modelKey) {
        if (group) {
          state.scene.remove(group);
          existingMeshes.delete(obj.id);
        }
        group = new THREE.Group();
        group.name = obj.id;
        group.userData = {
          elementType: 'object',
          objectId: obj.id,
          modelKey,
          baseDimensions: { ...obj.dimensions },
        };

        // Invisible selection volume hitbox for 100% reliable click-detection
        const wMeters = (obj.dimensions?.width || 36) * 0.0254;
        const hMeters = (obj.dimensions?.height || 30) * 0.0254;
        const dMeters = (obj.dimensions?.depth || 36) * 0.0254;
        const hitboxGeo = new THREE.BoxGeometry(wMeters, hMeters, dMeters);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.name = 'selection_hitbox';
        hitbox.position.set(0, hMeters / 2, 0);
        hitbox.userData = { objectId: obj.id };
        group.add(hitbox);

        const normalizeAndScaleModel = (modelScene: THREE.Group, targetObj: StudioObject3D) => {
          const box = new THREE.Box3().setFromObject(modelScene);
          const size = box.getSize(new THREE.Vector3());
          const targetX = (targetObj.dimensions?.width || 36) * 0.0254;
          const targetY = (targetObj.dimensions?.height || 30) * 0.0254;
          const targetZ = (targetObj.dimensions?.depth || 36) * 0.0254;

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
          applySubElementsToMesh(modelScene, targetObj);
        };

        if (obj.modelUrl) {
          const cached = gltfCache.get(obj.modelUrl);
          if (cached) {
            const clone = cached.clone(true);
            normalizeAndScaleModel(clone, obj);
            group.add(clone);
          } else {
            const placeholder = createProcedural3DMesh(obj);
            placeholder.name = 'placeholder_mesh';
            group.add(placeholder);

            loader.load(
              obj.modelUrl,
              gltf => {
                gltfCache.set(obj.modelUrl!, gltf.scene);
                const currentGrp = state.objectMeshes.get(obj.id);
                if (currentGrp) {
                  const old = currentGrp.getObjectByName('placeholder_mesh');
                  if (old) currentGrp.remove(old);

                  const modelScene = gltf.scene.clone(true);
                  normalizeAndScaleModel(modelScene, obj);
                  currentGrp.add(modelScene);
                }
              },
              undefined,
              () => {}
            );
          }
        } else {
          const mesh = createProcedural3DMesh(obj);
          group.add(mesh);
        }

        state.scene.add(group);
        existingMeshes.set(obj.id, group);
      }

      // In-place real-time transform updates (No teardown, no reload lag)
      const baseW = group.userData?.baseDimensions?.width || obj.dimensions.width;
      const baseH = group.userData?.baseDimensions?.height || obj.dimensions.height;
      const baseD = group.userData?.baseDimensions?.depth || obj.dimensions.depth;
      const scaleX = obj.dimensions.width / (baseW || 1);
      const scaleY = obj.dimensions.height / (baseH || 1);
      const scaleZ = obj.dimensions.depth / (baseD || 1);
      group.scale.set(scaleX, scaleY, scaleZ);

      group.position.set(obj.position.x, obj.position.y, obj.position.z);
      group.rotation.set(
        THREE.MathUtils.degToRad(obj.rotation.x),
        THREE.MathUtils.degToRad(obj.rotation.y),
        THREE.MathUtils.degToRad(obj.rotation.z)
      );

      const isSel = selectedTarget?.type === 'object' && selectedTarget.id === obj.id;
      if (isSel) {
        state.selectedMesh = group;
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

    let selectedObjId: string | null = null;
    let selectedGroup: THREE.Group | null = null;

    for (const hit of objIntersects) {
      if (hit.object.name === 'bbox' || hit.object instanceof THREE.LineSegments) continue;
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr !== state.scene) {
        if (curr.userData?.objectId && state.objectMeshes.has(curr.userData.objectId)) {
          selectedObjId = curr.userData.objectId;
          selectedGroup = state.objectMeshes.get(curr.userData.objectId) || null;
          break;
        }
        if (curr.name && state.objectMeshes.has(curr.name)) {
          selectedObjId = curr.name;
          selectedGroup = state.objectMeshes.get(curr.name) || null;
          break;
        }
        curr = curr.parent;
      }
      if (selectedObjId && selectedGroup) break;
    }

    if (selectedObjId && selectedGroup) {
      setSelectedTarget({ type: 'object', id: selectedObjId });
      state.selectedMesh = selectedGroup;

      const targetObj = objects.find(o => o.id === selectedObjId);
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

        // Smoothly update position on Three.js group (hardware-accelerated 60 FPS)
        state.selectedMesh.position.x = finalX;
        state.selectedMesh.position.z = finalZ;
        dragLastPosRef.current = { x: finalX, z: finalZ };
        setIsOnFloor(selectedObject.position.y <= 0.02);
      }
    } else if (e.buttons === 1 && viewMode === '3D' && activeTool === 'Orbit') {
      // True spherical polar coordinate orbit: identical smooth sensitivity in horizontal & vertical
      const rotSpeed = 0.005;
      state.orbitTheta = (state.orbitTheta ?? 0) - e.movementX * rotSpeed;
      state.orbitPhi = (state.orbitPhi ?? 1.0) - e.movementY * rotSpeed;
      // Clamp vertical polar angle so camera orbits smoothly over top without flipping or dipping below floor
      state.orbitPhi = Math.max(0.06, Math.min(Math.PI / 2 - 0.03, state.orbitPhi));

      const target = state.orbitTarget || new THREE.Vector3(0, 0.8, 0);
      const radius = state.orbitRadius || 10;
      const x = target.x + radius * Math.sin(state.orbitPhi) * Math.sin(state.orbitTheta);
      const y = target.y + radius * Math.cos(state.orbitPhi);
      const z = target.z + radius * Math.sin(state.orbitPhi) * Math.cos(state.orbitTheta);
      state.camera.position.set(x, y, z);
      state.camera.lookAt(target);
    } else if (e.buttons === 1 && viewMode === '3D' && activeTool === 'Pan') {
      // Smooth parallel camera panning along view right and up vectors
      const panSpeed = 0.008;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      state.camera.matrix.extractBasis(right, up, new THREE.Vector3());
      const delta = right.clone().multiplyScalar(-e.movementX * panSpeed).add(up.clone().multiplyScalar(e.movementY * panSpeed));
      state.camera.position.add(delta);
      if (state.orbitTarget) state.orbitTarget.add(delta);
    }
  };

  // Push a state snapshot into Undo history stack
  const pushHistory = useCallback((actionName: string, customObjects?: StudioObject3D[], customRoom?: RoomDefinition) => {
    const snapshot: HistorySnapshot = {
      actionName,
      objects: JSON.parse(JSON.stringify(customObjects || objects)),
      roomDef: JSON.parse(JSON.stringify(customRoom || roomDef)),
    };
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
    setLastUndoName(actionName);
    setLastRedoName('');
  }, [objects, roomDef]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) {
      addToast('Nothing to undo', 'blue');
      return;
    }
    const currentSnapshot: HistorySnapshot = {
      actionName: lastUndoName || 'Current State',
      objects: JSON.parse(JSON.stringify(objects)),
      roomDef: JSON.parse(JSON.stringify(roomDef)),
    };
    redoStackRef.current.push(currentSnapshot);

    const prev = undoStackRef.current.pop()!;
    onObjectsChange(prev.objects);
    if (JSON.stringify(prev.roomDef) !== JSON.stringify(roomDef)) {
      setRoomDef(prev.roomDef);
      onRoomChange?.(prev.roomDef);
    }

    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    setLastUndoName(undoStackRef.current.length > 0 ? undoStackRef.current[undoStackRef.current.length - 1].actionName : '');
    setLastRedoName(prev.actionName);

    addToast(`Undo: ${prev.actionName}`, 'blue');
  }, [objects, roomDef, lastUndoName, onObjectsChange, onRoomChange]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) {
      addToast('Nothing to redo', 'blue');
      return;
    }
    const nextSnapshot = redoStackRef.current.pop()!;
    const currentSnapshot: HistorySnapshot = {
      actionName: nextSnapshot.actionName,
      objects: JSON.parse(JSON.stringify(objects)),
      roomDef: JSON.parse(JSON.stringify(roomDef)),
    };
    undoStackRef.current.push(currentSnapshot);

    onObjectsChange(nextSnapshot.objects);
    if (JSON.stringify(nextSnapshot.roomDef) !== JSON.stringify(roomDef)) {
      setRoomDef(nextSnapshot.roomDef);
      onRoomChange?.(nextSnapshot.roomDef);
    }

    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    setLastUndoName(nextSnapshot.actionName);
    setLastRedoName(redoStackRef.current.length > 0 ? redoStackRef.current[redoStackRef.current.length - 1].actionName : '');

    addToast(`Redo: ${nextSnapshot.actionName}`, 'blue');
  }, [objects, roomDef, onObjectsChange, onRoomChange]);

  const handlePointerUp = () => {
    const state = threeStateRef.current;
    if (state) {
      if (state.isDragging && selectedObject && dragLastPosRef.current) {
        const { x, z } = dragLastPosRef.current;
        const updated = objects.map(o =>
          o.id === selectedObject.id
            ? { ...o, position: { ...o.position, x, z } }
            : o
        );
        pushHistory(`Moved ${selectedObject.name}`, updated);
        onObjectsChange(updated);
        dragLastPosRef.current = null;
      }
      state.isDragging = false;
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

      if (threeStateRef.current?.selectedMesh) {
        threeStateRef.current.selectedMesh.position.x = targetX;
        threeStateRef.current.selectedMesh.position.z = targetZ;
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
    const currentDeg = selectedObject.rotation[axis] || 0;
    const newDeg = (currentDeg + delta + 360) % 360;

    if (threeStateRef.current?.selectedMesh) {
      threeStateRef.current.selectedMesh.rotation[axis] = THREE.MathUtils.degToRad(newDeg);
    }

    const updated = objects.map(o =>
      o.id === selectedObject.id
        ? {
            ...o,
            rotation: {
              ...o.rotation,
              [axis]: newDeg,
            },
          }
        : o
    );
    pushHistory(`Rotated ${selectedObject.name} (${dir === 'right' ? '+15°' : '-15°'})`, updated);
    onObjectsChange(updated);
  }, [selectedObject, rotationAxis, objects, onObjectsChange, pushHistory]);

  const handleResetRotation = useCallback(() => {
    if (!selectedObject) return;
    if (threeStateRef.current?.selectedMesh) {
      threeStateRef.current.selectedMesh.rotation.set(0, 0, 0);
    }
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
    const step = 0.15; // 0.15m = ~6 inches (clear visible height step)
    const newY = Math.max(0, Math.min(2.8, Math.round((selectedObject.position.y + (dir === 'up' ? step : -step)) * 100) / 100));
    setIsOnFloor(newY <= 0.02);

    if (threeStateRef.current?.selectedMesh) {
      threeStateRef.current.selectedMesh.position.y = newY;
    }

    const updated = objects.map(o =>
      o.id === selectedObject.id
        ? { ...o, position: { ...o.position, y: newY } }
        : o
    );
    pushHistory(`Elevated ${selectedObject.name} (${dir === 'up' ? '+15cm' : '-15cm'})`, updated);
    onObjectsChange(updated);
  }, [selectedObject, objects, onObjectsChange, pushHistory]);

  const handleSnapToFloor = useCallback(() => {
    if (!selectedObject) return;
    setIsOnFloor(true);
    if (threeStateRef.current?.selectedMesh) {
      threeStateRef.current.selectedMesh.position.y = 0;
    }
    const updated = objects.map(o =>
      o.id === selectedObject.id
        ? { ...o, position: { ...o.position, y: 0 } }
        : o
    );
    pushHistory(`Placed ${selectedObject.name} on Floor`, updated);
    onObjectsChange(updated);
    addToast('Object placed directly on the floor (Y = 0.00m)', 'green');
  }, [selectedObject, objects, onObjectsChange, pushHistory]);

  // Snap camera to canonical orientations (Top, Front, Side, Isometric 3D)
  const handleSnapCameraView = useCallback((view: 'top' | 'front' | 'side' | 'isometric') => {
    const state = threeStateRef.current;
    if (!state) return;
    const target = state.orbitTarget || new THREE.Vector3(0, 0.8, 0);
    const radius = state.orbitRadius || 10;

    if (view === 'top') {
      state.orbitTheta = 0;
      state.orbitPhi = 0.08;
      state.camera.position.set(target.x, target.y + radius, target.z + 0.001);
    } else if (view === 'front') {
      state.orbitTheta = 0;
      state.orbitPhi = Math.PI / 2 - 0.1;
      state.camera.position.set(target.x, target.y + 1.2, target.z + radius);
    } else if (view === 'side') {
      state.orbitTheta = Math.PI / 2;
      state.orbitPhi = Math.PI / 2 - 0.1;
      state.camera.position.set(target.x + radius, target.y + 1.2, target.z);
    } else {
      // Isometric 3D perspective
      state.orbitTheta = Math.PI / 4;
      state.orbitPhi = Math.PI / 3;
      const x = target.x + radius * Math.sin(state.orbitPhi) * Math.sin(state.orbitTheta);
      const y = target.y + radius * Math.cos(state.orbitPhi);
      const z = target.z + radius * Math.sin(state.orbitPhi) * Math.cos(state.orbitTheta);
      state.camera.position.set(x, y, z);
    }
    state.camera.lookAt(target);
    addToast(`Camera aligned to ${view.toUpperCase()} view`, 'blue');
  }, []);

  // Live Object Color, Texture & Material Customization with instant GPU mesh updates
  const handleUpdateObjectMaterial = useCallback(
    (updates: { color?: string; material?: string; roughness?: number; metalness?: number }) => {
      if (!selectedObject) return;

      const newColor = updates.color || selectedObject.color || '#3b533a';
      const newMaterial = updates.material || selectedObject.material || 'fabric';

      // 1. Update React state for persistence
      onObjectsChange(
        objects.map(o =>
          o.id === selectedObject.id
            ? { ...o, color: newColor, material: newMaterial }
            : o
        )
      );

      // 2. Hardware-accelerated 60 FPS real-time Three.js mesh update
      const state = threeStateRef.current;
      if (state) {
        const group = state.objectMeshes.get(selectedObject.id);
        if (group) {
          const threeColor = new THREE.Color(newColor);
          group.traverse(child => {
            if ((child as THREE.Mesh).isMesh && child.name !== 'selection_hitbox' && child.name !== 'bbox') {
              const mesh = child as THREE.Mesh;
              if (mesh.material) {
                const applyToMat = (mat: THREE.Material) => {
                  if ('color' in mat) (mat as any).color = threeColor;
                  if (updates.roughness !== undefined && 'roughness' in mat) (mat as any).roughness = updates.roughness;
                  if (updates.metalness !== undefined && 'metalness' in mat) (mat as any).metalness = updates.metalness;
                  mat.needsUpdate = true;
                };
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(applyToMat);
                } else {
                  applyToMat(mesh.material);
                }
              }
            }
          });
        }
      }
      addToast(`Applied ${newMaterial} (${newColor})`, 'green');
    },
    [selectedObject, objects, onObjectsChange]
  );

  const handleScaleObject = useCallback((deltaRatio: number, customAddValInches?: number) => {
    if (!selectedObject) return;
    let newWidth: number;
    let newHeight: number;
    let newDepth: number;

    if (customAddValInches !== undefined && customAddValInches !== 0) {
      const curW = selectedObject.dimensions.width;
      const curH = selectedObject.dimensions.height;
      const curD = selectedObject.dimensions.depth;
      if (uniformLocked) {
        const ratio = Math.max(0.1, (curW + customAddValInches) / (curW || 1));
        newWidth = Math.max(2, Math.min(400, Math.round(curW * ratio * 10) / 10));
        newHeight = Math.max(2, Math.min(400, Math.round(curH * ratio * 10) / 10));
        newDepth = Math.max(2, Math.min(400, Math.round(curD * ratio * 10) / 10));
      } else {
        newWidth = Math.max(2, Math.min(400, Math.round((curW + customAddValInches) * 10) / 10));
        newHeight = Math.max(2, Math.min(400, Math.round((curH + customAddValInches) * 10) / 10));
        newDepth = Math.max(2, Math.min(400, Math.round((curD + customAddValInches) * 10) / 10));
      }
    } else {
      const factor = 1 + deltaRatio;
      newWidth = Math.max(2, Math.min(400, Math.round(selectedObject.dimensions.width * factor * 10) / 10));
      newHeight = Math.max(2, Math.min(400, Math.round(selectedObject.dimensions.height * factor * 10) / 10));
      newDepth = Math.max(2, Math.min(400, Math.round(selectedObject.dimensions.depth * factor * 10) / 10));
    }

    // Hardware-accelerated 60 FPS Three.js mesh update
    const state = threeStateRef.current;
    if (state?.selectedMesh) {
      const baseW = state.selectedMesh.userData?.baseDimensions?.width || 36;
      const baseH = state.selectedMesh.userData?.baseDimensions?.height || 30;
      const baseD = state.selectedMesh.userData?.baseDimensions?.depth || 36;
      state.selectedMesh.scale.set(
        newWidth / (baseW || 1),
        newHeight / (baseH || 1),
        newDepth / (baseD || 1)
      );
      if (state.selectionBox) {
        state.selectionBox.setFromObject(state.selectedMesh);
        state.selectionBox.update();
      }
    }

    const updated = objects.map(o =>
      o.id === selectedObject.id
        ? {
            ...o,
            dimensions: {
              width: newWidth,
              height: newHeight,
              depth: newDepth,
            },
          }
        : o
    );

    const actionDesc = customAddValInches !== undefined
      ? `Resized ${selectedObject.name} (${customAddValInches > 0 ? '+' : ''}${Math.round(customAddValInches * 25.4)}mm)`
      : `Scaled ${selectedObject.name} (${deltaRatio > 0 ? '+10%' : '-10%'})`;

    pushHistory(actionDesc, updated);
    onObjectsChange(updated);

    const dispW = inchesToUnit(newWidth, unitMode);
    const dispD = inchesToUnit(newDepth, unitMode);
    const dispH = inchesToUnit(newHeight, unitMode);
    addToast(`${actionDesc}: ${dispW} × ${dispD} × ${dispH} ${unitMode}`, 'blue');
  }, [selectedObject, objects, uniformLocked, unitMode, onObjectsChange, pushHistory]);

  const handleDeleteObject = useCallback(() => {
    if (!selectedObject) return;
    const updated = objects.filter(o => o.id !== selectedObject.id);
    pushHistory(`Deleted ${selectedObject.name}`, updated);
    onObjectsChange(updated);
    setSelectedTarget(null);
  }, [selectedObject, objects, onObjectsChange, pushHistory]);

  // ── 7. Keyboard Listeners ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (threeStateRef.current) {
        threeStateRef.current.keysDown.add(e.code);
      }
      if (e.key === 'Shift') setIsShiftPressed(true);

      // Global Undo (Ctrl+Z) & Redo (Ctrl+Y / Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

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
  }, [selectedObject, handleMoveObject, handleRotate, handleElevate, handleDeleteObject, handleUndo, handleRedo]);

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
    const updated = [...objects, dup];
    pushHistory(`Duplicated ${selectedObject.name}`, updated);
    onObjectsChange(updated);
    setSelectedTarget({ type: 'object', id: dup.id });
    addToast('Object duplicated successfully.', 'blue');
  };

  const handleDimensionChange = (key: 'width' | 'height' | 'depth', valInActiveUnit: number) => {
    if (!selectedObject) return;
    const valInches = Math.max(2, Math.min(400, unitToInches(valInActiveUnit, unitMode)));
    const oldVal = selectedObject.dimensions[key];
    const ratio = valInches / (oldVal || 1);

    let newDims = { ...selectedObject.dimensions, [key]: Math.round(valInches * 10) / 10 };
    if (uniformLocked) {
      newDims = {
        width: Math.max(2, Math.min(400, Math.round(selectedObject.dimensions.width * ratio * 10) / 10)),
        height: Math.max(2, Math.min(400, Math.round(selectedObject.dimensions.height * ratio * 10) / 10)),
        depth: Math.max(2, Math.min(400, Math.round(selectedObject.dimensions.depth * ratio * 10) / 10)),
      };
    }

    // Hardware-accelerated 60 FPS mesh scale update
    const state = threeStateRef.current;
    if (state?.selectedMesh) {
      const baseW = state.selectedMesh.userData?.baseDimensions?.width || 36;
      const baseH = state.selectedMesh.userData?.baseDimensions?.height || 30;
      const baseD = state.selectedMesh.userData?.baseDimensions?.depth || 36;
      state.selectedMesh.scale.set(
        newDims.width / (baseW || 1),
        newDims.height / (baseH || 1),
        newDims.depth / (baseD || 1)
      );
      if (state.selectionBox) {
        state.selectionBox.setFromObject(state.selectedMesh);
        state.selectionBox.update();
      }
    }

    const updated = objects.map(o =>
      o.id === selectedObject.id ? { ...o, dimensions: newDims } : o
    );
    pushHistory(`Adjusted ${key} of ${selectedObject.name}`, updated);
    onObjectsChange(updated);
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
      className={`flex flex-col select-none relative font-sans transition-colors duration-200 ${
        isExpandedView
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : 'w-full h-full min-h-[750px]'
      } ${
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
            onClick={handleUndo}
            disabled={!canUndo}
            className={`px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
              canUndo
                ? 'bg-white hover:bg-slate-100 text-slate-700 shadow-2xs border border-slate-200'
                : 'text-slate-300 border border-transparent cursor-not-allowed'
            }`}
            title={canUndo ? `Undo: ${lastUndoName} (Ctrl+Z)` : 'Nothing to undo (Ctrl+Z)'}
          >
            <Undo2 size={13} />
            <span>Undo</span>
            {canUndo && lastUndoName && (
              <span className="text-[10px] text-blue-600 font-mono max-w-[120px] truncate hidden md:inline">
                ({lastUndoName})
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className={`px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
              canRedo
                ? 'bg-white hover:bg-slate-100 text-slate-700 shadow-2xs border border-slate-200'
                : 'text-slate-300 border border-transparent cursor-not-allowed'
            }`}
            title={canRedo ? `Redo: ${lastRedoName} (Ctrl+Y)` : 'Nothing to redo (Ctrl+Y)'}
          >
            <Redo2 size={13} />
            <span>Redo</span>
            {canRedo && lastRedoName && (
              <span className="text-[10px] text-purple-600 font-mono max-w-[120px] truncate hidden md:inline">
                ({lastRedoName})
              </span>
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all font-bold ${
              isExpandedView
                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={isExpandedView ? 'Exit Fullscreen / Minimize Studio (Esc)' : 'Expand Studio Fullscreen'}
          >
            {isExpandedView ? <Minimize2 size={13} className="text-rose-600" /> : <Maximize2 size={13} />}
            <span>{isExpandedView ? 'Exit Fullscreen' : 'Big Studio'}</span>
          </button>

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
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center gap-1.5 text-slate-400">
                  <div className="w-8 h-8 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <Box size={16} />
                  </div>
                  <span className="font-semibold text-xs text-slate-600">No object selected</span>
                  <span className="text-[10px] text-slate-400">Click any object in the 3D room to inspect & transform</span>
                </div>

                {/* ── Room Architecture & Dimensions Panel ── */}
                <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <LayoutDashboard size={14} className="text-rose-500" />
                      <span className="font-bold text-xs text-slate-800">Room Architecture</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                      {currentRoom.type}
                    </span>
                  </div>

                  {/* Room Shape Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Room Boundary Shape
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'rectangle' as const, label: 'Rect', icon: '⬚' },
                        { id: 'square' as const, label: 'Square', icon: '⏹' },
                        { id: 'l-shape' as const, label: 'L-Shape', icon: '⌞' },
                        { id: 't-shape' as const, label: 'T-Shape', icon: '⊤' },
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleRoomParamChange({ shape: s.id })}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 border transition-all ${
                            (roomDef.shape || 'rectangle') === s.id
                              ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-xs">{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dimensions: Length, Width, Height (Live 60 FPS Re-rendering) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Length</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="4"
                          max="80"
                          value={roomDef.length}
                          onChange={e => handleRoomParamChange({ length: Number(e.target.value) || 1 })}
                          className="w-full text-xs font-mono font-bold p-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 focus:outline-rose-500"
                        />
                        <span className="text-[10px] text-slate-400">ft</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Width</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="4"
                          max="80"
                          disabled={roomDef.shape === 'square'}
                          value={roomDef.shape === 'square' ? roomDef.length : roomDef.width}
                          onChange={e => handleRoomParamChange({ width: Number(e.target.value) || 1 })}
                          className="w-full text-xs font-mono font-bold p-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 disabled:opacity-60 focus:outline-rose-500"
                        />
                        <span className="text-[10px] text-slate-400">ft</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Height</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="7"
                          max="25"
                          value={roomDef.height}
                          onChange={e => handleRoomParamChange({ height: Number(e.target.value) || 8 })}
                          className="w-full text-xs font-mono font-bold p-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 focus:outline-rose-500"
                        />
                        <span className="text-[10px] text-slate-400">ft</span>
                      </div>
                    </div>
                  </div>

                  {/* L-Shape Cutout Params (if L-Shape) */}
                  {roomDef.shape === 'l-shape' && (
                    <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-100 space-y-1.5">
                      <span className="text-[9px] font-bold text-rose-700 block uppercase">L-Cutout Dimensions</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] text-slate-500 block">Cutout L</span>
                          <input
                            type="number"
                            step="0.5"
                            min="2"
                            max={Math.max(roomDef.length - 2, 2)}
                            value={roomDef.lShapeParams?.cutoutLength || Math.round(roomDef.length * 0.45)}
                            onChange={e => handleRoomParamChange({
                              lShapeParams: {
                                length1: roomDef.length,
                                width1: roomDef.width,
                                cutoutLength: Number(e.target.value) || 2,
                                cutoutWidth: roomDef.lShapeParams?.cutoutWidth || Math.round(roomDef.width * 0.45)
                              }
                            })}
                            className="w-full text-xs font-mono p-1 rounded border border-rose-200 bg-white"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Cutout W</span>
                          <input
                            type="number"
                            step="0.5"
                            min="2"
                            max={Math.max(roomDef.width - 2, 2)}
                            value={roomDef.lShapeParams?.cutoutWidth || Math.round(roomDef.width * 0.45)}
                            onChange={e => handleRoomParamChange({
                              lShapeParams: {
                                length1: roomDef.length,
                                width1: roomDef.width,
                                cutoutLength: roomDef.lShapeParams?.cutoutLength || Math.round(roomDef.length * 0.45),
                                cutoutWidth: Number(e.target.value) || 2
                              }
                            })}
                            className="w-full text-xs font-mono p-1 rounded border border-rose-200 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wall Thickness Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Wall Thickness
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { val: 4.5, label: '4.5"' },
                        { val: 6.0, label: '6.0"' },
                        { val: 9.0, label: '9.0"' },
                        { val: 12.0, label: '12.0"' },
                      ].map(w => (
                        <button
                          key={w.val}
                          type="button"
                          onClick={() => handleRoomParamChange({ wallWidthInches: w.val })}
                          className={`py-1 rounded-md text-[10px] font-bold border transition-all text-center ${
                            (roomDef.wallWidthInches || 4.5) === w.val
                              ? 'bg-slate-900 text-white border-slate-950 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Room Metrics Calculated Badges */}
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100">
                    <div className="p-1.5 rounded-lg bg-slate-50 text-center">
                      <span className="text-[9px] text-slate-400 block font-semibold">Carpet Area</span>
                      <span className="text-xs font-mono font-bold text-rose-600">
                        {Math.round(currentRoom.carpetAreaSqFt || currentRoom.floorAreaSqFt || 0)} <span className="text-[8px]">sq.ft</span>
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 text-center">
                      <span className="text-[9px] text-slate-400 block font-semibold">Perimeter</span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {Math.round(currentRoom.perimeterFt)} <span className="text-[8px]">ft</span>
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 text-center">
                      <span className="text-[9px] text-slate-400 block font-semibold">Wall Area</span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {Math.round(currentRoom.wallAreaSqFt)} <span className="text-[8px]">sq.ft</span>
                      </span>
                    </div>
                  </div>
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
                          setShowGrid(false); // Clean floor without CAD grid lines overlaying the texture
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

                {/* Elevation Status / Snap to Floor */}
                <div className="p-2.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between text-xs shadow-2xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">Height off Floor</span>
                    <span className="font-bold text-slate-800">
                      {selectedObject.position.y <= 0.02
                        ? 'On Floor (0.00m)'
                        : `+${selectedObject.position.y.toFixed(2)}m (${Math.round(selectedObject.position.y * 39.37)}")`}
                    </span>
                  </div>
                  {selectedObject.position.y > 0.02 && (
                    <button
                      type="button"
                      onClick={handleSnapToFloor}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200 transition-all flex items-center gap-1"
                      title="Snap to floor"
                    >
                      <span>⚡ Snap to Floor</span>
                    </button>
                  )}
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

                {/* ── Object Color, Texture & Material Finishes (Live 3D Update) ── */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Palette size={14} className="text-blue-600" />
                      <span className="font-semibold text-slate-800 text-xs">Color & Texture</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{selectedObject.color || '#3b533a'}</span>
                  </div>

                  {/* Designer Palette Swatches */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block mb-1.5">Color Swatches</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { name: 'Charcoal', hex: '#262626' },
                        { name: 'Ivory Cream', hex: '#f8fafc' },
                        { name: 'Navy Blue', hex: '#1e3a8a' },
                        { name: 'Forest Green', hex: '#1b4332' },
                        { name: 'Warm Oak', hex: '#9b7145' },
                        { name: 'Cognac Leather', hex: '#873e23' },
                        { name: 'Terracotta', hex: '#b45309' },
                        { name: 'Mustard Gold', hex: '#d97706' },
                        { name: 'Sage Green', hex: '#4d7c0f' },
                        { name: 'Slate Grey', hex: '#475569' },
                      ].map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => handleUpdateObjectMaterial({ color: c.hex })}
                          className={`h-7 rounded-lg border transition-all relative flex items-center justify-center ${
                            (selectedObject.color || '').toLowerCase() === c.hex.toLowerCase()
                              ? 'ring-2 ring-blue-600 ring-offset-1 scale-105 shadow-xs'
                              : 'border-slate-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {(selectedObject.color || '').toLowerCase() === c.hex.toLowerCase() && (
                            <span className={c.hex === '#f8fafc' ? 'text-slate-800 text-[10px] font-black' : 'text-white text-[10px] font-black'}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-500 font-medium">Custom Color:</span>
                      <input
                        type="color"
                        value={selectedObject.color || '#3b533a'}
                        onChange={e => handleUpdateObjectMaterial({ color: e.target.value })}
                        className="w-6 h-6 p-0 border border-slate-300 rounded cursor-pointer"
                        title="Pick custom color"
                      />
                      <input
                        type="text"
                        value={selectedObject.color || '#3b533a'}
                        onChange={e => handleUpdateObjectMaterial({ color: e.target.value })}
                        className="flex-1 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200 bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Material & Texture Finishes */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block mb-1.5">Material Texture Finish</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'fabric', label: 'Fabric Linen', roughness: 0.85, metalness: 0.02 },
                        { id: 'velvet', label: 'Velvet', roughness: 0.95, metalness: 0.0 },
                        { id: 'leather', label: 'Leather', roughness: 0.45, metalness: 0.12 },
                        { id: 'wood', label: 'Natural Wood', roughness: 0.65, metalness: 0.05 },
                        { id: 'marble', label: 'Marble', roughness: 0.20, metalness: 0.05 },
                        { id: 'metal', label: 'Brass / Metal', roughness: 0.35, metalness: 0.85 },
                      ].map(mat => (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => handleUpdateObjectMaterial({ material: mat.id, roughness: mat.roughness, metalness: mat.metalness })}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all text-center ${
                            (selectedObject.material || 'fabric') === mat.id
                              ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Adjust Dimensions & 3-Tier Metric Unit Sizing ── */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">Adjust Dimensions & Sizing</span>
                    <span className="text-[9px] text-slate-400 block">Precision metric modelling with 60 FPS live scale</span>
                  </div>

                  {/* 3-Tier Metric Measurement Unit Selector */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Measurement Unit</span>
                      <span className="text-[9px] font-semibold text-blue-600">
                        {unitMode === 'mm' ? 'Primary: Millimetres (mm)' : unitMode === 'cm' ? 'Secondary: Centimetres (cm)' : 'Secondary: Metres (m)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                      {(['mm', 'cm', 'm'] as const).map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnitMode(u)}
                          className={`py-1 rounded text-center transition-all ${
                            unitMode === u ? 'bg-blue-600 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Uniform Scale Lock Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-600">Uniform Proportional Lock</span>
                    <button
                      type="button"
                      onClick={() => setUniformLocked(!uniformLocked)}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                        uniformLocked
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {uniformLocked ? <Lock size={11} /> : <Unlock size={11} />}
                      <span>{uniformLocked ? 'Locked' : 'Unlocked'}</span>
                    </button>
                  </div>

                  {/* Quick Scale Up & Scale Down Buttons */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Scale Buttons</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleScaleObject(-0.1)}
                        className="py-2 px-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                        title="Scale Down (-10%)"
                      >
                        <Minimize2 size={13} />
                        <span>Size -10%</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScaleObject(0.1)}
                        className="py-2 px-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                        title="Scale Up (+10%)"
                      >
                        <Maximize2 size={13} />
                        <span>Size +10%</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const def = MARKETPLACE_OBJECTS_CATALOG.find(m => m.name === selectedObject.name);
                          if (def) {
                            const updated = objects.map(o =>
                              o.id === selectedObject.id ? { ...o, dimensions: { ...def.dimensions } } : o
                            );
                            pushHistory(`Reset dimensions of ${selectedObject.name}`, updated);
                            onObjectsChange(updated);
                            addToast('Dimensions reset to default', 'blue');
                          }
                        }}
                        className="py-2 px-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-all active:scale-95 text-center"
                        title="Reset dimensions to default"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Custom Size Addition in Numbers */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Custom Size Addition</span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{unitMode}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={customSizeStep}
                        onChange={e => setCustomSizeStep(Math.max(1, Number(e.target.value) || 1))}
                        className="w-20 text-xs font-mono font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-center focus:outline-blue-500"
                        placeholder="50"
                      />
                      <span className="text-xs font-bold text-slate-600">{unitMode}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const inInches = unitToInches(customSizeStep, unitMode);
                          handleScaleObject(0, -inInches);
                        }}
                        className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1 active:scale-95"
                        title={`Subtract ${customSizeStep} ${unitMode}`}
                      >
                        <span>-{customSizeStep} {unitMode}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const inInches = unitToInches(customSizeStep, unitMode);
                          handleScaleObject(0, inInches);
                        }}
                        className="flex-1 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white text-xs font-bold text-blue-700 transition-all flex items-center justify-center gap-1 active:scale-95"
                        title={`Add ${customSizeStep} ${unitMode}`}
                      >
                        <span>+{customSizeStep} {unitMode}</span>
                      </button>
                    </div>
                    <div className="flex gap-1 text-[9px] font-bold text-slate-500 justify-end">
                      {[10, 50, 100, 250].map(step => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setCustomSizeStep(unitMode === 'm' ? step / 1000 : unitMode === 'cm' ? step / 10 : step)}
                          className="px-1.5 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100"
                        >
                          {unitMode === 'm' ? `${step / 1000}m` : unitMode === 'cm' ? `${step / 10}cm` : `${step}mm`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Individual Dimension Steppers in Active Metric Unit */}
                  <div className="space-y-2.5 pt-1 border-t border-slate-100">
                    {(['width', 'depth', 'height'] as const).map(dimKey => {
                      const currentVal = inchesToUnit(selectedObject.dimensions[dimKey], unitMode);
                      const label = dimKey === 'width' ? 'Width (W)' : dimKey === 'depth' ? 'Depth (D)' : 'Height (H)';
                      const stepVal = unitMode === 'mm' ? 10 : unitMode === 'cm' ? 1 : 0.05;

                      return (
                        <div key={dimKey} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-600">{label}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDimensionChange(dimKey, Math.max(stepVal, currentVal - (unitMode === 'mm' ? 25 : unitMode === 'cm' ? 2.5 : 0.05)))}
                                className="w-5 h-5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold active:scale-95 text-[10px]"
                                title="Decrease"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                step={stepVal}
                                value={currentVal}
                                onChange={e => handleDimensionChange(dimKey, Number(e.target.value) || 1)}
                                className="w-16 p-0.5 text-center font-mono font-bold text-slate-900 border border-slate-200 rounded text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleDimensionChange(dimKey, currentVal + (unitMode === 'mm' ? 25 : unitMode === 'cm' ? 2.5 : 0.05))}
                                className="w-5 h-5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold active:scale-95 text-[10px]"
                                title="Increase"
                              >
                                +
                              </button>
                              <span className="text-[10px] font-bold text-slate-400 w-6 text-left">{unitMode}</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={unitMode === 'mm' ? 100 : unitMode === 'cm' ? 10 : 0.1}
                            max={unitMode === 'mm' ? 4000 : unitMode === 'cm' ? 400 : 4.0}
                            step={stepVal}
                            value={currentVal}
                            onChange={e => handleDimensionChange(dimKey, Number(e.target.value))}
                            className="w-full accent-blue-600 h-1.5"
                          />
                        </div>
                      );
                    })}
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
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all hover:scale-105"
              title={isExpandedView ? 'Exit Fullscreen (Esc)' : 'Toggle Fullscreen'}
            >
              {isExpandedView ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
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

          {/* ── ON-CANVAS PROJECTED 3D HUD (Arranged AROUND the object perimeter with completely open center) ── */}
          {selectedObject && viewMode !== 'Walk' && (
            <div
              ref={hudRef}
              style={{
                display: 'none',
                left: 0,
                top: 0,
              }}
              className="absolute z-30 pointer-events-none flex items-center justify-center will-change-transform"
            >
              {/* Outer Orbital Perimeter: 240px wide so all controls sit outside bounding box */}
              <div className="relative w-60 h-60 flex items-center justify-center pointer-events-none">
                {/* Center is 100% open and unobstructed - user clearly views the 3D model */}
                <div className="absolute inset-8 rounded-full border border-dashed border-blue-400/25 pointer-events-none animate-pulse" />

                {/* ── TOP DOCK: Elevation Controls + Prominent ON FLOOR Snap Button ── */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/90 shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleElevate('up')}
                    onMouseEnter={() => setHudHoverAction('Elevate Up (+0.15m / 6")')}
                    onMouseLeave={() => setHudHoverAction(null)}
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 active:scale-95"
                    title="Elevate Up (+0.15m)"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleElevate('down')}
                    onMouseEnter={() => setHudHoverAction('Lower Down (-0.15m / 6")')}
                    onMouseLeave={() => setHudHoverAction(null)}
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 active:scale-95"
                    title="Lower Down (-0.15m)"
                  >
                    <ArrowDown size={13} />
                  </button>

                  {/* ON FLOOR Action Button: Actively places object on the ground */}
                  {selectedObject.position.y <= 0.02 ? (
                    <button
                      type="button"
                      onClick={handleSnapToFloor}
                      onMouseEnter={() => setHudHoverAction('Object is aligned on ground floor')}
                      onMouseLeave={() => setHudHoverAction(null)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="Object on floor (click to re-verify)"
                    >
                      <span>✓ ON FLOOR</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSnapToFloor}
                      onMouseEnter={() => setHudHoverAction(`Place object on ground (currently elevated +${(selectedObject.position.y).toFixed(2)}m)`)}
                      onMouseLeave={() => setHudHoverAction(null)}
                      className="bg-amber-600 hover:bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1 transition-all animate-pulse hover:scale-105 active:scale-95 cursor-pointer"
                      title="Click to place object on the ground floor"
                    >
                      <span>⬇ ON FLOOR (+{(selectedObject.position.y).toFixed(2)}m)</span>
                    </button>
                  )}
                </div>

                {/* ── LEFT DOCK: Scale Controls (Outside left boundary) ── */}
                <div className="absolute -left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md p-1 rounded-full border border-slate-200/90 shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleScaleObject(0.1)}
                    onMouseEnter={() => setHudHoverAction('Size Up (+10%)')}
                    onMouseLeave={() => setHudHoverAction(null)}
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 active:scale-95"
                    title="Scale Up (+10%)"
                  >
                    <Maximize2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleObject(-0.1)}
                    onMouseEnter={() => setHudHoverAction('Size Down (-10%)')}
                    onMouseLeave={() => setHudHoverAction(null)}
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 active:scale-95"
                    title="Scale Down (-10%)"
                  >
                    <Minimize2 size={12} />
                  </button>
                </div>

                {/* ── RIGHT DOCK: Rotate Controls in Purple (Outside right boundary) ── */}
                <div className="absolute -right-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md p-1 rounded-full border border-slate-200/90 shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleRotate('left')}
                    onMouseEnter={() => setHudHoverAction('Rotate Left (-15°)')}
                    onMouseLeave={() => setHudHoverAction(null)}
                    className="w-7 h-7 rounded-full bg-purple-600 text-white shadow-xs flex items-center justify-center hover:bg-purple-700 transition-all hover:scale-110 active:scale-95"
                    title="Rotate Left (-15°)"
                  >
                    <RotateCcw size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate('right')}
                    onMouseEnter={() => setHudHoverAction('Rotate Right (+15°)')}
                    onMouseLeave={() => setHudHoverAction(null)}
                    className="w-7 h-7 rounded-full bg-purple-600 text-white shadow-xs flex items-center justify-center hover:bg-purple-700 transition-all hover:scale-110 active:scale-95"
                    title="Rotate Right (+15°)"
                  >
                    <RotateCw size={12} />
                  </button>
                </div>

                {/* ── BOTTOM DOCK: Duplicate & Delete (Outside bottom boundary) ── */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/90 shadow-lg">
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    onMouseEnter={() => setHudHoverAction('Duplicate Object')}
                    onMouseLeave={() => setHudHoverAction(null)}
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
                    title="Duplicate Object"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteObject}
                    onMouseEnter={() => setHudHoverAction('Delete Object')}
                    onMouseLeave={() => setHudHoverAction(null)}
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all hover:scale-110 active:scale-95"
                    title="Delete Object"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Floating Tooltip Label */}
                {hudHoverAction && (
                  <div className="absolute -top-14 bg-slate-900/95 text-white px-2.5 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap shadow-xl pointer-events-none z-40 border border-slate-700">
                    {hudHoverAction}
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
                Distance: {formatMetricDistance(measureDistanceMeters, unitMode)}
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

          {/* ── BOTTOM-RIGHT 3D GIZMO & FOOTER CONTROLS (Live Dynamic Rotation with X, Y, Z Axes) ── */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
            {/* Dynamic 3D Coordinate Axis Gizmo Card with View-Snap Controls */}
            <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-2 shadow-lg flex flex-col items-center gap-1.5">
              <div className="relative flex items-center justify-center cursor-pointer group" title="Live 3D Orientation Gizmo (Click to reset 3D view)" onClick={() => handleSnapCameraView('isometric')}>
                <canvas
                  ref={gizmoCanvasRef}
                  width={48}
                  height={48}
                  className="rounded-full bg-slate-50 border border-slate-200/80 shadow-2xs"
                />
              </div>

              {/* Live Rotation Euler Angle Badges (X, Y, Z) */}
              <div className="flex items-center gap-1 font-mono text-[9px] font-bold">
                <span className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">X:{cameraAngles.x}°</span>
                <span className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">Y:{cameraAngles.y}°</span>
                <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">Z:{cameraAngles.z}°</span>
              </div>

              {/* View Snap Buttons (Top, Front, Side, 3D) */}
              <div className="flex items-center gap-1 text-[9px] font-extrabold text-slate-600 pt-0.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSnapCameraView('top')}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Align camera to Top (2D Plan) View"
                >
                  Top
                </button>
                <button
                  type="button"
                  onClick={() => handleSnapCameraView('front')}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Align camera to Front Elevation View"
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => handleSnapCameraView('side')}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Align camera to Side Elevation View"
                >
                  Side
                </button>
                <button
                  type="button"
                  onClick={() => handleSnapCameraView('isometric')}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Align camera to Isometric 3D View"
                >
                  3D
                </button>
              </div>
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

// ── Helper: Highly Detailed Procedural 3D Mesh Generator ────────────────
function createProcedural3DMesh(obj: StudioObject3D): THREE.Group {
  const group = new THREE.Group();
  const w = (obj.dimensions?.width || 36) * 0.0254;
  const h = (obj.dimensions?.height || 30) * 0.0254;
  const d = (obj.dimensions?.depth || 36) * 0.0254;

  const mainColor = new THREE.Color(obj.color || '#3b533a');
  const mat = new THREE.MeshStandardMaterial({
    color: mainColor,
    roughness: 0.65,
    metalness: 0.08,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21, // Warm dark oak
    roughness: 0.7,
    metalness: 0.05,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Polished architectural brass
    metalness: 0.85,
    roughness: 0.25,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.15,
  });

  const fabricWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.85,
  });

  const pillowMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.75,
  });

  const darkGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.1,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.5,
  });

  if (obj.category === 'seating') {
    // ── Modern Designer Sofa / Couch ──
    const seatH = h * 0.45;
    const plinthH = 0.08;
    const legH = 0.14;

    // Wooden / Brass Tapered Legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.015, legH, 10);
    const legX = w * 0.44;
    const legZ = d * 0.42;
    [
      [-legX, legH / 2, legZ],
      [legX, legH / 2, legZ],
      [-legX, legH / 2, -legZ],
      [legX, legH / 2, -legZ],
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, brassMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });

    // Base Plinth Frame
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, plinthH, d * 0.92), woodMat);
    plinth.position.set(0, legH + plinthH / 2, 0);
    plinth.castShadow = true;
    group.add(plinth);

    // Thick Seat Cushions (2 or 3 separate cushions)
    const cushionCount = w > 1.8 ? 3 : 2;
    const cushionW = (w * 0.78) / cushionCount;
    const cushionH = Math.max(0.12, seatH - plinthH - legH);
    const cushionD = d * 0.72;
    const startX = -((cushionCount - 1) * cushionW) / 2;

    for (let i = 0; i < cushionCount; i++) {
      const seatCushion = new THREE.Mesh(
        new THREE.BoxGeometry(cushionW * 0.96, cushionH, cushionD),
        mat
      );
      seatCushion.position.set(startX + i * cushionW, legH + plinthH + cushionH / 2, d * 0.08);
      seatCushion.castShadow = true;
      seatCushion.receiveShadow = true;
      group.add(seatCushion);
    }

    // High Backrest with tufts
    const backH = h - seatH;
    const backThick = d * 0.22;
    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.96, backH, backThick),
      mat
    );
    backrest.position.set(0, seatH + backH / 2, -d / 2 + backThick / 2);
    backrest.castShadow = true;
    group.add(backrest);

    // Rounded Armrests (Left & Right)
    const armW = w * 0.12;
    const armH = h * 0.72;
    const armD = d * 0.94;
    [-w / 2 + armW / 2, w / 2 - armW / 2].forEach(x => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(armW, armH, armD), mat);
      arm.position.set(x, armH / 2, 0);
      arm.castShadow = true;
      group.add(arm);
    });

    // Throw Pillows
    const pSize = Math.min(w * 0.22, 0.4);
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(pSize, pSize, 0.12), pillowMat);
    p1.position.set(-w / 2 + armW * 1.5, seatH + pSize / 2, -d * 0.15);
    p1.rotation.y = 0.35;
    p1.rotation.z = -0.15;
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(pSize, pSize, 0.12), pillowMat);
    p2.position.set(w / 2 - armW * 1.5, seatH + pSize / 2, -d * 0.15);
    p2.rotation.y = -0.35;
    p2.rotation.z = 0.15;
    group.add(p1, p2);
  } else if (obj.category === 'beds') {
    // ── Luxury King / Queen Bed with Headboard & Nightstands ──
    const frameH = 0.22;
    const headH = Math.max(h, 1.2);
    const headThick = 0.14;

    // Wooden Bed Surround Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, frameH, d), woodMat);
    frame.position.set(0, frameH / 2, 0);
    frame.castShadow = true;
    group.add(frame);

    // Channel-Tufted Tall Headboard
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(w * 1.05, headH, headThick), mat);
    headboard.position.set(0, headH / 2, -d / 2 + headThick / 2);
    headboard.castShadow = true;
    group.add(headboard);

    // Vertical Headboard Flute Accents
    for (let f = -3; f <= 3; f++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.015, headH * 0.9, 0.02), brassMat);
      slat.position.set(f * (w * 0.14), headH / 2, -d / 2 + headThick + 0.01);
      group.add(slat);
    }

    // Plush Organic Mattress
    const mattH = 0.26;
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.94, mattH, d * 0.88),
      fabricWhiteMat
    );
    mattress.position.set(0, frameH + mattH / 2, headThick * 0.5);
    mattress.castShadow = true;
    group.add(mattress);

    // Folded Accent Duvet Runner
    const duvet = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.95, mattH * 0.45, d * 0.45),
      mat
    );
    duvet.position.set(0, frameH + mattH + 0.02, d * 0.22);
    duvet.castShadow = true;
    group.add(duvet);

    // 4 Sleeping & Accent Pillows
    const pilW = w * 0.38;
    [-w * 0.22, w * 0.22].forEach(x => {
      const pBack = new THREE.Mesh(new THREE.BoxGeometry(pilW, 0.24, 0.12), fabricWhiteMat);
      pBack.position.set(x, frameH + mattH + 0.1, -d / 2 + headThick + 0.15);
      pBack.rotation.x = -0.25;

      const pFront = new THREE.Mesh(new THREE.BoxGeometry(pilW * 0.88, 0.2, 0.1), pillowMat);
      pFront.position.set(x, frameH + mattH + 0.08, -d / 2 + headThick + 0.3);
      pFront.rotation.x = -0.35;
      group.add(pBack, pFront);
    });

    // Dual Bedside Nightstands & Lamps
    [-w / 2 - 0.25, w / 2 + 0.25].forEach(x => {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), woodMat);
      stand.position.set(x, 0.45 / 2, -d / 2 + 0.25);
      stand.castShadow = true;

      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), brassMat);
      lampBase.position.set(x, 0.45 + 0.01, -d / 2 + 0.25);
      const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.28, 8), brassMat);
      lampStem.position.set(x, 0.45 + 0.14, -d / 2 + 0.25);
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.15, 0.18, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3, emissive: 0xfef08a, emissiveIntensity: 0.25 })
      );
      shade.position.set(x, 0.45 + 0.25, -d / 2 + 0.25);

      group.add(stand, lampBase, lampStem, shade);
    });
  } else if (obj.category === 'tables') {
    // ── Table (Dining or Coffee Table with Chairs) ──
    const topThick = 0.05;
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, topThick, d), mat);
    top.position.set(0, h - topThick / 2, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // 4 Tapered Turned Legs with Brass Ferrules
    const legH = h - topThick;
    const legGeo = new THREE.CylinderGeometry(0.03, 0.02, legH, 12);
    const legX = w * 0.42;
    const legZ = d * 0.42;
    [
      [-legX, legH / 2, legZ],
      [legX, legH / 2, legZ],
      [-legX, legH / 2, -legZ],
      [legX, legH / 2, -legZ],
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);

      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.02, 0.06, 12), brassMat);
      tip.position.set(x, 0.03, z);
      group.add(tip);
    });

    // If dining table (w >= 1.2m), add dining chairs
    if (w >= 1.2) {
      const chairW = 0.42;
      const chairD = 0.42;
      const chairSeatH = 0.45;
      const chairBackH = 0.42;

      const makeChair = (x: number, z: number, rotY: number) => {
        const chair = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(chairW, 0.05, chairD), mat);
        seat.position.y = chairSeatH;
        seat.castShadow = true;

        const back = new THREE.Mesh(new THREE.BoxGeometry(chairW, chairBackH, 0.03), woodMat);
        back.position.set(0, chairSeatH + chairBackH / 2, -chairD / 2 + 0.015);
        back.castShadow = true;

        const cLegGeo = new THREE.CylinderGeometry(0.015, 0.01, chairSeatH, 8);
        [
          [-chairW * 0.4, chairSeatH / 2, chairD * 0.4],
          [chairW * 0.4, chairSeatH / 2, chairD * 0.4],
          [-chairW * 0.4, chairSeatH / 2, -chairD * 0.4],
          [chairW * 0.4, chairSeatH / 2, -chairD * 0.4],
        ].forEach(([cx, cy, cz]) => {
          const l = new THREE.Mesh(cLegGeo, woodMat);
          l.position.set(cx, cy, cz);
          chair.add(l);
        });
        chair.add(seat, back);
        chair.position.set(x, 0, z);
        chair.rotation.y = rotY;
        group.add(chair);
      };

      makeChair(-w * 0.25, d / 2 + 0.32, Math.PI);
      makeChair(w * 0.25, d / 2 + 0.32, Math.PI);
      makeChair(-w * 0.25, -d / 2 - 0.32, 0);
      makeChair(w * 0.25, -d / 2 - 0.32, 0);
    }
  } else if (obj.category === 'kitchen') {
    // ── Modular Kitchen Suite with Countertop, Sink, Hob & Fridge ──
    const counterH = 0.88;
    const baseW = w * 0.7;

    const baseCab = new THREE.Mesh(new THREE.BoxGeometry(baseW, counterH - 0.04, d), woodMat);
    baseCab.position.set(-w / 2 + baseW / 2, (counterH - 0.04) / 2, 0);
    baseCab.castShadow = true;
    group.add(baseCab);

    const counterMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2, metalness: 0.1 });
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(baseW * 1.02, 0.04, d * 1.04), counterMat);
    counterTop.position.set(-w / 2 + baseW / 2, counterH - 0.02, 0);
    counterTop.castShadow = true;
    group.add(counterTop);

    const sink = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.01, 0.42), chromeMat);
    sink.position.set(-w / 2 + baseW * 0.3, counterH + 0.005, 0);
    const faucetStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), chromeMat);
    faucetStem.position.set(-w / 2 + baseW * 0.3, counterH + 0.13, -d * 0.22);
    const faucetArch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.14), chromeMat);
    faucetArch.position.set(-w / 2 + baseW * 0.3, counterH + 0.25, -d * 0.16);
    group.add(sink, faucetStem, faucetArch);

    const hob = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.01, 0.45), darkGlassMat);
    hob.position.set(-w / 2 + baseW * 0.75, counterH + 0.005, 0);
    group.add(hob);

    const ringMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.3 });
    [
      [-0.14, 0.1],
      [0.14, 0.1],
      [-0.14, -0.1],
      [0.14, -0.1],
    ].forEach(([rx, rz]) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.07, 16), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(-w / 2 + baseW * 0.75 + rx, counterH + 0.012, rz);
      group.add(ring);
    });

    const fridgeW = w - baseW - 0.05;
    const fridgeH = Math.max(h, 1.85);
    const fridge = new THREE.Mesh(new THREE.BoxGeometry(fridgeW, fridgeH, d), chromeMat);
    fridge.position.set(w / 2 - fridgeW / 2, fridgeH / 2, 0);
    fridge.castShadow = true;
    group.add(fridge);

    [-fridgeW * 0.06, fridgeW * 0.06].forEach(fx => {
      const fHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.65, 8), brassMat);
      fHandle.position.set(w / 2 - fridgeW / 2 + fx, fridgeH * 0.55, d / 2 + 0.02);
      group.add(fHandle);
    });

    const wallCabH = 0.65;
    const wallCab = new THREE.Mesh(new THREE.BoxGeometry(baseW, wallCabH, d * 0.55), woodMat);
    wallCab.position.set(-w / 2 + baseW / 2, 1.45 + wallCabH / 2, -d * 0.22);
    wallCab.castShadow = true;
    group.add(wallCab);
  } else if (obj.category === 'storage') {
    // ── Slatted Media TV Credenza + OLED TV ──
    const credH = 0.48;
    const credenza = new THREE.Mesh(new THREE.BoxGeometry(w, credH, d), woodMat);
    credenza.position.set(0, credH / 2, 0);
    credenza.castShadow = true;
    group.add(credenza);

    const numSlats = Math.max(2, Math.floor(w / 0.06));
    for (let s = 0; s < numSlats; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.015, credH * 0.8, 0.02), brassMat);
      slat.position.set(-w / 2 + (s + 0.5) * (w / numSlats), credH / 2, d / 2 + 0.01);
      group.add(slat);
    }

    const tvW = Math.min(w * 0.82, 1.5);
    const tvH = tvW * 0.56;
    const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(tvW, tvH, 0.03), darkGlassMat);
    tvScreen.position.set(0, credH + tvH / 2 + 0.08, 0);
    tvScreen.castShadow = true;
    group.add(tvScreen);

    const tvStem = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), brassMat);
    tvStem.position.set(0, credH + 0.04, 0);
    const tvBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.015, 0.22), brassMat);
    tvBase.position.set(0, credH + 0.008, 0);
    group.add(tvStem, tvBase);

    const soundbar = new THREE.Mesh(new THREE.BoxGeometry(tvW * 0.7, 0.04, 0.06), mat);
    soundbar.position.set(0, credH + 0.02, d * 0.2);
    group.add(soundbar);
  } else if (obj.category === 'decor') {
    if (obj.name.toLowerCase().includes('rug') || obj.name.toLowerCase().includes('carpet')) {
      const rug = new THREE.Mesh(new THREE.BoxGeometry(w, 0.008, d), mat);
      rug.position.set(0, 0.004, 0);
      rug.receiveShadow = true;
      group.add(rug);

      const border = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.01, d * 0.94), fabricWhiteMat);
      border.position.set(0, 0.005, 0);
      group.add(border);
    } else if (obj.name.toLowerCase().includes('plant') || obj.name.toLowerCase().includes('pot')) {
      const potR = Math.min(w, d) * 0.35;
      const potH = h * 0.45;
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(potR, potR * 0.75, potH, 20), fabricWhiteMat);
      pot.position.set(0, potH / 2, 0);
      pot.castShadow = true;
      group.add(pot);

      const soil = new THREE.Mesh(new THREE.CylinderGeometry(potR * 0.92, potR * 0.92, 0.04, 16), woodMat);
      soil.position.set(0, potH * 0.95, 0);
      group.add(soil);

      for (let l = 0; l < 8; l++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(potR * 0.65, 8, 8), leafMat);
        leaf.scale.set(1.2, 0.15, 0.8);
        const ang = (l / 8) * Math.PI * 2;
        leaf.position.set(Math.cos(ang) * potR * 0.7, potH + 0.15 + (l % 3) * 0.08, Math.sin(ang) * potR * 0.7);
        leaf.rotation.set(0.3, ang, 0.4);
        leaf.castShadow = true;
        group.add(leaf);
      }
    } else {
      const tripodH = h * 0.85;
      const tLegGeo = new THREE.CylinderGeometry(0.012, 0.008, tripodH, 8);
      [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].forEach(ang => {
        const leg = new THREE.Mesh(tLegGeo, brassMat);
        leg.position.set(Math.cos(ang) * 0.22, tripodH / 2, Math.sin(ang) * 0.22);
        leg.rotation.z = Math.cos(ang) * 0.12;
        leg.rotation.x = Math.sin(ang) * 0.12;
        group.add(leg);
      });
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.35, 20),
        new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.4, emissive: 0xfef08a, emissiveIntensity: 0.2 })
      );
      shade.position.set(0, tripodH + 0.12, 0);
      shade.castShadow = true;
      group.add(shade);
    }
  } else if (obj.category === 'fixtures') {
    const vanityH = 0.42;
    const vanity = new THREE.Mesh(new THREE.BoxGeometry(w, vanityH, d), woodMat);
    vanity.position.set(0, h * 0.5, 0);
    vanity.castShadow = true;
    group.add(vanity);

    const sink = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.14, 24), fabricWhiteMat);
    sink.position.set(0, h * 0.5 + vanityH / 2 + 0.07, 0);
    sink.castShadow = true;
    group.add(sink);

    const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), chromeMat);
    faucet.position.set(0, h * 0.5 + vanityH / 2 + 0.15, -d * 0.28);
    group.add(faucet);

    const mirrorR = Math.min(w * 0.4, 0.45);
    const mirror = new THREE.Mesh(
      new THREE.CylinderGeometry(mirrorR, mirrorR, 0.03, 32),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.05 })
    );
    mirror.rotation.x = Math.PI / 2;
    mirror.position.set(0, h * 0.5 + vanityH / 2 + mirrorR + 0.2, -d / 2 - 0.02);
    group.add(mirror);
  } else {
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    box.position.y = h / 2;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
  }

  return group;
}
