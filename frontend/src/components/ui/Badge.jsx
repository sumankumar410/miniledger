import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const Badge = ({ status, type, className = '' }) => {
  if (type) {
    if (type === 'BORROWED') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
        >
          <ArrowDownLeft className="w-3 h-3 text-indigo-600" />
          Borrowed
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 ${className}`}
      >
        <ArrowUpRight className="w-3 h-3 text-teal-600" />
        Lent
      </span>
    );
  }

  if (status === 'REPAID' || status === 'SETTLED' || status === true) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Settled
      </span>
    );
  }

  if (status === 'OVERDUE') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        Overdue
      </span>
    );
  }

  // Outstanding / Pending
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-amber-600" />
      Outstanding
    </span>
  );
};
