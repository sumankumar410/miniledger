import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { LoanService } from '../services/loan.service';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { RecordPaymentModal } from '../components/forms/RecordPaymentModal';
import { formatRupee, formatDate } from '../utils/formatters';
import { getDaysRemainingOrOverdue } from '../utils/date';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User,
  CreditCard,
  Percent,
  FileText,
  Send,
  Loader2,
  Plus,
} from 'lucide-react';

export const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openPaymentModal } = useOutletContext() || {};
  const { success, error: toastError } = useToast();

  const [loan, setLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Due date editor
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');

  const fetchLoan = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await LoanService.getLoanById(id);
      setLoan(data);
      if (data?.dueDate) {
        setNewDueDate(data.dueDate.split('T')[0]);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Loan record not found or inaccessible.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchLoan();
  }, [id, fetchLoan]);

  const handleUpdateDueDate = async () => {
    if (!newDueDate) return;
    try {
      await LoanService.updateLoan(loan.id, { dueDate: newDueDate });
      success('Due date updated successfully!');
      setIsEditingDueDate(false);
      fetchLoan();
    } catch (err) {
      toastError(err.message || 'Failed to update due date.');
    }
  };

  const handleShareWhatsAppReminder = () => {
    const remaining = loan.remainingBalance || loan.amount;
    const msg = `Hi ${loan.friendName}! This is a friendly reminder for the personal loan of ${formatRupee(
      remaining
    )} (${loan.type === 'BORROWED' ? 'that I owe you' : 'due to me'}) by ${formatDate(loan.dueDate)}.`;

    navigator.clipboard?.writeText(msg);
    success('Friendly reminder copied to clipboard! Paste it on WhatsApp or SMS.');
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-card">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Retrieving loan transaction details...</p>
      </div>
    );
  }

  if (errorMessage || !loan) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card text-center space-y-4 max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Loan Not Found</h3>
        <p className="text-xs text-slate-500">{errorMessage || 'Unable to locate this loan record.'}</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/loans')}>
          Return to My Loans
        </Button>
      </div>
    );
  }

  const dueInfo = getDaysRemainingOrOverdue(loan.dueDate);
  const statusVal = loan.isRepaid ? 'SETTLED' : dueInfo.isOverdue ? 'OVERDUE' : 'OUTSTANDING';

  const originalPrincipal = parseFloat(loan.amount || '0');
  const totalPaidNum = parseFloat(loan.totalPaid || '0');
  const remainingNum = parseFloat(loan.remainingBalance || (originalPrincipal - totalPaidNum).toString());
  const percentSettled = originalPrincipal > 0 ? Math.min(100, Math.round((totalPaidNum / originalPrincipal) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/loans"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Loans</span>
        </Link>

        <span className="text-xs font-mono text-slate-400">ID: {loan.id.slice(0, 8)}...</span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {/* Header Banner */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-emerald-400 font-black text-2xl flex items-center justify-center shrink-0 border border-white/10">
              {loan.friendName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge type={loan.type} />
                <Badge status={statusVal} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">{loan.friendName}</h2>
              <p className="text-xs text-slate-400">
                Created on {formatDate(loan.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!loan.isRepaid && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareWhatsAppReminder}
                  icon={Send}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs py-2"
                >
                  Reminder
                </Button>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => setIsPaymentModalOpen(true)}
                  icon={CreditCard}
                  className="text-xs py-2"
                >
                  Record Payment
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Financial Balances Grid */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Original Principal
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatRupee(originalPrincipal)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Given on {formatDate(loan.loanDate || loan.createdAt)}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Repaid So Far
              </span>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {formatRupee(totalPaidNum)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {percentSettled}% recovered
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Current Remaining Balance
              </span>
              <h3
                className={`text-2xl font-black mt-1 ${
                  remainingNum > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {formatRupee(remainingNum)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {remainingNum === 0 ? 'Fully settled 🎉' : `${dueInfo.text}`}
              </p>
            </div>
          </div>

          {/* Settlement Progress Bar */}
          <div className="mt-6 pt-4 border-t border-slate-200/60">
            <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-600">
              <span>Settlement Progress</span>
              <span>{percentSettled}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${percentSettled}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Due Date Card with Edit Action */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Due Date
              </span>
              {!loan.isRepaid && (
                <button
                  onClick={() => setIsEditingDueDate(!isEditingDueDate)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                >
                  {isEditingDueDate ? 'Cancel' : 'Change'}
                </button>
              )}
            </div>
            {isEditingDueDate ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border rounded-lg bg-white"
                />
                <button
                  onClick={handleUpdateDueDate}
                  className="px-2 py-1 text-xs font-bold bg-slate-900 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900">{formatDate(loan.dueDate)}</p>
                <p className={`text-xs font-semibold ${dueInfo.isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                  {dueInfo.text}
                </p>
              </>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Payment Schedule
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">{loan.paymentSchedule || 'One-time'}</p>
            <p className="text-xs text-slate-500">Agreed installment pace</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Interest Rate
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">{loan.interestRate || 0}% per year</p>
            <p className="text-xs text-slate-500">Friendly loan terms</p>
          </div>

          {loan.notes && (
            <div className="sm:col-span-2 md:col-span-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Notes & Context
              </span>
              <p className="text-xs text-slate-700 mt-1">{loan.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Payment & Installment History</h3>
          </div>
          {!loan.isRepaid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              icon={Plus}
              className="text-xs py-1.5"
            >
              Add Installment
            </Button>
          )}
        </div>

        {!loan.payments || loan.payments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500">No payment installments recorded for this loan yet.</p>
            {!loan.isRepaid && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPaymentModalOpen(true)}
                icon={CreditCard}
              >
                Record First Payment
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Amount Paid</th>
                  <th className="py-2.5 px-3">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loan.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-emerald-700 text-base">
                      +{formatRupee(p.amount)}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {p.reference && <span className="font-mono text-slate-700 mr-2">{p.reference}</span>}
                      {p.notes && <span className="italic text-slate-400">{p.notes}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preSelectedLoan={loan}
        onSuccess={fetchLoan}
      />
    </div>
  );
};
