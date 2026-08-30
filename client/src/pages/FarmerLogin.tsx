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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl border border-line overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Photography Banner */}
        <div className="relative h-48 md:h-auto bg-india-green_deep">
          <img
            src="/images/farmer_login_side.jpg"
            alt="Indian Farmer in field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-india-green_deep/90 via-india-green_deep/30 to-black/30 flex flex-col justify-end p-6 text-white space-y-1">
            <span className="text-[10px] bg-india-saffron text-white font-bold px-2 py-0.5 rounded w-fit uppercase tracking-wider">
              Smart MSP Portal
            </span>
            <h3 className="text-xl font-bold tracking-tight">Kisan Setu Portal</h3>
            <p className="text-xs text-green-100 opacity-90 leading-tight">
              Direct and transparent digital procurement system for farmers.
            </p>
          </div>
        </div>

        {/* Right Side: Form Content */}
        <div className="p-6 sm:p-8 space-y-6 flex flex-col justify-center bg-white">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-2.5 rounded-full bg-green-50 text-india-green border border-line">
              <Wheat className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-ink">{t('auth.farmerLoginTitle', 'Farmer Login')}</h2>
            <p className="text-xs text-muted">
              Secure OTP-based authentication for farmers and producers
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Demo Fast Login Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">⚡ SIH Demo OTP Bypass</span>
              <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                1-CLICK
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Skip typing. Quick access as Demo Farmer: **Ramesh Kumar**.
            </p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full bg-india-saffron hover:bg-india-saffron_hover text-white text-xs font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <UserCheck className="w-4 h-4" />
              <span>{t('auth.quickDemoLogin', '1-Click Demo Login')}</span>
            </button>
          </div>

          {/* OTP Form */}
          {!otpSent ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                  {t('auth.enterMobile', 'Mobile Number')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Phone className="w-4 h-4" />
                    <span className="ml-1 text-xs font-semibold text-muted border-r border-line pr-2">
                      +91
                    </span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-16 pr-3.5 py-2.5 bg-paper border border-line rounded-xl text-sm font-semibold focus:bg-white focus:border-india-green transition focus:outline-none"
                    required
                  />
                </div>
                <span className="text-[11px] text-muted block">
                  {t('auth.demoOtpNotice', 'A demo OTP (123456) will be generated for testing.')}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || mobileNumber.length < 10}
                className="w-full bg-india-green hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm shadow transition flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>{loading ? 'Sending OTP...' : t('auth.sendOtp', 'Send OTP')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="bg-green-50 border border-line rounded-xl p-2.5 text-xs text-india-green flex items-center justify-between font-medium">
                <span>{t('auth.otpSentMsg', 'Demo OTP Sent:')}</span>
                <span className="font-bold font-mono bg-white px-2 py-0.5 rounded border border-line">123456</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                  {t('auth.enterOtp', 'Enter 6-digit OTP')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-paper border border-line rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:bg-white focus:border-india-green transition focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-india-green hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm shadow transition flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Verifying...' : t('auth.loginSecurely', 'Verify & Login')}</span>
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs text-muted hover:text-india-green hover:underline py-1"
              >
                Change Mobile Number
              </button>
            </form>
          )}

          {/* Footer Link */}
          <div className="pt-4 border-t border-line text-center space-y-2">
            <Link
              to="/register"
              className="text-xs font-bold text-india-green hover:underline block"
            >
              {t('auth.notRegistered', 'New Farmer? Register Profile')}
            </Link>
            <Link
              to="/officer/login"
              className="text-[11px] text-muted hover:text-ink block font-medium"
            >
              Procurement Officer Portal Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
