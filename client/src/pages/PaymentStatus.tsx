import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { Payment } from '../types';
import {
  CreditCard,
  CheckCircle,
  Clock,
  Building,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Landmark,
  FileCheck,
} from 'lucide-react';

export const PaymentStatus: React.FC = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await api.getMyPayments();
      if (res.success && res.payments) {
        setPayments(res.payments);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('PaymentStatus error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-navy-900">{t('payment.title')}</h1>
          </div>
          <p className="text-xs text-slate-500">
            Real-time direct bank deposit status via PFMS & Government Direct Benefit Transfer
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-navy-800" />
          <span>Last sync: {lastRefreshed || 'Syncing...'}</span>
        </div>
      </div>

      {/* Linked Account Summary Banner */}
      <div className="bg-navy-800 text-white rounded-2xl p-6 shadow-md border border-navy-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-300">Primary Bank Account (Aadhaar Seeded)</span>
            <div className="text-xl font-mono font-bold">State Bank of India — XXXX XXXX 4582</div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct Benefit Transfer (DBT) Active</span>
            </span>
          </div>
        </div>

        <div className="bg-navy-900/80 px-4 py-2 rounded-xl border border-navy-700 text-right">
          <span className="text-[11px] text-slate-400 block">Total Payments Received</span>
          <span className="text-lg font-black text-amber-300">
            ₹
            {payments
              .filter((p) => p.status === 'PAID')
              .reduce((sum, p) => sum + p.amount, 0)
              .toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Payments List */}
      {payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((pay) => {
            const isPaid = pay.status === 'PAID';
            const isProcessing = pay.status === 'PROCESSING';

            return (
              <div
                key={pay.id}
                className={`bg-white rounded-2xl p-6 border-2 shadow-sm space-y-4 transition ${
                  isPaid
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : isProcessing
                    ? 'border-blue-400 bg-blue-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Ref: {pay.bookingReference}
                    </span>
                    <h3 className="text-base font-bold text-navy-900">
                      {pay.cropType} Procurement Payment
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      isPaid
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isProcessing
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isPaid
                      ? t('payment.statusPaid')
                      : isProcessing
                      ? t('payment.statusProcessing')
                      : t('payment.statusPending')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1">Accepted Quantity</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {pay.acceptedQuantity ? `${pay.acceptedQuantity} Quintals` : '—'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1">Rate Per Quintal</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {pay.ratePerQuintal ? `₹${pay.ratePerQuintal.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1">Transaction Ref</span>
                    <span className="font-mono font-bold text-navy-800 text-xs block truncate">
                      {pay.transactionReference || 'In Progress...'}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-800 font-bold block mb-1">Total Amount</span>
                    <span className="font-black text-emerald-900 text-base">
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {isPaid && pay.paidAt && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Transferred directly to Bank Account ending in 4582.</span>
                    </span>
                    <span className="font-medium">
                      Date: {new Date(pay.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center space-y-3 border border-slate-200 shadow-sm">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Payment Records Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Payments will appear automatically once your produce is weighed and approved by the procurement officer.
          </p>
        </div>
      )}

      {/* Demo Disclaimer */}
      <div className="text-[11px] text-slate-500 text-center bg-slate-100 p-3 rounded-xl border border-slate-200">
        {t('payment.demoDisclaimer')} Real bank transfers integrate with PFMS (Public Financial Management System) and NPCI Direct Benefit Transfer in production.
      </div>
    </div>
  );
};
