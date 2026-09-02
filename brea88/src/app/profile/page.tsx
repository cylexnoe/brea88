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

        /*
         * IMPORTANT:
         * profileImage is the persistent Vercel Blob URL.
         * We load it directly from the database response.
         */
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
    /*
     * Always start editing with the latest profile data.
     */
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

      /*
       * Always use the latest profile image.
       *
       * This prevents a newly uploaded Vercel Blob URL
       * from being overwritten with an old/null value.
       */
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
    if (uploadingImage) return;

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

      /*
       * IMPORTANT FIX
       *
       * The upload API already saves the image
       * to the Agent.profileImage field.
       *
       * We now update ALL local states too.
       *
       * This prevents Save Profile from sending
       * an old/null profileImage back to the API.
       */
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

      /*
       * Allow selecting the same file again.
       */
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    /*
     * IMPORTANT:
     *
     * profileImage is a Vercel Blob URL.
     *
     * DO NOT use:
     * URL.revokeObjectURL(profileImage)
     *
     * because this is not a temporary browser
     * object URL created with URL.createObjectURL().
     */

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

    setRemovingImage(false);
  };

  // =========================================================
  // PUBLIC AGENT LINK
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
  // LOADING
  // =========================================================

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-200 border-t-slate-900">
            <span className="sr-only">
              Loading
            </span>
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

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

        <div className="border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">

            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-blue-950 active:scale-[0.97]"
            >
              <ChevronLeft
                size={18}
                strokeWidth={2.3}
              />

              <span>
                Back
              </span>
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
            Manage your personal information,
            account settings, and property
            activity.
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
                  <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-end">

                    {/* PROFILE IMAGE */}
                    <div className="relative shrink-0">

                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md sm:h-32 sm:w-32">

                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt={`${profile.fullName || 'Agent'} profile`}
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

                      {/* CAMERA BUTTON */}
                      <button
                        type="button"
                        onClick={
                          handleCameraClick
                        }
                        disabled={
                          uploadingImage
                        }
                        aria-label="Change profile picture"
                        className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-white shadow-md transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploadingImage ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          <Camera
                            size={17}
                          />
                        )}
                      </button>

                    </div>

                    {/* USER INFORMATION */}
                    <div className="min-w-0 pb-1">

                      <h2 className="break-words text-xl font-bold sm:text-2xl">
                        {profile.fullName ||
                          'Agent'}
                      </h2>

                      <div className="mt-1 flex max-w-full items-center gap-2 text-sm text-slate-500">

                        <Mail
                          size={15}
                          className="shrink-0"
                        />

                        <span className="break-all">
                          {profile.email}
                        </span>

                      </div>

                      {profile.role && (
                        <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {profile.role}
                        </div>
                      )}

                    </div>

                  </div>

                  {/* EDIT */}
                  <button
                    type="button"
                    onClick={
                      handleEdit
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] sm:w-auto"
                  >
                    <Pencil
                      size={16}
                    />

                    Edit Profile
                  </button>

                </div>

                {/* IMAGE ACTIONS */}
                {profileImage && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">

                    <button
                      type="button"
                      onClick={
                        handleCameraClick
                      }
                      disabled={
                        uploadingImage
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Camera
                        size={14}
                      />

                      Change Photo
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleRemoveImage
                      }
                      disabled={
                        removingImage ||
                        uploadingImage
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2
                        size={14}
                      />

                      Remove Photo
                    </button>

                  </div>
                )}

                {imageError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {imageError}
                  </div>
                )}

                <p className="mt-3 text-xs text-slate-400">
                  JPG, PNG, or WebP. Maximum
                  file size: 5MB.
                </p>

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
                  Your basic personal
                  information.
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
                      {profile.fullName ||
                        'Not provided'}
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
                      {profile.email ||
                        'Not provided'}
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
                      {profile.phone ||
                        'Not provided'}
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
                      {profile.address ||
                        'Not provided'}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                PUBLIC AGENT LINK
            ================================================== */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <LinkIcon
                    size={19}
                    className="text-blue-700"
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <h2 className="text-lg font-bold">
                    Your Public Agent Link
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Copy this link and use it
                    in your Facebook post
                    captions.
                  </p>

                  {profile.slug ? (
                    <>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                        <input
                          type="text"
                          readOnly
                          value={
                            publicAgentUrl
                          }
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 outline-none"
                        />

                        <button
                          type="button"
                          onClick={
                            handleCopyAgentLink
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
                        >
                          {copiedLink ? (
                            <>
                              <Check
                                size={16}
                              />

                              Copied
                            </>
                          ) : (
                            <>
                              <Copy
                                size={16}
                              />

                              Copy Link
                            </>
                          )}
                        </button>

                      </div>

                      <button
                        type="button"
                        onClick={
                          handleOpenPublicProfile
                        }
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                      >
                        View Public Profile

                        <ExternalLink
                          size={15}
                        />
                      </button>
                    </>
                  ) : (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Your public agent link
                      is not available yet.
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* =================================================
                BIO
            ================================================== */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-5">

                <h2 className="text-lg font-bold">
                  About Me
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  A short description about
                  yourself as a real estate
                  agent.
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                {profile.bio ? (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-sm italic text-slate-400">
                    No bio has been added yet.
                  </p>
                )}

              </div>

            </div>

            {/* =================================================
                SOCIAL / CONTACT
            ================================================== */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-5">

                <h2 className="text-lg font-bold">
                  Contact Links
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your public contact information.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Facebook
                  </p>

                  <p className="mt-2 break-all text-sm font-medium text-slate-700">
                    {profile.facebook ||
                      'Not provided'}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Messenger
                  </p>

                  <p className="mt-2 break-all text-sm font-medium text-slate-700">
                    {profile.messenger ||
                      'Not provided'}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================== */}

          <div className="space-y-6">

            {/* ACCOUNT SETTINGS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-lg font-bold">
                Account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your account settings.
              </p>

              <div className="mt-5 space-y-2">

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Change password feature is coming soon.'
                    )
                  }
                  className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <Lock
                      size={18}
                      className="text-slate-600"
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-semibold">
                      Change Password
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Update your password
                    </p>

                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300 transition group-hover:translate-x-0.5"
                  />

                </button>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Notification settings are coming soon.'
                    )
                  }
                  className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <Bell
                      size={18}
                      className="text-slate-600"
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-semibold">
                      Notifications
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Manage notifications
                    </p>

                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300 transition group-hover:translate-x-0.5"
                  />

                </button>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Security settings are coming soon.'
                    )
                  }
                  className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <ShieldCheck
                      size={18}
                      className="text-slate-600"
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-semibold">
                      Security
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Review account security
                    </p>

                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300 transition group-hover:translate-x-0.5"
                  />

                </button>

              </div>

            </div>

            {/* ACTIVITY */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <h2 className="text-lg font-bold">
                Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your property activity.
              </p>

              <div className="mt-5 space-y-2">

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Saved properties feature is coming soon.'
                    )
                  }
                  className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <Heart
                      size={18}
                      className="text-red-500"
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-semibold">
                      Saved Properties
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Properties you saved
                    </p>

                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300"
                  />

                </button>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Property inquiries feature is coming soon.'
                    )
                  }
                  className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <FileText
                      size={18}
                      className="text-blue-600"
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-semibold">
                      Property Inquiries
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Your submitted inquiries
                    </p>

                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300"
                  />

                </button>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Viewing requests feature is coming soon.'
                    )
                  }
                  className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <CalendarDays
                      size={18}
                      className="text-emerald-600"
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-semibold">
                      Viewing Requests
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Your scheduled viewings
                    </p>

                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300"
                  />

                </button>

              </div>

            </div>

            {/* PROFILE STATUS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2
                    size={19}
                    className="text-emerald-600"
                  />
                </div>

                <div>

                  <h2 className="text-sm font-bold">
                    Profile Status
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your agent profile is
                    connected to your account.
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">

          <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">

            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">

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
                onClick={
                  handleCancel
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X
                  size={19}
                />
              </button>

            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">

              <div className="space-y-5">

                {/* PROFILE IMAGE */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Profile Picture
                  </label>

                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row">

                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow">

                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User
                          size={38}
                          className="text-slate-300"
                        />
                      )}

                    </div>

                    <div className="flex flex-1 flex-col items-center sm:items-start">

                      <p className="text-sm font-semibold">
                        Profile photo
                      </p>

                      <p className="mt-1 text-center text-xs text-slate-500 sm:text-left">
                        Choose a clear photo that
                        represents you as a real
                        estate agent.
                      </p>

                      <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">

                        <button
                          type="button"
                          onClick={
                            handleCameraClick
                          }
                          disabled={
                            uploadingImage
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          <Camera
                            size={14}
                          />

                          {uploadingImage
                            ? 'Uploading...'
                            : 'Choose Photo'}
                        </button>

                        {profileImage && (
                          <button
                            type="button"
                            onClick={
                              handleRemoveImage
                            }
                            disabled={
                              uploadingImage
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2
                              size={14}
                            />

                            Remove
                          </button>
                        )}

                      </div>

                    </div>

                  </div>

                  {imageError && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {imageError}
                    </p>
                  )}

                </div>

                {/* FULL NAME */}
                <div>

                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full Name
                  </label>

                  <div className="relative">

                    <User
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={
                        editForm.fullName
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      placeholder="Enter your full name"
                    />

                  </div>

                </div>

                {/* EMAIL */}
                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email
                  </label>

                  <div className="relative">

                    <Mail
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
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
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      placeholder="Enter your email"
                    />

                  </div>

                </div>

                {/* PHONE */}
                <div>

                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone
                  </label>

                  <div className="relative">

                    <Phone
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={
                        editForm.phone
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      placeholder="Enter your phone number"
                    />

                  </div>

                </div>

                {/* ADDRESS */}
                <div>

                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Address
                  </label>

                  <div className="relative">

                    <MapPin
                      size={17}
                      className="absolute left-3.5 top-3.5 text-slate-400"
                    />

                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={
                        editForm.address
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      placeholder="Enter your address"
                    />

                  </div>

                </div>

                {/* BIO */}
                <div>

                  <label
                    htmlFor="bio"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Bio
                  </label>

                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={
                      editForm.bio
                    }
                    onChange={
                      handleBioChange
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    placeholder="Tell clients a little about yourself..."
                  />

                </div>

                {/* FACEBOOK */}
                <div>

                  <label
                    htmlFor="facebook"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Facebook
                  </label>

                  <input
                    id="facebook"
                    name="facebook"
                    type="text"
                    value={
                      editForm.facebook
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    placeholder="Facebook profile URL"
                  />

                </div>

                {/* MESSENGER */}
                <div>

                  <label
                    htmlFor="messenger"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Messenger
                  </label>

                  <input
                    id="messenger"
                    name="messenger"
                    type="text"
                    value={
                      editForm.messenger
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    placeholder="Messenger link"
                  />

                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

              <button
                type="button"
                onClick={
                  handleCancel
                }
                disabled={
                  savingProfile
                }
                className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  savingProfile ||
                  uploadingImage
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {savingProfile ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                    Saving...
                  </>
                ) : (
                  <>
                    <Check
                      size={16}
                    />

                    Save Profile
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}