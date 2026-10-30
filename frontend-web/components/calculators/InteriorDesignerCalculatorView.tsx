'use client';

/**
 * InteriorDesignerCalculatorView.tsx
 * Scaffold placeholder — scalable architecture for the Interior Design Cost Estimator.
 *
 * HOW TO BUILD:
 * 1. Add room selector (living, bedroom, kitchen, bathroom) with area inputs.
 * 2. Add finish selector (basic / standard / premium / luxury) with rate matrix.
 * 3. Add furniture & soft-furnishing estimator.
 * 4. Wire output to a PDF-exportable summary.
 *
 * Module key: INTERIOR_DESIGN_CALC
 */

import { Sofa, PaintBucket, Calculator, Lock, ChevronRight } from 'lucide-react';

export function InteriorDesignerCalculatorView() {
  return (
    <div className="space-y-6">
      {/* ── Module Header Card ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center flex-shrink-0">
            <Sofa size={26} className="text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">Interior Designer Calculator</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Room-wise interior budgeting — wall treatments, flooring, ceiling, furniture, lighting,
              soft furnishings, and contractor charges with tier-based finish rates.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-rose-400/70 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2 shrink-0">
          <Lock size={12} />
          <span className="font-semibold">Build in progress</span>
        </div>
      </div>

      {/* ── Feature Preview Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: '🛋️', title: 'Room-Wise Budgeting', desc: 'Separate cost estimation for living, bedroom, kitchen, bathroom, and corridors.' },
          { icon: '🎨', title: 'Finish Tier Selector', desc: 'Basic / Standard / Premium / Luxury rate matrices per category.' },
          { icon: '🪵', title: 'Flooring & Cladding', desc: 'Tile, marble, wooden, vinyl — per sq.ft cost with wastage factor.' },
          { icon: '💡', title: 'Lighting & Electrical', desc: 'Point-based estimation for switches, fixtures, and concealed conduit.' },
          { icon: '🪑', title: 'Furniture & Fixtures', desc: 'Custom furniture, loose furniture, and sanitary fixtures cost input.' },
          { icon: '📋', title: 'Quotation Output', desc: 'Client-ready interior quotation with room-wise breakdown and GST.' },
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
       *  Suggested structure:
       *  <RoomSelector rooms={rooms} onAddRoom={handleAddRoom} />
       *  <FinishTierSelector value={tier} onChange={setTier} />
       *  <RoomInputCard room="Living Room" area={area} rates={rates} />
       * ─────────────────────────────────────────────────────────── */}

      {/* ── OUTPUT ZONE — add result cards here ─────────────────────
       *  <InteriorCostSummary rooms={rooms} totals={totals} />
       * ─────────────────────────────────────────────────────────── */}

      {/* Placeholder CTA */}
      <div className="rounded-2xl border border-dashed border-border p-10 flex flex-col items-center gap-3 text-center">
        <Calculator size={32} className="text-muted-foreground/40" />
        <p className="text-sm font-semibold text-muted-foreground">Calculator inputs will appear here</p>
        <p className="text-xs text-muted-foreground/60 max-w-sm">
          This module is scaffolded and ready. Add room selector, finish tier, and cost output components above.
        </p>
        <div className="flex items-center gap-1 text-xs text-rose-400 font-semibold mt-1">
          <PaintBucket size={12} /> Add room inputs above to get started <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}

