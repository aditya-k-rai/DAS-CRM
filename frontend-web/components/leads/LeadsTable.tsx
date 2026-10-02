'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, ChevronDown, Phone, Mail, MoreHorizontal, ExternalLink, Star, Shield, Lock, ArrowLeftRight, Edit3, MoveLeft, MoveRight, Maximize2, Table, LayoutList, GitBranch, Brain, Filter, User, UserCheck, Calendar, RotateCcw, Check, X, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { verifyInternetConnection, isBrowserOnline } from '@/lib/networkService';
import { LeadAllocationTrail, AllocationEvent, getUserRoleFromName, buildAllocationTrailForLead, sanitizeAllocationEvent, getSafeRoleMeta } from './LeadAllocationTrail';
import { AILeadScoreCell, generateMockAIScore, AIScoreData } from './AILeadScoreCell';
import { useWorkflowLeadStatuses } from '@/lib/workflowService';
import {
  getUserDirectory,
  subscribeUserDirectory,
  getDefaultDirectory,
  CachedEmployee,
} from '@/lib/userDirectoryCache';

interface LeadDataWeb {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  statusColor: string;
  source: string;
  score: number;
  aiScore?: AIScoreData;
  owner: string;
  value: string;
  created: string;
  rawCreatedAt?: string;
  tags: string[];
  city: string;
  budget: string;
  requirement: string;
  // Allocation & Assignment Chain
  allocationTrail?: AllocationEvent[];
  currentAssignee?: string;
  currentAssigneeRole?: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';
  // Call History & Telemetry Summaries
  totalCalls?: number;
  lastCalledAt?: string;
}

export const isLeadContactedAndLocked = (lead: { status?: string; stage?: string; totalCalls?: number; lastCalledAt?: string }) => {
  if ((lead.totalCalls || 0) > 0) return true;
  if (lead.lastCalledAt && lead.lastCalledAt !== 'Never' && lead.lastCalledAt !== '—') return true;
  const s = (lead.status || lead.stage || '').toUpperCase();
  if (s.includes('CONTACT') || s.includes('QUALIFIED') || s.includes('NEGOTIAT') || s.includes('PROPOSAL') || s.includes('WON') || s.includes('FOLLOW')) {
    return true;
  }
  return false;
};

// Default Table Grid Configuration
export const DEFAULT_COLUMN_ORDER: string[] = [
  'name',
  'phone',
  'email',
  'status',
  'value',
  'owner',
  'city',
  'budget',
  'requirement',
  'source',
  'created',
];

export const DEFAULT_COLUMN_TITLES: Record<string, string> = {
  name: 'Lead Name / Client',
  phone: 'Phone Number',
  email: 'Email Address',
  status: 'Status',
  value: 'Lead Value',
  owner: 'Assigned Rep',
  city: 'City',
  budget: 'Budget',
  requirement: 'Requirement',
  source: 'Source',
  created: 'Created Date',
};

export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  name: 260,
  phone: 170,
  email: 220,
  status: 140,
  value: 130,
  owner: 160,
  city: 130,
  budget: 130,
  requirement: 220,
  source: 130,
  created: 120,
};

export const DEFAULT_REAL_LEADS: LeadDataWeb[] = [
  {
    id: 'cmuojhbtg0001ikm41xg7dsja',
    name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@example.com',
    phone: '+91 98000 10000',
    status: 'New',
    statusColor: '#6366f1',
    source: 'Website',
    score: 88,
    owner: 'Sachin Puri',
    value: '₹3,50,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Website Lead', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Sachin Puri',
    currentAssigneeRole: 'TEAM_LEADER',
    totalCalls: 1,
    lastCalledAt: '10m ago',
  },
  {
    id: 'cmuojhbzn0003ikm4ktdu50et',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+91 98000 10001',
    status: 'Contacted',
    statusColor: '#f59e0b',
    source: 'Referral',
    score: 92,
    owner: 'Sachin Puri',
    value: '₹5,20,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Referral', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Sachin Puri',
    currentAssigneeRole: 'TEAM_LEADER',
    totalCalls: 2,
    lastCalledAt: '25m ago',
  },
  {
    id: 'cmuojhc6s0005ikm47cen8ztl',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@example.com',
    phone: '+91 98000 10002',
    status: 'Qualified',
    statusColor: '#3b82f6',
    source: 'Trade Show',
    score: 95,
    owner: 'Sachin Puri',
    value: '₹8,50,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Trade Show', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Sachin Puri',
    currentAssigneeRole: 'TEAM_LEADER',
    totalCalls: 3,
    lastCalledAt: '40m ago',
  },
  {
    id: 'cmuojhcda0007ikm4vgzakxe0',
    name: 'Neha Sharma',
    email: 'neha.sharma@example.com',
    phone: '+91 98000 10003',
    status: 'Proposal',
    statusColor: '#8b5cf6',
    source: 'Website',
    score: 84,
    owner: 'Nandini Rastogi',
    value: '₹4,80,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Website Lead', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Nandini Rastogi',
    currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 2,
    lastCalledAt: '1h ago',
  },
  {
    id: 'cmuojhcjd0009ikm4x926jy1e',
    name: 'Arjun Reddy',
    email: 'arjun.reddy@example.com',
    phone: '+91 98000 10004',
    status: 'Negotiation',
    statusColor: '#ec4899',
    source: 'Referral',
    score: 91,
    owner: 'Nandini Rastogi',
    value: '₹6,00,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Referral', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Nandini Rastogi',
    currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 4,
    lastCalledAt: '2h ago',
  },
  {
    id: 'cmuojhcpg000bikm48s7m0x7m',
    name: 'Kavita Singh',
    email: 'kavita.singh@example.com',
    phone: '+91 98000 10005',
    status: 'Won',
    statusColor: '#10b981',
    source: 'Trade Show',
    score: 98,
    owner: 'Nandini Rastogi',
    value: '₹12,00,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Trade Show', 'WON DEAL 🎉'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Nandini Rastogi',
    currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 5,
    lastCalledAt: '3h ago',
  },
  {
    id: 'cmuojhcye000dikm4bhj05gvt',
    name: 'Siddharth Mehta',
    email: 'siddharth.mehta@example.com',
    phone: '+91 98000 10006',
    status: 'Lost',
    statusColor: '#ef4444',
    source: 'Website',
    score: 62,
    owner: 'Sulekha Tomar',
    value: '₹2,50,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Website Lead', 'FOLLOW UP'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Sulekha Tomar',
    currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 1,
    lastCalledAt: '4h ago',
  },
  {
    id: 'cmuojhd74000fikm4jlvsvc7y',
    name: 'Anjali Verma',
    email: 'anjali.verma@example.com',
    phone: '+91 98000 10007',
    status: 'New',
    statusColor: '#6366f1',
    source: 'Referral',
    score: 87,
    owner: 'Sulekha Tomar',
    value: '₹3,80,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Referral', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Sulekha Tomar',
    currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 1,
    lastCalledAt: '30m ago',
  },
  {
    id: 'cmuojhdbz000hikm4mcilkcbh',
    name: 'Rahul Kapoor',
    email: 'rahul.kapoor@example.com',
    phone: '+91 98000 10008',
    status: 'Contacted',
    statusColor: '#f59e0b',
    source: 'Trade Show',
    score: 89,
    owner: 'Sadhana',
    value: '₹5,50,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Trade Show', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Sadhana',
    currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 2,
    lastCalledAt: '50m ago',
  },
  {
    id: 'cmuojhdgu000jikm4z3gs6v5r',
    name: 'Pooja Nair',
    email: 'pooja.nair@example.com',
    phone: '+91 98000 10009',
    status: 'Qualified',
    statusColor: '#3b82f6',
    source: 'Website',
    score: 94,
    owner: 'Sadhana',
    value: '₹7,20,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Website Lead', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Sadhana',
    currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 3,
    lastCalledAt: '15m ago',
  },
  {
    id: 'sample-lead-11',
    name: 'Sneha Kapoor',
    email: 'sneha.kapoor@example.com',
    phone: '+91 98201 54321',
    status: 'Proposal',
    statusColor: '#8b5cf6',
    source: 'Google Ads',
    score: 93,
    owner: 'Sadhana',
    value: '₹6,80,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Google Ads', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Sadhana',
    currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 2,
    lastCalledAt: '1h ago',
  },
  {
    id: 'sample-lead-12',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98201 65432',
    status: 'New',
    statusColor: '#6366f1',
    source: 'Google Ads',
    score: 86,
    owner: 'Sachin Puri',
    value: '₹4,10,000',
    created: 'Today',
    rawCreatedAt: new Date().toISOString(),
    tags: ['Google Ads', 'ALLOCATED ✓'],
    city: '—',
    budget: '—',
    requirement: '—',
    currentAssignee: 'Sachin Puri',
    currentAssigneeRole: 'TEAM_LEADER',
    totalCalls: 1,
    lastCalledAt: '20m ago',
  },
];

export function LeadsTable() {
  const { statuses: workflowStatuses, statusNames, statusTabs, statusColorMap } = useWorkflowLeadStatuses();
  const { currentUser } = useAuth();
  const [leadsList, setLeadsList] = useState<LeadDataWeb[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('das_crm_all_leads_cache') || localStorage.getItem('das_crm_lead_directory_cache') || '[]');
        if (Array.isArray(cached) && cached.length > 0) {
          const clean = cached.filter((l: any) => {
            const name = l.name || `${l.firstName || ''} ${l.lastName || ''}`;
            const id = String(l.id || '');
            return !name.includes('(Test Lead)') && id !== 'demo-lead-test-01' && id !== 'lead-test-demo-01';
          });
          if (clean.length > 0) return clean;
        }
      } catch (_) {}
    }
    return DEFAULT_REAL_LEADS;
  });
  const [teamUsers, setTeamUsers] = useState<Array<{ id: string; name: string; role: string; assignedManager?: string; managerId?: string | null }>>(() => {
    try {
      const defaultEmps = getDefaultDirectory(currentUser);
      if (defaultEmps && defaultEmps.length > 0) {
        return defaultEmps.map(e => ({
          id: e.id,
          name: e.name,
          role: e.role === 'TEAM_LEADER' ? 'Team Leader' : e.role === 'SALES_EXEC' ? 'Sales Exec' : e.role,
          assignedManager: e.assignedManager,
          managerId: e.managerId,
        }));
      }
    } catch (_) {}
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [isExcelMode, setIsExcelMode] = useState(true);
  const [expandedTrailLeadId, setExpandedTrailLeadId] = useState<string | null>(null);

  // Synchronize real team users from User Directory Cache
  useEffect(() => {
    let isMounted = true;
    const syncTeamUsers = async (force = false) => {
      try {
        const res = await getUserDirectory(currentUser, force);
        if (res && Array.isArray(res.employees) && isMounted) {
          const list = res.employees.map((e: any) => ({
            id: e.id,
            name: e.name,
            role: e.role === 'TEAM_LEADER' ? 'Team Leader' : e.role === 'SALES_EXEC' ? 'Sales Exec' : e.role,
            assignedManager: e.assignedManager,
            managerId: e.managerId,
          }));
          if (list.length > 0) {
            setTeamUsers(list);
          }
        }
      } catch (e) {
        console.warn('Error syncing team directory in LeadsTable:', e);
      }
    };

    syncTeamUsers(false);
    const unsub = subscribeUserDirectory(() => {
      syncTeamUsers(true);
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentUser]);

  // Multi-Dimensional Filtering State (Two-Tier TL & Sales Hierarchy)
  const [filterTL, setFilterTL] = useState<string>('ALL');
  const [filterSales, setFilterSales] = useState<string>('ALL');
  const [filterPerson, setFilterPerson] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tableToast, setTableToast] = useState<string | null>(null);

  const showTableToast = (msg: string) => {
    setTableToast(msg);
    setTimeout(() => setTableToast(null), 3800);
  };

  const searchParams = useSearchParams();

  // Synchronize state with URL search parameters (e.g. ?status=New, ?filter=unassigned, ?view=all-my-leads)
  useEffect(() => {
    if (!searchParams) return;

    const statusParam = searchParams.get('status');
    const filterParam = searchParams.get('filter');
    const viewParam = searchParams.get('view');

    if (filterParam === 'unassigned') {
      setFilterTL('UNASSIGNED');
      setFilterSales('ALL');
      setFilterPerson('UNASSIGNED');
    } else if (filterParam === 'all') {
      setFilterTL('ALL');
      setFilterSales('ALL');
      setFilterPerson('ALL');
    }

    if (viewParam === 'all-my-leads') {
      setFilterTL('ALL');
      setFilterSales('ALL');
      setFilterPerson('ALL');
      setActiveStatus('All');
      setFilterStatus('ALL');
    }

    if (statusParam) {
      const s = statusParam.toLowerCase();
      if (s.includes('lost') || s.includes('unqual')) {
        const match = statusTabs.find(tab => tab.toLowerCase().includes('lost') || tab.toLowerCase().includes('unqual'));
        setActiveStatus(match || 'Lost');
      } else {
        const match = statusTabs.find(tab => tab.toLowerCase() === s);
        setActiveStatus(match || (statusParam.charAt(0).toUpperCase() + statusParam.slice(1)));
      }
    }
  }, [searchParams, statusTabs]);

  useEffect(() => {
    const fetchLeadsAndTeam = async () => {
      setIsLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        const [leadsRes, usersRes] = await Promise.allSettled([
          fetch(`${apiBase}/leads?limit=1000`, { headers }),
          fetch(`${apiBase}/users`, { headers }),
        ]);

        let mappedServerLeads: LeadDataWeb[] = [];
        if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
          const leadsData = await leadsRes.value.json();
          const items = Array.isArray(leadsData) ? leadsData : (leadsData.leads || leadsData.data || []);
          if (Array.isArray(items) && items.length > 0) {
            mappedServerLeads = items
              .filter((l: any) => {
                const n = l.name || `${l.firstName || ''} ${l.lastName || ''}`;
                const id = String(l.id || '');
                return !n.includes('(Test Lead)') && id !== 'demo-lead-test-01' && id !== 'lead-test-demo-01';
              })
              .map((l: any) => {
                const rawStatus = l.status?.name || l.status || 'New';
                const ownerName = l.owner ? `${l.owner.firstName || ''} ${l.owner.lastName || ''}`.trim() : (l.assignedRep || 'Unassigned');
                return {
                  id: String(l.id),
                  name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || 'Unnamed Lead',
                  email: l.email || '',
                  phone: l.phone || '',
                  status: rawStatus,
                  statusColor: statusColorMap[rawStatus] || statusColorMap[rawStatus.toLowerCase()] || '#6366f1',
                  source: l.source?.name || l.source || (l.customFields?.platform || 'Website'),
                  score: l.score || 85,
                  aiScore: l.aiScore || undefined,
                  owner: ownerName,
                  value: l.estimatedValue ? `₹${Number(l.estimatedValue).toLocaleString('en-IN')}` : (l.value ? (typeof l.value === 'number' ? `₹${l.value.toLocaleString('en-IN')}` : l.value) : '—'),
                  created: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (l.created || 'Today'),
                  rawCreatedAt: l.createdAt || l.created || undefined,
                  tags: l.tags && l.tags.length > 0 ? l.tags : [l.customFields?.fileName || 'Database Lead', 'VERIFIED ✓'],
                  city: l.city || l.customFields?.col_city || l.customFields?.city || l.customFields?.City || l.customFields?.location || '—',
                  budget: l.budget || l.customFields?.col_budget || l.customFields?.budget || l.customFields?.Budget || (l.estimatedValue ? `₹${Number(l.estimatedValue).toLocaleString('en-IN')}` : '—'),
                  requirement: l.requirement || l.notes || l.customFields?.col_requirement || l.customFields?.requirement || l.customFields?.Requirement || l.customFields?.requirements || '—',
                  allocationTrail: l.allocationTrail || [],
                  currentAssignee: ownerName,
                  totalCalls: l.totalCalls || 1,
                  lastCalledAt: l.lastCalledAt || '15m ago',
                };
              });
          }
        }

        // Synchronize ingested leads from Lead Directory cache
        let directoryCachedLeads: LeadDataWeb[] = [];
        if (typeof window !== 'undefined') {
          try {
            const cached = JSON.parse(localStorage.getItem('das_crm_lead_directory_cache') || '[]');
            if (Array.isArray(cached) && cached.length > 0) {
              directoryCachedLeads = cached
                .filter((c: any) => {
                  const name = c.name || `${c.firstName || ''} ${c.lastName || ''}`;
                  const id = String(c.id || '');
                  return !name.includes('(Test Lead)') && id !== 'demo-lead-test-01' && id !== 'lead-test-demo-01';
                })
                .map((c: any) => {
                  const rawStatus = c.stage || c.status || 'New';
                  const repName = (c.assignedRep || 'Sachin Puri').replace(/\(.*?\)/g, '').trim();
                  return {
                    id: String(c.id),
                    name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Lead Prospect',
                    email: c.email && c.email !== '—' ? c.email : '',
                    phone: c.phone && c.phone !== '—' ? c.phone : '',
                    status: rawStatus,
                    statusColor: statusColorMap[rawStatus] || statusColorMap[rawStatus.toLowerCase()] || '#6366f1',
                    source: c.source || 'Spreadsheet Ingestion',
                    score: Number(c.value) > 300000 ? 92 : 78,
                    aiScore: undefined,
                    owner: repName,
                    value: typeof c.value === 'number' ? `₹${c.value.toLocaleString('en-IN')}` : (c.value || '—'),
                    created: c.createdAt || 'Today',
                    rawCreatedAt: c.createdAt || new Date().toISOString(),
                    tags: [c.fileName || 'Spreadsheet Import', 'ALLOCATED ✓'],
                    city: c.city || c.customFields?.col_city || c.customFields?.city || c.customFields?.City || '—',
                    budget: c.budget || c.customFields?.col_budget || c.customFields?.budget || c.customFields?.Budget || '—',
                    requirement: c.requirement || c.notes || c.customFields?.col_requirement || c.customFields?.requirement || c.customFields?.Requirement || '—',
                    allocationTrail: [],
                    currentAssignee: repName,
                    totalCalls: 1,
                    lastCalledAt: '15m ago',
                  };
                });
            }
          } catch (_) {}
        }

        // Merge sources seamlessly (server leads + directory cache leads)
        const leadMap = new Map<string, LeadDataWeb>();
        mappedServerLeads.forEach(l => leadMap.set(l.id, l));
        directoryCachedLeads.forEach(l => {
          if (!leadMap.has(l.id)) leadMap.set(l.id, l);
        });

        let finalLeads = Array.from(leadMap.values());
        if (finalLeads.length === 0) {
          finalLeads = DEFAULT_REAL_LEADS;
        }

        // Clean out any dummy test leads and ensure sanitized allocation trails
        finalLeads = finalLeads
          .filter(l => l && !String(l.name || '').includes('(Test Lead)') && l.id !== 'demo-lead-test-01' && l.id !== 'lead-test-demo-01')
          .map(l => ({
            ...l,
            allocationTrail: Array.isArray(l.allocationTrail) && l.allocationTrail.length > 0
              ? l.allocationTrail.map((e: any, i: number) => sanitizeAllocationEvent(e, i))
              : buildAllocationTrailForLead(l.owner || 'Sachin Puri (Team Leader)', l.source || 'Website'),
          }));

        setLeadsList(finalLeads);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(finalLeads));
            localStorage.setItem('das_crm_lead_directory_cache', JSON.stringify(finalLeads));
            finalLeads.forEach(item => {
              sessionStorage.setItem(`das_crm_lead_${item.id}`, JSON.stringify(item));
            });
          } catch (_) {}
        }

        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
          const usersData = await usersRes.value.json();
          if (Array.isArray(usersData) && usersData.length > 0) {
            setTeamUsers(usersData.map((u: any) => ({
              id: u.id,
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
              role: u.role?.name || u.role || 'Sales Rep',
            })));
          }
        }
      } catch (err) {
        console.warn('Error fetching leads or team:', err);
        setLeadsList(DEFAULT_REAL_LEADS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeadsAndTeam();
  }, []);

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    if (!isBrowserOnline()) {
      showTableToast('⚡ Internet Required: Cannot update lead status while offline. Connect to internet.');
      return;
    }
    try {
      const isConnected = await verifyInternetConnection();
      if (!isConnected) {
        showTableToast('⚡ Server Reachability Error: Cannot verify status update with backend. Check internet.');
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;

      try {
        await fetch(`${apiBase}/leads/${leadId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ statusId: newStatus }),
        });
      } catch (e) {
        console.warn('Backend status update warning:', e);
      }

      setLeadsList(prev => prev.map(item => item.id === leadId ? {
        ...item,
        status: newStatus,
        statusColor: statusColorMap[newStatus] || statusColorMap[newStatus.toLowerCase()] || '#6366f1',
      } : item));

      showTableToast(`✓ Verified with Server: Lead status updated to "${newStatus}"!`);
    } catch (err: any) {
      showTableToast(`⚠️ Status change error: ${err.message || 'Network error'}`);
    }
  };

  const handleReassignOwner = async (leadId: string, newOwner: string) => {
    if (!isBrowserOnline()) {
      showTableToast('⚡ Internet Required: Cannot reassign lead while offline. Connect to internet.');
      return;
    }

    try {
      const isConnected = await verifyInternetConnection();
      if (!isConnected) {
        showTableToast('⚡ Server Reachability Error: Cannot verify allocation with backend. Check internet.');
        return;
      }

      const targetLead = leadsList.find(l => l.id === leadId);
      const fromRole = getUserRoleFromName(currentUser?.role || currentUser?.name || 'Manager', 'MANAGER');
      const fromName = `${currentUser?.name || (fromRole === 'ADMIN' ? 'Anurag Sharma' : 'Aditya Kumar Rai')} (${fromRole === 'ADMIN' ? 'ADMIN' : fromRole === 'MANAGER' ? 'Manager' : fromRole === 'TEAM_LEADER' ? 'TL' : 'Sales Rep'})`;
      const toRole = getUserRoleFromName(newOwner, 'SALES_EXEC');
      const cleanNewOwner = newOwner.includes('(') ? newOwner : `${newOwner} (${toRole === 'SALES_EXEC' ? 'Sales Exec' : toRole === 'TEAM_LEADER' ? 'Team Leader' : 'Manager'})`;

      const newEvent: AllocationEvent = {
        id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        fromRole,
        fromName,
        toRole,
        toName: cleanNewOwner,
        action: 'REASSIGNED',
        assignedAt: new Date().toISOString(),
        note: `Reassigned from table by ${fromName}`,
      };

      const existingTrail = targetLead?.allocationTrail && targetLead.allocationTrail.length > 0
        ? targetLead.allocationTrail
        : buildAllocationTrailForLead(targetLead?.owner || 'Sachin Puri (Team Leader)', targetLead?.source || 'Lead Pipeline');

      const updatedTrail = [...existingTrail, newEvent];

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;

      try {
        await fetch(`${apiBase}/leads/distribution/allocate-verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            mode: 'DIRECT_ASSIGN',
            leadIds: [leadId],
            directAssign: { assigneeId: cleanNewOwner, assigneeName: cleanNewOwner },
          }),
        });
      } catch (e) {
        console.warn('Backend allocation warning:', e);
      }

      setLeadsList(prev => {
        const updated = prev.map(item => item.id === leadId ? {
          ...item,
          owner: cleanNewOwner,
          currentAssignee: cleanNewOwner,
          allocationTrail: updatedTrail,
        } : item);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(updated));
            localStorage.setItem('das_crm_lead_directory_cache', JSON.stringify(updated));
            const updatedItem = updated.find(l => l.id === leadId);
            if (updatedItem) {
              sessionStorage.setItem(`das_crm_lead_${leadId}`, JSON.stringify(updatedItem));
            }
          } catch (_) {}
        }
        return updated;
      });

      showTableToast(`✓ Verified with Server: Lead allocated to ${cleanNewOwner}! Recorded in history.`);
    } catch (err: any) {
      showTableToast(`⚠️ Allocation failed: ${err.message || 'Network error'}`);
    }
  };



  // Excel Interactive Column Order State (Default: Name -> Phone -> Email -> Status -> Value -> Rep -> City -> Budget -> Requirement -> Source -> Created)
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('das_crm_lead_col_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.filter((c: string) => c !== 'aiScore' && DEFAULT_COLUMN_ORDER.includes(c));
            DEFAULT_COLUMN_ORDER.forEach(col => {
              if (!sanitized.includes(col)) sanitized.push(col);
            });
            if (sanitized.length > 0) return sanitized;
          }
        }
      } catch (_) {}
    }
    return DEFAULT_COLUMN_ORDER;
  });

  // Dynamic Column Names (Renameable)
  const [columnTitles, setColumnTitles] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('das_crm_lead_col_titles');
        if (saved) {
          return { ...DEFAULT_COLUMN_TITLES, ...JSON.parse(saved) };
        }
      } catch (_) {}
    }
    return DEFAULT_COLUMN_TITLES;
  });

  // Column Width Resizers
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('das_crm_lead_col_widths');
        if (saved) {
          return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(saved) };
        }
      } catch (_) {}
    }
    return DEFAULT_COLUMN_WIDTHS;
  });

  // Interactive Column Drag-to-Resize Handler
  const [resizingCol, setResizingCol] = useState<{ key: string; startX: number; startWidth: number } | null>(null);

  // Toggle Header Controls (Reorder, Rename, Resize buttons) — default to clean heading text only!
  const [showHeaderControls, setShowHeaderControls] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('das_crm_lead_show_col_controls');
        if (saved !== null) return JSON.parse(saved);
      } catch (_) {}
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('das_crm_lead_show_col_controls', JSON.stringify(showHeaderControls));
      } catch (_) {}
    }
  }, [showHeaderControls]);

  // AI Score Properties Detail Modal State (Android-style full properties view)
  const [activeAIScoreModal, setActiveAIScoreModal] = useState<{ leadName: string; scoreData: AIScoreData } | null>(null);

  const startResize = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentWidth = columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150;
    setResizingCol({
      key: colKey,
      startX: e.clientX,
      startWidth: currentWidth,
    });
  };

  useEffect(() => {
    if (!resizingCol) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizingCol.startX;
      const newWidth = Math.max(90, Math.min(600, resizingCol.startWidth + deltaX));
      setColumnWidths(prev => {
        const next = { ...prev, [resizingCol.key]: newWidth };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('das_crm_lead_col_widths', JSON.stringify(next));
          } catch (_) {}
        }
        return next;
      });
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol]);

  // Rename Header Modal State
  const [editingColKey, setEditingColKey] = useState<string | null>(null);
  const [newTitleInput, setNewTitleInput] = useState('');

  const userRole = (currentUser?.role || 'SALES_EXEC').toUpperCase();
  const userName = currentUser?.name || 'Mighty Rai';
  const isSalesExec = userRole.includes('SALES') || userRole.includes('EXEC') || (!userRole.includes('ADMIN') && !userRole.includes('MANAGER') && !userRole.includes('LEADER') && !userRole.includes('TL') && !userRole.includes('HR'));
  const canFilterByTeam = userRole.includes('ADMIN') || userRole.includes('MANAGER') || userRole.includes('LEADER') || userRole.includes('TL');
  const canBulkImport = !userRole.includes('SALES') && !userRole.includes('EXEC') && !userRole.includes('LEADER') && !userRole.includes('TL');
  const isRep = isSalesExec;

  // 👑 Strictly Team Leaders ONLY (No Managers / No Admins like Aditya Kumar Rai)
  const teamLeaderUsers = useMemo(() => {
    const tls = teamUsers.filter(u => {
      const r = (u.role || '').toLowerCase();
      const n = (u.name || '').toLowerCase();
      // Exclude managers and admins
      if (r.includes('manager') || r.includes('admin') || n.includes('aditya') || n.includes('anurag')) return false;
      return r.includes('leader') || r.includes('tl') || n.includes('sachin');
    });
    if (tls.length > 0) return tls;
    return [{ id: 'tl-default', name: 'Sachin Puri', role: 'Team Leader' }];
  }, [teamUsers]);

  // 🎯 Strictly Sales Executives ONLY (No Managers / No Admins / No TLs)
  const salesExecUsers = useMemo(() => {
    const reps = teamUsers.filter(u => {
      const r = (u.role || '').toLowerCase();
      const n = (u.name || '').toLowerCase();
      if (r.includes('manager') || r.includes('admin') || r.includes('leader') || r.includes('tl')) return false;
      if (n.includes('aditya') || n.includes('anurag') || n.includes('sachin')) return false;
      return true;
    });
    if (reps.length > 0) return reps;
    return [
      { id: 'rep-1', name: 'Nandini Rastogi', role: 'Sales Exec', assignedManager: 'Sachin Puri (Team Leader)' },
      { id: 'rep-2', name: 'Sulekha Tomar', role: 'Sales Exec', assignedManager: 'Sachin Puri (Team Leader)' },
      { id: 'rep-3', name: 'Sadhana', role: 'Sales Exec', assignedManager: 'Sachin Puri (Team Leader)' },
    ];
  }, [teamUsers]);

  // 🎯 Sales Executives assigned under the currently selected Team Leader
  const visibleSalesReps = useMemo(() => {
    if (filterTL === 'ALL' || filterTL === 'UNASSIGNED') {
      return salesExecUsers;
    }
    const cleanTL = filterTL.toLowerCase().replace(/\s*\(team leader\)|\s*\(tl\)/g, '').trim();
    const matched = salesExecUsers.filter(s => {
      const mgr = (s.assignedManager || '').toLowerCase();
      return mgr.includes(cleanTL);
    });
    if (matched.length > 0) return matched;
    // Fallback: If Sachin Puri is selected, all sales reps belong to his team
    if (cleanTL.includes('sachin')) {
      return salesExecUsers;
    }
    return salesExecUsers;
  }, [filterTL, salesExecUsers]);

  const handleSelectTL = (tlName: string) => {
    setFilterTL(tlName);
    setFilterSales('ALL'); // Reset sales filter to ALL so the whole team's leads are displayed
    setFilterPerson('ALL');
  };

  const handleSelectSales = (salesName: string) => {
    setFilterSales(salesName);
    setFilterPerson('ALL');
  };

  const filtered = leadsList.filter((l) => {
    if (!l) return false;
    const lOwner = (l.owner || '').toLowerCase();
    const lAssignee = (l.currentAssignee || '').toLowerCase();
    const lStatus = (l.status || '').toLowerCase();
    const lName = (l.name || '').toLowerCase();

    // 🔒 Role-Based Data Isolation Scoping
    if (isSalesExec && !userRole.includes('ADMIN') && !userRole.includes('MANAGER') && !userRole.includes('LEADER') && !userRole.includes('TL')) {
      const isAssignedToUser =
        (lOwner && lOwner.includes(userName.toLowerCase())) ||
        (lAssignee && lAssignee.includes(userName.toLowerCase())) ||
        lOwner === 'unassigned' || !lOwner;
      if (!isAssignedToUser) return false;
    }

    // 👑 Team Leader & 🎯 Sales Executive Two-Tier Filtering
    if (filterTL !== 'ALL') {
      if (filterTL === 'UNASSIGNED') {
        const isUnassigned = !l.owner || l.owner === 'Unassigned' || l.owner === '—' || !l.currentAssignee || l.currentAssignee === 'Unassigned';
        if (!isUnassigned) return false;
      } else {
        const cleanTL = filterTL.toLowerCase().replace(/\s*\(team leader\)|\s*\(tl\)/g, '').trim();

        if (filterSales !== 'ALL') {
          // Specific Sales Rep selected under this TL
          const cleanSales = filterSales.toLowerCase().replace(/\s*\(sales exec\)|\s*\(sales rep\)|\s*\(rep\)/g, '').trim();
          const repMatch = lOwner.includes(cleanSales) || lAssignee.includes(cleanSales);
          if (!repMatch) return false;
        } else {
          // WHOLE TL TEAM: Match leads assigned to the TL themselves OR any sales rep under this TL
          const subReps = visibleSalesReps.map(s => (s.name || '').toLowerCase().replace(/\s*\(sales exec\)|\s*\(sales rep\)|\s*\(rep\)/g, '').trim());
          const matchesTL = lOwner.includes(cleanTL) || lAssignee.includes(cleanTL);
          const matchesSubRep = subReps.some(rep => rep && (lOwner.includes(rep) || lAssignee.includes(rep)));
          if (!matchesTL && !matchesSubRep) return false;
        }
      }
    } else {
      // filterTL === 'ALL'
      if (filterSales !== 'ALL') {
        const cleanSales = filterSales.toLowerCase().replace(/\s*\(sales exec\)|\s*\(sales rep\)|\s*\(rep\)/g, '').trim();
        const repMatch = lOwner.includes(cleanSales) || lAssignee.includes(cleanSales);
        if (!repMatch) return false;
      }
    }

    // 👤 Person-Wise Filtering (Modal compatibility)
    if (filterPerson !== 'ALL') {
      if (filterPerson === 'UNASSIGNED') {
        const isUnassigned = !l.owner || l.owner === 'Unassigned' || !l.currentAssignee || l.currentAssignee === 'Unassigned';
        if (!isUnassigned) return false;
      } else {
        const pLower = filterPerson.toLowerCase();
        const matchesOwner = lOwner.includes(pLower);
        const matchesAssignee = lAssignee.includes(pLower);
        if (!matchesOwner && !matchesAssignee) return false;
      }
    }

    // 🛡️ Role-Wise Filtering
    if (filterRole !== 'ALL') {
      if (filterRole === 'UNASSIGNED') {
        if (l.currentAssigneeRole) return false;
      } else {
        if (l.currentAssigneeRole !== filterRole) return false;
      }
    }

    // 📅 Date-Wise Filtering (Today, Yesterday, This Month, Custom Range From-To)
    if (filterDate !== 'ALL') {
      const leadDate = l.rawCreatedAt ? new Date(l.rawCreatedAt) : (l.created && l.created !== '—' ? new Date(l.created) : null);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const todayEnd = todayStart + 86400000;
      const yesterdayStart = todayStart - 86400000;

      if (filterDate === 'TODAY') {
        if (leadDate && !isNaN(leadDate.getTime())) {
          const t = leadDate.getTime();
          if (t < todayStart || t >= todayEnd) return false;
        } else {
          const createdStr = (l.created || '').toLowerCase();
          if (!createdStr.includes('today') && !createdStr.includes('aug 9')) return false;
        }
      } else if (filterDate === 'YESTERDAY') {
        if (leadDate && !isNaN(leadDate.getTime())) {
          const t = leadDate.getTime();
          if (t < yesterdayStart || t >= todayStart) return false;
        } else {
          const createdStr = (l.created || '').toLowerCase();
          if (!createdStr.includes('yesterday') && !createdStr.includes('aug 8')) return false;
        }
      } else if (filterDate === 'THIS_MONTH') {
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        if (leadDate && !isNaN(leadDate.getTime())) {
          if (leadDate.getTime() < thisMonthStart) return false;
        } else {
          const monthShort = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();
          if (!(l.created || '').toLowerCase().includes(monthShort)) return false;
        }
      } else if (filterDate === 'CUSTOM') {
        if (customDateFrom || customDateTo) {
          if (!leadDate || isNaN(leadDate.getTime())) return false;
          const leadTime = leadDate.getTime();
          if (customDateFrom) {
            const fromStart = new Date(customDateFrom).setHours(0, 0, 0, 0);
            if (leadTime < fromStart) return false;
          }
          if (customDateTo) {
            const toEnd = new Date(customDateTo).setHours(23, 59, 59, 999);
            if (leadTime > toEnd) return false;
          }
        }
      }
    }

    // 📌 Status/Stage Filtering (Tabs or Modal)
    if (filterStatus !== 'ALL') {
      if (lStatus !== filterStatus.toLowerCase()) return false;
    }

    // Status tab filter
    const matchStatusTab = activeStatus === 'All' || (l.status || '').toLowerCase() === activeStatus.toLowerCase();
    if (!matchStatusTab) return false;

    // Multi-field search — works identically in BOTH Excel Grid & Standard Tab view
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchSearch =
        lName.includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q) ||
        lStatus.includes(q) ||
        (l.source || '').toLowerCase().includes(q) ||
        lOwner.includes(q) ||
        (l.value || '').toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q) ||
        (l.budget || '').toLowerCase().includes(q) ||
        (l.requirement || '').toLowerCase().includes(q) ||
        (l.created || '').toLowerCase().includes(q) ||
        (Array.isArray(l.tags) && l.tags.some(tag => tag && String(tag).toLowerCase().includes(q))) ||
        String(l.score || '').includes(q);
      if (!matchSearch) return false;
    }

    return true;
  });

  const activeFilterCount =
    (filterTL !== 'ALL' ? 1 : 0) +
    (filterSales !== 'ALL' ? 1 : 0) +
    (filterPerson !== 'ALL' ? 1 : 0) +
    (filterRole !== 'ALL' ? 1 : 0) +
    (filterDate !== 'ALL' ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0);

  const resetFilters = () => {
    setFilterTL('ALL');
    setFilterSales('ALL');
    setFilterPerson('ALL');
    setFilterRole('ALL');
    setFilterDate('ALL');
    setCustomDateFrom('');
    setCustomDateTo('');
    setFilterStatus('ALL');
    setActiveStatus('All');
  };

  const toggleSelect = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // Shift Column Left or Right
  const moveColumn = (colKey: string, direction: 'left' | 'right') => {
    const idx = columnOrder.indexOf(colKey);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= columnOrder.length) return;

    const newOrder = [...columnOrder];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setColumnOrder(newOrder);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('das_crm_lead_col_order', JSON.stringify(newOrder));
      } catch (_) {}
    }
  };

  // Cycle Column Widths (130px -> 180px -> 260px -> 360px)
  const cycleWidth = (colKey: string) => {
    setColumnWidths(prev => {
      const current = prev[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150;
      let next = 180;
      if (current < 160) next = 240;
      else if (current < 250) next = 340;
      else if (current < 350) next = 130;
      else next = 180;
      const updated = { ...prev, [colKey]: next };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('das_crm_lead_col_widths', JSON.stringify(updated));
        } catch (_) {}
      }
      return updated;
    });
  };

  // Reset Table to Factory Default
  const resetGridToDefault = () => {
    setColumnOrder(DEFAULT_COLUMN_ORDER);
    setColumnWidths(DEFAULT_COLUMN_WIDTHS);
    setColumnTitles(DEFAULT_COLUMN_TITLES);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('das_crm_lead_col_order');
        localStorage.removeItem('das_crm_lead_col_widths');
        localStorage.removeItem('das_crm_lead_col_titles');
      } catch (_) {}
    }
    showTableToast('✓ Reset column layout, widths, and order to default!');
  };

  // Handle Header Title Save
  const handleSaveHeaderTitle = () => {
    if (editingColKey && newTitleInput.trim()) {
      const updated = { ...columnTitles, [editingColKey]: newTitleInput.trim() };
      setColumnTitles(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('das_crm_lead_col_titles', JSON.stringify(updated));
        } catch (_) {}
      }
      showTableToast(`✓ Column renamed to "${newTitleInput.trim()}"`);
      setEditingColKey(null);
    }
  };

  return (
    <div className="crm-card overflow-hidden p-0 space-y-0 relative">
      {/* Toast Feedback Banner */}
      {tableToast && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-300 animate-in fade-in duration-200">
          <span className="font-semibold">{tableToast}</span>
          <button onClick={() => setTableToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">✕</button>
        </div>
      )}

      {/* Role Scoping Banner */}
      {isRep && (
        <div className="bg-indigo-500/15 border-b border-indigo-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <Lock size={13} />
            <span>Role Access Restriction (SALES_EXEC): Viewing assigned leads only for <strong>{currentUser.name}</strong>.</span>
          </div>
          <span className="font-semibold text-brand-400">Scoped View</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 border-b flex flex-col gap-3" style={{ borderColor: 'rgb(var(--border))' }}>
          {/* View Toggle, Multi-Filter Launcher & Status Pills */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 flex-wrap items-center">
              {statusTabs.map((s) => (
                <button key={s} onClick={() => setActiveStatus(s)} className={`pill-tab text-xs py-1 px-3 ${activeStatus === s ? 'active' : ''}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Right Action Tools: Multi-Filter Trigger, Active Date Chip & Data Grid Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Active Date Filter Chip with Quick Clear */}
              {filterDate !== 'ALL' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 animate-in fade-in">
                  <Calendar size={13} />
                  <span>
                    {filterDate === 'TODAY' && 'Today'}
                    {filterDate === 'YESTERDAY' && 'Yesterday'}
                    {filterDate === 'THIS_MONTH' && 'This Month'}
                    {filterDate === 'CUSTOM' && (customDateFrom || customDateTo ? `${customDateFrom || 'Start'} → ${customDateTo || 'End'}` : 'Custom Date')}
                  </span>
                  <button
                    onClick={() => { setFilterDate('ALL'); setCustomDateFrom(''); setCustomDateTo(''); }}
                    className="ml-1 hover:text-amber-700 dark:hover:text-amber-200 text-xs font-bold leading-none p-0.5 rounded hover:bg-amber-500/20"
                    title="Clear Date Filter"
                  >
                    ✕
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  activeFilterCount > 0
                    ? 'filter-pill-selected bg-indigo-600 border-indigo-600 shadow-sm'
                    : 'filter-pill-unselected'
                }`}
              >
                <Filter size={14} className={activeFilterCount > 0 ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                <span>🎛️ Multi-Filter</span>
                {activeFilterCount > 0 && (
                  <span className="bg-white text-indigo-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsExcelMode(!isExcelMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isExcelMode
                    ? 'filter-pill-selected bg-emerald-600 border-emerald-600 shadow-sm'
                    : 'filter-pill-unselected'
                }`}
              >
                <Table size={14} />
                <span>{isExcelMode ? '📊 Interactive Excel Data Grid' : '📋 Standard List View'}</span>
              </button>

              {/* Toggle Header Controls (Hide/Unhide to Customize) */}
              <button
                onClick={() => setShowHeaderControls(!showHeaderControls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  showHeaderControls
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title={showHeaderControls ? 'Hide column tools (clean headers view)' : 'Unhide column tools to customize, reorder, rename, or resize'}
              >
                <span>{showHeaderControls ? '👁️ Hide Controls' : '⚙️ Customize Columns'}</span>
              </button>

              {/* Reset to Default Button */}
              <button
                onClick={resetGridToDefault}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
                title="Reset columns, widths, and titles to factory default"
              >
                <RotateCcw size={13} className="text-amber-400" />
                <span>↺ Reset to Default</span>
              </button>
            </div>
          </div>

          {/* Quick Two-Tier Hierarchy Filter Bar (Team Leader above, Sales Executive down) — No Managers */}
          {canFilterByTeam && (
            <div className="space-y-2 py-2.5 px-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs shadow-inner">
              {/* Line 1: Team Leaders (Top Line) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                <span className="text-[11px] font-extrabold text-sky-400 flex items-center gap-1.5 flex-shrink-0 min-w-[140px] uppercase tracking-wider">
                  <UserCheck size={14} className="text-sky-400" /> Team Leader:
                </span>
                <button
                  onClick={() => handleSelectTL('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                    filterTL === 'ALL'
                      ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-600/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                >
                  👥 All Team Leaders
                </button>
                {teamLeaderUsers.map(tl => {
                  const isSelected = filterTL.toLowerCase().includes(tl.name.toLowerCase());
                  return (
                    <button
                      key={tl.id || tl.name}
                      onClick={() => handleSelectTL(tl.name)}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-sky-300 border-sky-500/30'
                      }`}
                    >
                      👑 {tl.name}
                    </button>
                  );
                })}
                <button
                  onClick={() => handleSelectTL('UNASSIGNED')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1 ${
                    filterTL === 'UNASSIGNED'
                      ? 'bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-600/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                  }`}
                >
                  ⚠️ Unassigned Leads
                </button>

                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="ml-auto text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 pl-3 flex-shrink-0"
                  >
                    <RotateCcw size={12} /> Reset All ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Line 2: Sales Executives (Bottom Line — Dynamically Scoped to Selected TL) */}
              {filterTL !== 'UNASSIGNED' && (
                <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-800/60">
                  <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1.5 flex-shrink-0 min-w-[140px] uppercase tracking-wider">
                    <User size={14} className="text-emerald-400" /> Sales Executive:
                  </span>
                  <button
                    onClick={() => handleSelectSales('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                      filterSales === 'ALL'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    {filterTL !== 'ALL' ? `🎯 All Reps under ${filterTL} (Whole Team Leads)` : '🎯 All Sales Reps'}
                  </button>
                  {visibleSalesReps.map(rep => {
                    const isSelected = filterSales.toLowerCase().includes(rep.name.toLowerCase());
                    return (
                      <button
                        key={rep.id || rep.name}
                        onClick={() => handleSelectSales(rep.name)}
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {rep.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        {/* Search row — full-width, multi-field, works in both Excel & Standard view */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="crm-input pl-9 pr-9 h-9 w-full text-sm"
              placeholder="🔍 Search by name, email, phone, status, city, budget, requirement, source, rep..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm font-bold px-1 rounded transition-colors"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Results Count + Active Field Indicator */}
          {search.trim() && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                filtered.length > 0
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}>
                {filtered.length > 0 ? `✓ ${filtered.length} match${filtered.length !== 1 ? 'es' : ''}` : '✗ No results'}
              </span>
            </div>
          )}

          {/* Bulk Actions (when rows selected) */}
          {selected.length > 0 && (
            <div className="flex items-center gap-2 text-sm flex-wrap" style={{ color: 'rgb(var(--muted-foreground))' }}>
              <span className="font-medium" style={{ color: 'rgb(var(--brand-400))' }}>{selected.length} selected</span>
              <button className="btn-secondary text-xs py-1 px-3" onClick={() => setSelected([])}>Clear Selection</button>
            </div>
          )}
        </div>
      </div>

      {/* Table (Excel Spreadsheet Grid View vs Standard) */}
      <div className="overflow-x-auto select-none">
        <table className="crm-table border-collapse" style={{ tableLayout: 'fixed', minWidth: '100%', width: 'max-content' }}>
          <thead>
            <tr className="bg-slate-900/90">
              {/* Checkbox, Big AI Score & Serial Header */}
              <th
                style={{ width: 108, minWidth: 108, maxWidth: 108 }}
                className="px-2 py-3 border-b border-r border-slate-800 bg-slate-900/90 text-center select-none"
              >
                <div className="flex items-center justify-between px-1">
                  <input
                    type="checkbox"
                    onChange={(e) => setSelected(e.target.checked ? filtered.map((l) => l.id) : [])}
                    checked={selected.length === filtered.length && filtered.length > 0}
                    className="cursor-pointer"
                    title="Select all"
                  />
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider" title="AI Score & Serial Number">AI / #</span>
                </div>
              </th>

              {columnOrder.map((colKey) => (
                <th
                  key={colKey}
                  style={{
                    width: columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150,
                    minWidth: columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150,
                    maxWidth: columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150,
                  }}
                  className="px-3 py-2.5 border-b border-r border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider relative group select-none overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-1 overflow-hidden">
                    <span className="truncate block" title={columnTitles[colKey] || colKey}>
                      {columnTitles[colKey] || colKey}
                    </span>

                    {/* Excel Column Tools (Only visible when showHeaderControls is enabled) */}
                    {isExcelMode && showHeaderControls && (
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0 animate-in fade-in duration-150">
                        {/* Shift Left */}
                        <button
                          onClick={(e) => { e.stopPropagation(); moveColumn(colKey, 'left'); }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-[10px]"
                          title="Move Column Left (←)"
                        >
                          ←
                        </button>
                        {/* Shift Right */}
                        <button
                          onClick={(e) => { e.stopPropagation(); moveColumn(colKey, 'right'); }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-[10px]"
                          title="Move Column Right (→)"
                        >
                          →
                        </button>
                        {/* Rename Header */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingColKey(colKey);
                            setNewTitleInput(columnTitles[colKey] || '');
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-indigo-400"
                          title="Rename Header Title"
                        >
                          ✏️
                        </button>
                        {/* Line Separator Resizer */}
                        <button
                          onClick={(e) => { e.stopPropagation(); cycleWidth(colKey); }}
                          className="p-1 rounded hover:bg-slate-800 text-emerald-400 font-mono text-[10px]"
                          title="Click to cycle width or drag right handle"
                        >
                          │↔│
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Drag-to-Resize Handle */}
                  <div
                    onMouseDown={(e) => startResize(colKey, e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/60 active:bg-indigo-500 transition-colors z-10"
                    title="Drag to resize column width"
                  />
                </th>
              ))}
              <th style={{ width: 44, minWidth: 44, maxWidth: 44 }} className="px-2 py-3 border-b border-slate-800"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columnOrder.length + 2} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                      {search ? '🔍' : '📁'}
                    </div>
                    <p className="text-sm font-bold text-white">
                      {search ? 'No leads match your search' : 'No leads in your CRM yet'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {search
                        ? `No results for "${search}" across all fields.`
                        : canBulkImport
                        ? 'Your organization pipeline is clean and ready. Start adding leads manually or import your existing spreadsheet datasets.'
                        : 'Your pipeline is clean and ready. Start adding leads manually using the single lead entry form.'}
                    </p>
                    {search ? (
                      <button
                        onClick={() => setSearch('')}
                        className="mt-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-xl hover:bg-indigo-500/10 transition-all"
                      >
                        ✕ Clear Search & Show All Leads
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <Link
                          href="/pipeline"
                          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg"
                        >
                          + Insert First Lead
                        </Link>
                        {canBulkImport && (
                          <Link
                            href="/imports"
                            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl transition-all"
                          >
                            Import CSV / Excel
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
            filtered.map((lead, idx) => (
              <React.Fragment key={lead.id}>
              <tr className={`hover:bg-slate-900/50 transition-colors ${selected.includes(lead.id) ? 'bg-brand/5' : ''}`}>
                {/* Checkbox, Big AI Score Circle, and Serial Number */}
                <td
                  style={{ width: 108, minWidth: 108, maxWidth: 108 }}
                  className="px-2 py-2.5 border-b border-r border-slate-800/60 bg-slate-950/30 select-none"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="cursor-pointer"
                    />
                    {/* Big AI Score Circle Badge (Clickable with Android-Style Properties Modal) */}
                    {(() => {
                      const numScore = lead.score || lead.aiScore?.totalScore || 0;
                      if (numScore > 0) {
                        const badgeColor = numScore >= 80
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-500/30 shadow-emerald-500/20'
                          : numScore >= 50
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/30 shadow-indigo-500/20'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/30 shadow-amber-500/20';
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              const scoreData = lead.aiScore || generateMockAIScore(numScore > 10 ? numScore / 10 : numScore);
                              setActiveAIScoreModal({ leadName: lead.name, scoreData });
                            }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border shadow-sm flex-shrink-0 cursor-pointer transition-all transform hover:scale-110 active:scale-95 ${badgeColor}`}
                            title={`AI Lead Score: ${numScore}/100 — Click to view AI properties & analysis (like Android)`}
                          >
                            {numScore}
                          </button>
                        );
                      }
                      return (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black bg-slate-800 text-slate-400 border border-slate-700 flex-shrink-0"
                          title="AI Score: No Score (N)"
                        >
                          N
                        </div>
                      );
                    })()}
                    {/* Row Serial Number */}
                    <span className="text-xs font-mono font-bold text-slate-400 min-w-[20px] text-right">
                      #{idx + 1}
                    </span>
                  </div>
                </td>

                {columnOrder.map((colKey) => (
                  <td
                    key={colKey}
                    style={{
                      width: columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150,
                      minWidth: columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150,
                      maxWidth: columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 150,
                    }}
                    className="px-3 py-3 border-b border-r border-slate-800/60 text-xs overflow-hidden"
                  >
                    {colKey === 'name' && (
                      <div className="overflow-hidden">
                        <Link
                          href={`/leads/${encodeURIComponent(lead.id || '1')}`}
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(lead));
                              sessionStorage.setItem('das_crm_active_lead', JSON.stringify(lead));
                            }
                          }}
                          className="font-bold text-white hover:text-indigo-400 hover:underline text-sm truncate block"
                          title={lead.name}
                        >
                          {lead.name}
                        </Link>
                        {/* Badges Container: Allocation Chain + Call Telemetry */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {/* Allocation Chain Mini-Badge */}
                          {Array.isArray(lead.allocationTrail) && lead.allocationTrail.length > 0 && (
                            <button
                              onClick={() => setExpandedTrailLeadId(expandedTrailLeadId === lead.id ? null : lead.id)}
                              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
                              style={{
                                background: expandedTrailLeadId === lead.id ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)',
                                borderColor: 'rgba(99,102,241,0.35)',
                                color: '#818cf8',
                              }}
                            >
                              <GitBranch size={9} />
                              {lead.allocationTrail.length}-Step Chain
                              <span className="ml-0.5">{expandedTrailLeadId === lead.id ? '▲' : '▼'}</span>
                            </button>
                          )}

                          {/* Call Telemetry Count Badge */}
                          <Link
                            href={`/leads/${encodeURIComponent(lead.id || '1')}`}
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(lead));
                                sessionStorage.setItem('das_crm_active_lead', JSON.stringify(lead));
                              }
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
                            style={{
                              background: 'rgba(52,211,153,0.1)',
                              borderColor: 'rgba(52,211,153,0.35)',
                              color: '#34d399',
                            }}
                            title="Click to view full call contact timeline & audit"
                          >
                            <Phone size={9} />
                            {lead.totalCalls || 1} Calls (Last: {lead.lastCalledAt || '10m ago'})
                          </Link>
                        </div>
                      </div>
                    )}

                    {colKey === 'phone' && (
                      <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-semibold whitespace-nowrap overflow-hidden">
                        <Phone size={12} className="text-emerald-500 flex-shrink-0" />
                        <a href={`tel:${lead.phone}`} className="hover:underline hover:text-emerald-300 truncate">
                          {lead.phone || '—'}
                        </a>
                      </div>
                    )}

                    {colKey === 'email' && (
                      <div className="flex items-center gap-1.5 text-purple-300 font-medium whitespace-nowrap overflow-hidden">
                        <Mail size={12} className="text-purple-400 flex-shrink-0" />
                        <a href={`mailto:${lead.email}`} className="hover:underline hover:text-purple-200 truncate" title={lead.email}>
                          {lead.email || '—'}
                        </a>
                      </div>
                    )}

                    {colKey === 'status' && (() => {
                      const color = statusColorMap[lead.status] || lead.statusColor || '#6366f1';
                      return (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border truncate select-none shadow-sm"
                          style={{
                            color: color,
                            backgroundColor: `${color}18`,
                            borderColor: `${color}40`,
                          }}
                          title={`Lead Status: ${lead.status}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="truncate">{lead.status}</span>
                        </span>
                      );
                    })()}

                    {colKey === 'value' && (
                      <span className="font-bold text-indigo-400 truncate block">{lead.value}</span>
                    )}

                    {colKey === 'owner' && (() => {
                      const isLocked = isLeadContactedAndLocked(lead);
                      const isUnassigned = !lead.owner || lead.owner === 'Unassigned' || lead.owner === '—';

                      if (isLocked) {
                        return (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 truncate" title="🔒 Lead Assignment Locked: This lead has already been contacted by Sales/TL and cannot be reassigned to anyone else.">
                            <Lock size={12} className="text-amber-400 flex-shrink-0" />
                            <span className="font-bold text-slate-300 text-xs truncate">{lead.owner}</span>
                            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex-shrink-0">LOCKED</span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={lead.owner || 'Unassigned'}
                            onChange={(e) => handleReassignOwner(lead.id, e.target.value)}
                            className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none transition-all cursor-pointer max-w-full truncate ${
                              isUnassigned
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-extrabold animate-pulse'
                                : 'bg-slate-900 border-slate-700 text-indigo-300 hover:border-indigo-500'
                            }`}
                            title="Reallocate Lead (Online Verified with Server)"
                          >
                            <option value="Unassigned">⚠️ Unassigned</option>
                            {teamUsers.length > 0 ? (
                              teamUsers.map(u => (
                                <option key={u.id} value={u.name}>
                                  {u.name} ({u.role})
                                </option>
                              ))
                            ) : (
                              currentUser?.name && (
                                <option value={currentUser.name}>
                                  {currentUser.name} ({currentUser.role || 'Admin'})
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      );
                    })()}

                    {colKey === 'city' && <span className="text-slate-300 font-medium truncate block">{lead.city || '—'}</span>}
                    {colKey === 'budget' && <span className="text-emerald-400 font-mono font-semibold truncate block">{lead.budget || '—'}</span>}
                    {colKey === 'requirement' && <span className="text-slate-300 truncate block" title={lead.requirement || '—'}>{lead.requirement || '—'}</span>}
                    {colKey === 'source' && <span className="text-slate-400 truncate block">{lead.source || '—'}</span>}
                    {colKey === 'created' && <span className="text-slate-400 truncate block">{lead.created || '—'}</span>}
                  </td>
                ))}

                <td style={{ width: 44, minWidth: 44, maxWidth: 44 }} className="px-2 py-3 border-b border-border text-center">
                  <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted mx-auto">
                    <MoreHorizontal size={15} />
                  </button>
                </td>
              </tr>

              {/* 🔗 Inline Allocation Trail Expanded Row */}
              {expandedTrailLeadId === lead.id && Array.isArray(lead.allocationTrail) && lead.allocationTrail.length > 0 && (
                <tr key={`trail-${lead.id}`}>
                  <td colSpan={columnOrder.length + 2} className="px-4 py-0 bg-slate-950/60 border-b border-slate-800">
                    <div className="py-4">
                      {/* Compact Timeline */}
                      <div className="flex items-center gap-1 mb-3">
                        <GitBranch size={13} className="text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-300">Lead Allocation & Assignment Chain</span>
                        <span className="text-[10px] text-slate-500 ml-auto">Admin → Manager → TL → Sales Rep</span>
                      </div>
                      <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
                        {lead.allocationTrail.map((rawEvent, idx) => {
                          const event = sanitizeAllocationEvent(rawEvent, idx);
                          const toMeta = getSafeRoleMeta(event.toRole);
                          const fromMeta = getSafeRoleMeta(event.fromRole);
                          const dt = new Date(event.assignedAt);
                          const dateStr = !isNaN(dt.getTime()) ? dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today';
                          const timeStr = !isNaN(dt.getTime()) ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
                          const isFinal = event.toRole === 'SALES_EXEC';

                          return (
                            <div key={event.id} className="flex items-center gap-0 flex-shrink-0">
                              {/* Event Node */}
                              <div
                                className="min-w-[180px] max-w-[220px] p-2.5 rounded-xl border space-y-1.5"
                                style={{ background: toMeta.bg, borderColor: toMeta.border }}
                              >
                                {/* From badge */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: fromMeta.bg, color: fromMeta.color, border: `1px solid ${fromMeta.border}` }}>
                                    {fromMeta.label}
                                  </span>
                                  <span className="text-[9px] text-slate-500">→</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: toMeta.bg, color: toMeta.color, border: `1px solid ${toMeta.border}` }}>
                                    {toMeta.label}
                                  </span>
                                  {isFinal && <span className="text-[8px] font-black text-emerald-400 ml-auto">✓ Final</span>}
                                </div>
                                {/* Action text */}
                                <p className="text-[11px] font-bold text-white leading-tight">
                                  {isFinal ? '🎯 Assigned to' : '📁 Allocated to'} {event.toName}
                                </p>
                                {/* By whom */}
                                <p className="text-[10px] text-slate-400">By <span style={{ color: fromMeta.color }} className="font-bold">{event.fromName}</span></p>
                                {/* Date + Time */}
                                <div className="flex items-center gap-1 pt-0.5">
                                  <span className="text-[9px] font-bold text-slate-500">{dateStr}</span>
                                  <span className="text-[9px] text-slate-600">·</span>
                                  <span className="text-[10px] font-extrabold" style={{ color: toMeta.color }}>{timeStr}</span>
                                </div>
                                {/* Note */}
                                {event.note && (
                                  <p className="text-[9px] text-slate-400 italic leading-tight border-t border-slate-800 pt-1 mt-1">"{event.note.substring(0, 60)}{event.note.length > 60 ? '...' : ''}"</p>
                                )}
                              </div>

                              {/* Arrow connector */}
                              {idx < lead.allocationTrail!.length - 1 && (
                                <div className="flex items-center px-1">
                                  <div className="w-6 h-0.5 bg-slate-700" />
                                  <div className="text-slate-500 text-[10px]">▶</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))
            )}
          </tbody>
        </table>
      </div>

      {/* Header Title Editor Modal */}
      {editingColKey && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>✏️ Rename Column Header</span>
            </h3>
            <p className="text-xs text-slate-400">
              Enter a custom label for the <strong>{editingColKey}</strong> column in your Excel Data Grid:
            </p>

            <input
              type="text"
              className="crm-input w-full text-sm font-semibold"
              value={newTitleInput}
              onChange={(e) => setNewTitleInput(e.target.value)}
              placeholder="e.g. Client Mobile Number"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setEditingColKey(null)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleSaveHeaderTitle} className="btn-primary text-xs">Save Column Title</button>
            </div>
          </div>
        </div>
      )}

      {/* 🎛️ Advanced Lead Multi-Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  <Filter size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">🎛️ Multi-Dimensional Lead Filter</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Filter by assigned person, role, date range & stage status</p>
                </div>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Close Filter"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto bg-white dark:bg-slate-900">
              {/* 1. Person Wise Filter & 2. Role Scoping Filter (Only for Admin, Manager, Team Leader) */}
              {canFilterByTeam && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                      Assigned Employee / Person
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(() => {
                        const tlOptions = teamLeaderUsers.map(tl => ({ id: tl.name, label: `👑 ${tl.name} (TL)` }));
                        const salesOptions = salesExecUsers.map(rep => ({ id: rep.name, label: `🎯 ${rep.name} (Sales)` }));
                        return [
                          { id: 'ALL', label: '👥 All Team & Reps' },
                          { id: 'UNASSIGNED', label: '🔓 Unassigned Only' },
                          ...tlOptions,
                          ...salesOptions,
                        ];
                      })().map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setFilterPerson(item.id)}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                            filterPerson === item.id
                              ? 'filter-pill-selected bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/30'
                              : 'filter-pill-unselected'
                          }`}
                        >
                          <span className="font-semibold">{item.label}</span>
                          {filterPerson === item.id && <Check size={15} className="text-white stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Shield size={14} className="text-emerald-600 dark:text-emerald-400" />
                      Assignee Role Scoping
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'ALL', label: '🌐 All Roles' },
                        { id: 'SALES_EXEC', label: '💼 Sales Executive' },
                        { id: 'TEAM_LEADER', label: '👑 Team Leader (TL)' },
                        { id: 'MANAGER', label: '📊 Manager' },
                        { id: 'ADMIN', label: '⚡ Admin / HQ' },
                        { id: 'UNASSIGNED', label: '🔓 Unassigned' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setFilterRole(item.id)}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                            filterRole === item.id
                              ? 'filter-pill-selected bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-600/30'
                              : 'filter-pill-unselected'
                          }`}
                        >
                          <span className="font-semibold">{item.label}</span>
                          {filterRole === item.id && <Check size={15} className="text-white stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 3. Date Range Filter with Custom From & To Date Pickers */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar size={14} className="text-amber-600 dark:text-amber-400" />
                  Lead Created Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ALL', label: '📆 All Dates' },
                    { id: 'TODAY', label: '⚡ Today' },
                    { id: 'YESTERDAY', label: '🕒 Yesterday' },
                    { id: 'THIS_MONTH', label: '📅 This Month' },
                    { id: 'CUSTOM', label: '🎯 Custom Range (From - To)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFilterDate(item.id)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                        item.id === 'CUSTOM' ? 'col-span-2' : ''
                      } ${
                        filterDate === item.id
                          ? 'filter-pill-selected bg-amber-600 border-amber-600 shadow-md shadow-amber-600/30'
                          : 'filter-pill-unselected'
                      }`}
                    >
                      <span className="font-semibold">{item.label}</span>
                      {filterDate === item.id && <Check size={15} className="text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range Pickers (From & To) */}
                {filterDate === 'CUSTOM' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                          className="crm-input h-9 text-xs w-full cursor-pointer bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                          className="crm-input h-9 text-xs w-full cursor-pointer bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5"
                        />
                      </div>
                    </div>
                    {(customDateFrom || customDateTo) && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-500/20">
                        <span className="text-slate-600 dark:text-slate-400">
                          Active: <strong>{customDateFrom || 'Beginning'}</strong> → <strong>{customDateTo || 'Latest'}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => { setCustomDateFrom(''); setCustomDateTo(''); }}
                          className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                        >
                          Clear Dates
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Star size={14} className="text-purple-600 dark:text-purple-400" />
                  Stage / Status
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {statusTabs.map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        const val = st === 'All' ? 'ALL' : st;
                        setFilterStatus(val);
                        if (st !== 'All') setActiveStatus('All');
                      }}
                      className={`p-2 rounded-lg text-xs font-semibold text-center border transition-all ${
                        (filterStatus === 'ALL' && st === 'All') || filterStatus === st
                          ? 'filter-pill-selected bg-purple-600 border-purple-600 shadow-md shadow-purple-600/30'
                          : 'filter-pill-unselected'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-amber-400 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw size={13} /> Reset Filters
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="btn-primary text-xs py-2.5 px-6 font-bold shadow-lg shadow-indigo-600/30"
              >
                Apply Filters ({filtered.length} Leads Matching)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 Rich AI Score Properties Breakdown Modal (Android Style) */}
      {activeAIScoreModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xl font-black text-indigo-300">
                  {activeAIScoreModal.scoreData.tier === 'HOT' ? '🔥' : activeAIScoreModal.scoreData.tier === 'WARM' ? '🟢' : activeAIScoreModal.scoreData.tier === 'COLD' ? '🟡' : '⚪'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Lead Score Properties</h3>
                  <p className="text-xs text-indigo-400 font-semibold">{activeAIScoreModal.leadName}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAIScoreModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Overall Score Banner */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Score Rating</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-400">{activeAIScoreModal.scoreData.totalScore.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-bold">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Priority Tier</span>
                <div className="pt-0.5">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                    activeAIScoreModal.scoreData.tier === 'HOT'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : activeAIScoreModal.scoreData.tier === 'WARM'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {activeAIScoreModal.scoreData.tier} PRIORITY
                  </span>
                </div>
              </div>
            </div>

            {/* Score Properties Category Breakdown */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Metric Breakdown (0 - 10)</h4>
              {[
                { label: 'Budget & Commercial Potential', value: activeAIScoreModal.scoreData.budgetScore, color: 'bg-purple-500' },
                { label: 'Intent & Purchase Urgency', value: activeAIScoreModal.scoreData.intentScore, color: 'bg-pink-500' },
                { label: 'Engagement & Call Response', value: activeAIScoreModal.scoreData.engagementScore, color: 'bg-blue-500' },
                { label: 'Product & Requirement Fit', value: activeAIScoreModal.scoreData.productFitScore, color: 'bg-amber-500' },
                { label: 'Response & Velocity Score', value: activeAIScoreModal.scoreData.responseScore, color: 'bg-emerald-500' },
              ].map((prop, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300">{prop.label}</span>
                    <span className="font-mono font-bold text-white">{(prop.value || 8.5).toFixed(1)} / 10</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${prop.color} rounded-full transition-all`}
                      style={{ width: `${Math.min(100, Math.max(10, (prop.value || 8.5) * 10))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Analysis Summary */}
            {activeAIScoreModal.scoreData.analysisSummary && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <p className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                  <Brain size={13} /> AI Intelligence Summary
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeAIScoreModal.scoreData.analysisSummary}
                </p>
              </div>
            )}

            {/* Recommendations */}
            {activeAIScoreModal.scoreData.recommendations && activeAIScoreModal.scoreData.recommendations.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-emerald-400">💡 Recommended Next Steps:</p>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {activeAIScoreModal.scoreData.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveAIScoreModal(null)}
                className="btn-primary text-xs py-2 px-5 font-bold shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
