import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { ProcurementCentre, Slot, Booking } from '../types';
import { DigitalTokenModal } from '../components/DigitalTokenModal';
import { useLocation } from '../context/LocationContext';
import { calculateHaversineDistance, getGoogleMapsDirectionsUrl, findRecommendedCentreId } from '../utils/location';
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
  Navigation,
  MapPin,
  Compass,
  Phone,
  Info,
  X,
} from 'lucide-react';

export const BookSlot: React.FC = () => {
  const { t } = useTranslation();
  const { role, farmer } = useAuth();
  const { showSMS, showSuccess, showError } = useToast();
  const { userLocation, locationStatus, locationMsg, handleGetLocation } = useLocation();
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
  const [quantityUnit, setQuantityUnit] = useState<'q' | 'kg'>('q');

  // Selected Centre Detail Modal State
  const [selectedDetailCentre, setSelectedDetailCentre] = useState<ProcurementCentre | null>(null);

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

  // Enrich centres with distance & recommendation algorithm
  const enrichedCentres = centres.map((c) => {
    let distanceKm: number | null = null;
    if (userLocation && c.latitude && c.longitude) {
      distanceKm = calculateHaversineDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude);
    }
    return {
      ...c,
      distanceKm,
    };
  });

  // Sort: if userLocation available, sort Nearest -> Farthest
  if (userLocation) {
    enrichedCentres.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  // Find Nearest Centre
  const nearestCentreId = userLocation && enrichedCentres.length > 0 ? enrichedCentres[0].id : null;

  // Normalized Smart Centre Recommendation: Distance & Congestion Based Recommendation
  const recommendedCentreId = findRecommendedCentreId(enrichedCentres);

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
      setErrorMsg(`Please enter a valid produce quantity in ${quantityUnit === 'kg' ? 'Kilograms' : 'Quintals'}.`);
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
        quantityUnit,
      });

      if (res.success && res.booking) {
        setBookedRecord(res.booking);
        setCurrentStep(5);
        const unitLabel = quantityUnit === 'kg' ? 'kg' : 'Q';
        showSMS(
          `Kisan Setu: Slot confirmed for ${cropType} (${qty} ${unitLabel}). Token: ${res.booking.tokenNumber}. Date: ${res.booking.date}, Time: ${res.booking.timeSlot}. Ref: ${res.booking.bookingReference}.`,
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

  const selectedCentre = enrichedCentres.find((c) => c.id === selectedCentreId);

  // Helper for recommended arrival time calculation
  const getRecommendedArrival = (slotWindow: string) => {
    try {
      const startTime = slotWindow.split('–')[0]?.trim() || slotWindow.split('-')[0]?.trim() || '14:00';
      const [hStr, mStr] = startTime.split(':');
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr || '0', 10) - 15;
      if (m < 0) {
        m += 60;
        h -= 1;
      }
      const period = h >= 12 ? 'PM' : 'AM';
      const dh = h % 12 === 0 ? 12 : h % 12;
      return `${dh}:${String(m).padStart(2, '0')} ${period}`;
    } catch {
      return '15 mins before slot';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title Header */}
      <div className="border-b border-line pb-5">
        <h1 className="text-2xl font-black text-ink">{t('booking.title', 'Book Procurement Slot')}</h1>
        <p className="text-sm text-muted mt-1">
          Guaranteed arrival window with smart location discovery & congestion optimization
        </p>
      </div>

      {/* Visual Step Indicator */}
      {currentStep < 5 && (
        <div className="w-full overflow-x-auto">
          <div className="flex items-center min-w-max sm:min-w-0 sm:w-full gap-0">
            {[
              { num: 1, label: 'Centre' },
              { num: 2, label: 'Slot' },
              { num: 3, label: 'Crop & Qty' },
              { num: 4, label: 'Review' },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-sm
                    ${currentStep === s.num
                      ? 'bg-india-green text-white ring-4 ring-green-100 scale-110'
                      : currentStep > s.num
                      ? 'bg-india-green_deep text-white'
                      : 'bg-paper text-muted border-2 border-line'
                    }`}
                  >
                    {currentStep > s.num ? '✓' : s.num}
                  </div>
                  <span className={`text-[10px] font-bold whitespace-nowrap ${currentStep === s.num ? 'text-india-green' : currentStep > s.num ? 'text-india-green_deep' : 'text-muted'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${currentStep > s.num ? 'bg-india-green' : 'bg-line'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Centre & Date Selection with Geolocation & Smart Distance Sorting */}
      {currentStep === 1 && (
        <div className="bg-white rounded p-6 border border-line shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-line pb-4">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Building className="w-5 h-5 text-india-green" />
                <span>{t('booking.selectCentre')}</span>
              </h3>
              <p className="text-xs text-muted mt-0.5">{t('location.findNearbySub')}</p>
            </div>

            {/* Geolocation Trigger Button */}
            <button
              onClick={handleGetLocation}
              disabled={locationStatus === 'GETTING'}
              className="bg-india-green hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded text-xs font-bold shadow-sm flex items-center gap-2 transition shrink-0"
            >
              <Compass className={`w-4 h-4 ${locationStatus === 'GETTING' ? 'animate-spin' : ''}`} />
              <span>
                {locationStatus === 'GETTING' ? t('location.gettingLocation') : t('location.useMyLocation')}
              </span>
            </button>
          </div>

          {/* Geolocation Feedback Message */}
          {locationMsg && (
            <div
              className={`p-3 rounded border text-xs flex items-center gap-2 ${
                locationStatus === 'DENIED' || locationStatus === 'UNAVAILABLE'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-green-50 border-green-200 text-green-900'
              }`}
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>{locationMsg}</span>
            </div>
          )}

          {/* Procurement Centres Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrichedCentres.map((c) => {
              const isSelected = selectedCentreId === c.id;
              const isNearest = c.id === nearestCentreId;
              const isRecommended = c.id === recommendedCentreId;

              const directionsUrl = getGoogleMapsDirectionsUrl(
                c.latitude,
                c.longitude,
                c.address,
                c.name
              );

              return (
                <div
                  key={c.id}
                  className={`p-5 rounded border-2 transition flex flex-col justify-between space-y-3 relative ${
                    isSelected
                      ? 'border-india-green bg-green-50/50 shadow-md'
                      : 'border-line hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Badges Container */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isNearest && (
                      <span className="bg-india-green text-white text-[10px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{t('location.nearestCentre')}</span>
                      </span>
                    )}

                    {isRecommended && (
                      <span className="bg-india-saffron text-white text-[10px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{t('location.recommendedCentre')}</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-sm text-ink leading-snug">{c.name}</h4>
                      <input
                        type="radio"
                        name="centreRadio"
                        checked={isSelected}
                        onChange={() => setSelectedCentreId(c.id)}
                        className="text-india-green focus:ring-india-green mt-1"
                      />
                    </div>
                    <p className="text-xs text-muted leading-relaxed flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                      <span>{c.address}</span>
                    </p>
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-paper p-2.5 rounded border border-line">
                    <div>
                      <span className="text-muted block">{t('location.distanceAway')}</span>
                      <strong className="text-ink font-bold">
                        {c.distanceKm !== null ? `${c.distanceKm} km` : '📍 Location pending'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-muted block">{t('location.currentQueue')}</span>
                      <strong className="text-india-saffron font-bold">
                        {c.todayQueueCount || 8} Farmers
                      </strong>
                    </div>

                    <div className="col-span-2 border-t border-line pt-1.5 mt-0.5 flex justify-between items-center text-muted">
                      <span>{t('location.nextAvailableSlot')}:</span>
                      <span className="font-bold text-ink">{c.nextAvailableSlotTime}</span>
                    </div>
                  </div>

                  {/* Reason Callout for Recommended Centre */}
                  {isRecommended && (
                    <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 font-medium">
                      💡 {t('location.smartRecommendationReason')}
                    </p>
                  )}

                  {/* Buttons Toolbar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-line">
                    <button
                      onClick={() => setSelectedCentreId(c.id)}
                      className={`flex-1 py-2 px-3 rounded text-xs font-bold shadow-sm transition flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-india-green text-white'
                          : 'bg-paper hover:bg-gray-100 text-ink border border-line'
                      }`}
                    >
                      <span>{isSelected ? 'Selected Centre' : t('location.selectCentre')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetailCentre(c);
                      }}
                      className="p-2 bg-paper hover:bg-gray-100 border border-line text-ink rounded text-xs font-bold"
                      title={t('location.viewDetails')}
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    {directionsUrl ? (
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-green-50 hover:bg-green-100 text-india-green border border-green-200 rounded text-xs font-bold flex items-center gap-1 shrink-0"
                        title={t('location.getDirections')}
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Directions</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Date Picker */}
          <div className="space-y-2 pt-2 border-t border-line">
            <label className="block text-xs font-bold text-ink uppercase tracking-wider">
              {t('booking.selectDate')}
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 bg-paper border border-line rounded text-sm font-medium focus:bg-white focus:border-india-green"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-line">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-india-green hover:bg-green-700 text-white px-6 py-2.5 rounded text-xs font-bold shadow flex items-center gap-1.5 transition"
            >
              <span>{t('booking.proceedToSlot')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Time Slot Selection */}
      {currentStep === 2 && (
        <div className="bg-white rounded p-6 border border-line shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-india-green" />
              <h3 className="text-base font-bold text-ink">{t('booking.selectSlot')}</h3>
            </div>
            <span className="text-xs text-muted">
              Centre: <strong className="text-ink">{selectedCentre?.name}</strong> | Date:{' '}
              <strong className="text-ink">{selectedDate}</strong>
            </span>
          </div>

          {/* Smart Recommendation Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3.5 flex items-start gap-3">
            <div className="p-2 bg-amber-200 rounded text-amber-900 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-900">
                {t('booking.smartEngine')}
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {t('booking.smartEngineDesc')}
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
                  className={`p-4 rounded border-2 transition relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                    isFull
                      ? 'border-line bg-paper opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-india-green bg-green-50 shadow-sm cursor-pointer'
                      : 'border-line hover:border-gray-300 bg-white cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-paper flex items-center justify-center font-bold text-muted text-xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        {slot.isRecommended && !isFull && (
                          <span className="bg-india-saffron text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            <span>{t('booking.recommendedBadge')}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">
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
                      <span className="text-xs font-bold text-ink">
                        {slot.capacity - slot.bookedCount} / {slot.capacity} Available
                      </span>
                      <div className="w-28 h-2 bg-line rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            isFull
                              ? 'bg-red-500'
                              : slot.bookedCount >= 7
                              ? 'bg-amber-500'
                              : 'bg-india-green'
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
                      className="text-india-green focus:ring-india-green"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-line">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded border border-line text-ink text-xs font-bold flex items-center gap-1.5 hover:bg-paper"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('register.back')}</span>
            </button>

            <button
              disabled={!selectedSlot || selectedSlot.status === 'FULL'}
              onClick={() => setCurrentStep(3)}
              className="bg-india-green hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded text-xs font-bold shadow flex items-center gap-1.5 transition"
            >
              <span>Produce Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Crop Details */}
      {currentStep === 3 && (
        <div className="bg-white rounded p-6 border border-line shadow-sm space-y-6">
          <h3 className="text-base font-bold text-ink flex items-center gap-2 border-b border-line pb-3">
            <Package className="w-5 h-5 text-india-green" />
            <span>{t('booking.cropDetails')}</span>
          </h3>

          <div className="space-y-6">
            {/* Image-based Crop Selection */}
            <div className="space-y-3">
              <div>
                <p className="text-xl font-bold text-ink">{t('booking.selectCropTitle', 'Select Your Crop')}</p>
                <p className="text-sm text-muted mt-0.5">{t('booking.tapCropHint', 'Tap on the crop you want to sell')}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {([
                  { key: 'Paddy',     img: '/crops/paddy.jpg'     },
                  { key: 'Wheat',     img: '/crops/wheat.jpg'     },
                  { key: 'Maize',     img: '/crops/maize.jpg'     },
                  { key: 'Groundnut', img: '/crops/groundnut.jpg' },
                  { key: 'Cotton',    img: '/crops/cotton.jpg'    },
                  { key: 'Onion',     img: '/crops/onion.jpg'     },
                ] as { key: string; img: string }[]).map(({ key, img }) => {
                  const isSelected = cropType === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setCropType(key)}
                      aria-pressed={isSelected}
                      className={`group relative rounded overflow-hidden border-2 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400/40 ${
                        isSelected
                          ? 'border-india-green ring-2 ring-green-400/50 scale-[1.03] shadow-lg'
                          : 'border-line hover:border-gray-400 hover:shadow-md hover:scale-[1.01]'
                      }`}
                    >
                      {/* Photo area — 78% of card */}
                      <div className="relative w-full" style={{ paddingBottom: '78%' }}>
                        <img
                          src={img}
                          alt={`${key} crop`}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (fb) fb.style.display = 'flex';
                          }}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                        {/* Fallback if image fails */}
                        <div
                          className="absolute inset-0 hidden flex-col items-center justify-center bg-paper text-muted text-xs font-medium gap-1"
                        >
                          <Package className="w-8 h-8 opacity-40" />
                          <span>Image unavailable</span>
                        </div>

                        {/* Selected overlay checkmark */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-india-green/20 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">
                              <CheckCircle className="w-7 h-7 text-india-green" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Crop name label */}
                      <div className={`px-2 py-2.5 text-center transition-colors ${
                        isSelected ? 'bg-india-green text-white' : 'bg-white text-ink'
                      }`}>
                        <span className="block text-sm font-bold leading-tight">
                          {t(`crops.${key}`, key)}
                        </span>
                        {isSelected && (
                          <span className="block text-[10px] font-semibold text-green-100 mt-0.5 uppercase tracking-wider">
                            ✓ Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Contact notice */}
              <div className="flex items-start gap-2 bg-paper border border-line rounded p-3 text-xs text-muted">
                <Info className="w-4 h-4 shrink-0 text-muted mt-0.5" />
                <span>
                  {t('booking.cropNotListedNotice', "If you don't see your crop, please contact the procurement centre.")}
                </span>
              </div>

              {/* Selected crop preview strip */}
              {cropType && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <img
                    src={`/crops/${cropType.toLowerCase()}.jpg`}
                    alt={`${cropType} crop`}
                    className="w-10 h-10 rounded object-cover border border-green-300"
                  />
                  <div>
                    <p className="text-[11px] text-green-800 font-semibold uppercase tracking-wider">Selected Crop</p>
                    <p className="text-sm font-bold text-green-900">{t(`crops.${cropType}`, cropType)}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-india-green ml-auto" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                {t('booking.quantity')} *
              </label>

              {/* Unit Toggle */}
              <div className="flex items-center gap-1.5 bg-paper p-1 rounded border border-line w-fit">
                <button
                  type="button"
                  onClick={() => setQuantityUnit('q')}
                  className={`px-4 py-1.5 rounded text-xs font-bold transition ${
                    quantityUnit === 'q'
                      ? 'bg-india-green text-white shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Quintals (Q)
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityUnit('kg')}
                  className={`px-4 py-1.5 rounded text-xs font-bold transition ${
                    quantityUnit === 'kg'
                      ? 'bg-india-green text-white shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Kilograms (kg)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={quantityUnit === 'kg' ? '100000' : '1000'}
                  value={expectedQuantity}
                  onChange={(e) => setExpectedQuantity(e.target.value)}
                  placeholder={quantityUnit === 'kg' ? '2500' : '25'}
                  className="flex-1 px-4 py-2.5 bg-paper border border-line rounded text-sm font-semibold focus:bg-white focus:border-india-green"
                  required
                />
                <span className="text-sm font-bold text-india-green bg-green-50 border border-green-200 px-3 py-2.5 rounded shrink-0">
                  {quantityUnit === 'kg' ? 'kg' : 'Quintals'}
                </span>
              </div>

              <span className="text-[11px] text-muted block">
                1 Quintal = 100 kg. Backend normalizes to kg for weighing.{
                  expectedQuantity && parseFloat(expectedQuantity) > 0
                    ? quantityUnit === 'q'
                      ? ` ≈ ${parseFloat(expectedQuantity) * 100} kg`
                      : ` ≈ ${(parseFloat(expectedQuantity) / 100).toFixed(2)} Quintals`
                    : ''
                }
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-line">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded border border-line text-ink text-xs font-bold flex items-center gap-1.5 hover:bg-paper"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('register.back')}</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="bg-india-green hover:bg-green-700 text-white px-6 py-2.5 rounded text-xs font-bold shadow flex items-center gap-1.5 transition"
            >
              <span>Review Booking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Confirm */}
      {currentStep === 4 && (
        <div className="bg-white rounded p-6 border border-line shadow-sm space-y-6">
          <h3 className="text-base font-bold text-ink border-b border-line pb-3">
            {t('booking.reviewTitle')}
          </h3>

          <div className="bg-paper rounded p-5 border border-line space-y-3 text-xs">
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">{t('booking.selectCentre')}:</span>
              <span className="font-bold text-ink text-right">{selectedCentre?.name}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Centre Address:</span>
              <span className="text-ink text-right max-w-xs">{selectedCentre?.address}</span>
            </div>
            {selectedCentre?.distanceKm !== undefined && selectedCentre.distanceKm !== null && (
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Distance from Current Location:</span>
                <span className="font-bold text-india-green">{selectedCentre.distanceKm} km</span>
              </div>
            )}
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Reporting Date:</span>
              <span className="font-bold text-ink">{selectedDate}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Scheduled Time Window:</span>
              <span className="font-bold text-india-green">
                {selectedSlot?.startTime} – {selectedSlot?.endTime}
              </span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Crop &amp; Produce:</span>
              <span className="font-bold text-ink flex items-center gap-2">
                <img
                  src={`/crops/${cropType.toLowerCase()}.jpg`}
                  alt={`${cropType} crop`}
                  className="w-7 h-7 rounded object-cover border border-line"
                />
                {t(`crops.${cropType}`, cropType)} ({expectedQuantity} {quantityUnit === 'kg' ? 'kg' : 'Quintals'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Farmer:</span>
              <span className="font-bold text-ink">
                {farmer?.fullName || 'Ramesh Kumar'} (+91-{farmer?.mobileNumber || '9876543210'})
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            ℹ️ {t('booking.concurrencyNotice')}
          </div>

          <div className="flex justify-between pt-4 border-t border-line">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded border border-line text-ink text-xs font-bold flex items-center gap-1.5 hover:bg-paper"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('register.back')}</span>
            </button>

            <button
              disabled={loading}
              onClick={handleConfirmBooking}
              className="bg-india-green hover:bg-green-700 disabled:bg-gray-300 text-white px-8 py-3 rounded text-sm font-bold shadow-lg flex items-center gap-2 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Confirming...' : t('booking.confirmBooking')}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Booking Confirmation & Google Maps Directions */}
      {currentStep === 5 && bookedRecord && (
        <div className="bg-white rounded-2xl border border-line shadow-xl overflow-hidden">
          {/* Green Header with animated check */}
          <div className="bg-india-green text-white px-6 py-8 text-center space-y-3">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-10 h-10 text-india-green" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">{t('booking.successTitle', 'SLOT BOOKED SUCCESSFULLY')}</h2>
            <p className="text-green-100 text-sm">Your procurement appointment has been confirmed.</p>
          </div>

          <div className="p-6 sm:p-8 space-y-6 max-w-xl mx-auto">
            {/* Big Token Display */}
            <div className="text-center py-6 border-2 border-india-green rounded-2xl bg-green-50 space-y-1">
              <div className="text-xs font-black text-muted uppercase tracking-widest">{t('booking.tokenNo', 'Your Token Number')}</div>
              <div className="text-5xl font-black text-india-green tracking-widest">{bookedRecord.tokenNumber}</div>
              <div className="text-xs text-muted font-mono">{t('booking.bookingRef', 'Ref')}: {bookedRecord.bookingReference}</div>
            </div>

            {/* Centre & Appointment Details */}
            <div className="bg-paper rounded-xl border border-line p-5 space-y-4 text-sm">
              <h3 className="font-black text-ink flex items-center gap-2 text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-india-green" />
                {t('location.reportingLocation', 'Reporting Location')}
              </h3>
              <div className="space-y-1">
                <strong className="font-bold text-ink block">{bookedRecord.centreName}</strong>
                <p className="text-xs text-muted">{bookedRecord.centreAddress}</p>
                {selectedCentre?.phoneNumber && (
                  <p className="text-xs text-muted flex items-center gap-1 mt-1">
                    <Phone className="w-3.5 h-3.5 text-india-green" />
                    {t('location.centreContact', 'Centre Contact')}: {selectedCentre.phoneNumber}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line">
                <div>
                  <span className="text-xs text-muted block uppercase tracking-wider font-semibold">Date</span>
                  <strong className="font-black text-ink">{bookedRecord.date}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted block uppercase tracking-wider font-semibold">Slot Time</span>
                  <strong className="font-black text-ink">{bookedRecord.timeSlot}</strong>
                </div>
                <div className="col-span-2 bg-india-saffron/10 rounded-lg p-3 border border-india-saffron/30">
                  <span className="text-xs text-india-saffron_hover font-black uppercase tracking-wider block mb-0.5">Recommended Arrival</span>
                  <span className="font-black text-ink text-lg">{getRecommendedArrival(bookedRecord.timeSlot)}</span>
                </div>
              </div>
            </div>

            {/* Officer Contact Box */}
            {(bookedRecord.officerName || bookedRecord.officerContactNumber) && (
              <div className="bg-white rounded-xl p-5 border border-line space-y-3 text-sm shadow-sm">
                <h3 className="font-black text-ink flex items-center gap-2 text-xs uppercase tracking-wider border-b border-line pb-2">
                  <span>👨‍💼</span>
                  <span>{t('contact.officerSection', 'Centre Contact')}</span>
                </h3>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="text-xs text-muted block">{t('contact.centreOfficer', 'Officer')}</span>
                    <strong className="font-bold text-ink">{bookedRecord.officerName || '—'}</strong>
                    {bookedRecord.officerContactNumber && (
                      <span className="text-muted block text-xs mt-0.5">{bookedRecord.officerContactNumber}</span>
                    )}
                  </div>
                  {bookedRecord.officerContactNumber && (
                    <a
                      href={`tel:${bookedRecord.officerContactNumber.replace(/\s/g, '')}`}
                      className="bg-india-green hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition active:scale-[0.98]"
                      id="booking-confirmation-call-officer-btn"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{t('contact.callAction', 'Call Centre')}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {(() => {
                const directionsUrl = getGoogleMapsDirectionsUrl(
                  bookedRecord.centreLatitude,
                  bookedRecord.centreLongitude,
                  bookedRecord.centreAddress,
                  bookedRecord.centreName
                );
                return directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-india-green hover:bg-green-700 text-white py-3 rounded-xl text-sm font-black shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{t('location.getDirections', 'Get Directions')}</span>
                  </a>
                ) : null;
              })()}

              <button
                onClick={() => setShowTokenModal(true)}
                className="flex-1 bg-paper hover:bg-gray-100 text-ink border border-line py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <QrCode className="w-4 h-4" />
                <span>{t('booking.downloadToken', 'View Token')}</span>
              </button>

              <Link
                to="/live-queue"
                className="flex-1 bg-india-saffron hover:bg-india-saffron_hover text-white py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <Activity className="w-4 h-4" />
                <span>{t('booking.viewQueue', 'Live Queue')}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Centre Details Modal */}
      {selectedDetailCentre && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl max-w-md w-full p-6 border border-line space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  {t('location.centreDetailsTitle')}
                </span>
                <h3 className="text-lg font-bold text-ink">{selectedDetailCentre.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDetailCentre(null)}
                className="p-1 text-muted hover:text-ink rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-ink">
              <div>
                <span className="text-muted block uppercase font-bold text-[10px]">Address</span>
                <p className="font-semibold text-ink">{selectedDetailCentre.address}</p>
              </div>

              {selectedDetailCentre.distanceKm !== undefined && selectedDetailCentre.distanceKm !== null && (
                <div>
                  <span className="text-muted block uppercase font-bold text-[10px]">Distance</span>
                  <p className="font-bold text-india-green">{selectedDetailCentre.distanceKm} km away</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 bg-paper p-3 rounded border border-line">
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">Operating Hours</span>
                  <span className="font-bold text-ink">{selectedDetailCentre.openingTime} – {selectedDetailCentre.closingTime}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">Today's Queue</span>
                  <span className="font-bold text-india-saffron">{selectedDetailCentre.todayQueueCount || 8} Farmers</span>
                </div>
              </div>

              {selectedDetailCentre.phoneNumber && (
                <div>
                  <span className="text-muted block uppercase font-bold text-[10px]">Phone Number</span>
                  <p className="font-mono font-bold text-ink">{selectedDetailCentre.phoneNumber}</p>
                </div>
              )}

              <div>
                <span className="text-muted block uppercase font-bold text-[10px] mb-1">Supported Crops</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedDetailCentre.supportedCrops || ['Paddy', 'Wheat', 'Maize', 'Groundnut', 'Cotton', 'Onion']).map((crop) => (
                    <span key={crop} className="bg-paper text-ink px-2 py-0.5 rounded text-[11px] font-semibold border border-line">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-line">
              <button
                onClick={() => {
                  setSelectedCentreId(selectedDetailCentre.id);
                  setSelectedDetailCentre(null);
                }}
                className="flex-1 bg-india-green hover:bg-green-700 text-white py-2.5 rounded font-bold text-xs shadow-sm transition"
              >
                {t('location.selectCentre')}
              </button>

              {(() => {
                const modalDirectionsUrl = getGoogleMapsDirectionsUrl(
                  selectedDetailCentre.latitude,
                  selectedDetailCentre.longitude,
                  selectedDetailCentre.address,
                  selectedDetailCentre.name
                );
                return modalDirectionsUrl ? (
                  <a
                    href={modalDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-paper hover:bg-gray-100 text-ink border border-line py-2.5 px-4 rounded font-bold text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Directions</span>
                  </a>
                ) : null;
              })()}
            </div>
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
