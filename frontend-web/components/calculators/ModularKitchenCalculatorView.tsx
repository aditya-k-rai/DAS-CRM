'use client';

/**
 * ModularKitchenCalculatorView.tsx
 * Scaffold placeholder — scalable architecture for the Modular Kitchen Cost Estimator.
 *
 * HOW TO BUILD:
 * 1. Add kitchen layout selector (L-shape, U-shape, straight, island, parallel).
 * 2. Add cabinet module input (wall units, base units, loft units) with dimensions.
 * 3. Add shutter material and hardware selector (handles, hinges, channels).
 * 4. Add counter-top, sink, hob, chimney cost inputs.
 * 5. Wire to PDF quotation output.
 *
 * Module key: MODULAR_KITCHEN_CALC
 */

import { ChefHat, Layers, Calculator, Lock, ChevronRight } from 'lucide-react';

export function ModularKitchenCalculatorView() {
  return (
    <div className="space-y-6">
      {/* ── Module Header Card ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
            <ChefHat size={26} className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">Modular Kitchen Calculator</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Full modular kitchen cost calculator — layout selection, cabinet modules, shutter material,
              hardware, counter-top, appliances, and installation charges.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 shrink-0">
          <Lock size={12} />
          <span className="font-semibold">Build in progress</span>
        </div>
      </div>

      {/* ── Feature Preview Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: '🏗️', title: 'Layout Selector', desc: 'L-shape, U-shape, straight, island, or parallel kitchen configuration.' },
          { icon: '🗄️', title: 'Cabinet Module Builder', desc: 'Wall units, base units, tall units — add modules with exact dimensions.' },
          { icon: '🪵', title: 'Shutter Material', desc: 'Acrylic, membrane, PVC, glass, laminate — per sq.ft rate selector.' },
          { icon: '🔩', title: 'Hardware & Fittings', desc: 'Hinges, channels, handles, baskets — unit-wise costing.' },
          { icon: '🍳', title: 'Counter & Appliances', desc: 'Granite, quartz, SS counter-tops + hob, chimney, and sink pricing.' },
          { icon: '📄', title: 'Client Quotation', desc: 'Itemized kitchen quotation with module list, rates, and GST total.' },
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
       *  <LayoutSelector value={layout} onChange={setLayout} />
       *  <CabinetModuleTable modules={modules} onAdd={handleAdd} onRemove={handleRemove} />
       *  <ShutterMaterialSelector value={material} onChange={setMaterial} />
       *  <HardwareCostInput hardware={hardware} onChange={setHardware} />
       * ─────────────────────────────────────────────────────────── */}

      {/* ── OUTPUT ZONE — add result cards here ─────────────────────
       *  <KitchenCostSummary modules={modules} totals={totals} />
       * ─────────────────────────────────────────────────────────── */}

      {/* Placeholder CTA */}
      <div className="rounded-2xl border border-dashed border-border p-10 flex flex-col items-center gap-3 text-center">
        <Calculator size={32} className="text-muted-foreground/40" />
        <p className="text-sm font-semibold text-muted-foreground">Calculator inputs will appear here</p>
        <p className="text-xs text-muted-foreground/60 max-w-sm">
          This module is scaffolded and ready. Add layout selector, cabinet table, and quotation output above.
        </p>
        <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold mt-1">
          <Layers size={12} /> Add kitchen modules above to get started <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}

