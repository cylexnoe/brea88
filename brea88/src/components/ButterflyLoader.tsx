'use client';

import React from 'react';

export default function ButterflyLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-white">
      
      {/* Soft background glow */}
      <div className="absolute h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />

      <div className="relative flex flex-col items-center">

        {/* BUTTERFLY */}
        <div className="butterfly">

          {/* Left wing */}
          <div className="wing wing-left">
            <div className="wing-inner" />
          </div>

          {/* Right wing */}
          <div className="wing wing-right">
            <div className="wing-inner" />
          </div>

          {/* Body */}
          <div className="body">
            <div className="head" />
          </div>

          {/* Antennae */}
          <div className="antenna antenna-left" />
          <div className="antenna antenna-right" />

        </div>

        {/* Loading text */}
        <div className="mt-8 text-center">

          <p className="text-sm font-black tracking-[0.25em] text-blue-950">
            BREA 88 REALTY
          </p>

          <p className="mt-2 text-xs font-medium text-slate-400">
            Loading...
          </p>

          {/* Loading dots */}
          <div className="mt-3 flex justify-center gap-1.5">
            <span className="loading-dot" />
            <span className="loading-dot delay-1" />
            <span className="loading-dot delay-2" />
          </div>

        </div>

      </div>

      <style jsx>{`
        .butterfly {
          position: relative;
          width: 110px;
          height: 100px;
          animation: float 2.8s ease-in-out infinite;
        }

        .wing {
          position: absolute;
          top: 18px;
          width: 48px;
          height: 65px;
          border-radius: 70% 30% 65% 35%;
          background: linear-gradient(
            135deg,
            #172554 0%,
            #1d4ed8 45%,
            #60a5fa 100%
          );
          box-shadow:
            0 10px 25px rgba(30, 64, 175, 0.25),
            inset 0 0 12px rgba(255,255,255,0.25);
        }

        .wing-left {
          left: 6px;
          transform-origin: right center;
          animation: flap-left 0.8s ease-in-out infinite;
        }

        .wing-right {
          right: 6px;
          border-radius: 30% 70% 35% 65%;
          transform-origin: left center;
          animation: flap-right 0.8s ease-in-out infinite;
        }

        .wing-inner {
          position: absolute;
          inset: 9px;
          border-radius: inherit;
          border: 2px solid rgba(255,255,255,0.35);
        }

        .body {
          position: absolute;
          left: 50%;
          top: 29px;
          width: 10px;
          height: 52px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: linear-gradient(
            to bottom,
            #0f172a,
            #334155,
            #0f172a
          );
          z-index: 5;
        }

        .head {
          position: absolute;
          top: -7px;
          left: 50%;
          width: 14px;
          height: 14px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: #0f172a;
        }

        .antenna {
          position: absolute;
          top: 20px;
          width: 24px;
          height: 16px;
          border-top: 2px solid #334155;
          z-index: 4;
        }

        .antenna-left {
          left: 42px;
          transform: rotate(-35deg);
          border-radius: 50% 0 0 0;
        }

        .antenna-right {
          right: 42px;
          transform: rotate(35deg);
          border-radius: 0 50% 0 0;
        }

        .loading-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #1d4ed8;
          animation: pulse-dot 1.2s ease-in-out infinite;
        }

        .delay-1 {
          animation-delay: 0.2s;
        }

        .delay-2 {
          animation-delay: 0.4s;
        }

        @keyframes flap-left {
          0%, 100% {
            transform: rotateY(0deg) rotateZ(-3deg);
          }
          50% {
            transform: rotateY(55deg) rotateZ(-8deg);
          }
        }

        @keyframes flap-right {
          0%, 100% {
            transform: rotateY(0deg) rotateZ(3deg);
          }
          50% {
            transform: rotateY(-55deg) rotateZ(8deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}

