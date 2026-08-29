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
  Calendar,
  Layers,
  Activity,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { token, role, farmer, officer, logout } = useAuth();
  const { fontSizeLevel, increaseFontSize, decreaseFontSize, resetFontSize, toggleHighContrast, highContrast } =
    useAccessibility();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showA11yMenu, setShowA11yMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('kisan_setu_language', lang);
    setShowLangMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: t('nav.home'), path: '/', icon: Wheat },
    { name: t('nav.bookSlot'), path: '/book-slot', icon: Calendar },
    { name: t('nav.trackProcurement'), path: '/track-procurement', icon: Layers },
    { name: t('nav.liveQueue'), path: '/live-queue', icon: Activity },
    { name: t('nav.paymentStatus'), path: '/payment-status', icon: CreditCard },
    { name: t('nav.help'), path: '/help', icon: HelpCircle },
  ];

  return (
    <header className="bg-navy-800 text-white sticky top-0 z-40 shadow-md border-b border-navy-900">
      {/* Top Utility Bar */}
      <div className="bg-navy-900 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800 flex justify-between items-center">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:bg-white focus:text-navy-900 px-2 py-1 rounded"
        >
          {t('accessibility.skipToContent')}
        </a>
        <div className="text-slate-300 hidden sm:flex items-center gap-2">
          <span>{t('brand.tagline')}</span>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {/* Accessibility Quick Menu */}
          <div className="relative">
            <button
              onClick={() => setShowA11yMenu(!showA11yMenu)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-slate-200 hover:text-white hover:bg-navy-800 transition"
              aria-label="Accessibility options"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('accessibility.title')}</span>
            </button>

            {showA11yMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white text-slate-800 rounded-md shadow-xl border border-slate-200 py-2 z-50 text-xs">
                <div className="px-3 py-1 font-semibold text-slate-500 border-b border-slate-100">
                  {t('accessibility.title')}
                </div>
                <button
                  onClick={increaseFontSize}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>{t('accessibility.increaseText')}</span>
                  <span className="font-bold text-navy-800">A+</span>
                </button>
                <button
                  onClick={resetFontSize}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>{t('accessibility.resetText')}</span>
                  <span>A</span>
                </button>
                <button
                  onClick={decreaseFontSize}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>{t('accessibility.decreaseText')}</span>
                  <span className="text-xs">A-</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={toggleHighContrast}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-navy-800 font-medium"
                >
                  <span>{t('accessibility.highContrast')}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 rounded">
                    {highContrast ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-slate-200 hover:text-white hover:bg-navy-800 transition font-medium"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>
                {i18n.language === 'hi' ? 'हिन्दी' : i18n.language === 'te' ? 'తెలుగు' : 'English'}
              </span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white text-slate-800 rounded-md shadow-xl border border-slate-200 py-1 z-50 text-xs">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 ${
                    i18n.language === 'en' ? 'font-bold text-navy-800 bg-navy-50' : ''
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('hi')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 ${
                    i18n.language === 'hi' ? 'font-bold text-navy-800 bg-navy-50' : ''
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  onClick={() => handleLanguageChange('te')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 ${
                    i18n.language === 'te' ? 'font-bold text-navy-800 bg-navy-50' : ''
                  }`}
                >
                  తెలుగు (Telugu)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo & Identity */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 group-hover:bg-white/20 transition">
            <Wheat className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{t('brand.name')}</span>
              <span className="text-[10px] bg-agri-700/80 text-white px-2 py-0.5 rounded-full font-normal uppercase tracking-wider">
                Public Service
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block">{t('brand.tagline')}</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-navy-700 text-white border-b-2 border-amber-400'
                    : 'text-slate-200 hover:text-white hover:bg-navy-700/50'
                }`}
              >
                <link.icon className="w-4 h-4 text-slate-300" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Portal Action buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {role === 'FARMER' && farmer ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="bg-navy-700 hover:bg-navy-600 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 border border-navy-600"
              >
                <User className="w-4 h-4 text-amber-300" />
                <span className="max-w-[120px] truncate">{farmer.fullName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-navy-700"
                title={t('nav.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : role === 'OFFICER' && officer ? (
            <div className="flex items-center gap-2">
              <Link
                to="/officer/dashboard"
                className="bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 text-white"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Officer: {officer.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-navy-700"
                title={t('nav.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="bg-agri-700 hover:bg-agri-800 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition shadow flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>{t('nav.farmerLogin')}</span>
              </Link>
              <Link
                to="/officer/login"
                className="text-xs text-slate-300 hover:text-white underline px-2 py-1"
              >
                {t('nav.officerPortal')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-slate-200 hover:text-white hover:bg-navy-700 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-900 border-t border-navy-800 px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-base font-medium ${
                location.pathname === link.path ? 'bg-navy-700 text-white' : 'text-slate-200 hover:bg-navy-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <link.icon className="w-5 h-5 text-slate-300" />
                <span>{link.name}</span>
              </div>
            </Link>
          ))}

          <div className="border-t border-navy-800 pt-3 mt-2 flex flex-col gap-2">
            {token ? (
              <div className="flex flex-col gap-2">
                {role === 'FARMER' && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center bg-navy-700 py-2.5 rounded-md text-sm font-semibold text-white"
                  >
                    {t('nav.dashboard')} ({farmer?.fullName})
                  </Link>
                )}
                {role === 'OFFICER' && (
                  <Link
                    to="/officer/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center bg-amber-600 py-2.5 rounded-md text-sm font-semibold text-white"
                  >
                    Officer Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-center bg-slate-800 text-slate-300 py-2 rounded-md text-sm font-medium hover:bg-slate-700"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center bg-agri-700 py-2.5 rounded-md text-sm font-bold text-white shadow"
                >
                  {t('nav.farmerLogin')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center bg-navy-700 py-2 rounded-md text-sm font-semibold text-white"
                >
                  {t('nav.register')}
                </Link>
                <Link
                  to="/officer/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-xs text-slate-400 py-1 underline"
                >
                  {t('nav.officerPortal')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
