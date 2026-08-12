'use client';

import Link from 'next/link';
import {
  Target, CheckSquare, Phone, Mail, FileText, Sparkles, TrendingUp,
  Clock, CheckCircle2, AlertCircle, ArrowRight, Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function EmployeeRoleDashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="crm-card p-6 border-l-4 border-l-brand bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-brand/20 text-brand-400">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Good morning, {currentUser.name}! 👋</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-brand/20 text-brand-400 border border-brand/30">
                  MY WORKSPACE (EMPLOYEE)
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">You have <strong className="text-white">5 follow-ups due today</strong> and <strong className="text-white">3 deals closing this week</strong>.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/leads" className="btn-secondary text-xs gap-1.5 flex items-center">
              <Target size={13} /> My Leads
            </Link>
            <Link href="/tasks" className="btn-primary text-xs gap-1.5 flex items-center">
              <Plus size={13} /> Add Task
            </Link>
          </div>
        </div>
      </div>

      {/* Employee Personal Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">My Assigned Leads</p>
          <p className="text-2xl font-extrabold text-white">31 Leads</p>
          <p className="text-xs text-brand-400 font-semibold mt-1">Scoped Rep View</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">My Closed Deals Value</p>
          <p className="text-2xl font-extrabold text-brand-400">₹5.2L</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">12 Deals Won</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">My Conversion Rate</p>
          <p className="text-2xl font-extrabold text-emerald-400">38.7%</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">↑ +5.2% personal best</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">My Tasks Due Today</p>
          <p className="text-2xl font-extrabold text-amber-400">5 Tasks</p>
          <p className="text-xs text-amber-400 font-semibold mt-1">High Priority</p>
        </div>
      </div>

      {/* Grid: My Tasks & AI Score Leads */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: My Tasks Today */}
        <div className="col-span-12 lg:col-span-7 crm-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <CheckSquare size={16} className="text-brand-400" /> My Tasks & Follow-ups
            </h3>
            <Link href="/tasks" className="text-xs text-brand-400 font-semibold hover:underline">
              View All Tasks →
            </Link>
          </div>

          <div className="space-y-2">
            {[
              { title: 'Follow up with Rajesh Kumar', lead: 'TechCorp Ltd', time: 'Today 2:00 PM', priority: 'HIGH' },
              { title: 'Send quotation to TechCorp', lead: 'TechCorp Ltd', time: 'Today 5:00 PM', priority: 'HIGH' },
              { title: 'Schedule demo — Real Estate lead', lead: 'Priya Sharma', time: 'Tomorrow', priority: 'MEDIUM' },
            ].map(t => (
              <div key={t.title} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                <div>
                  <p className="font-semibold text-sm text-white">{t.title}</p>
                  <p className="text-xs text-muted">{t.lead} · <Clock size={11} className="inline mr-1" />{t.time}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/15 text-amber-400">
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Personal Hot Leads */}
        <div className="col-span-12 lg:col-span-5 crm-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" /> Hot AI Scored Leads
            </h3>
            <Link href="/leads" className="text-xs text-brand-400 font-semibold hover:underline">
              All Assigned →
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { name: 'TechCorp Ltd', score: 91, val: '₹5.2L', status: 'Proposal' },
              { name: 'Lakshmi Automobiles', score: 98, val: '₹12.0L', status: 'Won' },
              { name: 'Rajesh Kumar', score: 85, val: '₹2.4L', status: 'Qualified' },
            ].map(l => (
              <div key={l.name} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                <div>
                  <Link href="/leads/1" className="font-bold text-sm text-white hover:underline">
                    {l.name}
                  </Link>
                  <p className="text-xs text-muted">{l.val} · Status: {l.status}</p>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400">
                  🔥 {l.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
