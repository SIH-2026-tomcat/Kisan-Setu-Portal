import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldCheck,
  Users,
  Activity,
  Layers,
  CreditCard,
  FileCheck,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { officer } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.getOfficerDashboard();
      if (res.success) {
        setStats(res);
      }
    } catch (err) {
      console.error('OfficerDashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = stats?.stats || {
    todayBookings: 86,
    currentlyServing: 'A-036',
    farmersWaiting: 18,
    farmersServed: 51,
    pendingInspections: 7,
    pendingPayments: 14,
    quantityProcured: 632,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Officer Welcome Header */}
      <div className="bg-navy-800 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-navy-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Procurement Officer Console
            </span>
            <span className="text-xs text-slate-300">
              ID: {officer?.username || 'guntur_officer'}
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
            <span>Manage Live Queue</span>
          </Link>
          <Link
            to="/officer/procurement"
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-semibold text-xs border border-white/20 flex items-center gap-1.5 transition"
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>Quality Inspection Desk</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
            Bookings Today
          </span>
          <span className="text-2xl font-black text-navy-900">{metrics.todayBookings}</span>
        </div>

        <div className="bg-navy-50 p-4 rounded-xl border-2 border-navy-800 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-navy-800 block mb-1">
            Now Serving
          </span>
          <span className="text-2xl font-black text-navy-900">{metrics.currentlyServing}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-amber-600 block mb-1">
            Farmers Waiting
          </span>
          <span className="text-2xl font-black text-amber-600">{metrics.farmersWaiting}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-1">
            Farmers Served
          </span>
          <span className="text-2xl font-black text-emerald-600">{metrics.farmersServed}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
            Pending Inspect
          </span>
          <span className="text-2xl font-black text-blue-600">{metrics.pendingInspections}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
            Pending Pay
          </span>
          <span className="text-2xl font-black text-purple-600">{metrics.pendingPayments}</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">
            Total Procured
          </span>
          <span className="text-2xl font-black text-emerald-900">{metrics.quantityProcured} Q</span>
        </div>
      </div>

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
            1. Queue & Counter Dispatch
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Advance tokens in real time, call next farmer to counter, and manage yard check-in arrivals.
          </p>
          <div className="pt-2 flex items-center text-xs font-bold text-navy-800 gap-1">
            <span>Open Queue Dispatcher</span>
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
            2. Quality Inspection Desk
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Record moisture, assign Grade A/B/C, enter net accepted weight, and calculate MSP payout totals.
          </p>
          <div className="pt-2 flex items-center text-xs font-bold text-navy-800 gap-1">
            <span>Open Quality Inspection Desk</span>
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
            3. Direct Payment Processing
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Review approved procurements, transition status from Processing to Paid, and generate unique transaction refs.
          </p>
          <div className="pt-2 flex items-center text-xs font-bold text-navy-800 gap-1">
            <span>Open Payments Desk</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Audit Log Quick Preview */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-navy-800" />
            <h3 className="text-base font-bold text-navy-900">Recent Centre Activity & Audit Trail</h3>
          </div>
          <Link
            to="/officer/audit"
            className="text-xs font-bold text-navy-800 hover:underline"
          >
            View Full Audit Logs →
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Every officer action (token advance, grade approval, payment release) is immutably timestamped for hackathon auditability.
        </p>
      </div>
    </div>
  );
};
