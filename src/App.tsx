/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp - Premium Timber & Wood Business Management Platform
 * Crafted with natural walnut and oak aesthetic, tactile simplicity, and double-entry accounting.
 */

import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Providers
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { DataProvider } from './context/DataContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';

// Navigation & Layout
import { Sidebar } from './components/navigation/Sidebar.tsx';
import { BottomNavigation } from './components/navigation/BottomNavigation.tsx';
import { TopHeader } from './components/navigation/TopHeader.tsx';

// Modals
import { VoiceModal } from './components/ui/VoiceModal.tsx';
import { CameraCaptureModal } from './components/ui/CameraCaptureModal.tsx';
import { HelpModal } from './components/ui/HelpModal.tsx';
import { NotificationModal } from './components/ui/NotificationModal.tsx';

// Pages
import { SplashScreen } from './pages/SplashScreen.tsx';
import { LoginScreen } from './pages/LoginScreen.tsx';
import { HomeScreen } from './pages/HomeScreen.tsx';
import { InventoryScreen } from './pages/InventoryScreen.tsx';
import { CameraScreen } from './pages/CameraScreen.tsx';
import { SalesScreen } from './pages/SalesScreen.tsx';
import { PurchasesScreen } from './pages/PurchasesScreen.tsx';
import { CustomersScreen } from './pages/CustomersScreen.tsx';
import { BusinessScreen } from './pages/BusinessScreen.tsx';
import { DailyReportScreen } from './pages/DailyReportScreen.tsx';
import { MoreScreen } from './pages/MoreScreen.tsx';

const AppShell: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Global Interactive Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    // Show splash for 1.8 seconds on initial load
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] dark:bg-[#1B120E] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-[#8A5A38] animate-pulse flex items-center justify-center text-[#C9A45C] text-2xl font-black shadow-lg">
          W
        </div>
        <p className="mt-4 font-display font-bold text-sm text-[#75675C] dark:text-[#E2B994]">
          WoodApp iritegura...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA] dark:bg-[#1B120E] text-[#241A15] dark:text-[#F7F2EA] flex flex-col font-sans transition-colors duration-300 antialiased selection:bg-[#C9A45C] selection:text-black">
      {/* Top Header */}
      <TopHeader
        onOpenCapture={() => setIsCameraCaptureOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Luxury Wood Sidebar */}
        <Sidebar
          onOpenCapture={() => setIsCameraCaptureOpen(true)}
          onOpenVoice={() => setIsVoiceOpen(true)}
        />

        {/* Main Routed Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-5xl w-full mx-auto pb-24 md:pb-12">
          <Routes>
            <Route
              path="/"
              element={
                <HomeScreen
                  onOpenCapture={() => setIsCameraCaptureOpen(true)}
                  onOpenVoice={() => setIsVoiceOpen(true)}
                />
              }
            />
            <Route path="/kamera" element={<CameraScreen />} />
            <Route path="/camera" element={<CameraScreen />} />
            <Route path="/imbaho" element={<InventoryScreen />} />
            <Route path="/inventory" element={<InventoryScreen />} />
            <Route path="/kugurisha" element={<SalesScreen />} />
            <Route path="/sales" element={<SalesScreen />} />
            <Route path="/kugura" element={<PurchasesScreen />} />
            <Route path="/purchases" element={<PurchasesScreen />} />
            <Route path="/abakiriya" element={<CustomersScreen />} />
            <Route path="/customers" element={<CustomersScreen />} />
            <Route path="/business" element={<BusinessScreen />} />
            <Route path="/raporo" element={<DailyReportScreen />} />
            <Route path="/report" element={<DailyReportScreen />} />
            <Route path="/byinshi" element={<MoreScreen />} />
            <Route path="/more" element={<MoreScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Navigation (5 tabs) */}
      <BottomNavigation />

      {/* Global Interactive Modals */}
      <VoiceModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />

      <CameraCaptureModal
        isOpen={isCameraCaptureOpen}
        onClose={() => setIsCameraCaptureOpen(false)}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <Router>
              <AppShell />
            </Router>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
