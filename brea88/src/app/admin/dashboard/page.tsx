'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Loader2,
  LogOut,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Star,
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

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const [properties, setProperties] = useState<Property[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOGOUT
  // ==========================================

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

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // FETCH PROPERTIES
  // ==========================================

  const fetchProperties = async () => {
    try {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // ==========================================
  // HANDLE MULTIPLE IMAGE UPLOAD
  // ==========================================

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

  // ==========================================
  // ADD IMAGE URL
  // ==========================================

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

  // ==========================================
  // REMOVE IMAGE
  // ==========================================

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

  // ==========================================
  // SET COVER IMAGE
  // ==========================================

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

  // ==========================================
  // RESET FORM
  // ==========================================

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

  // ==========================================
  // UPLOAD IMAGE TO VERCEL BLOB
  // ==========================================

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

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        throw new Error('No valid property images were uploaded.');
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

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id: string | number) => {
    if (!confirm('Delete this property?')) return;

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

  // ==========================================
  // EDIT
  // ==========================================

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
      price: property.price || '',
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

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

   useEffect(() => {
    const welcomeMessage = new SpeechSynthesisUtterance(
      'Hi Cylex! Welcome to Brea88 Realty Admin Dashboard.'
    );

    welcomeMessage.rate = 0.9;
    welcomeMessage.pitch = 1;
    welcomeMessage.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(welcomeMessage);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 py-8 px-4 sm:px-6 lg:px-8 font-mono">
      <div className="pointer-events-none fixed inset-0">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,100,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,100,0.04)_1px,transparent_1px)] bg-[size:30px_30px]" />
         <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/5 blur-[120px]" />

        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl overflow-hidden rounded-2xl border border-green-500/30 bg-[#030d08]/95 shadow-[0_0_60px_rgba(0,255,100,0.08)] p-5 sm:p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6 mb-8">

          <div className="flex items-center gap-3">

            <img
              src="/img/LOGO.png"
              alt="BREA 88 Logo"
              className="h-16 w-16 rounded-full object-cover border border-green-500/50 shadow-[0_0_25px_rgba(0,255,100,0.25)] sm:h-20 sm:w-20"
            />

            <div>
              <h1 className="text-xl font-black tracking-wider text-green-400 sm:text-2xl">
                BREA_88 // ADMIN_TERMINAL
              </h1>

              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-green-700 sm:text-xs">
                Secure Property Management System // Access Level: ADMIN
              </p>
            </div>

          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 transition hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(255,0,0,0.15)]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>

        </div>

        {status === 'success' && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            Property listing processed successfully!
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            Failed to process listing. Please check your information.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div className="grid sm:grid-cols-2 gap-6">

            <div className="sm:col-span-2">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">
                Property / Project Title
              </label>

              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full bg-black text-green-400 px-4 py-3 rounded-lg border border-green-500/30 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 placeholder:text-green-900 text-sm font-mono transition"
                placeholder="e.g., Premium 2BR Penthouse Complex"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">
                Classification Tag
              </label>

              <select
                name="tag"
                value={formData.tag}
                onChange={handleInputChange}
                className="w-full bg-black text-green-400 px-4 py-3 rounded-lg border border-green-500/30 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 placeholder:text-green-900 text-sm font-mono transition cursor-pointer">
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
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">
                Price Tag
              </label>

              <div className="flex items-center w-full bg-black rounded-lg border border-green-500/30 focus-within:border-green-400 transition overflow-hidden">

                <span className="px-4 text-green-400 text-sm font-bold border-r border-green-500/30">
                  ₱
                </span>

                <input
                    required
                    type="text"
                    inputMode="numeric"
                    name="price"
                    value={formData.price}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, '');

                      if (!/^\d*$/.test(rawValue)) return;

                      const formattedValue = rawValue
                        ? Number(rawValue).toLocaleString('en-US')
                        : '';

                      setFormData((prev) => ({
                        ...prev,
                        price: formattedValue,
                      }));
                    }}
                    className="flex-1 bg-transparent text-green-400 px-4 py-2.5 outline-none text-sm font-medium font-mono"
                    placeholder="Enter price (e.g., 2500000)"
                  />

              </div>
            </div>

            <div className="sm:col-span-2">

              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">
                Geographic Location
              </label>

              <input
                required
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full bg-black text-green-400 px-4 py-3 rounded-lg border border-green-500/30 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 placeholder:text-green-900 text-sm font-mono transition"
                placeholder="e.g., IT Park, Lahug, Cebu City"
              />

            </div>

            <div className="sm:col-span-2">

              <div className="flex items-center justify-between mb-2">

                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Property Pictures
                </label>

                <span className="text-[11px] text-slate-500">
                  {images.length}/{MAX_IMAGES} pictures
                </span>

              </div>

              <div className="relative mb-4">

                <select
                  value={imageSource}
                  onChange={(e) =>
                    setImageSource(
                      e.target.value as 'upload' | 'url'
                    )
                  }
                  className="w-full appearance-none bg-black text-green-400 px-4 py-3 pr-10 rounded-xl border border-green-500/30 outline-none focus:border-green-400 text-sm font-medium transition cursor-pointer"
                >

                  <option value="upload">
                    Upload Pictures from Device
                  </option>

                  <option value="url">
                    Add Picture Using URL
                  </option>

                </select>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-green-500">
                  ▼
                </div>

              </div>

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
                    className="group flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-green-500/40 rounded-2xl bg-black hover:bg-green-950/20 hover:border-green-400 transition-all duration-300 cursor-pointer"
                  >

                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition">

                      <Upload className="w-6 h-6 text-green-400" />

                    </div>

                    <p className="text-sm font-bold text-green-400 font-mono">
                      &gt; ADD PROPERTY PICTURES
                    </p>

                    <p className="text-xs text-green-500 mt-1">
                      Select multiple images at once
                    </p>

                    <p className="text-[10px] text-green-600 mt-3 uppercase font-semibold">
                      Allow Drag & Drop
                    </p>

                  </label>

                </div>

              )}

              {imageSource === 'url' && (

               <div className="flex gap-2">

                <div className="flex flex-1 items-center bg-black rounded-xl border border-green-500/30 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-400/10 transition overflow-hidden">

                  <div className="px-4 text-green-500 border-r border-green-500/20">
                      <LinkIcon className="w-4 h-4 text-green-400" />

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
                      className="flex-1 bg-transparent text-green-400 px-4 py-3 outline-none text-sm font-mono placeholder:text-green-900"
                      placeholder="https://example.com/property.jpg"
                    />

                  </div>

                  <button
                    type="button"
                    onClick={addImageUrl}
                    disabled={images.length >= MAX_IMAGES}
                    className="px-5 bg-green-500 hover:bg-green-400 disabled:bg-green-950 disabled:text-green-800 text-black rounded-xl font-black text-sm font-mono transition"
                  >
                    Add
                  </button>

                </div>

              )}

              {images.length > 0 && (

                <div className="mt-5">

                  <div className="flex items-center justify-between mb-3">

                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Selected Pictures
                    </p>

                    <p className="text-[10px] text-slate-600">
                      First image = Cover Photo
                    </p>

                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                    {images.map((image, index) => (

                      <div
                        key={image.id}
                        className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-slate-900"
                      >

                        <img
                          src={image.url}
                          alt={`Property ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.3';
                          }}
                        />

                        {index === 0 && (

                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-md text-[9px] font-bold uppercase">

                            <Star className="w-3 h-3 fill-current" />

                            Cover

                          </div>

                        )}

                        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-[10px] font-bold">
                          {index + 1}
                        </div>

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">

                          {index !== 0 && (

                            <button
                              type="button"
                              onClick={() =>
                                setCoverImage(image.id)
                              }
                              className="rounded-lg border border-green-500/40 bg-green-500/10 p-2 text-green-400 transition hover:bg-green-500/20 hover:shadow-[0_0_15px_rgba(0,255,100,0.15)]"
                              title="Set as cover"
                            >
                              <Star className="w-4 h-4" />
                            </button>

                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(image.id)
                            }
                            className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              )}

              <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">

                <ImageIcon className="w-3.5 h-3.5" />

                <span>
                  Add up to {MAX_IMAGES} pictures. The first picture will be used as the cover photo.
                </span>

              </div>

            </div>

            <div>

              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">
                Bedrooms Count
                <span className="text-slate-600 ml-1">
                  (Optional)
                </span>
              </label>

              <input
                type="number"
                name="beds"
                value={formData.beds}
                onChange={handleInputChange}
                className="w-full bg-black text-green-400 px-4 py-3 rounded-lg border border-green-500/30 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 placeholder:text-green-900 text-sm font-mono transition"
                placeholder="e.g., 2"
              />

            </div>

            <div>

              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">
                Bathrooms Count
                <span className="text-slate-600 ml-1">
                  (Optional)
                </span>
              </label>

              <input
                type="number"
                name="baths"
                value={formData.baths}
                onChange={handleInputChange}
                className="w-full bg-black text-green-400 px-4 py-3 rounded-lg border border-green-500/30 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 placeholder:text-green-900 text-sm font-mono transition"
                placeholder="e.g., 2"
              />

            </div>

            <div className="sm:col-span-2">

              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">
                Floor Area Space (sqm)
              </label>

              <input
                required
                type="number"
                name="sqft"
                value={formData.sqft}
                onChange={handleInputChange}
                className="w-full bg-black text-green-400 px-4 py-3 rounded-lg border border-green-500/30 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 placeholder:text-green-900 text-sm font-mono transition"
                placeholder="e.g., 75"
              />

            </div>

          </div>

          {editingId && (

            <button
              type="button"
              onClick={resetForm}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-semibold transition"
            >
              Cancel Edit
            </button>

          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-green-400/60 bg-green-500/10 py-4 text-xs font-black uppercase tracking-[0.2em] text-green-400 shadow-[0_0_25px_rgba(0,255,100,0.08)] transition hover:bg-green-500/20 hover:shadow-[0_0_30px_rgba(0,255,100,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
          >

            {status === 'loading' ? (

              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>

            ) : (

              <>
                <PlusCircle className="w-4 h-4" />

                {editingId
                  ? 'Update Property'
                  : 'Publish Listing'}
              </>

            )}

          </button>

        </form>

        <div className="mt-12">

          <h2 className="mb-5 text-lg font-black uppercase tracking-[0.2em] text-green-400">
            <span className="text-green-700">&gt;</span> PROPERTY_DATABASE
          </h2>

          {loading ? (

            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
            </div>

          ) : properties.length === 0 ? (

            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">

              <ImageIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" />

              <p className="text-sm text-slate-500">
                No property listings yet.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto rounded-xl border border-green-900/70 bg-black/30">

              <table className="w-full text-sm">

                <thead className="border-b border-green-900 bg-green-950/20">

                  <tr>

                    <th className="p-3 text-left">
                      Image
                    </th>

                    <th className="text-left">
                      Title
                    </th>

                    <th className="text-left">
                      Price
                    </th>

                    <th className="text-left">
                      Location
                    </th>

                    <th className="text-left">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {properties.map((property) => {

                    const coverImage =
                      Array.isArray(property.images) &&
                      property.images.length > 0
                        ? property.images[0]
                        : property.image;

                    const propertyId =
                      property.id !== undefined
                        ? property.id
                        : property._id;

                    return (

                      <tr
                        key={String(propertyId)}
                        className="border-b border-green-950 transition hover:bg-green-500/5"
                      >

                        <td className="p-2">

                          <img
                            src={
                              coverImage ||
                              '/placeholder-property.jpg'
                            }
                            alt={property.title}
                            className="w-20 h-14 rounded-lg object-cover"
                            onError={(e) => {
                              (
                                e.target as HTMLImageElement
                              ).src =
                                '/placeholder-property.jpg';
                            }}
                          />

                        </td>

                        <td className="font-medium pr-4">
                          {property.title}
                        </td>

                        <td className="font-semibold text-blue-400 pr-4">
                          ₱{property.price}
                        </td>

                        <td className="text-slate-400 pr-4">
                          {property.location}
                        </td>

                        <td>

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(property)
                              }
                              className="rounded-lg border border-green-500/40 bg-green-500/10 p-2 text-green-400 transition hover:bg-green-500/20 hover:shadow-[0_0_15px_rgba(0,255,100,0.15)]"
                              title="Edit property"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(propertyId!)
                              }
                              className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition"
                              title="Delete property"
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

