'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  Activity,
  Database,
  ShieldCheck,
  Settings,
  Loader2,
  UserRound,
  Building,
  Warehouse,
  ChevronRight,
} from 'lucide-react';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

type Status =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error';

type Section =
  | 'overview'
  | 'properties'
  | 'add'
  | 'settings';

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

interface FormData {
  title: string;
  category: string;
  propertyType: string;
  houseType: string;
  storey: string;
  tag: string;
  price: string;
  location: string;
  beds: string;
  baths: string;
  sqft: string;
}

const INITIAL_FORM: FormData = {
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
};

function requiresHouseDetails(
  category: string,
  propertyType: string
) {
  if (category === 'House & Lot') {
    return propertyType !== 'Lot Only Subdivision';
  }

  return (
    category === 'For Rent' &&
    propertyType === 'House For Rent'
  );
}

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
          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
        >
          <option value="">
            Select {label}
          </option>

          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-slate-100 p-3">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>

        <span className="text-2xl font-black text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeAccounts, setActiveAccounts] = useState(0);

  const [formData, setFormData] =
    useState<FormData>(INITIAL_FORM);

  const [images, setImages] =
    useState<ImageItem[]>([]);

  const [imageSource, setImageSource] =
    useState<'upload' | 'url'>('upload');

  const [imageUrl, setImageUrl] =
    useState('');

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
    useState<Section>('overview');

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const propertyTypeOptions = useMemo(() => {
    switch (formData.category) {
      case 'House & Lot':
        return HOUSE_LOT_TYPES;

      case 'Condominiums':
        return CONDOMINIUM_TYPES;

      case 'For Rent':
        return RENT_TYPES;

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
     FETCH PROPERTIES
  ========================================================= */

  const fetchProperties = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        '/api/properties',
        {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(
          'Failed to fetch properties.'
        );
      }

      const data = await response.json();

      setProperties(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.properties)
            ? data.properties
            : []
      );
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
    const fetchActiveAccounts = async () => {
      try {
        const response = await fetch(
          '/api/admin/agents',
          {
            method: 'GET',
            cache: 'no-store',
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error(
            'Failed to fetch agents.'
          );
        }

        const data = await response.json();

        const agents = Array.isArray(data?.agents)
          ? data.agents
          : [];

        const activeCount = agents.filter(
          (agent: { isActive?: boolean }) =>
            agent.isActive === true
        ).length;

        setActiveAccounts(activeCount);
      } catch (error) {
        console.error(
          'Failed to fetch active accounts:',
          error
        );

        setActiveAccounts(0);
      }
    };
  useEffect(() => {
  fetchProperties();
  fetchActiveAccounts();
}, []);

  /* =========================================================
     WELCOME
  ========================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const message =
          new SpeechSynthesisUtterance(
            'Welcome to BREA 88 Realty Admin Dashboard.'
          );

        message.rate = 0.9;
        message.pitch = 1;
        message.volume = 1;

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
     FORM CHANGE
  ========================================================= */

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'category') {
      setFormData((previous) => ({
        ...previous,
        category: value,
        propertyType: '',
        houseType: '',
        storey: '',
      }));

      return;
    }

    if (name === 'propertyType') {
      setFormData((previous) => ({
        ...previous,
        propertyType: value,
        houseType: requiresHouseDetails(
          formData.category,
          value
        )
          ? previous.houseType
          : '',
        storey: requiresHouseDetails(
          formData.category,
          value
        )
          ? previous.storey
          : '',
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

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

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(
          `${file.name} is not supported. Use JPG, JPEG, PNG, or WEBP.`
        );

        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(
          `${file.name} is larger than 5MB.`
        );

        return;
      }

      validImages.push({
        id: `${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
        source: 'upload',
      });
    });

    setImages((previous) => [
      ...previous,
      ...validImages,
    ]);

    e.target.value = '';
  };

  /* =========================================================
     ADD IMAGE URL
  ========================================================= */

  const addImageUrl = () => {
    const url = imageUrl.trim();

    if (!url) {
      alert('Please enter an image URL.');
      return;
    }

    if (images.length >= MAX_IMAGES) {
      alert(
        `You can only add ${MAX_IMAGES} pictures.`
      );

      return;
    }

    try {
      new URL(url);
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
        url,
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
      const image = previous.find(
        (item) => item.id === id
      );

      if (
        image?.source === 'upload' &&
        image.url.startsWith('blob:')
      ) {
        URL.revokeObjectURL(image.url);
      }

      return previous.filter(
        (item) => item.id !== id
      );
    });
  };

  /* =========================================================
     COVER IMAGE
  ========================================================= */

  const setCoverImage = (id: string) => {
    setImages((previous) => {
      const selected = previous.find(
        (image) => image.id === id
      );

      if (!selected) {
        return previous;
      }

      return [
        selected,
        ...previous.filter(
          (image) => image.id !== id
        ),
      ];
    });
  };

  /* =========================================================
     UPLOAD IMAGE TO BLOB
  ========================================================= */

  const uploadImageToBlob = async (
    file: File
  ): Promise<string> => {
    const body = new FormData();

    body.append('file', file);

    const response = await fetch(
      '/api/blob/upload',
      {
        method: 'POST',
        body,
        credentials: 'include',
      }
    );

    const data =
      await response
        .json()
        .catch(() => null);

    if (
      !response.ok ||
      !data?.success ||
      !data?.url
    ) {
      throw new Error(
        data?.message ||
          'Failed to upload image.'
      );
    }

    return data.url;
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    images.forEach((image) => {
      if (
        image.source === 'upload' &&
        image.url.startsWith('blob:')
      ) {
        URL.revokeObjectURL(image.url);
      }
    });

    setFormData(INITIAL_FORM);
    setImages([]);
    setImageUrl('');
    setImageSource('upload');
    setEditingId(null);
    setStatus('idle');
  };

  /* =========================================================
     EDIT PROPERTY
  ========================================================= */

  const handleEdit = (
    property: Property
  ) => {
    const propertyId =
      property.id !== undefined
        ? String(property.id)
        : property._id;

    if (!propertyId) {
      alert('Invalid property ID.');
      return;
    }

    setEditingId(propertyId);

    setFormData({
      title: property.title || '',
      category:
        property.category ||
        'House & Lot',
      propertyType:
        property.propertyType || '',
      houseType:
        property.houseType || '',
      storey:
        property.storey || '',
      tag:
        property.tag ||
        'Residential',
      price:
        property.price || '',
      location:
        property.location || '',
      beds:
        property.beds != null
          ? String(property.beds)
          : '',
      baths:
        property.baths != null
          ? String(property.baths)
          : '',
      sqft:
        property.sqft != null
          ? String(property.sqft)
          : '',
    });

    const propertyImages =
      property.images?.length
        ? property.images
        : property.image
          ? [property.image]
          : [];

    setImages(
      propertyImages.map(
        (url, index) => ({
          id: `existing-${Date.now()}-${index}`,
          url,
          source: 'url',
        })
      )
    );

    setImageSource('url');
    setStatus('idle');
    setActiveSection('add');
    setSidebarOpen(false);
  };

  /* =========================================================
     DELETE PROPERTY
  ========================================================= */

  const handleDelete = async (
    id: string | number
  ) => {
    if (!id) {
      alert('Invalid property ID.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this property?'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/properties?id=${encodeURIComponent(
          String(id)
        )}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to delete property.'
        );
      }

      await fetchProperties();
    } catch (error) {
      console.error(
        'Delete property error:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete property.'
      );
    }
  };

  /* =========================================================
     SUBMIT PROPERTY
  ========================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert(
        'Property title is required.'
      );
      return;
    }

    if (!formData.price.trim()) {
      alert(
        'Property price is required.'
      );
      return;
    }

    if (!formData.location.trim()) {
      alert(
        'Property location is required.'
      );
      return;
    }

    if (!formData.category) {
      alert(
        'Property category is required.'
      );
      return;
    }

    if (
      formData.category !==
        'For Sale by Owner' &&
      !formData.propertyType
    ) {
      alert(
        'Property type is required.'
      );
      return;
    }

    if (
      showHouseDetails &&
      (!formData.houseType ||
        !formData.storey)
    ) {
      alert(
        'House Type and Storey are required.'
      );
      return;
    }

    if (!images.length) {
      alert(
        'At least one property image is required.'
      );
      return;
    }

    setStatus('loading');

    try {
      const uploadedImages: string[] = [];

      for (const image of images) {
        if (image.source === 'url') {
          uploadedImages.push(image.url);
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

      if (!uploadedImages.length) {
        throw new Error(
          'No valid property images were uploaded.'
        );
      }

      const payload = {
        ...(editingId
          ? {
              id: Number(editingId),
            }
          : {}),

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

        tag:
          formData.tag ||
          'Residential',

        price:
          formData.price.trim(),

        location:
          formData.location.trim(),

        beds:
          formData.beds
            ? Number(formData.beds)
            : null,

        baths:
          formData.baths
            ? Number(formData.baths)
            : null,

        sqft:
          formData.sqft
            ? Number(formData.sqft)
            : null,

        image:
          uploadedImages[0],

        images:
          uploadedImages,
      };

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

          credentials: 'include',

          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to save property.'
        );
      }

      setStatus('success');

      await fetchProperties();

      window.setTimeout(() => {
        resetForm();
        setActiveSection(
          'properties'
        );
      }, 800);
    } catch (error) {
      console.error(
        'Save property error:',
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
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
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
      router.replace('/');
      router.refresh();
    }
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredProperties = useMemo(() => {
    const term =
      searchTerm
        .toLowerCase()
        .trim();

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
  }, [
    properties,
    searchTerm,
  ]);

  /* =========================================================
     STATS
  ========================================================= */

  const houseLotCount =
    properties.filter(
      (p) =>
        p.category ===
        'House & Lot'
    ).length;

  const condominiumCount =
    properties.filter(
      (p) =>
        p.category ===
        'Condominiums'
    ).length;

  const forRentCount =
    properties.filter(
      (p) =>
        p.category ===
        'For Rent'
    ).length;

  const ownerCount =
    properties.filter(
      (p) =>
        p.category ===
        'For Sale by Owner'
    ).length;

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigate = (
    section: Section
  ) => {
    setActiveSection(section);
    setSidebarOpen(false);

    if (section !== 'properties') {
      setSearchTerm('');
    }
  };

  /* =========================================================
     PRICE FORMAT
  ========================================================= */

  const formatPrice = (
    price: string
  ) => {
    const number =
      Number(
        String(price).replace(
          /[^0-9.]/g,
          ''
        )
      );

    if (Number.isNaN(number)) {
      return price;
    }

    return number.toLocaleString(
      'en-US'
    );
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>

          <p className="mt-5 text-sm font-bold text-white">
            Loading dashboard...
          </p>

          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">
            BREA 88 REALTY
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >

        {/* LOGO */}

        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">

          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white">

            <img
              src="/img/LOGO.png"
              alt="BREA 88 Realty"
              className="h-full w-full object-cover"
            />

          </div>

          <div>
            <p className="font-black">
              BREA 88
            </p>

            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
              Realty Admin
            </p>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">

          <button
            type="button"
            onClick={() =>
              navigate('overview')
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection ===
              'overview'
                ? 'bg-white text-slate-900'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </button>

          <button
            type="button"
            onClick={() =>
              navigate('properties')
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection ===
              'properties'
                ? 'bg-white text-slate-900'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Properties

            {properties.length > 0 && (
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeSection ===
                  'properties'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {properties.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              navigate('add')
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection ===
              'add'
                ? 'bg-white text-slate-900'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Add Property
          </button>

          <button
              type="button"
              onClick={() => {
                window.location.href = '/admin/agents';
              }}
              className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <UserRound className="h-5 w-5 text-slate-700" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Active Accounts
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Manage agent accounts
                  </p>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
            </button>
          
          <button
            type="button"
            onClick={() =>
              navigate('settings')
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection ===
              'settings'
                ? 'bg-white text-slate-900'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>

        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="border-t border-white/10 p-4">

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="lg:pl-72">

        {/* HEADER */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">

          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(true)
                }
                className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Administration
                </p>

                <h1 className="text-sm font-black sm:text-base">
                  BREA 88 Realty
                </h1>
              </div>

            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={fetchProperties}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
                title="Refresh properties"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <div className="hidden items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 sm:flex">

                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">
                  <UserRound className="h-3.5 w-3.5 text-white" />
                </div>

                <div>
                  <p className="text-xs font-bold">
                    Administrator
                  </p>

                  <p className="text-[9px] text-slate-400">
                    Secure Session
                  </p>
                </div>

              </div>

            </div>

          </div>

        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <main className="p-4 sm:p-6 lg:p-8">

          {/* ===================================================
              OVERVIEW
          =================================================== */}

          {activeSection ===
            'overview' && (
            <div className="mx-auto max-w-7xl space-y-6">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                <div>

                  <p className="text-sm font-medium text-slate-400">
                    Dashboard
                  </p>

                  <h1 className="mt-1 text-3xl font-black">
                    Overview
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Manage your BREA 88 Realty property marketplace.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('add')
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Property
                </button>

              </div>

              {/* STATS */}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                  icon={UserRound}
                  label="Active Accounts"
                  value={activeAccounts}
                />

                <StatCard
                  icon={Building2}
                  label="House & Lot"
                  value={houseLotCount}
                />

                <StatCard
                  icon={Building}
                  label="Condominiums"
                  value={condominiumCount}
                />

                <StatCard
                  icon={Warehouse}
                  label="For Rent"
                  value={forRentCount}
                />

                <StatCard
                  icon={UserRound}
                  label="Owner Listings"
                  value={ownerCount}
                />

              </div>

              <div className="grid gap-6 lg:grid-cols-3">

                {/* RECENT */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

                  <div className="flex items-center justify-between">

                    <div>

                      <h2 className="font-black">
                        Recent Properties
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Latest listings in the marketplace.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate('properties')
                      }
                      className="text-xs font-bold text-slate-500 hover:text-slate-900"
                    >
                      View all
                    </button>

                  </div>

                  <div className="mt-5 space-y-3">

                    {properties
                      .slice(0, 5)
                      .map((property) => (

                        <div
                          key={
                            property.id ??
                            property._id
                          }
                          className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                        >

                          <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">

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
                                <ImageIcon className="h-5 w-5 text-slate-300" />
                              </div>
                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-sm font-bold">
                              {
                                property.title
                              }
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                              <MapPin className="h-3 w-3" />
                              {
                                property.location
                              }
                            </p>

                          </div>

                          <p className="hidden text-sm font-black sm:block">
                            ₱{' '}
                            {formatPrice(
                              property.price
                            )}
                          </p>

                        </div>

                      ))}

                    {!properties.length && (
                      <div className="py-10 text-center">

                        <Building2 className="mx-auto h-8 w-8 text-slate-200" />

                        <p className="mt-3 text-sm font-bold text-slate-400">
                          No properties yet.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            navigate('add')
                          }
                          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                        >
                          Add your first property
                        </button>

                      </div>
                    )}

                  </div>

                </div>

                {/* SYSTEM STATUS */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                    <Activity className="h-5 w-5 text-slate-700" />
                  </div>

                  <h2 className="mt-5 font-black">
                    System Status
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your property management system is connected to the PostgreSQL database.
                  </p>

                  <div className="mt-6 space-y-3">

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

                      <span className="text-xs font-semibold text-slate-500">
                        Database
                      </span>

                      <span className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Online
                      </span>

                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

                      <span className="text-xs font-semibold text-slate-500">
                        Authentication
                      </span>

                      <span className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Active
                      </span>

                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

                      <span className="text-xs font-semibold text-slate-500">
                        Properties
                      </span>

                      <span className="text-xs font-bold text-slate-700">
                        {properties.length}
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ===================================================
              PROPERTIES
          =================================================== */}

          {activeSection ===
            'properties' && (
            <div className="mx-auto max-w-7xl space-y-6">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                <div>

                  <p className="text-sm font-medium text-slate-400">
                    Property Management
                  </p>

                  <h1 className="mt-1 text-3xl font-black">
                    Properties
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Manage all marketplace property listings.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('add')
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Property
                </button>

              </div>

              {/* SEARCH */}

              <div className="relative">

                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  placeholder="Search properties..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />

              </div>

              {!filteredProperties.length ? (

                <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">

                  <Building2 className="mx-auto h-10 w-10 text-slate-200" />

                  <h3 className="mt-4 font-black">
                    No properties found
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Try another search or add a new property.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('add')
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
                          key={propertyId}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                        >

                          {/* IMAGE */}

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
                              <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
                                {
                                  property.category
                                }
                              </div>
                            )}

                          </div>

                          {/* DETAILS */}

                          <div className="p-5">

                            <h3 className="line-clamp-1 font-black">
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
                              <span className="mt-3 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                {
                                  property.propertyType
                                }
                              </span>
                            )}

                            {property.houseType && (
                              <p className="mt-2 text-xs text-slate-500">
                                <b>House:</b>{' '}
                                {
                                  property.houseType
                                }
                              </p>
                            )}

                            {property.storey && (
                              <p className="mt-1 text-xs text-slate-500">
                                <b>Storey:</b>{' '}
                                {
                                  property.storey
                                }
                              </p>
                            )}

                            <div className="mt-4 flex items-center justify-between">

                              <p className="text-lg font-black">
                                ₱{' '}
                                {formatPrice(
                                  property.price
                                )}
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
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
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
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50"
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

          {/* ===================================================
              ADD / EDIT PROPERTY
          =================================================== */}

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
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600"
                  >
                    <X className="h-4 w-4" />
                    Cancel Edit
                  </button>
                )}

              </div>

              {/* STATUS */}

              {status === 'success' && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">

                  <CheckCircle2 className="h-5 w-5" />

                  Property saved successfully.

                </div>
              )}

              {status === 'error' && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">

                  <AlertCircle className="h-5 w-5" />

                  Something went wrong while saving the property.

                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                {/* CLASSIFICATION */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

                    <div className="flex items-center gap-3">

                      <div className="rounded-xl bg-slate-100 p-2.5">
                        <Building2 className="h-5 w-5 text-slate-700" />
                      </div>

                      <div>

                        <h2 className="font-black">
                          Property Classification
                        </h2>

                        <p className="mt-1 text-xs text-slate-400">
                          Select how this property should appear.
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
                        status === 'loading'
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
                          status === 'loading'
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
                            status === 'loading'
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
                            status === 'loading'
                          }
                        />

                      </>
                    )}

                  </div>

                </section>

                {/* BASIC INFORMATION */}

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

                    {/* TITLE */}

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
                          status === 'loading'
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
                      />

                    </div>

                    {/* PRICE */}

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
                            status === 'loading'
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
                        />

                      </div>

                    </div>

                    {/* LOCATION */}

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
                            status === 'loading'
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
                        />

                      </div>

                    </div>

                    {/* BEDROOMS */}

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
                                status === 'loading'
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />

                          </div>

                        </div>

                        {/* BATHROOMS */}

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
                                status === 'loading'
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />

                          </div>

                        </div>

                      </>
                    )}

                    {/* AREA */}

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
                            status === 'loading'
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />

                      </div>

                    </div>

                    {/* LEGACY TAG */}


                  </div>

                </section>

                {/* IMAGES */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

                    <div className="flex items-center gap-3">

                      <div className="rounded-xl bg-slate-100 p-2.5">
                        <ImageIcon className="h-5 w-5" />
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
                      {images.length}/{MAX_IMAGES}
                    </span>

                  </div>

                  <div className="p-5 sm:p-6">

                    {/* SOURCE SELECTOR */}

                    <div className="mb-5 flex rounded-xl bg-slate-100 p-1">

                      <button
                        type="button"
                        onClick={() =>
                          setImageSource(
                            'upload'
                          )
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold ${
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
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold ${
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

                    {/* UPLOAD */}

                    {imageSource ===
                    'upload' ? (

                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center hover:border-slate-400 hover:bg-white">

                        <div className="rounded-xl bg-white p-3 shadow-sm">

                          <Upload className="h-6 w-6 text-slate-500" />

                        </div>

                        <p className="mt-4 text-sm font-bold">
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
                            status === 'loading' ||
                            images.length >=
                              MAX_IMAGES
                          }
                        />

                      </label>

                    ) : (

                      <div className="flex flex-col gap-2 sm:flex-row">

                        <div className="relative flex-1">

                          <LinkIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                          <input
                            type="url"
                            value={
                              imageUrl
                            }
                            onChange={(e) =>
                              setImageUrl(
                                e.target.value
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

                    {/* IMAGE GRID */}

                    {images.length > 0 && (

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
                                alt={`Property photo ${index + 1}`}
                                className="h-full w-full object-cover"
                              />

                              {/* COVER */}

                              {index === 0 && (
                                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[9px] font-bold text-white">

                                  <Star className="h-3 w-3 fill-current" />

                                  COVER

                                </div>
                              )}

                              {/* ACTIONS */}

                              <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">

                                {index !== 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCoverImage(
                                        image.id
                                      )
                                    }
                                    className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-white text-[9px] font-bold shadow"
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
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white"
                                  aria-label="Remove image"
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

                {/* SUBMIT */}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={
                      status === 'loading'
                    }
                    className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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
                      !images.length
                    }
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
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

          {/* ===================================================
              SETTINGS
          =================================================== */}

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

                {/* DATABASE */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <Database className="h-6 w-6 text-slate-600" />

                  <h3 className="mt-4 font-black">
                    Database
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    PostgreSQL database is connected and synchronized with the current Prisma schema.
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-600">

                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                    Database Online

                  </div>

                </div>

                {/* SECURITY */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <ShieldCheck className="h-6 w-6 text-slate-600" />

                  <h3 className="mt-4 font-black">
                    Security
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Administrator authentication is required for property management operations.
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-600">

                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                    Authentication Active

                  </div>

                </div>

              </div>

              {/* PROPERTY SUMMARY */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-3">

                  <Building2 className="h-5 w-5 text-slate-600" />

                  <div>

                    <h3 className="font-black">
                      Property Summary
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Current marketplace inventory.
                    </p>

                  </div>

                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-4">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-black">
                      {houseLotCount}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      House & Lot
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-black">
                      {condominiumCount}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      Condominiums
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-black">
                      {forRentCount}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      For Rent
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-black">
                      {ownerCount}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      Owner Listings
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

        </main>

      </div>

    </div>
  );
}

