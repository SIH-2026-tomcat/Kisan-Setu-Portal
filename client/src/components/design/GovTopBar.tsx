import React from 'react';
import { useTranslation } from 'react-i18next';

export const GovTopBar: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-india-green text-white text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-1.5">
        <span className="truncate">
          {t('gov.topbarText', 'Government of India · Ministry of Consumer Affairs, Food & Public Distribution')}
        </span>
        <a href="#main-content" className="hidden shrink-0 sm:inline hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-india-green">
          {t('gov.skipToMain', 'Skip to main content')}
        </a>
      </div>
    </div>
  );
};
