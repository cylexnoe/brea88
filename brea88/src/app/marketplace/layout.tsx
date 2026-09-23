'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

export default function MarketplaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedAgent = params.get('agent')?.trim();

    if (!linkedAgent) return;

    const lockLinkedAgent = () => {
      document
        .querySelectorAll<HTMLSelectElement>('#inquiryAgent')
        .forEach((select) => {
          select.disabled = true;
          select.tabIndex = -1;
          select.setAttribute('aria-disabled', 'true');
          select.setAttribute('data-agent-linked', 'true');
        });
    };

    // Lock immediately if the element already exists.
    lockLinkedAgent();

    // Keep locking if the PropertyCard/modal is rendered later.
    const observer = new MutationObserver(() => {
      lockLinkedAgent();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

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
        className="group fixed left-4 top-4 z-[100] inline-flex min-h-11 items-center gap-2.5 overflow-hidden rounded-2xl border border-white/15 bg-[#06142d]/75 px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_40px_rgba(2,12,27,0.35)] backdrop-blur-2xl transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#c9a96e]/50 hover:bg-[#0b234b]/90 hover:shadow-[0_18px_50px_rgba(2,12,27,0.45)] active:translate-y-0 active:scale-[0.97] sm:left-6 sm:top-6"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.06] via-transparent to-[#c9a96e]/[0.08] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <span className="absolute bottom-2 left-3 top-2 w-px origin-bottom scale-y-0 bg-gradient-to-t from-[#c9a96e] to-transparent transition-transform duration-300 group-hover:scale-y-100" />

        <span className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] transition-all duration-300 group-hover:border-[#c9a96e]/30 group-hover:bg-[#c9a96e]/10">
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:text-[#e2c78f]" />
        </span>

        <span className="relative tracking-wide">
          Back
        </span>
      </button>

      {children}
    </div>
  );
}