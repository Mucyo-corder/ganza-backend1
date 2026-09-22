/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Toast Notification System
 */

import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'warning' | 'danger' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = 'toast_' + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isDanger = toast.type === 'danger';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2 ${
                isSuccess
                  ? 'bg-[#2B1D16]/95 border-[#C9A45C]/50 text-white'
                  : isWarning
                  ? 'bg-[#3A271E]/95 border-[#B45309]/60 text-amber-200'
                  : isDanger
                  ? 'bg-[#2B1D16]/95 border-red-500/60 text-red-200'
                  : 'bg-[#2B1D16]/95 border-[#B77A45]/40 text-stone-200'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#C9A45C] shrink-0 mt-0.5" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
              {isDanger && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              {!isSuccess && !isWarning && !isDanger && <Info className="w-5 h-5 text-[#B77A45] shrink-0 mt-0.5" />}

              <div className="flex-1 text-sm font-medium leading-snug">
                {toast.message}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-stone-400 hover:text-white p-0.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
