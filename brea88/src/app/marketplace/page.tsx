'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, ChevronLeft, Loader2, CircleArrowLeft } from 'lucide-react';
import PropertyCard from '../propertyCard';

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
}

export default function MarketplacePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [maxPrice, setMaxPrice] = useState<number>(100000000);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  // Fetch from our live API backend
  useEffect(() => {
    fetch('/api/properties')
      .then((res) => res.json())
      .then((data) => {
        setProperties(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed fetching properties:", err);
        setLoading(false);
      });
  }, []);

  const parsePrice = (priceStr: string): number => {
    return Number(priceStr.replace(/[^0-9]/g, ''));
  };

  const filteredAndSortedProperties = useMemo(() => {
    let result = properties.filter((property) => {
      const matchesSearch = 
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag === 'All' || property.tag === selectedTag;
      const matchesPrice = parsePrice(property.price) <= maxPrice;

      return matchesSearch && matchesTag && matchesPrice;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    return result;
  }, [properties, searchQuery, selectedTag, maxPrice, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* HEADER HERO BANNER */}
      <header className="bg-slate-950 text-white py-5 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="flex justify-end mb-4">
              <a
                href="/home"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition"
              >
                <CircleArrowLeft className="w-8 h-8" />
                Back to Home
              </a>
            </div>

            {/* Header Content */}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Property Marketplace
            </h1>

            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Explore verified real estate listings across premium commercial hubs
              and residential locations.
            </p>

          </div>
        </header>

      {/* FILTER CONTROL PANELS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-8 relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by project name, town, or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
            <div className="md:col-span-4 relative">
              <ArrowUpDown className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-semibold outline-none cursor-pointer appearance-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="default">Sort Options: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {['All', 'Residential', 'Commercial', 'Investment'].map((tag) => (
                <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${ selectedTag === tag ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {tag}
                </button>
              ))}
            </div>

            <div className="w-full lg:w-72 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1"><SlidersHorizontal className="w-3.5 h-3.5" /> Max Budget</span>
                <span className="text-blue-900">₱{(maxPrice / 1000000).toFixed(1)}M</span>
              </div>
              <input
                type="range"
                min={2000000}
                max={60000000}
                step={1000000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* COMPONENT RENDER GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center justify-between mb-6 text-xs font-bold uppercase text-slate-400 tracking-widest">
          <span>Results Matrix</span>
          <span>{filteredAndSortedProperties.length} Properties Found</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
          </div>
        ) : filteredAndSortedProperties.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 max-w-md mx-auto px-6">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-800">No Listings Found</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              We couldn't find matches matching your filters. Try adjusting your fields or sliders.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}