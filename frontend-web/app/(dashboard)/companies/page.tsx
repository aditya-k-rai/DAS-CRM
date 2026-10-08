'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CompaniesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quotes');
  }, [router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
      <Loader2 size={24} className="animate-spin mb-2 text-indigo-500" />
      <p className="text-xs">Redirecting to Quotations &amp; Companies Hub...</p>
    </div>
  );
}
