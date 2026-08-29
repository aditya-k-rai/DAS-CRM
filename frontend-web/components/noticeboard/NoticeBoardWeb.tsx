'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone, AtSign, Clock, Shield, CheckCircle2, Trash2, Plus,
  AlertTriangle, Filter, Sparkles, UserCheck, Send, Check
} from 'lucide-react';
import { useAuth, normalizeRoleStr } from '@/context/AuthContext';

export interface WebNoticeItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  avatar: string;
  createdAt: number;
  expiresAt: number; // createdAt + 7 days
  priority: 'CRITICAL' | 'IMPORTANT' | 'GENERAL';
  mentions: string[];
  acknowledgedBy: string[];
}

const STAFF_LIST = [
  '@All Staff',
  '@Rajesh Kumar',
  '@Priya Sharma',
  '@Amit Shah',
  '@Sunita Verma',
  '@Neha Joshi',
  '@Amit Patel',
  '@Rajesh Mehta',
];

const INITIAL_NOTICES: WebNoticeItem[] = [
  {
    id: 'wn_1',
    title: '📢 Q3 Enterprise Revenue Targets & Incentive Structure',
    content: 'Attention @All Staff and @Rajesh Kumar. New incentive tiers for Q3 deals have been published. Overtime & closure bonuses will be paid out bi-weekly. Please log all calls daily.',
    author: 'Aditya Kumar Rai',
    authorRole: 'ADMIN',
    avatar: 'AR',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
    priority: 'CRITICAL',
    mentions: ['@All Staff', '@Rajesh Kumar'],
    acknowledgedBy: ['emp_1', 'emp_4'],
  },
  {
    id: 'wn_2',
    title: '📌 System Maintenance & Database Sync Window',
    content: 'Notice for @Amit Shah and @Neha Joshi: Backend sync & database migration scheduled tonight at 11:00 PM IST. Live GPS camera attendance remains active.',
    author: 'Sunita Verma',
    authorRole: 'HR MANAGER',
    avatar: 'SV',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
    priority: 'IMPORTANT',
    mentions: ['@Amit Shah', '@Neha Joshi'],
    acknowledgedBy: ['emp_3'],
  },
  {
    id: 'wn_3',
    title: '🎉 Top Sales Executive of the Week Award',
    content: 'Congratulations to @Priya Sharma for closing 5 enterprise deals this week! Team celebration hosted this Friday at HQ Hub.',
    author: 'Rajesh Mehta',
    authorRole: 'DEPARTMENT MANAGER',
    avatar: 'RM',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
    priority: 'GENERAL',
    mentions: ['@Priya Sharma'],
    acknowledgedBy: ['emp_5', 'emp_7'],
  },
];

export function NoticeBoardWeb() {
  const { currentUser } = useAuth();
  const normalizedRole = normalizeRoleStr(currentUser?.role || '');
  const isAdminOrManager = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(normalizedRole);

  const [notices, setNotices] = useState<WebNoticeItem[]>(INITIAL_NOTICES);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<string[]>(['@All Staff']);
  const [priorityInput, setPriorityInput] = useState<'CRITICAL' | 'IMPORTANT' | 'GENERAL'>('IMPORTANT');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // 7-Day Auto-Purge Filter
  const activeNotices = notices.filter((n) => n.expiresAt > Date.now());

  const toggleMention = (staff: string) => {
    if (selectedMentions.includes(staff)) {
      setSelectedMentions(selectedMentions.filter((s) => s !== staff));
    } else {
      setSelectedMentions([...selectedMentions, staff]);
    }
  };

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !contentInput.trim()) {
      alert('Please enter both Title and Message content.');
      return;
    }

    const newNotice: WebNoticeItem = {
      id: `wn_${Date.now()}`,
      title: titleInput.trim(),
      content: contentInput.trim(),
      author: currentUser.name || 'Admin',
      authorRole: normalizedRole,
      avatar: (currentUser.name || 'AD').substring(0, 2).toUpperCase(),
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 Days Auto-Purge
      priority: priorityInput,
      mentions: selectedMentions.length > 0 ? selectedMentions : ['@All Staff'],
      acknowledgedBy: [],
    };

    setNotices([newNotice, ...notices]);
    setTitleInput('');
    setContentInput('');
    setSelectedMentions(['@All Staff']);
    setShowCreateForm(false);
    setSuccessToast('📌 Notice published successfully! It will automatically purge in 7 days.');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleAcknowledge = (id: string) => {
    setNotices((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const userKey = currentUser.email || 'user';
          if (!n.acknowledgedBy.includes(userKey)) {
            return { ...n, acknowledgedBy: [...n.acknowledgedBy, userKey] };
          }
        }
        return n;
      })
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      setNotices(notices.filter((n) => n.id !== id));
    }
  };

  const getTimeRemainingStr = (expiresAt: number) => {
    const diffMs = expiresAt - Date.now();
    if (diffMs <= 0) return 'Expired (Purged)';
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `⏳ Disappears in ${days}d ${hours}h (7-Day Auto-Purge)`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="crm-card bg-gradient-to-r from-card via-background to-card border border-border p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold text-lg flex items-center justify-center border border-indigo-500/30">
              <Megaphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">The Notice Board</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Shield size={12} /> {isAdminOrManager ? 'ADMIN BROADCAST' : 'EMPLOYEE STREAM'}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Official admin one-way directives with staff @mentions · Notices automatically purge after 7 days.
              </p>
            </div>
          </div>

          {isAdminOrManager && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Plus size={15} /> {showCreateForm ? 'Close Creator' : 'Post New Notice (@Mention)'}
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Admin Notice Creation Form */}
      {showCreateForm && isAdminOrManager && (
        <form onSubmit={handlePostNotice} className="crm-card p-6 rounded-3xl border border-indigo-500/40 space-y-4 animate-scale-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> Post New One-Way Notice
            </h3>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 font-bold">
              7-DAY AUTO-PURGE RULE ACTIVE
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted block">Notice Title</label>
            <input
              type="text"
              placeholder="e.g. 📢 Q3 Revenue Targets & Incentive Structure"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted block">Directive Message Content</label>
            <textarea
              rows={3}
              placeholder="Write important announcement content... Use staff @mentions to highlight specific team members."
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted block">Priority Tag</label>
              <div className="flex gap-2">
                {(['CRITICAL', 'IMPORTANT', 'GENERAL'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriorityInput(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      priorityInput === p
                        ? p === 'CRITICAL' ? 'bg-rose-500 text-white border-rose-500' :
                          p === 'IMPORTANT' ? 'bg-amber-500 text-white border-amber-500' :
                          'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-background border-border text-muted hover:text-white'
                    }`}
                  >
                    {p === 'CRITICAL' ? '🔴 Critical' : p === 'IMPORTANT' ? '🟡 Important' : '🔵 General'}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Mentions Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted block">Mention Staff Members (@Mentions)</label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-background border border-border">
                {STAFF_LIST.map((staff) => {
                  const isSel = selectedMentions.includes(staff);
                  return (
                    <button
                      type="button"
                      key={staff}
                      onClick={() => toggleMention(staff)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isSel
                          ? 'bg-brand/20 text-brand-300 border-brand/40 font-bold'
                          : 'bg-card border-border text-muted hover:text-white'
                      }`}
                    >
                      {staff} {isSel ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2">
              <Send size={14} /> Publish Notice (Auto-Purges in 7 Days)
            </button>
          </div>
        </form>
      )}

      {/* Notices Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Megaphone size={16} className="text-indigo-400" /> Active Notice Stream ({activeNotices.length})
          </h3>
          <span className="text-xs text-muted">Auto-purges after 7 days</span>
        </div>

        {activeNotices.length === 0 ? (
          <div className="crm-card p-12 text-center text-muted text-sm space-y-2">
            <Clock size={32} className="mx-auto text-muted/60 mb-2" />
            <p className="font-bold text-white">No Active Notices</p>
            <p className="text-xs">All previous announcements have automatically expired after 7 days.</p>
          </div>
        ) : (
          activeNotices.map((n) => {
            const userKey = currentUser.email || 'user';
            const isAcked = n.acknowledgedBy.includes(userKey);

            let priorityBg = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
            if (n.priority === 'CRITICAL') priorityBg = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
            else if (n.priority === 'IMPORTANT') priorityBg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';

            return (
              <div key={n.id} className="crm-card p-6 rounded-3xl border border-border hover:border-brand/40 transition-all space-y-4">
                {/* Notice Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 font-extrabold text-xs flex items-center justify-center border border-indigo-500/30">
                      {n.avatar}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-white">{n.author}</p>
                      <p className="text-[11px] text-muted">{n.authorRole} · Official Admin Directive</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border ${priorityBg}`}>
                    {n.priority} DIRECTIVE
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h4 className="font-extrabold text-base text-white mb-1.5">{n.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{n.content}</p>
                </div>

                {/* Mentions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <AtSign size={13} className="text-indigo-400" />
                  {n.mentions.map((m, idx) => (
                    <span key={idx} className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {m}
                    </span>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-border text-xs">
                  <span className="font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold">
                    {getTimeRemainingStr(n.expiresAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    {isAdminOrManager && (
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Notice"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}

                    <button
                      onClick={() => handleAcknowledge(n.id)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 ${
                        isAcked
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-card text-muted hover:text-white border-border'
                      }`}
                    >
                      {isAcked ? <Check size={14} className="text-emerald-400" /> : null}
                      {isAcked ? 'Read & Acknowledged' : 'Mark as Acknowledged →'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
