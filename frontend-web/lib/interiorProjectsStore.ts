/**
 * interiorProjectsStore.ts
 * Manages Interior Design Projects, Room Calculations, Quotations,
 * Saved 2D/3D Diagrams, Lead Activity History, and Live Calculations.
 */

import {
  InteriorLead,
  InteriorProject,
  RoomDefinition,
  StudioObject3D,
  WorkItem,
  BOQItem,
  InteriorQuotation,
  LeadActivityLog,
  FloorLevel,
  RoomType,
  MeasurementUnit,
} from '@/types/interiorStudio';
import { InteriorCatalogStore } from './interiorCatalogStore';

const STORAGE_KEY_PROJECTS = '@das_crm_interior_projects_v2';
const STORAGE_KEY_QUOTES = '@das_crm_interior_quotes_v2';
const STORAGE_KEY_LOGS = '@das_crm_interior_logs_v2';

// ── Realistic Seed Leads ───────────────────────────────────────────
export const SEED_LEADS: InteriorLead[] = [
  {
    id: 'lead-001',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@gmail.com',
    phone: '+91 98201 44521',
    company: 'Apex Logistics Ltd',
    address: 'Flat 1402, Oberoi Sky City, Borivali East, Mumbai',
    status: 'Qualified Proposal',
    budgetINR: 1850000,
    propertyType: '3BHK Apartment',
    createdDate: '2026-10-15',
  },
  {
    id: 'lead-002',
    name: 'Pooja & Vikram Verma',
    email: 'vikram.verma@outlook.com',
    phone: '+91 99308 12760',
    company: 'Verma Tech Solutions',
    address: 'Villa 18, Palm Meadows, Whitefield, Bengaluru',
    status: 'Site Measurement Done',
    budgetINR: 3200000,
    propertyType: '4BHK Villa',
    createdDate: '2026-10-20',
  },
  {
    id: 'lead-003',
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh@architects.in',
    phone: '+91 98112 55890',
    company: 'Studio Artha Interiors',
    address: 'Penthouse 24, Lodha World One, Lower Parel, Mumbai',
    status: 'Design Presentation',
    budgetINR: 4500000,
    propertyType: 'Penthouse',
    createdDate: '2026-10-26',
  },
  {
    id: 'lead-004',
    name: 'Karan Mehra',
    email: 'karan.mehra@fintech.co',
    phone: '+91 97654 33210',
    company: 'Fintech Hub India',
    address: 'Unit 402, DLF Cyber City, Phase 2, Gurugram',
    status: 'New Inquiry',
    budgetINR: 1200000,
    propertyType: '2BHK Apartment',
    createdDate: '2026-10-29',
  },
];

// ── Default 3D Furniture Items in the Marketplace (Integrated with 3D Asserts GLB Models) ───
export const MARKETPLACE_OBJECTS_CATALOG: Omit<StudioObject3D, 'id' | 'roomId' | 'position' | 'rotation'>[] = [
  {
    name: 'King Bed with Headboard & Soft Pillows',
    category: 'beds',
    thumbnailUrl: '/products/king-bed.jpg',
    modelUrl: '/api/interior/models/Bed.glb',
    dimensions: { width: 78, height: 48, depth: 84 },
    color: '#4a5568',
    material: 'Charcoal Linen Fabric + Plush Memory Foam',
    priceINR: 58000,
    brand: 'SleepCraft Ergonomics',
    vendor: 'Delhi Modular Factory',
    subElements: [
      { id: 'frame', name: 'Bed Frame & Headboard', color: '#4a5568', material: 'Linen Fabric' },
      { id: 'mattress', name: 'Mattress & Bedding', color: '#f8fafc', material: 'Organic Cotton' },
      { id: 'pillows', name: 'Sleeping Pillows (Pair)', color: '#ffffff', material: 'Duck Down Silk' },
      { id: 'duvet', name: 'Duvet / Throw Blanket', color: '#818cf8', material: 'Cashmere Knit' },
    ],
  },
  {
    name: 'Long Living Room Sectional Sofa',
    category: 'seating',
    thumbnailUrl: '/products/bixler-sofa.jpg',
    modelUrl: '/api/interior/models/Long%20Sofa.glb',
    dimensions: { width: 92, height: 34, depth: 38 },
    color: '#3d5c3a',
    material: 'Premium Olive Velvet + High-Density Foam',
    priceINR: 48000,
    brand: 'Homemakers Living',
    vendor: 'Design Studio Woodcraft',
    subElements: [
      { id: 'upholstery', name: 'Main Body Upholstery', color: '#3d5c3a', material: 'Olive Velvet' },
      { id: 'cushions', name: 'Seat & Back Cushions', color: '#4b6b47', material: 'Tufted Velvet' },
      { id: 'pillows', name: 'Accent Throw Pillows', color: '#d4af37', material: 'Satin Brass' },
      { id: 'legs', name: 'Sofa Legs & Base', color: '#271b12', material: 'Dark Walnut Wood' },
    ],
  },
  {
    name: 'Single Accent Armchair',
    category: 'seating',
    thumbnailUrl: '/products/chesterfield.jpg',
    modelUrl: '/api/interior/models/Single%20Sofa.glb',
    dimensions: { width: 38, height: 36, depth: 36 },
    color: '#8b4513',
    material: 'Top-Grain Vintage Cognac Leather',
    priceINR: 24500,
    brand: 'Homemakers Living',
    vendor: 'Design Studio Woodcraft',
    subElements: [
      { id: 'seat', name: 'Leather Seat & Back', color: '#8b4513', material: 'Cognac Leather' },
      { id: 'cushion', name: 'Lumbar Cushion', color: '#b45309', material: 'Suede' },
      { id: 'legs', name: 'Tapered Legs', color: '#1e293b', material: 'Matte Black Steel' },
    ],
  },
  {
    name: 'Modern 4-Chair Dining Table Set',
    category: 'tables',
    thumbnailUrl: '/products/dining-table.jpg',
    modelUrl: '/api/interior/models/4%20Chair%20Table%20Set%20.glb',
    dimensions: { width: 60, height: 30, depth: 38 },
    color: '#c29b61',
    material: 'Natural Solid White Oak with Matte PU',
    priceINR: 42000,
    brand: 'Urban Woods',
    vendor: 'Kolkata Joinery Works',
    subElements: [
      { id: 'top', name: 'Dining Tabletop', color: '#c29b61', material: 'Natural White Oak' },
      { id: 'chair_seat', name: 'Chair Cushions', color: '#334155', material: 'Textured Fabric' },
      { id: 'legs', name: 'Table & Chair Frame', color: '#0f172a', material: 'Black Powder Coat' },
    ],
  },
  {
    name: 'Luxury Solid Wood Dining Ensemble',
    category: 'tables',
    thumbnailUrl: '/products/coffee-table.jpg',
    modelUrl: '/api/interior/models/Dining%20Table%20and%20Char%20set%20.glb',
    dimensions: { width: 78, height: 30, depth: 42 },
    color: '#5c3a21',
    material: 'Stained Sheesham Rosewood + Brass Trim',
    priceINR: 65000,
    brand: 'Urban Woods',
    vendor: 'Kolkata Joinery Works',
    subElements: [
      { id: 'top', name: 'Table Surface', color: '#5c3a21', material: 'Sheesham Rosewood' },
      { id: 'chair_seats', name: 'Dining Chair Seats', color: '#e2e8f0', material: 'Beige Boucle' },
      { id: 'hardware', name: 'Leg Accents', color: '#d4af37', material: 'Brushed Brass' },
    ],
  },
  {
    name: 'Long Credenza & Drawer Console',
    category: 'storage',
    thumbnailUrl: '/products/wardrobe.jpg',
    modelUrl: '/api/interior/models/Drawer%20Long%20Set%20.glb',
    dimensions: { width: 72, height: 32, depth: 20 },
    color: '#334155',
    material: 'Matte Lacquer & Walnut Veneer Top',
    priceINR: 32000,
    brand: 'DAS Custom Modular',
    vendor: 'DAS Factory In-House',
    subElements: [
      { id: 'carcass', name: 'Console Outer Body', color: '#334155', material: 'Charcoal Lacquer' },
      { id: 'top', name: 'Console Top Counter', color: '#78350f', material: 'American Walnut' },
      { id: 'drawers', name: 'Drawer Fronts', color: '#1e293b', material: 'Grooved MDF' },
      { id: 'handles', name: 'Drawer Pulls', color: '#d4af37', material: 'Gold Anodized' },
    ],
  },
  {
    name: 'Ergonomic Executive Gaming & Work Chair',
    category: 'seating',
    thumbnailUrl: '/products/planter.jpg',
    modelUrl: '/api/interior/models/gaming-chair.glb',
    dimensions: { width: 28, height: 50, depth: 28 },
    color: '#1e1e24',
    material: 'Breathable Mesh + Cold-Cure Foam',
    priceINR: 22500,
    brand: 'ErgoPro Systems',
    vendor: 'Apex Electricals',
    subElements: [
      { id: 'seat', name: 'Chair Seat & High-Back', color: '#1e1e24', material: 'Breathable Mesh' },
      { id: 'lumbar', name: 'Lumbar & Neck Pillow', color: '#ef4444', material: 'Racing Red Accent' },
      { id: 'armrests', name: '4D Armrests', color: '#09090b', material: 'Soft PU' },
      { id: 'base', name: 'Hydraulic Star Base', color: '#e2e8f0', material: 'Polished Aluminum' },
    ],
  },
  {
    name: 'Minimalist Designer Study Chair',
    category: 'seating',
    thumbnailUrl: '/products/floor-lamp.jpg',
    modelUrl: '/api/interior/models/Study%20Chair.glb',
    dimensions: { width: 24, height: 34, depth: 24 },
    color: '#f1f5f9',
    material: 'Molded Polypropylene + Solid Beech Wood',
    priceINR: 8500,
    brand: 'Urban Woods',
    vendor: 'Kolkata Joinery Works',
    subElements: [
      { id: 'shell', name: 'Chair Molded Shell', color: '#f1f5f9', material: 'Matte Polymer' },
      { id: 'pad', name: 'Padded Seat Cushion', color: '#475569', material: 'Slate Fabric' },
      { id: 'legs', name: 'Eiffel Beech Legs', color: '#d97706', material: 'Natural Beech Wood' },
    ],
  },
  {
    name: 'TV Wall Paneling & Media Console Unit',
    category: 'storage',
    thumbnailUrl: '/products/tv-console.jpg',
    modelUrl: '/api/interior/models/TV%20wall%20and%20Drawer%20set%20.glb',
    dimensions: { width: 96, height: 84, depth: 18 },
    color: '#18181b',
    material: 'Acoustic Charcoal Felt + Walnut Fluted Slats',
    priceINR: 62000,
    brand: 'DAS Custom Modular',
    vendor: 'DAS Factory In-House',
    subElements: [
      { id: 'wall_panel', name: 'Back Fluted Wall Slat', color: '#78350f', material: 'Walnut Louver' },
      { id: 'floating_unit', name: 'Floating Low Console', color: '#18181b', material: 'Matte Black PU' },
      { id: 'display_shelf', name: 'Backlit Display Shelf', color: '#3f3f46', material: 'Smoked Glass' },
    ],
  },
  {
    name: 'Architectural Wall Clock Watch',
    category: 'decor',
    thumbnailUrl: '/products/planter.jpg',
    modelUrl: '/api/interior/models/Wall%20Watch%20.glb',
    dimensions: { width: 28, height: 28, depth: 4 },
    color: '#d4af37',
    material: 'Minimalist Brushed Brass Ring + Silent Sweep',
    priceINR: 6800,
    brand: 'Lumiere Architectural',
    vendor: 'Apex Electricals',
    subElements: [
      { id: 'ring', name: 'Outer Clock Ring', color: '#d4af37', material: 'Brushed Brass' },
      { id: 'hands', name: 'Clock Hands', color: '#09090b', material: 'Matte Black Metal' },
    ],
  },
  {
    name: 'Contemporary Velvet Accent Chair',
    category: 'seating',
    thumbnailUrl: '/products/chesterfield.jpg',
    modelUrl: '/api/interior/models/modern%20chair%2001%20max.glb',
    dimensions: { width: 32, height: 32, depth: 32 },
    color: '#0284c7',
    material: 'Electric Blue Italian Velvet + Gold Plated Base',
    priceINR: 19500,
    brand: 'Homemakers Living',
    vendor: 'Design Studio Woodcraft',
    subElements: [
      { id: 'shell', name: 'Velvet Shell & Seat', color: '#0284c7', material: 'Italian Blue Velvet' },
      { id: 'cushion', name: 'Accent Pillow', color: '#f59e0b', material: 'Ochre Silk' },
      { id: 'legs', name: 'Spindle Legs', color: '#d4af37', material: 'Mirror Polished Brass' },
    ],
  },
  {
    name: 'Curved Nordic Armchair 2.0',
    category: 'seating',
    thumbnailUrl: '/products/bixler-sofa.jpg',
    modelUrl: '/api/interior/models/Modern%20Chair%20of%20mine%20glb2.0.glb',
    dimensions: { width: 34, height: 35, depth: 34 },
    color: '#e2e8f0',
    material: 'Textured Oatmeal Boucle + Curved Oak Wood',
    priceINR: 26000,
    brand: 'Urban Woods',
    vendor: 'Design Studio Woodcraft',
    subElements: [
      { id: 'boucle', name: 'Curved Boucle Body', color: '#e2e8f0', material: 'Oatmeal Boucle' },
      { id: 'frame', name: 'Solid Wood Sled Base', color: '#b45309', material: 'Smoked Oak' },
    ],
  },
  {
    name: 'Premium Deep-Seat Comfort Couch',
    category: 'seating',
    thumbnailUrl: '/products/bixler-sofa.jpg',
    modelUrl: '/api/interior/models/84-couch-3dsmax-.glb',
    dimensions: { width: 88, height: 33, depth: 40 },
    color: '#475569',
    material: 'Heavyweight Slate Linen + Feather Blend',
    priceINR: 54000,
    brand: 'Homemakers Living',
    vendor: 'Design Studio Woodcraft',
    subElements: [
      { id: 'body', name: 'Couch Body Upholstery', color: '#475569', material: 'Slate Linen' },
      { id: 'cushions', name: 'Seat & Back Bolsters', color: '#334155', material: 'Feather Cushions' },
      { id: 'pillows', name: 'Scatter Pillows', color: '#f1f5f9', material: 'Crisp White Linen' },
    ],
  },
  {
    name: 'Executive Bistro Table & Chairs',
    category: 'tables',
    thumbnailUrl: '/products/dining-table.jpg',
    modelUrl: '/api/interior/models/33--table_and_chair.glb',
    dimensions: { width: 44, height: 30, depth: 44 },
    color: '#0f172a',
    material: 'Cast Iron Pedestal + Carrara White Quartz',
    priceINR: 36000,
    brand: 'Urban Woods',
    vendor: 'Kolkata Joinery Works',
    subElements: [
      { id: 'top', name: 'Quartz Bistro Tabletop', color: '#f8fafc', material: 'Carrara Quartz' },
      { id: 'chair_fabric', name: 'Bistro Chair Seats', color: '#0f172a', material: 'Black Leatherette' },
      { id: 'pedestal', name: 'Cast Iron Base', color: '#18181b', material: 'Matte Cast Iron' },
    ],
  },
  {
    name: 'Minimalist Arc Floor Lamp (Warm Brass)',
    category: 'lighting',
    thumbnailUrl: '/products/floor-lamp.jpg',
    dimensions: { width: 18, height: 78, depth: 36 },
    color: '#d4af37',
    material: 'Brushed Brass Tube + Marble Base',
    priceINR: 12500,
    brand: 'Lumiere Architectural',
    vendor: 'Apex Electricals',
    subElements: [
      { id: 'pole', name: 'Arc Arm & Base', color: '#d4af37', material: 'Brushed Brass' },
      { id: 'shade', name: 'Lampshade', color: '#fffbeb', material: 'Opaline Diffuser' },
    ],
  },
  {
    name: 'Fiddle Leaf Fig Indoor Planter in Ceramic Pot',
    category: 'decor',
    thumbnailUrl: '/products/planter.jpg',
    dimensions: { width: 20, height: 62, depth: 20 },
    color: '#2e7d32',
    material: 'Live Ornamental Indoor Plant + White Ceramic',
    priceINR: 4200,
    brand: 'GreenSpace Botanicals',
    vendor: 'Green Roots Nursery',
    subElements: [
      { id: 'pot', name: 'Planter Pot', color: '#f8fafc', material: 'Glazed Ceramic' },
      { id: 'foliage', name: 'Plant Foliage', color: '#15803d', material: 'Living Leaves' },
    ],
  },
  {
    name: 'Modern Ceiling Chandelier & Profile Fixture',
    category: 'lighting',
    thumbnailUrl: '/products/floor-lamp.jpg',
    dimensions: { width: 36, height: 24, depth: 36 },
    color: '#d4af37',
    material: 'Suspended Ring LED Chandelier (3000K Warm)',
    priceINR: 18500,
    brand: 'Lumiere Architectural',
    vendor: 'Apex Electricals',
    subElements: [
      { id: 'rings', name: 'LED Halo Rings', color: '#d4af37', material: 'Gold Anodized Ring' },
      { id: 'canopy', name: 'Ceiling Canopy & Cables', color: '#18181b', material: 'Black Canopy' },
    ],
  },
  {
    name: 'Geometric Hand-Tufted Wool Rug (8x5 ft)',
    category: 'decor',
    thumbnailUrl: '/products/rug.jpg',
    dimensions: { width: 96, height: 1, depth: 60 },
    color: '#d69e2e',
    material: '100% New Zealand Wool with Moroccan Pattern',
    priceINR: 16000,
    brand: 'WeaveCraft Carpets',
    vendor: 'Mirzapur Rugs Co.',
  },
];

export class InteriorProjectsStore {
  private static projects: InteriorProject[] = [];
  private static quotations: InteriorQuotation[] = [];
  private static activityLogs: LeadActivityLog[] = [];
  private static initialized = false;

  private static init() {
    if (this.initialized || typeof window === 'undefined') return;
    try {
      const storedProj = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (storedProj) {
        this.projects = JSON.parse(storedProj);
      } else {
        // Seed initial project for Rajesh Sharma
        this.projects = [this.createSeedProject(SEED_LEADS[0])];
      }

      const storedQuotes = localStorage.getItem(STORAGE_KEY_QUOTES);
      if (storedQuotes) {
        this.quotations = JSON.parse(storedQuotes);
      } else {
        // Seed initial quotation
        const seedQuote = this.calculateQuotationFromProject(this.projects[0], SEED_LEADS[0], 1);
        seedQuote.status = 'SENT';
        this.quotations = [seedQuote];
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      if (storedLogs) {
        this.activityLogs = JSON.parse(storedLogs);
      } else {
        this.activityLogs = [
          { id: 'log-1', leadId: 'lead-001', timestamp: '2026-10-15T10:30:00Z', actor: 'Admin', action: 'LEAD_SELECTED', details: 'Selected lead Rajesh Sharma for 3BHK interior estimation.' },
          { id: 'log-2', leadId: 'lead-001', timestamp: '2026-10-16T14:15:00Z', actor: 'Admin', action: 'ROOM_CONFIGURED', details: 'Configured Living Room, Master Bed and Kitchen measurements.' },
          { id: 'log-3', leadId: 'lead-001', timestamp: '2026-10-18T16:45:00Z', actor: 'Admin', action: 'DESIGN_SAVED', details: 'Saved 3D Studio furniture layout with 6 modular objects.' },
          { id: 'log-4', leadId: 'lead-001', timestamp: '2026-10-20T11:20:00Z', actor: 'Admin', action: 'QUOTE_CREATED', details: 'Generated Quotation #INT-2026-0042 (₹17,84,500 + GST).', quoteNumber: 'INT-2026-0042' },
          { id: 'log-5', leadId: 'lead-001', timestamp: '2026-10-21T09:00:00Z', actor: 'Admin', action: 'QUOTE_SENT', details: 'Official quotation sent to rajesh.sharma@gmail.com.', quoteNumber: 'INT-2026-0042' },
        ];
      }
    } catch (_) {}
    this.initialized = true;
  }

  private static persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
      localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(this.quotations));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.activityLogs));
      window.dispatchEvent(new CustomEvent('das_crm_interior_projects_updated'));
    } catch (_) {}
  }

  static getLeads(): InteriorLead[] {
    return SEED_LEADS;
  }

  static getLeadById(id: string): InteriorLead | undefined {
    return SEED_LEADS.find(l => l.id === id);
  }

  static getProjects(): InteriorProject[] {
    this.init();
    return [...this.projects];
  }

  static getProjectByLeadId(leadId: string): InteriorProject | undefined {
    this.init();
    return this.projects.find(p => p.leadId === leadId);
  }

  static getProjectById(id: string): InteriorProject | undefined {
    this.init();
    return this.projects.find(p => p.id === id);
  }

  static saveProject(project: InteriorProject, actor = 'User') {
    this.init();
    const idx = this.projects.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      this.projects[idx] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      this.projects.push(project);
    }
    this.addLog(project.leadId, actor, 'DESIGN_SAVED', `Updated project "${project.projectName}" with ${project.rooms.length} rooms and ${project.objects3D.length} 3D objects.`);
    this.persist();
  }

  static getQuotations(): InteriorQuotation[] {
    this.init();
    return [...this.quotations];
  }

  static getQuotationsByLeadId(leadId: string): InteriorQuotation[] {
    this.init();
    return this.quotations.filter(q => q.leadId === leadId).sort((a, b) => b.revision - a.revision);
  }

  static getQuotationById(id: string): InteriorQuotation | undefined {
    this.init();
    return this.quotations.find(q => q.id === id);
  }

  static saveQuotation(quote: InteriorQuotation, actor = 'User') {
    this.init();
    const idx = this.quotations.findIndex(q => q.id === quote.id);
    if (idx !== -1) {
      this.quotations[idx] = { ...quote, updatedAt: new Date().toISOString() };
    } else {
      this.quotations.unshift(quote);
    }
    this.addLog(quote.leadId, actor, 'QUOTE_CREATED', `Saved Quotation #${quote.quoteNumber} (Rev ${quote.revision}) Total: ₹${quote.grandTotalINR.toLocaleString('en-IN')}`, quote.quoteNumber);
    this.persist();
  }

  static updateQuotationStatus(id: string, status: InteriorQuotation['status'], actor = 'Admin') {
    this.init();
    const q = this.quotations.find(item => item.id === id);
    if (q) {
      q.status = status;
      q.updatedAt = new Date().toISOString();
      const action = status === 'APPROVED' ? 'QUOTE_APPROVED' : status === 'SENT' ? 'QUOTE_SENT' : 'QUOTE_REVISED';
      this.addLog(q.leadId, actor, action, `Quotation #${q.quoteNumber} status changed to ${status}.`, q.quoteNumber);
      this.persist();
    }
  }

  static createRevision(originalQuoteId: string, actor = 'User'): InteriorQuotation | null {
    this.init();
    const orig = this.quotations.find(q => q.id === originalQuoteId);
    if (!orig) return null;

    const newRevNum = orig.revision + 1;
    const newQuote: InteriorQuotation = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `quote-${Date.now()}`,
      revision: newRevNum,
      status: 'REVISED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.quotations.unshift(newQuote);
    this.addLog(orig.leadId, actor, 'QUOTE_REVISED', `Created Revision ${newRevNum} for Quotation #${orig.quoteNumber}.`, orig.quoteNumber);
    this.persist();
    return newQuote;
  }

  static getLogsByLeadId(leadId: string): LeadActivityLog[] {
    this.init();
    return this.activityLogs.filter(l => l.leadId === leadId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static addLog(leadId: string, actor: string, action: LeadActivityLog['action'], details: string, quoteNumber?: string) {
    this.init();
    const entry: LeadActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      leadId,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
      quoteNumber,
    };
    this.activityLogs.unshift(entry);
    this.persist();
  }

  // ── Live Calculation Engine ──────────────────────────────────────
  /**
   * Calculates Area, Perimeter, and Wall Area from raw measurements
   */
  static computeRoomMetrics(length: number, width: number, height: number, unit: MeasurementUnit, openings: RoomDefinition['openings'] = []) {
    // Convert all to feet for standardized cost calculation
    let lFt = length;
    let wFt = width;
    let hFt = height;

    if (unit === 'in') {
      lFt = length / 12;
      wFt = width / 12;
      hFt = height / 12;
    } else if (unit === 'm') {
      lFt = length * 3.28084;
      wFt = width * 3.28084;
      hFt = height * 3.28084;
    } else if (unit === 'mm') {
      lFt = length / 304.8;
      wFt = width / 304.8;
      hFt = height / 304.8;
    }

    const floorAreaSqFt = Math.round(lFt * wFt * 10) / 10;
    const ceilingAreaSqFt = floorAreaSqFt;
    const perimeterFt = Math.round(2 * (lFt + wFt) * 10) / 10;
    const grossWallAreaSqFt = perimeterFt * hFt;

    // Deduct openings (doors, windows)
    let openingDeductionsSqFt = 0;
    openings.forEach(op => {
      let opW = op.width;
      let opH = op.height;
      if (unit === 'in') { opW /= 12; opH /= 12; }
      else if (unit === 'm') { opW *= 3.28084; opH *= 3.28084; }
      else if (unit === 'mm') { opW /= 304.8; opH /= 304.8; }
      openingDeductionsSqFt += (opW * opH);
    });

    const wallAreaSqFt = Math.max(0, Math.round((grossWallAreaSqFt - openingDeductionsSqFt) * 10) / 10);

    return {
      floorAreaSqFt,
      ceilingAreaSqFt,
      perimeterFt,
      wallAreaSqFt,
    };
  }

  /**
   * Generates automatic live BOQ line items and cost sheet from rooms, 3D furniture objects and work items.
   */
  static generateBOQ(project: InteriorProject): { boqItems: BOQItem[]; summary: any } {
    const workRates = InteriorCatalogStore.getWorkRates();
    const settings = InteriorCatalogStore.getSettings();
    const boqItems: BOQItem[] = [];

    // 1. Generate line items from room measurements and selected standard works
    project.rooms.forEach(room => {
      const roomWorks = project.workItems.filter(w => w.roomId === room.id && w.applicable);

      roomWorks.forEach(work => {
        const rateMaster = workRates.find(wr => wr.itemCode === work.itemCode);
        const sellingRate = rateMaster?.sellingRateINR || work.unitSellRateINR;
        const matRate = rateMaster?.materialRateINR || work.materialRateINR;
        const labRate = rateMaster?.laborRateINR || work.laborRateINR;
        const costRate = matRate + labRate;

        const totalCost = Math.round(work.quantity * costRate);
        const totalSell = Math.round(work.quantity * sellingRate);

        boqItems.push({
          id: `boq-${work.id}`,
          roomName: room.name,
          category: work.category.toUpperCase(),
          itemName: work.title,
          specification: work.description,
          quantity: work.quantity,
          unit: work.unit,
          materialCostRate: matRate,
          laborCostRate: labRate,
          sellingRate,
          totalCostAmount: totalCost,
          totalSellingAmount: totalSell,
          vendorName: 'Direct Sourced / Pre-Approved Master',
        });
      });
    });

    // 2. Add 3D furniture & decor objects placed in the room canvas into the BOQ!
    project.objects3D.forEach(obj => {
      const room = project.rooms.find(r => r.id === obj.roomId) || project.rooms[0];
      const sellPrice = obj.priceINR;
      const costPrice = Math.round(obj.priceINR * 0.72); // 28% margin on loose furniture/decor

      boqItems.push({
        id: `boq-3d-${obj.id}`,
        roomName: room?.name || 'Studio Placement',
        category: 'FURNITURE & DECOR',
        itemName: obj.name,
        specification: `${obj.material} • Dims: ${obj.dimensions.width}"W x ${obj.dimensions.height}"H x ${obj.dimensions.depth}"D • Brand: ${obj.brand || 'Custom'}`,
        quantity: 1,
        unit: 'per.unit',
        materialCostRate: costPrice,
        laborCostRate: 0,
        sellingRate: sellPrice,
        totalCostAmount: costPrice,
        totalSellingAmount: sellPrice,
        vendorName: obj.vendor || 'Authorized Master Catalog',
      });
    });

    // Summary calculations
    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    let subtotalSelling = 0;

    boqItems.forEach(b => {
      totalMaterialCost += (b.materialCostRate * b.quantity);
      totalLaborCost += (b.laborCostRate * b.quantity);
      subtotalSelling += b.totalSellingAmount;
    });

    const wastageAmount = Math.round((totalMaterialCost * settings.defaultWastagePct) / 100);
    const transportAmount = settings.transportLumpSumINR;
    const overheadAmount = Math.round((subtotalSelling * settings.companyOverheadPct) / 100);

    const internalNetCost = Math.round(totalMaterialCost + totalLaborCost + wastageAmount + transportAmount + (overheadAmount * 0.5));
    const profitMarginAmount = Math.round((subtotalSelling * settings.defaultProfitMarginPct) / 100);
    const discountAmount = 0;
    const taxableAmount = subtotalSelling - discountAmount;
    const gstAmount = Math.round((taxableAmount * settings.gstPct) / 100);
    const grandTotalINR = taxableAmount + gstAmount;

    const profitAmount = taxableAmount - internalNetCost;
    const profitMarginPercent = taxableAmount > 0 ? Math.round((profitAmount / taxableAmount) * 100) : 0;

    return {
      boqItems,
      summary: {
        totalMaterialCost,
        totalLaborCost,
        totalHardwareCost: Math.round(totalMaterialCost * 0.15),
        wastageAmount,
        transportAmount,
        overheadAmount,
        internalNetCost,
        subtotalSelling,
        discountAmount,
        gstPercentage: settings.gstPct,
        gstAmount,
        grandTotalINR,
        profitAmount,
        profitMarginPercent,
      },
    };
  }

  /**
   * Compiles a full formal Quotation document from a project and lead
   */
  static calculateQuotationFromProject(project: InteriorProject, lead: InteriorLead, revision = 1): InteriorQuotation {
    const { boqItems, summary } = this.generateBOQ(project);
    const quoteNum = `INT-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const totalAreaSqFt = project.rooms.reduce((acc, r) => acc + r.floorAreaSqFt, 0);

    const quote: InteriorQuotation = {
      id: `quote-${Date.now()}`,
      quoteNumber: quoteNum,
      revision,
      leadId: lead.id,
      leadName: lead.name,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      projectName: project.projectName,
      floorLevel: project.floorLevel,
      roomsSummary: {
        roomCount: project.rooms.length,
        totalAreaSqFt,
      },
      boqItems,
      totalMaterialCost: summary.totalMaterialCost,
      totalLaborCost: summary.totalLaborCost,
      totalHardwareCost: summary.totalHardwareCost,
      wastageAmount: summary.wastageAmount,
      transportAmount: summary.transportAmount,
      siteSupervisionAmount: Math.round(summary.totalLaborCost * 0.1),
      internalNetCost: summary.internalNetCost,
      subtotalSelling: summary.subtotalSelling,
      overheadAmount: summary.overheadAmount,
      profitMarginAmount: summary.profitAmount,
      discountPercentage: 0,
      discountAmount: summary.discountAmount,
      gstPercentage: summary.gstPercentage,
      gstAmount: summary.gstAmount,
      grandTotalINR: summary.grandTotalINR,
      profitAmount: summary.profitAmount,
      profitMarginPercent: summary.profitMarginPercent,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
      paymentMilestones: [
        { stage: '1. Booking & Design Sign-off', percentage: 10, amountINR: Math.round(summary.grandTotalINR * 0.1) },
        { stage: '2. Site Mobilization & Civil / MEP Work', percentage: 25, amountINR: Math.round(summary.grandTotalINR * 0.25) },
        { stage: '3. Woodwork Carcase & Factory Dispatch', percentage: 35, amountINR: Math.round(summary.grandTotalINR * 0.35) },
        { stage: '4. Finishes, Painting & Fixtures Installation', percentage: 20, amountINR: Math.round(summary.grandTotalINR * 0.20) },
        { stage: '5. Final Handover & Quality Audit Clearance', percentage: 10, amountINR: Math.round(summary.grandTotalINR * 0.10) },
      ],
      termsAndConditions: [
        'All rates quoted are inclusive of supply, fabrication, installation and 10-year structural warranty on Marine Grade BWP ply.',
        'Electricity, water supply, and building society scaffolding/entry permissions to be provided by the client.',
        'Any variations or additions requested post-approval will be billed as per the Master Catalog rate revision sheet.',
        'Payment to be made via direct RTGS/NEFT or corporate account Cheque in favor of "DAS CRM Interior Solutions".',
        'Standard completion timeline: 45 to 60 working days from design sign-off and site readiness.',
      ],
    };

    return quote;
  }

  // ── Project Creator ─────────────────────────────────────────────
  static createProject(lead: InteriorLead, projectName?: string, floorLevel: FloorLevel = 'Ground Floor'): InteriorProject {
    const proj = this.createSeedProject(lead);
    if (projectName) proj.projectName = projectName;
    proj.floorLevel = floorLevel;
    this.saveProject(proj);
    return proj;
  }

  // ── Seed Project Creator ─────────────────────────────────────────
  private static createSeedProject(lead: InteriorLead): InteriorProject {
    const livingMetrics = this.computeRoomMetrics(18, 14, 10, 'ft', [
      { id: 'op-1', type: 'door', wall: 'north', width: 3.5, height: 7 },
      { id: 'op-2', type: 'window', wall: 'east', width: 6, height: 5 },
    ]);

    const masterBedMetrics = this.computeRoomMetrics(16, 12, 10, 'ft', [
      { id: 'op-3', type: 'door', wall: 'west', width: 3.2, height: 7 },
      { id: 'op-4', type: 'window', wall: 'south', width: 5, height: 4.5 },
    ]);

    const kitchenMetrics = this.computeRoomMetrics(12, 10, 10, 'ft', [
      { id: 'op-5', type: 'door', wall: 'south', width: 3, height: 7 },
    ]);

    const rooms: RoomDefinition[] = [
      {
        id: 'room-living',
        name: 'Living & Dining Lounge',
        type: 'Living Room',
        length: 18,
        width: 14,
        height: 10,
        unit: 'ft',
        ...livingMetrics,
        openings: [
          { id: 'op-1', type: 'door', wall: 'north', width: 3.5, height: 7 },
          { id: 'op-2', type: 'window', wall: 'east', width: 6, height: 5 },
        ],
        floorMaterial: 'Italian Botticino Marble',
        wallFinish: 'Royal Luxury Emulsion + Fluted Louver Accent',
        ceilingFinish: 'Gypsum Board with Concealed LED Cove',
      },
      {
        id: 'room-master',
        name: 'Master Suite',
        type: 'Master Bedroom',
        length: 16,
        width: 12,
        height: 10,
        unit: 'ft',
        ...masterBedMetrics,
        openings: [
          { id: 'op-3', type: 'door', wall: 'west', width: 3.2, height: 7 },
          { id: 'op-4', type: 'window', wall: 'south', width: 5, height: 4.5 },
        ],
        floorMaterial: 'Engineered Wooden Flooring (AC4)',
        wallFinish: 'Velvet Stucco Accent + Asian Paints Royale',
        ceilingFinish: 'Perimeter POP Step with Spotlights',
      },
      {
        id: 'room-kitchen',
        name: 'Modular Kitchen',
        type: 'Kitchen',
        length: 12,
        width: 10,
        height: 10,
        unit: 'ft',
        ...kitchenMetrics,
        openings: [
          { id: 'op-5', type: 'door', wall: 'south', width: 3, height: 7 },
        ],
        floorMaterial: 'Vitrified Matte Anti-Skid Tiles',
        wallFinish: 'Ceramic Dado Wall Tiles 600x300mm',
        ceilingFinish: 'Plain Gypsum with LED Downlights',
      },
    ];

    const objects3D: StudioObject3D[] = [
      {
        id: 'obj-1',
        roomId: 'room-living',
        name: 'Bixler Sofa 3-Seater (Olive)',
        category: 'seating',
        thumbnailUrl: '/products/bixler-sofa.jpg',
        dimensions: { width: 84, height: 34, depth: 38 },
        position: { x: 0, y: 0.45, z: 1.2 },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#3d5c3a',
        material: 'Olive Velvet Fabric',
        priceINR: 42000,
        brand: 'Homemakers Living',
      },
      {
        id: 'obj-2',
        roomId: 'room-living',
        name: 'Floating TV Console with Backlit Panel',
        category: 'storage',
        thumbnailUrl: '/products/tv-console.jpg',
        dimensions: { width: 84, height: 18, depth: 16 },
        position: { x: 0, y: 0.25, z: -2.3 },
        rotation: { x: 0, y: 180, z: 0 },
        color: '#1a202c',
        material: 'Matt PU Lacquer + Oak Louvers',
        priceINR: 29000,
        brand: 'DAS Custom Modular',
      },
      {
        id: 'obj-3',
        roomId: 'room-living',
        name: 'Geometric Hand-Tufted Wool Rug',
        category: 'decor',
        thumbnailUrl: '/products/rug.jpg',
        dimensions: { width: 96, height: 1, depth: 60 },
        position: { x: 0, y: 0.01, z: 0.5 },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#d69e2e',
        material: 'New Zealand Wool',
        priceINR: 16000,
        brand: 'WeaveCraft Carpets',
      },
      {
        id: 'obj-4',
        roomId: 'room-master',
        name: 'King Hydraulic Storage Bed',
        category: 'beds',
        thumbnailUrl: '/products/king-bed.jpg',
        dimensions: { width: 76, height: 48, depth: 84 },
        position: { x: 0, y: 0.6, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#4a5568',
        material: 'Charcoal Linen with Gas Lift',
        priceINR: 52000,
        brand: 'SleepCraft Ergonomics',
      },
      {
        id: 'obj-5',
        roomId: 'room-master',
        name: 'Floor-to-Ceiling 3-Door Sliding Wardrobe',
        category: 'storage',
        thumbnailUrl: '/products/wardrobe.jpg',
        dimensions: { width: 96, height: 108, depth: 24 },
        position: { x: -2.4, y: 1.35, z: 0 },
        rotation: { x: 0, y: 90, z: 0 },
        color: '#2d3748',
        material: '18mm BWP Ply + Merino Laminate',
        priceINR: 78000,
        brand: 'DAS Custom Modular',
      },
    ];

    const workItems: WorkItem[] = [
      // Living Room Works
      { id: 'w-1', roomId: 'room-living', roomName: 'Living & Dining Lounge', category: 'flooring', itemCode: 'FL-MARB-02', title: 'Italian Marble Laying, Mirror Polish & Crystallization', description: 'Imported Botticino marble laying with tin oxide diamond pad crystallization.', unit: 'sq.ft', quantity: livingMetrics.floorAreaSqFt, unitCostRateINR: 420, unitSellRateINR: 650, laborRateINR: 140, materialRateINR: 280, hardwareRateINR: 0, applicable: true },
      { id: 'w-2', roomId: 'room-living', roomName: 'Living & Dining Lounge', category: 'ceiling', itemCode: 'CL-GYP-01', title: 'Gypsum Board False Ceiling with Perimeter Channel', description: 'Saint-Gobain Gypboard 12.5mm on GI perimeter channels with joint tape.', unit: 'sq.ft', quantity: livingMetrics.ceilingAreaSqFt, unitCostRateINR: 85, unitSellRateINR: 130, laborRateINR: 38, materialRateINR: 47, hardwareRateINR: 0, applicable: true },
      { id: 'w-3', roomId: 'room-living', roomName: 'Living & Dining Lounge', category: 'ceiling', itemCode: 'CL-COVE-02', title: 'Indirect Concealed LED Light Cove Step', description: 'Stepped gypsum profile designed to house LED tape strips without glare.', unit: 'running.ft', quantity: livingMetrics.perimeterFt, unitCostRateINR: 120, unitSellRateINR: 180, laborRateINR: 50, materialRateINR: 70, hardwareRateINR: 0, applicable: true },
      { id: 'w-4', roomId: 'room-living', roomName: 'Living & Dining Lounge', category: 'wall', itemCode: 'WL-PNT-01', title: 'Royal Luxury Emulsion Painting (3 Coats + 2 Putty)', description: 'Asian Paints Royale emulsion over acrylic putty and primer.', unit: 'sq.ft', quantity: livingMetrics.wallAreaSqFt, unitCostRateINR: 32, unitSellRateINR: 50, laborRateINR: 18, materialRateINR: 14, hardwareRateINR: 0, applicable: true },
      { id: 'w-5', roomId: 'room-living', roomName: 'Living & Dining Lounge', category: 'electrical', itemCode: 'EL-PT-01', title: 'Modular Light / 6A Socket Electrical Points', description: 'Concealed PVC conduit, Polycab FRLS wire, Legrand Arteor modular switches.', unit: 'point', quantity: 18, unitCostRateINR: 650, unitSellRateINR: 980, laborRateINR: 320, materialRateINR: 330, hardwareRateINR: 0, applicable: true },

      // Master Bedroom Works
      { id: 'w-6', roomId: 'room-master', roomName: 'Master Suite', category: 'flooring', itemCode: 'FL-WOOD-03', title: 'Engineered Wooden Flooring (AC4 Grade)', description: 'Click-lock HDF core floating wooden floor with PE moisture underlay.', unit: 'sq.ft', quantity: masterBedMetrics.floorAreaSqFt, unitCostRateINR: 195, unitSellRateINR: 290, laborRateINR: 35, materialRateINR: 160, hardwareRateINR: 0, applicable: true },
      { id: 'w-7', roomId: 'room-master', roomName: 'Master Suite', category: 'wall', itemCode: 'WL-TXT-02', title: 'Accent Wall Stucco / Metallic Texture', description: 'Specialized metallic marble finish with protective wax.', unit: 'sq.ft', quantity: 120, unitCostRateINR: 85, unitSellRateINR: 135, laborRateINR: 40, materialRateINR: 45, hardwareRateINR: 0, applicable: true },
      { id: 'w-8', roomId: 'room-master', roomName: 'Master Suite', category: 'wall', itemCode: 'WL-PNT-01', title: 'Royal Luxury Emulsion Painting (3 Coats)', description: 'Asian Paints Royale on balance walls.', unit: 'sq.ft', quantity: Math.max(0, masterBedMetrics.wallAreaSqFt - 120), unitCostRateINR: 32, unitSellRateINR: 50, laborRateINR: 18, materialRateINR: 14, hardwareRateINR: 0, applicable: true },
      { id: 'w-9', roomId: 'room-master', roomName: 'Master Suite', category: 'electrical', itemCode: 'EL-STR-02', title: 'Concealed Warm White LED Strip with Aluminium Profile', description: '240 LED/m high-CRI strip with slim recessed milky diffuser.', unit: 'running.ft', quantity: 36, unitCostRateINR: 140, unitSellRateINR: 220, laborRateINR: 45, materialRateINR: 95, hardwareRateINR: 0, applicable: true },
    ];

    return {
      id: `proj-${Date.now()}`,
      leadId: lead.id,
      projectName: `${lead.name}'s ${lead.propertyType || 'Interior Project'}`,
      floorLevel: 'First Floor',
      totalCarpetAreaSqFt: livingMetrics.floorAreaSqFt + masterBedMetrics.floorAreaSqFt + kitchenMetrics.floorAreaSqFt,
      rooms,
      objects3D,
      workItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const computeRoomMetrics = InteriorProjectsStore.computeRoomMetrics.bind(InteriorProjectsStore);
export const calculateQuotationFromProject = InteriorProjectsStore.calculateQuotationFromProject.bind(InteriorProjectsStore);
export const generateBOQ = InteriorProjectsStore.generateBOQ.bind(InteriorProjectsStore);

