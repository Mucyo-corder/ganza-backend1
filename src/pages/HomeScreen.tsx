/**
 * GANZA Home — CALM, SIMPLE, PROFESSIONAL
 * Spec §5: extremely simple home, camera primary action.
 * Header scrolls naturally (§3, §22) — no fixed header here.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Camera, Package, TrendingUp, Layers } from 'lucide-react';

interface HomeScreenProps {
  onOpenCapture: () => void;
  onOpenVoice: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenCapture }) => {
  const navigate = useNavigate();
  const { inventory } = useData();
  const { user } = useAuth();

  const totalPieces = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalVolume = inventory.reduce((sum, i) => {
    const d: any = i.dimensions;
    if (!d) return sum;
    const wM = d.width > 3 ? d.width / 100 : d.width;
    const tM = d.thickness > 3 ? d.thickness / 100 : d.thickness;
    const lM = d.length > 12 ? d.length / 100 : d.length;
    return sum + lM * wM * tM * i.quantity;
  }, 0);
  const totalValue = inventory.reduce((sum, i) => sum + i.totalValue, 0);
  const recentScans = inventory.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);

  return (
    <div className="space-y-8 pb-12 max-w-3xl mx-auto">
      {/* Header is part of scrollable content — handled in App.tsx */}

      {/* Intro — very simple */}
      <div className="text-center sm:text-left space-y-2">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#241A15] dark:text-white tracking-tight">
          GANZA
        </h1>
        <p className="text-sm sm:text-base text-[#75675C] dark:text-[#E2B994]">
          Cunga ububiko bw'imbaho byoroshye.
        </p>
      </div>

      {/* PRIMARY ACTION */}
      <button
        onClick={onOpenCapture}
        className="w-full flex flex-col items-center justify-center gap-1 py-6 rounded-3xl bg-black dark:bg-white text-white dark:text-black font-black text-lg sm:text-xl shadow-xl hover:opacity-95 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <Camera className="w-7 h-7" />
          <span className="tracking-wide">FATA IFOTO</span>
        </div>
        <span className="text-xs font-semibold opacity-70">Fata ifoto • Bara • Pima • Bara agaciro</span>
      </button>

      {/* Metrics — three cards, no clutter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-zinc-200 dark:border-zinc-800 text-center sm:text-left">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Stock</div>
          <div className="font-display font-black text-2xl text-black dark:text-white mt-1">
            {totalPieces} <span className="text-sm font-bold text-zinc-500">pieces</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-zinc-200 dark:border-zinc-800 text-center sm:text-left">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Volume</div>
          <div className="font-display font-black text-2xl text-black dark:text-white mt-1">
            {totalVolume > 0 ? totalVolume.toFixed(2) : '0.00'} <span className="text-sm font-bold text-zinc-500">m³</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#C9A45C]/30 text-center sm:text-left">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estimated Value</div>
          <div className="font-display font-black text-xl text-black dark:text-white mt-1">
            {totalValue.toLocaleString()} <span className="text-xs font-bold text-[#C9A45C]">RWF</span>
          </div>
        </div>
      </div>

      {/* Recent scans — simple list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base text-[#241A15] dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-500" /> Recent scans
          </h2>
          <button onClick={() => navigate('/imbaho')} className="text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white">
            View all →
          </button>
        </div>
        {recentScans.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-800 text-center">
            <Package className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
            <p className="text-sm text-zinc-500">No scans yet</p>
            <p className="text-xs text-zinc-400 mt-1">Take your first photo — GANZA will count and calculate.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentScans.map(item => (
              <div
                key={item.id}
                onClick={() => navigate('/imbaho')}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#2B1D16] border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-black dark:text-white truncate">{item.name}</div>
                  <div className="text-xs text-zinc-500">{item.quantity} imbaho • {item.dimensions.displayStr}</div>
                </div>
                <div className="text-sm font-bold text-black dark:text-white shrink-0">{item.totalValue.toLocaleString()} RWF</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation grid — only core items */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/imbaho')}
          className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors group"
        >
          <Package className="w-6 h-6 mb-2 text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm text-black dark:text-white">Inventory</span>
          <span className="text-[11px] text-zinc-500">Stock</span>
        </button>
        <button
          onClick={() => navigate('/kugurisha')}
          className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors group"
        >
          <TrendingUp className="w-6 h-6 mb-2 text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm text-black dark:text-white">Sales</span>
          <span className="text-[11px] text-zinc-500">Ubucuruzi</span>
        </button>
        <button
          onClick={() => navigate('/raporo')}
          className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors group"
        >
          <Layers className="w-6 h-6 mb-2 text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm text-black dark:text-white">Reports</span>
          <span className="text-[11px] text-zinc-500">Raporo</span>
        </button>
        <button
          onClick={() => navigate('/byinshi')}
          className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors group"
        >
          <span className="text-xl mb-2">⚙︎</span>
          <span className="font-bold text-sm text-black dark:text-white">Settings</span>
          <span className="text-[11px] text-zinc-500">Igenamiterere</span>
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-[11px] text-zinc-400">GANZA • Calm, premium, intelligent wood-stock tool</p>
      </div>
    </div>
  );
};
