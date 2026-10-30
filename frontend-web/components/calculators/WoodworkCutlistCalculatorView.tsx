'use client';

/**
 * WoodworkCutlistCalculatorView.tsx
 * Scaffold placeholder — scalable architecture for the Woodwork Cutlist Optimizer.
 *
 * HOW TO BUILD:
 * 1. Add sheet/panel input (standard sheet sizes, thickness, material type).
 * 2. Add parts list input (part name, length, width, quantity).
 * 3. Implement 2D bin-packing / nesting algorithm for panel optimization.
 * 4. Output: optimized layout per sheet, total sheets required, wastage %.
 * 5. Exportable PDF cutlist for workshop/factory use.
 *
 * Module key: WOODWORK_CUTLIST_CALC
 */

import { Scissors, Grid3x3, Calculator, Lock, ChevronRight } from 'lucide-react';

export function WoodworkCutlistCalculatorView() {
  return (
    <div className="space-y-6">
      {/* ── Module Header Card ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
            <Scissors size={26} className="text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">Woodwork Cutlist Calculator</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25 uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Optimized panel cutlist for woodworking projects — input parts list, select sheet dimensions,
              and get a 2D nesting layout that minimizes material wastage.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-sky-400/70 bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-2 shrink-0">
          <Lock size={12} />
          <span className="font-semibold">Build in progress</span>
        </div>
      </div>

      {/* ── Feature Preview Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: '📐', title: 'Sheet / Panel Setup', desc: 'Define standard or custom sheet sizes (8×4, 7×4, 6×4 ft) and thickness.' },
          { icon: '📋', title: 'Parts List Input', desc: 'Add parts (name, L×W, quantity) for a complete project BOM.' },
          { icon: '🧩', title: 'Panel Nesting Engine', desc: '2D bin-packing algorithm to minimize wastage across sheets.' },
          { icon: '📊', title: 'Wastage Report', desc: 'Per-sheet utilization %, total offcut area, and material cost savings.' },
          { icon: '🗂️', title: 'Multi-Material Support', desc: 'Separate cutlists for plywood, MDF, particle board, and hardwood.' },
          { icon: '🖨️', title: 'PDF Workshop Sheet', desc: 'Printable panel layouts with part labels — ready for factory use.' },
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
       *  <SheetSetupPanel sheets={sheets} onChange={setSheets} />
       *  <PartsListTable parts={parts} onAdd={handleAdd} onRemove={handleRemove} />
       *  <KeepWidth value={keepWidth} onChange={setKeepWidth} />  (saw blade kerf)
       * ─────────────────────────────────────────────────────────── */}

      {/* ── OUTPUT ZONE — add result cards here ─────────────────────
       *  <CutlistOutput sheets={sheets} parts={parts} layout={layout} />
       *  <WastageReport utilization={utilization} totalSheets={totalSheets} />
       * ─────────────────────────────────────────────────────────── */}

      {/* Placeholder CTA */}
      <div className="rounded-2xl border border-dashed border-border p-10 flex flex-col items-center gap-3 text-center">
        <Calculator size={32} className="text-muted-foreground/40" />
        <p className="text-sm font-semibold text-muted-foreground">Calculator inputs will appear here</p>
        <p className="text-xs text-muted-foreground/60 max-w-sm">
          This module is scaffolded and ready. Add sheet setup, parts list, and nesting output above.
        </p>
        <div className="flex items-center gap-1 text-xs text-sky-400 font-semibold mt-1">
          <Grid3x3 size={12} /> Add parts list above to get started <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}

