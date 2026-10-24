import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatRupee, formatDate, getDueDateLabel } from '../../utils/formatters';
import { CheckCircle2, ChevronRight, Calendar } from 'lucide-react';

export const LoanCard = ({ loan, onRepayClick }) => {
  const navigate = useNavigate();
  const dueInfo = getDueDateLabel(loan.dueDate, loan.isRepaid);

  const getStatusType = () => {
    if (loan.isRepaid) return 'REPAID';
    if (loan.isOverdue || dueInfo.isPast) return 'OVERDUE';
    return 'OUTSTANDING';
  };

  const status = getStatusType();

  return (
    <div
      onClick={() => navigate(`/loans/${loan.id}`)}
      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center shrink-0">
            {loan.friendName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {loan.friendName}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Due {formatDate(loan.dueDate)}</span>
            </div>
          </div>
        </div>

        <Badge status={status} />
      </div>

      {/* Middle Amount & Due countdown */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Amount
          </span>
          <span className="text-lg font-extrabold text-slate-900">
            {formatRupee(loan.amount)}
          </span>
        </div>

        <span
          className={`text-xs font-semibold ${
            dueInfo.isPast ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          {dueInfo.text}
        </span>
      </div>

      {/* Action Footer */}
      {!loan.isRepaid && onRepayClick && (
        <div className="mt-3 pt-2">
          <Button
            variant="emerald"
            size="sm"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              onRepayClick(loan);
            }}
            icon={CheckCircle2}
          >
            Mark as Repaid
          </Button>
        </div>
      )}
    </div>
  );
};
