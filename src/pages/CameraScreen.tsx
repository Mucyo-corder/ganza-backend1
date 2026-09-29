/**
 * GANZA Camera — wood inventory workflow
 * FLOW: Photo → Quality Check → Detection → Counting → Measurement → Calculation → Price → Review
 */

import React, { useState } from 'react';
import { Camera, AlertTriangle, CheckCircle2, RotateCcw, Upload } from 'lucide-react';
import { useData } from '../context/DataContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { Button } from '../components/ui/Button.tsx';

type Step = 'capture' | 'quality' | 'review';

export const CameraScreen: React.FC = () => {
  const { addInventoryItem } = useData();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('capture');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [qualityOk, setQualityOk] = useState<boolean | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [productName, setProductName] = useState('');
  const [woodType, setWoodType] = useState('');
  const [lengthM, setLengthM] = useState('');
  const [widthM, setWidthM] = useState('');
  const [thicknessM, setThicknessM] = useState('');
  const [pricePerM3, setPricePerM3] = useState('');
  const [priceSource, setPriceSource] = useState('');

  const l = parseFloat(lengthM) || 0;
  const w = parseFloat(widthM) || 0;
  const t = parseFloat(thicknessM) || 0;
  const price = parseFloat(pricePerM3) || 0;
  const oneVol = l * w * t;
  const totalVol = oneVol * quantity;
  const estimatedValue = Math.round(totalVol * price);
  const hasMeasurements = l > 0 && w > 0 && t > 0;
  const estimatedLabel = hasMeasurements ? 'USER_MEASURED' : 'NOT MEASURED';

  const handleFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = (e.target as any).files?.[0] as File | undefined;
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImagePreview(url);
    setQuantity(0);
    setProductName('');
    setWoodType('');
    setLengthM('');
    setWidthM('');
    setThicknessM('');
    setPricePerM3('');
    setPriceSource('');
    setStep('quality');
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      setQualityOk(true);
    } catch {
      setQualityOk(false);
    } finally {
      setStep('review');
    }
  };

  const handleRetake = () => {
    setImagePreview(null);
    setQualityOk(null);
    setQuantity(0);
    setProductName('');
    setWoodType('');
    setLengthM('');
    setWidthM('');
    setThicknessM('');
    setPricePerM3('');
    setPriceSource('');
    setStep('capture');
  };

  const handleSave = async () => {
    if (quantity <= 0) {
      showToast('Umubare ugomba kuba >0', 'warning');
      return;
    }
    if (!productName.trim()) {
      showToast('Andika izina ry’igicuruzwa', 'warning');
      return;
    }
    if (l <= 0 || w <= 0 || t <= 0) {
      showToast('Ibipimo ntibisobanutse', 'warning');
      return;
    }
    if (price <= 0) {
      showToast('Andika igiciro cyagenzuwe', 'warning');
      return;
    }
    await addInventoryItem({
      species: (woodType || 'other') as any,
      name: `${productName.trim()} (${l.toFixed(1)}×${w.toFixed(2)}×${t.toFixed(2)} m)`,
      dimensions: { length: l, width: w * 100, thickness: t * 100, displayStr: `${l.toFixed(1)}m × ${(w * 100).toFixed(0)}cm × ${(t * 100).toFixed(0)}cm` },
      quantity,
      minThreshold: 5,
      costPrice: Math.round(price * oneVol),
      sellingPrice: Math.round(price * oneVol),
      locationArea: 'Ububiko A',
      imageUrl: imagePreview || undefined,
      measurementMethod: 'manual',
      countSource: 'MANUAL_CORRECTION',
      manualCount: quantity,
      priceSource: priceSource.trim() || 'USER_ENTERED',
    } as any);
    showToast(`Byabitswe: ${quantity} imbaho • ${totalVol.toFixed(3)} m³ • ${estimatedValue.toLocaleString()} RWF`, 'success');
    handleRetake();
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Header scrolls naturally — no sticky */}
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#241A15] dark:text-white">FATA IFOTO</h1>
        <p className="text-sm text-[#75675C] dark:text-[#E2B994] mt-1">Photo → Review → Correct count → Measure → Price → Save</p>
      </div>

      {step === 'capture' && (
        <div className="space-y-4">
          <div className="h-64 sm:h-80 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <p className="font-bold text-sm text-black dark:text-white">Fata ifoto y'imbaho</p>
            <p className="text-xs text-zinc-500 mt-1">Shyira imbaho neza — shyira ruler hafi niba ushaka ibipimo by'ukuri</p>
            <label className="mt-4 px-6 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2">
              <Upload className="w-4 h-4" /> Hitamo ifoto
              <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            </label>
            <p className="text-[11px] text-zinc-400 mt-2">Ibipimo by’ukuri bisaba ruler cyangwa igikoresho gipima.</p>
          </div>
        </div>
      )}

      {step === 'quality' && (
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black animate-pulse mx-auto flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <p className="font-bold text-sm mt-3 text-black dark:text-white">Turimo gusesengura ifoto...</p>
          <p className="text-xs text-zinc-500 mt-1">Checking whether the selected image can be opened</p>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          {imagePreview && (
            <div className="rounded-3xl overflow-hidden bg-black border border-zinc-800 relative">
              <img src={imagePreview} alt="scan" className="w-full h-64 sm:h-80 object-contain bg-black" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/70 backdrop-blur rounded-xl px-3 py-2 text-white text-xs">
                <span>Count: {quantity || 'NOT MEASURED'}</span>
                <span>NEEDS_REVIEW • {estimatedLabel}</span>
              </div>
            </div>
          )}

          {qualityOk === false && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex gap-2 text-amber-900 dark:text-amber-200 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold">Ifoto ntiyashoboye gusomwa.</div>
                <div className="text-xs opacity-80">Ishusho ntisomeka kuri iki gikoresho. Ushobora kwandika umubare n’ibipimo wapimye, cyangwa ugafata indi foto.</div>
              </div>
            </div>
          )}

          {qualityOk && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex gap-2 text-amber-900 dark:text-amber-200 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold">Kubara kuri iyi mushakisha ntibyakozwe.</div>
                <div className="text-xs opacity-80">Kubara byikora kuri uru rubuga ntibiboneka. Andika umubare wapimye n’ibipimo bifatika.</div>
              </div>
            </div>
          )}

          {/* Counting */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Umubare</span>
              <span className="text-xs text-zinc-500">NEEDS_REVIEW • andika cyangwa ukosore umubare</span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button onClick={() => setQuantity(Math.max(0, quantity - 1))} className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-xl active:scale-95">
                −
              </button>
              <div className="text-center min-w-[80px]">
                <div className="font-black text-3xl text-black dark:text-white">{quantity}</div>
                <div className="text-[11px] text-zinc-500">pieces</div>
              </div>
              <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xl active:scale-95">
                +
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-3">
              {[1, 5, 10].map(n => (
                <button key={n} onClick={() => setQuantity(quantity + n)} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-bold">
                  +{n}
                </button>
              ))}
              <button onClick={() => setQuantity(0)} className="px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs">
                Siba
              </button>
            </div>
            <label className="block mt-3 text-xs text-zinc-600 dark:text-zinc-300">
              Umubare wapimye
              <input type="number" min="0" step="1" value={quantity} onChange={e => setQuantity(Math.max(0, Number(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold" />
            </label>
          </div>

          {/* Dimensions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase">Ibipimo wapimye (m)</span>
              <span className="text-xs font-bold text-amber-600">{estimatedLabel}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Length</label>
                <input value={lengthM} onChange={e => setLengthM(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-sm text-center" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Width</label>
                <input value={widthM} onChange={e => setWidthM(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-sm text-center" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Thickness</label>
                <input value={thicknessM} onChange={e => setThicknessM(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-sm text-center" />
              </div>
            </div>
            <label className="block text-xs text-zinc-600 dark:text-zinc-300">Izina ry’igicuruzwa
              <input value={productName} onChange={e => setProductName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm" />
            </label>
            <label className="block text-xs text-zinc-600 dark:text-zinc-300">Ubwoko (bidakenewe)
              <input value={woodType} onChange={e => setWoodType(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm" />
            </label>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
              <div>
                Volume (one): {(oneVol).toFixed(4)} m³ • Total: {totalVol.toFixed(3)} m³ • Area: {(l * w * quantity).toFixed(2)} m²
              </div>
              <div className="font-mono text-[11px] text-zinc-500">Formula: {l.toFixed(2)} × {w.toFixed(2)} × {t.toFixed(2)} × {quantity} = {totalVol.toFixed(3)} m³</div>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Igiciro</div>
            <div className="flex gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold border bg-black text-white dark:bg-white dark:text-black">RWF / m³</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">RWF</span>
              <input value={pricePerM3} onChange={e => setPricePerM3(e.target.value.replace(/[^\d]/g, ''))} placeholder="Igiciro winjiza" className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold" />
            </div>
            <input value={priceSource} onChange={e => setPriceSource(e.target.value)} placeholder="Inkomoko y’igiciro cyangwa URL" className="mt-2 w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm" />
            <div className="mt-3 p-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-center">
              <div className="text-xs opacity-70 uppercase tracking-wider">Estimated market value</div>
              {quantity > 0 && hasMeasurements && price > 0 ? <>
                <div className="font-black text-xl mt-1">{estimatedValue.toLocaleString()} RWF</div>
                <div className="font-mono text-[11px] opacity-70 mt-1">{totalVol.toFixed(3)} m³ × {Number(price).toLocaleString()} RWF / m³</div>
              </> : <div className="font-black text-base mt-1">Not calculated</div>}
              <div className="text-[11px] opacity-70 mt-2">Price entered by user; not a verified market quote.</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="md" onClick={handleRetake} icon={<RotateCcw className="w-4 h-4" />}>
              Fata nanone
            </Button>
            <Button variant="primary" size="md" fullWidth onClick={handleSave} icon={<CheckCircle2 className="w-4 h-4" />}>
              Bika muri Stock
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
