/**
 * apiService.ts — DAS CRM Android API Communication Service
 * Handles live NestJS backend calls, token injection, and offline fallback.
 */

import { API_BASE } from '../config/api';

export interface LeadItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  value: string;
  source: string;
  priority: string;
}

export const FALLBACK_LEADS: LeadItem[] = [
  { id: '1', name: 'Vikram Mehta', company: 'Acme Corp', email: 'vikram@acme.com', phone: '+91 98765 43210', status: 'IN NEGOTIATION', value: '$14,200', source: 'Google Sheets', priority: 'High' },
  { id: '2', name: 'Sunita Rao', company: 'TechCorp India', email: 'No Email Provided', phone: '+91 98123 45678', status: 'NEW LEAD', value: '$8,500', source: 'Excel Import', priority: 'Medium' },
  { id: '3', name: 'Rajesh Kumar', company: 'Starlight Media', email: 'rajesh@starlight.com', phone: '+91 97111 22233', status: 'QUALIFIED', value: '$22,000', source: 'Meta Ads', priority: 'High' },
  { id: '4', name: 'Amit Shah', company: 'Global Freight', email: 'No Email Provided', phone: '+91 96555 44433', status: 'CONTACTED', value: '$6,800', source: 'Google Ads', priority: 'Low' },
  { id: '5', name: 'Priya Sharma', company: 'LogiTech Solutions', email: 'priya@logitech.com', phone: '+91 95444 33322', status: 'WON', value: '$35,000', source: 'Direct Import', priority: 'High' },
];

class ApiService {
  /** Fetch public active tenant companies for login dropdown */
  async getPublicCompanies(): Promise<Array<{ id: string; name: string }>> {
    try {
      const res = await fetch(`${API_BASE}/auth/public-companies`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((c: any) => ({ id: c.id, name: c.name || c.companyName }));
        }
      }
    } catch {
      // Backend offline fallback
    }
    return [
      { id: 'comp_1', name: 'Acme Sales Solutions' },
      { id: 'comp_2', name: 'Sunita Real Estate Ltd' },
      { id: 'comp_3', name: 'Lakshmi Auto Dealerships' },
      { id: 'comp_4', name: 'TechCorp Enterprise' },
    ];
  }

  /** Fetch current authenticated user profile (/auth/me) */
  async getCurrentUser(token: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback handled by authStore
    }
    return null;
  }

  /** Fetch list of leads for active workspace (/leads) */
  async getLeads(token: string | null): Promise<LeadItem[]> {
    if (!token) return FALLBACK_LEADS;
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const result = await res.json();
        const rawList = Array.isArray(result) ? result : (result.data || []);
        if (rawList.length > 0) {
          return rawList.map((item: any) => ({
            id: String(item.id),
            name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.name || 'Unnamed Lead',
            company: item.companyName || item.company || '—',
            email: item.email || 'No Email Provided',
            phone: item.phone || item.mobile || '—',
            status: (item.stage || item.status || 'NEW LEAD').toUpperCase(),
            value: item.estimatedValue ? `$${Number(item.estimatedValue).toLocaleString()}` : (item.value || '$5,000'),
            source: item.source || 'Direct',
            priority: item.priority || 'Medium',
          }));
        }
      }
    } catch {
      // Backend offline fallback
    }
    return FALLBACK_LEADS;
  }
}

export const apiService = new ApiService();
