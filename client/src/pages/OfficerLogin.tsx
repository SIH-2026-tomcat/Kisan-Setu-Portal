import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle, Wheat } from 'lucide-react';

export const OfficerLogin: React.FC = () => {
  const { t } = useTranslation();
  const { loginOfficer } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('guntur_officer');
  const [password, setPassword] = useState('Kisan@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.officerLogin({ username, password });
      if (res.success && res.token && res.officer) {
        loginOfficer(res.token, res.officer);
        showSuccess('Officer Authentication', `Welcome, ${res.officer.fullName}!`);
        navigate('/officer/dashboard');
      } else {
        setErrorMsg(res.message || 'Invalid officer credentials.');
        showError('Login Failed', res.message || 'Authentication error.');
      }
    } catch {
      setErrorMsg('Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-8 h-8 text-amber-700" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900">{t('auth.officerLoginTitle')}</h2>
          <p className="text-xs text-slate-500">
            Authorized portal for APMC Officers, Quality Inspectors, and Superintendents
          </p>
        </div>

        {/* Demo Credentials Notice */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <span>🛡️ Pre-Configured Demo Credentials</span>
          </div>
          <p className="text-slate-600 text-[11px]">
            Username: <code className="font-bold text-navy-800">guntur_officer</code> | Password:{' '}
            <code className="font-bold text-navy-800">Kisan@123</code>
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('auth.username')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="guntur_officer"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-navy-800 transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('auth.password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-navy-800 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-800 hover:bg-navy-900 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm shadow transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : t('auth.loginOfficer')}</span>
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <Link to="/login" className="text-xs text-slate-600 hover:text-navy-800 underline">
            Switch to Farmer Portal Login
          </Link>
        </div>
      </div>
    </div>
  );
};
