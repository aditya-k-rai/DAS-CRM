'use client';

/**
 * ConstructionCalculatorView.tsx
 * Scaffold placeholder — scalable architecture for the Construction Cost Estimator.
 *
 * HOW TO BUILD:
 * 1. Add input sections (material types, labour, floors, area) inside the <sections> area below.
 * 2. Add calculation logic in the `useCalculator` hook (to be created in /hooks/useConstructionCalculator.ts).
 * 3. Add result cards in the OUTPUT ZONE area below.
 * 4. The sidebar layout and topbar actions wiring are already in place.
 *
 * Module key: CONSTRUCTION_CALC
 */

import { HardHat, Ruler, Calculator, Lock, ChevronRight } from 'lucide-react';

export function ConstructionCalculatorView() {
  return (
    <div className="space-y-6">
      {/* ── Module Header Card ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
            <HardHat size={26} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">Construction Calculator</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Estimate complete construction costs — civil, structure, MEP, finishes, and labour —
              project-wise with configurable rates and GST.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 shrink-0">
          <Lock size={12} />
          <span className="font-semibold">Build in progress</span>
        </div>
      </div>

      {/* ── Feature Preview Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: '🏗️', title: 'Civil & Structure', desc: 'Foundation, RCC, brickwork, plastering, flooring area calculations.' },
          { icon: '⚡', title: 'MEP Systems', desc: 'Electrical, plumbing, HVAC — point-based cost estimates.' },
          { icon: '🪟', title: 'Doors & Windows', desc: 'Frame, shutter, hardware cost per unit with material selector.' },
          { icon: '🎨', title: 'Finishes & Paint', desc: 'Wall area, primer, paint layers, putty, and waterproofing.' },
          { icon: '👷', title: 'Labour Rates', desc: 'Skilled & unskilled labour per sq.ft or per day configurable rates.' },
          { icon: '📊', title: 'Project Summary', desc: 'Full BOQ export — phase-wise cost breakdown and GST-applied totals.' },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-border bg-card p-5 opacity-60 cursor-not-allowed"
          >
            <div className="text-2xl mb-3">{feature.icon}</div>
            <h3 className="text-sm font-bold text-foreground mb-1">{feature.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* ── INPUT SECTIONS — add your calculator inputs here ────────
       *  Example structure for reference (uncomment when building):
       *
       *  <CalculatorInputSection title="Project Details">
       *    <InputRow label="Total Plot Area (sq.ft)" name="plotArea" />
       *    <InputRow label="No. of Floors" name="floors" />
       *  </CalculatorInputSection>
       *
       *  <CalculatorInputSection title="Civil & Structure">
       *    <RateRow label="Foundation (per sq.ft)" name="foundationRate" default={350} />
       *    ...
       *  </CalculatorInputSection>
       * ─────────────────────────────────────────────────────────── */}

      {/* ── OUTPUT ZONE — add result cards here ─────────────────────
       *  Example:
       *  <CostSummaryCard total={totalCost} breakdown={breakdown} />
       * ─────────────────────────────────────────────────────────── */}

      {/* Placeholder CTA */}
      <div className="rounded-2xl border border-dashed border-border p-10 flex flex-col items-center gap-3 text-center">
        <Calculator size={32} className="text-muted-foreground/40" />
        <p className="text-sm font-semibold text-muted-foreground">Calculator inputs will appear here</p>
        <p className="text-xs text-muted-foreground/60 max-w-sm">
          This module is scaffolded and ready. Add input fields, material rates, and output summary components above to build this calculator.
        </p>
        <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold mt-1">
          <Ruler size={12} /> Add inputs above to get started <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}

