'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Maximize,
  MessageCircle,
  Phone,
  PlayCircle,
  Send,
  UserRound,
  Video,
  X,
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
  category?: string | null;
  propertyType?: string | null;
  houseType?: string | null;
  storey?: string | number | null;
  developer?: string | null;
  totalcp?: string | null;
  bankFinancing?: string[] | null;
  description?: string | null;
  videoUrl?: string | null;
}

interface AvailableAgent {
  id: number;
  fullName: string;
  role: string;
  slug: string;
  profileImage?: string | null;
  lastSeen?: string | null;
}

interface PropertyCardProps {
  property: Property;
  agentSlug?: string;
}

interface InquiryForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredViewingDate: string;
}

type VideoInfo =
  | { type: 'embed'; url: string }
  | { type: 'direct'; url: string }
  | { type: 'link'; url: string }
  | null;

const MAX_GALLERY_IMAGES = 12;

function safeUrl(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseVideo(value?: string | null): VideoInfo {
  if (!value || !safeUrl(value)) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();

    if (host === 'youtu.be') {
      const id = path.replace(/^\/+/, '').split('/')[0];
      return id ? { type: 'embed', url: `https://www.youtube.com/embed/${id}` } : { type: 'link', url: value };
    }

    if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      let id = '';
      if (path === '/watch') id = url.searchParams.get('v') || '';
      else if (path.startsWith('/shorts/')) id = path.split('/shorts/')[1]?.split('/')[0] || '';
      else if (path.startsWith('/embed/')) id = path.split('/embed/')[1]?.split('/')[0] || '';
      else if (path.startsWith('/live/')) id = path.split('/live/')[1]?.split('/')[0] || '';
      return id ? { type: 'embed', url: `https://www.youtube.com/embed/${id}` } : { type: 'link', url: value };
    }

    if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
      const match = path.match(/(?:\/video\/|\/)(\d+)(?:\/|$)/);
      return match?.[1] ? { type: 'embed', url: `https://player.vimeo.com/video/${match[1]}` } : { type: 'link', url: value };
    }

    if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(path)) {
      return { type: 'direct', url: value };
    }

    return { type: 'link', url: value };
  } catch {
    return null;
  }
}

function formatPrice(value?: string | number | null) {
  if (value === null || value === undefined || String(value).trim() === '') return 'Price on request';
  const text = String(value).trim();
  return text.includes('₱') ? text : /^\d[\d,.]*$/.test(text) ? `₱${text}` : text;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c9a96e]/10 text-[#a47d3c]">{icon}</span>
      <h3 className="text-sm font-black uppercase tracking-[0.08em] text-slate-800">{children}</h3>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-100 px-4 py-3.5 last:border-b-0">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-bold text-slate-700">{value}</span>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
      />
    </div>
  );
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showForm, setShowForm] = useState<'inquiry' | 'viewing' | 'contact' | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [agents, setAgents] = useState<AvailableAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgentSlug, setSelectedAgentSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<InquiryForm>({ name: '', email: '', phone: '', message: '', preferredViewingDate: '' });

  const gallery = useMemo(() => {
    const values = [property.image, ...(Array.isArray(property.images) ? property.images : [])].filter(Boolean) as string[];
    return Array.from(new Set(values)).slice(0, MAX_GALLERY_IMAGES);
  }, [property.image, property.images]);

  const video = useMemo(() => parseVideo(property.videoUrl), [property.videoUrl]);

  useEffect(() => {
    const open = showDetails || showGallery || Boolean(showForm);
    const previous = document.body.style.overflow;
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [showDetails, showGallery, showForm]);

  useEffect(() => {
    if (!showDetails && !showGallery && !showForm) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Esc') return;
      if (showGallery) setShowGallery(false);
      else if (showForm && !submitting) setShowForm(null);
      else setShowDetails(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showDetails, showGallery, showForm, submitting]);

  async function loadAgents() {
    if (agents.length > 0 || loadingAgents) return;
    setLoadingAgents(true);
    try {
      const response = await fetch('/api/agents', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load Agents and Brokers.');
      const data = await response.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.agents) ? data.agents : [];
      setAgents(list);
    } catch {
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }

  function openDetails() {
    setImageIndex(0);
    setError('');
    setSuccess(false);
    setShowDetails(true);
    void loadAgents();
  }

  function openForm(type: 'inquiry' | 'viewing' | 'contact') {
    setSelectedAgentSlug('');
    setError('');
    setSuccess(false);
    setShowForm(type);
    void loadAgents();
  }

  function updateField(field: keyof InquiryForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function closeEverything() {
    if (submitting) return;
    setShowGallery(false);
    setShowForm(null);
    setShowDetails(false);
    setError('');
    setSuccess(false);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSuccess(false);

    if (!selectedAgentSlug) {
      setError('Please choose an Agent or Broker before submitting.');
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please complete your name, email, and phone number.');
      return;
    }
    if (showForm === 'inquiry' && !form.message.trim()) {
      setError('Please enter your message.');
      return;
    }
    if (showForm === 'viewing' && !form.preferredViewingDate) {
      setError('Please select your preferred viewing date.');
      return;
    }

    setSubmitting(true);
    try {
      const message = showForm === 'viewing'
        ? `Site viewing request for "${property.title}". Preferred viewing date: ${form.preferredViewingDate}.`
        : showForm === 'contact'
          ? (form.message.trim() || `Client would like to contact an Agent or Broker regarding "${property.title}".`)
          : form.message.trim();

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message,
          preferredViewingDate: showForm === 'viewing' ? form.preferredViewingDate : undefined,
          agentSlug: selectedAgentSlug,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || data?.message || 'Unable to send your request.');

      setSuccess(true);
      setForm({ name: '', email: '', phone: '', message: '', preferredViewingDate: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your request.');
    } finally {
      setSubmitting(false);
    }
  }

  const currentImage = gallery[imageIndex] || property.image;

  return (
    <>
      <article
        onClick={openDetails}
        className="group cursor-pointer overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/10 active:scale-[0.99]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img src={property.image} alt={property.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/5" />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-700 shadow-sm backdrop-blur">{property.tag}</span>
          {video && <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"><PlayCircle size={16} /></span>}
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xl font-black tracking-tight text-slate-900">{formatPrice(property.price)}</p>
          <h3 className="mt-1.5 line-clamp-2 min-h-[44px] text-sm font-bold leading-5 text-slate-800">{property.title}</h3>
          <div className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#b08b4f]" />
            <span className="line-clamp-2">{property.location}</span>
          </div>

          {(property.beds != null || property.baths != null || property.sqft != null) && (
            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3.5 text-[11px] font-semibold text-slate-500">
              {property.beds != null && <span className="flex items-center gap-1"><BedDouble size={14} className="text-slate-400" />{property.beds}</span>}
              {property.baths != null && <span className="flex items-center gap-1"><Bath size={14} className="text-slate-400" />{property.baths}</span>}
              {property.sqft != null && <span className="flex items-center gap-1"><Maximize size={13} className="text-slate-400" />{property.sqft} m²</span>}
            </div>
          )}

          {property.developer && (
            <div className="mt-3.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">Developer</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-600">{property.developer}</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#a47d3c]">View Details</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c9a96e]/10 text-[#a47d3c] transition group-hover:translate-x-0.5"><ChevronRight size={15} /></span>
          </div>
        </div>
      </article>

      {showDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEverything(); }}>
          <div className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-[94vh] sm:max-w-6xl sm:rounded-[30px]">
            <button type="button" onClick={closeEverything} className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75" aria-label="Close"><X size={20} /></button>

            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.02fr_.98fr]">
              <div className="relative min-h-[310px] bg-slate-950 lg:min-h-full">
                <img src={currentImage} alt={property.title} className="h-full min-h-[310px] w-full object-cover lg:min-h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                {gallery.length > 1 && (
                  <>
                    <button type="button" onClick={() => setImageIndex((i) => i === 0 ? gallery.length - 1 : i - 1)} className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"><ChevronLeft size={20} /></button>
                    <button type="button" onClick={() => setImageIndex((i) => i === gallery.length - 1 ? 0 : i + 1)} className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"><ChevronRight size={20} /></button>
                  </>
                )}
                <div className="absolute bottom-6 left-5 right-5 text-white sm:left-7 sm:right-7">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur">{property.tag}</span>
                  <p className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{formatPrice(property.price)}</p>
                  <h2 className="mt-1 text-lg font-bold sm:text-xl">{property.title}</h2>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-white/85"><MapPin size={15} />{property.location}</div>
                </div>
              </div>

              <div className="min-w-0 overflow-y-auto bg-white">
                <div className="space-y-8 p-5 sm:p-7 lg:p-9">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {property.category && <span className="rounded-full bg-[#c9a96e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9c7a3d]">{property.category}</span>}
                      {property.propertyType && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{property.propertyType}</span>}
                    </div>
                    <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">{formatPrice(property.price)}</p>
                    <h1 className="mt-1 text-xl font-bold text-slate-800">{property.title}</h1>
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={16} className="text-[#b08b4f]" />{property.location}</div>
                  </div>

                  {(property.beds != null || property.baths != null || property.sqft != null) && (
                    <div className="grid grid-cols-3 gap-2.5">
                      {property.beds != null && <div className="rounded-2xl bg-slate-50 p-3.5 text-center"><BedDouble size={19} className="mx-auto text-[#b08b4f]" /><p className="mt-1.5 text-sm font-bold">{property.beds}</p><p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Beds</p></div>}
                      {property.baths != null && <div className="rounded-2xl bg-slate-50 p-3.5 text-center"><Bath size={19} className="mx-auto text-[#b08b4f]" /><p className="mt-1.5 text-sm font-bold">{property.baths}</p><p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Baths</p></div>}
                      {property.sqft != null && <div className="rounded-2xl bg-slate-50 p-3.5 text-center"><Maximize size={19} className="mx-auto text-[#b08b4f]" /><p className="mt-1.5 text-sm font-bold">{property.sqft}</p><p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Area</p></div>}
                    </div>
                  )}

                  <section>
                    <SectionTitle icon={<Building2 size={17} />}>Property Details</SectionTitle>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                      <DetailRow label="Category" value={property.category} />
                      <DetailRow label="Property Type" value={property.propertyType} />
                      <DetailRow label="House Type" value={property.houseType} />
                      <DetailRow label="Storey" value={property.storey} />
                    </div>
                  </section>

                  {property.developer && <section><SectionTitle icon={<Building2 size={17} />}>Developer</SectionTitle><div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><p className="text-sm font-bold text-slate-800">{property.developer}</p></div></section>}

                  {property.description && <section><SectionTitle icon={<FileText size={17} />}>Description</SectionTitle><p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{property.description}</p></section>}

                  {(property.totalcp || property.bankFinancing?.length) && <section><SectionTitle icon={<Landmark size={17} />}>Bank Financing</SectionTitle><div className="mt-4 space-y-3">
                    {property.totalcp && <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Contract Price</span><span className="text-sm font-bold text-slate-800">{formatPrice(property.totalcp)}</span></div>}
                    {property.bankFinancing?.map((bank, index) => <div key={`${bank}-${index}`} className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 size={16} />{bank}</div>)}
                  </div></section>}

                  <section><SectionTitle icon={<Video size={17} />}>Property Video</SectionTitle><div className="mt-4">
                    {!video && <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center"><Video size={28} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">No property video available</p></div>}
                    {video?.type === 'direct' && <video controls playsInline preload="metadata" src={video.url} className="max-h-[420px] w-full rounded-2xl bg-black" />}
                    {video?.type === 'embed' && <div className="relative aspect-video overflow-hidden rounded-2xl bg-black"><iframe src={video.url} title={`${property.title} property video`} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>}
                    {video?.type === 'link' && <a href={video.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-[#8c6a32] break-all hover:bg-[#c9a96e]/10">{video.url}</a>}
                  </div></section>

                  {gallery.length > 0 && <section><SectionTitle icon={<ImageIcon size={17} />}>Property Gallery</SectionTitle><div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">{gallery.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => { setImageIndex(index); setShowGallery(true); }} className="group relative aspect-square overflow-hidden rounded-xl"><img src={image} alt={`${property.title} ${index + 1}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></button>)}</div></section>}

                  <section className="border-t border-slate-100 pt-6"><div className="space-y-3">
                    <button type="button" onClick={() => openForm('inquiry')} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"><MessageCircle size={18} />Send Property Inquiry</button>
                    <button type="button" onClick={() => openForm('viewing')} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition hover:border-[#c9a96e] hover:bg-[#c9a96e]/5"><CalendarDays size={18} />Request Site Viewing</button>
                    <button type="button" onClick={() => openForm('contact')} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 px-5 py-4 text-sm font-bold text-[#8c6a32] transition hover:bg-[#c9a96e]/20"><UserRound size={18} />Contact an Agent / Broker</button>
                  </div></section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGallery && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowGallery(false); }}>
          <button type="button" onClick={() => setShowGallery(false)} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close gallery"><X size={21} /></button>
          <button type="button" onClick={() => setImageIndex((i) => i === 0 ? gallery.length - 1 : i - 1)} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft size={22} /></button>
          <img src={gallery[imageIndex] || property.image} alt={property.title} className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain" />
          <button type="button" onClick={() => setImageIndex((i) => i === gallery.length - 1 ? 0 : i + 1)} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight size={22} /></button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
              <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#a47d3c]">BREA 88 REALTY</p><h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{showForm === 'viewing' ? 'Request Site Viewing' : showForm === 'contact' ? 'Contact an Agent / Broker' : 'Property Inquiry'}</h2><p className="mt-1 text-sm text-slate-500">Choose an Agent or Broker before sending your request.</p></div>
              <button type="button" onClick={() => !submitting && setShowForm(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close"><X size={19} /></button>
            </div>

            {success ? (
              <div className="overflow-y-auto px-5 py-12 text-center sm:px-7"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={34} /></div><h3 className="mt-5 text-xl font-bold text-slate-900">Request Sent</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Thank you. Your request has been submitted successfully.</p><button type="button" onClick={closeEverything} className="mt-6 rounded-2xl bg-slate-900 px-7 py-3 text-sm font-bold text-white">Done</button></div>
            ) : (
              <form onSubmit={submitForm} className="space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                <InputField label="Full Name" value={form.name} onChange={(value) => updateField('name', value)} placeholder="Enter your full name" required />
                <InputField label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} placeholder="you@example.com" required />
                <InputField label="Phone" type="tel" value={form.phone} onChange={(value) => updateField('phone', value)} placeholder="09XX XXX XXXX" required />

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Choose Agent or Broker <span className="text-red-500">*</span></label>
                  <select value={selectedAgentSlug} onChange={(event) => setSelectedAgentSlug(event.target.value)} required disabled={loadingAgents} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 outline-none focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10 disabled:bg-slate-50">
                    <option value="">{loadingAgents ? 'Loading Agents and Brokers...' : 'Select an Agent or Broker'}</option>
                    {agents.map((agent) => <option key={agent.id} value={agent.slug}>{agent.fullName} — {agent.role}</option>)}
                  </select>
                </div>

                {showForm === 'viewing' && <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Preferred Viewing Date <span className="text-red-500">*</span></label><div className="relative"><CalendarDays size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" min={today()} value={form.preferredViewingDate} onChange={(event) => updateField('preferredViewingDate', event.target.value)} required className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 pl-11 text-sm outline-none focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10" /></div></div>}

                {showForm !== 'contact' && <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Message {showForm === 'inquiry' && <span className="text-red-500">*</span>}</label><textarea rows={4} value={form.message} onChange={(event) => updateField('message', event.target.value)} placeholder="Tell us how we can help you..." required={showForm === 'inquiry'} className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3.5 text-sm leading-6 outline-none focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10" /></div>}

                {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

                <button type="submit" disabled={submitting || loadingAgents || agents.length === 0 || !selectedAgentSlug} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><Loader2 size={18} className="animate-spin" />Sending...</> : <><Send size={17} />{showForm === 'viewing' ? 'Request Site Viewing' : showForm === 'contact' ? 'Contact Agent / Broker' : 'Send Inquiry'}</>}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
