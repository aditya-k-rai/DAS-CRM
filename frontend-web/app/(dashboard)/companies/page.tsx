import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { Plus, Building2, MapPin, Globe, Phone, Users, DollarSign } from 'lucide-react';

export const metadata: Metadata = { title: 'Companies' };

const COMPANIES = [
  { id: '1', name: 'TechCorp Ltd', industry: 'IT & Software', city: 'Mumbai', domain: 'techcorp.com', phone: '+91 22 1234 5678', value: '₹5.2L', employees: '250+' },
  { id: '2', name: 'Sunita Real Estate', industry: 'Real Estate', city: 'Chennai', domain: 'sunita.com', phone: '+91 44 9876 5432', value: '₹8.5L', employees: '50+' },
  { id: '3', name: 'Lakshmi Automobiles', industry: 'Automobile', city: 'Bengaluru', domain: 'lakshmi.com', phone: '+91 80 9988 7766', value: '₹12.0L', employees: '500+' },
  { id: '4', name: 'Construkt Inc.', industry: 'Construction', city: 'Hyderabad', domain: 'construkt.in', phone: '+91 40 1111 2222', value: '₹3.6L', employees: '120+' },
];

export default function CompaniesPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Companies" actions={
        <div className="flex items-center gap-2">
          <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> Add Company</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
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
      </main>
    </div>
  );
}
