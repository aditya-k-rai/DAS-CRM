'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import {
  Plus, Search, Mail, Phone, Building2,
  Edit2, Trash2, CheckCircle2, User, FileText,
  ShieldCheck, X, Loader2, Receipt
} from 'lucide-react';

interface ContactItem {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone: string;
  company: string;
  designation?: string;
  address?: string;
  shippingAddress?: string;
  gstNo?: string;
  panNo?: string;
  leadsCount?: number;
  owner?: string;
  source?: string;
  createdAt?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WITH_EMAIL' | 'WITH_PHONE' | 'WITH_GST'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [viewModalContact, setViewModalContact] = useState<ContactItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    company: '',
    designation: '',
    address: '',
    shippingAddress: '',
    gstNo: '',
    panNo: '',
  });

  const fetchAllContacts = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
        apiBase = '/api';
      }

      const list: ContactItem[] = [];
      const seen = new Set<string>();

      // 1. From local Next.js /api/parties (persistent disk store)
      try {
        const pRes = await fetch('/api/parties');
        if (pRes.ok) {
          const pData = await pRes.json();
          if (Array.isArray(pData)) {
            pData.forEach((p: any) => {
              if (p.name && !seen.has(p.name.toLowerCase().trim())) {
                seen.add(p.name.toLowerCase().trim());
                list.push({
                  id: p.id || `party-${Date.now()}-${Math.random()}`,
                  name: p.name,
                  contactPerson: p.contactPerson || p.name,
                  email: p.email || '',
                  phone: p.phone || '',
                  company: p.name,
                  designation: 'Client / Buyer',
                  address: p.address || '',
                  shippingAddress: p.shippingAddress || '',
                  gstNo: p.gstNo || '',
                  panNo: p.panNo || '',
                  leadsCount: 1,
                  owner: 'Admin',
                  source: 'Party Directory',
                  createdAt: p.createdAt || new Date().toISOString(),
                });
              }
            });
          }
        }
      } catch (_) {}

      // 2. From localStorage cache
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('das_crm_saved_parties');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              parsed.forEach((p: any) => {
                if (p.name && !seen.has(p.name.toLowerCase().trim())) {
                  seen.add(p.name.toLowerCase().trim());
                  list.push({
                    id: p.id || `party-${Date.now()}-${Math.random()}`,
                    name: p.name,
                    contactPerson: p.contactPerson || p.name,
                    email: p.email || '',
                    phone: p.phone || '',
                    company: p.name,
                    designation: 'Client / Buyer',
                    address: p.address || '',
                    shippingAddress: p.shippingAddress || '',
                    gstNo: p.gstNo || '',
                    panNo: p.panNo || '',
                    leadsCount: 1,
                    owner: 'Admin',
                    source: 'Local Cache',
                    createdAt: p.createdAt || new Date().toISOString(),
                  });
                }
              });
            }
          }
        } catch (_) {}
      }

      // 3. From NestJS backend /contacts
      try {
        const cRes = await fetch(`${apiBase}/contacts`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (cRes.ok) {
          const cJson = await cRes.json();
          const cList = Array.isArray(cJson) ? cJson : cJson?.items || [];
          cList.forEach((c: any) => {
            const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.company?.name || c.email || 'Contact';
            if (!seen.has(fullName.toLowerCase().trim())) {
              seen.add(fullName.toLowerCase().trim());
              list.push({
                id: `contact-${c.id}`,
                name: fullName,
                contactPerson: fullName,
                email: c.email || '',
                phone: c.phone || '',
                company: c.company?.name || fullName,
                designation: c.designation || 'Client Contact',
                address: c.customFields?.address || '',
                shippingAddress: c.customFields?.shippingAddress || '',
                gstNo: c.customFields?.gstNo || '',
                panNo: c.customFields?.panNo || '',
                leadsCount: c.deals?.length || 0,
                owner: c.owner?.name || 'Admin',
                source: 'CRM Database',
                createdAt: c.createdAt || new Date().toISOString(),
              });
            }
          });
        }
      } catch (_) {}

      setContacts(list);
    } catch (err) {
      console.warn('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllContacts();

    const handleRemotePartyUpdate = () => fetchAllContacts();
    window.addEventListener('das_crm_parties_updated', handleRemotePartyUpdate);
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('das_crm_party_channel');
        bc.onmessage = () => fetchAllContacts();
      }
    } catch (_) {}

    return () => {
      window.removeEventListener('das_crm_parties_updated', handleRemotePartyUpdate);
      if (bc) bc.close();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      company: '',
      designation: '',
      address: '',
      shippingAddress: '',
      gstNo: '',
      panNo: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: ContactItem) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      contactPerson: contact.contactPerson || contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      designation: contact.designation || '',
      address: contact.address || '',
      shippingAddress: contact.shippingAddress || '',
      gstNo: contact.gstNo || '',
      panNo: contact.panNo || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Contact or Company Name is required');
      return;
    }

    setSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
      apiBase = '/api';
    }

    const contactId = editingContact?.id || `party-${Date.now()}`;
    const payload = {
      id: contactId,
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim() || formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim() || 'Billed To Address',
      shippingAddress: formData.shippingAddress.trim(),
      gstNo: formData.gstNo.trim(),
      panNo: formData.panNo.trim(),
    };

    // 1. Update state immediately
    const updatedItem: ContactItem = {
      id: contactId,
      name: payload.name,
      contactPerson: payload.contactPerson,
      email: payload.email,
      phone: payload.phone,
      company: formData.company.trim() || payload.name,
      designation: formData.designation.trim() || 'Client / Buyer',
      address: payload.address,
      shippingAddress: payload.shippingAddress,
      gstNo: payload.gstNo,
      panNo: payload.panNo,
      leadsCount: editingContact?.leadsCount || 0,
      owner: editingContact?.owner || 'Admin',
      source: 'Party Directory',
      createdAt: editingContact?.createdAt || new Date().toISOString(),
    };

    setContacts(prev => {
      const exists = prev.some(c => c.id === contactId);
      return exists ? prev.map(c => c.id === contactId ? updatedItem : c) : [updatedItem, ...prev];
    });

    // 2. Persist to localStorage
    try {
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('das_crm_saved_parties') || '[]');
        const exists = existing.some((p: any) => p.id === contactId);
        const next = exists ? existing.map((p: any) => p.id === contactId ? payload : p) : [payload, ...existing];
        localStorage.setItem('das_crm_saved_parties', JSON.stringify(next));
      }
    } catch (_) {}

    // 3. Broadcast real-time event
    try {
      window.dispatchEvent(new CustomEvent('das_crm_parties_updated', { detail: payload }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('das_crm_party_channel');
        bc.postMessage({ type: 'PARTY_UPDATED', party: payload });
        bc.close();
      }
    } catch (_) {}

    // 4. Save to APIs
    try {
      if (editingContact) {
        await fetch(`/api/parties/${contactId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/parties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        fetch(`${apiBase}/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            firstName: payload.name,
            email: payload.email,
            phone: payload.phone,
            customFields: {
              address: payload.address,
              shippingAddress: payload.shippingAddress,
              gstNo: payload.gstNo,
              panNo: payload.panNo,
              contactPerson: payload.contactPerson,
            },
          }),
        }).catch(() => {});
      }
    } catch (_) {}

    setSaving(false);
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from contacts?`)) return;

    setContacts(prev => prev.filter(c => c.id !== id));

    try {
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('das_crm_saved_parties') || '[]');
        const next = existing.filter((p: any) => p.id !== id);
        localStorage.setItem('das_crm_saved_parties', JSON.stringify(next));
      }
    } catch (_) {}

    try {
      await fetch(`/api/parties/${id}`, { method: 'DELETE' });
    } catch (_) {}

    try {
      window.dispatchEvent(new CustomEvent('das_crm_parties_updated'));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('das_crm_party_channel');
        bc.postMessage({ type: 'PARTY_DELETED', id });
        bc.close();
      }
    } catch (_) {}
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.gstNo && c.gstNo.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType === 'WITH_EMAIL') return !!c.email;
      if (filterType === 'WITH_PHONE') return !!c.phone;
      if (filterType === 'WITH_GST') return !!c.gstNo;
      return true;
    });
  }, [contacts, searchQuery, filterType]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Contacts & Parties"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/quotes"
              className="btn-secondary text-xs sm:text-sm px-3 py-1.5 gap-1.5 cursor-pointer flex items-center hover:text-indigo-400"
              title="Go to Quotations & Invoices"
            >
              <Receipt size={14} className="text-amber-400" /> Quotations
            </Link>
            <Link
              href="/companies"
              className="btn-secondary text-xs sm:text-sm px-3 py-1.5 gap-1.5 cursor-pointer flex items-center hover:text-indigo-400"
              title="Go to Companies & Organizations"
            >
              <Building2 size={14} className="text-sky-400" /> Companies
            </Link>
            <button
              onClick={handleOpenAdd}
              className="btn-primary text-xs sm:text-sm px-3.5 py-1.5 gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Plus size={15} /> New Contact / Party
            </button>
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="crm-card p-0 overflow-hidden border border-border bg-card shadow-sm rounded-2xl">
          {/* Search & Filter Header */}
          <div className="p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" style={{ borderColor: 'rgb(var(--border))' }}>
            <div className="relative max-w-md flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="crm-input pl-9 h-9 text-xs sm:text-sm w-full"
                placeholder="Search by name, email, phone, company, or GSTIN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border text-xs">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterType === 'ALL' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  All ({contacts.length})
                </button>
                <button
                  onClick={() => setFilterType('WITH_EMAIL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterType === 'WITH_EMAIL' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  With Email
                </button>
                <button
                  onClick={() => setFilterType('WITH_PHONE')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterType === 'WITH_PHONE' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  With Phone
                </button>
                <button
                  onClick={() => setFilterType('WITH_GST')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterType === 'WITH_GST' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  GST Verified
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="crm-table w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-bold text-muted-foreground uppercase">
                  <th className="py-3 px-4">Contact / Party</th>
                  <th className="py-3 px-4">Company & Designation</th>
                  <th className="py-3 px-4">Phone & Email</th>
                  <th className="py-3 px-4">GSTIN / Tax ID</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                      <p>Loading contacts &amp; buyer parties...</p>
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                        <User size={24} />
                      </div>
                      <p className="font-bold text-sm text-foreground">No contacts found</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        {searchQuery ? 'No results matched your search term.' : 'Add your first business client, buyer party, or company contact to start invoicing and quoting.'}
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="btn-primary text-xs px-4 py-2 mt-4 inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Plus size={14} /> Add First Contact / Party
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="avatar w-9 h-9 rounded-xl text-xs font-black flex items-center justify-center shrink-0 shadow-xs"
                            style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)' }}
                          >
                            {c.name ? c.name.slice(0, 2).toUpperCase() : 'CO'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{c.name}</p>
                            {c.contactPerson && c.contactPerson !== c.name && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <User size={10} /> {c.contactPerson}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Building2 size={12} className="text-indigo-400 shrink-0" />
                            <span className="truncate">{c.company || c.name}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">{c.designation || 'Client / Buyer'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {c.phone ? (
                            <a
                              href={`tel:${c.phone}`}
                              className="text-xs font-mono text-muted-foreground hover:text-indigo-400 flex items-center gap-1"
                            >
                              <Phone size={11} className="text-emerald-500" /> {c.phone}
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic">No phone</span>
                          )}
                          {c.email ? (
                            <a
                              href={`mailto:${c.email}`}
                              className="text-xs text-muted-foreground hover:text-indigo-400 flex items-center gap-1 truncate max-w-[180px]"
                            >
                              <Mail size={11} className="text-sky-500" /> {c.email}
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic block">No email</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {c.gstNo ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck size={11} /> {c.gstNo}
                            </span>
                            {c.panNo && (
                              <p className="text-[10px] font-mono text-muted-foreground pl-0.5">PAN: {c.panNo}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 italic">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={c.address}>
                          {c.address || '—'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewModalContact(c)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            title="View Profile Details"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/15 text-indigo-400 transition-all"
                            title="Edit Contact"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id, c.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400 transition-all"
                            title="Delete Contact"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* ADD / EDIT CONTACT MODAL                                     */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <User size={18} />
                </div>
                <h3 className="font-bold text-base">
                  {editingContact ? 'Edit Contact / Buyer Party' : 'Add New Contact / Buyer Party'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Party / Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Enterprises or John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Procurement Head"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="contact@client.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs font-mono uppercase"
                    value={formData.gstNo}
                    onChange={e => setFormData({ ...formData, gstNo: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs font-mono uppercase"
                    value={formData.panNo}
                    onChange={e => setFormData({ ...formData, panNo: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  placeholder="Full office or billing street address..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Shipping Address (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Delivery address if different from billing..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-xs"
                  value={formData.shippingAddress}
                  onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{editingContact ? 'Update Contact' : 'Save Contact'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW CONTACT PROFILE MODAL                                   */}
      {/* ============================================================ */}
      {viewModalContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                  {viewModalContact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base">{viewModalContact.name}</h3>
                  <p className="text-xs text-slate-400">{viewModalContact.designation || 'Client Contact'}</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalContact(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">Contact Person</span>
                <p className="font-semibold text-slate-200">{viewModalContact.contactPerson || viewModalContact.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Email</span>
                  <p className="font-semibold text-slate-200 truncate">{viewModalContact.email || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Phone</span>
                  <p className="font-semibold text-slate-200">{viewModalContact.phone || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">GSTIN</span>
                  <p className="font-mono font-bold text-emerald-400">{viewModalContact.gstNo || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">PAN Number</span>
                  <p className="font-mono font-bold text-slate-200">{viewModalContact.panNo || 'N/A'}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">Billing Address</span>
                <p className="text-slate-300 leading-relaxed">{viewModalContact.address || 'Address not specified'}</p>
              </div>

              {viewModalContact.shippingAddress && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Shipping Address</span>
                  <p className="text-slate-300 leading-relaxed">{viewModalContact.shippingAddress}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  const target = viewModalContact;
                  setViewModalContact(null);
                  handleOpenEdit(target);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Edit2 size={13} /> Edit Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
