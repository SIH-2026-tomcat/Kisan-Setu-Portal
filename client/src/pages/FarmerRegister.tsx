import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { ProcurementCentre } from '../types';
import {
  User,
  Phone,
  CreditCard,
  MapPin,
  Building,
  Globe,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Wheat,
} from 'lucide-react';

export const FarmerRegister: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { loginFarmer } = useAuth();
  const { showSMS, showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    aadhaarNumber: '',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    village: '',
    centreId: '',
    preferredLanguage: i18n.language || 'en',
    consent: false,
  });

  useEffect(() => {
    // Fetch available procurement centres
    api.getCentres().then((res) => {
      if (res.success && res.centres) {
        setCentres(res.centres);
        if (res.centres.length > 0) {
          setFormData((prev) => ({ ...prev, centreId: res.centres[0].id }));
        }
      }
    });
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const validateCurrentStep = (): boolean => {
    if (step === 1) {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
        setErrorMsg('Please enter your full name as per identity documents.');
        return false;
      }
      if (!/^[6-9][0-9]{9}$/.test(formData.mobileNumber.trim())) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return false;
      }
      if (!/^[0-9]{12}$/.test(formData.aadhaarNumber.trim())) {
        setErrorMsg('Please enter a valid 12-digit numeric Aadhaar number.');
        return false;
      }
    }

    if (step === 2) {
      if (!formData.village.trim()) {
        setErrorMsg('Please enter your Village / Mandal name.');
        return false;
      }
    }

    if (step === 5) {
      if (!formData.consent) {
        setErrorMsg('Please accept the declaration to proceed.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.registerFarmer(formData);
      if (res.success && res.token && res.farmer) {
        loginFarmer(res.token, res.farmer);
        showSMS(
          `Welcome to Kisan Setu, ${res.farmer.fullName}! Your registration is complete. Demo OTP: 123456.`,
          res.farmer.mobileNumber
        );
        showSuccess('Registration Complete', 'Your farmer account is active and ready.');
        navigate('/dashboard');
      } else {
        setErrorMsg(res.message || 'Registration failed. Please check your details.');
        showError('Registration Failed', res.message || 'Error occurred.');
      }
    } catch {
      setErrorMsg('Failed to connect to the registration server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-2.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
            <Wheat className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900">{t('register.title')}</h2>
          <p className="text-xs text-slate-500">
            One-time registration for seamless slot booking and queue priority
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === s
                    ? 'bg-navy-800 text-white ring-4 ring-navy-100'
                    : step > s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}
              >
                {s}
              </div>
              {s < 5 && (
                <div
                  className={`w-6 sm:w-12 h-1 mx-1 rounded ${
                    step > s ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-navy-800" />
                <span>{t('register.step1')}</span>
              </h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('register.fullName')} *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-navy-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('register.mobileNumber')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span className="ml-1 text-xs font-semibold text-slate-500 border-r border-slate-300 pr-2">
                      +91
                    </span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.mobileNumber}
                    onChange={(e) => handleChange('mobileNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-16 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-navy-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('register.aadhaarNumber')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={12}
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleChange('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder="123456789012 (12 digits)"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:border-navy-800"
                    required
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('register.aadhaarNotice')}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location Details */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-navy-800" />
                <span>{t('register.step2')}</span>
              </h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">{t('register.state')} *</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">{t('register.district')} *</label>
                <select
                  value={formData.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                >
                  <option value="Guntur">Guntur</option>
                  <option value="Krishna">Krishna</option>
                  <option value="NTR District">NTR District</option>
                  <option value="Prakasam">Prakasam</option>
                  <option value="Bapatla">Bapatla</option>
                  <option value="Palnadu">Palnadu</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">{t('register.village')} *</label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => handleChange('village', e.target.value)}
                  placeholder="e.g. Guntur Rural / Chebrolu"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 3: Procurement Centre */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-navy-800" />
                <span>{t('register.step3')}</span>
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('register.preferredCentre')}
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {centres.map((c) => (
                    <label
                      key={c.id}
                      className={`block p-3 rounded-xl border-2 cursor-pointer transition ${
                        formData.centreId === c.id
                          ? 'border-navy-800 bg-navy-50 text-navy-900 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{c.name}</span>
                        <input
                          type="radio"
                          name="centreId"
                          value={c.id}
                          checked={formData.centreId === c.id}
                          onChange={(e) => handleChange('centreId', e.target.value)}
                          className="text-navy-800 focus:ring-navy-800"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{c.address}</p>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preferred Language */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-navy-800" />
                <span>{t('register.step4')}</span>
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { code: 'en', label: 'English', icon: '🌾' },
                  { code: 'hi', label: 'हिन्दी', icon: '🇮🇳' },
                  { code: 'te', label: 'తెలుగు', icon: '🌱' },
                ].map((l) => (
                  <button
                    type="button"
                    key={l.code}
                    onClick={() => {
                      handleChange('preferredLanguage', l.code);
                      i18n.changeLanguage(l.code);
                    }}
                    className={`p-3 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-1 ${
                      formData.preferredLanguage === l.code
                        ? 'border-navy-800 bg-navy-50 font-bold text-navy-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{l.icon}</span>
                    <span className="text-sm">{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Consent */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-navy-800" />
                <span>{t('register.step5')}</span>
              </h3>

              {/* Summary Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-800">{formData.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Mobile Number:</span>
                  <span className="font-bold text-slate-800">+91-{formData.mobileNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Aadhaar (Masked):</span>
                  <span className="font-bold text-slate-800 font-mono">
                    XXXX XXXX {formData.aadhaarNumber.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Village / District:</span>
                  <span className="font-bold text-slate-800">
                    {formData.village}, {formData.district}
                  </span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer bg-navy-50/60 p-3 rounded-xl border border-navy-100">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) => handleChange('consent', e.target.checked)}
                  className="mt-0.5 rounded text-navy-800 focus:ring-navy-800"
                  required
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  {t('register.declaration')}
                </span>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('register.back')}</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="ml-auto px-6 py-2.5 bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
              >
                <span>{t('register.next')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !formData.consent}
                className="ml-auto px-6 py-2.5 bg-agri-700 hover:bg-agri-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Registering...' : t('register.submit')}</span>
              </button>
            )}
          </div>
        </form>

        <div className="pt-2 text-center">
          <Link to="/login" className="text-xs font-medium text-navy-800 hover:underline">
            Already registered? Login with OTP here
          </Link>
        </div>
      </div>
    </div>
  );
};
