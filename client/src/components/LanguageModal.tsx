import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wheat, Check, Globe } from 'lucide-react';

interface LanguageModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ forceOpen, onClose }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>(i18n.language || 'en');

  useEffect(() => {
    const hasChosen = localStorage.getItem('kisan_setu_has_chosen_lang');
    if (!hasChosen || forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleSelect = (lang: string) => {
    setSelected(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('kisan_setu_language', lang);
  };

  const handleConfirm = () => {
    localStorage.setItem('kisan_setu_has_chosen_lang', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
            <Wheat className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900 tracking-tight">Kisan Setu</h2>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-800">{t('langModal.title')}</p>
            <p className="text-xs text-slate-500 font-medium">{t('langModal.subtitle')}</p>
          </div>
        </div>

        {/* 3 Large Mobile-Friendly Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
          {/* English */}
          <button
            onClick={() => handleSelect('en')}
            className={`p-4 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-2 relative ${
              selected === 'en'
                ? 'border-navy-800 bg-navy-50 text-navy-900 font-bold shadow-sm'
                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
            }`}
          >
            {selected === 'en' && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-navy-800 text-white rounded-full flex items-center justify-center text-[10px]">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
            <span className="text-2xl">🌾</span>
            <span className="text-base">English</span>
            <span className="text-[11px] text-slate-500 font-normal">English</span>
          </button>

          {/* Hindi */}
          <button
            onClick={() => handleSelect('hi')}
            className={`p-4 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-2 relative ${
              selected === 'hi'
                ? 'border-navy-800 bg-navy-50 text-navy-900 font-bold shadow-sm'
                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
            }`}
          >
            {selected === 'hi' && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-navy-800 text-white rounded-full flex items-center justify-center text-[10px]">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
            <span className="text-2xl">🇮🇳</span>
            <span className="text-base">हिन्दी</span>
            <span className="text-[11px] text-slate-500 font-normal">Hindi</span>
          </button>

          {/* Telugu */}
          <button
            onClick={() => handleSelect('te')}
            className={`p-4 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-2 relative ${
              selected === 'te'
                ? 'border-navy-800 bg-navy-50 text-navy-900 font-bold shadow-sm'
                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
            }`}
          >
            {selected === 'te' && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-navy-800 text-white rounded-full flex items-center justify-center text-[10px]">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
            <span className="text-2xl">🌱</span>
            <span className="text-base">తెలుగు</span>
            <span className="text-[11px] text-slate-500 font-normal">Telugu</span>
          </button>
        </div>

        {/* Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-6 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{t('langModal.note')}</span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          className="w-full bg-navy-800 hover:bg-navy-900 text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
        >
          <span>{t('langModal.continue')}</span>
        </button>
      </div>
    </div>
  );
};
