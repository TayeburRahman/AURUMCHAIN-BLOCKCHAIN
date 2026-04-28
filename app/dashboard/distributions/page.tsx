"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvestorDistributionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/transactions?tab=payouts');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-white text-xl">Redirecting to Payouts...</div>
    </div>
  );
}
