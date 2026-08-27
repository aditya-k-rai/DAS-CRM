'use client';

import { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import {
  UserCheck, Plus, Search, Calendar, Clock, Video,
  FileText, Star, ChevronRight, X, Phone, Mail,
  CheckCircle2, AlertCircle, Briefcase, Users,
  Edit2, Trash2, MessageSquare, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────
type InterviewStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW_1' | 'INTERVIEW_2' | 'OFFER' | 'HIRED' | 'REJECTED';
type InterviewMode  = 'VIDEO' | 'IN_PERSON' | 'PHONE';

interface Candidate {
  id: string;
  name: string;
  initials: string;
  role: string;         // role they're applying for
  department: string;
  stage: InterviewStage;
  mode: InterviewMode;
  scheduledDate: string;
  interviewer: string;
  score?: number;       // 1-10
  email: string;
  phone: string;
  resume?: string;
  note?: string;
}

// ── Stage config ──────────────────────────────────────────
const STAGE_STYLES: Record<InterviewStage, { label: string; bg: string; text: string; border: string; icon: any }> = {
  APPLIED:      { label: 'Applied',       bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/30',   icon: FileText    },
  SCREENING:    { label: 'Screening',     bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/30',    icon: Phone       },
  INTERVIEW_1:  { label: 'Interview I',   bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  border: 'border-indigo-500/30',  icon: Video       },
  INTERVIEW_2:  { label: 'Interview II',  bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-purple-500/30',  icon: Users       },
  OFFER:        { label: 'Offer Sent',    bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   icon: Briefcase   },
  HIRED:        { label: 'Hired ✓',       bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle2 },
  REJECTED:     { label: 'Rejected',      bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30',    icon: AlertCircle },
};

const MODE_LABEL: Record<InterviewMode, string> = {
  VIDEO:     '🎥 Video',
  IN_PERSON: '🏢 In-Person',
  PHONE:     '📞 Phone',
};

// ── Seed candidates ───────────────────────────────────────
const INITIAL_CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Arjun Mehta',    initials: 'AM', role: 'Senior Sales Executive', department: 'Sales',     stage: 'INTERVIEW_1',  mode: 'VIDEO',     scheduledDate: 'Aug 27, 2026 · 11:00 AM', interviewer: 'Rajesh Kumar',  score: 7,  email: 'arjun@email.com',  phone: '+91 98765 11223', note: 'Strong communication skills, 5 yrs B2B experience' },
  { id: 'c2', name: 'Pooja Nair',     initials: 'PN', role: 'HR Business Partner',    department: 'HR',        stage: 'OFFER',        mode: 'IN_PERSON', scheduledDate: 'Aug 26, 2026 · 3:00 PM',  interviewer: 'Aisha Khan',    score: 9,  email: 'pooja@email.com',  phone: '+91 87654 33221', note: 'Excellent candidate, offer in progress' },
  { id: 'c3', name: 'Vikram Sood',    initials: 'VS', role: 'Software Engineer',      department: 'Tech',      stage: 'SCREENING',    mode: 'PHONE',     scheduledDate: 'Aug 28, 2026 · 10:30 AM', interviewer: 'Priya Sharma',  score: undefined, email: 'vikram@email.com', phone: '+91 77889 44332' },
  { id: 'c4', name: 'Sunita Rao',     initials: 'SR', role: 'Team Leader',            department: 'Sales',     stage: 'INTERVIEW_2',  mode: 'IN_PERSON', scheduledDate: 'Aug 27, 2026 · 2:00 PM',  interviewer: 'Amit Shah',     score: 8,  email: 'sunita@email.com', phone: '+91 66778 55443', note: 'Internal referral — strong leadership background' },
  { id: 'c5', name: 'Dev Sharma',     initials: 'DS', role: 'Marketing Manager',      department: 'Marketing', stage: 'HIRED',        mode: 'VIDEO',     scheduledDate: 'Aug 20, 2026 · 11:00 AM', interviewer: 'Rajesh Kumar',  score: 9,  email: 'dev@email.com',    phone: '+91 55667 66554', note: 'Offer accepted — joining Sep 1' },
  { id: 'c6', name: 'Ritu Kapoor',    initials: 'RK', role: 'Senior Sales Executive', department: 'Sales',     stage: 'REJECTED',     mode: 'VIDEO',     scheduledDate: 'Aug 22, 2026 · 4:00 PM',  interviewer: 'Amit Shah',     score: 4,  email: 'ritu@email.com',   phone: '+91 44556 77665', note: 'Did not meet communication benchmark' },
  { id: 'c7', name: 'Karan Bhatia',   initials: 'KB', role: 'HR Executive',           department: 'HR',        stage: 'APPLIED',      mode: 'PHONE',     scheduledDate: 'Aug 29, 2026 · 9:00 AM',  interviewer: 'Aisha Khan',    score: undefined, email: 'karan@email.com',  phone: '+91 33445 88776' },
];

const STAGE_ORDER: InterviewStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW_1', 'INTERVIEW_2', 'OFFER', 'HIRED', 'REJECTED'];

// ── New/Edit Candidate Modal ──────────────────────────────
function CandidateModal({ candidate, onClose, onSave }: {
  candidate: Candidate | null;
  onClose: () => void;
  onSave: (c: Candidate) => void;
}) {
  const [name, setName] = useState(candidate?.name ?? '');
  const [role, setRole] = useState(candidate?.role ?? '');
  const [department, setDepartment] = useState(candidate?.department ?? 'Sales');
  const [stage, setStage] = useState<InterviewStage>(candidate?.stage ?? 'APPLIED');
  const [mode, setMode] = useState<InterviewMode>(candidate?.mode ?? 'VIDEO');
  const [scheduledDate, setScheduledDate] = useState(candidate?.scheduledDate ?? '');
  const [interviewer, setInterviewer] = useState(candidate?.interviewer ?? '');
  const [email, setEmail] = useState(candidate?.email ?? '');
  const [phone, setPhone] = useState(candidate?.phone ?? '');
  const [note, setNote] = useState(candidate?.note ?? '');

  const handleSave = () => {
    if (!name.trim() || !role.trim()) return;
    const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    onSave({
      id: candidate?.id ?? `c_${Date.now()}`,
      name: name.trim(), initials, role: role.trim(), department, stage, mode,
      scheduledDate: scheduledDate.trim() || 'TBD',
      interviewer: interviewer.trim() || 'TBD',
      email: email.trim(), phone: phone.trim(),
      score: candidate?.score,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/88 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <UserCheck size={18} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-sm">{candidate ? 'Edit Candidate' : 'Add New Candidate'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted text-xs font-semibold block mb-1">Candidate Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="crm-input w-full" autoFocus />
            </div>
            <div>
              <label className="text-muted text-xs font-semibold block mb-1">Applying For *</label>
              <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Sales Executive" className="crm-input w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted text-xs font-semibold block mb-1">Department</label>
              <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Sales, HR, Tech" className="crm-input w-full" />
            </div>
            <div>
              <label className="text-muted text-xs font-semibold block mb-1">Interviewer</label>
              <input value={interviewer} onChange={e => setInterviewer(e.target.value)} placeholder="Assigned interviewer" className="crm-input w-full" />
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="text-muted text-xs font-semibold block mb-1.5">Stage</label>
            <div className="grid grid-cols-4 gap-1.5">
              {STAGE_ORDER.filter(s => s !== 'REJECTED').map(s => {
                const st = STAGE_STYLES[s];
                return (
                  <button key={s} onClick={() => setStage(s)} className={cn('py-1.5 rounded-lg border text-[10px] font-bold transition-all', stage === s ? `${st.bg} ${st.text} ${st.border}` : 'border-slate-800 text-muted hover:border-slate-600')}>
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="text-muted text-xs font-semibold block mb-1.5">Interview Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['VIDEO', 'IN_PERSON', 'PHONE'] as InterviewMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)} className={cn('py-2 rounded-lg border text-xs font-semibold transition-all', mode === m ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'border-slate-800 text-muted hover:border-slate-600 hover:text-white')}>
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-muted text-xs font-semibold block mb-1">Scheduled Date & Time</label>
            <input value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} placeholder="e.g. Aug 27, 2026 · 11:00 AM" className="crm-input w-full" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted text-xs font-semibold block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="candidate@email.com" className="crm-input w-full" />
            </div>
            <div>
              <label className="text-muted text-xs font-semibold block mb-1">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="crm-input w-full" />
            </div>
          </div>

          <div>
            <label className="text-muted text-xs font-semibold block mb-1">Internal Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Interviewer notes, strengths, concerns..." className="crm-input w-full resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 text-xs py-2.5">Cancel</button>
            <button onClick={handleSave} disabled={!name.trim() || !role.trim()} className="btn-primary flex-1 text-xs py-2.5 gap-1.5 disabled:opacity-40" style={{ background: '#10b981' }}>
              <CheckCircle2 size={13} /> Save Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Score stars ───────────────────────────────────────────
function ScoreStars({ score }: { score?: number }) {
  if (!score) return <span className="text-muted text-xs">Not scored</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} className={i <= Math.round(score / 2) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
      ))}
      <span className="text-amber-400 text-xs font-bold ml-1">{score}/10</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function InterviewsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<InterviewStage | 'ALL'>('ALL');
  const [editModal, setEditModal] = useState<{ open: boolean; candidate: Candidate | null }>({ open: false, candidate: null });
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);

  const filtered = candidates.filter(c => {
    const matchStage = filterStage === 'ALL' || c.stage === filterStage;
    const matchSearch = !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()) || c.department.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchSearch;
  });

  const handleSave = (c: Candidate) => {
    setCandidates(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = c; return copy; }
      return [c, ...prev];
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this candidate?')) return;
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const handleStageShift = (id: string, nextStage: InterviewStage) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: nextStage } : c));
    if (viewCandidate?.id === id) setViewCandidate(prev => prev ? { ...prev, stage: nextStage } : prev);
  };

  const stats = {
    total: candidates.length,
    active: candidates.filter(c => !['HIRED', 'REJECTED'].includes(c.stage)).length,
    hired: candidates.filter(c => c.stage === 'HIRED').length,
    scheduled: candidates.filter(c => ['INTERVIEW_1', 'INTERVIEW_2'].includes(c.stage)).length,
  };

  return (
    <>
      <Topbar
        title="Interview for Hiring"
        actions={
          <button onClick={() => setEditModal({ open: true, candidate: null })} className="btn-primary text-xs gap-1.5 px-3 py-2">
            <Plus size={14} /> Add Candidate
          </button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto animate-fade-in">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Candidates', value: stats.total,     icon: Users,       color: 'text-indigo-400',  bg: 'bg-indigo-500/15' },
            { label: 'Active Pipeline',  value: stats.active,    icon: TrendingUp,  color: 'text-cyan-400',    bg: 'bg-cyan-500/15' },
            { label: 'Interviews Today', value: stats.scheduled, icon: Calendar,    color: 'text-amber-400',   bg: 'bg-amber-500/15' },
            { label: 'Hired This Month', value: stats.hired,     icon: CheckCircle2,color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <p className="text-muted text-xs font-medium">{s.label}</p>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
                  <s.icon size={15} className={s.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="crm-card p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates by name, role, or department..." className="crm-input pl-9 w-full" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setFilterStage('ALL')} className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border transition-all', filterStage === 'ALL' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'border-slate-800 text-muted hover:text-white hover:border-slate-600')}>All</button>
              {STAGE_ORDER.map(s => {
                const st = STAGE_STYLES[s];
                return (
                  <button key={s} onClick={() => setFilterStage(s)} className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border transition-all', filterStage === s ? `${st.bg} ${st.text} ${st.border}` : 'border-slate-800 text-muted hover:text-white hover:border-slate-600')}>
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pipeline Kanban-style overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
          {STAGE_ORDER.map(s => {
            const st = STAGE_STYLES[s];
            const count = candidates.filter(c => c.stage === s).length;
            return (
              <div key={s} className={cn('crm-card p-3 border cursor-pointer transition-all hover:scale-105', filterStage === s ? st.border : 'border-slate-800')} onClick={() => setFilterStage(s === filterStage ? 'ALL' : s)}>
                <p className={cn('text-lg font-bold', st.text)}>{count}</p>
                <p className="text-muted text-[10px] font-semibold mt-0.5">{st.label}</p>
              </div>
            );
          })}
        </div>

        {/* Candidate List */}
        {filtered.length === 0 ? (
          <div className="crm-card p-12 text-center">
            <UserCheck size={40} className="text-muted mx-auto mb-3" />
            <p className="text-white font-semibold">No candidates found</p>
            <p className="text-muted text-sm mt-1">Add a new candidate or adjust the filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(c => {
              const st = STAGE_STYLES[c.stage];
              const stageIdx = STAGE_ORDER.indexOf(c.stage);
              const nextStage = stageIdx < STAGE_ORDER.length - 2 ? STAGE_ORDER[stageIdx + 1] : null;
              return (
                <div key={c.id} className="crm-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-indigo-500/30 transition-all">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {c.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-bold text-sm">{c.name}</p>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0', st.bg, st.text, st.border)}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-muted text-xs flex items-center gap-1"><Briefcase size={10} /> {c.role}</span>
                      <span className="text-muted text-xs">{c.department}</span>
                      <span className="text-muted text-xs">{MODE_LABEL[c.mode]}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-muted text-xs flex items-center gap-1"><Calendar size={10} /> {c.scheduledDate}</span>
                      <span className="text-muted text-xs flex items-center gap-1"><UserCheck size={10} /> {c.interviewer}</span>
                    </div>
                    {c.score !== undefined && (
                      <div className="mt-1.5"><ScoreStars score={c.score} /></div>
                    )}
                    {c.note && <p className="text-muted text-xs italic mt-1 line-clamp-1">"{c.note}"</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                    {nextStage && c.stage !== 'HIRED' && c.stage !== 'REJECTED' && (
                      <button onClick={() => handleStageShift(c.id, nextStage)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-all">
                        <ChevronRight size={12} /> {STAGE_STYLES[nextStage].label}
                      </button>
                    )}
                    {c.stage !== 'REJECTED' && c.stage !== 'HIRED' && (
                      <button onClick={() => handleStageShift(c.id, 'REJECTED')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-all">
                        <X size={11} /> Reject
                      </button>
                    )}
                    <a href={`mailto:${c.email}`} className="p-1.5 rounded-lg bg-slate-800 text-muted border border-slate-700 hover:text-white hover:border-slate-600 transition-all">
                      <Mail size={13} />
                    </a>
                    <a href={`tel:${c.phone}`} className="p-1.5 rounded-lg bg-slate-800 text-muted border border-slate-700 hover:text-white hover:border-slate-600 transition-all">
                      <Phone size={13} />
                    </a>
                    <button onClick={() => setEditModal({ open: true, candidate: c })} className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editModal.open && (
        <CandidateModal
          candidate={editModal.candidate}
          onClose={() => setEditModal({ open: false, candidate: null })}
          onSave={handleSave}
        />
      )}
    </>
  );
}
