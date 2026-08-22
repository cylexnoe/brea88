import React, { useState } from 'react';
import {MapPin, BedDouble, Bath, Maximize, X, Phone, CalendarDays, Images, ChevronLeft, ChevronRight,} from 'lucide-react';
import { Property } from './data';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showSiteviewing, setShowSiteviewing] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  // Uses additional images if available
  const propertyImages =
    property.images && property.images.length > 0
      ? property.images
      : [property.image];

  const nextImage = () => {
    setSelectedImage((prev) =>
      prev === propertyImages.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setSelectedImage((prev) =>
      prev === 0 ? propertyImages.length - 1 : prev - 1
    );
  };

  return (
    <>
      {/* PROPERTY LISTING CARD */}
      <article
        onClick={() => setShowDetails(true)}
        className="group bg-white rounded-xl overflow-hidden border border-slate-200/60 shadow-s hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer"
      >
        {/* Image */}
        <div className="relative h-60 overflow-hidden">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Tag */}
          <span className="absolute top-4 left-4 bg-blue-900 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
            {property.tag}
          </span>

          {/* View Property */}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 bg-white/95 backdrop-blur-sm text-blue-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-all duration-500">
            View Property
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          <span className="text-2xl font-black text-blue-900">
            ₱{property.price}
          </span>

          <h3 className="mt-2 font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
            {property.title}
          </h3>

          <span className="text-sm text-slate-500">
            by {property.developer}
          </span>

          <div className="flex items-center gap-1">
            <MapPin
              className="w-5 h-5 text-rose-500"
              strokeWidth={2.5}
            />
            <span className="text-gray-700">
              {property.location}
            </span>
          </div>
        </div>
      </article>

      {/* DETAILS MODAL */}
      {showDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowDetails(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relativ w-full max-w-5xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-slate-700 hover:bg-red-500 hover:text-white transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* DETAILS IMAGE */}

            <div className="relative h-72 md:h-96 overflow-hidden">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Property Tag */}
              <span className="absolute top-6 left-6 bg-blue-900 text-white text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg">
                {property.tag}
              </span>

              {/* Title Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {property.location}
                </p>

                <h2 className="text-2xl md:text-4xl font-black text-white mt-1">
                  {property.title}
                </h2>
              </div>

              {/* VIEW MORE PHOTOS BUTTON */}
              {propertyImages.length > 1 && (
                <button
                  onClick={() => {
                    setSelectedImage(0);
                    setShowGallery(true);
                  }}
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

            {/* DETAILS CONTENT */}
            <div className="p-6 md:p-8">

              {/* Price */}
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
                  Property Price
                </p>

                <h3 className="text-3xl md:text-4xl font-black text-blue-900 mt-1">
                  {property.price}
                </h3>

                {property.totalcp && (
                  <p className="text-md text-slate-500 mt-1">
                    Total Contract Price: {property.totalcp}
                  </p>
                )}
              </div>

              {/* PROPERTY FEATURES */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

                {property.beds && (
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

                {property.baths && (
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

                {property.sqft && (
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
                  onClick={() => {
                    console.log('Schedule viewing:', property);
                  }}
                  className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                >
                  <CalendarDays className="w-5 h-5" />
                  Schedule Site Viewing
                </button>

                <button
                  onClick={() => {
                    console.log('Contact agent:', property);
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
      {/* ============================= */}
      {/* PHOTO GALLERY MODAL */}
      {/* ============================= */}

      {showGallery && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setShowGallery(false)}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Close Gallery */}
            <button
              onClick={() => setShowGallery(false)}
              className="absolute -top-12 right-0 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Main Gallery Image */}
            <div className="relative h-[55vh] md:h-[65vh] rounded-2xl overflow-hidden">

              <img
                key={selectedImage}
                src={propertyImages[selectedImage]}
                alt={`${property.title} ${selectedImage + 1}`}
                className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-300"
              />

              {/* Previous */}
              {propertyImages.length > 1 && (
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next */}
              {propertyImages.length > 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
                {selectedImage + 1} / {propertyImages.length}
              </div>
            </div>

            {/* Thumbnails */}
            {propertyImages.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 justify-center">
                {propertyImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative flex-shrink-0 w-20 h-16 md:w-24 md:h-20 rounded-lg overflow-hidden transition-all duration-300 ${
                      selectedImage === index
                        ? 'ring-4 ring-white scale-105'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

