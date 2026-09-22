/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ganza Splash Screen - Black & White
 * "Ganza: Ubucuruzi bwawe, mu ntoki zawe."
 */

import React, { useEffect, useState } from 'react';
import { GanzaLogo } from '../components/brand/WoodAppLogo.tsx';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onFinish, 600);
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white select-none transition-opacity duration-500 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative z-10 flex flex-col items-center text-center px-6 space-y-6">
        {/* Animated Brand Logo */}
        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-700">
          <GanzaLogo variant="icon" size="xl" />
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-2">
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-white uppercase">
            Ganza
          </h1>
          <p className="font-sans font-medium text-base sm:text-lg text-zinc-300 max-w-sm leading-relaxed">
            Ubucuruzi bwawe, mu ntoki zawe.
          </p>
        </div>

        {/* Loading Pulse Line */}
        <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="w-full h-full bg-white rounded-full animate-pulse" />
        </div>

        <span className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">
          Kigali • Rwanda
        </span>
      </div>
    </div>
  );
};
