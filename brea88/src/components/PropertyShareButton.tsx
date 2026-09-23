'use client';

import { useEffect, useState } from 'react';
import { Check, Link2, X } from 'lucide-react';

interface PropertyShareButtonProps {
  propertyId: number;
  agentSlug?: string;
}

export default function PropertyShareButton({
  propertyId,
  agentSlug,
}: PropertyShareButtonProps) {
  const [showCopied, setShowCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!showCopied) {
      return;
    }

    const closeTimer = window.setTimeout(() => {
      setIsClosing(true);

      window.setTimeout(() => {
        setShowCopied(false);
        setIsClosing(false);
      }, 250);
    }, 1800);

    return () => {
      window.clearTimeout(closeTimer);
    };
  }, [showCopied]);

  async function handleCopyLink() {
   console.log('SHARE DEBUG:', {
  propertyId,
  agentSlug,
});

    const params = new URLSearchParams();

    params.set('property', String(propertyId));

    console.log('[PropertyShareButton] propertyId:', propertyId);
console.log('[PropertyShareButton] agentSlug:', agentSlug);

    if (agentSlug?.trim()) {
      params.set('agent', agentSlug.trim());
    }

    const shareUrl = `${window.location.origin}/marketplace?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(shareUrl);

      setIsClosing(false);
      setShowCopied(true);

      console.log('[PropertyShareButton] Copied:', shareUrl);
    } catch (error) {
      console.error(
        '[PropertyShareButton] Failed to copy link:',
        error,
      );

      /*
       * Fallback for browsers where navigator.clipboard
       * isn't available.
       */
      try {
        const textarea = document.createElement('textarea');

        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        document.execCommand('copy');

        textarea.remove();

        setIsClosing(false);
        setShowCopied(true);

        console.log(
          '[PropertyShareButton] Copied using fallback:',
          shareUrl,
        );
      } catch (fallbackError) {
        console.error(
          '[PropertyShareButton] Fallback copy failed:',
          fallbackError,
        );
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyLink();
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        aria-label={
          agentSlug
            ? 'Copy agent-attributed property link'
            : 'Copy property link'
        }
        title={
          agentSlug
            ? 'Share property with your agent attribution'
            : 'Share property'
        }
        className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/10 active:scale-95"
      >
        <Link2 className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6" />
      </button>

      {showCopied && (
        <div
          className="fixed inset-0 z-[200000] flex items-center justify-center pointer-events-none px-4"
          aria-live="polite"
        >
          <div
            className={[
              'flex items-center gap-3 rounded-2xl border border-white/20',
              'bg-slate-950/95 px-5 py-4 text-white shadow-2xl shadow-black/30',
              'backdrop-blur-xl',
              'transition-all duration-250',
              isClosing
                ? 'translate-y-2 scale-95 opacity-0'
                : 'translate-y-0 scale-100 opacity-100',
            ].join(' ')}
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/10" />

              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                <Check className="h-4 w-4 text-white" strokeWidth={3} />
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                Link Copied!
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                {agentSlug
                  ? 'Your agent attribution is included.'
                  : 'Property link is ready to share.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsClosing(true);

                window.setTimeout(() => {
                  setShowCopied(false);
                  setIsClosing(false);
                }, 250);
              }}
              className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}