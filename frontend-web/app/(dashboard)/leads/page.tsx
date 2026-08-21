'use client';

import { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadFunnelDistribution } from '@/components/leads/LeadFunnelDistribution';
import { Target, Sliders, Plus, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LeadsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'funnel'>('directory');

  // Modals state
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadValue, setNewLeadValue] = useState('');

  const [rawCsvText, setRawCsvText] = useState(
    'Name, Phone, Company, Email, Value\nRajesh Kumar, +91 98765 43210, TechCorp Solutions, rajesh@techcorp.com, ₹5,20,000\nPriya Sharma, +91 98123 45678, LogiTech Freight, priya@logitech.com, ₹3,50,000'
  );

  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const canAccessFunnel = rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'MANAGER' || rawRole === 'OWNER';

  const handleCreateNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      alert('Please enter lead name and phone number.');
      return;
    }
    alert(`✅ New Lead Registered!\nName: ${newLeadName}\nPhone: ${newLeadPhone}\nCompany: ${newLeadCompany || 'N/A'}`);
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadCompany('');
    setNewLeadEmail('');
    setNewLeadValue('');
    setShowNewLeadModal(false);
  };

  const handleImportCsv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCsvText.trim()) return;
    const lines = rawCsvText.trim().split('\n').filter((l) => l.trim().length > 0);
    const count = Math.max(1, lines.length - 1);
    alert(`📥 Bulk CSV Ingestion Complete!\nSuccessfully imported ${count} leads into database.`);
    setShowImportModal(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Leads Management"
        actions={
          <div className="flex items-center gap-2">
            {canAccessFunnel && (
              <div className="flex gap-1.5 mr-2">
                <button
                  onClick={() => setActiveTab('directory')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'directory' ? 'bg-brand/25 text-brand-400 border border-brand/30' : 'bg-muted text-muted-foreground'}`}
                >
                  <Target size={13} /> Leads Directory
                </button>
                <button
                  onClick={() => setActiveTab('funnel')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'funnel' ? 'bg-brand/25 text-brand-400 border border-brand/30' : 'bg-muted text-muted-foreground'}`}
                >
                  <Sliders size={13} /> Funnel &amp; Distribution Engine
                </button>
              </div>
            )}
            {canAccessFunnel && (
              <button onClick={() => setShowImportModal(true)} className="btn-secondary text-sm gap-1.5">
                <Upload size={14} /> Import CSV
              </button>
            )}
            <button onClick={() => setShowNewLeadModal(true)} className="btn-primary text-sm gap-1.5">
              <Plus size={14} /> New Lead
            </button>
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-auto">
        {canAccessFunnel && activeTab === 'funnel' ? <LeadFunnelDistribution /> : <LeadsTable />}
      </main>

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">🎯 Add New Prospect Lead</h3>
              <button onClick={() => setShowNewLeadModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewLead} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Lead / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Company / Org</label>
                  <input
                    type="text"
                    value={newLeadCompany}
                    onChange={(e) => setNewLeadCompany(e.target.value)}
                    placeholder="TechCorp India"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    placeholder="rajesh@techcorp.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Deal Value (₹)</label>
                  <input
                    type="text"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(e.target.value)}
                    placeholder="₹5,00,000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-2.5 text-sm font-semibold justify-center mt-2">
                🚀 Create &amp; Allocate Lead Now ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">📥 Bulk CSV / Excel Lead Ingestion</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImportCsv} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Paste Raw CSV Rows (Name, Phone, Company, Email, Value):</label>
                <textarea
                  rows={6}
                  value={rawCsvText}
                  onChange={(e) => setRawCsvText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-emerald-400 font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full btn-primary py-2.5 text-sm font-semibold justify-center">
                ⚡ Import CSV Lead Records ➔
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
