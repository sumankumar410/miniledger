import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoanService } from '../../services/loan.service';
import { FriendsService } from '../../services/friends.service';
import { useToast } from '../../context/ToastContext';
import { toInputDateFormat } from '../../utils/date';
import {
  IndianRupee,
  Calendar,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  AlertCircle,
  Percent,
} from 'lucide-react';

const addLoanSchema = z
  .object({
    friendName: z.string().trim().min(1, 'Friend name is required'),
    type: z.enum(['LENT', 'BORROWED']),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: 'Loan amount must be strictly greater than 0',
      }),
    loanDate: z.string().min(1, 'Loan date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    paymentSchedule: z.enum(['ONE_TIME', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
    interestRate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.loanDate), {
    message: 'Due date cannot be earlier than the loan date',
    path: ['dueDate'],
  });

export const AddLoanModal = ({ isOpen, onClose, onSuccess, initialFriendName = '' }) => {
  const { success, error: toastError } = useToast();
  const [friends, setFriends] = useState([]);
  const [serverError, setServerError] = useState(null);

  const todayStr = toInputDateFormat(new Date());
  const nextMonthStr = toInputDateFormat(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addLoanSchema),
    defaultValues: {
      friendName: initialFriendName || '',
      type: 'LENT',
      amount: '',
      loanDate: todayStr,
      dueDate: nextMonthStr,
      paymentSchedule: 'ONE_TIME',
      interestRate: '0',
      notes: '',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (isOpen) {
      FriendsService.listFriends().then((data) => setFriends(data || []));
      if (initialFriendName) {
        setValue('friendName', initialFriendName);
      }
    }
  }, [isOpen, initialFriendName, setValue]);

  const onSubmit = async (data) => {
    try {
      setServerError(null);
      await LoanService.createLoan({
        friendName: data.friendName.trim(),
        type: data.type,
        amount: parseFloat(data.amount),
        loanDate: data.loanDate,
        dueDate: data.dueDate,
        paymentSchedule: data.paymentSchedule,
        interestRate: parseFloat(data.interestRate || '0'),
        notes: data.notes?.trim() || '',
      });

      success(
        `Loan of ₹${parseFloat(data.amount).toLocaleString('en-IN')} (${
          data.type === 'LENT' ? 'Money Lent' : 'Money Borrowed'
        }) recorded successfully!`
      );

      reset();
      onSuccess?.();
      handleClose();
      window.dispatchEvent(new Event('miniledger_loan_created'));
    } catch (err) {
      setServerError(err.message || 'Failed to create loan record.');
      toastError(err.message || 'Failed to create loan record.');
    }
  };

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Loan Record" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Transaction Type Selector (Lent vs Borrowed) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Transaction Direction *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('type', 'LENT')}
              className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                selectedType === 'LENT'
                  ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedType === 'LENT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold">Money Lent</span>
                <span className="block text-[11px] text-slate-500">I gave money (Receivable)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setValue('type', 'BORROWED')}
              className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                selectedType === 'BORROWED'
                  ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedType === 'BORROWED' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold">Money Borrowed</span>
                <span className="block text-[11px] text-slate-500">I took money (Payable)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Friend Name with suggestions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Friend / Person Name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              list="friends-datalist"
              placeholder="e.g. Rahul Sharma"
              {...register('friendName')}
              className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                errors.friendName ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:border-slate-900'
              }`}
            />
            <datalist id="friends-datalist">
              {friends.map((f) => (
                <option key={f.id} value={f.name} />
              ))}
            </datalist>
          </div>
          {errors.friendName && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.friendName.message}</p>
          )}
        </div>

        {/* Amount & Interest */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Principal Amount (₹ INR) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                ₹
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="5000.00"
                {...register('amount')}
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errors.amount ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:border-slate-900'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Interest Rate (% p.a.)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Percent className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                {...register('interestRate')}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Loan Date & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Loan Given/Taken Date *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                {...register('loanDate')}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Expected Due Date *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                {...register('dueDate')}
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errors.dueDate ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:border-slate-900'
                }`}
              />
            </div>
            {errors.dueDate && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.dueDate.message}</p>
            )}
          </div>
        </div>

        {/* Payment Schedule */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Payment Schedule
          </label>
          <select
            {...register('paymentSchedule')}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-slate-900 focus:bg-white transition-all"
          >
            <option value="ONE_TIME">One-time lump sum</option>
            <option value="MONTHLY">Monthly installments</option>
            <option value="WEEKLY">Weekly installments</option>
            <option value="CUSTOM">Flexible / Custom installments</option>
          </select>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Notes / Reason (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Rent share, emergency laptop repair, trip split, etc."
            {...register('notes')}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-slate-900 focus:bg-white transition-all resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" size="md" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            Record Loan
          </Button>
        </div>
      </form>
    </Modal>
  );
};
