'use client';

import React, {
  useEffect,
  useMemo,
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
  Minus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';

import PropertyCard from '../propertyCard';

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
  perMonth?: string | null;
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

function parsePrice(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  const numeric = String(value).replace(/[^\d.-]/g, '');
  const parsed = Number(numeric);

  return Number.isFinite(parsed) ? parsed : 0;
}

export default function MarketplacePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [agentSlug, setAgentSlug] = useState('');
  
useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const linkedAgent = params.get('agent')?.trim() || '';

  setAgentSlug(linkedAgent);
}, []);

  const [searchQuery, setSearchQuery] = useState('');

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

  const [filterModalOpen, setFilterModalOpen] =
    useState(false);

  const [mobileSearchOpen, setMobileSearchOpen] =
    useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

 const [sharedPropertyId, setSharedPropertyId] = useState<number | null>(
  null,
);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const propertyParam = params.get('property');

  if (!propertyParam) {
    setSharedPropertyId(null);
    return;
  }

  const id = Number(propertyParam);

  setSharedPropertyId(
    Number.isFinite(id) && id > 0 ? id : null,
  );
}, []);
 
  /*
   * Load properties.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      try {
        setLoading(true);

        const response = await fetch('/api/properties', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load properties: ${response.status}`,
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const normalized: Property[] = Array.isArray(data)
          ? data.map((property) => ({
              ...property,
              perMonth:
                property.perMonth ??
                property.monthlyPayment ??
                null,
            }))
          : [];

        setProperties(normalized);

        console.log(
          '[Marketplace] Loaded properties:',
          normalized.length,
        );

        /*
         * Debug information for shared links.
         */
        if (sharedPropertyId !== null) {
          const matchingProperty = normalized.find(
            (property) =>
              property.id === sharedPropertyId,
          );

          console.log(
            '[Marketplace] Shared property ID:',
            sharedPropertyId,
          );

          console.log(
            '[Marketplace] Matching property:',
            matchingProperty,
          );

          console.log(
            '[Marketplace] Shared agent:',
            agentSlug,
          );
        }
      } catch (error) {
        console.error(
          '[Marketplace] Failed to load properties:',
          error,
        );

        if (!cancelled) {
          setProperties([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      cancelled = true;
    };
  }, [sharedPropertyId, agentSlug]);

  useEffect(() => {
    if (!filterModalOpen) {
      document.body.style.overflow = '';
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [filterModalOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      if (filterModalOpen) {
        setFilterModalOpen(false);
        return;
      }

      if (mobileSearchOpen) {
        setMobileSearchOpen(false);
      }
    }

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
  }, [filterModalOpen, mobileSearchOpen]);

  const filteredProperties = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    const minimum =
      minimumBudget.trim() === ''
        ? null
        : parsePrice(minimumBudget);

    const maximum =
      maximumBudget.trim() === ''
        ? null
        : parsePrice(maximumBudget);

    const result = properties.filter((property) => {
      const searchableText = [
        property.title,
        property.tag,
        property.category,
        property.propertyType,
        property.houseType,
        property.storey,
        property.location,
        property.developer,
        property.description,
        property.agent?.fullName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (
        normalizedSearch &&
        !searchableText.includes(normalizedSearch)
      ) {
        return false;
      }

      if (
        selectedCategory !== 'All' &&
        property.category !== selectedCategory
      ) {
        return false;
      }

      if (
        selectedPropertyType !== 'All' &&
        property.propertyType !== selectedPropertyType
      ) {
        return false;
      }

      if (
        selectedHouseType !== 'All' &&
        property.houseType !== selectedHouseType
      ) {
        return false;
      }

      if (
        selectedStorey !== 'All' &&
        property.storey !== selectedStorey
      ) {
        return false;
      }

      const propertyPrice = parsePrice(property.price);

      if (
        minimum !== null &&
        propertyPrice < minimum
      ) {
        return false;
      }

      if (
        maximum !== null &&
        propertyPrice > maximum
      ) {
        return false;
      }

      return true;
    });

    if (sortBy === 'price-asc') {
      result.sort(
        (a, b) =>
          parsePrice(a.price) -
          parsePrice(b.price),
      );
    }

    if (sortBy === 'price-desc') {
      result.sort(
        (a, b) =>
          parsePrice(b.price) -
          parsePrice(a.price),
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

  const activeCategory = useMemo(() => {
    return (
      PROPERTY_CATEGORIES.find(
        (category) =>
          category.value === selectedCategory,
      ) ?? PROPERTY_CATEGORIES[0]
    );
  }, [selectedCategory]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (selectedCategory !== 'All') {
      count += 1;
    }

    if (selectedPropertyType !== 'All') {
      count += 1;
    }

    if (selectedHouseType !== 'All') {
      count += 1;
    }

    if (selectedStorey !== 'All') {
      count += 1;
    }

    if (minimumBudget.trim()) {
      count += 1;
    }

    if (maximumBudget.trim()) {
      count += 1;
    }

    if (sortBy !== 'default') {
      count += 1;
    }

    return count;
  }, [
    selectedCategory,
    selectedPropertyType,
    selectedHouseType,
    selectedStorey,
    minimumBudget,
    maximumBudget,
    sortBy,
  ]);

  function resetFilters() {
    setSelectedCategory('All');
    setSelectedPropertyType('All');
    setSelectedHouseType('All');
    setSelectedStorey('All');
    setMinimumBudget('');
    setMaximumBudget('');
    setSortBy('default');
    setSearchQuery('');
  }

  function renderFilterModal() {
    if (!mounted || !filterModalOpen) {
      return null;
    }

    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Property filters"
      >
        <div
          className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-3xl sm:rounded-[2rem]"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7 sm:py-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <SlidersHorizontal className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-slate-950 sm:text-xl">
                  Filter Properties
                </h2>

                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  Refine your property search
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setFilterModalOpen(false)
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div className="space-y-7">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">
                      Property Category
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Choose the type of listing
                    </p>
                  </div>

                  {selectedCategory !== 'All' && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategory('All')
                      }
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PROPERTY_CATEGORIES.map(
                    (category) => {
                      const Icon = category.icon;
                      const selected =
                        selectedCategory ===
                        category.value;

                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() =>
                            setSelectedCategory(
                              category.value,
                            )
                          }
                          className={[
                            'group relative flex min-h-[92px] flex-col items-start justify-between rounded-2xl border p-3 text-left transition',
                            'focus:outline-none focus:ring-4 focus:ring-blue-500/10',
                            selected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <div className="flex w-full items-start justify-between">
                            <span
                              className={[
                                'flex h-9 w-9 items-center justify-center rounded-xl',
                                selected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600',
                              ].join(' ')}
                            >
                              <Icon className="h-4 w-4" />
                            </span>

                            {selected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>

                          <div className="mt-2 min-w-0">
                            <p
                              className={[
                                'text-xs font-bold',
                                selected
                                  ? 'text-blue-700'
                                  : 'text-slate-800',
                              ].join(' ')}
                            >
                              {category.label}
                            </p>

                            <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                              {category.description}
                            </p>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </section>

              <section>
                <label
                  htmlFor="filter-property-type"
                  className="mb-2 block text-sm font-bold text-slate-950"
                >
                  Property Type
                </label>

                <div className="relative">
                  <Layers3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    id="filter-property-type"
                    value={selectedPropertyType}
                    onChange={(event) =>
                      setSelectedPropertyType(
                        event.target.value,
                      )
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="All">
                      All Property Types
                    </option>

                    {PROPERTY_TYPES.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </section>

              <section>
                <label
                  htmlFor="filter-house-type"
                  className="mb-2 block text-sm font-bold text-slate-950"
                >
                  House Type
                </label>

                <div className="relative">
                  <Home className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    id="filter-house-type"
                    value={selectedHouseType}
                    onChange={(event) =>
                      setSelectedHouseType(
                        event.target.value,
                      )
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="All">
                      All House Types
                    </option>

                    {HOUSE_TYPES.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </section>

              <section>
                <label
                  htmlFor="filter-storey"
                  className="mb-2 block text-sm font-bold text-slate-950"
                >
                  Storey
                </label>

                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    id="filter-storey"
                    value={selectedStorey}
                    onChange={(event) =>
                      setSelectedStorey(
                        event.target.value,
                      )
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="All">
                      Any Number of Storeys
                    </option>

                    {STOREY_OPTIONS.map((storey) => (
                      <option
                        key={storey}
                        value={storey}
                      >
                        {storey === '4+'
                          ? '4 or More Storeys'
                          : `${storey} Storey`}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </section>

              <section>
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-950">
                    Budget Range
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Set your preferred price range
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="minimum-budget"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Minimum Budget
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        ₱
                      </span>

                      <input
                        id="minimum-budget"
                        type="text"
                        inputMode="numeric"
                        value={minimumBudget}
                        onChange={(event) =>
                          setMinimumBudget(
                            event.target.value.replace(
                              /[^\d]/g,
                              '',
                            ),
                          )
                        }
                        placeholder="No minimum"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="maximum-budget"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Maximum Budget
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        ₱
                      </span>

                      <input
                        id="maximum-budget"
                        type="text"
                        inputMode="numeric"
                        value={maximumBudget}
                        onChange={(event) =>
                          setMaximumBudget(
                            event.target.value.replace(
                              /[^\d]/g,
                              '',
                            ),
                          )
                        }
                        placeholder="No maximum"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-950">
                    Sort Listings
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Choose how properties are displayed
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    {
                      value: 'default' as const,
                      label: 'All',
                    },
                    {
                      value: 'price-asc' as const,
                      label: 'Price: Low to High',
                    },
                    {
                      value: 'price-desc' as const,
                      label: 'Price: High to Low',
                    },
                  ].map((option) => {
                    const selected =
                      sortBy === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setSortBy(option.value)
                        }
                        className={[
                          'flex min-h-12 items-center justify-between rounded-xl border px-4 text-left text-sm font-semibold transition',
                          'focus:outline-none focus:ring-4 focus:ring-blue-500/10',
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <span className="flex items-center gap-2">
                          {option.value !==
                            'default' && (
                            <ArrowUpDown className="h-4 w-4" />
                          )}

                          {option.label}
                        </span>

                        {selected && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <button
              type="button"
              onClick={resetFilters}
              className="flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </button>

            <button
              type="button"
              onClick={() =>
                setFilterModalOpen(false)
              }
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              <Check className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>

        <button
          type="button"
          aria-label="Close filter modal"
          className="absolute inset-0 -z-10 cursor-default"
          onClick={() =>
            setFilterModalOpen(false)
          }
        />
      </div>,
      document.body,
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-[#020817]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[100px]" />
          <div className="absolute -right-32 top-10 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[100px]" />
          <div className="absolute bottom-[-180px] left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              BREA 88 REALTY
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Property Marketplace
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">
              Explore carefully selected properties and
              find a place that feels like home.
            </p>
          </div>

          <div className="mx-auto mt-8 hidden max-w-4xl sm:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search by property name, location, type, developer..."
                className="h-16 w-full rounded-2xl border border-white/10 bg-white/[0.07] pl-14 pr-14 text-sm font-medium text-white shadow-2xl shadow-black/10 outline-none backdrop-blur-xl transition placeholder:text-slate-500 focus:border-blue-400/50 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery('')
                  }
                  className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setFilterModalOpen(true)
                }
                className="group flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-slate-200 backdrop-blur-xl transition hover:border-blue-400/30 hover:bg-white/[0.1] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              >
                <SlidersHorizontal className="h-4 w-4 text-blue-300" />

                <span>
                  {activeCategory.label}
                </span>

                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}

                <ChevronDown className="h-4 w-4 text-slate-500 transition group-hover:text-slate-300" />
              </button>

              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategory('All')
                  }
                  className="flex h-11 items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/15 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  {activeCategory.label}

                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="relative mt-7 sm:hidden">
            <div
              className={[
                'ml-auto flex h-14 overflow-hidden rounded-2xl border backdrop-blur-xl',
                'transition-[width,background-color,border-color,box-shadow] duration-500',
                'ease-[cubic-bezier(0.22,1,0.36,1)]',
                mobileSearchOpen
                  ? 'w-full border-blue-400/40 bg-[#020b1d]/95 shadow-[0_18px_55px_rgba(2,12,27,0.35)]'
                  : 'w-14 border-white/10 bg-[#020b1d]/80 shadow-lg hover:border-blue-400/40 hover:bg-[#07152d]',
              ].join(' ')}
            >
              <div
                className={[
                  'relative min-w-0 flex-1 transition-all duration-500',
                  'ease-[cubic-bezier(0.22,1,0.36,1)]',
                  mobileSearchOpen
                    ? 'translate-x-0 opacity-100'
                    : 'pointer-events-none -translate-x-3 opacity-0',
                ].join(' ')}
              >
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search properties..."
                  tabIndex={
                    mobileSearchOpen ? 0 : -1
                  }
                  className="h-full w-full bg-transparent pl-12 pr-4 text-sm font-medium text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileSearchOpen(
                    (previous) => !previous,
                  )
                }
                aria-label={
                  mobileSearchOpen
                    ? 'Close property search'
                    : 'Open property search'
                }
                aria-expanded={mobileSearchOpen}
                className={[
                  'group relative z-10 flex h-14 w-14 shrink-0 items-center justify-center',
                  'transition-all duration-500',
                  'ease-[cubic-bezier(0.22,1,0.36,1)]',
                  'focus:outline-none focus:ring-4 focus:ring-blue-500/10',
                  mobileSearchOpen
                    ? 'border-l border-white/10'
                    : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute inset-1 rounded-xl bg-blue-500/20 blur-md',
                    'transition-all duration-500',
                    mobileSearchOpen
                      ? 'scale-100 opacity-100'
                      : 'scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100',
                  ].join(' ')}
                />

                <Search
                  className={[
                    'absolute h-5 w-5 text-blue-200',
                    'transition-all duration-500',
                    'ease-[cubic-bezier(0.22,1,0.36,1)]',
                    mobileSearchOpen
                      ? 'scale-0 rotate-90 opacity-0'
                      : 'scale-100 rotate-0 opacity-100 group-hover:scale-110',
                  ].join(' ')}
                />

                <Minus
                  className={[
                    'absolute h-5 w-5 text-blue-200',
                    'transition-all duration-500',
                    'ease-[cubic-bezier(0.22,1,0.36,1)]',
                    mobileSearchOpen
                      ? 'scale-100 rotate-0 opacity-100'
                      : 'scale-0 -rotate-90 opacity-0',
                  ].join(' ')}
                />
              </button>
            </div>

            <div
              className={[
                'grid transition-[grid-template-rows,opacity,margin] duration-500',
                'ease-[cubic-bezier(0.22,1,0.36,1)]',
                mobileSearchOpen
                  ? 'mt-3 grid-rows-[1fr] opacity-100'
                  : 'mt-0 grid-rows-[0fr] opacity-0',
              ].join(' ')}
            >
              <div className="min-h-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setFilterModalOpen(true)
                  }
                  tabIndex={
                    mobileSearchOpen ? 0 : -1
                  }
                  className={[
                    'group flex h-14 w-full items-center justify-between rounded-2xl border',
                    'border-white/10 bg-[#020b1d]/90 px-4 text-left shadow-lg backdrop-blur-xl',
                    'transition-all duration-500',
                    'ease-[cubic-bezier(0.22,1,0.36,1)]',
                    mobileSearchOpen
                      ? 'translate-y-0'
                      : '-translate-y-3',
                    'hover:border-blue-400/40 hover:bg-[#07152d] hover:shadow-blue-950/20',
                    'focus:outline-none focus:ring-4 focus:ring-blue-500/10',
                  ].join(' ')}
                  aria-haspopup="dialog"
                  aria-expanded={filterModalOpen}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                      {React.createElement(
                        activeCategory.icon,
                        {
                          className: 'h-4 w-4',
                        },
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {activeCategory.label}
                      </p>

                      <p className="truncate text-[11px] text-slate-500">
                        {activeFilterCount > 0
                          ? `${activeFilterCount} filter${
                              activeFilterCount === 1
                                ? ''
                                : 's'
                            } applied`
                          : 'Tap to refine your search'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {activeFilterCount > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                        {activeFilterCount}
                      </span>
                    )}

                    <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-blue-300" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Available Properties
              </span>

              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-50 px-2 text-xs font-bold text-blue-600">
                {filteredProperties.length}
              </span>
            </div>

            <p className="mt-1.5 text-sm text-slate-500">
              Find your perfect place from our current
              listings.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setFilterModalOpen(true)
            }
            className="hidden shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:flex"
          >
            <Filter className="h-4 w-4" />

            Filters

            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {loading && (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-600">
                Loading properties...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait a moment.
              </p>
            </div>
          </div>
        )}

        {!loading &&
          filteredProperties.length === 0 && (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950">
                No properties found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                We couldn't find properties matching
                your current search or filters. Try
                adjusting your search criteria.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Search
              </button>
            </div>
          )}

        {!loading &&
          filteredProperties.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {filteredProperties.map(
                (property) => (
                  <div
                    key={property.id}
                    className="min-w-0 aspect-square"
                  >
                    <PropertyCard
                      property={property}
                      agentSlug={agentSlug}
                      autoOpen={
                        sharedPropertyId !== null &&
                        property.id === sharedPropertyId
                      }
                    />
                  </div>
                ),
              )}
            </div>
          )}
      </section>

      {renderFilterModal()}
    </main>
  );
}