/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Luxury Business Analytics & Health Screen (BUSINESS YANJYE)
 * High-end financial visual charts, profitability by species, and growth trends.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext.tsx';
import { StatCard } from '../components/ui/StatCard.tsx';
import { Card } from '../components/ui/Card.tsx';
import {
  TrendingUp,
  ArrowDownLeft,
  DollarSign,
  ShieldCheck,
  Calendar,
  Sparkles,
  TreeDeciduous,
  Layers,
} from 'lucide-react';

export const BusinessScreen: React.FC = () => {
  const { dashboard, sales, inventory } = useData();

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  // Chart data points
  const weeklyData = [
    { day: 'Mbe', label: 'Kuwa Mbere', sales: 1200000, expenses: 400000, profit: 800000 },
    { day: 'Kab', label: 'Kuwa Kabiri', sales: 950000, expenses: 600000, profit: 350000 },
    { day: 'Gat', label: 'Kuwa Gatatu', sales: 1450000, expenses: 300000, profit: 1150000 },
    { day: 'Kan', label: 'Kuwa Kane', sales: 1100000, expenses: 500000, profit: 600000 },
    { day: 'Gtn', label: 'Kuwa Gatanu', sales: 1850000, expenses: 620000, profit: 1230000 },
    { day: 'Gnd', label: 'Kuwa Gatandatu', sales: 2100000, expenses: 800000, profit: 1300000 },
    { day: 'Cym', label: 'Ku Cyumweru', sales: 650000, expenses: 150000, profit: 500000 },
  ];

  const maxVal = Math.max(...weeklyData.map((d) => d.sales));

  const speciesRanking = [
    { species: 'Eucalyptus (Inturusu)', profit: 4520000, share: 48, color: '#C9A45C' },
    { species: 'Pine (Pinusi)', profit: 2840000, share: 30, color: '#B77A45' },
    { species: 'Teak (Tiki)', profit: 1550000, share: 16, color: '#8A5A38' },
    { species: 'Ibikoresho (Furniture)', profit: 580000, share: 6, color: '#5A3B28' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header with Time Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
            BUSINESS YANJYE (UBUTUNZI & INYUNGU)
          </h1>
          <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-1">
            Reba inyungu, amafaranga yinjiye, n'ubwoko bw'imbaho bucuruzwa cyane
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EFE6D8] dark:bg-[#3A271E] border border-[#8A5A38]/20">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === 'week'
                ? 'bg-[#2B1D16] text-[#C9A45C] dark:bg-[#C9A45C] dark:text-black shadow-sm'
                : 'text-[#75675C] dark:text-[#E2B994]'
            }`}
          >
            Icyumweru
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === 'month'
                ? 'bg-[#2B1D16] text-[#C9A45C] dark:bg-[#C9A45C] dark:text-black shadow-sm'
                : 'text-[#75675C] dark:text-[#E2B994]'
            }`}
          >
            Ukwezi
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === 'year'
                ? 'bg-[#2B1D16] text-[#C9A45C] dark:bg-[#C9A45C] dark:text-black shadow-sm'
                : 'text-[#75675C] dark:text-[#E2B994]'
            }`}
          >
            Umwaka
          </button>
        </div>
      </div>

      {/* Financial Health Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#2B1D16] via-[#3A271E] to-[#1B120E] text-white border border-[#C9A45C]/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Imimerere: Ihagaze neza cyane</span>
            </div>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white">
              Inyungu yiyongereyeho +18.4% muri iki cyumweru
            </h3>
            <p className="text-xs sm:text-sm text-[#E2B994] mt-1 max-w-xl">
              Ibicuruzwa bya Eucalyptus n'ibiti bya Pinusi byagurishijwe neza, kandi amafaranga y'imyenda
              arimo kwinjira ku gihe.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-[140px]">
          <span className="text-[11px] uppercase tracking-wider text-[#E2B994] font-bold block">
            Inyungu yose hamwe
          </span>
          <span className="font-display font-extrabold text-2xl text-white">
            6,930,000 <span className="text-xs text-[#C9A45C]">RWF</span>
          </span>
        </div>
      </div>

      {/* 4 Essential Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ibyagurishijwe (Sales)"
          amount="9,300,000"
          trend="+14% iki cyumweru"
          trendPositive={true}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        />

        <StatCard
          title="Amafaranga yasohotse"
          amount="3,370,000"
          trend="Ibikoresho & imishahara"
          trendPositive={false}
          icon={<ArrowDownLeft className="w-5 h-5 text-amber-600" />}
        />

        <StatCard
          title="Inyungu isukuye (Profit)"
          amount="5,930,000"
          trend="Inyungu ya 63.7%"
          trendPositive={true}
          highlight={true}
        />

        <StatCard
          title="Agaciro k'imbaho zose"
          amount={dashboard.inventoryTotalValue}
          subtitle="Imbaho ziri mu bubiko bwose"
          icon={<Layers className="w-5 h-5 text-[#8A5A38]" />}
        />
      </div>

      {/* High-End Visual Sales & Expense Chart */}
      <Card variant="default" padding="lg" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#8A5A38]/15 dark:border-[#B77A45]/20">
          <div>
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-[#241A15] dark:text-white">
              Imbonerahamwe y'Ibyagurishijwe n'Amafaranga Yasohotse
            </h3>
            <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994]">
              Igereranya ry'amafaranga yinjiye n'ayasohotse kuri buri munsi w'icyumweru
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#C9A45C]" />
              <span className="text-[#241A15] dark:text-white">Ibyagurishijwe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#8A5A38]" />
              <span className="text-[#241A15] dark:text-white">Ayasohotse</span>
            </div>
          </div>
        </div>

        {/* Responsive Bar Chart */}
        <div className="pt-6">
          <div className="grid grid-cols-7 gap-2 sm:gap-6 items-end h-64 sm:h-72 border-b border-[#8A5A38]/20 dark:border-[#B77A45]/25 pb-4">
            {weeklyData.map((d, idx) => {
              const salesHeight = Math.round((d.sales / maxVal) * 100);
              const expenseHeight = Math.round((d.expenses / maxVal) * 100);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                    {/* Sales bar */}
                    <div
                      style={{ height: `${salesHeight}%` }}
                      className="w-full max-w-[20px] sm:max-w-[28px] rounded-t-lg bg-gradient-to-t from-[#B77A45] to-[#C9A45C] shadow-md group-hover:brightness-110 transition-all relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] font-mono py-0.5 px-1.5 rounded whitespace-nowrap z-20 pointer-events-none">
                        {(d.sales / 1000).toFixed(0)}k
                      </div>
                    </div>

                    {/* Expenses bar */}
                    <div
                      style={{ height: `${expenseHeight}%` }}
                      className="w-full max-w-[16px] sm:max-w-[22px] rounded-t-lg bg-[#8A5A38]/70 dark:bg-[#5A3B28] shadow-sm group-hover:brightness-110 transition-all relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] font-mono py-0.5 px-1.5 rounded whitespace-nowrap z-20 pointer-events-none">
                        {(d.expenses / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] sm:text-xs font-bold text-[#75675C] dark:text-[#E2B994] mt-2 block">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Most Profitable Wood Species Ranking */}
      <Card variant="default" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#8A5A38]/15 dark:border-[#B77A45]/20">
          <div className="flex items-center gap-2">
            <TreeDeciduous className="w-5 h-5 text-[#8A5A38] dark:text-[#C9A45C]" />
            <h3 className="font-display font-extrabold text-lg text-[#241A15] dark:text-white">
              Ubwoko bw'Imbaho Buzana Inyungu Nyinshi
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#8A5A38] dark:text-[#E2B994]">
            Ranking
          </span>
        </div>

        <div className="space-y-4 pt-1">
          {speciesRanking.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm font-bold">
                <div className="flex items-center gap-2 text-[#241A15] dark:text-white">
                  <span className="font-mono text-xs w-5 h-5 rounded-full bg-[#EFE6D8] dark:bg-[#3A271E] flex items-center justify-center text-[#8A5A38] dark:text-[#C9A45C]">
                    {idx + 1}
                  </span>
                  <span>{item.species}</span>
                </div>
                <div className="text-right">
                  <span className="font-display font-extrabold text-emerald-700 dark:text-emerald-400">
                    +{item.profit.toLocaleString()} RWF
                  </span>
                  <span className="text-xs text-[#75675C] dark:text-stone-400 ml-2">
                    ({item.share}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-[#EFE6D8] dark:bg-[#3A271E] rounded-full overflow-hidden">
                <div
                  style={{ width: `${item.share}%`, backgroundColor: item.color }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
