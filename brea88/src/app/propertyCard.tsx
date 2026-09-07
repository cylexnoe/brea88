'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  X,
  Phone,
  CalendarDays,
  Images,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  LockKeyhole,
  PlayCircle,
  Building2,
  Landmark,
  ExternalLink,
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

type VideoType =
  | {
      type: 'youtube';
      src: string;
    }
  | {
      type: 'vimeo';
      src: string;
    }
  | {
      type: 'direct';
      src: string;
    }
  | {
      type: 'unsupported';
      src: string;
    }
  | null;

interface InquiryForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredViewingDate: string;
}

const MAX_GALLERY_IMAGES = 12;

function isSafeHttpUrl(value?: string | null): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseVideoUrl(value?: string | null): VideoType {
  if (!value || !isSafeHttpUrl(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com'
    ) {
      let videoId = '';

      if (pathname === '/watch') {
        videoId = url.searchParams.get('v') || '';
      } else if (pathname.startsWith('/shorts/')) {
        videoId = pathname.split('/shorts/')[1]?.split('/')[0] || '';
      } else if (pathname.startsWith('/embed/')) {
        videoId = pathname.split('/embed/')[1]?.split('/')[0] || '';
      } else if (pathname.startsWith('/live/')) {
        videoId = pathname.split('/live/')[1]?.split('/')[0] || '';
      }

      if (videoId) {
        return {
          type: 'youtube',
          src: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    if (host === 'youtu.be') {
      const videoId = pathname.replace(/^\/+/, '').split('/')[0];

      if (videoId) {
        return {
          type: 'youtube',
          src: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    if (
      host === 'vimeo.com' ||
      host === 'www.vimeo.com' ||
      host === 'player.vimeo.com'
    ) {
      let videoId = '';

      if (host === 'player.vimeo.com') {
        const match = pathname.match(/\/video\/(\d+)/);
        videoId = match?.[1] || '';
      } else {
        const match = pathname.match(/\/(\d+)/);
        videoId = match?.[1] || '';
      }

      if (videoId) {
        return {
          type: 'vimeo',
          src: `https://player.vimeo.com/video/${videoId}`,
        };
      }
    }

    if (
      pathname.endsWith('.mp4') ||
      pathname.endsWith('.webm') ||
      pathname.endsWith('.ogg') ||
      pathname.endsWith('.mov') ||
      pathname.endsWith('.m4v')
    ) {
      return {
        type: 'direct',
        src: value,
      };
    }

    return {
      type: 'unsupported',
      src: value,
    };
  } catch {
    return null;
  }
}

function formatDateTimeLocalMin(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isAgentOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false;

  const timestamp = new Date(lastSeen).getTime();

  if (Number.isNaN(timestamp)) return false;

  const fifteenMinutes = 15 * 60 * 1000;

  return Date.now() - timestamp <= fifteenMinutes;
}

export default function PropertyCard({
  property,
  agentSlug,
}: PropertyCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const [showContact, setShowContact] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [isSiteViewing, setIsSiteViewing] = useState(false);

  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredViewingDate: '',
  });

  const propertyImages = useMemo(() => {
    const images: string[] = [];

    if (property.image) {
      images.push(property.image);
    }

    if (Array.isArray(property.images)) {
      property.images.forEach((image) => {
        if (
          image &&
          !images.includes(image) &&
          images.length < MAX_GALLERY_IMAGES
        ) {
          images.push(image);
        }
      });
    }

    return images;
  }, [property.image, property.images]);

  const financingOptions = useMemo(() => {
    if (!Array.isArray(property.bankFinancing)) {
      return [];
    }

    return property.bankFinancing.filter(Boolean);
  }, [property.bankFinancing]);

  const parsedVideo = useMemo(
    () => parseVideoUrl(property.videoUrl),
    [property.videoUrl],
  );

  const selectedAgent = useMemo(() => {
    if (!availableAgents.length) {
      return property.agent || null;
    }

    if (agentSlug) {
      const matchingAgent = availableAgents.find(
        (agent) => agent.slug === agentSlug,
      );

      if (matchingAgent) {
        return {
          id: matchingAgent.id,
          fullName: matchingAgent.fullName,
          email: '',
          phone: null,
          role: matchingAgent.role,
          messenger: null,
          facebook: null,
          slug: matchingAgent.slug,
        };
      }
    }

    if (property.agent?.slug) {
      const matchingAgent = availableAgents.find(
        (agent) => agent.slug === property.agent?.slug,
      );

      if (matchingAgent) {
        return {
          id: matchingAgent.id,
          fullName: matchingAgent.fullName,
          email: property.agent?.email || '',
          phone: property.agent?.phone || null,
          role: matchingAgent.role,
          messenger: property.agent?.messenger || null,
          facebook: property.agent?.facebook || null,
          slug: matchingAgent.slug,
        };
      }
    }

    return property.agent || availableAgents[0] || null;
  }, [agentSlug, availableAgents, property.agent]);

  const selectedAgentSlug = useMemo(() => {
    return selectedAgent?.slug || agentSlug || '';
  }, [agentSlug, selectedAgent]);

  const selectedAgentOnline = useMemo(() => {
    if (!selectedAgent?.id) return false;

    const availableAgent = availableAgents.find(
      (agent) => agent.id === selectedAgent.id,
    );

    return isAgentOnline(availableAgent?.lastSeen);
  }, [availableAgents, selectedAgent]);

  const loadAgents = useCallback(async () => {
    if (availableAgents.length > 0) {
      return;
    }

    setLoadingAgents(true);

    try {
      const response = await fetch('/api/agents', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const agents: AvailableAgent[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.agents)
          ? data.agents
          : [];

      setAvailableAgents(agents);
    } catch {
      // Keep the property agent as fallback.
    } finally {
      setLoadingAgents(false);
    }
  }, [availableAgents.length]);

  useEffect(() => {
    if (!showDetails && !showInquiry && !showContact) {
      return;
    }

    void loadAgents();
  }, [
    loadAgents,
    showContact,
    showDetails,
    showInquiry,
  ]);

  useEffect(() => {
    const hasOpenOverlay =
      showGallery ||
      showContact ||
      showInquiry;

    if (!hasOpenOverlay) {
      document.body.style.overflow = '';
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showGallery, showContact, showInquiry]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (showGallery) {
        setShowGallery(false);
        return;
      }

      if (showContact) {
        setShowContact(false);
        return;
      }

      if (showInquiry) {
        setShowInquiry(false);
        return;
      }

      if (showDetails) {
        setShowDetails(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [
    showContact,
    showDetails,
    showGallery,
    showInquiry,
  ]);

  const openDetails = () => {
    setShowDetails(true);
    void loadAgents();
  };

  const closeDetails = () => {
    setShowDetails(false);
  };

  const handleCardClick = () => {
    if (showDetails) {
      setShowDetails(false);
    } else {
      openDetails();
    }
  };

  const openGallery = (
    event?: React.MouseEvent<HTMLButtonElement>,
    index = 0,
  ) => {
    event?.stopPropagation();

    setSelectedImage(index);
    setShowGallery(true);
  };

  const closeGallery = () => {
    setShowGallery(false);
  };

  const previousImage = (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();

    if (propertyImages.length <= 1) return;

    setSelectedImage((current) =>
      current === 0
        ? propertyImages.length - 1
        : current - 1,
    );
  };

  const nextImage = (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();

    if (propertyImages.length <= 1) return;

    setSelectedImage((current) =>
      current === propertyImages.length - 1
        ? 0
        : current + 1,
    );
  };

  const openInquiry = (
    event?: React.MouseEvent<HTMLButtonElement>,
    siteViewing = false,
  ) => {
    event?.stopPropagation();

    setIsSiteViewing(siteViewing);
    setInquirySuccess(false);
    setInquiryError('');
    setShowInquiry(true);

    if (siteViewing) {
      setInquiryForm((current) => ({
        ...current,
        message: '',
      }));
    }

    void loadAgents();
  };

  const closeInquiry = () => {
    if (inquirySubmitting) return;

    setShowInquiry(false);
    setInquiryError('');
  };

  const openContact = (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();

    setShowContact(true);
    void loadAgents();
  };

  const closeContact = () => {
    setShowContact(false);
  };

  const updateInquiryField = (
    field: keyof InquiryForm,
    value: string,
  ) => {
    setInquiryForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitInquiry = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (inquirySubmitting) return;

    setInquiryError('');
    setInquirySuccess(false);

    if (!inquiryForm.name.trim()) {
      setInquiryError('Please enter your name.');
      return;
    }

    if (!inquiryForm.email.trim()) {
      setInquiryError('Please enter your email.');
      return;
    }

    if (!inquiryForm.phone.trim()) {
      setInquiryError('Please enter your phone number.');
      return;
    }

    if (!selectedAgentSlug) {
      setInquiryError(
        'Please select an Agent or Broker before sending your inquiry.',
      );
      return;
    }

    if (
      isSiteViewing &&
      !inquiryForm.preferredViewingDate
    ) {
      setInquiryError(
        'Please select your preferred viewing date.',
      );
      return;
    }

    if (
      !isSiteViewing &&
      !inquiryForm.message.trim()
    ) {
      setInquiryError('Please enter your message.');
      return;
    }

    setInquirySubmitting(true);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property.id,
          name: inquiryForm.name.trim(),
          email: inquiryForm.email.trim(),
          phone: inquiryForm.phone.trim(),
          message: isSiteViewing
            ? `Site viewing request for "${property.title}". Preferred viewing date: ${inquiryForm.preferredViewingDate}.`
            : inquiryForm.message.trim(),
          preferredViewingDate: isSiteViewing
            ? inquiryForm.preferredViewingDate
            : undefined,
          agentSlug: selectedAgentSlug,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Unable to send your inquiry right now.',
        );
      }

      setInquirySuccess(true);

      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        message: '',
        preferredViewingDate: '',
      });
    } catch (error) {
      setInquiryError(
        error instanceof Error
          ? error.message
          : 'Unable to send your inquiry right now.',
      );
    } finally {
      setInquirySubmitting(false);
    }
  };

  const getRoleLabel = (role?: string | null) => {
    if (!role) return 'Agent';

    const normalized = role.toLowerCase();

    if (normalized === 'broker') {
      return 'Broker';
    }

    if (normalized === 'agent') {
      return 'Agent';
    }

    return role;
  };

  const formatPrice = (value: string) => {
    if (!value) return 'Price upon request';

    return value;
  };

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        aria-expanded={showDetails}
        onClick={handleCardClick}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();
            handleCardClick();
          }
        }}
        className={[
          'group relative w-full overflow-hidden rounded-2xl',
          'border border-slate-200/80 bg-white',
          'shadow-[0_8px_30px_rgba(15,23,42,0.07)]',
          'transition-all duration-300 ease-out',
          'hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]',
          'focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/60',
          showDetails
            ? 'ring-1 ring-[#c9a96e]/40'
            : '',
        ].join(' ')}
      >
        {/* IMAGE */}
        <div
          className={[
            'relative w-full overflow-hidden bg-slate-100',
            showDetails
              ? 'h-64 sm:h-72'
              : 'h-48 sm:h-52',
          ].join(' ')}
        >
          {property.image ? (
            <img
              src={property.image}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400">
              <Building2 size={42} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

          {/* TAG */}
          {property.tag && (
            <div className="absolute left-4 top-4">
              <span className="rounded-full border border-white/20 bg-slate-950/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md">
                {property.tag}
              </span>
            </div>
          )}

          {/* IMAGE COUNT */}
          {propertyImages.length > 1 && (
            <button
              type="button"
              onClick={(event) =>
                openGallery(event, 0)
              }
              className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-slate-950"
            >
              <Images size={14} />
              {propertyImages.length}
            </button>
          )}

          {/* COMPACT IMAGE TITLE */}
          {!showDetails && (
            <div className="absolute bottom-4 left-4 right-16">
              <p className="line-clamp-2 text-lg font-bold leading-tight text-white drop-shadow-sm">
                {property.title}
              </p>
            </div>
          )}
        </div>

        {/* COMPACT CARD CONTENT */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xl font-extrabold tracking-tight text-[#071936]">
                {formatPrice(property.price)}
              </p>

              {!showDetails && (
                <h2 className="mt-1 line-clamp-1 text-sm font-semibold text-slate-700">
                  {property.title}
                </h2>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#071936]/5 px-2.5 py-1 text-[#071936]">
              <Sparkles size={13} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                View
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
            <MapPin
              size={16}
              className="mt-0.5 shrink-0 text-[#c9a96e]"
            />
            <span className="line-clamp-2">
              {property.location}
            </span>
          </div>

          {/* QUICK STATS */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
            {property.beds != null && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <BedDouble
                  size={16}
                  className="text-[#c9a96e]"
                />
                <span>{property.beds}</span>
                <span className="text-slate-400">
                  Beds
                </span>
              </div>
            )}

            {property.baths != null && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Bath
                  size={16}
                  className="text-[#c9a96e]"
                />
                <span>{property.baths}</span>
                <span className="text-slate-400">
                  Baths
                </span>
              </div>
            )}

            {property.sqft != null && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Maximize
                  size={16}
                  className="text-[#c9a96e]"
                />
                <span>{property.sqft}</span>
                <span className="text-slate-400">
                  sqm
                </span>
              </div>
            )}
          </div>

          {/* COMPACT DEVELOPER */}
          {property.developer && (
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Landmark
                  size={15}
                  className="text-[#c9a96e]"
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Developer
                </span>
              </div>

              <p className="mt-1 truncate text-sm font-semibold text-[#071936]">
                {property.developer}
              </p>
            </div>
          )}

          {/* EXPAND INDICATOR */}
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-wider text-[#071936]">
            {showDetails ? (
              <>
                <ChevronUp size={16} />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                View Details
              </>
            )}
          </div>

          {/* =========================================================
              EXPANDED CONTENT
          ========================================================= */}
          {showDetails && (
            <div
              className="mt-5 space-y-5 border-t border-slate-100 pt-5"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              {/* PROPERTY DETAILS */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071936] text-white">
                    <Building2 size={16} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#071936]">
                      Property Details
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Complete property information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {property.category && (
                    <DetailItem
                      label="Category"
                      value={property.category}
                    />
                  )}

                  {property.propertyType && (
                    <DetailItem
                      label="Property Type"
                      value={property.propertyType}
                    />
                  )}

                  {property.houseType && (
                    <DetailItem
                      label="House Type"
                      value={property.houseType}
                    />
                  )}

                  {property.storey && (
                    <DetailItem
                      label="Storey"
                      value={property.storey}
                    />
                  )}

                  {property.beds != null && (
                    <DetailItem
                      label="Bedrooms"
                      value={String(property.beds)}
                    />
                  )}

                  {property.baths != null && (
                    <DetailItem
                      label="Bathrooms"
                      value={String(property.baths)}
                    />
                  )}

                  {property.sqft != null && (
                    <DetailItem
                      label="Floor Area"
                      value={`${property.sqft} sqm`}
                    />
                  )}

                  {property.totalcp && (
                    <DetailItem
                      label="Total Contract Price"
                      value={property.totalcp}
                    />
                  )}
                </div>
              </section>

              {/* DESCRIPTION */}
              {property.description && (
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-[#071936]">
                    Description
                  </h3>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {property.description}
                  </p>
                </section>
              )}

              {/* DEVELOPER */}
              {property.developer && (
                <section className="rounded-xl border border-[#c9a96e]/25 bg-[#c9a96e]/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#c9a96e] shadow-sm">
                      <Landmark size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b7b42]">
                        Property Developer
                      </p>

                      <p className="mt-1 text-base font-bold text-[#071936]">
                        {property.developer}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* FINANCING */}
              {financingOptions.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071936] text-white">
                      <LockKeyhole size={15} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#071936]">
                        Bank Financing
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Available financing options
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {financingOptions.map(
                      (bank, index) => (
                        <span
                          key={`${bank}-${index}`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
                        >
                          {bank}
                        </span>
                      ),
                    )}
                  </div>
                </section>
              )}

              {/* VIDEO */}
              {property.videoUrl && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071936] text-white">
                      <PlayCircle size={16} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#071936]">
                        Property Video
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Watch the property presentation
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl bg-slate-950">
                    {parsedVideo?.type ===
                      'youtube' ||
                    parsedVideo?.type === 'vimeo' ? (
                      <div className="aspect-video">
                        <iframe
                          src={parsedVideo.src}
                          title={`${property.title} video`}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : parsedVideo?.type ===
                      'direct' ? (
                      <video
                        src={parsedVideo.src}
                        controls
                        playsInline
                        className="aspect-video w-full object-cover"
                      >
                        Your browser does not support
                        video playback.
                      </video>
                    ) : parsedVideo?.type ===
                      'unsupported' ? (
                      <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                        <PlayCircle
                          size={38}
                          className="text-white/50"
                        />

                        <p className="mt-3 text-sm font-semibold text-white">
                          Video unavailable
                        </p>

                        <p className="mt-1 max-w-sm text-xs leading-5 text-white/50">
                          This video link is not supported
                          by the property viewer.
                        </p>

                        {isSafeHttpUrl(
                          parsedVideo.src,
                        ) && (
                          <a
                            href={parsedVideo.src}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#071936]"
                          >
                            Open Video
                            <ExternalLink
                              size={13}
                            />
                          </a>
                        )}
                      </div>
                    ) : null}
                  </div>
                </section>
              )}

              {/* GALLERY */}
              {propertyImages.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071936] text-white">
                        <Images size={16} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-[#071936]">
                          Property Gallery
                        </h3>

                        <p className="text-[11px] text-slate-400">
                          {propertyImages.length}{' '}
                          {propertyImages.length === 1
                            ? 'photo'
                            : 'photos'}
                        </p>
                      </div>
                    </div>

                    {propertyImages.length > 1 && (
                      <button
                        type="button"
                        onClick={(event) =>
                          openGallery(event, 0)
                        }
                        className="text-xs font-bold text-[#071936] hover:text-[#9b7b42]"
                      >
                        View all
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {propertyImages
                      .slice(0, 6)
                      .map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={(event) =>
                            openGallery(
                              event,
                              index,
                            )
                          }
                          className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"
                        >
                          <img
                            src={image}
                            alt={`${property.title} ${
                              index + 1
                            }`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                          {index === 5 &&
                            propertyImages.length >
                              6 && (
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55">
                                <span className="text-sm font-bold text-white">
                                  +
                                  {propertyImages.length -
                                    6}{' '}
                                  more
                                </span>
                              </div>
                            )}
                        </button>
                      ))}
                  </div>
                </section>
              )}

              {/* ACTIONS */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={(event) =>
                    openInquiry(event, false)
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0d2851]"
                >
                  <Send size={16} />
                  Inquire
                </button>

                <button
                  type="button"
                  onClick={(event) =>
                    openInquiry(event, true)
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#c9a96e] bg-[#c9a96e]/10 px-4 py-3 text-sm font-bold text-[#80612f] transition hover:bg-[#c9a96e]/20"
                >
                  <CalendarDays size={16} />
                  Site Viewing
                </button>

                <button
                  type="button"
                  onClick={(event) =>
                    openContact(event)
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#071936] transition hover:border-[#071936]/30 hover:bg-slate-50"
                >
                  <MessageCircle size={16} />
                  Contact
                </button>
              </div>

              {/* COLLAPSE */}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closeDetails();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:bg-slate-50 hover:text-[#071936]"
              >
                <ChevronUp size={15} />
                Collapse Details
              </button>
            </div>
          )}
        </div>
      </article>

      {/* =============================================================
          GALLERY MODAL
      ============================================================= */}
      {showGallery && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          onClick={closeGallery}
        >
          <div
            className="relative flex h-full w-full max-w-6xl items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={closeGallery}
              className="absolute right-0 top-0 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
              aria-label="Close gallery"
            >
              <X size={20} />
            </button>

            <div className="relative max-h-[85vh] w-full">
              {propertyImages[selectedImage] && (
                <img
                  src={
                    propertyImages[selectedImage]
                  }
                  alt={`${property.title} gallery image`}
                  className="mx-auto max-h-[78vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                />
              )}

              {propertyImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 sm:left-4"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 sm:right-4"
                    aria-label="Next image"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-12 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                {selectedImage + 1} /{' '}
                {propertyImages.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          CONTACT MODAL
      ============================================================= */}
      {showContact && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeContact}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="relative bg-[#071936] px-6 py-7 text-white">
              <button
                type="button"
                onClick={closeContact}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <X size={18} />
              </button>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ead9b8]">
                Contact Representative
              </p>

              <h3 className="mt-2 text-xl font-bold">
                {selectedAgent?.fullName ||
                  'Property Representative'}
              </h3>

              {selectedAgent && (
                <p className="mt-1 text-sm text-white/60">
                  {getRoleLabel(
                    selectedAgent.role,
                  )}
                </p>
              )}
            </div>

            <div className="space-y-3 p-6">
              {selectedAgent?.phone && (
                <a
                  href={`tel:${selectedAgent.phone}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071936]/5 text-[#071936]">
                    <Phone size={18} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Phone
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[#071936]">
                      {selectedAgent.phone}
                    </p>
                  </div>
                </a>
              )}

              {selectedAgent?.email && (
                <a
                  href={`mailto:${selectedAgent.email}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071936]/5 text-[#071936]">
                    <Mail size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </p>

                    <p className="mt-0.5 truncate text-sm font-semibold text-[#071936]">
                      {selectedAgent.email}
                    </p>
                  </div>
                </a>
              )}

              {selectedAgent?.messenger &&
                isSafeHttpUrl(
                  selectedAgent.messenger,
                ) && (
                  <a
                    href={selectedAgent.messenger}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071936]/5 text-[#071936]">
                      <MessageCircle size={18} />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Messenger
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-[#071936]">
                        Message representative
                      </p>
                    </div>

                    <ExternalLink
                      size={15}
                      className="ml-auto text-slate-400"
                    />
                  </a>
                )}

              {selectedAgent?.facebook &&
                isSafeHttpUrl(
                  selectedAgent.facebook,
                ) && (
                  <a
                    href={selectedAgent.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071936]/5 text-[#071936]">
                      <Users size={18} />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Facebook
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-[#071936]">
                        View profile
                      </p>
                    </div>

                    <ExternalLink
                      size={15}
                      className="ml-auto text-slate-400"
                    />
                  </a>
                )}

              {!selectedAgent?.phone &&
                !selectedAgent?.email &&
                !selectedAgent?.messenger &&
                !selectedAgent?.facebook && (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center">
                    <Users
                      size={28}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Contact details are not
                      available yet.
                    </p>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        closeContact();
                        openInquiry();
                      }}
                      className="mt-4 rounded-xl bg-[#071936] px-5 py-3 text-sm font-bold text-white"
                    >
                      Send an Inquiry
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          INQUIRY / SITE VIEWING MODAL
      ============================================================= */}
      {showInquiry && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeInquiry}
        >
          <div
            className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 bg-[#071936] px-6 py-6 text-white">
              <button
                type="button"
                onClick={closeInquiry}
                disabled={inquirySubmitting}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-40"
              >
                <X size={18} />
              </button>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ead9b8]">
                {isSiteViewing
                  ? 'Site Viewing Request'
                  : 'Property Inquiry'}
              </p>

              <h3 className="mt-2 pr-10 text-xl font-bold">
                {property.title}
              </h3>

              <p className="mt-1 text-sm text-white/60">
                {property.location}
              </p>
            </div>

            {inquirySuccess ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={34} />
                </div>

                <h4 className="mt-5 text-xl font-bold text-[#071936]">
                  Request Sent
                </h4>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Thank you. Your request has been
                  submitted successfully. A property
                  representative will get in touch with
                  you.
                </p>

                <button
                  type="button"
                  onClick={closeInquiry}
                  className="mt-6 rounded-xl bg-[#071936] px-6 py-3 text-sm font-bold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={submitInquiry}
                className="space-y-5 p-6"
              >
                {/* SELECTED REPRESENTATIVE */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#071936] text-white">
                      <Users size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Sending to
                      </p>

                      <p className="mt-0.5 truncate text-sm font-bold text-[#071936]">
                        {selectedAgent?.fullName ||
                          'Select an Agent / Broker'}
                      </p>

                      {selectedAgent && (
                        <p className="text-xs text-slate-400">
                          {getRoleLabel(
                            selectedAgent.role,
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {availableAgents.length > 1 && (
                    <select
                      value={selectedAgentSlug}
                      onChange={(event) => {
                        const slug =
                          event.target.value;

                        const agent =
                          availableAgents.find(
                            (item) =>
                              item.slug === slug,
                          );

                        if (!agent) return;

                        setAvailableAgents(
                          (current) => current,
                        );
                      }}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/10"
                    >
                      {availableAgents.map(
                        (agent) => (
                          <option
                            key={agent.id}
                            value={agent.slug}
                          >
                            {agent.fullName} —{' '}
                            {getRoleLabel(
                              agent.role,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                </div>

                {/* NAME */}
                <FormField
                  label="Full Name"
                  required
                  value={inquiryForm.name}
                  onChange={(value) =>
                    updateInquiryField(
                      'name',
                      value,
                    )
                  }
                  placeholder="Enter your full name"
                />

                {/* EMAIL */}
                <FormField
                  label="Email Address"
                  required
                  type="email"
                  value={inquiryForm.email}
                  onChange={(value) =>
                    updateInquiryField(
                      'email',
                      value,
                    )
                  }
                  placeholder="you@example.com"
                />

                {/* PHONE */}
                <FormField
                  label="Phone Number"
                  required
                  type="tel"
                  value={inquiryForm.phone}
                  onChange={(value) =>
                    updateInquiryField(
                      'phone',
                      value,
                    )
                  }
                  placeholder="09XX XXX XXXX"
                />

                {/* VIEWING DATE */}
                {isSiteViewing && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Preferred Viewing Date
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="date"
                        min={formatDateTimeLocalMin()}
                        value={
                          inquiryForm.preferredViewingDate
                        }
                        onChange={(event) =>
                          updateInquiryField(
                            'preferredViewingDate',
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/10"
                      />
                    </div>
                  </div>
                )}

                {/* MESSAGE */}
                {!isSiteViewing && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Message
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <textarea
                      rows={5}
                      value={inquiryForm.message}
                      onChange={(event) =>
                        updateInquiryField(
                          'message',
                          event.target.value,
                        )
                      }
                      placeholder="Tell us what you would like to know about this property..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/10"
                    />
                  </div>
                )}

                {/* SITE VIEWING NOTE */}
                {isSiteViewing && (
                  <div className="rounded-2xl border border-[#c9a96e]/25 bg-[#c9a96e]/5 p-4">
                    <div className="flex gap-3">
                      <CalendarDays
                        size={18}
                        className="mt-0.5 shrink-0 text-[#9b7b42]"
                      />

                      <div>
                        <p className="text-sm font-bold text-[#071936]">
                          Site Viewing
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Your selected date will be
                          sent to the assigned Agent or
                          Broker for confirmation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ERROR */}
                {inquiryError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {inquiryError}
                  </div>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#071936]/10 transition hover:bg-[#0d2851] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {inquirySubmitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      {isSiteViewing ? (
                        <CalendarDays size={17} />
                      ) : (
                        <Send size={17} />
                      )}

                      {isSiteViewing
                        ? 'Request Site Viewing'
                        : 'Send Inquiry'}
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] leading-4 text-slate-400">
                  By submitting this form, you agree
                  to be contacted regarding this property.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ===============================================================
   DETAIL ITEM
=============================================================== */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-bold leading-5 text-[#071936]">
        {value}
      </p>
    </div>
  );
}

/* ===============================================================
   FORM FIELD
=============================================================== */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/10"
      />
    </div>
  );
}