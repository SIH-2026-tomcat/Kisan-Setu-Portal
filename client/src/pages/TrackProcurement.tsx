import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { Procurement } from '../types';
import { StatusStepper, StepInfo } from '../components/StatusStepper';
import { DigitalReceiptModal } from '../components/DigitalReceiptModal';
import { formatDualQuantity, fromKilograms } from '../utils/quantity';
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
  FileText,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const TrackProcurement: React.FC = () => {
  const { t } = useTranslation();
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState('');
  const [selectedReceiptProcurement, setSelectedReceiptProcurement] = useState<Procurement | null>(null);

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
    const isRejected = p.inspectionDecision === 'REJECTED' || p.status === 'REJECTED';
    const isArrived = p.status !== 'PENDING_INSPECTION' || (p as any).bookingStatus === 'ARRIVED';
    const isInspected = p.status === 'INSPECTED' || p.status === 'APPROVED' || isRejected;
    const isApproved = p.status === 'APPROVED' && !isRejected;
    const isProcessing = (p.payment?.status === 'PROCESSING' || p.payment?.status === 'PAID') && !isRejected;
    const isPaid = p.payment?.status === 'PAID' && !isRejected;

    if (isRejected) {
      return [
        { label: t('procurement.stepperRegistered'), status: 'completed', timestamp: 'Verified' },
        { label: t('procurement.stepperBooked'), status: 'completed', timestamp: 'Token Issued' },
        { label: t('procurement.stepperArrived'), status: 'completed', timestamp: 'At Centre' },
        {
          label: 'Inspection (Rejected)',
          status: 'rejected',
          timestamp: p.inspectedAt ? new Date(p.inspectedAt).toLocaleTimeString() : 'Rejected',
        },
      ];
    }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-india-green" />
            <h1 className="text-2xl font-bold text-ink">{t('procurement.title')}</h1>
          </div>
          <p className="text-xs text-muted">
            End-to-end transparency from physical weighing to quality inspection & payment initiation
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted bg-paper px-3 py-1.5 rounded border border-line">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-ink" />
          <span>Last sync: {lastRefreshed || 'Syncing...'}</span>
        </div>
      </div>

      {procurements.length > 0 ? (
        <div className="space-y-6">
          {procurements.map((p) => {
            const steps = buildSteps(p);
            const isRejected = p.inspectionDecision === 'REJECTED' || p.status === 'REJECTED';
            const isPartial = p.inspectionDecision === 'PARTIALLY_ACCEPTED';
            const isFull = p.inspectionDecision === 'FULLY_ACCEPTED' || (p.status === 'APPROVED' && !isPartial && !isRejected);

            const expectedKg = p.expectedQuantityKg || (p.expectedQuantity ? p.expectedQuantity * 100 : 0);
            const actualKg = p.actualReceivedQuantityKg ?? expectedKg;
            const acceptedKg = p.acceptedQuantityKg ?? (p.acceptedQuantity ? p.acceptedQuantity * 100 : 0);
            const rejectedKg = p.rejectedQuantityKg ?? Math.max(0, actualKg - acceptedKg);

            return (
              <div
                key={p.id}
                className="bg-white rounded p-6 border border-line shadow-sm space-y-6"
              >
                {/* Header of Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-line pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-green-50 text-india-green px-2 py-0.5 rounded">
                        Token: {p.tokenNumber}
                      </span>
                      <span className="text-xs text-muted font-mono">
                        Ref: {p.bookingReference}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-ink mt-1 flex items-center gap-2">
                      <span>{p.cropType} Procurement</span>
                      {p.centreName && (
                        <span className="text-xs font-normal text-muted">
                          • {p.centreName}
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Decision / Status Badge */}
                  <div className="flex items-center gap-2">
                    {isRejected ? (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 border border-red-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>REJECTED</span>
                      </span>
                    ) : isPartial ? (
                      <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>PARTIALLY ACCEPTED</span>
                      </span>
                    ) : p.status === 'APPROVED' ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>FULLY ACCEPTED</span>
                      </span>
                    ) : (
                      <span className="bg-paper text-ink px-3 py-1 rounded text-xs font-bold border border-line">
                        Status: {p.status.replace('_', ' ')}
                      </span>
                    )}

                    {/* Receipt Button */}
                    {(p.status === 'APPROVED' || isRejected || isPartial || p.inspectedAt) && (
                      <button
                        onClick={() => setSelectedReceiptProcurement(p)}
                        className="bg-india-green hover:bg-green-700 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                        title="View & Print Official Receipt"
                      >
                        <FileText className="w-3.5 h-3.5 text-white" />
                        <span>Receipt</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual Stepper */}
                <div className="bg-paper rounded p-4 border border-line">
                  <StatusStepper steps={steps} />
                </div>

                {/* Rejection / Partial Alert Callout */}
                {(isRejected || isPartial) && p.rejectionReason && (
                  <div className={`p-4 rounded border flex items-start gap-3 text-xs ${
                    isRejected
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    {isRejected ? (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold uppercase tracking-wider text-[11px]">
                        {isRejected ? 'Inspection Rejection Notice' : 'Partial Acceptance Notice'}
                      </div>
                      <p className="font-semibold">
                        Reason: {p.rejectionReason}
                      </p>
                      {p.officerRemarks && (
                        <p className="text-[11px] opacity-85">
                          Officer Remarks: "{p.officerRemarks}"
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed Quantity & Inspection Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Declared & Received */}
                  <div className="p-3 bg-paper rounded border border-line">
                    <span className="text-muted block mb-1">Declared vs Received</span>
                    <span className="font-bold text-ink text-sm block">
                      {p.actualReceivedQuantityKg !== undefined && p.actualReceivedQuantityKg !== null
                        ? fromKilograms(actualKg, 'q').displayString
                        : 'Awaiting Weighing'}
                    </span>
                    <span className="text-[10px] text-muted block mt-0.5">
                      Declared: {formatDualQuantity(expectedKg, p.originalQuantity, p.quantityUnit)}
                    </span>
                  </div>

                  {/* Accepted & Rejected Quantity */}
                  <div className={`p-3 rounded border ${
                    isRejected
                      ? 'bg-red-50 border-red-200'
                      : isPartial
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-paper border-line'
                  }`}>
                    <span className="text-muted block mb-1">Accepted for MSP</span>
                    <span className={`font-black text-sm block ${
                      isRejected ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {isRejected
                        ? '0 kg (Rejected)'
                        : p.acceptedQuantityKg !== undefined && p.acceptedQuantityKg !== null
                        ? fromKilograms(acceptedKg, 'q').displayString
                        : p.acceptedQuantity
                        ? `${p.acceptedQuantity} Q`
                        : 'Pending'}
                    </span>
                    {rejectedKg > 0 && (
                      <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                        Returned: {fromKilograms(rejectedKg, 'q').displayString}
                      </span>
                    )}
                  </div>

                  {/* Quality Grade & Rate */}
                  <div className="p-3 bg-paper rounded border border-line">
                    <span className="text-muted block mb-1">Grade & MSP Rate</span>
                    <span className="font-bold text-ink text-sm flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-india-saffron shrink-0" />
                      <span>{p.qualityGrade || 'Pending Grade'}</span>
                    </span>
                    <span className="text-[10px] text-muted block mt-0.5">
                      {p.ratePerQuintal && p.ratePerQuintal > 0
                        ? `₹${p.ratePerQuintal.toLocaleString('en-IN')} / Q`
                        : isRejected
                        ? 'N/A'
                        : 'MSP Linked'}
                    </span>
                  </div>

                  {/* Total Approved Amount */}
                  <div className={`p-3 rounded border ${
                    isRejected
                      ? 'bg-paper border-line opacity-60'
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <span className="text-green-800 font-bold block mb-1">Total Payout</span>
                    <span className="font-black text-ink text-base block">
                      {isRejected
                        ? '₹0'
                        : p.totalAmount
                        ? `₹${p.totalAmount.toLocaleString('en-IN')}`
                        : 'Calculating...'}
                    </span>
                    <span className="text-[10px] text-green-700 block mt-0.5">
                      {isRejected
                        ? 'Procurement declined'
                        : p.payment
                        ? `Payment: ${p.payment.status}`
                        : 'Pending approval'}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 flex flex-wrap justify-between items-center gap-2 border-t border-line text-xs">
                  <div className="flex items-center gap-1.5 text-muted">
                    <ShieldCheck className="w-4 h-4 text-india-green shrink-0" />
                    <span>State Portal Verified Digital Record</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedReceiptProcurement(p)}
                      className="font-bold text-ink hover:text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>

                    {p.payment && !isRejected && (
                      <Link
                        to="/payment-status"
                        className="font-bold text-india-green hover:text-green-700 flex items-center gap-1"
                      >
                        <span>Direct Bank Deposit ({p.payment.status})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded p-12 text-center space-y-4 border border-line shadow-sm">
          <Layers className="w-12 h-12 text-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No Procurement Records Yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Once you book a slot and check in at the procurement centre, live inspection, weighing metrics, and digital receipts will appear here.
          </p>
          <Link
            to="/book-slot"
            className="inline-flex bg-india-green hover:bg-green-700 text-white text-xs font-bold px-5 py-2.5 rounded shadow"
          >
            Book Procurement Slot
          </Link>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceiptProcurement && (
        <DigitalReceiptModal
          procurement={selectedReceiptProcurement}
          onClose={() => setSelectedReceiptProcurement(null)}
        />
      )}
    </div>
  );
};
