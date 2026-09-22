/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ganza Login & Register Screen - High-Contrast Black & White
 */

import React, { useState } from 'react';
import { GanzaLogo } from '../components/brand/WoodAppLogo.tsx';
import { Button } from '../components/ui/Button.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { Mail, Lock, ArrowRight, Sparkles, Building2, User, Phone } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, register, useDemoAccount, loading } = useAuth();
  const { showToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('kwizerajaiid@gmail.com');
  const [password, setPassword] = useState('password123');

  // Register extra fields
  const [fullName, setFullName] = useState('Kwizera Jean Claude');
  const [phone, setPhone] = useState('+250 788 123 456');
  const [businessName, setBusinessName] = useState('Kigali Wood & Timber Yard');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('⚠️ Nyabuneka andika imeri yawe!', 'warning');
      return;
    }

    if (isRegister) {
      const ok = await register({ email, password, fullName, phone, businessName });
      if (ok) {
        showToast('Murakaza neza muri Ganza!', 'success');
      }
    } else {
      const ok = await login(email, password);
      if (ok) {
        showToast('Winjiye neza muri Business yawe!', 'success');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-white dark:bg-black text-black dark:text-white select-none relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center space-y-3">
          <GanzaLogo variant="icon" size="lg" />
          <div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-black dark:text-white tracking-tight uppercase">
              Ganza
            </h1>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
              {isRegister ? 'Tangiza konti nshya ya business' : 'Injira muri Business yawe'}
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                    Amazina yawe
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Urugero: Jean Claude"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                    Izina rya Business
                  </label>
                  <div className="relative flex items-center">
                    <Building2 className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Urugero: Kigali Wood Yard"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                    Nimero ya Telefone
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+250 788 000 000"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                Imeri (Email)
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="imeri@urugero.rw"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                Ijambo ry'ibanga (Password)
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  required
                />
              </div>
            </div>

            {!isRegister && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() =>
                    showToast('Ubutumwa bwo guhindura ijambo ry’ibanga bwoherejwe kuri imeri yawe.', 'info')
                  }
                  className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:underline"
                >
                  Wibagiwe ijambo ry’ibanga?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              disabled={loading}
              icon={<ArrowRight className="w-5 h-5" />}
              iconPosition="right"
            >
              {loading ? 'Ndimo kwinjira...' : isRegister ? 'Kora Konti' : 'Injira'}
            </Button>
          </form>

          {/* Quick Demo Preview Bypass */}
          <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={useDemoAccount}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs sm:text-sm font-bold border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-black dark:text-white" />
              <span>Injira ako kanya (Demo Yard Kigali)</span>
            </button>
          </div>
        </div>

        {/* Toggle Register / Login */}
        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            {isRegister
              ? 'Ufite konti isanzwe? Kanda hano winjire'
              : 'Nta konti uragira? Fungura konti nshya hano'}
          </button>
        </div>
      </div>
    </div>
  );
};
