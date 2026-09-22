/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ganza Desktop / Tablet Sidebar - High-Contrast Black & White
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { GanzaLogo } from '../brand/WoodAppLogo.tsx';
import {
  Home,
  Camera,
  Package,
  TrendingUp,
  ShoppingCart,
  Users,
  Menu,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface SidebarProps {
  onOpenCapture?: () => void;
  onOpenVoice?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCapture, onOpenVoice }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'HOME', icon: Home },
    { to: '/kamera', label: 'KAMERA', icon: Camera, badge: 'LIVE' },
    { to: '/imbaho', label: 'IMBAHO MFITE', icon: Package },
    { to: '/kugurisha', label: 'KUGURISHA', icon: TrendingUp },
    { to: '/kugura', label: 'KUGURA', icon: ShoppingCart },
    { to: '/abakiriya', label: 'ABAKIRIYA', icon: Users },
    { to: '/byinshi', label: 'BYINSHI', icon: Menu },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 bg-black text-white border-r border-zinc-800 p-5 z-40 select-none">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="px-2 pt-2">
          <GanzaLogo size="md" theme="dark" />
        </div>

        {/* Business Identifier Pill */}
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Business yanjye
          </div>
          <div className="font-display font-black text-sm text-white truncate mt-0.5">
            {user?.businessName || 'Kigali Wood & Timber'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Kigali, Rwanda</span>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `
                  flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-sm transition-all
                  ${
                    isActive
                      ? 'bg-white text-black font-black shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-black">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Area with Theme Toggle & User Info */}
      <div className="pt-4 border-t border-zinc-800 space-y-3">
        {/* Quick Voice / Photo Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenCapture}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white border border-zinc-800 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 text-white" />
            <span>FOTORA</span>
          </button>
          <button
            onClick={onOpenVoice}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white border border-zinc-800 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>IJWI</span>
          </button>
        </div>

        {/* User Profile & Theme */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-black text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">
                {user?.fullName || 'Umukoresha'}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase">
                {user?.role || 'Nyirubucuruzi'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              title="Hindura amabara (Dark / Light)"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              title="Sohoka"
              className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
