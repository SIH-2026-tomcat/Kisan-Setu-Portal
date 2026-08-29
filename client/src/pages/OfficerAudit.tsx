import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Clock, FileCheck, RefreshCw } from 'lucide-react';

export const OfficerAudit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.getAuditLogs();
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('OfficerAudit error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-navy-800" />
            <h1 className="text-2xl font-bold text-navy-900">Procurement Centre Audit Log Trail</h1>
          </div>
          <p className="text-xs text-slate-500">
            Immutable log of officer actions, queue advances, quality inspection approvals, and payments
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs text-navy-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Officer / User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Affected</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {log.officer?.username || 'System / Auto'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-navy-100 text-navy-900 font-bold text-[10px] uppercase">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                    {log.entityType} ({log.entityId?.slice(0, 8)}...)
                  </td>
                  <td className="px-4 py-3 text-slate-800">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
