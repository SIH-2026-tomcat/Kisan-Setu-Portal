import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { QueueData, Booking } from '../types';
import { calculateHaversineDistance, getGoogleMapsDirectionsUrl } from '../utils/location';
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
  Navigation,
} from 'lucide-react';

export const LiveQueue: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useAuth();
  const { userLocation } = useLocation();
  const { showSMS } = useToast();

  const [centreId, setCentreId] = useState('centre-guntur-01');
  const [tokenNumber, setTokenNumber] = useState('A-042');
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [prevServing, setPrevServing] = useState<string>('');
  const [officerName, setOfficerName] = useState<string | null>(null);
  const [officerContactNumber, setOfficerContactNumber] = useState<string | null>(null);

  // Load farmer's active booking if available
  useEffect(() => {
    api.getMyBookings().then((res) => {
      if (res.success && res.bookings?.length > 0) {
        const booking = res.bookings[0];
        setTokenNumber(booking.tokenNumber);
        setCentreId(booking.centreId);
        setOfficerName(booking.officerName || null);
        setOfficerContactNumber(booking.officerContactNumber || null);
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

  // Calculate distance & directions URL for centre
  const distanceKm =
    userLocation && queueData?.centre?.latitude && queueData?.centre?.longitude
      ? calculateHaversineDistance(
          userLocation.lat,
          userLocation.lng,
          queueData.centre.latitude,
          queueData.centre.longitude
        )
      : null;

  const directionsUrl = getGoogleMapsDirectionsUrl(
    queueData?.centre?.latitude,
    queueData?.centre?.longitude,
    queueData?.centre?.address,
    queueData?.centre?.name
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-india-green rounded-xl flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-ink">{t('queue.title', 'Live Queue Status')}</h1>
            <span className="hidden sm:flex bg-green-100 text-green-800 text-[11px] font-bold px-2.5 py-1 rounded-full items-center gap-1.5 border border-green-300">
              <span className="w-2 h-2 rounded-full bg-india-green animate-ping" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-muted mt-1">Real-time queue sync with procurement counter</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-green-800 bg-green-50 px-4 py-2 rounded-full border border-green-200 font-bold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-green-700" />
          <span>{lastRefreshed ? `Synced ${lastRefreshed}` : 'Connecting...'}</span>
        </div>
      </div>

      {/* Turn Approaching Alert */}
      {queueData && queueData.farmersAhead <= 3 && (
        <div className="p-4 rounded-2xl bg-india-saffron text-white font-black text-sm shadow-lg flex items-center gap-3 animate-pulse border border-amber-600">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <div>{t('location.yourTurnApproaching', 'YOUR TURN IS APPROACHING!')}</div>
            <div className="text-xs font-medium opacity-90 mt-0.5">Please proceed to the procurement counter immediately.</div>
          </div>
        </div>
      )}

      {/* Centre Card + Directions */}
      {queueData && (
        <div className="bg-white rounded-2xl border border-line shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0 border border-green-200">
              <Building className="w-5 h-5 text-india-green" />
            </div>
            <div>
              <h3 className="font-black text-ink">{queueData.centre.name}</h3>
              <p className="text-xs text-muted mt-0.5">{queueData.centre.address}</p>
              {distanceKm !== null && (
                <p className="text-xs font-bold text-india-green mt-1">📍 {distanceKm} km from your location</p>
              )}
            </div>
          </div>
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-india-green hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow transition active:scale-[0.98] flex items-center gap-1.5 shrink-0"
            >
              <Navigation className="w-4 h-4" />
              <span>{t('location.getDirections', 'Get Directions')}</span>
            </a>
          )}
        </div>
      )}

      {/* KPI Token Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* My Token */}
        <div className="bg-white rounded-2xl border-2 border-india-saffron p-5 text-center shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-india-saffron">{t('queue.yourToken', 'Your Token')}</span>
          <div className="text-3xl sm:text-4xl font-black text-ink">{tokenNumber}</div>
          <span className="text-[10px] text-muted block font-semibold">Your Booked Turn</span>
        </div>

        {/* Currently Serving */}
        <div className="bg-india-green rounded-2xl p-5 text-center shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-green-200">{t('queue.currentlyServing', 'Serving Now')}</span>
          <div className="text-3xl sm:text-4xl font-black text-white">{queueData?.currentlyServing || '—'}</div>
          <span className="text-[10px] text-green-200 block font-bold flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping inline-block" />
            At Counter
          </span>
        </div>

        {/* Farmers Ahead */}
        <div className="bg-white rounded-2xl border border-line p-5 text-center shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">{t('queue.farmersAhead', 'Farmers Ahead')}</span>
          <div className="text-3xl sm:text-4xl font-black text-india-saffron">
            {queueData ? queueData.farmersAhead : '—'}
          </div>
          <span className="text-[10px] text-muted block">Ahead in Line</span>
        </div>

        {/* Estimated Wait */}
        <div className="bg-white rounded-2xl border border-line p-5 text-center shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">{t('queue.estimatedWait', 'Est. Wait')}</span>
          <div className="text-2xl sm:text-3xl font-black text-ink">
            ~{queueData ? queueData.estimatedWaitMinutes : '—'} min
          </div>
          <span className="text-[10px] text-muted block">
            By {queueData?.expectedTurnTime || '—'}
          </span>
        </div>
      </div>

      {/* Officer Contact Card */}
      <div className="bg-white rounded-2xl border border-line shadow-sm p-5">
        <h3 className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-2 mb-3 border-b border-line pb-2">
          <span>📞</span>
          <span>{t('contact.needHelp', 'Need Help? Contact Centre')}</span>
        </h3>
        {officerName || officerContactNumber ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs text-muted">{t('contact.centreOfficer', 'Centre Officer')}</div>
              <div className="font-black text-ink text-base">{officerName || '—'}</div>
              {officerContactNumber && <div className="text-sm text-muted font-medium">{officerContactNumber}</div>}
            </div>
            {officerContactNumber && (
              <a
                href={`tel:${officerContactNumber.replace(/\s/g, '')}`}
                className="bg-india-green hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow transition active:scale-[0.98]"
                id="live-queue-call-officer-btn"
              >
                <span>📞</span>
                <span>{t('contact.callAction', 'Call Centre')}</span>
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted">{t('contact.contactUnavailable', 'Contact information is currently unavailable.')}</p>
        )}
      </div>

      {/* Visual Token Queue Chain */}
      <div className="bg-white rounded-2xl border border-line shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-black text-ink flex items-center gap-2">
            <Users className="w-5 h-5 text-india-green" />
            <span>{t('queue.queueList', 'Queue Overview')}</span>
          </h3>
          <span className="text-xs text-muted bg-paper px-3 py-1 rounded-full border border-line font-medium">~4 min / farmer</span>
        </div>

        {/* Horizontal Tokens Visualizer */}
        <div className="flex items-end gap-2 overflow-x-auto pb-2 pt-1 snap-x">
          {queueData?.queueList?.map((item, idx) => {
            const isMe = item.tokenNumber === tokenNumber;
            const isServing = item.isCurrentlyServing;

            return (
              <div
                key={idx}
                className={`min-w-[110px] p-3 rounded-xl border-2 text-center shrink-0 transition snap-start ${
                  isServing
                    ? 'border-india-green bg-india-green text-white shadow-md scale-105'
                    : isMe
                    ? 'border-india-saffron bg-amber-50 text-ink shadow-sm scale-[1.02]'
                    : item.status === 'On Hold'
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : item.status === 'Reassigned'
                    ? 'border-purple-300 bg-purple-50 text-purple-900'
                    : item.status === 'Cancelled'
                    ? 'border-red-200 bg-red-50 text-red-700 opacity-60'
                    : 'border-line bg-paper text-muted'
                }`}
              >
                <div className={`text-[9px] uppercase font-black tracking-widest mb-1 ${isServing ? 'text-green-100' : ''}`}>
                  {isServing ? '▶ NOW' : isMe ? '★ YOU' : item.status === 'On Hold' ? 'HOLD' : `#${idx + 1}`}
                </div>
                <div className={`text-base font-black tracking-wide ${isServing ? 'text-white' : 'text-ink'}`}>{item.tokenNumber}</div>
                <div className={`text-[10px] font-semibold truncate mt-0.5 ${isServing ? 'text-green-100' : 'text-muted'}`}>{item.farmerName}</div>
              </div>
            );
          })}
        </div>

        {/* Table of today's bookings */}
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-xs text-left text-ink">
            <thead className="bg-paper text-muted uppercase font-black border-b border-line text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Produce</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {queueData?.queueList?.map((q, idx) => (
                <tr
                  key={idx}
                  className={`transition hover:bg-paper/60 ${
                    q.tokenNumber === tokenNumber
                      ? 'bg-amber-50/70 font-bold'
                      : q.isCurrentlyServing
                      ? 'bg-green-50/70 text-green-900 font-semibold'
                      : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-black">
                    <span>{q.tokenNumber}</span>
                    {q.tokenNumber === tokenNumber && (
                      <span className="ml-1 text-[9px] bg-india-saffron text-white px-1.5 py-0.5 rounded font-black">YOU</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{q.farmerName}</td>
                  <td className="px-4 py-3">{q.cropType} — {q.quantity} {q.quantityUnit === 'kg' ? 'kg' : 'Q'}</td>
                  <td className="px-4 py-3 font-medium">{q.timeSlot}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        q.isCurrentlyServing
                          ? 'bg-india-green text-white'
                          : q.status === 'On Hold'
                          ? 'bg-amber-100 text-amber-900'
                          : q.status === 'Reassigned'
                          ? 'bg-purple-100 text-purple-900'
                          : q.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : q.status === 'Completed'
                          ? 'bg-gray-200 text-gray-600'
                          : q.status === 'Arrived'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.isCurrentlyServing ? '● Serving' : q.status}
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

