import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { Procurement } from '../types';
import { StatusStepper, StepInfo } from '../components/StatusStepper';
import {
  Layers,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  RefreshCw,
  Scale,
  Award,
} from 'lucide-react';

export const TrackProcurement: React.FC = () => {
  const { t } = useTranslation();
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchProcurements = async () => {
    try {
      const res = await api.getMyProcurements();
      if (res.success && res.procurements) {
        setProcurements(res.procurements);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('TrackProcurement error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurements();
    const interval = setInterval(fetchProcurements, 4000);
    return () => clearInterval(interval);
  }, []);

  const buildSteps = (p: Procurement): StepInfo[] => {
    const isArrived = p.status !== 'PENDING_INSPECTION' || (p as any).bookingStatus === 'ARRIVED';
    const isInspected = p.status === 'INSPECTED' || p.status === 'APPROVED';
    const isApproved = p.status === 'APPROVED';
    const isProcessing = p.payment?.status === 'PROCESSING' || p.payment?.status === 'PAID';
    const isPaid = p.payment?.status === 'PAID';

    return [
      { label: t('procurement.stepperRegistered'), status: 'completed', timestamp: 'Verified' },
      { label: t('procurement.stepperBooked'), status: 'completed', timestamp: 'Token Issued' },
      {
        label: t('procurement.stepperArrived'),
        status: isArrived ? 'completed' : 'pending',
        timestamp: isArrived ? 'At Centre Counter' : 'Pending Arrival',
      },
      {
        label: t('procurement.stepperInspected'),
        status: isInspected ? 'completed' : isArrived ? 'current' : 'pending',
        timestamp: p.inspectedAt ? new Date(p.inspectedAt).toLocaleTimeString() : undefined,
      },
      {
        label: t('procurement.stepperProcured'),
        status: isApproved ? 'completed' : isInspected ? 'current' : 'pending',
        timestamp: p.approvedAt ? new Date(p.approvedAt).toLocaleTimeString() : undefined,
      },
      {
        label: t('procurement.stepperProcessing'),
        status: isProcessing ? 'completed' : isApproved ? 'current' : 'pending',
        timestamp: p.payment?.processingAt ? 'Bank Processing' : undefined,
      },
      {
        label: t('procurement.stepperPaid'),
        status: isPaid ? 'completed' : isProcessing ? 'current' : 'pending',
        timestamp: p.payment?.paidAt ? 'Deposited' : undefined,
      },
    ];
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-navy-800" />
            <h1 className="text-2xl font-bold text-navy-900">{t('procurement.title')}</h1>
          </div>
          <p className="text-xs text-slate-500">
            End-to-end transparency from weighing to quality inspection & payment initiation
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-navy-800" />
          <span>Last sync: {lastRefreshed || 'Syncing...'}</span>
        </div>
      </div>

      {procurements.length > 0 ? (
        <div className="space-y-6">
          {procurements.map((p) => {
            const steps = buildSteps(p);
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6"
              >
                {/* Header of Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-navy-100 text-navy-800 px-2 py-0.5 rounded">
                        Token: {p.tokenNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Ref: {p.bookingReference}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-navy-900 mt-1">
                      {p.cropType} Procurement
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      p.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'INSPECTED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Status: {p.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Visual 7-Stage Stepper */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <StatusStepper steps={steps} />
                </div>

                {/* Inspection & Pricing Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1">Expected vs Accepted</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {p.acceptedQuantity ? `${p.acceptedQuantity} Q` : 'Pending Weighing'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Initial: {p.expectedQuantity} Q
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1">Quality Assessment</span>
                    <span className="font-bold text-navy-800 text-sm flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{p.qualityGrade || 'Awaiting Inspector'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block">Moisture & Purity</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1">Procurement Rate / Q</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {p.ratePerQuintal ? `₹${p.ratePerQuintal.toLocaleString('en-IN')}` : 'MSP Linked'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">APMC Verified Rate</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-800 font-bold block mb-1">Total Approved Amount</span>
                    <span className="font-black text-emerald-900 text-base">
                      {p.totalAmount ? `₹${p.totalAmount.toLocaleString('en-IN')}` : 'Calculating...'}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      {p.payment ? `Payment: ${p.payment.status}` : 'Pending approval'}
                    </span>
                  </div>
                </div>

                {/* Footer Link to Payment Tracker */}
                {p.payment && (
                  <div className="pt-2 flex justify-end">
                    <Link
                      to="/payment-status"
                      className="text-xs font-bold text-navy-800 hover:underline flex items-center gap-1"
                    >
                      <span>View Direct Bank Deposit Status ({p.payment.status})</span>
                      <CreditCard className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center space-y-4 border border-slate-200 shadow-sm">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Procurement Records Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you book a slot and check in at the procurement centre, live inspection and weighing metrics will appear here.
          </p>
          <Link
            to="/book-slot"
            className="inline-flex bg-navy-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow"
          >
            Book Procurement Slot
          </Link>
        </div>
      )}
    </div>
  );
};
