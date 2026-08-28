import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In | DAS CRM' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'rgb(var(--background))' }}>
      {/* Left: Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, rgb(9 11 20), rgb(26 27 75))' }}>
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'rgb(99 102 241)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ background: 'rgb(139 92 246)' }} />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-white font-bold">N</span>
            </div>
            <span className="text-white font-bold text-xl">DAS CRM</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            The CRM built for<br />
            <span className="gradient-text">high-performance</span><br />
            sales teams
          </h1>
          <p className="text-lg" style={{ color: 'rgb(148 163 184)' }}>
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
              <div key={stat.label} className="text-center p-3 rounded-xl" style={{ background: 'rgb(255 255 255 / 0.05)', border: '1px solid rgb(255 255 255 / 0.08)' }}>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(148 163 184)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: 'rgb(100 116 139)' }}>© 2026 DAS CRM. All rights reserved.</p>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
