import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SELLER_FILE = path.join(DATA_DIR, 'seller-company.json');

export interface SellerProfile {
  id: string;
  name: string;
  logoUrl: string;
  phone: string;
  address: string;
  gstNumber: string;
  panNumber: string;
  bankDetails: {
    bankName: string;
    accountNo: string;
    ifscCode: string;
    branch: string;
    upiId: string;
  };
  updatedAt: string;
}

const DEFAULT_SELLER: SellerProfile = {
  id: 'seller-org',
  name: '',
  logoUrl: '',
  phone: '',
  address: '',
  gstNumber: '',
  panNumber: '',
  bankDetails: {
    bankName: '',
    accountNo: '',
    ifscCode: '',
    branch: '',
    upiId: '',
  },
  updatedAt: new Date().toISOString(),
};

export function getLocalSellerProfile(): SellerProfile {
  try {
    if (fs.existsSync(SELLER_FILE)) {
      const content = fs.readFileSync(SELLER_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.name) return parsed;
    }
  } catch (_) {}
  return DEFAULT_SELLER;
}

export function saveLocalSellerProfile(profile: SellerProfile): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SELLER_FILE, JSON.stringify(profile, null, 2), 'utf8');
  } catch (err) {
    console.warn('[serverSellerProfile] Failed to write seller-company.json:', err);
  }
}

// ─── Parties (buyer clients) ─────────────────────────────────────────────────

const PARTIES_FILE = path.join(DATA_DIR, 'parties.json');

export interface SavedParty {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  shippingAddress?: string;
  gstNo: string;
  panNo: string;
  createdAt: string;
  updatedAt: string;
}

export function getLocalParties(): SavedParty[] {
  try {
    if (fs.existsSync(PARTIES_FILE)) {
      const content = fs.readFileSync(PARTIES_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function saveLocalParties(parties: SavedParty[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PARTIES_FILE, JSON.stringify(parties, null, 2), 'utf8');
  } catch (err) {
    console.warn('[serverParties] Failed to write parties.json:', err);
  }
}
