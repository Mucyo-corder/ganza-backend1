/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ganza Mobile Bottom Navigation Bar - Black & White
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Camera,
  Package,
  TrendingUp,
  ShoppingCart,
  Users,
  Menu,
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navItems = [
    { to: '/', label: 'HOME', icon: Home },
    { to: '/kamera', label: 'KAMERA', icon: Camera, badge: 'LIVE' },
    { to: '/imbaho', label: 'IMBAHO', icon: Package },
    { to: '/kugurisha', label: 'GURISHA', icon: TrendingUp },
    { to: '/kugura', label: 'GURA', icon: ShoppingCart },
    { to: '/abakiriya', label: 'ABAKIRIYA', icon: Users },
    { to: '/byinshi', label: 'BYINSHI', icon: Menu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 text-white border-t border-zinc-800 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-1 px-1 rounded-xl transition-all
              ${
                isActive
                  ? 'text-white scale-105 font-black'
                  : 'text-zinc-400 hover:text-white'
              }
            `}
          >
            <div className="relative">
              <Icon className="w-5 h-5 shrink-0" />
              {item.badge && (
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-white rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tighter mt-0.5 whitespace-nowrap">
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};
