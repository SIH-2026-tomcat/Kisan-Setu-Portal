import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Activity,
  Layers,
  CreditCard,
  Bell,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { role } = useAuth();

  const services = [
    {
      title: t('home.service1Title'),
      desc: t('home.service1Desc'),
      icon: Calendar,
      link: '/book-slot',
      color: 'bg-blue-50 text-navy-800 border-blue-200',
    },
    {
      title: t('home.service2Title'),
      desc: t('home.service2Desc'),
      icon: Activity,
      link: '/live-queue',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      title: t('home.service3Title'),
      desc: t('home.service3Desc'),
      icon: Sparkles,
      link: '/book-slot',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      title: t('home.service5Title'),
      desc: t('home.service5Desc'),
      icon: Layers,
      link: '/track-procurement',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    {
      title: t('home.service6Title'),
      desc: t('home.service6Desc'),
      icon: CreditCard,
      link: '/payment-status',
      color: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    {
      title: 'Find Procurement Centres',
      desc: 'Locate APMC & Agricultural Procurement Centres with operating hours and active queues.',
      icon: MapPin,
      link: '/book-slot',
      color: 'bg-slate-50 text-slate-800 border-slate-200',
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
    <div className="space-y-12 pb-16">
      {/* Hero Section (Public-Service Trustworthy Theme) */}
      <section className="bg-navy-800 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 shadow-inner border-b border-navy-900">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-navy-700/80 border border-navy-600 px-3.5 py-1 rounded-full text-xs font-semibold text-amber-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Digital Agricultural Procurement & Queue Management</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {t('home.heroTitle')}
          </h1>

          <p className="text-base sm:text-lg text-slate-200 max-w-3xl mx-auto leading-relaxed">
            {t('home.heroDesc')}
          </p>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 pt-2">
            <Link
              to="/book-slot"
              className="bg-agri-700 hover:bg-agri-800 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2 text-sm sm:text-base"
            >
              <Calendar className="w-5 h-5" />
              <span>{t('home.btnBook')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/track-procurement"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 transition flex items-center gap-2 text-sm sm:text-base backdrop-blur-sm"
            >
              <Layers className="w-5 h-5 text-amber-300" />
              <span>{t('home.btnTrack')}</span>
            </Link>

            {role !== 'FARMER' && (
              <Link
                to="/login"
                className="bg-navy-900 hover:bg-slate-950 text-slate-200 font-semibold px-5 py-3.5 rounded-xl border border-navy-700 transition flex items-center gap-2 text-sm sm:text-base"
              >
                <Users className="w-5 h-5 text-slate-400" />
                <span>{t('home.btnLogin')}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Core Services Grid */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">
              {t('home.servicesTitle')}
            </h2>
            <p className="text-sm text-slate-600">
              All digital services designed for seamless, predictable, and fair procurement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, idx) => (
              <Link
                key={idx}
                to={s.link}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${s.color}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-navy-800 transition">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-navy-800 gap-1 group-hover:gap-2 transition-all">
                  <span>Access Service</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How Kisan Setu Works (6-step visual path) */}
        <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
          <div className="text-center space-y-1">
            <span className="text-xs uppercase tracking-wider text-agri-700 font-bold">Step-by-Step Guide</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">
              {t('home.howItWorksTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200 relative flex flex-col justify-between space-y-2 hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-navy-800 text-white font-bold text-sm flex items-center justify-center">
                    {step.num}
                  </span>
                  <span className="text-xs font-medium text-slate-400">Step {step.num}</span>
                </div>
                <h4 className="text-base font-bold text-slate-800 pt-1">{step.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Kisan Setu */}
        <section className="bg-navy-900 text-white rounded-2xl p-6 sm:p-10 shadow-md space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('home.whyTitle')}</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Built for trust, speed, transparency, and accessible public service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              { title: t('home.why1'), desc: 'Real-time queue predictions prevent hours of unproductive waiting in sun and dust.' },
              { title: t('home.why2'), desc: 'Automated weight calculation and grade verification prevent price manipulation.' },
              { title: t('home.why3'), desc: 'SMS updates and distance-based travel advisories keep you informed on the move.' },
              { title: t('home.why4'), desc: 'Full native language support in English, हिन्दी, and తెలుగు with high accessibility.' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-navy-800 border border-navy-700 space-y-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <h4 className="font-bold text-sm text-white">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
