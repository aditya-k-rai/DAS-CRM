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

export interface GlobalGoalSettings {
  dailyCallsTarget: number; // Required
  dailyWhatsappTarget: number; // Optional (0 = disabled)
  monthlyRevenueTarget: number; // Primary revenue quota (₹)
  monthlyMeetingsTarget: number; // Optional meetings quota
  activeMonth: string; // e.g. "2026-10"
}

export interface UserGoalTarget {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'TEAM_LEADER' | 'SALES_EXEC' | string;
  dailyCallsTarget?: number;
  dailyWhatsappTarget?: number;
  monthlyRevenueTarget?: number;
  monthlyMeetingsTarget?: number;
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface GoalsStoragePayload {
  globalSettings: GlobalGoalSettings;
  userOverrides: UserGoalTarget[];
  updatedAt: string;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalGoalSettings = {
  dailyCallsTarget: 40,
  dailyWhatsappTarget: 25,
  monthlyRevenueTarget: 500000,
  monthlyMeetingsTarget: 10,
  activeMonth: new Date().toISOString().slice(0, 7), // "YYYY-MM"
};

export const DEFAULT_USER_OVERRIDES: UserGoalTarget[] = [
  {
    userId: 'usr_tl',
    userName: 'Sachin Puri',
    userEmail: 'sachin.puri@das.com',
    userRole: 'TEAM_LEADER',
    dailyCallsTarget: 35,
    dailyWhatsappTarget: 20,
    monthlyRevenueTarget: 800000,
    monthlyMeetingsTarget: 15,
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'usr_rep_1',
    userName: 'Nandini Rastogi',
    userEmail: 'rastoginandini92@gmail.com',
    userRole: 'SALES_EXEC',
    dailyCallsTarget: 50,
    dailyWhatsappTarget: 25,
    monthlyRevenueTarget: 450000,
    monthlyMeetingsTarget: 10,
    updatedAt: new Date().toISOString(),
  },
];

export function getLocalGoals(): GoalsStoragePayload {
  for (const dir of getDataPaths()) {
    try {
      const file = path.join(dir, 'goals.json');
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
          return {
            globalSettings: { ...DEFAULT_GLOBAL_SETTINGS, ...(parsed.globalSettings || {}) },
            userOverrides: Array.isArray(parsed.userOverrides) ? parsed.userOverrides : DEFAULT_USER_OVERRIDES,
            updatedAt: parsed.updatedAt || new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn('[serverGoals] Failed to read goals.json:', err);
    }
  }

  return {
    globalSettings: DEFAULT_GLOBAL_SETTINGS,
    userOverrides: DEFAULT_USER_OVERRIDES,
    updatedAt: new Date().toISOString(),
  };
}

export function saveLocalGoals(payload: GoalsStoragePayload): void {
  const dirs = getDataPaths();
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const file = path.join(dir, 'goals.json');
      fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.warn('[serverGoals] Failed to save goals.json in ' + dir, err);
    }
  }
}
