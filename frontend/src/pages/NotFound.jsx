import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-card text-center max-w-md w-full space-y-4">
        <h1 className="text-6xl font-black text-slate-900 tracking-tight">404</h1>
        <h3 className="text-lg font-bold text-slate-800">Page Not Found</h3>
        <p className="text-xs text-slate-500">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="pt-2">
          <Link to="/dashboard">
            <Button variant="primary" size="md" icon={Home} fullWidth>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
