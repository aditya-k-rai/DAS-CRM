/**
 * productCatalogService.ts — DAS CRM Android
 * Real-time Cloud Synchronization & Catalog Management Service.
 * Full Parity with Web ProductsCatalog (/products).
 *
 * Capabilities:
 * 1. Live synchronization with backend (/products, /products/card-display-config, /products/upload-image).
 * 2. Full CRUD persistence across server & AsyncStorage cache.
 * 3. Dynamic Category, Sub-Category, and Brand tree hierarchies.
 * 4. Image upload & base64 processing.
 * 5. Card display configuration governance for Admins & Managers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBase } from '../config/api';
import { useAuthStore } from '../store/authStore';

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  showDescription: false,
  showFeatures: false,
  showTapHint: true,
};

export interface CatalogProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory: string;
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

export const PRESET_PRODUCT_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
];

export const DEFAULT_CATEGORY_TREE: CategoryTree[] = [
  {
    id: 'cat-1',
    name: 'General Products',
    subCategories: ['General', 'Hardware', 'Accessories'],
  },
];

const STORAGE_PRODUCTS_KEY = 'das_crm_products_catalog_v3';
const STORAGE_CATS_KEY = 'das_crm_categories_tree_v1';
const STORAGE_CARD_CONFIG_KEY = 'das_crm_product_card_display_config_v1';
const STORAGE_BRANDS_KEY = 'das_crm_brands_list_v1';

// ─── Service Class ────────────────────────────────────────────────────────────

class ProductCatalogService {
  private products: CatalogProductItem[] = [];
  private categories: CategoryTree[] = DEFAULT_CATEGORY_TREE;
  private brands: string[] = DEFAULT_BRANDS;
  private initialized = false;

  private getRequestHeaders(): Record<string, string> {
    const token = useAuthStore.getState().token;
    const compId = useAuthStore.getState().currentUser?.companyId || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(compId ? { 'x-organization-id': compId } : {}),
    };
  }

  // ── Categories & Hierarchy ─────────────────────────────────────────────────

  async getCategories(): Promise<CategoryTree[]> {
    if (!this.initialized) {
      await this.loadAll();
    }
    return this.categories;
  }

  async saveCategories(newCats: CategoryTree[]): Promise<void> {
    this.categories = newCats;
    try {
      await AsyncStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(newCats));
    } catch (_) {}
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

    // Cascade update products
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
          subCategories: c.subCategories.map((s) => (s.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : s)),
        };
      }
      return c;
    });
    await this.saveCategories(updated);

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

  // ── Brands ─────────────────────────────────────────────────────────────────

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
      } catch (_) {}
    }
    return this.brands;
  }

  async editBrand(oldBrand: string, newBrand: string): Promise<string[]> {
    const list = await this.getBrands();
    const trimmedOld = oldBrand.trim();
    const trimmedNew = newBrand.trim();

    const updated = list.map((b) => (b.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : b));
    this.brands = updated;
    try {
      await AsyncStorage.setItem(STORAGE_BRANDS_KEY, JSON.stringify(updated));
    } catch (_) {}

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
    } catch (_) {}

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

  // ── Products Core (Real-Time Cloud & Cache Sync) ───────────────────────────

  async getProducts(forceRefresh = false): Promise<CatalogProductItem[]> {
    if (!this.initialized && !forceRefresh) {
      await this.loadAll();
    }

    const activeBase = getApiBase();
    const headers = this.getRequestHeaders();

    try {
      const res = await fetch(`${activeBase}/products`, { headers });
      if (res.ok) {
        const data = await res.json();
        const serverProds = Array.isArray(data) ? data : data.products || data.data || [];
        if (Array.isArray(serverProds)) {
          const mapped: CatalogProductItem[] = serverProds.map((p: any) => {
            const minP = p.minPrice !== undefined ? Number(p.minPrice) : p.price ? Number(p.price) : 0;
            const maxP = p.maxPrice !== undefined ? Number(p.maxPrice) : minP;
            const stock = p.stock !== undefined ? Number(p.stock) : p.stockQuantity !== undefined ? Number(p.stockQuantity) : 100;
            const moq = p.minOrderQty !== undefined ? Number(p.minOrderQty) : p.moq !== undefined ? Number(p.moq) : 1;

            let status: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DRAFT' = 'ACTIVE';
            if (stock <= 0) status = 'OUT_OF_STOCK';
            else if (stock < 10) status = 'LOW_STOCK';

            return {
              id: String(p.id),
              name: p.name || 'Product Item',
              sku: p.sku || `SKU-${p.id}`,
              category: p.category || 'General',
              subCategory: p.subCategory || 'General',
              brand: p.brand || '',
              color: p.color || '',
              unit: p.unit || 'Pieces (Pcs)',
              minPrice: minP,
              maxPrice: maxP,
              currency: '₹',
              stockQuantity: stock,
              moq,
              taxRate: p.taxRate !== undefined ? Number(p.taxRate) : p.tax ? Number(p.tax) : 18,
              description: p.description || p.overview || '',
              features: Array.isArray(p.features) ? p.features : Array.isArray(p.specs) ? p.specs : [],
              imageUrl: p.coverImage || p.imageUrl || p.image || PRESET_PRODUCT_IMAGES[0],
              images: Array.isArray(p.images) ? p.images : [],
              status,
              createdAt: p.createdAt || new Date().toISOString().split('T')[0],
            };
          });

          this.products = mapped;
          this.syncCategoriesFromProducts(mapped);
          await AsyncStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch (_) {}

    return this.products;
  }

  private syncCategoriesFromProducts(prods: CatalogProductItem[]) {
    const existingCats = [...this.categories];
    prods.forEach((p) => {
      const catName = p.category?.trim();
      const subName = p.subCategory?.trim() || 'General';
      if (!catName) return;

      const found = existingCats.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      if (found) {
        if (!found.subCategories.includes(subName)) {
          found.subCategories.push(subName);
        }
      } else {
        existingCats.push({
          id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: catName,
          subCategories: [subName],
        });
      }
    });
    this.saveCategories(existingCats).catch(() => {});
  }

  private async loadAll(): Promise<void> {
    try {
      const storedProds = await AsyncStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (storedProds) {
        const parsed = JSON.parse(storedProds);
        if (Array.isArray(parsed)) {
          this.products = parsed;
        }
      }
      const storedCats = await AsyncStorage.getItem(STORAGE_CATS_KEY);
      if (storedCats) {
        this.categories = JSON.parse(storedCats);
      }
      const storedBrands = await AsyncStorage.getItem(STORAGE_BRANDS_KEY);
      if (storedBrands) {
        this.brands = JSON.parse(storedBrands);
      }
    } catch (_) {}
    this.initialized = true;
  }

  async saveProducts(newProducts: CatalogProductItem[]): Promise<void> {
    this.products = newProducts;
    try {
      await AsyncStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(newProducts));
    } catch (_) {}
  }

  async createProduct(product: Omit<CatalogProductItem, 'id' | 'createdAt' | 'status'>): Promise<CatalogProductItem[]> {
    let status: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'ACTIVE';
    if (product.stockQuantity <= 0) status = 'OUT_OF_STOCK';
    else if (product.stockQuantity < 10) status = 'LOW_STOCK';

    const tempId = `prod-${Date.now()}`;
    const newProd: CatalogProductItem = {
      ...product,
      id: tempId,
      status,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // 1. Update local cache immediately
    const updated = [newProd, ...this.products];
    await this.saveProducts(updated);

    // 2. Sync to backend API
    const activeBase = getApiBase();
    const headers = this.getRequestHeaders();
    try {
      const res = await fetch(`${activeBase}/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: product.name,
          sku: product.sku,
          category: product.category,
          subCategory: product.subCategory,
          brand: product.brand,
          color: product.color,
          unit: product.unit,
          price: product.minPrice,
          minPrice: product.minPrice,
          maxPrice: product.maxPrice,
          stock: product.stockQuantity,
          minOrderQty: product.moq,
          taxRate: product.taxRate,
          description: product.description,
          features: product.features,
          coverImage: product.imageUrl,
          images: product.images,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        if (saved?.id) {
          const finalProds = updated.map((p) => (p.id === tempId ? { ...p, id: String(saved.id) } : p));
          await this.saveProducts(finalProds);
          return finalProds;
        }
      }
    } catch (_) {}

    return updated;
  }

  async updateProduct(id: string, updates: Partial<CatalogProductItem>): Promise<CatalogProductItem[]> {
    const updated = this.products.map((p) => {
      if (p.id === id) {
        const newQty = updates.stockQuantity !== undefined ? updates.stockQuantity : p.stockQuantity;
        let newStatus: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DRAFT' = p.status;
        if (newQty <= 0) newStatus = 'OUT_OF_STOCK';
        else if (newQty < 10) newStatus = 'LOW_STOCK';
        else if (newStatus === 'OUT_OF_STOCK' || newStatus === 'LOW_STOCK') newStatus = 'ACTIVE';

        return { ...p, ...updates, status: newStatus };
      }
      return p;
    });

    await this.saveProducts(updated);

    // Sync to backend API
    const activeBase = getApiBase();
    const headers = this.getRequestHeaders();
    try {
      await fetch(`${activeBase}/products/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: updates.name,
          sku: updates.sku,
          category: updates.category,
          subCategory: updates.subCategory,
          brand: updates.brand,
          color: updates.color,
          unit: updates.unit,
          price: updates.minPrice,
          minPrice: updates.minPrice,
          maxPrice: updates.maxPrice,
          stock: updates.stockQuantity,
          minOrderQty: updates.moq,
          taxRate: updates.taxRate,
          description: updates.description,
          features: updates.features,
          coverImage: updates.imageUrl,
          images: updates.images,
        }),
      });
    } catch (_) {}

    return updated;
  }

  async deleteProduct(id: string): Promise<CatalogProductItem[]> {
    const updated = this.products.filter((p) => p.id !== id);
    await this.saveProducts(updated);

    // Sync to backend API
    const activeBase = getApiBase();
    const headers = this.getRequestHeaders();
    try {
      await fetch(`${activeBase}/products/${id}`, {
        method: 'DELETE',
        headers,
      });
    } catch (_) {}

    return updated;
  }

  // ── Card Display Config ────────────────────────────────────────────────────

  async getCardDisplayConfig(): Promise<ProductCardDisplayConfig> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_CARD_CONFIG_KEY);
      const localConfig = stored ? JSON.parse(stored) : null;

      const activeBase = getApiBase();
      const headers = this.getRequestHeaders();
      try {
        const res = await fetch(`${activeBase}/products/card-display-config`, { headers });
        if (res.ok) {
          const remoteConfig = await res.json();
          if (remoteConfig && typeof remoteConfig === 'object') {
            const merged = { ...DEFAULT_CARD_DISPLAY_CONFIG, ...remoteConfig };
            await AsyncStorage.setItem(STORAGE_CARD_CONFIG_KEY, JSON.stringify(merged));
            return merged;
          }
        }
      } catch (_) {}

      if (localConfig) {
        return { ...DEFAULT_CARD_DISPLAY_CONFIG, ...localConfig };
      }
    } catch (_) {}
    return DEFAULT_CARD_DISPLAY_CONFIG;
  }

  async saveCardDisplayConfig(config: ProductCardDisplayConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_CARD_CONFIG_KEY, JSON.stringify(config));
      const activeBase = getApiBase();
      const headers = this.getRequestHeaders();
      await fetch(`${activeBase}/products/card-display-config`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(config),
      }).catch(() => null);
    } catch (_) {}
  }

  // ── Image Upload Helper ────────────────────────────────────────────────────

  async uploadProductImage(dataUrl: string, prefix = 'product'): Promise<string> {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return dataUrl || '';
    }

    const activeBase = getApiBase();
    const headers = this.getRequestHeaders();
    try {
      const res = await fetch(`${activeBase}/products/upload-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ dataUrl, fileName: prefix }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) return data.url;
      }
    } catch (_) {}

    return dataUrl;
  }
}

export const productCatalogService = new ProductCatalogService();
