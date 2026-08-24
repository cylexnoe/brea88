'use client';

import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';

interface Property {
  id: number;
  title: string;
  tag: string;
  price: string;
  location: string;

  // Cover image
  image: string;

  // All property images from Neon
  images?: string[];

  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;

  // Optional fields from your older property data
  developer?: string;
  totalcp?: string;
  description?: string;
}

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({
  property,
}: PropertyCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  /*
   * IMPORTANT:
   *
   * The database now returns:
   *
   * images: [
   *   "https://....blob.vercel-storage.com/image1.jpg",
   *   "https://....blob.vercel-storage.com/image2.jpg"
   * ]
   *
   * If images is empty, we fall back to the cover image.
   */
  const propertyImages = useMemo(() => {
    const validImages =
      property.images?.filter(
        (image) =>
          typeof image === 'string' &&
          image.trim().length > 0
      ) ?? [];

    if (validImages.length > 0) {
      return validImages;
    }

    if (
      typeof property.image === 'string' &&
      property.image.trim().length > 0
    ) {
      return [property.image];
    }

    return [];
  }, [property.images, property.image]);

  const openDetails = () => {
    setSelectedImage(0);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
  };

  const openGallery = () => {
    setSelectedImage(0);
    setShowGallery(true);
  };

  const closeGallery = () => {
    setShowGallery(false);
  };

  const nextImage = () => {
    if (propertyImages.length <= 1) return;

    setSelectedImage((current) =>
      current >= propertyImages.length - 1
        ? 0
        : current + 1
    );
  };

  const previousImage = () => {
    if (propertyImages.length <= 1) return;

    setSelectedImage((current) =>
      current <= 0
        ? propertyImages.length - 1
        : current - 1
    );
  };

  return (
    <>
      {/* ===================================================== */}
      {/* PROPERTY CARD */}
      {/* ===================================================== */}

      <article
        onClick={openDetails}
        className="group bg-white rounded-xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer"
      >
        {/* CARD IMAGE */}
        <div className="relative h-60 overflow-hidden bg-slate-100">
          {propertyImages.length > 0 ? (
            <img
              src={propertyImages[0]}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              No Image
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* TAG */}
          <span className="absolute top-4 left-4 bg-blue-900 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
            {property.tag}
          </span>

          {/* PHOTO COUNT */}
          {propertyImages.length > 1 && (
            <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold">
              <Images className="w-3.5 h-3.5" />
              {propertyImages.length}
            </span>
          )}

          {/* VIEW PROPERTY */}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 bg-white/95 backdrop-blur-sm text-blue-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-all duration-500">
            View Property
          </span>
        </div>

        {/* CARD CONTENT */}
        <div className="p-6">
          <span className="text-2xl font-black text-blue-900">
            ₱{property.price}
          </span>

          <h3 className="mt-2 font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
            {property.title}
          </h3>

          {property.developer && (
            <span className="text-sm text-slate-500">
              by {property.developer}
            </span>
          )}

          <div className="flex items-center gap-1 mt-2">
            <MapPin
              className="w-5 h-5 text-rose-500 flex-shrink-0"
              strokeWidth={2.5}
            />

            <span className="text-gray-700 text-sm">
              {property.location}
            </span>
          </div>
        </div>
      </article>

      {/* ===================================================== */}
      {/* DETAILS MODAL */}
      {/* ===================================================== */}

      {showDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeDetails}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* CLOSE */}
            <button
              type="button"
              onClick={closeDetails}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-slate-700 hover:bg-red-500 hover:text-white transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ================================================= */}
            {/* DETAILS HERO IMAGE */}
            {/* ================================================= */}

            <div className="relative h-72 md:h-96 overflow-hidden bg-slate-900">
              {propertyImages.length > 0 ? (
                <img
                  src={propertyImages[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  No Image
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* TAG */}
              <span className="absolute top-6 left-6 bg-blue-900 text-white text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg">
                {property.tag}
              </span>

              {/* TITLE */}
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {property.location}
                </p>

                <h2 className="text-2xl md:text-4xl font-black text-white mt-1">
                  {property.title}
                </h2>
              </div>

              {/* ================================================= */}
              {/* VIEW MORE PHOTOS */}
              {/* ================================================= */}

              {propertyImages.length > 1 && (
                <button
                  type="button"
                  onClick={openGallery}
                  className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/95 backdrop-blur-sm text-blue-900 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl hover:bg-blue-900 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Images className="w-4 h-4" />

                  View More Photos

                  <span className="text-xs opacity-70">
                    ({propertyImages.length})
                  </span>
                </button>
              )}
            </div>

            {/* ================================================= */}
            {/* DETAILS CONTENT */}
            {/* ================================================= */}

            <div className="p-6 md:p-8">

              {/* PRICE */}
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
                  Property Price
                </p>

                <h3 className="text-3xl md:text-4xl font-black text-blue-900 mt-1">
                  ₱{property.price}
                </h3>

                {property.totalcp && (
                  <p className="text-md text-slate-500 mt-1">
                    Total Contract Price: {property.totalcp}
                  </p>
                )}
              </div>

              {/* ================================================= */}
              {/* PROPERTY FEATURES */}
              {/* ================================================= */}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

                {property.beds !== null &&
                  property.beds !== undefined && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <BedDouble className="w-5 h-5 text-blue-900 mb-2" />

                      <p className="text-xs text-slate-400 uppercase font-semibold">
                        Bedrooms
                      </p>

                      <p className="text-lg font-bold text-slate-900">
                        {property.beds}
                      </p>
                    </div>
                  )}

                {property.baths !== null &&
                  property.baths !== undefined && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <Bath className="w-5 h-5 text-blue-900 mb-2" />

                      <p className="text-xs text-slate-400 uppercase font-semibold">
                        Bathrooms
                      </p>

                      <p className="text-lg font-bold text-slate-900">
                        {property.baths}
                      </p>
                    </div>
                  )}

                {property.sqft !== null &&
                  property.sqft !== undefined && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <Maximize className="w-5 h-5 text-blue-900 mb-2" />

                      <p className="text-xs text-slate-400 uppercase font-semibold">
                        Area
                      </p>

                      <p className="text-lg font-bold text-slate-900">
                        {property.sqft} sqm
                      </p>
                    </div>
                  )}
              </div>

              {/* DESCRIPTION */}
              {property.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    Property Description
                  </h3>

                  <p className="text-sm md:text-base leading-7 text-slate-600">
                    {property.description}
                  </p>
                </div>
              )}

              {/* LOCATION */}
              <div className="mb-8 p-5 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">
                  Location
                </h3>

                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  {property.location}
                </p>
              </div>

              {/* CONTACT ACTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => {
                    console.log(
                      'Schedule viewing:',
                      property
                    );
                  }}
                  className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                >
                  <CalendarDays className="w-5 h-5" />
                  Schedule Site Viewing
                </button>

                <button
                  type="button"
                  onClick={() => {
                    console.log(
                      'Contact agent:',
                      property
                    );
                  }}
                  className="flex items-center justify-center gap-2 border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white py-3.5 rounded-xl font-bold transition-all duration-300 active:scale-[0.98]"
                >
                  <Phone className="w-5 h-5" />
                  Contact Agent
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* PHOTO GALLERY MODAL */}
      {/* ===================================================== */}

      {showGallery && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={closeGallery}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* CLOSE GALLERY */}
            <button
              type="button"
              onClick={closeGallery}
              className="absolute -top-12 right-0 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ================================================= */}
            {/* MAIN GALLERY IMAGE */}
            {/* ================================================= */}

            <div className="relative h-[55vh] md:h-[65vh] rounded-2xl overflow-hidden bg-black">

              {propertyImages.length > 0 ? (
                <img
                  key={selectedImage}
                  src={propertyImages[selectedImage]}
                  alt={`${property.title} - Photo ${
                    selectedImage + 1
                  }`}
                  className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  No Images Available
                </div>
              )}

              {/* PREVIOUS */}
              {propertyImages.length > 1 && (
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* NEXT */}
              {propertyImages.length > 1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* COUNTER */}
              {propertyImages.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {selectedImage + 1} /{' '}
                  {propertyImages.length}
                </div>
              )}
            </div>

            {/* ================================================= */}
            {/* THUMBNAILS */}
            {/* ================================================= */}

            {propertyImages.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 justify-center">
                {propertyImages.map(
                  (image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() =>
                        setSelectedImage(index)
                      }
                      className={`relative flex-shrink-0 w-20 h-16 md:w-24 md:h-20 rounded-lg overflow-hidden transition-all duration-300 ${
                        selectedImage === index
                          ? 'ring-4 ring-white scale-105'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${
                          index + 1
                        }`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )
                )}
              </div>
            )}

            {/* PHOTO INFORMATION */}
            <div className="text-center mt-4">
              <p className="text-white text-sm font-semibold">
                {property.title}
              </p>

              <p className="text-white/50 text-xs mt-1">
                {propertyImages.length} photo
                {propertyImages.length !== 1
                  ? 's'
                  : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

