import React from 'react';
import { formatRupee } from '../../utils/formatters';

export const SummaryCard = ({
  title,
  amount,
  subtitle,
  icon: Icon,
  variant = 'default',
  count,
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-200/80',
      iconBg: 'bg-slate-100 text-slate-800',
      amountColor: 'text-slate-900',
    },
    emerald: {
      border: 'border-emerald-200/70',
      iconBg: 'bg-emerald-50 text-emerald-600',
      amountColor: 'text-emerald-700',
    },
    amber: {
      border: 'border-amber-200/70',
      iconBg: 'bg-amber-50 text-amber-600',
      amountColor: 'text-amber-700',
    },
    rose: {
      border: 'border-rose-200/70',
      iconBg: 'bg-rose-50 text-rose-600',
      amountColor: 'text-rose-700',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`bg-white rounded-2xl p-5 border ${style.border} shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${style.amountColor}`}>
          {formatRupee(amount)}
        </h3>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
          {count !== undefined && (
            <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {count} {count === 1 ? 'loan' : 'loans'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
