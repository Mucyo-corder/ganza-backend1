/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp CameraCard (Monitoring Yards & Sawmills)
 */

import React from 'react';
import { CameraDevice } from '../../types/frontend.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { Video, ShieldCheck, Clock, Eye } from 'lucide-react';

interface CameraCardProps {
  camera: CameraDevice;
  onSelect: () => void;
}

export const CameraCard: React.FC<CameraCardProps> = ({
  camera,
  onSelect,
}) => {
  const isOnline = camera.status === 'online';

  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/25 shadow-sm hover:shadow-lg hover:border-[#C9A45C]/50 transition-all duration-200 cursor-pointer"
    >
      {/* Simulation / Real Stream Preview Canvas */}
      <div className={`relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-br ${camera.previewColor || 'from-[#2B1D16] to-[#1B120E]'}`}>
        {/* Subtle grid lines resembling camera overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Live status badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <StatusBadge status={isOnline ? 'live' : 'offline'} />
          <span className="text-[10px] font-mono font-bold bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-md">
            {camera.resolution}
          </span>
        </div>

        {/* Security Shield Indicator */}
        <div className="absolute top-3 right-3 text-emerald-400 bg-black/40 backdrop-blur-md p-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
        </div>

        {/* Center Target Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none">
          <div className="w-16 h-16 border border-[#C9A45C]/40 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-[#C9A45C] rounded-full" />
          </div>
        </div>

        {/* Bottom Bar inside Video */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white drop-shadow">
          <span className="font-mono text-xs text-white/90 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
            {camera.lastUpdate}
          </span>
          <span className="text-xs font-bold bg-[#B77A45]/80 px-2.5 py-0.5 rounded-md flex items-center gap-1 group-hover:bg-[#C9A45C] group-hover:text-black transition-colors">
            <Eye className="w-3 h-3" /> Funguza
          </span>
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <h4 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
            {camera.name}
          </h4>
          <p className="text-xs text-[#75675C] dark:text-[#E2B994]">
            Ahariho: <span className="font-semibold text-[#8A5A38] dark:text-white">{camera.location}</span>
          </p>
        </div>
        <div className="p-2 rounded-xl bg-[#EFE6D8] dark:bg-[#3A271E] text-[#8A5A38] dark:text-[#C9A45C]">
          <Video className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
