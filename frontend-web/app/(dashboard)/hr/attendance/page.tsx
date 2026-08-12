import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { AttendanceSummaryWidget } from '@/components/hr/AttendanceSummaryWidget';
import { Calendar, Filter, Download } from 'lucide-react';

export const metadata: Metadata = { title: 'Attendance Management | HR' };

export default function AttendancePage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Attendance Management" actions={
        <div className="flex gap-2">
          <button className="btn-secondary text-sm gap-1.5"><Filter size={14} /> Filter</button>
          <button className="btn-secondary text-sm gap-1.5"><Download size={14} /> Export CSV</button>
          <button className="btn-primary text-sm">+ Mark Attendance</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <AttendanceSummaryWidget />
      </main>
    </div>
  );
}
