import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wheat, Phone, Shield, CheckCircle, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-navy-900 text-slate-300 text-sm border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-amber-300">
                <Wheat className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-wide">Kisan Setu</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('brand.tagline')}
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700">
                Smart India Hackathon Prototype
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/book-slot" className="hover:text-white transition">
                  {t('nav.bookSlot')}
                </Link>
              </li>
              <li>
                <Link to="/live-queue" className="hover:text-white transition">
                  {t('nav.liveQueue')}
                </Link>
              </li>
              <li>
                <Link to="/track-procurement" className="hover:text-white transition">
                  {t('nav.trackProcurement')}
                </Link>
              </li>
              <li>
                <Link to="/payment-status" className="hover:text-white transition">
                  {t('nav.paymentStatus')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Centers */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Helpline: 1800-425-26032 (Demo Toll-Free)</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Support: support@kisansetu.in</span>
              </li>
              <li className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <Link to="/help" className="hover:text-white underline">
                  Frequently Asked Questions (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification & Privacy Notice */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">
              Security & Privacy
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Farmer data is secured with AES-256-GCM encryption + last-4 masking. RBAC enforced on backend.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Real-Time Database Sync</span>
            </div>
          </div>
        </div>

        {/* Sub-Footer with Problem Statement ID 26032 */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            © {new Date().getFullYear()} Kisan Setu. {t('footer.rights')}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400 font-mono">
              {t('footer.problemStatement')}
            </span>
            <Link to="/officer/login" className="hover:text-white underline">
              {t('nav.officerPortal')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
