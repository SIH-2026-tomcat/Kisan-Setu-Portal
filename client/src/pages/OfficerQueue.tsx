import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Activity,
  UserCheck,
  CheckCircle,
  Clock,
  Phone,
  RefreshCw,
  Megaphone,
  AlertCircle,
} from 'lucide-react';

export const OfficerQueue: React.FC = () => {
  const { officer } = useAuth();
  const { showSuccess, showError, showSMS } = useToast();

  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [currentlyServing, setCurrentlyServing] = useState('A-036');
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchQueue = async () => {
    try {
      const res = await api.getOfficerQueue();
      if (res.success && res.queue) {
        setQueueItems(res.queue);
        setCurrentlyServing(res.currentlyServing || 'A-036');
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('OfficerQueue error:', err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async () => {
    setLoading(true);
    try {
      const res = await api.callNextFarmer();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Main Call Action */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-600 animate-pulse" />
            <h1 className="text-2xl font-bold text-navy-900">Procurement Counter Queue Manager</h1>
          </div>
          <p className="text-xs text-slate-500">
            Real-time synchronization with Farmer Mobile Portal
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-navy-50 border-2 border-navy-800 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] font-bold text-navy-800 uppercase block">Active Token</span>
            <span className="text-2xl font-black text-navy-900">{currentlyServing}</span>
          </div>

          <button
            onClick={handleCallNext}
            disabled={loading}
            className="bg-agri-700 hover:bg-agri-800 disabled:bg-slate-300 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition"
          >
            <Megaphone className="w-5 h-5" />
            <span>{loading ? 'Advancing...' : 'CALL NEXT FARMER'}</span>
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-navy-900">Today's Appointment Sequence</h3>
          <span className="text-xs text-slate-400">Last Sync: {lastRefreshed || 'Syncing...'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Farmer Details</th>
                <th className="px-4 py-3">Produce & Qty</th>
                <th className="px-4 py-3">Slot Window</th>
                <th className="px-4 py-3">Yard Status</th>
                <th className="px-4 py-3">Procurement</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {queueItems.map((item) => {
                const isServing = item.tokenNumber === currentlyServing;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition ${
                      isServing ? 'bg-amber-50/70 font-semibold' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-sm">
                      <span
                        className={`px-2.5 py-1 rounded-lg ${
                          isServing ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.tokenNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{item.farmerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        +91-{item.mobileNumber} • {item.aadhaarMasked}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800">{item.cropType}</span>
                      <span className="text-slate-500 block">{item.expectedQuantity} Quintals</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.timeSlot}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isServing
                            ? 'bg-emerald-600 text-white'
                            : item.bookingStatus === 'ARRIVED'
                            ? 'bg-blue-100 text-blue-800'
                            : item.bookingStatus === 'COMPLETED'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isServing ? 'Now Serving' : item.bookingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-slate-600">
                        {item.procurement?.status?.replace('_', ' ') || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.bookingStatus === 'BOOKED' && (
                        <button
                          onClick={() => handleMarkArrived(item.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition shadow-sm"
                        >
                          Mark Arrived
                        </button>
                      )}
                      {isServing && (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Active Counter</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
