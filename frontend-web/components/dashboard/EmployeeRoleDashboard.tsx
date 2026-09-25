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
    <div className="space-y-6 text-foreground">
      {/* Header Banner */}
      <div className="crm-card p-6 border-l-4 border-l-brand bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-brand/20 text-indigo-600 dark:text-brand-400">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">Good morning, {currentUser.name}! 👋</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-brand/20 text-indigo-700 dark:text-brand-400 border border-brand/30">
                  MY WORKSPACE (EMPLOYEE)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Welcome to your employee workspace. Track your assigned leads, tasks, and follow-ups in real-time.</p>
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
          <p className="text-xs text-muted-foreground font-medium mb-1">My Assigned Leads</p>
          <p className="text-2xl font-extrabold text-foreground">0 Leads</p>
          <p className="text-xs text-indigo-600 dark:text-brand-400 font-semibold mt-1">Scoped Rep View</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">My Closed Deals Value</p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-brand-400">₹0</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">0 Deals Won</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">My Conversion Rate</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">0.0%</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Baseline metric</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">My Tasks Due Today</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">0 Tasks</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">All Caught Up</p>
        </div>
      </div>

      {/* Grid: My Tasks & AI Score Leads */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: My Tasks Today */}
        <div className="col-span-12 lg:col-span-7 crm-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <CheckSquare size={16} className="text-indigo-600 dark:text-brand-400" /> My Tasks & Follow-ups
            </h3>
            <Link href="/tasks" className="text-xs text-indigo-600 dark:text-brand-400 font-semibold hover:underline">
              View All Tasks →
            </Link>
          </div>

          <div className="p-8 text-center text-muted border border-dashed border-border rounded-xl">
            <CheckSquare size={28} className="mx-auto mb-2 text-muted/60" />
            <p className="font-bold text-sm text-foreground">No tasks scheduled today</p>
            <p className="text-xs text-muted-foreground mt-1">Add tasks and follow-ups to keep your pipeline organized.</p>
          </div>
        </div>

        {/* Right: Personal Hot Leads */}
        <div className="col-span-12 lg:col-span-5 crm-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 dark:text-amber-400" /> Hot AI Scored Leads
            </h3>
            <Link href="/leads" className="text-xs text-indigo-600 dark:text-brand-400 font-semibold hover:underline">
              All Assigned →
            </Link>
          </div>

          <div className="p-8 text-center text-muted border border-dashed border-border rounded-xl">
            <Sparkles size={28} className="mx-auto mb-2 text-muted/60" />
            <p className="font-bold text-sm text-foreground">No hot leads assigned yet</p>
            <p className="text-xs text-muted-foreground mt-1">Leads with high conversion probability will be highlighted here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
