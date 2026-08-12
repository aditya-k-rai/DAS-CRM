import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { AILeadInsight } from '@/components/leads/AILeadInsight';
import { Phone, Mail, Building2, Calendar, User, Clock, ArrowLeft, MessageSquare, Send, CheckCircle2, FileText, Tag, Shield, Edit2, Paperclip } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Lead Profile | NexCRM' };

const TIMELINE = [
  { type: 'status',   color: '#22c55e',  icon: '🔄', title: 'Status changed → Qualified',                    body: 'Updated by John Doe',                                                           time: '2 hours ago' },
  { type: 'call',     color: '#3b82f6',  icon: '📞', title: 'Discovery call logged (32 min)',                 body: 'Discussed 50-user license for multi-tenant CRM with custom reporting module.',   time: 'Yesterday 4:30 PM' },
  { type: 'email',    color: '#8b5cf6',  icon: '📧', title: 'Email sent: Product Overview',                   body: 'Sent proposal email with deck attached. Opened 3× by lead.',                     time: 'Yesterday 11:00 AM' },
  { type: 'task',     color: '#f59e0b',  icon: '✅', title: 'Task completed: Initial contact made',           body: 'Completed by John Doe',                                                          time: 'Aug 9, 2026' },
  { type: 'created',  color: '#6366f1',  icon: '🌐', title: 'Lead created via Website Form',                  body: 'Source: Website Inquiry · IP: 103.22.14.2',                                     time: 'Aug 9, 2026' },
];

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Lead: Rajesh Kumar"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/leads" className="btn-secondary text-sm gap-1.5"><ArrowLeft size={14} /> Leads</Link>
            <button className="btn-secondary text-sm gap-1.5"><Edit2 size={14} /> Edit</button>
            <button className="btn-primary text-sm gap-1.5"><CheckCircle2 size={14} /> Mark Won</button>
          </div>
        }
      />

      <main className="flex-1 overflow-auto">
        {/* Lead header band */}
        <div className="border-b px-6 py-4 flex items-center gap-6 flex-wrap" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <div className="avatar w-14 h-14 text-xl font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: 'rgb(129,140,248)' }}>RK</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold">Rajesh Kumar</h2>
              <span className="status-badge" style={{ background: 'rgba(59,130,246,0.15)', color: 'rgb(96,165,250)', fontSize: '12px' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgb(59,130,246)' }} /> Qualified
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: 'rgb(251,191,36)' }}>Score: 74</span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap text-sm text-muted">
              <span className="flex items-center gap-1"><Building2 size={13} /> TechCorp Ltd</span>
              <span className="flex items-center gap-1"><Mail size={13} /> rajesh@example.com</span>
              <span className="flex items-center gap-1"><Phone size={13} /> +91 98765 43210</span>
              <span className="flex items-center gap-1"><Tag size={13} /> Source: Website</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div>
              <p className="text-xl font-extrabold" style={{ color: 'rgb(var(--brand-400))' }}>₹2,40,000</p>
              <p className="text-xs text-muted">Deal Value</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-emerald-400">74%</p>
              <p className="text-xs text-muted">Win Prob.</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-amber-400">12d</p>
              <p className="text-xs text-muted">Est. Close</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-12 gap-6">
          {/* Left: 4 cols */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Ownership card */}
            <div className="crm-card">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                <Shield size={14} style={{ color: 'rgb(129,140,248)' }} /> Ownership
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Team Leader', value: 'Amit Shah' },
                  { label: 'Assigned Rep', value: 'John Doe (Sales Exec)' },
                  { label: 'Organization', value: 'TechCorp Ltd' },
                  { label: 'Designation', value: 'CTO' },
                  { label: 'Lead Created', value: 'Aug 9, 2026' },
                  { label: 'Last Activity', value: '2h ago' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                    <span className="text-muted">{label}</span>
                    <span className="font-medium text-white">{value}</span>
                  </div>
                ))}
              </div>
              <button className="btn-secondary w-full text-xs mt-3">Re-assign Lead</button>
            </div>

            {/* AI Intelligence */}
            <AILeadInsight leadId={params.id} />
          </div>

          {/* Right: 8 cols — activity log + timeline */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* Quick actions */}
            <div className="flex gap-2 flex-wrap">
              {[
                { icon: Phone, label: 'Log Call', color: '#3b82f6' },
                { icon: Mail,  label: 'Send Email', color: '#8b5cf6' },
                { icon: MessageSquare, label: 'Add Note', color: '#f59e0b' },
                { icon: Calendar, label: 'Schedule', color: '#22c55e' },
                { icon: FileText, label: 'Create Quote', color: '#ec4899' },
                { icon: Paperclip, label: 'Attach File', color: '#14b8a6' },
              ].map(({ icon: Icon, label, color }) => (
                <button key={label} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            {/* Note Input */}
            <div className="crm-card">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} style={{ color: 'rgb(129,140,248)' }} />
                <p className="text-sm font-semibold">Log Interaction / Add Note</p>
              </div>
              <textarea
                className="crm-input text-sm w-full h-20 mb-3 resize-none"
                placeholder="Log a call, meeting notes, email summary, or any customer interaction..."
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {['📞 Call', '📧 Email', '🤝 Meeting', '📝 Note'].map(type => (
                    <button key={type} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' }}>
                      {type}
                    </button>
                  ))}
                </div>
                <button className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1">
                  <Send size={12} /> Post
                </button>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="crm-card">
              <h3 className="font-semibold text-sm mb-5 flex items-center gap-2">
                <Clock size={14} style={{ color: 'rgb(129,140,248)' }} /> Activity Timeline
              </h3>
              <div className="relative pl-6 space-y-5">
                {/* Vertical line */}
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5" style={{ background: 'rgb(var(--border))' }} />

                {TIMELINE.map((item, i) => (
                  <div key={i} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-4 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center" style={{ background: item.color, top: '2px' }} />
                    <div className="p-3 rounded-xl border" style={{ background: 'rgb(var(--background))', borderColor: 'rgb(var(--border))' }}>
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-semibold">
                          <span className="mr-1.5">{item.icon}</span>{item.title}
                        </p>
                        <span className="text-xs text-muted flex-shrink-0 ml-2">{item.time}</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
