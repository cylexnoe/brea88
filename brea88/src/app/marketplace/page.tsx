'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Building2,
  Home,
  Layers3,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
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
  location: string;
  image: string;
  images?: string[];
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  agent?: Agent | null;
  developer?: string;
  totalcp?: string;
  description?: string;
}

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

export default function MarketplacePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentSlug, setAgentSlug] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPropertyType, setSelectedPropertyType] = useState('All');
  const [selectedHouseType, setSelectedHouseType] = useState('All');
  const [selectedStorey, setSelectedStorey] = useState('All');
  const [maxPrice, setMaxPrice] = useState(500000000);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAgentSlug(params.get('agent')?.trim() || '');
  }, []);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/properties', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load properties.');
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

  const parsePrice = (price: string) =>
    Number(String(price).replace(/[^0-9.]/g, '')) || 0;

  const formatBudget = (price: number) => {
    if (price >= 1000000) return `₱${(price / 1000000).toFixed(1)}M`;
    return `₱${(price / 1000).toFixed(0)}K`;
  };

  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = properties.filter((property) => {
      const searchableText = [
        property.title,
        property.location,
        property.tag,
        property.category,
        property.propertyType,
        property.houseType,
        property.storey,
      ].filter(Boolean).join(' ').toLowerCase();

      const categoryMatches =
        selectedCategory === 'All' ||
        property.category === selectedCategory ||
        (!property.category && selectedCategory === property.tag);

      const typeMatches =
        selectedPropertyType === 'All' ||
        property.propertyType === selectedPropertyType;

      const houseTypeMatches =
        selectedHouseType === 'All' ||
        property.houseType === selectedHouseType;

      const storeyMatches =
        selectedStorey === 'All' ||
        property.storey === selectedStorey ||
        (selectedStorey === '4+' && Number(property.storey) >= 4);

      return (
        (!query || searchableText.includes(query)) &&
        categoryMatches &&
        typeMatches &&
        houseTypeMatches &&
        storeyMatches &&
        parsePrice(property.price) <= maxPrice
      );
    });

    if (sortBy === 'price-asc') {
      return [...result].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    }
    if (sortBy === 'price-desc') {
      return [...result].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
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

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPropertyType('All');
    setSelectedHouseType('All');
    setSelectedStorey('All');
    setMaxPrice(500000000);
    setSortBy('default');
  };

  const filtersApplied =
    searchQuery ||
    selectedCategory !== 'All' ||
    selectedPropertyType !== 'All' ||
    selectedHouseType !== 'All' ||
    selectedStorey !== 'All' ||
    maxPrice < 500000000 ||
    sortBy !== 'default';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_30%),linear-gradient(to_bottom,_#f8fafc,_#ffffff_45%,_#f8fafc)] text-slate-900">
      <header className="relative overflow-hidden bg-[#06142d] text-white">
        <div className="absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-48 -left-40 h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.16),transparent_45%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06142d]/95 via-[#071936]/95 to-[#06142d]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#c9a96e]" />
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-200 sm:text-xs">BREA 88 REALTY</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.03em] sm:text-5xl">Property Marketplace</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/70 sm:text-base">Browse available properties and find a place that fits your goals, lifestyle, and budget.</p>

          <div className="relative mt-7 max-w-4xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search properties, locations, property types..."
              className="h-14 w-full rounded-2xl border border-white/10 bg-[#020b1d]/80 pl-12 pr-12 text-sm font-medium text-white outline-none backdrop-blur-xl placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 h-px w-full max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      </header>

      <section className="relative z-20 mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="sticky top-2 z-30 rounded-[1.5rem] border border-white bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6">
          <div className="mb-5 h-px w-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50"><SlidersHorizontal className="h-3.5 w-3.5 text-blue-800" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Property Category</span>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {PROPERTY_CATEGORIES.map((category) => (
              <button key={category} type="button" onClick={() => { setSelectedCategory(category); setSelectedPropertyType('All'); if (category !== 'House & Lot') { setSelectedHouseType('All'); setSelectedStorey('All'); } }} className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-xs font-black transition ${selectedCategory === category ? 'border-blue-600 bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'}`}>
                {category}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs"><Tag className="h-4 w-4" /> Property Type</label>
              <select value={selectedPropertyType} onChange={(event) => setSelectedPropertyType(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
                <option value="All">All Property Types</option>
                {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs"><Home className="h-4 w-4" /> House Type</label>
              <select value={selectedHouseType} onChange={(event) => setSelectedHouseType(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
                <option value="All">All House Types</option>
                {HOUSE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs"><Layers3 className="h-4 w-4" /> Storey</label>
              <select value={selectedStorey} onChange={(event) => setSelectedStorey(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
                <option value="All">All Storeys</option>
                {STOREY_OPTIONS.map((storey) => <option key={storey} value={storey}>{storey === '4+' ? '4 or more' : `${storey} Storey`}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5 border-t border-slate-100 pt-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full lg:max-w-md">
              <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Maximum Budget</label>
              <div className="flex items-center gap-4">
                <div className="min-w-[85px]"><p className="text-xl font-black text-slate-950">{formatBudget(maxPrice)}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Maximum</p></div>
                <div className="w-full">
                  <input type="range" min={50000} max={500000000} step={1000000} value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-900" />
                  <div className="mt-2 flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400"><span>₱50K</span><span>₱500M+</span></div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-64">
              <label className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-xs"><ArrowUpDown className="h-4 w-4" /> Sort Listings</label>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'default' | 'price-asc' | 'price-desc')} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
                <option value="default">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {filtersApplied && (
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#c9a96e]" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filters applied</span></div>
              <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black text-slate-500 hover:bg-blue-50 hover:text-blue-800"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3"><span className="h-px w-8 bg-[#c9a96e]" /><p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700 sm:text-xs">Available Properties</p></div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl md:text-4xl">Find Your <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">Perfect Place</span></h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Browse our available properties and discover a place that fits your goals, lifestyle, and budget.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /><p className="text-xs font-black text-slate-500">{filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found</p></div>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"><div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50"><Loader2 className="h-8 w-8 animate-spin text-blue-800" /></div><p className="mt-5 text-sm font-black text-slate-700">Loading properties...</p><p className="mt-1 text-xs text-slate-400">Preparing the latest listings for you.</p></div></div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
            {filteredProperties.map((property) => <PropertyCard key={property.id} property={property} agentSlug={agentSlug} />)}
          </div>
        ) : (
          <div className="mx-auto max-w-lg rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50"><MapPin className="h-8 w-8 text-blue-800" /></div>
            <div className="mx-auto mt-5 h-px w-12 bg-[#c9a96e]" />
            <h3 className="mt-5 text-xl font-black text-slate-950">No Properties Found</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Try changing your search, property category, property type, house type, storey, or budget.</p>
            <button type="button" onClick={resetFilters} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg hover:-translate-y-0.5"><RotateCcw className="h-4 w-4" /> Reset Search</button>
          </div>
        )}
      </main>
    </div>
  );
}
