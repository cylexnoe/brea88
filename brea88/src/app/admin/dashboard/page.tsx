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
} from 'lucide-react';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

/* =========================================================
   CIRCUIT BOARD LOADER
   Inspired by the Uiverse loader linked by the user.
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
      <div className="circuit-loader">
        <div className="chip">
          <div className="chip-core">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="pin pin-1" />
        <div className="pin pin-2" />
        <div className="pin pin-3" />
        <div className="pin pin-4" />
        <div className="pin pin-5" />
        <div className="pin pin-6" />
        <div className="pin pin-7" />
        <div className="pin pin-8" />

        <div className="circuit-line line-1" />
        <div className="circuit-line line-2" />
        <div className="circuit-line line-3" />
        <div className="circuit-line line-4" />
      </div>

      <p className="mt-6 text-sm font-semibold text-slate-500">
        {text}
      </p>

      <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-700">
        BREA 88 REALTY
      </p>
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
    tag: 'Residential',
    price: '',
    location: '',
    beds: '',
    baths: '',
    sqft: '',
  });

  const [images, setImages] = useState<ImageItem[]>([]);

  const [imageSource, setImageSource] = useState<'upload' | 'url'>(
    'upload'
  );

  const [imageUrl, setImageUrl] = useState('');

  const [status, setStatus] = useState<Status>('idle');

  const [properties, setProperties] = useState<Property[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [activeSection, setActiveSection] = useState<
    'overview' | 'properties' | 'settings'
  >('overview');

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* =========================================================
     WELCOME VOICE
     ========================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if ('speechSynthesis' in window) {
        const welcomeMessage = new SpeechSynthesisUtterance(
          'Hi Cylex! Welcome to Brea88 Realty Admin Dashboard.'
        );

        welcomeMessage.rate = 0.9;
        welcomeMessage.pitch = 1;
        welcomeMessage.volume = 1;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(welcomeMessage);
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
     LOGOUT
     ========================================================= */

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.replace('/');
      router.refresh();
    }
  };

  /* =========================================================
     INPUT CHANGE
     ========================================================= */

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================================================
     FETCH PROPERTIES
     ========================================================= */

  const fetchProperties = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/properties', {
        cache: 'no-store',
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        setProperties(data);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  /* =========================================================
     FILTERED PROPERTIES
     ========================================================= */

  const filteredProperties = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    if (!term) return properties;

    return properties.filter((property) => {
      return (
        property.title?.toLowerCase().includes(term) ||
        property.location?.toLowerCase().includes(term) ||
        property.tag?.toLowerCase().includes(term) ||
        property.price?.toLowerCase().includes(term)
      );
    });
  }, [properties, searchTerm]);

  /* =========================================================
     STATISTICS
     ========================================================= */

  const residentialCount = properties.filter(
    (property) => property.tag === 'Residential'
  ).length;

  const commercialCount = properties.filter(
    (property) => property.tag === 'Commercial'
  ).length;

  const investmentCount = properties.filter(
    (property) => property.tag === 'Investment'
  ).length;

  /* =========================================================
     IMAGE UPLOAD
     ========================================================= */

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    if (images.length + files.length > MAX_IMAGES) {
      alert(`You can upload a maximum of ${MAX_IMAGES} pictures.`);
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
        alert(`${file.name} is larger than 5MB.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);

      validImages.push({
        id: `${Date.now()}-${Math.random()}`,
        url: previewUrl,
        file,
        source: 'upload',
      });
    }

    setImages((prev) => [...prev, ...validImages]);

    e.target.value = '';
  };

  /* =========================================================
     ADD IMAGE URL
     ========================================================= */

  const addImageUrl = () => {
    const trimmedUrl = imageUrl.trim();

    if (!trimmedUrl) return;

    if (images.length >= MAX_IMAGES) {
      alert(`You can only add ${MAX_IMAGES} pictures.`);
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      alert('Please enter a valid image URL.');
      return;
    }

    const newImage: ImageItem = {
      id: `${Date.now()}-${Math.random()}`,
      url: trimmedUrl,
      source: 'url',
    };

    setImages((prev) => [...prev, newImage]);
    setImageUrl('');
  };

  /* =========================================================
     REMOVE IMAGE
     ========================================================= */

  const removeImage = (id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);

      if (
        imageToRemove?.source === 'upload' &&
        imageToRemove.url.startsWith('blob:')
      ) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      return prev.filter((img) => img.id !== id);
    });
  };

  /* =========================================================
     SET COVER IMAGE
     ========================================================= */

  const setCoverImage = (id: string) => {
    setImages((prev) => {
      const selected = prev.find((img) => img.id === id);

      if (!selected) return prev;

      return [
        selected,
        ...prev.filter((img) => img.id !== id),
      ];
    });
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

    setEditingId(null);

    setFormData({
      title: '',
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
     UPLOAD IMAGE TO VERCEL BLOB
     ========================================================= */

  const uploadImageToBlob = async (file: File) => {
    const uploadFormData = new FormData();

    uploadFormData.append('file', file);

    const response = await fetch('/api/blob/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    const data = await response.json();

    if (!response.ok || !data.success || !data.url) {
      throw new Error(
        data?.message || 'Failed to upload image.'
      );
    }

    return data.url as string;
  };

  /* =========================================================
     SUBMIT PROPERTY
     ========================================================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a property title.');
      return;
    }

    if (!formData.location.trim()) {
      alert('Please enter a property location.');
      return;
    }

    if (images.length === 0) {
      alert('Please add at least one property picture.');
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
          throw new Error('Image file is missing.');
        }

        const permanentUrl = await uploadImageToBlob(
          image.file
        );

        uploadedImages.push(permanentUrl);
      }

      if (uploadedImages.length === 0) {
        throw new Error(
          'No valid property images were uploaded.'
        );
      }

      const coverImage = uploadedImages[0];

      const response = await fetch('/api/properties', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          tag: formData.tag,
          price: formData.price.replace(/,/g, ''),
          location: formData.location,
          beds: formData.beds,
          baths: formData.baths,
          sqft: formData.sqft,
          image: coverImage,
          images: uploadedImages,
          id: editingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Failed to save property.'
        );
      }

      setStatus('success');

      await fetchProperties();

      resetForm();

      setActiveSection('properties');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      console.error('Property save error:', error);

      setStatus('error');

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to upload/save property.'
      );
    }
  };

  /* =========================================================
     DELETE
     ========================================================= */

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/properties/${id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await fetchProperties();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete property.');
    }
  };

  /* =========================================================
     EDIT
     ========================================================= */

  const handleEdit = (property: Property) => {
    const propertyId =
      property.id !== undefined
        ? String(property.id)
        : property._id
        ? String(property._id)
        : null;

    setEditingId(propertyId);

    setFormData({
      title: property.title || '',
      tag: property.tag || 'Residential',
      price: property.price
        ? Number(
            String(property.price).replace(/,/g, '')
          ).toLocaleString('en-US')
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
      Array.isArray(property.images) &&
      property.images.length > 0
        ? property.images
        : property.image
        ? [property.image]
        : [];

    setImages(
      existingImages.map(
        (url: string, index: number) => ({
          id: `existing-${index}-${Date.now()}`,
          url,
          source: 'url',
        })
      )
    );

    setImageSource('url');
    setImageUrl('');
    setStatus('idle');

    setActiveSection('overview');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const navigate = (
    section: 'overview' | 'properties' | 'settings'
  ) => {
    setActiveSection(section);
    setSidebarOpen(false);

    if (section === 'overview') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  /* =========================================================
     INITIAL LOADING
     ========================================================= */

  if (loading && properties.length === 0) {
    return (
      <>
        <CircuitLoader
          fullscreen
          text="Initializing admin dashboard..."
        />

        <style jsx global>{`
          .circuit-loader {
            position: relative;
            width: 110px;
            height: 110px;
            transform-style: preserve-3d;
            animation: circuitFloat 3s ease-in-out infinite;
          }

          .chip {
            position: absolute;
            left: 25px;
            top: 25px;
            width: 60px;
            height: 60px;
            border-radius: 12px;
            background: linear-gradient(
              145deg,
              #1e293b,
              #020617
            );
            border: 2px solid #334155;
            box-shadow:
              0 0 0 5px rgba(59, 130, 246, 0.05),
              0 0 35px rgba(37, 99, 235, 0.25),
              inset 0 0 20px rgba(59, 130, 246, 0.1);
            z-index: 3;
          }

          .chip-core {
            position: absolute;
            inset: 12px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 5px;
          }

          .chip-core span {
            border-radius: 3px;
            background: #2563eb;
            box-shadow: 0 0 10px #2563eb;
            animation: chipPulse 1.4s ease-in-out infinite;
          }

          .chip-core span:nth-child(2) {
            animation-delay: 0.15s;
          }

          .chip-core span:nth-child(3) {
            animation-delay: 0.3s;
          }

          .chip-core span:nth-child(4) {
            animation-delay: 0.45s;
          }

          .pin {
            position: absolute;
            width: 18px;
            height: 3px;
            border-radius: 2px;
            background: #475569;
            z-index: 1;
          }

          .pin-1 {
            left: 8px;
            top: 32px;
          }

          .pin-2 {
            left: 84px;
            top: 32px;
          }

          .pin-3 {
            left: 8px;
            top: 47px;
          }

          .pin-4 {
            left: 84px;
            top: 47px;
          }

          .pin-5 {
            left: 32px;
            top: 8px;
            transform: rotate(90deg);
          }

          .pin-6 {
            left: 62px;
            top: 8px;
            transform: rotate(90deg);
          }

          .pin-7 {
            left: 32px;
            top: 84px;
            transform: rotate(90deg);
          }

          .pin-8 {
            left: 62px;
            top: 84px;
            transform: rotate(90deg);
          }

          .circuit-line {
            position: absolute;
            background: #2563eb;
            opacity: 0.5;
            box-shadow: 0 0 8px #2563eb;
            animation: linePulse 1.5s ease-in-out infinite;
          }

          .line-1 {
            left: 0;
            top: 33px;
            width: 28px;
            height: 1px;
          }

          .line-2 {
            right: 0;
            top: 48px;
            width: 28px;
            height: 1px;
            animation-delay: 0.3s;
          }

          .line-3 {
            left: 33px;
            top: 0;
            width: 1px;
            height: 28px;
            animation-delay: 0.6s;
          }

          .line-4 {
            right: 33px;
            bottom: 0;
            width: 1px;
            height: 28px;
            animation-delay: 0.9s;
          }

          @keyframes chipPulse {
            0%,
            100% {
              opacity: 0.35;
              transform: scale(0.85);
            }

            50% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes linePulse {
            0%,
            100% {
              opacity: 0.2;
            }

            50% {
              opacity: 1;
            }
          }

          @keyframes circuitFloat {
            0%,
            100% {
              transform: translateY(0) rotateX(0deg);
            }

            50% {
              transform: translateY(-8px) rotateX(4deg);
            }
          }
        `}</style>
      </>
    );
  }

  /* =========================================================
     RETURN
     ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}

      {sidebarOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72 flex-col
          border-r border-slate-200 bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >

        {/* LOGO */}

        <div className="flex h-20 items-center border-b border-slate-100 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-900 shadow-lg">

              <img
                src="/img/LOGO.png"
                alt="BREA 88 REALTY"
                className="h-full w-full object-cover"
              />

            </div>

            <div>
              <p className="text-sm font-black tracking-tight text-slate-900">
                BREA 88
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                Realty
              </p>
            </div>

          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>

        </div>

        {/* NAVIGATION */}

        <div className="flex-1 px-4 py-6">

          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">

            <button
              onClick={() => navigate('overview')}
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-3
                text-sm font-semibold transition
                ${
                  activeSection === 'overview'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>

            <button
              onClick={() => navigate('properties')}
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-3
                text-sm font-semibold transition
                ${
                  activeSection === 'properties'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <Building2 size={18} />
              Properties

              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                {properties.length}
              </span>
            </button>

          </nav>

          <p className="mt-8 px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            System
          </p>

          <nav className="space-y-1">

            <button
              onClick={() => navigate('settings')}
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-3
                text-sm font-semibold transition
                ${
                  activeSection === 'settings'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <Settings size={18} />
              Settings
            </button>

          </nav>

        </div>

        {/* ADMIN CARD */}

        <div className="border-t border-slate-100 p-4">

          <div className="mb-3 rounded-xl bg-slate-50 p-3">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <ShieldCheck size={18} />
              </div>

              <div className="min-w-0">

                <p className="truncate text-xs font-bold text-slate-900">
                  Administrator
                </p>

                <div className="mt-0.5 flex items-center gap-1.5">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  <span className="text-[10px] text-slate-500">
                    Online
                  </span>

                </div>

              </div>

            </div>

          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={15} />
            Sign Out
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="lg:pl-72">

        {/* ===================================================
            TOP NAV
            =================================================== */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">

          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

            <div className="flex items-center gap-3">

              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                  BREA 88 REALTY
                </p>

                <h1 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                  Admin Dashboard
                </h1>

              </div>

            </div>

            <div className="flex items-center gap-2 sm:gap-4">

              <button
                className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                title="Notifications"
              >
                <Bell size={18} />

                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="hidden items-center gap-2 sm:flex">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                  A
                </div>

                <div className="hidden md:block">

                  <p className="text-xs font-bold text-slate-900">
                    Admin
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Administrator
                  </p>

                </div>

                <ChevronDown
                  size={15}
                  className="text-slate-400"
                />

              </div>

            </div>

          </div>

        </header>

        {/* ===================================================
            CONTENT
            =================================================== */}

        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

          {/* =================================================
              PAGE INTRO
              ================================================= */}

          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

            <div>

              <p className="mb-1 text-xs font-semibold text-slate-400">
                Welcome back, Admin
              </p>

              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Property Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your BREA 88 REALTY property listings.
              </p>

            </div>

            <div className="flex gap-2">

              <button
                onClick={fetchProperties}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={15} />
                Refresh
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setActiveSection('overview');

                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  });
                }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <PlusCircle size={16} />
                Add Property
              </button>

            </div>

          </div>

          {/* =================================================
              SUCCESS / ERROR
              ================================================= */}

          {status === 'success' && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

              <CheckCircle2
                size={20}
                className="shrink-0"
              />

              <div>

                <p className="font-bold">
                  Property saved successfully.
                </p>

                <p className="mt-0.5 text-xs text-emerald-600">
                  Your property listing has been updated.
                </p>

              </div>

              <button
                onClick={() => setStatus('idle')}
                className="ml-auto rounded-lg p-1 hover:bg-emerald-100"
              >
                <X size={15} />
              </button>

            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

              <AlertCircle
                size={20}
                className="shrink-0"
              />

              <div>

                <p className="font-bold">
                  Something went wrong.
                </p>

                <p className="mt-0.5 text-xs text-red-600">
                  Please check the information and try again.
                </p>

              </div>

              <button
                onClick={() => setStatus('idle')}
                className="ml-auto rounded-lg p-1 hover:bg-red-100"
              >
                <X size={15} />
              </button>

            </div>
          )}

          {/* =================================================
              STAT CARDS
              ================================================= */}

          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* TOTAL */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold text-slate-500">
                    Total Listings
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {properties.length}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Building2 size={21} />
                </div>

              </div>

              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">

                <Activity size={12} />

                Live database

              </div>

            </div>

            {/* RESIDENTIAL */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold text-slate-500">
                    Residential
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {residentialCount}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Home size={21} />
                </div>

              </div>

              <p className="mt-4 text-[10px] font-semibold text-slate-400">
                Residential properties
              </p>

            </div>

            {/* COMMERCIAL */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold text-slate-500">
                    Commercial
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {commercialCount}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Database size={21} />
                </div>

              </div>

              <p className="mt-4 text-[10px] font-semibold text-slate-400">
                Commercial properties
              </p>

            </div>

            {/* INVESTMENT */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold text-slate-500">
                    Investment
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {investmentCount}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CircleDollarSign size={21} />
                </div>

              </div>

              <p className="mt-4 text-[10px] font-semibold text-slate-400">
                Investment opportunities
              </p>

            </div>

          </div>

          {/* =================================================
              OVERVIEW / FORM
              ================================================= */}

          {activeSection === 'overview' && (

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* FORM HEADER */}

              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:px-7 md:flex-row md:items-center md:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {editingId ? (
                      <Pencil size={18} />
                    ) : (
                      <PlusCircle size={18} />
                    )}
                  </div>

                  <div>

                    <h3 className="text-base font-black text-slate-900">
                      {editingId
                        ? 'Edit Property'
                        : 'Add New Property'}
                    </h3>

                    <p className="text-xs text-slate-400">
                      {editingId
                        ? 'Update your property listing information.'
                        : 'Create a new listing for the marketplace.'}
                    </p>

                  </div>

                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <X size={14} />
                    Cancel Editing
                  </button>
                )}

              </div>

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="p-5 sm:p-7"
              >

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* TITLE */}

                  <div className="sm:col-span-2">

                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Property / Project Title
                    </label>

                    <input
                      required
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      placeholder="e.g. Premium 2BR Penthouse"
                    />

                  </div>

                  {/* TAG */}

                  <div>

                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Classification
                    </label>

                    <div className="relative">

                      <select
                        name="tag"
                        value={formData.tag}
                        onChange={handleInputChange}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="Residential">
                          Residential
                        </option>

                        <option value="Commercial">
                          Commercial
                        </option>

                        <option value="Investment">
                          Investment
                        </option>
                      </select>

                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                    </div>

                  </div>

                  {/* PRICE */}

                  <div>

                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Property Price
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">

                      <div className="flex items-center border-r border-slate-200 px-4 text-sm font-bold text-slate-500">
                        ₱
                      </div>

                      <input
                        required
                        type="text"
                        inputMode="numeric"
                        name="price"
                        value={formData.price}
                        onChange={(e) => {
                          const rawValue =
                            e.target.value.replace(
                              /,/g,
                              ''
                            );

                          if (!/^\d*$/.test(rawValue)) {
                            return;
                          }

                          const formattedValue = rawValue
                            ? Number(rawValue).toLocaleString(
                                'en-US'
                              )
                            : '';

                          setFormData((prev) => ({
                            ...prev,
                            price: formattedValue,
                          }));
                        }}
                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-300"
                        placeholder="2,500,000"
                      />

                    </div>

                  </div>

                  {/* LOCATION */}

                  <div className="sm:col-span-2">

                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Location
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">

                      <div className="flex items-center border-r border-slate-200 px-4 text-slate-400">
                        <MapPin size={17} />
                      </div>

                      <input
                        required
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-300"
                        placeholder="e.g. IT Park, Lahug, Cebu City"
                      />

                    </div>

                  </div>

                  {/* BEDROOMS */}

                  <div>

                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Bedrooms
                      <span className="ml-1 font-normal text-slate-400">
                        Optional
                      </span>
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">

                      <div className="flex items-center border-r border-slate-200 px-4 text-slate-400">
                        <BedDouble size={17} />
                      </div>

                      <input
                        type="number"
                        min="0"
                        name="beds"
                        value={formData.beds}
                        onChange={handleInputChange}
                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-300"
                        placeholder="2"
                      />

                    </div>

                  </div>

                  {/* BATHROOMS */}

                  <div>

                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Bathrooms
                      <span className="ml-1 font-normal text-slate-400">
                        Optional
                      </span>
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">

                      <div className="flex items-center border-r border-slate-200 px-4 text-slate-400">
                        <Bath size={17} />
                      </div>

                      <input
                        type="number"
                        min="0"
                        name="baths"
                        value={formData.baths}
                        onChange={handleInputChange}
                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-300"
                        placeholder="2"
                      />

                    </div>

                  </div>

                  {/* FLOOR AREA */}

                  <div className="sm:col-span-2">

                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Floor Area
                      <span className="ml-1 font-normal text-slate-400">
                        sqm
                      </span>
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">

                      <div className="flex items-center border-r border-slate-200 px-4 text-slate-400">
                        <Maximize size={17} />
                      </div>

                      <input
                        required
                        type="number"
                        min="0"
                        name="sqft"
                        value={formData.sqft}
                        onChange={handleInputChange}
                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-300"
                        placeholder="75"
                      />

                    </div>

                  </div>

                  {/* =================================================
                      IMAGE SECTION
                      ================================================= */}

                  <div className="sm:col-span-2">

                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <label className="block text-xs font-bold text-slate-700">
                          Property Pictures
                        </label>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Upload up to {MAX_IMAGES} images.
                          First image becomes the cover.
                        </p>

                      </div>

                      <span className="text-xs font-bold text-slate-400">
                        {images.length}/{MAX_IMAGES}
                      </span>

                    </div>

                    {/* SOURCE */}

                    <div className="mb-4 flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">

                      <button
                        type="button"
                        onClick={() =>
                          setImageSource('upload')
                        }
                        className={`
                          flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition
                          ${
                            imageSource === 'upload'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-900'
                          }
                        `}
                      >
                        <Upload size={15} />
                        Upload Files
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setImageSource('url')
                        }
                        className={`
                          flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition
                          ${
                            imageSource === 'url'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-900'
                          }
                        `}
                      >
                        <LinkIcon size={15} />
                        Image URL
                      </button>

                    </div>

                    {/* UPLOAD */}

                    {imageSource === 'upload' && (

                      <div>

                        <input
                          id="property-image-upload"
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />

                        <label
                          htmlFor="property-image-upload"
                          className="group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 transition hover:border-blue-300 hover:bg-blue-50/40"
                        >

                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm transition group-hover:scale-105">
                            <Upload size={22} />
                          </div>

                          <p className="text-sm font-bold text-slate-700">
                            Upload property pictures
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Click to select multiple images
                          </p>

                          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            JPG • PNG • WEBP • Max 5MB each
                          </p>

                        </label>

                      </div>

                    )}

                    {/* URL */}

                    {imageSource === 'url' && (

                      <div className="flex flex-col gap-2 sm:flex-row">

                        <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">

                          <div className="flex items-center border-r border-slate-200 px-4 text-slate-400">
                            <LinkIcon size={16} />
                          </div>

                          <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) =>
                              setImageUrl(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addImageUrl();
                              }
                            }}
                            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-300"
                            placeholder="https://example.com/property.jpg"
                          />

                        </div>

                        <button
                          type="button"
                          onClick={addImageUrl}
                          disabled={
                            images.length >= MAX_IMAGES
                          }
                          className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Add Image
                        </button>

                      </div>

                    )}

                    {/* IMAGE PREVIEW */}

                    {images.length > 0 && (

                      <div className="mt-5">

                        <div className="mb-3 flex items-center justify-between">

                          <p className="text-xs font-bold text-slate-700">
                            Selected Pictures
                          </p>

                          <p className="text-[10px] text-slate-400">
                            First image = Cover
                          </p>

                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

                          {images.map((image, index) => (

                            <div
                              key={image.id}
                              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                            >

                              <img
                                src={image.url}
                                alt={`Property ${index + 1}`}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.style.opacity =
                                    '0.3';
                                }}
                              />

                              {index === 0 && (
                                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[9px] font-bold text-white">
                                  <Star
                                    size={10}
                                    className="fill-current"
                                  />
                                  Cover
                                </div>
                              )}

                              <div className="absolute bottom-2 left-2 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] font-bold text-white">
                                {index + 1}
                              </div>

                              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/50 opacity-0 transition group-hover:opacity-100">

                                {index !== 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCoverImage(
                                        image.id
                                      )
                                    }
                                    className="rounded-lg bg-white p-2 text-blue-600 shadow-lg transition hover:bg-blue-50"
                                    title="Set as cover"
                                  >
                                    <Star
                                      size={15}
                                    />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeImage(
                                      image.id
                                    )
                                  }
                                  className="rounded-lg bg-red-600 p-2 text-white shadow-lg transition hover:bg-red-700"
                                  title="Remove image"
                                >
                                  <X size={15} />
                                </button>

                              </div>

                            </div>

                          ))}

                        </div>

                      </div>

                    )}

                  </div>

                </div>

                {/* SUBMIT */}

                <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-slate-200 px-6 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {status === 'loading' ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        {editingId ? (
                          <Pencil size={16} />
                        ) : (
                          <PlusCircle size={16} />
                        )}

                        {editingId
                          ? 'Update Property'
                          : 'Publish Property'}
                      </>
                    )}

                  </button>

                </div>

              </form>

            </section>

          )}

          {/* =================================================
              PROPERTIES
              ================================================= */}

          {activeSection === 'properties' && (

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-5 sm:p-6">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <h3 className="text-base font-black text-slate-900">
                      Property Database
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Manage all published property listings.
                    </p>

                  </div>

                  <div className="relative w-full lg:max-w-sm">

                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) =>
                        setSearchTerm(e.target.value)
                      }
                      placeholder="Search properties..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                  </div>

                </div>

              </div>

              {loading ? (

                <CircuitLoader text="Loading properties..." />

              ) : filteredProperties.length === 0 ? (

                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">

                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <ImageIcon size={24} />
                  </div>

                  <h4 className="text-sm font-bold text-slate-700">
                    No properties found
                  </h4>

                  <p className="mt-1 max-w-sm text-xs text-slate-400">
                    {searchTerm
                      ? 'Try changing your search term.'
                      : 'Your property listings will appear here.'}
                  </p>

                </div>

              ) : (

                <>

                  {/* DESKTOP TABLE */}

                  <div className="hidden overflow-x-auto md:block">

                    <table className="w-full">

                      <thead className="border-b border-slate-100 bg-slate-50/70">

                        <tr>

                          <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Property
                          </th>

                          <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Category
                          </th>

                          <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Price
                          </th>

                          <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Location
                          </th>

                          <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Details
                          </th>

                          <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Actions
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {filteredProperties.map(
                          (property) => {

                            const coverImage =
                              Array.isArray(
                                property.images
                              ) &&
                              property.images.length > 0
                                ? property.images[0]
                                : property.image;

                            const propertyId =
                              property.id !== undefined
                                ? property.id
                                : property._id;

                            return (

                              <tr
                                key={String(
                                  propertyId
                                )}
                                className="border-b border-slate-100 transition hover:bg-slate-50/70"
                              >

                                {/* PROPERTY */}

                                <td className="px-6 py-4">

                                  <div className="flex min-w-[240px] items-center gap-3">

                                    <img
                                      src={
                                        coverImage ||
                                        '/placeholder-property.jpg'
                                      }
                                      alt={
                                        property.title
                                      }
                                      className="h-14 w-20 rounded-xl object-cover"
                                      onError={(
                                        e
                                      ) => {
                                        (
                                          e.currentTarget as HTMLImageElement
                                        ).src =
                                          '/placeholder-property.jpg';
                                      }}
                                    />

                                    <div className="min-w-0">

                                      <p className="truncate text-xs font-bold text-slate-900">
                                        {
                                          property.title
                                        }
                                      </p>

                                      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">

                                        <MapPin
                                          size={10}
                                        />

                                        {
                                          property.location
                                        }

                                      </p>

                                    </div>

                                  </div>

                                </td>

                                {/* CATEGORY */}

                                <td className="px-4 py-4">

                                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
                                    {property.tag}
                                  </span>

                                </td>

                                {/* PRICE */}

                                <td className="whitespace-nowrap px-4 py-4">

                                  <p className="text-xs font-black text-slate-900">
                                    ₱
                                    {Number(
                                      String(
                                        property.price
                                      ).replace(
                                        /,/g,
                                        ''
                                      )
                                    ).toLocaleString(
                                      'en-US'
                                    )}
                                  </p>

                                </td>

                                {/* LOCATION */}

                                <td className="max-w-[180px] px-4 py-4">

                                  <p className="truncate text-xs text-slate-500">
                                    {
                                      property.location
                                    }
                                  </p>

                                </td>

                                {/* DETAILS */}

                                <td className="px-4 py-4">

                                  <div className="flex items-center gap-3 text-[10px] text-slate-400">

                                    {property.beds !==
                                      null &&
                                      property.beds !==
                                        undefined && (
                                        <span className="flex items-center gap-1">
                                          <BedDouble
                                            size={
                                              12
                                            }
                                          />
                                          {
                                            property.beds
                                          }
                                        </span>
                                      )}

                                    {property.baths !==
                                      null &&
                                      property.baths !==
                                        undefined && (
                                        <span className="flex items-center gap-1">
                                          <Bath
                                            size={
                                              12
                                            }
                                          />
                                          {
                                            property.baths
                                          }
                                        </span>
                                      )}

                                    {property.sqft !==
                                      null &&
                                      property.sqft !==
                                        undefined && (
                                        <span className="flex items-center gap-1">
                                          <Maximize
                                            size={
                                              12
                                            }
                                          />
                                          {
                                            property.sqft
                                          }
                                        </span>
                                      )}

                                  </div>

                                </td>

                                {/* ACTIONS */}

                                <td className="px-6 py-4">

                                  <div className="flex justify-end gap-2">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleEdit(
                                          property
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                      title="Edit property"
                                    >
                                      <Pencil
                                        size={
                                          15
                                        }
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete(
                                          propertyId!
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                      title="Delete property"
                                    >
                                      <Trash2
                                        size={
                                          15
                                        }
                                      />
                                    </button>

                                  </div>

                                </td>

                              </tr>

                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                  {/* MOBILE CARDS */}

                  <div className="space-y-3 p-4 md:hidden">

                    {filteredProperties.map(
                      (property) => {

                        const coverImage =
                          Array.isArray(
                            property.images
                          ) &&
                          property.images.length > 0
                            ? property.images[0]
                            : property.image;

                        const propertyId =
                          property.id !== undefined
                            ? property.id
                            : property._id;

                        return (

                          <div
                            key={String(
                              propertyId
                            )}
                            className="overflow-hidden rounded-xl border border-slate-200"
                          >

                            <div className="flex gap-3 p-3">

                              <img
                                src={
                                  coverImage ||
                                  '/placeholder-property.jpg'
                                }
                                alt={
                                  property.title
                                }
                                className="h-20 w-24 shrink-0 rounded-lg object-cover"
                                onError={(
                                  e
                                ) => {
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).src =
                                    '/placeholder-property.jpg';
                                }}
                              />

                              <div className="min-w-0 flex-1">

                                <div className="mb-1 flex items-start justify-between gap-2">

                                  <h4 className="line-clamp-2 text-xs font-bold text-slate-900">
                                    {
                                      property.title
                                    }
                                  </h4>

                                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[8px] font-bold text-blue-600">
                                    {
                                      property.tag
                                    }
                                  </span>

                                </div>

                                <p className="text-sm font-black text-slate-900">
                                  ₱
                                  {Number(
                                    String(
                                      property.price
                                    ).replace(
                                      /,/g,
                                      ''
                                    )
                                  ).toLocaleString(
                                    'en-US'
                                  )}
                                </p>

                                <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-400">
                                  <MapPin
                                    size={10}
                                  />
                                  {
                                    property.location
                                  }
                                </p>

                              </div>

                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-3 py-2">

                              <div className="flex gap-3 text-[10px] text-slate-400">

                                {property.beds !==
                                  null &&
                                  property.beds !==
                                    undefined && (
                                    <span className="flex items-center gap-1">
                                      <BedDouble
                                        size={
                                          11
                                        }
                                      />
                                      {
                                        property.beds
                                      }
                                    </span>
                                  )}

                                {property.baths !==
                                  null &&
                                  property.baths !==
                                    undefined && (
                                    <span className="flex items-center gap-1">
                                      <Bath
                                        size={
                                          11
                                        }
                                      />
                                      {
                                        property.baths
                                      }
                                    </span>
                                  )}

                                {property.sqft !==
                                  null &&
                                  property.sqft !==
                                    undefined && (
                                    <span className="flex items-center gap-1">
                                      <Maximize
                                        size={
                                          11
                                        }
                                      />
                                      {
                                        property.sqft
                                      }{' '}
                                      sqm
                                    </span>
                                  )}

                              </div>

                              <div className="flex gap-1">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(
                                      property
                                    )
                                  }
                                  className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Pencil
                                    size={14}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      propertyId!
                                    )
                                  }
                                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2
                                    size={14}
                                  />
                                </button>

                              </div>

                            </div>

                          </div>

                        );
                      }
                    )}

                  </div>

                </>

              )}

            </section>

          )}

          {/* =================================================
              SETTINGS
              ================================================= */}

          {activeSection === 'settings' && (

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Settings size={18} />
                  </div>

                  <div>

                    <h3 className="text-base font-black text-slate-900">
                      Admin Settings
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Dashboard and account configuration.
                    </p>

                  </div>

                </div>

              </div>

              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">

                <div className="rounded-xl border border-slate-200 p-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <ShieldCheck size={18} />
                    </div>

                    <div>

                      <p className="text-sm font-bold text-slate-900">
                        Admin Security
                      </p>

                      <p className="text-xs text-slate-400">
                        Protected administrator session
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5">

                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                    <span className="text-xs font-bold text-emerald-700">
                      Security status: Active
                    </span>

                  </div>

                </div>

                <div className="rounded-xl border border-slate-200 p-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <Eye size={18} />
                    </div>

                    <div>

                      <p className="text-sm font-bold text-slate-900">
                        Marketplace
                      </p>

                      <p className="text-xs text-slate-400">
                        Public property listings
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push('/marketplace')
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Eye size={14} />
                    View Marketplace
                  </button>

                </div>

                <div className="rounded-xl border border-slate-200 p-5 lg:col-span-2">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Bell size={18} />
                    </div>

                    <div>

                      <p className="text-sm font-bold text-slate-900">
                        Welcome Voice
                      </p>

                      <p className="text-xs text-slate-400">
                        Browser voice greeting on dashboard entry
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3">

                    <p className="text-xs text-slate-500">
                      "Hi Cylex! Welcome to Brea88 Realty Admin
                      Dashboard."
                    </p>

                  </div>

                </div>

              </div>

            </section>

          )}

        </div>

        {/* ===================================================
            FOOTER
            =================================================== */}

        <footer className="border-t border-slate-200 bg-white">

          <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-5 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 lg:text-left">

            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              BREA 88 REALTY OPC
            </p>

            <p className="text-[10px] text-slate-400">
              Admin Management System
            </p>

          </div>

        </footer>

      </main>

      {/* =====================================================
          LOADING OVERLAY DURING SAVE
          ===================================================== */}

      {status === 'loading' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">

          <div className="rounded-3xl bg-white px-10 py-9 shadow-2xl">

            <CircuitLoader text="Processing property..." />

          </div>

        </div>
      )}

      {/* =====================================================
          LOADER STYLES
          ===================================================== */}

      <style jsx global>{`
        .circuit-loader {
          position: relative;
          width: 110px;
          height: 110px;
          transform-style: preserve-3d;
          animation: circuitFloat 3s ease-in-out infinite;
        }

        .chip {
          position: absolute;
          left: 25px;
          top: 25px;
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: linear-gradient(
            145deg,
            #1e293b,
            #020617
          );
          border: 2px solid #334155;
          box-shadow:
            0 0 0 5px rgba(59, 130, 246, 0.05),
            0 0 35px rgba(37, 99, 235, 0.25),
            inset 0 0 20px rgba(59, 130, 246, 0.1);
          z-index: 3;
        }

        .chip-core {
          position: absolute;
          inset: 12px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 5px;
        }

        .chip-core span {
          border-radius: 3px;
          background: #2563eb;
          box-shadow: 0 0 10px #2563eb;
          animation: chipPulse 1.4s ease-in-out infinite;
        }

        .chip-core span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .chip-core span:nth-child(3) {
          animation-delay: 0.3s;
        }

        .chip-core span:nth-child(4) {
          animation-delay: 0.45s;
        }

        .pin {
          position: absolute;
          width: 18px;
          height: 3px;
          border-radius: 2px;
          background: #475569;
          z-index: 1;
        }

        .pin-1 {
          left: 8px;
          top: 32px;
        }

        .pin-2 {
          left: 84px;
          top: 32px;
        }

        .pin-3 {
          left: 8px;
          top: 47px;
        }

        .pin-4 {
          left: 84px;
          top: 47px;
        }

        .pin-5 {
          left: 32px;
          top: 8px;
          transform: rotate(90deg);
        }

        .pin-6 {
          left: 62px;
          top: 8px;
          transform: rotate(90deg);
        }

        .pin-7 {
          left: 32px;
          top: 84px;
          transform: rotate(90deg);
        }

        .pin-8 {
          left: 62px;
          top: 84px;
          transform: rotate(90deg);
        }

        .circuit-line {
          position: absolute;
          background: #2563eb;
          opacity: 0.5;
          box-shadow: 0 0 8px #2563eb;
          animation: linePulse 1.5s ease-in-out infinite;
        }

        .line-1 {
          left: 0;
          top: 33px;
          width: 28px;
          height: 1px;
        }

        .line-2 {
          right: 0;
          top: 48px;
          width: 28px;
          height: 1px;
          animation-delay: 0.3s;
        }

        .line-3 {
          left: 33px;
          top: 0;
          width: 1px;
          height: 28px;
          animation-delay: 0.6s;
        }

        .line-4 {
          right: 33px;
          bottom: 0;
          width: 1px;
          height: 28px;
          animation-delay: 0.9s;
        }

        @keyframes chipPulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.85);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes linePulse {
          0%,
          100% {
            opacity: 0.2;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes circuitFloat {
          0%,
          100% {
            transform: translateY(0) rotateX(0deg);
          }

          50% {
            transform: translateY(-8px) rotateX(4deg);
          }
        }
      `}</style>
    </div>
  );
}