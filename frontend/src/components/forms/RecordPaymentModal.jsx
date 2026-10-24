import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PaymentsService } from '../../services/payments.service';
import { LoanService } from '../../services/loan.service';
import { useToast } from '../../context/ToastContext';
import { formatRupee } from '../../utils/formatters';
import { toInputDateFormat } from '../../utils/date';
import { IndianRupee, Calendar, CreditCard, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const RecordPaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedLoan = null,
}) => {
  const { success, error: toastError } = useToast();

  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(preSelectedLoan?.id || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(toInputDateFormat(new Date()));
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load active loans if no pre-selected loan
  useEffect(() => {
    if (isOpen) {
      if (preSelectedLoan) {
        setSelectedLoanId(preSelectedLoan.id);
      } else {
        LoanService.getLoans({ status: 'OUTSTANDING', limit: 100 }).then((res) => {
          setLoans(res.loans || []);
          if (res.loans?.length > 0 && !selectedLoanId) {
            setSelectedLoanId(res.loans[0].id);
          }
        });
      }
    }
  }, [isOpen, preSelectedLoan]);

  const activeLoan = useMemo(() => {
    if (preSelectedLoan && preSelectedLoan.id === selectedLoanId) return preSelectedLoan;
    return loans.find((l) => l.id === selectedLoanId) || null;
  }, [loans, selectedLoanId, preSelectedLoan]);

  // Financial calculations
  const originalAmount = activeLoan ? parseFloat(activeLoan.amount || '0') : 0;
  const previouslyPaid = activeLoan ? parseFloat(activeLoan.totalPaid || '0') : 0;
  const currentOutstanding = activeLoan
    ? parseFloat(activeLoan.remainingBalance || (originalAmount - previouslyPaid).toString())
    : 0;

  const currentPaymentNum = parseFloat(amount || '0');
  const remainingAfterPayment = Math.max(0, currentOutstanding - (isNaN(currentPaymentNum) ? 0 : currentPaymentNum));
  const isFullSettlement = currentPaymentNum >= currentOutstanding && currentOutstanding > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedLoanId) {
      setErrorMessage('Please select a loan');
      return;
    }

    if (isNaN(currentPaymentNum) || currentPaymentNum <= 0) {
      setErrorMessage('Payment amount must be strictly greater than ₹0');
      return;
    }

    if (currentPaymentNum > currentOutstanding + 0.01) {
      setErrorMessage(
        `Payment (₹${currentPaymentNum.toLocaleString('en-IN')}) cannot exceed the remaining balance of ₹${currentOutstanding.toLocaleString('en-IN')}`
      );
      return;
    }

    try {
      setIsLoading(true);
      await PaymentsService.recordPayment({
        loanId: selectedLoanId,
        amount: currentPaymentNum,
        paymentDate,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      success(
        `Payment of ${formatRupee(currentPaymentNum)} recorded! ${
          isFullSettlement ? 'Loan is now fully settled! 🎉' : `Remaining: ${formatRupee(remainingAfterPayment)}`
        }`
      );

      handleClose();
      onSuccess?.();
      window.dispatchEvent(new Event('miniledger_loan_created'));
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record payment.');
      toastError(err.message || 'Failed to record payment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setReference('');
    setNotes('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Loan Payment" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loan Selection */}
        {!preSelectedLoan && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Outstanding Loan *
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
            >
              {loans.length === 0 ? (
                <option value="">No outstanding loans available</option>
              ) : (
                loans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.friendName} ({l.type === 'BORROWED' ? 'Borrowed' : 'Lent'}) — Balance: {formatRupee(l.remainingBalance || l.amount)}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Dynamic Financial Breakdown Box */}
        {activeLoan && (
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Borrower / Friend:</span>
              <span className="font-bold text-slate-900">{activeLoan.friendName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Original Loan:</span>
              <span className="font-semibold text-slate-800">{formatRupee(originalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Previously Paid:</span>
              <span className="font-semibold text-emerald-700">{formatRupee(previouslyPaid)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/70 font-bold">
              <span className="text-slate-700">Current Outstanding:</span>
              <span className="text-amber-700 text-sm">{formatRupee(currentOutstanding)}</span>
            </div>

            {currentPaymentNum > 0 && (
              <div className="flex justify-between items-center pt-1 text-emerald-800 font-bold bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                <span>Remaining After Payment:</span>
                <span className="text-sm">{formatRupee(remainingAfterPayment)}</span>
              </div>
            )}
          </div>
        )}

        {/* Payment Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Payment Amount (₹ INR) *
            </label>
            {currentOutstanding > 0 && (
              <button
                type="button"
                onClick={() => setAmount(currentOutstanding.toString())}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Pay Full (₹{currentOutstanding})
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
              ₹
            </div>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Date and Method in 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Actual Payment Date *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Method *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="CASH">Cash in Hand</option>
                <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Optional Reference */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Transaction Reference / UPI Ref (Optional)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. UPI Ref # 412389182390"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" size="md" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="emerald"
            size="md"
            isLoading={isLoading}
            icon={CheckCircle2}
            disabled={!activeLoan || currentOutstanding <= 0}
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
