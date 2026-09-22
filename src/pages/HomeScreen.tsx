/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Luxury Home Dashboard Screen
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/ui/StatCard.tsx';
import { Card } from '../components/ui/Card.tsx';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ActivityLog } from '../types/frontend.ts';
import {
  Camera,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Video,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface HomeScreenProps {
  onOpenCapture: () => void;
  onOpenVoice: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenCapture,
  onOpenVoice,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dashboard, activities, inventory, cameras } = useData();

  const lowStockItems = inventory.filter(
    (item) => item.status === 'bike' || item.status === 'byarashize'
  );

  const activeCamerasCount = cameras.filter((c) => c.status === 'online').length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-black text-white border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{user?.businessName || 'Kigali Wood & Timber'}</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
              Muraho, {user?.fullName?.split(' ')[0] || 'Jean'}
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 mt-1 font-medium">
              Dore uko business yawe ihagaze uyu munsi muri Ganza.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCapture}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm sm:text-base shadow-lg hover:bg-zinc-200 active:scale-95 transition-all"
            >
              <Camera className="w-5 h-5" />
              <span>FOTORA</span>
            </button>
            <button
              onClick={() => navigate('/kamera')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-sm backdrop-blur-md transition-all active:scale-95"
            >
              <Video className="w-4 h-4 text-white" />
              <span>{activeCamerasCount} LIVE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Numbers Section (Prominent Metrics) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-display font-bold text-lg sm:text-xl text-[#241A15] dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8A5A38] dark:text-[#C9A45C]" />
            UYU MUNSI
          </h2>
          <span className="text-xs font-semibold text-[#8A5A38] dark:text-[#E2B994]">
            Ibarurishamibare
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Amafaranga yinjiye"
            amount={dashboard.todayIncome ?? dashboard.todaySales}
            trend="+12% ugereranyije n'ejo"
            trendPositive={true}
            icon={<TrendingUp className="w-5 h-5" />}
            onClick={() => navigate('/kugurisha')}
          />

          <StatCard
            title="Amafaranga yasohotse"
            amount={dashboard.todayExpenses}
            trend="Ibyaguzwe & ibindi"
            trendPositive={false}
            icon={<ArrowDownLeft className="w-5 h-5 text-amber-600" />}
            onClick={() => navigate('/kugura')}
          />

          <StatCard
            title="Inyungu y’uyu munsi"
            amount={dashboard.todayProfit}
            subtitle="Yabazwe ku bicuruzwa n'amafaranga yasohotse"
            highlight={true}
            onClick={() => navigate('/business')}
          />

          <StatCard
            title="Agaciro k’imbaho zose"
            amount={dashboard.totalStockValue ?? dashboard.inventoryTotalValue}
            subtitle={`${dashboard.totalStockPieces ?? dashboard.totalPieces} pieces mu bubiko bwose`}
            icon={<Package className="w-5 h-5 text-[#8A5A38]" />}
            onClick={() => navigate('/imbaho')}
          />
        </div>
      </div>

      {/* Quick Action Buttons (Large, Touch-Friendly) */}
      <div>
        <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white mb-3 px-1">
          Ibikorwa by'ako kanya
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={onOpenCapture}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black text-white border border-zinc-800 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-zinc-900 text-white group-hover:scale-110 transition-transform mb-2 border border-zinc-700">
              <Camera className="w-6 h-6" />
            </div>
            <span className="font-display font-black text-sm">📸 FOTORA</span>
            <span className="text-[10px] text-zinc-400 mt-0.5">Soma ibikoresho</span>
          </button>

          <button
            onClick={() => navigate('/kugurisha')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-black dark:hover:border-white hover:scale-[1.02] active:scale-95 transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white group-hover:scale-110 transition-transform mb-2 border border-zinc-200 dark:border-zinc-800">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="font-display font-black text-sm text-black dark:text-white">
              GURISHA
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Andika igurisha
            </span>
          </button>

          <button
            onClick={() => navigate('/kugura')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-black dark:hover:border-white hover:scale-[1.02] active:scale-95 transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white group-hover:scale-110 transition-transform mb-2 border border-zinc-200 dark:border-zinc-800">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="font-display font-black text-sm text-black dark:text-white">
              GURA
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Imbaho nshya
            </span>
          </button>

          <button
            onClick={() => navigate('/imbaho')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-black dark:hover:border-white hover:scale-[1.02] active:scale-95 transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white group-hover:scale-110 transition-transform mb-2 border border-zinc-200 dark:border-zinc-800">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-display font-black text-sm text-black dark:text-white">
              IMBAHO
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Stock iriho
            </span>
          </button>

          <button
            onClick={() => navigate('/abakiriya')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 shadow-sm hover:shadow-md hover:border-[#C9A45C] hover:scale-[1.02] active:scale-95 transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform mb-2">
              <Users className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-sm text-[#241A15] dark:text-white">
              👥 ABAKIRIYA
            </span>
            <span className="text-[10px] text-[#75675C] dark:text-stone-400 mt-0.5">
              Amakuru & imyenda
            </span>
          </button>

          <button
            onClick={() => navigate('/kamera')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 shadow-sm hover:shadow-md hover:border-[#C9A45C] hover:scale-[1.02] active:scale-95 transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform mb-2">
              <Video className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-sm text-[#241A15] dark:text-white">
              📷 KAMERA
            </span>
            <span className="text-[10px] text-red-600 font-bold mt-0.5">
              🔴 LIVE (5)
            </span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Stock Alerts & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Imbaho zigiye gushira (Stock Alerts) */}
        <Card variant="default" padding="md" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#8A5A38]/15 dark:border-[#B77A45]/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
                  Imbaho zigiye gushira
                </h3>
                <p className="text-xs text-[#75675C] dark:text-stone-400">
                  Imbaho ziri munsi y'urugero rugomba kubamo
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/imbaho')}
              className="text-xs font-bold text-[#8A5A38] dark:text-[#C9A45C] hover:underline flex items-center gap-0.5"
            >
              Reba zose <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-[#75675C] dark:text-stone-400 py-3 text-center">
                Imbaho zose zifite umubare uhagije mu bubiko.
              </p>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/imbaho')}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F2EA]/60 dark:bg-[#1B120E] border border-[#8A5A38]/15 dark:border-[#B77A45]/20 hover:border-[#C9A45C] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#3A271E] shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#241A15] dark:text-white block">
                        {item.name}
                      </span>
                      <span className="text-xs text-[#75675C] dark:text-stone-400">
                        Aho biri: {item.locationArea}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Hasigaye {item.quantity}
                    </span>
                    <span className="block text-[11px] text-[#8A5A38] dark:text-[#C9A45C] font-semibold mt-1">
                      {item.sellingPrice.toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Ibiri kuba muri business ubu (Live Activity Feed) */}
        <Card variant="default" padding="md" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#8A5A38]/15 dark:border-[#B77A45]/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#C9A45C]/15 text-[#C9A45C]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
                  Ibiri kuba muri business ubu
                </h3>
                <p className="text-xs text-[#75675C] dark:text-stone-400">
                  Uko ibintu birimo kugenda aka kanya
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/raporo')}
              className="text-xs font-bold text-[#8A5A38] dark:text-[#C9A45C] hover:underline flex items-center gap-0.5"
            >
              Raporo yose <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activities.map((act: ActivityLog) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#F7F2EA]/40 dark:bg-[#1B120E]/50 border border-[#8A5A38]/10 text-xs sm:text-sm"
              >
                <div className="p-2 rounded-lg bg-white dark:bg-[#2B1D16] text-[#8A5A38] dark:text-[#C9A45C] shadow-xs shrink-0 mt-0.5">
                  {act.type === 'sale' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                  {act.type === 'purchase' && <ShoppingCart className="w-4 h-4 text-amber-600" />}
                  {act.type === 'payment' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                  {act.type === 'camera' && <Video className="w-4 h-4 text-red-500" />}
                  {act.type === 'stock' && <Package className="w-4 h-4 text-[#8A5A38]" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#241A15] dark:text-white">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-[#75675C] dark:text-stone-400">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-[#75675C] dark:text-[#E2B994] mt-0.5">
                    {act.description}
                  </p>
                  {act.amount && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 inline-block">
                      +{act.amount.toLocaleString()} RWF
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
