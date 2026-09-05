'use client';

import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  UserPlus,
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

const STOREY_OPTIONS = ['1', '2', '3 or more'];

type Status = 'idle' | 'loading' | 'success' | 'error';

type Section = 'overview' | 'properties' | 'add' | 'settings';

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  source: 'upload' | 'url';
}

interface Property {
  id?: number | string;
  _id?: number | string;
  title: string;
  tag?: string | null;
  price: string | number;
  location: string;
  image?: string | null;
  images?: string[] | null;
  category?: string | null;
  propertyType?: string | null;
  houseType?: string | null;
  storey?: string | number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  propertyType: string,
): boolean {
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
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  options: string[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="text-sm font-semibold text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-blue-600">*</span>
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
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">Select {label}</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  description,
  accent = 'blue',
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  description?: string;
  accent?: 'blue' | 'gold' | 'green' | 'violet';
}) {
  const accentClasses = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    gold: 'bg-amber-50 text-amber-600 ring-amber-100',
    green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-50/40 blur-2xl transition group-hover:bg-blue-100/60" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${accentClasses[accent]}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeAccounts, setActiveAccounts] = useState(0);

  const [formData, setFormData] =
    useState<FormData>(INITIAL_FORM);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [imageSource, setImageSource] = useState<'upload' | 'url'>(
    'upload',
  );
  const [imageUrl, setImageUrl] = useState('');

  const [status, setStatus] = useState<Status>('idle');

  const [properties, setProperties] = useState<Property[]>([]);
  const [editingId, setEditingId] = useState<
    number | string | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeSection, setActiveSection] =
    useState<Section>('overview');

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const propertyTypeOptions = useMemo(() => {
    switch (formData.category) {
      case 'House & Lot':
        return HOUSE_LOT_TYPES;

      case 'Condominiums':
        return CONDOMINIUM_TYPES;

      case 'For Rent':
        return RENT_TYPES;

      case 'For Sale by Owner':
        return [
          'House & Lot',
          'Lot Only',
          'Condominium',
          'Commercial Property',
        ];

      default:
        return [];
    }
  }, [formData.category]);

  const showHouseDetails = requiresHouseDetails(
    formData.category,
    formData.propertyType,
  );

  async function fetchProperties() {
    try {
      const response = await fetch('/api/properties', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();

      const propertyList = Array.isArray(data)
        ? data
        : Array.isArray(data?.properties)
          ? data.properties
          : [];

      setProperties(propertyList);
    } catch (error) {
      console.error('Fetch properties error:', error);
      setProperties([]);
    }
  }

  async function fetchActiveAccounts() {
    try {
      const response = await fetch('/api/admin/agents', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const accounts = Array.isArray(data)
        ? data
        : Array.isArray(data?.agents)
          ? data.agents
          : [];

      const active = accounts.filter(
        (agent: { isActive?: boolean }) =>
          agent.isActive === true,
      ).length;

      setActiveAccounts(active);
    } catch (error) {
      console.error('Fetch active accounts error:', error);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      await Promise.all([
        fetchProperties(),
        fetchActiveAccounts(),
      ]);

      if (mounted) {
        setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.cancel();

        const message = new SpeechSynthesisUtterance(
          'Welcome to BREA 88 Realty Admin Dashboard.',
        );

        message.rate = 0.95;
        message.pitch = 1;

        window.speechSynthesis.speak(message);
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);

      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function handleInputChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    if (name === 'category') {
      setFormData((current) => ({
        ...current,
        category: value,
        propertyType: '',
        houseType: '',
        storey: '',
      }));

      return;
    }

    if (name === 'propertyType') {
      const shouldShowHouseDetails = requiresHouseDetails(
        formData.category,
        value,
      );

      setFormData((current) => ({
        ...current,
        propertyType: value,
        houseType: shouldShowHouseDetails
          ? current.houseType
          : '',
        storey: shouldShowHouseDetails
          ? current.storey
          : '',
      }));

      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    if (images.length + files.length > MAX_IMAGES) {
      alert(`You can upload up to ${MAX_IMAGES} images.`);
      event.target.value = '';
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    const newImages: ImageItem[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert(
          `${file.name} is not a supported image type. Use JPG, JPEG, PNG, or WEBP.`,
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(
          `${file.name} is larger than 5MB and cannot be uploaded.`,
        );
        continue;
      }

      newImages.push({
        id: `${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
        source: 'upload',
      });
    }

    setImages((current) => [...current, ...newImages]);

    event.target.value = '';
  }

  function addImageUrl() {
    const trimmedUrl = imageUrl.trim();

    if (!trimmedUrl) {
      return;
    }

    if (images.length >= MAX_IMAGES) {
      alert(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      alert('Please enter a valid image URL.');
      return;
    }

    setImages((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random()}`,
        url: trimmedUrl,
        source: 'url',
      },
    ]);

    setImageUrl('');
  }

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === id);

      if (image?.source === 'upload') {
        URL.revokeObjectURL(image.url);
      }

      return current.filter((item) => item.id !== id);
    });
  }

  function setCoverImage(id: string) {
    setImages((current) => {
      const selected = current.find((item) => item.id === id);

      if (!selected) {
        return current;
      }

      return [
        selected,
        ...current.filter((item) => item.id !== id),
      ];
    });
  }

  async function uploadImageToBlob(file: File) {
    const body = new FormData();
    body.append('file', file);

    const response = await fetch('/api/blob/upload', {
      method: 'POST',
      body,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok || !data?.success || !data?.url) {
      throw new Error(
        data?.message || 'Failed to upload image.',
      );
    }

    return data.url as string;
  }

  function resetForm() {
    images.forEach((image) => {
      if (image.source === 'upload') {
        URL.revokeObjectURL(image.url);
      }
    });

    setFormData(INITIAL_FORM);
    setImages([]);
    setImageUrl('');
    setImageSource('upload');
    setStatus('idle');
    setEditingId(null);
  }

  function editProperty(property: Property) {
    const id = property.id ?? property._id;

    if (id === undefined || id === null) {
      return;
    }

    setEditingId(id);

    setFormData({
      title: property.title || '',
      category: property.category || 'House & Lot',
      propertyType: property.propertyType || '',
      houseType: property.houseType || '',
      storey:
        property.storey !== null &&
        property.storey !== undefined
          ? String(property.storey)
          : '',
      tag: property.tag || 'Residential',
      price:
        property.price !== null &&
        property.price !== undefined
          ? String(property.price)
          : '',
      location: property.location || '',
      beds:
        property.beds !== null &&
        property.beds !== undefined
          ? String(property.beds)
          : '',
      baths:
        property.baths !== null &&
        property.baths !== undefined
          ? String(property.baths)
          : '',
      sqft:
        property.sqft !== null &&
        property.sqft !== undefined
          ? String(property.sqft)
          : '',
    });

    const existingImages =
      property.images && property.images.length
        ? property.images
        : property.image
          ? [property.image]
          : [];

    setImages(
      existingImages.map((url, index) => ({
        id: `existing-${index}-${Date.now()}`,
        url,
        source: 'url',
      })),
    );

    setImageSource('url');
    setStatus('idle');
    setActiveSection('add');
    setSidebarOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function deleteProperty(
    property: Property,
  ) {
    const id = property.id ?? property._id;

    if (id === undefined || id === null) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${property.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/properties?id=${encodeURIComponent(String(id))}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || 'Failed to delete property.',
        );
      }

      await fetchProperties();
    } catch (error) {
      console.error('Delete property error:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete property.',
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter the property title.');
      return;
    }

    if (!formData.price.trim()) {
      alert('Please enter the property price.');
      return;
    }

    if (!formData.location.trim()) {
      alert('Please enter the property location.');
      return;
    }

    if (!formData.category) {
      alert('Please select a property category.');
      return;
    }

    if (!formData.propertyType) {
      alert('Please select a property type.');
      return;
    }

    if (
      showHouseDetails &&
      !formData.houseType.trim()
    ) {
      alert('Please select the house type.');
      return;
    }

    if (
      showHouseDetails &&
      !formData.storey.trim()
    ) {
      alert('Please select the number of storeys.');
      return;
    }

    if (!images.length) {
      alert('Please add at least one property image.');
      return;
    }

    setStatus('loading');

    try {
      const uploadedImageUrls: string[] = [];

      for (const image of images) {
        if (image.source === 'upload' && image.file) {
          const uploadedUrl = await uploadImageToBlob(
            image.file,
          );

          uploadedImageUrls.push(uploadedUrl);
        } else {
          uploadedImageUrls.push(image.url);
        }
      }

      if (!uploadedImageUrls.length) {
        throw new Error(
          'No valid property images were found.',
        );
      }

      const payload = {
        ...(editingId !== null
          ? { id: editingId }
          : {}),
        title: formData.title.trim(),
        category: formData.category,
        propertyType: formData.propertyType,
        houseType: showHouseDetails
          ? formData.houseType || null
          : null,
        storey: showHouseDetails
          ? formData.storey || null
          : null,
        tag: formData.tag || 'Residential',
        price: formData.price.trim(),
        location: formData.location.trim(),
        beds: formData.beds
          ? Number(formData.beds)
          : null,
        baths: formData.baths
          ? Number(formData.baths)
          : null,
        sqft: formData.sqft
          ? Number(formData.sqft)
          : null,
        image: uploadedImageUrls[0],
        images: uploadedImageUrls,
      };

      const response = await fetch('/api/properties', {
        method: editingId !== null ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to ${
              editingId !== null ? 'update' : 'create'
            } property.`,
        );
      }

      setStatus('success');

      await fetchProperties();

      window.setTimeout(() => {
        resetForm();
        setActiveSection('properties');
      }, 800);
    } catch (error) {
      console.error('Save property error:', error);
      setStatus('error');

      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the property.',
      );
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.replace('/');
      router.refresh();
    }
  }

  const filteredProperties = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return properties;
    }

    return properties.filter((property) => {
      const values = [
        property.title,
        property.location,
        property.tag,
        property.category,
        property.propertyType,
        property.houseType,
        property.price,
      ];

      return values.some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(term),
      );
    });
  }, [properties, searchTerm]);

  const houseLotCount = properties.filter(
    (property) => property.category === 'House & Lot',
  ).length;

  const condominiumCount = properties.filter(
    (property) => property.category === 'Condominiums',
  ).length;

  const forRentCount = properties.filter(
    (property) => property.category === 'For Rent',
  ).length;

  const ownerCount = properties.filter(
    (property) =>
      property.category === 'For Sale by Owner',
  ).length;

  function navigate(section: Section) {
    setActiveSection(section);
    setSidebarOpen(false);

    if (section !== 'properties') {
      setSearchTerm('');
    }

    if (section === 'add' && editingId === null) {
      setStatus('idle');
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function formatPrice(price: string | number) {
    const numeric = String(price || '')
      .replace(/[^0-9.]/g, '');

    if (!numeric) {
      return '₱0';
    }

    const amount = Number(numeric);

    if (Number.isNaN(amount)) {
      return `₱${price}`;
    }

    return `₱${amount.toLocaleString('en-US')}`;
  }

  function getPropertyImage(property: Property) {
    if (property.images?.length) {
      return property.images[0];
    }

    return property.image || '/img/background.png';
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030b1c]">
        <div className="relative flex flex-col items-center text-center">
          <div className="absolute h-32 w-32 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
            <Loader2
              size={27}
              className="animate-spin text-blue-400"
            />
          </div>

          <p className="mt-6 text-sm font-semibold text-white">
            Loading dashboard...
          </p>

          <p className="mt-1 text-xs text-slate-500">
            BREA 88 REALTY
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-indigo-400/5 blur-3xl" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#030b1c] text-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        {/* Sidebar glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-black/20">
                <img
                  src="/img/LOGO.png"
                  alt="BREA 88 Realty"
                  className="h-full w-full object-contain p-1.5"
                />
              </div>

              <div>
                <p className="text-[15px] font-bold tracking-wide">
                  <span className="text-black">BREA</span>
                  <span className="text-blue-400">88</span>
                </p>

                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  Realty Admin
                </p>
              </div>
            </div>

            <div className="mt-5 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/70 to-transparent" />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Workspace
            </p>

            <nav className="space-y-1.5">
                  {/* Overview */}
                  <button
                    type="button"
                    onClick={() => navigate('overview')}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                      activeSection === 'overview'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard
                      size={18}
                      className={
                        activeSection === 'overview'
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-blue-400'
                      }
                    />

                    <span className="flex-1">Overview</span>
                  </button>

                  {/* Properties */}
                  <button
                    type="button"
                    onClick={() => navigate('properties')}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                      activeSection === 'properties'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-blue-400'
                    }`}
                  >
                    <Building2
                      size={18}
                      className={
                        activeSection === 'properties'
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-blue-400'
                      }
                    />

                    <span className="flex-1">Properties</span>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        activeSection === 'properties'
                          ? 'bg-white/15 text-white'
                          : 'bg-white/5 text-slate-500'
                      }`}
                    >
                      {properties.length}
                    </span>
                  </button>

                  {/* Add Property */}
                  <button
                    type="button"
                    onClick={() => navigate('add')}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                      activeSection === 'add'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-blue-400'
                    }`}
                  >
                    <PlusCircle
                      size={18}
                      className={
                        activeSection === 'add'
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-blue-400'
                      }
                    />

                    <span>Add Property</span>
                  </button>

                  {/* Active Accounts */}
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      router.push('/admin/agents');
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-emerald-400"
                  >
                    <UserRound
                      size={18}
                      className="text-slate-500 group-hover:text-emerald-400"
                    />

                    <span className="flex-1">Active Accounts</span>

                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      {activeAccounts}
                    </span>
                  </button>
                </nav>

            <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              System
            </p>

            <nav>
              <button
                onClick={() => navigate('settings')}
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                  activeSection === 'settings'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-blue-400'
                }`}
              >
                <Settings
                  size={18}
                  className={
                    activeSection === 'settings'
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-blue-400'
                  }
                />

                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* User / Logout */}
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
                <ShieldCheck size={18} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-black">
                  Administrator
                </p>

                <p className="truncate text-[10px] text-slate-500">
                  Secure session
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="min-h-screen lg:pl-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                  Administration
                </p>

                <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                  BREA 88 Realty
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={async () => {
                  setLoading(true);

                  await Promise.all([
                    fetchProperties(),
                    fetchActiveAccounts(),
                  ]);

                  setLoading(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                title="Refresh"
              >
                <RefreshCw size={17} />
              </button>

              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>

                <span className="text-xs font-semibold text-slate-600">
                  Secure Session
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* OVERVIEW */}
          {activeSection === 'overview' && (
            <section className="space-y-7">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    <span className="h-px w-6 bg-[#c9a96e]" />
                    Control Center
                  </div>

                  <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Dashboard
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Manage your BREA 88 Realty property
                    marketplace and monitor your platform
                    activity from one place.
                  </p>
                </div>

                <button
                  onClick={() => navigate('add')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  <PlusCircle size={18} />
                  Add Property
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                  icon={UserRound}
                  value={activeAccounts}
                  label="Active Accounts"
                  description="Agent & Broker accounts"
                  accent="green"
                />

                <StatCard
                  icon={Home}
                  value={houseLotCount}
                  label="House & Lot"
                  description="Property listings"
                  accent="blue"
                />

                <StatCard
                  icon={Building2}
                  value={condominiumCount}
                  label="Condominiums"
                  description="Property listings"
                  accent="violet"
                />

                <StatCard
                  icon={Warehouse}
                  value={forRentCount}
                  label="For Rent"
                  description="Rental listings"
                  accent="gold"
                />

                <StatCard
                  icon={Star}
                  value={ownerCount}
                  label="Owner Listings"
                  description="Direct owner listings"
                  accent="blue"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                {/* Recent Properties */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Recent Properties
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Latest listings added to the marketplace
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        navigate('properties')
                      }
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View all
                    </button>
                  </div>

                  {properties.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Building2 size={24} />
                      </div>

                      <p className="mt-4 font-semibold text-slate-800">
                        No properties yet
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Add your first property listing.
                      </p>

                      <button
                        onClick={() => navigate('add')}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"
                      >
                        <PlusCircle size={16} />
                        Add Property
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {properties.slice(0, 5).map(
                        (property) => (
                          <div
                            key={
                              property.id ??
                              property._id
                            }
                            className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                          >
                            <img
                              src={getPropertyImage(
                                property,
                              )}
                              alt={property.title}
                              className="h-16 w-20 rounded-xl object-cover"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {property.title}
                              </p>

                              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin size={12} />
                                <span className="truncate">
                                  {property.location}
                                </span>
                              </div>
                            </div>

                            <div className="hidden text-right sm:block">
                              <p className="text-sm font-bold text-blue-600">
                                {formatPrice(
                                  property.price,
                                )}
                              </p>

                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                {property.category ||
                                  'Property'}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* System Status */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Activity size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        System Status
                      </h3>

                      <p className="text-xs text-slate-500">
                        Platform health overview
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Database
                          size={17}
                          className="text-slate-400"
                        />

                        <span className="text-sm font-semibold text-slate-700">
                          Database
                        </span>
                      </div>

                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <CheckCircle2 size={14} />
                        Online
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ShieldCheck
                          size={17}
                          className="text-slate-400"
                        />

                        <span className="text-sm font-semibold text-slate-700">
                          Authentication
                        </span>
                      </div>

                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <CheckCircle2 size={14} />
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Building2
                          size={17}
                          className="text-slate-400"
                        />

                        <span className="text-sm font-semibold text-slate-700">
                          Properties
                        </span>
                      </div>

                      <span className="text-xs font-bold text-slate-700">
                        {properties.length} listings
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-[#c9a96e]/20 bg-[#c9a96e]/5 p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-[#a9874f]">
                        <Star size={15} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          BREA 88 Realty
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          Service with a Heart.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* PROPERTIES */}
          {activeSection === 'properties' && (
            <section className="space-y-6">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    <span className="h-px w-6 bg-[#c9a96e]" />
                    Marketplace
                  </div>

                  <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                    Properties
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Manage all property listings from the
                    admin panel.
                  </p>
                </div>

                <button
                  onClick={() => navigate('add')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  <PlusCircle size={18} />
                  Add Property
                </button>
              </div>

              {/* Search */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search properties by title, location, category, type..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Search size={25} />
                  </div>

                  <h3 className="mt-5 font-bold text-slate-900">
                    No properties found
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    {searchTerm
                      ? 'Try changing your search keywords.'
                      : 'Your property listings will appear here once you add them.'}
                  </p>

                  {!searchTerm && (
                    <button
                      onClick={() => navigate('add')}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white"
                    >
                      <PlusCircle size={16} />
                      Add Property
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProperties.map(
                    (property) => {
                      const propertyId =
                        property.id ?? property._id;

                      return (
                        <article
                          key={propertyId}
                          className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                            <img
                              src={getPropertyImage(
                                property,
                              )}
                              alt={property.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-80" />

                            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur">
                                {property.category ||
                                  'Property'}
                              </span>
                            </div>

                            {property.tag && (
                              <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                                {property.tag}
                              </span>
                            )}
                          </div>

                          <div className="p-5">
                            <h3 className="line-clamp-1 text-base font-bold text-slate-900">
                              {property.title}
                            </h3>

                            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin size={14} />
                              <span className="line-clamp-1">
                                {property.location}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {property.propertyType && (
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                                  {property.propertyType}
                                </span>
                              )}

                              {property.houseType && (
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                                  {property.houseType}
                                </span>
                              )}

                              {property.storey && (
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                                  {property.storey} storey
                                </span>
                              )}
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-4">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <BedDouble
                                  size={14}
                                  className="text-blue-500"
                                />
                                <span>
                                  {property.beds ??
                                    '—'}{' '}
                                  Beds
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Bath
                                  size={14}
                                  className="text-blue-500"
                                />
                                <span>
                                  {property.baths ??
                                    '—'}{' '}
                                  Baths
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Maximize
                                  size={14}
                                  className="text-blue-500"
                                />
                                <span>
                                  {property.sqft
                                    ? `${property.sqft.toLocaleString()}`
                                    : '—'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex items-end justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Listing Price
                                </p>

                                <p className="mt-1 text-lg font-bold text-blue-600">
                                  {formatPrice(
                                    property.price,
                                  )}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    editProperty(
                                      property,
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                  title="Edit property"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  onClick={() =>
                                    deleteProperty(
                                      property,
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  title="Delete property"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          )}

          {/* ADD / EDIT */}
          {activeSection === 'add' && (
            <section className="mx-auto max-w-5xl space-y-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    <span className="h-px w-6 bg-[#c9a96e]" />
                    Property Management
                  </div>

                  <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                    {editingId !== null
                      ? 'Edit Property'
                      : 'Add Property'}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {editingId !== null
                      ? 'Update the property listing information below.'
                      : 'Create a new property listing for the marketplace.'}
                  </p>
                </div>

                {editingId !== null && (
                  <button
                    onClick={() => {
                      resetForm();
                      navigate('properties');
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <X size={16} />
                    Cancel Edit
                  </button>
                )}
              </div>

              {status === 'success' && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={19} />
                  Property saved successfully.
                </div>
              )}

              {status === 'error' && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                  <AlertCircle size={19} />
                  Something went wrong while saving the property.
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Classification */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Building2 size={19} />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          Property Classification
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Define the property category and
                          classification.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
                    <SelectField
                      label="Category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      options={CATEGORY_OPTIONS}
                      required
                    />

                    <SelectField
                      label="Property Type"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      options={propertyTypeOptions}
                      required
                    />

                    <SelectField
                      label="Listing Tag"
                      name="tag"
                      value={formData.tag}
                      onChange={handleInputChange}
                      options={[
                        'Residential',
                        'Commercial',
                        'Investment',
                        'All',
                      ]}
                      required
                    />

                    {showHouseDetails && (
                      <>
                        <SelectField
                          label="House Type"
                          name="houseType"
                          value={formData.houseType}
                          onChange={handleInputChange}
                          options={HOUSE_TYPES}
                          required
                        />

                        <SelectField
                          label="Storey"
                          name="storey"
                          value={formData.storey}
                          onChange={handleInputChange}
                          options={STOREY_OPTIONS}
                          required
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Information */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Home size={19} />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          Property Information
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Enter the basic details shown to buyers.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 p-5 sm:p-6">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label
                          htmlFor="title"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Property Title
                          <span className="ml-1 text-blue-600">
                            *
                          </span>
                        </label>

                        <input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g. Premium Residential Villa"
                          required
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="price"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Price
                          <span className="ml-1 text-blue-600">
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
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="12,500,000"
                            required
                            inputMode="decimal"
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="location"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Location
                        <span className="ml-1 text-blue-600">
                          *
                        </span>
                      </label>

                      <div className="relative">
                        <MapPin
                          size={17}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="e.g. Canduman, Mandaue City"
                          required
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-3">
                      {showHouseDetails && (
                        <>
                          <div className="space-y-2">
                            <label
                              htmlFor="beds"
                              className="text-sm font-semibold text-slate-700"
                            >
                              Bedrooms
                            </label>

                            <div className="relative">
                              <BedDouble
                                size={17}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                              />

                              <input
                                id="beds"
                                name="beds"
                                type="number"
                                min="0"
                                value={formData.beds}
                                onChange={handleInputChange}
                                placeholder="4"
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="baths"
                              className="text-sm font-semibold text-slate-700"
                            >
                              Bathrooms
                            </label>

                            <div className="relative">
                              <Bath
                                size={17}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                              />

                              <input
                                id="baths"
                                name="baths"
                                type="number"
                                min="0"
                                value={formData.baths}
                                onChange={handleInputChange}
                                placeholder="3"
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <div
                        className={
                          showHouseDetails
                            ? ''
                            : 'sm:col-span-3'
                        }
                      >
                        <label
                          htmlFor="sqft"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Floor / Lot Area
                        </label>

                        <div className="relative mt-2">
                          <Maximize
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            id="sqft"
                            name="sqft"
                            type="number"
                            min="0"
                            value={formData.sqft}
                            onChange={handleInputChange}
                            placeholder="250"
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <ImageIcon size={19} />
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900">
                            Property Photos
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Add up to {MAX_IMAGES} photos. The
                            first image is the cover.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                        {images.length}/{MAX_IMAGES}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    {/* Image source tabs */}
                    <div className="mb-5 inline-flex rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() =>
                          setImageSource('upload')
                        }
                        className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                          imageSource === 'upload'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Upload size={15} />
                        Upload
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setImageSource('url')
                        }
                        className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                          imageSource === 'url'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <LinkIcon size={15} />
                        Image URL
                      </button>
                    </div>

                    {imageSource === 'upload' ? (
                      <label
                        className={`group flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 text-center transition hover:border-blue-300 hover:bg-blue-50/40 ${
                          images.length >= MAX_IMAGES
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }`}
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm transition group-hover:scale-105">
                          <Upload size={23} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-slate-700">
                          Click to upload property photos
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          PNG, JPG, JPEG or WEBP • Max 5MB
                          each
                        </p>

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={
                            images.length >= MAX_IMAGES
                          }
                        />
                      </label>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                          <LinkIcon
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            type="url"
                            value={imageUrl}
                            onChange={(event) =>
                              setImageUrl(
                                event.target.value,
                              )
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                addImageUrl();
                              }
                            }}
                            placeholder="https://example.com/property-image.jpg"
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={addImageUrl}
                          disabled={
                            images.length >= MAX_IMAGES
                          }
                          className="h-12 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Add Image
                        </button>
                      </div>
                    )}

                    {images.length > 0 && (
                      <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                            Selected Images
                          </p>

                          <p className="text-[11px] text-slate-400">
                            First image = cover
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                          {images.map(
                            (image, index) => (
                              <div
                                key={image.id}
                                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                              >
                                <img
                                  src={image.url}
                                  alt={`Property image ${index + 1}`}
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />

                                {index === 0 && (
                                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#c9a96e] px-2 py-1 text-[9px] font-bold text-white shadow-sm">
                                    <Star size={10} />
                                    Cover
                                  </div>
                                )}

                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-2 pt-8 opacity-0 transition group-hover:opacity-100">
                                  {index !== 0 ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCoverImage(
                                          image.id,
                                        )
                                      }
                                      className="rounded-lg bg-white/95 px-2 py-1.5 text-[9px] font-bold text-slate-700"
                                    >
                                      Set Cover
                                    </button>
                                  ) : (
                                    <span />
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeImage(
                                        image.id,
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={status === 'loading'}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : editingId !== null ? (
                      <>
                        <CheckCircle2 size={17} />
                        Update Property
                      </>
                    ) : (
                      <>
                        <PlusCircle size={17} />
                        Publish Property
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* SETTINGS */}
          {activeSection === 'settings' && (
            <section className="mx-auto max-w-5xl space-y-6">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  <span className="h-px w-6 bg-[#c9a96e]" />
                  System
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                  Settings
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Review your BREA 88 Realty administration
                  environment.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Database size={20} />
                  </div>

                  <h3 className="mt-5 font-bold text-slate-900">
                    Database
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Property data is connected to the BREA 88
                    Realty database through the platform API.
                  </p>

                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={15} />
                    Database Online
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <ShieldCheck size={20} />
                  </div>

                  <h3 className="mt-5 font-bold text-slate-900">
                    Security
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Property management functions are restricted
                    to authenticated administrators.
                  </p>

                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={15} />
                    Authentication Active
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h3 className="font-bold text-slate-900">
                    Property Summary
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Current marketplace inventory.
                  </p>
                </div>

                <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <Home
                        size={18}
                        className="text-blue-500"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        House & Lot
                      </span>
                    </div>

                    <span className="font-bold text-slate-900">
                      {houseLotCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <Building2
                        size={18}
                        className="text-violet-500"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        Condominiums
                      </span>
                    </div>

                    <span className="font-bold text-slate-900">
                      {condominiumCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <Warehouse
                        size={18}
                        className="text-amber-500"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        For Rent
                      </span>
                    </div>

                    <span className="font-bold text-slate-900">
                      {forRentCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <Star
                        size={18}
                        className="text-[#c9a96e]"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        Owner Listings
                      </span>
                    </div>

                    <span className="font-bold text-slate-900">
                      {ownerCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl bg-[#030b1c] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-[#c9a96e]">
                      <span className="h-px w-6 bg-[#c9a96e]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                        BREA 88 REALTY
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-bold">
                      Service with a Heart.
                    </h3>

                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
                      Your administration workspace is designed
                      to keep your property marketplace organized,
                      secure, and easy to manage.
                    </p>
                  </div>

                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white shadow-xl">
                    <img
                      src="/img/LOGO.png"
                      alt="BREA 88 Realty"
                      className="h-full w-full object-contain p-3"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}