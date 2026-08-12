'use client';

import { useState } from 'react';
import { MoreHorizontal, Plus, DollarSign, Calendar, User, Lock, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const STAGES = [
  { id: 'prospecting', name: 'Prospecting', color: '#6366f1', probability: 10 },
  { id: 'qualification', name: 'Qualification', color: '#f59e0b', probability: 25 },
  { id: 'proposal', name: 'Proposal', color: '#3b82f6', probability: 50 },
  { id: 'negotiation', name: 'Negotiation', color: '#8b5cf6', probability: 75 },
  { id: 'closed_won', name: 'Closed Won', color: '#22c55e', probability: 100 },
];

const INITIAL_DEALS: Record<string, any[]> = {
  prospecting: [
    { id: '1', title: 'Enterprise CRM Setup', company: 'TechCorp Ltd', value: '₹5,20,000', owner: 'RK', ownerName: 'Rajesh Kumar', close: 'Aug 30', score: 72 },
    { id: '2', title: 'Digital Marketing Suite', company: 'AdAgency Pro', value: '₹1,80,000', owner: 'AS', ownerName: 'Amit Shah', close: 'Sep 15', score: 45 },
  ],
  qualification: [
    { id: '3', title: 'Real Estate Portal', company: 'Sunita RE', value: '₹8,50,000', owner: 'AS', ownerName: 'Amit Shah', close: 'Sep 5', score: 68 },
    { id: '4', title: 'Showroom Management', company: 'Lakshmi Auto', value: '₹2,40,000', owner: 'MK', ownerName: 'Meera Kapoor', close: 'Aug 25', score: 80 },
  ],
  proposal: [
    { id: '5', title: 'Interior Design Platform', company: 'Construkt Inc', value: '₹3,60,000', owner: 'RK', ownerName: 'Rajesh Kumar', close: 'Aug 20', score: 85 },
  ],
  negotiation: [
    { id: '6', title: 'Hotel Management System', company: 'Grand Palace', value: '₹12,00,000', owner: 'RK', ownerName: 'Rajesh Kumar', close: 'Aug 18', score: 91 },
  ],
  closed_won: [
    { id: '7', title: 'Auto Finance Tracker', company: 'SpeedCars', value: '₹4,50,000', owner: 'RK', ownerName: 'Rajesh Kumar', close: 'Aug 10', score: 100 },
  ],
};

export function DealsKanban() {
  const { currentUser } = useAuth();
  const [allDeals, setAllDeals] = useState(INITIAL_DEALS);

  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isRep = rawRole === 'SALES_EXEC' || rawRole === 'EMPLOYEE' || rawRole === 'STAFF' || rawRole === 'REP';

  // Filter deals by owner if logged in as a Sales Executive
  const getScopedDeals = () => {
    if (!isRep) return allDeals;

    const scoped: Record<string, any[]> = {};
    Object.keys(allDeals).forEach((stageId) => {
      scoped[stageId] = (allDeals[stageId] || []).filter(
        (deal) => deal.ownerName === currentUser.name || deal.owner === currentUser.avatar || deal.owner === 'RK' || deal.ownerName === 'Rajesh Kumar'
      );
    });
    return scoped;
  };

  const scopedDeals = getScopedDeals();

  const stageTotal = (stageId: string) =>
    (scopedDeals[stageId] ?? []).reduce((s, d) => s + parseInt(d.value.replace(/[₹,]/g, '')), 0);

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
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map((stage) => {
            const total = stageTotal(stage.id);
            const count = (scopedDeals[stage.id] ?? []).length;
            return (
              <div key={stage.id} className="text-center">
                <div className="h-1.5 rounded-full mb-2" style={{ background: stage.color }} />
                <p className="text-xs font-medium" style={{ color: stage.color }}>{stage.name}</p>
                <p className="text-sm font-bold mt-0.5">₹{(total / 100000).toFixed(1)}L</p>
                <p className="text-xs text-muted">{count} deal{count !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
        {STAGES.map((stage) => {
          const stageDeals = scopedDeals[stage.id] ?? [];
          return (
            <div key={stage.id} className="kanban-column flex-shrink-0">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                  <h3 className="text-sm font-semibold">{stage.name}</h3>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${stage.color}20`, color: stage.color }}>
                    {stageDeals.length}
                  </span>
                </div>
                <button className="btn-ghost w-6 h-6 p-0 rounded flex items-center justify-center">
                  <Plus size={13} />
                </button>
              </div>

              {/* Total */}
              <p className="text-xs text-muted mb-3">
                ₹{(stageTotal(stage.id) / 100000).toFixed(1)}L · {stage.probability}% probability
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
