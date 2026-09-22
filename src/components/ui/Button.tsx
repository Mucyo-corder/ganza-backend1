/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Luxury UI Button
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] select-none rounded-xl cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
    xl: 'text-lg px-7 py-4 gap-3 font-bold',
  };

  const variantClasses = {
    primary:
      'bg-black text-white hover:bg-zinc-800 border border-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-zinc-100 shadow-sm',
    secondary:
      'bg-zinc-100 text-black hover:bg-zinc-200 border border-zinc-200 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800',
    accent:
      'bg-black text-white hover:bg-zinc-800 border border-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-zinc-100 shadow-sm font-bold',
    outline:
      'bg-transparent text-black border border-zinc-300 hover:bg-zinc-100 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-900',
    danger:
      'bg-zinc-900 text-white hover:bg-black border border-zinc-900 dark:bg-zinc-100 dark:text-black',
    ghost:
      'bg-transparent text-black hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-900',
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
