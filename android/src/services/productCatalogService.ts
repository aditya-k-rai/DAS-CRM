/**
 * productCatalogService.ts — DAS CRM Android
 * Product & Services Catalog Service with Category & Sub-Category Hierarchy.
 * Manages category/sub-category trees, product creation, stock inventory counts,
 * MOQ validation, tax rates, and AsyncStorage persistent storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBase } from '../config/api';

export interface CategoryTree {
  id: string;
  name: string;
  subCategories: string[];
}

export interface ProductCardDisplayConfig {
  showImage: boolean;
  showName: boolean;
  showCategory: boolean;
  showSubCategory: boolean;
  showPrice: boolean;
  showGst: boolean;
  showInStock: boolean;
  showMoq: boolean;
  showSku: boolean;
  showDescription: boolean;
  showFeatures: boolean;
  showTapHint: boolean;
}

export const DEFAULT_CARD_DISPLAY_CONFIG: ProductCardDisplayConfig = {
  showImage: true,
  showName: true,
  showCategory: true,
  showSubCategory: true,
  showPrice: true,
  showGst: true,
  showInStock: true,
  showMoq: true,
  showSku: true,
  showDescription: false, // Clean display by default as requested
  showFeatures: false,    // Clean display by default as requested
  showTapHint: true,
};

export interface CatalogProductItem {
  id: string;
  name: string;
  sku: string;
  category: string; // e.g. "CRM & Sales Software"
  subCategory: string; // e.g. "Lead Management"
  brand?: string;
  color?: string;
  unit?: string;
  minPrice: number;
  maxPrice: number;
  currency: '₹' | '$';
  stockQuantity: number;
  moq: number;
  taxRate: number; // e.g. 18 for 18% GST
  description: string;
  features: string[];
  imageUrl: string;
  images?: string[];
  status: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DRAFT';
  createdAt: string;
}

export const UNIT_TYPES: string[] = [
  'Pieces (Pcs)',
  'Kilogram (Kg)',
  'Litre (Ltr)',
  'Grams (g)',
  'Metre (m)',
  'Box',
  'Pack',
  'Set',
  'Units',
  'Hours (Hrs)',
  'License',
];

export const DEFAULT_BRANDS: string[] = [];

const STORAGE_PRODUCTS_KEY = 'das_crm_products_catalog_v3';
const STORAGE_CATS_KEY = 'das_crm_categories_tree_v1';
const STORAGE_CARD_CONFIG_KEY = 'das_crm_product_card_display_config_v1';
const STORAGE_BRANDS_KEY = 'das_crm_brands_list_v1';

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
    name: 'DAS Enterprise CRM License (Per User / Year)',
    sku: 'DAS-CRM-ENT-01',
    category: 'CRM & Sales Software',
    subCategory: 'Lead Management',
    brand: 'DAS Technologies',
    unit: 'License',
    minPrice: 12000,
    maxPrice: 15000,
    currency: '₹',
    stockQuantity: 150,
    moq: 5,
    taxRate: 18,
    description: 'Complete enterprise CRM platform with live call sync, lead routing, and quotas.',
    features: ['Real-Time Call Logging', 'WhatsApp Cloud API', 'Automatic Round-Robin Routing'],
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    createdAt: '2026-01-15',
  },
  {
    id: 'prod-102',
    name: 'AI Lead Scoring & Prediction Bot',
    sku: 'DAS-AI-SCORE-02',
    category: 'AI & Intelligence',
    subCategory: 'AI Lead Scoring',
    brand: 'DAS AI Labs',
    unit: 'License',
    minPrice: 25000,
    maxPrice: 30000,
    currency: '₹',
    stockQuantity: 85,
    moq: 1,
    taxRate: 18,
    description: 'Real-time multi-dimensional AI scoring engine that prioritizes hot prospects.',
    features: ['Automated Call Sentiment', 'Engagement Velocity Model', 'Deal Conversion Probability'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    createdAt: '2026-02-01',
  },
  {
    id: 'prod-103',
    name: 'Meta WhatsApp Cloud Business API Setup',
    sku: 'DAS-WA-CLOUD-03',
    category: 'Cloud & Communications',
    subCategory: 'Meta WhatsApp Cloud API',
    brand: 'Meta / DAS',
    unit: 'Units',
    minPrice: 18000,
    maxPrice: 22000,
    currency: '₹',
    stockQuantity: 40,
    moq: 1,
    taxRate: 18,
    description: 'Official WhatsApp Business Cloud API green tick registration with custom HSM templates.',
    features: ['Unlimited Direct Outbound', 'Rich Media PDFs', 'Automated Bot Triggers'],
    imageUrl: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    createdAt: '2026-02-10',
  },
  {
    id: 'prod-104',
    name: 'Biometric Punch Terminal & Cloud Sync',
    sku: 'DAS-BIO-TERM-04',
    category: 'Hardware & Infrastructure',
    subCategory: 'Biometric Punch Terminal',
    brand: 'SecureID',
    unit: 'Pieces (Pcs)',
    minPrice: 14500,
    maxPrice: 17500,
    currency: '₹',
    stockQuantity: 24,
    moq: 1,
    taxRate: 18,
    description: 'Enterprise fingerprint and facial recognition attendance terminal with live DAS CRM sync.',
    features: ['Wi-Fi & 4G Connectivity', 'Anti-Spoofing Sensors', 'Instant Shift Audit'],
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    createdAt: '2026-03-05',
  },
  {
    id: 'prod-105',
    name: 'Custom ERP & API Integration Pack',
    sku: 'DAS-PRO-SRV-05',
    category: 'Professional Services',
    subCategory: 'Custom Integration & Setup',
    brand: 'DAS Solutions',
    unit: 'Hours (Hrs)',
    minPrice: 35000,
    maxPrice: 50000,
    currency: '₹',
    stockQuantity: 12,
    moq: 1,
    taxRate: 18,
    description: 'Full-stack engineering hours to connect SAP, Tally, Zoho or customized internal pipelines.',
    features: ['Dedicated Integration Engineer', 'Webhook Middleware', 'SLA 99.9% Uptime'],
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    createdAt: '2026-03-12',
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
  private brands: string[] = DEFAULT_BRANDS;
  private initialized = false;

  async getCategories(): Promise<CategoryTree[]> {
    if (!this.initialized) {
      await this.loadAll();
    }
    return this.categories;
  }

  async getBrands(): Promise<string[]> {
    if (!this.initialized) {
      await this.loadAll();
    }
    return this.brands;
  }

  async addBrand(brandName: string): Promise<string[]> {
    const list = await this.getBrands();
    const trimmed = brandName.trim();
    if (trimmed && !list.includes(trimmed)) {
      list.push(trimmed);
      this.brands = [...list];
      try {
        await AsyncStorage.setItem(STORAGE_BRANDS_KEY, JSON.stringify(this.brands));
      } catch (err) {
        console.log('Failed to save brands:', err);
      }
    }
    return this.brands;
  }

  async editBrand(oldBrand: string, newBrand: string): Promise<string[]> {
    const list = await this.getBrands();
    const trimmedOld = oldBrand.trim();
    const trimmedNew = newBrand.trim();

    const updated = list.map((b) => b.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : b);
    this.brands = updated;
    try {
      await AsyncStorage.setItem(STORAGE_BRANDS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.log('Failed to save brands:', err);
    }

    // Cascade update all products
    const prods = await this.getProducts();
    const updatedProds = prods.map((p) => {
      if ((p.brand || '').trim().toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...p, brand: trimmedNew };
      }
      return p;
    });
    await this.saveProducts(updatedProds);
    return updated;
  }

  async deleteBrand(brandName: string): Promise<string[]> {
    const list = await this.getBrands();
    const trimmed = brandName.trim();

    const updated = list.filter((b) => b.toLowerCase() !== trimmed.toLowerCase());
    this.brands = updated;
    try {
      await AsyncStorage.setItem(STORAGE_BRANDS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.log('Failed to save brands:', err);
    }

    // Cascade update all products to 'Generic / Unbranded'
    const prods = await this.getProducts();
    const updatedProds = prods.map((p) => {
      if ((p.brand || '').trim().toLowerCase() === trimmed.toLowerCase()) {
        return { ...p, brand: 'Generic / Unbranded' };
      }
      return p;
    });
    await this.saveProducts(updatedProds);
    return updated;
  }

  async getProducts(): Promise<CatalogProductItem[]> {
    if (!this.initialized) {
      await this.loadAll();
    }

    // Background sync from backend /products if available
    try {
      const activeBase = getApiBase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${activeBase}/products`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const serverProds = Array.isArray(data) ? data : data.products || data.data;
        if (Array.isArray(serverProds) && serverProds.length > 0) {
          const mapped: CatalogProductItem[] = serverProds.map((p: any) => ({
            id: String(p.id),
            name: p.name || 'Product Item',
            sku: p.sku || `SKU-${p.id}`,
            category: p.category || 'General',
            subCategory: p.subCategory || 'General',
            brand: p.brand || '',
            unit: p.unit || 'Units',
            minPrice: p.price || p.minPrice || 0,
            maxPrice: p.maxPrice || p.price || 0,
            currency: '₹',
            stockQuantity: p.stock || p.stockQuantity || 10,
            moq: p.moq || 1,
            taxRate: p.tax || p.taxRate || 18,
            description: p.description || '',
            features: p.features || [],
            imageUrl: p.imageUrl || p.image || PRESET_PRODUCT_IMAGES[0],
            status: (p.status || (p.stockQuantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK')) as any,
            createdAt: p.createdAt || new Date().toISOString().split('T')[0],
          }));
          this.products = mapped;
          AsyncStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(mapped)).catch(() => {});
          return mapped;
        }
      }
    } catch (_) {}

    return this.products.length > 0 ? this.products : INITIAL_PRODUCTS;
  }

  private async loadAll(): Promise<void> {
    try {
      const storedProds = await AsyncStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (storedProds) {
        const parsed = JSON.parse(storedProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.products = parsed;
        } else {
          this.products = INITIAL_PRODUCTS;
        }
      } else {
        this.products = INITIAL_PRODUCTS;
      }
      const storedCats = await AsyncStorage.getItem(STORAGE_CATS_KEY);
      if (storedCats) {
        this.categories = JSON.parse(storedCats);
      }
      const storedBrands = await AsyncStorage.getItem(STORAGE_BRANDS_KEY);
      if (storedBrands) {
        this.brands = JSON.parse(storedBrands);
      }
    } catch (err) {
      console.log('Failed to load products/categories/brands from storage:', err);
      this.products = INITIAL_PRODUCTS;
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

  async editCategory(oldName: string, newName: string): Promise<CategoryTree[]> {
    const list = await this.getCategories();
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    const updated = list.map((c) => {
      if (c.name.toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...c, name: trimmedNew };
      }
      return c;
    });
    await this.saveCategories(updated);

    // Cascade update all products
    const prods = await this.getProducts();
    const updatedProds = prods.map((p) => {
      if (p.category.toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...p, category: trimmedNew };
      }
      return p;
    });
    await this.saveProducts(updatedProds);
    return updated;
  }

  async deleteCategory(catName: string): Promise<CategoryTree[]> {
    const list = await this.getCategories();
    const trimmed = catName.trim();
    const updated = list.filter((c) => c.name.toLowerCase() !== trimmed.toLowerCase());
    await this.saveCategories(updated);

    // Cascade reassign products to 'General'
    const prods = await this.getProducts();
    const updatedProds = prods.map((p) => {
      if (p.category.toLowerCase() === trimmed.toLowerCase()) {
        return { ...p, category: 'General', subCategory: 'General' };
      }
      return p;
    });
    await this.saveProducts(updatedProds);
    return updated;
  }

  async editSubCategory(parentCat: string, oldSubName: string, newSubName: string): Promise<CategoryTree[]> {
    const list = await this.getCategories();
    const trimmedParent = parentCat.trim();
    const trimmedOld = oldSubName.trim();
    const trimmedNew = newSubName.trim();

    const updated = list.map((c) => {
      if (c.name.toLowerCase() === trimmedParent.toLowerCase()) {
        return {
          ...c,
          subCategories: c.subCategories.map((s) => s.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : s),
        };
      }
      return c;
    });
    await this.saveCategories(updated);

    // Cascade update all products under parent category
    const prods = await this.getProducts();
    const updatedProds = prods.map((p) => {
      if (p.category.toLowerCase() === trimmedParent.toLowerCase() && p.subCategory?.toLowerCase() === trimmedOld.toLowerCase()) {
        return { ...p, subCategory: trimmedNew };
      }
      return p;
    });
    await this.saveProducts(updatedProds);
    return updated;
  }

  async deleteSubCategory(parentCat: string, subCatName: string): Promise<CategoryTree[]> {
    const list = await this.getCategories();
    const trimmedParent = parentCat.trim();
    const trimmedSub = subCatName.trim();

    const updated = list.map((c) => {
      if (c.name.toLowerCase() === trimmedParent.toLowerCase()) {
        return {
          ...c,
          subCategories: c.subCategories.filter((s) => s.toLowerCase() !== trimmedSub.toLowerCase()),
        };
      }
      return c;
    });
    await this.saveCategories(updated);

    // Cascade update products to 'General' subCategory
    const prods = await this.getProducts();
    const updatedProds = prods.map((p) => {
      if (p.category.toLowerCase() === trimmedParent.toLowerCase() && p.subCategory?.toLowerCase() === trimmedSub.toLowerCase()) {
        return { ...p, subCategory: 'General' };
      }
      return p;
    });
    await this.saveProducts(updatedProds);
    return updated;
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

  /**
   * Admin-Only: Retrieve saved product card display configuration.
   * Falls back to DEFAULT_CARD_DISPLAY_CONFIG.
   */
  async getCardDisplayConfig(): Promise<ProductCardDisplayConfig> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_CARD_CONFIG_KEY);
      const localConfig = stored ? JSON.parse(stored) : null;

      // Try fetching from backend if token exists
      const token = await AsyncStorage.getItem('das_crm_auth_token');
      if (token) {
        try {
          const res = await fetch(`${getApiBase()}/products/card-display-config`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const remoteConfig = await res.json();
            if (remoteConfig && typeof remoteConfig === 'object') {
              const merged = { ...DEFAULT_CARD_DISPLAY_CONFIG, ...remoteConfig };
              await AsyncStorage.setItem(STORAGE_CARD_CONFIG_KEY, JSON.stringify(merged));
              return merged;
            }
          }
        } catch {
          // Ignore network errors, fall back to storage
        }
      }

      if (stored) {
        return {
          ...DEFAULT_CARD_DISPLAY_CONFIG,
          ...localConfig,
        };
      }
    } catch (err) {
      console.log('Failed to load product card display config:', err);
    }
    return DEFAULT_CARD_DISPLAY_CONFIG;
  }

  /**
   * Admin-Only: Save product card display configuration to persistent storage and backend.
   */
  async saveCardDisplayConfig(config: ProductCardDisplayConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_CARD_CONFIG_KEY, JSON.stringify(config));
      const token = await AsyncStorage.getItem('das_crm_auth_token');
      if (token) {
        try {
          await fetch(`${getApiBase()}/products/card-display-config`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(config),
          });
        } catch {
          // Ignore network errors
        }
      }
    } catch (err) {
      console.log('Failed to save product card display config:', err);
    }
  }
}

export const productCatalogService = new ProductCatalogService();
