"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransitStore, UserRole } from '@/lib/store/transitStore';
import { 
  User, Mail, Phone, ShieldCheck, Briefcase, Eye, EyeOff, 
  ArrowRight, ShieldAlert, BadgeInfo, CheckCircle, FileText 
} from 'lucide-react';

// Zod Validation Schema
const signupSchema = zod.object({
  firstName: zod.string().min(2, 'First name must be at least 2 characters'),
  lastName: zod.string().min(2, 'Last name must be at least 2 characters'),
  email: zod.string().email('Please enter a valid enterprise email'),
  phoneNumber: zod.string().min(8, 'Please enter a valid phone number'),
  employeeId: zod.string().optional(),
  department: zod.string().min(2, 'Department is required'),
  designation: zod.string().min(2, 'Designation is required'),
  role: zod.enum([
    'Administrator', 
    'Fleet Manager', 
    'Dispatcher', 
    'Safety Officer', 
    'Financial Analyst',
    'Driver',
    'Maintenance Manager',
    'Viewer',
    'Security'
  ] as const),
  profilePhoto: zod.string().optional(),
  password: zod.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: zod.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type SignupFormValues = zod.infer<typeof signupSchema>;

export default function SignupPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">Loading signup...</div>}>
      <SignupForm />
    </React.Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resubmitEmail = searchParams.get('email');
  const isResubmitting = searchParams.get('resubmit') === 'true';

  const { registerRequest, users, updateUserRequestFields, authLoading } = useTransitStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<any | null>(null);
  const [resubmitUser, setResubmitUser] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Setup resubmit user if email is provided
  useEffect(() => {
    if (isResubmitting && resubmitEmail) {
      const match = users.find(u => u.email.toLowerCase() === resubmitEmail.toLowerCase());
      if (match && match.approvalStatus === 'Information Required') {
        setResubmitUser(match);
      }
    }
  }, [isResubmitting, resubmitEmail, users]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: resubmitEmail || '',
      phoneNumber: '',
      employeeId: '',
      department: 'Operations',
      designation: '',
      role: 'Fleet Manager',
      profilePhoto: '',
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    try {
      const browser = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown Browser';
      
      const payload = {
        email: data.email,
        fullName: `${data.firstName} ${data.lastName}`,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        profilePhoto: data.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
        phoneNumber: data.phoneNumber,
        employeeId: data.employeeId || '',
        department: data.department,
        designation: data.designation,
        registrationIp: '192.168.1.7', // Simulator IP
        deviceInformation: 'Desktop PC',
        browserInformation: browser,
      };

      const result = await registerRequest(payload, data.password);
      if (result.success) {
        setRegisteredUser({
          ...payload,
          approvalStatus: 'Pending Approval'
        });
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit registration request.');
    }
  };

  // Handle Resubmission
  const [resubmitFields, setResubmitFields] = useState<Record<string, string>>({});
  
  const handleResubmitValueChange = (field: string, val: string) => {
    setResubmitFields(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitUser) return;
    setError(null);
    try {
      const result = await updateUserRequestFields(resubmitUser.id, resubmitFields);
      if (result.success) {
        setSuccessMsg("Your corrected details have been resubmitted successfully. Please await Administrator approval.");
        setResubmitUser(null);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit resubmission.');
    }
  };

  // Success view for resubmission
  if (successMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="p-8 max-w-md w-full glass-panel rounded-2xl text-center space-y-6 shadow-2xl border border-indigo-500/20">
          <div className="inline-flex p-4 rounded-full bg-indigo-500/10 text-indigo-400">
            <CheckCircle size={48} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Resubmitted Successfully</h2>
          <p className="text-slate-400 text-sm">{successMsg}</p>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Current Request Status</span>
            <span className="block text-sm font-semibold text-yellow-400 mt-0.5">Pending Approval</span>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-all shadow-md cursor-pointer"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  // Resubmission Fields Editor
  if (isResubmitting && resubmitUser) {
    const requestedFields = resubmitUser.requestedFieldsToEdit || [];
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="space-y-2 text-center">
            <div className="inline-flex p-3 rounded-full bg-yellow-500/10 text-yellow-500 mb-2">
              <BadgeInfo size={32} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Additional Information Required</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              The administrator has requested you to correct or upload the following fields.
            </p>
            {resubmitUser.approvalNotes && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-yellow-500/20 text-yellow-400 text-xs text-left mt-4">
                <strong>Admin Notes:</strong> {resubmitUser.approvalNotes}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleResubmitSubmit} className="space-y-4">
            {requestedFields.map((field: string) => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider capitalize">
                  {field.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type="text"
                  placeholder={`Enter correct ${field}`}
                  onChange={(e) => handleResubmitValueChange(field, e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 transition-all text-sm"
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg cursor-pointer text-sm"
            >
              Resubmit for Approval
            </button>
            
            <Link
              href="/login"
              className="block text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel and Return
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // Submission Successful Status Screen
  if (registeredUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="p-8 max-w-md w-full glass-panel rounded-2xl text-center space-y-6 shadow-2xl border border-indigo-500/20">
          <div className="inline-flex p-4 rounded-full bg-yellow-500/10 text-yellow-500">
            <ShieldCheck size={48} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Registration Submitted</h2>
          <p className="text-slate-400 text-sm">
            Your registration request has been submitted successfully. Your account is awaiting administrator approval.
          </p>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2">
            <div className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-2">
              <span className="text-slate-500">Requested Role</span>
              <span className="font-semibold text-slate-300">{registeredUser.role}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-2">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-300">{registeredUser.department}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-500 font-medium">Clearance Status</span>
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
                {registeredUser.approvalStatus}
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-all shadow-md cursor-pointer"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  // Registration Multi-field Screen
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Brand panel */}
      <div className="md:w-1/2 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/60">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
              <span className="text-lg font-black text-white tracking-tighter">TO</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TransitOps <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest block -mt-1.5">Enterprise console</span></span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight font-sans pt-6">
            Join the Fleet <br />Command Console.
          </h1>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Please register your employee credentials. Your profile must be reviewed and authorized by an existing administrator before accessing operations.
          </p>
        </div>
        
        <div className="pt-8 border-t border-slate-800/40">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-2">Registration Policy</span>
          <p className="text-xs text-slate-400">
            All console requests log your browser user-agent, operational IP address, and registration timestamps to protect our logistics networks.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center items-center md:w-1/2 p-6 md:p-16 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Request Access Clearance</h2>
            <p className="text-slate-400 text-xs">Fill in your enterprise details below to submit a registration request.</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...register('firstName')}
                    type="text"
                    placeholder="John"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                </div>
                {errors.firstName && <p className="text-red-500 text-[10px] mt-0.5">{errors.firstName.message}</p>}
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...register('lastName')}
                    type="text"
                    placeholder="Smith"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                </div>
                {errors.lastName && <p className="text-red-500 text-[10px] mt-0.5">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Enterprise Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="john.smith@transitops.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] mt-0.5">{errors.email.message}</p>}
            </div>

            {/* Phone & Employee ID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...register('phoneNumber')}
                    type="text"
                    placeholder="+1 555-0199"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                </div>
                {errors.phoneNumber && <p className="text-red-500 text-[10px] mt-0.5">{errors.phoneNumber.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Employee ID (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...register('employeeId')}
                    type="text"
                    placeholder="EMP-8022"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Department & Designation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Department</label>
                <input
                  {...register('department')}
                  type="text"
                  placeholder="Logistics"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                />
                {errors.department && <p className="text-red-500 text-[10px] mt-0.5">{errors.department.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Designation</label>
                <input
                  {...register('designation')}
                  type="text"
                  placeholder="Lead Coordinator"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                />
                {errors.designation && <p className="text-red-500 text-[10px] mt-0.5">{errors.designation.message}</p>}
              </div>
            </div>

            {/* Requested Role */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Requested Clearance Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <select
                  {...register('role')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all appearance-none"
                >
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Driver">Driver</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                  <option value="Maintenance Manager">Maintenance Manager</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Security">Security</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
            </div>

            {/* Profile Photo Link */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Profile Image URL (Optional)</label>
              <input
                {...register('profilePhoto')}
                type="text"
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Secure Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[10px] mt-0.5">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-[10px] mt-0.5">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {authLoading ? 'Registering request...' : 'Register and Submit Access Request'}
              <ArrowRight size={14} />
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Already have clearance?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
