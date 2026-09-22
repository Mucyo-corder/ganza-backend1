/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Luxury Camera Screen (KAMERA • 🔴 LIVE)
 * Sawmill, Workshop, and Timber Yard CCTV Monitoring Hub
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext.tsx';
import { CameraCard } from '../components/ui/CameraCard.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { CameraDevice } from '../types/frontend.ts';
import { useToast } from '../context/ToastContext.tsx';
import {
  Video,
  Maximize2,
  Volume2,
  VolumeX,
  Camera as CameraIcon,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Wifi,
  Sparkles,
} from 'lucide-react';

export const CameraScreen: React.FC = () => {
  const { cameras } = useData();
  const { showToast } = useToast();

  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeCamerasCount = cameras.filter((c) => c.status === 'online').length;

  const handleSnapshot = () => {
    showToast(`📸 Ifoto ya '${selectedCamera?.name}' yabitswe muri gallery.`, 'success');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
              KAMERA ZO KU RUGANDA
            </h1>
            <StatusBadge status="live" label={`${activeCamerasCount} LIVE`} />
          </div>
          <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-1">
            Reba uko akazi karimo kugenda mu bubiko, aho basatura ibiti, n'aho bapakira
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#8A5A38] dark:text-[#E2B994] flex items-center gap-1.5 bg-[#EFE6D8] dark:bg-[#3A271E] px-3 py-1.5 rounded-xl border border-[#8A5A38]/20">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span>Kigali Fiber Yard 100Mbps</span>
          </span>
        </div>
      </div>

      {/* Single Camera Big Viewer (When Selected) */}
      {selectedCamera ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedCamera(null)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Gusubira ku makamera yose
            </Button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#241A15] dark:text-white">
                {selectedCamera.name}
              </span>
              <StatusBadge status="live" />
            </div>
          </div>

          {/* Large Video Area */}
          <div
            className={`
              relative w-full rounded-3xl overflow-hidden bg-black border-2 border-[#C9A45C]/40 shadow-2xl flex flex-col justify-between
              ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[360px] sm:h-[480px] lg:h-[540px]'}
            `}
          >
            {/* Simulation Canvas Stream */}
            <div className={`absolute inset-0 bg-gradient-to-br ${selectedCamera.previewColor || 'from-[#1B120E] to-[#2B1D16]'}`}>
              {/* CCTV grid effect */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

              {/* Realistic saw mill movement subtle overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-2 opacity-80">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-[#C9A45C]/50 flex items-center justify-center animate-spin-slow">
                    <Video className="w-10 h-10 sm:w-12 sm:h-12 text-[#C9A45C]" />
                  </div>
                  <span className="font-mono text-xs sm:text-sm text-stone-300 block">
                    🔴 LIVE STREAM: {selectedCamera.name.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-[#C9A45C] font-mono bg-black/60 px-2 py-0.5 rounded">
                    RTSP / WebRTC Stream Synchronized
                  </span>
                </div>
              </div>
            </div>

            {/* Top Bar on Video */}
            <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <span className="font-mono font-bold text-sm sm:text-base">
                  LIVE • {selectedCamera.name} ({selectedCamera.location})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-white/80 bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-md">
                  {selectedCamera.resolution} • 30 FPS
                </span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Bottom Controls Bar on Video */}
            <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent text-white">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3 rounded-xl bg-white/15 hover:bg-white/30 backdrop-blur-md transition-colors"
                  title={isMuted ? 'Fungura ijwi' : 'Funga ijwi'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleSnapshot}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#C9A45C] text-[#1B120E] font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all shadow-md"
                >
                  <CameraIcon className="w-4 h-4" />
                  <span>Fata ifoto (Snapshot)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-3 rounded-xl bg-white/15 hover:bg-white/30 backdrop-blur-md transition-colors"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Camera Selector Bar below */}
          <div className="pt-2">
            <span className="text-xs font-bold text-[#75675C] dark:text-[#E2B994] uppercase tracking-wider block mb-2">
              Hindura indi camera:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {cameras.map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam)}
                  className={`
                    p-3 rounded-xl text-left border transition-all text-xs font-semibold
                    ${
                      selectedCamera.id === cam.id
                        ? 'bg-[#2B1D16] text-[#C9A45C] border-[#C9A45C] dark:bg-[#C9A45C] dark:text-black font-bold'
                        : 'bg-white dark:bg-[#2B1D16] text-[#241A15] dark:text-white border-[#8A5A38]/20 hover:border-[#8A5A38]/40'
                    }
                  `}
                >
                  <div className="truncate font-bold">{cam.name}</div>
                  <div className="text-[10px] opacity-75">{cam.location}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Camera Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onSelect={() => setSelectedCamera(camera)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
