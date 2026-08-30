import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { Wheat, Printer, X, CheckCircle, ShieldCheck, MapPin, Calendar, Clock, Package, Navigation } from 'lucide-react';
import { Booking } from '../types';
import { getGoogleMapsDirectionsUrl } from '../utils/location';

interface DigitalTokenModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const DigitalTokenModal: React.FC<DigitalTokenModalProps> = ({ booking, onClose }) => {
  const { t } = useTranslation();
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const directionsUrl = getGoogleMapsDirectionsUrl(
    booking.centreLatitude,
    booking.centreLongitude,
    booking.centreAddress,
    booking.centreName
  );

  // Calculate recommended arrival time (15 mins prior)
  const calculateRecommendedArrival = (slot: string) => {
    try {
      const startTime = slot.split('–')[0]?.trim() || slot.split('-')[0]?.trim();
      if (!startTime) return '15 mins before slot';
      const [hoursStr, minutesStr] = startTime.split(':');
      let hours = parseInt(hoursStr, 10);
      let mins = parseInt(minutesStr || '0', 10);
      mins -= 15;
      if (mins < 0) {
        mins += 60;
        hours -= 1;
      }
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
    } catch {
      return '15 mins before slot';
    }
  };

  // Strictly non-sensitive payload for QR code verification (no farmer GPS stored)
  const qrPayload = booking.qrData || JSON.stringify({
    bookingReference: booking.bookingReference,
    tokenNumber: booking.tokenNumber,
    centreId: booking.centreId,
    cropType: booking.cropType,
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="bg-navy-800 text-white p-4 flex items-center justify-between border-b border-navy-900">
          <div className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-amber-300" />
            <span className="font-bold text-base tracking-wide">{t('brand.name')} Digital Token</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-navy-700"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div id="printable-token" className="p-6 overflow-y-auto space-y-5 bg-white text-slate-800">
          {/* Header of Token */}
          <div className="border-b-2 border-dashed border-slate-300 pb-4 text-center">
            <div className="text-xs uppercase tracking-widest text-navy-800 font-bold mb-1">
              Government Public Service Utility
            </div>
            <h3 className="text-xl font-black text-navy-900 uppercase">DIGITAL PROCUREMENT TOKEN</h3>
            <p className="text-xs text-slate-500 font-mono">Ref: {booking.bookingReference}</p>
          </div>

          {/* Token Highlight Box */}
          <div className="bg-navy-50 border-2 border-navy-800 rounded-xl p-4 text-center">
            <div className="text-xs font-semibold text-navy-700 uppercase tracking-wider">{t('farmerDashboard.queueToken')}</div>
            <div className="text-4xl font-black text-navy-900 my-1 tracking-wider">{booking.tokenNumber}</div>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Status: {booking.status}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-navy-800" />
                  <span className="font-bold text-navy-900">{t('location.reportingLocation')}</span>
                </div>
              </div>
              <p className="font-bold text-slate-900 text-sm">{booking.centreName}</p>
              {booking.centreAddress && (
                <p className="text-xs text-slate-600 mt-0.5">{booking.centreAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-navy-800" />
                  <span>{t('farmerDashboard.date')}</span>
                </div>
                <p className="font-semibold text-slate-800">{booking.date}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                  <Clock className="w-3.5 h-3.5 text-navy-800" />
                  <span>{t('farmerDashboard.slotTime')}</span>
                </div>
                <p className="font-semibold text-slate-800">{booking.timeSlot}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('location.recommendedArrival')}</span>
                </div>
                <p className="font-bold text-amber-800">
                  {calculateRecommendedArrival(booking.timeSlot)}
                </p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                  <Package className="w-3.5 h-3.5 text-navy-800" />
                  <span>{t('farmerDashboard.produceQty')}</span>
                </div>
                <p className="font-semibold text-slate-800">
                  {booking.cropType} — {booking.expectedQuantity} {booking.quantityUnit === 'kg' ? 'kg' : 'Q'}{' '}
                  <span className="text-slate-400 text-[10px] block">
                    ({booking.quantityUnit === 'kg'
                      ? `≈ ${(booking.expectedQuantity / 100).toFixed(2)} Q`
                      : `≈ ${booking.expectedQuantity * 100} kg`})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <QRCodeSVG value={qrPayload} size={130} level="M" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 text-center font-medium">
              Scan at Procurement Entry Counter for Instant Check-In
            </p>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verifiable Non-Sensitive Security Payload</span>
            </div>
          </div>

          {/* Officer Contact in Token */}
          {(booking.officerName || booking.officerContactNumber) ? (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-navy-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-1.5">
                <span>👨‍💼</span>
                <span>Centre Officer</span>
              </div>
              {booking.officerName && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Officer</span>
                  <span className="font-bold text-slate-800">{booking.officerName}</span>
                </div>
              )}
              {booking.officerContactNumber && (
                <div className="flex justify-between items-center text-xs gap-2 flex-wrap">
                  <div>
                    <span className="text-slate-500 block">Contact</span>
                    <span className="font-bold text-slate-800">{booking.officerContactNumber}</span>
                  </div>
                  <a
                    href={`tel:${booking.officerContactNumber.replace(/\s/g, '')}`}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white py-1.5 px-3 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition"
                    id="digital-token-call-officer-btn"
                  >
                    📞 <span>Call Officer</span>
                  </a>
                </div>
              )}
            </div>
          ) : null}

          {/* Get Directions Link Button under Digital Token */}
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition"
            >
              <Navigation className="w-4 h-4" />
              <span>{t('location.getDirections')}</span>
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-navy-800 hover:bg-navy-900 text-white py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save Token</span>
          </button>
          <button
            onClick={onClose}
            className="bg-white hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl font-semibold text-sm border border-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
