'use client';

import { useEffect, useState } from 'react';
import {
  Link2,
  X,
} from 'lucide-react';

type PropertyShareButtonProps = {
  propertyId: number;
};

export default function PropertyShareButton({
  propertyId,
}: PropertyShareButtonProps) {
  const [showCopied, setShowCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!showCopied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsClosing(true);

      window.setTimeout(() => {
        setShowCopied(false);
        setIsClosing(false);
      }, 250);
    }, 1800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showCopied]);

  const handleCopyLink = async () => {
    
    const shareUrl =
        `${window.location.origin}/marketplace?property=${encodeURIComponent(
            String(propertyId),
        )}`;

    try {
      await navigator.clipboard.writeText(shareUrl);

      setIsClosing(false);
      setShowCopied(true);
    } catch (error) {
      console.error(
        'Failed to copy property link:',
        error,
      );

      
      try {
        const textArea =
          document.createElement('textarea');

        textArea.value = shareUrl;

        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.style.opacity = '0';

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const copied =
          document.execCommand('copy');

        document.body.removeChild(textArea);

        if (copied) {
          setIsClosing(false);
          setShowCopied(true);
        }
      } catch (fallbackError) {
        console.error(
          'Fallback copy failed:',
          fallbackError,
        );
      }
    }
  };

  const closePopup = () => {
    setIsClosing(true);

    window.setTimeout(() => {
      setShowCopied(false);
      setIsClosing(false);
    }, 250);
  };

  return (
    <>
      {/* PUBLIC PROPERTY LINK BUTTON */}
      <button
        type="button"
        onClick={handleCopyLink}
        aria-label="Copy property link"
        title="Copy property link"
        className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md active:scale-95"
      >
        <Link2
          className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
          strokeWidth={2}
        />
      </button>

      {/* SUCCESS POPUP */}
      {showCopied && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-all duration-250 ${
            isClosing
              ? 'pointer-events-none bg-black/0 opacity-0'
              : 'bg-black/25 opacity-100 backdrop-blur-[3px]'
          }`}
          role="status"
          aria-live="polite"
        >
          {/* SUCCESS CARD */}
          <div
            className={`relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-6 text-center shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-all duration-250 ${
              isClosing
                ? 'translate-y-3 scale-95 opacity-0'
                : 'translate-y-0 scale-100 opacity-100'
            }`}
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={closePopup}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700"
            >
              <X
                className="h-4 w-4"
                strokeWidth={2}
              />
            </button>

            {/* ANIMATED SUCCESS ICON */}
            <div className="relative mx-auto h-20 w-20">
              {/* OUTER PULSE */}
              <div className="absolute inset-0 animate-[successPulse_1.2s_ease-out_0.1s_both] rounded-full border-4 border-emerald-200" />

              {/* MAIN CIRCLE */}
              <div className="absolute inset-1 flex items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/30 animate-[successCircle_0.45s_cubic-bezier(0.34,1.56,0.64,1)_both]">
                {/* ANIMATED CHECK */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-10 w-10 text-white"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12.5L10 17L19 7"
                    stroke="currentColor"
                    strokeWidth="2.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength="1"
                    className="animate-[checkDraw_0.55s_cubic-bezier(0.65,0,0.35,1)_0.28s_both]"
                  />
                </svg>
              </div>
            </div>

            {/* TITLE */}
            <h3
              className={`mt-5 text-xl font-black tracking-tight text-slate-950 transition-all duration-300 ${
                isClosing
                  ? 'translate-y-1 opacity-0'
                  : 'translate-y-0 opacity-100'
              }`}
            >
              Link Copied!
            </h3>

            {/* DESCRIPTION */}
            <p
              className={`mt-2 text-sm leading-6 text-slate-500 transition-all duration-300 delay-75 ${
                isClosing
                  ? 'translate-y-1 opacity-0'
                  : 'translate-y-0 opacity-100'
              }`}
            >
              The property link has been copied to
              your clipboard.
            </p>

            {/* BRAND */}
            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
              <Link2
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
              <span>BREA 88 REALTY</span>
            </div>

            {/* ANIMATION STYLES */}
            <style jsx>{`
              @keyframes checkDraw {
                0% {
                  stroke-dasharray: 1;
                  stroke-dashoffset: 1;
                  opacity: 0;
                }

                10% {
                  opacity: 1;
                }

                100% {
                  stroke-dasharray: 1;
                  stroke-dashoffset: 0;
                  opacity: 1;
                }
              }

              @keyframes successCircle {
                0% {
                  transform: scale(0);
                  opacity: 0;
                }

                65% {
                  transform: scale(1.12);
                  opacity: 1;
                }

                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }

              @keyframes successPulse {
                0% {
                  transform: scale(0.7);
                  opacity: 0;
                }

                30% {
                  opacity: 0.9;
                }

                100% {
                  transform: scale(1.35);
                  opacity: 0;
                }
              }

              @media (prefers-reduced-motion: reduce) {
                @keyframes checkDraw {
                  0%,
                  100% {
                    stroke-dasharray: 1;
                    stroke-dashoffset: 0;
                    opacity: 1;
                  }
                }

                @keyframes successCircle {
                  0%,
                  100% {
                    transform: scale(1);
                    opacity: 1;
                  }
                }

                @keyframes successPulse {
                  0%,
                  100% {
                    transform: scale(1);
                    opacity: 0;
                  }
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
}