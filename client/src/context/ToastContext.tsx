import React, { createContext, useContext, useState, useCallback } from 'react';
import { MessageSquare, CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'sms' | 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  mobileNumber?: string;
  timestamp: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showSMS: (message: string, mobileNumber?: string) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  }, [removeToast]);

  const showSMS = (message: string, mobileNumber?: string) => {
    addToast({
      type: 'sms',
      title: 'SMS Alert (Simulated)',
      message,
      mobileNumber: mobileNumber || '9876543210',
    });
  };

  const showSuccess = (title: string, message: string) => {
    addToast({ type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    addToast({ type: 'error', title, message });
  };

  return (
    <ToastContext.Provider value={{ toasts, showSMS, showSuccess, showError, removeToast }}>
      {children}
      {/* Global Toast Overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg shadow-lg border p-4 transition-all duration-300 transform translate-y-0 ${
              toast.type === 'sms'
                ? 'bg-slate-900 text-white border-emerald-500'
                : toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-300'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {toast.type === 'sms' && <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />}
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
                {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
                <div>
                  <h4 className="text-sm font-semibold leading-tight">{toast.title}</h4>
                  {toast.mobileNumber && (
                    <span className="text-[11px] text-emerald-300 block">To: +91-{toast.mobileNumber}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed opacity-95">{toast.message}</p>
            <span className="mt-1 text-[10px] text-slate-400 block text-right">{toast.timestamp}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
