'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  LogOut,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Star,
  Building2,
  Home,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Search,
  LayoutDashboard,
  Menu,
  ChevronDown,
  RefreshCw,
  CircleDollarSign,
  Activity,
  Database,
  ShieldCheck,
  Eye,
  Settings,
  Bell,
  Loader2,
  House,
  Warehouse,
  Store,
  UserRound,
  Building,
} from 'lucide-react';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/* =========================================================
   CLASSIFICATION OPTIONS
   ========================================================= */

const CATEGORY_OPTIONS = [
  'House & Lot',
  'Condominiums',
  'For Rent',
  'For Sale by Owner',
];

const HOUSE_LOT_TYPES = [
  'Pre-Selling House & Lot',
  'RFO House & Lot',
  'Rent To Own House & Lot',
  'RFO Subdivision House & Lot',
  'Lot Only Subdivision',
];

const CONDOMINIUM_TYPES = [
  'Pre-Selling Condominium',
  'RFO Condominium',
  'Rent To Own Condominium',
  'CondoTel',
];

const RENT_TYPES = [
  'Condominiums For Rent',
  'House For Rent',
  'Warehouse For Rent',
  'Commercial Space For Rent',
];

const HOUSE_TYPES = [
  'Town house or Row house',
  'Single attached',
  'Single detached',
  'Duplex',
];

const STOREY_OPTIONS = [
  '1',
  '2',
  '3 or more',
];

/*
 * House Type and Storey are relevant for actual houses.
 * They will be shown for:
 *
 * - House & Lot
 * - House For Rent
 *
 * They are not shown for:
 *
 * - Condominiums
 * - Warehouse
 * - Commercial Space
 * - Lot Only
 */

function requiresHouseDetails(
  category: string,
  propertyType: string
) {
  if (category === 'House & Lot') {
    return propertyType !== 'Lot Only Subdivision';
  }

  if (
    category === 'For Rent' &&
    propertyType === 'House For Rent'
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   TYPES
   ========================================================= */

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  source: 'upload' | 'url';
}

interface Property {
  id?: number;
  _id?: string;

  title: string;
  tag: string;
  price: string;
  location: string;

  image: string;
  images?: string[];

  category?: string | null;
  propertyType?: string | null;
  houseType?: string | null;
  storey?: string | null;

  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;

  createdAt?: string;
  updatedAt?: string;
}

type Status =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error';

/* =========================================================
   CIRCUIT LOADER
   ========================================================= */

function CircuitLoader({
  text = 'Loading...',
  fullscreen = false,
}: {
  text?: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[999] flex items-center justify-center bg-slate-950'
          : 'flex flex-col items-center justify-center py-12'
      }
    >
      <div className="relative h-20 w-20">
        <div className="absolute inset-2 rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-[0_0_35px_rgba(15,23,42,0.5)]">
          <div className="absolute inset-4 rounded-lg border border-slate-600 bg-slate-950">
            <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-md bg-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          </div>
        </div>

        <div className="absolute left-0 top-7 h-1 w-3 animate-pulse rounded-full bg-slate-400" />
        <div className="absolute right-0 top-7 h-1 w-3 animate-pulse rounded-full bg-slate-400" />
        <div className="absolute left-7 top-0 h-3 w-1 animate-pulse rounded-full bg-slate-400" />
        <div className="absolute bottom-0 left-7 h-3 w-1 animate-pulse rounded-full bg-slate-400" />

        <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-slate-500" />
        <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-slate-500" />
        <div className="absolute bottom-1 left-1 h-2 w-2 rounded-full bg-slate-500" />
        <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-slate-500" />
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {text}
      </p>

      <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-700">
        BREA 88 REALTY
      </p>
    </div>
  );
}

/* =========================================================
   SELECT COMPONENT
   ========================================================= */

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  options: string[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">
            Select {label}
          </option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
   ========================================================= */

export default function AdminDashboard() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    category: 'House & Lot',
    propertyType: '',
    houseType: '',
    storey: '',
    tag: 'Residential',
    price: '',
    location: '',
    beds: '',
    baths: '',
    sqft: '',
  });

  const [images, setImages] = useState<ImageItem[]>([]);

  const [imageSource, setImageSource] =
    useState<'upload' | 'url'>('upload');

  const [imageUrl, setImageUrl] = useState('');

  const [status, setStatus] =
    useState<Status>('idle');

  const [properties, setProperties] =
    useState<Property[]>([]);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [activeSection, setActiveSection] =
    useState<
      'overview' | 'properties' | 'add' | 'settings'
    >('overview');

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  /* =========================================================
     PROPERTY TYPE OPTIONS
     ========================================================= */

  const propertyTypeOptions = useMemo(() => {
    switch (formData.category) {
      case 'House & Lot':
        return HOUSE_LOT_TYPES;

      case 'Condominiums':
        return CONDOMINIUM_TYPES;

      case 'For Rent':
        return RENT_TYPES;

      case 'For Sale by Owner':
        return [];

      default:
        return [];
    }
  }, [formData.category]);

  const showHouseDetails =
    requiresHouseDetails(
      formData.category,
      formData.propertyType
    );

  /* =========================================================
     WELCOME
     ========================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if ('speechSynthesis' in window) {
        const message =
          new SpeechSynthesisUtterance(
            'Welcome to BREA 88 Realty Admin Dashboard.'
          );

        message.rate = 0.9;
        message.pitch = 1;
        message.volume = 1;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(message);
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* =========================================================
     INPUT CHANGE
     ========================================================= */

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    /*
     * When category changes, reset property type
     * and house-specific fields.
     */
    if (name === 'category') {
      setFormData((previous) => ({
        ...previous,
        category: value,
        propertyType: '',
        houseType: '',
        storey: '',
      }));
    }

    /*
     * When property type changes, reset house details
     * if they are no longer applicable.
     */
    if (name === 'propertyType') {
      const applicable =
        requiresHouseDetails(
          formData.category,
          value
        );

      if (!applicable) {
        setFormData((previous) => ({
          ...previous,
          propertyType: value,
          houseType: '',
          storey: '',
        }));
      }
    }
  };

  /* =========================================================
     FETCH PROPERTIES
     ========================================================= */

  const fetchProperties = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        '/api/properties',
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setProperties(data);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error(
        'Failed to fetch properties:',
        error
      );

      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  /* =========================================================
     FILTER
     ========================================================= */

  const filteredProperties = useMemo(() => {
    const term =
      searchTerm.toLowerCase().trim();

    if (!term) {
      return properties;
    }

    return properties.filter(
      (property) =>
        property.title
          ?.toLowerCase()
          .includes(term) ||
        property.location
          ?.toLowerCase()
          .includes(term) ||
        property.tag
          ?.toLowerCase()
          .includes(term) ||
        property.category
          ?.toLowerCase()
          .includes(term) ||
        property.propertyType
          ?.toLowerCase()
          .includes(term) ||
        property.price
          ?.toLowerCase()
          .includes(term)
    );
  }, [properties, searchTerm]);

  /* =========================================================
     STATS
     ========================================================= */

  const houseLotCount =
    properties.filter(
      (property) =>
        property.category === 'House & Lot'
    ).length;

  const condominiumCount =
    properties.filter(
      (property) =>
        property.category === 'Condominiums'
    ).length;

  const forRentCount =
    properties.filter(
      (property) =>
        property.category === 'For Rent'
    ).length;

  const ownerCount =
    properties.filter(
      (property) =>
        property.category ===
        'For Sale by Owner'
    ).length;

  /* =========================================================
     IMAGE UPLOAD
     ========================================================= */

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      e.target.files || []
    );

    if (!files.length) return;

    if (
      images.length + files.length >
      MAX_IMAGES
    ) {
      alert(
        `You can upload a maximum of ${MAX_IMAGES} pictures.`
      );

      e.target.value = '';
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    const validImages: ImageItem[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert(
          `${file.name} is not supported. Please use JPG, JPEG, PNG, or WEBP.`
        );

        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(
          `${file.name} is larger than 5MB.`
        );

        continue;
      }

      const previewUrl =
        URL.createObjectURL(file);

      validImages.push({
        id: `${Date.now()}-${Math.random()}`,
        url: previewUrl,
        file,
        source: 'upload',
      });
    }

    setImages((previous) => [
      ...previous,
      ...validImages,
    ]);

    e.target.value = '';
  };

  /* =========================================================
     IMAGE URL
     ========================================================= */

  const addImageUrl = () => {
    const trimmedUrl =
      imageUrl.trim();

    if (!trimmedUrl) return;

    if (images.length >= MAX_IMAGES) {
      alert(
        `You can only add ${MAX_IMAGES} pictures.`
      );

      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      alert(
        'Please enter a valid image URL.'
      );

      return;
    }

    setImages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        url: trimmedUrl,
        source: 'url',
      },
    ]);

    setImageUrl('');
  };

  /* =========================================================
     REMOVE IMAGE
     ========================================================= */

  const removeImage = (id: string) => {
    setImages((previous) => {
      const image =
        previous.find(
          (item) => item.id === id
        );

      if (
        image?.source === 'upload' &&
        image.url.startsWith('blob:')
      ) {
        URL.revokeObjectURL(
          image.url
        );
      }

      return previous.filter(
        (item) => item.id !== id
      );
    });
  };

  /* =========================================================
     SET COVER
     ========================================================= */

  const setCoverImage = (
    id: string
  ) => {
    setImages((previous) => {
      const selected =
        previous.find(
          (image) => image.id === id
        );

      if (!selected) {
        return previous;
      }

      return [
        selected,
        ...previous.filter(
          (image) =>
            image.id !== id
        ),
      ];
    });
  };

  /* =========================================================
     RESET
     ========================================================= */

  const resetForm = () => {
    images.forEach((image) => {
      if (
        image.source === 'upload' &&
        image.url.startsWith('blob:')
      ) {
        URL.revokeObjectURL(
          image.url
        );
      }
    });

    setEditingId(null);

    setFormData({
      title: '',
      category: 'House & Lot',
      propertyType: '',
      houseType: '',
      storey: '',
      tag: 'Residential',
      price: '',
      location: '',
      beds: '',
      baths: '',
      sqft: '',
    });

    setImages([]);
    setImageUrl('');
    setImageSource('upload');
    setStatus('idle');
  };

  /* =========================================================
     UPLOAD TO BLOB
     ========================================================= */

  const uploadImageToBlob = async (
    file: File
  ) => {
    const formData =
      new FormData();

    formData.append(
      'file',
      file
    );

    const response = await fetch(
      '/api/blob/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success ||
      !data.url
    ) {
      throw new Error(
        data?.message ||
          'Failed to upload image.'
      );
    }

    return data.url as string;
  };

  /* =========================================================
     SUBMIT
     ========================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert(
        'Please enter a property title.'
      );

      return;
    }

    if (!formData.category) {
      alert(
        'Please select a category.'
      );

      return;
    }

    if (
      formData.category !==
        'For Sale by Owner' &&
      !formData.propertyType
    ) {
      alert(
        'Please select a property type.'
      );

      return;
    }

    if (!formData.location.trim()) {
      alert(
        'Please enter a property location.'
      );

      return;
    }

    if (!formData.price.trim()) {
      alert(
        'Please enter the property price.'
      );

      return;
    }

    if (
      showHouseDetails &&
      !formData.houseType
    ) {
      alert(
        'Please select a house type.'
      );

      return;
    }

    if (
      showHouseDetails &&
      !formData.storey
    ) {
      alert(
        'Please select the number of storeys.'
      );

      return;
    }

    if (images.length === 0) {
      alert(
        'Please add at least one property picture.'
      );

      return;
    }

    setStatus('loading');

    try {
      const uploadedImages: string[] =
        [];

      for (const image of images) {
        if (
          image.source === 'url'
        ) {
          uploadedImages.push(
            image.url
          );

          continue;
        }

        if (!image.file) {
          throw new Error(
            'Image file is missing.'
          );
        }

        const permanentUrl =
          await uploadImageToBlob(
            image.file
          );

        uploadedImages.push(
          permanentUrl
        );
      }

      if (
        uploadedImages.length === 0
      ) {
        throw new Error(
          'No valid property images were uploaded.'
        );
      }

      const coverImage =
        uploadedImages[0];

      const response = await fetch(
        '/api/properties',
        {
          method: editingId
            ? 'PUT'
            : 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            id: editingId
              ? Number(editingId)
              : undefined,

            title:
              formData.title.trim(),

            category:
              formData.category,

            propertyType:
              formData.propertyType ||
              null,

            houseType:
              showHouseDetails
                ? formData.houseType ||
                  null
                : null,

            storey:
              showHouseDetails
                ? formData.storey ||
                  null
                : null,

            tag: formData.tag,

            price:
              formData.price.replace(
                /,/g,
                ''
              ),

            location:
              formData.location.trim(),

            beds:
              showHouseDetails
                ? formData.beds
                : null,

            baths:
              showHouseDetails
                ? formData.baths
                : null,

            sqft: formData.sqft,

            image: coverImage,

            images:
              uploadedImages,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to save property.'
        );
      }

      setStatus('success');

      await fetchProperties();

      resetForm();

      setActiveSection(
        'properties'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      console.error(
        'Property save error:',
        error
      );

      setStatus('error');

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save property.'
      );
    }
  };

  /* =========================================================
     DELETE
     ========================================================= */

  const handleDelete = async (
    id: string | number
  ) => {
    if (
      !confirm(
        'Are you sure you want to delete this property?'
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/properties/${id}`,
          {
            method: 'DELETE',
          }
        );

      if (!response.ok) {
        throw new Error(
          'Delete failed.'
        );
      }

      await fetchProperties();
    } catch (error) {
      console.error(
        'Delete failed:',
        error
      );

      alert(
        'Failed to delete property.'
      );
    }
  };

  /* =========================================================
     EDIT
     ========================================================= */

  const handleEdit = (
    property: Property
  ) => {
    const propertyId =
      property.id !== undefined
        ? String(property.id)
        : property._id
        ? String(property._id)
        : null;

    if (!propertyId) {
      alert(
        'Unable to identify this property.'
      );

      return;
    }

    const category =
      property.category ||
      'House & Lot';

    const propertyType =
      property.propertyType ||
      '';

    const showDetails =
      requiresHouseDetails(
        category,
        propertyType
      );

    setEditingId(
      propertyId
    );

    setFormData({
      title:
        property.title || '',

      category,

      propertyType,

      houseType:
        showDetails
          ? property.houseType ||
            ''
          : '',

      storey:
        showDetails
          ? property.storey ||
            ''
          : '',

      tag:
        property.tag ||
        'Residential',

      price: property.price
        ? Number(
            String(
              property.price
            ).replace(/,/g, '')
          ).toLocaleString(
            'en-US'
          )
        : '',

      location:
        property.location ||
        '',

      beds:
        property.beds !== null &&
        property.beds !== undefined
          ? String(
              property.beds
            )
          : '',

      baths:
        property.baths !== null &&
        property.baths !== undefined
          ? String(
              property.baths
            )
          : '',

      sqft:
        property.sqft !== null &&
        property.sqft !== undefined
          ? String(
              property.sqft
            )
          : '',
    });

    const propertyImages =
      property.images &&
      property.images.length > 0
        ? property.images
        : property.image
        ? [property.image]
        : [];

    setImages(
      propertyImages.map(
        (url, index) => ({
          id: `existing-${index}-${Date.now()}`,
          url,
          source: 'url',
        })
      )
    );

    setActiveSection('add');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const changeSection = (
    section:
      | 'overview'
      | 'properties'
      | 'add'
      | 'settings'
  ) => {
    setActiveSection(section);

    setSidebarOpen(false);

    if (section !== 'add') {
      setStatus('idle');
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout =
    async () => {
      try {
        await fetch(
          '/api/admin/logout',
          {
            method: 'POST',
            credentials: 'include',
          }
        );
      } catch (error) {
        console.error(
          'Logout error:',
          error
        );
      } finally {
        router.replace(
          '/admin/login'
        );

        router.refresh();
      }
    };

  /* =========================================================
     AUTH LOADING
     ========================================================= */

  if (loading) {
    return (
      <CircuitLoader
        fullscreen
        text="Loading administrator dashboard..."
      />
    );
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 flex-col
          border-r border-slate-200
          bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >

        {/* LOGO */}

        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">

          <div className="h-11 w-11 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <img
              src="/img/LOGO.png"
              alt="BREA 88 Realty"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-sm font-black tracking-wide text-slate-900">
              BREA 88 REALTY
            </h1>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Admin Portal
            </p>
          </div>

        </div>

        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Management
          </p>

          <nav className="space-y-1">

            <button
              type="button"
              onClick={() =>
                changeSection(
                  'overview'
                )
              }
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition
                ${
                  activeSection ===
                  'overview'
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </button>

            <button
              type="button"
              onClick={() =>
                changeSection(
                  'properties'
                )
              }
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition
                ${
                  activeSection ===
                  'properties'
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              <Building2 className="h-4 w-4" />
              Properties

              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                {properties.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                changeSection('add')
              }
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition
                ${
                  activeSection === 'add'
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              <PlusCircle className="h-4 w-4" />
              Add Property
            </button>

          </nav>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            System
          </p>

          <nav className="space-y-1">

            <button
              type="button"
              onClick={() =>
                changeSection(
                  'settings'
                )
              }
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition
                ${
                  activeSection ===
                  'settings'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>

            <button
              type="button"
              onClick={() =>
                router.push('/')
              }
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              View Marketplace
            </button>

          </nav>

        </div>

        {/* SIDEBAR FOOTER */}

        <div className="border-t border-slate-100 p-4">

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="min-h-screen lg:pl-72">

        {/* TOPBAR */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <p className="text-xs font-medium text-slate-400">
                BREA 88 REALTY
              </p>

              <h2 className="text-lg font-black text-slate-900">
                Administrator
              </h2>
            </div>

          </div>

          <div className="flex items-center gap-2 sm:gap-4">

            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

              <span className="text-xs font-semibold text-emerald-700">
                System Online
              </span>
            </div>

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <Bell className="h-4 w-4" />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>

            <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white sm:flex">
              A
            </div>

          </div>

        </header>

        {/* CONTENT */}

        <div className="px-4 py-6 sm:px-6 lg:px-8">

          {/* =================================================
              OVERVIEW
              ================================================= */}

          {activeSection ===
            'overview' && (
            <div className="space-y-8">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Dashboard
                  </p>

                  <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Property Overview
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Manage your BREA 88 Realty marketplace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    changeSection(
                      'add'
                    )
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Property
                </button>

              </div>

              {/* STAT CARDS */}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-slate-100 p-3">
                      <Building2 className="h-5 w-5 text-slate-700" />
                    </div>

                    <span className="text-xs font-semibold text-slate-400">
                      TOTAL
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-black">
                    {properties.length}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    All properties
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <Home className="h-5 w-5 text-emerald-600" />
                    </div>

                    <span className="text-xs font-semibold text-slate-400">
                      HOUSE
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-black">
                    {houseLotCount}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    House & Lot
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-blue-50 p-3">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>

                    <span className="text-xs font-semibold text-slate-400">
                      CONDO
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-black">
                    {condominiumCount}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Condominiums
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-amber-50 p-3">
                      <CircleDollarSign className="h-5 w-5 text-amber-600" />
                    </div>

                    <span className="text-xs font-semibold text-slate-400">
                      RENT
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-black">
                    {forRentCount}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    For Rent
                  </p>
                </div>

              </div>

              {/* CATEGORY BREAKDOWN */}

              <div className="grid gap-6 lg:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900">
                        Property Categories
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Current inventory breakdown
                      </p>
                    </div>

                    <Activity className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="mt-6 space-y-4">

                    {[
                      {
                        label: 'House & Lot',
                        value: houseLotCount,
                        icon: Home,
                      },
                      {
                        label: 'Condominiums',
                        value: condominiumCount,
                        icon: Building,
                      },
                      {
                        label: 'For Rent',
                        value: forRentCount,
                        icon: Warehouse,
                      },
                      {
                        label: 'For Sale by Owner',
                        value: ownerCount,
                        icon: UserRound,
                      },
                    ].map(
                      ({
                        label,
                        value,
                        icon: Icon,
                      }) => {
                        const percentage =
                          properties.length
                            ? Math.round(
                                (value /
                                  properties.length) *
                                  100
                              )
                            : 0;

                        return (
                          <div
                            key={label}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-slate-500" />

                                <span className="text-sm font-semibold text-slate-700">
                                  {label}
                                </span>
                              </div>

                              <span className="text-xs font-bold text-slate-500">
                                {value} (
                                {percentage}
                                %)
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-slate-900 transition-all"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div>
                      <h3 className="font-black">
                        System Status
                      </h3>

                      <p className="text-xs text-slate-400">
                        Administrator panel
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-sm text-slate-500">
                        Database
                      </span>

                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-sm text-slate-500">
                        Authentication
                      </span>

                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Secure
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Properties
                      </span>

                      <span className="text-xs font-bold text-slate-700">
                        {properties.length} records
                      </span>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              PROPERTIES
              ================================================= */}

          {activeSection ===
            'properties' && (
            <div className="space-y-6">

              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Inventory
                  </p>

                  <h1 className="mt-1 text-3xl font-black">
                    Properties
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Manage all property listings.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    changeSection(
                      'add'
                    )
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Property
                </button>

              </div>

              {/* SEARCH */}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(
                        e.target.value
                      )
                    }
                    placeholder="Search properties, locations, categories..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

              </div>

              {/* PROPERTY GRID */}

              {filteredProperties.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

                  <Building2 className="mx-auto h-10 w-10 text-slate-300" />

                  <h3 className="mt-4 font-bold text-slate-700">
                    No properties found
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Add your first property to the marketplace.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      changeSection(
                        'add'
                      )
                    }
                    className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
                  >
                    Add Property
                  </button>

                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                  {filteredProperties.map(
                    (property) => {
                      const propertyId =
                        property.id ??
                        property._id ??
                        '';

                      return (
                        <div
                          key={
                            propertyId
                          }
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                        >

                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">

                            {property.image ? (
                              <img
                                src={
                                  property.image
                                }
                                alt={
                                  property.title
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ImageIcon className="h-10 w-10 text-slate-300" />
                              </div>
                            )}

                            {property.category && (
                              <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur">
                                {
                                  property.category
                                }
                              </div>
                            )}

                          </div>

                          <div className="p-5">

                            <h3 className="line-clamp-1 font-black text-slate-900">
                              {
                                property.title
                              }
                            </h3>

                            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5" />

                              {
                                property.location
                              }
                            </div>

                            {property.propertyType && (
                              <div className="mt-3">
                                <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                  {
                                    property.propertyType
                                  }
                                </span>
                              </div>
                            )}

                            {property.houseType && (
                              <div className="mt-2 text-xs text-slate-500">
                                <span className="font-semibold">
                                  House:
                                </span>{' '}
                                {
                                  property.houseType
                                }
                              </div>
                            )}

                            {property.storey && (
                              <div className="mt-1 text-xs text-slate-500">
                                <span className="font-semibold">
                                  Storey:
                                </span>{' '}
                                {
                                  property.storey
                                }
                              </div>
                            )}

                            <div className="mt-4 flex items-center justify-between">

                              <p className="text-lg font-black text-slate-900">
                                ₱ {Number(
                                  String(property.price).replace(/[^0-9.]/g, '')
                                ).toLocaleString('en-US', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                              </p>

                              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500">
                                {
                                  property.tag
                                }
                              </span>

                            </div>

                            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    property
                                  )
                                }
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    propertyId
                                  )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
                                aria-label="Delete property"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>
          )}

          {/* =================================================
              ADD / EDIT PROPERTY
              ================================================= */}

          {activeSection ===
            'add' && (
            <div className="mx-auto max-w-5xl space-y-6">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Property Management
                  </p>

                  <h1 className="mt-1 text-3xl font-black">
                    {editingId
                      ? 'Edit Property'
                      : 'Add Property'}
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Add detailed property information to the marketplace.
                  </p>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600"
                  >
                    <X className="h-4 w-4" />
                    Cancel Edit
                  </button>
                )}

              </div>

              {/* STATUS */}

              {status ===
                'success' && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  Property saved successfully.
                </div>
              )}

              {status ===
                'error' && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  Something went wrong while saving the property.
                </div>
              )}

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-6"
              >

                {/* =================================================
                    CLASSIFICATION
                    ================================================= */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

                    <div className="flex items-center gap-3">

                      <div className="rounded-xl bg-slate-100 p-2.5">
                        <Building2 className="h-5 w-5 text-slate-700" />
                      </div>

                      <div>
                        <h2 className="font-black text-slate-900">
                          Property Classification
                        </h2>

                        <p className="mt-1 text-xs text-slate-400">
                          Select how this property should appear in the marketplace.
                        </p>
                      </div>

                    </div>

                  </div>

                  <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">

                    <SelectField
                      label="Category"
                      name="category"
                      value={
                        formData.category
                      }
                      onChange={
                        handleInputChange
                      }
                      options={
                        CATEGORY_OPTIONS
                      }
                      required
                      disabled={
                        status ===
                        'loading'
                      }
                    />

                    {formData.category !==
                      'For Sale by Owner' ? (
                      <SelectField
                        label="Property Type"
                        name="propertyType"
                        value={
                          formData.propertyType
                        }
                        onChange={
                          handleInputChange
                        }
                        options={
                          propertyTypeOptions
                        }
                        required
                        disabled={
                          status ===
                          'loading'
                        }
                      />
                    ) : (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Property Type
                        </label>

                        <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
                          For Sale by Owner
                        </div>
                      </div>
                    )}

                    {/* HOUSE TYPE */}

                    {showHouseDetails && (
                      <>
                        <SelectField
                          label="House Type"
                          name="houseType"
                          value={
                            formData.houseType
                          }
                          onChange={
                            handleInputChange
                          }
                          options={
                            HOUSE_TYPES
                          }
                          required
                          disabled={
                            status ===
                            'loading'
                          }
                        />

                        <SelectField
                          label="Storey"
                          name="storey"
                          value={
                            formData.storey
                          }
                          onChange={
                            handleInputChange
                          }
                          options={
                            STOREY_OPTIONS
                          }
                          required
                          disabled={
                            status ===
                            'loading'
                          }
                        />
                      </>
                    )}

                  </div>

                  {showHouseDetails && (
                    <div className="mx-5 mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:mx-6 sm:mb-6">

                      <div className="flex items-start gap-3">

                        <Home className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            House classification
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            House Type and Storey will be displayed for house listings on the marketplace.
                          </p>
                        </div>

                      </div>

                    </div>
                  )}

                </section>

                {/* =================================================
                    BASIC INFORMATION
                    ================================================= */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

                    <div className="flex items-center gap-3">

                      <div className="rounded-xl bg-slate-100 p-2.5">
                        <Home className="h-5 w-5 text-slate-700" />
                      </div>

                      <div>
                        <h2 className="font-black">
                          Property Information
                        </h2>

                        <p className="mt-1 text-xs text-slate-400">
                          Basic information about the listing.
                        </p>
                      </div>

                    </div>

                  </div>

                  <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">

                    <div className="md:col-span-2">

                      <label
                        htmlFor="title"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Property Title
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        id="title"
                        name="title"
                        value={
                          formData.title
                        }
                        onChange={
                          handleInputChange
                        }
                        placeholder="e.g. Modern Family House in Cebu"
                        required
                        disabled={
                          status ===
                          'loading'
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
                      />

                    </div>

                    <div>

                      <label
                        htmlFor="price"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Price
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          ₱
                        </span>

                        <input
                          id="price"
                          name="price"
                          value={
                            formData.price
                          }
                          onChange={
                            handleInputChange
                          }
                          placeholder="0"
                          inputMode="decimal"
                          required
                          disabled={
                            status ===
                            'loading'
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
                        />
                      </div>

                    </div>

                    <div>

                      <label
                        htmlFor="location"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Location
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          id="location"
                          name="location"
                          value={
                            formData.location
                          }
                          onChange={
                            handleInputChange
                          }
                          placeholder="e.g. Liloan, Cebu"
                          required
                          disabled={
                            status ===
                            'loading'
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
                        />
                      </div>

                    </div>

                    {/* HOUSE STATS */}

                    {showHouseDetails && (
                      <>
                        <div>

                          <label
                            htmlFor="beds"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            Bedrooms
                          </label>

                          <div className="relative">
                            <BedDouble className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                            <input
                              id="beds"
                              name="beds"
                              type="number"
                              min="0"
                              value={
                                formData.beds
                              }
                              onChange={
                                handleInputChange
                              }
                              placeholder="0"
                              disabled={
                                status ===
                                'loading'
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />
                          </div>

                        </div>

                        <div>

                          <label
                            htmlFor="baths"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            Bathrooms
                          </label>

                          <div className="relative">
                            <Bath className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                            <input
                              id="baths"
                              name="baths"
                              type="number"
                              min="0"
                              value={
                                formData.baths
                              }
                              onChange={
                                handleInputChange
                              }
                              placeholder="0"
                              disabled={
                                status ===
                                'loading'
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />
                          </div>

                        </div>
                      </>
                    )}

                    <div>

                      <label
                        htmlFor="sqft"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Floor Area / Lot Area
                      </label>

                      <div className="relative">
                        <Maximize className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          id="sqft"
                          name="sqft"
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            formData.sqft
                          }
                          onChange={
                            handleInputChange
                          }
                          placeholder="e.g. 120"
                          disabled={
                            status ===
                            'loading'
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />
                      </div>

                    </div>

                    <SelectField
                      label="Legacy Tag"
                      name="tag"
                      value={
                        formData.tag
                      }
                      onChange={
                        handleInputChange
                      }
                      options={[
                        'Residential',
                        'Commercial',
                        'Investment',
                        'All',
                      ]}
                      disabled={
                        status ===
                        'loading'
                      }
                    />

                  </div>

                </section>

                {/* =================================================
                    IMAGES
                    ================================================= */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

                    <div className="flex items-center justify-between gap-4">

                      <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-slate-100 p-2.5">
                          <ImageIcon className="h-5 w-5 text-slate-700" />
                        </div>

                        <div>
                          <h2 className="font-black">
                            Property Photos
                          </h2>

                          <p className="mt-1 text-xs text-slate-400">
                            Add up to {MAX_IMAGES} photos.
                          </p>
                        </div>

                      </div>

                      <span className="text-xs font-bold text-slate-400">
                        {images.length}/
                        {MAX_IMAGES}
                      </span>

                    </div>

                  </div>

                  <div className="p-5 sm:p-6">

                    {/* SOURCE SWITCH */}

                    <div className="mb-5 flex rounded-xl bg-slate-100 p-1">

                      <button
                        type="button"
                        onClick={() =>
                          setImageSource(
                            'upload'
                          )
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                          imageSource ===
                          'upload'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setImageSource(
                            'url'
                          )
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                          imageSource ===
                          'url'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        <LinkIcon className="h-4 w-4" />
                        Image URL
                      </button>

                    </div>

                    {imageSource ===
                    'upload' ? (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-slate-400 hover:bg-white">

                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <Upload className="h-6 w-6 text-slate-500" />
                        </div>

                        <p className="mt-4 text-sm font-bold text-slate-700">
                          Click to upload photos
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          JPG, PNG, WEBP up to 5MB each
                        </p>

                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          multiple
                          onChange={
                            handleImageUpload
                          }
                          className="hidden"
                          disabled={
                            status ===
                            'loading'
                          }
                        />

                      </label>
                    ) : (
                      <div className="flex gap-2">

                        <div className="relative flex-1">
                          <LinkIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                          <input
                            type="url"
                            value={
                              imageUrl
                            }
                            onChange={(
                              e
                            ) =>
                              setImageUrl(
                                e.target
                                  .value
                              )
                            }
                            placeholder="https://example.com/image.jpg"
                            className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={
                            addImageUrl
                          }
                          className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white"
                        >
                          Add
                        </button>

                      </div>
                    )}

                    {/* IMAGE PREVIEWS */}

                    {images.length >
                      0 && (
                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

                        {images.map(
                          (
                            image,
                            index
                          ) => (
                            <div
                              key={
                                image.id
                              }
                              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                            >

                              <img
                                src={
                                  image.url
                                }
                                alt={`Property photo ${
                                  index +
                                  1
                                }`}
                                className="h-full w-full object-cover"
                              />

                              {index ===
                                0 && (
                                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[9px] font-bold text-white">
                                  <Star className="h-3 w-3 fill-current" />
                                  COVER
                                </div>
                              )}

                              <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-0 transition group-hover:opacity-100">

                                {index !==
                                  0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCoverImage(
                                        image.id
                                      )
                                    }
                                    className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-white text-[9px] font-bold text-slate-700 shadow"
                                  >
                                    <Star className="h-3 w-3" />
                                    Cover
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeImage(
                                      image.id
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>

                              </div>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                </section>

                {/* =================================================
                    SUBMIT
                    ================================================= */}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    disabled={
                      status ===
                      'loading'
                    }
                    className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Clear
                  </button>

                  <button
                    type="submit"
                    disabled={
                      status ===
                        'loading' ||
                      !formData.title.trim() ||
                      !formData.location.trim() ||
                      !formData.price.trim() ||
                      images.length === 0
                    }
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {status ===
                    'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Property...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {editingId
                          ? 'Update Property'
                          : 'Publish Property'}
                      </>
                    )}
                  </button>

                </div>

              </form>

            </div>
          )}

          {/* =================================================
              SETTINGS
              ================================================= */}

          {activeSection ===
            'settings' && (
            <div className="mx-auto max-w-4xl space-y-6">

              <div>
                <p className="text-sm font-medium text-slate-400">
                  System
                </p>

                <h1 className="mt-1 text-3xl font-black">
                  Settings
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Administrator system information.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <Database className="h-6 w-6 text-slate-600" />

                  <h3 className="mt-4 font-black">
                    Database
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    PostgreSQL database is connected and synchronized with the current Prisma schema.
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Database Online
                  </div>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <ShieldCheck className="h-6 w-6 text-slate-600" />

                  <h3 className="mt-4 font-black">
                    Security
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Administrator authentication is required for property management operations.
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Authentication Active
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}