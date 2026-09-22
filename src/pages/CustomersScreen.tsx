/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Customers Screen (ABAKIRIYA)
 * Customer Ledger, Credit Tracking, and Payment Reconciliation.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext.tsx';
import { CustomerCard } from '../components/ui/CustomerCard.tsx';
import { CustomerDetailModal } from '../components/customers/CustomerDetailModal.tsx';
import { SearchBar } from '../components/ui/SearchBar.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Customer } from '../types/frontend.ts';
import { useToast } from '../context/ToastContext.tsx';
import { Users, Plus, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const { customers, addCustomer } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterDebt, setFilterDebt] = useState<'all' | 'debt' | 'paid'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filterDebt === 'all' ||
      (filterDebt === 'debt' && c.remainingDebt > 0) ||
      (filterDebt === 'paid' && c.remainingDebt === 0);

    return matchesSearch && matchesFilter;
  });

  const totalOwedByCustomers = customers.reduce((acc, c) => acc + c.remainingDebt, 0);
  const totalCustomersWithDebt = customers.filter((c) => c.remainingDebt > 0).length;

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    await addCustomer({ name, phone, address });
    showToast(`👤 Umukiriya '${name}' yongerewe neza!`, 'success');
    setName('');
    setPhone('');
    setAddress('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
            ABAKIRIYA (CUSTOMERS)
          </h1>
          <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-1">
            Gukurikirana abaguzi b'imbaho n'abafite imyenda igomba kwishyurwa
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={() => setIsAddOpen(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          + Ongeraho umukiriya
        </Button>
      </div>

      {/* Debt Summary Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#2B1D16] to-[#1B120E] text-white border border-[#C9A45C]/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#E2B994] flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-4 h-4 text-[#C9A45C]" />
            Imyenda y'abakiriya isigaye hanze
          </span>
          <div className="font-display font-extrabold text-2xl sm:text-4xl text-white">
            {totalOwedByCustomers.toLocaleString()}{' '}
            <span className="text-sm sm:text-base font-bold text-[#C9A45C]">RWF</span>
          </div>
          <span className="text-xs text-stone-300 mt-1 block">
            Abakiriya {totalCustomersWithDebt} bafite imyenda itarishyurwa yose
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterDebt(filterDebt === 'debt' ? 'all' : 'debt')}
            className={`
              px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all
              ${
                filterDebt === 'debt'
                  ? 'bg-[#C9A45C] text-[#1B120E]'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }
            `}
          >
            Reba abafite imyenda gusa
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Shakisha umukiriya (Izina, Telefone, Aho atuye)..."
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterDebt('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filterDebt === 'all'
                ? 'bg-[#2B1D16] text-[#C9A45C] dark:bg-[#C9A45C] dark:text-black font-bold'
                : 'bg-[#EFE6D8] dark:bg-[#3A271E] text-[#75675C] dark:text-[#E2B994]'
            }`}
          >
            Bose ({customers.length})
          </button>
          <button
            onClick={() => setFilterDebt('debt')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filterDebt === 'debt'
                ? 'bg-[#2B1D16] text-[#C9A45C] dark:bg-[#C9A45C] dark:text-black font-bold'
                : 'bg-[#EFE6D8] dark:bg-[#3A271E] text-[#75675C] dark:text-[#E2B994]'
            }`}
          >
            Abafite imyenda ({totalCustomersWithDebt})
          </button>
          <button
            onClick={() => setFilterDebt('paid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filterDebt === 'paid'
                ? 'bg-[#2B1D16] text-[#C9A45C] dark:bg-[#C9A45C] dark:text-black font-bold'
                : 'bg-[#EFE6D8] dark:bg-[#3A271E] text-[#75675C] dark:text-[#E2B994]'
            }`}
          >
            Abishyuye bose ({customers.length - totalCustomersWithDebt})
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onClick={() => setSelectedCustomer(customer)}
          />
        ))}
      </div>

      {/* Customer Detail & Settlement Modal */}
      <CustomerDetailModal
        customer={selectedCustomer}
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Ongeraho Umukiriya Mushya"
        subtitle="Andika amakuru y'umuguzi mushya w'imbaho"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
              Izina ry'umukiriya
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Urugero: Claude Nsabimana"
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
              Nimero ya Telefone (MoMo)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250 788 000 000"
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
              Aho aherereye / Aho akorera
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Urugero: Gisozi, Atelier No 4"
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-semibold"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddOpen(false)}
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
              Bika Umukiriya
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
