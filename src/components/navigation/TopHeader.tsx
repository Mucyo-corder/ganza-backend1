/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ganza Top Header Bar - High-Contrast Black & White
 */

import React from 'react';
import { GanzaLogo } from '../brand/WoodAppLogo.tsx';
import { Camera, Mic, Bell, HelpCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useData } from '../../context/DataContext.tsx';

interface TopHeaderProps {
  onOpenCapture: () => void;
  onOpenVoice: () => void;
  onOpenHelp: () => void;
  onOpenNotifications: () => void;
  title?: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenCapture,
  onOpenVoice,
  onOpenHelp,
  onOpenNotifications,
  title,
  subtitle,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useData();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-3.5 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 select-none">
      {/* Left: Mobile Logo / Page Title */}
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <GanzaLogo variant="icon" size="sm" />
        </div>
        <div>
          {title ? (
            <div>
              <h1 className="font-display font-black text-lg sm:text-2xl text-black dark:text-white leading-tight tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {subtitle}
                </p>
              )}
            </div>
          ) : (
            <div className="md:hidden">
              <span className="font-display font-black text-xl text-black dark:text-white uppercase tracking-wider">
                Ganza
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 📸 FOTORA Quick Button */}
        <button
          onClick={onOpenCapture}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">FOTORA</span>
        </button>

        {/* 🎤 Voice Assistant Quick Button */}
        <button
          onClick={onOpenVoice}
          title="Vuga mu Kinyarwanda"
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Mic className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <span className="hidden sm:inline">IJWI</span>
        </button>

        {/* ? Help Button */}
        <button
          onClick={onOpenHelp}
          title="Ubufasha kuri iyi paji"
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition-colors"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          title="Ubutumwa"
          className="relative p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition-colors"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-black dark:bg-white text-white dark:text-black rounded-full text-[10px] font-bold flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dark / Light Toggle */}
        <button
          onClick={toggleTheme}
          title="Hindura amabara"
          className="md:hidden p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
