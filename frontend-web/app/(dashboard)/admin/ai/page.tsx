'use client';

import { Topbar } from '@/components/layout/Topbar';
import { Sparkles, Bot, Wand2, BrainCircuit } from 'lucide-react';

export default function AICustomizationPage() {
  return (
    <>
      <Topbar title="AI Customization" />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="crm-card text-center py-16 px-8 mb-8 relative overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25">
                <Sparkles size={36} className="text-white" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">AI Customization</h1>
              <p className="text-muted text-base max-w-lg mx-auto mb-8">
                Configure AI-powered lead scoring, automated follow-ups, smart pipeline routing,
                and custom bot rules tailored to your business workflows.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30">
                <Wand2 size={16} className="text-amber-400" />
                <span className="text-amber-400 text-sm font-bold">Coming Soon — Under Active Development</span>
              </div>
            </div>
          </div>

          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="crm-card p-6">
              <BrainCircuit size={28} className="text-indigo-400 mb-4" />
              <h3 className="text-white font-bold text-sm mb-2">AI Lead Scoring</h3>
              <p className="text-muted text-xs">Automatically score and rank leads using ML models trained on your historical conversion data.</p>
            </div>
            <div className="crm-card p-6">
              <Bot size={28} className="text-purple-400 mb-4" />
              <h3 className="text-white font-bold text-sm mb-2">Smart Chatbots</h3>
              <p className="text-muted text-xs">Deploy AI chatbots for WhatsApp and web that qualify leads and book demos automatically.</p>
            </div>
            <div className="crm-card p-6">
              <Wand2 size={28} className="text-cyan-400 mb-4" />
              <h3 className="text-white font-bold text-sm mb-2">Auto Follow-ups</h3>
              <p className="text-muted text-xs">AI generates personalized follow-up emails and messages based on lead engagement patterns.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
