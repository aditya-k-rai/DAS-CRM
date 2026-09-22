import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginGateway } from '@/components/auth/LoginGateway';

export const metadata: Metadata = { title: 'Sign In | DAS CRM Platform' };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground flex flex-col items-center justify-center p-6">
      <Suspense fallback={<div className="text-sm text-slate-400">Loading sign in gateway...</div>}>
        <LoginGateway />
      </Suspense>
    </div>
  );
}
