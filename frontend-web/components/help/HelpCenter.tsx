'use client';

import { useState } from 'react';
import {
  Search, BookOpen, MessageSquare, Shield, Zap, FileText, CheckCircle2,
  AlertCircle, ChevronRight, Phone, Mail, ExternalLink, Plus, Send
} from 'lucide-react';

const KB_CATEGORIES = [
  { id: 'getting_started', title: 'Getting Started', desc: 'Setup, roles, workspace configuration, and onboarding.', icon: Zap, color: '#6366f1', count: 8 },
  { id: 'leads_deals',     title: 'Leads & Pipelines', desc: 'Managing leads, lead scoring, Kanban stages, and custom fields.', icon: FileText, color: '#3b82f6', count: 12 },
  { id: 'hr_payroll',      title: 'HR & Salary Engine', desc: 'Self attendance, leave policies, salary templates, and payroll.', icon: Shield, color: '#22c55e', count: 10 },
  { id: 'automations',     title: 'Automations & Comms', desc: 'No-code workflow rules, WhatsApp threads, and email templates.', icon: MessageSquare, color: '#8b5cf6', count: 7 },
];

const ARTICLES = [
  { id: '1', cat: 'getting_started', title: 'Understanding Team Leader vs Admin vs Rep Roles', reads: 342, snippet: 'NexCRM enforces strict multi-level role hierarchy where Admins manage Team Leaders and HR controls payroll...' },
  { id: '2', cat: 'hr_payroll',      title: 'How to Customize Salary Builder Components', reads: 512, snippet: 'HR managers can create custom formula-based salary templates with earnings, deductions, and attendance pro-rating...' },
  { id: '3', cat: 'leads_deals',     title: 'Configuring AI Lead Scoring Thresholds', reads: 289, snippet: 'Learn how the 4-dimension scoring engine evaluates contact completeness, engagement, deal size, and intent...' },
  { id: '4', cat: 'automations',     title: 'Setting up WhatsApp Integration and Quick Replies', reads: 410, snippet: 'Connect your business WhatsApp API to view lead messaging threads and configure double-tick delivery status...' },
];

const TICKETS = [
  { id: 'T-1024', subject: 'Question regarding custom field export in CSV', status: 'IN_PROGRESS', date: 'Aug 11, 2026', priority: 'MEDIUM' },
  { id: 'T-1019', subject: 'Need help adding 5 new team leaders to org', status: 'RESOLVED',    date: 'Aug 8, 2026',  priority: 'HIGH' },
];

export function HelpCenter() {
  const [activeTab, setActiveTab]   = useState<'kb' | 'tickets'>('kb');
  const [search, setSearch]         = useState('');
  const [selectedArticle, setArticle] = useState<typeof ARTICLES[0] | null>(null);
  const [showTicketModal, setShowTicket] = useState(false);
  const [ticketSubject, setSubject]   = useState('');
  const [ticketBody, setBody]         = useState('');
  const [submitted, setSubmitted]     = useState(false);

  const filteredArticles = ARTICLES.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.snippet.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateTicket = () => {
    if (!ticketSubject.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowTicket(false);
      setSubject(''); setBody('');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="crm-card p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', borderColor: 'rgba(99,102,241,0.3)' }}>
        <div className="max-w-xl">
          <h2 className="text-xl font-extrabold text-white mb-2">How can we help you today?</h2>
          <p className="text-sm text-muted mb-4">Search documentation articles, role guides, or submit a support ticket.</p>
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-muted" />
            <input
              className="crm-input pl-10 text-sm h-11 w-full bg-card shadow-lg"
              placeholder="Search guide topics (e.g. salary calculation, lead assignment)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'rgb(var(--border))' }}>
        <button
          onClick={() => setActiveTab('kb')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'kb' ? 'bg-brand/20 text-brand-400 border border-brand/30' : 'text-muted'}`}
        >
          <BookOpen size={15} /> Knowledge Base
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'tickets' ? 'bg-brand/20 text-brand-400 border border-brand/30' : 'text-muted'}`}
        >
          <MessageSquare size={15} /> Support Tickets ({TICKETS.length})
        </button>
      </div>

      {/* KB Tab */}
      {activeTab === 'kb' && (
        <div className="space-y-6">
          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {KB_CATEGORIES.map(cat => (
              <div key={cat.id} className="crm-card cursor-pointer hover:border-brand/40 transition-all group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${cat.color}15`, color: cat.color }}>
                  <cat.icon size={18} />
                </div>
                <h3 className="font-bold text-sm text-white group-hover:text-brand-400 transition-colors">{cat.title}</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">{cat.desc}</p>
                <p className="text-[11px] font-semibold mt-3" style={{ color: cat.color }}>{cat.count} articles →</p>
              </div>
            ))}
          </div>

          {/* Popular Articles */}
          <div className="crm-card">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <FileText size={16} style={{ color: 'rgb(129,140,248)' }} /> Popular Knowledge Articles
            </h3>

            <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
              {filteredArticles.map(art => (
                <div
                  key={art.id}
                  onClick={() => setArticle(art)}
                  className="py-3.5 flex items-start justify-between cursor-pointer hover:bg-muted/10 transition-all group px-2 rounded-lg"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">{art.title}</h4>
                    <p className="text-xs text-muted mt-1 line-clamp-1">{art.snippet}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted flex-shrink-0 ml-4">
                    <span>{art.reads} reads</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Support Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Your Active Support Tickets</h3>
            <button className="btn-primary text-sm gap-1.5 flex items-center" onClick={() => setShowTicket(true)}>
              <Plus size={14} /> Submit Ticket
            </button>
          </div>

          <div className="crm-card p-0 overflow-hidden">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Created Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {TICKETS.map(t => (
                  <tr key={t.id}>
                    <td><span className="font-mono text-xs text-brand-400 font-bold">{t.id}</span></td>
                    <td><span className="font-semibold text-sm">{t.subject}</span></td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded font-bold" style={{
                        background: t.priority === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: t.priority === 'HIGH' ? 'rgb(239,68,68)' : 'rgb(245,158,11)',
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td><span className="text-xs text-muted">{t.date}</span></td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                        background: t.status === 'RESOLVED' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                        color: t.status === 'RESOLVED' ? 'rgb(34,197,94)' : 'rgb(129,140,248)',
                      }}>
                        {t.status === 'RESOLVED' ? '✓ Resolved' : '● In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTicket(false)} />
          <div className="crm-card w-full max-w-md relative z-10 space-y-4">
            <h3 className="font-bold text-lg">Create Support Ticket</h3>
            <div>
              <label className="text-xs text-muted block mb-1">Subject *</label>
              <input
                className="crm-input text-sm w-full"
                placeholder="Brief summary of the issue..."
                value={ticketSubject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Detailed Description</label>
              <textarea
                className="crm-input text-sm w-full h-24 resize-none"
                placeholder="Explain what happened or what you need help with..."
                value={ticketBody}
                onChange={e => setBody(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary text-sm" onClick={() => setShowTicket(false)}>Cancel</button>
              <button className="btn-primary text-sm gap-1.5 flex items-center" onClick={handleCreateTicket} disabled={!ticketSubject.trim() || submitted}>
                {submitted ? <><CheckCircle2 size={14} style={{ color: '#22c55e' }} /> Ticket Submitted!</> : <><Send size={14} /> Submit Ticket</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
