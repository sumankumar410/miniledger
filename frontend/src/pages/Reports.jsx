import React, { useState, useEffect } from 'react';
import { LoanService } from '../services/loan.service';
import { PaymentsService } from '../services/payments.service';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatRupee, formatDate } from '../utils/formatters';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  Calendar,
  Loader2,
  TrendingUp,
} from 'lucide-react';

export const Reports = () => {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      LoanService.getLoans({ limit: 100 }),
      PaymentsService.listPayments(),
      LoanService.getSummary(),
    ]).then(([loansRes, paymentsData, summaryData]) => {
      setLoans(loansRes.loans || []);
      setPayments(paymentsData || []);
      setSummary(summaryData);
      setIsLoading(false);
    });
  }, []);

  const filteredLoans = loans.filter((l) => {
    if (typeFilter !== 'ALL' && l.type !== typeFilter) return false;
    return true;
  });

  const exportToCSV = () => {
    if (filteredLoans.length === 0) return;

    const headers = ['ID', 'Friend Name', 'Type', 'Amount (INR)', 'Paid (INR)', 'Remaining (INR)', 'Loan Date', 'Due Date', 'Status'];
    const rows = filteredLoans.map((l) => [
      l.id,
      `"${l.friendName}"`,
      l.type,
      l.amount,
      l.totalPaid || 0,
      l.remainingBalance || 0,
      formatDate(l.loanDate || l.createdAt),
      formatDate(l.dueDate),
      l.isRepaid ? 'SETTLED' : 'OUTSTANDING',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `miniledger_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial Reports & Statements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Export data, print balance sheets, and review friend lending summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrint}
            icon={Printer}
            className="text-xs"
          >
            Print Statement
          </Button>
          <Button
            variant="emerald"
            size="md"
            onClick={exportToCSV}
            icon={Download}
            className="text-xs"
          >
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Aggregate Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Net Receivables (Owed to You)
          </span>
          <h3 className="text-2xl font-black text-emerald-700 mt-2">
            {formatRupee(summary?.outstandingReceivables)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">From all money lent</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Net Payables (You Owe)
          </span>
          <h3 className="text-2xl font-black text-indigo-700 mt-2">
            {formatRupee(summary?.outstandingPayables)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">From all money borrowed</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Overdue Amount
          </span>
          <h3 className="text-2xl font-black text-rose-700 mt-2">
            {formatRupee(summary?.overdueAmount)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Past repayment due date</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-xs">
        {['ALL', 'LENT', 'BORROWED'].map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {type === 'ALL' ? 'All' : type === 'LENT' ? 'Money Lent' : 'Borrowed'}
          </button>
        ))}
      </div>

      {/* Main Statement Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Personal Lending Ledger Statement</h3>
          <span className="text-xs text-slate-400">{filteredLoans.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Friend Name</th>
                <th className="py-3 px-3">Direction</th>
                <th className="py-3 px-3">Principal</th>
                <th className="py-3 px-3">Paid Back</th>
                <th className="py-3 px-3 font-bold text-slate-900">Remaining</th>
                <th className="py-3 px-3">Loan Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    {l.friendName}
                  </td>
                  <td className="py-3.5 px-3">
                    <Badge type={l.type} />
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-900">{formatRupee(l.amount)}</td>
                  <td className="py-3.5 px-3 text-emerald-700 font-semibold">{formatRupee(l.totalPaid || 0)}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">
                    {formatRupee(l.remainingBalance || (l.isRepaid ? 0 : l.amount))}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">{formatDate(l.loanDate || l.createdAt)}</td>
                  <td className="py-3.5 px-3 text-slate-500">{formatDate(l.dueDate)}</td>
                  <td className="py-3.5 px-4 sm:px-6">
                    <Badge status={l.isRepaid ? 'SETTLED' : 'OUTSTANDING'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
