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

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

function parseVideoUrl(
  value?: string | null,
): VideoType {
  if (!value || !isSafeHttpUrl(value)) {
    return null;
  }

  try {
    const url = new URL(value);

    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    /*
     * YouTube
     */
    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com'
    ) {
      let videoId = '';

      if (pathname === '/watch') {
        videoId =
          url.searchParams.get('v') || '';
      } else if (pathname.startsWith('/shorts/')) {
        videoId =
          pathname
            .split('/shorts/')[1]
            ?.split('/')[0] || '';
      } else if (pathname.startsWith('/embed/')) {
        videoId =
          pathname
            .split('/embed/')[1]
            ?.split('/')[0] || '';
      } else if (pathname.startsWith('/live/')) {
        videoId =
          pathname
            .split('/live/')[1]
            ?.split('/')[0] || '';
      }

      if (videoId) {
        return {
          type: 'youtube',
          src: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    /*
     * YouTube short URL
     */
    if (host === 'youtu.be') {
      const videoId = pathname
        .replace(/^\/+/, '')
        .split('/')[0];

      if (videoId) {
        return {
          type: 'youtube',
          src: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    /*
     * Vimeo
     */
    if (
      host === 'vimeo.com' ||
      host === 'www.vimeo.com' ||
      host === 'player.vimeo.com'
    ) {
      let videoId = '';

      if (host === 'player.vimeo.com') {
        const match =
          pathname.match(/\/video\/(\d+)/);

        videoId = match?.[1] || '';
      } else {
        const match =
          pathname.match(/\/(\d+)/);

        videoId = match?.[1] || '';
      }

      if (videoId) {
        return {
          type: 'vimeo',
          src: `https://player.vimeo.com/video/${videoId}`,
        };
      }
    }

    /*
     * Direct video files
     */
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

function getTodayDate(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(
    2,
    '0',
  );
  const day = `${date.getDate()}`.padStart(
    2,
    '0',
  );

  return `${year}-${month}-${day}`;
}

function isAgentOnline(
  lastSeen?: string | null,
): boolean {
  if (!lastSeen) return false;

  const timestamp = new Date(
    lastSeen,
  ).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return (
    Date.now() - timestamp <=
    15 * 60 * 1000
  );
}

function getRoleLabel(
  role?: string | null,
): string {
  if (!role) return 'Agent';

  const normalized = role.toLowerCase();

  if (normalized === 'broker') {
    return 'Broker';
  }

  if (normalized === 'agent') {
    return 'Agent';
  }

  return role;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-bold leading-5 text-[#071936]">
        {value}
      </p>
    </div>
  );
}

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
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/10"
      />
    </div>
  );
}

export default function PropertyCard({
  property,
  agentSlug,
}: PropertyCardProps) {
  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [showModal, setShowModal] =
    useState(false);

  const [showGallery, setShowGallery] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState(0);

  const [showContact, setShowContact] =
    useState(false);

  const [showInquiry, setShowInquiry] =
    useState(false);

  const [isSiteViewing, setIsSiteViewing] =
    useState(false);

  const [availableAgents, setAvailableAgents] =
    useState<AvailableAgent[]>([]);

  const [loadingAgents, setLoadingAgents] =
    useState(false);

  const [inquirySubmitting, setInquirySubmitting] =
    useState(false);

  const [inquirySuccess, setInquirySuccess] =
    useState(false);

  const [inquiryError, setInquiryError] =
    useState('');

  const [inquiryForm, setInquiryForm] =
    useState<InquiryForm>({
      name: '',
      email: '',
      phone: '',
      message: '',
      preferredViewingDate: '',
    });

  /*
   * ============================================================
   * PROPERTY IMAGES
   * ============================================================
   */

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
          images.length <
            MAX_GALLERY_IMAGES
        ) {
          images.push(image);
        }
      });
    }

    return images;
  }, [
    property.image,
    property.images,
  ]);

  /*
   * ============================================================
   * FINANCING
   * ============================================================
   */

  const financingOptions = useMemo(() => {
    if (
      !Array.isArray(
        property.bankFinancing,
      )
    ) {
      return [];
    }

    return property.bankFinancing.filter(
      Boolean,
    );
  }, [property.bankFinancing]);

  /*
   * ============================================================
   * VIDEO
   * ============================================================
   */

  const parsedVideo = useMemo(
    () =>
      parseVideoUrl(
        property.videoUrl,
      ),
    [property.videoUrl],
  );

  /*
   * ============================================================
   * AGENT
   * ============================================================
   */

  const loadAgents = useCallback(
    async () => {
      if (availableAgents.length > 0) {
        return;
      }

      setLoadingAgents(true);

      try {
        const response = await fetch(
          '/api/agents',
          {
            method: 'GET',
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        const agents: AvailableAgent[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.agents)
              ? data.agents
              : [];

        setAvailableAgents(agents);
      } catch {
        // Property agent remains available
        // as fallback.
      } finally {
        setLoadingAgents(false);
      }
    },
    [availableAgents.length],
  );

  const selectedAgent = useMemo(() => {
    /*
     * Explicit agentSlug takes priority.
     */
    if (agentSlug) {
      const matchingAgent =
        availableAgents.find(
          (agent) =>
            agent.slug === agentSlug,
        );

      if (matchingAgent) {
        return {
          id: matchingAgent.id,
          fullName:
            matchingAgent.fullName,
          email:
            property.agent?.email || '',
          phone:
            property.agent?.phone ||
            null,
          role: matchingAgent.role,
          messenger:
            property.agent?.messenger ||
            null,
          facebook:
            property.agent?.facebook ||
            null,
          slug: matchingAgent.slug,
          profileImage:
            matchingAgent.profileImage ||
            null,
          lastSeen:
            matchingAgent.lastSeen ||
            null,
        };
      }
    }

    /*
     * Property assigned agent.
     */
    if (property.agent) {
      const matchingAgent =
        availableAgents.find(
          (agent) =>
            agent.id ===
            property.agent?.id,
        );

      return {
        id: property.agent.id,
        fullName:
          property.agent.fullName,
        email:
          property.agent.email,
        phone:
          property.agent.phone || null,
        role:
          property.agent.role ||
          matchingAgent?.role ||
          'Agent',
        messenger:
          property.agent.messenger ||
          null,
        facebook:
          property.agent.facebook ||
          null,
        slug:
          property.agent.slug ||
          matchingAgent?.slug ||
          '',
        profileImage:
          matchingAgent?.profileImage ||
          null,
        lastSeen:
          matchingAgent?.lastSeen ||
          null,
      };
    }

    /*
     * First available representative.
     */
    const firstAgent =
      availableAgents[0];

    if (firstAgent) {
      return {
        id: firstAgent.id,
        fullName:
          firstAgent.fullName,
        email: '',
        phone: null,
        role: firstAgent.role,
        messenger: null,
        facebook: null,
        slug: firstAgent.slug,
        profileImage:
          firstAgent.profileImage ||
          null,
        lastSeen:
          firstAgent.lastSeen ||
          null,
      };
    }

    return null;
  }, [
    agentSlug,
    availableAgents,
    property.agent,
  ]);

  const selectedAgentSlug = useMemo(
    () =>
      selectedAgent?.slug ||
      agentSlug ||
      '',
    [
      agentSlug,
      selectedAgent,
    ],
  );

  const selectedAgentOnline = useMemo(
    () =>
      isAgentOnline(
        selectedAgent?.lastSeen,
      ),
    [selectedAgent?.lastSeen],
  );

  /*
   * ============================================================
   * MODAL BODY LOCK
   * ============================================================
   */

  useEffect(() => {
    const isOverlayOpen =
      showModal ||
      showGallery ||
      showContact ||
      showInquiry;

    if (!isOverlayOpen) {
      document.body.style.overflow = '';
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    showModal,
    showGallery,
    showContact,
    showInquiry,
  ]);

  /*
   * ============================================================
   * ESCAPE KEY
   * ============================================================
   */

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (showGallery) {
        setShowGallery(false);
        return;
      }

      if (showContact) {
        setShowContact(false);
        return;
      }

      if (showInquiry) {
        if (!inquirySubmitting) {
          setShowInquiry(false);
        }

        return;
      }

      if (showModal) {
        setShowModal(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [
    inquirySubmitting,
    showContact,
    showGallery,
    showInquiry,
    showModal,
  ]);

  /*
   * ============================================================
   * OPEN / CLOSE PROPERTY MODAL
   * ============================================================
   */

  const openPropertyModal = () => {
    setShowModal(true);
    void loadAgents();
  };

  const closePropertyModal = () => {
    setShowModal(false);
  };

  /*
   * ============================================================
   * GALLERY
   * ============================================================
   */

  const openGallery = (
    index = 0,
  ) => {
    setSelectedImage(index);
    setShowGallery(true);
  };

  const closeGallery = () => {
    setShowGallery(false);
  };

  const previousImage = () => {
    if (propertyImages.length <= 1) {
      return;
    }

    setSelectedImage(
      (current) =>
        current === 0
          ? propertyImages.length - 1
          : current - 1,
    );
  };

  const nextImage = () => {
    if (propertyImages.length <= 1) {
      return;
    }

    setSelectedImage(
      (current) =>
        current ===
        propertyImages.length - 1
          ? 0
          : current + 1,
    );
  };

  /*
   * ============================================================
   * CONTACT
   * ============================================================
   */

  const openContact = () => {
    setShowContact(true);
    void loadAgents();
  };

  const closeContact = () => {
    setShowContact(false);
  };

  /*
   * ============================================================
   * INQUIRY
   * ============================================================
   */

  const openInquiry = (
    siteViewing = false,
  ) => {
    setIsSiteViewing(
      siteViewing,
    );

    setInquirySuccess(false);
    setInquiryError('');
    setShowInquiry(true);

    void loadAgents();
  };

  const closeInquiry = () => {
    if (inquirySubmitting) {
      return;
    }

    setShowInquiry(false);
    setInquiryError('');
  };

  const updateInquiryField = (
    field: keyof InquiryForm,
    value: string,
  ) => {
    setInquiryForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  };

  /*
   * ============================================================
   * SUBMIT INQUIRY
   * ============================================================
   */

  const submitInquiry = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (inquirySubmitting) {
      return;
    }

    setInquiryError('');
    setInquirySuccess(false);

    if (!inquiryForm.name.trim()) {
      setInquiryError(
        'Please enter your name.',
      );
      return;
    }

    if (!inquiryForm.email.trim()) {
      setInquiryError(
        'Please enter your email.',
      );
      return;
    }

    if (!inquiryForm.phone.trim()) {
      setInquiryError(
        'Please enter your phone number.',
      );
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
      setInquiryError(
        'Please enter your message.',
      );
      return;
    }

    setInquirySubmitting(true);

    try {
      const response = await fetch(
        '/api/inquiries',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            propertyId:
              property.id,

            name:
              inquiryForm.name.trim(),

            email:
              inquiryForm.email.trim(),

            phone:
              inquiryForm.phone.trim(),

            message: isSiteViewing
              ? `Site viewing request for "${property.title}". Preferred viewing date: ${inquiryForm.preferredViewingDate}.`
              : inquiryForm.message.trim(),

            preferredViewingDate:
              isSiteViewing
                ? inquiryForm.preferredViewingDate
                : undefined,

            agentSlug:
              selectedAgentSlug,
          }),
        },
      );

      const data =
        await response
          .json()
          .catch(() => null);

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
        preferredViewingDate:
          '',
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

  /*
   * ============================================================
   * COMPACT PROPERTY CARD
   * ============================================================
   */

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        aria-label={`View details for ${property.title}`}
        onClick={openPropertyModal}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();
            openPropertyModal();
          }
        }}
        className="group w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.13)] focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/60"
      >
        {/* CARD IMAGE */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 sm:h-52">
          {property.image ? (
            <img
              src={property.image}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <Building2 size={42} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

          {/* TAG */}
          {property.tag && (
            <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
              {property.tag}
            </span>
          )}

          {/* IMAGE COUNT */}
          {propertyImages.length > 1 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <Images size={13} />
              {propertyImages.length}
            </div>
          )}

          {/* TITLE */}
          <div className="absolute bottom-4 left-4 right-20">
            <h2 className="line-clamp-2 text-lg font-bold leading-tight text-white">
              {property.title}
            </h2>
          </div>
        </div>

        {/* CARD CONTENT */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-extrabold tracking-tight text-[#071936]">
                {property.price ||
                  'Price upon request'}
              </p>

              <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                <MapPin
                  size={16}
                  className="mt-0.5 shrink-0 text-[#c9a96e]"
                />

                <span className="line-clamp-2">
                  {property.location}
                </span>
              </div>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#071936]/5 text-[#071936] transition group-hover:bg-[#071936] group-hover:text-white">
              <Sparkles size={15} />
            </div>
          </div>

          {/* QUICK STATS */}
          {(property.beds != null ||
            property.baths != null ||
            property.sqft != null) && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
              {property.beds != null && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <BedDouble
                    size={16}
                    className="text-[#c9a96e]"
                  />
                  <span className="font-semibold">
                    {property.beds}
                  </span>
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
                  <span className="font-semibold">
                    {property.baths}
                  </span>
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
                  <span className="font-semibold">
                    {property.sqft}
                  </span>
                  <span className="text-slate-400">
                    sqm
                  </span>
                </div>
              )}
            </div>
          )}

          {/* DEVELOPER */}
          {property.developer && (
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Landmark
                  size={14}
                  className="text-[#c9a96e]"
                />

                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Developer
                </span>
              </div>

              <p className="mt-1 truncate text-sm font-bold text-[#071936]">
                {property.developer}
              </p>
            </div>
          )}

          {/* VIEW DETAILS */}
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#071936] transition group-hover:text-[#9b7b42]">
            <Sparkles size={14} />
            View Property Details
          </div>
        </div>
      </article>

      {/* ============================================================
          PROPERTY DETAILS MODAL
      ============================================================ */}

      {showModal && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-md sm:items-center sm:p-4 lg:p-6"
          onClick={closePropertyModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${property.title} details`}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl"
          >
            {/* MODAL HEADER */}
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-slate-950/75 to-transparent p-4 sm:p-5">
              <div className="flex items-center gap-2">
                {property.tag && (
                  <span className="rounded-full border border-white/20 bg-slate-950/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                    {property.tag}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={closePropertyModal}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/50 text-white backdrop-blur-md transition hover:bg-white hover:text-[#071936]"
                aria-label="Close property details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="overflow-y-auto">
              {/* HERO IMAGE */}
              <div className="relative h-64 w-full bg-slate-100 sm:h-80 lg:h-[390px]">
                {propertyImages[0] ? (
                  <img
                    src={propertyImages[0]}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Building2 size={60} />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 lg:p-9">
                  <p className="text-sm font-semibold text-[#ead9b8]">
                    {property.location}
                  </p>

                  <h1 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                    {property.title}
                  </h1>

                  <p className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
                    {property.price ||
                      'Price upon request'}
                  </p>
                </div>
              </div>

              {/* MAIN DETAILS */}
              <div className="p-5 sm:p-7 lg:p-9">
                <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                  {/* LEFT */}
                  <div className="space-y-8">
                    {/* QUICK STATS */}
                    <section>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {property.beds !=
                          null && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <BedDouble
                              size={19}
                              className="text-[#c9a96e]"
                            />

                            <p className="mt-3 text-lg font-extrabold text-[#071936]">
                              {property.beds}
                            </p>

                            <p className="text-xs text-slate-400">
                              Bedrooms
                            </p>
                          </div>
                        )}

                        {property.baths !=
                          null && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <Bath
                              size={19}
                              className="text-[#c9a96e]"
                            />

                            <p className="mt-3 text-lg font-extrabold text-[#071936]">
                              {property.baths}
                            </p>

                            <p className="text-xs text-slate-400">
                              Bathrooms
                            </p>
                          </div>
                        )}

                        {property.sqft !=
                          null && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <Maximize
                              size={19}
                              className="text-[#c9a96e]"
                            />

                            <p className="mt-3 text-lg font-extrabold text-[#071936]">
                              {property.sqft}
                            </p>

                            <p className="text-xs text-slate-400">
                              sqm
                            </p>
                          </div>
                        )}

                        {property.storey && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <Building2
                              size={19}
                              className="text-[#c9a96e]"
                            />

                            <p className="mt-3 text-lg font-extrabold text-[#071936]">
                              {property.storey}
                            </p>

                            <p className="text-xs text-slate-400">
                              Storey
                            </p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* PROPERTY DETAILS */}
                    <section>
                      <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9a96e]">
                          Property Information
                        </p>

                        <h2 className="mt-1 text-xl font-extrabold text-[#071936]">
                          Details
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {property.category && (
                          <DetailItem
                            label="Category"
                            value={
                              property.category
                            }
                          />
                        )}

                        {property.propertyType && (
                          <DetailItem
                            label="Property Type"
                            value={
                              property.propertyType
                            }
                          />
                        )}

                        {property.houseType && (
                          <DetailItem
                            label="House Type"
                            value={
                              property.houseType
                            }
                          />
                        )}

                        {property.storey && (
                          <DetailItem
                            label="Storey"
                            value={
                              property.storey
                            }
                          />
                        )}

                        {property.totalcp && (
                          <DetailItem
                            label="Total Contract Price"
                            value={
                              property.totalcp
                            }
                          />
                        )}

                        <DetailItem
                          label="Location"
                          value={
                            property.location
                          }
                        />
                      </div>
                    </section>

                    {/* DESCRIPTION */}
                    {property.description && (
                      <section>
                        <div className="mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9a96e]">
                            About the Property
                          </p>

                          <h2 className="mt-1 text-xl font-extrabold text-[#071936]">
                            Description
                          </h2>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                            {
                              property.description
                            }
                          </p>
                        </div>
                      </section>
                    )}

                    {/* DEVELOPER */}
                    {property.developer && (
                      <section>
                        <div className="rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/5 p-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#c9a96e] shadow-sm">
                              <Landmark
                                size={22}
                              />
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b7b42]">
                                Property Developer
                              </p>

                              <p className="mt-1 text-lg font-extrabold text-[#071936]">
                                {
                                  property.developer
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* FINANCING */}
                    {financingOptions.length >
                      0 && (
                      <section>
                        <div className="mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9a96e]">
                            Payment Options
                          </p>

                          <h2 className="mt-1 text-xl font-extrabold text-[#071936]">
                            Bank Financing
                          </h2>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {financingOptions.map(
                            (
                              bank,
                              index,
                            ) => (
                              <div
                                key={`${bank}-${index}`}
                                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#071936]/5 text-[#071936]">
                                  <LockKeyhole
                                    size={16}
                                  />
                                </div>

                                <span className="text-sm font-bold text-[#071936]">
                                  {bank}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </section>
                    )}

                    {/* VIDEO */}
                    {property.videoUrl && (
                      <section>
                        <div className="mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9a96e]">
                            Virtual Tour
                          </p>

                          <h2 className="mt-1 text-xl font-extrabold text-[#071936]">
                            Property Video
                          </h2>
                        </div>

                        <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-lg">
                          {parsedVideo?.type ===
                            'youtube' ||
                          parsedVideo?.type ===
                            'vimeo' ? (
                            <div className="aspect-video">
                              <iframe
                                src={
                                  parsedVideo.src
                                }
                                title={`${property.title} video`}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            </div>
                          ) : parsedVideo?.type ===
                            'direct' ? (
                            <video
                              src={
                                parsedVideo.src
                              }
                              controls
                              playsInline
                              className="aspect-video w-full object-cover"
                            >
                              Your browser does not support
                              video playback.
                            </video>
                          ) : parsedVideo?.type ===
                            'unsupported' ? (
                            <div className="flex flex-col items-center justify-center p-10 text-center">
                              <PlayCircle
                                size={42}
                                className="text-white/40"
                              />

                              <p className="mt-4 text-sm font-bold text-white">
                                Video link
                              </p>

                              <p className="mt-1 text-xs text-white/50">
                                This video format cannot
                                be embedded here.
                              </p>

                              {isSafeHttpUrl(
                                parsedVideo.src,
                              ) && (
                                <a
                                  href={
                                    parsedVideo.src
                                  }
                                  target="_blank"
                                  rel="noreferrer"
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
                    {propertyImages.length >
                      0 && (
                      <section>
                        <div className="mb-4 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9a96e]">
                              Photos
                            </p>

                            <h2 className="mt-1 text-xl font-extrabold text-[#071936]">
                              Property Gallery
                            </h2>
                          </div>

                          <span className="text-xs font-semibold text-slate-400">
                            {
                              propertyImages.length
                            }{' '}
                            photos
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {propertyImages
                            .slice(0, 6)
                            .map(
                              (
                                image,
                                index,
                              ) => (
                                <button
                                  type="button"
                                  key={`${image}-${index}`}
                                  onClick={() =>
                                    openGallery(
                                      index,
                                    )
                                  }
                                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"
                                >
                                  <img
                                    src={
                                      image
                                    }
                                    alt={`${property.title} image ${index + 1}`}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                  />

                                  <div className="absolute inset-0 bg-slate-950/0 transition group-hover:bg-slate-950/20" />

                                  {index ===
                                    5 &&
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
                              ),
                            )}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* RIGHT / REPRESENTATIVE */}
                  <aside className="lg:sticky lg:top-4 lg:h-fit">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
                      <div className="bg-[#071936] p-5 text-white">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ead9b8]">
                          Property Representative
                        </p>

                        <h2 className="mt-1 text-lg font-extrabold">
                          Agent / Broker
                        </h2>
                      </div>

                      <div className="p-5">
                        {loadingAgents &&
                        !selectedAgent ? (
                          <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                            Loading representative...
                          </div>
                        ) : selectedAgent ? (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#071936] text-white">
                                {selectedAgent.profileImage ? (
                                  <img
                                    src={
                                      selectedAgent.profileImage
                                    }
                                    alt={
                                      selectedAgent.fullName
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Users
                                    size={22}
                                  />
                                )}

                                {selectedAgentOnline && (
                                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-extrabold text-[#071936]">
                                  {
                                    selectedAgent.fullName
                                  }
                                </p>

                                <span className="mt-1 inline-flex rounded-full bg-[#c9a96e]/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#80612f]">
                                  {getRoleLabel(
                                    selectedAgent.role,
                                  )}
                                </span>

                                {selectedAgentOnline && (
                                  <p className="mt-1 text-[10px] font-semibold text-emerald-600">
                                    Online now
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-5 space-y-2">
                              {selectedAgent.phone && (
                                <a
                                  href={`tel:${selectedAgent.phone}`}
                                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50"
                                >
                                  <Phone
                                    size={16}
                                    className="text-[#c9a96e]"
                                  />

                                  <span className="text-xs font-semibold text-slate-600">
                                    {
                                      selectedAgent.phone
                                    }
                                  </span>
                                </a>
                              )}

                              {selectedAgent.email && (
                                <a
                                  href={`mailto:${selectedAgent.email}`}
                                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50"
                                >
                                  <Mail
                                    size={16}
                                    className="text-[#c9a96e]"
                                  />

                                  <span className="truncate text-xs font-semibold text-slate-600">
                                    {
                                      selectedAgent.email
                                    }
                                  </span>
                                </a>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="py-6 text-center">
                            <Users
                              size={30}
                              className="mx-auto text-slate-300"
                            />

                            <p className="mt-2 text-sm font-semibold text-slate-500">
                              No representative assigned
                            </p>
                          </div>
                        )}

                        {/* ACTIONS */}
                        <div className="mt-5 space-y-2">
                          <button
                            type="button"
                            onClick={() =>
                              openInquiry(
                                false,
                              )
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#0d2851]"
                          >
                            <Send
                              size={16}
                            />
                            Send Inquiry
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openInquiry(
                                true,
                              )
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#c9a96e] bg-[#c9a96e]/10 px-4 py-3.5 text-sm font-bold text-[#80612f] transition hover:bg-[#c9a96e]/20"
                          >
                            <CalendarDays
                              size={16}
                            />
                            Request Site Viewing
                          </button>

                          <button
                            type="button"
                            onClick={
                              openContact
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-[#071936] transition hover:bg-slate-50"
                          >
                            <MessageCircle
                              size={16}
                            />
                            Contact Agent
                          </button>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          GALLERY MODAL
      ============================================================ */}

      {showGallery && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm"
          onClick={closeGallery}
        >
          <div
            className="relative flex h-full w-full max-w-7xl items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* CLOSE */}
            <button
              type="button"
              onClick={closeGallery}
              className="absolute right-0 top-0 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white hover:text-[#071936]"
              aria-label="Close gallery"
            >
              <X size={20} />
            </button>

            {/* IMAGE */}
            <div className="relative flex max-h-[85vh] max-w-full items-center justify-center">
              {propertyImages[
                selectedImage
              ] && (
                <img
                  src={
                    propertyImages[
                      selectedImage
                    ]
                  }
                  alt={`${property.title} gallery image`}
                  className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
                />
              )}

              {propertyImages.length >
                1 && (
                <>
                  <button
                    type="button"
                    onClick={
                      previousImage
                    }
                    className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white hover:text-[#071936] sm:left-5"
                    aria-label="Previous image"
                  >
                    <ChevronLeft
                      size={23}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white hover:text-[#071936] sm:right-5"
                    aria-label="Next image"
                  >
                    <ChevronRight
                      size={23}
                    />
                  </button>
                </>
              )}
            </div>

            {/* COUNTER */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md">
              {selectedImage + 1} /{' '}
              {propertyImages.length}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CONTACT MODAL
      ============================================================ */}

      {showContact && (
        <div
          className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
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

              <h2 className="mt-2 pr-10 text-xl font-extrabold">
                {selectedAgent?.fullName ||
                  'Property Representative'}
              </h2>

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

                    <p className="mt-1 text-sm font-bold text-[#071936]">
                      {
                        selectedAgent.phone
                      }
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

                    <p className="mt-1 truncate text-sm font-bold text-[#071936]">
                      {
                        selectedAgent.email
                      }
                    </p>
                  </div>
                </a>
              )}

              {selectedAgent?.messenger &&
                isSafeHttpUrl(
                  selectedAgent.messenger,
                ) && (
                  <a
                    href={
                      selectedAgent.messenger
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071936]/5 text-[#071936]">
                      <MessageCircle
                        size={18}
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Messenger
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#071936]">
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
                    href={
                      selectedAgent.facebook
                    }
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

                      <p className="mt-1 text-sm font-bold text-[#071936]">
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
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      Contact details are not
                      available yet.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        closeContact();
                        openInquiry(
                          false,
                        );
                      }}
                      className="mt-5 rounded-xl bg-[#071936] px-5 py-3 text-sm font-bold text-white"
                    >
                      Send an Inquiry
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          INQUIRY MODAL
      ============================================================ */}

      {showInquiry && (
        <div
          className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeInquiry}
        >
          <div
            className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}
            <div className="relative bg-[#071936] px-6 py-7 text-white">
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

              <h2 className="mt-2 pr-10 text-xl font-extrabold">
                {property.title}
              </h2>

              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
                <MapPin size={13} />
                {property.location}
              </p>
            </div>

            {inquirySuccess ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2
                    size={34}
                  />
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-[#071936]">
                  Request Sent
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Thank you. Your request has
                  been submitted successfully. A
                  property representative will get
                  in touch with you.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowInquiry(false);
                    setShowModal(false);
                  }}
                  className="mt-6 rounded-xl bg-[#071936] px-7 py-3 text-sm font-bold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={submitInquiry}
                className="space-y-5 p-6"
              >
                {/* REPRESENTATIVE */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#071936] text-white">
                      <Users size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Sending inquiry to
                      </p>

                      <p className="truncate text-sm font-extrabold text-[#071936]">
                        {selectedAgent?.fullName ||
                          'Property Representative'}
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
                </div>

                {/* NAME */}
                <FormField
                  label="Full Name"
                  value={
                    inquiryForm.name
                  }
                  onChange={(value) =>
                    updateInquiryField(
                      'name',
                      value,
                    )
                  }
                  placeholder="Enter your full name"
                  required
                />

                {/* EMAIL */}
                <FormField
                  label="Email Address"
                  type="email"
                  value={
                    inquiryForm.email
                  }
                  onChange={(value) =>
                    updateInquiryField(
                      'email',
                      value,
                    )
                  }
                  placeholder="you@example.com"
                  required
                />

                {/* PHONE */}
                <FormField
                  label="Phone Number"
                  type="tel"
                  value={
                    inquiryForm.phone
                  }
                  onChange={(value) =>
                    updateInquiryField(
                      'phone',
                      value,
                    )
                  }
                  placeholder="09XX XXX XXXX"
                  required
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
                        min={getTodayDate()}
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
                      value={
                        inquiryForm.message
                      }
                      onChange={(event) =>
                        updateInquiryField(
                          'message',
                          event.target.value,
                        )
                      }
                      placeholder="Tell us what you would like to know about this property..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/10"
                    />
                  </div>
                )}

                {/* SITE VIEWING MESSAGE */}
                {isSiteViewing && (
                  <div className="rounded-2xl border border-[#c9a96e]/25 bg-[#c9a96e]/5 p-4">
                    <div className="flex gap-3">
                      <CalendarDays
                        size={18}
                        className="mt-0.5 shrink-0 text-[#9b7b42]"
                      />

                      <div>
                        <p className="text-sm font-extrabold text-[#071936]">
                          Site Viewing
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Your preferred date will be
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
                  disabled={
                    inquirySubmitting
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071936] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#071936]/10 transition hover:bg-[#0d2851] disabled:cursor-not-allowed disabled:opacity-60"
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
                        <CalendarDays
                          size={17}
                        />
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
                  By submitting this form, you
                  agree to be contacted regarding
                  this property.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}