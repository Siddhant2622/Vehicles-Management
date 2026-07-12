"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTransitStore, UserRole } from '@/lib/store/transitStore';
import { Lock, Mail, ShieldAlert, KeyRound, Truck, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean(),
  role: z.custom<UserRole>(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const PRESET_ACCOUNTS = [
  { role: 'Administrator' as UserRole, email: 'admin@transitops.com', label: 'Admin (Full Access)' },
  { role: 'Fleet Manager' as UserRole, email: 'manager@transitops.com', label: 'Fleet Manager' },
  { role: 'Dispatcher' as UserRole, email: 'dispatcher@transitops.com', label: 'Dispatcher' },
  { role: 'Safety Officer' as UserRole, email: 'safety@transitops.com', label: 'Safety Officer' },
  { role: 'Financial Analyst' as UserRole, email: 'finance@transitops.com', label: 'Financial Analyst' },
];

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, setRememberMe, currentUser } = useTransitStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: 'password123',
      rememberMe: false,
      role: 'Fleet Manager',
    },
  });

  const [showResubmitLink, setShowResubmitLink] = useState(false);
  const [resubmitEmail, setResubmitEmail] = useState('');
  const selectedRole = watch('role');

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    setShowResubmitLink(false);
    try {
      const success = await loginWithEmail(data.email, data.role, data.password);
      if (success) {
        setRememberMe(data.rememberMe);
        router.push('/dashboard');
      } else {
        setError('Invalid credentials or role mismatch.');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Authentication failed. Please verify your credentials.';
      setError(errMsg);
      if (errMsg.includes('Additional Information Required')) {
        setShowResubmitLink(true);
        setResubmitEmail(data.email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await loginWithGoogle(selectedRole);
      if (success) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err?.message === 'ACCOUNT_NOT_FOUND') {
        // Redirect to signup with the Google email pre-filled
        const googleEmail = err.googleEmail || '';
        router.push(`/signup?email=${encodeURIComponent(googleEmail)}`);
        return;
      }
      setError(err?.message || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillPreset = (email: string, role: UserRole) => {
    setValue('email', email);
    setValue('role', role);
    setValue('password', 'password123');
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Brand & Marketing side */}
      <div className="relative hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-12 flex-col justify-between overflow-hidden border-r border-slate-800/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">TransitOps</span>
        </div>

        <div className="relative z-10 my-auto py-12 max-w-lg space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight text-white">
            Smart Transport <br />
            <span className="text-indigo-400">Operations Platform</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Streamline fleet operations, tracking, dispatch scheduling, automated compliance auditing, maintenance dispatch, and financial forecasting with our premium analytics suite.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-3">
              <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs font-bold">JD</div>
              <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs font-bold">MC</div>
              <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs font-bold">LF</div>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Trusted by 12,000+ dispatchers and logistics operators globally.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
          <p>© 2026 TransitOps Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Login Form side */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 min-h-screen p-6 md:p-16 bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">Sign In</h2>
            <p className="text-slate-400 text-sm">Enter your enterprise credentials to access your console</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm space-y-2">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              {showResubmitLink && (
                <div className="pt-2 border-t border-red-500/20">
                  <Link
                    href={`/signup?resubmit=true&email=${encodeURIComponent(resubmitEmail)}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline block"
                  >
                    Click here to complete the resubmission form
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enterprise Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 transition-all text-sm"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Password</label>
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Access Clearance Role</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <select
                    {...register('role')}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 transition-all text-sm appearance-none"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Fleet Manager">Fleet Manager</option>
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950"
                />
                Remember this terminal session
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? 'Authenticating secure session...' : 'Initiate Operations Console'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800/60" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-950 px-2 text-slate-500">Or credentials connection</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign In with Google
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign Up
            </Link>
          </p>

          {/* Presets panel for testing */}
          <div className="pt-6 border-t border-slate-800/60 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Demo Credentials (Role-based testing)
            </p>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_ACCOUNTS.map((preset) => (
                <button
                  key={preset.role}
                  type="button"
                  onClick={() => handleFillPreset(preset.email, preset.role)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-950/40 text-left transition-all text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200">{preset.label}</span>
                    <span className="block text-[10px] text-slate-500">{preset.email}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-medium text-slate-400 group-hover:bg-indigo-500/20">
                    Auto-Fill
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
