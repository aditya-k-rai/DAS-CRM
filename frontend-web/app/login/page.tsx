import type { Metadata } from 'next';
import { LoginGateway } from '@/components/auth/LoginGateway';

export const metadata: Metadata = { title: 'Sign In | NexCRM Platform' };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#060810] text-white flex flex-col items-center justify-center p-6">
      <LoginGateway />
    </div>
  );
}
