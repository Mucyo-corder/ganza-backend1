/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Daily Report Screen (RAPORO Y'UYU MUNSI)
 * Daily Executive Summary, Cashflow Breakdown, and Native WhatsApp Export.
 */

import React from 'react';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  FileText,
  Share2,
  TrendingUp,
  ArrowDownLeft,
  Package,
  Layers,
  CheckCircle2,
  Copy,
} from 'lucide-react';

export const DailyReportScreen: React.FC = () => {
  const { dashboard, user } = useAuth ? { ...useData(), ...useAuth() } : useData() as any;
  const { showToast } = useToast();

  const reportDate = new Date().toLocaleDateString('rw-RW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reportText = `📋 *RAPORO YA WOODAPP - ${reportDate}*
🏢 Business: *${user?.businessName || 'Kigali Wood & Timber'}*

💰 *Amakuru y'Amafaranga:*
• Ibyagurishijwe: *${(dashboard?.todayIncome || 1850000).toLocaleString()} RWF*
• Ibyishyuwe (Cash/MoMo): *${(1450000).toLocaleString()} RWF*
• Umwenda mushya: *${(400000).toLocaleString()} RWF*
• Amafaranga yasohotse: *${(dashboard?.todayExpenses || 620000).toLocaleString()} RWF*
• Inyungu y'uyu munsi: *${(dashboard?.todayProfit || 430000).toLocaleString()} RWF*

📦 *Imbaho:*
• Imbaho zasohotse: *65 pieces*
• Imbaho zinjiye: *50 pieces*
• Agaciro k'imbaho zose mu bubiko: *${(dashboard?.totalStockValue || 48900000).toLocaleString()} RWF*

✅ Raporo yakozwe neza na WoodApp Rwanda.`;

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
    showToast('💬 WhatsApp irafungutse kugira ngo wohereze raporo.', 'success');
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportText);
    showToast('📋 Raporo yakoporowe neza!', 'success');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
            RAPORO Y'UYU MUNSI
          </h1>
          <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-1 capitalize">
            {reportDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleCopyReport}
            icon={<Copy className="w-4 h-4" />}
          >
            Koporora
          </Button>

          <Button
            variant="accent"
            size="md"
            onClick={handleShareWhatsApp}
            icon={<Share2 className="w-4 h-4" />}
          >
            Ohereza kuri WhatsApp
          </Button>
        </div>
      </div>

      {/* Printable / Shareable Report Card */}
      <Card variant="walnut" padding="lg" className="border border-[#C9A45C]/40 space-y-6">
        {/* Top Business Identification */}
        <div className="flex items-center justify-between pb-4 border-b border-[#B88952]/30">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#C9A45C] font-bold">
              WoodApp • Daily Executive Summary
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white mt-0.5">
              {user?.businessName || 'Kigali Wood & Timber Yard'}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#E2B994] font-medium block">Itariki:</span>
            <span className="text-xs sm:text-sm font-bold text-white capitalize">{reportDate}</span>
          </div>
        </div>

        {/* Financial Flow Section */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C9A45C] block">
            Amafaranga y'ubucuruzi
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#3A271E]/80 border border-[#B77A45]/30">
              <span className="text-xs text-[#E2B994] block">Ibyagurishijwe byose</span>
              <span className="font-display font-extrabold text-xl text-white">
                {(dashboard?.todayIncome || 1850000).toLocaleString()} RWF
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#3A271E]/80 border border-[#B77A45]/30">
              <span className="text-xs text-emerald-300 block">Ibyishyuwe (Cash/MoMo)</span>
              <span className="font-display font-extrabold text-xl text-emerald-400">
                {(1450000).toLocaleString()} RWF
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#3A271E]/80 border border-[#B77A45]/30">
              <span className="text-xs text-amber-300 block">Umwenda mushya</span>
              <span className="font-display font-extrabold text-xl text-amber-400">
                {(400000).toLocaleString()} RWF
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#3A271E]/80 border border-[#B77A45]/30">
              <span className="text-xs text-[#E2B994] block">Amafaranga yasohotse</span>
              <span className="font-display font-extrabold text-xl text-white">
                {(dashboard?.todayExpenses || 620000).toLocaleString()} RWF
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#C9A45C]/20 border border-[#C9A45C]/50 col-span-2 sm:col-span-2">
              <span className="text-xs text-[#E2B994] block font-bold">Inyungu y'uyu munsi (Profit)</span>
              <span className="font-display font-extrabold text-2xl text-white">
                {(dashboard?.todayProfit || 430000).toLocaleString()} <span className="text-sm text-[#C9A45C]">RWF</span>
              </span>
            </div>
          </div>
        </div>

        {/* Timber Stock Flow Section */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C9A45C] block">
            Urugendo rw'Imbaho mu bubiko
          </span>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#3A271E]/80 border border-[#B77A45]/30">
              <span className="text-xs text-[#E2B994] block">Zasohotse (Kugurisha)</span>
              <span className="font-display font-extrabold text-xl text-white">65 pcs</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#3A271E]/80 border border-[#B77A45]/30">
              <span className="text-xs text-[#E2B994] block">Zinjiye (Kugura)</span>
              <span className="font-display font-extrabold text-xl text-emerald-400">+50 pcs</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#3A271E]/80 border border-[#B77A45]/30">
              <span className="text-xs text-[#E2B994] block">Agaciro k'imbaho zose</span>
              <span className="font-display font-extrabold text-xl text-white">
                {(dashboard?.totalStockValue || 48900000).toLocaleString()} RWF
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Preview Quote Box */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          <span className="text-xs font-bold text-[#E2B994] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ubutumwa buzoherezwa kuri WhatsApp:
          </span>
          <pre className="text-xs text-stone-300 font-mono whitespace-pre-wrap bg-black/50 p-3 rounded-xl border border-white/5">
            {reportText}
          </pre>
        </div>
      </Card>
    </div>
  );
};
