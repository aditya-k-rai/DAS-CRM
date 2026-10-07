'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, Radio, Megaphone, Plus, ArrowRight, CheckCircle2, Clock,
  AlertTriangle, Shield, UserCheck, X, Send, Sparkles
} from 'lucide-react';
import { useAuth, normalizeRoleStr } from '@/context/AuthContext';
import { noticeBoardManager, type WebNoticeItem } from '@/lib/noticeBoardManager';

interface NoticeBoardWidgetProps {
  title?: string;
  maxItems?: number;
  className?: string;
}

export function NoticeBoardWidget({
  title = 'The Notice Board',
  maxItems = 3,
  className = '',
}: NoticeBoardWidgetProps) {
  const { currentUser } = useAuth();
  const normalizedRole = normalizeRoleStr(currentUser?.role || '');
  const isAdminOrManager = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR'].includes(normalizedRole);

  const [notices, setNotices] = useState<WebNoticeItem[]>(() => noticeBoardManager.getNotices());
  const [showPostModal, setShowPostModal] = useState(false);

  // Post form state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'CRITICAL' | 'IMPORTANT' | 'GENERAL'>('IMPORTANT');
  const [selectedMention, setSelectedMention] = useState('@All Staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initial fetch from server API
    noticeBoardManager.fetchServerNotices().then(setNotices).catch(() => {});

    // Subscribe to live multi-tab & window broadcasts
    const unsubscribe = noticeBoardManager.subscribe((updated) => {
      setNotices(updated);
    });

    return () => unsubscribe();
  }, []);

  const activeNotices = notices.filter(n => n.expiresAt > Date.now());
  const displayNotices = activeNotices.slice(0, maxItems);

  const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userKey = currentUser?.email || currentUser?.name || 'user';
    await noticeBoardManager.acknowledgeNotice(id, userKey);
  };

  const handlePostNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert('Please fill out Notice Title and Message.');
      return;
    }
    setIsSubmitting(true);
    try {
      await noticeBoardManager.postNotice({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        author: currentUser?.name || 'Management',
        authorRole: normalizedRole,
        priority: noticePriority,
        mentions: [selectedMention],
      });
      setNoticeTitle('');
      setNoticeContent('');
      setShowPostModal(false);
    } catch (err) {
      console.warn('Post notice error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRemainingDays = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Purging';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days >= 1) return `${days}d left`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h left`;
  };

  const userIdentifier = currentUser?.email || currentUser?.name || 'user';

  return (
    <div className={`crm-card space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-sm">
            <Radio size={16} className="text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              {title}
              {activeNotices.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                  {activeNotices.length} Active
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400">One-way admin directives · Auto-purges in 7 days</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdminOrManager && (
            <button
              onClick={() => setShowPostModal(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
              title="Post Notice"
            >
              <Plus size={12} /> Post
            </button>
          )}
          <Link
            href="/notice-board"
            className="text-xs text-indigo-400 font-bold hover:text-indigo-300 hover:underline flex items-center gap-1"
          >
            All Notices <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Notices Stream */}
      {displayNotices.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-2">
          <Megaphone size={22} className="mx-auto text-slate-500 opacity-60" />
          <p className="font-bold text-xs text-slate-300">No active notices broadcasted</p>
          <p className="text-[11px] text-slate-500">Official company announcements and policy updates will appear here.</p>
          {isAdminOrManager && (
            <button
              onClick={() => setShowPostModal(true)}
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold hover:underline"
            >
              <Plus size={12} /> Post an Announcement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayNotices.map((n) => {
            const hasAcknowledged = n.acknowledgedBy?.includes(userIdentifier);
            const isCritical = n.priority === 'CRITICAL';
            const isImportant = n.priority === 'IMPORTANT';

            const borderTheme = isCritical
              ? 'border-rose-500/50 bg-rose-950/20'
              : isImportant
              ? 'border-amber-500/40 bg-amber-950/20'
              : 'border-indigo-500/30 bg-indigo-950/20';

            const badgeTheme = isCritical
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : isImportant
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';

            return (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border ${borderTheme} transition-all relative overflow-hidden space-y-2 group shadow-sm`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${badgeTheme}`}>
                      {isCritical ? '🚨 CRITICAL' : isImportant ? '⚡ IMPORTANT' : '📢 NOTICE'}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">{n.title}</h4>
                  </div>

                  <span className="text-[10px] text-slate-400 flex-shrink-0 flex items-center gap-1 font-mono">
                    <Clock size={10} className="text-slate-500" /> {formatRemainingDays(n.expiresAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {n.content}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>By <strong className="text-slate-200">{n.author}</strong> ({n.authorRole})</span>
                    {n.mentions && n.mentions.length > 0 && (
                      <span className="text-indigo-400 font-semibold">{n.mentions.join(', ')}</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleAcknowledge(n.id, e)}
                    disabled={hasAcknowledged}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 ${
                      hasAcknowledged
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 size={11} className={hasAcknowledged ? 'text-emerald-400' : 'text-slate-400'} />
                    <span>{hasAcknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Post Notice Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Broadcast Direct Notice</h3>
                  <p className="text-[10px] text-slate-400">Syncs instantly across all company dashboards</p>
                </div>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePostNoticeSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Notice Title *</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Q3 Sales Sprint & Bonus Targets Announced"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Directive Message Content *</label>
                <textarea
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  rows={4}
                  placeholder="Write official one-way communication details, guidelines, or incentive structure..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Priority Level</label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="CRITICAL">🚨 Critical Directive</option>
                    <option value="IMPORTANT">⚡ Important Announcement</option>
                    <option value="GENERAL">📢 General Update</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Target Audience</label>
                  <select
                    value={selectedMention}
                    onChange={(e) => setSelectedMention(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="@All Staff">@All Staff</option>
                    <option value="@Sales Team">@Sales Team</option>
                    <option value="@Managers">@Managers</option>
                    <option value="@HR Department">@HR Department</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  <Send size={13} /> {isSubmitting ? 'Publishing...' : 'Publish Notice (7-Day Purge)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
