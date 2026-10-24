import React from 'react';
import { Wallet, Terminal, Smartphone, UserPlus, LogIn } from 'lucide-react';

export const AuthNavbar = ({ mode, onModeChange }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-slate-900 tracking-tight">MiniLedger</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                2.0
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Personal Friends Lending Tracker
            </span>
          </div>
        </div>

        {/* Center / Right: OTP Status Badge & Mode Switch */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Twilio & Terminal Badge */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>Twilio SMS</span>
              <span className="text-slate-300">|</span>
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terminal Base OTP</span>
            </div>
          </div>

          {/* Switch Tabs between Login and Create Account */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('register')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
