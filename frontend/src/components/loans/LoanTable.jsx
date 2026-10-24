import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatRupee, formatDate, getDueDateLabel } from '../../utils/formatters';
import { CheckCircle2, ChevronRight, Inbox } from 'lucide-react';

export const LoanTable = ({ loans = [], onRepayClick, emptyAction }) => {
  const navigate = useNavigate();

  if (loans.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-card">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800">No loans found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No records match your active filter or search query. Create a new loan to start tracking!
        </p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Friend / Borrower</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Due Date</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loans.map((loan) => {
              const dueInfo = getDueDateLabel(loan.dueDate, loan.isRepaid);
              const status = loan.isRepaid
                ? 'REPAID'
                : loan.isOverdue || dueInfo.isPast
                ? 'OVERDUE'
                : 'OUTSTANDING';

              return (
                <tr
                  key={loan.id}
                  onClick={() => navigate(`/loans/${loan.id}`)}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                >
                  {/* Friend Name */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {loan.friendName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {loan.friendName}
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-4 font-bold text-slate-900">
                    {formatRupee(loan.amount)}
                  </td>

                  {/* Due Date */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-slate-800 font-medium">
                        {formatDate(loan.dueDate)}
                      </span>
                      <span
                        className={`text-xs ${
                          dueInfo.isPast ? 'text-rose-600 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {dueInfo.text}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <Badge status={status} />
                  </td>

                  {/* Created Date */}
                  <td className="py-4 px-4 text-xs text-slate-500">
                    {formatDate(loan.createdAt)}
                  </td>

                  {/* Action */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!loan.isRepaid && onRepayClick && (
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRepayClick(loan);
                          }}
                          icon={CheckCircle2}
                        >
                          Repaid
                        </Button>
                      )}
                      <div className="p-1 rounded text-slate-400 group-hover:text-slate-700 transition">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
