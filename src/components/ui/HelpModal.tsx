/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Simple Kinyarwanda Help Dialog
 * Clear, plain-language business guidance for everyday workshop owners.
 */

import React from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';
import { HelpCircle, CheckCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  question?: string;
  explanation?: string;
  tips?: string[];
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  title = 'Ubufasha bwa WoodApp',
  question = 'Uburyo bwo gukoresha WoodApp?',
  explanation = 'WoodApp igufasha gucunga neza ubucuruzi bw’imbaho: kwandika ibyo wagurishije, ibyo waguze, abakiriya bagufitiye imyenda, kureba amashusho ya camera za stock, no kumenya inyungu yawe buri munsi mu buryo bworoshye.',
  tips = [
    'Kanda ahakozwe nka camera kugira ngo ufate ifoto y’urubaho cyangwa uhe abakozi amabwiriza.',
    'Iyo ugurishije ku nguzanyo, WoodApp ihita yibika ku mukiriya nta kindi ukoze.',
    'Buri joro ushobora kubona raporo yuzuye y’umunsi.',
  ],
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`? Ubufasha: ${title}`}
      subtitle="Ubusobanuro bworoshye mu Kinyarwanda"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-[#EFE6D8]/60 dark:bg-[#1B120E] border border-[#8A5A38]/20 dark:border-[#B77A45]/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#C9A45C]/20 text-[#C9A45C] shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base sm:text-lg text-[#241A15] dark:text-white">
                {question}
              </h4>
              <p className="mt-1.5 text-sm sm:text-base text-[#75675C] dark:text-[#E2B994] leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </div>

        {tips.length > 0 && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#2B1D16] border border-[#8A5A38]/20 dark:border-[#B77A45]/20 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A38] dark:text-[#C9A45C]">
              Inama z’ingenzi:
            </span>
            <ul className="space-y-2 text-xs sm:text-sm text-[#241A15] dark:text-stone-300">
              {tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button variant="primary" size="md" fullWidth onClick={onClose}>
          Nabyumvise, murakoze
        </Button>
      </div>
    </Modal>
  );
};
