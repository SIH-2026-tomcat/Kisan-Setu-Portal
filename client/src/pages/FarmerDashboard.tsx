import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { api } from '../services/api';
import { Booking, NotificationItem } from '../types';
import { DigitalTokenModal } from '../components/DigitalTokenModal';
import { calculateHaversineDistance, getGoogleMapsDirectionsUrl } from '../utils/location';
import { AshokaChakraSVG } from '../components/design/AshokaChakraSVG';
import {
  Wheat,
  Calendar,
  Activity,
  Layers,
  CreditCard,
  QrCode,
  Clock,
  MapPin,
  ArrowRight,
  Bell,
  CheckCircle,
  HelpCircle,
  FileText,
  User,
  Navigation,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useAuth();
  const { userLocation } = useLocation();
  const navigate = useNavigate();

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedTokenBooking, setSelectedTokenBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, notifsRes] = await Promise.all([
        api.getMyBookings(),
        api.getMyNotifications(),
      ]);

      if (bookingsRes.success && bookingsRes.bookings?.length > 0) {
        setActiveBooking(bookingsRes.bookings[0]);
      }
      if (notifsRes.success && notifsRes.notifications) {
        setNotifications(notifsRes.notifications);
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div 
        className="text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-line relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-cover bg-center transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
        style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(21, 128, 61, 0.95) 0%, rgba(21, 128, 61, 0.7) 50%, rgba(21, 128, 61, 0.4) 100%), url("/images/farm_banner.jpg")',
          backgroundBlendMode: 'normal'
        }}
      >
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] bg-white text-india-green px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {t('farmerDashboard.verifiedProfile', 'Verified Profile')}
            </span>
            <span className="text-[10px] bg-white/20 text-white border border-white/20 px-2.5 py-0.5 rounded font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
              <span>{t('farmerDashboard.activeSync', 'Active Sync')}</span>
            </span>
            <span className="text-xs text-green-100 font-mono">
              Aadhaar: {farmer?.aadhaarMasked || 'XXXX XXXX 9012'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('farmerDashboard.welcome', 'Welcome')}, {farmer?.fullName || 'Farmer'}
          </h1>
          <p className="text-xs sm:text-sm text-green-150 flex items-center gap-2 font-medium">
            <MapPin className="w-3.5 h-3.5 text-india-saffron" />
            <span>
              {farmer?.village || 'Guntur Rural'}, {farmer?.district || 'Guntur'} ({farmer?.state || 'Andhra Pradesh'})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10">
          <Link
            to="/book-slot"
            className="bg-india-saffron hover:bg-india-saffron_hover text-white px-5 py-3 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <Calendar className="w-4 h-4" />
            <span>{t('farmerDashboard.bookNewSlot', 'Book New Slot')}</span>
          </Link>
          <Link
            to="/live-queue"
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl font-bold text-xs border border-white/40 flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <Activity className="w-4 h-4" />
            <span>{t('farmerDashboard.viewLiveQueue', 'View Live Queue')}</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Active Booking Card & Quick Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Booking Highlight Card */}
        <div className="lg:col-span-2 bg-white rounded p-6 border border-line shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-india-green" />
              <h2 className="text-base font-bold text-ink">{t('farmerDashboard.nextProcurement', 'Next Procurement Booking')}</h2>
            </div>
            {activeBooking && (
              <span
                className={`text-xs font-bold px-3 py-1 rounded ${
                  activeBooking.status === 'ON_HOLD'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : activeBooking.status === 'REASSIGNED'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : activeBooking.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-green-100 text-green-800 border border-green-300'
                }`}
              >
                {activeBooking.status === 'ON_HOLD'
                  ? 'ON HOLD'
                  : activeBooking.status === 'REASSIGNED'
                  ? 'SLOT REASSIGNED'
                  : activeBooking.status}
              </span>
            )}
          </div>

          {activeBooking ? (
            <div className="space-y-4">
              {/* ON HOLD ALERT BANNER */}
              {activeBooking.status === 'ON_HOLD' && (
                <div className="p-4 bg-amber-50 text-amber-950 rounded border-l-4 border-amber-500 space-y-1 shadow-sm animate-pulse">
                  <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-amber-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{t('farmerDashboard.slotOnHoldTitle', 'Slot On Hold')}</span>
                  </div>
                  <p className="text-xs font-medium">
                    {t('farmerDashboard.slotOnHoldMsg', 'You missed your allotted time slot. Please meet the procurement officer to get reassigned to the queue.')}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Original Slot: <strong>{activeBooking.timeSlot}</strong> ({activeBooking.date})
                  </p>
                </div>
              )}

              {/* REASSIGNED SUCCESS BANNER */}
              {activeBooking.status === 'REASSIGNED' && (
                <div className="p-4 bg-green-50 text-green-900 rounded border-l-4 border-green-600 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span>{t('farmerDashboard.slotReassignedTitle', 'Slot Reassigned')}</span>
                  </div>
                  <p className="text-xs font-medium">
                    {t('farmerDashboard.slotReassignedMsg', 'The officer has reviewed your case and generated a new queue token.')}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-green-800">
                    <span>New Slot: <strong>{activeBooking.timeSlot}</strong></span>
                    <span>•</span>
                    <span>New Token: <strong className="font-mono bg-green-200 px-2 py-0.5 rounded text-green-900">{activeBooking.tokenNumber}</strong></span>
                    {activeBooking.originalTokenNumber && activeBooking.originalTokenNumber !== activeBooking.tokenNumber && (
                      <span className="text-green-700 text-[11px]">(Original: {activeBooking.originalTokenNumber})</span>
                    )}
                  </div>
                </div>
              )}

              {/* CANCELLED NOTICE BANNER */}
              {activeBooking.status === 'CANCELLED' && (
                <div className="p-4 bg-red-50 text-red-900 rounded border-l-4 border-red-500 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-red-800">
                    <XCircle className="w-5 h-5" />
                    <span>{t('farmerDashboard.slotCancelledTitle', 'Slot Cancelled')}</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {t('farmerDashboard.slotCancelledMsg', 'Your slot was cancelled by the procurement officer. You will need to book a new slot for another date.')}
                  </p>
                  {activeBooking.cancellationReason && (
                    <div className="text-[11px] text-red-800 font-medium font-mono">
                      Reason: {activeBooking.cancellationReason.replace(/_/g, ' ')}
                    </div>
                  )}
                  <div className="pt-2">
                    <Link
                      to="/book-slot"
                      className="inline-flex bg-india-green hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded shadow-sm"
                    >
                      Book Another Date
                    </Link>
                  </div>
                </div>
              )}

              {/* Token & Centre Banner */}
              {activeBooking.status !== 'CANCELLED' && (
                <div className="bg-paper rounded p-4 border border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      {t('farmerDashboard.queueToken', 'Queue Token')}
                    </span>
                    <div className="text-3xl font-black text-ink">{activeBooking.tokenNumber}</div>
                    <span className="text-xs text-muted font-mono">
                      {t('booking.bookingRef', 'Ref')}: {activeBooking.bookingReference}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedTokenBooking(activeBooking)}
                    className="bg-india-green hover:bg-green-700 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{t('farmerDashboard.showToken', 'Show Token')}</span>
                  </button>
                </div>
              )}

              {/* Booking Details Grid */}
              {(() => {
                const distanceKm =
                  userLocation && activeBooking.centreLatitude && activeBooking.centreLongitude
                    ? calculateHaversineDistance(
                        userLocation.lat,
                        userLocation.lng,
                        activeBooking.centreLatitude,
                        activeBooking.centreLongitude
                      )
                    : null;

                const directionsUrl = getGoogleMapsDirectionsUrl(
                  activeBooking.centreLatitude,
                  activeBooking.centreLongitude,
                  activeBooking.centreAddress,
                  activeBooking.centreName
                );

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-white rounded border border-line">
                        <span className="text-muted block mb-0.5">{t('farmerDashboard.centre', 'Centre')}</span>
                        <span className="font-bold text-ink block truncate">{activeBooking.centreName}</span>
                        {distanceKm !== null && (
                          <span className="text-[11px] font-bold text-india-green block mt-0.5">
                            📍 {distanceKm} km away
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded border border-line">
                        <span className="text-muted block mb-0.5">{t('farmerDashboard.date', 'Date')}</span>
                        <span className="font-bold text-ink block">{activeBooking.date}</span>
                      </div>

                      <div className="p-3 bg-white rounded border border-line">
                        <span className="text-muted block mb-0.5">{t('farmerDashboard.slotTime', 'Time Slot')}</span>
                        <span className="font-bold text-ink block">{activeBooking.timeSlot}</span>
                      </div>

                      <div className="p-3 bg-white rounded border border-line">
                        <span className="text-muted block mb-0.5">{t('farmerDashboard.produceQty', 'Produce & Qty')}</span>
                        <span className="font-bold text-ink block">
                          {activeBooking.cropType} — {activeBooking.expectedQuantity} {activeBooking.quantityUnit === 'kg' ? 'kg' : 'Q'}
                        </span>
                        {activeBooking.dualQuantityDisplay ? (
                          <span className="text-[10px] text-muted block mt-0.5">
                            {activeBooking.dualQuantityDisplay}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted block mt-0.5">
                            {activeBooking.quantityUnit === 'kg'
                              ? `≈ ${(activeBooking.expectedQuantity / 100).toFixed(2)} Q`
                              : `≈ ${activeBooking.expectedQuantity * 100} kg`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Officer Contact Row */}
                    {(activeBooking.officerName || activeBooking.officerContactNumber) && (
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded border border-line p-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">👨‍💼</span>
                          <div>
                            <span className="text-muted block">{t('contact.centreOfficer')}</span>
                            <strong className="font-bold text-ink">{activeBooking.officerName || '—'}</strong>
                            {activeBooking.officerContactNumber && (
                              <span className="text-muted block mt-0.5">{activeBooking.officerContactNumber}</span>
                            )}
                          </div>
                        </div>
                        {activeBooking.officerContactNumber && (
                          <a
                            href={`tel:${activeBooking.officerContactNumber.replace(/\s/g, '')}`}
                            className="bg-india-green hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                            id="dashboard-call-officer-btn"
                          >
                            📞 <span>{t('contact.callAction')}</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Status Action Links including Get Directions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link
                        to="/live-queue"
                        className="flex-1 bg-paper hover:bg-gray-100 border border-line text-ink p-2.5 rounded text-xs font-bold text-center transition flex items-center justify-center gap-1"
                      >
                        <Activity className="w-3.5 h-3.5 text-india-green" />
                        <span>{t('farmerDashboard.trackQueue', 'Track Live Queue')}</span>
                      </Link>

                      {directionsUrl ? (
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-india-green hover:bg-green-700 text-white p-2.5 rounded text-xs font-bold text-center transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>{t('location.getDirections', 'Get Directions')}</span>
                        </a>
                      ) : (
                        <span className="flex-1 bg-paper border border-line text-muted p-2.5 rounded text-xs font-semibold text-center">
                          Location Pending
                        </span>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <Calendar className="w-10 h-10 text-muted mx-auto opacity-50" />
              <p className="text-sm font-semibold text-muted">{t('farmerDashboard.noActiveBooking', 'No active bookings.')}</p>
              <Link
                to="/book-slot"
                className="inline-flex bg-india-green hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded shadow-sm"
              >
                {t('farmerDashboard.bookNewSlot', 'Book New Slot')}
              </Link>
            </div>
          )}
        </div>

        {/* Live Status Cards & Notifications */}
        <div className="space-y-6">
          {/* Quick Notifications Widget */}
          <div className="bg-white rounded p-5 border border-line shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-ink" />
                <h3 className="text-sm font-bold text-ink">{t('farmerDashboard.serviceUpdates', 'Service Updates')}</h3>
              </div>
              <span className="text-[10px] bg-paper text-ink px-2 py-0.5 rounded border border-line font-medium">
                {notifications.length} Alerts
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {notifications.length > 0 ? (
                notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded bg-paper border border-line text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{n.title}</span>
                      <span className="text-[10px] text-muted">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-muted text-[11px] leading-tight">{n.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted text-center py-4">{t('farmerDashboard.noNotifs', 'No new notifications.')}</p>
              )}
            </div>
          </div>

          {/* Direct Bank Account Card */}
          <div className="bg-white rounded p-5 border border-line shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <CreditCard className="w-4 h-4 text-india-green" />
              <h3 className="text-sm font-bold text-ink">{t('farmerDashboard.directDeposit', 'Direct Deposit Info')}</h3>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted">
                <span>{t('farmerDashboard.linkedAccount', 'Linked Account')}:</span>
                <span className="font-mono font-bold text-ink">XXXX XXXX 4582</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{t('farmerDashboard.paymentMode', 'Payment Mode')}:</span>
                <span className="font-semibold text-ink">Direct Bank / PFMS</span>
              </div>
            </div>
            <Link
              to="/payment-status"
              className="block text-center text-xs font-bold text-india-green hover:underline pt-1"
            >
              {t('farmerDashboard.viewPaymentHistory', 'View Payment History →')}
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Services Navigation */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-ink">{t('farmerDashboard.quickServices', 'Quick Services')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('nav.bookSlot', 'Book Slot'), sub: 'Reserve your procurement slot', link: '/book-slot', icon: Calendar },
            { label: t('nav.myBooking', 'My Booking'), sub: 'View or manage active bookings', link: '/dashboard', icon: QrCode },
            { label: t('nav.liveQueue', 'Live Queue'), sub: 'Monitor real-time center queues', link: '/live-queue', icon: Clock },
            { label: t('nav.trackProcurement', 'Procurement Status'), sub: 'Track weights and quality grading', link: '/track-procurement', icon: Layers },
            { label: t('nav.paymentStatus', 'Payment Status'), sub: 'Track direct bank deposits', link: '/payment-status', icon: CreditCard },
            { label: 'Find Centre', sub: 'Locate nearby centres & directions', link: '/book-slot', icon: MapPin },
            { label: 'Notifications', sub: 'Check latest updates & alerts', link: '/dashboard', icon: Bell },
            { 
              label: 'Kisan Mitra', 
              sub: 'Ask questions or get support', 
              link: '#', 
              icon: HelpCircle,
              onClick: (e: any) => {
                e.preventDefault();
                const chatbotBtn = document.getElementById('kisan-mitra-open-btn');
                if (chatbotBtn) {
                  chatbotBtn.click();
                }
              }
            },
          ].map((item, idx) => {
            const cardContent = (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-india-green group-hover:bg-india-green group-hover:text-white transition-all duration-300 shrink-0 shadow-sm group-hover:shadow">
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-ink group-hover:text-india-green transition-colors duration-300 flex items-center justify-between">
                    <span>{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-india-green opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </h4>
                  <p className="text-xs text-muted truncate mt-0.5 font-medium">{item.sub}</p>
                </div>
              </>
            );

            if (item.onClick) {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="bg-white p-5 rounded-2xl border border-line shadow-sm hover:shadow-lg hover:border-india-green hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 text-left flex items-start gap-4 group focus:outline-none overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/0 via-green-50/0 to-green-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex items-start gap-4 w-full">{cardContent}</div>
                </button>
              );
            }

            return (
              <Link
                key={idx}
                to={item.link}
                className="bg-white p-5 rounded-2xl border border-line shadow-sm hover:shadow-lg hover:border-india-green hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 text-left flex items-start gap-4 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-50/0 via-green-50/0 to-green-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-start gap-4 w-full">{cardContent}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Digital Token Modal */}
      {selectedTokenBooking && (
        <DigitalTokenModal
          booking={selectedTokenBooking}
          onClose={() => setSelectedTokenBooking(null)}
        />
      )}
    </div>
  );
};
