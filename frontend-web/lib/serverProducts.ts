import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

export const INITIAL_SERVER_CATALOG = [
  {
    id: 'cmuxkzfx8000nce1vioa4a7zg',
    name: 'Colour Tribe Puff Jackets',
    sku: 'DAS-570687',
    category: 'Jackets',
    subCategory: 'Puff Jackets',
    brand: 'Generic / Unbranded',
    color: 'Silver Grey, Black',
    unit: 'Pieces (Pcs)',
    price: 1999,
    stock: 100,
    minOrderQty: 1,
    rating: 5.0,
    sharedCount: 12,
    sold: 0,
    taxRate: 18,
    isActive: true,
    coverImage: '/products/puff-jackets.jpg',
    imageUrl: '/products/puff-jackets.jpg',
    images: ['/products/puff-jackets.jpg'],
    overview: 'Premium Padded Colour Tribe Puff Jackets with lightweight thermal insulation and dual zip pockets.',
    description: 'Premium Padded Colour Tribe Puff Jackets with lightweight thermal insulation and dual zip pockets.',
    specs: ['Padded', 'Lightweight', 'Thermal Insulation'],
    features: ['Padded', 'Lightweight', 'Thermal Insulation'],
    volumeDiscounts: [
      { tier: '1 - 9 Units', minQty: 1, discountPct: 0, finalPrice: 1999 },
      { tier: '10+ Units', minQty: 10, discountPct: 15, finalPrice: 1699 },
    ],
  },
];

export function getLocalProducts(): any[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const content = fs.readFileSync(PRODUCTS_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[serverProducts] Failed to read products.json:', err);
  }
  return INITIAL_SERVER_CATALOG;
}

export function saveLocalProducts(products: any[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    console.warn('[serverProducts] Failed to write products.json:', err);
  }
}
