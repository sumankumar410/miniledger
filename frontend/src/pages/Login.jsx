import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthService } from '../services/auth.service';
import { Button } from '../components/ui/Button';
import { AuthNavbar } from '../components/layout/AuthNavbar';
import {
  Wallet,
  Smartphone,
  KeyRound,
  ArrowRight,
  Terminal,
  CheckCircle2,
  User,
  Mail,
  ShieldCheck,
  Send,
  Sparkles,
} from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  // Mode: 'login' (Sign In) or 'register' (Create Account)
  const [mode, setMode] = useState('login');

  // Step 1: Input details, Step 2: Enter OTP
  const [step, setStep] = useState(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState(null);

  // Countdown timer for OTP resend (30 seconds)
  const [countdown, setCountdown] = useState(0);

  // Sync mode from URL query or path if present
  useEffect(() => {
    if (location.pathname === '/register' || location.search.includes('mode=register')) {
      setMode('register');
    }
  }, [location]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setStep(1);
    setOtp('');
    setErrorMessage(null);
  };

  // Step 1: Send OTP for Login or Create Account
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);

    // Validation for Create Account
    if (mode === 'register') {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMessage('Please enter your full name (minimum 2 characters)');
        return;
      }
    }

    // Phone validation
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    if (!cleaned || cleaned.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setIsLoading(true);
      const res = await AuthService.sendOtp(
        cleaned,
        mode === 'register' ? fullName.trim() : null,
        mode === 'register' && email.trim() ? email.trim() : null
      );

      const isTwilio = res?.deliveredVia === 'TWILIO_SMS';
      setDeliveryMethod(isTwilio ? 'Twilio SMS' : 'Terminal Console');

      success(
        isTwilio
          ? 'OTP dispatched via Twilio SMS to your mobile!'
          : 'OTP generated! Check your backend terminal to view the mock code.'
      );

      setStep(2);
      setCountdown(30);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);

    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code');
      return;
    }

    try {
      setIsLoading(true);
      const cleaned = phoneNumber.replace(/[\s-]/g, '');
      const data = await AuthService.verifyOtp(
        cleaned,
        otp,
        mode === 'register' ? fullName.trim() : null,
        mode === 'register' && email.trim() ? email.trim() : null
      );

      login(data.token, data.user);
      success(
        mode === 'register'
          ? `Welcome to MiniLedger, ${data.user?.name || 'Friend'}! Your account is created.`
          : 'Welcome back! Authentication successful.'
      );
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Top Auth Navbar */}
      <AuthNavbar mode={mode} onModeChange={switchMode} />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 max-w-md w-full mx-auto">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {/* Header & Tabs */}
          <div className="mb-6">
            {step === 1 ? (
              <>
                {/* Tabs: Sign In / Create Account */}
                <div className="flex border-b border-slate-100 pb-3 mb-4">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`flex-1 pb-2 text-sm font-bold text-center border-b-2 transition-all ${
                      mode === 'login'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`flex-1 pb-2 text-sm font-bold text-center border-b-2 transition-all ${
                      mode === 'register'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'register'
                    ? 'Enter your name and phone number to create your lending tracker ledger'
                    : 'Enter your registered mobile number to sign in securely with OTP'}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Step 2: Verification
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Enter 6-Digit OTP
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'register' && fullName ? `Hi ${fullName}, enter ` : 'Enter '}
                  the verification code sent for <span className="font-bold text-slate-800">+91 {phoneNumber}</span>
                </p>
              </>
            )}
          </div>

          {/* Error Message banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium leading-relaxed">
              {errorMessage}
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Phone / Registration Form */
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Full Name field (Only in Create Account mode) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      autoFocus
                      required
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Mobile Number field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9876543210"
                    autoFocus={mode === 'login'}
                    maxLength={15}
                    required
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">10-digit Indian phone number</p>
              </div>

              {/* Optional Email field (Only in Create Account mode) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul@example.com"
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant={mode === 'register' ? 'emerald' : 'primary'}
                size="lg"
                fullWidth
                isLoading={isLoading}
                icon={Send}
                className="mt-2"
              >
                {mode === 'register' ? 'Create Account & Send OTP' : 'Send OTP'}
              </Button>

              {/* Switch link */}
              <div className="text-center pt-2">
                {mode === 'register' ? (
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-slate-900 hover:underline"
                    >
                      Sign In here
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    New to MiniLedger?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                )}
              </div>
            </form>
          ) : (
            /* STEP 2: OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    autoFocus
                    maxLength={6}
                    className="w-full pl-10 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold tracking-widest text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all text-center"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="emerald"
                size="lg"
                fullWidth
                isLoading={isLoading}
                icon={CheckCircle2}
              >
                {mode === 'register' ? 'Complete Registration' : 'Verify & Log In'}
              </Button>

              {/* Resend & Change Details */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setErrorMessage(null);
                  }}
                  className="text-slate-500 hover:text-slate-900 font-medium"
                >
                  &larr; Change {mode === 'register' ? 'details' : 'phone'}
                </button>

                <button
                  type="button"
                  disabled={countdown > 0 || isLoading}
                  onClick={handleSendOtp}
                  className={`font-semibold ${
                    countdown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* 3. Delivery Method & Terminal Base Explainer Box */}
          <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <Terminal className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Twilio SMS & Terminal Base OTP</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    Dual Mode
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  • <strong>Twilio SMS</strong>: If Twilio credentials are configured in backend <code className="bg-slate-200/60 px-1 rounded">.env</code>, an SMS is sent to your mobile.
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  • <strong>Terminal Base</strong>: Look at your <span className="font-semibold text-slate-700">backend server terminal</span> — the 6-digit OTP is automatically printed in the console for instant testing!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured with JWT and 5-minute Mock/Twilio OTP verification</span>
        </div>
      </main>
    </div>
  );
};

export default Login;
