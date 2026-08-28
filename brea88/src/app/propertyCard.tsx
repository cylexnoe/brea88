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
  Mail,
  MessageCircle,
  Send,
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

    agent?: {
      id: number;
      fullName: string;
      email: string;
      phone?: string | null;
      role?: string;
      messenger?: string | null;
      facebook?: string | null;
    } | null;

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

const [showContact, setShowContact] = useState(false);
const [showInquiry, setShowInquiry] = useState(false);

const [inquiryForm, setInquiryForm] = useState({
  name: '',
  email: '',
  phone: '',
  message: '',
});

const [inquirySubmitting, setInquirySubmitting] = useState(false);
const [inquirySuccess, setInquirySuccess] = useState(false);
const [inquiryError, setInquiryError] = useState('');

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
                  ₱ {Number(
                    String(property.price).replace(/[^0-9.]/g, '')
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </h3>

                {property.totalcp && (
                  <p className="text-md text-slate-500 mt-1">
                    Total Contract Price: ₱ {Number(
                      String(property.totalcp).replace(/[^0-9.]/g, '')
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
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
                  onClick={() => setShowContact(true)}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-blue-900 hover:bg-blue-50 text-blue-900 py-3.5 rounded-xl font-bold transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                >
                  <Phone className="w-5 h-5" />
                  Contact Agent
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
        {showInquiry && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowInquiry(false)}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowInquiry(false)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="rounded-t-2xl bg-blue-950 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
                  Property Inquiry
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  I'm Interested
                </h2>

                <p className="mt-2 text-sm text-blue-100">
                  {property.title}
                </p>
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();

                  setInquirySubmitting(true);
                  setInquiryError('');

                  try {
                    const response = await fetch(
                      '/api/inquiries',
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          propertyId: property.id,
                          name: inquiryForm.name,
                          email: inquiryForm.email,
                          phone: inquiryForm.phone,
                          message: inquiryForm.message,
                        }),
                      }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                      throw new Error(
                        data.message ||
                          'Failed to submit inquiry.'
                      );
                    }

                    setInquirySuccess(true);

                    setInquiryForm({
                      name: '',
                      email: '',
                      phone: '',
                      message: '',
                    });
                  } catch (error) {
                    console.error(
                      'Inquiry submission error:',
                      error
                    );

                    setInquiryError(
                      error instanceof Error
                        ? error.message
                        : 'Unable to submit inquiry.'
                    );
                  } finally {
                    setInquirySubmitting(false);
                  }
                }}
              >
                {inquirySuccess ? (
                  <div className="rounded-xl bg-emerald-50 p-6 text-center">
                    <h3 className="font-black text-emerald-900">
                      Inquiry Ready
                    </h3>

                    <p className="mt-2 text-sm text-emerald-700">
                      Your inquiry has been prepared.
                      We'll connect this form to the
                      database next.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setShowInquiry(false)
                      }
                      className="mt-5 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        Full Name
                      </label>

                      <input
                        required
                        type="text"
                        value={inquiryForm.name}
                        onChange={(event) =>
                          setInquiryForm({
                            ...inquiryForm,
                            name: event.target.value,
                          })
                        }
                        placeholder="Enter your full name"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        Email
                      </label>

                      <input
                        required
                        type="email"
                        value={inquiryForm.email}
                        onChange={(event) =>
                          setInquiryForm({
                            ...inquiryForm,
                            email: event.target.value,
                          })
                        }
                        placeholder="you@example.com"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        Contact Number
                      </label>

                      <input
                        required
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(event) =>
                          setInquiryForm({
                            ...inquiryForm,
                            phone: event.target.value,
                          })
                        }
                        placeholder="09XXXXXXXXX"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">
                        Message
                      </label>

                      <textarea
                        required
                        rows={4}
                        value={inquiryForm.message}
                        onChange={(event) =>
                          setInquiryForm({
                            ...inquiryForm,
                            message: event.target.value,
                          })
                        }
                        placeholder="I'm interested in this property..."
                        className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {inquiryError && (
                      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                        {inquiryError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={inquirySubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {inquirySubmitting
                        ? 'Sending...'
                        : 'Submit Inquiry'}
                    </button>
                  </>
                )}
              </form>
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
        {/* ===================================================== */}
        {/* CONTACT AGENT MODAL */}
        {/* ===================================================== */}

        {showContact && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
            onClick={() => setShowContact(false)}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-300"
            >

              {/* CLOSE */}

              <button
                type="button"
                onClick={() => setShowContact(false)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* HEADER */}

              <div className="rounded-t-2xl bg-blue-950 px-6 py-7 text-white">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Property Inquiry
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Contact Agent
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Get in touch with the agent handling
                  this property.
                </p>

              </div>

              {/* CONTENT */}

              <div className="p-6">

                {property.agent ? (
                  <>
                    {/* AGENT */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Your Property Agent
                      </p>

                      <h3 className="mt-1 text-lg font-black text-slate-900">
                        {property.agent.fullName}
                      </h3>

                      {property.agent.role && (
                        <p className="mt-1 text-sm text-slate-500">
                          {property.agent.role}
                        </p>
                      )}

                    </div>

                    {/* CONTACT OPTIONS */}

                    <div className="mt-4 space-y-2">

                      {property.agent.phone && (
                        <a
                          href={`tel:${property.agent.phone}`}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                            <Phone className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-400">
                              Contact Number
                            </p>

                            <p className="truncate text-sm font-bold text-slate-900">
                              {property.agent.phone}
                            </p>
                          </div>
                        </a>
                      )}

                      {property.agent.email && (
                        <a
                          href={`mailto:${property.agent.email}?subject=${encodeURIComponent(
                            `Inquiry about ${property.title}`
                          )}`}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                            <Mail className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-400">
                              Gmail / Email
                            </p>

                            <p className="truncate text-sm font-bold text-slate-900">
                              {property.agent.email}
                            </p>
                          </div>
                        </a>
                      )}

                      {property.agent.messenger && (
                        <a
                          href={property.agent.messenger}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                            <MessageCircle className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-400">
                              Messenger
                            </p>

                            <p className="text-sm font-bold text-slate-900">
                              Message Agent
                            </p>
                          </div>
                        </a>
                      )}

                    </div>

                    {/* INQUIRE BUTTON */}

                    <button
                        type="button"
                        onClick={() => {
                          setShowContact(false);
                          setShowInquiry(true);
                          setInquirySuccess(false);
                          setInquiryError('');
                        }}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-900 active:scale-[0.98]"
                      >
                        Send an Inquiry
                      </button>

                  </>
                ) : (

                  /* NO AGENT */

                  <div className="py-5 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                      <Phone className="h-6 w-6 text-slate-500" />
                    </div>

                    <h3 className="mt-4 text-lg font-black text-slate-900">
                      Contact BREA 88 Realty
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      This property currently has no
                      assigned agent. Please contact
                      BREA 88 Realty for assistance.
                    </p>

                    <a
                      href="mailto:brea88realty@gmail.com"
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-900"
                    >
                      <Mail className="h-5 w-5" />
                      Contact BREA 88 Realty
                    </a>

                  </div>

                )}

              </div>

            </div>
          </div>
        )}
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

