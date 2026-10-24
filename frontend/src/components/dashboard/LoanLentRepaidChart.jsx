import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { formatRupee } from '../../utils/formatters';

export const LoanLentRepaidChart = ({ summary }) => {
  if (!summary) return null;

  const data = [
    {
      name: 'Total Lent',
      amount: parseFloat(summary.totalLent || '0'),
      color: '#0f172a', // Navy 900
    },
    {
      name: 'Repaid',
      amount: parseFloat(summary.totalRepaid || '0'),
      color: '#10b981', // Emerald 500
    },
    {
      name: 'Outstanding',
      amount: parseFloat(summary.outstandingBalance || '0'),
      color: '#f59e0b', // Amber 500
    },
    {
      name: 'Overdue',
      amount: parseFloat(summary.overdueAmount || '0'),
      color: '#f43f5e', // Rose 500
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-800">
          <p className="font-semibold">{item.name}</p>
          <p className="text-emerald-400 font-bold mt-0.5">{formatRupee(item.amount)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Financial Distribution</h4>
          <p className="text-xs text-slate-500">Summary breakdown of your lending activity</p>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
