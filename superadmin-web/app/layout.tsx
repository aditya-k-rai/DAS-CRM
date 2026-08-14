import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Super Admin Administrative Portal | NexCRM System Admin',
  description: 'Super Admin System Overlord Portal for NexCRM Multi-Tenant Platform Management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
