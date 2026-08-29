import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { Booking } from '../types';
import { DigitalTokenModal } from '../components/DigitalTokenModal';
import { FileText, Calendar, Building, QrCode, Layers, CreditCard } from 'lucide-react';

export const BookingHistory: React.FC = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTokenBooking, setSelectedTokenBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyBookings().then((res) => {
      if (res.success && res.bookings) {
        setBookings(res.bookings);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-navy-800" />
          <h1 className="text-2xl font-bold text-navy-900">Procurement Booking History</h1>
        </div>
        <p className="text-xs text-slate-500">
          Complete log of all past and scheduled procurement appointments
        </p>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-navy-100 text-navy-800 px-2 py-0.5 rounded">
                    {b.tokenNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Ref: {b.bookingReference}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      b.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'ARRIVED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-navy-900">
                  {b.cropType} — {b.expectedQuantity} Quintals
                </h3>
                <p className="text-xs text-slate-600">
                  {b.centreName} • {b.date} ({b.timeSlot})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTokenBooking(b)}
                  className="bg-navy-800 hover:bg-navy-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>View QR Token</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center space-y-3 border border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Booking History Found</h3>
          <p className="text-xs text-slate-500">You have not booked any procurement slots yet.</p>
        </div>
      )}

      {selectedTokenBooking && (
        <DigitalTokenModal
          booking={selectedTokenBooking}
          onClose={() => setSelectedTokenBooking(null)}
        />
      )}
    </div>
  );
};
