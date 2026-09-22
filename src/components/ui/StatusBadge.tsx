/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Status Badges
 */

import React from 'react';
import { StockStatus } from '../../types/frontend.ts';

interface StatusBadgeProps {
  status: StockStatus | 'yishyuwe' | 'haracyabura' | 'online' | 'offline' | 'live' | string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5 gap-1' : 'text-xs sm:text-sm px-3 py-1 gap-1.5';

  switch (status) {
    case 'hahagije':
    case 'yishyuwe':
    case 'paid':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span>{label || (status === 'hahagije' ? 'Hahagije' : 'Yishyuwe')}</span>
        </span>
      );

    case 'bike':
    case 'haracyabura':
    case 'partial':
    case 'credit':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span>{label || (status === 'bike' ? 'Hasigaye bike' : 'Haracyabura')}</span>
        </span>
      );

    case 'byarashize':
    case 'offline':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span>{label || (status === 'byarashize' ? 'Byarashize' : 'Ntiri kuri murandasi')}</span>
        </span>
      );

    case 'live':
    case 'online':
      return (
        <span
          className={`inline-flex items-center font-bold tracking-wider rounded-full bg-red-600 text-white shadow-sm shadow-red-500/30 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-white shrink-0 animate-ping" />
          <span>{label || 'LIVE'}</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 ${sizeClasses}`}
        >
          {label || status}
        </span>
      );
  }
};
