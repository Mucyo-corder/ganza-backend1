/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Luxury Metric StatCard
 * Displays financial & timber figures prominently with large typography.
 */

import React from 'react';

interface StatCardProps {
  title: string;
  amount: number | string;
  currency?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  highlight?: boolean;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  currency = 'RWF',
  icon,
  trend,
  trendPositive = true,
  highlight = false,
  subtitle,
  onClick,
  className = '',
}) => {
  const formattedAmount =
    typeof amount === 'number' ? amount.toLocaleString('en-US') : amount;

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-200 border select-none
        ${onClick ? 'cursor-pointer hover:translate-y-[-2px] active:scale-[0.99]' : ''}
        ${
          highlight
            ? 'bg-black text-white border-zinc-800 shadow-lg'
            : 'bg-white dark:bg-zinc-950 text-black dark:text-white border-zinc-200 dark:border-zinc-800 shadow-sm'
        }
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <span
          className={`text-sm sm:text-base font-bold tracking-wide ${
            highlight ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {title}
        </span>
        {icon && (
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              highlight
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className={`font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl ${
            highlight ? 'text-white' : 'text-black dark:text-white'
          }`}
        >
          {formattedAmount}
        </span>
        {currency && (
          <span
            className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
              highlight ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {currency}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs sm:text-sm">
          {trend && (
            <span
              className={`font-semibold ${
                trendPositive
                  ? 'text-zinc-700 dark:text-zinc-300'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {trend}
            </span>
          )}
          {subtitle && (
            <span
              className={
                highlight ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'
              }
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
