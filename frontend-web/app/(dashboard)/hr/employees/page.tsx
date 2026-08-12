import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { EmployeeListWidget } from '@/components/hr/EmployeeListWidget';
import { Plus, Download, Search } from 'lucide-react';

export const metadata: Metadata = { title: 'Employee Directory & Reports | HR' };

export default function EmployeesPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Employee Directory & Reports" actions={
        <div className="flex gap-2">
          <button className="btn-secondary text-sm gap-1.5"><Download size={14} /> Export Directory</button>
          <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> Add Employee</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <EmployeeListWidget />
      </main>
    </div>
  );
}
