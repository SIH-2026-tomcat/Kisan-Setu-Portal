import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Layers,
  Scale,
  Award,
  CheckCircle,
  AlertCircle,
  User,
  Package,
  CreditCard,
} from 'lucide-react';

export const OfficerProcurement: React.FC = () => {
  const { officer } = useAuth();
  const { showSuccess, showError, showSMS } = useToast();

  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [acceptedQuantity, setAcceptedQuantity] = useState('');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [ratePerQuintal, setRatePerQuintal] = useState('2300');
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await api.getOfficerQueue();
      if (res.success && res.queue) {
        setQueueItems(res.queue);
        if (!selectedItem && res.queue.length > 0) {
          // default select active or first pending inspection
          const pending = res.queue.find((q: any) => q.procurement?.status === 'PENDING_INSPECTION');
          setSelectedItem(pending || res.queue[0]);
          if (pending) {
            setAcceptedQuantity(String(pending.expectedQuantity));
          }
        }
      }
    } catch (err) {
      console.error('OfficerProcurement fetch error:', err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSelect = (item: any) => {
    setSelectedItem(item);
    setAcceptedQuantity(
      item.procurement?.acceptedQuantity ? String(item.procurement.acceptedQuantity) : String(item.expectedQuantity)
    );
    if (item.procurement?.qualityGrade) setQualityGrade(item.procurement.qualityGrade);
    if (item.procurement?.ratePerQuintal) setRatePerQuintal(String(item.procurement.ratePerQuintal));
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedItem.procurement?.id) {
      showError('Error', 'No procurement record associated.');
      return;
    }

    const qty = parseFloat(acceptedQuantity);
    const rate = parseFloat(ratePerQuintal);

    if (isNaN(qty) || qty <= 0) {
      showError('Validation Error', 'Accepted quantity must be greater than 0.');
      return;
    }

    if (isNaN(rate) || rate <= 0) {
      showError('Validation Error', 'Rate per quintal must be greater than 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.processProcurement(selectedItem.procurement.id, {
        acceptedQuantity: qty,
        qualityGrade,
        ratePerQuintal: rate,
      });

      if (res.success) {
        const total = Math.round(qty * rate);
        showSuccess(
          'Procurement Approved',
          `${selectedItem.cropType} (${qty} Q @ ₹${rate}/Q) approved. Total: ₹${total.toLocaleString('en-IN')}`
        );
        showSMS(
          `Kisan Setu: Produce approved! ${selectedItem.cropType}: ${qty} Q @ ₹${rate}/Q. Total: ₹${total.toLocaleString('en-IN')}. Payment initiated.`,
          selectedItem.mobileNumber
        );
        fetchItems();
      } else {
        showError('Approval Failed', res.message || 'Error processing procurement.');
      }
    } catch {
      showError('Server Error', 'Could not communicate with procurement server.');
    } finally {
      setLoading(false);
    }
  };

  const calculatedTotal =
    parseFloat(acceptedQuantity || '0') * parseFloat(ratePerQuintal || '0');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-navy-800" />
          <h1 className="text-2xl font-bold text-navy-900">Crop Quality Inspection & Procurement Approval</h1>
        </div>
        <p className="text-xs text-slate-500">
          Weighing verification, quality grading, and automated MSP payout calculation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Farmers List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2">
            Procurement Queue List
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {queueItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isApproved = item.procurement?.status === 'APPROVED';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition space-y-1.5 ${
                    isSelected
                      ? 'border-navy-800 bg-navy-50 shadow-sm'
                      : isApproved
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-navy-800 text-white px-2 py-0.5 rounded">
                      {item.tokenNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.procurement?.status?.replace('_', ' ') || 'Pending'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{item.farmerName}</h4>
                  <p className="text-[11px] text-slate-600">
                    {item.cropType} — {item.expectedQuantity} Q • {item.timeSlot}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Inspection & Approval Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          {selectedItem ? (
            <form onSubmit={handleApprove} className="space-y-6">
              {/* Selected Farmer Info Header */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-navy-800 text-white px-2.5 py-0.5 rounded">
                      Token: {selectedItem.tokenNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Aadhaar: {selectedItem.aadhaarMasked}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 mt-1">
                    {selectedItem.farmerName} (+91-{selectedItem.mobileNumber})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Produce: <strong>{selectedItem.cropType}</strong> | Declared Qty:{' '}
                    <strong>{selectedItem.expectedQuantity} Quintals</strong>
                  </p>
                </div>

                {selectedItem.procurement?.status === 'APPROVED' && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Procurement Approved</span>
                  </span>
                )}
              </div>

              {/* Inspection Inputs */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-navy-800" />
                  <span>Weighing & Quality Assessment</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Accepted Quantity */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Net Accepted Quantity (Q) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={acceptedQuantity}
                      onChange={(e) => setAcceptedQuantity(e.target.value)}
                      placeholder="e.g. 24.6"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:bg-white focus:border-navy-800"
                      required
                    />
                  </div>

                  {/* Quality Grade */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Quality Grade *
                    </label>
                    <select
                      value={qualityGrade}
                      onChange={(e) => setQualityGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:bg-white focus:border-navy-800"
                    >
                      <option value="Grade A">Grade A (Premium)</option>
                      <option value="Grade B">Grade B (Standard MSP)</option>
                      <option value="Grade C">Grade C (Sub-standard)</option>
                    </select>
                  </div>

                  {/* Rate Per Quintal */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Rate / Quintal (₹) *
                    </label>
                    <input
                      type="number"
                      value={ratePerQuintal}
                      onChange={(e) => setRatePerQuintal(e.target.value)}
                      placeholder="2300"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:bg-white focus:border-navy-800"
                      required
                    />
                  </div>
                </div>

                {/* Server Calculation Box */}
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 uppercase">
                      Server-Calculated Total Payout
                    </span>
                    <p className="text-xs text-emerald-700">
                      Formula: {acceptedQuantity || 0} Quintals × ₹{ratePerQuintal || 0} / Q
                    </p>
                  </div>
                  <div className="text-2xl font-black text-emerald-950">
                    ₹{calculatedTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading || selectedItem.procurement?.status === 'APPROVED'}
                  className="bg-agri-700 hover:bg-agri-800 disabled:bg-slate-300 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-lg flex items-center gap-2 transition"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    {loading
                      ? 'Processing...'
                      : selectedItem.procurement?.status === 'APPROVED'
                      ? 'Procurement Already Approved'
                      : 'Approve Procurement & Authorize Payment'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Select a farmer from the queue to start inspection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
