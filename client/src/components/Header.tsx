import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Wheat,
  Globe,
  Sliders,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { GovTopBar } from './design/GovTopBar';
import { TricolorStrip } from './design/TricolorStrip';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { token, role, farmer, officer, logout } = useAuth();
  const { increaseFontSize, decreaseFontSize, resetFontSize } = useAccessibility();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showA11yMenu, setShowA11yMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('kisan_setu_language', lang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinks = role === 'FARMER' ? [
    { name: t('nav.home', 'Home'), path: '/' },
    { name: t('nav.bookSlot', 'Book Slot'), path: '/book-slot' },
    { name: t('nav.myBooking', 'My Booking'), path: '/dashboard' },
    { name: t('nav.liveQueue', 'Live Queue'), path: '/live-queue' },
    { name: t('nav.payments', 'Payments'), path: '/payment-status' },
  ] : role === 'OFFICER' ? [
    { name: 'Dashboard', path: '/officer/dashboard' },
    { name: 'Queue', path: '/officer/queue' },
    { name: 'Procurement', path: '/officer/procurement' },
    { name: 'Payments', path: '/officer/payments' },
  ] : [
    { name: t('nav.home', 'Home'), path: '/' },
    { name: t('nav.bookSlot', 'Book Slot'), path: '/book-slot' },
    { name: t('nav.liveQueue', 'Live Queue'), path: '/live-queue' },
    { name: t('nav.help', 'Help & Support'), path: '/help' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white flex flex-col">
      <GovTopBar />
      
      {/* Main Header area */}
      <div className="border-b border-line bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          
          {/* Brand/Logo Area */}
          <Link to="/" className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-india-green rounded p-1">
            <img 
              src="/images/gov_logo_correct.png" 
              alt="Government of India - Kisan Sahayak Portal" 
              className="h-12 sm:h-14 md:h-16 object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium no-underline hover:text-india-green transition-colors ${
                  location.pathname === link.path ? 'text-india-green font-bold border-b-2 border-india-green pb-1' : 'text-ink'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Language Selector (Native select for accessibility and cleaner look) */}
            <label className="inline-flex items-center gap-1.5 text-sm ml-2">
              <span className="sr-only">Language</span>
              <Globe className="w-4 h-4 text-muted" />
              <select 
                className="rounded border border-line bg-white px-2 py-1 text-ink text-xs focus:ring-2 focus:ring-india-green focus:outline-none"
                value={i18n.language}
                onChange={handleLanguageChange}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="te">తెలుగు</option>
              </select>
            </label>

            {/* A11y Menu Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowA11yMenu(!showA11yMenu)}
                className="p-1.5 text-muted hover:text-india-green rounded focus:outline-none focus:ring-2 focus:ring-india-green"
                aria-label="Accessibility options"
              >
                <Sliders className="w-4 h-4" />
              </button>
              {showA11yMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-line rounded shadow-lg py-2 z-50 text-xs">
                  <div className="px-3 py-1 font-semibold text-muted border-b border-line mb-1">Text Size</div>
                  <button onClick={increaseFontSize} className="w-full text-left px-3 py-1.5 hover:bg-paper">Increase (A+)</button>
                  <button onClick={resetFontSize} className="w-full text-left px-3 py-1.5 hover:bg-paper">Default (A)</button>
                  <button onClick={decreaseFontSize} className="w-full text-left px-3 py-1.5 hover:bg-paper">Decrease (A-)</button>
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3 ml-2 border-l border-line pl-4">
              {role === 'FARMER' && farmer ? (
                <>
                  <Link to="/dashboard" className="text-ink font-medium hover:text-india-green flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{farmer.fullName}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-muted hover:text-red-600 p-1" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : role === 'OFFICER' && officer ? (
                <>
                  <Link to="/officer/dashboard" className="text-india-saffron font-medium hover:text-india-saffron_hover flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{officer.username}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-muted hover:text-red-600 p-1" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-3 py-1.5 border border-line text-ink rounded hover:bg-paper transition-colors font-medium text-xs">
                    Farmer Login
                  </Link>
                  <Link to="/officer/login" className="px-3 py-1.5 bg-india-saffron text-white rounded hover:bg-india-saffron_hover transition-colors font-medium text-xs">
                    Officer Login
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-ink"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-line bg-paper px-4 py-4 space-y-4 shadow-inner">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="font-medium text-ink py-2 border-b border-line/50"
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <div className="pt-2 flex justify-between items-center">
            <select 
              className="rounded border border-line bg-white px-2 py-1.5 text-ink text-sm"
              value={i18n.language}
              onChange={handleLanguageChange}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            {token ? (
               <button
                 onClick={handleLogout}
                 className="w-full text-center border border-line py-2 rounded font-medium text-ink bg-white"
               >
                 Logout
               </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center border border-line py-2 rounded font-medium text-ink bg-white"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-india-saffron py-2 rounded font-medium text-white"
                >
                  Register as Farmer
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* The decorative bottom strip */}
      <TricolorStrip />
    </header>
  );
};
