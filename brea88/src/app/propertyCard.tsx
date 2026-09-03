'use client';

import React, { useMemo, useState } from 'react';
import {
  MapPin, BedDouble, Bath, Maximize, X, Phone, CalendarDays,
  Images, ChevronLeft, ChevronRight, Mail, MessageCircle,
} from 'lucide-react';

interface Property {
  id: number;
  title: string;
  tag: string;
  price: string;
  location: string;
  image: string;
  images?: string[];
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  agent?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string | null;
    role?: string;
    messenger?: string | null;
    facebook?: string | null;
  } | null;
  developer?: string;
  totalcp?: string;
  description?: string;
}

interface PropertyCardProps { property: Property; }

export default function PropertyCard({ property }: PropertyCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  const formatPrice = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '0';
    const numericValue = Number(String(value).replace(/[^0-9.-]/g, ''));
    if (Number.isNaN(numericValue)) return '0';
    return numericValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const propertyImages = useMemo(() => {
    const valid = property.images?.filter((image) => typeof image === 'string' && image.trim()) ?? [];
    if (valid.length) return valid;
    return typeof property.image === 'string' && property.image.trim() ? [property.image] : [];
  }, [property.images, property.image]);

  const openDetails = () => { setSelectedImage(0); setShowDetails(true); };
  const closeDetails = () => setShowDetails(false);
  const openGallery = () => { setSelectedImage(0); setShowGallery(true); };
  const closeGallery = () => setShowGallery(false);
  const nextImage = () => {
    if (propertyImages.length > 1) setSelectedImage((current) => (current + 1) % propertyImages.length);
  };
  const previousImage = () => {
    if (propertyImages.length > 1) setSelectedImage((current) => (current - 1 + propertyImages.length) % propertyImages.length);
  };

  return (
    <>
      <article
        onClick={openDetails}
        className="group relative cursor-pointer overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.07)] transition-all duration-500 hover:-translate-y-2 hover:border-slate-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)] active:scale-[0.99]"
      >
        <div className="relative h-52 overflow-hidden bg-slate-100 sm:h-60 md:h-64">
          {propertyImages.length > 0 ? (
            <img src={propertyImages[0]} alt={property.title} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">No Image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />

          <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-md">
            {property.tag}
          </span>

          {propertyImages.length > 1 && (
            <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <Images className="h-3.5 w-3.5" /> {propertyImages.length}
            </span>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">Property Price</p>
              <p className="mt-0.5 text-xl font-black tracking-tight text-white sm:text-2xl">₱{formatPrice(property.price)}</p>
            </div>
            <span className="rounded-full border border-white/25 bg-white/95 px-3 py-2 text-xs font-bold text-slate-900 shadow-lg transition-all duration-300 group-hover:bg-[#c9a96e] group-hover:text-white">
              View Property
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 md:p-6">
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-slate-950 transition-colors duration-300 group-hover:text-[#071936] sm:text-lg">
            {property.title}
          </h3>
          {property.developer && <p className="mt-1 text-xs font-medium text-slate-500">by {property.developer}</p>}

          <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a96e]" strokeWidth={2.5} />
            <span className="line-clamp-2 text-sm leading-5 text-slate-600">{property.location}</span>
          </div>

          {(property.beds != null || property.baths != null || property.sqft != null) && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
              {property.beds != null && <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-slate-400" />{property.beds} Beds</span>}
              {property.baths != null && <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-slate-400" />{property.baths} Baths</span>}
              {property.sqft != null && <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4 text-slate-400" />{property.sqft} sqm</span>}
            </div>
          )}
        </div>
      </article>

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-5" onClick={closeDetails}>
          <div onClick={(event) => event.stopPropagation()} className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" onClick={closeDetails} aria-label="Close property details" className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-slate-950/65 text-white shadow-lg backdrop-blur-md transition hover:bg-[#c9a96e] active:scale-95">
              <X className="h-5 w-5" />
            </button>

            <div className="relative h-[300px] overflow-hidden bg-slate-950 sm:h-[380px] md:h-[460px]">
              {propertyImages.length ? <img src={propertyImages[0]} alt={property.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white">No Image</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-[#071936]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md sm:left-7 sm:top-7">{property.tag}</span>
              <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7">
                <p className="flex items-center gap-1.5 text-sm text-white/75"><MapPin className="h-4 w-4 text-[#ead9b8]" />{property.location}</p>
                <h2 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">{property.title}</h2>
              </div>
              {propertyImages.length > 1 && (
                <button type="button" onClick={openGallery} className="absolute bottom-5 right-5 hidden items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-[#c9a96e] hover:text-white sm:flex">
                  <Images className="h-4 w-4" /> View More Photos ({propertyImages.length})
                </button>
              )}
            </div>

            <div className="p-5 sm:p-7 md:p-9">
              <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-7 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Property Price</p>
                  <h3 className="mt-1 text-3xl font-black tracking-tight text-[#071936] sm:text-4xl">₱{formatPrice(property.price)}</h3>
                  {property.totalcp && <p className="mt-1 text-sm text-slate-500">Total Contract Price: ₱{formatPrice(property.totalcp)}</p>}
                </div>
                {propertyImages.length > 1 && <button type="button" onClick={openGallery} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#c9a96e] hover:text-[#071936] sm:hidden"><Images className="h-4 w-4" /> View More Photos</button>}
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.beds != null && <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><BedDouble className="mb-3 h-5 w-5 text-[#071936]" /><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bedrooms</p><p className="mt-1 text-lg font-black text-slate-900">{property.beds}</p></div>}
                {property.baths != null && <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><Bath className="mb-3 h-5 w-5 text-[#071936]" /><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bathrooms</p><p className="mt-1 text-lg font-black text-slate-900">{property.baths}</p></div>}
                {property.sqft != null && <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><Maximize className="mb-3 h-5 w-5 text-[#071936]" /><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Area</p><p className="mt-1 text-lg font-black text-slate-900">{property.sqft} sqm</p></div>}
              </div>

              {property.description && <div className="mt-8"><h3 className="text-lg font-black text-slate-950">Property Description</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{property.description}</p></div>}

              <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><MapPin className="h-4 w-4 text-[#c9a96e]" />{property.location}</p></div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => console.log('Schedule viewing:', property)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#071936] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"><CalendarDays className="h-5 w-5" /> Schedule Site Viewing</button>
                <button type="button" onClick={() => setShowContact(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-[#071936] transition hover:-translate-y-0.5 hover:border-[#c9a96e] hover:shadow-lg active:translate-y-0"><Phone className="h-5 w-5" /> Contact Agent</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInquiry && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" onClick={() => !inquirySubmitting && setShowInquiry(false)}>
          <div onClick={(event) => event.stopPropagation()} className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl">
            <button type="button" onClick={() => !inquirySubmitting && setShowInquiry(false)} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#c9a96e]"><X className="h-5 w-5" /></button>
            <div className="bg-[#071936] p-6 text-white sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ead9b8]">Property Inquiry</p><h2 className="mt-2 text-2xl font-black">I'm Interested</h2><p className="mt-1 text-sm text-white/70">{property.title}</p></div>
            {inquirySuccess ? (
              <div className="p-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</div><h3 className="mt-4 font-black text-emerald-900">Inquiry Ready</h3><p className="mt-2 text-sm text-slate-600">Your inquiry has been prepared. We'll connect this form to the database next.</p><button type="button" onClick={() => setShowInquiry(false)} className="mt-5 rounded-xl bg-[#071936] px-5 py-3 text-sm font-bold text-white">Close</button></div>
            ) : (
              <form onSubmit={async (event) => {
                event.preventDefault(); setInquirySubmitting(true); setInquiryError('');
                try {
                  const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: property.id, ...inquiryForm }) });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.message || 'Failed to submit inquiry.');
                  setInquirySuccess(true); setInquiryForm({ name: '', email: '', phone: '', message: '' });
                } catch (error) { setInquiryError(error instanceof Error ? error.message : 'Unable to submit inquiry.'); }
                finally { setInquirySubmitting(false); }
              }} className="space-y-4 p-6 sm:p-7">
                {(['name', 'email', 'phone'] as const).map((field) => <div key={field}><label className="text-xs font-bold uppercase tracking-wider text-slate-500">{field === 'name' ? 'Full Name' : field === 'email' ? 'Email' : 'Contact Number'}</label><input required type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} value={inquiryForm[field]} onChange={(event) => setInquiryForm({ ...inquiryForm, [field]: event.target.value })} placeholder={field === 'phone' ? '09XXXXXXXXX' : field === 'email' ? 'you@example.com' : 'Enter your full name'} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10" /></div>)}
                <div><label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message</label><textarea required rows={4} value={inquiryForm.message} onChange={(event) => setInquiryForm({ ...inquiryForm, message: event.target.value })} placeholder="I'm interested in this property..." className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10" /></div>
                {inquiryError && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{inquiryError}</div>}
                <button type="submit" disabled={inquirySubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{inquirySubmitting ? 'Sending...' : 'Submit Inquiry'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {showGallery && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-3 sm:p-5" onClick={closeGallery}>
          <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={closeGallery} aria-label="Close gallery" className="absolute right-0 top-[-3.2rem] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#c9a96e]"><X className="h-5 w-5" /></button>
            <div className="relative h-[60vh] overflow-hidden rounded-2xl bg-black sm:h-[70vh]">
              {propertyImages.length > 0 && <img src={propertyImages[selectedImage]} alt={`${property.title} - Photo ${selectedImage + 1}`} className="h-full w-full object-contain" />}
              {propertyImages.length > 1 && <><button type="button" onClick={previousImage} aria-label="Previous photo" className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white hover:text-black"><ChevronLeft /></button><button type="button" onClick={nextImage} aria-label="Next photo" className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white hover:text-black"><ChevronRight /></button></>}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white">{selectedImage + 1} / {propertyImages.length}</div>
            </div>
            {propertyImages.length > 1 && <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-2">{propertyImages.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setSelectedImage(index)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg transition ${selectedImage === index ? 'ring-2 ring-[#c9a96e]' : 'opacity-55 hover:opacity-100'}`}><img src={image} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div>}
          </div>
        </div>
      )}

      {showContact && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" onClick={() => setShowContact(false)}>
          <div onClick={(event) => event.stopPropagation()} className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
            <button type="button" onClick={() => setShowContact(false)} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#c9a96e]"><X /></button>
            <div className="bg-[#071936] px-6 py-7 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ead9b8]">Property Inquiry</p><h2 className="mt-2 text-2xl font-black">Contact Agent</h2><p className="mt-2 text-sm text-white/65">Get in touch with the agent handling this property.</p></div>
            <div className="p-5 sm:p-6">
              {property.agent ? <><div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Property Agent</p><h3 className="mt-1 text-lg font-black text-slate-900">{property.agent.fullName}</h3>{property.agent.role && <p className="text-sm text-slate-500">{property.agent.role}</p>}</div><div className="mt-4 space-y-2">{property.agent.phone && <a href={`tel:${property.agent.phone}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-[#c9a96e]"><Phone className="h-5 w-5 text-[#071936]" /> <span className="text-sm font-bold">{property.agent.phone}</span></a>}{property.agent.email && <a href={`mailto:${property.agent.email}?subject=${encodeURIComponent(`Inquiry about ${property.title}`)}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-[#c9a96e]"><Mail className="h-5 w-5 text-[#071936]" /> <span className="truncate text-sm font-bold">{property.agent.email}</span></a>}{property.agent.messenger && <a href={property.agent.messenger} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-[#c9a96e]"><MessageCircle className="h-5 w-5 text-[#071936]" /> <span className="text-sm font-bold">Message Agent</span></a>}</div><button type="button" onClick={() => { setShowContact(false); setShowInquiry(true); setInquirySuccess(false); setInquiryError(''); }} className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071936] px-4 py-3.5 text-sm font-bold text-white hover:bg-slate-800">Send an Inquiry</button></> : <div className="py-5 text-center"><Phone className="mx-auto h-7 w-7 text-slate-400" /><h3 className="mt-4 text-lg font-black">Contact BREA 88 Realty</h3><p className="mt-2 text-sm leading-6 text-slate-500">This property currently has no assigned agent. Please contact BREA 88 Realty for assistance.</p><a href="mailto:brea88realty@gmail.com" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#071936] text-sm font-bold text-white"><Mail className="h-5 w-5" /> Contact BREA 88 Realty</a></div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
