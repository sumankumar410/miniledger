import React from 'react';
import { Search } from 'lucide-react';

export const LoanFilterBar = ({
  status,
  onStatusChange,
  searchTerm,
  onSearchChange,
  counts = {},
}) => {
  const tabs = [
    { id: 'ALL', label: 'All', count: counts.totalLoans },
    { id: 'OUTSTANDING', label: 'Outstanding', count: counts.pendingLoans },
    { id: 'REPAID', label: 'Repaid', count: counts.repaidLoans },
    { id: 'OVERDUE', label: 'Overdue', count: counts.overdueLoans },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Tabs */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = status === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative min-w-[200px] sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by friend..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
        />
      </div>
    </div>
  );
};
