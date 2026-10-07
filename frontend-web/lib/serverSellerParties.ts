import fs from 'fs';
import path from 'path';

function getDataPaths() {
  const dirs = [
    path.resolve(process.cwd(), 'data'),
    path.resolve(process.cwd(), 'frontend-web', 'data'),
    path.resolve(process.cwd(), '..', 'frontend-web', 'data'),
  ];
  return dirs;
}

export interface SellerProfile {
  id: string;
  name: string;
  logoUrl: string;
  email: string;
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
  email: '',
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
  for (const dir of getDataPaths()) {
    try {
      const file = path.join(dir, 'seller-company.json');
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed && (parsed.name || parsed.logoUrl || parsed.address)) return parsed;
      }
    } catch (_) {}
  }
  return DEFAULT_SELLER;
}

export function saveLocalSellerProfile(profile: SellerProfile): void {
  for (const dir of getDataPaths()) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, 'seller-company.json'), JSON.stringify(profile, null, 2), 'utf8');
    } catch (_) {}
  }
}

// ─── Parties (buyer clients) ─────────────────────────────────────────────────

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
  for (const dir of getDataPaths()) {
    try {
      const file = path.join(dir, 'parties.json');
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
  }
  return [];
}

export function saveLocalParties(parties: SavedParty[]): void {
  for (const dir of getDataPaths()) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, 'parties.json'), JSON.stringify(parties, null, 2), 'utf8');
    } catch (_) {}
  }
}
