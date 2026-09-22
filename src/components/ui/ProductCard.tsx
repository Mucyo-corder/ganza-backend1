/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp ProductCard (Imbaho Mfite)
 */

import React from 'react';
import { InventoryItem } from '../../types/frontend.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { Layers, MapPin } from 'lucide-react';

interface ProductCardProps {
  item: InventoryItem;
  onClick?: () => void;
  onQuickSell?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onClick,
  onQuickSell,
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/25 shadow-sm hover:shadow-md hover:border-[#C9A45C]/50 transition-all duration-200 cursor-pointer"
    >
      {/* Wood Preview Thumbnail */}
      <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-[#3A271E]">
        <img
          src={
            item.imageUrl ||
            'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=800&auto=format&fit=crop&q=80'
          }
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={item.status} />
        </div>

        {/* Species Tag & Location */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <span className="font-display font-bold text-lg drop-shadow-md">
            {item.species}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-medium bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
            <MapPin className="w-3 h-3 text-[#C9A45C]" />
            <span>{item.locationArea}</span>
          </div>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Dimensions */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8A5A38] dark:text-[#E2B994]">
            <Layers className="w-4 h-4 text-[#B77A45]" />
            <span>{item.dimensions.displayStr || `${item.dimensions.length}m × ${item.dimensions.width}cm × ${item.dimensions.thickness}cm`}</span>
          </div>

          {/* Quantity & Unit Price */}
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-[#75675C] dark:text-stone-400 block font-medium">
                Ingano (Pieces)
              </span>
              <span className="font-display font-bold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
                {item.quantity}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#75675C] dark:text-stone-400 block font-medium">
                Igiciro cy'igiti kimwe
              </span>
              <span className="font-semibold text-sm sm:text-base text-[#8A5A38] dark:text-[#C9A45C]">
                {item.sellingPrice.toLocaleString()} RWF
              </span>
            </div>
          </div>
        </div>

        {/* Total Value Bar */}
        <div className="pt-3 border-t border-[#8A5A38]/15 dark:border-[#B77A45]/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#75675C] dark:text-[#E2B994]">
            Agaciro kose
          </span>
          <span className="font-display font-extrabold text-base sm:text-lg text-[#241A15] dark:text-white">
            {item.totalValue.toLocaleString()} <span className="text-xs font-bold text-[#C9A45C]">RWF</span>
          </span>
        </div>
      </div>
    </div>
  );
};
