'use client';

import React from 'react';

export default function ButterflyLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-900" />
    </div>
  );
}
