import React from 'react';
import { Check } from 'lucide-react';

export interface StepInfo {
  label: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string | null;
  detail?: string | null;
}

interface StatusStepperProps {
  steps: StepInfo[];
}

export const StatusStepper: React.FC<StatusStepperProps> = ({ steps }) => {
  return (
    <div className="w-full py-4">
      {/* Mobile/Compact Vertical layout */}
      <div className="md:hidden space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 relative">
            {/* Step circle */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                step.status === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : step.status === 'current'
                  ? 'bg-navy-800 text-white ring-4 ring-navy-100'
                  : 'bg-slate-200 text-slate-500 border border-slate-300'
              }`}
            >
              {step.status === 'completed' ? <Check className="w-4 h-4" /> : idx + 1}
            </div>

            {/* Connecting line */}
            {idx !== steps.length - 1 && (
              <div
                className={`absolute left-3.5 top-7 bottom--4 w-0.5 -ml-[1px] h-full ${
                  step.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}

            <div className="flex-1 pb-2">
              <div
                className={`text-sm font-semibold leading-tight ${
                  step.status === 'completed'
                    ? 'text-emerald-800'
                    : step.status === 'current'
                    ? 'text-navy-900 font-bold'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </div>
              {step.detail && <p className="text-xs text-slate-600 mt-0.5">{step.detail}</p>}
              {step.timestamp && <span className="text-[11px] text-slate-400 block mt-0.5">{step.timestamp}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Horizontal layout */}
      <div className="hidden md:flex items-start justify-between relative">
        {/* Connecting horizontal line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center text-center flex-1 z-10 px-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition shadow-sm ${
                step.status === 'completed'
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                  : step.status === 'current'
                  ? 'bg-navy-800 text-white ring-4 ring-navy-100'
                  : 'bg-white text-slate-400 border-2 border-slate-300'
              }`}
            >
              {step.status === 'completed' ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span
              className={`text-xs font-semibold mt-2 max-w-[90px] leading-tight ${
                step.status === 'completed'
                  ? 'text-emerald-800 font-bold'
                  : step.status === 'current'
                  ? 'text-navy-900 font-black'
                  : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
            {step.timestamp && (
              <span className="text-[10px] text-slate-500 block mt-0.5">{step.timestamp}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
