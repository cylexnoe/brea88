'use client';

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Search,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  CircleArrowLeft,
  Loader2,
  X,
  Building2,
  RotateCcw,
  MessageCircle,
  BedDouble,
  Bath,
  Maximize,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  User,
  Home,
  Layers3,
  Tag,
  Send,
  CheckCircle2,
} from 'lucide-react';

import PropertyCard from '../propertyCard';
import AgentPicker from '../../components/AgentPicker';

/* =========================================================
   AGENT
========================================================= */

interface Agent {
  id: number;
  fullName: string;
  role: string;
  slug: string;
  profileImage?: string | null;
  lastSeen?: string | null;
}

/* =========================================================
   PROPERTY
========================================================= */

interface Property {
  id: number;
  title: string;
  tag: string;

  category?: string | null;
  propertyType?: string | null;
  houseType?: string | null;
  storey?: string | null;

  price: string;
  location: string;

  image: string;
  images?: string[];

  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;

  /*
   * Legacy compatibility only.
   *
   * IMPORTANT:
   * This is NOT used for inquiry routing.
   */
  agent?: Agent | null;
  agentId?: number | null;
}

/* =========================================================
   CLASSIFICATION OPTIONS
========================================================= */

const PROPERTY_CATEGORIES = [
  'All',
  'House & Lot',
  'Condominiums',
  'For Rent',
  'For Sale by Owner',
];

const PROPERTY_TYPES = [
  'Pre-Selling House & Lot',
  'RFO House & Lot',
  'Rent To Own House & Lot',
  'RFO Subdivision House & Lot',
  'Lot Only Subdivision',

  'Pre-Selling Condominium',
  'RFO Condominium',
  'Rent To Own Condominium',
  'CondoTel',

  'Condominiums For Rent',
  'House For Rent',
  'Warehouse For Rent',
  'Commercial Space For Rent',

  'For Sale by Owner',
];

const HOUSE_TYPES = [
  'Townhouse or Row House',
  'Single Attached',
  'Single Detached',
  'Duplex',
];

const STOREY_OPTIONS = [
  '1',
  '2',
  '3',
  '4+',
];

/* =========================================================
   MARKETPLACE
========================================================= */

export default function MarketplacePage() {
  /* =======================================================
     AGENT ROUTING CONTEXT

     Direct:
       /marketplace

     Permanent agent link:
       /marketplace?agent=john-doe

     Browser sends agentSlug only.

     The API resolves:
       agentSlug -> Agent
  ======================================================= */

  const [agentSlug, setAgentSlug] =
    useState('');

  const [selectedAgent, setSelectedAgent] =
    useState<Agent | null>(null);

  const [showAgentPicker, setShowAgentPicker] =
    useState(false);

  /* =======================================================
     READ AGENT FROM URL
  ======================================================= */

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const slug =
      params.get('agent')?.trim() || '';

    setAgentSlug(slug);

    if (slug) {
      setShowAgentPicker(false);
    }
  }, []);

  /* =======================================================
     PROPERTY STATE
  ======================================================= */

  const [properties, setProperties] =
    useState<Property[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     SEARCH / FILTER STATE
  ======================================================= */

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState('All');

  const [selectedPropertyType, setSelectedPropertyType] =
    useState('All');

  const [selectedHouseType, setSelectedHouseType] =
    useState('All');

  const [selectedStorey, setSelectedStorey] =
    useState('All');

  const [maxPrice, setMaxPrice] =
    useState<number>(500000000);

  const [sortBy, setSortBy] =
    useState<
      'default' |
      'price-asc' |
      'price-desc'
    >('default');

  /* =======================================================
     PROPERTY MODAL
  ======================================================= */

  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);

  const [selectedImage, setSelectedImage] =
    useState(0);

  /* =======================================================
     INQUIRY FORM
  ======================================================= */

  const [showInquiryForm, setShowInquiryForm] =
    useState(false);

  const [inquiryName, setInquiryName] =
    useState('');

  const [inquiryEmail, setInquiryEmail] =
    useState('');

  const [inquiryPhone, setInquiryPhone] =
    useState('');

  const [inquiryMessage, setInquiryMessage] =
    useState('');

  const [submittingInquiry, setSubmittingInquiry] =
    useState(false);

  const [inquirySuccess, setInquirySuccess] =
    useState(false);

  const [inquiryError, setInquiryError] =
    useState('');

  /* =======================================================
     FETCH PROPERTIES
  ======================================================= */

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          '/api/properties',
          {
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error(
            'Failed to load properties.'
          );
        }

        const data =
          await response.json();

        setProperties(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          'Failed fetching properties:',
          error
        );

        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  /* =======================================================
     PRICE PARSER
  ======================================================= */

  const parsePrice = (
    price: string
  ): number => {
    return (
      Number(
        String(price).replace(
          /[^0-9.]/g,
          ''
        )
      ) || 0
    );
  };

  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const filteredAndSortedProperties =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      let result =
        properties.filter(
          (property) => {
            const searchableText = [
              property.title,
              property.location,
              property.tag,
              property.category,
              property.propertyType,
              property.houseType,
              property.storey,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            const matchesSearch =
              !query ||
              searchableText.includes(
                query
              );

            const matchesCategory =
              selectedCategory === 'All' ||
              property.category ===
                selectedCategory ||
              (
                !property.category &&
                selectedCategory ===
                  property.tag
              );

            const matchesPropertyType =
              selectedPropertyType ===
                'All' ||
              property.propertyType ===
                selectedPropertyType;

            const matchesHouseType =
              selectedHouseType ===
                'All' ||
              property.houseType ===
                selectedHouseType;

            const matchesStorey =
              selectedStorey ===
                'All' ||
              property.storey ===
                selectedStorey;

            const matchesPrice =
              parsePrice(
                property.price
              ) <= maxPrice;

            return (
              matchesSearch &&
              matchesCategory &&
              matchesPropertyType &&
              matchesHouseType &&
              matchesStorey &&
              matchesPrice
            );
          }
        );

      if (
        sortBy ===
        'price-asc'
      ) {
        result = [
          ...result,
        ].sort(
          (a, b) =>
            parsePrice(a.price) -
            parsePrice(b.price)
        );
      }

      if (
        sortBy ===
        'price-desc'
      ) {
        result = [
          ...result,
        ].sort(
          (a, b) =>
            parsePrice(b.price) -
            parsePrice(a.price)
        );
      }

      return result;
    }, [
      properties,
      searchQuery,
      selectedCategory,
      selectedPropertyType,
      selectedHouseType,
      selectedStorey,
      maxPrice,
      sortBy,
    ]);

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPropertyType('All');
    setSelectedHouseType('All');
    setSelectedStorey('All');
    setMaxPrice(500000000);
    setSortBy('default');
  };

  /* =======================================================
     FORMAT BUDGET
  ======================================================= */

  const formatBudget = (
    price: number
  ) => {
    if (price >= 1000000) {
      return `₱${(
        price / 1000000
      ).toFixed(1)}M`;
    }

    return `₱${(
      price / 1000
    ).toFixed(0)}K`;
  };

  /* =======================================================
     OPEN PROPERTY
  ======================================================= */

  const openProperty = (
    property: Property
  ) => {
    setSelectedProperty(
      property
    );

    setSelectedImage(0);

    setShowInquiryForm(false);

    setShowAgentPicker(false);

    setInquirySuccess(false);

    setInquiryError('');

    /*
     * Permanent URL agent context
     * remains controlled by agentSlug.
     */
    if (agentSlug) {
      setSelectedAgent(null);
    }

    document.body.style.overflow =
      'hidden';
  };

  /* =======================================================
     CLOSE PROPERTY
  ======================================================= */

  const closeProperty = () => {
    if (submittingInquiry) {
      return;
    }

    setSelectedProperty(null);

    setSelectedImage(0);

    setShowInquiryForm(false);

    setShowAgentPicker(false);

    setInquirySuccess(false);

    setInquiryError('');

    document.body.style.overflow =
      'auto';
  };

  /* =======================================================
     PROPERTY IMAGES
  ======================================================= */

  const getPropertyImages = (
    property: Property
  ) => {
    const images = [
      property.image,
      ...(property.images || []),
    ].filter(Boolean);

    return [
      ...new Set(images),
    ];
  };

  /* =======================================================
     NEXT IMAGE
  ======================================================= */

  const nextImage = () => {
    if (!selectedProperty) {
      return;
    }

    const images =
      getPropertyImages(
        selectedProperty
      );

    if (images.length <= 1) {
      return;
    }

    setSelectedImage(
      (current) =>
        (current + 1) %
        images.length
    );
  };

  /* =======================================================
     PREVIOUS IMAGE
  ======================================================= */

  const previousImage = () => {
    if (!selectedProperty) {
      return;
    }

    const images =
      getPropertyImages(
        selectedProperty
      );

    if (images.length <= 1) {
      return;
    }

    setSelectedImage(
      (current) =>
        (current - 1 +
          images.length) %
        images.length
    );
  };

  /* =======================================================
     BODY SCROLL CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      document.body.style.overflow =
        'auto';
    };
  }, []);

  /* =======================================================
     OPEN AGENT PICKER
  ======================================================= */

  const openAgentSelection = () => {
    if (submittingInquiry) {
      return;
    }

    /*
     * Permanent agent link:
     * agent already known.
     */
    if (agentSlug) {
      setShowAgentPicker(false);
      setShowInquiryForm(true);
      setInquirySuccess(false);
      setInquiryError('');

      return;
    }

    /*
     * Direct marketplace:
     * client chooses an agent.
     */
    setShowAgentPicker(true);
    setShowInquiryForm(false);
    setInquirySuccess(false);
    setInquiryError('');
  };

  /* =======================================================
     HANDLE AGENT SELECTION
  ======================================================= */

  const handleAgentSelect = (
    agent: Agent
  ) => {
    setSelectedAgent(agent);

    /*
     * Store slug as routing context.
     *
     * We DO NOT send agentId.
     */
    setAgentSlug(agent.slug);

    setInquiryError('');

    setShowAgentPicker(false);

    setShowInquiryForm(true);

    setInquirySuccess(false);
  };

  /* =======================================================
     CONTINUE AFTER AGENT PICKER
  ======================================================= */

  const continueToInquiry = () => {
    if (!selectedAgent) {
      return;
    }

    setShowAgentPicker(false);

    setShowInquiryForm(true);

    setInquirySuccess(false);

    setInquiryError('');
  };

  /* =======================================================
     CLOSE AGENT PICKER
  ======================================================= */

  const closeAgentPicker = () => {
    if (submittingInquiry) {
      return;
    }

    setShowAgentPicker(false);

    setInquiryError('');
  };

  /* =======================================================
     OPEN INQUIRY FORM
  ======================================================= */

  const openInquiryForm = () => {
    if (agentSlug) {
      setShowAgentPicker(false);
      setShowInquiryForm(true);
      setInquirySuccess(false);
      setInquiryError('');

      return;
    }

    openAgentSelection();
  };

  /* =======================================================
     CLOSE INQUIRY FORM
  ======================================================= */

  const closeInquiryForm = () => {
    if (submittingInquiry) {
      return;
    }

    setShowInquiryForm(false);

    setInquiryError('');
  };

  /* =======================================================
     EFFECTIVE AGENT SLUG
  ======================================================= */

  const effectiveAgentSlug =
    selectedAgent?.slug ||
    agentSlug ||
    '';

  /* =======================================================
     SUBMIT INQUIRY
  ======================================================= */

  const submitInquiry = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedProperty) {
      return;
    }

    setInquiryError('');
    setInquirySuccess(false);

    /*
     * Direct marketplace requires
     * an agent selection.
     */
    if (!effectiveAgentSlug) {
      setShowInquiryForm(false);
      setShowAgentPicker(true);

      setInquiryError(
        'Please choose an Agent or Broker before submitting your inquiry.'
      );

      return;
    }

    setSubmittingInquiry(true);

    try {
      const response = await fetch(
        '/api/inquiries',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name:
              inquiryName.trim(),

            email:
              inquiryEmail.trim(),

            phone:
              inquiryPhone.trim(),

            message:
              inquiryMessage.trim(),

            /*
             * Property is only the
             * property being requested.
             *
             * It is NOT assigned to
             * the selected agent.
             */
            propertyId:
              selectedProperty.id,

            /*
             * Server resolves:
             * slug -> Agent.id
             */
            agentSlug:
              effectiveAgentSlug,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          'Failed to submit inquiry.'
        );
      }

      setInquirySuccess(true);

      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
    } catch (error) {
      console.error(
        'Inquiry submission failed:',
        error
      );

      setInquiryError(
        error instanceof Error
          ? error.message
          : 'Failed to submit inquiry. Please try again.'
      );
    } finally {
      setSubmittingInquiry(false);
    }
  };

  /* =======================================================
     SCHEDULE VIEWING
  ======================================================= */

  const scheduleViewing = () => {
    if (!selectedProperty) {
      return;
    }

    /*
     * Direct marketplace:
     * choose an agent first.
     */
    if (!effectiveAgentSlug) {
      setShowInquiryForm(false);
      setInquiryError('');
      setShowAgentPicker(true);

      return;
    }

    setInquiryMessage(
      `Hello, I am interested in scheduling a viewing for "${selectedProperty.title}" located at ${selectedProperty.location}. Please let me know the available schedule.`
    );

    setInquirySuccess(false);

    setInquiryError('');

    setShowAgentPicker(false);

    setShowInquiryForm(true);
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          HERO
      ====================================================== */}

      <header className="relative overflow-hidden bg-slate-950 text-white">

        <div className="absolute inset-0">

          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/60" />

        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 sm:pb-16 lg:px-8">

          <div className="flex items-center justify-between">

            <a
              href={
                agentSlug
                  ? `/home?agent=${encodeURIComponent(agentSlug)}`
                  : '/home'
              }
              className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 backdrop-blur transition hover:bg-white/10 hover:text-white"
            >

              <CircleArrowLeft className="h-5 w-5 transition group-hover:-translate-x-0.5" />

              <span className="hidden sm:inline">
                Back to Home
              </span>

              <span className="sm:hidden">
                Back
              </span>

            </a>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">

              <Building2 className="h-3.5 w-3.5" />

              BREA 88 Realty

            </div>

          </div>

          <div className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
              Find Your Next Property
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
              Property Marketplace
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Explore verified residential,
              commercial, condominium,
              rental, and investment
              properties in prime locations.
            </p>

            {agentSlug ? (

              <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300">

                <User className="h-3.5 w-3.5" />

                Agent Marketplace

              </div>

            ) : (

              <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-400">

                <User className="h-3.5 w-3.5" />

                Choose an Agent to Assist You

              </div>

            )}

          </div>

          {/* SEARCH */}

          <div className="mx-auto mt-9 max-w-4xl">

            <div className="rounded-2xl border border-white/10 bg-white/10 p-2 shadow-2xl backdrop-blur-xl">

              <div className="relative">

                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  placeholder="Search properties, locations, property types..."
                  className="h-14 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-12 pr-10 text-sm font-medium text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />

                {searchQuery && (

                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery('')
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
                  >

                    <X className="h-4 w-4" />

                  </button>

                )}

              </div>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">

        <div className="sticky top-2 z-30 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-xl sm:p-5">

          <div>

            <div className="mb-3 flex items-center gap-2">

              <SlidersHorizontal className="h-4 w-4 text-blue-900" />

              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Property Category
              </span>

            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">

              {PROPERTY_CATEGORIES.map(
                (category) => (

                  <button
                    key={category}
                    type="button"
                    onClick={() => {

                      setSelectedCategory(
                        category
                      );

                      setSelectedPropertyType(
                        'All'
                      );

                      if (
                        category !==
                        'House & Lot'
                      ) {

                        setSelectedHouseType(
                          'All'
                        );

                        setSelectedStorey(
                          'All'
                        );

                      }

                    }}
                    className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      selectedCategory ===
                      category
                        ? 'bg-slate-950 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {category}
                  </button>

                )
              )}

            </div>

          </div>

          {/* SECONDARY FILTERS */}

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">

            <div>

              <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">

                <Tag className="h-3.5 w-3.5" />

                Property Type

              </label>

              <select
                value={
                  selectedPropertyType
                }
                onChange={(e) =>
                  setSelectedPropertyType(
                    e.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              >

                <option value="All">
                  All Property Types
                </option>

                {PROPERTY_TYPES.map(
                  (type) => (

                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>

                  )
                )}

              </select>

            </div>

            <div>

              <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">

                <Home className="h-3.5 w-3.5" />

                House Type

              </label>

              <select
                value={
                  selectedHouseType
                }
                onChange={(e) =>
                  setSelectedHouseType(
                    e.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              >

                <option value="All">
                  All House Types
                </option>

                {HOUSE_TYPES.map(
                  (type) => (

                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>

                  )
                )}

              </select>

            </div>

            <div>

              <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">

                <Layers3 className="h-3.5 w-3.5" />

                Storey

              </label>

              <select
                value={
                  selectedStorey
                }
                onChange={(e) =>
                  setSelectedStorey(
                    e.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              >

                <option value="All">
                  All Storeys
                </option>

                {STOREY_OPTIONS.map(
                  (storey) => (

                    <option
                      key={storey}
                      value={storey}
                    >
                      {storey ===
                      '4+'
                        ? '4 or more'
                        : `${storey} Storey`}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

          {/* SORT */}

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div className="w-full lg:max-w-md">

              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                Maximum Budget
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                <p className="min-w-[90px] text-lg font-black text-slate-950">
                  {formatBudget(
                    maxPrice
                  )}
                </p>

                <div className="w-full">

                  <input
                    type="range"
                    min={50000}
                    max={500000000}
                    step={1000000}
                    value={maxPrice}
                    onChange={(e) =>
                      setMaxPrice(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-900"
                  />

                  <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">

                    <span>
                      ₱50K
                    </span>

                    <span>
                      ₱500M+
                    </span>

                  </div>

                </div>

              </div>

            </div>

            <div className="w-full lg:w-64">

              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                Sort Listings
              </label>

              <div className="relative">

                <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                        | 'default'
                        | 'price-asc'
                        | 'price-desc'
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                >

                  <option value="default">
                    Featured
                  </option>

                  <option value="price-asc">
                    Price: Low to High
                  </option>

                  <option value="price-desc">
                    Price: High to Low
                  </option>

                </select>

              </div>

            </div>

          </div>

          {(searchQuery ||
            selectedCategory !==
              'All' ||
            selectedPropertyType !==
              'All' ||
            selectedHouseType !==
              'All' ||
            selectedStorey !==
              'All' ||
            maxPrice <
              500000000 ||
            sortBy !==
              'default') && (

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

              <span className="text-xs font-bold text-slate-400">
                Filters applied
              </span>

              <button
                type="button"
                onClick={
                  resetFilters
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-900"
              >

                <RotateCcw className="h-3.5 w-3.5" />

                Reset

              </button>

            </div>

          )}

        </div>

      </section>

      {/* =====================================================
          PROPERTY RESULTS
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">

        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Available Properties
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Find Your Perfect Place
            </h2>

          </div>

          <p className="text-xs font-bold text-slate-400">

            {
              filteredAndSortedProperties.length
            }{' '}

            {filteredAndSortedProperties.length ===
            1
              ? 'property'
              : 'properties'}{' '}

            found

          </p>

        </div>

        {loading ? (

          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-slate-200 bg-white">

            <div className="text-center">

              <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-900" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading properties...
              </p>

            </div>

          </div>

        ) : filteredAndSortedProperties.length >
          0 ? (

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">

            {filteredAndSortedProperties.map(
              (property) => (

                <button
                  key={property.id}
                  type="button"
                  onClick={() =>
                    openProperty(property)
                  }
                  className="group block w-full rounded-2xl text-left transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >

                  <div className="pointer-events-none">

                    {/*
                     * IMPORTANT FIX:
                     *
                     * PropertyCard has its own Property
                     * interface. TypeScript sees that as
                     * a different Property type.
                     *
                     * We use the component's actual
                     * property prop type here so the
                     * Marketplace and PropertyCard do
                     * not fight over duplicate interfaces.
                     */}
                    <PropertyCard
                      property={
                        property as React.ComponentProps<
                          typeof PropertyCard
                        >['property']
                      }
                    />

                  </div>

                </button>

              )
            )}

          </div>

        ) : (

          <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

              <MapPin className="h-7 w-7 text-slate-400" />

            </div>

            <h3 className="mt-5 text-xl font-black">
              No Properties Found
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Try changing your search,
              property category, property type,
              house type, storey, or budget.
            </p>

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >

              <RotateCcw className="h-4 w-4" />

              Reset Search

            </button>

          </div>

        )}

      </main>

      {/* =====================================================
          PROPERTY DETAILS MODAL
      ====================================================== */}

      {selectedProperty && (

        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:p-4"
          onMouseDown={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              closeProperty();
            }

          }}
        >

          <div className="flex min-h-full items-center justify-center">

            <div className="relative w-full max-w-6xl overflow-hidden bg-white shadow-2xl sm:rounded-3xl">

              {/* CLOSE */}

              <button
                type="button"
                onClick={
                  closeProperty
                }
                className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
              >

                <X className="h-5 w-5" />

              </button>

              {/* =================================================
                  IMAGE GALLERY
              ================================================== */}

              <div className="grid bg-slate-950 lg:grid-cols-[1fr_160px]">

                <div className="relative aspect-[4/3] min-h-[280px] sm:aspect-[16/9] lg:aspect-auto lg:h-[560px]">

                  {getPropertyImages(
                    selectedProperty
                  ).length >
                    0 && (

                    <img
                      src={
                        getPropertyImages(
                          selectedProperty
                        )[selectedImage]
                      }
                      alt={
                        selectedProperty.title
                      }
                      className="h-full w-full object-cover"
                    />

                  )}

                  <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">

                    {selectedImage +
                      1}{' '}
                    / {' '}

                    {
                      getPropertyImages(
                        selectedProperty
                      ).length
                    }

                  </div>

                  {getPropertyImages(
                    selectedProperty
                  ).length >
                    1 && (

                    <>

                      <button
                        type="button"
                        onClick={
                          previousImage
                        }
                        className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/80"
                      >

                        <ChevronLeft className="h-5 w-5" />

                      </button>

                      <button
                        type="button"
                        onClick={
                          nextImage
                        }
                        className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/80 lg:hidden"
                      >

                        <ChevronRight className="h-5 w-5" />

                      </button>

                    </>

                  )}

                </div>

                {/* THUMBNAILS */}

                <div className="hidden max-h-[560px] space-y-3 overflow-y-auto bg-slate-950 p-3 lg:block">

                  {getPropertyImages(
                    selectedProperty
                  ).map(
                    (
                      image,
                      index
                    ) => (

                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() =>
                          setSelectedImage(
                            index
                          )
                        }
                        className={`relative h-24 w-full overflow-hidden rounded-xl border-2 transition ${
                          selectedImage ===
                          index
                            ? 'border-blue-500'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >

                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover"
                        />

                      </button>

                    )
                  )}

                </div>

              </div>

              {/* MOBILE THUMBNAILS */}

              <div className="flex gap-2 overflow-x-auto bg-slate-950 p-3 lg:hidden">

                {getPropertyImages(
                  selectedProperty
                ).map(
                  (
                    image,
                    index
                  ) => (

                    <button
                      key={`${image}-mobile-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          index
                        )
                      }
                      className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                        selectedImage ===
                        index
                          ? 'border-blue-500'
                          : 'border-transparent'
                      }`}
                    >

                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />

                    </button>

                  )
                )}

              </div>

              {/* =================================================
                  DETAILS
              ================================================== */}

              <div className="grid lg:grid-cols-[1fr_340px]">

                <div className="p-5 sm:p-8">

                  <div className="flex flex-wrap gap-2">

                    {selectedProperty.category && (

                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-blue-800">

                        {
                          selectedProperty.category
                        }

                      </span>

                    )}

                    {selectedProperty.propertyType && (

                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">

                        {
                          selectedProperty.propertyType
                        }

                      </span>

                    )}

                  </div>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">

                    {
                      selectedProperty.title
                    }

                  </h2>

                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">

                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />

                    <span>
                      {
                        selectedProperty.location
                      }
                    </span>

                  </div>

                  <p className="mt-6 text-3xl font-black text-blue-950 sm:text-4xl">

                    ₱{' '}

                    {Number(
                      String(
                        selectedProperty.price
                      ).replace(
                        /[^0-9.]/g,
                        ''
                      )
                    ).toLocaleString(
                      'en-US',
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }
                    )}

                  </p>

                  {/* CLASSIFICATION */}

                  <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">

                    {selectedProperty.category && (

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Category
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-900">
                          {
                            selectedProperty.category
                          }
                        </p>

                      </div>

                    )}

                    {selectedProperty.propertyType && (

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Property Type
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-900">
                          {
                            selectedProperty.propertyType
                          }
                        </p>

                      </div>

                    )}

                    {selectedProperty.houseType && (

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                        <div className="flex items-center gap-2">

                          <Home className="h-4 w-4 text-blue-900" />

                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            House Type
                          </p>

                        </div>

                        <p className="mt-2 text-sm font-black text-slate-900">
                          {
                            selectedProperty.houseType
                          }
                        </p>

                      </div>

                    )}

                    {selectedProperty.storey && (

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                        <div className="flex items-center gap-2">

                          <Layers3 className="h-4 w-4 text-blue-900" />

                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Storey
                          </p>

                        </div>

                        <p className="mt-2 text-sm font-black text-slate-900">

                          {selectedProperty.storey ===
                          '4+'
                            ? '4 or more'
                            : selectedProperty.storey}

                        </p>

                      </div>

                    )}

                  </div>

                  {/* FEATURES */}

                  {(selectedProperty.beds !==
                    null &&
                    selectedProperty.beds !==
                      undefined) ||
                  (selectedProperty.baths !==
                    null &&
                    selectedProperty.baths !==
                      undefined) ||
                  (selectedProperty.sqft !==
                    null &&
                    selectedProperty.sqft !==
                      undefined) ? (

                    <div className="mt-4 grid grid-cols-3 gap-3">

                      {selectedProperty.beds !==
                        null &&
                        selectedProperty.beds !==
                          undefined && (

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                            <BedDouble className="h-5 w-5 text-blue-900" />

                            <p className="mt-3 text-lg font-black">
                              {
                                selectedProperty.beds
                              }
                            </p>

                            <p className="text-xs font-semibold text-slate-500">
                              Bedrooms
                            </p>

                          </div>

                        )}

                      {selectedProperty.baths !==
                        null &&
                        selectedProperty.baths !==
                          undefined && (

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                            <Bath className="h-5 w-5 text-blue-900" />

                            <p className="mt-3 text-lg font-black">
                              {
                                selectedProperty.baths
                              }
                            </p>

                            <p className="text-xs font-semibold text-slate-500">
                              Bathrooms
                            </p>

                          </div>

                        )}

                      {selectedProperty.sqft !==
                        null &&
                        selectedProperty.sqft !==
                          undefined && (

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                            <Maximize className="h-5 w-5 text-blue-900" />

                            <p className="mt-3 text-lg font-black">
                              {
                                selectedProperty.sqft
                              }
                            </p>

                            <p className="text-xs font-semibold text-slate-500">
                              sqm
                            </p>

                          </div>

                        )}

                    </div>

                  ) : null}

                  {/* PROPERTY INFORMATION */}

                  <div className="mt-8 border-t border-slate-200 pt-7">

                    <h3 className="text-lg font-black">
                      Property Information
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      This property is
                      available through
                      BREA 88 Realty.
                      Choose an Agent
                      or Broker to assist
                      you, then submit
                      your inquiry.
                    </p>

                  </div>

                </div>

                {/* =================================================
                    AGENT / INQUIRY SIDEBAR
                ================================================== */}

                <aside className="border-t border-slate-200 bg-slate-50 p-5 sm:p-8 lg:border-l lg:border-t-0">

                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                    Property Inquiry
                  </p>

                  {/* =================================================
                      AGENT PICKER
                  ================================================== */}

                  {showAgentPicker ? (

                    <div className="mt-5">

                      <AgentPicker
                        selectedAgentSlug={
                          effectiveAgentSlug
                        }
                        onSelect={
                          handleAgentSelect
                        }
                        onContinue={
                          continueToInquiry
                        }
                      />

                      {inquiryError && (

                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-5 text-red-700">

                          {inquiryError}

                        </div>

                      )}

                      <button
                        type="button"
                        onClick={
                          closeAgentPicker
                        }
                        className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                      >
                        Cancel
                      </button>

                    </div>

                  ) : inquirySuccess ? (

                    /* =================================================
                        SUCCESS
                    ================================================== */

                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

                      <div className="flex items-start gap-3">

                        <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />

                        <div>

                          <h3 className="font-black text-emerald-900">
                            Inquiry Sent
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-emerald-700">

                            Your inquiry has
                            been submitted
                            successfully.

                            {selectedAgent ? (
                              <>
                                {' '}
                                Your selected
                                agent is{' '}
                                <strong>
                                  {
                                    selectedAgent.fullName
                                  }
                                </strong>.
                              </>
                            ) : agentSlug ? (
                              <>
                                {' '}
                                Your inquiry
                                has been sent
                                to the agent
                                connected to
                                this marketplace
                                link.
                              </>
                            ) : null}

                          </p>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() => {

                          setInquirySuccess(
                            false
                          );

                          setShowInquiryForm(
                            true
                          );

                        }}
                        className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                      >
                        Send Another Inquiry
                      </button>

                    </div>

                  ) : showInquiryForm ? (

                    /* =================================================
                        INQUIRY FORM
                    ================================================== */

                    <form
                      onSubmit={
                        submitInquiry
                      }
                      className="mt-5 space-y-4"
                    >

                      {/* SELECTED AGENT */}

                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">

                            {selectedAgent?.profileImage ? (

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

                              <User className="h-5 w-5 text-blue-500" />

                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                              Your Agent
                            </p>

                            <p className="truncate text-sm font-black text-blue-950">

                              {selectedAgent
                                ? selectedAgent.fullName
                                : agentSlug
                                  ? 'Agent connected to this link'
                                  : 'Selected Agent'}

                            </p>

                            {selectedAgent && (

                              <p className="text-xs font-semibold text-blue-700">
                                {
                                  selectedAgent.role
                                }
                              </p>

                            )}

                          </div>

                        </div>

                        {!agentSlug && (

                          <button
                            type="button"
                            onClick={() => {

                              if (
                                submittingInquiry
                              ) {
                                return;
                              }

                              setShowInquiryForm(
                                false
                              );

                              setShowAgentPicker(
                                true
                              );

                            }}
                            className="mt-3 text-xs font-black text-blue-700 hover:text-blue-900"
                          >
                            Change Agent
                          </button>

                        )}

                      </div>

                      {/* FULL NAME */}

                      <div>

                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Full Name
                        </label>

                        <input
                          type="text"
                          required
                          value={
                            inquiryName
                          }
                          onChange={(e) =>
                            setInquiryName(
                              e.target.value
                            )
                          }
                          placeholder="Enter your full name"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-blue-500"
                        />

                      </div>

                      {/* EMAIL */}

                      <div>

                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Email
                        </label>

                        <input
                          type="email"
                          required
                          value={
                            inquiryEmail
                          }
                          onChange={(e) =>
                            setInquiryEmail(
                              e.target.value
                            )
                          }
                          placeholder="you@example.com"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-blue-500"
                        />

                      </div>

                      {/* PHONE */}

                      <div>

                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Phone Number
                        </label>

                        <input
                          type="tel"
                          required
                          value={
                            inquiryPhone
                          }
                          onChange={(e) =>
                            setInquiryPhone(
                              e.target.value
                            )
                          }
                          placeholder="09XXXXXXXXX"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-blue-500"
                        />

                      </div>

                      {/* MESSAGE */}

                      <div>

                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Message
                        </label>

                        <textarea
                          required
                          rows={5}
                          value={
                            inquiryMessage
                          }
                          onChange={(e) =>
                            setInquiryMessage(
                              e.target.value
                            )
                          }
                          placeholder={`I'm interested in ${selectedProperty.title}. Please provide more information.`}
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-500"
                        />

                      </div>

                      {inquiryError && (

                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-5 text-red-700">

                          {inquiryError}

                        </div>

                      )}

                      <button
                        type="submit"
                        disabled={
                          submittingInquiry
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >

                        {submittingInquiry ? (

                          <>

                            <Loader2 className="h-4 w-4 animate-spin" />

                            Sending...

                          </>

                        ) : (

                          <>

                            <Send className="h-4 w-4" />

                            Submit Inquiry

                          </>

                        )}

                      </button>

                      <button
                        type="button"
                        onClick={
                          closeInquiryForm
                        }
                        disabled={
                          submittingInquiry
                        }
                        className="w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                      >
                        Cancel
                      </button>

                    </form>

                  ) : (

                    /* =================================================
                        DEFAULT SIDEBAR
                    ================================================== */

                    <>

                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">

                          <MessageCircle className="h-6 w-6 text-blue-900" />

                        </div>

                        <h3 className="mt-4 text-lg font-black text-slate-950">
                          Interested in this property?
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">

                          {agentSlug ? (
                            <>
                              Send an inquiry
                              and your
                              message will
                              be sent directly
                              to the agent
                              connected to
                              this marketplace
                              link.
                            </>
                          ) : (
                            <>
                              Choose an Agent
                              or Broker who
                              will assist you,
                              then send your
                              inquiry directly
                              to them.
                            </>
                          )}

                        </p>

                        <button
                          type="button"
                          onClick={
                            openInquiryForm
                          }
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-black text-white transition hover:bg-blue-800 active:scale-[0.98]"
                        >

                          <Send className="h-4 w-4" />

                          Send Inquiry

                        </button>

                      </div>

                      {/* DIRECT MARKETPLACE AGENT INFO */}

                      {!agentSlug &&
                        selectedAgent && (

                          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                              Selected Agent
                            </p>

                            <div className="mt-4 flex items-center gap-3">

                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">

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

                                  <User className="h-6 w-6 text-blue-500" />

                                )}

                              </div>

                              <div className="min-w-0">

                                <h3 className="truncate text-sm font-black text-blue-950">
                                  {
                                    selectedAgent.fullName
                                  }
                                </h3>

                                <p className="text-xs font-semibold text-blue-700">
                                  {
                                    selectedAgent.role
                                  }
                                </p>

                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={() => {

                                setShowAgentPicker(
                                  true
                                );

                                setShowInquiryForm(
                                  false
                                );

                              }}
                              className="mt-4 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-900 transition hover:bg-blue-100"
                            >
                              Change Agent
                            </button>

                          </div>

                        )}

                      {/* PERMANENT AGENT LINK */}

                      {agentSlug && (

                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">

                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Agent Assistance
                          </p>

                          <div className="mt-4 flex items-center gap-3">

                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">

                              <User className="h-6 w-6 text-blue-700" />

                            </div>

                            <div className="min-w-0">

                              <h3 className="text-sm font-black text-slate-950">
                                Agent Selected
                              </h3>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Your inquiry will
                                be sent to the
                                agent connected
                                to this marketplace
                                link.
                              </p>

                            </div>

                          </div>

                        </div>

                      )}

                      {/* SCHEDULE VIEWING */}

                      <button
                        type="button"
                        onClick={
                          scheduleViewing
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white transition hover:bg-slate-800 active:scale-[0.98]"
                      >

                        <CalendarDays className="h-4 w-4" />

                        Schedule Viewing

                      </button>

                    </>

                  )}

                </aside>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

