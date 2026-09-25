'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createPortal } from 'react-dom';
import PropertyShareButton from '@/components/PropertyShareButton';
import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Landmark,
  Loader2,
  MapPin,
  Maximize,
  MessageCircle,
  Mail,
  Phone,
  Play,
  Send,
  UserRound,
  Video,
  X,
  ChevronDown,
} from 'lucide-react';

interface PropertyUnitImage {
  id: number;
  url: string;
  sortOrder: number;
}

interface PropertyUnit {
  id: number;
  propertyId: number;
  unitType: string;
  unitName?: string | null;
  price: string;
  lotArea?: number | null;
  floorArea?: number | null;
  description?: string | null;
  images?: PropertyUnitImage[];
}

interface Property {
  id: number;
  title: string;
  tag: string;
  price: string;
  perMonth?: string | null;
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

  units?: PropertyUnit[];

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

interface Property {
  id: number;
  title: string;
  tag: string;
  price: string;
  perMonth?: string | null;
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
  autoOpen?: boolean;
}

type ModalType =
  | 'details'
  | 'inquiry'
  | 'viewing'
  | null;

interface InquiryForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredViewingDate: string;
}

/*
 * Portal component.
 *
 * This renders modal content directly inside document.body
 * instead of inside the PropertyCard container.
 *
 * This prevents parent overflow-hidden, transforms, stacking
 * contexts, and z-index values from clipping the modal.
 */
function Portal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
}

function isSafeHttpUrl(value?: string | null) {
  if (!value) {
    return false;
  }

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
  if (!value || !isSafeHttpUrl(value)) {
    return false;
  }

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

function getVideoEmbedUrl(
  value?: string | null,
) {
  if (!value || !isSafeHttpUrl(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (
      hostname === 'youtube.com' ||
      hostname === 'www.youtube.com' ||
      hostname === 'm.youtube.com'
    ) {
      if (url.pathname === '/watch') {
        const videoId =
          url.searchParams.get('v');

        if (videoId) {
          return `https://www.youtube.com/embed/${encodeURIComponent(
            videoId,
          )}`;
        }
      }

      if (
        url.pathname.startsWith('/shorts/')
      ) {
        const videoId =
          url.pathname.split('/')[2];

        if (videoId) {
          return `https://www.youtube.com/embed/${encodeURIComponent(
            videoId,
          )}`;
        }
      }

      if (
        url.pathname.startsWith('/embed/')
      ) {
        return value;
      }

      if (
        url.pathname.startsWith('/live/')
      ) {
        const videoId =
          url.pathname.split('/')[2];

        if (videoId) {
          return `https://www.youtube.com/embed/${encodeURIComponent(
            videoId,
          )}`;
        }
      }
    }

    if (hostname === 'youtu.be') {
      const videoId =
        url.pathname.replace('/', '');

      if (videoId) {
        return `https://www.youtube.com/embed/${encodeURIComponent(
          videoId,
        )}`;
      }
    }

    if (
      hostname === 'vimeo.com' ||
      hostname === 'www.vimeo.com'
    ) {
      const parts = url.pathname
        .split('/')
        .filter(Boolean);

      const videoId = parts[0];

      if (
        videoId &&
        /^\d+$/.test(videoId)
      ) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    if (hostname === 'player.vimeo.com') {
      if (
        url.pathname.startsWith('/video/')
      ) {
        return value;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function formatPrice(value?: string | null) {
  if (!value) {
    return 'Price on request';
  }

  const trimmed = String(value).trim();

  const numericValue = trimmed
    .replace(/₱/g, '')
    .replace(/,/g, '')
    .trim();

  if (
    /^\d+(?:\.\d+)?$/.test(
      numericValue,
    )
  ) {
    const amount = Number(numericValue);

    if (Number.isFinite(amount)) {
      return `₱${amount.toLocaleString(
        'en-PH',
        {
          maximumFractionDigits: 0,
        },
      )}`;
    }
  }

  return trimmed;
}

/*
 * Per Month is allowed ONLY for:
 * - House & Lot
 * - Condominiums
 * - For Sale
 *
 * Per Month is hidden for:
 * - For Rent
 * - Brokerage
 */
function shouldShowPerMonth(
  category?: string | null,
  propertyType?: string | null,
): boolean {
  const normalizedCategory = String(category ?? '')
    .trim()
    .toLowerCase();

  const normalizedPropertyType = String(propertyType ?? '')
    .trim()
    .toLowerCase();

  // Never show for Rent or Brokerage
  if (
    normalizedCategory === 'for rent' ||
    normalizedCategory === 'brokerage' ||
    normalizedPropertyType.includes('for rent') ||
    normalizedPropertyType.includes('brokerage')
  ) {
    return false;
  }

  // House & Lot
  if (
    normalizedCategory === 'house & lot' ||
    normalizedPropertyType.includes('house & lot')
  ) {
    return true;
  }

  // Condominium
  if (
    normalizedCategory === 'condominiums' ||
    normalizedCategory === 'condominium' ||
    normalizedPropertyType.includes('condominium')
  ) {
    return true;
  }

  // For Sale
  if (
    normalizedCategory === 'for sale' ||
    normalizedPropertyType === 'for sale'
  ) {
    return true;
  }

  return false;
}

function formatPerMonth(
  value?: string | number | null,
): string {
  if (value === null || value === undefined) {
    return '';
  }

  const raw = String(value).trim();

  if (!raw) {
    return '';
  }

  const numericValue = raw.replace(/[^\d.]/g, '');

  if (!numericValue) {
    return '';
  }

  const amount = Number(numericValue);

  if (!Number.isFinite(amount)) {
    return '';
  }

  return `₱${amount.toLocaleString('en-US')}`;
}

function formatDateMin() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return 'U';
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${
    words[words.length - 1][0]
  }`.toUpperCase();
}

export default function PropertyCard({
  property,
  agentSlug,
  autoOpen = false,
}: PropertyCardProps) {
  const [modal, setModal] =
    useState<ModalType>(null);

  /*
   * This is the single source of truth for
   * whether Per Month should appear in the UI.
   */
  const showPerMonth =
  shouldShowPerMonth(
    property.category,
    property.propertyType,
  ) &&
  Boolean(property.perMonth?.trim());

const perMonth = showPerMonth
  ? formatPerMonth(property.perMonth)
  : '';
  

const [propertyUnits, setPropertyUnits] = useState<PropertyUnit[]>([]);
const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
const [loadingUnits, setLoadingUnits] = useState(false);

const [selectedUnitImageIndex, setSelectedUnitImageIndex] = useState(0);
const [unitGalleryPreviewOpen, setUnitGalleryPreviewOpen] = useState(false);
const [expandedUnitId, setExpandedUnitId] = useState<string | number | null>(null);

  const [
    selectedImageIndex,
    setSelectedImageIndex,
  ] = useState(0);

  const [
    galleryPreviewOpen,
    setGalleryPreviewOpen,
  ] = useState(false);

  const [
    availableAgents,
    setAvailableAgents,
  ] = useState<AvailableAgent[]>([]);

  const [
    selectedAgentSlug,
    setSelectedAgentSlug,
  ] = useState('');

  const [
    loadingAgents,
    setLoadingAgents,
  ] = useState(false);

  const [
    agentDropdownOpen,
    setAgentDropdownOpen,
  ] = useState(false);

  const agentSelectorRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [submitting, setSubmitting] =
    useState(false);

    const [descriptionExpanded, setDescriptionExpanded] =
  useState(false);

  const [
    submitSuccess,
    setSubmitSuccess,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState('');

  const [
    inquiryForm,
    setInquiryForm,
  ] = useState<InquiryForm>({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredViewingDate: '',
  });

  const [isAgent, setIsAgent] =
    useState(false);




  const galleryImages = useMemo(() => {
    const images = [
      property.image,
      ...(property.images || []),
    ].filter(Boolean);

    return Array.from(
      new Set(images),
    );
  }, [
    property.image,
    property.images,
  ]);

  const currentImage =
    galleryImages[selectedImageIndex] ||
    property.image;

  const selectedUnit = useMemo(() => {
    if (!propertyUnits.length) {
      return null;
    }

    if (selectedUnitId !== null) {
      const matchedUnit = propertyUnits.find(
        (unit) => unit.id === selectedUnitId
      );

      if (matchedUnit) {
        return matchedUnit;
      }
    }

    return propertyUnits[0];
  }, [propertyUnits, selectedUnitId]);

  const selectedUnitImages = useMemo(() => {
    if (!selectedUnit) {
      return [];
    }

    const images = (selectedUnit.images || [])
      .map((image) => image.url)
      .filter(Boolean);

    return Array.from(new Set(images));
  }, [selectedUnit]);

  const currentUnitImage =
    selectedUnitImages[selectedUnitImageIndex] ||
    selectedUnitImages[0] ||
    '';

  const videoUrl =
    property.videoUrl?.trim() || '';

  const videoEmbedUrl =
    getVideoEmbedUrl(videoUrl);

  const hasDirectVideo =
    isDirectVideoUrl(videoUrl);

  const hasEmbeddedVideo =
    Boolean(videoEmbedUrl);

  const hasVideo =
    hasDirectVideo ||
    hasEmbeddedVideo;

  const selectedAgent =
    availableAgents.find(
      (agent) =>
        agent.slug ===
        selectedAgentSlug,
    ) || null;

  const isAgentLocked =
    Boolean(agentSlug?.trim());


  useEffect(() => {
    if (agentSlug?.trim()) {
      setSelectedAgentSlug(
        agentSlug.trim(),
      );
    }
  }, [agentSlug]);

  /*
   * Lock page scrolling whenever
   * modal/gallery is open.
   */
    useEffect(() => {
      if (
        !modal &&
        !galleryPreviewOpen &&
        !unitGalleryPreviewOpen
      ) {
        return;
      }

      const previousOverflow = document.body.style.overflow;

      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }, [
      modal,
      galleryPreviewOpen,
      unitGalleryPreviewOpen,
    ]);

  /*
   * Close Agent dropdown when clicking outside.
   */
  useEffect(() => {
    if (!agentDropdownOpen) {
      return;
    }

    function handleClickOutside(
      event: MouseEvent,
    ) {
      if (
        agentSelectorRef.current &&
        !agentSelectorRef.current.contains(
          event.target as Node,
        )
      ) {
        setAgentDropdownOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
    };
  }, [agentDropdownOpen]);

  /*
   * Keyboard controls.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (unitGalleryPreviewOpen) {
        if (event.key === 'Escape') {
          closeUnitGalleryPreview();
          return;
        }

        if (event.key === 'ArrowLeft') {
          previousUnitImage();
          return;
        }

        if (event.key === 'ArrowRight') {
          nextUnitImage();
          return;
        }

        return;
      }

      if (unitGalleryPreviewOpen) {
        if (event.key === 'Escape') {
          closeUnitGalleryPreview();
          return;
        }

        if (event.key === 'ArrowLeft') {
          previousUnitImage();
          return;
        }

        if (event.key === 'ArrowRight') {
          nextUnitImage();
          return;
        }

        return;
      }

      if (modal) {
        if (event.key === 'Escape') {
          closeModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    unitGalleryPreviewOpen,
    galleryPreviewOpen,
    modal,
    selectedUnitImages.length,
    galleryImages.length,
  ]);

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

      const data =
        await response.json();

      const agents =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.agents)
            ? data.agents
            : [];

      setAvailableAgents(agents);

      if (agentSlug?.trim()) {
        const matchedAgent =
          agents.find(
            (
              agent: AvailableAgent,
            ) =>
              agent.slug ===
              agentSlug.trim(),
          );

        if (matchedAgent) {
          setSelectedAgentSlug(
            matchedAgent.slug,
          );
        }
      }
    } catch {
      setAvailableAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }

  function openDetails() {
  setSelectedImageIndex(0);
  setDescriptionExpanded(false);
  setSubmitSuccess(false);
  setSubmitError('');
  setAgentDropdownOpen(false);
  setModal('details');

  void loadAgents();
  void loadUnits();
  }

  const loadUnits = async () => {
  setLoadingUnits(true);

  try {
    const response = await fetch(
      `/api/properties/${property.id}/units`,
      {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(
        'Failed to load property units.'
      );
    }

    const data = await response.json();

    const fetchedUnits: PropertyUnit[] =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.units)
          ? data.units
          : [];

    console.log(
      '[PropertyCard] ===== UNIT DEBUG ====='
    );

    console.log(
      '[PropertyCard] Number of units:',
      fetchedUnits.length
    );

    fetchedUnits.forEach((unit, index) => {
      console.log(
        `[PropertyCard] UNIT ${index + 1}:`,
        {
          id: unit.id,
          unitType: unit.unitType,
          unitName: unit.unitName,
          price: unit.price,
          lotArea: unit.lotArea,
          floorArea: unit.floorArea,
          description: unit.description,
          images: unit.images,
        }
      );

      console.log(
        `[PropertyCard] UNIT ${index + 1} IMAGE URLS:`,
        (unit.images ?? []).map(
          (image) => image.url
        )
      );
    });

    console.log(
      '[PropertyCard] FULL UNIT DATA:',
      JSON.stringify(
        fetchedUnits,
        null,
        2
      )
    );

    console.log(
      '[PropertyCard] ======================='
    );

    setPropertyUnits(fetchedUnits);

    if (fetchedUnits.length > 0) {
      setSelectedUnitId((currentId) => {
        const stillExists = fetchedUnits.some(
          (unit) => unit.id === currentId
        );

        return stillExists
          ? currentId
          : fetchedUnits[0].id;
      });
    } else {
      setSelectedUnitId(null);
    }

    setSelectedUnitImageIndex(0);
  } catch (error) {
    console.error(
      'Failed to load property units:',
      error
    );

    setPropertyUnits([]);
    setSelectedUnitId(null);
  } finally {
    setLoadingUnits(false);
  }
};

useEffect(() => {
  if (!autoOpen) {
    return;
  }

  const timer = window.setTimeout(() => {
    console.log(
      '[PropertyCard] Auto-opening property:',
      property.id,
      property.title,
    );

    setSelectedImageIndex(0);
    setDescriptionExpanded(false);
    setSubmitSuccess(false);
    setSubmitError('');
    setAgentDropdownOpen(false);

    // Open the existing details modal
    setModal('details');

    // Load agents without blocking the modal
    void loadAgents();
    void loadUnits();
  }, 500);

  return () => {
    window.clearTimeout(timer);
  };
}, [autoOpen, property.id, property.title]);


  function openInquiry() {
    setSubmitSuccess(false);
    setSubmitError('');

    if (agentSlug?.trim()) {
      setSelectedAgentSlug(
        agentSlug.trim(),
      );
    }

    setAgentDropdownOpen(false);
    setModal('inquiry');
    loadAgents();
  }

  function openViewing() {
    setSubmitSuccess(false);
    setSubmitError('');

    if (agentSlug?.trim()) {
      setSelectedAgentSlug(
        agentSlug.trim(),
      );
    }

    setAgentDropdownOpen(false);
    setModal('viewing');
    loadAgents();
  }

  function closeModal() {
    setModal(null);
    setSubmitSuccess(false);
    setSubmitError('');
    setAgentDropdownOpen(false);
    setUnitGalleryPreviewOpen(false);
  }

  function openGalleryPreview(
    index: number,
  ) {
    setSelectedImageIndex(index);
    setGalleryPreviewOpen(true);
  }

  function closeGalleryPreview() {
    setGalleryPreviewOpen(false);
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

  function nextImage(
    event?: React.MouseEvent,
  ) {
    event?.stopPropagation();

    if (galleryImages.length <= 1) {
      return;
    }

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

    if (galleryImages.length <= 1) {
      return;
    }

    setSelectedImageIndex(
      (current) =>
        (current -
          1 +
          galleryImages.length) %
        galleryImages.length,
    );
  }

  function nextUnitImage(event?: React.MouseEvent) {
    event?.stopPropagation();

    if (selectedUnitImages.length <= 1) {
      return;
    }

    setSelectedUnitImageIndex((current) =>
      current >= selectedUnitImages.length - 1
        ? 0
        : current + 1
    );
  }

  function previousUnitImage(event?: React.MouseEvent) {
    event?.stopPropagation();

    if (selectedUnitImages.length <= 1) {
      return;
    }

    setSelectedUnitImageIndex((current) =>
      current <= 0
        ? selectedUnitImages.length - 1
        : current - 1
    );
  }

  function openUnitGalleryPreview(index: number) {
    setSelectedUnitImageIndex(index);
    setUnitGalleryPreviewOpen(true);
  }

  function closeUnitGalleryPreview() {
    setUnitGalleryPreviewOpen(false);
  }

  function selectUnit(unitId: number) {
    setSelectedUnitId(unitId);
    setSelectedUnitImageIndex(0);
  }

  async function submitInquiry(
    event: React.FormEvent<HTMLFormElement>,
    type: 'inquiry' | 'viewing',
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

    if (!inquiryForm.message.trim()) {
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
      const message =
        inquiryForm.message.trim();

      const response = await fetch(
        '/api/inquiries',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name:
              inquiryForm.name.trim(),
            email:
              inquiryForm.email.trim(),
            phone:
              inquiryForm.phone.trim(),
            agentSlug:
              selectedAgentSlug,
            propertyId:
              property.id,
            preferredViewingDate:
              type === 'viewing'
                ? inquiryForm.preferredViewingDate
                : '',
            message,
          }),
        },
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Failed to submit inquiry.',
        );
      }

      setSubmitSuccess(true);

      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        preferredViewingDate: '',
        message: '',
      });
    } catch (error) {
      console.error(
        'Inquiry submission error:',
        error,
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to submit inquiry.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function checkAgent() {
      try {
        const response =
          await fetch('/api/agent/me', {
            credentials: 'include',
            cache: 'no-store',
          });

        if (!response.ok) {
          if (mounted) {
            setIsAgent(false);
          }

          return;
        }

        const data =
          await response.json();

        if (mounted) {
          setIsAgent(
            data?.success === true &&
              data?.agent?.isActive ===
                true &&
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
      <div
        ref={agentSelectorRef}
        className="relative"
      >
        <label
          htmlFor="selected-agent"
          className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
        >
          Choose Agent or Broker
          <span className="ml-1 text-red-500">
            *
          </span>
        </label>

        {loadingAgents ? (
          <div className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#c9a96e]" />

            <span className="text-sm font-medium text-slate-500">
              Loading Agents and Brokers...
            </span>
          </div>
        ) : availableAgents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <UserRound
                size={23}
                strokeWidth={1.7}
              />
            </div>

            <p className="text-sm font-semibold text-slate-700">
              No Agents or Brokers available
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please try again later.
            </p>
          </div>
        ) : (
          <>
            <button
              id="selected-agent"
              type="button"
              disabled={isAgentLocked}
              onClick={(event) => {
                event.stopPropagation();

                if (isAgentLocked) {
                  return;
                }

                setAgentDropdownOpen(
                  (current) => !current,
                );
              }}
              aria-expanded={
                isAgentLocked
                  ? false
                  : agentDropdownOpen
              }
              aria-haspopup="listbox"
              className={`group flex min-h-[58px] w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 sm:min-h-[68px] sm:gap-4 sm:px-5 sm:py-3 ${
                isAgentLocked
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50 shadow-sm'
                  : agentDropdownOpen
                    ? 'border-[#c9a96e] bg-white shadow-[0_12px_35px_rgba(15,23,42,0.10)] ring-4 ring-[#c9a96e]/10'
                    : 'border-slate-200 bg-white shadow-sm hover:border-[#d8c08e] hover:shadow-md'
              }`}
            >
              <div
                className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border sm:h-12 sm:w-12 ${
                  selectedAgent
                    ? 'border-[#c9a96e]/40'
                    : 'border-slate-200 bg-slate-100'
                }`}
              >
                {selectedAgent?.profileImage ? (
                  <>
                    <img
                      src={
                        selectedAgent.profileImage
                      }
                      alt={
                        selectedAgent.fullName
                      }
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none';

                        const fallback =
                          event.currentTarget
                            .nextElementSibling;

                        if (
                          fallback instanceof
                          HTMLElement
                        ) {
                          fallback.style.display =
                            'flex';
                        }
                      }}
                    />

                    <div className="hidden h-full w-full items-center justify-center bg-[#faf7ef] text-[#a8864f]">
                      <span className="text-xs font-black sm:text-sm">
                        {getInitials(
                          selectedAgent.fullName,
                        )}
                      </span>
                    </div>
                  </>
                ) : selectedAgent ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#faf7ef] text-[#a8864f]">
                    <span className="text-xs font-black sm:text-sm">
                      {getInitials(
                        selectedAgent.fullName,
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <UserRound
                      size={18}
                      strokeWidth={1.7}
                    />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                {selectedAgent ? (
                  <>
                    <p className="truncate text-xs font-bold text-slate-800 sm:text-[15px]">
                      {selectedAgent.fullName}
                    </p>

                    <span className="mt-1 inline-flex max-w-full truncate rounded-full bg-[#faf7ef] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#a8864f] sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.1em]">
                      {selectedAgent.role}
                    </span>
                  </>
                ) : (
                  <>
                    <p className="truncate text-xs font-semibold text-slate-600 sm:text-sm">
                      Select an Agent or Broker
                    </p>

                    <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-xs">
                      Choose who you would like to contact
                    </p>
                  </>
                )}
              </div>

              <ChevronRight
                size={18}
                className={`shrink-0 text-slate-400 transition-all duration-200 sm:h-5 sm:w-5 ${
                  agentDropdownOpen
                    ? 'rotate-[-90deg] text-[#a8864f]'
                    : 'rotate-90 group-hover:text-slate-600'
                }`}
              />
            </button>

            {agentDropdownOpen &&
              !isAgentLocked && (
                <div
                  className="absolute left-0 right-0 z-[80] mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
                  role="listbox"
                  aria-label="Available Agents and Brokers"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">
                          Available Agents &
                          Brokers
                        </p>

                        <p className="mt-1 text-[11px] leading-4 text-slate-400">
                          Select a professional
                          to handle your
                          inquiry
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-400 shadow-sm">
                        {
                          availableAgents.length
                        }{' '}
                        Available
                      </span>
                    </div>
                  </div>

                  <div className="max-h-[390px] overflow-y-auto p-3 sm:p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {availableAgents.map(
                        (agent) => {
                          const isSelected =
                            selectedAgentSlug ===
                            agent.slug;

                          return (
                            <button
                              key={agent.id}
                              type="button"
                              role="option"
                              aria-selected={
                                isSelected
                              }
                              onClick={(event) => {
                                event.stopPropagation();

                                setSelectedAgentSlug(
                                  agent.slug,
                                );

                                setAgentDropdownOpen(
                                  false,
                                );
                              }}
                              className={`group relative flex min-h-[92px] w-full items-center gap-3 overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.98] sm:p-4 ${
                                isSelected
                                  ? 'border-[#c9a96e] bg-[#faf7ef] shadow-[0_8px_25px_rgba(201,169,110,0.16)] ring-2 ring-[#c9a96e]/10'
                                  : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#d8c08e] hover:bg-slate-50 hover:shadow-[0_10px_25px_rgba(15,23,42,0.07)]'
                              }`}
                            >
                              <div
                                className={`absolute bottom-0 left-0 top-0 w-1 transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-[#c9a96e]'
                                    : 'bg-transparent group-hover:bg-[#e4d2aa]'
                                }`}
                              />

                              <div
                                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border ${
                                  isSelected
                                    ? 'border-[#c9a96e]/40 shadow-sm'
                                    : 'border-slate-200'
                                }`}
                              >
                                {agent.profileImage ? (
                                  <>
                                    <img
                                      src={
                                        agent.profileImage
                                      }
                                      alt={
                                        agent.fullName
                                      }
                                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      onError={(
                                        event,
                                      ) => {
                                        event.currentTarget.style.display =
                                          'none';

                                        const fallback =
                                          event
                                            .currentTarget
                                            .nextElementSibling;

                                        if (
                                          fallback instanceof
                                          HTMLElement
                                        ) {
                                          fallback.style.display =
                                            'flex';
                                        }
                                      }}
                                    />

                                    <div className="hidden h-full w-full items-center justify-center bg-[#faf7ef] text-[#a8864f]">
                                      <span className="text-sm font-black">
                                        {getInitials(
                                          agent.fullName,
                                        )}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div
                                    className={`flex h-full w-full items-center justify-center ${
                                      isSelected
                                        ? 'bg-[#c9a96e] text-white'
                                        : 'bg-slate-100 text-slate-400 group-hover:bg-[#faf7ef] group-hover:text-[#a8864f]'
                                    }`}
                                  >
                                    <span className="text-sm font-black">
                                      {getInitials(
                                        agent.fullName,
                                      )}
                                    </span>
                                  </div>
                                )}

                                <span
                                  className={`absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                                    agent.lastSeen
                                      ? 'bg-emerald-500'
                                      : 'bg-slate-300'
                                  }`}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p
                                  className={`truncate text-sm font-bold ${
                                    isSelected
                                      ? 'text-slate-900'
                                      : 'text-slate-700 group-hover:text-slate-900'
                                  }`}
                                >
                                  {
                                    agent.fullName
                                  }
                                </p>

                                <div className="mt-1.5 flex min-w-0 items-center gap-2">
                                  <span
                                    className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${
                                      isSelected
                                        ? 'bg-white text-[#a8864f] shadow-sm'
                                        : 'bg-slate-100 text-slate-500 group-hover:bg-[#faf7ef] group-hover:text-[#a8864f]'
                                    }`}
                                  >
                                    {
                                      agent.role
                                    }
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                  isSelected
                                    ? 'border-[#c9a96e] bg-[#c9a96e] text-white shadow-sm'
                                    : 'border-slate-300 bg-white text-transparent group-hover:border-[#c9a96e]'
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle2
                                    size={15}
                                    strokeWidth={3}
                                  />
                                )}
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              )}
          </>
        )}

        <input
          name="selectedAgentSlug"
          type="text"
          value={selectedAgentSlug}
          onChange={() => {}}
          required
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      </div>
    );
  }

  function renderRequestForm(
    type: 'inquiry' | 'viewing',
  ) {
    const title =
      type === 'viewing'
        ? 'Request Site Viewing'
        : 'Property Inquiry';

    const description =
      type === 'viewing'
        ? 'Choose your preferred Agent or Broker and viewing date.'
        : 'Send your property inquiry to your chosen Agent or Broker.';

    return (
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="pr-4">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#c9a96e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9c7a3d]">
              {type === 'viewing' ? (
                <CalendarDays size={13} />
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
                <CheckCircle2 size={34} />
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
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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

              <div>
                <label
                  htmlFor="inquiry-message"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                >
                  Write a message
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  id="inquiry-message"
                  name="message"
                  value={inquiryForm.message}
                  onChange={(event) =>
                    updateForm(
                      'message',
                      event.target.value,
                    )
                  }
                  required
                  rows={6}
                  placeholder="Write your message here..."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                />

                <div className="mt-1.5">
                  <span className="text-[10px] text-slate-400">
                    {inquiryForm.message.length.toLocaleString()}{' '}
                    characters
                  </span>
                </div>
              </div>

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

    if (
      hasEmbeddedVideo &&
      videoEmbedUrl
    ) {
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
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeModal();
          }
        }}
      >
        <div
          className="relative z-[100000] flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[94vh] sm:max-w-6xl sm:rounded-[30px]"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close property details"
            className="absolute right-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75 sm:right-5 sm:top-5"
          >
            <X size={20} />
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="relative z-0 h-[280px] w-full shrink-0 bg-slate-950 sm:h-[380px] lg:h-[420px]">
              <img
                src={currentImage}
                alt={property.title}
                className="h-full w-full object-cover"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-md transition active:scale-95 hover:bg-black/70 sm:left-4"
                  >
                    <ChevronLeft size={21} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-md transition active:scale-95 hover:bg-black/70 sm:right-4"
                  >
                    <ChevronRight size={21} />
                  </button>
                </>
              )}

              {/* Property Tag */}
              <div className="absolute left-5 top-5 z-20 sm:left-7 sm:top-7">
                <span className="inline-flex rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg backdrop-blur-md">
                  {property.tag}
                </span>
              </div>

              {/* Image Indicators */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-5 right-5 hidden gap-1.5 sm:flex">
                  {galleryImages.slice(0, 6).map((_, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`View image ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        selectedImageIndex === index
                          ? 'w-7 bg-white'
                          : 'w-2 bg-white/45'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="w-full min-w-0 bg-white">
              <div className="space-y-8 p-5 sm:p-7 lg:p-9">
                {/* PROPERTY SUMMARY */}
                <div>
                  <div className="flex w-full items-center justify-between gap-3">
                    {/* Tags */}
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
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

                    {/* Share */}
                    <div className="ml-auto shrink-0">
                      <PropertyShareButton
                        propertyId={property.id}
                        agentSlug={agentSlug}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    {formatPrice(
                      property.price,
                    )}
                  </p>

                  {showPerMonth &&
                    perMonth && (
                      <p className="mt-1 text-sm font-semibold text-[#a47d3c] sm:text-base">
                        {perMonth}

                        <span className="ml-1 font-medium text-slate-400">
                          / month
                        </span>
                      </p>
                    )}

                  <h1 className="mt-1 text-xl font-bold text-slate-800 sm:text-2xl">
                    {property.title}
                  </h1>

                  <div className="mt-2 flex items-start gap-1.5 text-sm leading-6 text-slate-500">
                    <MapPin
                      size={16}
                      className="mt-1 shrink-0 text-[#b08b4f]"
                    />

                    <span>
                      {property.location}
                    </span>
                  </div>

                  {(property.beds != null ||
                    property.baths != null ||
                    property.sqft != null ||
                    property.lotArea != null) && (
                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:flex sm:items-center sm:gap-5">
                      {property.beds != null && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <BedDouble
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

                          <span className="font-bold text-slate-700">
                            {property.beds}
                          </span>

                          <span className="text-slate-400">
                            Beds
                          </span>
                        </span>
                      )}

                      {property.baths != null && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Bath
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

                          <span className="font-bold text-slate-700">
                            {property.baths}
                          </span>

                          <span className="text-slate-400">
                            Baths
                          </span>
                        </span>
                      )}

                      {property.sqft != null && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Maximize
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

                          <span className="font-bold text-slate-700">
                            {Number(
                              property.sqft,
                            ).toFixed(2)}
                          </span>

                          <span className="text-slate-400">
                            Floor Area
                          </span>
                        </span>
                      )}

                      {property.lotArea != null && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Maximize
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

                          <span className="font-bold text-slate-700">
                            {Number(
                              property.lotArea,
                            ).toFixed(2)}
                          </span>

                          <span className="text-slate-400">
                            Lot Area
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {propertyUnits.length > 0 && (
                <section>
                  <SectionTitle
                    icon={<Building2 size={17} />}
                    title="Unit Types"
                  />

                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {propertyUnits.map((unit) => {
                        const isExpanded = expandedUnitId === unit.id;

                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => {
                              setExpandedUnitId(
                                isExpanded ? null : unit.id
                              );

                              if (!isExpanded) {
                                setSelectedUnitId(unit.id);
                                setSelectedUnitImageIndex(0);
                              }
                            }}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                              isExpanded
                                ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            

                            <span>
                              {unit.unitType?.trim() ||
                                unit.unitName}
                            </span>

                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${
                                isExpanded
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 space-y-4">
                      {propertyUnits.map((unit) => {
                        const isExpanded =
                          expandedUnitId === unit.id;

                        if (!isExpanded) {
                          return null;
                        }

                        const unitImages = [
                          ...(unit.images ?? []),
                        ]
                          .sort(
                            (a, b) =>
                              a.sortOrder - b.sortOrder
                          )
                          .filter(
                            (image) =>
                              typeof image.url === 'string' &&
                              image.url.trim() !== ''
                          );

                        const displayName =
                          unit.unitName?.trim() ||
                          unit.unitType;

                        return (
                          <div
                            key={unit.id}
                            className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg shadow-slate-900/5"
                          >
                            {/* UNIT HEADER */}
                            <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-4 sm:px-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-700 shadow-sm">
                                    <Building2 size={12} />

                                    {unit.unitType}
                                  </div>

                                  <h3 className="break-words text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">
                                    {displayName}
                                  </h3>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                    Price
                                  </p>

                                  <p className="mt-0.5 text-base font-extrabold text-blue-700 sm:text-lg">
                                    ₱
                                    {Number(
                                      unit.price || 0
                                    ).toLocaleString(
                                      'en-PH'
                                    )}
                                  </p>
                                </div>
                              </div>

                              {unit.description && (
                                <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                                  {unit.description}
                                </p>
                              )}
                            </div>
                            {/* UNIT SPECIFICATIONS */}
                            {(unit.lotArea != null ||
                              unit.floorArea != null) && (
                              <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-5">
                                <div className="grid grid-cols-2 gap-2">
                                  {unit.lotArea != null && (
                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                        Lot Area
                                      </p>

                                      <p className="mt-1 text-sm font-extrabold text-slate-800">
                                        {Number(
                                          unit.lotArea
                                        ).toLocaleString(
                                          'en-PH'
                                        )}{' '}
                                        sqm
                                      </p>
                                    </div>
                                  )}

                                  {unit.floorArea != null && (
                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                        Floor Area
                                      </p>

                                      <p className="mt-1 text-sm font-extrabold text-slate-800">
                                        {Number(
                                          unit.floorArea
                                        ).toLocaleString(
                                          'en-PH'
                                        )}{' '}
                                        sqm
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {/* UNIT PHOTOS */}
                            {unitImages.length > 0 ? (
                              <div className="p-3 sm:p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ImageIcon
                                      size={16}
                                      className="text-blue-600"
                                    />

                                    <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                                      Unit Photos
                                    </span>
                                  </div>

                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                                    {unitImages.length}{' '}
                                    {unitImages.length === 1
                                      ? 'Photo'
                                      : 'Photos'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  {unitImages.map(
                                    (image, index) => (
                                      <button
                                        key={`${unit.id}-${image.id}-${index}`}
                                        type="button"
                                        onClick={() => {
                                          setSelectedUnitId(
                                            unit.id
                                          );
                                          setSelectedUnitImageIndex(
                                            index
                                          );
                                          openUnitGalleryPreview(
                                            index
                                          );
                                        }}
                                        className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 text-left"
                                      >
                                        <img
                                          src={image.url}
                                          alt={`${displayName} - Unit Photo ${
                                            index + 1
                                          }`}
                                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                          loading="lazy"
                                          onError={(event) => {
                                            event.currentTarget.style.display =
                                              'none';
                                          }}
                                        />

                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                                        <div className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[9px] font-bold text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                                          View
                                        </div>
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="px-4 py-6 text-center sm:px-5">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                  <ImageIcon size={18} />
                                </div>

                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                  No unit photos available.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}
                {/* QUICK ACTIONS */}
                <section>
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
                    <div className="mb-3 px-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Interested in this property?
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Connect with an Agent or
                        Broker for more information.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openInquiry();
                        }}
                        className="brea88-mobile-premium group relative flex min-h-[62px] items-center justify-center gap-2.5 rounded-[18px] px-5 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-transform duration-150 active:scale-[0.97]"
                      >
                        <span className="brea88-mobile-glow pointer-events-none absolute -inset-2 -z-10 rounded-[22px] bg-[#c9a96e]/20 blur-lg" />

                        <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                          <MessageCircle size={17} />
                        </span>

                        <span className="relative z-10">
                          Send Property Inquiry
                        </span>

                        <ChevronRight
                          size={15}
                          className="relative z-10 text-[#d9bd82]"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openViewing();
                        }}
                        className="brea88-mobile-premium brea88-mobile-premium-light group relative flex min-h-[62px] items-center justify-center gap-2.5 rounded-[18px] px-5 py-4 text-sm font-bold text-slate-700 shadow-[0_8px_25px_rgba(15,23,42,0.07)] transition-transform duration-150 active:scale-[0.97]"
                      >
                        <span className="brea88-mobile-glow pointer-events-none absolute -inset-2 -z-10 rounded-[22px] bg-[#c9a96e]/15 blur-lg" />

                        <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#c9a96e]/10 text-[#a47d3c]">
                          <CalendarDays size={17} />
                        </span>

                        <span className="relative z-10">
                          Request Site Viewing
                        </span>

                        <ChevronRight
                          size={15}
                          className="relative z-10 text-[#a47d3c]"
                        />
                      </button>
                    </div>
                  </div>
                </section>



                {/* PROPERTY DETAILS */}
                <section>
                  <SectionTitle
                    icon={<Building2 size={17} />}
                    title="Property Details"
                  />

                  <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
                    <DetailRow
                      label="Category"
                      value={property.category}
                    />

                    <DetailRow
                      label="Property Type"
                      value={property.propertyType}
                    />

                    <DetailRow
                      label="House Type"
                      value={property.houseType}
                    />

                    <DetailRow
                      label="Storey"
                      value={property.storey}
                    />
                  </div>
                </section>
                  {/* DEVELOPER */}
                  {property.developer && (
                    <section>
                      <SectionTitle
                        icon={
                          <Building2 size={17} />
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
                          <FileText size={17} />
                        }
                        title="Description"
                      />

                      <div className="relative mt-4">
                        <div
                          className={`property-description overflow-hidden text-sm leading-7 text-slate-600 transition-[max-height] duration-500 ease-in-out ${
                            descriptionExpanded
                              ? 'max-h-[2000px]'
                              : 'max-h-[180px]'
                          }`}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html:
                                property.description
                                  .replace(
                                    /&nbsp;/g,
                                    ' ',
                                  )
                                  .replace(
                                    /&amp;/g,
                                    '&',
                                  )
                                  .replace(
                                    /&quot;/g,
                                    '"',
                                  )
                                  .replace(
                                    /&#39;/g,
                                    "'",
                                  ),
                            }}
                          />
                        </div>

                        {!descriptionExpanded && (
                          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent" />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setDescriptionExpanded(
                            (current) => !current,
                          )
                        }
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#a47d3c] transition-colors duration-200 hover:text-[#8f6a31]"
                      >
                        {descriptionExpanded
                          ? 'See Less'
                          : 'See More'}

                        <ChevronRight
                          size={15}
                          className={`transition-transform duration-300 ${
                            descriptionExpanded
                              ? '-rotate-90'
                              : 'rotate-90'
                          }`}
                        />
                      </button>
                    </section>
                  )}

                  {/* BANK FINANCING */}
                  {(property.totalcp ||
                    property.bankFinancing
                      ?.length) && (
                  <section>
                    <SectionTitle
                      icon={<Landmark size={17} />}
                      title="Bank Financing"
                    />

                    <div className="mt-4 space-y-4">
                      {property.totalcp && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Total Contract Price
                          </span>

                          <span className="text-right text-sm font-bold text-slate-800">
                            {formatPrice(property.totalcp)}
                          </span>
                        </div>
                      )}

                      {property.bankFinancing?.length ? (
                        <div>
                          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Accepted Financing
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {property.bankFinancing.map(
                              (financing, index) => (
                                <span
                                  key={`${financing}-${index}`}
                                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-100"
                                >
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                    <CheckCircle2
                                      size={13}
                                      className="text-emerald-600"
                                    />
                                  </span>

                                  <span>{financing}</span>
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                  )}

                  {/* PROPERTY VIDEO */}
                  <section>
                    <SectionTitle
                      icon={<Video size={17} />}
                      title="Property Video"
                    />

                    <div className="mt-4">
                      {renderVideo()}
                    </div>
                  </section>

                  {/* PROPERTY GALLERY */}
                  {galleryImages.length > 0 && (
                    <section>
                      <SectionTitle
                        icon={
                          <ImageIcon size={17} />
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
                                openGalleryPreview(
                                  index,
                                )
                              }
                              aria-label={`Open image ${
                                index + 1
                              } in fullscreen`}
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

                  <div className="h-1" />
                </div>
              </div>
            </div>
          </div>

          {/* FULLSCREEN GALLERY PREVIEW */}
          {galleryPreviewOpen && (
            <div
              className="fixed inset-0 z-[200000] flex items-center justify-center bg-black/95 p-3 sm:p-6"
              onMouseDown={(event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  closeGalleryPreview();
                }
              }}
            >
              <button
                type="button"
                onClick={closeGalleryPreview}
                aria-label="Close image preview"
                className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 sm:right-6 sm:top-6"
              >
                <X size={22} />
              </button>

              <div className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                {selectedImageIndex + 1} /{' '}
                {galleryImages.length}
              </div>

              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 sm:left-6 sm:h-12 sm:w-12"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              <div className="flex h-full w-full items-center justify-center">
                <img
                  src={currentImage}
                  alt={`${property.title} ${
                    selectedImageIndex + 1
                  }`}
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  className="max-h-[90vh] max-w-[94vw] select-none object-contain sm:max-h-[88vh] sm:max-w-[90vw]"
                />
              </div>

              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md sm:right-6 sm:h-12 sm:w-12"
                >
                  <ChevronRight size={24} />
                </button>
              )}

              {galleryImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl bg-black/45 p-2 backdrop-blur-md">
                  {galleryImages.map(
                    (image, index) => (
                      <button
                        key={`${image}-preview-${index}`}
                        type="button"
                        onClick={() =>
                          setSelectedImageIndex(
                            index,
                          )
                        }
                        aria-label={`View image ${
                          index + 1
                        }`}
                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-16 ${
                          selectedImageIndex ===
                          index
                            ? 'border-[#c9a96e] opacity-100'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
            
          )}
          {unitGalleryPreviewOpen &&
            selectedUnit &&
            selectedUnitImages.length > 0 && (
              <div
                className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/95 p-3 sm:p-6"
                onClick={closeUnitGalleryPreview}
              >
                {/* CLOSE */}
                <button
                  type="button"
                  onClick={closeUnitGalleryPreview}
                  className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                  aria-label="Close unit gallery"
                >
                  <X size={21} />
                </button>

                {/* UNIT LABEL */}
                <div className="absolute left-4 top-4 z-20 max-w-[70%] sm:left-6 sm:top-6">
                  <div className="rounded-2xl bg-black/40 px-4 py-3 backdrop-blur-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                      Unit Photos
                    </p>

                    <p className="mt-1 text-sm font-bold text-white">
                      {selectedUnit.unitName ||
                        selectedUnit.unitType}
                    </p>
                  </div>
                </div>

                {/* IMAGE */}
                <div
                  className="relative flex h-full w-full items-center justify-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  <img
                    src={currentUnitImage}
                    alt={
                      selectedUnit.unitName ||
                      selectedUnit.unitType
                    }
                    className="max-h-[88vh] max-w-[94vw] rounded-xl object-contain shadow-2xl"
                  />

                  {selectedUnitImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={previousUnitImage}
                        className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 sm:left-4"
                        aria-label="Previous unit photo"
                      >
                        <ChevronLeft size={23} />
                      </button>

                      <button
                        type="button"
                        onClick={nextUnitImage}
                        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 sm:right-4"
                        aria-label="Next unit photo"
                      >
                        <ChevronRight size={23} />
                      </button>
                    </>
                  )}

                  {/* COUNTER */}
                  {selectedUnitImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                      {selectedUnitImageIndex + 1} /{' '}
                      {selectedUnitImages.length}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      );
    }

  return (
    <>
      {/* COMPACT PROPERTY CARD */}
      <article
        onClick={() => openDetails()}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();
            openDetails();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${property.title}`}
        className="group flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm outline-none transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/10 focus-visible:ring-4 focus-visible:ring-[#c9a96e]/20 active:scale-[0.99]"
      >
        <div className="relative h-56 w-full shrink-0 overflow-hidden bg-slate-100 sm:h-64">
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

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <p className="text-xl font-black tracking-tight text-slate-900">
            {formatPrice(property.price)}
          </p>

          {showPerMonth &&
            perMonth && (
              <p className="mt-0.5 text-xs font-semibold text-[#a47d3c] sm:text-sm">
                {perMonth}

                <span className="ml-1 font-medium text-slate-400">
                  / month
                </span>
              </p>
            )}

          <h3 className="mt-1.5 line-clamp-2 min-h-[44px] text-sm font-bold leading-5 text-slate-800">
            {property.title}
          </h3>

          <div className="mt-2.5 flex min-w-0 items-start gap-1.5 text-xs leading-5 text-slate-500">
            <MapPin
              size={14}
              className="mt-0.5 shrink-0 text-[#b08b4f]"
            />

            <span className="line-clamp-2 min-w-0">
              {property.location}
            </span>
          </div>

          {(property.beds != null ||
            property.baths != null ||
            property.sqft != null) && (
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3.5 text-[11px] font-semibold text-slate-500">
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

                  {Number(
                    property.sqft,
                  ).toFixed(2)}

                  <span className="hidden sm:inline">
                    sqft
                  </span>
                </span>
              )}
            </div>
          )}

          {isAgent &&
            property.developer && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Developer
                </p>

                <p className="mt-1.5 text-sm font-bold text-slate-800">
                  {property.developer}
                </p>
              </div>
            )}
        </div>
      </article>

      {modal === 'details' && (
        <Portal>
          {renderDetailsModal()}
        </Portal>
      )}

      {(modal === 'inquiry' ||
        modal === 'viewing') && (
        <Portal>
          <div
            className="fixed inset-0 z-[120000] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            {renderRequestForm(modal)}
          </div>
        </Portal>
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
  if (!value) {
    return null;
  }

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