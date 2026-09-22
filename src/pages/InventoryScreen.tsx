/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Inventory Screen (IMBAHO MFITE)
 * Real-time timber inventory, dimensions tracking, and stock addition.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext.tsx';
import { ProductCard } from '../components/ui/ProductCard.tsx';
import { SearchBar, FilterBar } from '../components/ui/SearchBar.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ProductDetailModal } from '../components/inventory/ProductDetailModal.tsx';
import { InventoryItem, WoodSpecies } from '../types/frontend.ts';
import { useToast } from '../context/ToastContext.tsx';
import { Plus, Package, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

interface InventoryScreenProps {
  onOpenQuickSale?: (item: InventoryItem) => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  onOpenQuickSale,
}) => {
  const { inventory, addInventoryItem } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  // New Timber Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSpecies, setNewSpecies] = useState<WoodSpecies>('Eucalyptus');
  const [newLength, setNewLength] = useState(3);
  const [newWidth, setNewWidth] = useState(15);
  const [newThickness, setNewThickness] = useState(5);
  const [newQty, setNewQty] = useState(25);
  const [newCostPrice, setNewCostPrice] = useState(24000);
  const [newSellingPrice, setNewSellingPrice] = useState(30000);
  const [newLocation, setNewLocation] = useState('Ububiko A');

  // Filter & Search Logic
  const filteredItems = inventory.filter((item) => {
    const matchesFilter =
      filter === 'all' ||
      item.species.toLowerCase() === filter.toLowerCase() ||
      (filter === 'Furniture' && item.species === 'Furniture') ||
      (filter === 'Ibindi' && !['Eucalyptus', 'Pine', 'Teak'].includes(item.species));

    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.species.toLowerCase().includes(search.toLowerCase()) ||
      (item.dimensions?.displayStr || '').toLowerCase().includes(search.toLowerCase()) ||
      item.locationArea.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleCreateTimber = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayStr = `${newLength}m × ${newWidth}cm × ${newThickness}cm`;

    await addInventoryItem({
      species: newSpecies,
      name: `${newSpecies} (${displayStr})`,
      dimensions: {
        length: newLength,
        width: newWidth,
        thickness: newThickness,
        displayStr,
      },
      quantity: newQty,
      minThreshold: 10,
      costPrice: newCostPrice,
      sellingPrice: newSellingPrice,
      locationArea: newLocation,
      imageUrl:
        newSpecies === 'Pine'
          ? 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=800&auto=format&fit=crop&q=80'
          : newSpecies === 'Teak'
          ? 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
    });

    showToast(`📦 Wongeye imbaho ${newQty} za ${newSpecies} muri stock!`, 'success');
    setIsAddOpen(false);
  };

  const totalPieces = filteredItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalValue = filteredItems.reduce((acc, curr) => acc + curr.totalValue, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
            IMBAHO MFITE (STOCK)
          </h1>
          <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-1">
            Ubwoko bw'ibiti biri mu bubiko, ubunini n'agaciro kabyo kugeza ubu
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={() => setIsAddOpen(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          + Ongeraho imbaho
        </Button>
      </div>

      {/* Stock Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/20 shadow-sm">
          <span className="text-xs text-[#75675C] dark:text-stone-400 font-semibold block uppercase">
            Ingano yose (Pieces)
          </span>
          <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#241A15] dark:text-white">
            {totalPieces.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/20 shadow-sm">
          <span className="text-xs text-[#75675C] dark:text-stone-400 font-semibold block uppercase">
            Ubwoko buriho
          </span>
          <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#8A5A38] dark:text-[#E2B994]">
            {filteredItems.length}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#C9A45C]/40 shadow-sm">
          <span className="text-xs text-[#75675C] dark:text-stone-400 font-semibold block uppercase">
            Agaciro kose k'imbaho
          </span>
          <span className="font-display font-extrabold text-xl sm:text-2xl text-[#241A15] dark:text-white">
            {totalValue.toLocaleString()} <span className="text-xs font-bold text-[#C9A45C]">RWF</span>
          </span>
        </div>
      </div>

      {/* Search & Species Filter Bar */}
      <div className="space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Shakisha imbaho (Ubwoko, Ubunini 3m x 15cm, Ububiko)..."
        />
        <FilterBar selectedFilter={filter} onSelectFilter={setFilter} />
      </div>

      {/* Timber Product Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/50 dark:bg-[#2B1D16]/50 border border-dashed border-[#8A5A38]/30 space-y-3">
          <Package className="w-12 h-12 text-[#8A5A38] dark:text-[#E2B994] mx-auto opacity-50" />
          <h3 className="font-display font-bold text-lg text-[#241A15] dark:text-white">
            Nta mbaho zihuye n'ibyo ushaka
          </h3>
          <p className="text-xs text-[#75675C] dark:text-[#E2B994]">
            Gerageza gukuraho akayunguruzo cyangwa wongereho imbaho nshya mu bubiko.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
          >
            Garura zose
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onClick={() => setSelectedProduct(item)}
              onQuickSell={() => {
                if (onOpenQuickSale) onOpenQuickSale(item);
              }}
            />
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onQuickSell={(it) => {
          if (onOpenQuickSale) onOpenQuickSale(it);
        }}
      />

      {/* Add New Timber Stock Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Ongeraho Imbaho Nshya"
        subtitle="Andika amakuru y'imbaho ugejeje mu bubiko"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTimber} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Ubwoko bw'igiti
              </label>
              <select
                value={newSpecies}
                onChange={(e) => setNewSpecies(e.target.value as WoodSpecies)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-sm font-semibold"
              >
                <option value="Eucalyptus">Eucalyptus (Inturusu)</option>
                <option value="Pine">Pine (Pinusi)</option>
                <option value="Teak">Teak (Tiki)</option>
                <option value="Cypress">Cypress</option>
                <option value="Mahogany">Mahogany</option>
                <option value="Grevillea">Grevillea</option>
                <option value="Furniture">Furniture (Ibikoresho)</option>
                <option value="Ibindi">Ibindi</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Aho biri mu bubiko
              </label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Ububiko A, B, C..."
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 text-sm font-semibold"
                required
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="p-3.5 rounded-2xl bg-[#EFE6D8]/50 dark:bg-[#1B120E]/50 border border-[#8A5A38]/15 space-y-2">
            <span className="text-xs font-bold text-[#8A5A38] dark:text-[#C9A45C] block">
              Ubunini bw'igiti (Dimensions)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-[#75675C] dark:text-stone-400 block">
                  Uburebure (Meters)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newLength}
                  onChange={(e) => setNewLength(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#75675C] dark:text-stone-400 block">
                  Ubugari (Centimeters)
                </label>
                <input
                  type="number"
                  value={newWidth}
                  onChange={(e) => setNewWidth(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#75675C] dark:text-stone-400 block">
                  Ububyimba (Centimeters)
                </label>
                <input
                  type="number"
                  value={newThickness}
                  onChange={(e) => setNewThickness(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/30 text-sm font-bold"
                />
              </div>
            </div>
          </div>

          {/* Quantity & Prices */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Ingano (Pieces)
              </label>
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 font-bold text-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Igiciro cyo kugura
              </label>
              <input
                type="number"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#75675C] dark:text-stone-400 block mb-1">
                Igiciro cyo kugurisha
              </label>
              <input
                type="number"
                value={newSellingPrice}
                onChange={(e) => setNewSellingPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/30 text-sm font-bold text-[#8A5A38] dark:text-[#C9A45C]"
                required
              />
            </div>
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
              Bika muri Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
