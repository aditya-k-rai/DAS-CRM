import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In | DAS CRM' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background dark:bg-background">
      {/* Left: Branding panel - Dark only on desktop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-slate-950 dark:bg-slate-950">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'rgb(var(--primary))' }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ background: 'rgb(139 92 246)' }} />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="text-white font-bold text-xl">DAS CRM</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            The CRM built for<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">high-performance</span><br />
            sales teams
          </h1>
          <p className="text-lg text-slate-400">
            Multi-tenant, AI-powered, with a native Android app for your field sales team.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { value: '2,847', label: 'Leads Managed' },
              { value: '₹48.2L', label: 'Pipeline Value' },
              { value: '24.8%', label: 'Avg. Conversion' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs mt-0.5 text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500">© 2026 DAS CRM. All rights reserved.</p>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background dark:bg-background">
        {children}
      </div>
    </div>
  );
}
