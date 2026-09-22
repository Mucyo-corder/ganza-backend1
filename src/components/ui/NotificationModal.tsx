/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Notifications Center Modal (Ubutumwa)
 */

import React from 'react';
import { Modal } from './Modal.tsx';
import { useData } from '../../context/DataContext.tsx';
import { CheckCheck, Bell } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, markNotificationRead } = useData();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔔 Ubutumwa bwa WoodApp"
      subtitle="Amakuru n'imbuzi by'ubucuruzi bwawe"
      maxWidth="md"
    >
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-[#75675C] dark:text-[#E2B994]">
            <Bell className="w-8 h-8 mx-auto opacity-40 mb-2" />
            <p className="text-sm">Nta butumwa bushya urabona.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`
                p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3
                ${
                  n.isRead
                    ? 'bg-white/60 dark:bg-[#1B120E]/40 border-[#8A5A38]/15 dark:border-[#B77A45]/15 opacity-75'
                    : 'bg-white dark:bg-[#2B1D16] border-[#C9A45C]/50 shadow-sm'
                }
              `}
            >
              <div>
                <span className="font-bold text-sm text-[#241A15] dark:text-white block">
                  {n.title}
                </span>
                <p className="text-xs sm:text-sm text-[#75675C] dark:text-[#E2B994] mt-0.5 leading-snug">
                  {n.message}
                </p>
                <span className="text-[10px] text-[#8A5A38] dark:text-stone-400 font-medium mt-1.5 block">
                  {n.timestamp}
                </span>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9A45C] shrink-0 mt-1" />
              )}
            </div>
          ))
        )}

        {notifications.length > 0 && (
          <button
            onClick={() => notifications.forEach((n) => markNotificationRead(n.id))}
            className="w-full py-2.5 text-center text-xs font-semibold text-[#8A5A38] dark:text-[#C9A45C] hover:underline flex items-center justify-center gap-1"
          >
            <CheckCheck className="w-4 h-4" /> Soma ubutumwa bwose
          </button>
        )}
      </div>
    </Modal>
  );
};
