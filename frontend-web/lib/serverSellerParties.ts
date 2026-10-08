import fs from 'fs';
import path from 'path';

function getDataPaths() {
  const isInsideFrontend = process.cwd().endsWith('frontend-web');
  const dirs = [
    path.resolve(process.cwd(), 'data'),
    ...(isInsideFrontend ? [] : [path.resolve(process.cwd(), 'frontend-web', 'data')]),
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

const DEFAULT_SELLER: SellerProfile & { isDefault?: boolean } = {
  id: 'seller-org',
  name: 'Adorable Trading',
  logoUrl: '',
  email: '',
  phone: '',
  address: 'Registered Business Address',
  gstNumber: '',
  panNumber: '',
  bankDetails: {
    bankName: 'HDFC Bank',
    accountNo: '',
    ifscCode: '',
    branch: '',
    upiId: '',
  },
  updatedAt: new Date().toISOString(),
  isDefault: true,
};

export function getLocalSellerCompanies(): SellerProfile[] {
  for (const dir of getDataPaths()) {
    try {
      const file = path.join(dir, 'seller-companies.json');
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
  }
  const single = getLocalSellerProfile();
  return [single];
}

export function saveLocalSellerCompanies(companies: SellerProfile[]): void {
  if (!Array.isArray(companies) || companies.length === 0) return;
  for (const dir of getDataPaths()) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, 'seller-companies.json'), JSON.stringify(companies, null, 2), 'utf8');
      if (companies[0]) {
        fs.writeFileSync(path.join(dir, 'seller-company.json'), JSON.stringify(companies[0], null, 2), 'utf8');
      }
    } catch (_) {}
  }
}

export function getLocalSellerProfile(): SellerProfile & { isDefault?: boolean } {
  for (const dir of getDataPaths()) {
    try {
      const file = path.join(dir, 'seller-company.json');
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed && (parsed.name || parsed.logoUrl || parsed.address || parsed.gstNumber)) {
          return { ...parsed, isDefault: false };
        }
      }
    } catch (_) {}
  }
  return DEFAULT_SELLER;
}

export function saveLocalSellerProfile(profile: SellerProfile): void {
  const cleanProfile = { ...profile, isDefault: false };
  for (const dir of getDataPaths()) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, 'seller-company.json'), JSON.stringify(cleanProfile, null, 2), 'utf8');
      // Also update in seller-companies.json list
      const companiesFile = path.join(dir, 'seller-companies.json');
      let currentList: SellerProfile[] = [];
      if (fs.existsSync(companiesFile)) {
        try {
          const content = fs.readFileSync(companiesFile, 'utf8');
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) currentList = parsed;
        } catch (_) {}
      }
      const existingIdx = currentList.findIndex(c => c.id === cleanProfile.id || c.name.toLowerCase() === cleanProfile.name.toLowerCase());
      if (existingIdx >= 0) {
        currentList[existingIdx] = cleanProfile;
      } else if (currentList.length > 0) {
        currentList.unshift(cleanProfile);
      } else {
        currentList = [cleanProfile];
      }
      fs.writeFileSync(companiesFile, JSON.stringify(currentList, null, 2), 'utf8');
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
