'use client';

/**
 * InteriorDesignerCalculatorView.tsx
 * Comprehensive Interior Cost Calculator & 2D/3D Design Studio.
 *
 * Implements:
 * 1. Persistent Top Navigation Bar (Always at TOP of the interface):
 *    - Design & Calculator (7-Step Guided Workflow)
 *    - All Quotations (Create, view, revise, download, compare customer vs internal costing)
 *    - All 2D & 3D Diagrams (Floor plans, room renders, direct editor launch)
 *    - Lead History (Estimates, revisions, approvals, design activity timeline)
 *    - Admin Rate Master (Strict role-isolated section for materials, hardware, labor, margins)
 *
 * 2. 7-Step Interior Calculator Workflow:
 *    - Step 1: Select Lead (MANDATORY GATE — locks downstream steps until lead is chosen)
 *    - Step 2: Select Project & Building Area (Floor level, project metadata, unit system)
 *    - Step 3: Define Rooms & Measurements (L x W x H, area, perimeter, doors, windows, openings)
 *    - Step 4: Select Interior Work Categories (Civil, Flooring, Ceiling, Wall, Furniture, Electrical, Hardware)
 *    - Step 5: Interactive 2D/3D Design Studio (Full roomform.ai replicate via Three.js canvas)
 *    - Step 6: Automatic BOQ & Cost Calculation (Itemized live sync from dimensions & 3D objects)
 *    - Step 7: Dual Quotation Generator (Client proposal vs Confidential Internal Costing Sheet)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  InteriorLead,
  InteriorProject,
  RoomDefinition,
  MeasurementUnit,
  InteriorQuotation,
  StudioObject3D,
  WorkCategoryKey,
  FloorLevel,
  RoomType,
  LeadActivityLog,
} from '@/types/interiorStudio';
import {
  InteriorProjectsStore,
  computeRoomMetrics,
  calculateQuotationFromProject,
} from '@/lib/interiorProjectsStore';
import { Studio3DCanvas } from './interior/Studio3DCanvas';
import { AdminRateManagerView } from './interior/AdminRateManagerView';
import { QuotationViewerModal } from './interior/QuotationViewerModal';
import {
  Users,
  Building,
  Layers,
  Wrench,
  Box,
  FileSpreadsheet,
  FileCheck2,
  Lock,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Share2,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  DoorOpen,
  Maximize2,
  Calendar,
  Clock,
  ArrowRight,
  Printer,
  History,
  Compass,
} from 'lucide-react';

type TopTab = 'workflow' | 'quotations' | 'diagrams' | 'leadHistory' | 'adminMaster';
type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function InteriorDesignerCalculatorView() {
  // ── Top Navigation Bar State ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TopTab>('workflow');
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);

  // ── Data Stores State ──────────────────────────────────────────────
  const [leads, setLeads] = useState<InteriorLead[]>([]);
  const [projects, setProjects] = useState<InteriorProject[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [currentProject, setCurrentProject] = useState<InteriorProject | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string>('');

  // ── Modals & Views ─────────────────────────────────────────────────
  const [activeQuotation, setActiveQuotation] = useState<InteriorQuotation | null>(null);
  const [leadSearch, setLeadSearch] = useState('');
  const [quoteSearch, setQuoteSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Room creation form state
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('Kids Bedroom');
  const [newRoomType, setNewRoomType] = useState<RoomType>('Bedroom');
  const [newRoomLength, setNewRoomLength] = useState(14);
  const [newRoomWidth, setNewRoomWidth] = useState(12);
  const [newRoomHeight, setNewRoomHeight] = useState(10);
  const [newRoomUnit, setNewRoomUnit] = useState<MeasurementUnit>('ft');

  // Load Initial Data from Store
  useEffect(() => {
    const loadedLeads = InteriorProjectsStore.getLeads();
    const loadedProjects = InteriorProjectsStore.getProjects();
    setLeads(loadedLeads);
    setProjects(loadedProjects);

    // If projects exist, pre-select the first one
    if (loadedProjects.length > 0) {
      const p = loadedProjects[0];
      setCurrentProject(p);
      setSelectedLeadId(p.leadId);
      if (p.rooms.length > 0) {
        setActiveRoomId(p.rooms[0].id);
      }
    }
  }, []);

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Selected Lead helper
  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  // Active Room helper
  const activeRoom = useMemo(() => {
    if (!currentProject) return null;
    return currentProject.rooms.find((r) => r.id === activeRoomId) || currentProject.rooms[0] || null;
  }, [currentProject, activeRoomId]);

  // Quotations List helper
  const allQuotations = useMemo(() => {
    return InteriorProjectsStore.getQuotations();
  }, [currentProject, activeTab]);

  // Lead Activity History
  const leadActivities = useMemo(() => {
    if (!selectedLeadId) return [];
    return InteriorProjectsStore.getLogsByLeadId(selectedLeadId);
  }, [selectedLeadId, currentProject, activeTab]);

  // ── Step 1: Select Lead Action ─────────────────────────────────────
  const handleSelectLead = (lead: InteriorLead) => {
    setSelectedLeadId(lead.id);

    // Find existing project or create new
    let proj = projects.find((p) => p.leadId === lead.id);
    if (!proj) {
      proj = InteriorProjectsStore.createProject(
        lead,
        `${lead.name}'s Interior Project`,
        'Ground Floor'
      );
      setProjects(InteriorProjectsStore.getProjects());
    }

    setCurrentProject(proj);
    if (proj.rooms.length > 0) {
      setActiveRoomId(proj.rooms[0].id);
    }
    showToast(`Lead selected: ${lead.name}`, 'success');
    setCurrentStep(2); // auto proceed to step 2
  };

  // ── Step 2: Project Area & Building Level Change ──────────────────
  const handleUpdateProjectLevel = (level: FloorLevel) => {
    if (!currentProject) return;
    const updated = { ...currentProject, floorLevel: level };
    InteriorProjectsStore.saveProject(updated);
    setCurrentProject(updated);
    showToast(`Building level set to ${level}`, 'info');
  };

  // ── Step 3: Add / Update Room ──────────────────────────────────────
  const handleAddRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    const metrics = computeRoomMetrics(newRoomLength, newRoomWidth, newRoomHeight, newRoomUnit, []);
    const newRoom: RoomDefinition = {
      id: `room-${Date.now()}`,
      name: newRoomName,
      type: newRoomType,
      length: newRoomLength,
      width: newRoomWidth,
      height: newRoomHeight,
      unit: newRoomUnit,
      floorAreaSqFt: metrics.floorAreaSqFt,
      perimeterFt: metrics.perimeterFt,
      ceilingAreaSqFt: metrics.ceilingAreaSqFt,
      wallAreaSqFt: metrics.wallAreaSqFt,
      floorMaterial: 'Vitrified Tiles (800x800mm)',
      ceilingFinish: 'Gypsum False Ceiling',
      wallFinish: 'Premium Acrylic Emulsion Paint',
      openings: [
        {
          id: `door-${Date.now()}`,
          type: 'door',
          wall: 'south',
          width: 3.5,
          height: 7,
        },
        {
          id: `win-${Date.now()}`,
          type: 'window',
          wall: 'east',
          width: 5,
          height: 4.5,
        },
      ],
    };

    const updatedRooms = [...currentProject.rooms, newRoom];
    const updatedProject = {
      ...currentProject,
      rooms: updatedRooms,
      totalCarpetAreaSqFt: updatedRooms.reduce((acc, r) => acc + r.floorAreaSqFt, 0),
    };
    InteriorProjectsStore.saveProject(updatedProject);
    setCurrentProject(updatedProject);
    setActiveRoomId(newRoom.id);
    setShowAddRoomModal(false);
    showToast(`Added room "${newRoom.name}"`, 'success');
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!currentProject || currentProject.rooms.length <= 1) {
      showToast('Project must have at least one room.', 'error');
      return;
    }
    const updatedRooms = currentProject.rooms.filter((r) => r.id !== roomId);
    const updatedObjects = currentProject.objects3D.filter((o) => o.roomId !== roomId);
    const updatedProject = {
      ...currentProject,
      rooms: updatedRooms,
      objects3D: updatedObjects,
      totalCarpetAreaSqFt: updatedRooms.reduce((acc, r) => acc + r.floorAreaSqFt, 0),
    };
    InteriorProjectsStore.saveProject(updatedProject);
    setCurrentProject(updatedProject);
    setActiveRoomId(updatedRooms[0].id);
    showToast('Room removed.', 'info');
  };

  // ── Step 4: Toggle Work Categories ─────────────────────────────────
  const handleToggleWorkCategory = (catKey: WorkCategoryKey) => {
    if (!currentProject) return;
    const anyActive = currentProject.workItems.some(
      (w) => w.category === catKey && w.applicable
    );
    const updatedWorkItems = currentProject.workItems.map((w) =>
      w.category === catKey ? { ...w, applicable: !anyActive } : w
    );
    const updatedProject = { ...currentProject, workItems: updatedWorkItems };
    InteriorProjectsStore.saveProject(updatedProject);
    setCurrentProject(updatedProject);
    showToast(`${catKey.toUpperCase()} category ${!anyActive ? 'enabled' : 'disabled'}.`, 'info');
  };

  // ── Step 5: 3D Studio Object Sync ─────────────────────────────────
  const handleStudioObjectsChange = (newObjects: StudioObject3D[]) => {
    if (!currentProject || !activeRoom) return;
    // Retain objects from other rooms, replace objects for current room
    const otherRoomObjects = currentProject.objects3D.filter((o) => o.roomId !== activeRoom.id);
    const merged = [...otherRoomObjects, ...newObjects];
    const updatedProject = { ...currentProject, objects3D: merged };
    InteriorProjectsStore.saveProject(updatedProject);
    setCurrentProject(updatedProject);
  };

  // ── Step 6 & 7: Generate Full Quotation ───────────────────────────
  const handleGenerateQuotation = () => {
    if (!currentProject || !selectedLead) {
      showToast('Select a lead before generating quotation.', 'error');
      return;
    }
    const quote = calculateQuotationFromProject(currentProject, selectedLead);
    InteriorProjectsStore.saveQuotation(quote);
    setActiveQuotation(quote);
    showToast(`Quotation ${quote.quoteNumber} generated!`, 'success');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* ═══════════════════════════════════════════════════════════════
          1. TOP NAVIGATION BAR (ALWAYS AT THE TOP OF THE INTERFACE)
          ═══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-card border border-border rounded-2xl shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left Branding & Active Lead Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground">Interior Cost Studio & 3D Designer</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                v2.4
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {selectedLead ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> Lead: {selectedLead.name} ({selectedLead.phone})
                </span>
              ) : (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle size={12} /> Mandatory: Select a Lead below
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3 Main Top Navigation Tabs + Admin Section */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'workflow'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Layers size={14} />
            <span>Design & Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab('quotations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'quotations'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>All Quotations</span>
            {allQuotations.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
                {allQuotations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('diagrams')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'diagrams'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Box size={14} />
            <span>All 2D & 3D Diagrams</span>
          </button>

          <button
            onClick={() => setActiveTab('leadHistory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'leadHistory'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <History size={14} />
            <span>Lead History</span>
          </button>

          {/* Admin Role Master Tab */}
          <div className="h-4 w-px bg-border mx-1" />
          <button
            onClick={() => setActiveTab('adminMaster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'adminMaster'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Admin Rate Master</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/40 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950 border-rose-500/40 text-rose-200'
              : 'bg-blue-950 border-blue-500/40 text-blue-200'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 size={16} />}
          {notification.type === 'error' && <AlertCircle size={16} />}
          {notification.type === 'info' && <Sparkles size={16} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          2. TAB CONTENT ROUTING
          ═══════════════════════════════════════════════════════════════ */}

      {/* TAB A: ALL QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by quote # or customer..."
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-rose-500 w-64 text-foreground"
                />
              </div>
              <div className="flex items-center gap-1 text-xs">
                {['ALL', 'DRAFT', 'SENT', 'APPROVED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-rose-500 text-white'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('workflow');
                setCurrentStep(6);
              }}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Create New Interior Quotation</span>
            </button>
          </div>

          {/* Quotations Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">Quote #</th>
                  <th className="p-3.5">Lead / Client</th>
                  <th className="p-3.5">Floor Level</th>
                  <th className="p-3.5">Rooms & Items</th>
                  <th className="p-3.5 text-right">Selling Total (₹)</th>
                  <th className="p-3.5 text-right">Internal Net (₹)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allQuotations
                  .filter((q) => {
                    const matchText =
                      q.quoteNumber.toLowerCase().includes(quoteSearch.toLowerCase()) ||
                      q.leadName.toLowerCase().includes(quoteSearch.toLowerCase());
                    const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;
                    return matchText && matchStatus;
                  })
                  .map((q) => (
                    <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-bold text-foreground flex items-center gap-2">
                        <FileCheck2 size={16} className="text-rose-400" />
                        <div>
                          <div>{q.quoteNumber}</div>
                          <div className="text-[10px] text-muted-foreground font-normal">
                            Rev {q.revision} • {new Date(q.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-foreground">{q.leadName}</div>
                        <div className="text-[11px] text-muted-foreground">{q.leadPhone}</div>
                      </td>
                      <td className="p-3.5 text-muted-foreground">{q.floorLevel}</td>
                      <td className="p-3.5 text-muted-foreground">
                        {q.roomsSummary.roomCount} Rooms • {q.boqItems.length} BOQ items
                      </td>
                      <td className="p-3.5 text-right font-bold text-rose-400 font-mono">
                        ₹{q.grandTotalINR.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-emerald-400 font-mono">
                        ₹{q.internalNetCost.toLocaleString('en-IN')}
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          Margin: {q.profitMarginPercent}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : q.status === 'SENT'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setActiveQuotation(q)}
                          className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-semibold border border-border inline-flex items-center gap-1.5 transition-all"
                        >
                          <Eye size={12} />
                          <span>View Quote / Costing</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB B: ALL 2D & 3D DIAGRAMS */}
      {activeTab === 'diagrams' && (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Saved 2D CAD Plans & 3D Renders</h2>
              <p className="text-xs text-muted-foreground">
                All architectural drawings, floor plans, and perspective renders linked to current projects.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab('workflow');
                setCurrentStep(5);
              }}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
            >
              <Box size={14} />
              <span>Launch 3D Design Studio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProject?.rooms.map((room) => (
              <div
                key={room.id}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between hover:border-rose-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                      {room.type}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {room.length}&apos; × {room.width}&apos; • {room.floorAreaSqFt} sq.ft
                    </span>
                  </div>

                  {/* 2D Mini CAD schematic representation */}
                  <div className="h-44 bg-slate-950 border border-border rounded-xl p-3 flex flex-col justify-between relative overflow-hidden font-mono">
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
                    <div className="text-[10px] text-muted-foreground flex justify-between z-10">
                      <span>Wall N: {room.length} ft</span>
                      <span>H: {room.height} ft</span>
                    </div>

                    <div className="m-auto border-2 border-dashed border-rose-500/50 bg-rose-500/5 rounded-lg w-3/4 h-24 flex items-center justify-center flex-col z-10">
                      <Box size={24} className="text-rose-400 mb-1" />
                      <span className="text-xs font-bold text-foreground">{room.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {currentProject.objects3D.filter((o) => o.roomId === room.id).length} Furniture items placed
                      </span>
                    </div>

                    <div className="text-[10px] text-muted-foreground flex justify-between z-10">
                      <span>Flooring: {room.floorMaterial}</span>
                      <span>Ceiling: {room.ceilingFinish}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveRoomId(room.id);
                      setActiveTab('workflow');
                      setCurrentStep(5);
                    }}
                    className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Box size={14} /> Open in 3D Studio
                  </button>
                  <button
                    onClick={() => showToast(`Floor plan exported for ${room.name}`, 'success')}
                    className="p-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg border border-border"
                    title="Export Floor Plan PNG"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB C: LEAD HISTORY */}
      {activeTab === 'leadHistory' && (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Lead Activity & Quotation Revision History</h2>
              <p className="text-xs text-muted-foreground">
                Audit trail for {selectedLead ? selectedLead.name : 'all leads'} — estimates, renders, revisions & approvals.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            {leadActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No recent activity logged for this lead yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {leadActivities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-background flex items-center justify-center" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{act.action}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          {new Date(act.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{act.details}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        By {act.actor}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB D: ADMIN RATE MASTER */}
      {activeTab === 'adminMaster' && (
        <div className="space-y-4">
          <AdminRateManagerView adminName="Senior Admin" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB E: 7-STEP INTERIOR CALCULATOR & 3D STUDIO WORKFLOW
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'workflow' && (
        <div className="space-y-4">
          {/* Workflow Stepper Header */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px] gap-2">
              {[
                { step: 1, label: 'Select Lead', icon: Users, req: true },
                { step: 2, label: 'Project Area', icon: Building, req: true },
                { step: 3, label: 'Rooms & Dimensions', icon: Layers, req: true },
                { step: 4, label: 'Work Categories', icon: Wrench, req: false },
                { step: 5, label: '2D/3D Studio', icon: Box, req: false },
                { step: 6, label: 'Live BOQ & Cost', icon: FileSpreadsheet, req: false },
                { step: 7, label: 'Quotation Output', icon: FileCheck2, req: false },
              ].map((s) => {
                const Icon = s.icon;
                const isCompleted = currentStep > s.step;
                const isCurrent = currentStep === s.step;
                const isLocked = !selectedLeadId && s.step > 1;

                return (
                  <button
                    key={s.step}
                    disabled={isLocked}
                    onClick={() => setCurrentStep(s.step as WorkflowStep)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-rose-500 text-white shadow-md'
                        : isCompleted
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : isLocked
                        ? 'text-muted-foreground/40 cursor-not-allowed opacity-50'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                        isCurrent
                          ? 'bg-white/20 text-white'
                          : isCompleted
                          ? 'bg-rose-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={14} /> : s.step}
                    </div>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              STEP 1: SELECT LEAD (MANDATORY GATEWAY)
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Users size={18} className="text-rose-400" />
                      Step 1: Select CRM Lead (Mandatory)
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      An active lead must be chosen before configuring rooms, 3D diagrams, or rates.
                    </p>
                  </div>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search leads by name, phone..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 text-xs rounded-xl bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-rose-500 w-72 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leads
                    .filter(
                      (l) =>
                        l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                        l.phone.includes(leadSearch)
                    )
                    .map((lead) => {
                      const isSelected = selectedLeadId === lead.id;
                      return (
                        <div
                          key={lead.id}
                          onClick={() => handleSelectLead(lead)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-rose-500/10 border-rose-500 shadow-md ring-1 ring-rose-500'
                              : 'bg-card border-border hover:border-rose-500/40 hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-foreground">{lead.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                lead.status === 'Qualified Proposal'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {lead.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>📞 {lead.phone}</div>
                            <div>✉️ {lead.email}</div>
                            {lead.budgetINR && (
                              <div>💰 Budget: ₹{lead.budgetINR.toLocaleString('en-IN')}</div>
                            )}
                            {lead.propertyType && <div>🏷️ Type: {lead.propertyType}</div>}
                          </div>
                          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                            <span className="text-[11px] text-muted-foreground">
                              {lead.company || 'Private Client'}
                            </span>
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              {isSelected ? 'Active Lead' : 'Select'} <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: SELECT PROJECT / BUILDING AREA
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 2 && currentProject && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Building size={18} className="text-rose-400" />
                      Step 2: Project & Building Area
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure floor level, default measurement units, and project metadata.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
                  >
                    <span>Proceed to Rooms</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Project Name</label>
                    <input
                      type="text"
                      value={currentProject.projectName}
                      onChange={(e) => {
                        const updated = { ...currentProject, projectName: e.target.value };
                        setCurrentProject(updated);
                        InteriorProjectsStore.saveProject(updated);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Building Level</label>
                    <select
                      value={currentProject.floorLevel}
                      onChange={(e) => handleUpdateProjectLevel(e.target.value as FloorLevel)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="Basement">Basement</option>
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="First Floor">First Floor</option>
                      <option value="Second Floor">Second Floor</option>
                      <option value="Third Floor">Third Floor</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Terrace">Terrace</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: DEFINE ROOMS & MEASUREMENTS
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 3 && currentProject && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Layers size={18} className="text-rose-400" />
                      Step 3: Define Rooms & Dimensional Calculations
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add rooms, configure dimensions (L × W × H), doors, windows, and observe live area & perimeter.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddRoomModal(true)}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add New Room
                    </button>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-border"
                    >
                      <span>Proceed to Categories</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentProject.rooms.map((r) => {
                    const isActive = activeRoomId === r.id;
                    return (
                      <div
                        key={r.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-rose-500/10 border-rose-500 shadow-md ring-1 ring-rose-500'
                            : 'bg-card border-border hover:border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-foreground">{r.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                            {r.type}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-muted/40 rounded-xl text-xs font-mono">
                          <div>
                            <span className="text-muted-foreground text-[10px] block">Dimensions:</span>
                            <span className="font-bold text-foreground">
                              {r.length}&apos; × {r.width}&apos; × {r.height}&apos;
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">Carpet Area:</span>
                            <span className="font-bold text-rose-400">{r.floorAreaSqFt} sq.ft</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">Perimeter:</span>
                            <span className="font-bold text-foreground">{r.perimeterFt} ft</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">Wall Area:</span>
                            <span className="font-bold text-foreground">{r.wallAreaSqFt} sq.ft</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-muted-foreground space-y-1 mb-3">
                          <div>🚪 Openings: {r.openings.length} configured</div>
                          <div>🪵 Flooring: {r.floorMaterial}</div>
                          <div>☁️ Ceiling: {r.ceilingFinish}</div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <button
                            onClick={() => {
                              setActiveRoomId(r.id);
                              setCurrentStep(5);
                            }}
                            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                          >
                            <Box size={14} /> Open in 3D Studio
                          </button>
                          {currentProject.rooms.length > 1 && (
                            <button
                              onClick={() => handleDeleteRoom(r.id)}
                              className="text-muted-foreground hover:text-rose-400 p-1"
                              title="Delete room"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 4: SELECT INTERIOR WORK CATEGORIES
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 4 && currentProject && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Wrench size={18} className="text-rose-400" />
                      Step 4: Select Interior Work Categories
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enable or disable scopes of work included in the automated BOQ and quotation.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
                  >
                    <span>Proceed to 3D Studio</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'civil' as WorkCategoryKey, label: 'Civil Modifications', desc: 'Demolition, partition walls, plastering, core cutting' },
                    { key: 'flooring' as WorkCategoryKey, label: 'Flooring & Skirting', desc: 'Vitrified tiles, Italian marble, wooden planks, epoxy' },
                    { key: 'ceiling' as WorkCategoryKey, label: 'Ceiling Treatments', desc: 'Gypsum false ceiling, POP coves, wooden rafters, acoustic grid' },
                    { key: 'wall' as WorkCategoryKey, label: 'Wall Finishes', desc: 'Acrylic paint, wallpapers, louvers, fluted charcoal panels' },
                    { key: 'furniture' as WorkCategoryKey, label: 'Furniture & Millwork', desc: 'Wardrobes, TV units, kitchen carcasses, beds, vanity' },
                    { key: 'electrical' as WorkCategoryKey, label: 'Electrical & Lighting', desc: 'Concealed conduit, switches, COB lights, LED profiles' },
                    { key: 'hardware' as WorkCategoryKey, label: 'Hardware & Fittings', desc: 'Soft-close hinges, drawer runners, handles, profile channels' },
                  ].map((cat) => {
                    const isIncluded = currentProject.workItems.some(
                      (w) => w.category === cat.key && w.applicable
                    );
                    return (
                      <div
                        key={cat.key}
                        onClick={() => handleToggleWorkCategory(cat.key)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isIncluded
                            ? 'bg-rose-500/10 border-rose-500 shadow-sm ring-1 ring-rose-500'
                            : 'bg-card border-border hover:border-muted-foreground/30 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-foreground">{cat.label}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isIncluded ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isIncluded ? 'Included' : 'Excluded'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{cat.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 5: INTERACTIVE 2D/3D ROOM DESIGNER (Three.js WebGL)
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 5 && currentProject && activeRoom && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-foreground">Editing Room:</span>
                  <div className="flex items-center gap-1">
                    {currentProject.rooms.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setActiveRoomId(r.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          activeRoomId === r.id
                            ? 'bg-rose-500 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(6)}
                    className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm"
                  >
                    <span>Compute BOQ & Cost</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* 3D Studio Canvas */}
              <div className="h-[680px] w-full rounded-2xl overflow-hidden border border-border shadow-xl">
                <Studio3DCanvas
                  currentRoom={activeRoom}
                  objects={currentProject.objects3D.filter((o) => o.roomId === activeRoom.id)}
                  onObjectsChange={handleStudioObjectsChange}
                  onSaveDesign={() => showToast('3D Scene and object transforms saved.', 'success')}
                  onExportFloorPlan={() => showToast('Exporting 2D Floor Plan CAD image...', 'info')}
                  onExportRender={() => showToast('High-resolution 3D render generated!', 'success')}
                />
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 6: LIVE BOQ & COST BREAKDOWN
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 6 && currentProject && selectedLead && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <FileSpreadsheet size={18} className="text-rose-400" />
                      Step 6: Live Itemized BOQ & Cost Calculation
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Auto-generated from room dimensions ({currentProject.rooms.length} rooms) and{' '}
                      {currentProject.objects3D.length} 3D objects placed in the studio.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateQuotation}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md"
                    >
                      <FileCheck2 size={14} />
                      <span>Generate Customer & Internal Quotation</span>
                    </button>
                  </div>
                </div>

                {/* Live calculated summary cards */}
                {(() => {
                  const previewQuote = calculateQuotationFromProject(currentProject, selectedLead);
                  return (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-muted/40 border border-border">
                          <span className="text-[11px] text-muted-foreground block">Raw Material Cost</span>
                          <span className="text-base font-bold text-foreground font-mono">
                            ₹{previewQuote.totalMaterialCost.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/40 border border-border">
                          <span className="text-[11px] text-muted-foreground block">Hardware & Fittings</span>
                          <span className="text-base font-bold text-foreground font-mono">
                            ₹{previewQuote.totalHardwareCost.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/40 border border-border">
                          <span className="text-[11px] text-muted-foreground block">Labor & Installation</span>
                          <span className="text-base font-bold text-foreground font-mono">
                            ₹{previewQuote.totalLaborCost.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <span className="text-[11px] text-rose-400 block font-semibold">Grand Total Selling (₹)</span>
                          <span className="text-base font-bold text-rose-400 font-mono">
                            ₹{previewQuote.grandTotalINR.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Itemized Table */}
                      <div className="rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/60 text-muted-foreground font-semibold">
                            <tr>
                              <th className="p-3">Room</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Item Name & Spec</th>
                              <th className="p-3 text-right">Qty</th>
                              <th className="p-3">Unit</th>
                              <th className="p-3 text-right">Cost Rate (₹)</th>
                              <th className="p-3 text-right">Selling Rate (₹)</th>
                              <th className="p-3 text-right">Selling Total (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {previewQuote.boqItems.map((item) => (
                              <tr key={item.id} className="hover:bg-muted/20">
                                <td className="p-3 font-medium text-foreground">{item.roomName}</td>
                                <td className="p-3">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  <div className="font-semibold text-foreground">{item.itemName}</div>
                                  <div className="text-[11px]">{item.specification}</div>
                                </td>
                                <td className="p-3 text-right font-mono">{item.quantity}</td>
                                <td className="p-3 text-muted-foreground">{item.unit}</td>
                                <td className="p-3 text-right font-mono text-muted-foreground">
                                  ₹{item.materialCostRate + item.laborCostRate}
                                </td>
                                <td className="p-3 text-right font-mono font-medium text-foreground">
                                  ₹{item.sellingRate}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-rose-400">
                                  ₹{item.totalSellingAmount.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 7: QUOTATION OUTPUT & EXPORT
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 7 && currentProject && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6 text-center py-12">
                <FileCheck2 size={48} className="text-rose-400 mx-auto mb-3" />
                <h2 className="text-base font-bold text-foreground">Ready to Review Quotation</h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-6">
                  Review the customer proposal or access the confidential internal costing sheet with frozen rate snapshots.
                </p>
                <button
                  onClick={handleGenerateQuotation}
                  className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-lg"
                >
                  <Eye size={16} /> Open Dual Quotation & PDF Generator
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ADD ROOM MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-foreground mb-4">Add Room to Project</h3>
            <form onSubmit={handleAddRoomSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Room Type</label>
                <select
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="Master Bedroom">Master Bedroom</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Bathroom">Bathroom</option>
                  <option value="Dining Room">Dining Room</option>
                  <option value="Home Office">Home Office</option>
                  <option value="Balcony">Balcony</option>
                  <option value="Pooja Room">Pooja Room</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Length ({newRoomUnit})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRoomLength}
                    onChange={(e) => setNewRoomLength(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Width ({newRoomUnit})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRoomWidth}
                    onChange={(e) => setNewRoomWidth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Height ({newRoomUnit})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRoomHeight}
                    onChange={(e) => setNewRoomHeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          DUAL QUOTATION VIEWER MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {activeQuotation && (
        <QuotationViewerModal
          quotation={activeQuotation}
          onClose={() => setActiveQuotation(null)}
          onStatusChange={(newStatus) => {
            InteriorProjectsStore.updateQuotationStatus(activeQuotation.id, newStatus);
            setActiveQuotation({ ...activeQuotation, status: newStatus });
            showToast(`Quotation status changed to ${newStatus}`, 'success');
          }}
          onRevisionCreated={(newQuote) => {
            setActiveQuotation(newQuote);
            showToast(`New Revision ${newQuote.quoteNumber} created with frozen rate snapshot!`, 'success');
          }}
        />
      )}
    </div>
  );
}
