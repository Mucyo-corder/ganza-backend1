/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp More Options Screen (BYINSHI)
 * Expenses, Sawmill Suppliers, Rwanda RRA Tax Estimations, and Business Settings.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { ExpenseRecord, ActivityLog } from '../types/frontend.ts';
import {
  DollarSign,
  Truck,
  Calculator,
  History,
  Settings,
  LogOut,
  Plus,
  Phone,
  MapPin,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

type SubView = 'menu' | 'expenses' | 'suppliers' | 'taxes' | 'history' | 'settings';

export const MoreScreen: React.FC = () => {
  const { expenses, addExpense, suppliers, addSupplier, activities, dashboard } = useData();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeView, setActiveView] = useState<SubView>('menu');

  // Expense Form Modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expCategory, setExpCategory] = useState<'transport' | 'sawing' | 'salary' | 'rent' | 'other'>('transport');
  const [expAmount, setExpAmount] = useState(25000);
  const [expDesc, setExpDesc] = useState('');

  // Supplier Form Modal
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supLocation, setSupLocation] = useState('');

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExpense({
      category: expCategory,
      amount: expAmount,
      description: expDesc || 'Amafaranga yakoreshejwe',
      paymentMethod: 'momo',
    });
    showToast(`💸 Amafaranga ${expAmount.toLocaleString()} RWF yanditswe mu yasohotse.`, 'success');
    setIsAddExpenseOpen(false);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supPhone) return;
    await addSupplier({
      name: supName,
      phone: supPhone,
      location: supLocation,
    });
    showToast(`🌲 Umuguzi/Koperative '${supName}' yongerewe neza!`, 'success');
    setIsAddSupplierOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
            {activeView === 'menu'
              ? 'BYINSHI (MORE)'
              : activeView === 'expenses'
              ? '💸 AMAFARANGA YASOHOTSE'
              : activeView === 'suppliers'
              ? '🌲 AHO TUGURA IMBAHO'
              : activeView === 'taxes'
              ? '⚖️ IBARURA RY’IMISORO (RRA)'
              : activeView === 'history'
              ? '📜 AMATEKA Y’IBIKORWA'
              : '⚙️ IGENAMITERERE'}
          </h1>
          <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-1">
            Genzura ibindi bikorwa bya business, amasoko n'igenamiterere
          </p>
        </div>

        {activeView !== 'menu' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveView('menu')}
          >
            Gusubira ku Byinshi
          </Button>
        )}
      </div>

      {/* Main Menu View */}
      {activeView === 'menu' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Expenses */}
          <div
            onClick={() => setActiveView('expenses')}
            className="p-5 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 hover:border-[#C9A45C] hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
          >
            <div className="p-3.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
                💸 Amafaranga yakoreshejwe
              </h3>
              <p className="text-xs text-[#75675C] dark:text-[#E2B994]">
                Imodoka, gusatura ibiti, imishahara n'ibindi
              </p>
            </div>
          </div>

          {/* Suppliers */}
          <div
            onClick={() => setActiveView('suppliers')}
            className="p-5 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 hover:border-[#C9A45C] hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
          >
            <div className="p-3.5 rounded-2xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
                🌲 Aho tugura imbaho (Suppliers)
              </h3>
              <p className="text-xs text-[#75675C] dark:text-[#E2B994]">
                Koperative z'amashyamba n'abasaruzi
              </p>
            </div>
          </div>

          {/* RRA Taxes */}
          <div
            onClick={() => setActiveView('taxes')}
            className="p-5 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 hover:border-[#C9A45C] hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
          >
            <div className="p-3.5 rounded-2xl bg-blue-600/15 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
                ⚖️ Ibarura ry'imisoro (RRA Estimation)
              </h3>
              <p className="text-xs text-[#75675C] dark:text-[#E2B994]">
                Ibarura ryoroheje rya TVA (18%) na Withholding Tax
              </p>
            </div>
          </div>

          {/* Audit History */}
          <div
            onClick={() => setActiveView('history')}
            className="p-5 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 hover:border-[#C9A45C] hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
          >
            <div className="p-3.5 rounded-2xl bg-[#C9A45C]/15 text-[#C9A45C] group-hover:scale-110 transition-transform">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
                📜 Amateka y'ibikorwa (Audit Logs)
              </h3>
              <p className="text-xs text-[#75675C] dark:text-[#E2B994]">
                Gukurikirana buri gikorwa cyakozwe muri WoodApp
              </p>
            </div>
          </div>

          {/* Settings */}
          <div
            onClick={() => setActiveView('settings')}
            className="p-5 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 hover:border-[#C9A45C] hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
          >
            <div className="p-3.5 rounded-2xl bg-stone-500/15 text-stone-600 dark:text-stone-300 group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
                ⚙️ Igenamiterere rya Business
              </h3>
              <p className="text-xs text-[#75675C] dark:text-[#E2B994]">
                Amazina ya business, imeri, n'umutekano
              </p>
            </div>
          </div>

          {/* Logout */}
          <div
            onClick={logout}
            className="p-5 rounded-2xl bg-white dark:bg-[#2B1D16] border border-red-500/20 hover:border-red-500 hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
          >
            <div className="p-3.5 rounded-2xl bg-red-500/15 text-red-600 group-hover:scale-110 transition-transform">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-red-600">
                🚪 Gusohoka (Logout)
              </h3>
              <p className="text-xs text-[#75675C] dark:text-[#E2B994]">
                Funga konti yawe mu mutekano
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW: Expenses */}
      {activeView === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="accent"
              size="sm"
              onClick={() => setIsAddExpenseOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              + Ongeraho ayasohotse
            </Button>
          </div>

          <div className="space-y-3">
            {expenses.map((exp: ExpenseRecord) => (
              <div
                key={exp.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-sm text-[#241A15] dark:text-white block">
                    {exp.description}
                  </span>
                  <span className="text-xs text-[#75675C] dark:text-[#E2B994]">
                    {exp.createdAt} • Icyiciro: {exp.category}
                  </span>
                </div>
                <span className="font-display font-bold text-base sm:text-lg text-amber-700 dark:text-amber-400">
                  -{exp.amount.toLocaleString()} RWF
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBVIEW: Suppliers */}
      {activeView === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="accent"
              size="sm"
              onClick={() => setIsAddSupplierOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              + Ongeraho uwo mugura ho
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suppliers.map((sup) => (
              <div
                key={sup.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-bold text-base text-[#241A15] dark:text-white">
                    {sup.name}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Ahemba neza
                  </span>
                </div>
                <div className="text-xs text-[#75675C] dark:text-stone-300 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#8A5A38]" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8A5A38]" />
                    <span>{sup.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBVIEW: Rwanda Tax Estimation */}
      {activeView === 'taxes' && (
        <div className="space-y-4 max-w-2xl">
          <Card variant="walnut" padding="lg" className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9A45C]">
                Ibarurishamibare ry'Imisoro (Rwanda Revenue Authority)
              </span>
              <h3 className="font-display font-black text-2xl text-white mt-1">
                Igereranya ry'Uyu Kwezi
              </h3>
              <p className="text-xs text-[#E2B994] mt-0.5">
                Iri barura rifasha umucuruzi gutegura amafaranga ku gihe mbere y'itariki 15.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-300">Ibyagurishijwe byose (Turnover):</span>
                <span className="font-bold text-white">9,300,000 RWF</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-300">TVA (18% ku bicuruzwa bimwe):</span>
                <span className="font-bold text-[#C9A45C]">1,418,644 RWF</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-300">Withholding Tax (WHT 3%):</span>
                <span className="font-bold text-[#C9A45C]">279,000 RWF</span>
              </div>
              <div className="pt-2 border-t border-white/15 flex items-center justify-between font-bold">
                <span className="text-emerald-300">Inyungu isigara nyuma y'imisoro:</span>
                <span className="text-lg text-emerald-400">5,232,356 RWF</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SUBVIEW: Audit History */}
      {activeView === 'history' && (
        <div className="space-y-3">
          {activities.map((act: ActivityLog) => (
            <div
              key={act.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 flex items-center justify-between text-xs sm:text-sm"
            >
              <div>
                <span className="font-bold text-[#241A15] dark:text-white block">
                  {act.title}
                </span>
                <span className="text-xs text-[#75675C] dark:text-[#E2B994]">
                  {act.description}
                </span>
              </div>
              <span className="text-xs font-mono text-[#8A5A38] dark:text-stone-400">
                {act.timestamp}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SUBVIEW: Settings */}
      {activeView === 'settings' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 space-y-4 max-w-xl">
          <h3 className="font-display font-bold text-lg text-[#241A15] dark:text-white">
            Igenamiterere rya Konti yawe
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                Izina rya Business
              </label>
              <input
                type="text"
                defaultValue={user?.businessName}
                className="w-full px-3 py-2 rounded-xl bg-[#F7F2EA] dark:bg-[#1B120E] border border-[#8A5A38]/30 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                Imeri (Email)
              </label>
              <input
                type="text"
                disabled
                defaultValue={user?.email}
                className="w-full px-3 py-2 rounded-xl bg-[#F7F2EA] dark:bg-[#1B120E] border border-[#8A5A38]/20 opacity-75 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                Ururimi rw'ibanze
              </label>
              <select className="w-full px-3 py-2 rounded-xl bg-[#F7F2EA] dark:bg-[#1B120E] border border-[#8A5A38]/30 font-semibold">
                <option value="rw">Ikinyarwanda (Default)</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>

            <Button
              variant="accent"
              size="md"
              onClick={() => showToast('Igenamiterere ryabitswe neza.', 'success')}
            >
              Bika Impinduka
            </Button>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Ongeraho Amafaranga Yasohotse"
        subtitle="Andika imodoka, imishahara cyangwa ibindi byishyuwe"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
              Icyiciro cy'amafaranga
            </label>
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-semibold"
            >
              <option value="transport">Transport y'imbaho (Imodoka)</option>
              <option value="sawing">Gusatura & Kubaza ibiti</option>
              <option value="salary">Imishahara y'abakozi</option>
              <option value="rent">Ubukode bw'ububiko / Yard</option>
              <option value="other">Ibindi bikoresho</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
              Amafaranga (RWF)
            </label>
            <input
              type="number"
              value={expAmount}
              onChange={(e) => setExpAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 font-bold text-lg"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
              Ubusobanuro (Impamvu)
            </label>
            <input
              type="text"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              placeholder="Urugero: Daihatsu yagejeje imbaho i Gisozi"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-medium"
              required
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddExpenseOpen(false)}
            >
              Kureka
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              fullWidth
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Bika ayasohotse
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        title="Ongeraho Aho Mugura Imbaho"
        subtitle="Andika amakuru ya koperative cyangwa umusaruzi w'amashyamba"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
              Izina rya Koperative / Umuntu
            </label>
            <input
              type="text"
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              placeholder="Urugero: Koperative y'Amashyamba ya Gicumbi"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              placeholder="+250 788 000 000"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
              Aho aherereye (Akarere / Ishyamba)
            </label>
            <input
              type="text"
              value={supLocation}
              onChange={(e) => setSupLocation(e.target.value)}
              placeholder="Urugero: Gicumbi, Byumba"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-semibold"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddSupplierOpen(false)}
            >
              Kureka
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              fullWidth
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Bika
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
