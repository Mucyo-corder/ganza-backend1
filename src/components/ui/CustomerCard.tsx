/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp CustomerCard (Abakiriya)
 */

import React from 'react';
import { Customer } from '../../types/frontend.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { Phone, MapPin, ArrowUpRight } from 'lucide-react';

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
  onPayClick?: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onClick,
  onPayClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/25 shadow-sm hover:shadow-md hover:border-[#C9A45C]/50 transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-[#241A15] dark:text-white leading-tight">
              {customer.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-[#75675C] dark:text-stone-300">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#8A5A38] dark:text-[#E2B994]" />
                {customer.phone}
              </span>
              {customer.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8A5A38] dark:text-[#E2B994]" />
                  {customer.address}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={customer.status} />
        </div>

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 py-3.5 my-2 border-y border-[#8A5A38]/15 dark:border-[#B77A45]/20 bg-[#F7F2EA]/50 dark:bg-[#1B120E]/40 rounded-xl px-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#75675C] dark:text-stone-400 font-semibold block">
              Yaguze
            </span>
            <span className="font-bold text-sm sm:text-base text-[#241A15] dark:text-white">
              {customer.totalPurchases.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#75675C] dark:text-stone-400 font-semibold block">
              Yishyuye
            </span>
            <span className="font-bold text-sm sm:text-base text-emerald-700 dark:text-emerald-400">
              {customer.totalPaid.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#75675C] dark:text-stone-400 font-semibold block">
              Asigaje
            </span>
            <span
              className={`font-display font-extrabold text-sm sm:text-base ${
                customer.remainingDebt > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {customer.remainingDebt.toLocaleString()} RWF
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-3 flex items-center justify-between text-xs pt-1">
        <span className="text-[#75675C] dark:text-stone-400 font-medium">
          Igurisha ryaherutse: {customer.lastPurchaseDate || 'Nta yo'}
        </span>
        <span className="inline-flex items-center gap-1 font-bold text-[#8A5A38] dark:text-[#C9A45C] hover:underline">
          Reba amakuru <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
