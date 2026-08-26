'use client';

import { Topbar } from '@/components/layout/Topbar';
import { UserCheck, Calendar, FileText, Video } from 'lucide-react';

export default function InterviewsPage() {
  return (
    <>
      <Topbar title="Interview for Hiring" />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="crm-card text-center py-16 px-8 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                <UserCheck size={36} className="text-white" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Interview for Hiring</h1>
              <p className="text-muted text-base max-w-lg mx-auto mb-8">
                Schedule, track, and manage candidate interviews with integrated calendar,
                feedback forms, and automated status updates across your hiring pipeline.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30">
                <Calendar size={16} className="text-amber-400" />
                <span className="text-amber-400 text-sm font-bold">Coming Soon — Under Active Development</span>
              </div>
            </div>
          </div>

          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="crm-card p-6">
              <Calendar size={28} className="text-emerald-400 mb-4" />
              <h3 className="text-white font-bold text-sm mb-2">Interview Scheduling</h3>
              <p className="text-muted text-xs">Drag-and-drop calendar integration with automated candidate notifications and reminders.</p>
            </div>
            <div className="crm-card p-6">
              <FileText size={28} className="text-teal-400 mb-4" />
              <h3 className="text-white font-bold text-sm mb-2">Feedback & Scorecards</h3>
              <p className="text-muted text-xs">Structured feedback forms for interviewers with scoring rubrics and comparison dashboards.</p>
            </div>
            <div className="crm-card p-6">
              <Video size={28} className="text-cyan-400 mb-4" />
              <h3 className="text-white font-bold text-sm mb-2">Video Interviews</h3>
              <p className="text-muted text-xs">Built-in video calling with recording, transcription, and AI-powered candidate assessment.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
