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
  dailyCallsTarget: number;
  dailyWhatsappTarget: number;
  dailyQuotesTarget: number;
  dailyNewLeadsTarget: number;
  monthlyRevenueTarget: number;
  monthlyDealsTarget: number;
  monthlyLeadsTarget: number;
  monthlyQuotesTarget: number;
  monthlyQuotesValueTarget: number;
  activeMonth: string; // e.g. "2026-10"
}

export interface UserGoalTarget {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' | string;
  teamLeaderId?: string;
  teamLeaderName?: string;
  dailyCallsTarget?: number;
  dailyWhatsappTarget?: number;
  dailyQuotesTarget?: number;
  dailyNewLeadsTarget?: number;
  monthlyRevenueTarget?: number;
  monthlyDealsTarget?: number;
  monthlyLeadsTarget?: number;
  monthlyQuotesTarget?: number;
  monthlyQuotesValueTarget?: number;
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface GoalsStoragePayload {
  globalSettings: GlobalGoalSettings;
  userOverrides: UserGoalTarget[];
  tlAssignments?: Record<string, string[]>; // tlId -> repIds[]
  updatedAt: string;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalGoalSettings = {
  dailyCallsTarget: 40,
  dailyWhatsappTarget: 25,
  dailyQuotesTarget: 2,
  dailyNewLeadsTarget: 5,
  monthlyRevenueTarget: 500000,
  monthlyDealsTarget: 10,
  monthlyLeadsTarget: 60,
  monthlyQuotesTarget: 20,
  monthlyQuotesValueTarget: 1000000,
  activeMonth: new Date().toISOString().slice(0, 7), // "YYYY-MM"
};

export const DEFAULT_USER_OVERRIDES: UserGoalTarget[] = [
  {
    userId: 'usr_tl',
    userName: 'Team Leader',
    userEmail: 'teamleader@das.com',
    userRole: 'TEAM_LEADER',
    dailyCallsTarget: 30,
    dailyWhatsappTarget: 20,
    dailyQuotesTarget: 3,
    dailyNewLeadsTarget: 8,
    monthlyRevenueTarget: 800000,
    monthlyDealsTarget: 15,
    monthlyLeadsTarget: 80,
    monthlyQuotesTarget: 25,
    monthlyQuotesValueTarget: 1500000,
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'usr_rep',
    userName: 'Sales Executive',
    userEmail: 'rep@das.com',
    userRole: 'SALES_EXEC',
    teamLeaderId: 'usr_tl',
    teamLeaderName: 'Team Leader',
    dailyCallsTarget: 45,
    dailyWhatsappTarget: 30,
    dailyQuotesTarget: 2,
    dailyNewLeadsTarget: 5,
    monthlyRevenueTarget: 400000,
    monthlyDealsTarget: 8,
    monthlyLeadsTarget: 50,
    monthlyQuotesTarget: 15,
    monthlyQuotesValueTarget: 800000,
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
            tlAssignments: parsed.tlAssignments || {},
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
    tlAssignments: { usr_tl: ['usr_rep'] },
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
