import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PaymentsService } from '../services/payments.service';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatRupee, formatDate } from '../utils/formatters';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Loader2,
  Inbox,
} from 'lucide-react';

export const Payments = () => {
  const { openPaymentModal } = useOutletContext() || {};

  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPayments = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      const data = await PaymentsService.listPayments();
      setPayments(data || []);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();

    const handleDataChanged = () => fetchPayments(true);
    window.addEventListener('miniledger_loan_created', handleDataChanged);
    return () => window.removeEventListener('miniledger_loan_created', handleDataChanged);
  }, [fetchPayments]);

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.friendName.toLowerCase().includes(q) ||
      (p.reference && p.reference.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Payments Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full transaction history of full and partial repayments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="md"
            onClick={() => fetchPayments(true)}
            isLoading={isRefreshing}
            className="border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => openPaymentModal()}
            icon={CreditCard}
            className="flex-1 sm:flex-none"
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Payment Method Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          {['ALL', 'UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'].map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                methodFilter === method
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {method === 'ALL'
                ? 'All Methods'
                : method === 'BANK_TRANSFER'
                ? 'Bank Transfer'
                : method}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payments, friend or ref..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table of Payments */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-card">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading payment records...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">No payment records found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When repayments are recorded (partial or full installments), they will appear here.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openPaymentModal()}
            icon={CreditCard}
          >
            Record Payment Now
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Payment Date</th>
                  <th className="py-3 px-3">Friend</th>
                  <th className="py-3 px-3">Direction</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3 font-bold text-slate-900">Amount Paid</th>
                  <th className="py-3 px-4 sm:px-6">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-700">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      <Link to={`/loans/${p.loanId}`} className="hover:underline text-emerald-800">
                        {p.friendName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge type={p.loanType} />
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-emerald-700 text-base">
                      +{formatRupee(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500">
                      {p.reference && <span className="font-mono text-slate-700 block">{p.reference}</span>}
                      {p.notes && <span className="italic block text-slate-400">{p.notes}</span>}
                      {!p.reference && !p.notes && <span>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
