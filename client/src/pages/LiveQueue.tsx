import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { QueueData, Booking } from '../types';
import {
  Activity,
  Users,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
  Building,
} from 'lucide-react';

export const LiveQueue: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useAuth();
  const { showSMS } = useToast();

  const [centreId, setCentreId] = useState('centre-guntur-01');
  const [tokenNumber, setTokenNumber] = useState('A-042');
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [prevServing, setPrevServing] = useState<string>('');

  // Load farmer's active booking if available
  useEffect(() => {
    api.getMyBookings().then((res) => {
      if (res.success && res.bookings?.length > 0) {
        setTokenNumber(res.bookings[0].tokenNumber);
        setCentreId(res.bookings[0].centreId);
      }
    });
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await api.getLiveQueue(centreId, tokenNumber);
      if (res.success && res.queueList) {
        setQueueData(res as unknown as QueueData);
        setLastRefreshed(new Date().toLocaleTimeString());

        // Check if currently serving changed to alert farmer
        if (prevServing && prevServing !== res.currentlyServing) {
          if (res.currentlyServing === tokenNumber) {
            showSMS(
              `Kisan Setu Alert: Token ${tokenNumber} is NOW SERVING at ${res.centre.name}. Report to counter immediately!`,
              farmer?.mobileNumber || '9876543210'
            );
          } else if (res.farmersAhead <= 2) {
            showSMS(
              `Kisan Setu Alert: Your turn is approaching (${res.farmersAhead} farmers ahead). Please proceed to ${res.centre.name}.`,
              farmer?.mobileNumber || '9876543210'
            );
          }
        }
        setPrevServing(res.currentlyServing);
      }
    } catch (err) {
      console.error('Queue polling error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 4 seconds
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 4000);
    return () => clearInterval(interval);
  }, [centreId, tokenNumber, prevServing]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600 animate-pulse" />
            <h1 className="text-2xl font-bold text-navy-900">{t('queue.title')}</h1>
          </div>
          <p className="text-xs text-slate-500">
            Real-time live queue monitoring (synchronizes automatically every 4 seconds)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-navy-800" />
          <span>Last sync: {lastRefreshed || 'Connecting...'}</span>
        </div>
      </div>

      {/* Advisory Banner */}
      {queueData && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-start gap-3 transition-all ${
            queueData.farmersAhead <= 1
              ? 'bg-red-50 border-red-400 text-red-900'
              : queueData.farmersAhead <= 3
              ? 'bg-amber-50 border-amber-400 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="p-2 rounded-xl bg-white/80 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Live Arrival Advisory
            </span>
            <p className="text-sm font-bold">{queueData.advisoryNotice}</p>
            <p className="text-xs opacity-80">
              Centre: {queueData.centre.name} • Address: {queueData.centre.address}
            </p>
          </div>
        </div>
      )}

      {/* Main KPI Queue Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Your Token */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t('queue.yourToken')}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-navy-900">{tokenNumber}</div>
          <span className="text-[10px] text-slate-400 block font-medium">Your Booked Turn</span>
        </div>

        {/* Currently Serving */}
        <div className="bg-navy-50 p-5 rounded-2xl border-2 border-navy-800 shadow-sm text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-800">
            {t('queue.currentlyServing')}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-navy-900">
            {queueData?.currentlyServing || 'A-036'}
          </div>
          <span className="text-[10px] text-emerald-700 block font-bold">● Active at Counter</span>
        </div>

        {/* Farmers Ahead */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t('queue.farmersAhead')}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-amber-600">
            {queueData ? queueData.farmersAhead : 6}
          </div>
          <span className="text-[10px] text-slate-400 block">Ahead in Line</span>
        </div>

        {/* Estimated Wait */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t('queue.estimatedWait')}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">
            ~{queueData ? queueData.estimatedWaitMinutes : 24} min
          </div>
          <span className="text-[10px] text-slate-400 block">
            Expected: {queueData?.expectedTurnTime || '11:15 AM'}
          </span>
        </div>
      </div>

      {/* Visual Token Queue Chain */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-navy-800" />
            <span>{t('queue.queueList')}</span>
          </h3>
          <span className="text-xs text-slate-500">
            Formula: ~4 minutes per farmer inspection
          </span>
        </div>

        {/* Horizontal Tokens Visualizer */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-2">
          {queueData?.queueList?.map((item, idx) => {
            const isMe = item.tokenNumber === tokenNumber;
            const isServing = item.isCurrentlyServing;

            return (
              <div
                key={idx}
                className={`min-w-[120px] p-3 rounded-xl border-2 text-center shrink-0 transition ${
                  isServing
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-200'
                    : isMe
                    ? 'border-navy-800 bg-navy-50 text-navy-900 font-bold shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider mb-1">
                  {isServing ? 'Serving Now' : isMe ? 'YOU' : `Position #${idx + 1}`}
                </div>
                <div className="text-lg font-black tracking-wide">{item.tokenNumber}</div>
                <div className="text-[11px] font-medium truncate mt-0.5">{item.farmerName}</div>
                <div className="text-[10px] opacity-75 mt-0.5">
                  {item.cropType} ({item.quantity} Q)
                </div>
              </div>
            );
          })}
        </div>

        {/* Table of today's bookings in queue */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Farmer Name</th>
                <th className="px-4 py-3">Produce & Qty</th>
                <th className="px-4 py-3">Time Window</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {queueData?.queueList?.map((q, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 ${
                    q.tokenNumber === tokenNumber
                      ? 'bg-navy-50/70 font-bold text-navy-900'
                      : q.isCurrentlyServing
                      ? 'bg-emerald-50/70 text-emerald-900 font-semibold'
                      : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-bold">{q.tokenNumber}</td>
                  <td className="px-4 py-3">
                    {q.farmerName} {q.tokenNumber === tokenNumber && '(You)'}
                  </td>
                  <td className="px-4 py-3">
                    {q.cropType} — {q.quantity} Q
                  </td>
                  <td className="px-4 py-3">{q.timeSlot}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        q.isCurrentlyServing
                          ? 'bg-emerald-600 text-white'
                          : q.status === 'Completed'
                          ? 'bg-slate-200 text-slate-700'
                          : q.status === 'Arrived'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
