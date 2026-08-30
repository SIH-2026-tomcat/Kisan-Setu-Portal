import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Landmark,
} from 'lucide-react';

export const OfficerPayments: React.FC = () => {
  const { t } = useTranslation();
  const { officer } = useAuth();
  const { showSuccess, showError, showSMS } = useToast();

  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await api.getOfficerQueue();
      if (res.success && res.queue) {
        setQueueItems(res.queue);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('OfficerPayments error:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleUpdateStatus = async (paymentId: string, nextStatus: string, farmerName: string) => {
    setLoading(true);
    try {
      const res = await api.updatePaymentStatus(paymentId, nextStatus);
      if (res.success) {
        showSuccess(
          'Payment Updated',
          `Payment status transitioned to ${nextStatus} for ${farmerName}.`
        );
        fetchPayments();
      } else {
        showError('Update Failed', res.message || 'Error updating payment.');
      }
    } catch {
      showError('Error', 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-navy-900">{t('officer.paymentsDesk')}</h1>
          </div>
          <p className="text-xs text-slate-500">
            {t('officer.paymentsDesc')}
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="flex items-center gap-1.5 text-xs text-navy-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('officer.refreshRecords')}</span>
        </button>
      </div>

      {/* Table of Approved Procurements & Payments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3">
          {t('officer.payoutTxns')}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">{t('officer.token')}</th>
                <th className="px-4 py-3">{t('officer.farmerDetails')}</th>
                <th className="px-4 py-3">{t('officer.produceQty')} & Grade</th>
                <th className="px-4 py-3">Approved Total</th>
                <th className="px-4 py-3">{t('payment.title')}</th>
                <th className="px-4 py-3">{t('payment.txnRef')}</th>
                <th className="px-4 py-3 text-right">{t('officer.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {queueItems
                .filter((item) => item.procurement?.payment)
                .map((item) => {
                  const pay = item.procurement.payment;
                  const isPending = pay.status === 'PENDING';
                  const isProcessing = pay.status === 'PROCESSING';
                  const isPaid = pay.status === 'PAID';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-bold">{item.tokenNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.farmerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          A/C: XXXX 4582
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">
                          {item.cropType} ({item.procurement.acceptedQuantity} Q)
                        </span>
                        <span className="text-[10px] text-amber-600 block">
                          {item.procurement.qualityGrade}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-sm text-slate-900">
                        ₹{pay.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isPaid
                              ? 'bg-emerald-600 text-white'
                              : isProcessing
                              ? 'bg-blue-600 text-white animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pay.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-navy-800 font-semibold">
                        {pay.transactionReference || '—'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {isPending && (
                          <button
                            onClick={() => handleUpdateStatus(pay.id, 'PROCESSING', item.farmerName)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition"
                          >
                            {t('officer.sendToBank')}
                          </button>
                        )}
                        {isProcessing && (
                          <button
                            onClick={() => handleUpdateStatus(pay.id, 'PAID', item.farmerName)}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition"
                          >
                            {t('officer.markPaid')}
                          </button>
                        )}
                        {isPaid && (
                          <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{t('officer.settled')}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
