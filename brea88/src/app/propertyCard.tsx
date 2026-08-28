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
} from 'lucide-react';

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

  agent?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string | null;
    role?: string;
    messenger?: string | null;
    facebook?: string | null;
  } | null;

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
   * ============================================================
   * PRICE FORMATTER
   * ============================================================
   *
   * Converts:
   * 12500000
   * 12500000.00
   * ₱12,500,000
   *
   * into:
   * ₱12,500,000
   */
  const formatPrice = (
    value: string | number | null | undefined
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '0';
    }

    const numericValue = Number(
      String(value).replace(/[^0-9.-]/g, '')
    );

    if (Number.isNaN(numericValue)) {
      return '0';
    }

    return numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  /*
   * ============================================================
   * PROPERTY IMAGES
   * ============================================================
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

  /*
   * ============================================================
   * MODAL FUNCTIONS
   * ============================================================
   */

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
        className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
      >
        {/* CARD IMAGE */}

        <div className="relative h-36 overflow-hidden bg-slate-100 sm:h-48 md:h-60">
          {propertyImages.length > 0 ? (
            <img
              src={propertyImages[0]}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              No Image
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* TAG */}

          <span className="absolute left-4 top-4 rounded bg-blue-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
            {property.tag}
          </span>

          {/* PHOTO COUNT */}

          {propertyImages.length > 1 && (
            <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <Images className="h-3.5 w-3.5" />
              {propertyImages.length}
            </span>
          )}

          {/* VIEW PROPERTY */}

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-blue-900 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            View Property
          </span>
        </div>

        {/* CARD CONTENT */}

        <div className="p-3 sm:p-4 md:p-6">

          {/* FORMATTED PRICE */}

          <span className="text-base font-black text-blue-900 sm:text-xl md:text-2xl">
            ₱{formatPrice(property.price)}
          </span>

          <h3 className="mt-1 text-sm font-bold leading-tight text-slate-900 transition-colors duration-300 group-hover:text-blue-600 sm:mt-2 sm:text-base md:text-lg">
            {property.title}
          </h3>

          {property.developer && (
            <span className="text-sm text-slate-500">
              by {property.developer}
            </span>
          )}

          <div className="mt-2 flex items-center gap-1">
            <MapPin
              className="h-5 w-5 flex-shrink-0 text-rose-500"
              strokeWidth={2.5}
            />

            <span className="text-sm text-gray-700">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeDetails}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >

            {/* CLOSE */}

            <button
              type="button"
              onClick={closeDetails}
              className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur transition-all duration-300 hover:bg-red-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* ================================================= */}
            {/* DETAILS HERO IMAGE */}
            {/* ================================================= */}

            <div className="relative h-72 overflow-hidden bg-slate-900 md:h-96">

              {propertyImages.length > 0 ? (
                <img
                  src={propertyImages[0]}
                  alt={property.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white">
                  No Image
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* TAG */}

              <span className="absolute left-6 top-6 rounded-lg bg-blue-900 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white">
                {property.tag}
              </span>

              {/* TITLE */}

              <div className="absolute bottom-6 left-6 right-6">

                <p className="flex items-center gap-1 text-sm text-white/80">
                  <MapPin className="h-4 w-4" />
                  {property.location}
                </p>

                <h2 className="mt-1 text-2xl font-black text-white md:text-4xl">
                  {property.title}
                </h2>

              </div>

              {/* VIEW MORE PHOTOS */}

              {propertyImages.length > 1 && (
                <button
                  type="button"
                  onClick={openGallery}
                  className="absolute bottom-6 right-6 flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-bold text-blue-900 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-blue-900 hover:text-white active:scale-95"
                >
                  <Images className="h-4 w-4" />

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

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Property Price
                </p>

                <h3 className="mt-1 text-3xl font-black text-blue-900 md:text-4xl">
                  ₱{formatPrice(property.price)}
                </h3>

                {property.totalcp && (
                  <p className="mt-1 text-md text-slate-500">
                    Total Contract Price: ₱
                    {formatPrice(property.totalcp)}
                  </p>
                )}

              </div>

              {/* ================================================= */}
              {/* PROPERTY FEATURES */}
              {/* ================================================= */}

              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">

                {property.beds !== null &&
                  property.beds !== undefined && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

                      <BedDouble className="mb-2 h-5 w-5 text-blue-900" />

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Bedrooms
                      </p>

                      <p className="text-lg font-bold text-slate-900">
                        {property.beds}
                      </p>

                    </div>
                  )}

                {property.baths !== null &&
                  property.baths !== undefined && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

                      <Bath className="mb-2 h-5 w-5 text-blue-900" />

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Bathrooms
                      </p>

                      <p className="text-lg font-bold text-slate-900">
                        {property.baths}
                      </p>

                    </div>
                  )}

                {property.sqft !== null &&
                  property.sqft !== undefined && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

                      <Maximize className="mb-2 h-5 w-5 text-blue-900" />

                      <p className="text-xs font-semibold uppercase text-slate-400">
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

                  <h3 className="mb-3 text-lg font-bold text-slate-900">
                    Property Description
                  </h3>

                  <p className="text-sm leading-7 text-slate-600 md:text-base">
                    {property.description}
                  </p>

                </div>
              )}

              {/* LOCATION */}

              <div className="mb-8 rounded-xl border border-slate-100 bg-slate-50 p-5">

                <h3 className="mb-2 font-bold text-slate-900">
                  Location
                </h3>

                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  {property.location}
                </p>

              </div>

              {/* CONTACT ACTIONS */}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                <button
                  type="button"
                  onClick={() => {
                    console.log(
                      'Schedule viewing:',
                      property
                    );
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-900 py-3.5 font-bold text-white transition-all duration-300 hover:bg-blue-800 hover:shadow-lg active:scale-[0.98]"
                >
                  <CalendarDays className="h-5 w-5" />
                  Schedule Site Viewing
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowContact(true)
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-blue-900 bg-white py-3.5 font-bold text-blue-900 transition-all duration-300 hover:bg-blue-50 hover:shadow-lg active:scale-[0.98]"
                >
                  <Phone className="h-5 w-5" />
                  Contact Agent
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* INQUIRY MODAL */}
      {/* ===================================================== */}

      {showInquiry && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowInquiry(false)}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >

            <button
              type="button"
              onClick={() =>
                setShowInquiry(false)
              }
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
                        'Content-Type':
                          'application/json',
                      },
                      body: JSON.stringify({
                        propertyId:
                          property.id,
                        name:
                          inquiryForm.name,
                        email:
                          inquiryForm.email,
                        phone:
                          inquiryForm.phone,
                        message:
                          inquiryForm.message,
                      }),
                    }
                  );

                  const data =
                    await response.json();

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

                <div className="space-y-4 p-6">

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Full Name
                    </label>

                    <input
                      required
                      type="text"
                      value={
                        inquiryForm.name
                      }
                      onChange={(event) =>
                        setInquiryForm({
                          ...inquiryForm,
                          name:
                            event.target.value,
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
                      value={
                        inquiryForm.email
                      }
                      onChange={(event) =>
                        setInquiryForm({
                          ...inquiryForm,
                          email:
                            event.target.value,
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
                      value={
                        inquiryForm.phone
                      }
                      onChange={(event) =>
                        setInquiryForm({
                          ...inquiryForm,
                          phone:
                            event.target.value,
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
                      value={
                        inquiryForm.message
                      }
                      onChange={(event) =>
                        setInquiryForm({
                          ...inquiryForm,
                          message:
                            event.target.value,
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
                    disabled={
                      inquirySubmitting
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {inquirySubmitting
                      ? 'Sending...'
                      : 'Submit Inquiry'}
                  </button>

                </div>

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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-300"
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
              className="absolute -top-12 right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:bg-red-500"
            >
              <X className="h-5 w-5" />
            </button>

            {/* MAIN GALLERY IMAGE */}

            <div className="relative h-[55vh] overflow-hidden rounded-2xl bg-black md:h-[65vh]">

              {propertyImages.length > 0 ? (
                <img
                  key={selectedImage}
                  src={
                    propertyImages[
                      selectedImage
                    ]
                  }
                  alt={`${property.title} - Photo ${
                    selectedImage + 1
                  }`}
                  className="h-full w-full object-contain animate-in fade-in zoom-in-95 duration-300"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white">
                  No Images Available
                </div>
              )}

              {/* PREVIOUS */}

              {propertyImages.length > 1 && (
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* NEXT */}

              {propertyImages.length > 1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {/* COUNTER */}

              {propertyImages.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  {selectedImage + 1} /{' '}
                  {propertyImages.length}
                </div>
              )}

            </div>

            {/* THUMBNAILS */}

            {propertyImages.length > 1 && (
              <div className="mt-4 flex justify-center gap-3 overflow-x-auto pb-2">

                {propertyImages.map(
                  (image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() =>
                        setSelectedImage(
                          index
                        )
                      }
                      className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 md:h-20 md:w-24 ${
                        selectedImage ===
                        index
                          ? 'scale-105 ring-4 ring-white'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >

                      <img
                        src={image}
                        alt={`Thumbnail ${
                          index + 1
                        }`}
                        className="h-full w-full object-cover"
                      />

                    </button>
                  )
                )}

              </div>
            )}

            {/* PHOTO INFORMATION */}

            <div className="mt-4 text-center">

              <p className="text-sm font-semibold text-white">
                {property.title}
              </p>

              <p className="mt-1 text-xs text-white/50">
                {propertyImages.length} photo
                {propertyImages.length !== 1
                  ? 's'
                  : ''}
              </p>

            </div>

          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* CONTACT AGENT MODAL */}
      {/* ===================================================== */}

      {showContact && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() =>
            setShowContact(false)
          }
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
              onClick={() =>
                setShowContact(false)
              }
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

            <div className="p-3 sm:p-4 md:p-6">

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
                        href={
                          property.agent.messenger
                        }
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
    </>
  );
}

