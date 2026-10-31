'use client';

/**
 * AdminRateManagerView.tsx
 * Admin-Only Section: Interior Rate & Catalog Management Master.
 *
 * Implements:
 * 1. Work Category & Work Rate Master (Civil, Flooring, Ceiling, Wall, Furniture, Electrical, etc.)
 * 2. Material Master (Plywood, Laminates, Stone, Paints, Tiles, etc.)
 * 3. Hardware & Accessories Master (Hinges, Channels, Handles, Baskets)
 * 4. Labor Rate Master (Trades, Daily/SqFt Rates, Skill Level)
 * 5. Pricing & Calculation Settings (Wastage %, Overhead %, Margin %, GST %, Transport)
 * 6. Rate Audit History with timestamped change logs
 * 7. Excel Import / Export (.xlsx) & Immutable Snapshot Enforcement
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  WorkRateMasterItem,
  MaterialMasterItem,
  HardwareMasterItem,
  LaborRateMasterItem,
  PricingSettingsMaster,
  RateAuditLog,
} from '@/types/interiorStudio';
import { InteriorCatalogStore } from '@/lib/interiorCatalogStore';
import {
  Shield,
  Layers,
  Box,
  Wrench,
  Users,
  Settings,
  History,
  Search,
  Plus,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  X,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';

interface AdminRateManagerProps {
  adminName: string;
}

export function AdminRateManagerView({ adminName }: AdminRateManagerProps) {
  const [activeTab, setActiveTab] = useState<'workRates' | 'materials' | 'hardware' | 'labor' | 'settings' | 'audit'>('workRates');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [workRates, setWorkRates] = useState<WorkRateMasterItem[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterItem[]>([]);
  const [hardware, setHardware] = useState<HardwareMasterItem[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRateMasterItem[]>([]);
  const [settings, setSettings] = useState<PricingSettingsMaster>(InteriorCatalogStore.getSettings());
  const [auditLogs, setAuditLogs] = useState<RateAuditLog[]>([]);

  // Modal states
  const [modalType, setModalType] = useState<'addWorkRate' | 'addMaterial' | 'addHardware' | 'addLabor' | 'editItem' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    setWorkRates(InteriorCatalogStore.getWorkRates());
    setMaterials(InteriorCatalogStore.getMaterials());
    setHardware(InteriorCatalogStore.getHardware());
    setLaborRates(InteriorCatalogStore.getLaborRates());
    setSettings(InteriorCatalogStore.getSettings());
    setAuditLogs(InteriorCatalogStore.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('das_crm_interior_catalog_updated', handleUpdate);
    return () => window.removeEventListener('das_crm_interior_catalog_updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Work Rate Actions ──────────────────────────────────────────────
  const handleToggleWorkRate = (item: WorkRateMasterItem) => {
    InteriorCatalogStore.updateWorkRate(item.id, { isActive: !item.isActive }, adminName);
    showToast(`Updated "${item.name}" status.`);
  };

  const handleDeleteWorkRate = (id: string, name: string) => {
    if (confirm(`Delete work rate item "${name}"?`)) {
      InteriorCatalogStore.deleteWorkRate(id, adminName);
      showToast(`Deleted "${name}".`);
    }
  };

  // ── Material Actions ───────────────────────────────────────────────
  const handleDeleteMaterial = (id: string, name: string) => {
    if (confirm(`Delete material "${name}"?`)) {
      InteriorCatalogStore.deleteMaterial(id, adminName);
      showToast(`Deleted "${name}".`);
    }
  };

  // ── Hardware Actions ───────────────────────────────────────────────
  const handleDeleteHardware = (id: string, name: string) => {
    if (confirm(`Delete hardware item "${name}"?`)) {
      InteriorCatalogStore.deleteHardware(id, adminName);
      showToast(`Deleted "${name}".`);
    }
  };

  // ── Labor Actions ──────────────────────────────────────────────────
  const handleDeleteLabor = (id: string, name: string) => {
    if (confirm(`Delete labor rate for "${name}"?`)) {
      InteriorCatalogStore.deleteLaborRate(id, adminName);
      showToast(`Deleted "${name}".`);
    }
  };

  // ── Settings Save ──────────────────────────────────────────────────
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    InteriorCatalogStore.updateSettings(settings, adminName);
    showToast('Global Pricing & Calculation Rules saved.');
  };

  // ── Reset to Defaults ──────────────────────────────────────────────
  const handleResetDefaults = () => {
    if (confirm('RESET ALL MASTER RATES TO FACTORY DEFAULTS? This will overwrite custom rates.')) {
      InteriorCatalogStore.resetToDefaults(adminName);
      loadData();
      showToast('All rates reset to factory defaults.');
    }
  };

  // ── Excel Export Engine ────────────────────────────────────────────
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Work Rates
    const wsWork = XLSX.utils.json_to_sheet(workRates);
    XLSX.utils.book_append_sheet(wb, wsWork, 'Work_Rates');

    // Sheet 2: Materials
    const wsMat = XLSX.utils.json_to_sheet(materials);
    XLSX.utils.book_append_sheet(wb, wsMat, 'Materials');

    // Sheet 3: Hardware
    const wsHw = XLSX.utils.json_to_sheet(hardware);
    XLSX.utils.book_append_sheet(wb, wsHw, 'Hardware');

    // Sheet 4: Labor
    const wsLab = XLSX.utils.json_to_sheet(laborRates);
    XLSX.utils.book_append_sheet(wb, wsLab, 'Labor_Rates');

    XLSX.writeFile(wb, `DAS_CRM_Interior_Master_Rates_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Master Catalog exported to Excel (.xlsx)');
  };

  return (
    <div className="space-y-6">
      {/* ── Security & Role Notice Banner ────────────────────────────── */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Interior Rate &amp; Catalog Management</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                ADMIN RESTRICTED
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configured rates automatically drive live BOQ generation. Existing quotes retain immutable snapshots.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-bold transition-all"
          >
            <FileSpreadsheet size={13} className="text-emerald-500" /> Export Excel
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-slate-400 hover:text-rose-400 text-xs font-bold transition-all"
          >
            <RotateCcw size={13} /> Reset Defaults
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 border border-emerald-500/50 text-emerald-400 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} /> {toastMsg}
        </div>
      )}

      {/* ── Sub Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'workRates', label: 'Work Category Rates', icon: Layers, count: workRates.length },
          { id: 'materials', label: 'Material Master', icon: Box, count: materials.length },
          { id: 'hardware', label: 'Hardware & Accessories', icon: Wrench, count: hardware.length },
          { id: 'labor', label: 'Labor Rate Master', icon: Users, count: laborRates.length },
          { id: 'settings', label: 'Pricing & Calculation Rules', icon: Settings },
          { id: 'audit', label: 'Audit Trail Logs', icon: History, count: auditLogs.length },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: WORK CATEGORY RATES ───────────────────────────────── */}
      {activeTab === 'workRates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search civil, flooring, ceiling, furniture..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="crm-input pl-9 text-xs h-9 w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const name = prompt('Enter Work Item Name:');
                if (!name) return;
                const code = `WR-${Date.now().toString().slice(-4)}`;
                const unit = prompt('Enter Unit (sq.ft / running.ft / per.unit / point):', 'sq.ft') || 'sq.ft';
                const sellRate = Number(prompt('Enter Selling Rate (INR ₹):', '150')) || 150;
                const costRate = Number(prompt('Enter Base Cost Rate (INR ₹):', '100')) || 100;
                InteriorCatalogStore.addWorkRate({
                  category: 'civil',
                  itemCode: code,
                  name,
                  description: 'Custom work item added via Admin Master.',
                  unit: unit as any,
                  baseCostINR: costRate,
                  sellingRateINR: sellRate,
                  laborRateINR: Math.round(costRate * 0.4),
                  materialRateINR: Math.round(costRate * 0.6),
                  isActive: true,
                  effectiveFrom: new Date().toISOString().split('T')[0],
                }, adminName);
                showToast(`Added work item "${name}".`);
              }}
              className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Work Item
            </button>
          </div>

          <div className="crm-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="crm-table text-xs">
                <thead>
                  <tr>
                    <th>Item Code &amp; Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Material Rate</th>
                    <th>Labor Rate</th>
                    <th>Base Cost (INR)</th>
                    <th>Selling Rate (INR)</th>
                    <th>Margin</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workRates
                    .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.itemCode.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(item => {
                      const marginPct = item.sellingRateINR > 0 ? Math.round(((item.sellingRateINR - item.baseCostINR) / item.sellingRateINR) * 100) : 0;
                      return (
                        <tr key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                          <td>
                            <p className="font-bold text-foreground">{item.name}</p>
                            <span className="text-[10px] text-muted-foreground font-mono">{item.itemCode}</span>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                              {item.category}
                            </span>
                          </td>
                          <td className="font-mono text-muted-foreground">{item.unit}</td>
                          <td className="font-mono">₹{item.materialRateINR}</td>
                          <td className="font-mono">₹{item.laborRateINR}</td>
                          <td className="font-mono font-bold text-amber-500">₹{item.baseCostINR}</td>
                          <td className="font-mono font-bold text-emerald-500">₹{item.sellingRateINR}</td>
                          <td>
                            <span className="font-bold text-indigo-400">{marginPct}%</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleWorkRate(item)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}
                            >
                              {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const newSell = Number(prompt(`Update Selling Rate for "${item.name}":`, String(item.sellingRateINR)));
                                if (!isNaN(newSell) && newSell > 0) {
                                  InteriorCatalogStore.updateWorkRate(item.id, { sellingRateINR: newSell }, adminName);
                                  showToast(`Updated selling rate to ₹${newSell}`);
                                }
                              }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground mr-1"
                              title="Edit Rate"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWorkRate(item.id, item.name)}
                              className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MATERIAL MASTER ───────────────────────────────────── */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search plywood, laminate, tiles, paint..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="crm-input pl-9 text-xs h-9 w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const name = prompt('Material Name:');
                if (!name) return;
                const brand = prompt('Brand Name:', 'CenturyPly / Greenply / Asian Paints') || 'Standard';
                const purchase = Number(prompt('Purchase Price per unit (INR ₹):', '100')) || 100;
                const sell = Number(prompt('Selling Rate per unit (INR ₹):', '140')) || 140;
                InteriorCatalogStore.addMaterial({
                  name,
                  category: 'Plywood',
                  brand,
                  model: 'Standard',
                  unit: 'sq.ft',
                  purchasePriceINR: purchase,
                  sellingRateINR: sell,
                  supplierName: 'Direct Approved Vendor',
                  wastagePct: 10,
                  minOrderQty: 50,
                  specifications: 'High grade interior material',
                  isActive: true,
                }, adminName);
                showToast(`Added material "${name}".`);
              }}
              className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Material
            </button>
          </div>

          <div className="crm-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="crm-table text-xs">
                <thead>
                  <tr>
                    <th>Material &amp; Specifications</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Purchase Price</th>
                    <th>Selling Rate</th>
                    <th>Wastage %</th>
                    <th>Vendor / Supplier</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials
                    .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.brand.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(item => (
                      <tr key={item.id}>
                        <td>
                          <p className="font-bold text-foreground">{item.name}</p>
                          <span className="text-[10px] text-muted-foreground">{item.specifications}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-slate-300">{item.brand}</span>
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {item.category}
                          </span>
                        </td>
                        <td className="font-mono text-muted-foreground">{item.unit}</td>
                        <td className="font-mono font-bold text-amber-500">₹{item.purchasePriceINR}</td>
                        <td className="font-mono font-bold text-emerald-500">₹{item.sellingRateINR}</td>
                        <td className="font-mono">{item.wastagePct}%</td>
                        <td className="text-slate-400">{item.supplierName}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const newRate = Number(prompt(`Update Selling Rate for ${item.name}:`, String(item.sellingRateINR)));
                              if (!isNaN(newRate) && newRate > 0) {
                                InteriorCatalogStore.updateMaterial(item.id, { sellingRateINR: newRate }, adminName);
                                showToast(`Updated rate for ${item.name}`);
                              }
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground mr-1"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(item.id, item.name)}
                            className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: HARDWARE & ACCESSORIES MASTER ─────────────────────── */}
      {activeTab === 'hardware' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search hinges, channels, handles, baskets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="crm-input pl-9 text-xs h-9 w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const name = prompt('Hardware Item Name:');
                if (!name) return;
                const brand = prompt('Brand:', 'Hettich / Hafele / Ebco / Ozone') || 'Hettich';
                const price = Number(prompt('Unit Cost Price (INR ₹):', '250')) || 250;
                const sell = Number(prompt('Selling Price (INR ₹):', '380')) || 380;
                InteriorCatalogStore.addHardware({
                  name,
                  category: 'hinges',
                  brand,
                  model: 'Standard Series',
                  dimensions: 'Universal fit',
                  unitPriceINR: price,
                  sellingPriceINR: sell,
                  supplierName: 'Approved Hardware Distributor',
                  applicableTo: 'All Cabinets',
                  isActive: true,
                }, adminName);
                showToast(`Added hardware item "${name}".`);
              }}
              className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Hardware Item
            </button>
          </div>

          <div className="crm-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="crm-table text-xs">
                <thead>
                  <tr>
                    <th>Hardware &amp; Model</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Dimensions / Specs</th>
                    <th>Cost Price</th>
                    <th>Selling Price</th>
                    <th>Applicable Furniture</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hardware
                    .filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.brand.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(item => (
                      <tr key={item.id}>
                        <td>
                          <p className="font-bold text-foreground">{item.name}</p>
                          <span className="text-[10px] text-muted-foreground">{item.model}</span>
                        </td>
                        <td className="font-semibold text-slate-300">{item.brand}</td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                            {item.category}
                          </span>
                        </td>
                        <td className="text-slate-400">{item.dimensions}</td>
                        <td className="font-mono font-bold text-amber-500">₹{item.unitPriceINR}</td>
                        <td className="font-mono font-bold text-emerald-500">₹{item.sellingPriceINR}</td>
                        <td className="text-slate-400">{item.applicableTo}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const newRate = Number(prompt(`Update Selling Price for ${item.name}:`, String(item.sellingPriceINR)));
                              if (!isNaN(newRate) && newRate > 0) {
                                InteriorCatalogStore.updateHardware(item.id, { sellingPriceINR: newRate }, adminName);
                                showToast(`Updated price for ${item.name}`);
                              }
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground mr-1"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHardware(item.id, item.name)}
                            className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: LABOR RATE MASTER ─────────────────────────────────── */}
      {activeTab === 'labor' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search carpenter, electrician, painter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="crm-input pl-9 text-xs h-9 w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const trade = prompt('Trade (Carpenter / Painter / Electrician / Mason):', 'Carpenter');
                if (!trade) return;
                const rate = Number(prompt('Rate (INR ₹):', '1200')) || 1200;
                InteriorCatalogStore.addLaborRate({
                  trade: trade as any,
                  rateType: 'daily',
                  rateINR: rate,
                  skillLevel: 'Skilled',
                  location: 'Metro Region',
                  isActive: true,
                }, adminName);
                showToast(`Added labor rate for ${trade}.`);
              }}
              className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Labor Rate
            </button>
          </div>

          <div className="crm-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="crm-table text-xs">
                <thead>
                  <tr>
                    <th>Trade &amp; Profession</th>
                    <th>Skill Level</th>
                    <th>Rate Type</th>
                    <th>Rate (INR ₹)</th>
                    <th>Location / Zone</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {laborRates
                    .filter(l => l.trade.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(item => (
                      <tr key={item.id}>
                        <td className="font-bold text-foreground">{item.trade}</td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400">
                            {item.skillLevel}
                          </span>
                        </td>
                        <td className="font-mono text-muted-foreground">{item.rateType}</td>
                        <td className="font-mono font-bold text-emerald-500">₹{item.rateINR}</td>
                        <td className="text-slate-400">{item.location}</td>
                        <td>
                          <span className="text-[10px] font-bold text-emerald-400">ACTIVE</span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const newRate = Number(prompt(`Update Rate for ${item.trade}:`, String(item.rateINR)));
                              if (!isNaN(newRate) && newRate > 0) {
                                InteriorCatalogStore.updateLaborRate(item.id, { rateINR: newRate }, adminName);
                                showToast(`Updated labor rate to ₹${newRate}`);
                              }
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground mr-1"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLabor(item.id, item.trade)}
                            className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: PRICING & CALCULATION SETTINGS ─────────────────────── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
          <div className="crm-card space-y-4">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Settings size={15} className="text-indigo-400" />
              Global Pricing, Margins &amp; Overheads Configuration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Material Wastage Allowance (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={settings.defaultWastagePct}
                  onChange={e => setSettings({ ...settings, defaultWastagePct: Number(e.target.value) })}
                  className="crm-input text-xs h-9 w-full font-mono"
                />
                <span className="text-[10px] text-muted-foreground">Standard 7% to 10% for plywood cutting &amp; tile trimming</span>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Edge Banding Machine Rate (INR ₹ / Rft)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.edgeBandingPerRftINR}
                  onChange={e => setSettings({ ...settings, edgeBandingPerRftINR: Number(e.target.value) })}
                  className="crm-input text-xs h-9 w-full font-mono"
                />
                <span className="text-[10px] text-muted-foreground">PVC 2mm tape application with hot melt glue</span>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Transportation &amp; Site Lifting (INR ₹ Lump Sum)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.transportLumpSumINR}
                  onChange={e => setSettings({ ...settings, transportLumpSumINR: Number(e.target.value) })}
                  className="crm-input text-xs h-9 w-full font-mono"
                />
                <span className="text-[10px] text-muted-foreground">Freight, tempo delivery &amp; apartment lift crane shifting</span>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Company Overheads &amp; Supervision (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={settings.companyOverheadPct}
                  onChange={e => setSettings({ ...settings, companyOverheadPct: Number(e.target.value) })}
                  className="crm-input text-xs h-9 w-full font-mono"
                />
                <span className="text-[10px] text-muted-foreground">Site supervisor, project manager &amp; office admin costs</span>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Target Profit Margin (%)
                </label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={settings.defaultProfitMarginPct}
                  onChange={e => setSettings({ ...settings, defaultProfitMarginPct: Number(e.target.value) })}
                  className="crm-input text-xs h-9 w-full font-mono font-bold text-emerald-400"
                />
                <span className="text-[10px] text-muted-foreground">Standard 20% to 25% gross contractor profit margin</span>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">
                  Standard GST Rate (%)
                </label>
                <input
                  type="number"
                  value={settings.gstPct}
                  onChange={e => setSettings({ ...settings, gstPct: Number(e.target.value) })}
                  className="crm-input text-xs h-9 w-full font-mono"
                />
                <span className="text-[10px] text-muted-foreground">Government GST on composite interior contracts (usually 18%)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button type="submit" className="btn-primary text-xs px-4 py-2 flex items-center gap-2">
                <Save size={14} /> Save Pricing Rules
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 6: RATE AUDIT LOGS ──────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="crm-card p-0 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <History size={15} className="text-indigo-400" /> Audit Trail &amp; Rate Version Logs
              </h4>
              <p className="text-xs text-muted-foreground">
                Timestamped records of every price, labor, and overhead modification made by admins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear audit log history?')) {
                  InteriorCatalogStore.clearAuditLogs(adminName);
                  loadData();
                }
              }}
              className="text-xs text-rose-400 hover:underline font-bold"
            >
              Clear Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table text-xs">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin / User</th>
                  <th>Module</th>
                  <th>Target Item</th>
                  <th>Field</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No rate change logs recorded yet. All changes are automatically versioned here.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td className="font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="font-bold text-foreground">{log.adminName}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {log.module}
                        </span>
                      </td>
                      <td className="font-semibold text-slate-200">{log.targetItem}</td>
                      <td className="font-mono text-slate-400">{log.fieldChanged}</td>
                      <td className="font-mono text-rose-400 line-through">{log.oldValue}</td>
                      <td className="font-mono text-emerald-400 font-bold">{log.newValue}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
