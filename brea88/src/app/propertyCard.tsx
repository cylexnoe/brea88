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
  Sparkles,
  LockKeyhole,
  PlayCircle,
  Building2,
  Landmark,
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
  | 'youtube'
  | 'vimeo'
  | 'direct'
  | 'unsupported';

export default function PropertyCard({
  property,
  agentSlug = '',
}: PropertyCardProps) {
  const linkedAgentSlug = agentSlug.trim();

  const defaultAgentSlug =
    linkedAgentSlug || property.agent?.slug || '';

  const [showDetails, setShowDetails] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const [showContact, setShowContact] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [isSiteViewing, setIsSiteViewing] = useState(false);

  const [agents, setAgents] = useState<AvailableAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState('');

  const [selectedAgentSlug, setSelectedAgentSlug] =
    useState(defaultAgentSlug);

  const [showAgentPicker, setShowAgentPicker] =
    useState(false);

  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredViewingDate: '',
  });

  const [inquirySubmitting, setInquirySubmitting] =
    useState(false);

  const [inquirySuccess, setInquirySuccess] =
    useState(false);

  const [inquiryError, setInquiryError] = useState('');

  /* -------------------------------------------------------------------------- */
  /* Helpers                                                                    */
  /* -------------------------------------------------------------------------- */

  const formatPrice = (
    value: string | number | null | undefined
  ): string => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '0';
    }

    const numericValue = Number(
      String(value).replace(/[^0-9.-]/g, '')
    );

    if (!Number.isFinite(numericValue)) {
      return '0';
    }

    return numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isSafeExternalUrl = (
    value: string | null | undefined
  ) => {
    if (!value) {
      return false;
    }

    try {
      const url = new URL(value.trim());

      return (
        url.protocol === 'http:' ||
        url.protocol === 'https:'
      );
    } catch {
      return false;
    }
  };

  const propertyImages = useMemo(() => {
    const validImages =
      property.images?.filter(
        (image): image is string =>
          typeof image === 'string' &&
          image.trim().length > 0
      ) ?? [];

    if (validImages.length > 0) {
      return validImages;
    }

    if (
      typeof property.image === 'string' &&
      property.image.trim()
    ) {
      return [property.image.trim()];
    }

    return [];
  }, [property.images, property.image]);

  const financingOptions = useMemo(() => {
    if (!Array.isArray(property.bankFinancing)) {
      return [];
    }

    return Array.from(
      new Set(
        property.bankFinancing
          .filter(
            (bank): bank is string =>
              typeof bank === 'string' &&
              bank.trim().length > 0
          )
          .map((bank) => bank.trim())
      )
    );
  }, [property.bankFinancing]);

  /* -------------------------------------------------------------------------- */
  /* Property Video                                                             */
  /* -------------------------------------------------------------------------- */

  const propertyVideoUrl = useMemo(() => {
    const value =
      typeof property.videoUrl === 'string'
        ? property.videoUrl.trim()
        : '';

    if (!value) {
      return '';
    }

    try {
      const url = new URL(value);

      if (
        url.protocol !== 'http:' &&
        url.protocol !== 'https:'
      ) {
        return '';
      }

      return url.toString();
    } catch {
      return '';
    }
  }, [property.videoUrl]);

  const youtubeEmbedUrl = useMemo(() => {
    if (!propertyVideoUrl) {
      return '';
    }

    try {
      const url = new URL(propertyVideoUrl);
      const hostname = url.hostname.toLowerCase();

      let videoId = '';

      if (
        hostname === 'youtu.be' ||
        hostname === 'www.youtu.be'
      ) {
        videoId =
          url.pathname
            .replace(/^\/+/, '')
            .split('/')[0] || '';
      }

      if (
        hostname === 'youtube.com' ||
        hostname === 'www.youtube.com' ||
        hostname === 'm.youtube.com'
      ) {
        if (url.pathname === '/watch') {
          videoId = url.searchParams.get('v') || '';
        } else if (
          url.pathname.startsWith('/shorts/')
        ) {
          videoId =
            url.pathname
              .split('/shorts/')[1]
              ?.split('/')[0] || '';
        } else if (
          url.pathname.startsWith('/embed/')
        ) {
          videoId =
            url.pathname
              .split('/embed/')[1]
              ?.split('/')[0] || '';
        } else if (
          url.pathname.startsWith('/live/')
        ) {
          videoId =
            url.pathname
              .split('/live/')[1]
              ?.split('/')[0] || '';
        }
      }

      if (!videoId) {
        return '';
      }

      return `https://www.youtube.com/embed/${encodeURIComponent(
        videoId
      )}?rel=0&modestbranding=1`;
    } catch {
      return '';
    }
  }, [propertyVideoUrl]);

  const vimeoEmbedUrl = useMemo(() => {
    if (!propertyVideoUrl) {
      return '';
    }

    try {
      const url = new URL(propertyVideoUrl);
      const hostname = url.hostname.toLowerCase();

      if (
        hostname !== 'vimeo.com' &&
        hostname !== 'www.vimeo.com' &&
        hostname !== 'player.vimeo.com'
      ) {
        return '';
      }

      let videoId = '';

      if (hostname === 'player.vimeo.com') {
        const match =
          url.pathname.match(/\/video\/(\d+)/);

        videoId = match?.[1] || '';
      } else {
        const parts = url.pathname
          .split('/')
          .filter(Boolean);

        const numericPart = parts.find((part) =>
          /^\d+$/.test(part)
        );

        videoId = numericPart || '';
      }

      if (!videoId) {
        return '';
      }

      return `https://player.vimeo.com/video/${encodeURIComponent(
        videoId
      )}`;
    } catch {
      return '';
    }
  }, [propertyVideoUrl]);

  const isDirectVideo = useMemo(() => {
    if (
      !propertyVideoUrl ||
      youtubeEmbedUrl ||
      vimeoEmbedUrl
    ) {
      return false;
    }

    try {
      const url = new URL(propertyVideoUrl);
      const pathname = url.pathname.toLowerCase();

      return /\.(mp4|webm|ogg|mov|m4v)$/i.test(
        pathname
      );
    } catch {
      return false;
    }
  }, [
    propertyVideoUrl,
    youtubeEmbedUrl,
    vimeoEmbedUrl,
  ]);

  const videoType = useMemo<VideoType>(() => {
    if (!propertyVideoUrl) {
      return 'unsupported';
    }

    if (youtubeEmbedUrl) {
      return 'youtube';
    }

    if (vimeoEmbedUrl) {
      return 'vimeo';
    }

    if (isDirectVideo) {
      return 'direct';
    }

    return 'unsupported';
  }, [
    propertyVideoUrl,
    youtubeEmbedUrl,
    vimeoEmbedUrl,
    isDirectVideo,
  ]);

  /* -------------------------------------------------------------------------- */
  /* Agent                                                                      */
  /* -------------------------------------------------------------------------- */

  const selectedAgent = useMemo(
    () =>
      agents.find(
        (agent) => agent.slug === selectedAgentSlug
      ) ?? null,
    [agents, selectedAgentSlug]
  );

  const loadAgents = useCallback(async () => {
    if (agentsLoading) {
      return;
    }

    setAgentsLoading(true);
    setAgentsError('');

    try {
      const response = await fetch('/api/agents', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      let data: unknown = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          'Unable to load available Agents and Brokers.'
        );
      }

      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : typeof data === 'object' &&
                data !== null &&
                'error' in data &&
                typeof data.error === 'string'
              ? data.error
              : 'Unable to load available Agents and Brokers.';

        throw new Error(message);
      }

      const list = Array.isArray(data)
        ? data
        : typeof data === 'object' &&
            data !== null &&
            'agents' in data &&
            Array.isArray(data.agents)
          ? data.agents
          : [];

      const normalizedAgents =
        list.filter(
          (agent): agent is AvailableAgent =>
            typeof agent === 'object' &&
            agent !== null &&
            typeof agent.id === 'number' &&
            typeof agent.fullName === 'string' &&
            typeof agent.role === 'string' &&
            typeof agent.slug === 'string'
        );

      setAgents(normalizedAgents);

      setSelectedAgentSlug((current) => {
        if (linkedAgentSlug) {
          return linkedAgentSlug;
        }

        if (
          current &&
          normalizedAgents.some(
            (agent) => agent.slug === current
          )
        ) {
          return current;
        }

        if (
          property.agent?.slug &&
          normalizedAgents.some(
            (agent) =>
              agent.slug === property.agent?.slug
          )
        ) {
          return property.agent.slug;
        }

        return normalizedAgents[0]?.slug || '';
      });
    } catch (error) {
      setAgentsError(
        error instanceof Error
          ? error.message
          : 'Unable to load available Agents and Brokers.'
      );

      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }, [
    agentsLoading,
    linkedAgentSlug,
    property.agent?.slug,
  ]);

  /* -------------------------------------------------------------------------- */
  /* Modal State                                                                */
  /* -------------------------------------------------------------------------- */

  const hasOpenModal =
    showDetails ||
    showGallery ||
    showContact ||
    showInquiry;

  useEffect(() => {
    if (!hasOpenModal) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [hasOpenModal]);

  useEffect(() => {
    if (!hasOpenModal) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (inquirySubmitting) {
        return;
      }

      if (showAgentPicker) {
        setShowAgentPicker(false);
        return;
      }

      if (showGallery) {
        setShowGallery(false);
        return;
      }

      if (showInquiry) {
        setShowInquiry(false);
        return;
      }

      if (showContact) {
        setShowContact(false);
        return;
      }

      if (showDetails) {
        setShowDetails(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    hasOpenModal,
    inquirySubmitting,
    showAgentPicker,
    showGallery,
    showInquiry,
    showContact,
    showDetails,
  ]);

  useEffect(() => {
    setSelectedAgentSlug(defaultAgentSlug);
  }, [defaultAgentSlug]);

  useEffect(() => {
    if (showInquiry) {
      void loadAgents();
    }
  }, [showInquiry, loadAgents]);

  useEffect(() => {
    if (!showInquiry) {
      setShowAgentPicker(false);
    }
  }, [showInquiry]);

  /* -------------------------------------------------------------------------- */
  /* Modal Actions                                                              */
  /* -------------------------------------------------------------------------- */

  const openDetails = () => {
    setSelectedImage(0);
    setShowContact(false);
    setShowInquiry(false);
    setShowGallery(false);
    setShowAgentPicker(false);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
  };

  const openGallery = () => {
    if (propertyImages.length === 0) {
      return;
    }

    setShowAgentPicker(false);
    setShowGallery(true);
  };

  const closeGallery = () => {
    setShowGallery(false);
  };

  const resetInquiryState = () => {
    setInquiryError('');
    setInquirySuccess(false);
    setShowAgentPicker(false);
  };

  const openInquiry = (message = '') => {
    setShowDetails(false);
    setShowContact(false);
    setShowGallery(false);

    resetInquiryState();

    setIsSiteViewing(false);
    setSelectedAgentSlug(defaultAgentSlug);

    setInquiryForm((current) => ({
      ...current,
      message,
      preferredViewingDate: '',
    }));

    setShowInquiry(true);
  };

  const openSiteViewing = () => {
    setShowDetails(false);
    setShowContact(false);
    setShowGallery(false);

    resetInquiryState();

    setIsSiteViewing(true);
    setSelectedAgentSlug(defaultAgentSlug);

    setInquiryForm({
      name: '',
      email: '',
      phone: '',
      message: '',
      preferredViewingDate: '',
    });

    setShowInquiry(true);
  };

  const openContact = () => {
    setShowDetails(false);
    setShowGallery(false);
    setShowInquiry(false);
    setShowAgentPicker(false);
    setShowContact(true);
  };

  const closeContact = () => {
    setShowContact(false);
  };

  const closeInquiry = () => {
    if (inquirySubmitting) {
      return;
    }

    setShowInquiry(false);
    setShowAgentPicker(false);
    setInquiryError('');
  };

  /* -------------------------------------------------------------------------- */
  /* Gallery                                                                    */
  /* -------------------------------------------------------------------------- */

  const nextImage = () => {
    if (propertyImages.length <= 1) {
      return;
    }

    setSelectedImage(
      (current) =>
        (current + 1) % propertyImages.length
    );
  };

  const previousImage = () => {
    if (propertyImages.length <= 1) {
      return;
    }

    setSelectedImage(
      (current) =>
        (current - 1 + propertyImages.length) %
        propertyImages.length
    );
  };

  /* -------------------------------------------------------------------------- */
  /* Viewing Date                                                               */
  /* -------------------------------------------------------------------------- */

  const today = new Date();

  const minViewingDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  /* -------------------------------------------------------------------------- */
  /* Inquiry Validation                                                         */
  /* -------------------------------------------------------------------------- */

  const validateInquiry = (): string => {
    const name = inquiryForm.name.trim();
    const email = inquiryForm.email.trim();
    const phone = inquiryForm.phone.trim();
    const message = inquiryForm.message.trim();

    if (name.length < 2) {
      return 'Please enter your full name.';
    }

    if (name.length > 100) {
      return 'Your name is too long.';
    }

    if (!email) {
      return 'Please enter your email address.';
    }

    if (email.length > 150) {
      return 'Your email address is too long.';
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return 'Please enter a valid email address.';
    }

    if (phone.length < 7) {
      return 'Please enter a valid contact number.';
    }

    if (phone.length > 30) {
      return 'Your contact number is too long.';
    }

    if (!selectedAgentSlug) {
      return 'Please select an Agent or Broker before submitting.';
    }

    if (
      isSiteViewing &&
      !inquiryForm.preferredViewingDate
    ) {
      return 'Please select your preferred site viewing date.';
    }

    if (
      isSiteViewing &&
      inquiryForm.preferredViewingDate < minViewingDate
    ) {
      return 'Please select a valid future viewing date.';
    }

    if (!isSiteViewing && message.length < 5) {
      return 'Please enter a short message.';
    }

    if (!isSiteViewing && message.length > 2000) {
      return 'Your message is too long.';
    }

    return '';
  };

  /* -------------------------------------------------------------------------- */
  /* Inquiry Submit                                                             */
  /* -------------------------------------------------------------------------- */

  const submitInquiry = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (inquirySubmitting) {
      return;
    }

    setInquiryError('');

    const validationError = validateInquiry();

    if (validationError) {
      setInquiryError(validationError);
      return;
    }

    setInquirySubmitting(true);

    try {
      const name = inquiryForm.name.trim();
      const email = inquiryForm.email.trim();
      const phone = inquiryForm.phone.trim();
      const message = inquiryForm.message.trim();

      const requestMessage = isSiteViewing
        ? `Site viewing request for "${property.title}". Preferred viewing date: ${inquiryForm.preferredViewingDate}.`
        : message;

      const response = await fetch(
        '/api/inquiries',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            propertyId: property.id,
            name,
            email,
            phone,
            message: requestMessage,
            preferredViewingDate: isSiteViewing
              ? inquiryForm.preferredViewingDate
              : undefined,
            agentSlug: selectedAgentSlug,
          }),
        }
      );

      let data: unknown = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : typeof data === 'object' &&
                data !== null &&
                'error' in data &&
                typeof data.error === 'string'
              ? data.error
              : 'Failed to submit inquiry.';

        throw new Error(message);
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
          : 'Unable to submit inquiry.'
      );
    } finally {
      setInquirySubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Shared Inquiry Message                                                     */
  /* -------------------------------------------------------------------------- */

  const defaultInquiryMessage = `Hello, I am interested in ${property.title}. Please contact me with more information.`;

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      {/* ====================================================================== */}
      {/* PROPERTY CARD                                                          */}
      {/* ====================================================================== */}

      <article
        onClick={openDetails}
        className="group relative cursor-pointer overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.07)] transition-all duration-500 hover:-translate-y-2 hover:border-slate-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)] active:scale-[0.99]"
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-slate-100 sm:h-60 md:h-64">
          {propertyImages.length > 0 ? (
            <img
              src={propertyImages[0]}
              alt={property.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display =
                  'none';
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No Image
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent" />

          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />

          {/* Tag */}
          <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-md">
            {property.tag}
          </span>

          {/* Image Count */}
          {propertyImages.length > 1 && (
            <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <Images className="h-3.5 w-3.5" />
              {propertyImages.length}
            </span>
          )}

          {/* Price */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
              Property Price
            </p>

            <p className="mt-0.5 text-xl font-black tracking-tight text-white sm:text-2xl">
              ₱{formatPrice(property.price)}
            </p>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 md:p-6">
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-slate-950 transition-colors duration-300 group-hover:text-[#071936] sm:text-lg">
            {property.title}
          </h3>

          {property.developer && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              by {property.developer}
            </p>
          )}

          {/* Location */}
          <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a96e]" />

            <span className="line-clamp-2 text-sm leading-5 text-slate-600">
              {property.location}
            </span>
          </div>

          {/* Property Stats */}
          {(property.beds != null ||
            property.baths != null ||
            property.sqft != null) && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
              {property.beds != null && (
                <span className="flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-slate-400" />
                  {property.beds} Beds
                </span>
              )}

              {property.baths != null && (
                <span className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-slate-400" />
                  {property.baths} Baths
                </span>
              )}

              {property.sqft != null && (
                <span className="flex items-center gap-1.5">
                  <Maximize className="h-4 w-4 text-slate-400" />
                  {property.sqft} sqm
                </span>
              )}
            </div>
          )}

          {/* ================================================================== */}
          {/* PROPERTY VIDEO                                                      */}
          {/* ================================================================== */}

          {propertyVideoUrl && (
            <div
              className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                {videoType === 'youtube' &&
                youtubeEmbedUrl ? (
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`${property.title} video`}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : videoType === 'vimeo' &&
                  vimeoEmbedUrl ? (
                  <iframe
                    src={vimeoEmbedUrl}
                    title={`${property.title} Vimeo video`}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : videoType === 'direct' ? (
                  <video
                    src={propertyVideoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain"
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    Your browser does not support the video
                    element.
                  </video>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-5 text-center text-white">
                    <PlayCircle className="h-9 w-9 text-[#c9a96e]" />

                    <p className="mt-2 text-xs font-bold">
                      Property Video
                    </p>

                    <p className="mt-1 max-w-sm text-[10px] leading-5 text-white/50">
                      Video format cannot be embedded directly.
                      Please use a YouTube, Vimeo, or direct video
                      file URL.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-white/10 bg-[#071936] px-4 py-3">
                <PlayCircle className="h-4 w-4 shrink-0 text-[#c9a96e]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70">
                  Property Video
                </span>
              </div>
            </div>
          )}

          {/* ONE MORE DETAILS BUTTON */}
          <div className="mt-5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openDetails();
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3 text-xs font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg active:translate-y-0"
            >
              <Building2 className="h-4 w-4" />
              More Details
            </button>
          </div>
        </div>
      </article>

      {/* ====================================================================== */}
      {/* PROPERTY DETAILS MODAL                                                 */}
      {/* ====================================================================== */}

      {showDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md"
          onClick={closeDetails}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`property-title-${property.id}`}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Back */}
            <button
              type="button"
              onClick={closeDetails}
              aria-label="Back to properties"
              className="absolute left-4 top-4 z-30 flex h-11 items-center gap-2 rounded-full border border-white/30 bg-slate-950/65 px-4 text-sm font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-[#c9a96e] active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={closeDetails}
              aria-label="Close property details"
              className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-slate-950/65 text-white shadow-lg backdrop-blur-md transition hover:bg-[#c9a96e] active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Hero */}
            <div className="relative h-[300px] overflow-hidden bg-slate-950 sm:h-[380px] md:h-[460px]">
              {propertyImages.length > 0 ? (
                <img
                  src={propertyImages[0]}
                  alt={property.title}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      'none';
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white">
                  No Image
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />

              <span className="absolute left-5 top-5 rounded-full bg-[#071936]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md sm:left-7 sm:top-7">
                {property.tag}
              </span>

              <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7">
                <p className="flex items-center gap-1.5 text-sm text-white/75">
                  <MapPin className="h-4 w-4 text-[#ead9b8]" />
                  {property.location}
                </p>

                <h2
                  id={`property-title-${property.id}`}
                  className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl"
                >
                  {property.title}
                </h2>
              </div>

              {propertyImages.length > 1 && (
                <button
                  type="button"
                  onClick={openGallery}
                  className="absolute bottom-5 right-5 hidden items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition hover:bg-[#c9a96e] hover:text-white sm:flex"
                >
                  <Images className="h-4 w-4" />
                  View More Photos ({propertyImages.length})
                </button>
              )}
            </div>

            {/* Details Content */}
            <div className="p-5 sm:p-7 md:p-9">
              {/* Price */}
              <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-7 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Property Price
                  </p>

                  <h3 className="mt-1 text-3xl font-black tracking-tight text-[#071936] sm:text-4xl">
                    ₱{formatPrice(property.price)}
                  </h3>

                  {property.totalcp && (
                    <p className="mt-1 text-sm text-slate-500">
                      Total Contract Price: ₱
                      {formatPrice(property.totalcp)}
                    </p>
                  )}
                </div>

                {propertyImages.length > 1 && (
                  <button
                    type="button"
                    onClick={openGallery}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#c9a96e] hover:text-[#071936] sm:hidden"
                  >
                    <Images className="h-4 w-4" />
                    View More Photos
                  </button>
                )}
              </div>

              {/* Stats */}
              {(property.beds != null ||
                property.baths != null ||
                property.sqft != null) && (
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.beds != null && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <BedDouble className="mb-3 h-5 w-5 text-[#071936]" />

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Bedrooms
                      </p>

                      <p className="mt-1 text-lg font-black text-slate-900">
                        {property.beds}
                      </p>
                    </div>
                  )}

                  {property.baths != null && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <Bath className="mb-3 h-5 w-5 text-[#071936]" />

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Bathrooms
                      </p>

                      <p className="mt-1 text-lg font-black text-slate-900">
                        {property.baths}
                      </p>
                    </div>
                  )}

                  {property.sqft != null && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <Maximize className="mb-3 h-5 w-5 text-[#071936]" />

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Area
                      </p>

                      <p className="mt-1 text-lg font-black text-slate-900">
                        {property.sqft} sqm
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Property Details */}
              {property.description && (
                <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071936] text-[#ead9b8]">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        Property Details
                      </h3>

                      <p className="text-xs font-medium text-slate-400">
                        Complete property information
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Property Information */}
              {(property.developer ||
                property.category ||
                property.propertyType ||
                property.houseType ||
                property.storey) && (
                <div className="mt-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-950">
                      Property Information
                    </h3>

                    <p className="mt-1 text-xs font-medium text-slate-400">
                      Listing information
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {property.developer && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          Developer
                        </p>

                        <p className="mt-2 text-sm font-extrabold text-slate-900">
                          {property.developer}
                        </p>
                      </div>
                    )}

                    {property.category && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          Category
                        </p>

                        <p className="mt-2 text-sm font-extrabold text-slate-900">
                          {property.category}
                        </p>
                      </div>
                    )}

                    {property.propertyType && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          Property Type
                        </p>

                        <p className="mt-2 text-sm font-extrabold text-slate-900">
                          {property.propertyType}
                        </p>
                      </div>
                    )}

                    {property.houseType && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          House Type
                        </p>

                        <p className="mt-2 text-sm font-extrabold text-slate-900">
                          {property.houseType}
                        </p>
                      </div>
                    )}

                    {property.storey && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          Storey
                        </p>

                        <p className="mt-2 text-sm font-extrabold text-slate-900">
                          {property.storey}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Financing */}
              {financingOptions.length > 0 && (
                <div className="mt-8 rounded-2xl border border-slate-100 bg-gradient-to-br from-[#faf7ef] to-white p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#071936] text-[#ead9b8]">
                      <Landmark className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        Bank Financing
                      </h3>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        Available financing options
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {financingOptions.map((bank) => (
                      <span
                        key={bank}
                        className="rounded-full border border-[#c9a96e]/40 bg-white px-4 py-2 text-xs font-bold text-[#071936] shadow-sm"
                      >
                        {bank}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Video */}
              {propertyVideoUrl && (
                <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-[#071936]">
                  <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#ead9b8]">
                        <PlayCircle className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-white">
                          Property Video
                        </h3>

                        <p className="mt-1 text-xs text-white/55">
                          Watch the developer&apos;s property video
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative aspect-video w-full bg-black">
                    {videoType === 'youtube' &&
                    youtubeEmbedUrl ? (
                      <iframe
                        src={youtubeEmbedUrl}
                        title={`${property.title} property video`}
                        className="absolute inset-0 h-full w-full"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : videoType === 'vimeo' &&
                      vimeoEmbedUrl ? (
                      <iframe
                        src={vimeoEmbedUrl}
                        title={`${property.title} Vimeo property video`}
                        className="absolute inset-0 h-full w-full"
                        loading="lazy"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : videoType === 'direct' ? (
                      <video
                        src={propertyVideoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-contain"
                      >
                        Your browser does not support the video
                        element.
                      </video>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-5 text-center text-white">
                        <PlayCircle className="h-10 w-10 text-[#c9a96e]" />

                        <p className="mt-3 text-sm font-bold">
                          Property Video
                        </p>

                        <p className="mt-1 max-w-md text-xs leading-6 text-white/50">
                          This video URL cannot be embedded directly.
                          Please use a YouTube link, Vimeo link, or
                          direct video file URL.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Location
                </p>

                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MapPin className="h-4 w-4 text-[#c9a96e]" />
                  {property.location}
                </p>
              </div>

              {/* Property Actions */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={openSiteViewing}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#071936] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"
                >
                  <CalendarDays className="h-5 w-5" />
                  Schedule Site Viewing
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openInquiry(defaultInquiryMessage)
                  }
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#071936] bg-white px-5 py-3.5 text-sm font-bold text-[#071936] transition hover:-translate-y-0.5 hover:border-[#c9a96e] hover:bg-[#faf7ef] hover:shadow-lg active:translate-y-0"
                >
                  <Send className="h-5 w-5" />
                  Send Inquiry
                </button>

                <button
                  type="button"
                  onClick={openContact}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-[#071936] transition hover:-translate-y-0.5 hover:border-[#c9a96e] hover:shadow-lg active:translate-y-0"
                >
                  <Phone className="h-5 w-5" />
                  Contact Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* INQUIRY / SITE VIEWING MODAL                                             */}
      {/* ====================================================================== */}

      {showInquiry && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={closeInquiry}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`inquiry-title-${property.id}`}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeInquiry}
              disabled={inquirySubmitting}
              aria-label="Close inquiry form"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#c9a96e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div
              className={`p-6 text-white sm:p-7 ${
                isSiteViewing
                  ? 'bg-gradient-to-br from-[#071936] via-[#0b2347] to-[#123d68]'
                  : 'bg-[#071936]'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ead9b8]">
                BREA 88 REALTY
              </p>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <CalendarDays className="h-5 w-5 text-[#ead9b8]" />
                </div>

                <div>
                  <h2
                    id={`inquiry-title-${property.id}`}
                    className="text-2xl font-black"
                  >
                    {isSiteViewing
                      ? 'Schedule Site Viewing'
                      : 'Send an Inquiry'}
                  </h2>

                  <p className="mt-1 line-clamp-2 text-sm text-white/70">
                    {property.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Success */}
            {inquirySuccess ? (
              <div className="p-7 text-center sm:p-9">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-950">
                  {isSiteViewing
                    ? 'Viewing Request Submitted'
                    : 'Inquiry Submitted'}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isSiteViewing
                    ? 'Your preferred viewing date has been sent to the assigned agent. The agent will contact you to confirm the available schedule.'
                    : 'Thank you. Your inquiry has been submitted successfully. Our team will get back to you soon.'}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowInquiry(false)
                  }
                  className="mt-6 min-h-11 rounded-xl bg-[#071936] px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={submitInquiry}
                className="space-y-4 p-6 sm:p-7"
              >
                {/* Notice */}
                <div className="rounded-xl border border-[#ead9b8] bg-[#faf7ef] p-3 text-xs leading-5 text-slate-600">
                  {isSiteViewing
                    ? 'Choose your preferred date. This is a request, not a confirmed appointment. The selected Agent or Broker will contact you to confirm availability.'
                    : 'Tell us how we can help. Select an Agent or Broker and your inquiry will be routed directly to that registered account.'}
                </div>

                {/* Agent Selector */}
                <div className="relative">
                  <label
                    htmlFor={`inquiryAgent-${property.id}`}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Choose an Agent or Broker
                  </label>

                  <button
                    id={`inquiryAgent-${property.id}`}
                    type="button"
                    disabled={
                      Boolean(linkedAgentSlug) ||
                      agentsLoading ||
                      agents.length === 0
                    }
                    onClick={() =>
                      !linkedAgentSlug &&
                      setShowAgentPicker(
                        (current) => !current
                      )
                    }
                    aria-expanded={showAgentPicker}
                    aria-haspopup="listbox"
                    className={`mt-2 flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left outline-none transition-all duration-300 ${
                      showAgentPicker
                        ? 'border-cyan-400 bg-slate-950 text-white shadow-[0_0_35px_rgba(34,211,238,0.25)] ring-4 ring-cyan-400/10'
                        : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.10)]'
                    } disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                          showAgentPicker
                            ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300'
                            : 'border-slate-200 bg-slate-50 text-[#071936]'
                        }`}
                      >
                        {linkedAgentSlug ? (
                          <LockKeyhole className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </span>

                      <span className="min-w-0">
                        <span
                          className={`block truncate text-sm font-bold ${
                            showAgentPicker
                              ? 'text-white'
                              : ''
                          }`}
                        >
                          {selectedAgent
                            ? selectedAgent.fullName
                            : linkedAgentSlug
                              ? 'Linked Agent/Broker'
                              : agentsLoading
                                ? 'Loading Agents and Brokers...'
                                : agents.length === 0
                                  ? 'No Agents or Brokers available'
                                  : 'Select an Agent or Broker'}
                        </span>

                        <span
                          className={`mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            showAgentPicker
                              ? 'text-cyan-200/70'
                              : 'text-slate-400'
                          }`}
                        >
                          {selectedAgent
                            ? selectedAgent.role
                            : linkedAgentSlug
                              ? 'Assigned by shared link'
                              : 'Tap to open agent selection'}
                        </span>
                      </span>
                    </span>

                    {linkedAgentSlug ? (
                      <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                          showAgentPicker
                            ? 'rotate-180 text-cyan-300'
                            : 'text-slate-400'
                        }`}
                      />
                    )}
                  </button>

                  {/* Agent Picker */}
                  {showAgentPicker &&
                    !linkedAgentSlug &&
                    agents.length > 0 && (
                      <div
                        className="absolute left-0 right-0 top-full z-[100] mt-3 origin-top animate-in overflow-hidden rounded-[1.35rem] border border-cyan-300/30 bg-[#020b1d]/95 shadow-[0_25px_80px_rgba(2,11,29,0.45),0_0_45px_rgba(34,211,238,0.12)] backdrop-blur-2xl duration-300"
                        role="listbox"
                        aria-label="Available Agents and Brokers"
                      >
                        <div className="relative overflow-hidden border-b border-cyan-300/15 px-4 py-3">
                          <div className="absolute -right-10 -top-16 h-32 w-32 animate-pulse rounded-full bg-cyan-400/15 blur-2xl" />

                          <div className="absolute -bottom-20 -left-12 h-32 w-32 animate-pulse rounded-full bg-blue-500/15 blur-2xl" />

                          <div className="relative flex items-center gap-2">
                            <Sparkles className="h-4 w-4 animate-pulse text-cyan-300" />

                            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
                              Agent Network
                            </span>

                            <span className="ml-auto text-[10px] font-bold text-white/40">
                              {agents.length} available
                            </span>
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto p-2 [scrollbar-width:thin]">
                          {agents.map((agent) => {
                            const isSelected =
                              selectedAgentSlug ===
                              agent.slug;

                            const isOnline =
                              agent.lastSeen
                                ? Date.now() -
                                    new Date(
                                      agent.lastSeen
                                    ).getTime() <
                                  15 * 60 * 1000
                                : false;

                            return (
                              <button
                                key={agent.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSelectedAgentSlug(
                                    agent.slug
                                  );
                                  setShowAgentPicker(false);
                                }}
                                className={`group/agent relative mb-1 flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left transition-all duration-300 last:mb-0 ${
                                  isSelected
                                    ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_25px_rgba(34,211,238,0.10)]'
                                    : 'border-transparent hover:border-cyan-300/20 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(34,211,238,0.07)]'
                                }`}
                              >
                                <div className="absolute inset-y-0 left-0 w-px bg-cyan-300/0 transition-all duration-300 group-hover/agent:bg-cyan-300/80" />

                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-cyan-200/20 bg-gradient-to-br from-blue-500/20 to-cyan-300/10">
                                  {agent.profileImage ? (
                                    <img
                                      src={
                                        agent.profileImage
                                      }
                                      alt={
                                        agent.fullName
                                      }
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                      onError={(event) => {
                                        event.currentTarget.style.display =
                                          'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm font-black text-cyan-200">
                                      {getInitials(
                                        agent.fullName
                                      )}
                                    </div>
                                  )}

                                  <span
                                    className={`absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#071936] ${
                                      isOnline
                                        ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                                        : 'bg-slate-500'
                                    }`}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-extrabold text-white">
                                    {agent.fullName}
                                  </p>

                                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-200/55">
                                    {agent.role}

                                    <span className="mx-1 text-white/20">
                                      •
                                    </span>

                                    {isOnline
                                      ? 'Online'
                                      : 'Available'}
                                  </p>
                                </div>

                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                                    isSelected
                                      ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-200'
                                      : 'border-white/10 text-white/20 group-hover/agent:border-cyan-300/30 group-hover/agent:text-cyan-200'
                                  }`}
                                >
                                  {isSelected ? (
                                    <Sparkles className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Linked Agent Notice */}
                  {linkedAgentSlug && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#071936]">
                      <LockKeyhole className="h-3.5 w-3.5" />
                      This shared link is locked to the assigned
                      Agent/Broker.
                    </p>
                  )}

                  {/* Assigned Property Agent */}
                  {!linkedAgentSlug &&
                    property.agent &&
                    selectedAgentSlug ===
                      property.agent.slug && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        This property already has{' '}
                        {property.agent.fullName} assigned,
                        but you can choose another available
                        Agent or Broker.
                      </p>
                    )}

                  {/* Direct Client */}
                  {!linkedAgentSlug &&
                    !property.agent &&
                    !agentsLoading &&
                    agents.length > 0 && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Direct Client: choose the Agent or
                        Broker you want to handle this inquiry.
                      </p>
                    )}

                  {agentsError && (
                    <p
                      role="alert"
                      className="mt-1.5 text-xs text-red-600"
                    >
                      {agentsError}
                    </p>
                  )}

                  {!agentsLoading &&
                    agents.length === 0 &&
                    !agentsError && (
                      <p className="mt-1.5 text-xs text-red-600">
                        No active Agent or Broker accounts are
                        currently available.
                      </p>
                    )}
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor={`inquiry-name-${property.id}`}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Full Name
                  </label>

                  <input
                    id={`inquiry-name-${property.id}`}
                    required
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    value={inquiryForm.name}
                    onChange={(event) =>
                      setInquiryForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Enter your full name"
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor={`inquiry-email-${property.id}`}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Email Address
                  </label>

                  <input
                    id={`inquiry-email-${property.id}`}
                    required
                    type="email"
                    autoComplete="email"
                    maxLength={150}
                    value={inquiryForm.email}
                    onChange={(event) =>
                      setInquiryForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor={`inquiry-phone-${property.id}`}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Contact Number
                  </label>

                  <input
                    id={`inquiry-phone-${property.id}`}
                    required
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    value={inquiryForm.phone}
                    onChange={(event) =>
                      setInquiryForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="09XXXXXXXXX"
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                  />
                </div>

                {/* Viewing Date */}
                {isSiteViewing && (
                  <div>
                    <label
                      htmlFor={`preferredViewingDate-${property.id}`}
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Preferred Site Viewing Date
                    </label>

                    <div className="relative mt-2">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c9a96e]" />

                      <input
                        id={`preferredViewingDate-${property.id}`}
                        required
                        type="date"
                        min={minViewingDate}
                        value={
                          inquiryForm.preferredViewingDate
                        }
                        onChange={(event) =>
                          setInquiryForm((current) => ({
                            ...current,
                            preferredViewingDate:
                              event.target.value,
                          }))
                        }
                        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                      />
                    </div>
                  </div>
                )}

                {/* Message */}
                {!isSiteViewing && (
                  <div>
                    <label
                      htmlFor={`inquiry-message-${property.id}`}
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Message
                    </label>

                    <textarea
                      id={`inquiry-message-${property.id}`}
                      required
                      rows={4}
                      maxLength={2000}
                      value={inquiryForm.message}
                      onChange={(event) =>
                        setInquiryForm((current) => ({
                          ...current,
                          message: event.target.value,
                        }))
                      }
                      placeholder="I'm interested in this property..."
                      className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none transition focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                    />

                    <p className="mt-1 text-right text-[10px] text-slate-400">
                      {inquiryForm.message.length}/2000
                    </p>
                  </div>
                )}

                {/* Error */}
                {inquiryError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {inquiryError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    inquirySubmitting ||
                    agentsLoading ||
                    agents.length === 0
                  }
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inquirySubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {isSiteViewing
                        ? 'Request Site Viewing'
                        : 'Submit Inquiry'}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* IMAGE GALLERY                                                          */}
      {/* ====================================================================== */}

      {showGallery && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-3 sm:p-5"
          onClick={closeGallery}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${property.title} photo gallery`}
            className="relative w-full max-w-6xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeGallery}
              aria-label="Close gallery"
              className="absolute right-0 top-[-3.2rem] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#c9a96e]"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Main Image */}
            <div className="relative h-[60vh] overflow-hidden rounded-2xl bg-black sm:h-[70vh]">
              {propertyImages.length > 0 && (
                <img
                  src={
                    propertyImages[
                      Math.min(
                        selectedImage,
                        propertyImages.length - 1
                      )
                    ]
                  }
                  alt={`${property.title} - Photo ${
                    selectedImage + 1
                  }`}
                  className="h-full w-full object-contain"
                  onError={(event) => {
                    event.currentTarget.style.opacity =
                      '0.2';
                  }}
                />
              )}

              {/* Previous / Next */}
              {propertyImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-black"
                  >
                    <ChevronLeft />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-black"
                  >
                    <ChevronRight />
                  </button>
                </>
              )}

              {/* Counter */}
              {propertyImages.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white">
                  {selectedImage + 1} /{' '}
                  {propertyImages.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {propertyImages.length > 1 && (
              <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-2">
                {propertyImages.map(
                  (image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() =>
                        setSelectedImage(index)
                      }
                      aria-label={`View photo ${
                        index + 1
                      }`}
                      aria-current={
                        selectedImage === index
                          ? 'true'
                          : undefined
                      }
                      className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg transition ${
                        selectedImage === index
                          ? 'ring-2 ring-[#c9a96e]'
                          : 'opacity-55 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${
                          index + 1
                        }`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.opacity =
                            '0.2';
                        }}
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* CONTACT AGENT                                                          */}
      {/* ====================================================================== */}

      {showContact && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={closeContact}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`contact-title-${property.id}`}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] bg-white shadow-2xl"
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeContact}
              aria-label="Close contact panel"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#c9a96e]"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="bg-[#071936] px-6 py-7 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ead9b8]">
                BREA 88 REALTY
              </p>

              <h2
                id={`contact-title-${property.id}`}
                className="mt-2 text-2xl font-black"
              >
                Contact Agent
              </h2>

              <p className="mt-2 text-sm text-white/65">
                Get in touch about this property.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              {property.agent ? (
                <>
                  {/* Agent Profile */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Registered Property Contact
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      {property.agent.fullName}
                    </h3>

                    {property.agent.role && (
                      <p className="text-sm font-semibold text-[#071936]">
                        {property.agent.role}
                      </p>
                    )}
                  </div>

                  {/* Contact Methods */}
                  <div className="mt-4 space-y-2">
                    {property.agent.phone && (
                      <a
                        href={`tel:${property.agent.phone}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-[#c9a96e] hover:bg-[#faf7ef]"
                      >
                        <Phone className="h-5 w-5 text-[#071936]" />

                        <span className="text-sm font-bold">
                          {property.agent.phone}
                        </span>
                      </a>
                    )}

                    {property.agent.email && (
                      <a
                        href={`mailto:${property.agent.email}?subject=${encodeURIComponent(
                          `Inquiry about ${property.title}`
                        )}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-[#c9a96e] hover:bg-[#faf7ef]"
                      >
                        <Mail className="h-5 w-5 text-[#071936]" />

                        <span className="truncate text-sm font-bold">
                          {property.agent.email}
                        </span>
                      </a>
                    )}

                    {isSafeExternalUrl(
                      property.agent.messenger
                    ) && (
                      <a
                        href={
                          property.agent.messenger as string
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-[#c9a96e] hover:bg-[#faf7ef]"
                      >
                        <MessageCircle className="h-5 w-5 text-[#071936]" />

                        <span className="text-sm font-bold">
                          Message Agent
                        </span>
                      </a>
                    )}

                    {isSafeExternalUrl(
                      property.agent.facebook
                    ) && (
                      <a
                        href={
                          property.agent.facebook as string
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-[#c9a96e] hover:bg-[#faf7ef]"
                      >
                        <MessageCircle className="h-5 w-5 text-[#071936]" />

                        <span className="text-sm font-bold">
                          Facebook
                        </span>
                      </a>
                    )}
                  </div>

                  {/* Inquiry */}
                  <button
                    type="button"
                    onClick={() =>
                      openInquiry(
                        defaultInquiryMessage
                      )
                    }
                    className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
                  >
                    <Send className="h-4 w-4" />
                    Send an Inquiry
                  </button>
                </>
              ) : (
                /* No Agent */
                <div className="py-5 text-center">
                  <Phone className="mx-auto h-7 w-7 text-slate-400" />

                  <h3 className="mt-4 text-lg font-black">
                    Contact BREA 88 Realty
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This property has no registered contact
                    profile attached. Our team can assist you
                    with this listing.
                  </p>

                  <a
                    href="mailto:brea88realty@gmail.com"
                    className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#071936] text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    <Mail className="h-5 w-5" />
                    Contact BREA 88 Realty
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}