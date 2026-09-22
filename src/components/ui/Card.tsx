/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Luxury Card & Container Component
 */

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'walnut' | 'subtle' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  border = true,
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3.5',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantClasses = {
    default:
      'bg-white dark:bg-zinc-950 text-black dark:text-white shadow-sm',
    walnut:
      'bg-black text-white shadow-md border-zinc-800',
    subtle:
      'bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white',
    elevated:
      'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-md',
    glass:
      'bg-white/80 dark:bg-black/80 backdrop-blur-md text-black dark:text-white shadow-sm',
  };

  const borderClass = border
    ? 'border border-zinc-200 dark:border-zinc-800'
    : '';

  return (
    <div
      className={`rounded-2xl relative overflow-hidden transition-all duration-200 ${paddingClasses[padding]} ${variantClasses[variant]} ${borderClass} ${className}`}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};
