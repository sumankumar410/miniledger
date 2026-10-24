import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Plus, CreditCard, Bell, Search, RefreshCw, Calendar as CalendarIcon, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { RemindersService } from '../../services/reminders.service';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({
  onOpenSidebar,
  onOpenAddLoan,
  onOpenRecordPayment,
  onRefresh,
  isRefreshing = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [globalSearch, setGlobalSearch] = useState('');
  const [unreadRemindersCount, setUnreadRemindersCount] = useState(0);

  // Formatted current date
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    RemindersService.getReminders().then((data) => {
      const count = (data?.overdue?.length || 0) + (data?.dueToday?.length || 0);
      setUnreadRemindersCount(count);
    });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/loans?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Date */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Center: Global Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:block w-72 lg:w-96">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search loans, friends or ID (Press Enter)..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
          />
        </div>
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Reminders Bell with Badge */}
        <button
          onClick={() => navigate('/reminders')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Due dates & reminders"
        >
          <Bell className="w-4 h-4" />
          {unreadRemindersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-extrabold text-[9px] flex items-center justify-center animate-pulse">
              {unreadRemindersCount}
            </span>
          )}
        </button>

        {/* Quick Record Payment */}
        {onOpenRecordPayment && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenRecordPayment}
            icon={CreditCard}
            className="hidden sm:inline-flex text-xs py-2"
          >
            Payment
          </Button>
        )}

        {/* Quick Add Loan */}
        {onOpenAddLoan && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddLoan}
            icon={Plus}
            className="text-xs py-2"
          >
            <span className="hidden xs:inline">Add</span> Loan
          </Button>
        )}

        {/* User Profile Chip */}
        <Link
          to="/settings"
          className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 ml-1"
          title="Account Settings"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <span className="text-xs font-bold text-slate-800 block leading-tight max-w-[110px] truncate">
              {user?.name || `+91 ${user?.phoneNumber || ''}`}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block leading-tight">
              Settings &rarr;
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};
