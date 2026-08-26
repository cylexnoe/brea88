'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
  ChevronLeft,
  Lock,
  Bell,
  ShieldCheck,
  Heart,
  FileText,
  CalendarDays,
  ChevronRight,
  Camera,
  X,
  Check,
  Copy,
  Image as ImageIcon,
  Trash2,
  Link,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [agentSlug, setAgentSlug] = useState('');
  const [agentRole, setAgentRole] = useState('Real Estate Agent');
  const [copiedLink, setCopiedLink] = useState(false);

    const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    slug: '',
    bio: '',
    facebook: '',
    messenger: '',
    profileImage: null as string | null,
  });

  const [editForm, setEditForm] = useState(profile);

  // =========================================================
  // PROFILE EDIT
  // =========================================================

  const handleEdit = () => {
    setEditForm(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const handleSave = async () => {
  try {
    const response = await fetch('/api/agent/profile/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(editForm),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data?.message || 'Failed to update profile.');
      return;
    }

    setProfile(data.agent);
    setEditForm(data.agent);
    setIsEditing(false);

    alert('Profile updated successfully.');
  } catch (error) {
    console.error('Profile update error:', error);
    alert('Unable to update profile.');
  }
};

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  setImageError('');

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    setImageError(
      'Please select a JPG, PNG, or WebP image.'
    );

    e.target.value = '';
    return;
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    setImageError(
      'Image size must be less than 5MB.'
    );

    e.target.value = '';
    return;
  }

  try {
    setImageError('');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      '/api/agent/profile/upload',
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data?.message ||
          'Profile image upload failed.'
      );
    }

    setProfileImage(data.url);

  } catch (error) {
    console.error(
      'Profile image upload error:',
      error
    );

    setImageError(
      error instanceof Error
        ? error.message
        : 'Profile image upload failed.'
    );
  } finally {
    e.target.value = '';
  }
};

  const handleRemoveImage = () => {
    if (profileImage) {
      URL.revokeObjectURL(profileImage);
    }

    setProfileImage(null);
    setImageError('');
  };
  
     useEffect(() => {
      const loadAgentProfile = async () => {
        try {
          const response = await fetch('/api/agent/me', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });

          const data = await response.json();

          if (!response.ok || !data?.agent) {
            router.replace('/agent/login');
            return;
          }

          const agent = data.agent;

          const agentProfile = {
            fullName: agent.fullName ?? '',
            email: agent.email ?? '',
            phone: agent.phone ?? '',
            address: agent.address ?? '',
            role: agent.role ?? '',
            slug: agent.slug ?? '',
            bio: agent.bio ?? '',
            facebook: agent.facebook ?? '',
            messenger: agent.messenger ?? '',
            profileImage: agent.profileImage ?? null,
          };

          setProfile(agentProfile);
          setEditForm(agentProfile);
          setProfileImage(agent.profileImage ?? null);
          setCheckingAuth(false);
        } catch (error) {
          console.error(
            'Authentication check failed:',
            error
          );

          router.replace('/agent/login');
        }
      };

      loadAgentProfile();
    }, [router]);

    const publicAgentUrl =
      agentSlug && typeof window !== 'undefined'
        ? `${window.location.origin}/agent/${agentSlug}`
        : '';

    const handleCopyAgentLink = async () => {
      if (!publicAgentUrl) return;

      try {
        await navigator.clipboard.writeText(publicAgentUrl);

        setCopiedLink(true);

        setTimeout(() => {
          setCopiedLink(false);
        }, 2000);
      } catch (error) {
        console.error(
          'Failed to copy agent link:',
          error
        );
      }
    };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          HIDDEN FILE INPUT
      ====================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-blue-950 active:scale-[0.97]"
          >
            <ChevronLeft
              size={18}
              strokeWidth={2.3}
            />

            <span>Back</span>
          </button>
        </div>
      </div>
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
          <p className="text-sm font-medium text-slate-500">
            Account
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage your personal information, account settings,
            and property activity.
          </p>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* =================================================
              LEFT COLUMN
          ================================================== */}

          <div className="space-y-6 lg:col-span-2">

            {/* =================================================
    PROFILE HEADER
================================================== */}

<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

  {/* COVER */}
  <div className="h-24 bg-slate-900 sm:h-32 md:h-36" />

  <div className="px-5 pb-6 sm:px-7">

    <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">

      {/* USER */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">

        {/* PROFILE IMAGE */}
        <div className="relative">

          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md sm:h-32 sm:w-32">

            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <User
                size={52}
                strokeWidth={1.5}
                className="text-slate-400"
              />
            )}

          </div>

        </div>

        {/* USER INFORMATION */}
        <div className="min-w-0 pb-1">

          <h2 className="text-xl font-bold sm:text-2xl">
            {profile.fullName}
          </h2>

          <div className="mt-1 flex max-w-full items-center gap-2 text-sm text-slate-500">

            <Mail
              size={15}
              className="shrink-0"
            />

            <span className="truncate">
              {profile.email}
            </span>

          </div>

        </div>

      </div>

      {/* EDIT */}
      <button
        type="button"
        onClick={handleEdit}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] sm:w-auto"
      >
        <Pencil size={16} />
        Edit Profile
      </button>

    </div>

  </div>

</div>


{/* =================================================
    PERSONAL INFORMATION
================================================== */}

<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

  <div className="mb-6">

    <h2 className="text-lg font-bold">
      Personal Information
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Your basic personal information.
    </p>

  </div>

  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

    {/* FULL NAME */}
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-600">
        Full Name
      </label>

      <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">

        <User
          size={18}
          className="shrink-0 text-slate-400"
        />

        <span className="truncate text-sm font-medium">
          {profile.fullName}
        </span>

      </div>

    </div>


    {/* EMAIL */}
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-600">
        Email
      </label>

      <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">

        <Mail
          size={18}
          className="shrink-0 text-slate-400"
        />

        <span className="truncate text-sm font-medium">
          {profile.email}
        </span>

      </div>

    </div>


    {/* PHONE */}
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-600">
        Phone
      </label>

      <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">

        <Phone
          size={18}
          className="shrink-0 text-slate-400"
        />

        <span className="truncate text-sm font-medium">
          {profile.phone}
        </span>

      </div>

    </div>


    {/* ADDRESS */}
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-600">
        Address
      </label>

      <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">

        <MapPin
          size={18}
          className="shrink-0 text-slate-400"
        />

        <span className="truncate text-sm font-medium">
          {profile.address}
        </span>

      </div>

    </div>

  </div>

</div>

      {/* PUBLIC AGENT LINK */}
<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="flex items-start gap-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
      <User size={19} className="text-blue-700" />
    </div>

    <div className="min-w-0 flex-1">
      <h2 className="text-lg font-bold">
        Your Public Agent Link
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Copy this link and use it in your Facebook post captions.
      </p>

      {profile.slug ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            readOnly
            value={`${window.location.origin}/agent/${profile.slug}`}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 outline-none"
          />

          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/agent/${profile.slug}`
                );

                alert('Agent link copied!');
              } catch (error) {
                console.error('Copy link error:', error);
                alert('Unable to copy the link.');
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
          >
            Copy Link
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Your public agent link is not available yet.
          </p>

          <p className="mt-1 text-xs text-amber-700">
            Your agent account does not currently have a slug.
          </p>
        </div>
      )}
    </div>
  </div>
</div>

            {/* =================================================
                ACTIVITY
            ================================================== */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-6">

                <h2 className="text-lg font-bold">
                  Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your property activity.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <button
                  type="button"
                  className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <Heart
                        size={19}
                        className="text-slate-700"
                      />
                    </div>

                    <ChevronRight
                      size={18}
                      className="text-slate-400 transition group-hover:translate-x-1"
                    />
                  </div>

                  <h3 className="mt-4 font-semibold">
                    Saved Properties
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    View properties you've saved.
                  </p>
                </button>

                <button
                  type="button"
                  className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <FileText
                        size={19}
                        className="text-slate-700"
                      />
                    </div>

                    <ChevronRight
                      size={18}
                      className="text-slate-400 transition group-hover:translate-x-1"
                    />
                  </div>

                  <h3 className="mt-4 font-semibold">
                    Property Inquiries
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Check your property inquiries.
                  </p>
                </button>

                <button
                  type="button"
                  className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <CalendarDays
                      size={19}
                      className="text-slate-700"
                    />
                  </div>

                  <div className="flex items-start justify-between">
                    <div />

                    <ChevronRight
                      size={18}
                      className="text-slate-400 transition group-hover:translate-x-1"
                    />
                  </div>

                  <h3 className="mt-4 font-semibold">
                    Viewing Requests
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Manage scheduled property viewings.
                  </p>
                </button>

              </div>

            </div>

          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================== */}

          <div className="space-y-6">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5">

                <h2 className="text-lg font-bold">
                  Account
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your account settings.
                </p>

              </div>

              <div className="divide-y divide-slate-100">

                <button
                  type="button"
                  className="group flex w-full items-center gap-4 py-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <Lock
                      size={18}
                      className="text-slate-700"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Change Password
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Update your account password
                    </p>
                  </div>

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  className="group flex w-full items-center gap-4 py-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <Bell
                      size={18}
                      className="text-slate-700"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Notifications
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Manage notification preferences
                    </p>
                  </div>

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  className="group flex w-full items-center gap-4 py-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <ShieldCheck
                      size={18}
                      className="text-slate-700"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Security
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Review your account security
                    </p>
                  </div>

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-1"
                  />
                </button>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <ShieldCheck
                    size={19}
                    className="text-slate-700"
                  />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Account Security
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Your account security settings and
                    verification status will appear here.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          EDIT PROFILE MODAL
      ====================================================== */}

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">

              <div>
                <h2 className="text-lg font-bold">
                  Edit Profile
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Update your personal information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X size={19} />
              </button>

            </div>

            {/* BODY */}
            <div className="space-y-5 p-5 sm:p-6">

              {/* IMAGE */}
              <div className="flex flex-col items-center">

                <div className="relative">

                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">

                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User
                        size={40}
                        className="text-slate-400"
                      />
                    )}

                  </div>

                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <Camera size={14} />
                  </button>

                </div>

                <div className="mt-3 flex items-center gap-2">

                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="text-xs font-semibold text-slate-700 hover:underline"
                  >
                    Change photo
                  </button>

                  {profileImage && (
                    <>
                      <span className="text-slate-300">
                        •
                      </span>

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  )}

                </div>

                {imageError && (
                  <p className="mt-2 text-center text-xs font-medium text-red-600">
                    {imageError}
                  </p>
                )}

              </div>

              {/* FULL NAME */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name
                </label>

                <div className="relative">

                  <User
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="fullName"
                    value={editForm.fullName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />

                </div>

              </div>

              {/* EMAIL */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />

                </div>

              </div>

              {/* PHONE */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone
                </label>

                <div className="relative">

                  <Phone
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />

                </div>

              </div>

              {/* ADDRESS */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Address
                </label>

                <div className="relative">

                  <MapPin
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />

                </div>

              </div>

            </div>

            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

              <button
                type="button"
                onClick={handleCancel}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98] sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] sm:w-auto"
              >
                <Check size={16} />
                Save Changes
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}