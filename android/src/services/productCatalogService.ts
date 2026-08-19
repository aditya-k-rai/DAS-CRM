/**
 * productCatalogService.ts — DAS CRM Android
 * Product & Services Catalog Service with Category & Sub-Category Hierarchy.
 * Manages category/sub-category trees, product creation, stock inventory counts,
 * MOQ validation, tax rates, and AsyncStorage persistent storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CategoryTree {
  id: string;
  name: string;
  subCategories: string[];
}

export interface CatalogProductItem {
  id: string;
  name: string;
  sku: string;
  category: string; // e.g. "CRM & Sales Software"
  subCategory: string; // e.g. "Lead Management"
  minPrice: number;
  maxPrice: number;
  currency: '₹' | '$';
  stockQuantity: number;
  moq: number;
  taxRate: number; // e.g. 18 for 18% GST
  description: string;
  features: string[];
  imageUrl: string;
  status: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DRAFT';
  createdAt: string;
}

const STORAGE_PRODUCTS_KEY = 'das_crm_products_catalog_v3';
const STORAGE_CATS_KEY = 'das_crm_categories_tree_v1';

export const DEFAULT_CATEGORY_TREE: CategoryTree[] = [
  {
    id: 'cat-1',
    name: 'CRM & Sales Software',
    subCategories: ['Lead Management', 'Sales Funnel & Kanban', 'WhatsApp & Email Automation'],
  },
  {
    id: 'cat-2',
    name: 'AI & Intelligence',
    subCategories: ['AI Lead Scoring', 'Voice Call Telemetry Bot', 'Predictive Deal Analytics'],
  },
  {
    id: 'cat-3',
    name: 'Cloud & Communications',
    subCategories: ['Meta WhatsApp Cloud API', 'Cloud Telemetry Node', 'SMS & Call Gateway'],
  },
  {
    id: 'cat-4',
    name: 'Professional Services',
    subCategories: ['Custom Integration & Setup', 'SLA Support & Maintenance', 'Training & Onboarding'],
  },
  {
    id: 'cat-5',
    name: 'Hardware & Infrastructure',
    subCategories: ['SIP Telemetry Phone', 'Biometric Punch Terminal', 'Cloud Server Appliance'],
  },
];

export const INITIAL_PRODUCTS: CatalogProductItem[] = [
  {
    id: 'prod-101',
    name: 'DAS CRM Enterprise Suite',
    sku: 'DAS-CRM-001',
    category: 'CRM & Sales Software',
    subCategory: 'Lead Management',
    minPrice: 2999,
    maxPrice: 4999,
    currency: '₹',
    stockQuantity: 250,
    moq: 1,
    taxRate: 18,
    description: 'Full sales automation, WhatsApp Cloud API, Email Marketing & AI Lead Scoring.',
    features: ['Unlimited Lead Ingestion', 'WhatsApp Cloud API (100K Quota)', 'Advanced AI Scoring', '24/7 SLA Support'],
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    createdAt: '2026-08-15',
  },
  {
    id: 'prod-102',
    name: 'AI Lead Scoring Engine Pro',
    sku: 'DAS-AI-102',
    category: 'AI & Intelligence',
    subCategory: 'AI Lead Scoring',
    minPrice: 1499,
    maxPrice: 2499,
    currency: '₹',
    stockQuantity: 85,
    moq: 5,
    taxRate: 18,
    description: 'Predictive deal closure scoring, automatic follow-up reminders & intent analysis.',
    features: ['Real-time Lead Heatmaps', 'Smart Re-engagement Signals', 'Automated Multi-Channel Nudges'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    createdAt: '2026-08-16',
  },
  {
    id: 'prod-103',
    name: 'WhatsApp Cloud API Bot Engine',
    sku: 'DAS-WA-203',
    category: 'Cloud & Communications',
    subCategory: 'Meta WhatsApp Cloud API',
    minPrice: 1199,
    maxPrice: 1999,
    currency: '₹',
    stockQuantity: 8,
    moq: 2,
    taxRate: 18,
    description: 'Direct Meta WhatsApp Cloud API integration with verified green badge & bulk templates.',
    features: ['100,000 Messages / month', 'Interactive Buttons', 'Auto-responder Bot', 'Analytics Dashboard'],
    imageUrl: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=600&q=80',
    status: 'LOW_STOCK',
    createdAt: '2026-08-17',
  },
  {
    id: 'prod-104',
    name: 'Dedicated Cloud Telemetry License',
    sku: 'DAS-TLM-304',
    category: 'Cloud & Communications',
    subCategory: 'Cloud Telemetry Node',
    minPrice: 3999,
    maxPrice: 6999,
    currency: '₹',
    stockQuantity: 0,
    moq: 10,
    taxRate: 18,
    description: 'Dedicated cloud telemetry node with real-time call audit & midnight auto-purge engine.',
    features: ['Real-time Call Log Sync', '1-Day Ephemeral Storage', 'Geofence Attendance Sync', 'SLA 99.99%'],
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    status: 'OUT_OF_STOCK',
    createdAt: '2026-08-18',
  },
];

export const PRESET_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
];

class ProductCatalogService {
  private products: CatalogProductItem[] = INITIAL_PRODUCTS;
  private categories: CategoryTree[] = DEFAULT_CATEGORY_TREE;
  private initialized = false;

  async getCategories(): Promise<CategoryTree[]> {
    if (!this.initialized) {
      await this.loadAll();
    }
    return this.categories;
  }

  async getProducts(): Promise<CatalogProductItem[]> {
    if (!this.initialized) {
      await this.loadAll();
    }
    return this.products;
  }

  private async loadAll(): Promise<void> {
    try {
      const storedProds = await AsyncStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (storedProds) {
        this.products = JSON.parse(storedProds);
      }
      const storedCats = await AsyncStorage.getItem(STORAGE_CATS_KEY);
      if (storedCats) {
        this.categories = JSON.parse(storedCats);
      }
    } catch (err) {
      console.log('Failed to load products/categories from storage:', err);
    }
    this.initialized = true;
  }

  async saveCategories(newCats: CategoryTree[]): Promise<void> {
    this.categories = newCats;
    try {
      await AsyncStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(newCats));
    } catch (err) {
      console.log('Failed to save categories:', err);
    }
  }

  async addCategory(catName: string, subCats: string[] = ['General']): Promise<CategoryTree[]> {
    const list = await this.getCategories();
    const existing = list.find((c) => c.name.toLowerCase() === catName.trim().toLowerCase());
    if (existing) {
      const mergedSubs = Array.from(new Set([...existing.subCategories, ...subCats]));
      existing.subCategories = mergedSubs;
    } else {
      list.push({
        id: 'cat-' + Date.now(),
        name: catName.trim(),
        subCategories: subCats.length > 0 ? subCats : ['General'],
      });
    }
    await this.saveCategories(list);
    return list;
  }

  async addSubCategory(catName: string, subCatName: string): Promise<CategoryTree[]> {
    const list = await this.getCategories();
    const target = list.find((c) => c.name.toLowerCase() === catName.trim().toLowerCase());
    if (target) {
      if (!target.subCategories.includes(subCatName.trim())) {
        target.subCategories.push(subCatName.trim());
        await this.saveCategories(list);
      }
    }
    return list;
  }

  async saveProducts(newProducts: CatalogProductItem[]): Promise<void> {
    this.products = newProducts;
    try {
      await AsyncStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(newProducts));
    } catch (err) {
      console.log('Failed to save products:', err);
    }
  }

  async createProduct(product: Omit<CatalogProductItem, 'id' | 'createdAt' | 'status'>): Promise<CatalogProductItem[]> {
    const list = await this.getProducts();

    // Auto calculate status based on stock count
    let status: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'ACTIVE';
    if (product.stockQuantity <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (product.stockQuantity < 10) {
      status = 'LOW_STOCK';
    }

    const newProd: CatalogProductItem = {
      ...product,
      id: 'prod-' + Date.now(),
      status,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newProd, ...list];
    await this.saveProducts(updated);
    return updated;
  }

  async updateProduct(id: string, updates: Partial<CatalogProductItem>): Promise<CatalogProductItem[]> {
    const list = await this.getProducts();
    const updated = list.map((p) => {
      if (p.id === id) {
        const newQty = updates.stockQuantity !== undefined ? updates.stockQuantity : p.stockQuantity;
        let newStatus: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DRAFT' = p.status;
        if (newQty <= 0) newStatus = 'OUT_OF_STOCK';
        else if (newQty < 10) newStatus = 'LOW_STOCK';
        else if (newStatus === 'OUT_OF_STOCK' || newStatus === 'LOW_STOCK') newStatus = 'ACTIVE';

        return {
          ...p,
          ...updates,
          status: newStatus,
        };
      }
      return p;
    });

    await this.saveProducts(updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<CatalogProductItem[]> {
    const list = await this.getProducts();
    const updated = list.filter((p) => p.id !== id);
    await this.saveProducts(updated);
    return updated;
  }
}

export const productCatalogService = new ProductCatalogService();
