import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ToastProvider } from './context/ToastContext';
import './i18n/i18n';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LanguageModal } from './components/LanguageModal';

import { Home } from './pages/Home';
import { FarmerLogin } from './pages/FarmerLogin';
import { FarmerRegister } from './pages/FarmerRegister';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { BookSlot } from './pages/BookSlot';
import { LiveQueue } from './pages/LiveQueue';
import { TrackProcurement } from './pages/TrackProcurement';
import { PaymentStatus } from './pages/PaymentStatus';
import { BookingHistory } from './pages/BookingHistory';
import { HelpCenter } from './pages/HelpCenter';

import { OfficerLogin } from './pages/OfficerLogin';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { OfficerQueue } from './pages/OfficerQueue';
import { OfficerProcurement } from './pages/OfficerProcurement';
import { OfficerPayments } from './pages/OfficerPayments';
import { OfficerAudit } from './pages/OfficerAudit';

import { AccessDenied } from './pages/AccessDenied';
import { NotFound } from './pages/NotFound';

// Protected Route Guard for Officer
const OfficerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-sm font-semibold">Verifying credentials...</div>;
  if (role !== 'OFFICER') {
    return <Navigate to="/officer/login" replace />;
  }
  return <>{children}</>;
};

// Protected Route Guard for Farmer
const FarmerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-sm font-semibold">Verifying session...</div>;
  if (role !== 'FARMER') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <AuthProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen">
              {/* Critical First Screen Language Selection Modal */}
              <LanguageModal />

              <Header />

              <main id="main-content" className="flex-grow">
                <Routes>
                  {/* Public / Farmer Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<FarmerLogin />} />
                  <Route path="/register" element={<FarmerRegister />} />
                  <Route path="/book-slot" element={<BookSlot />} />
                  <Route path="/live-queue" element={<LiveQueue />} />
                  <Route path="/track-procurement" element={<TrackProcurement />} />
                  <Route path="/payment-status" element={<PaymentStatus />} />
                  <Route path="/history" element={<BookingHistory />} />
                  <Route path="/help" element={<HelpCenter />} />

                  {/* Protected Farmer Dashboard */}
                  <Route
                    path="/dashboard"
                    element={
                      <FarmerRoute>
                        <FarmerDashboard />
                      </FarmerRoute>
                    }
                  />

                  {/* Officer Auth & Protected Routes */}
                  <Route path="/officer/login" element={<OfficerLogin />} />
                  <Route
                    path="/officer/dashboard"
                    element={
                      <OfficerRoute>
                        <OfficerDashboard />
                      </OfficerRoute>
                    }
                  />
                  <Route
                    path="/officer/queue"
                    element={
                      <OfficerRoute>
                        <OfficerQueue />
                      </OfficerRoute>
                    }
                  />
                  <Route
                    path="/officer/procurement"
                    element={
                      <OfficerRoute>
                        <OfficerProcurement />
                      </OfficerRoute>
                    }
                  />
                  <Route
                    path="/officer/payments"
                    element={
                      <OfficerRoute>
                        <OfficerPayments />
                      </OfficerRoute>
                    }
                  />
                  <Route
                    path="/officer/audit"
                    element={
                      <OfficerRoute>
                        <OfficerAudit />
                      </OfficerRoute>
                    }
                  />

                  {/* Error & 404 Pages */}
                  <Route path="/access-denied" element={<AccessDenied />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
};
