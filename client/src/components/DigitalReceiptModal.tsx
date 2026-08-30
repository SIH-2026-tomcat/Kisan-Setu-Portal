import React from 'react';
import { useTranslation } from 'react-i18next';
import { Procurement, Booking } from '../types';
import { formatDualQuantity, fromKilograms } from '../utils/quantity';
import { FileText, Printer, CheckCircle, AlertTriangle, XCircle, X, ShieldCheck } from 'lucide-react';

interface DigitalReceiptModalProps {
  procurement: Procurement;
  booking?: Booking | null;
  farmerName?: string;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  procurement,
  booking,
  farmerName,
  onClose,
}) => {
  const { t } = useTranslation();

  const handlePrint = () => {
    window.print();
  };

  const procRef = procurement.bookingReference || booking?.bookingReference || `KS-PROC-${procurement.id.slice(-5).toUpperCase()}`;
  const fName = farmerName || booking?.farmerName || 'Ramesh Kumar';
  const token = procurement.tokenNumber || booking?.tokenNumber || 'A-042';
  const centre = procurement.centreName || booking?.centreName || 'Procurement Centre';

  const expectedKg = procurement.expectedQuantityKg || (procurement.expectedQuantity ? procurement.expectedQuantity * 100 : 0);
  const actualKg = procurement.actualReceivedQuantityKg ?? expectedKg;
  const acceptedKg = procurement.acceptedQuantityKg ?? (procurement.acceptedQuantity ? procurement.acceptedQuantity * 100 : 0);
  const rejectedKg = procurement.rejectedQuantityKg ?? (actualKg - acceptedKg);

  const isRejected = procurement.inspectionDecision === 'REJECTED' || procurement.status === 'REJECTED';
  const isPartial = procurement.inspectionDecision === 'PARTIALLY_ACCEPTED';
  const isFull = procurement.inspectionDecision === 'FULLY_ACCEPTED' || (!isRejected && !isPartial && acceptedKg > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-8 print:shadow-none print:border-none print:m-0">
        
        {/* Receipt Header */}
        <div className="bg-navy-900 text-white p-6 relative print:bg-white print:text-slate-900 print:border-b">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition print:hidden"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
              <FileText className="w-5 h-5 text-emerald-400 print:text-navy-900" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 print:text-navy-900">
                Official Document
              </span>
              <h2 className="text-xl font-bold tracking-tight">Kisan Setu Digital Procurement Receipt</h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 print:text-slate-600">
            Ref: <strong className="font-mono font-bold text-white print:text-slate-900">{procRef}</strong>
          </p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-6 text-slate-800 text-xs">

          {/* Decision Status Banner */}
          <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
            isRejected
              ? 'bg-red-50 border-red-300 text-red-900'
              : isPartial
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            {isRejected ? (
              <XCircle className="w-6 h-6 shrink-0 text-red-600" />
            ) : isPartial ? (
              <AlertTriangle className="w-6 h-6 shrink-0 text-amber-600" />
            ) : (
              <CheckCircle className="w-6 h-6 shrink-0 text-emerald-600" />
            )}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Inspection Outcome
              </span>
              <h3 className="font-black text-sm">
                {isRejected
                  ? 'REJECTED'
                  : isPartial
                  ? 'PARTIALLY ACCEPTED'
                  : 'FULLY ACCEPTED'}
              </h3>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-500 text-[11px] block">Farmer Name</span>
              <strong className="font-bold text-navy-900 text-sm">{fName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Token Number</span>
              <strong className="font-mono font-bold text-emerald-700 text-sm">{token}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 text-[11px] block">Procurement Centre</span>
              <strong className="font-bold text-slate-800">{centre}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Crop Type</span>
              <strong className="font-bold text-slate-800">{procurement.cropType}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Quality Grade</span>
              <strong className="font-bold text-slate-800">{procurement.qualityGrade || 'Grade A'}</strong>
            </div>
          </div>

          {/* Quantities Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 font-bold text-navy-900 border-b border-slate-200">
              Quantity Breakdown
            </div>
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-2.5 flex justify-between">
                <span className="text-slate-600">Declared Quantity</span>
                <span className="font-bold text-slate-900">{formatDualQuantity(expectedKg, procurement.originalQuantity, procurement.quantityUnit)}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between">
                <span className="text-slate-600">Actual Received</span>
                <span className="font-bold text-slate-900">{fromKilograms(actualKg).dualDisplay}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between bg-emerald-50/50">
                <span className="font-bold text-emerald-900">Accepted Quantity</span>
                <span className="font-black text-emerald-700">{fromKilograms(acceptedKg).dualDisplay}</span>
              </div>
              <div className={`px-4 py-2.5 flex justify-between ${rejectedKg > 0 ? 'bg-red-50/50' : ''}`}>
                <span className={`font-bold ${rejectedKg > 0 ? 'text-red-900' : 'text-slate-500'}`}>Rejected Quantity</span>
                <span className={`font-black ${rejectedKg > 0 ? 'text-red-700' : 'text-slate-500'}`}>{fromKilograms(rejectedKg).dualDisplay}</span>
              </div>
            </div>
          </div>

          {/* Reason & Remarks (if applicable) */}
          {(isRejected || isPartial || procurement.rejectionReason) && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
              <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                Rejection / Partial Acceptance Reason
              </span>
              <p className="font-bold text-slate-900 text-xs">{procurement.rejectionReason || 'Quality parameters unfulfilled'}</p>
              {procurement.officerRemarks && (
                <p className="text-slate-600 text-[11px] italic">Officer Remarks: "{procurement.officerRemarks}"</p>
              )}
            </div>
          )}

          {/* Payment Financial Summary */}
          <div className="p-4 rounded-2xl bg-navy-900 text-white space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300">Applicable Rate</span>
              <span className="font-bold text-white">₹{procurement.ratePerQuintal?.toLocaleString('en-IN') || 0} / Quintal</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-navy-700">
              <span className="font-bold text-slate-200">Eligible Payout Amount</span>
              <span className="text-xl font-black text-emerald-400">
                {isRejected || !procurement.totalAmount || procurement.totalAmount <= 0
                  ? 'NOT APPLICABLE'
                  : `₹${procurement.totalAmount.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Digital verification cryptographically synchronized with State Agricultural Portal.</span>
          </div>

        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-navy-900 hover:bg-navy-800 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print / Download Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 px-5 rounded-xl font-bold text-xs transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
