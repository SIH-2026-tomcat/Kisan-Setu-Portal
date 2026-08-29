import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wheat, Printer, X, CheckCircle, ShieldCheck, MapPin, Calendar, Clock, Package } from 'lucide-react';
import { Booking } from '../types';

interface DigitalTokenModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const DigitalTokenModal: React.FC<DigitalTokenModalProps> = ({ booking, onClose }) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  // Strictly non-sensitive payload for QR code verification
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
            <span className="font-bold text-base tracking-wide">Kisan Setu Digital Token</span>
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
            <h3 className="text-xl font-black text-navy-900 uppercase">Digital Procurement Token</h3>
            <p className="text-xs text-slate-500 font-mono">Ref: {booking.bookingReference}</p>
          </div>

          {/* Token Highlight Box */}
          <div className="bg-navy-50 border-2 border-navy-800 rounded-xl p-4 text-center">
            <div className="text-xs font-semibold text-navy-700 uppercase tracking-wider">Your Queue Token</div>
            <div className="text-4xl font-black text-navy-900 my-1 tracking-wider">{booking.tokenNumber}</div>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Status: {booking.status}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5 text-navy-800" />
                <span>Centre</span>
              </div>
              <p className="font-semibold text-slate-800 leading-tight">{booking.centreName}</p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5 text-navy-800" />
                <span>Reporting Date</span>
              </div>
              <p className="font-semibold text-slate-800">{booking.date}</p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-navy-800" />
                <span>Slot Window</span>
              </div>
              <p className="font-semibold text-slate-800">{booking.timeSlot}</p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 mb-1">
                <Package className="w-3.5 h-3.5 text-navy-800" />
                <span>Produce & Quantity</span>
              </div>
              <p className="font-semibold text-slate-800">
                {booking.cropType} — {booking.expectedQuantity} Q
              </p>
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

          {/* Advisory */}
          <div className="text-[11px] text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200 leading-tight text-center">
            ⚠️ Please arrive approximately 15 minutes before your scheduled slot window. Bring your produce and identity proof.
          </div>
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
