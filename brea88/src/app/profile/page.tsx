'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

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
  Link as LinkIcon,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  BriefcaseBusiness,
  Sparkles,
  Globe2,
  CircleCheck,
  AtSign,
} from 'lucide-react';

type Profile = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  slug: string;
  bio: string;
  facebook: string;
  messenger: string;
  profileImage: string | null;
};

const EMPTY_PROFILE: Profile = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  role: '',
  slug: '',
  bio: '',
  facebook: '',
  messenger: '',
  profileImage: null,
};

export default function ProfilePage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);

  const [profileImage, setProfileImage] =
    useState<string | null>(null);

  const [imageError, setImageError] = useState('');

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [removingImage, setRemovingImage] =
    useState(false);

  const [copiedLink, setCopiedLink] =
    useState(false);

  const [profile, setProfile] =
    useState<Profile>(EMPTY_PROFILE);

  const [editForm, setEditForm] =
    useState<Profile>(EMPTY_PROFILE);

  // =========================================================
  // LOAD CURRENT AGENT
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadAgentProfile = async () => {
      try {
        setCheckingAuth(true);

        const response = await fetch(
          '/api/agent/me',
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data?.agent
        ) {
          router.replace('/agent/login');
          return;
        }

        const agent = data.agent;

        const agentProfile: Profile = {
          fullName:
            agent.fullName ?? '',

          email:
            agent.email ?? '',

          phone:
            agent.phone ?? '',

          address:
            agent.address ?? '',

          role:
            agent.role ?? '',

          slug:
            agent.slug ?? '',

          bio:
            agent.bio ?? '',

          facebook:
            agent.facebook ?? '',

          messenger:
            agent.messenger ?? '',

          profileImage:
            agent.profileImage ?? null,
        };

        if (!mounted) return;

        setProfile(agentProfile);
        setEditForm(agentProfile);
        setProfileImage(
          agentProfile.profileImage
        );
      } catch (error) {
        console.error(
          'Authentication check failed:',
          error
        );

        if (mounted) {
          router.replace('/agent/login');
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };

    loadAgentProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  // =========================================================
  // EDIT PROFILE
  // =========================================================

  const handleEdit = () => {
    setEditForm({
      ...profile,
      profileImage,
    });

    setImageError('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditForm({
      ...profile,
      profileImage,
    });

    setImageError('');
    setIsEditing(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
    } = e.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleBioChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const {
      name,
      value,
    } = e.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSavingProfile(true);

      const payload: Profile = {
        ...editForm,
        profileImage,
      };

      const response = await fetch(
        '/api/agent/profile/update',
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data?.message ||
            'Failed to update profile.'
        );

        return;
      }

      const updatedAgent =
        data.agent;

      const updatedProfile: Profile = {
        fullName:
          updatedAgent.fullName ?? '',

        email:
          updatedAgent.email ?? '',

        phone:
          updatedAgent.phone ?? '',

        address:
          updatedAgent.address ?? '',

        role:
          updatedAgent.role ?? '',

        slug:
          updatedAgent.slug ?? '',

        bio:
          updatedAgent.bio ?? '',

        facebook:
          updatedAgent.facebook ?? '',

        messenger:
          updatedAgent.messenger ?? '',

        profileImage:
          updatedAgent.profileImage ??
          null,
      };

      setProfile(updatedProfile);

      setEditForm(updatedProfile);

      setProfileImage(
        updatedProfile.profileImage
      );

      setIsEditing(false);

      alert(
        'Profile updated successfully.'
      );
    } catch (error) {
      console.error(
        'Profile update error:',
        error
      );

      alert(
        'Unable to update profile.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  const handleCameraClick = () => {
    if (
      uploadingImage ||
      removingImage
    ) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

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

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setImageError(
        'Image size must be less than 5MB.'
      );

      e.target.value = '';

      return;
    }

    try {
      setUploadingImage(true);

      const formData =
        new FormData();

      formData.append(
        'file',
        file
      );

      const response =
        await fetch(
          '/api/agent/profile/upload',
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success ||
        !data?.url
      ) {
        throw new Error(
          data?.message ||
            'Profile image upload failed.'
        );
      }

      const uploadedUrl =
        data.url as string;

      setProfileImage(
        uploadedUrl
      );

      setProfile(
        (previous) => ({
          ...previous,
          profileImage:
            uploadedUrl,
        })
      );

      setEditForm(
        (previous) => ({
          ...previous,
          profileImage:
            uploadedUrl,
        })
      );

      setImageError('');
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
      setUploadingImage(false);

      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (removingImage) return;

    setRemovingImage(true);

    setProfileImage(null);

    setProfile(
      (previous) => ({
        ...previous,
        profileImage: null,
      })
    );

    setEditForm(
      (previous) => ({
        ...previous,
        profileImage: null,
      })
    );

    setImageError('');

    setTimeout(() => {
      setRemovingImage(false);
    }, 250);
  };

  // =========================================================
  // PUBLIC PROFILE LINK
  // =========================================================

  const publicAgentUrl =
    typeof window !== 'undefined' &&
    profile.slug
      ? `${window.location.origin}/agent/${profile.slug}`
      : '';

  const handleCopyAgentLink =
    async () => {
      if (!publicAgentUrl) return;

      try {
        await navigator.clipboard.writeText(
          publicAgentUrl
        );

        setCopiedLink(true);

        setTimeout(() => {
          setCopiedLink(false);
        }, 2000);
      } catch (error) {
        console.error(
          'Failed to copy agent link:',
          error
        );

        alert(
          'Unable to copy the link.'
        );
      }
    };

  const handleOpenPublicProfile =
    () => {
      if (!publicAgentUrl) return;

      window.open(
        publicAgentUrl,
        '_blank',
        'noopener,noreferrer'
      );
    };

  // =========================================================
  // HELPERS
  // =========================================================

  const displayRole =
    profile.role === 'Broker'
      ? 'Broker'
      : 'Agent';

  const initials =
    profile.fullName
      ? profile.fullName
          .trim()
          .split(/\s+/)
          .map(
            (name) =>
              name.charAt(0)
          )
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'A';

  // =========================================================
  // LOADING
  // =========================================================

  if (checkingAuth) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06142d] px-4">

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative z-10 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">

            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />

          </div>

          <p className="mt-5 text-sm font-semibold text-white">
            Loading your profile
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait a moment...
          </p>

        </div>
      </main>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">

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
          PREMIUM PAGE HEADER
      ====================================================== */}

      <header className="relative overflow-hidden border-b border-slate-200/80 bg-white">

        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="absolute bottom-0 left-1/2 h-32 w-96 -translate-x-1/2 rounded-full bg-blue-600/5 blur-3xl" />

        </div>

        <div className="relative z-10">

          {/* Back row */}

          <div className="border-b border-slate-200/70">

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

              <button
                type="button"
                onClick={() =>
                  router.back()
                }
                className="group inline-flex items-center gap-2 py-4 text-sm font-semibold text-slate-500 transition-all duration-200 hover:text-blue-900"
              >

                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">

                  <ChevronLeft
                    size={17}
                    strokeWidth={2.3}
                  />

                </span>

                <span>
                  Back
                </span>

              </button>

            </div>

          </div>

          {/* Header content */}

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

            <div className="max-w-3xl">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">

                <Sparkles
                  size={13}
                  className="text-blue-700"
                />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">
                  Account Center
                </span>

              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">

                My Profile

              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">

                Manage your professional information,
                public profile, and account preferences
                from one place.

              </p>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Background glow */}

        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* =================================================
              LEFT / MAIN COLUMN
          ================================================== */}

          <div className="space-y-6 xl:col-span-2">

            {/* =================================================
                PREMIUM PROFILE HERO
            ================================================== */}

            <section className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">

              {/* Cover */}

              <div className="relative h-36 overflow-hidden sm:h-44 md:h-52">

                <div className="absolute inset-0 bg-[#06142d]" />

                <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-[#0b2a6f] to-cyan-900" />

                <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

                <div className="absolute -left-20 bottom-[-100px] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.12),transparent_35%)]" />

                {/* Pattern */}

                <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:32px_32px]" />

                {/* Cover label */}

                <div className="absolute right-4 top-4 sm:right-6 sm:top-5">

                  <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">

                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/80">
                      BREA 88 REALTY
                    </span>

                  </div>

                </div>

              </div>

              {/* Profile information */}

              <div className="relative px-5 pb-7 sm:px-7 md:px-8">

                <div className="-mt-16 flex flex-col gap-5 sm:-mt-20 lg:flex-row lg:items-end lg:justify-between">

                  {/* User identity */}

                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">

                    {/* Profile picture */}

                    <div className="relative shrink-0">

                      <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-[5px] border-white bg-gradient-to-br from-slate-100 to-slate-200 shadow-[0_12px_35px_rgba(15,23,42,0.20)] sm:h-36 sm:w-36">

                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt={`${profile.fullName} profile`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">

                            <span className="text-4xl font-bold text-blue-900/70">
                              {initials}
                            </span>

                          </div>
                        )}

                        {(uploadingImage ||
                          removingImage) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#06142d]/70 backdrop-blur-sm">

                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          </div>
                        )}

                      </div>

                      {/* Camera */}

                      <button
                        type="button"
                        onClick={handleCameraClick}
                        disabled={
                          uploadingImage ||
                          removingImage
                        }
                        aria-label="Change profile photo"
                        className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-blue-700 text-white shadow-lg transition-all duration-200 hover:bg-blue-800 hover:shadow-blue-900/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >

                        <Camera
                          size={17}
                          strokeWidth={2.2}
                        />

                      </button>

                    </div>

                    {/* Identity */}

                    <div className="min-w-0 flex-1 pb-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="break-words text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">
                          {profile.fullName ||
                            'Your Name'}
                        </h2>

                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-800">

                          <BriefcaseBusiness
                            size={12}
                          />

                          {displayRole}

                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">

                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                          Active

                        </span>

                      </div>

                      <p className="mt-2 flex items-center gap-2 truncate text-sm text-slate-500">

                        <Mail
                          size={14}
                          className="shrink-0 text-slate-400"
                        />

                        {profile.email ||
                          'No email available'}

                      </p>

                    </div>

                  </div>

                  {/* Actions */}

                  <div className="flex flex-wrap gap-2 pb-1">

                    <button
                      type="button"
                      onClick={
                        handleOpenPublicProfile
                      }
                      disabled={
                        !publicAgentUrl
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <ExternalLink
                        size={16}
                      />

                      <span>
                        Public Profile
                      </span>

                    </button>

                    <button
                      type="button"
                      onClick={
                        isEditing
                          ? handleCancel
                          : handleEdit
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:from-blue-900 hover:to-blue-700 hover:shadow-[0_10px_25px_rgba(37,99,235,0.30)] active:scale-[0.98]"
                    >

                      {isEditing ? (
                        <>
                          <X
                            size={16}
                          />

                          Cancel
                        </>
                      ) : (
                        <>
                          <Pencil
                            size={16}
                          />

                          Edit Profile
                        </>
                      )}

                    </button>

                  </div>

                </div>

                {/* Image controls */}

                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">

                  <button
                    type="button"
                    onClick={
                      handleCameraClick
                    }
                    disabled={
                      uploadingImage
                    }
                    className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-50 disabled:opacity-50"
                  >

                    <ImageIcon
                      size={14}
                    />

                    {profileImage
                      ? 'Change photo'
                      : 'Add photo'}

                  </button>

                  {profileImage && (
                    <button
                      type="button"
                      onClick={
                        handleRemoveImage
                      }
                      disabled={
                        removingImage
                      }
                      className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >

                      <Trash2
                        size={14}
                      />

                      Remove photo

                    </button>
                  )}

                  <span className="ml-auto text-[10px] text-slate-400">
                    JPG, PNG or WebP · Max 5MB
                  </span>

                </div>

                {imageError && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                    {imageError}
                  </div>
                )}

              </div>

            </section>

            {/* =================================================
                EDIT FORM
            ================================================== */}

            {isEditing && (
              <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)]">

                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/50 px-5 py-5 sm:px-7">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">

                      <Pencil
                        size={18}
                      />

                    </div>

                    <div>

                      <h3 className="text-base font-bold text-slate-950">
                        Edit Profile
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Update the information clients
                        see on your professional profile.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="space-y-6 p-5 sm:p-7">

                  {/* Name / email */}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    <div>

                      <label
                        htmlFor="fullName"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                      >
                        Full Name
                      </label>

                      <div className="relative">

                        <User
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="fullName"
                          name="fullName"
                          value={
                            editForm.fullName
                          }
                          onChange={
                            handleChange
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Your full name"
                        />

                      </div>

                    </div>

                    <div>

                      <label
                        htmlFor="email"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                      >
                        Email Address
                      </label>

                      <div className="relative">

                        <Mail
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={
                            editForm.email
                          }
                          onChange={
                            handleChange
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="you@example.com"
                        />

                      </div>

                    </div>

                  </div>

                  {/* Phone / address */}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    <div>

                      <label
                        htmlFor="phone"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                      >
                        Phone Number
                      </label>

                      <div className="relative">

                        <Phone
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="phone"
                          name="phone"
                          value={
                            editForm.phone
                          }
                          onChange={
                            handleChange
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="09XX XXX XXXX"
                        />

                      </div>

                    </div>

                    <div>

                      <label
                        htmlFor="address"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                      >
                        Address
                      </label>

                      <div className="relative">

                        <MapPin
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
                        />

                        <input
                          id="address"
                          name="address"
                          value={
                            editForm.address
                          }
                          onChange={
                            handleChange
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Your address"
                        />

                      </div>

                    </div>

                  </div>

                  {/* Bio */}

                  <div>

                    <label
                      htmlFor="bio"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                    >
                      Professional Bio
                    </label>

                    <textarea
                      id="bio"
                      name="bio"
                      value={
                        editForm.bio
                      }
                      onChange={
                        handleBioChange
                      }
                      rows={5}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Tell clients a little about yourself and your real estate experience..."
                    />

                  </div>

                  {/* Social */}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    <div>

                      <label
                        htmlFor="facebook"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                      >
                        Facebook
                      </label>

                      <div className="relative">

                        <Globe2
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="facebook"
                          name="facebook"
                          value={
                            editForm.facebook
                          }
                          onChange={
                            handleChange
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Facebook profile URL"
                        />

                      </div>

                    </div>

                    <div>

                      <label
                        htmlFor="messenger"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                      >
                        Messenger
                      </label>

                      <div className="relative">

                        <MessageCircle
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="messenger"
                          name="messenger"
                          value={
                            editForm.messenger
                          }
                          onChange={
                            handleChange
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Messenger link"
                        />

                      </div>

                    </div>

                  </div>

                  {/* Actions */}

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                    <button
                      type="button"
                      onClick={
                        handleCancel
                      }
                      disabled={
                        savingProfile
                      }
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleSave
                      }
                      disabled={
                        savingProfile
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-all hover:from-blue-900 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {savingProfile ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          Saving...
                        </>
                      ) : (
                        <>
                          <Check
                            size={16}
                          />

                          Save Changes
                        </>
                      )}

                    </button>

                  </div>

                </div>

              </section>
            )}

            {/* =================================================
                PERSONAL INFORMATION
            ================================================== */}

            <section className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">

                    <User
                      size={18}
                    />

                  </div>

                  <div>

                    <h3 className="text-base font-bold text-slate-950">
                      Personal Information
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Your professional contact details
                    </p>

                  </div>

                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={
                      handleEdit
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 transition-all hover:bg-blue-50"
                  >

                    <Pencil
                      size={13}
                    />

                    Edit

                  </button>
                )}

              </div>

              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-b-3xl bg-slate-100 sm:grid-cols-2">

                {/* Full name */}

                <div className="bg-white p-5 sm:p-6">

                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Full Name
                  </p>

                  <div className="mt-2 flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                      <User
                        size={15}
                      />
                    </div>

                    <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                      {profile.fullName ||
                        'Not provided'}
                    </p>

                  </div>

                </div>

                {/* Email */}

                <div className="bg-white p-5 sm:p-6">

                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Email Address
                  </p>

                  <div className="mt-2 flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                      <Mail
                        size={15}
                      />
                    </div>

                    <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                      {profile.email ||
                        'Not provided'}
                    </p>

                  </div>

                </div>

                {/* Phone */}

                <div className="bg-white p-5 sm:p-6">

                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Phone Number
                  </p>

                  <div className="mt-2 flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                      <Phone
                        size={15}
                      />
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      {profile.phone ||
                        'Not provided'}
                    </p>

                  </div>

                </div>

                {/* Address */}

                <div className="bg-white p-5 sm:p-6">

                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Address
                  </p>

                  <div className="mt-2 flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                      <MapPin
                        size={15}
                      />
                    </div>

                    <p className="text-sm font-semibold leading-6 text-slate-800">
                      {profile.address ||
                        'Not provided'}
                    </p>

                  </div>

                </div>

              </div>

              {/* Bio */}

              <div className="border-t border-slate-100 p-5 sm:p-7">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Professional Bio
                </p>

                <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">

                  <p className="text-sm leading-7 text-slate-600">

                    {profile.bio ||
                      'Add a professional bio so clients can learn more about you.'}

                  </p>

                </div>

              </div>

            </section>

            {/* =================================================
                SOCIAL PRESENCE
            ================================================== */}

            <section className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">

              <div className="border-b border-slate-100 px-5 py-5 sm:px-7">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">

                    <Globe2
                      size={18}
                    />

                  </div>

                  <div>

                    <h3 className="text-base font-bold text-slate-950">
                      Social Presence
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Connect clients with your online profiles
                    </p>

                  </div>

                </div>

              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-7">

                <div className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/50">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">

                      <Globe2
                        size={18}
                      />

                    </div>

                    <div className="min-w-0">

                      <p className="text-xs font-bold text-slate-800">
                        Facebook
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {profile.facebook ||
                          'Not connected'}
                      </p>

                    </div>

                  </div>

                </div>

                <div className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/50">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">

                      <MessageCircle
                        size={18}
                      />

                    </div>

                    <div className="min-w-0">

                      <p className="text-xs font-bold text-slate-800">
                        Messenger
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {profile.messenger ||
                          'Not connected'}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================== */}

          <aside className="space-y-6">

            {/* =================================================
                PROFILE STATUS
            ================================================== */}

            <section className="relative overflow-hidden rounded-3xl bg-[#06142d] p-6 text-white shadow-[0_20px_55px_rgba(6,20,45,0.20)]">

              <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">
                      Account Status
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Profile Overview
                    </h3>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10">

                    <ShieldCheck
                      size={21}
                      className="text-cyan-300"
                    />

                  </div>

                </div>

                <div className="mt-6 space-y-3">

                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">

                    <span className="text-xs text-slate-400">
                      Role
                    </span>

                    <span className="text-xs font-bold text-white">
                      {displayRole}
                    </span>

                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">

                    <span className="text-xs text-slate-400">
                      Account
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">

                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                      Active

                    </span>

                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">

                    <span className="text-xs text-slate-400">
                      Public Profile
                    </span>

                    <span className="text-xs font-bold text-cyan-300">
                      {profile.slug
                        ? 'Available'
                        : 'Unavailable'}
                    </span>

                  </div>

                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-5">

                  <CircleCheck
                    size={15}
                    className="shrink-0 text-cyan-300"
                  />

                  <p className="text-[11px] leading-5 text-slate-400">
                    Your account is secured through
                    authenticated BREA 88 access.
                  </p>

                </div>

              </div>

            </section>

            {/* =================================================
                PUBLIC PROFILE
            ================================================== */}

            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">

              <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-6 py-6">

                <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-blue-200/40 blur-2xl" />

                <div className="relative">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-white shadow-lg shadow-blue-900/15">

                    <LinkIcon
                      size={19}
                    />

                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-950">
                    Your Public Profile
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    Share your BREA 88 profile with
                    potential clients.
                  </p>

                </div>

              </div>

              <div className="p-5">

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">

                  <div className="flex items-center gap-2">

                    <AtSign
                      size={14}
                      className="shrink-0 text-blue-600"
                    />

                    <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">
                      {profile.slug
                        ? `/agent/${profile.slug}`
                        : 'Profile link unavailable'}
                    </p>

                  </div>

                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={
                      handleCopyAgentLink
                    }
                    disabled={
                      !publicAgentUrl
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {copiedLink ? (
                      <>
                        <Check
                          size={14}
                        />

                        Copied
                      </>
                    ) : (
                      <>
                        <Copy
                          size={14}
                        />

                        Copy Link
                      </>
                    )}

                  </button>

                  <button
                    type="button"
                    onClick={
                      handleOpenPublicProfile
                    }
                    disabled={
                      !publicAgentUrl
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-800 px-3 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <ExternalLink
                      size={14}
                    />

                    Open

                  </button>

                </div>

              </div>

            </section>

            {/* =================================================
                ACCOUNT & SECURITY
            ================================================== */}

            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">

              <div className="border-b border-slate-100 px-6 py-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                  Account
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  Security & Settings
                </h3>

              </div>

              <div className="divide-y divide-slate-100">

                {/* Password */}

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/profile/security'
                    )
                  }
                  className="group flex w-full items-center gap-4 px-6 py-4 text-left transition-all duration-200 hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all group-hover:bg-blue-50 group-hover:text-blue-700">

                    <Lock
                      size={17}
                    />

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-bold text-slate-800">
                      Change Password
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Update your account password
                    </p>

                  </div>

                  <ChevronRight
                    size={16}
                    className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
                  />

                </button>

                {/* Notifications */}

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Notification settings are coming soon.'
                    )
                  }
                  className="group flex w-full items-center gap-4 px-6 py-4 text-left transition-all duration-200 hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all group-hover:bg-blue-50 group-hover:text-blue-700">

                    <Bell
                      size={17}
                    />

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-bold text-slate-800">
                      Notifications
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Manage account notifications
                    </p>

                  </div>

                  <ChevronRight
                    size={16}
                    className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
                  />

                </button>

                {/* Security */}

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/profile/security'
                    )
                  }
                  className="group flex w-full items-center gap-4 px-6 py-4 text-left transition-all duration-200 hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all group-hover:bg-blue-50 group-hover:text-blue-700">

                    <ShieldCheck
                      size={17}
                    />

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-bold text-slate-800">
                      Security
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Protect your BREA 88 account
                    </p>

                  </div>

                  <ChevronRight
                    size={16}
                    className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
                  />

                </button>

              </div>

            </section>

            {/* =================================================
                QUICK ACTIVITY
            ================================================== */}

            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">

              <div className="border-b border-slate-100 px-6 py-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                  Workspace
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  Your Activity
                </h3>

              </div>

              <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

                <div className="group p-5 transition-all hover:bg-slate-50">

                  <div className="flex items-center justify-between">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">

                      <Heart
                        size={17}
                      />

                    </div>

                    <ChevronRight
                      size={15}
                      className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600"
                    />

                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-800">
                    Saved Properties
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    View properties you saved
                  </p>

                </div>

                <div className="group p-5 transition-all hover:bg-slate-50">

                  <div className="flex items-center justify-between">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">

                      <FileText
                        size={17}
                      />

                    </div>

                    <ChevronRight
                      size={15}
                      className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600"
                    />

                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-800">
                    Property Inquiries
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Manage client inquiries
                  </p>

                </div>

                <div className="group p-5 transition-all hover:bg-slate-50">

                  <div className="flex items-center justify-between">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">

                      <CalendarDays
                        size={17}
                      />

                    </div>

                    <ChevronRight
                      size={15}
                      className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600"
                    />

                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-800">
                    Viewing Requests
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Track scheduled viewings
                  </p>

                </div>

              </div>

            </section>

          </aside>

        </div>

      </section>

      {/* =====================================================
          PREMIUM FOOTER ACCENT
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm">

          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-700 via-blue-500 to-cyan-400" />

          <div className="flex flex-col gap-2 pl-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-[#a67c32]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">
                Service with a Heart
              </p>

            </div>

            <p className="text-[11px] text-slate-400">
              BREA 88 REALTY OPC
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}