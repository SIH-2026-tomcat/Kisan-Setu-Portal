import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { LateArrivalModal } from '../components/LateArrivalModal';
import {
  Activity,
  UserCheck,
  CheckCircle,
  Clock,
  Phone,
  RefreshCw,
  Megaphone,
  AlertCircle,
  Building,
  Calendar,
  Sparkles,
  Wifi,
  PauseCircle,
  RotateCcw,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const OfficerQueue: React.FC = () => {
  const { t } = useTranslation();
  const { officer } = useAuth();
  const { showSuccess, showError, showSMS } = useToast();

  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [currentlyServing, setCurrentlyServing] = useState('A-036');
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('');
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [selectedCentreId, setSelectedCentreId] = useState(officer?.centreId || 'centre-guntur-01');
  const [centres, setCentres] = useState<any[]>([]);

  // On-hold confirmation & Reassignment Modal state
  const [holdConfirmItem, setHoldConfirmItem] = useState<any | null>(null);
  const [lateArrivalBookingId, setLateArrivalBookingId] = useState<string | null>(null);
  const [holdLoading, setHoldLoading] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await api.getOfficerQueue({
        date: selectedDate,
        centreId: selectedCentreId,
      });
      if (res.success && res.queue) {
        setQueueItems(res.queue);
        setCurrentlyServing(res.currentlyServing || 'A-001');
        if (res.centres?.length > 0) {
          setCentres(res.centres);
        }
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('OfficerQueue error:', err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [selectedDate, selectedCentreId]);

  const handleCallNext = async () => {
    setLoading(true);
    try {
      const res = await api.callNextFarmer({ centreId: selectedCentreId });
      if (res.success) {
        setCurrentlyServing(res.currentlyServing);
        showSuccess(
          'Queue Advanced',
          `Now Serving: Token ${res.currentlyServing} (${res.calledFarmer || 'Next Farmer'})`
        );
        fetchQueue();
      } else {
        showError('Action Failed', res.message || 'Could not advance queue.');
      }
    } catch {
      showError('Error', 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkArrived = async (bookingId: string) => {
    try {
      const res = await api.markFarmerArrived(bookingId);
      if (res.success) {
        showSuccess('Arrival Recorded', 'Farmer arrival recorded successfully.');
        fetchQueue();
      }
    } catch {
      showError('Error', 'Failed to mark arrival.');
    }
  };

  const handleConfirmHold = async () => {
    if (!holdConfirmItem) return;
    setHoldLoading(true);
    try {
      const res = await api.holdBooking(holdConfirmItem.id);
      if (res.success) {
        showSuccess('Placed On Hold', `${holdConfirmItem.farmerName} (Token ${holdConfirmItem.tokenNumber}) placed on hold.`);
        showSMS(
          `Kisan Setu: Your scheduled slot was missed. Token ${holdConfirmItem.tokenNumber} placed ON HOLD. Please report to centre counter.`,
          holdConfirmItem.mobileNumber
        );
        setHoldConfirmItem(null);
        fetchQueue();
      } else {
        showError('Hold Failed', res.message || 'Could not place booking on hold.');
      }
    } catch {
      showError('Error', 'Server error while placing on hold.');
    } finally {
      setHoldLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Active Connection Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-navy-900 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Wifi className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-sm font-bold tracking-wide text-emerald-300 uppercase">
                {t('officer.activeConnection')}
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              {t('officer.connectionDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/30 text-emerald-300 font-mono">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{t('officer.liveSync')}: {lastRefreshed || 'Connecting...'}</span>
        </div>
      </div>

      {/* Header & Main Call Action */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-amber-600 animate-pulse" />
              <h1 className="text-2xl font-bold text-navy-900">{t('officer.queueManager')}</h1>
            </div>
            <p className="text-xs text-slate-500">
              {t('officer.farmerSlotsTitle')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-navy-50 border-2 border-navy-800 px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] font-bold text-navy-800 uppercase block">{t('officer.activeToken')}</span>
              <span className="text-2xl font-black text-navy-900">{currentlyServing}</span>
            </div>

            <button
              onClick={handleCallNext}
              disabled={loading}
              className="bg-agri-700 hover:bg-agri-800 disabled:bg-slate-300 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition"
            >
              <Megaphone className="w-5 h-5" />
              <span>{loading ? t('officer.advancing') : t('officer.callNext')}</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Centre Switcher & Date Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            {/* Centre Selector */}
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-navy-800" />
              <span className="text-xs font-bold text-slate-700">{t('officer.centre')}:</span>
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-navy-900 focus:bg-white focus:border-navy-800"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-navy-800" />
              <span className="text-xs font-bold text-slate-700">{t('officer.dateFilter')}:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-navy-900 focus:bg-white focus:border-navy-800"
              >
                <option value="ALL">{t('officer.allDates')}</option>
                <option value={new Date().toISOString().split('T')[0]}>
                  {t('officer.today')} ({new Date().toISOString().split('T')[0]})
                </option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {t('officer.totalSlots')}: <strong className="text-navy-900 font-bold">{queueItems.length}</strong>
          </div>
        </div>
      </div>

      {/* Queue & Farmer Created Slots Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-navy-900">
              {t('officer.farmerSlotsTitle')}
            </h3>
          </div>
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{t('officer.liveSync')}</span>
          </span>
        </div>

        {queueItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">{t('officer.noSlotsMsg')}</p>
            <p className="text-xs">{t('officer.noSlotsSub')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">{t('officer.token')}</th>
                  <th className="px-4 py-3">{t('officer.farmerDetails')}</th>
                  <th className="px-4 py-3">{t('officer.produceQty')}</th>
                  <th className="px-4 py-3">{t('officer.slotDateTime')}</th>
                  <th className="px-4 py-3">{t('officer.yardStatus')}</th>
                  <th className="px-4 py-3">{t('officer.procurementStatus')}</th>
                  <th className="px-4 py-3 text-right">{t('officer.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {queueItems.map((item) => {
                  const isServing = item.tokenNumber === currentlyServing;
                  const isRecent =
                    new Date().getTime() - new Date(item.createdAt).getTime() < 300000;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition ${
                        isServing ? 'bg-amber-50/80 font-semibold' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-sm">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg ${
                              isServing ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {item.tokenNumber}
                          </span>
                          {isRecent && (
                            <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">
                              {t('officer.newBadge')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                          Ref: {item.bookingReference}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{item.farmerName}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active Connection"></span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          +91-{item.mobileNumber} • {item.aadhaarMasked}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800">{item.cropType}</span>
                        <span className="text-slate-500 block">{item.expectedQuantity} Quintals</span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className="font-bold text-navy-800 block">{item.date}</span>
                        <span className="text-slate-600">{item.timeSlot}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isServing
                              ? 'bg-emerald-600 text-white'
                              : item.bookingStatus === 'ON_HOLD'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : item.bookingStatus === 'REASSIGNED'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : item.bookingStatus === 'ARRIVED'
                              ? 'bg-blue-100 text-blue-800'
                              : item.bookingStatus === 'COMPLETED'
                              ? 'bg-slate-200 text-slate-700'
                              : item.bookingStatus === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isServing
                            ? t('officer.nowServing')
                            : item.bookingStatus === 'ON_HOLD'
                            ? 'ON HOLD'
                            : item.bookingStatus === 'REASSIGNED'
                            ? 'REASSIGNED'
                            : item.bookingStatus}
                        </span>
                        {item.bookingStatus === 'REASSIGNED' && item.originalTokenNumber && item.originalTokenNumber !== item.tokenNumber && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Prev Token: {item.originalTokenNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-slate-600">
                          {item.procurement?.status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {(item.bookingStatus === 'BOOKED' || item.bookingStatus === 'REASSIGNED') && (
                            <button
                              onClick={() => handleMarkArrived(item.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow-sm"
                            >
                              {t('officer.markArrived')}
                            </button>
                          )}

                          {item.bookingStatus === 'BOOKED' && !isServing && (
                            <button
                              onClick={() => setHoldConfirmItem(item)}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow-sm flex items-center gap-1"
                              title="Farmer has not arrived during their slot"
                            >
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>{t('officer.markOnHold')}</span>
                            </button>
                          )}

                          {item.bookingStatus === 'ON_HOLD' && (
                            <button
                              onClick={() => setLateArrivalBookingId(item.id)}
                              className="bg-navy-800 hover:bg-navy-900 text-white px-3 py-1 rounded-lg text-[11px] font-bold transition shadow-sm flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                              <span>Reassign / Check Slots</span>
                            </button>
                          )}

                          {isServing && (
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{t('officer.activeCounter')}</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MARK ON HOLD CONFIRMATION MODAL */}
      {holdConfirmItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-navy-900">
                  {t('officer.markOnHoldConfirmTitle')}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Token: {holdConfirmItem.tokenNumber} • Ref: {holdConfirmItem.bookingReference}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <p>
                <strong>{holdConfirmItem.farmerName}</strong> has not arrived for their scheduled slot (<strong>{holdConfirmItem.timeSlot}</strong>).
              </p>
              <p className="text-slate-500">
                Placing this booking on hold will remove the farmer from blocking the live queue so you can continue serving subsequent waiting farmers without delay.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHoldConfirmItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={holdLoading}
                onClick={handleConfirmHold}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5"
              >
                <PauseCircle className="w-4 h-4" />
                <span>{holdLoading ? 'Holding...' : 'Place On Hold'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LATE ARRIVAL & REASSIGNMENT MODAL */}
      {lateArrivalBookingId && (
        <LateArrivalModal
          bookingId={lateArrivalBookingId}
          onClose={() => setLateArrivalBookingId(null)}
          onSuccess={() => {
            fetchQueue();
          }}
        />
      )}
    </div>
  );
};
