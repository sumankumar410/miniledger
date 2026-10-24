import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoanService } from '../../services/loan.service';
import { useToast } from '../../context/ToastContext';
import { formatRupee } from '../../utils/formatters';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export const RepayModal = ({ isOpen, onClose, loan, onSuccess }) => {
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!loan) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await LoanService.repayLoan(loan.id);
      success(`Loan of ${formatRupee(loan.amount)} for ${loan.friendName} marked as Repaid!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toastError(err.message || 'Failed to update repayment status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Repayment" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Mark this loan as fully repaid?
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              This will update <span className="font-semibold text-slate-900">{loan.friendName}'s</span> loan balance of{' '}
              <span className="font-bold text-emerald-700">{formatRupee(loan.amount)}</span> to settled and record the timestamp.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="emerald"
            size="md"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            icon={CheckCircle2}
          >
            Confirm Repaid
          </Button>
        </div>
      </div>
    </Modal>
  );
};
