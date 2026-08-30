import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Activity,
  Layers,
  CreditCard,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { TricolorStrip } from '../components/design/TricolorStrip';
import { AshokaChakraSVG } from '../components/design/AshokaChakraSVG';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { role } = useAuth();

  const services = [
    {
      title: t('home.service1Title'),
      desc: t('home.service1Desc'),
      icon: Calendar,
      link: '/book-slot',
    },
    {
      title: t('home.service2Title'),
      desc: t('home.service2Desc'),
      icon: Activity,
      link: '/live-queue',
    },
    {
      title: t('home.service3Title'),
      desc: t('home.service3Desc'),
      icon: Sparkles,
      link: '/book-slot',
    },
    {
      title: t('home.service5Title'),
      desc: t('home.service5Desc'),
      icon: Layers,
      link: '/track-procurement',
    },
    {
      title: t('home.service6Title'),
      desc: t('home.service6Desc'),
      icon: CreditCard,
      link: '/payment-status',
    },
    {
      title: 'Find Procurement Centres',
      desc: 'Locate APMC & Agricultural Procurement Centres with operating hours and active queues.',
      icon: MapPin,
      link: '/book-slot',
    },
  ];

  const steps = [
    { num: '1', title: t('home.step1'), desc: t('home.step1Desc') },
    { num: '2', title: t('home.step2'), desc: t('home.step2Desc') },
    { num: '3', title: t('home.step3'), desc: t('home.step3Desc') },
    { num: '4', title: t('home.step4'), desc: t('home.step4Desc') },
    { num: '5', title: t('home.step5'), desc: t('home.step5Desc') },
    { num: '6', title: t('home.step6'), desc: t('home.step6Desc') },
  ];

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden text-white bg-cover bg-center"
        style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(21, 128, 61, 0.95) 0%, rgba(21, 128, 61, 0.7) 50%, rgba(21, 128, 61, 0.4) 100%), url("/images/farm_banner.jpg")',
          backgroundBlendMode: 'normal'
        }}
      >
        <AshokaChakraSVG className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 text-white/20" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-wide text-india-saffron_hover font-semibold">
              Government of India
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-5xl leading-tight">
              {t('brand.name', 'Kisan Setu Portal')}
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-green-50 font-medium">
              {t('home.heroTitle', 'Know your centre. Book your slot. Come when it is your turn.')}
            </p>
            <p className="mt-2 text-sm text-green-100 max-w-reading">
              {t('home.heroDesc', 'An initiative of the Department of Consumer Affairs to make procurement scheduling predictable for every farmer.')}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/book-slot"
                className="bg-india-saffron hover:bg-india-saffron_hover text-white font-semibold px-5 py-2.5 rounded shadow transition flex items-center gap-2"
              >
                <span>{t('home.btnBook', 'Book a Slot')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {role !== 'FARMER' && (
                <Link
                  to="/login"
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded border border-white/40 transition"
                >
                  {t('home.btnLogin', 'Login')}
                </Link>
              )}
            </div>
          </div>
        </div>
        <TricolorStrip />
      </section>

      {/* Quote/Vision Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-ink">A digitally empowered kisan</h2>
            <blockquote className="mt-4 border-l-4 border-india-saffron pl-4 text-lg italic text-ink">
              “When the farmer of India is strong, the nation is strong. Technology must reach the farm and save the farmer's time.”
            </blockquote>
            <p className="mt-2 text-sm font-medium text-muted">— Vision of the Prime Minister of India for farmer welfare</p>
            <p className="mt-4 text-sm text-muted max-w-reading">
              Kisan Setu Portal takes that vision to the procurement centre: know your centre, book a slot in your own language, and arrive only when it is your turn.
            </p>
          </div>
        </div>
        <TricolorStrip />
      </section>

      {/* Core Services */}
      <section className="bg-paper py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-bold text-ink">
            {t('home.servicesTitle', 'What this portal does')}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services.map((s, idx) => (
              <Link
                key={idx}
                to={s.link}
                className="block bg-white p-5 rounded border border-line shadow-sm hover:shadow-md hover:border-india-green transition"
              >
                <div className="w-10 h-10 rounded bg-green-50 flex items-center justify-center text-india-green mb-3">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-muted leading-relaxed">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Step by step */}
      <section className="bg-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-bold text-ink">
            {t('home.howItWorksTitle', 'How to use this portal')}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="relative pl-12 pb-4">
                <div className="absolute left-0 top-0 w-8 h-8 bg-india-green text-white font-bold rounded-full flex items-center justify-center text-sm shadow-sm">
                  {step.num}
                </div>
                <h4 className="text-base font-bold text-ink pt-1">{step.title}</h4>
                <p className="mt-1 text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-india-green text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-bold">{t('home.whyTitle', 'Built for transparency')}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: t('home.why1'), desc: 'Real-time queue predictions prevent hours of unproductive waiting in sun and dust.' },
              { title: t('home.why2'), desc: 'Automated weight calculation and grade verification prevent price manipulation.' },
              { title: t('home.why3'), desc: 'SMS updates and distance-based travel advisories keep you informed on the move.' },
              { title: t('home.why4'), desc: 'Full native language support in English, हिन्दी, and తెలుగు with high accessibility.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 p-4 rounded border border-white/20">
                <CheckCircle2 className="w-5 h-5 text-india-saffron mb-2" />
                <h4 className="font-bold text-sm text-white mb-1">{item.title}</h4>
                <p className="text-sm text-green-50 leading-relaxed opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10">
          <TricolorStrip />
        </div>
      </section>
    </div>
  );
};
