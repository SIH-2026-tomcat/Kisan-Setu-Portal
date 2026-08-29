import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Booking, NotificationItem } from '../types';
import { DigitalTokenModal } from '../components/DigitalTokenModal';
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
} from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useAuth();
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
        // Find latest active or upcoming booking
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
      <div className="bg-navy-800 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-navy-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-agri-700 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Verified Farmer Profile
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Aadhaar: {farmer?.aadhaarMasked || 'XXXX XXXX 9012'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {farmer?.fullName || 'Farmer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {farmer?.village || 'Guntur Rural'}, {farmer?.district || 'Guntur'} (
              {farmer?.state || 'Andhra Pradesh'})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/book-slot"
            className="bg-agri-700 hover:bg-agri-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow flex items-center gap-1.5 transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Book New Slot</span>
          </Link>
          <Link
            to="/live-queue"
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-semibold text-xs border border-white/20 flex items-center gap-1.5 transition"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>View Live Queue</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Active Booking Card & Quick Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Booking Highlight Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-navy-800" />
              <h2 className="text-base font-bold text-navy-900">Next Scheduled Procurement</h2>
            </div>
            {activeBooking && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                {activeBooking.status}
              </span>
            )}
          </div>

          {activeBooking ? (
            <div className="space-y-4">
              {/* Token & Centre Banner */}
              <div className="bg-navy-50 rounded-xl p-4 border border-navy-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[11px] font-bold text-navy-700 uppercase tracking-wider">
                    Your Queue Token
                  </span>
                  <div className="text-3xl font-black text-navy-900">{activeBooking.tokenNumber}</div>
                  <span className="text-xs text-slate-500 font-mono">
                    Ref: {activeBooking.bookingReference}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedTokenBooking(activeBooking)}
                  className="bg-navy-800 hover:bg-navy-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show Digital Token (QR)</span>
                </button>
              </div>

              {/* Booking Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Procurement Centre</span>
                  <span className="font-bold text-slate-800 block truncate">{activeBooking.centreName}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Date</span>
                  <span className="font-bold text-slate-800 block">{activeBooking.date}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Slot Time</span>
                  <span className="font-bold text-slate-800 block">{activeBooking.timeSlot}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Produce & Quantity</span>
                  <span className="font-bold text-slate-800 block">
                    {activeBooking.cropType} — {activeBooking.expectedQuantity} Q
                  </span>
                </div>
              </div>

              {/* Status Action Links */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Link
                  to="/live-queue"
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 p-2.5 rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-1"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Track Live Queue Movement</span>
                </Link>
                <Link
                  to="/track-procurement"
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 p-2.5 rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5 text-navy-800" />
                  <span>Track Quality & Weighing</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No active procurement bookings found.</p>
              <Link
                to="/book-slot"
                className="inline-flex bg-navy-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
              >
                Book Your First Slot Now
              </Link>
            </div>
          )}
        </div>

        {/* Live Status Cards & Notifications */}
        <div className="space-y-6">
          {/* Quick Notifications Widget */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-navy-800" />
                <h3 className="text-sm font-bold text-navy-900">Service Updates</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {notifications.length} Alerts
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {notifications.length > 0 ? (
                notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{n.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-tight">{n.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
              )}
            </div>
          </div>

          {/* Direct Bank Account Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-navy-900">Direct Deposit Linkage</h3>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Linked Bank A/C:</span>
                <span className="font-mono font-bold text-slate-800">XXXX XXXX 4582</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-800">Direct Bank / PFMS</span>
              </div>
            </div>
            <Link
              to="/payment-status"
              className="block text-center text-xs font-bold text-navy-800 hover:underline pt-1"
            >
              View Full Payment History →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Services Navigation */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-navy-900">Farmer Quick Services</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Book New Slot', link: '/book-slot', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
            { label: 'Live Queue', link: '/live-queue', icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Track Produce', link: '/track-procurement', icon: Layers, color: 'text-purple-600 bg-purple-50' },
            { label: 'Payment Status', link: '/payment-status', icon: CreditCard, color: 'text-teal-600 bg-teal-50' },
            { label: 'Booking History', link: '/history', icon: FileText, color: 'text-amber-600 bg-amber-50' },
            { label: 'Help & FAQ', link: '/help', icon: HelpCircle, color: 'text-slate-600 bg-slate-100' },
          ].map((item, idx) => (
            <Link
              key={idx}
              to={item.link}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-center flex flex-col items-center justify-center gap-2 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-navy-800 transition">
                {item.label}
              </span>
            </Link>
          ))}
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
