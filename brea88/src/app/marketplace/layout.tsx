'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="fixed left-4 top-4 z-[100] inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-[#06142d]/90 px-4 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-950/20 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0b234b] active:translate-y-0 sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      {children}
    </div>
  );
}
