'use client';

import {
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(
  base64String: string,
): ArrayBuffer {
  const padding =
    '='.repeat(
      (4 - (base64String.length % 4)) % 4,
    );

  const base64 =
    (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(
    rawData.length,
  );

  for (
    let index = 0;
    index < rawData.length;
    index += 1
  ) {
    outputArray[index] =
      rawData.charCodeAt(index);
  }

  return outputArray.buffer;
}

export default function AgentPushNotifications() {
  const [supported, setSupported] =
    useState<boolean | null>(null);

  const [permission, setPermission] =
    useState<NotificationPermission>('default');

  const [enabled, setEnabled] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let mounted = true;

    const checkPushSupport = async () => {
      try {
        const isSupported =
          typeof window !== 'undefined' &&
          'Notification' in window &&
          'serviceWorker' in navigator &&
          'PushManager' in window;

        if (!mounted) return;

        setSupported(isSupported);

        if (!isSupported) {
          setLoading(false);
          return;
        }

        setPermission(
          Notification.permission,
        );

        const registration =
          await navigator.serviceWorker.register(
            '/sw.js',
          );

        const existingSubscription =
          await registration.pushManager.getSubscription();

        if (!mounted) return;

        setEnabled(
          existingSubscription !== null,
        );
      } catch (checkError) {
        console.error(
          'Push notification setup check failed:',
          checkError,
        );

        if (mounted) {
          setError(
            'Unable to initialize browser notifications.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkPushSupport();

    return () => {
      mounted = false;
    };
  }, []);

  const enableNotifications = async () => {
    setSaving(true);
    setError('');

    try {
      if (
        !supported ||
        typeof window === 'undefined'
      ) {
        throw new Error(
          'Your browser does not support push notifications.',
        );
      }

      const vapidPublicKey =
        process.env
          .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        throw new Error(
          'NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.',
        );
      }

      let currentPermission =
        Notification.permission;

      if (currentPermission === 'default') {
        currentPermission =
          await Notification.requestPermission();

        setPermission(currentPermission);
      }

      if (currentPermission !== 'granted') {
        throw new Error(
          currentPermission === 'denied'
            ? 'Notifications are blocked for this website. Please allow notifications in your browser settings.'
            : 'Notification permission was not granted.',
        );
      }

      const registration =
        await navigator.serviceWorker.register(
          '/sw.js',
        );

      await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,

            applicationServerKey:
              urlBase64ToUint8Array(
                vapidPublicKey,
              ),
          });
      }

      const response = await fetch(
        '/api/push/subscribe',
        {
          method: 'POST',

          credentials: 'include',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify(
            subscription.toJSON(),
          ),
        },
      );

      const data =
        await response.json().catch(
          () => null,
        );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Failed to register this device for notifications.',
        );
      }

      setEnabled(true);
      setPermission('granted');
    } catch (enableError) {
      console.error(
        'Enable notifications failed:',
        enableError,
      );

      setError(
        enableError instanceof Error
          ? enableError.message
          : 'Failed to enable notifications.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071936] text-[#ead9b8]">
            <Loader2
              size={18}
              className="animate-spin"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-[#071936]">
              Notifications
            </p>

            <p className="text-xs text-slate-400">
              Checking notification support...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (supported === false) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
            <AlertCircle size={18} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-800">
              Notifications unavailable
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              Your current browser does not support
              push notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 bg-gradient-to-r from-[#071936] via-[#c9a96e] to-[#071936]" />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                enabled
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-[#071936] text-[#ead9b8]'
              }`}
            >
              {enabled ? (
                <CheckCircle2 size={20} />
              ) : (
                <Bell size={20} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-[#071936]">
                  Inquiry Notifications
                </p>

                {enabled && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Enabled
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Receive instant notifications when a client
                sends you an inquiry or viewing request.
              </p>

              {permission === 'denied' &&
                !enabled && (
                  <p className="mt-2 text-[11px] font-semibold text-red-600">
                    Notifications are currently blocked
                    by your browser.
                  </p>
                )}
            </div>
          </div>

          {!enabled && (
            <button
              type="button"
              onClick={enableNotifications}
              disabled={saving}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071936] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-[#102c53] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell size={16} />
                  Enable Notifications
                </>
              )}
            </button>
          )}
        </div>

        {enabled && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
            <Smartphone
              size={15}
              className="shrink-0 text-emerald-600"
            />

            <p className="text-xs font-semibold text-emerald-700">
              This device is registered for BREA 88
              notifications.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
            <BellOff
              size={15}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <p className="text-xs font-semibold leading-5 text-red-600">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}