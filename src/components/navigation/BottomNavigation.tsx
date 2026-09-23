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
    { to: '/kamera', label: 'FOTO', icon: Camera },
    { to: '/imbaho', label: 'UBUBIKO', icon: Package },
    { to: '/kugurisha', label: 'GURISHA', icon: TrendingUp },
    { to: '/raporo', label: 'RAPORO', icon: Menu },
    { to: '/byinshi', label: 'IGENAM.', icon: Menu },
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
