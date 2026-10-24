import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoanService } from '../services/loan.service';
import { RemindersService } from '../services/reminders.service';
import { FriendsService } from '../services/friends.service';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatRupee, formatDate } from '../utils/formatters';
import { getDaysRemainingOrOverdue } from '../utils/date';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  CreditCard,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Users,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const Dashboard = () => {
  const { user } = useAuth();
  const { openAddLoanModal, openPaymentModal } = useOutletContext() || {};

  const [summary, setSummary] = useState(null);
  const [recentLoans, setRecentLoans] = useState([]);
  const [reminders, setReminders] = useState(null);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setHasError(false);

      const [summaryData, loansData, remindersData, friendsData] = await Promise.all([
        LoanService.getSummary(),
        LoanService.getLoans({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
        RemindersService.getReminders(),
        FriendsService.listFriends(),
      ]);

      setSummary(summaryData);
      setRecentLoans(loansData.loans || []);
      setReminders(remindersData);
      setFriends(friendsData || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const handleDataChanged = () => fetchDashboardData(true);
    window.addEventListener('miniledger_loan_created', handleDataChanged);
    return () => window.removeEventListener('miniledger_loan_created', handleDataChanged);
  }, [fetchDashboardData]);

  if (hasError) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12 space-y-4 shadow-card">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Failed to Load Dashboard</h3>
        <p className="text-xs text-slate-500">
          Could not communicate with the backend server. Please verify your connection.
        </p>
        <Button variant="primary" size="sm" onClick={() => fetchDashboardData()}>
          Retry Again
        </Button>
      </div>
    );
  }

  // Monthly activity chart data
  const chartData = summary?.monthlyActivity || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            MiniLedger 2.0 Personal Dashboard
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome, {user?.name ? user.name : user?.phoneNumber ? `+91 ${user.phoneNumber}` : 'User'}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personal friend-to-friend lending and borrowing tracker.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="md"
            onClick={() => fetchDashboardData(true)}
            isLoading={isRefreshing}
            className="border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => openPaymentModal()}
            icon={CreditCard}
          >
            Payment
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={openAddLoanModal}
            icon={Plus}
          >
            Add Loan
          </Button>
        </div>
      </div>

      {/* Overdue Warning Alert Banner (if any) */}
      {summary && parseFloat(summary.overdueAmount || '0') > 0 && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Action Required: Overdue Loans
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                You have <span className="font-bold">{formatRupee(summary.overdueAmount)}</span> in
                overdue balance that has passed its scheduled repayment date.
              </p>
            </div>
          </div>
          <Link
            to="/reminders"
            className="text-xs font-bold bg-rose-600 text-white px-3.5 py-2 rounded-xl hover:bg-rose-700 transition"
          >
            View Overdue List
          </Link>
        </div>
      )}

      {/* 8 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Money Lent */}
        <SummaryCard
          title="Total Lent"
          amount={summary?.totalLent}
          subtitle="Money given to friends"
          icon={ArrowUpRight}
          variant="default"
        />

        {/* 2. Total Money Borrowed */}
        <SummaryCard
          title="Total Borrowed"
          amount={summary?.totalBorrowed}
          subtitle="Money taken from friends"
          icon={ArrowDownLeft}
          variant="default"
        />

        {/* 3. Repayments Received */}
        <SummaryCard
          title="Repayments Received"
          amount={summary?.totalRepaymentsReceived}
          subtitle="Collected back from friends"
          icon={CheckCircle2}
          variant="emerald"
        />

        {/* 4. Repayments Made */}
        <SummaryCard
          title="Repayments Made"
          amount={summary?.totalRepaymentsMade}
          subtitle="Returned back to friends"
          icon={CheckCircle2}
          variant="emerald"
        />

        {/* 5. Outstanding Receivables */}
        <SummaryCard
          title="Receivables (Friends Owe You)"
          amount={summary?.outstandingReceivables}
          subtitle="Net money pending to receive"
          icon={Clock}
          variant="amber"
          count={summary?.pendingLoans}
        />

        {/* 6. Outstanding Payables */}
        <SummaryCard
          title="Payables (You Owe Friends)"
          amount={summary?.outstandingPayables}
          subtitle="Net money you need to return"
          icon={Clock}
          variant="amber"
        />

        {/* 7. Overdue Amount */}
        <SummaryCard
          title="Overdue Amount"
          amount={summary?.overdueAmount}
          subtitle="Past due dates"
          icon={AlertTriangle}
          variant="rose"
        />

        {/* 8. Upcoming Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Upcoming (30 Days)
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary?.upcomingPayments || 0}{' '}
              <span className="text-sm font-semibold text-slate-500">payments</span>
            </h3>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Due within next month</span>
              <Link to="/reminders" className="font-bold text-emerald-700 hover:text-emerald-800">
                View &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Monthly Lending Activity</h3>
            <p className="text-xs text-slate-500">Comparison of money Lent vs Borrowed vs Repaid</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-800">
              <span className="w-3 h-3 rounded bg-slate-900" /> Money Lent
            </span>
            <span className="flex items-center gap-1.5 text-indigo-700">
              <span className="w-3 h-3 rounded bg-indigo-600" /> Borrowed
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded bg-emerald-500" /> Repaid
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="lent" fill="#0f172a" radius={[6, 6, 0, 0]} name="Money Lent" />
              <Bar dataKey="borrowed" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Money Borrowed" />
              <Bar dataKey="repaid" fill="#10b981" radius={[6, 6, 0, 0]} name="Repaid" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Layout: Friends with Balances & Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Friends with Outstanding Balances */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Friends Balances</h3>
              </div>
              <Link to="/friends" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                View All Friends &rarr;
              </Link>
            </div>

            {friends.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No friends added yet.</p>
            ) : (
              <div className="space-y-3">
                {friends.slice(0, 5).map((friend) => {
                  const net = parseFloat(friend.netBalance || '0');
                  return (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{friend.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {friend.activeLoansCount} active transaction(s)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            net > 0 ? 'text-emerald-700' : net < 0 ? 'text-indigo-700' : 'text-slate-500'
                          }`}
                        >
                          {net > 0
                            ? `+${formatRupee(net)} (owes you)`
                            : net < 0
                            ? `${formatRupee(Math.abs(net))} (you owe)`
                            : 'Settled'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Due Payments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Upcoming Payments</h3>
              </div>
              <Link to="/reminders" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                All Reminders &rarr;
              </Link>
            </div>

            {(!reminders || (reminders.dueToday?.length === 0 && reminders.dueWithin7Days?.length === 0)) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming payments due in the next 7 days.</p>
            ) : (
              <div className="space-y-3">
                {[...(reminders?.dueToday || []), ...(reminders?.dueWithin7Days || [])].slice(0, 5).map((loan) => {
                  const dueInfo = getDaysRemainingOrOverdue(loan.dueDate);
                  return (
                    <div
                      key={loan.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{loan.friendName}</p>
                        <p className="text-[11px] text-slate-500">Due {formatDate(loan.dueDate)} ({dueInfo.text})</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{formatRupee(loan.remainingBalance || loan.amount)}</span>
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => openPaymentModal(loan)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          Pay
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Loans Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Loans Activity</h3>
            <p className="text-xs text-slate-500">Quick list of newly recorded transactions</p>
          </div>
          <Link
            to="/loans"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table representation */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Friend</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Principal</th>
                  <th className="py-3 px-3">Remaining</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No loans recorded yet. Click "Add Loan" above to get started!
                    </td>
                  </tr>
                ) : (
                  recentLoans.map((loan) => {
                    const dueInfo = getDaysRemainingOrOverdue(loan.dueDate);
                    const status = loan.isRepaid
                      ? 'SETTLED'
                      : dueInfo.isOverdue
                      ? 'OVERDUE'
                      : 'OUTSTANDING';

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                          <Link to={`/loans/${loan.id}`} className="hover:underline">
                            {loan.friendName}
                          </Link>
                        </td>
                        <td className="py-3.5 px-3">
                          <Badge type={loan.type} />
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-900">
                          {formatRupee(loan.amount)}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {formatRupee(loan.remainingBalance || (loan.isRepaid ? 0 : loan.amount))}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          {formatDate(loan.dueDate)}
                        </td>
                        <td className="py-3.5 px-3">
                          <Badge status={status} />
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          {!loan.isRepaid ? (
                            <Button
                              variant="emerald"
                              size="sm"
                              onClick={() => openPaymentModal(loan)}
                              className="text-xs py-1"
                            >
                              Record Payment
                            </Button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700">Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
