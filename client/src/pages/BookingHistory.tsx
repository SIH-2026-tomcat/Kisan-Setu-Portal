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
      <div className="border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-india-green" />
          <h1 className="text-2xl font-bold text-ink">Procurement Booking History</h1>
        </div>
        <p className="text-xs text-muted">
          Complete log of all past and scheduled procurement appointments
        </p>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded p-5 border border-line shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-green-50 text-india-green px-2 py-0.5 rounded">
                    {b.tokenNumber}
                  </span>
                  <span className="text-xs text-muted font-mono">Ref: {b.bookingReference}</span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase ${
                      b.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : b.status === 'ON_HOLD'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : b.status === 'REASSIGNED'
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : b.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : b.status === 'ARRIVED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-paper border border-line text-ink'
                    }`}
                  >
                    {b.status === 'ON_HOLD' ? 'MISSED / ON HOLD' : b.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-ink">
                  {b.cropType} — {b.expectedQuantity} {b.quantityUnit === 'kg' ? 'kg' : 'Quintals'}
                </h3>
                <p className="text-xs text-muted">
                  {b.centreName} • {b.date} ({b.timeSlot})
                </p>
                {b.originalTokenNumber && b.originalTokenNumber !== b.tokenNumber && (
                  <p className="text-[11px] text-purple-700 font-medium">
                    Reassigned from Original Token: {b.originalTokenNumber}
                  </p>
                )}
                {b.cancellationReason && (
                  <p className="text-[11px] text-red-600 font-medium">
                    Cancellation Reason: {b.cancellationReason.replace(/_/g, ' ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {b.status !== 'CANCELLED' && (
                  <button
                    onClick={() => setSelectedTokenBooking(b)}
                    className="bg-india-green hover:bg-green-700 text-white px-3.5 py-2 rounded text-xs font-bold flex items-center gap-1.5 shadow transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR Token</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded p-12 text-center space-y-3 border border-line">
          <Calendar className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No Booking History Found</h3>
          <p className="text-xs text-muted">You have not booked any procurement slots yet.</p>
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
