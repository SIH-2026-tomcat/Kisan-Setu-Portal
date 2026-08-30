import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wheat, Phone, Shield, CheckCircle, HelpCircle } from 'lucide-react';
import { TricolorStrip } from './design/TricolorStrip';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-line bg-white">
      <TricolorStrip />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Purpose */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-india-green">
              <Wheat className="w-8 h-8" />
              <span className="text-lg font-bold text-ink tracking-wide">{t('brand.name', 'Kisan Setu')}</span>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              {t('brand.tagline', 'Department of Consumer Affairs, Food & Public Distribution')}
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] bg-paper text-muted px-2.5 py-1 rounded border border-line font-medium uppercase tracking-wider">
                Digital India Initiative
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-ink font-bold text-sm">
              {t('footer.quickLinks', 'Quick Links')}
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link to="/" className="hover:text-india-green transition">
                  {t('nav.home', 'Home')}
                </Link>
              </li>
              <li>
                <Link to="/book-slot" className="hover:text-india-green transition">
                  {t('nav.bookSlot', 'Book a Slot')}
                </Link>
              </li>
              <li>
                <Link to="/live-queue" className="hover:text-india-green transition">
                  {t('nav.liveQueue', 'Live Queue')}
                </Link>
              </li>
              <li>
                <Link to="/track-procurement" className="hover:text-india-green transition">
                  {t('nav.trackProcurement', 'Track Status')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Centers */}
          <div className="space-y-3">
            <h4 className="text-ink font-bold text-sm">
              {t('footer.contact', 'Help & Support')}
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                <span>Helpline: 1800-425-26032 (Toll-Free)</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                <span>support@kisansetu.in</span>
              </li>
              <li className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                <Link to="/help" className="hover:text-india-green underline">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification & Privacy Notice */}
          <div className="space-y-3">
            <h4 className="text-ink font-bold text-sm">
              Security
            </h4>
            <p className="text-sm text-muted leading-relaxed">
              Farmer data is secured with government-grade encryption. Real-time RBAC enforced.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-india-green font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Verified Portal</span>
            </div>
          </div>
        </div>

        {/* Sub-Footer */}
        <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted">
          <div>
            © {new Date().getFullYear()} Government of India. {t('footer.rights', 'All rights reserved.')}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link to="/officer/login" className="hover:text-india-green underline">
              {t('nav.officerPortal', 'Officer Login')}
            </Link>
            <span>•</span>
            <span className="font-mono bg-paper px-2 py-0.5 rounded border border-line">
              {t('footer.problemStatement', 'PS ID: 26032')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
