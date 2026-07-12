"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransitStore, UserRole, Company } from '@/lib/store/transitStore';
import { 
  User, Mail, Phone, ShieldCheck, Briefcase, Eye, EyeOff, 
  ArrowRight, ShieldAlert, BadgeInfo, CheckCircle, FileText,
  Building2, Users, Globe
} from 'lucide-react';

// Registration mode
type RegistrationMode = 'company' | 'employee';

// Zod Validation Schema for Employee Registration
const employeeSignupSchema = zod.object({
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
  companyId: zod.string().min(1, 'Please select a company to join'),
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

// Zod Validation Schema for Company Admin Registration
const companySignupSchema = zod.object({
  companyName: zod.string().min(2, 'Company name must be at least 2 characters'),
  industry: zod.string().min(2, 'Industry is required'),
  companySize: zod.string().min(1, 'Company size is required'),
  firstName: zod.string().min(2, 'First name must be at least 2 characters'),
  lastName: zod.string().min(2, 'Last name must be at least 2 characters'),
  email: zod.string().email('Please enter a valid enterprise email'),
  phoneNumber: zod.string().min(8, 'Please enter a valid phone number'),
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

type EmployeeFormValues = zod.infer<typeof employeeSignupSchema>;
type CompanyFormValues = zod.infer<typeof companySignupSchema>;

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

  const { registerRequest, registerCompany, fetchCompanies, users, updateUserRequestFields, authLoading } = useTransitStore();
  
  const [mode, setMode] = useState<RegistrationMode>('company');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<any | null>(null);
  const [resubmitUser, setResubmitUser] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies().then(setAvailableCompanies);
  }, [fetchCompanies]);

  // Setup resubmit user if email is provided
  useEffect(() => {
    if (isResubmitting && resubmitEmail) {
      const match = users.find(u => u.email.toLowerCase() === resubmitEmail.toLowerCase());
      if (match && match.approvalStatus === 'Information Required') {
        setResubmitUser(match);
      }
    }
  }, [isResubmitting, resubmitEmail, users]);

  // Employee form
  const employeeForm = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: resubmitEmail || '',
      phoneNumber: '',
      employeeId: '',
      department: 'Operations',
      designation: '',
      role: 'Fleet Manager',
      companyId: '',
      profilePhoto: '',
      password: '',
      confirmPassword: '',
    }
  });

  // Company admin form
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySignupSchema),
    defaultValues: {
      companyName: '',
      industry: 'Logistics & Transport',
      companySize: '10-50',
      firstName: '',
      lastName: '',
      email: (!isResubmitting && resubmitEmail) ? resubmitEmail : '',
      phoneNumber: '',
      profilePhoto: '',
      password: '',
      confirmPassword: '',
    }
  });

  // Employee submission
  const onEmployeeSubmit = async (data: EmployeeFormValues) => {
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
        companyId: data.companyId,
        registrationIp: '192.168.1.7',
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

  // Company admin submission
  const onCompanySubmit = async (data: CompanyFormValues) => {
    setError(null);
    try {
      const browser = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown Browser';
      
      const adminPayload = {
        email: data.email,
        fullName: `${data.firstName} ${data.lastName}`,
        role: 'Administrator' as UserRole,
        firstName: data.firstName,
        lastName: data.lastName,
        profilePhoto: data.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
        phoneNumber: data.phoneNumber,
        department: 'Executive',
        designation: 'Company Administrator',
        registrationIp: '192.168.1.7',
        deviceInformation: 'Desktop PC',
        browserInformation: browser,
      };

      const result = await registerCompany(data.companyName, data.industry, data.companySize, adminPayload, data.password);
      if (result.success) {
        setRegisteredUser({
          ...adminPayload,
          companyName: data.companyName,
          approvalStatus: 'Approved',
          isCompanyAdmin: true
        });
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to register company.');
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
    const isCompanyAdmin = registeredUser.isCompanyAdmin;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="p-8 max-w-md w-full glass-panel rounded-2xl text-center space-y-6 shadow-2xl border border-indigo-500/20">
          <div className={`inline-flex p-4 rounded-full ${isCompanyAdmin ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
            {isCompanyAdmin ? <CheckCircle size={48} className="animate-pulse" /> : <ShieldCheck size={48} className="animate-pulse" />}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isCompanyAdmin ? 'Company Created!' : 'Registration Submitted'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isCompanyAdmin
              ? `Your company "${registeredUser.companyName}" has been created. You are now the Company Administrator and can log in immediately.`
              : 'Your registration request has been submitted successfully. Your account is awaiting administrator approval.'
            }
          </p>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2">
            {isCompanyAdmin && (
              <div className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-2">
                <span className="text-slate-500">Company</span>
                <span className="font-semibold text-slate-300">{registeredUser.companyName}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-2">
              <span className="text-slate-500">Role</span>
              <span className="font-semibold text-slate-300">{registeredUser.role || 'Administrator'}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-500 font-medium">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isCompanyAdmin ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                {registeredUser.approvalStatus}
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-all shadow-md cursor-pointer"
          >
            {isCompanyAdmin ? 'Log In Now' : 'Return to Login'}
          </Link>
        </div>
      </div>
    );
  }

  // Registration Multi-field Screen
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Brand panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/60">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
              <span className="text-lg font-black text-white tracking-tighter">TO</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TransitOps <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest block -mt-1.5">Enterprise console</span></span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight font-sans pt-6">
            {mode === 'company' ? (
              <>Launch Your Fleet<br />Operations Today.</>
            ) : (
              <>Join the Fleet<br />Command Console.</>
            )}
          </h1>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            {mode === 'company'
              ? 'Register your organization to get started with TransitOps fleet management. You will become the Company Administrator with full operational control.'
              : 'Register your employee credentials. Your profile must be reviewed and authorized by your company administrator before accessing operations.'
            }
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
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-6 md:p-16 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-6">
          
          {/* Mode toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode('company'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'company'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Building2 size={14} />
              Create Company
            </button>
            <button
              type="button"
              onClick={() => { setMode('employee'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'employee'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Users size={14} />
              Join Company
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
              {mode === 'company' ? 'Register Your Company' : 'Request Access Clearance'}
            </h2>
            <p className="text-slate-400 text-xs">
              {mode === 'company'
                ? 'Create your organization and become its first Administrator.'
                : 'Fill in your enterprise details below to submit a registration request.'
              }
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ====== COMPANY ADMIN FORM ====== */}
          {mode === 'company' && (
            <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-5">
              {/* Company Section */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Company Details</span>
              </div>
              
              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...companyForm.register('companyName')}
                    type="text"
                    placeholder="Alpha Logistics Inc."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                </div>
                {companyForm.formState.errors.companyName && <p className="text-red-500 text-[10px] mt-0.5">{companyForm.formState.errors.companyName.message}</p>}
              </div>

              {/* Industry & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Industry</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <select
                      {...companyForm.register('industry')}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all appearance-none"
                    >
                      <option value="Logistics & Transport">Logistics & Transport</option>
                      <option value="Freight & Shipping">Freight & Shipping</option>
                      <option value="Public Transit">Public Transit</option>
                      <option value="Construction">Construction</option>
                      <option value="Mining">Mining</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="E-Commerce">E-Commerce</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {companyForm.formState.errors.industry && <p className="text-red-500 text-[10px] mt-0.5">{companyForm.formState.errors.industry.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Company Size</label>
                  <select
                    {...companyForm.register('companySize')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all appearance-none"
                  >
                    <option value="1-10">1–10 employees</option>
                    <option value="10-50">10–50 employees</option>
                    <option value="50-200">50–200 employees</option>
                    <option value="200-1000">200–1,000 employees</option>
                    <option value="1000+">1,000+ employees</option>
                  </select>
                  {companyForm.formState.errors.companySize && <p className="text-red-500 text-[10px] mt-0.5">{companyForm.formState.errors.companySize.message}</p>}
                </div>
              </div>

              {/* Admin Section */}
              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Admin Account</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...companyForm.register('firstName')}
                      type="text"
                      placeholder="John"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                    />
                  </div>
                  {companyForm.formState.errors.firstName && <p className="text-red-500 text-[10px] mt-0.5">{companyForm.formState.errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...companyForm.register('lastName')}
                      type="text"
                      placeholder="Smith"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                    />
                  </div>
                  {companyForm.formState.errors.lastName && <p className="text-red-500 text-[10px] mt-0.5">{companyForm.formState.errors.lastName.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...companyForm.register('email')}
                    type="email"
                    placeholder="admin@yourcompany.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                </div>
                {companyForm.formState.errors.email && <p className="text-red-500 text-[10px] mt-0.5">{companyForm.formState.errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...companyForm.register('phoneNumber')}
                    type="text"
                    placeholder="+1 555-0199"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                </div>
                {companyForm.formState.errors.phoneNumber && <p className="text-red-500 text-[10px] mt-0.5">{companyForm.formState.errors.phoneNumber.message}</p>}
              </div>

              {/* Profile Photo */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Profile Image URL (Optional)</label>
                <input
                  {...companyForm.register('profilePhoto')}
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
                    {...companyForm.register('password')}
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
                {companyForm.formState.errors.password && <p className="text-red-500 text-[10px] mt-0.5">{companyForm.formState.errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <input
                    {...companyForm.register('confirmPassword')}
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
                {companyForm.formState.errors.confirmPassword && <p className="text-red-500 text-[10px] mt-0.5">{companyForm.formState.errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {authLoading ? 'Creating Company...' : 'Create Company & Admin Account'}
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* ====== EMPLOYEE FORM ====== */}
          {mode === 'employee' && (
            <form onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)} className="space-y-5">
              {/* Company Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    {...employeeForm.register('companyId')}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all appearance-none"
                  >
                    <option value="">— Choose your company —</option>
                    {availableCompanies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {employeeForm.formState.errors.companyId && <p className="text-red-500 text-[10px] mt-0.5">{employeeForm.formState.errors.companyId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...employeeForm.register('firstName')}
                      type="text"
                      placeholder="John"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                    />
                  </div>
                  {employeeForm.formState.errors.firstName && <p className="text-red-500 text-[10px] mt-0.5">{employeeForm.formState.errors.firstName.message}</p>}
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...employeeForm.register('lastName')}
                      type="text"
                      placeholder="Smith"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                    />
                  </div>
                  {employeeForm.formState.errors.lastName && <p className="text-red-500 text-[10px] mt-0.5">{employeeForm.formState.errors.lastName.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Enterprise Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...employeeForm.register('email')}
                    type="email"
                    placeholder="john.smith@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                </div>
                {employeeForm.formState.errors.email && <p className="text-red-500 text-[10px] mt-0.5">{employeeForm.formState.errors.email.message}</p>}
              </div>

              {/* Phone & Employee ID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...employeeForm.register('phoneNumber')}
                      type="text"
                      placeholder="+1 555-0199"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                    />
                  </div>
                  {employeeForm.formState.errors.phoneNumber && <p className="text-red-500 text-[10px] mt-0.5">{employeeForm.formState.errors.phoneNumber.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Employee ID (Optional)</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      {...employeeForm.register('employeeId')}
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
                    {...employeeForm.register('department')}
                    type="text"
                    placeholder="Logistics"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                  {employeeForm.formState.errors.department && <p className="text-red-500 text-[10px] mt-0.5">{employeeForm.formState.errors.department.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Designation</label>
                  <input
                    {...employeeForm.register('designation')}
                    type="text"
                    placeholder="Lead Coordinator"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-xs transition-all"
                  />
                  {employeeForm.formState.errors.designation && <p className="text-red-500 text-[10px] mt-0.5">{employeeForm.formState.errors.designation.message}</p>}
                </div>
              </div>

              {/* Requested Role */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Requested Clearance Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    {...employeeForm.register('role')}
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
                  {...employeeForm.register('profilePhoto')}
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
                    {...employeeForm.register('password')}
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
                {employeeForm.formState.errors.password && <p className="text-red-500 text-[10px] mt-0.5">{employeeForm.formState.errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <input
                    {...employeeForm.register('confirmPassword')}
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
                {employeeForm.formState.errors.confirmPassword && <p className="text-red-500 text-[10px] mt-0.5">{employeeForm.formState.errors.confirmPassword.message}</p>}
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
          )}

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
