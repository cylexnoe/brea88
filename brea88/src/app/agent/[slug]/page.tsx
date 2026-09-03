'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
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
}

interface Agent {
  id: number;
  fullName: string;
  email: string;
  role: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  facebook?: string | null;
  messenger?: string | null;
}

type PageProps = { params: Promise<{ slug: string }> };
type Status = 'idle' | 'success' | 'error';

const formatPrice = (value: string | number | null | undefined) => {
  const number = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? number.toLocaleString('en-US') : String(value ?? '0');
};

export default function AgentProfilePage({ params }: PageProps) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInquiry, setShowInquiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { slug } = await params;
        const response = await fetch(`/api/agent/profile/${encodeURIComponent(slug)}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || 'Profile not found.');
        if (mounted) {
          setAgent(data.agent);
          setProperties(data.properties || []);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Profile not found.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [params]);

  const openInquiry = () => {
    setStatus('idle');
    setForm({ name: '', email: '', phone: '', message: '' });
    setShowInquiry(true);
  };

  const submitInquiry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agent?.slug) return;
    setSubmitting(true);
    setStatus('idle');
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          agentSlug: agent.slug,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data?.message || 'Failed to send inquiry.');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950"><Loader2 className="h-9 w-9 animate-spin text-blue-400" /></main>;

  if (error || !agent) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5"><Building2 className="h-7 w-7 text-slate-500" /></div><h1 className="mt-5 text-2xl font-black">Profile Not Found</h1><p className="mt-2 max-w-sm text-sm text-slate-500">{error || 'This Agent or Broker profile is not available.'}</p><button onClick={() => router.push('/')} className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900">Back to Home</button></div>
    </main>
  );

  const role = agent.role === 'Broker' ? 'Broker' : 'Agent';
  const initials = agent.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="relative overflow-hidden bg-[#071936]">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#c9a96e]/10 blur-3xl" />
        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Back</button>
          <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ead9b8]">BREA 88 REALTY</p><p className="mt-1 text-xs text-white/40">Official {role} Profile</p></div>
        </header>
        <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8">
          <div className="grid items-end gap-7 lg:grid-cols-[auto_1fr_auto]">
            <div className="flex justify-center lg:justify-start">
              {agent.profileImage ? <img src={agent.profileImage} alt={agent.fullName} className="h-28 w-28 rounded-[1.75rem] border-4 border-white/15 object-cover shadow-2xl sm:h-36 sm:w-36" /> : <div className="flex h-28 w-28 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/10 text-4xl font-black text-white shadow-2xl sm:h-36 sm:w-36">{initials}</div>}
            </div>
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ead9b8]/20 bg-[#c9a96e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ead9b8]"><Building2 className="h-3.5 w-3.5" /> {role}</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">{agent.fullName}</h1>
              {agent.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">{agent.bio}</p>}
            </div>
            <button onClick={openInquiry} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#071936] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ead9b8] active:translate-y-0"><Send className="h-4 w-4" /> Send Inquiry</button>
          </div>
        </section>
      </div>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:px-6 sm:py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Professional Contact</p><h2 className="mt-1 text-lg font-black text-slate-950">Get in touch</h2></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Active</span></div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5"><Mail className="h-5 w-5 shrink-0 text-[#071936]" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p><p className="truncate text-sm font-semibold text-slate-700">{agent.email}</p></div></div>
              {agent.phone && <a href={`tel:${agent.phone}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 transition hover:bg-[#faf7ef]"><Phone className="h-5 w-5 shrink-0 text-[#071936]" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p><p className="text-sm font-semibold text-slate-700">{agent.phone}</p></div></a>}
              {agent.address && <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5"><MapPin className="h-5 w-5 shrink-0 text-[#c9a96e]" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p><p className="text-sm font-semibold text-slate-700">{agent.address}</p></div></div>}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {agent.messenger && <a href={agent.messenger} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"><MessageCircle className="h-4 w-4" /> Messenger</a>}
              {agent.facebook && <a href={agent.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#c9a96e] hover:bg-[#faf7ef]"><ExternalLink className="h-4 w-4" /> Facebook</a>}
            </div>
          </div>
          <div className="rounded-3xl border border-[#ead9b8] bg-[#faf7ef] p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b7b3f]">Looking for a property?</p><h2 className="mt-2 text-xl font-black text-[#071936]">Browse available listings</h2><p className="mt-2 text-sm leading-6 text-slate-600">Explore properties and send your inquiry directly through this registered {role.toLowerCase()} profile.</p><button onClick={() => router.push(`/marketplace?agent=${encodeURIComponent(agent.slug)}`)} className="mt-4 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"><Building2 className="h-4 w-4" /> View Properties</button></div>
        </aside>

        <div>
          <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a96e]">Property Collection</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Featured Listings</h2></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">{properties.length} {properties.length === 1 ? 'Listing' : 'Listings'}</span></div>
          {properties.length ? <div className="grid gap-4 sm:grid-cols-2">{properties.map((property) => <button key={property.id} type="button" onClick={() => router.push(`/marketplace?agent=${encodeURIComponent(agent.slug)}`)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_45px_rgba(15,23,42,0.11)]"><div className="relative h-44 overflow-hidden bg-slate-100">{property.image ? <img src={property.image} alt={property.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-slate-400">No Image</div>}<span className="absolute left-3 top-3 rounded-full bg-[#071936]/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">{property.tag}</span></div><div className="p-4"><h3 className="line-clamp-2 font-black text-slate-950">{property.title}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 text-[#c9a96e]" />{property.location}</p><p className="mt-4 text-lg font-black text-[#071936]">₱{formatPrice(property.price)}</p><span className="mt-3 block text-xs font-bold text-slate-400 transition group-hover:text-[#071936]">View listing →</span></div></button>)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Building2 className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-4 font-black text-slate-800">No listings available</h3><p className="mt-1 text-sm text-slate-500">Contact this {role.toLowerCase()} for assistance finding a property.</p><button onClick={openInquiry} className="mt-5 rounded-xl bg-[#071936] px-5 py-3 text-sm font-bold text-white">Send Inquiry</button></div>}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">BREA 88 REALTY • Official {role} Profile</footer>

      {showInquiry && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && !submitting && setShowInquiry(false)}>
        <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl">
          <button type="button" onClick={() => !submitting && setShowInquiry(false)} disabled={submitting} aria-label="Close inquiry" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#c9a96e] disabled:opacity-50"><X className="h-5 w-5" /></button>
          <div className="bg-[#071936] p-6 text-white sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ead9b8]">BREA 88 REALTY</p><h2 className="mt-2 text-2xl font-black">Contact {role}</h2><p className="mt-1 text-sm text-white/60">Your message will be routed to {agent.fullName}.</p></div>
          {status === 'success' ? <div className="p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></div><h3 className="mt-5 text-xl font-black">Inquiry Sent</h3><p className="mt-2 text-sm leading-6 text-slate-500">Thank you. Your inquiry has been submitted successfully. {agent.fullName} will get back to you soon.</p><button onClick={() => setShowInquiry(false)} className="mt-6 rounded-xl bg-[#071936] px-6 py-3 text-sm font-bold text-white">Done</button></div> : <form onSubmit={submitInquiry} className="space-y-4 p-6 sm:p-7">
            {([['name','Full Name','text'],['email','Email Address','email'],['phone','Contact Number','tel']] as const).map(([name,label,type]) => <div key={name}><label className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label><input required name={name} type={type} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10" /></div>)}
            <div><label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message</label><textarea required name="message" rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Tell us what property or assistance you are looking for..." className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10" /></div>
            {status === 'error' && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">We could not send your inquiry. Please check your details and try again.</div>}
            <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Submit Inquiry</>}</button>
          </form>}
        </div>
      </div>}
    </main>
  );
}
