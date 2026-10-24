import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams, Link } from 'react-router-dom';
import { LoanService } from '../services/loan.service';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatRupee, formatDate } from '../utils/formatters';
import { getDaysRemainingOrOverdue } from '../utils/date';
import {
  Plus,
  ArrowUpDown,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  ChevronRight,
  Loader2,
  Inbox,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const Loans = () => {
  const { openAddLoanModal, openPaymentModal } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();

  const typeParam = searchParams.get('type') || 'ALL';
  const searchParam = searchParams.get('search') || '';

  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState(typeParam);
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync with URL params
  useEffect(() => {
    if (typeParam !== type) setType(typeParam);
  }, [typeParam]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchLoans = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setIsLoading(true);
        else setIsRefreshing(true);

        const [loansRes, summaryRes] = await Promise.all([
          LoanService.getLoans({
            type: type === 'ALL' ? undefined : type,
            status: status === 'ALL' ? undefined : status,
            search: debouncedSearch,
            page: pagination.page,
            limit: pagination.limit,
            sortBy,
            sortOrder,
          }),
          LoanService.getSummary(),
        ]);

        setLoans(loansRes.loans || []);
        if (loansRes.pagination) {
          setPagination(loansRes.pagination);
        }
        setSummary(summaryRes);
      } catch (err) {
        console.error('Failed to fetch loans', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [type, status, debouncedSearch, pagination.page, pagination.limit, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchLoans();

    const handleLoanCreated = () => fetchLoans(true);
    window.addEventListener('miniledger_loan_created', handleLoanCreated);
    return () => window.removeEventListener('miniledger_loan_created', handleLoanCreated);
  }, [fetchLoans]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {type === 'LENT'
              ? 'Money Lent (Receivables)'
              : type === 'BORROWED'
              ? 'Money Borrowed (Payables)'
              : 'All Personal Loans'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Filter, search and record installments across all your personal records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="md"
            onClick={() => fetchLoans(true)}
            isLoading={isRefreshing}
            className="border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={toggleSort}
            className="text-xs"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort: {sortOrder.toUpperCase()}</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={openAddLoanModal}
            icon={Plus}
            className="flex-1 sm:flex-none"
          >
            Add Loan
          </Button>
        </div>
      </div>

      {/* Filter Bar: Direction Type + Status Tabs + Search */}
      <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-card">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Direction Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar gap-1">
            {[
              { id: 'ALL', label: 'All Transactions' },
              { id: 'LENT', label: 'Money Lent' },
              { id: 'BORROWED', label: 'Money Borrowed' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setType(t.id);
                  setSearchParams({ type: t.id });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  type === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by friend, loan ID..."
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>
        </div>

        {/* Status Sub-tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {['ALL', 'OUTSTANDING', 'REPAID', 'OVERDUE'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                status === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL'
                ? 'All Statuses'
                : s === 'OUTSTANDING'
                ? 'Outstanding'
                : s === 'REPAID'
                ? 'Settled'
                : 'Overdue'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Loan List */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-card">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Retrieving loans...</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">No loans found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No records matched your filters. Adjust your query or record a new loan.
          </p>
          <Button variant="primary" size="sm" onClick={openAddLoanModal} icon={Plus}>
            Add Loan
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Friend / Borrower</th>
                    <th className="py-3.5 px-3">Type</th>
                    <th className="py-3.5 px-3">Principal</th>
                    <th className="py-3.5 px-3">Paid</th>
                    <th className="py-3.5 px-3 font-bold text-slate-900">Remaining</th>
                    <th className="py-3.5 px-3">Due Date</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map((loan) => {
                    const dueInfo = getDaysRemainingOrOverdue(loan.dueDate);
                    const statusVal = loan.isRepaid
                      ? 'SETTLED'
                      : dueInfo.isOverdue
                      ? 'OVERDUE'
                      : 'OUTSTANDING';

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <Link
                            to={`/loans/${loan.id}`}
                            className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-2"
                          >
                            <span>{loan.friendName}</span>
                          </Link>
                        </td>
                        <td className="py-4 px-3">
                          <Badge type={loan.type} />
                        </td>
                        <td className="py-4 px-3 font-medium text-slate-800">
                          {formatRupee(loan.amount)}
                        </td>
                        <td className="py-4 px-3 text-emerald-700 font-semibold">
                          {formatRupee(loan.totalPaid || 0)}
                        </td>
                        <td className="py-4 px-3 font-black text-slate-900">
                          {formatRupee(loan.remainingBalance || (loan.isRepaid ? 0 : loan.amount))}
                        </td>
                        <td className="py-4 px-3">
                          <span className="text-slate-800 font-medium block">
                            {formatDate(loan.dueDate)}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              dueInfo.isOverdue ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {dueInfo.text}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <Badge status={statusVal} />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!loan.isRepaid && (
                              <Button
                                variant="emerald"
                                size="sm"
                                onClick={() => openPaymentModal(loan)}
                                icon={CreditCard}
                                className="text-xs py-1 px-2.5"
                              >
                                Pay
                              </Button>
                            )}
                            <Link
                              to={`/loans/${loan.id}`}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {loans.map((loan) => {
              const dueInfo = getDaysRemainingOrOverdue(loan.dueDate);
              const statusVal = loan.isRepaid
                ? 'SETTLED'
                : dueInfo.isOverdue
                ? 'OVERDUE'
                : 'OUTSTANDING';

              return (
                <div
                  key={loan.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge type={loan.type} className="mb-1" />
                      <h4 className="text-base font-extrabold text-slate-900">
                        <Link to={`/loans/${loan.id}`}>{loan.friendName}</Link>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">Due {formatDate(loan.dueDate)}</p>
                    </div>
                    <Badge status={statusVal} />
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Remaining Balance</span>
                      <span className="text-base font-black text-slate-900">
                        {formatRupee(loan.remainingBalance || (loan.isRepaid ? 0 : loan.amount))}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Principal</span>
                      <span className="font-semibold text-slate-800">{formatRupee(loan.amount)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/loans/${loan.id}`}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900"
                    >
                      View Details &rarr;
                    </Link>

                    {!loan.isRepaid && (
                      <Button
                        variant="emerald"
                        size="sm"
                        onClick={() => openPaymentModal(loan)}
                        icon={CreditCard}
                        className="text-xs py-1"
                      >
                        Record Payment
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-card text-xs text-slate-600">
              <span>
                Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
                <span className="font-bold text-slate-900">{pagination.totalPages}</span>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
