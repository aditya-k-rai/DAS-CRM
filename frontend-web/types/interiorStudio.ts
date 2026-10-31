/**
 * interiorStudio.ts
 * Type definitions for the Interior Cost Calculator & 2D/3D Design Studio
 */

export type MeasurementUnit = 'ft' | 'in' | 'm' | 'mm';

export type RoomType =
  | 'Living Room'
  | 'Master Bedroom'
  | 'Bedroom'
  | 'Dining Room'
  | 'Kitchen'
  | 'Bathroom'
  | 'Home Office'
  | 'Balcony'
  | 'Pooja Room'
  | 'Corridor';

export type FloorLevel =
  | 'Basement'
  | 'Ground Floor'
  | 'First Floor'
  | 'Second Floor'
  | 'Third Floor'
  | 'Terrace'
  | 'Penthouse';

export interface RoomOpening {
  id: string;
  type: 'door' | 'window' | 'arch';
  wall: 'north' | 'south' | 'east' | 'west';
  width: number; // in current units
  height: number;
  sillHeight?: number;
  offsetPct?: number; // 0-100% position along wall
}

export interface SubElementCustomization {
  id: string;
  name: string;
  color: string;
  material?: string;
  texture?: string;
}

export interface RoomDefinition {
  id: string;
  name: string;
  type: RoomType;
  length: number; // in current units
  width: number;
  height: number;
  unit: MeasurementUnit;
  floorAreaSqFt: number;
  wallAreaSqFt: number;
  ceilingAreaSqFt: number;
  perimeterFt: number;
  openings: RoomOpening[];
  floorMaterial: string;
  wallFinish: string;
  ceilingFinish: string;
}

export interface StudioObject3D {
  id: string;
  roomId: string;
  name: string;
  category: 'seating' | 'tables' | 'beds' | 'storage' | 'lighting' | 'decor' | 'kitchen' | 'fixtures';
  thumbnailUrl: string;
  dimensions: {
    width: number;  // in inches / local scale
    height: number;
    depth: number;
  };
  position: {
    x: number; // 3D coordinates in meters
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number; // in degrees
    z: number;
  };
  color: string;
  material: string;
  textureUrl?: string;
  priceINR: number;
  brand?: string;
  vendor?: string;
  smartCollision?: boolean;
  locked?: boolean;
  modelUrl?: string;
  subElements?: SubElementCustomization[];
}

export type WorkCategoryKey =
  | 'civil'
  | 'flooring'
  | 'ceiling'
  | 'wall'
  | 'furniture'
  | 'electrical'
  | 'hardware'
  | 'installation';

export interface WorkItem {
  id: string;
  roomId: string;
  roomName: string;
  category: WorkCategoryKey;
  itemCode: string;
  title: string;
  description: string;
  unit: 'sq.ft' | 'running.ft' | 'per.unit' | 'lumpsum' | 'point';
  quantity: number;
  unitCostRateINR: number; // Internal cost
  unitSellRateINR: number; // Customer price
  laborRateINR: number;
  materialRateINR: number;
  hardwareRateINR: number;
  applicable: boolean;
}

export interface BOQItem {
  id: string;
  roomName: string;
  category: string;
  itemName: string;
  specification: string;
  quantity: number;
  unit: string;
  materialCostRate: number;
  laborCostRate: number;
  sellingRate: number;
  totalCostAmount: number;
  totalSellingAmount: number;
  vendorName?: string;
}

export interface InteriorLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  status: string;
  budgetINR?: number;
  propertyType?: '2BHK Apartment' | '3BHK Apartment' | '4BHK Villa' | 'Penthouse' | 'Commercial Office';
  createdDate: string;
}

export interface InteriorProject {
  id: string;
  leadId: string;
  projectName: string;
  floorLevel: FloorLevel;
  totalCarpetAreaSqFt: number;
  rooms: RoomDefinition[];
  objects3D: StudioObject3D[];
  workItems: WorkItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationMilestone {
  stage: string;
  percentage: number;
  amountINR: number;
}

export interface InteriorQuotation {
  id: string;
  quoteNumber: string; // e.g. INT-2026-0042
  revision: number;
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  projectName: string;
  floorLevel: FloorLevel;
  roomsSummary: {
    roomCount: number;
    totalAreaSqFt: number;
  };
  boqItems: BOQItem[];
  // Cost breakdown
  totalMaterialCost: number;
  totalLaborCost: number;
  totalHardwareCost: number;
  wastageAmount: number;
  transportAmount: number;
  siteSupervisionAmount: number;
  internalNetCost: number; // Confidential
  // Selling breakdown
  subtotalSelling: number;
  overheadAmount: number;
  profitMarginAmount: number;
  discountPercentage: number;
  discountAmount: number;
  gstPercentage: number; // e.g. 18%
  gstAmount: number;
  grandTotalINR: number;
  profitAmount: number;
  profitMarginPercent: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REVISED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  validUntil: string;
  paymentMilestones: QuotationMilestone[];
  termsAndConditions: string[];
}

export interface LeadActivityLog {
  id: string;
  leadId: string;
  timestamp: string;
  actor: string;
  action: 'LEAD_SELECTED' | 'ROOM_CONFIGURED' | 'DESIGN_SAVED' | 'RENDER_GENERATED' | 'QUOTE_CREATED' | 'QUOTE_REVISED' | 'QUOTE_SENT' | 'QUOTE_APPROVED';
  details: string;
  quoteNumber?: string;
}

// ── Admin Master Types ───────────────────────────────────────────
export interface WorkRateMasterItem {
  id: string;
  category: WorkCategoryKey;
  itemCode: string;
  name: string;
  description: string;
  unit: string;
  baseCostINR: number;
  sellingRateINR: number;
  laborRateINR: number;
  materialRateINR: number;
  isActive: boolean;
  effectiveFrom: string;
}

export interface MaterialMasterItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  thicknessMm?: number;
  unit: string;
  purchasePriceINR: number;
  sellingRateINR: number;
  supplierName: string;
  wastagePct: number;
  minOrderQty: number;
  specifications: string;
  isActive: boolean;
}

export interface HardwareMasterItem {
  id: string;
  name: string;
  category: 'hinges' | 'channels' | 'handles' | 'accessories' | 'screws' | 'baskets';
  brand: string;
  model: string;
  dimensions: string;
  unitPriceINR: number;
  sellingPriceINR: number;
  supplierName: string;
  applicableTo: string;
  isActive: boolean;
}

export interface LaborRateMasterItem {
  id: string;
  trade: 'Carpenter' | 'Electrician' | 'Plumber' | 'Painter' | 'Mason' | 'Tile Setter' | 'Supervisor';
  rateType: 'daily' | 'hourly' | 'per_sqft' | 'per_rft' | 'per_point';
  rateINR: number;
  skillLevel: 'Master Craftsman' | 'Skilled' | 'Semi-Skilled' | 'Helper';
  location: string;
  isActive: boolean;
}

export interface PricingSettingsMaster {
  defaultWastagePct: number;
  edgeBandingPerRftINR: number;
  transportLumpSumINR: number;
  companyOverheadPct: number;
  defaultProfitMarginPct: number;
  gstPct: number;
  defaultMeasurementUnit: MeasurementUnit;
}

export interface RateAuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  module: 'WorkRate' | 'Material' | 'Hardware' | 'Labor' | 'PricingSettings';
  targetItem: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
}

