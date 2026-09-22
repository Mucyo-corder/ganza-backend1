/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Modal Dialog
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1B120E]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`
          w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] flex flex-col bg-[#F7F2EA] dark:bg-[#2B1D16]
          rounded-t-3xl sm:rounded-2xl border border-[#8A5A38]/30 dark:border-[#B88952]/40 shadow-2xl overflow-hidden
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#8A5A38]/15 dark:border-[#B77A45]/20 bg-white/50 dark:bg-[#1B120E]/40">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#241A15] dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#75675C] hover:text-[#241A15] dark:text-[#E2B994] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh]">
          {children}
        </div>
      </div>
    </div>
  );
};
