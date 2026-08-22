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

  const [properties, setProperties] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    sessionStorage.clear();

    router.push('/');
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
      const res = await fetch('/api/properties');
      const data = await res.json();

      setProperties(data);
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

    // Reset input so the same file can be selected again
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
      /*
       * IMPORTANT:
       * Your current API uses JSON.
       *
       * This sends:
       *
       * images: [
       *   "image-url-1",
       *   "image-url-2",
       *   "image-url-3"
       * ]
       *
       * Uploaded files currently use temporary blob URLs.
       *
       * For production, use FormData + Cloudinary/Vercel Blob
       * to permanently upload the actual files.
       */

      const imageUrls = images.map((image) => image.url);

      const response = await fetch('/api/properties', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
          image: imageUrls[0],
          id: editingId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save property');
      }

      setStatus('success');

      await fetchProperties();

      resetForm();
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this property?')) return;

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await fetchProperties();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (property: any) => {
    setEditingId(property._id);

    setFormData({
      title: property.title || '',
      tag: property.tag || 'Residential',
      price: property.price || '',
      location: property.location || '',
      beds: property.beds || '',
      baths: property.baths || '',
      sqft: property.sqft || '',
    });

    const existingImages =
      Array.isArray(property.images) &&
      property.images.length > 0
        ? property.images
        : property.image
        ? [property.image]
        : [];

    setImages(
      existingImages.map((url: string, index: number) => ({
        id: `existing-${index}-${Date.now()}`,
        url,
        source: 'url',
      }))
    );

    setImageSource('url');
    setImageUrl('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-3xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-xl p-8">



        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6 mb-8">

          <div className="flex items-center gap-3">

            <img
              src="/img/LOGO.png"
              alt="BREA 88 Logo"
              className="w-20 h-20 rounded-full object-cover shadow-sm"
            />

            <div>

              <h1 className="text-2xl font-black tracking-tight">
                BREA 88 Admin Dashboard
              </h1>

              <p className="text-xs text-slate-400">
                Manage property listings and inventory.
              </p>

            </div>

          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
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

            {/* PROPERTY TITLE */}

            <div className="sm:col-span-2">

              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">
                Property / Project Title
              </label>

              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg border border-slate-800 outline-none focus:border-blue-500 text-sm font-medium transition"
                placeholder="e.g., Premium 2BR Penthouse Complex"
              />

            </div>

            {/* CLASSIFICATION */}

            <div>

              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">
                Classification Tag
              </label>

              <select
                name="tag"
                value={formData.tag}
                onChange={handleInputChange}
                className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg border border-slate-800 outline-none focus:border-blue-500 text-sm font-medium transition cursor-pointer"
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

            </div>

            {/* PRICE */}

            <div>

              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">
                Price Tag
              </label>

              <div className="flex items-center w-full bg-slate-900 rounded-lg border border-slate-800 focus-within:border-blue-500 transition overflow-hidden">

                <span className="px-4 text-white text-sm font-bold border-r border-slate-800">
                  ₱
                </span>

                <input
                  required
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent text-white px-4 py-2.5 outline-none text-sm font-medium"
                  placeholder="1,000,000"
                />

              </div>

            </div>

            {/* LOCATION */}

            <div className="sm:col-span-2">

              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">
                Geographic Location
              </label>

              <input
                required
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg border border-slate-800 outline-none focus:border-blue-500 text-sm font-medium transition"
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

              {/* SOURCE DROPDOWN */}

              <div className="relative mb-4">

                <select
                  value={imageSource}
                  onChange={(e) =>
                    setImageSource(
                      e.target.value as 'upload' | 'url'
                    )
                  }
                  className="w-full appearance-none bg-slate-900 text-white px-4 py-3 pr-10 rounded-xl border border-slate-800 outline-none focus:border-blue-500 text-sm font-medium transition cursor-pointer"
                >

                  <option value="upload">
                    Upload Pictures from Device
                  </option>

                  <option value="url">
                    Add Picture Using URL
                  </option>

                </select>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
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
                    className="group flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900 hover:bg-slate-800 hover:border-blue-500 transition-all duration-300 cursor-pointer"
                  >

                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition">

                      <Upload className="w-6 h-6 text-blue-400" />

                    </div>

                    <p className="text-sm font-bold text-white">
                      Add Property Pictures
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Select multiple images at once
                    </p>

                    <p className="text-[10px] text-slate-600 mt-3 uppercase font-semibold">
                      JPG • PNG • WEBP • Maximum 5MB each
                    </p>

                  </label>

                </div>

              )}


              {imageSource === 'url' && (

                <div className="flex gap-2">

                  <div className="flex flex-1 items-center bg-slate-900 rounded-xl border border-slate-800 focus-within:border-blue-500 transition overflow-hidden">

                    <div className="px-4 text-slate-400 border-r border-slate-800">

                      <LinkIcon className="w-4 h-4" />

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
                      className="flex-1 bg-transparent text-white px-4 py-3 outline-none text-sm"
                      placeholder="https://example.com/property.jpg"
                    />

                  </div>

                  <button
                    type="button"
                    onClick={addImageUrl}
                    disabled={images.length >= MAX_IMAGES}
                    className="px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold text-sm transition"
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

                        {/* COVER */}

                        {index === 0 && (

                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-md text-[9px] font-bold uppercase">

                            <Star className="w-3 h-3 fill-current" />

                            Cover

                          </div>

                        )}

                        {/* NUMBER */}

                        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-[10px] font-bold">

                          {index + 1}

                        </div>

                        {/* ACTIONS */}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">

                          {index !== 0 && (

                            <button
                              type="button"
                              onClick={() =>
                                setCoverImage(image.id)
                              }
                              className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition"
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

              {/* HELP TEXT */}

              <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">

                <ImageIcon className="w-3.5 h-3.5" />

                <span>
                  Add up to {MAX_IMAGES} pictures. The first picture will be used as the cover photo.
                </span>

              </div>

            </div>

            {/* BEDROOMS */}

            <div>

              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">
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
                className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg border border-slate-800 outline-none focus:border-blue-500 text-sm font-medium transition"
                placeholder="e.g., 2"
              />

            </div>

            {/* BATHROOMS */}

            <div>

              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">
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
                className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg border border-slate-800 outline-none focus:border-blue-500 text-sm font-medium transition"
                placeholder="e.g., 2"
              />

            </div>

            {/* FLOOR AREA */}

            <div className="sm:col-span-2">

              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">
                Floor Area Space (sqm)
              </label>

              <input
                required
                type="number"
                name="sqft"
                value={formData.sqft}
                onChange={handleInputChange}
                className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg border border-slate-800 outline-none focus:border-blue-500 text-sm font-medium transition"
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
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <h2 className="text-xl font-bold text-white mb-5">
            Property Listings
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

            <div className="overflow-x-auto rounded-xl border border-slate-800">

              <table className="w-full text-sm">

                <thead className="bg-slate-900">

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

                    return (

                      <tr
                        key={property._id}
                        className="border-b border-slate-800 hover:bg-slate-900/50 transition"
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
                              className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition"
                              title="Edit property"
                            >

                              <Pencil size={16} />

                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(property._id)
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