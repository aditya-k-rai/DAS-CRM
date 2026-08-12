import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { Plus, Search, Filter, Mail, Phone, Building2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Contacts' };

const CONTACTS = [
  { id: '1', name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 98765 43210', company: 'TechCorp Ltd', designation: 'CTO', leadsCount: 2, owner: 'John D.' },
  { id: '2', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 87654 32109', company: 'Sunita Real Estate', designation: 'VP Sales', leadsCount: 1, owner: 'Anil S.' },
  { id: '3', name: 'Amit Patel', email: 'amit@example.com', phone: '+91 76543 21098', company: 'Lakshmi Auto', designation: 'Managing Director', leadsCount: 3, owner: 'Meera K.' },
  { id: '4', name: 'Sunita Verma', email: 'sunita@construkt.in', phone: '+91 80 1111 2222', company: 'Construkt Inc', designation: 'Head Architect', leadsCount: 1, owner: 'John D.' },
  { id: '5', name: 'Deepak Joshi', email: 'deepak@speedcars.in', phone: '+91 99887 76655', company: 'SpeedCars', designation: 'Operations Head', leadsCount: 2, owner: 'Meera K.' },
];

export default function ContactsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Contacts" actions={
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm gap-1.5"><Filter size={14} /> Filter</button>
          <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> New Contact</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <div className="crm-card p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgb(var(--border))' }}>
            <div className="relative max-w-sm flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="crm-input pl-9 h-9 text-sm" placeholder="Search contacts by name, email, company..." />
            </div>
            <span className="text-xs text-muted">{CONTACTS.length} contacts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Contact Person</th>
                  <th>Company & Designation</th>
                  <th>Phone</th>
                  <th>Associated Leads</th>
                  <th>Owner</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {CONTACTS.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar w-9 h-9 text-xs" style={{ background: 'rgba(99,102,241,0.2)', color: 'rgb(129,140,248)' }}>
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted flex items-center gap-1">
                            <Mail size={11} /> {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <Building2 size={13} className="text-muted" /> {c.company}
                        </p>
                        <p className="text-xs text-muted">{c.designation}</p>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-muted flex items-center gap-1">
                        <Phone size={11} /> {c.phone}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.12)', color: 'rgb(129,140,248)' }}>
                        {c.leadsCount} deals/leads
                      </span>
                    </td>
                    <td><span className="text-sm">{c.owner}</span></td>
                    <td>
                      <button className="btn-secondary text-xs px-2.5 py-1">View Profile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
