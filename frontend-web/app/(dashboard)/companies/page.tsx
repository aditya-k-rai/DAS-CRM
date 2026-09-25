import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { Plus, Building2, MapPin, Globe, Phone, Users, DollarSign } from 'lucide-react';

export const metadata: Metadata = { title: 'Companies' };

const COMPANIES: any[] = [];

export default function CompaniesPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Companies" actions={
        <div className="flex items-center gap-2">
          <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> Add Company</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        {COMPANIES.length === 0 ? (
          <div className="crm-card p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto mt-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-4">
              <Building2 size={28} />
            </div>
            <h3 className="font-bold text-lg text-white mb-1">No Companies Added Yet</h3>
            <p className="text-xs text-muted max-w-sm mb-6 leading-relaxed">
              Track client organizations, enterprise accounts, and vendor partners associated with your leads and deals.
            </p>
            <button className="btn-primary text-xs px-4 py-2 gap-1.5">
              <Plus size={14} /> Add First Company
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPANIES.map((company) => (
              <div key={company.id} className="crm-card flex flex-col justify-between animate-fade-in">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)' }}>
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' }}>
                      {company.industry}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base mb-1">{company.name}</h3>
                  <p className="text-xs text-muted flex items-center gap-1 mb-3">
                    <MapPin size={11} /> {company.city} · <Globe size={11} /> {company.domain}
                  </p>
                </div>

                <div className="border-t pt-3 mt-2 space-y-2" style={{ borderColor: 'rgb(var(--border))' }}>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Pipeline Value</span>
                    <span className="font-bold text-sm" style={{ color: 'rgb(var(--brand-400))' }}>{company.value}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Company Size</span>
                    <span className="font-medium">{company.employees} staff</span>
                  </div>
                  <button className="btn-secondary w-full text-xs py-1.5 mt-2">View Company Hub</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
