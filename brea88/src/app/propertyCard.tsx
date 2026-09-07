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
  CircleDollarSign,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Maximize,
  MessageCircle,
  Phone,
  Play,
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
  lotArea?: number | null;

  category?: string | null;
  propertyType?: string | null;
  houseType?: string | null;
  storey?: string | null;

  developer?: string | null;
  totalcp?: string | null;
  bankFinancing?: string[] | null;
  description?: string | null;
  videoUrl?: string | null;

  agent?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string | null;
    role?: string;
    messenger?: string | null;
    facebook?: string | null;
    slug?: string | null;
  } | null;
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

type ModalType =
  | 'details'
  | 'inquiry'
  | 'viewing'
  | 'contact'
  | null;

interface InquiryForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredViewingDate: string;
}

function isSafeHttpUrl(value?: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

function isDirectVideoUrl(value?: string | null) {
  if (!value || !isSafeHttpUrl(value)) return false;

  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();

    return (
      pathname.endsWith('.mp4') ||
      pathname.endsWith('.webm') ||
      pathname.endsWith('.ogg') ||
      pathname.endsWith('.mov') ||
      pathname.endsWith('.m4v')
    );
  } catch {
    return false;
  }
}

function getVideoEmbedUrl(value?: string | null) {
  if (!value || !isSafeHttpUrl(value)) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    // YouTube
    if (
      hostname === 'youtube.com' ||
      hostname === 'www.youtube.com' ||
      hostname === 'm.youtube.com'
    ) {
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');

        if (videoId) {
          return `https://www.youtube.com/embed/${encodeURIComponent(
            videoId,
          )}`;
        }
      }

      if (url.pathname.startsWith('/shorts/')) {
        const videoId = url.pathname.split('/')[2];

        if (videoId) {
          return `https://www.youtube.com/embed/${encodeURIComponent(
            videoId,
          )}`;
        }
      }

      if (url.pathname.startsWith('/embed/')) {
        return value;
      }

      if (url.pathname.startsWith('/live/')) {
        const videoId = url.pathname.split('/')[2];

        if (videoId) {
          return `https://www.youtube.com/embed/${encodeURIComponent(
            videoId,
          )}`;
        }
      }
    }

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.replace('/', '');

      if (videoId) {
        return `https://www.youtube.com/embed/${encodeURIComponent(
          videoId,
        )}`;
      }
    }

    // Vimeo
    if (
      hostname === 'vimeo.com' ||
      hostname === 'www.vimeo.com'
    ) {
      const parts = url.pathname.split('/').filter(Boolean);
      const videoId = parts[0];

      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    if (hostname === 'player.vimeo.com') {
      if (url.pathname.startsWith('/video/')) {
        return value;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function formatPrice(value?: string | null) {
  if (!value) return 'Price on request';

  const trimmed = String(value).trim();

  if (trimmed.includes('₱')) {
    return trimmed;
  }

  if (/^\d[\d,.]*$/.test(trimmed)) {
    return `₱${trimmed}`;
  }

  return trimmed;
}

function formatDateMin() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function PropertyCard({
  property,
}: PropertyCardProps) {
  const [modal, setModal] = useState<ModalType>(null);

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  const [availableAgents, setAvailableAgents] = useState<
    AvailableAgent[]
  >([]);

  // IMPORTANT:
  // Empty by default. No first agent or property.agent is selected.
  const [selectedAgentSlug, setSelectedAgentSlug] =
    useState('');

  const [loadingAgents, setLoadingAgents] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [inquiryForm, setInquiryForm] =
    useState<InquiryForm>({
      name: '',
      email: '',
      phone: '',
      message: '',
      preferredViewingDate: '',
    });

  const galleryImages = useMemo(() => {
    const images = [
      property.image,
      ...(property.images || []),
    ].filter(Boolean);

    return Array.from(new Set(images));
  }, [property.image, property.images]);

  const currentImage =
    galleryImages[selectedImageIndex] ||
    property.image;

  const videoUrl = property.videoUrl?.trim() || '';

  const videoEmbedUrl = getVideoEmbedUrl(videoUrl);

  const hasDirectVideo =
    isDirectVideoUrl(videoUrl);

  const hasEmbeddedVideo =
    Boolean(videoEmbedUrl);

  const hasVideo =
    hasDirectVideo || hasEmbeddedVideo;

  useEffect(() => {
    if (!modal) return;

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [modal]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeModal();
      }
    }

    if (modal) {
      window.addEventListener(
        'keydown',
        handleEscape,
      );
    }

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [modal]);

  async function loadAgents() {
    setLoadingAgents(true);

    try {
      const response = await fetch(
        '/api/agents',
        {
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw new Error(
          'Unable to load agents.',
        );
      }

      const data = await response.json();

      const agents = Array.isArray(data)
        ? data
        : Array.isArray(data?.agents)
          ? data.agents
          : [];

      setAvailableAgents(agents);
    } catch {
      setAvailableAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }

  function openDetails() {
    setSelectedImageIndex(0);
    setSubmitSuccess(false);
    setSubmitError('');
    setModal('details');

    loadAgents();
  }

  function openInquiry() {
    setSubmitSuccess(false);
    setSubmitError('');
    setSelectedAgentSlug('');
    setModal('inquiry');

    loadAgents();
  }

  function openViewing() {
    setSubmitSuccess(false);
    setSubmitError('');
    setSelectedAgentSlug('');
    setModal('viewing');

    loadAgents();
  }

  function openContact() {
    setSubmitSuccess(false);
    setSubmitError('');
    setSelectedAgentSlug('');
    setModal('contact');

    loadAgents();
  }

  function closeModal() {
    setModal(null);
    setSubmitSuccess(false);
    setSubmitError('');
  }

  function updateForm(
    field: keyof InquiryForm,
    value: string,
  ) {
    setInquiryForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function nextImage(event?: React.MouseEvent) {
    event?.stopPropagation();

    if (galleryImages.length <= 1) return;

    setSelectedImageIndex(
      (current) =>
        (current + 1) %
        galleryImages.length,
    );
  }

  function previousImage(
    event?: React.MouseEvent,
  ) {
    event?.stopPropagation();

    if (galleryImages.length <= 1) return;

    setSelectedImageIndex(
      (current) =>
        (current - 1 + galleryImages.length) %
        galleryImages.length,
    );
  }

  async function submitInquiry(
    event: React.FormEvent<HTMLFormElement>,
    type: 'inquiry' | 'viewing' | 'contact',
  ) {
    event.preventDefault();

    setSubmitError('');
    setSubmitSuccess(false);

    if (!selectedAgentSlug) {
      setSubmitError(
        'Please choose an Agent or Broker before submitting.',
      );
      return;
    }

    if (
      !inquiryForm.name.trim() ||
      !inquiryForm.email.trim() ||
      !inquiryForm.phone.trim()
    ) {
      setSubmitError(
        'Please complete your name, email, and phone number.',
      );
      return;
    }

    if (
      type === 'inquiry' &&
      !inquiryForm.message.trim()
    ) {
      setSubmitError(
        'Please enter your message.',
      );
      return;
    }

    if (
      type === 'viewing' &&
      !inquiryForm.preferredViewingDate
    ) {
      setSubmitError(
        'Please select your preferred viewing date.',
      );
      return;
    }

    setSubmitting(true);

    try {
      let message =
        inquiryForm.message.trim();

      if (type === 'viewing') {
        message =
          `Site viewing request for "${property.title}". Preferred viewing date: ${inquiryForm.preferredViewingDate}.`;
      }

      if (
        type === 'contact' &&
        !message
      ) {
        message =
          `Client would like to contact an Agent or Broker regarding "${property.title}".`;
      }

      const response = await fetch(
        '/api/inquiries',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            propertyId: property.id,
            name: inquiryForm.name.trim(),
            email: inquiryForm.email.trim(),
            phone: inquiryForm.phone.trim(),
            message,
            preferredViewingDate:
              type === 'viewing'
                ? inquiryForm.preferredViewingDate
                : undefined,
            agentSlug:
              selectedAgentSlug,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Unable to send your request. Please try again.',
        );
      }

      setSubmitSuccess(true);

      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        message: '',
        preferredViewingDate: '',
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to send your request.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const [isAgent, setIsAgent] = useState(false);
  useEffect(() => {
  let mounted = true;

  async function checkAgent() {
    try {
      const response = await fetch(
        '/api/agent/me',
        {
          credentials: 'include',
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        if (mounted) {
          setIsAgent(false);
        }

        return;
      }

      const data = await response.json();

      if (mounted) {
        setIsAgent(
          data?.success === true &&
          data?.agent?.isActive === true &&
          ['Agent', 'Broker'].includes(
            data?.agent?.role,
          ),
        );
      }
    } catch {
      if (mounted) {
        setIsAgent(false);
      }
    }
  }

  checkAgent();

  return () => {
    mounted = false;
  };
}, []);

  function renderAgentSelector() {
    return (
      <div>
        <label
          htmlFor="selected-agent"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
        >
          Choose Agent or Broker
          <span className="ml-1 text-red-500">
            *
          </span>
        </label>

        <div className="relative">
          <UserRound
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <select
            id="selected-agent"
            value={selectedAgentSlug}
            onChange={(event) =>
              setSelectedAgentSlug(
                event.target.value,
              )
            }
            required
            disabled={loadingAgents}
            className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
          >
            <option value="">
              {loadingAgents
                ? 'Loading Agents and Brokers...'
                : 'Select an Agent or Broker'}
            </option>

            {availableAgents.map(
              (agent) => (
                <option
                  key={agent.id}
                  value={agent.slug}
                >
                  {agent.fullName} —{' '}
                  {agent.role}
                </option>
              ),
            )}
          </select>

          <ChevronRight
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400"
          />
        </div>

        {!loadingAgents &&
          availableAgents.length === 0 && (
            <p className="mt-2 text-xs text-slate-400">
              No Agents or Brokers are currently
              available.
            </p>
          )}
      </div>
    );
  }

  function renderRequestForm(
    type: 'inquiry' | 'viewing' | 'contact',
  ) {
    const title =
      type === 'viewing'
        ? 'Request Site Viewing'
        : type === 'contact'
          ? 'Contact an Agent / Broker'
          : 'Property Inquiry';

    const description =
      type === 'viewing'
        ? 'Choose your preferred Agent or Broker and viewing date.'
        : type === 'contact'
          ? 'Choose who you would like to contact about this property.'
          : 'Send your property inquiry to your chosen Agent or Broker.';

    return (
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="pr-4">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#c9a96e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9c7a3d]">
              {type === 'viewing' ? (
                <CalendarDays size={13} />
              ) : type === 'contact' ? (
                <Phone size={13} />
              ) : (
                <MessageCircle size={13} />
              )}

              BREA 88 REALTY
            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={(event) =>
            submitInquiry(event, type)
          }
          className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6"
        >
          {submitSuccess ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2
                  size={34}
                />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Request Sent
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Thank you. Your request has
                been submitted successfully.
              </p>

              <button
                type="button"
                onClick={closeModal}
                className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="inquiry-name"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Full Name
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="inquiry-name"
                    type="text"
                    value={inquiryForm.name}
                    onChange={(event) =>
                      updateForm(
                        'name',
                        event.target.value,
                      )
                    }
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inquiry-email"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="inquiry-email"
                    type="email"
                    value={inquiryForm.email}
                    onChange={(event) =>
                      updateForm(
                        'email',
                        event.target.value,
                      )
                    }
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inquiry-phone"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Phone
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="inquiry-phone"
                    type="tel"
                    value={inquiryForm.phone}
                    onChange={(event) =>
                      updateForm(
                        'phone',
                        event.target.value,
                      )
                    }
                    placeholder="09XX XXX XXXX"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>
              </div>

              {renderAgentSelector()}

              {type === 'viewing' && (
                <div>
                  <label
                    htmlFor="viewing-date"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Preferred Viewing Date
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="viewing-date"
                      type="date"
                      min={formatDateMin()}
                      value={
                        inquiryForm.preferredViewingDate
                      }
                      onChange={(event) =>
                        updateForm(
                          'preferredViewingDate',
                          event.target.value,
                        )
                      }
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-700 outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                    />
                  </div>
                </div>
              )}

              {type !== 'contact' && (
                <div>
                  <label
                    htmlFor="inquiry-message"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Message
                    {type === 'inquiry' && (
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    )}
                  </label>

                  <textarea
                    id="inquiry-message"
                    value={inquiryForm.message}
                    onChange={(event) =>
                      updateForm(
                        'message',
                        event.target.value,
                      )
                    }
                    placeholder="Tell us how we can help you..."
                    required={
                      type === 'inquiry'
                    }
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>
              )}

              {submitError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting ||
                  !selectedAgentSlug ||
                  availableAgents.length === 0
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    {type === 'viewing'
                      ? 'Request Site Viewing'
                      : type === 'contact'
                        ? 'Contact Agent / Broker'
                        : 'Send Inquiry'}
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  function renderVideo() {
    if (!videoUrl) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <Video
            size={28}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-medium text-slate-500">
            No property video available
          </p>
        </div>
      );
    }

    if (hasDirectVideo) {
      return (
        <div className="overflow-hidden rounded-2xl bg-black">
          <video
            controls
            playsInline
            preload="metadata"
            className="max-h-[420px] w-full object-contain"
            src={videoUrl}
          >
            Your browser does not support
            the video player.
          </video>
        </div>
      );
    }

    if (hasEmbeddedVideo && videoEmbedUrl) {
      return (
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            src={videoEmbedUrl}
            title={`${property.title} property video`}
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <Video
            size={20}
            className="mt-0.5 shrink-0 text-amber-600"
          />

          <div>
            <p className="text-sm font-semibold text-amber-900">
              Property video link
            </p>

            <p className="mt-1 break-all text-xs leading-5 text-amber-700">
              {videoUrl}
            </p>

            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-amber-800 underline underline-offset-4"
            >
              Open Video
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  function renderDetailsModal() {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget
          ) {
            closeModal();
          }
        }}
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-[94vh] sm:max-w-6xl sm:rounded-[30px]">
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close property details"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75 sm:right-5 sm:top-5"
          >
            <X size={20} />
          </button>

          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.02fr_0.98fr]">
            {/* IMAGE SIDE */}
            <div className="relative min-h-[310px] bg-slate-950 lg:min-h-0">
              <img
                src={currentImage}
                alt={property.title}
                className="h-full min-h-[310px] w-full object-cover lg:min-h-full"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <div className="absolute bottom-5 left-5 right-5 text-white sm:bottom-7 sm:left-7">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-md">
                  {property.tag}
                </span>

                <p className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                  {formatPrice(property.price)}
                </p>

                <h2 className="mt-1 text-lg font-bold sm:text-xl">
                  {property.title}
                </h2>

                <div className="mt-2 flex items-center gap-1.5 text-sm text-white/85">
                  <MapPin size={15} />
                  {property.location}
                </div>
              </div>

              {galleryImages.length > 1 && (
                <div className="absolute bottom-5 right-5 hidden gap-1.5 sm:flex">
                  {galleryImages
                    .slice(0, 6)
                    .map((_, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() =>
                          setSelectedImageIndex(
                            index,
                          )
                        }
                        aria-label={`View image ${
                          index + 1
                        }`}
                        className={`h-1.5 rounded-full transition-all ${
                          selectedImageIndex ===
                          index
                            ? 'w-7 bg-white'
                            : 'w-2 bg-white/45'
                        }`}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* DETAILS SIDE */}
            <div className="min-w-0 bg-white">
              <div className="space-y-8 p-5 sm:p-7 lg:p-9">
                {/* Header */}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {property.category && (
                      <span className="rounded-full bg-[#c9a96e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9c7a3d]">
                        {property.category}
                      </span>
                    )}

                    {property.propertyType && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        {property.propertyType}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                    {formatPrice(
                      property.price,
                    )}
                  </p>

                  <h1 className="mt-1 text-xl font-bold text-slate-800">
                    {property.title}
                  </h1>

                  <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin
                      size={16}
                      className="text-[#b08b4f]"
                    />
                    {property.location}
                  </div>
                </div>

                {/* QUICK DETAILS */}
                {(property.beds != null ||
                    property.baths != null ||
                    property.sqft != null ||
                    property.lotArea != null) && (
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3.5 sm:flex sm:items-center sm:gap-4">
                      {property.beds != null && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <BedDouble
                            size={14}
                            className="shrink-0 text-slate-400"
                          />
                          <span>{property.beds}</span>
                          <span className="text-slate-400">Beds</span>
                        </span>
                      )}

                      {property.baths != null && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <Bath
                            size={14}
                            className="shrink-0 text-slate-400"
                          />
                          <span>{property.baths}</span>
                          <span className="text-slate-400">Baths</span>
                        </span>
                      )}

                      {property.sqft != null && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <Maximize
                            size={14}
                            className="shrink-0 text-slate-400"
                          />
                          <span>
                            {Number(property.sqft).toFixed(2)}
                          </span>
                          <span className="text-slate-400">Sqm</span>
                        </span>
                      )}

                      {property.lotArea != null && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <Maximize
                            size={14}
                            className="shrink-0 text-slate-400"
                          />
                          <span>
                            {Number(property.lotArea).toFixed(2)}
                          </span>
                          <span className="text-slate-400">Lot Area</span>
                        </span>
                      )}
                    </div>
                  )}

                {/* PROPERTY DETAILS */}
                <section>
                  <SectionTitle
                    icon={
                      <Building2
                        size={17}
                      />
                    }
                    title="Property Details"
                  />

                  <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
                    <DetailRow
                      label="Category"
                      value={
                        property.category
                      }
                    />

                    <DetailRow
                      label="Property Type"
                      value={
                        property.propertyType
                      }
                    />

                    <DetailRow
                      label="House Type"
                      value={
                        property.houseType
                      }
                    />

                    <DetailRow
                      label="Storey"
                      value={
                        property.storey
                      }
                    />
                  </div>
                </section>

                {/* DEVELOPER */}
                {property.developer && (
                  <section>
                    <SectionTitle
                      icon={
                        <Building2
                          size={17}
                        />
                      }
                      title="Developer"
                    />

                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="text-sm font-bold text-slate-800">
                        {property.developer}
                      </p>
                    </div>
                  </section>
                )}

                {/* DESCRIPTION */}
                {property.description && (
                  <section>
                    <SectionTitle
                      icon={
                        <FileText
                          size={17}
                        />
                      }
                      title="Description"
                    />

                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                      {property.description}
                    </p>
                  </section>
                )}

                {/* FINANCING */}
                {(property.totalcp ||
                  property.bankFinancing?.length) && (
                  <section>
                    <SectionTitle
                      icon={
                        <Landmark
                          size={17}
                        />
                      }
                      title="Bank Financing"
                    />

                    <div className="mt-4 space-y-3">
                      {property.totalcp && (
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Total Contract Price
                          </span>

                          <span className="text-sm font-bold text-slate-800">
                            {formatPrice(
                              property.totalcp,
                            )}
                          </span>
                        </div>
                      )}

                      {property.bankFinancing
                        ?.length ? (
                        <div className="space-y-2">
                          {property.bankFinancing.map(
                            (
                              financing,
                              index,
                            ) => (
                              <div
                                key={`${financing}-${index}`}
                                className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700"
                              >
                                <CheckCircle2
                                  size={16}
                                  className="mt-0.5 shrink-0"
                                />

                                <span>
                                  {financing}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  </section>
                )}

                {/* VIDEO */}
                <section>
                  <SectionTitle
                    icon={
                      <Video size={17} />
                    }
                    title="Property Video"
                  />

                  <div className="mt-4">
                    {renderVideo()}
                  </div>
                </section>

                {/* GALLERY */}
                {galleryImages.length > 0 && (
                  <section>
                    <SectionTitle
                      icon={
                        <ImageIcon
                          size={17}
                        />
                      }
                      title="Property Gallery"
                    />

                    <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {galleryImages.map(
                        (image, index) => (
                          <button
                            type="button"
                            key={`${image}-${index}`}
                            onClick={() =>
                              setSelectedImageIndex(
                                index,
                              )
                            }
                            className={`group relative aspect-square overflow-hidden rounded-xl ${
                              selectedImageIndex ===
                              index
                                ? 'ring-2 ring-[#c9a96e] ring-offset-2'
                                : ''
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${property.title} ${
                                index + 1
                              }`}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
                          </button>
                        ),
                      )}
                    </div>
                  </section>
                )}

                {/* ACTIONS */}
                <section className="border-t border-slate-100 pt-6">
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={openInquiry}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      <MessageCircle
                        size={18}
                      />
                      Send Property Inquiry
                    </button>

                    <button
                      type="button"
                      onClick={openViewing}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition hover:border-[#c9a96e] hover:bg-[#c9a96e]/5 hover:text-slate-900"
                    >
                      <CalendarDays
                        size={18}
                      />
                      Request Site Viewing
                    </button>

                    <button
                      type="button"
                      onClick={openContact}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 px-5 py-4 text-sm font-bold text-[#8c6a32] transition hover:bg-[#c9a96e]/20"
                    >
                      <UserRound
                        size={18}
                      />
                      Contact an Agent / Broker
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* COMPACT PROPERTY CARD */}
      <article
        onClick={openDetails}
        className="group cursor-pointer overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/10 active:scale-[0.99]"
      >
        {/* IMAGE */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={property.image}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />

          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-white/90 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-700 shadow-sm backdrop-blur-sm">
              {property.tag}
            </span>
          </div>

          {hasVideo && (
            <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md">
              <Play
                size={13}
                fill="currentColor"
              />
            </div>
          )}
        </div>

        {/* CARD CONTENT */}
        <div className="p-4 sm:p-5">
          <p className="text-xl font-black tracking-tight text-slate-900">
            {formatPrice(property.price)}
          </p>

          <h3 className="mt-1.5 line-clamp-2 min-h-[44px] text-sm font-bold leading-5 text-slate-800">
            {property.title}
          </h3>

          <div className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
            <MapPin
              size={14}
              className="mt-0.5 shrink-0 text-[#b08b4f]"
            />

            <span className="line-clamp-2">
              {property.location}
            </span>
          </div>

          {(property.beds != null ||
            property.baths != null ||
            property.sqft != null) && (
            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3.5 text-[11px] font-semibold text-slate-500">
              {property.beds != null && (
                <span className="flex items-center gap-1">
                  <BedDouble
                    size={14}
                    className="text-slate-400"
                  />
                  {property.beds}
                </span>
              )}

              {property.baths != null && (
                <span className="flex items-center gap-1">
                  <Bath
                    size={14}
                    className="text-slate-400"
                  />
                  {property.baths}
                </span>
              )}

              {property.sqft != null && (
                <span className="flex items-center gap-1">
                  <Maximize
                    size={13}
                    className="text-slate-400"
                  />
                  {Number(property.sqft).toFixed(2)}
                  <span className="hidden sm:inline">
                    m²
                  </span>
                </span>
              )}
            </div>
          )}

          {isAgent && property.developer && (
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Developer
              </p>

              <p className="mt-1.5 text-sm font-bold text-slate-800">
                {property.developer}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#a47d3c] transition group-hover:text-[#8c6a32]">
              View Details
            </span>

            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c9a96e]/10 text-[#a47d3c] transition group-hover:translate-x-0.5 group-hover:bg-[#c9a96e]/20">
              <ChevronRight size={15} />
            </span>
          </div>
        </div>
      </article>

      {/* MODALS */}
      {modal === 'details' && (
        renderDetailsModal()
      )}

      {(modal === 'inquiry' ||
        modal === 'viewing' ||
        modal === 'contact') && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
          {renderRequestForm(
            modal,
          )}
        </div>
      )}
    </>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c9a96e]/10 text-[#a47d3c]">
        {icon}
      </div>

      <h2 className="text-sm font-black uppercase tracking-[0.08em] text-slate-800">
        {title}
      </h2>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between gap-5 px-4 py-3.5">
      <span className="text-xs font-semibold text-slate-400">
        {label}
      </span>

      <span className="text-right text-sm font-bold text-slate-700">
        {value}
      </span>
    </div>
  );
}