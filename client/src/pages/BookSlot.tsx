import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { ProcurementCentre, Slot, Booking } from '../types';
import { DigitalTokenModal } from '../components/DigitalTokenModal';
import {
  Calendar,
  Building,
  Clock,
  Package,
  CheckCircle,
  Sparkles,
  AlertCircle,
  QrCode,
  Printer,
  Activity,
  ArrowRight,
  ArrowLeft,
  Wheat,
} from 'lucide-react';

export const BookSlot: React.FC = () => {
  const { t } = useTranslation();
  const { role, farmer } = useAuth();
  const { showSMS, showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Booking Flow Steps: 1: Centre & Date, 2: Slot Selection, 3: Crop Details, 4: Review, 5: Success
  const [currentStep, setCurrentStep] = useState(1);
  const [centres, setCentres] = useState<ProcurementCentre[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Crop & Produce Details
  const [cropType, setCropType] = useState('Paddy');
  const [expectedQuantity, setExpectedQuantity] = useState('25');

  // Success State
  const [bookedRecord, setBookedRecord] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);

  useEffect(() => {
    fetchCentres();
  }, []);

  useEffect(() => {
    if (selectedCentreId && selectedDate) {
      fetchSlots(selectedCentreId, selectedDate);
    }
  }, [selectedCentreId, selectedDate]);

  const fetchCentres = async () => {
    try {
      const res = await api.getCentres();
      if (res.success && res.centres?.length > 0) {
        setCentres(res.centres);
        const defaultId = farmer?.centreId || res.centres[0].id;
        setSelectedCentreId(defaultId);
      }
    } catch {
      setErrorMsg('Failed to load procurement centres.');
    }
  };

  const fetchSlots = async (centreId: string, date: string) => {
    try {
      const res = await api.getCentreSlots(centreId, date);
      if (res.success && res.slots) {
        setSlots(res.slots);
        // Pre-select recommended slot if available
        const rec = res.slots.find((s: Slot) => s.isRecommended && s.status !== 'FULL');
        if (rec) {
          setSelectedSlot(rec);
        } else if (res.slots.length > 0) {
          const firstAvail = res.slots.find((s: Slot) => s.status !== 'FULL');
          setSelectedSlot(firstAvail || null);
        }
      }
    } catch {
      setErrorMsg('Failed to load slots for this centre.');
    }
  };

  const handleSlotSelect = (slot: Slot) => {
    if (slot.status === 'FULL') return;
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!role || role !== 'FARMER') {
      navigate('/login', { state: { from: { pathname: '/book-slot' } } });
      return;
    }

    if (!selectedSlot) {
      setErrorMsg('Please select an available time slot.');
      return;
    }

    const qty = parseFloat(expectedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Please enter a valid produce quantity in Quintals.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.createBooking({
        centreId: selectedCentreId,
        slotId: selectedSlot.id,
        cropType,
        expectedQuantity: qty,
      });

      if (res.success && res.booking) {
        setBookedRecord(res.booking);
        setCurrentStep(5);
        showSMS(
          `Kisan Setu: Slot confirmed for ${cropType} (${qty} Q). Token: ${res.booking.tokenNumber}. Date: ${res.booking.date}, Time: ${res.booking.timeSlot}. Ref: ${res.booking.bookingReference}.`,
          farmer?.mobileNumber || '9876543210'
        );
        showSuccess('Slot Booked', `Token ${res.booking.tokenNumber} generated successfully.`);
      } else {
        setErrorMsg(res.message || 'Failed to book slot.');
        showError('Booking Failed', res.message || 'Please try another slot.');
      }
    } catch {
      setErrorMsg('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCentre = centres.find((c) => c.id === selectedCentreId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{t('booking.title')}</h1>
          <p className="text-xs text-slate-500">
            Guaranteed arrival window with smart congestion management
          </p>
        </div>

        {/* Step Indicator */}
        {currentStep < 5 && (
          <div className="text-xs font-semibold text-navy-800 bg-navy-50 px-3 py-1 rounded-full border border-navy-100">
            Step {currentStep} of 4
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Centre & Date */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-navy-800" />
            <span>{t('booking.selectCentre')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {centres.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCentreId(c.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  selectedCentreId === c.id
                    ? 'border-navy-800 bg-navy-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-sm text-slate-900">{c.name}</span>
                  <input
                    type="radio"
                    checked={selectedCentreId === c.id}
                    onChange={() => setSelectedCentreId(c.id)}
                    className="text-navy-800 focus:ring-navy-800"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{c.address}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                  <span>Hours: {c.openingTime} – {c.closingTime}</span>
                  <span className="text-emerald-700 font-semibold">Active Queue</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('booking.selectDate')}
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-navy-800"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-navy-800 hover:bg-navy-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
            >
              <span>Proceed to Slot Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Time Slot with Smart Recommendation Algorithm */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-navy-800" />
              <h3 className="text-base font-bold text-navy-900">{t('booking.selectSlot')}</h3>
            </div>
            <span className="text-xs text-slate-500">
              Centre: <strong className="text-navy-900">{selectedCentre?.name}</strong> | Date:{' '}
              <strong className="text-navy-900">{selectedDate}</strong>
            </span>
          </div>

          {/* Smart Recommendation Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
            <div className="p-2 bg-amber-200 rounded-lg text-amber-900 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-900">
                Smart Congestion Optimization Engine
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Slots highlighted with <strong>RECOMMENDED</strong> are dynamically calculated based on the lowest booked capacity ratio to reduce your waiting time at the centre.
              </p>
            </div>
          </div>

          {/* Slots List */}
          <div className="space-y-3">
            {slots.map((slot) => {
              const isFull = slot.status === 'FULL';
              const isSelected = selectedSlot?.id === slot.id;

              return (
                <div
                  key={slot.id}
                  onClick={() => !isFull && handleSlotSelect(slot)}
                  className={`p-4 rounded-xl border-2 transition relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                    isFull
                      ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-navy-800 bg-navy-50 shadow-sm cursor-pointer'
                      : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        {slot.isRecommended && !isFull && (
                          <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            <span>{t('booking.recommendedBadge')}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isFull
                          ? 'Slot Completely Booked'
                          : slot.isRecommended
                          ? `Low crowd expected • Est. wait: ~${slot.estimatedWaitMinutes} mins`
                          : `Moderate crowd • Est. wait: ~${slot.estimatedWaitMinutes} mins`}
                      </p>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700">
                        {slot.capacity - slot.bookedCount} / {slot.capacity} Available
                      </span>
                      <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            isFull
                              ? 'bg-red-500'
                              : slot.bookedCount >= 7
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${(slot.bookedCount / slot.capacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="slotSelect"
                      disabled={isFull}
                      checked={isSelected}
                      onChange={() => handleSlotSelect(slot)}
                      className="text-navy-800 focus:ring-navy-800"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              disabled={!selectedSlot || selectedSlot.status === 'FULL'}
              onClick={() => setCurrentStep(3)}
              className="bg-navy-800 hover:bg-navy-900 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
            >
              <span>Produce Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Crop Details */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Package className="w-5 h-5 text-navy-800" />
            <span>{t('booking.cropDetails')}</span>
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('booking.cropType')} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {['Paddy', 'Wheat', 'Maize', 'Groundnut', 'Cotton', 'Onion'].map((crop) => (
                  <button
                    type="button"
                    key={crop}
                    onClick={() => setCropType(crop)}
                    className={`p-3 rounded-xl border-2 text-left transition font-semibold text-xs flex items-center justify-between ${
                      cropType === crop
                        ? 'border-navy-800 bg-navy-50 text-navy-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>{crop}</span>
                    {cropType === crop && <CheckCircle className="w-4 h-4 text-navy-800" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('booking.quantity')} *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={expectedQuantity}
                onChange={(e) => setExpectedQuantity(e.target.value)}
                placeholder="25"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:border-navy-800"
                required
              />
              <span className="text-[11px] text-slate-400 block">
                1 Quintal = 100 kg. Approximate estimation for slot allocation.
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="bg-navy-800 hover:bg-navy-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
            >
              <span>Review Booking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Confirm */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3">
            Review Appointment Details
          </h3>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Procurement Centre:</span>
              <span className="font-bold text-slate-900 text-right">{selectedCentre?.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Centre Address:</span>
              <span className="text-slate-700 text-right max-w-xs">{selectedCentre?.address}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Reporting Date:</span>
              <span className="font-bold text-slate-900">{selectedDate}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Scheduled Time Window:</span>
              <span className="font-bold text-navy-800">
                {selectedSlot?.startTime} – {selectedSlot?.endTime}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Crop & Produce:</span>
              <span className="font-bold text-slate-900">
                {cropType} ({expectedQuantity} Quintals)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Farmer:</span>
              <span className="font-bold text-slate-900">
                {farmer?.fullName || 'Ramesh Kumar'} (+91-{farmer?.mobileNumber || '9876543210'})
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            ℹ️ Slot booking is concurrency-safe. A digital token with QR code will be generated immediately upon confirmation.
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              disabled={loading}
              onClick={handleConfirmBooking}
              className="bg-agri-700 hover:bg-agri-800 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Confirming...' : t('booking.confirmBooking')}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Booking Success & Token */}
      {currentStep === 5 && bookedRecord && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-center animate-in zoom-in-95">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-navy-900">{t('booking.successTitle')}</h2>
            <p className="text-xs text-slate-500">
              Your appointment has been registered on the server and verified.
            </p>
          </div>

          {/* Token Card */}
          <div className="bg-navy-50 border-2 border-navy-800 rounded-2xl p-5 max-w-md mx-auto space-y-2">
            <div className="text-xs font-bold text-navy-700 uppercase tracking-widest">
              Digital Token Issued
            </div>
            <div className="text-4xl font-black text-navy-900 tracking-wider">
              {bookedRecord.tokenNumber}
            </div>
            <div className="text-xs text-slate-600 font-mono">
              Booking Ref: {bookedRecord.bookingReference}
            </div>
            <div className="text-xs text-slate-700 font-medium pt-2 border-t border-navy-200">
              {bookedRecord.centreName} • {bookedRecord.date} ({bookedRecord.timeSlot})
            </div>
          </div>

          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            {t('booking.reportingTime')} A simulated SMS confirmation has been logged to your mobile number.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setShowTokenModal(true)}
              className="bg-navy-800 hover:bg-navy-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>{t('booking.downloadToken')}</span>
            </button>

            <Link
              to="/live-queue"
              className="bg-agri-700 hover:bg-agri-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 transition"
            >
              <Activity className="w-4 h-4" />
              <span>{t('booking.viewQueue')}</span>
            </Link>

            <Link
              to="/dashboard"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Digital Token Modal */}
      {showTokenModal && bookedRecord && (
        <DigitalTokenModal
          booking={bookedRecord}
          onClose={() => setShowTokenModal(false)}
        />
      )}
    </div>
  );
};
