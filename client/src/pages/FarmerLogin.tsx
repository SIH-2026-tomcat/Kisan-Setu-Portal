import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Phone, KeyRound, ShieldCheck, ArrowRight, UserCheck, AlertCircle, Wheat } from 'lucide-react';

export const FarmerLogin: React.FC = () => {
  const { t } = useTranslation();
  const { loginFarmer } = useAuth();
  const { showSMS, showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const redirectPath = (location.state as any)?.from?.pathname || '/dashboard';

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!/^[6-9][0-9]{9}$/.test(mobileNumber.trim())) {
      setErrorMessage('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.requestOTP(mobileNumber.trim());
      if (res.success) {
        setOtpSent(true);
        showSMS(`Kisan Setu: Your login OTP is 123456. Valid for 10 minutes.`, mobileNumber);
        showSuccess('OTP Sent', 'Demo OTP 123456 has been generated.');
      } else {
        setErrorMessage(res.message || 'Could not send OTP.');
      }
    } catch {
      setErrorMessage('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOTP(mobileNumber.trim(), otp.trim());
      if (res.success && res.token && res.farmer) {
        loginFarmer(res.token, res.farmer);
        showSuccess('Login Successful', `Welcome back, ${res.farmer.fullName}!`);
        navigate(redirectPath);
      } else {
        setErrorMessage(res.message || 'Invalid OTP entered.');
        showError('Login Failed', res.message || 'Invalid OTP.');
      }
    } catch {
      setErrorMessage('Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Login for Ramesh Kumar
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.verifyOTP('9876543210', '123456');
      if (res.success && res.token && res.farmer) {
        loginFarmer(res.token, res.farmer);
        showSuccess('Demo Login', 'Logged in as Demo Farmer: Ramesh Kumar.');
        navigate('/dashboard');
      } else {
        setErrorMessage(res.message || 'Demo farmer login failed.');
      }
    } catch {
      setErrorMessage('Error connecting to demo service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
            <Wheat className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900">{t('auth.farmerLoginTitle')}</h2>
          <p className="text-xs text-slate-500">
            Secure OTP-based authentication for farmers and producers
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Fast Login Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900">⚡ Smart India Hackathon Demo</span>
            <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
              1-CLICK
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-tight">
            Use predefined demo farmer profile (Ramesh Kumar, Paddy 25 Q, Token A-042).
          </p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg transition shadow flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('auth.quickDemoLogin')}</span>
          </button>
        </div>

        {/* OTP Form */}
        {!otpSent ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('auth.enterMobile')}
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
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full pl-16 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-navy-800 transition"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 block">
                {t('auth.demoOtpNotice')} (Works for any 10-digit number)
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || mobileNumber.length < 10}
              className="w-full bg-navy-800 hover:bg-navy-900 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm shadow transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending OTP...' : t('auth.sendOtp')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 flex items-center justify-between">
              <span>{t('auth.otpSentMsg')}</span>
              <span className="font-bold font-mono">123456</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('auth.enterOtp')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:bg-white focus:border-navy-800 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-agri-700 hover:bg-agri-800 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm shadow transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : t('auth.loginSecurely')}</span>
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-navy-800 underline py-1"
            >
              Change Mobile Number
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <Link
            to="/register"
            className="text-xs font-semibold text-navy-800 hover:underline block"
          >
            {t('auth.notRegistered')}
          </Link>
          <Link
            to="/officer/login"
            className="text-[11px] text-slate-400 hover:text-slate-600 block"
          >
            Procurement Officer Portal Login →
          </Link>
        </div>
      </div>
    </div>
  );
};
