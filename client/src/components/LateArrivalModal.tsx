import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ReassignmentSlot } from '../types';
import {
  Clock,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Building,
  Package,
} from 'lucide-react';

interface LateArrivalModalProps {
  bookingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const LateArrivalModal: React.FC<LateArrivalModalProps> = ({
  bookingId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError, showSMS } = useToast();

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookingData, setBookingData] = useState<any | null>(null);
  const [slots, setSlots] = useState<ReassignmentSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [hasCheckedSlots, setHasCheckedSlots] = useState(false);

  // Outcome confirmation screens
  const [reassignSuccessData, setReassignSuccessData] = useState<any | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchSlots();
    } else {
      resetState();
    }
  }, [bookingId]);

  const resetState = () => {
    setBookingData(null);
    setSlots([]);
    setSelectedSlotId('');
    setHasCheckedSlots(false);
    setReassignSuccessData(null);
    setCancelSuccess(false);
  };

  const fetchSlots = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const res = await api.getReassignmentSlots(bookingId);
      if (res.success) {
        setBookingData(res.booking);
        setSlots(res.slots || []);
        setHasCheckedSlots(true);
        const rec = res.slots?.find((s: ReassignmentSlot) => s.isRecommended) || res.slots?.[0];
        if (rec) {
          setSelectedSlotId(rec.id);
        }
      } else {
        showError('Error', res.message || 'Failed to load booking details.');
      }
    } catch {
      showError('Error', 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!bookingId || !selectedSlotId) {
      showError('Selection Required', 'Please select an available slot.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.reassignBooking(bookingId, selectedSlotId);
      if (res.success) {
        setReassignSuccessData(res);
        showSuccess('Farmer Reassigned', `Assigned to ${res.newSlot} (Token: ${res.newToken}).`);
        showSMS(
          `Kisan Setu: Your procurement slot has been reassigned to ${res.newSlot}. Token: ${res.newToken}.`,
          bookingData?.mobileNumber
        );
        onSuccess();
      } else {
        showError('Reassignment Failed', res.message || 'Slot may have filled up.');
        fetchSlots(); // Refresh capacity
      }
    } catch {
      showError('Error', 'Server error while processing reassignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelMissed = async () => {
    if (!bookingId) return;
    setActionLoading(true);
    try {
      const res = await api.cancelMissedBooking(bookingId);
      if (res.success) {
        setCancelSuccess(true);
        showSuccess('Booking Cancelled', 'Missed booking cancelled due to no remaining capacity today.');
        showSMS(
          'Kisan Setu: Your procurement booking has been cancelled because your scheduled slot was missed and no slots remain available today.',
          bookingData?.mobileNumber
        );
        onSuccess();
      } else {
        showError('Cancellation Failed', res.message || 'Failed to cancel booking.');
      }
    } catch {
      showError('Error', 'Server error while cancelling booking.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!bookingId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-navy-900 text-white p-6 relative flex items-center justify-between border-b border-navy-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Late / Missed Slot Management
              </span>
              <h3 className="text-lg font-bold">Late Arrival & Slot Reassignment</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-slate-800 text-xs">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-navy-800 mx-auto" />
              <p className="font-semibold text-slate-600">Querying real-time slot capacity at this centre...</p>
            </div>
          ) : reassignSuccessData ? (
            /* SUCCESS REASSIGNMENT SCREEN */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-navy-900 uppercase">✓ FARMER REASSIGNED</h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Slot capacity has been updated and a new sequential token was generated.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Farmer:</span>
                  <strong className="text-navy-900 font-bold">{bookingData?.farmerName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Previous Missed Slot:</span>
                  <span className="line-through text-slate-500">{bookingData?.originalSlot}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2 bg-emerald-50/60 p-2 rounded-lg">
                  <span className="font-bold text-emerald-900">New Reassigned Slot:</span>
                  <strong className="font-black text-emerald-800">{reassignSuccessData.newSlot}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">New Queue Token:</span>
                  <strong className="font-mono font-black text-navy-900 text-sm bg-navy-100 px-2 py-0.5 rounded">
                    {reassignSuccessData.newToken}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Status:</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    REASSIGNED
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-left text-[11px]">
                📱 In-app notification & simulated SMS confirmation sent to <strong>+91-{bookingData?.mobileNumber}</strong>.
              </div>

              <button
                onClick={onClose}
                className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold py-3 rounded-xl shadow transition"
              >
                Close & Return to Queue
              </button>
            </div>
          ) : cancelSuccess ? (
            /* CANCELLED SCREEN */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-navy-900 uppercase">✕ BOOKING CANCELLED</h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  The missed booking has been cancelled because no remaining slots were available today.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left space-y-2 text-red-900">
                <div className="flex justify-between">
                  <span className="font-medium">Farmer:</span>
                  <strong>{bookingData?.farmerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <strong className="font-mono">CANCELLED</strong>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reason:</span>
                  <span>MISSED_SLOT_NO_CAPACITY</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl shadow transition"
              >
                Close
              </button>
            </div>
          ) : bookingData ? (
            /* MAIN INSPECTION & REASSIGNMENT SELECTION SCREEN */
            <>
              {/* Farmer On-Hold Summary Card */}
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                    ⚠ LATE ARRIVAL — ON HOLD
                  </span>
                  <span className="font-mono text-slate-500 font-bold">
                    Ref: {bookingData.bookingReference}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Farmer Name</span>
                    <strong className="font-bold text-navy-900 text-sm">{bookingData.farmerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Original Token</span>
                    <strong className="font-mono font-bold text-slate-900 text-sm">{bookingData.tokenNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Original Missed Slot</span>
                    <span className="font-bold text-red-700">{bookingData.originalSlot}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Crop & Quantity</span>
                    <span className="font-bold text-slate-800">
                      {bookingData.cropType} ({bookingData.expectedQuantity} {bookingData.quantityUnit === 'kg' ? 'kg' : 'Q'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Slot Availability Section */}
              {slots.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Remaining Available Slots Today ({slots.length})</span>
                    </h4>
                    <button
                      onClick={fetchSlots}
                      className="text-navy-800 hover:text-navy-900 text-[11px] font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh Capacity</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-navy-800 bg-navy-50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">
                                  {slot.startTime} – {slot.endTime}
                                </span>
                                {slot.isRecommended && (
                                  <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
                                    ⭐ RECOMMENDED
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                                {slot.remainingCapacity} spot{slot.remainingCapacity > 1 ? 's' : ''} remaining ({slot.bookedCount}/{slot.capacity} booked)
                              </span>
                            </div>
                          </div>

                          <input
                            type="radio"
                            name="reassignSlotRadio"
                            checked={isSelected}
                            onChange={() => setSelectedSlotId(slot.id)}
                            className="text-navy-800 focus:ring-navy-800"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                    ℹ️ Reassigning will release the farmer's previous slot capacity, increment the new slot, and issue a new queue token.
                  </div>

                  {/* Reassignment Action Button */}
                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading || !selectedSlotId}
                      onClick={handleReassign}
                      className="bg-agri-700 hover:bg-agri-800 disabled:bg-slate-300 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{actionLoading ? 'Reassigning...' : t('officer.reassignFarmer')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* NO SLOTS AVAILABLE FOR TODAY */
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 space-y-2 text-red-900">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                      <h4 className="font-black text-sm uppercase tracking-wider">
                        {t('officer.noSlotsAvailable')}
                      </h4>
                    </div>
                    <p className="text-xs leading-relaxed">
                      {t('officer.noSlotsAvailableDesc')}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                    Per procurement policy, farmers who miss their scheduled slot when all later same-day slots are full cannot be carried over automatically. This booking will be marked as cancelled.
                  </div>

                  {/* Cancellation Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleCancelMissed}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{actionLoading ? 'Cancelling...' : t('officer.cancelMissedBooking')}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-slate-400">
              No booking selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
