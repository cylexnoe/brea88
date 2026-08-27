'use client';

import React, {
  Suspense,
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
  Phone,
  MessageCircle,
  Mail,
  BedDouble,
  Bath,
  Maximize,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from '../propertyCard';

interface Agent {
  id: number;
  fullName: string;
  email: string;
  role: string;
  slug: string;
  phone?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  facebook?: string | null;
  messenger?: string | null;
}

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
  agent?: Agent | null;
  agentId?: number | null;
}

const CATEGORIES = [
  'All',
  'Residential',
  'Commercial',
  'Investment',
];
 function MarketplaceContent() {
  const searchParams = useSearchParams();

  const agentSlug =
    searchParams.get('agent');

  const [properties, setProperties] =
    useState<Property[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedTag, setSelectedTag] =
    useState('All');

  const [maxPrice, setMaxPrice] =
    useState<number>(60000000);

  const [sortBy, setSortBy] =
    useState<
      'default' |
      'price-asc' |
      'price-desc'
    >('default');

  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);

  const [selectedImage, setSelectedImage] =
    useState(0);

  useEffect(() => {
    const fetchProperties =
      async () => {
        try {
          setLoading(true);

          const response =
            await fetch(
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

  const parsePrice = (
    price: string
  ): number => {
    return (
      Number(
        price.replace(/[^0-9.]/g, '')
      ) || 0
    );
  };

  const filteredAndSortedProperties =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      let result =
        properties.filter(
          (property) => {
            const matchesSearch =
              !query ||
              property.title
                .toLowerCase()
                .includes(query) ||
              property.location
                .toLowerCase()
                .includes(query) ||
              property.tag
                .toLowerCase()
                .includes(query);
            const matchesAgent =
              !agentSlug ||
              property.agent?.slug === agentSlug;

            const matchesTag =
              selectedTag === 'All' ||
              property.tag ===
                selectedTag;

            const matchesPrice =
              parsePrice(
                property.price
              ) <= maxPrice;

            return (
                    matchesSearch &&
                    matchesTag &&
                    matchesPrice &&
                    matchesAgent
                  );
          }
        );

      if (
        sortBy === 'price-asc'
      ) {
        result = [...result].sort(
          (a, b) =>
            parsePrice(a.price) -
            parsePrice(b.price)
        );
      }

      if (
        sortBy === 'price-desc'
      ) {
        result = [...result].sort(
          (a, b) =>
            parsePrice(b.price) -
            parsePrice(a.price)
        );
      }

      return result;
    }, [
      properties,
      searchQuery,
      selectedTag,
      maxPrice,
      sortBy,
    ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTag('All');
    setMaxPrice(60000000);
    setSortBy('default');
  };

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

  const openProperty = (
    property: Property
  ) => {
    setSelectedProperty(property);
    setSelectedImage(0);

    document.body.style.overflow =
      'hidden';
  };

  const closeProperty = () => {
    setSelectedProperty(null);
    setSelectedImage(0);

    document.body.style.overflow =
      'auto';
  };

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

  const nextImage = () => {
    if (!selectedProperty)
      return;

    const images =
      getPropertyImages(
        selectedProperty
      );

    setSelectedImage(
      (current) =>
        (current + 1) %
        images.length
    );
  };

  const previousImage = () => {
    if (!selectedProperty)
      return;

    const images =
      getPropertyImages(
        selectedProperty
      );

    setSelectedImage(
      (current) =>
        (current - 1 +
          images.length) %
        images.length
    );
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow =
        'auto';
    };
  }, []);

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
              href="/home"
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
              commercial, and investment
              properties in prime locations.
            </p>

          </div>

          {/* SEARCH */}

          <div className="mx-auto mt-9 max-w-4xl">

            <div className="rounded-2xl border border-white/10 bg-white/10 p-2 shadow-2xl backdrop-blur-xl">

              <div className="flex flex-col gap-2 sm:flex-row">

                <div className="relative flex-1">

                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(
                        e.target.value
                      )
                    }
                    placeholder="Search properties, locations, or categories..."
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

        </div>
      </header>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">

        <div className="sticky top-2 z-30 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-xl sm:p-5">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-3 flex items-center gap-2">

                <SlidersHorizontal className="h-4 w-4 text-blue-900" />

                <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Property Type
                </span>

              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">

                {CATEGORIES.map(
                  (category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setSelectedTag(
                          category
                        )
                      }
                      className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                        selectedTag ===
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

          {/* BUDGET */}

          <div className="mt-5 border-t border-slate-100 pt-5">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Maximum Budget
                </p>

                <p className="mt-1 text-lg font-black text-slate-950">
                  {formatBudget(
                    maxPrice
                  )}
                </p>

              </div>

              <div className="w-full sm:max-w-md">

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
                  <span>₱50K</span>
                  <span>₱500M+</span>
                </div>

              </div>

            </div>

          </div>

          {(searchQuery ||
            selectedTag !==
              'All' ||
            maxPrice <
              60000000 ||
            sortBy !==
              'default') && (

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

              <span className="text-xs font-bold text-slate-400">
                Filters applied
              </span>

              <button
                type="button"
                onClick={resetFilters}
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
            {filteredAndSortedProperties.length}{' '}
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {filteredAndSortedProperties.map(
              (property) => (

                <button
                  key={property.id}
                  type="button"
                  onClick={() =>
                    openProperty(
                      property
                    )
                  }
                  className="group block w-full text-left transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-2xl"
                >

                  <div className="pointer-events-none">

                    <PropertyCard
                      property={
                        property
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
              property type, or budget.
            </p>

            <button
              type="button"
              onClick={resetFilters}
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

          <div className="min-h-full flex items-center justify-center">

            <div className="relative w-full max-w-6xl overflow-hidden bg-white shadow-2xl sm:rounded-3xl">

              {/* CLOSE */}

              <button
                type="button"
                onClick={closeProperty}
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

                  {/* IMAGE COUNT */}

                  <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                    {selectedImage +
                      1}{' '}
                    /{' '}
                    {
                      getPropertyImages(
                        selectedProperty
                      ).length
                    }
                  </div>

                  {/* PREVIOUS */}

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

                  {/* TAG */}

                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-blue-800">
                    {selectedProperty.tag}
                  </span>

                  {/* TITLE */}

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {
                      selectedProperty.title
                    }
                  </h2>

                  {/* LOCATION */}

                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">

                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />

                    <span>
                      {
                        selectedProperty.location
                      }
                    </span>

                  </div>

                  {/* PRICE */}

                  <p className="mt-6 text-3xl font-black text-blue-950 sm:text-4xl">
                    ₱
                    {
                      selectedProperty.price
                    }
                  </p>

                  {/* PROPERTY FEATURES */}

                  <div className="mt-7 grid grid-cols-3 gap-3">

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

                  {/* DESCRIPTION */}

                  <div className="mt-8 border-t border-slate-200 pt-7">

                    <h3 className="text-lg font-black">
                      Property Information
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      This property is
                      available through
                      BREA 88 Realty.
                      Contact the
                      assigned agent
                      for complete
                      property details,
                      availability,
                      pricing, and
                      viewing schedules.
                    </p>

                  </div>

                </div>

                {/* =================================================
                    AGENT CARD
                ================================================== */}

                <aside className="border-t border-slate-200 bg-slate-50 p-5 sm:p-8 lg:border-l lg:border-t-0">

                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                    Listed By
                  </p>

                  {selectedProperty.agent ? (

                    <>

                      <div className="mt-5 flex items-center gap-4">

                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200">

                          {selectedProperty.agent.profileImage ? (

                            <img
                              src={
                                selectedProperty.agent.profileImage
                              }
                              alt={
                                selectedProperty.agent.fullName
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            <User className="h-7 w-7 text-slate-400" />

                          )}

                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate text-lg font-black">
                            {
                              selectedProperty.agent.fullName
                            }
                          </h3>

                          <p className="text-xs font-semibold text-slate-500">
                            {
                              selectedProperty.agent.role
                            }
                          </p>

                        </div>

                      </div>

                      {/* CONTACT */}

                      <div className="mt-6 space-y-2">

                        {selectedProperty.agent.phone && (

                          <a
                            href={`tel:${selectedProperty.agent.phone}`}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                          >

                            <Phone className="h-4 w-4 text-blue-700" />

                            <span className="truncate">
                              {
                                selectedProperty.agent.phone
                              }
                            </span>

                          </a>

                        )}

                        {selectedProperty.agent.email && (

                          <a
                            href={`mailto:${selectedProperty.agent.email}`}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                          >

                            <Mail className="h-4 w-4 text-blue-700" />

                            <span className="truncate">
                              {
                                selectedProperty.agent.email
                              }
                            </span>

                          </a>

                        )}

                      </div>

                      {/* BUTTONS */}

                      <div className="mt-6 space-y-2">

                        {selectedProperty.agent.phone && (

                          <a
                            href={`tel:${selectedProperty.agent.phone}`}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-black text-white transition hover:bg-blue-800 active:scale-[0.98]"
                          >

                            <Phone className="h-4 w-4" />

                            Call Agent

                          </a>

                        )}

                        {selectedProperty.agent.messenger && (

                          <a
                            href={
                              selectedProperty.agent.messenger
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-black text-slate-800 transition hover:bg-slate-100"
                          >

                            <MessageCircle className="h-4 w-4" />

                            Messenger

                          </a>

                        )}

                        {selectedProperty.agent.facebook && (

                          <a
                            href={
                              selectedProperty.agent.facebook
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-black text-slate-800 transition hover:bg-slate-100"
                          >

                             <span className="font-black text-lg">f</span>
                                Facebook
                              </a>

                        )}

                      </div>

                      {/* SCHEDULE */}

                      <button
                        type="button"
                        onClick={() => {

                          const subject =
                            encodeURIComponent(
                              `Property Viewing Request - ${selectedProperty.title}`
                            );

                          const body =
                            encodeURIComponent(
                              `Hello ${selectedProperty.agent?.fullName},\n\nI am interested in viewing the property "${selectedProperty.title}" located at ${selectedProperty.location}.\n\nI would like to schedule a property viewing.\n\nThank you.`
                            );

                          if (
                            selectedProperty.agent?.email
                          ) {
                            window.location.href =
                              `mailto:${selectedProperty.agent.email}?subject=${subject}&body=${body}`;
                          }

                        }}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white transition hover:bg-slate-800 active:scale-[0.98]"
                      >

                        <CalendarDays className="h-4 w-4" />

                        Schedule Viewing

                      </button>

                      {/* PROFILE */}

                      <a
                        href={`/agent/${selectedProperty.agent.slug}`}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-blue-900 transition hover:bg-blue-50"
                      >
                        View Agent Profile
                      </a>

                    </>

                  ) : (

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-center">

                      <User className="mx-auto h-8 w-8 text-slate-300" />

                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        Agent information is
                        currently unavailable.
                      </p>

                    </div>

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
  export default function MarketplacePage() {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-900" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading marketplace...
              </p>
            </div>
          </div>
        }
      >
        <MarketplaceContent />
      </Suspense>
    );
  }

