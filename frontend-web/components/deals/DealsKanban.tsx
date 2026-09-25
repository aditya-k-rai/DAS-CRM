'use client';

import { useState } from 'react';
import { MoreHorizontal, Plus, Calendar, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkflowPipelineStages } from '@/lib/workflowService';

export function DealsKanban() {
  const { currentUser } = useAuth();
  const { stages } = useWorkflowPipelineStages();
  const [allDeals, setAllDeals] = useState<Record<string, any[]>>({});

  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isRep = rawRole === 'SALES_EXEC' || rawRole === 'EMPLOYEE' || rawRole === 'STAFF' || rawRole === 'REP';

  // Filter deals by owner if logged in as a Sales Executive
  const getScopedDeals = () => {
    if (!isRep) return allDeals;

    const scoped: Record<string, any[]> = {};
    Object.keys(allDeals).forEach((stageId) => {
      scoped[stageId] = (allDeals[stageId] || []).filter(
        (deal) => deal.ownerName === currentUser.name || deal.owner === currentUser.avatar || deal.ownerId === currentUser.id
      );
    });
    return scoped;
  };

  const scopedDeals = getScopedDeals();

  const getStageDeals = (stage: { id: string; name: string }) => {
    return scopedDeals[stage.id] || scopedDeals[stage.name.toLowerCase().replace(/\s+/g, '_')] || [];
  };

  const stageTotal = (stage: { id: string; name: string }) =>
    getStageDeals(stage).reduce((s, d) => s + parseInt(String(d.value || 0).replace(/[₹,]/g, '') || '0'), 0);

  return (
    <div className="space-y-4">
      {/* Role Scoping Banner for Sales Executive */}
      {isRep && (
        <div className="bg-indigo-500/15 border border-indigo-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-indigo-400" />
            <span>
              Role Access Restriction (SALES_EXEC): Viewing assigned deals only for <strong>{currentUser.name}</strong>.
            </span>
          </div>
          <span className="font-bold text-brand-400 px-2 py-0.5 rounded bg-brand/20 border border-brand/30">
            Personal Pipeline View
          </span>
        </div>
      )}

      {/* Pipeline summary bar */}
      <div className="crm-card p-4">
        <div
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`,
          }}
        >
          {stages.map((stage) => {
            const total = stageTotal(stage);
            const count = getStageDeals(stage).length;
            return (
              <div key={stage.id} className="text-center p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="h-1.5 rounded-full mb-2" style={{ background: stage.color }} />
                <p className="text-xs font-semibold truncate" style={{ color: stage.color }}>{stage.name}</p>
                <p className="text-sm font-bold mt-0.5 text-white">₹{(total / 100000).toFixed(1)}L</p>
                <p className="text-[11px] text-muted">{count} deal{count !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll-container" style={{ minHeight: '500px' }}>
        {stages.map((stage) => {
          const stageDeals = getStageDeals(stage);
          const total = stageTotal(stage);
          return (
            <div key={stage.id} className="kanban-column flex-shrink-0 w-72">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                  <h3 className="text-xs font-bold text-white">{stage.name}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${stage.color}25`, color: stage.color }}>
                    {stageDeals.length}
                  </span>
                </div>
                <button className="btn-ghost w-6 h-6 p-0 rounded flex items-center justify-center text-slate-400 hover:text-white">
                  <Plus size={13} />
                </button>
              </div>

              {/* Total */}
              <p className="text-[11px] text-muted mb-3 px-1">
                ₹{(total / 100000).toFixed(1)}L · {stage.probability}% probability
              </p>

              {/* Deal cards */}
              <div className="flex flex-col gap-2">
                {stageDeals.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted">
                    No assigned deals in {stage.name}
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div key={deal.id} className="kanban-card">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold leading-tight text-white">{deal.title}</p>
                        <button className="btn-ghost w-6 h-6 p-0 flex items-center justify-center rounded flex-shrink-0 ml-1">
                          <MoreHorizontal size={13} />
                        </button>
                      </div>

                      <p className="text-xs text-muted mb-3">{deal.company}</p>

                      {/* Score bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted">Win probability</span>
                          <span className="font-semibold" style={{ color: stage.color }}>
                            {deal.score}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${deal.score}%`, background: stage.color }} />
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                        <span className="font-bold text-emerald-400">{deal.value}</span>
                        <div className="flex items-center gap-1.5 text-muted">
                          <Calendar size={12} />
                          <span>{deal.close}</span>
                          <div
                            className="avatar w-5 h-5 text-[9px] font-bold bg-brand/20 text-brand-400"
                            title={`Owner: ${deal.ownerName}`}
                          >
                            {deal.owner}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
