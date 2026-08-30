import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LateArrivalModal } from '../components/LateArrivalModal';
import {
  Activity,
  Layers,
  CreditCard,
  Building,
  Sparkles,
  Wifi,
  RefreshCw,
  ArrowRight,
  FileCheck,
  CheckCircle,
  PauseCircle,
  RotateCcw,
  Search,
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { officer } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCentreId, setSelectedCentreId] = useState(officer?.centreId || '');
  const [lastRefreshed, setLastRefreshed] = useState('');

  // Late Arrival Modal & On-Hold Search state
  const [lateArrivalBookingId, setLateArrivalBookingId] = useState<string | null>(null);
  const [onHoldSearch, setOnHoldSearch] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.getOfficerDashboard(selectedCentreId);
      if (res.success) {
        setStats(res);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('OfficerDashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [selectedCentreId]);

  const metrics = stats?.stats || {
    todayBookings: 0,
    totalBookings: 0,
    currentlyServing: 'A-001',
    farmersWaiting: 0,
    farmersServed: 0,
    pendingInspections: 0,
    pendingPayments: 0,
    quantityProcured: 0,
    onHoldCount: 0,
    reassignedToday: 0,
    cancelledMissed: 0,
  };

  const recentBookings = stats?.recentBookings || [];
  const onHoldBookings: any[] = stats?.onHoldBookings || [];
  const centres = stats?.centres || [];

  const filteredOnHoldBookings = onHoldBookings.filter((b) => {
    const q = onHoldSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      b.tokenNumber?.toLowerCase().includes(q) ||
      b.farmerName?.toLowerCase().includes(q) ||
      b.mobileNumber?.includes(q) ||
      b.bookingReference?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Active Connection Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-emerald-900 text-white rounded-2xl p-5 shadow-lg border border-navy-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Wifi className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                {t('officer.activeConnection')}
              </span>
            </div>
            <h2 className="text-base font-bold text-white">
              {t('brand.name')} — {t('officer.console')}
            </h2>
            <p className="text-xs text-slate-300">
              {t('officer.connectionDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Centre Switcher */}
          {centres.length > 0 && (
            <div className="flex items-center gap-2 bg-navy-900/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Building className="w-4 h-4 text-amber-300" />
              <select
                value={selectedCentreId || stats?.centre?.id || ''}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none"
              >
                {centres.map((c: any) => (
                  <option key={c.id} value={c.id} className="bg-navy-900 text-white">
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xs text-emerald-300 bg-emerald-950/60 font-mono px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{t('officer.liveSync')}: {lastRefreshed || 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Officer Welcome Header */}
      <div className="bg-navy-800 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-navy-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {t('officer.console')}
            </span>
            <span className="text-xs text-slate-300">
              {officer?.fullName || officer?.username || 'Superintendent'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {stats?.centre?.name || 'Guntur Agricultural Procurement Centre'}
          </h1>
          <p className="text-xs text-slate-300">
            {stats?.centre?.address || 'Market Yard Road, Near APMC Complex, Guntur - 522004'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/officer/queue"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow flex items-center gap-1.5 transition"
          >
            <Activity className="w-4 h-4" />
            <span>{t('officer.manageQueue')}</span>
          </Link>
          <Link
            to="/officer/procurement"
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-semibold text-xs border border-white/20 flex items-center gap-1.5 transition"
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>{t('officer.qualityInspection')}</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">
            {t('officer.bookingsToday')}
          </span>
          <span className="text-xl font-black text-navy-900">{metrics.todayBookings}</span>
        </div>

        <div className="bg-navy-50 p-3.5 rounded-xl border-2 border-navy-800 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-navy-800 block mb-0.5">
            {t('officer.nowServing')}
          </span>
          <span className="text-xl font-black text-navy-900">{metrics.currentlyServing}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-amber-600 block mb-0.5">
            {t('officer.farmersWaiting')}
          </span>
          <span className="text-xl font-black text-amber-600">{metrics.farmersWaiting}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-emerald-600 block mb-0.5">
            {t('officer.farmersServed')}
          </span>
          <span className="text-xl font-black text-emerald-600">{metrics.farmersServed}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">
            {t('officer.pendingInspect')}
          </span>
          <span className="text-xl font-black text-blue-600">{metrics.pendingInspections}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">
            {t('officer.pendingPay')}
          </span>
          <span className="text-xl font-black text-purple-600">{metrics.pendingPayments}</span>
        </div>

        <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-emerald-800 block mb-0.5">
            {t('officer.totalProcured')}
          </span>
          <span className="text-xl font-black text-emerald-900">{metrics.quantityProcured} Q</span>
        </div>

        {/* New KPI: ON HOLD */}
        <div className="bg-amber-50 p-3.5 rounded-xl border-2 border-amber-400 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-amber-900 block mb-0.5">
            {t('officer.onHold')}
          </span>
          <span className="text-xl font-black text-amber-950">{metrics.onHoldCount}</span>
        </div>

        {/* New KPI: REASSIGNED TODAY */}
        <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-purple-900 block mb-0.5">
            {t('officer.reassignedToday')}
          </span>
          <span className="text-xl font-black text-purple-950">{metrics.reassignedToday}</span>
        </div>

        {/* New KPI: CANCELLED MISSED */}
        <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 shadow-sm text-center">
          <span className="text-[9px] font-bold uppercase text-red-800 block mb-0.5">
            {t('officer.cancelledMissed')}
          </span>
          <span className="text-xl font-black text-red-950">{metrics.cancelledMissed}</span>
        </div>
      </div>

      {/* Dynamic Farmer Created Slots Live Stream */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-navy-900">
              {t('officer.liveStreamTitle')}
            </h3>
          </div>
          <Link to="/officer/queue" className="text-xs font-bold text-navy-800 hover:underline">
            {t('officer.viewAllQueue')}
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            {t('officer.noSlotsSub')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">{t('officer.token')}</th>
                  <th className="px-4 py-2.5">{t('officer.farmerDetails')}</th>
                  <th className="px-4 py-2.5">{t('officer.produceQty')}</th>
                  <th className="px-4 py-2.5">{t('officer.slotDateTime')}</th>
                  <th className="px-4 py-2.5">{t('officer.yardStatus')}</th>
                  <th className="px-4 py-2.5 text-right">{t('booking.bookingRef')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.slice(0, 7).map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-bold text-navy-900">
                      <span className="bg-navy-100 text-navy-900 px-2 py-0.5 rounded">
                        {b.tokenNumber}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {b.farmerName} (+91-{b.mobileNumber})
                    </td>
                    <td className="px-4 py-2.5">
                      {b.cropType} ({b.expectedQuantity} {b.quantityUnit === 'kg' ? 'kg' : 'Q'})
                    </td>
                    <td className="px-4 py-2.5">
                      {b.date} • {b.timeSlot}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'ON_HOLD'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : b.status === 'REASSIGNED'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : b.status === 'ARRIVED'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status === 'ON_HOLD' ? 'ON HOLD' : b.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11px] text-slate-500">
                      {b.bookingReference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DEDICATED SECTION: ON-HOLD FARMERS (MISSED SLOTS) */}
      <div className="bg-white rounded-2xl p-6 border-2 border-amber-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-navy-900">{t('officer.onHoldFarmers')}</h3>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {onHoldBookings.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">{t('officer.onHoldFarmersDesc')}</p>
            </div>
          </div>

          {/* Search on-hold farmers */}
          {onHoldBookings.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={onHoldSearch}
                onChange={(e) => setOnHoldSearch(e.target.value)}
                placeholder={t('officer.searchOnHoldPlaceholder')}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-navy-800"
              />
            </div>
          )}
        </div>

        {onHoldBookings.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-1">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">{t('officer.noOnHoldFarmers')}</p>
            <p className="text-xs text-slate-400">All scheduled farmers are on track with their reporting slots.</p>
          </div>
        ) : filteredOnHoldBookings.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No on-hold farmers match your search query "{onHoldSearch}".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-amber-50/70 text-amber-950 uppercase font-bold border-b border-amber-200">
                <tr>
                  <th className="px-4 py-2.5">{t('officer.token')}</th>
                  <th className="px-4 py-2.5">{t('officer.farmerDetails')}</th>
                  <th className="px-4 py-2.5">{t('officer.produceQty')}</th>
                  <th className="px-4 py-2.5">Original Missed Slot</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">{t('officer.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOnHoldBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-amber-50/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-navy-900">
                      <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded-lg border border-amber-300">
                        {b.tokenNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{b.farmerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        +91-{b.mobileNumber} • {b.aadhaarMasked}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800">{b.cropType}</span>
                      <span className="text-slate-500 block">
                        {b.expectedQuantity} {b.quantityUnit === 'kg' ? 'kg' : 'Q'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-red-700 font-bold block">{b.timeSlot}</span>
                      <span className="text-slate-400 text-[10px] block">{b.date}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-amber-300">
                        ON HOLD
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setLateArrivalBookingId(b.id)}
                        className="bg-navy-800 hover:bg-navy-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Manage / Reassign</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LATE ARRIVAL & REASSIGNMENT MODAL */}
      {lateArrivalBookingId && (
        <LateArrivalModal
          bookingId={lateArrivalBookingId}
          onClose={() => setLateArrivalBookingId(null)}
          onSuccess={() => {
            fetchStats();
          }}
        />
      )}

      {/* Quick Access Operational Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/officer/queue"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-navy-800 transition">
            1. {t('officer.queueManager')}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('officer.farmerSlotsTitle')}
          </p>
          <div className="pt-2 flex items-center text-xs font-bold text-navy-800 gap-1">
            <span>{t('officer.manageQueue')}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/officer/procurement"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-navy-800 transition">
            2. {t('officer.qualityInspection')}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('officer.inspectionDesc')}
          </p>
          <div className="pt-2 flex items-center text-xs font-bold text-navy-800 gap-1">
            <span>{t('officer.qualityInspection')}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/officer/payments"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-navy-800 transition">
            3. {t('officer.paymentsDesk')}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('officer.paymentsDesc')}
          </p>
          <div className="pt-2 flex items-center text-xs font-bold text-navy-800 gap-1">
            <span>{t('officer.paymentsDesk')}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Audit Log Quick Preview */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-navy-800" />
            <h3 className="text-base font-bold text-navy-900">{t('officer.auditTitle')}</h3>
          </div>
          <Link
            to="/officer/audit"
            className="text-xs font-bold text-navy-800 hover:underline"
          >
            {t('officer.viewAudit')}
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          {t('officer.auditDesc')}
        </p>
      </div>
    </div>
  );
};
