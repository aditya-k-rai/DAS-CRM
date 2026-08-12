import type { Metadata } from 'next';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const metadata: Metadata = { title: 'Welcome to NexCRM | Workspace Setup' };

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#060810] text-white flex flex-col items-center justify-center p-6">
      <OnboardingWizard />
    </div>
  );
}
