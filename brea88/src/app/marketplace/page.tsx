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
  <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_30%),linear-gradient(to_bottom,_#f8fafc,_#ffffff_45%,_#f8fafc)] text-slate-900">

    {/* =====================================================
        HERO
    ====================================================== */}
    <header className="relative overflow-hidden bg-[#06142d] text-white">

      {/* Premium Background */}
      <div className="absolute inset-0">

        <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -bottom-48 -left-40 h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.16),transparent_45%)]" />

        <div className="absolute inset-0 bg-gradient-to-b from-[#06142d]/95 via-[#071936]/95 to-[#06142d]" />

      </div>

      {/* Subtle Gold Line */}
      <div className="absolute left-1/2 top-0 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c9a96e]/70 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-6 sm:pb-20 lg:px-8">

        {/* TOP BAR */}
        <div className="flex items-center justify-between">

          <a
            href={
              agentSlug
                ? `/home?agent=${encodeURIComponent(agentSlug)}`
                : '/home'
            }
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-300 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-white/10 hover:text-white hover:shadow-blue-950/30"
          >
            <CircleArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />

            <span className="hidden sm:inline">
              Back to Home
            </span>

            <span className="sm:hidden">
              Back
            </span>
          </a>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 shadow-lg backdrop-blur-xl sm:text-xs">

            <Building2 className="h-3.5 w-3.5 text-blue-300" />

            BREA 88 Realty

          </div>

        </div>

        {/* HERO CONTENT */}
        <div className="mx-auto mt-14 max-w-4xl text-center sm:mt-18">

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 shadow-lg shadow-blue-950/20 backdrop-blur-xl">

            <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96e] shadow-[0_0_10px_rgba(201,169,110,0.8)]" />

            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-300 sm:text-xs">
              Find Your Next Property
            </span>

          </div>

          <h1 className="mt-6 text-4xl font-black tracking-[-0.035em] sm:text-5xl md:text-6xl lg:text-7xl">

            Find a Place

            <br />

            <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              You'll Love to Call Home.
            </span>

          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">

            Explore verified residential,
            commercial, condominium,
            rental, and investment
            properties in prime locations.

          </p>

          {agentSlug ? (

            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-black text-blue-300 shadow-lg shadow-blue-950/20 backdrop-blur-xl">

              <User className="h-3.5 w-3.5" />

              Agent Marketplace

            </div>

          ) : (

            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black text-slate-400 backdrop-blur-xl">

              <User className="h-3.5 w-3.5" />

              Choose an Agent to Assist You

            </div>

          )}

        </div>

        {/* SEARCH */}
        <div className="mx-auto mt-10 max-w-4xl">

          <div className="rounded-[1.4rem] border border-white/15 bg-white/[0.08] p-2 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">

            <div className="relative">

              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search properties, locations, property types..."
                className="h-14 w-full rounded-xl border border-white/10 bg-[#020b1d]/80 pl-12 pr-10 text-sm font-medium text-white outline-none placeholder:text-slate-500 transition-all duration-300 focus:border-blue-400 focus:bg-[#020b1d] focus:ring-4 focus:ring-blue-500/10"
              />

              {searchQuery && (

                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery('')
                  }
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-all duration-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* HERO BOTTOM ACCENT */}
      <div className="absolute bottom-0 left-1/2 h-px w-full max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

    </header>

    {/* =====================================================
        FILTERS
    ====================================================== */}
    <section className="relative z-20 mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">

      <div className="sticky top-2 z-30 rounded-[1.5rem] border border-white bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6">

        {/* Premium Accent */}
        <div className="mb-5 h-px w-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        {/* CATEGORY */}
        <div>

          <div className="mb-3 flex items-center gap-2">

            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">

              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-800" />

            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
              Property Category
            </span>

          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">

            {PROPERTY_CATEGORIES.map(
              (category) => (

                <button
                  key={category}
                  type="button"
                  onClick={() => {

                    setSelectedCategory(category);

                    setSelectedPropertyType('All');

                    if (
                      category !== 'House & Lot'
                    ) {

                      setSelectedHouseType('All');

                      setSelectedStorey('All');

                    }

                  }}
                  className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-xs font-black transition-all duration-300 ${
                    selectedCategory === category
                      ? 'border-blue-600 bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-[0_8px_25px_rgba(37,99,235,0.25)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800'
                  }`}
                >
                  {category}
                </button>

              )
            )}

          </div>

        </div>

        {/* SECONDARY FILTERS */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* PROPERTY TYPE */}
          <div>

            <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">

                <Tag className="h-3.5 w-3.5 text-slate-700" />

              </div>

              Property Type

            </label>

            <select
              value={selectedPropertyType}
              onChange={(e) =>
                setSelectedPropertyType(
                  e.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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

          {/* HOUSE TYPE */}
          <div>

            <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">

                <Home className="h-3.5 w-3.5 text-slate-700" />

              </div>

              House Type

            </label>

            <select
              value={selectedHouseType}
              onChange={(e) =>
                setSelectedHouseType(
                  e.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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

          {/* STOREY */}
          <div>

            <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">

                <Layers3 className="h-3.5 w-3.5 text-slate-700" />

              </div>

              Storey

            </label>

            <select
              value={selectedStorey}
              onChange={(e) =>
                setSelectedStorey(
                  e.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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
                    {storey === '4+'
                      ? '4 or more'
                      : `${storey} Storey`}
                  </option>

                )
              )}

            </select>

          </div>

        </div>

        {/* BUDGET + SORT */}
        <div className="mt-6 flex flex-col gap-5 border-t border-slate-100 pt-5 lg:flex-row lg:items-end lg:justify-between">

          {/* BUDGET */}
          <div className="w-full lg:max-w-md">

            <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
              Maximum Budget
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

              <div className="min-w-[105px]">

                <p className="text-xl font-black tracking-tight text-slate-950">
                  {formatBudget(maxPrice)}
                </p>

                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Maximum
                </p>

              </div>

              <div className="w-full">

                <input
                  type="range"
                  min={50000}
                  max={500000000}
                  step={1000000}
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(
                      Number(e.target.value)
                    )
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-900"
                />

                <div className="mt-2 flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">

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

          {/* SORT */}
          <div className="w-full lg:w-64">

            <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
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
                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

        {/* RESET */}
        {(searchQuery ||
          selectedCategory !== 'All' ||
          selectedPropertyType !== 'All' ||
          selectedHouseType !== 'All' ||
          selectedStorey !== 'All' ||
          maxPrice < 500000000 ||
          sortBy !== 'default') && (

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

            <div className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96e]" />

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Filters applied
              </span>

            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black text-slate-500 transition-all duration-300 hover:bg-blue-50 hover:text-blue-800"
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
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">

      {/* SECTION HEADER */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <span className="h-px w-8 bg-[#c9a96e]" />

            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700 sm:text-xs">
              Available Properties
            </p>

          </div>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl md:text-4xl">

            Find Your{' '}

            <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Perfect Place
            </span>

          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Browse our available properties and discover
            a place that fits your goals, lifestyle, and budget.
          </p>

        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">

          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

          <p className="text-xs font-black text-slate-500">

            {filteredAndSortedProperties.length}{' '}

            {filteredAndSortedProperties.length === 1
              ? 'property'
              : 'properties'}{' '}

            found

          </p>

        </div>

      </div>

      {/* PROPERTY LIST */}
      {loading ? (

        <div className="flex min-h-[400px] items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">

          <div className="text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">

              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />

            </div>

            <p className="mt-5 text-sm font-black text-slate-700">
              Loading properties...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Preparing the latest listings for you.
            </p>

          </div>

        </div>

      ) : filteredAndSortedProperties.length > 0 ? (

        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-7">

          {filteredAndSortedProperties.map(
            (property) => (

              <button
                key={property.id}
                type="button"
                onClick={() =>
                  openProperty(property)
                }
                className="group block w-full rounded-[1.4rem] text-left transition-all duration-500 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-4"
              >

                <div className="pointer-events-none">

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

        <div className="mx-auto max-w-lg rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-[0_20px_60px_rgba(15,23,42,0.07)]">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50">

            <MapPin className="h-8 w-8 text-blue-800" />

          </div>

          <div className="mx-auto mt-5 h-px w-12 bg-[#c9a96e]" />

          <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">
            No Properties Found
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Try changing your search,
            property category, property type,
            house type, storey, or budget.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(37,99,235,0.3)]"
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
        className="fixed inset-0 z-[100] overflow-y-auto bg-[#020817]/80 p-0 backdrop-blur-md sm:p-4"
        onMouseDown={(e) => {

          if (
            e.target === e.currentTarget
          ) {
            closeProperty();
          }

        }}
      >

        <div className="flex min-h-full items-center justify-center">

          <div className="relative w-full max-w-6xl overflow-hidden rounded-none border border-white/10 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:rounded-[2rem]">

            {/* CLOSE */}
            <button
              type="button"
              onClick={closeProperty}
              className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-black/80"
            >

              <X className="h-5 w-5" />

            </button>

            {/* =================================================
                IMAGE GALLERY
            ================================================== */}
            <div className="grid bg-[#020b1d] lg:grid-cols-[1fr_170px]">

              <div className="relative aspect-[4/3] min-h-[280px] overflow-hidden sm:aspect-[16/9] lg:aspect-auto lg:h-[560px]">

                {getPropertyImages(
                  selectedProperty
                ).length > 0 && (

                  <img
                    src={
                      getPropertyImages(
                        selectedProperty
                      )[selectedImage]
                    }
                    alt={
                      selectedProperty.title
                    }
                    className="h-full w-full object-cover transition-transform duration-700"
                  />

                )}

                {/* IMAGE GRADIENT */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

                {/* COUNTER */}
                <div className="absolute bottom-5 left-5 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-[11px] font-black tracking-wider text-white shadow-lg backdrop-blur-xl">

                  {selectedImage + 1}{' '}
                  /{' '}
                  {getPropertyImages(
                    selectedProperty
                  ).length}

                </div>

                {/* PREVIOUS */}
                {getPropertyImages(
                  selectedProperty
                ).length > 1 && (

                  <>

                    <button
                      type="button"
                      onClick={previousImage}
                      className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-black/80"
                    >

                      <ChevronLeft className="h-5 w-5" />

                    </button>

                    {/* NEXT */}
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-black/80 lg:hidden"
                    >

                      <ChevronRight className="h-5 w-5" />

                    </button>

                  </>

                )}

              </div>

              {/* DESKTOP THUMBNAILS */}
              <div className="hidden max-h-[560px] space-y-3 overflow-y-auto bg-[#020b1d] p-3 lg:block">

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
                        setSelectedImage(index)
                      }
                      className={`relative h-24 w-full overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        selectedImage === index
                          ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >

                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />

                    </button>

                  )
                )}

              </div>

            </div>

            {/* MOBILE THUMBNAILS */}
            <div className="flex gap-2 overflow-x-auto bg-[#020b1d] p-3 lg:hidden">

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
                      setSelectedImage(index)
                    }
                    className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                      selectedImage === index
                        ? 'border-blue-500'
                        : 'border-transparent opacity-70'
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
            <div className="grid lg:grid-cols-[1fr_360px]">

              {/* LEFT */}
              <div className="p-5 sm:p-8 lg:p-10">

                {/* TAGS */}
                <div className="flex flex-wrap gap-2">

                  {selectedProperty.category && (

                    <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-800">

                      {selectedProperty.category}

                    </span>

                  )}

                  {selectedProperty.propertyType && (

                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-600">

                      {selectedProperty.propertyType}

                    </span>

                  )}

                </div>

                {/* TITLE */}
                <h2 className="mt-5 text-3xl font-black tracking-[-0.025em] text-slate-950 sm:text-4xl">

                  {selectedProperty.title}

                </h2>

                {/* LOCATION */}
                <div className="mt-4 flex items-start gap-2 text-sm text-slate-500">

                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" />

                  <span className="leading-6">
                    {selectedProperty.location}
                  </span>

                </div>

                {/* PRICE */}
                <p className="mt-7 text-3xl font-black tracking-tight sm:text-4xl">

                  <span className="bg-gradient-to-r from-blue-950 via-blue-800 to-cyan-700 bg-clip-text text-transparent">

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

                  </span>

                </p>

                {/* GOLD ACCENT */}
                <div className="mt-4 flex items-center gap-2">

                  <span className="h-px w-10 bg-[#c9a96e]" />

                  <span className="h-1 w-1 rounded-full bg-[#c9a96e]" />

                </div>

                {/* CLASSIFICATION */}
                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  {selectedProperty.category && (

                    <div className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Category
                      </p>

                      <p className="mt-2 text-sm font-black text-slate-900">
                        {selectedProperty.category}
                      </p>

                    </div>

                  )}

                  {selectedProperty.propertyType && (

                    <div className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Property Type
                      </p>

                      <p className="mt-2 text-sm font-black text-slate-900">
                        {selectedProperty.propertyType}
                      </p>

                    </div>

                  )}

                  {selectedProperty.houseType && (

                    <div className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

                      <div className="flex items-center gap-2">

                        <Home className="h-4 w-4 text-blue-800" />

                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                          House Type
                        </p>

                      </div>

                      <p className="mt-2 text-sm font-black text-slate-900">
                        {selectedProperty.houseType}
                      </p>

                    </div>

                  )}

                  {selectedProperty.storey && (

                    <div className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

                      <div className="flex items-center gap-2">

                        <Layers3 className="h-4 w-4 text-blue-800" />

                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
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

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">

                            <BedDouble className="h-4 w-4 text-blue-800" />

                          </div>

                          <p className="mt-3 text-lg font-black text-slate-950">
                            {selectedProperty.beds}
                          </p>

                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Bedrooms
                          </p>

                        </div>

                      )}

                    {selectedProperty.baths !==
                      null &&
                      selectedProperty.baths !==
                        undefined && (

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">

                            <Bath className="h-4 w-4 text-blue-800" />

                          </div>

                          <p className="mt-3 text-lg font-black text-slate-950">
                            {selectedProperty.baths}
                          </p>

                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Bathrooms
                          </p>

                        </div>

                      )}

                    {selectedProperty.sqft !==
                      null &&
                      selectedProperty.sqft !==
                        undefined && (

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">

                            <Maximize className="h-4 w-4 text-blue-800" />

                          </div>

                          <p className="mt-3 text-lg font-black text-slate-950">
                            {selectedProperty.sqft}
                          </p>

                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            sqm
                          </p>

                        </div>

                      )}

                  </div>

                ) : null}

                {/* PROPERTY INFORMATION */}
                <div className="mt-9 border-t border-slate-200 pt-7">

                  <div className="flex items-center gap-3">

                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">

                      <Building2 className="h-4 w-4 text-blue-800" />

                    </div>

                    <h3 className="text-lg font-black text-slate-950">
                      Property Information
                    </h3>

                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">

                    This property is available
                    through BREA 88 Realty.
                    Choose an Agent or Broker
                    to assist you, then submit
                    your inquiry.

                  </p>

                </div>

              </div>

              {/* =================================================
                  AGENT / INQUIRY SIDEBAR
              ================================================== */}
              <aside className="border-t border-slate-200 bg-gradient-to-b from-slate-50 via-white to-blue-50/30 p-5 sm:p-8 lg:border-l lg:border-t-0">

                <div className="flex items-center gap-2">

                  <span className="h-px w-6 bg-[#c9a96e]" />

                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                    Property Inquiry
                  </p>

                </div>

                {/* AGENT PICKER */}
                {showAgentPicker ? (

                  <div className="mt-5">

                    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">

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

                    </div>

                    {inquiryError && (

                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-5 text-red-700">

                        {inquiryError}

                      </div>

                    )}

                    <button
                      type="button"
                      onClick={closeAgentPicker}
                      className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition-all duration-300 hover:bg-slate-200 hover:text-slate-800"
                    >
                      Cancel
                    </button>

                  </div>

                ) : inquirySuccess ? (

                  /* SUCCESS */
                  <div className="mt-5 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">

                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                      </div>

                      <div>

                        <h3 className="font-black text-emerald-900">
                          Inquiry Sent
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-emerald-700">

                          Your inquiry has been
                          submitted successfully.

                          {selectedAgent ? (
                            <>
                              {' '}
                              Your selected agent is{' '}
                              <strong>
                                {selectedAgent.fullName}
                              </strong>.
                            </>
                          ) : agentSlug ? (
                            <>
                              {' '}
                              Your inquiry has been
                              sent to the agent connected
                              to this marketplace link.
                            </>
                          ) : null}

                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() => {

                        setInquirySuccess(false);

                        setShowInquiryForm(true);

                      }}
                      className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl"
                    >
                      Send Another Inquiry
                    </button>

                  </div>

                ) : showInquiryForm ? (

                  /* INQUIRY FORM */
                  <form
                    onSubmit={submitInquiry}
                    className="mt-5 space-y-4"
                  >

                    {/* SELECTED AGENT */}
                    <div className="rounded-[1.4rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50/50 p-4 shadow-sm">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">

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

                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-500">
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
                              {selectedAgent.role}
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

                            setShowInquiryForm(false);

                            setShowAgentPicker(true);

                          }}
                          className="mt-3 text-xs font-black text-blue-700 transition hover:text-blue-900"
                        >
                          Change Agent
                        </button>

                      )}

                    </div>

                    {/* FULL NAME */}
                    <div>

                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        Full Name
                      </label>

                      <input
                        type="text"
                        required
                        value={inquiryName}
                        onChange={(e) =>
                          setInquiryName(
                            e.target.value
                          )
                        }
                        placeholder="Enter your full name"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />

                    </div>

                    {/* EMAIL */}
                    <div>

                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        Email
                      </label>

                      <input
                        type="email"
                        required
                        value={inquiryEmail}
                        onChange={(e) =>
                          setInquiryEmail(
                            e.target.value
                          )
                        }
                        placeholder="you@example.com"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />

                    </div>

                    {/* PHONE */}
                    <div>

                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        required
                        value={inquiryPhone}
                        onChange={(e) =>
                          setInquiryPhone(
                            e.target.value
                          )
                        }
                        placeholder="09XXXXXXXXX"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />

                    </div>

                    {/* MESSAGE */}
                    <div>

                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        Message
                      </label>

                      <textarea
                        required
                        rows={5}
                        value={inquiryMessage}
                        onChange={(e) =>
                          setInquiryMessage(
                            e.target.value
                          )
                        }
                        placeholder={`I'm interested in ${selectedProperty.title}. Please provide more information.`}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />

                    </div>

                    {inquiryError && (

                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-5 text-red-700">

                        {inquiryError}

                      </div>

                    )}

                    {/* SUBMIT */}
                    <button
                      type="submit"
                      disabled={submittingInquiry}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 px-4 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(37,99,235,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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

                    {/* CANCEL */}
                    <button
                      type="button"
                      onClick={closeInquiryForm}
                      disabled={submittingInquiry}
                      className="w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-800"
                    >
                      Cancel
                    </button>

                  </form>

                ) : (

                  /* DEFAULT SIDEBAR */
                  <>

                    {/* INQUIRY CTA */}
                    <div className="mt-5 rounded-[1.4rem] border border-white bg-white/90 p-5 shadow-[0_15px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">

                        <MessageCircle className="h-6 w-6 text-blue-800" />

                      </div>

                      <h3 className="mt-5 text-lg font-black tracking-tight text-slate-950">
                        Interested in this property?
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">

                        {agentSlug ? (
                          <>
                            Send an inquiry and your
                            message will be sent directly
                            to the agent connected to this
                            marketplace link.
                          </>
                        ) : (
                          <>
                            Choose an Agent or Broker
                            who will assist you, then
                            send your inquiry directly
                            to them.
                          </>
                        )}

                      </p>

                      <button
                        type="button"
                        onClick={openInquiryForm}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 px-4 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(37,99,235,0.35)] active:scale-[0.98]"
                      >

                        <Send className="h-4 w-4" />

                        Send Inquiry

                      </button>

                    </div>

                    {/* SELECTED AGENT */}
                    {!agentSlug &&
                      selectedAgent && (

                        <div className="mt-5 rounded-[1.4rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50/50 p-5 shadow-sm">

                          <div className="flex items-center justify-between">

                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                              Selected Agent
                            </p>

                            <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96e]" />

                          </div>

                          <div className="mt-4 flex items-center gap-3">

                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">

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
                                {selectedAgent.fullName}
                              </h3>

                              <p className="mt-0.5 text-xs font-semibold text-blue-700">
                                {selectedAgent.role}
                              </p>

                            </div>

                          </div>

                          <button
                            type="button"
                            onClick={() => {

                              setShowAgentPicker(true);

                              setShowInquiryForm(false);

                            }}
                            className="mt-4 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-900 shadow-sm transition-all duration-300 hover:border-blue-300 hover:bg-blue-100"
                          >
                            Change Agent
                          </button>

                        </div>

                      )}

                    {/* PERMANENT AGENT LINK */}
                    {agentSlug && (

                      <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Agent Assistance
                        </p>

                        <div className="mt-4 flex items-center gap-3">

                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50">

                            <User className="h-6 w-6 text-blue-700" />

                          </div>

                          <div className="min-w-0">

                            <h3 className="text-sm font-black text-slate-950">
                              Agent Selected
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Your inquiry will be sent
                              to the agent connected to
                              this marketplace link.
                            </p>

                          </div>

                        </div>

                      </div>

                    )}

                    {/* SCHEDULE VIEWING */}
                    <button
                      type="button"
                      onClick={scheduleViewing}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-950 px-4 py-3.5 text-sm font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-950 hover:shadow-xl active:scale-[0.98]"
                    >

                      <CalendarDays className="h-4 w-4" />

                      Schedule Viewing

                    </button>

                    {/* TRUST NOTE */}
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4">

                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">

                        <CheckCircle2 className="h-4 w-4 text-blue-700" />

                      </div>

                      <p className="text-[10px] leading-5 text-slate-500">

                        Your inquiry will be handled
                        by your selected Agent or Broker
                        through BREA 88 Realty.

                      </p>

                    </div>

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
