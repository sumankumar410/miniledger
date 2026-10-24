import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { RemindersService } from '../services/reminders.service';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatRupee, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  BellRing,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Send,
  Loader2,
  Inbox,
  Settings2,
} from 'lucide-react';

export const Reminders = () => {
  const { openPaymentModal } = useOutletContext() || {};
  const { success, info } = useToast();

  const [reminders, setReminders] = useState(null);
  const [activeTab, setActiveTab] = useState('overdue');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Preference switches
  const [autoRemind7Days, setAutoRemind7Days] = useState(true);
  const [autoRemindDueDay, setAutoRemindDueDay] = useState(true);
  const [autoRemindOverdue, setAutoRemindOverdue] = useState(true);

  const fetchReminders = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      const data = await RemindersService.getReminders();
      setReminders(data);
    } catch (err) {
      console.error('Failed to load reminders', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleSendReminderPrompt = (loan) => {
    // If WhatsApp/SMS is mocked, notify user with friendly copyable message
    const msg = `Hi ${loan.friendName}! Just a gentle reminder regarding the friendly loan of ${formatRupee(
      loan.remainingBalance || loan.amount
    )} due on ${formatDate(loan.dueDate)}. Let me know when convenient! 😊`;

    navigator.clipboard?.writeText(msg);
    success(`Reminder text copied to clipboard for ${loan.friendName}! You can paste it on WhatsApp.`);
  };

  const tabs = [
    { id: 'overdue', label: 'Overdue', count: reminders?.overdue?.length || 0, color: 'text-rose-600' },
    { id: 'dueToday', label: 'Due Today', count: reminders?.dueToday?.length || 0, color: 'text-amber-600' },
    { id: 'dueTomorrow', label: 'Due Tomorrow', count: reminders?.dueTomorrow?.length || 0, color: 'text-amber-600' },
    { id: 'dueWithin7Days', label: 'Within 7 Days', count: reminders?.dueWithin7Days?.length || 0 },
    { id: 'upcomingThisMonth', label: 'This Month', count: reminders?.upcomingThisMonth?.length || 0 },
    { id: 'noDueDate', label: 'No Due Date', count: reminders?.noDueDate?.length || 0 },
  ];

  const currentList = reminders ? reminders[activeTab] || [] : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Due Dates & Reminders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Keep track of upcoming deadlines and prevent missed friend payments.
          </p>
        </div>

        <Button
          variant="ghost"
          size="md"
          onClick={() => fetchReminders(true)}
          isLoading={isRefreshing}
          className="border border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive
                    ? 'bg-slate-100 text-slate-800'
                    : 'bg-slate-200/80 text-slate-600'
                } ${tab.count > 0 && tab.id === 'overdue' ? 'bg-rose-100 text-rose-700' : ''}`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-card">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Checking upcoming due dates...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">All Clear in this Category!</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active loans currently match the "{tabs.find((t) => t.id === activeTab)?.label}" filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((loan) => (
            <div
              key={loan.id}
              className={`bg-white rounded-3xl p-5 border shadow-card flex flex-col justify-between ${
                activeTab === 'overdue'
                  ? 'border-rose-200/80 bg-rose-50/20'
                  : activeTab === 'dueToday'
                  ? 'border-amber-200/80 bg-amber-50/20'
                  : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      {loan.type === 'BORROWED' ? 'Borrowed From' : 'Lent To'}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      <Link to={`/loans/${loan.id}`} className="hover:underline">
                        {loan.friendName}
                      </Link>
                    </h4>
                  </div>
                  <Badge type={loan.type} />
                </div>

                <div className="mt-4 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Outstanding Balance</span>
                    <span className="text-lg font-black text-slate-900">
                      {formatRupee(loan.remainingBalance || loan.amount)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Due Date</span>
                    <span className="font-bold text-slate-800">{formatDate(loan.dueDate)}</span>
                    {loan.daysOverdue && (
                      <span className="block text-[11px] font-bold text-rose-600">
                        {loan.daysOverdue} days overdue
                      </span>
                    )}
                    {loan.daysRemaining !== undefined && (
                      <span className="block text-[11px] font-bold text-amber-700">
                        In {loan.daysRemaining} days
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendReminderPrompt(loan)}
                  icon={Send}
                  className="text-xs py-1.5"
                >
                  Copy WhatsApp Reminder
                </Button>

                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => openPaymentModal(loan)}
                  icon={CheckCircle2}
                  className="text-xs py-1.5"
                >
                  Record Payment
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reminder Preferences Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center gap-2.5">
          <Settings2 className="w-5 h-5 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">In-App Reminder Preferences</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRemind7Days}
              onChange={(e) => setAutoRemind7Days(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="font-semibold text-slate-800">Notify 7 days before due date</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRemindDueDay}
              onChange={(e) => setAutoRemindDueDay(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="font-semibold text-slate-800">Notify on the exact due date</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRemindOverdue}
              onChange={(e) => setAutoRemindOverdue(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="font-semibold text-slate-800">Daily alert for overdue balances</span>
          </label>
        </div>
      </div>
    </div>
  );
};
