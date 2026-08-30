import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { fromKilograms } from '../utils/quantity';
import {
  Layers,
  Scale,
  Award,
  CheckCircle,
  AlertCircle,
  XCircle,
  AlertTriangle,
  User,
  Package,
  CreditCard,
  Info,
} from 'lucide-react';

type InspectionDecision = 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';
type UnitType = 'q' | 'kg';

const REJECTION_REASONS = [
  'High Moisture Content',
  'Excessive Mud / Soil / Stones',
  'Fungal Infection / Mould',
  'Insect Infestation / Pest Damage',
  'Below MSP Quality Standard',
  'Wrong Crop Variety',
  'Adulteration Detected',
  'Other',
];

export const OfficerProcurement: React.FC = () => {
  const { t } = useTranslation();
  const { officer } = useAuth();
  const { showSuccess, showError, showSMS } = useToast();

  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Inspection Fields
  const [actualReceivedQty, setActualReceivedQty] = useState('');
  const [actualReceivedUnit, setActualReceivedUnit] = useState<UnitType>('q');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [inspectionDecision, setInspectionDecision] = useState<InspectionDecision>('FULLY_ACCEPTED');
  const [acceptedQty, setAcceptedQty] = useState('');
  const [acceptedUnit, setAcceptedUnit] = useState<UnitType>('q');
  const [rejectionReason, setRejectionReason] = useState('');
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [ratePerQuintal, setRatePerQuintal] = useState('2300');

  const fetchItems = async () => {
    try {
      const res = await api.getOfficerQueue();
      if (res.success && res.queue) {
        setQueueItems(res.queue);
        if (!selectedItem && res.queue.length > 0) {
          const pending = res.queue.find((q: any) => q.procurement?.status === 'PENDING_INSPECTION');
          handleSelect(pending || res.queue[0]);
        }
      }
    } catch (err) {
      console.error('OfficerProcurement fetch error:', err);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (item: any) => {
    setSelectedItem(item);
    // Pre-fill from existing procurement if it exists
    const proc = item?.procurement;
    if (proc?.actualReceivedQuantityKg) {
      const q = Math.round((proc.actualReceivedQuantityKg / 100) * 100) / 100;
      setActualReceivedQty(String(q));
      setActualReceivedUnit('q');
    } else {
      // Use declared quantity as starting point
      const declared = item?.expectedQuantity;
      setActualReceivedQty(declared ? String(declared) : '');
      setActualReceivedUnit(item?.quantityUnit === 'kg' ? 'kg' : 'q');
    }
    if (proc?.inspectionDecision) setInspectionDecision(proc.inspectionDecision);
    else setInspectionDecision('FULLY_ACCEPTED');

    if (proc?.acceptedQuantity) setAcceptedQty(String(proc.acceptedQuantity));
    else setAcceptedQty('');
    setAcceptedUnit('q');

    if (proc?.rejectionReason) setRejectionReason(proc.rejectionReason);
    else setRejectionReason('');

    if (proc?.officerRemarks) setOfficerRemarks(proc.officerRemarks);
    else setOfficerRemarks('');

    if (proc?.ratePerQuintal) setRatePerQuintal(String(proc.ratePerQuintal));
    else setRatePerQuintal('2300');

    if (proc?.qualityGrade) setQualityGrade(proc.qualityGrade);
    else setQualityGrade('Grade A');
  };

  // Derived computations for live preview (display only, backend recalculates)
  const receivedKg =
    parseFloat(actualReceivedQty) > 0
      ? actualReceivedUnit === 'q'
        ? parseFloat(actualReceivedQty) * 100
        : parseFloat(actualReceivedQty)
      : 0;

  const acceptedKg =
    inspectionDecision === 'FULLY_ACCEPTED'
      ? receivedKg
      : parseFloat(acceptedQty) > 0
      ? acceptedUnit === 'q'
        ? parseFloat(acceptedQty) * 100
        : parseFloat(acceptedQty)
      : 0;

  const rejectedKg = Math.max(0, receivedKg - acceptedKg);
  const acceptedQ = Math.round((acceptedKg / 100) * 100) / 100;
  const estimatedTotal = inspectionDecision !== 'REJECTED' && acceptedQ > 0 && parseFloat(ratePerQuintal) > 0
    ? Math.round(acceptedQ * parseFloat(ratePerQuintal) * 100) / 100
    : 0;

  const needsReason = inspectionDecision === 'PARTIALLY_ACCEPTED' || inspectionDecision === 'REJECTED';
  const needsRemarks = needsReason && rejectionReason === 'Other';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.procurement?.id) {
      showError('Error', 'No procurement record associated with this booking.');
      return;
    }

    // Frontend pre-validation
    const receivedVal = parseFloat(actualReceivedQty);
    if (isNaN(receivedVal) || receivedVal <= 0) {
      showError('Validation', 'Actual received quantity must be greater than 0.');
      return;
    }

    if (needsReason && !rejectionReason) {
      showError('Validation', 'A reason is required for partial acceptance or rejection.');
      return;
    }

    if (needsRemarks && !officerRemarks.trim()) {
      showError('Validation', 'Additional remarks are required when reason is "Other".');
      return;
    }

    if (inspectionDecision === 'PARTIALLY_ACCEPTED') {
      const accVal = parseFloat(acceptedQty);
      if (isNaN(accVal) || accVal <= 0) {
        showError('Validation', 'Accepted quantity must be greater than 0 for partial acceptance.');
        return;
      }
    }

    if (inspectionDecision !== 'REJECTED') {
      const rate = parseFloat(ratePerQuintal);
      if (isNaN(rate) || rate <= 0) {
        showError('Validation', 'Rate per Quintal must be greater than 0.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        actualReceivedQuantity: receivedVal,
        actualReceivedUnit,
        qualityGrade,
        inspectionDecision,
        rejectionReason: needsReason ? rejectionReason : undefined,
        officerRemarks: officerRemarks || undefined,
        ratePerQuintal: inspectionDecision !== 'REJECTED' ? parseFloat(ratePerQuintal) : 0,
      };

      if (inspectionDecision === 'PARTIALLY_ACCEPTED') {
        payload.acceptedQuantity = parseFloat(acceptedQty);
        payload.acceptedUnit = acceptedUnit;
      }

      const res = await api.processProcurement(selectedItem.procurement.id, payload);

      if (res.success) {
        const proc = res.procurement || {};
        const totalAmt = proc.totalAmount || estimatedTotal;

        if (inspectionDecision === 'REJECTED') {
          showSuccess('Produce Rejected', `${selectedItem.cropType} rejected. Reason: ${rejectionReason}.`);
          showSMS(
            `Kisan Setu: Your ${selectedItem.cropType} could not be procured. Reason: ${rejectionReason}. Please visit the centre for details.`,
            selectedItem.mobileNumber
          );
        } else if (inspectionDecision === 'PARTIALLY_ACCEPTED') {
          showSuccess(
            'Partial Acceptance',
            `${selectedItem.cropType}: ${fromKilograms(acceptedKg, 'q').displayString} accepted @ ₹${ratePerQuintal}/Q. Total: ₹${totalAmt.toLocaleString('en-IN')}`
          );
          showSMS(
            `Kisan Setu: Partial procurement approved! ${selectedItem.cropType}: ${fromKilograms(acceptedKg, 'q').dualDisplay} accepted. Total: ₹${totalAmt.toLocaleString('en-IN')}. Payment initiated.`,
            selectedItem.mobileNumber
          );
        } else {
          showSuccess(
            'Procurement Approved',
            `${selectedItem.cropType} fully accepted. Total: ₹${totalAmt.toLocaleString('en-IN')}`
          );
          showSMS(
            `Kisan Setu: Produce approved! ${selectedItem.cropType}: ${fromKilograms(receivedKg, 'q').dualDisplay} @ ₹${ratePerQuintal}/Q. Total: ₹${totalAmt.toLocaleString('en-IN')}. Payment initiated.`,
            selectedItem.mobileNumber
          );
        }
        fetchItems();
      } else {
        showError('Inspection Failed', res.message || 'Error processing inspection.');
      }
    } catch {
      showError('Server Error', 'Could not communicate with procurement server.');
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyProcessed =
    selectedItem?.procurement?.status === 'APPROVED' ||
    selectedItem?.procurement?.status === 'REJECTED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-navy-800" />
          <h1 className="text-2xl font-bold text-navy-900">{t('officer.inspectionTitle')}</h1>
        </div>
        <p className="text-xs text-slate-500">
          {t('officer.inspectionDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Farmers Queue List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2">
            {t('officer.queueList')}
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {queueItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const status = item.procurement?.status;
              const isApproved = status === 'APPROVED';
              const isRejected = status === 'REJECTED';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition space-y-1.5 ${
                    isSelected
                      ? 'border-navy-800 bg-navy-50 shadow-sm'
                      : isApproved
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : isRejected
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-navy-800 text-white px-2 py-0.5 rounded">
                      {item.tokenNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {status?.replace('_', ' ') || 'Pending'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{item.farmerName}</h4>
                  <p className="text-[11px] text-slate-600">
                    {item.cropType} — {item.expectedQuantity} {item.quantityUnit === 'kg' ? 'kg' : 'Q'} • {item.timeSlot}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Inspection Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          {selectedItem ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Farmer Info Header */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-navy-800 text-white px-2.5 py-0.5 rounded">
                      {t('officer.token')}: {selectedItem.tokenNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Aadhaar: {selectedItem.aadhaarMasked}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 mt-1">
                    {selectedItem.farmerName} (+91-{selectedItem.mobileNumber})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('booking.cropType')}: <strong>{selectedItem.cropType}</strong> | Declared:{' '}
                    <strong>
                      {selectedItem.expectedQuantity} {selectedItem.quantityUnit === 'kg' ? 'kg' : 'Quintals'}
                    </strong>
                    {selectedItem.dualQuantityDisplay && (
                      <span className="text-slate-400 ml-1">({selectedItem.dualQuantityDisplay})</span>
                    )}
                  </p>
                </div>

                {isAlreadyProcessed && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                    selectedItem.procurement?.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedItem.procurement?.status === 'APPROVED' ? (
                      <><CheckCircle className="w-4 h-4" /><span>Approved</span></>
                    ) : (
                      <><XCircle className="w-4 h-4" /><span>Rejected</span></>
                    )}
                  </span>
                )}
              </div>

              {/* Already Processed Notice */}
              {isAlreadyProcessed && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-800">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    This procurement has already been <strong>{selectedItem.procurement?.status?.toLowerCase()}</strong>.
                    The form is shown for reference only.
                  </span>
                </div>
              )}

              {/* === SECTION 1: Weighing & Measurement === */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-navy-800" />
                  <span>{t('officer.weighingAssessment')} — Physical Weighing at Centre</span>
                </h4>

                {/* Actual Received Quantity */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Actual Received Quantity (at weighing scale) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={actualReceivedQty}
                      onChange={(e) => setActualReceivedQty(e.target.value)}
                      placeholder="e.g. 24.6"
                      disabled={isAlreadyProcessed}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:bg-white focus:border-navy-800 disabled:bg-slate-100 disabled:text-slate-500"
                      required
                    />
                    {/* Unit selector */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActualReceivedUnit('q')}
                        disabled={isAlreadyProcessed}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                          actualReceivedUnit === 'q' ? 'bg-navy-800 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Q
                      </button>
                      <button
                        type="button"
                        onClick={() => setActualReceivedUnit('kg')}
                        disabled={isAlreadyProcessed}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                          actualReceivedUnit === 'kg' ? 'bg-navy-800 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        kg
                      </button>
                    </div>
                  </div>
                  {receivedKg > 0 && (
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      = {fromKilograms(receivedKg, 'q').dualDisplay}
                    </span>
                  )}
                </div>

                {/* Quality Grade */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('officer.qualityGradeSelect')} *
                  </label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    disabled={isAlreadyProcessed}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:bg-white focus:border-navy-800 disabled:bg-slate-100"
                  >
                    <option value="Grade A">Grade A — Premium (Highest MSP)</option>
                    <option value="Grade B">Grade B — Standard MSP</option>
                    <option value="Grade C">Grade C — Sub-standard (Reduced Rate)</option>
                    <option value="Below Standard">Below Standard (Rejection candidate)</option>
                  </select>
                </div>
              </div>

              {/* === SECTION 2: Inspection Decision === */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Inspection Decision</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Full Acceptance */}
                  <button
                    type="button"
                    onClick={() => !isAlreadyProcessed && setInspectionDecision('FULLY_ACCEPTED')}
                    disabled={isAlreadyProcessed}
                    className={`p-3.5 rounded-xl border-2 text-left transition space-y-1 ${
                      inspectionDecision === 'FULLY_ACCEPTED'
                        ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <CheckCircle className={`w-5 h-5 ${inspectionDecision === 'FULLY_ACCEPTED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="font-bold text-xs text-slate-900">Fully Accepted</div>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      All received quantity meets quality standards
                    </p>
                  </button>

                  {/* Partial Acceptance */}
                  <button
                    type="button"
                    onClick={() => !isAlreadyProcessed && setInspectionDecision('PARTIALLY_ACCEPTED')}
                    disabled={isAlreadyProcessed}
                    className={`p-3.5 rounded-xl border-2 text-left transition space-y-1 ${
                      inspectionDecision === 'PARTIALLY_ACCEPTED'
                        ? 'border-amber-500 bg-amber-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 ${inspectionDecision === 'PARTIALLY_ACCEPTED' ? 'text-amber-500' : 'text-slate-400'}`} />
                    <div className="font-bold text-xs text-slate-900">Partially Accepted</div>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      Some quantity meets standards, rest is returned
                    </p>
                  </button>

                  {/* Rejection */}
                  <button
                    type="button"
                    onClick={() => !isAlreadyProcessed && setInspectionDecision('REJECTED')}
                    disabled={isAlreadyProcessed}
                    className={`p-3.5 rounded-xl border-2 text-left transition space-y-1 ${
                      inspectionDecision === 'REJECTED'
                        ? 'border-red-500 bg-red-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <XCircle className={`w-5 h-5 ${inspectionDecision === 'REJECTED' ? 'text-red-500' : 'text-slate-400'}`} />
                    <div className="font-bold text-xs text-slate-900">Rejected</div>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      Entire produce does not meet procurement standards
                    </p>
                  </button>
                </div>

                {/* Partial: Accepted Quantity Input */}
                {inspectionDecision === 'PARTIALLY_ACCEPTED' && (
                  <div className="space-y-1.5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Accepted Quantity (out of {fromKilograms(receivedKg, 'q').displayString} received) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={acceptedQty}
                        onChange={(e) => setAcceptedQty(e.target.value)}
                        placeholder="e.g. 18.0"
                        disabled={isAlreadyProcessed}
                        className="flex-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold focus:border-amber-600 disabled:bg-slate-100"
                        required
                      />
                      <div className="flex items-center gap-1 bg-amber-100 p-0.5 rounded-xl border border-amber-300">
                        <button
                          type="button"
                          onClick={() => setAcceptedUnit('q')}
                          disabled={isAlreadyProcessed}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                            acceptedUnit === 'q' ? 'bg-amber-600 text-white' : 'text-amber-800 hover:text-amber-900'
                          }`}
                        >
                          Q
                        </button>
                        <button
                          type="button"
                          onClick={() => setAcceptedUnit('kg')}
                          disabled={isAlreadyProcessed}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                            acceptedUnit === 'kg' ? 'bg-amber-600 text-white' : 'text-amber-800 hover:text-amber-900'
                          }`}
                        >
                          kg
                        </button>
                      </div>
                    </div>
                    {acceptedKg > 0 && rejectedKg >= 0 && (
                      <div className="flex gap-4 text-[11px] pt-1">
                        <span className="text-emerald-700 font-bold">
                          ✓ Accepted: {fromKilograms(acceptedKg, 'q').dualDisplay}
                        </span>
                        <span className="text-red-700 font-bold">
                          ✗ Returned: {fromKilograms(rejectedKg, 'q').dualDisplay}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason for Partial / Rejection */}
                {needsReason && (
                  <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <label className="block text-xs font-bold text-red-900 uppercase tracking-wider">
                      Reason for {inspectionDecision === 'REJECTED' ? 'Rejection' : 'Partial Acceptance'} *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {REJECTION_REASONS.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => !isAlreadyProcessed && setRejectionReason(reason)}
                          disabled={isAlreadyProcessed}
                          className={`px-3 py-2 rounded-xl border text-left text-xs font-semibold transition ${
                            rejectionReason === reason
                              ? 'border-red-600 bg-red-100 text-red-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>

                    {/* Additional Remarks if "Other" */}
                    {needsRemarks && (
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-red-800 uppercase tracking-wider">
                          Specify Reason (mandatory for "Other") *
                        </label>
                        <textarea
                          rows={2}
                          value={officerRemarks}
                          onChange={(e) => setOfficerRemarks(e.target.value)}
                          disabled={isAlreadyProcessed}
                          placeholder="Describe the specific quality issue..."
                          className="w-full px-3.5 py-2.5 bg-white border border-red-300 rounded-xl text-xs focus:border-red-600 resize-none disabled:bg-slate-100"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Optional general remarks */}
                {!needsRemarks && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Officer Remarks (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={officerRemarks}
                      onChange={(e) => setOfficerRemarks(e.target.value)}
                      disabled={isAlreadyProcessed}
                      placeholder="Any additional notes about this produce..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-navy-800 resize-none disabled:bg-slate-100"
                    />
                  </div>
                )}
              </div>

              {/* === SECTION 3: Rate & Payment (only if not rejected) === */}
              {inspectionDecision !== 'REJECTED' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-navy-800" />
                    <span>Rate & Payment Calculation</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t('officer.ratePerQuintalInput')} (₹/Quintal) *
                      </label>
                      <input
                        type="number"
                        value={ratePerQuintal}
                        onChange={(e) => setRatePerQuintal(e.target.value)}
                        placeholder="2300"
                        disabled={isAlreadyProcessed}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:bg-white focus:border-navy-800 disabled:bg-slate-100"
                        required
                      />
                    </div>

                    {/* Estimated Total (display only) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Estimated Payout (Display Only)
                      </label>
                      <div className="px-3.5 py-2.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-xl font-black text-emerald-900">
                        ₹{estimatedTotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-[11px] text-blue-800">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Server-side calculation:</strong> The final payout is always computed by the backend using the accepted weight and the rate you enter above. The displayed estimate is for reference only. No frontend-computed amount is trusted.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading || isAlreadyProcessed}
                  className={`font-bold px-8 py-3 rounded-xl text-sm shadow-lg flex items-center gap-2 transition disabled:bg-slate-300 disabled:text-slate-500 ${
                    inspectionDecision === 'REJECTED'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : inspectionDecision === 'PARTIALLY_ACCEPTED'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-agri-700 hover:bg-agri-800 text-white'
                  }`}
                >
                  {inspectionDecision === 'REJECTED' ? (
                    <XCircle className="w-5 h-5" />
                  ) : inspectionDecision === 'PARTIALLY_ACCEPTED' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span>
                    {loading
                      ? 'Processing...'
                      : isAlreadyProcessed
                      ? `Already ${selectedItem.procurement?.status}`
                      : inspectionDecision === 'REJECTED'
                      ? 'Confirm Rejection'
                      : inspectionDecision === 'PARTIALLY_ACCEPTED'
                      ? 'Confirm Partial Acceptance'
                      : t('officer.approveBtn')}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a farmer from the queue to start inspection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
