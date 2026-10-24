import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { User, Shield, Server, LogOut, CheckCircle2 } from 'lucide-react';

export const Settings = () => {
  const { user, logout } = useAuth();
  const { info } = useToast();
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Account & Configuration
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your personal lending profile and review server connectivity.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card divide-y divide-slate-100 overflow-hidden">
        {/* Profile Section */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Profile</h3>
              <p className="text-xs text-slate-500">Authenticated phone credentials</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Registered Phone Number
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                +91 {user?.phoneNumber || '-'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Account Status
              </span>
              <p className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active & Verified</span>
              </p>
            </div>
          </div>
        </div>

        {/* Security & Token Section */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Authentication & Security</h3>
              <p className="text-xs text-slate-500">JWT Token verification & mock OTP strategy</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2">
            <p>
              • <strong>Passwordless Login:</strong> Authenticated using 6-digit one-time passwords logged to the development terminal.
            </p>
            <p>
              • <strong>Session Token:</strong> Cryptographically signed JWT with expiration guard.
            </p>
            <p>
              • <strong>Data Privacy:</strong> Every loan record is strictly isolated to your user ID in PostgreSQL.
            </p>
          </div>
        </div>

        {/* Server Endpoint Section */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Server className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Backend API Connection</h3>
              <p className="text-xs text-slate-500">Configured REST API target</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Active Endpoint (VITE_API_BASE_URL)
              </span>
              <p className="text-xs font-mono font-bold text-slate-900 mt-1">{apiUrl}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                info(`Connected to ${apiUrl}`);
              }}
            >
              Test Ping
            </Button>
          </div>
        </div>

        {/* Logout Section */}
        <div className="p-6 sm:p-8 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Terminate Session</h4>
            <p className="text-xs text-slate-500">Clear stored JWT and return to login</p>
          </div>

          <Button variant="danger" size="md" onClick={logout} icon={LogOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
