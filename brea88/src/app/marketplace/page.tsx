'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpDown,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  Home,
  Layers3,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';

import PropertyCard from '../propertyCard';

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface Agent {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  slug: string;
  profileImage?: string | null;
  messenger?: string | null;
  facebook?: string | null;
}

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
  lotArea?: number | null;
  agent?: Agent | null;
  developer?: string;
  totalcp?: string;
  description?: string;
  bankFinancing?: string[];
  videoUrl?: string;
}

/* -------------------------------------------------------------------------- */
/* PROPERTY CATEGORY OPTIONS                                                  */
/* -------------------------------------------------------------------------- */

const PROPERTY_CATEGORIES = [
  {
    value: 'All',
    label: 'All Properties',
    description: 'View all available properties',
    icon: Home,
  },
  {
    value: 'Residential',
    label: 'Residential',
    description: 'Homes and residential properties',
    icon: Home,
  },
  {
    value: 'Commercial',
    label: 'Commercial',
    description: 'Commercial spaces and properties',
    icon: Building2,
  },
  {
    value: 'Investment',
    label: 'Investment',
    description: 'Properties suited for investment',
    icon: TrendingUp,
  },
  {
    value: 'For Rent',
    label: 'For Rent',
    description: 'Properties available for rent',
    icon: Tag,
  },
  {
    value: 'Brokerage',
    label: 'Brokerage',
    description: 'Brokerage-listed properties',
    icon: BriefcaseBusiness,
  },
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
  'House & Lot',
  'Lot Only',
  'Condominium',
  'Commercial Property',
];

const HOUSE_TYPES = [
  'Town house or Row house',
  'Single attached',
  'Single detached',
  'Duplex',
];

const STOREY_OPTIONS = ['1', '2', '3', '4+'];

/* -------------------------------------------------------------------------- */
/* SCROLL REVEAL HOOK                                                         */
/* -------------------------------------------------------------------------- */

function useScrollReveal<T extends HTMLElement>(
  options: IntersectionObserverInit = {},
) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px',
        ...options,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return {
    ref,
    isVisible,
  };
}

/* -------------------------------------------------------------------------- */
/* REVEAL COMPONENT                                                           */
/* -------------------------------------------------------------------------- */

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : '0ms',
      }}
      className={[
        'transform-gpu transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-10 opacity-0',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN MARKETPLACE                                                           */
/* -------------------------------------------------------------------------- */

export default function MarketplacePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [agentSlug, setAgentSlug] = useState('');

  /* ------------------------------------------------------------------------ */
  /* SEARCH                                                                    */
  /* ------------------------------------------------------------------------ */

  const [searchQuery, setSearchQuery] = useState('');

  /* ------------------------------------------------------------------------ */
  /* FILTERS                                                                   */
  /* ------------------------------------------------------------------------ */

  const [selectedCategory, setSelectedCategory] = useState('All');

  const [selectedPropertyType, setSelectedPropertyType] =
    useState('All');

  const [selectedHouseType, setSelectedHouseType] =
    useState('All');

  const [selectedStorey, setSelectedStorey] =
    useState('All');

  const [minimumBudget, setMinimumBudget] = useState('');

  const [maximumBudget, setMaximumBudget] = useState('');

  const [sortBy, setSortBy] = useState<
    'default' | 'price-asc' | 'price-desc'
  >('default');

  /* ------------------------------------------------------------------------ */
  /* MODAL                                                                     */
  /* ------------------------------------------------------------------------ */

  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* MOUNT                                                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* AGENT SLUG                                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const slug = params.get('agent')?.trim() || '';

    setAgentSlug(slug);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* LOAD PROPERTIES                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/properties', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load properties.');
        }

        const data = await response.json();

        setProperties(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed fetching properties:', error);

        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  /* ------------------------------------------------------------------------ */
  /* LOCK BODY SCROLL WHEN MODAL IS OPEN                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!filterModalOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [filterModalOpen]);

  /* ------------------------------------------------------------------------ */
  /* ESCAPE TO CLOSE                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!filterModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFilterModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filterModalOpen]);

  /* ------------------------------------------------------------------------ */
  /* PRICE PARSER                                                              */
  /* ------------------------------------------------------------------------ */

  const parsePrice = (price: string) =>
    Number(String(price).replace(/[^0-9.]/g, '')) || 0;

  /* ------------------------------------------------------------------------ */
  /* FILTER PROPERTIES                                                         */
  /* ------------------------------------------------------------------------ */

  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const minBudget = minimumBudget
      ? Number(minimumBudget.replace(/,/g, ''))
      : null;

    const maxBudget = maximumBudget
      ? Number(maximumBudget.replace(/,/g, ''))
      : null;

    const result = properties.filter((property) => {
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

      /* -------------------------------------------------------------- */
      /* CATEGORY                                                        */
      /* -------------------------------------------------------------- */

      const categoryMatches =
        selectedCategory === 'All' ||
        property.category === selectedCategory ||
        property.tag === selectedCategory;

      /* -------------------------------------------------------------- */
      /* PROPERTY TYPE                                                   */
      /* -------------------------------------------------------------- */

      const typeMatches =
        selectedPropertyType === 'All' ||
        property.propertyType === selectedPropertyType;

      /* -------------------------------------------------------------- */
      /* HOUSE TYPE                                                      */
      /* -------------------------------------------------------------- */

      const houseTypeMatches =
        selectedHouseType === 'All' ||
        property.houseType === selectedHouseType;

      /* -------------------------------------------------------------- */
      /* STOREY                                                          */
      /* -------------------------------------------------------------- */

      const storeyMatches =
        selectedStorey === 'All' ||
        property.storey === selectedStorey ||
        (selectedStorey === '4+' &&
          Number(property.storey) >= 4);

      /* -------------------------------------------------------------- */
      /* BUDGET                                                          */
      /* -------------------------------------------------------------- */

      const propertyPrice = parsePrice(property.price);

      const minimumBudgetMatches =
        minBudget === null ||
        propertyPrice >= minBudget;

      const maximumBudgetMatches =
        maxBudget === null ||
        propertyPrice <= maxBudget;

      return (
        (!query || searchableText.includes(query)) &&
        categoryMatches &&
        typeMatches &&
        houseTypeMatches &&
        storeyMatches &&
        minimumBudgetMatches &&
        maximumBudgetMatches
      );
    });

    /* -------------------------------------------------------------- */
    /* SORTING                                                          */
    /* -------------------------------------------------------------- */

    if (sortBy === 'price-asc') {
      return [...result].sort(
        (a, b) =>
          parsePrice(a.price) - parsePrice(b.price),
      );
    }

    if (sortBy === 'price-desc') {
      return [...result].sort(
        (a, b) =>
          parsePrice(b.price) - parsePrice(a.price),
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
    minimumBudget,
    maximumBudget,
    sortBy,
  ]);

  /* ------------------------------------------------------------------------ */
  /* RESET FILTERS                                                             */
  /* ------------------------------------------------------------------------ */

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPropertyType('All');
    setSelectedHouseType('All');
    setSelectedStorey('All');
    setMinimumBudget('');
    setMaximumBudget('');
    setSortBy('default');
  };

  /* ------------------------------------------------------------------------ */
  /* SELECT CATEGORY                                                           */
  /* ------------------------------------------------------------------------ */

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  /* ------------------------------------------------------------------------ */
  /* ACTIVE CATEGORY                                                           */
  /* ------------------------------------------------------------------------ */

  const activeCategory =
    PROPERTY_CATEGORIES.find(
      (category) => category.value === selectedCategory,
    ) || PROPERTY_CATEGORIES[0];

  const ActiveCategoryIcon = activeCategory.icon;

  /* ------------------------------------------------------------------------ */
  /* FILTER COUNT / STATUS                                                    */
  /* ------------------------------------------------------------------------ */

  const activeFilterCount = [
    selectedCategory !== 'All',
    selectedPropertyType !== 'All',
    selectedHouseType !== 'All',
    selectedStorey !== 'All',
    minimumBudget !== '',
    maximumBudget !== '',
    sortBy !== 'default',
  ].filter(Boolean).length;

  const filtersApplied =
    searchQuery ||
    selectedCategory !== 'All' ||
    selectedPropertyType !== 'All' ||
    selectedHouseType !== 'All' ||
    selectedStorey !== 'All' ||
    minimumBudget !== '' ||
    maximumBudget !== '' ||
    sortBy !== 'default';

  /* ------------------------------------------------------------------------ */
  /* FILTER MODAL                                                              */
  /* ------------------------------------------------------------------------ */

  const filterModal =
    mounted && filterModalOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto px-3 py-4 sm:px-6 sm:py-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketplace-filter-title"
          >
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setFilterModalOpen(false)}
              className="absolute inset-0 cursor-default bg-slate-950/75 backdrop-blur-md"
            />

            {/* Modal */}
            <div className="relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-[0_35px_120px_rgba(2,12,27,0.5)]">
              {/* Decorative background */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.15),transparent_70%)]" />

              {/* ---------------------------------------------------------- */}
              {/* MODAL HEADER                                                 */}
              {/* ---------------------------------------------------------- */}

              <div className="relative shrink-0 border-b border-slate-100 bg-white/95 px-5 pb-5 pt-5 backdrop-blur-xl sm:px-7 sm:pb-6 sm:pt-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-950 to-blue-600 text-white shadow-lg shadow-blue-900/20">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-700">
                        Marketplace
                      </p>

                      <h2
                        id="marketplace-filter-title"
                        className="mt-0.5 text-xl font-black tracking-tight text-slate-950 sm:text-2xl"
                      >
                        Property Filters
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFilterModalOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Refine the properties displayed in the
                  marketplace based on your preferences.
                </p>
              </div>

              {/* ---------------------------------------------------------- */}
              {/* MODAL CONTENT                                                */}
              {/* ---------------------------------------------------------- */}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
                {/* ======================================================== */}
                {/* PROPERTY CATEGORY                                         */}
                {/* ======================================================== */}

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                        <Home className="h-3.5 w-3.5 text-blue-800" />
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Property Category
                        </p>

                        <p className="mt-0.5 text-xs font-semibold text-slate-400">
                          Choose a category
                        </p>
                      </div>
                    </div>

                    <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 sm:block">
                      {activeCategory.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {PROPERTY_CATEGORIES.map((category) => {
                      const Icon = category.icon;

                      const isSelected =
                        selectedCategory === category.value;

                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() =>
                            handleCategorySelect(
                              category.value,
                            )
                          }
                          className={[
                            'group relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-300',
                            'focus:outline-none focus:ring-4 focus:ring-blue-500/10',
                            isSelected
                              ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-white shadow-md shadow-blue-900/10'
                              : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md',
                          ].join(' ')}
                        >
                          {isSelected && (
                            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-500/10 blur-2xl" />
                          )}

                          <div className="relative flex items-center gap-3">
                            <div
                              className={[
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                                isSelected
                                  ? 'bg-gradient-to-br from-blue-950 to-blue-600 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700',
                              ].join(' ')}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className={[
                                  'truncate text-xs font-black',
                                  isSelected
                                    ? 'text-blue-950'
                                    : 'text-slate-800',
                                ].join(' ')}
                              >
                                {category.label}
                              </p>

                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                {category.description}
                              </p>
                            </div>

                            <div
                              className={[
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all',
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600',
                              ].join(' ')}
                            >
                              {isSelected ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* ======================================================== */}
                {/* PROPERTY TYPE / HOUSE TYPE / STOREY                     */}
                {/* ======================================================== */}

                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                      <Filter className="h-3.5 w-3.5 text-blue-800" />
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
                      Property Details
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Property Type */}
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        <Tag className="h-3.5 w-3.5" />
                        Property Type
                      </label>

                      <div className="relative">
                        <select
                          value={selectedPropertyType}
                          onChange={(event) =>
                            setSelectedPropertyType(
                              event.target.value,
                            )
                          }
                          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        >
                          <option value="All">
                            All Property Types
                          </option>

                          {PROPERTY_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* House Type */}
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        <Home className="h-3.5 w-3.5" />
                        House Type
                      </label>

                      <div className="relative">
                        <select
                          value={selectedHouseType}
                          onChange={(event) =>
                            setSelectedHouseType(
                              event.target.value,
                            )
                          }
                          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        >
                          <option value="All">
                            All House Types
                          </option>

                          {HOUSE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Storey */}
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        <Layers3 className="h-3.5 w-3.5" />
                        Storey
                      </label>

                      <div className="relative">
                        <select
                          value={selectedStorey}
                          onChange={(event) =>
                            setSelectedStorey(
                              event.target.value,
                            )
                          }
                          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        >
                          <option value="All">
                            All Storeys
                          </option>

                          {STOREY_OPTIONS.map((storey) => (
                            <option key={storey} value={storey}>
                              {storey === '4+'
                                ? '4 or more'
                                : `${storey} Storey`}
                            </option>
                          ))}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* ======================================================== */}
                {/* BUDGET + SORT                                             */}
                {/* ======================================================== */}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_250px]">
                  {/* Budget Range */}
                  <div>
                    <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Budget Range
                    </label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Minimum */}
                      <div>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#a47d3c]">
                            ₱
                          </span>

                          <input
                            type="text"
                            inputMode="numeric"
                            value={minimumBudget}
                            onChange={(event) => {
                              const value =
                                event.target.value.replace(
                                  /\D/g,
                                  '',
                                );

                              setMinimumBudget(
                                value
                                  ? Number(
                                      value,
                                    ).toLocaleString(
                                      'en-PH',
                                    )
                                  : '',
                              );
                            }}
                            placeholder="Minimum Budget"
                            aria-label="Minimum Budget"
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pl-10 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                          />
                        </div>

                        <p className="mt-1.5 pl-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Minimum
                        </p>
                      </div>

                      {/* Maximum */}
                      <div>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#a47d3c]">
                            ₱
                          </span>

                          <input
                            type="text"
                            inputMode="numeric"
                            value={maximumBudget}
                            onChange={(event) => {
                              const value =
                                event.target.value.replace(
                                  /\D/g,
                                  '',
                                );

                              setMaximumBudget(
                                value
                                  ? Number(
                                      value,
                                    ).toLocaleString(
                                      'en-PH',
                                    )
                                  : '',
                              );
                            }}
                            placeholder="Maximum Budget"
                            aria-label="Maximum Budget"
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pl-10 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/10"
                          />
                        </div>

                        <p className="mt-1.5 pl-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Maximum
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 text-[10px] font-medium text-slate-400">
                      Enter your preferred property price range.
                    </p>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      Sort Listings
                    </label>

                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(event) =>
                          setSortBy(
                            event.target.value as
                              | 'default'
                              | 'price-asc'
                              | 'price-desc',
                          )
                        }
                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------------- */}
              {/* MODAL FOOTER                                                */}
              {/* ---------------------------------------------------------- */}

              <div className="relative shrink-0 border-t border-slate-100 bg-slate-50/90 px-5 py-4 backdrop-blur-xl sm:px-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        'h-2 w-2 rounded-full',
                        activeFilterCount > 0
                          ? 'bg-blue-600'
                          : 'bg-slate-300',
                      ].join(' ')}
                    />

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {activeFilterCount > 0
                        ? `${activeFilterCount} filter${
                            activeFilterCount === 1
                              ? ''
                              : 's'
                          } selected`
                        : 'No additional filters selected'}
                    </p>
                  </div>

                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFilterModalOpen(false)
                      }
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-950 to-blue-700 px-5 text-xs font-black text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:shadow-xl sm:flex-none"
                    >
                      <Check className="h-4 w-4" />
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  /* ------------------------------------------------------------------------ */
  /* PAGE                                                                      */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      {filterModal}

      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_30%),linear-gradient(to_bottom,_#f8fafc,_#ffffff_45%,_#f8fafc)] text-slate-900">
        {/* ================================================================== */}
        {/* HERO                                                               */}
        {/* ================================================================== */}

        <header className="relative overflow-hidden bg-[#06142d] text-white">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/20 blur-3xl" />

            <div className="absolute -bottom-48 -left-40 h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.16),transparent_45%)]" />

            <div className="absolute inset-0 bg-gradient-to-b from-[#06142d]/95 via-[#071936]/95 to-[#06142d]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
            {/* Small heading */}
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-[#c9a96e]" />

                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-200 sm:text-xs">
                  BREA 88 REALTY
                </span>
              </div>
            </Reveal>

            {/* Main title */}
            <Reveal delay={100}>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.03em] sm:text-5xl">
                Property Marketplace
              </h1>
            </Reveal>

            {/* Description */}
            <Reveal delay={180}>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/70 sm:text-base">
                Browse available properties and find a place
                that fits your goals, lifestyle, and budget.
              </p>
            </Reveal>

            {/* ============================================================ */}
            {/* SEARCH BAR                                                     */}
            {/* ============================================================ */}

            <Reveal delay={260}>
              <div className="mt-7 max-w-4xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="Search your properties, locations, property types..."
                    className="h-14 w-full rounded-2xl border border-white/10 bg-[#020b1d]/80 pl-12 pr-12 text-sm font-medium text-white outline-none backdrop-blur-xl placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </Reveal>

            {/* ============================================================ */}
            {/* FILTER BUTTON                                                  */}
            {/* ============================================================ */}

            <Reveal delay={340}>
              <div className="mt-3 max-w-4xl">
                <button
                  type="button"
                  onClick={() => setFilterModalOpen(true)}
                  className="group flex h-14 w-full items-center justify-between rounded-2xl border border-white/10 bg-[#020b1d]/80 px-4 text-left shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-blue-400/40 hover:bg-[#07152d] hover:shadow-blue-950/20 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  aria-haspopup="dialog"
                  aria-expanded={filterModalOpen}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200 transition group-hover:bg-blue-500/20 group-hover:text-blue-100">
                      <SlidersHorizontal className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200/70">
                        Property Category
                      </p>

                      <p className="truncate text-sm font-black text-white">
                        {activeCategory.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {activeFilterCount > 0 && (
                      <span className="hidden rounded-full bg-blue-500/20 px-2.5 py-1 text-[9px] font-black text-blue-200 sm:block">
                        {activeFilterCount}{' '}
                        {activeFilterCount === 1
                          ? 'filter'
                          : 'filters'}
                      </span>
                    )}

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition group-hover:bg-blue-500/10 group-hover:text-blue-200">
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              </div>
            </Reveal>
          </div>

          <div className="absolute bottom-0 left-1/2 h-px w-full max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        </header>

        {/* ================================================================== */}
        {/* PROPERTY LISTINGS                                                  */}
        {/* ================================================================== */}

        <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[#c9a96e]" />

                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700 sm:text-xs">
                    Available Properties
                  </p>
                </div>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl md:text-4xl">
                  Find Your{' '}
                  <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    Perfect Place
                  </span>
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Browse our available properties and discover a
                  place that fits your goals, lifestyle, and budget.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                <p className="text-xs font-black text-slate-500">
                  {filteredProperties.length}{' '}
                  {filteredProperties.length === 1
                    ? 'property'
                    : 'properties'}{' '}
                  found
                </p>
              </div>
            </div>
          </Reveal>

          {/* ================================================================ */}
          {/* LOADING                                                           */}
          {/* ================================================================ */}

          {loading ? (
            <Reveal>
              <div className="flex min-h-[400px] items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
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
            </Reveal>
          ) : filteredProperties.length > 0 ? (
            /* ============================================================ */
            /* PROPERTY CARDS                                               */
            /* ============================================================ */

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {filteredProperties.map((property, index) => (
                <Reveal
                  key={property.id}
                  delay={Math.min((index % 6) * 80, 400)}
                >
                  <div className="min-w-0">
                    <PropertyCard
                      property={property}
                      agentSlug={agentSlug}
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            /* ============================================================ */
            /* EMPTY STATE                                                  */
            /* ============================================================ */

            <Reveal>
              <div className="mx-auto max-w-lg rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50">
                  <MapPin className="h-8 w-8 text-blue-800" />
                </div>

                <div className="mx-auto mt-5 h-px w-12 bg-[#c9a96e]" />

                <h3 className="mt-5 text-xl font-black text-slate-950">
                  No Properties Found
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Try changing your search or adjusting your
                  property filters.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Search
                </button>
              </div>
            </Reveal>
          )}
        </main>
      </div>
    </>
  );
}