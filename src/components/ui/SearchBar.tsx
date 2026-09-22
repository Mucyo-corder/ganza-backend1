/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp SearchBar & FilterBar for Timber Inventory
 */

import React from 'react';
import { Search, X } from 'lucide-react';
import { WoodSpecies } from '../../types/frontend.ts';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Shakisha imbaho...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3.5 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-[#8A5A38] dark:text-[#E2B994] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 sm:pl-12 pr-10 py-3 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#2B1D16]/90 border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-sm sm:text-base text-[#241A15] dark:text-white placeholder-[#75675C] dark:placeholder-[#E2B994]/60 focus:outline-none focus:ring-2 focus:ring-[#C9A45C] focus:border-transparent transition-all shadow-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3.5 p-1 text-[#75675C] hover:text-[#241A15] dark:text-stone-400 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

interface FilterBarProps {
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedFilter,
  onSelectFilter,
  className = '',
}) => {
  const filters = [
    { key: 'all', label: 'Zose' },
    { key: 'Eucalyptus', label: 'Eucalyptus' },
    { key: 'Pine', label: 'Pine' },
    { key: 'Teak', label: 'Teak' },
    { key: 'Furniture', label: 'Furniture' },
    { key: 'Ibindi', label: 'Ibindi' },
  ];

  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar ${className}`}>
      {filters.map((f) => {
        const active = selectedFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onSelectFilter(f.key)}
            className={`
              shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none
              ${
                active
                  ? 'bg-[#2B1D16] text-[#C9A45C] border border-[#C9A45C]/50 shadow-md shadow-[#2B1D16]/20 dark:bg-[#C9A45C] dark:text-[#1B120E]'
                  : 'bg-[#EFE6D8]/80 dark:bg-[#3A271E]/60 text-[#75675C] dark:text-[#E2B994] border border-[#8A5A38]/20 hover:border-[#8A5A38]/40 hover:text-[#241A15] dark:hover:text-white'
              }
            `}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
};
