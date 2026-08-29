import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessDenied: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-navy-900">Access Denied (403)</h1>
          <p className="text-xs text-slate-500">
            You do not have permission to access this protected service or administrative portal.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow transition items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
