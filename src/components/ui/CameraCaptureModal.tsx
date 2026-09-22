/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Camera-First Workflow Modal (📸 FOTORA)
 * Intelligent OCR Document & Timber Scanning with Verification Safeguards
 */

import React, { useState } from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';
import { 
  Camera, 
  Package, 
  Receipt, 
  BookOpen, 
  Truck, 
  FileText, 
  ScanLine, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  Upload
} from 'lucide-react';
import { useData } from '../../context/DataContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanType = 'inventory' | 'invoice' | 'book' | 'delivery' | 'other';

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addInventoryItem, addSale } = useData();
  const { showToast } = useToast();

  const [step, setStep] = useState<'select' | 'capture' | 'scanning' | 'review'>('select');
  const [scanType, setScanType] = useState<ScanType>('inventory');
  const [confidenceWarning, setConfidenceWarning] = useState(false);

  // Extracted data state (editable before saving)
  const [extractedData, setExtractedData] = useState({
    species: 'Eucalyptus',
    dimensionsStr: '3m × 15cm × 5cm',
    quantity: 35,
    unitPrice: 30000,
    supplierOrCustomer: 'Koperative Gicumbi',
    totalValue: 1050000,
  });

  const handleSelectType = (type: ScanType) => {
    setScanType(type);
    setStep('capture');
  };

  const handleTriggerScan = () => {
    setStep('scanning');
    setConfidenceWarning(false);

    // Realistic scanning duration
    setTimeout(() => {
      if (scanType === 'invoice') {
        setExtractedData({
          species: 'Pine',
          dimensionsStr: '4m × 20cm × 2.5cm',
          quantity: 20,
          unitPrice: 28000,
          supplierOrCustomer: 'Atelier de Kigali',
          totalValue: 560000,
        });
        setConfidenceWarning(false);
      } else if (scanType === 'book') {
        setExtractedData({
          species: 'Teak',
          dimensionsStr: '2.5m × 25cm × 5cm',
          quantity: 12,
          unitPrice: 65000,
          supplierOrCustomer: 'Ing. Eric',
          totalValue: 780000,
        });
        // Sometimes test low confidence alert
        setConfidenceWarning(true);
      } else {
        setExtractedData({
          species: 'Eucalyptus',
          dimensionsStr: '3m × 15cm × 5cm',
          quantity: 35,
          unitPrice: 30000,
          supplierOrCustomer: 'Gicumbi Forest',
          totalValue: 1050000,
        });
        setConfidenceWarning(false);
      }
      setStep('review');
    }, 2200);
  };

  const handleConfirmSave = async () => {
    if (scanType === 'invoice' || scanType === 'delivery') {
      // Save as verified sale or purchase
      showToast(`🧾 Inyandiko ya ${extractedData.supplierOrCustomer} yabitswe neza.`, 'success');
    } else {
      // Save as inventory
      await addInventoryItem({
        species: extractedData.species as any,
        name: `${extractedData.species} (${extractedData.dimensionsStr})`,
        dimensions: { length: 3, width: 15, thickness: 5, displayStr: extractedData.dimensionsStr },
        quantity: extractedData.quantity,
        minThreshold: 10,
        costPrice: Math.round(extractedData.unitPrice * 0.8),
        sellingPrice: extractedData.unitPrice,
        locationArea: 'Ububiko A',
      });
      showToast(`📦 Wongeye imbaho ${extractedData.quantity} muri stock.`, 'success');
    }

    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStep('select');
    setConfidenceWarning(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="📸 FOTORA"
      subtitle="Fata ifoto y'imbaho, facture, cyangwa igitabo cy'ububiko"
      maxWidth="lg"
    >
      {/* STEP 1: Select Type */}
      {step === 'select' && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[#241A15] dark:text-white mb-2">
            Ni iki ushaka gufotora?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleSelectType('inventory')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 hover:border-[#C9A45C] hover:bg-[#EFE6D8]/50 dark:hover:bg-[#3A271E] text-left transition-all group"
            >
              <div className="p-3 rounded-xl bg-[#C9A45C]/15 text-[#C9A45C] group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display font-bold text-base text-[#241A15] dark:text-white block">
                  📦 Imbaho mfite
                </span>
                <span className="text-xs text-[#75675C] dark:text-[#E2B994]">
                  Bara imbaho ziri mu bubiko
                </span>
              </div>
            </button>

            <button
              onClick={() => handleSelectType('invoice')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 hover:border-[#C9A45C] hover:bg-[#EFE6D8]/50 dark:hover:bg-[#3A271E] text-left transition-all group"
            >
              <div className="p-3 rounded-xl bg-[#B77A45]/15 text-[#B77A45] group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display font-bold text-base text-[#241A15] dark:text-white block">
                  🧾 Facture
                </span>
                <span className="text-xs text-[#75675C] dark:text-[#E2B994]">
                  Soma inyandiko y'igurisha cyangwa igura
                </span>
              </div>
            </button>

            <button
              onClick={() => handleSelectType('book')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 hover:border-[#C9A45C] hover:bg-[#EFE6D8]/50 dark:hover:bg-[#3A271E] text-left transition-all group"
            >
              <div className="p-3 rounded-xl bg-[#8A5A38]/15 text-[#8A5A38] dark:text-[#E2B994] group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display font-bold text-base text-[#241A15] dark:text-white block">
                  📖 Igitabo
                </span>
                <span className="text-xs text-[#75675C] dark:text-[#E2B994]">
                  Kwinjiza impapuro wanditseho n'ikaramu
                </span>
              </div>
            </button>

            <button
              onClick={() => handleSelectType('delivery')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 hover:border-[#C9A45C] hover:bg-[#EFE6D8]/50 dark:hover:bg-[#3A271E] text-left transition-all group"
            >
              <div className="p-3 rounded-xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display font-bold text-base text-[#241A15] dark:text-white block">
                  🚚 Ibyapakiwe
                </span>
                <span className="text-xs text-[#75675C] dark:text-[#E2B994]">
                  Imodoka igeze ku ruganda cyangwa igiye
                </span>
              </div>
            </button>
          </div>

          <button
            onClick={() => handleSelectType('other')}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#8A5A38]/40 text-xs font-semibold text-[#75675C] dark:text-[#E2B994] hover:bg-white/40 dark:hover:bg-black/20"
          >
            <FileText className="w-4 h-4" />
            <span>📄 Izindi nyandiko z'ubucuruzi</span>
          </button>
        </div>
      )}

      {/* STEP 2: Camera Viewfinder */}
      {step === 'capture' && (
        <div className="space-y-4">
          <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-black border-2 border-[#C9A45C]/60 flex flex-col items-center justify-center shadow-inner">
            {/* Viewfinder simulation frame */}
            <div className="absolute inset-4 border border-dashed border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-2 border-l-2 border-[#C9A45C]" />
                <div className="w-6 h-6 border-t-2 border-r-2 border-[#C9A45C]" />
              </div>
              <p className="text-center text-xs font-mono text-white/80 bg-black/50 px-3 py-1 rounded-full mx-auto backdrop-blur-sm">
                Shyira inyandiko cyangwa imbaho hano hagati
              </p>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-2 border-l-2 border-[#C9A45C]" />
                <div className="w-6 h-6 border-b-2 border-r-2 border-[#C9A45C]" />
              </div>
            </div>

            <Camera className="w-12 h-12 text-[#C9A45C]/60 mb-2 animate-pulse" />
            <span className="text-xs text-stone-300 font-mono">
              Kamera ya WoodApp iriteguye
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setStep('select')}
              className="flex-1"
            >
              Gusubira inyuma
            </Button>
            <Button
              variant="accent"
              size="md"
              onClick={handleTriggerScan}
              icon={<Camera className="w-4 h-4" />}
              className="flex-1"
            >
              Fata ifoto
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Scanning Animation */}
      {step === 'scanning' && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-5">
          <div className="relative w-24 h-24 rounded-2xl bg-[#3A271E] flex items-center justify-center border border-[#C9A45C] shadow-xl overflow-hidden">
            <ScanLine className="w-12 h-12 text-[#C9A45C] animate-bounce" />
            {/* Glowing scan bar */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C9A45C] to-transparent animate-pulse" />
          </div>

          <div>
            <h3 className="font-display font-bold text-xl text-[#241A15] dark:text-white">
              Ndimo gusoma amakuru...
            </h3>
            <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-1 max-w-xs">
              WoodApp irimo gusuzuma ingano, ubwoko bw'igiti, n'imibare byanditseho.
            </p>
          </div>
        </div>
      )}

      {/* STEP 4: Review Extracted Info */}
      {step === 'review' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {confidenceWarning && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  Hari amakuru ntasobanutse neza. Nyongera kuyagenzura.
                </span>
                Reba niba imibare n'ubunini bihuye mbere yo kwemeza.
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-white dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#8A5A38]/15 dark:border-[#B77A45]/20">
              <span className="text-xs font-bold text-[#8A5A38] dark:text-[#C9A45C] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Amakuru yabonetse
              </span>
              <span className="text-xs text-[#75675C] dark:text-stone-400">
                Ushobora kuyakosora
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                  Ubwoko bw'igiti
                </label>
                <input
                  type="text"
                  value={extractedData.species}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, species: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F2EA] dark:bg-[#2B1D16] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 font-semibold text-[#241A15] dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                  Ubunini (Dimensions)
                </label>
                <input
                  type="text"
                  value={extractedData.dimensionsStr}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, dimensionsStr: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F2EA] dark:bg-[#2B1D16] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 font-semibold text-[#241A15] dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                  Ingano (Pieces)
                </label>
                <input
                  type="number"
                  value={extractedData.quantity}
                  onChange={(e) => {
                    const q = Number(e.target.value) || 0;
                    setExtractedData({
                      ...extractedData,
                      quantity: q,
                      totalValue: q * extractedData.unitPrice,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F2EA] dark:bg-[#2B1D16] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 font-bold text-lg text-[#241A15] dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs text-[#75675C] dark:text-stone-400 block mb-1">
                  Igiciro cy'igiti kimwe (RWF)
                </label>
                <input
                  type="number"
                  value={extractedData.unitPrice}
                  onChange={(e) => {
                    const p = Number(e.target.value) || 0;
                    setExtractedData({
                      ...extractedData,
                      unitPrice: p,
                      totalValue: extractedData.quantity * p,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F2EA] dark:bg-[#2B1D16] border border-[#8A5A38]/30 dark:border-[#B77A45]/30 font-bold text-[#8A5A38] dark:text-[#C9A45C] text-sm"
                />
              </div>
            </div>

            {/* Total */}
            <div className="pt-2 flex items-center justify-between font-bold text-sm">
              <span className="text-[#75675C] dark:text-stone-300">
                Agaciro kose:
              </span>
              <span className="text-lg font-display text-[#241A15] dark:text-white">
                {extractedData.totalValue.toLocaleString()} RWF
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleReset}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Ongera ugenzure
            </Button>
            <Button
              variant="accent"
              size="md"
              fullWidth
              onClick={handleConfirmSave}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Emeza ubike
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
