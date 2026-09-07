'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Play, X } from 'lucide-react';

interface PropertyListing {
  title: string;
  price: string;
  location: string;
  tag: string;
  developer?: string | null;
  totalcp?: string | null;
  description?: string | null;
  bankFinancing?: string[] | null;
  videoUrl?: string | null;
}

interface PropertyListingActionsProps {
  property: PropertyListing;
}

const formatPrice = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '0';
  const numericValue = Number(String(value).replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(numericValue)) return '0';
  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default function PropertyListingActions({ property }: PropertyListingActionsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const financing = property.bankFinancing?.filter(Boolean) ?? [];
  const videoUrl = property.videoUrl?.trim() || '';

  return (
    <>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {videoUrl && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowVideo(true);
            }}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <Play className="h-4 w-4 fill-current" />
            View Video
          </button>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setShowDetails(true);
          }}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-[#071936] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c9a96e] hover:bg-[#faf7ef] ${!videoUrl ? 'sm:col-span-2' : ''}`}
        >
          More Details
        </button>
      </div>

      {showDetails && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={() => setShowDetails(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              aria-label="Close property details"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/75 text-white transition hover:bg-[#c9a96e]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-[#071936] px-6 py-7 text-white sm:px-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ead9b8]">Property Information</p>
              <h2 className="mt-2 pr-10 text-2xl font-black sm:text-3xl">{property.title}</h2>
              <p className="mt-2 text-sm text-white/65">{property.location}</p>
            </div>

            <div className="space-y-5 p-5 sm:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Property Price</p>
                  <p className="mt-1 text-xl font-black text-[#071936]">₱{formatPrice(property.price)}</p>
                </div>
                {property.totalcp && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Contract Price</p>
                    <p className="mt-1 text-xl font-black text-[#071936]">₱{formatPrice(property.totalcp)}</p>
                  </div>
                )}
              </div>

              {property.developer && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Developer</p>
                  <p className="mt-1 text-base font-extrabold text-slate-900">{property.developer}</p>
                </div>
              )}

              {financing.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bank Financing</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {financing.map((bank) => (
                      <span key={bank} className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {bank}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {property.description && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Property Details</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{property.description}</p>
                </div>
              )}

              {videoUrl && (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Watch Property Video
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showVideo && videoUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setShowVideo(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowVideo(false)}
              aria-label="Close property video"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-[#c9a96e]"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video">
              <iframe
                src={videoUrl}
                title={`${property.title} video`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-slate-950 px-5 py-3 text-xs font-bold text-white hover:bg-slate-900"
            >
              <ExternalLink className="h-4 w-4" /> Open Video
            </a>
          </div>
        </div>
      )}
    </>
  );
}
