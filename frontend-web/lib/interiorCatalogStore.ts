/**
 * interiorCatalogStore.ts
 * Master Catalog, Labor, Material & Hardware Rates Management Store.
 *
 * Provides complete Admin CRUD, Audit Trail, Snapshot Isolation,
 * and Live Synchronization with the 2D/3D Design Studio & Quotation Engine.
 */

import {
  WorkRateMasterItem,
  MaterialMasterItem,
  HardwareMasterItem,
  LaborRateMasterItem,
  PricingSettingsMaster,
  RateAuditLog,
} from '@/types/interiorStudio';

const STORAGE_KEY_CATALOG = '@das_crm_interior_catalog_v2';
const STORAGE_KEY_AUDIT = '@das_crm_interior_audit_v2';

// ── Default Work Category Rates ────────────────────────────────────
export const DEFAULT_WORK_RATES: WorkRateMasterItem[] = [
  // Civil
  { id: 'wr-civ-01', category: 'civil', itemCode: 'CIV-DEM-01', name: 'Internal Wall Demolition & Debris Disposal', description: 'Safe removal of 4.5" to 9" non-structural brick/AAC partition and carting away.', unit: 'sq.ft', baseCostINR: 28, sellingRateINR: 42, laborRateINR: 22, materialRateINR: 6, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-civ-02', category: 'civil', itemCode: 'CIV-PART-02', name: 'Gypsum / Drywall Partition (Double Layer)', description: 'GI frame with Saint-Gobain gypsum boards, acoustic glasswool filling & skim coat.', unit: 'sq.ft', baseCostINR: 110, sellingRateINR: 165, laborRateINR: 45, materialRateINR: 65, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-civ-03', category: 'civil', itemCode: 'CIV-PLAS-03', name: 'Cement Sand Plaster with Fiber Mesh', description: '12mm-15mm smooth sponge finish wall plaster over brickwork.', unit: 'sq.ft', baseCostINR: 35, sellingRateINR: 52, laborRateINR: 24, materialRateINR: 11, isActive: true, effectiveFrom: '2026-01-01' },

  // Flooring
  { id: 'wr-fl-01', category: 'flooring', itemCode: 'FL-VIT-01', name: 'Vitrified Tile Installation (4ft x 2ft)', description: 'Premium GVT/PGVT vitrified tiles laid over adhesive screed with 2mm epoxy spacer joints.', unit: 'sq.ft', baseCostINR: 125, sellingRateINR: 185, laborRateINR: 45, materialRateINR: 80, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-fl-02', category: 'flooring', itemCode: 'FL-MARB-02', name: 'Italian Marble Laying, Mirror Polish & Crystallization', description: 'Imported Botticino / Dyna marble laying, tin oxide diamond pad buffing & sealant coat.', unit: 'sq.ft', baseCostINR: 420, sellingRateINR: 650, laborRateINR: 140, materialRateINR: 280, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-fl-03', category: 'flooring', itemCode: 'FL-WOOD-03', name: 'Engineered Wooden Flooring (AC4 Grade)', description: 'Click-lock HDF core floating wooden floor with 3mm PE moisture underlay.', unit: 'sq.ft', baseCostINR: 195, sellingRateINR: 290, laborRateINR: 35, materialRateINR: 160, isActive: true, effectiveFrom: '2026-01-01' },

  // False Ceiling
  { id: 'wr-cl-01', category: 'ceiling', itemCode: 'CL-GYP-01', name: 'Gypsum Board False Ceiling with Perimeter Channel', description: 'Saint-Gobain Gypboard 12.5mm on GI perimeter channels with joint tape & paper finish.', unit: 'sq.ft', baseCostINR: 85, sellingRateINR: 130, laborRateINR: 38, materialRateINR: 47, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-cl-02', category: 'ceiling', itemCode: 'CL-COVE-02', name: 'Indirect Concealed LED Light Cove Step', description: 'Stepped gypsum profile designed to house LED tape strips without glare.', unit: 'running.ft', baseCostINR: 120, sellingRateINR: 180, laborRateINR: 50, materialRateINR: 70, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-cl-03', category: 'ceiling', itemCode: 'CL-GRID-03', name: 'Acoustic Grid Ceiling Tiles (2x2 ft)', description: 'Mineral fiber acoustic ceiling tiles with exposed T-grid powder-coated framework.', unit: 'sq.ft', baseCostINR: 95, sellingRateINR: 145, laborRateINR: 30, materialRateINR: 65, isActive: true, effectiveFrom: '2026-01-01' },

  // Wall Treatment
  { id: 'wr-wl-01', category: 'wall', itemCode: 'WL-PNT-01', name: 'Royal Luxury Emulsion Painting (3 Coats + 2 Putty)', description: 'Asian Paints Royale emulsion over acrylic putty, primer and fine sanding finish.', unit: 'sq.ft', baseCostINR: 32, sellingRateINR: 50, laborRateINR: 18, materialRateINR: 14, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-wl-02', category: 'wall', itemCode: 'WL-TXT-02', name: 'Accent Wall Stucco / Metallic Texture', description: 'Specialized metallic marble finish or concrete texture with protective polyurethane wax.', unit: 'sq.ft', baseCostINR: 85, sellingRateINR: 135, laborRateINR: 40, materialRateINR: 45, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-wl-03', category: 'wall', itemCode: 'WL-FLUT-03', name: 'Charcoal / WPC Fluted Louver Panel Cladding', description: 'Pre-finished waterproof wooden/charcoal vertical fluted louvers glued & nailed to wall.', unit: 'sq.ft', baseCostINR: 210, sellingRateINR: 320, laborRateINR: 40, materialRateINR: 170, isActive: true, effectiveFrom: '2026-01-01' },

  // Furniture & Joinery
  { id: 'wr-fn-01', category: 'furniture', itemCode: 'FN-WARD-01', name: 'Sliding Wardrobe with Full-Height Loft (Marine Ply)', description: '18mm BWP marine ply carcase, 1mm Merino laminate inside & out, Hettich TopLine sliding track.', unit: 'sq.ft', baseCostINR: 1450, sellingRateINR: 2150, laborRateINR: 450, materialRateINR: 1000, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-fn-02', category: 'furniture', itemCode: 'FN-TV-02', name: 'Floating TV Console with Backlit Stone Panel', description: 'PU-lacquered lower drawers, cable management trunking and acoustic fluted back wall.', unit: 'running.ft', baseCostINR: 1600, sellingRateINR: 2400, laborRateINR: 500, materialRateINR: 1100, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-fn-03', category: 'furniture', itemCode: 'FN-BED-03', name: 'King Size Hydraulic Storage Bed with Upholstered Headboard', description: 'Engineered hardwood internal frame, German gas lift struts, and velvet/leatherette tufting.', unit: 'per.unit', baseCostINR: 28000, sellingRateINR: 42000, laborRateINR: 8500, materialRateINR: 19500, isActive: true, effectiveFrom: '2026-01-01' },

  // Electrical
  { id: 'wr-el-01', category: 'electrical', itemCode: 'EL-PT-01', name: 'Modular Light / 6A Socket Electrical Point', description: 'Concealed PVC conduit, Polycab FRLS wire, Legrand Arteor / Schneider modular switches.', unit: 'point', baseCostINR: 650, sellingRateINR: 980, laborRateINR: 320, materialRateINR: 330, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-el-02', category: 'electrical', itemCode: 'EL-STR-02', name: 'Concealed Warm White LED Strip with Aluminium Heat-Sink Channel', description: '240 LED/meter high-CRI strip with slim recessed milky diffuser and MeanWell driver.', unit: 'running.ft', baseCostINR: 140, sellingRateINR: 220, laborRateINR: 45, materialRateINR: 95, isActive: true, effectiveFrom: '2026-01-01' },
  { id: 'wr-el-03', category: 'electrical', itemCode: 'EL-MAG-03', name: 'Low-Voltage Magnetic Track Light System', description: 'Slim ceiling recessed 48V magnetic rail with movable spotlights and flood lights.', unit: 'running.ft', baseCostINR: 850, sellingRateINR: 1350, laborRateINR: 200, materialRateINR: 650, isActive: true, effectiveFrom: '2026-01-01' },
];

// ── Default Material Master ────────────────────────────────────────
export const DEFAULT_MATERIALS: MaterialMasterItem[] = [
  { id: 'mat-01', name: 'Marine Grade BWP Plywood 18mm', category: 'Plywood', brand: 'CenturyPly', model: 'Architect Marine', thicknessMm: 18, unit: 'sq.ft', purchasePriceINR: 115, sellingRateINR: 145, supplierName: 'Shree Balaji Timber & Plywood', wastagePct: 10, minOrderQty: 100, specifications: '710 BWP Certified, 100% boiling waterproof, calibrated thickness', isActive: true },
  { id: 'mat-02', name: 'Commercial MR Plywood 12mm', category: 'Plywood', brand: 'Greenply', model: 'Ecotec MR', thicknessMm: 12, unit: 'sq.ft', purchasePriceINR: 68, sellingRateINR: 88, supplierName: 'Shree Balaji Timber & Plywood', wastagePct: 8, minOrderQty: 50, specifications: 'Moisture resistant, borer and termite proof for internal paneling', isActive: true },
  { id: 'mat-03', name: 'High-Gloss Acrylic Sheet 1.5mm', category: 'Laminate', brand: 'Merino', model: 'Gloss-Line Pure White', thicknessMm: 1.5, unit: 'sq.ft', purchasePriceINR: 140, sellingRateINR: 190, supplierName: 'Laminate Hub Mumbai', wastagePct: 12, minOrderQty: 64, specifications: 'Scratch-resistant mirror acrylic for modern kitchen and wardrobe shutters', isActive: true },
  { id: 'mat-04', name: 'Matte Suede 1mm Designer Laminate', category: 'Laminate', brand: 'CenturyLaminates', model: 'Oak Natural Woodgrain', thicknessMm: 1.0, unit: 'sq.ft', purchasePriceINR: 62, sellingRateINR: 85, supplierName: 'Laminate Hub Mumbai', wastagePct: 10, minOrderQty: 64, specifications: 'Anti-fingerprint texture with realistic European wood reproduction', isActive: true },
  { id: 'mat-05', name: 'Italian Botticino Marble Slabs', category: 'Stone', brand: 'Classic Marble Co.', model: 'Crema Extra', thicknessMm: 18, unit: 'sq.ft', purchasePriceINR: 240, sellingRateINR: 360, supplierName: 'CMC Marble Depot', wastagePct: 15, minOrderQty: 250, specifications: 'Natural Italian imported marble with fine beige calcite veining', isActive: true },
  { id: 'mat-06', name: 'Glazed Vitrified Floor Tile 4x2 ft', category: 'Tiles', brand: 'Kajaria', model: 'Eternity Statuario Gold', thicknessMm: 9, unit: 'sq.ft', purchasePriceINR: 58, sellingRateINR: 82, supplierName: 'Kajaria Prime Showroom', wastagePct: 8, minOrderQty: 200, specifications: 'Polished Nano finish, stain proof, high break strength', isActive: true },
  { id: 'mat-07', name: 'Royale Luxury Interior Emulsion', category: 'Paints', brand: 'Asian Paints', model: 'Royale Luxury Silk', unit: 'sq.ft', purchasePriceINR: 9, sellingRateINR: 15, supplierName: 'Apex Paint Traders', wastagePct: 5, minOrderQty: 500, specifications: 'Teflon surface protector, anti-bacterial, soft sheen washability', isActive: true },
  { id: 'mat-08', name: 'Gypsum Board 12.5mm Plasterboard', category: 'Ceiling', brand: 'Saint-Gobain Gyproc', model: 'Standard Plasterboard', thicknessMm: 12.5, unit: 'sq.ft', purchasePriceINR: 26, sellingRateINR: 36, supplierName: 'Gyproc Building Solutions', wastagePct: 7, minOrderQty: 200, specifications: 'Non-combustible gypsum core with paper face, sagging resistant', isActive: true },
];

// ── Default Hardware & Accessories Master ──────────────────────────
export const DEFAULT_HARDWARE: HardwareMasterItem[] = [
  { id: 'hw-01', name: 'Soft-Close Concealed Clip-On Hinge 110°', category: 'hinges', brand: 'Hettich', model: 'Sensys 8645i', dimensions: 'Cup 35mm, Overlay 16mm', unitPriceINR: 180, sellingPriceINR: 260, supplierName: 'Hettich India Authorized', applicableTo: 'Kitchen & Wardrobe Cabinets', isActive: true },
  { id: 'hw-02', name: 'Double-Wall Soft-Close Drawer Runner (Tandem)', category: 'channels', brand: 'Hafele', model: 'Matrix Box S35 500mm', dimensions: 'Length 500mm, Load 35kg', unitPriceINR: 1850, sellingPriceINR: 2600, supplierName: 'Hafele Architectural Depot', applicableTo: 'Modular Kitchen Drawers', isActive: true },
  { id: 'hw-03', name: 'Heavy Duty Sliding Wardrobe Track System', category: 'channels', brand: 'Hettich', model: 'TopLine L 2-Door', dimensions: 'Max door weight 50kg, track 2.5m', unitPriceINR: 6200, sellingPriceINR: 8800, supplierName: 'Hettich India Authorized', applicableTo: 'Sliding Bedroom Wardrobes', isActive: true },
  { id: 'hw-04', name: 'Sleek G-Profile Edge Handle (Black Anodized)', category: 'handles', brand: 'Kesseböhmer', model: 'Slim Line G-3000', dimensions: '3000mm length bar', unitPriceINR: 650, sellingPriceINR: 980, supplierName: 'Hardware Studio Andheri', applicableTo: 'Seamless Handleless Shutters', isActive: true },
  { id: 'hw-05', name: 'Brushed Brass Knurled Designer Knob', category: 'handles', brand: 'Ozone', model: 'Knurl Solid Brass 32mm', dimensions: 'Dia 32mm, Projection 28mm', unitPriceINR: 280, sellingPriceINR: 420, supplierName: 'Ozone Architectural Hardware', applicableTo: 'Living Room Vanity & Consoles', isActive: true },
  { id: 'hw-06', name: 'SS304 Wire Cutlery Basket with Soft Slides', category: 'baskets', brand: 'Ebco', model: 'ProLine Cutlery 600mm', dimensions: '600mm x 500mm x 100mm', unitPriceINR: 2400, sellingPriceINR: 3400, supplierName: 'Ebco Central Warehouse', applicableTo: 'Modular Kitchen Base Unit', isActive: true },
];

// ── Default Labor Rates Master ─────────────────────────────────────
export const DEFAULT_LABOR_RATES: LaborRateMasterItem[] = [
  { id: 'lr-01', trade: 'Carpenter', rateType: 'daily', rateINR: 1200, skillLevel: 'Master Craftsman', location: 'Metro / Mumbai / Delhi', isActive: true },
  { id: 'lr-02', trade: 'Carpenter', rateType: 'per_sqft', rateINR: 220, skillLevel: 'Skilled', location: 'Metro / Mumbai / Delhi', isActive: true },
  { id: 'lr-03', trade: 'Electrician', rateType: 'daily', rateINR: 950, skillLevel: 'Skilled', location: 'Metro / Mumbai / Delhi', isActive: true },
  { id: 'lr-04', trade: 'Electrician', rateType: 'per_point', rateINR: 320, skillLevel: 'Skilled', location: 'Metro / Mumbai / Delhi', isActive: true },
  { id: 'lr-05', trade: 'Painter', rateType: 'daily', rateINR: 850, skillLevel: 'Skilled', location: 'Metro / Mumbai / Delhi', isActive: true },
  { id: 'lr-06', trade: 'Painter', rateType: 'per_sqft', rateINR: 18, skillLevel: 'Skilled', location: 'Metro / Mumbai / Delhi', isActive: true },
  { id: 'lr-07', trade: 'Mason', rateType: 'daily', rateINR: 1100, skillLevel: 'Master Craftsman', location: 'Metro / Mumbai / Delhi', isActive: true },
  { id: 'lr-08', trade: 'Tile Setter', rateType: 'per_sqft', rateINR: 45, skillLevel: 'Skilled', location: 'Metro / Mumbai / Delhi', isActive: true },
  { id: 'lr-09', trade: 'Supervisor', rateType: 'daily', rateINR: 1600, skillLevel: 'Master Craftsman', location: 'Metro / Mumbai / Delhi', isActive: true },
];

// ── Default Pricing & Calculation Settings ─────────────────────────
export const DEFAULT_PRICING_SETTINGS: PricingSettingsMaster = {
  defaultWastagePct: 7,          // 7% material wastage allowance
  edgeBandingPerRftINR: 22,      // PVC 2mm edge banding per running ft
  transportLumpSumINR: 14500,    // Transportation, freight & site lifting
  companyOverheadPct: 8,         // 8% company overheads & project management
  defaultProfitMarginPct: 22,    // 22% target gross margin
  gstPct: 18,                    // 18% standard interior work GST
  defaultMeasurementUnit: 'ft',  // Feet & inches standard in India
};

export class InteriorCatalogStore {
  private static workRates: WorkRateMasterItem[] = [...DEFAULT_WORK_RATES];
  private static materials: MaterialMasterItem[] = [...DEFAULT_MATERIALS];
  private static hardware: HardwareMasterItem[] = [...DEFAULT_HARDWARE];
  private static laborRates: LaborRateMasterItem[] = [...DEFAULT_LABOR_RATES];
  private static settings: PricingSettingsMaster = { ...DEFAULT_PRICING_SETTINGS };
  private static auditLogs: RateAuditLog[] = [];
  private static initialized = false;

  private static init() {
    if (this.initialized || typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CATALOG);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.workRates?.length) this.workRates = parsed.workRates;
        if (parsed.materials?.length) this.materials = parsed.materials;
        if (parsed.hardware?.length) this.hardware = parsed.hardware;
        if (parsed.laborRates?.length) this.laborRates = parsed.laborRates;
        if (parsed.settings) this.settings = { ...DEFAULT_PRICING_SETTINGS, ...parsed.settings };
      }
      const storedLogs = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (storedLogs) {
        this.auditLogs = JSON.parse(storedLogs);
      }
    } catch (_) {}
    this.initialized = true;
  }

  private static persist() {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        workRates: this.workRates,
        materials: this.materials,
        hardware: this.hardware,
        laborRates: this.laborRates,
        settings: this.settings,
      };
      localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
      window.dispatchEvent(new CustomEvent('das_crm_interior_catalog_updated'));
    } catch (_) {}
  }

  private static logAudit(adminName: string, module: RateAuditLog['module'], targetItem: string, field: string, oldVal: any, newVal: any) {
    const entry: RateAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      adminName: adminName || 'Admin',
      module,
      targetItem,
      fieldChanged: field,
      oldValue: String(oldVal),
      newValue: String(newVal),
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    this.persist();
  }

  // ── Work Rates Accessors ─────────────────────────────────────────
  static getWorkRates(): WorkRateMasterItem[] {
    this.init();
    return [...this.workRates];
  }

  static updateWorkRate(id: string, updates: Partial<WorkRateMasterItem>, adminName: string) {
    this.init();
    const idx = this.workRates.findIndex(w => w.id === id);
    if (idx !== -1) {
      const old = this.workRates[idx];
      Object.entries(updates).forEach(([key, val]) => {
        if ((old as any)[key] !== val) {
          this.logAudit(adminName, 'WorkRate', old.name, key, (old as any)[key], val);
        }
      });
      this.workRates[idx] = { ...old, ...updates };
      this.persist();
    }
  }

  static addWorkRate(item: Omit<WorkRateMasterItem, 'id'>, adminName: string): WorkRateMasterItem {
    this.init();
    const newItem: WorkRateMasterItem = {
      ...item,
      id: `wr-custom-${Date.now()}`,
    };
    this.workRates.push(newItem);
    this.logAudit(adminName, 'WorkRate', newItem.name, 'CREATED', 'None', `${newItem.name} (₹${newItem.sellingRateINR}/${newItem.unit})`);
    this.persist();
    return newItem;
  }

  static deleteWorkRate(id: string, adminName: string) {
    this.init();
    const item = this.workRates.find(w => w.id === id);
    if (item) {
      this.logAudit(adminName, 'WorkRate', item.name, 'DELETED', item.name, 'Removed');
      this.workRates = this.workRates.filter(w => w.id !== id);
      this.persist();
    }
  }

  // ── Materials Accessors ──────────────────────────────────────────
  static getMaterials(): MaterialMasterItem[] {
    this.init();
    return [...this.materials];
  }

  static updateMaterial(id: string, updates: Partial<MaterialMasterItem>, adminName: string) {
    this.init();
    const idx = this.materials.findIndex(m => m.id === id);
    if (idx !== -1) {
      const old = this.materials[idx];
      Object.entries(updates).forEach(([key, val]) => {
        if ((old as any)[key] !== val) {
          this.logAudit(adminName, 'Material', old.name, key, (old as any)[key], val);
        }
      });
      this.materials[idx] = { ...old, ...updates };
      this.persist();
    }
  }

  static addMaterial(item: Omit<MaterialMasterItem, 'id'>, adminName: string): MaterialMasterItem {
    this.init();
    const newItem: MaterialMasterItem = {
      ...item,
      id: `mat-custom-${Date.now()}`,
    };
    this.materials.push(newItem);
    this.logAudit(adminName, 'Material', newItem.name, 'CREATED', 'None', `${newItem.name} (₹${newItem.sellingRateINR})`);
    this.persist();
    return newItem;
  }

  static deleteMaterial(id: string, adminName: string) {
    this.init();
    const item = this.materials.find(m => m.id === id);
    if (item) {
      this.logAudit(adminName, 'Material', item.name, 'DELETED', item.name, 'Removed');
      this.materials = this.materials.filter(m => m.id !== id);
      this.persist();
    }
  }

  // ── Hardware Accessors ───────────────────────────────────────────
  static getHardware(): HardwareMasterItem[] {
    this.init();
    return [...this.hardware];
  }

  static updateHardware(id: string, updates: Partial<HardwareMasterItem>, adminName: string) {
    this.init();
    const idx = this.hardware.findIndex(h => h.id === id);
    if (idx !== -1) {
      const old = this.hardware[idx];
      Object.entries(updates).forEach(([key, val]) => {
        if ((old as any)[key] !== val) {
          this.logAudit(adminName, 'Hardware', old.name, key, (old as any)[key], val);
        }
      });
      this.hardware[idx] = { ...old, ...updates };
      this.persist();
    }
  }

  static addHardware(item: Omit<HardwareMasterItem, 'id'>, adminName: string): HardwareMasterItem {
    this.init();
    const newItem: HardwareMasterItem = {
      ...item,
      id: `hw-custom-${Date.now()}`,
    };
    this.hardware.push(newItem);
    this.logAudit(adminName, 'Hardware', newItem.name, 'CREATED', 'None', `${newItem.name} (₹${newItem.sellingPriceINR})`);
    this.persist();
    return newItem;
  }

  static deleteHardware(id: string, adminName: string) {
    this.init();
    const item = this.hardware.find(h => h.id === id);
    if (item) {
      this.logAudit(adminName, 'Hardware', item.name, 'DELETED', item.name, 'Removed');
      this.hardware = this.hardware.filter(h => h.id !== id);
      this.persist();
    }
  }

  // ── Labor Rates Accessors ────────────────────────────────────────
  static getLaborRates(): LaborRateMasterItem[] {
    this.init();
    return [...this.laborRates];
  }

  static updateLaborRate(id: string, updates: Partial<LaborRateMasterItem>, adminName: string) {
    this.init();
    const idx = this.laborRates.findIndex(l => l.id === id);
    if (idx !== -1) {
      const old = this.laborRates[idx];
      Object.entries(updates).forEach(([key, val]) => {
        if ((old as any)[key] !== val) {
          this.logAudit(adminName, 'Labor', `${old.trade} (${old.skillLevel})`, key, (old as any)[key], val);
        }
      });
      this.laborRates[idx] = { ...old, ...updates };
      this.persist();
    }
  }

  static addLaborRate(item: Omit<LaborRateMasterItem, 'id'>, adminName: string): LaborRateMasterItem {
    this.init();
    const newItem: LaborRateMasterItem = {
      ...item,
      id: `lr-custom-${Date.now()}`,
    };
    this.laborRates.push(newItem);
    this.logAudit(adminName, 'Labor', `${newItem.trade} (${newItem.skillLevel})`, 'CREATED', 'None', `₹${newItem.rateINR}/${newItem.rateType}`);
    this.persist();
    return newItem;
  }

  static deleteLaborRate(id: string, adminName: string) {
    this.init();
    const item = this.laborRates.find(l => l.id === id);
    if (item) {
      this.logAudit(adminName, 'Labor', `${item.trade} (${item.skillLevel})`, 'DELETED', item.trade, 'Removed');
      this.laborRates = this.laborRates.filter(l => l.id !== id);
      this.persist();
    }
  }

  // ── Pricing Settings ─────────────────────────────────────────────
  static getSettings(): PricingSettingsMaster {
    this.init();
    return { ...this.settings };
  }

  static updateSettings(updates: Partial<PricingSettingsMaster>, adminName: string) {
    this.init();
    const old = this.settings;
    Object.entries(updates).forEach(([key, val]) => {
      if ((old as any)[key] !== val) {
        this.logAudit(adminName, 'PricingSettings', 'Global Pricing Rule', key, (old as any)[key], val);
      }
    });
    this.settings = { ...this.settings, ...updates };
    this.persist();
  }

  // ── Audit Logs ───────────────────────────────────────────────────
  static getAuditLogs(): RateAuditLog[] {
    this.init();
    return [...this.auditLogs];
  }

  static clearAuditLogs(adminName: string) {
    this.init();
    this.auditLogs = [];
    this.logAudit(adminName, 'PricingSettings', 'Audit History', 'CLEARED', 'Logs', 'Empty');
    this.persist();
  }

  // ── Reset to Defaults ────────────────────────────────────────────
  static resetToDefaults(adminName: string) {
    this.workRates = [...DEFAULT_WORK_RATES];
    this.materials = [...DEFAULT_MATERIALS];
    this.hardware = [...DEFAULT_HARDWARE];
    this.laborRates = [...DEFAULT_LABOR_RATES];
    this.settings = { ...DEFAULT_PRICING_SETTINGS };
    this.logAudit(adminName, 'PricingSettings', 'All Master Catalogs', 'RESET', 'Custom Values', 'Factory Default Rates');
    this.persist();
  }

  // ── Rate Snapshot Freezing ───────────────────────────────────────
  /**
   * Generates a frozen snapshot of all current rates at quotation creation time.
   * Ensures previously saved quotations retain original pricing even when admin updates master rates later.
   */
  static getFrozenRateSnapshot() {
    this.init();
    return {
      capturedAt: new Date().toISOString(),
      workRates: JSON.parse(JSON.stringify(this.workRates)),
      materials: JSON.parse(JSON.stringify(this.materials)),
      hardware: JSON.parse(JSON.stringify(this.hardware)),
      laborRates: JSON.parse(JSON.stringify(this.laborRates)),
      settings: JSON.parse(JSON.stringify(this.settings)),
    };
  }
}

