import { Suspense } from 'react';
import { VerificationPendingScreen } from '@/components/auth/VerificationPendingScreen';

export const metadata = {
  title: 'Company Verification in Process | DAS CRM',
  description: 'Your company registration is undergoing Super Admin plan verification and security review.',
};

export default function VerificationPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
          Loading verification status...
        </div>
      }
    >
      <VerificationPendingScreen />
    </Suspense>
  );
}
