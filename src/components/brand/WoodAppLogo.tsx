/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ganza Brand Identity - Logo & Icons
 * Modernist, high-contrast black & white geometric "G"
 * representing strength, timber precision, and financial integrity in Rwanda.
 */

import React from 'react';

interface GanzaLogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  theme?: 'light' | 'dark' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const GanzaIcon: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* High-Contrast Black Container */}
      <rect width="100" height="100" rx="22" fill="#000000" />
      <rect width="98" height="98" x="1" y="1" rx="21" stroke="#27272A" strokeWidth="1.5" />

      {/* Modernist Geometric G Emblem in Crisp White */}
      <path
        d="M68 32 C62 25 54 22 45 22 C30 22 19 34 19 50 C19 66 30 78 46 78 C60 78 69 68 70 55 L45 55 L45 44 L81 44 C82 48 82 52 82 56 C81 74 69 88 45 88 C23 88 8 71 8 50 C8 29 23 12 46 12 C59 12 70 18 77 27 Z"
        fill="#FFFFFF"
      />
      {/* Precision architectural accent notch */}
      <rect x="52" y="52" width="22" height="6" fill="#000000" rx="1" />
    </svg>
  );
};

export const GanzaLogo: React.FC<GanzaLogoProps> = ({
  variant = 'full',
  theme = 'auto',
  size = 'md',
  className = '',
}) => {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  if (variant === 'icon') {
    return <GanzaIcon size={iconSizes[size]} className={className} />;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {variant !== 'wordmark' && <GanzaIcon size={iconSizes[size]} />}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-display font-black tracking-tight leading-none uppercase ${textSizes[size]} ${
              theme === 'dark'
                ? 'text-white'
                : theme === 'light'
                ? 'text-black'
                : 'text-black dark:text-white'
            }`}
          >
            Ganza
          </span>
        </div>
        <span
          className={`font-sans tracking-widest uppercase font-semibold text-zinc-500 dark:text-zinc-400 ${subtitleSizes[size]}`}
        >
          Imbaho • Inganda • ERP
        </span>
      </div>
    </div>
  );
};

// Backward-compatible aliases for effortless integration
export const WoodAppLogo = GanzaLogo;
export const WoodAppIcon = GanzaIcon;
export type WoodAppLogoProps = GanzaLogoProps;
