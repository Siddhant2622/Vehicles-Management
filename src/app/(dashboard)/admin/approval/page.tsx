"use client";

import React, { useState } from 'react';
import { useTransitStore, User, UserRole, UserStatus } from '@/lib/store/transitStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { 
  Users, CheckCircle2, XCircle, AlertTriangle, UserCheck, 
  Search, Filter, ShieldCheck, Mail, Phone, Eye, BadgeAlert, Clock,
  Check, X, RefreshCw, FileQuestion, HelpCircle, FileText, UserPlus
} from 'lucide-react';

export default function UserApprovalCenter() {
  const { 
    currentUser, 
    users, 
    userApprovalHistory,
    approveUserRequest, 
    rejectUserRequest, 
    requestMoreInfo,
    suspendUser,
    reactivateUser,
    addEmployee
  } = useTransitStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('Pending Approval');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Modals / Details Actions States
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [infoRequestNotes, setInfoRequestNotes] = useState('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoFields, setInfoFields] = useState<string[]>([]);

  // Add Employee Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('Fleet Manager');
  const [addDepartment, setAddDepartment] = useState('Operations');
  const [addDesignation, setAddDesignation] = useState('Fleet Operator');
  const [addEmployeeId, setAddEmployeeId] = useState('');
  const [addPhoneNumber, setAddPhoneNumber] = useState('');
  const [addProfilePhoto, setAddProfilePhoto] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || currentUser.role !== 'Administrator') {
    return (
      <ProtectedRoute allowedRoles={['Administrator']}>
        <div>Access Denied</div>
      </ProtectedRoute>
    );
  }

  // Compute Metrics
  const totalEmployees = users.filter(u => u.approvalStatus === 'Approved').length;
  const pendingRequests = users.filter(u => u.approvalStatus === 'Pending Approval').length;
  const suspendedUsers = users.filter(u => u.approvalStatus === 'Suspended').length;
  const rejectedCount = users.filter(u => u.approvalStatus === 'Rejected').length;
  const infoReqCount = users.filter(u => u.approvalStatus === 'Information Required').length;

  // Filter users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.approvalStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'Pending Approval': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'Approved': return 'bg-green-50 text-green-600 border-green-200';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
      case 'Suspended': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Information Required': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'Inactive': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleApprove = async (user: User) => {
    if (!currentUser) return;
    const res = await approveUserRequest(user.id, currentUser.id, approvalNotes);
    if (res.success) {
      setApprovalNotes('');
      setIsDetailOpen(false);
      setSelectedUser(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !currentUser || !rejectionReason.trim()) return;
    const res = await rejectUserRequest(selectedUser.id, currentUser.id, rejectionReason);
    if (res.success) {
      setRejectionReason('');
      setIsRejectModalOpen(false);
      setIsDetailOpen(false);
      setSelectedUser(null);
    }
  };

  const handleInfoRequest = async () => {
    if (!selectedUser || !currentUser || infoFields.length === 0) return;
    const res = await requestMoreInfo(selectedUser.id, currentUser.id, infoFields, infoRequestNotes);
    if (res.success) {
      setInfoFields([]);
      setInfoRequestNotes('');
      setIsInfoModalOpen(false);
      setIsDetailOpen(false);
      setSelectedUser(null);
    }
  };

  const handleSuspend = async (user: User) => {
    if (!currentUser) return;
    await suspendUser(user.id, currentUser.id);
  };

  const handleReactivate = async (user: User) => {
    if (!currentUser) return;
    await reactivateUser(user.id, currentUser.id);
  };

  const toggleFieldSelection = (field: string) => {
    setInfoFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName.trim() || !addLastName.trim() || !addEmail.trim() || !addDepartment.trim() || !addDesignation.trim()) {
      setAddError('All required fields must be filled.');
      return;
    }

    setIsSubmitting(true);
    setAddError(null);
    setAddSuccess(null);

    const payload = {
      email: addEmail.trim(),
      fullName: `${addFirstName.trim()} ${addLastName.trim()}`,
      role: addRole,
      firstName: addFirstName.trim(),
      lastName: addLastName.trim(),
      department: addDepartment.trim(),
      designation: addDesignation.trim(),
      employeeId: addEmployeeId.trim() || undefined,
      phoneNumber: addPhoneNumber.trim() || undefined,
      profilePhoto: addProfilePhoto.trim() || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
    };

    const res = await addEmployee(payload);
    setIsSubmitting(false);

    if (res.success) {
      setAddSuccess('Employee added successfully! They can now log in.');
      // Reset form
      setAddFirstName('');
      setAddLastName('');
      setAddEmail('');
      setAddRole('Fleet Manager');
      setAddDepartment('Operations');
      setAddDesignation('Fleet Operator');
      setAddEmployeeId('');
      setAddPhoneNumber('');
      setAddProfilePhoto('');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess(null);
      }, 1500);
    } else {
      setAddError(res.message || 'Failed to add employee.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['Administrator']}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Access Clearance & User Approvals</h1>
            <p className="text-slate-500 text-sm">Review, authorize, suspend, or reject TransitOps console access requests.</p>
          </div>
          <button
            onClick={() => {
              setAddError(null);
              setAddSuccess(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer shrink-0"
          >
            <UserPlus size={14} />
            Add Employee
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Pending Requests</span>
              <span className="text-lg font-bold text-slate-800">{pendingRequests}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
              <UserCheck size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Approved Employees</span>
              <span className="text-lg font-bold text-slate-800">{totalEmployees}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <XCircle size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Rejected Requests</span>
              <span className="text-lg font-bold text-slate-800">{rejectedCount}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Suspended Accounts</span>
              <span className="text-lg font-bold text-slate-800">{suspendedUsers}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BadgeAlert size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Information Req.</span>
              <span className="text-lg font-bold text-slate-800">{infoReqCount}</span>
            </div>
          </div>
        </div>

        {/* Requests Management Grid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          
          {/* Filters Header */}
          <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Role filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold outline-none text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Driver">Driver</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                  <option value="Maintenance Manager">Maintenance Manager</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                <ShieldCheck size={14} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold outline-none text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Information Required">Information Required</option>
                  <option value="All">All Statuses</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">User profile</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Department & Designation</th>
                  <th className="px-6 py-4">Requested Role</th>
                  <th className="px-6 py-4">Request Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                      No access requests matching your filters were found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250"}
                            alt={user.fullName}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-semibold text-slate-800 block leading-tight">{user.fullName}</span>
                            <span className="text-xs text-slate-400">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                        {user.employeeId || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 block leading-tight">{user.designation}</span>
                        <span className="text-xs text-slate-400">{user.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(user.approvalStatus)}`}>
                          {user.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="View request details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {user.approvalStatus === 'Pending Approval' && (
                            <>
                              <button
                                onClick={() => handleApprove(user)}
                                className="p-1.5 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600 transition-colors cursor-pointer"
                                title="Approve immediately"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsRejectModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Reject request"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}

                          {user.approvalStatus === 'Approved' && (
                            <button
                              onClick={() => handleSuspend(user)}
                              className="px-2 py-1 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          {user.approvalStatus === 'Suspended' && (
                            <button
                              onClick={() => handleReactivate(user)}
                              className="px-2 py-1 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: View Details */}
        {isDetailOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Clearance Request Details</h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider mt-1 ${getStatusColor(selectedUser.approvalStatus)}`}>
                    {selectedUser.approvalStatus}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setSelectedUser(null);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">Personal Information</h4>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedUser.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250"}
                      alt={selectedUser.fullName}
                      className="h-16 w-16 rounded-2xl object-cover border border-slate-200"
                    />
                    <div>
                      <span className="text-base font-bold text-slate-800 block">{selectedUser.fullName}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail size={12} /> {selectedUser.email}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone size={12} /> {selectedUser.phoneNumber || 'No phone'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">Employment Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Employee ID</span>
                      <span className="font-semibold text-slate-700">{selectedUser.employeeId || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Department</span>
                      <span className="font-semibold text-slate-700">{selectedUser.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Designation</span>
                      <span className="font-semibold text-slate-700">{selectedUser.designation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Requested Role</span>
                      <span className="font-semibold text-indigo-600 uppercase tracking-wider text-[10px]">{selectedUser.role}</span>
                    </div>
                  </div>
                </div>

                {/* Technical / Network Logs */}
                <div className="space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">Technical Audit Trail</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">Registration IP</span>
                      <span className="font-semibold text-slate-700 block mt-0.5">{selectedUser.registrationIp || '192.168.1.7'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Device Profile</span>
                      <span className="font-semibold text-slate-700 block mt-0.5">{selectedUser.deviceInformation || 'Desktop PC'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Client Agent</span>
                      <span className="font-semibold text-slate-700 block mt-0.5 truncate" title={selectedUser.browserInformation}>{selectedUser.browserInformation || 'Chrome / Turbopack'}</span>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div className="space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">Uploaded Credentials Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center gap-3">
                      <FileText className="text-indigo-600 shrink-0" size={20} />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-800 block truncate">Employee_ID_Card.pdf</span>
                        <span className="text-[10px] text-slate-400 block">Uploaded on registration</span>
                      </div>
                    </div>
                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center gap-3">
                      <FileText className="text-indigo-600 shrink-0" size={20} />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-800 block truncate">Govt_Verification_ID.jpg</span>
                        <span className="text-[10px] text-slate-400 block">Uploaded on registration</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Notes Input */}
              {selectedUser.approvalStatus === 'Pending Approval' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Approval Notes (Optional)</label>
                  <textarea
                    placeholder="Provide any comments or authorization code..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all h-20 resize-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                {selectedUser.approvalStatus === 'Pending Approval' ? (
                  <>
                    <button
                      onClick={() => setIsInfoModalOpen(true)}
                      className="px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FileQuestion size={14} /> Request Information
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsRejectModalOpen(true)}
                        className="px-4 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <X size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(selectedUser)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-green-600/20 cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} /> Approve & Activate
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex justify-end">
                    <button
                      onClick={() => {
                        setIsDetailOpen(false);
                        setSelectedUser(null);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Request (Reason popup) */}
        {isRejectModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="text-red-500" size={20} /> Reject Registration Request
              </h3>
              <p className="text-xs text-slate-500">
                You are rejecting the registration request from <strong>{selectedUser.fullName}</strong>. Please provide a clear reason for audit logging.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejection Reason</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Select Rejection Reason --</option>
                  <option value="Invalid employee ID or missing credentials">Invalid employee ID or missing credentials</option>
                  <option value="Duplicate account profile detected">Duplicate account profile detected</option>
                  <option value="Unauthorized external request">Unauthorized external request</option>
                  <option value="Department or Designation mismatch">Department or Designation mismatch</option>
                </select>
              </div>

              <textarea
                placeholder="Or type a custom reason here..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all h-20 resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Request Information fields */}
        {isInfoModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="text-indigo-600" size={20} /> Request Additional Details
              </h3>
              <p className="text-xs text-slate-500">
                Select the fields that need correction or verification. The user will be notified to edit and resubmit only these fields.
              </p>

              {/* Field checklist */}
              <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-3">
                {['firstName', 'lastName', 'email', 'phoneNumber', 'employeeId', 'department', 'designation', 'profilePhoto'].map(field => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer capitalize">
                    <input
                      type="checkbox"
                      checked={infoFields.includes(field)}
                      onChange={() => toggleFieldSelection(field)}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {field.replace(/([A-Z])/g, ' $1')}
                  </label>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Request Message</label>
                <textarea
                  placeholder="Explain exactly what information or document upload is required..."
                  value={infoRequestNotes}
                  onChange={(e) => setInfoRequestNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all h-20 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsInfoModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInfoRequest}
                  disabled={infoFields.length === 0 || !infoRequestNotes.trim()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal: Add Employee */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="text-indigo-600" size={20} /> Add New Employee
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {addError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="p-3 bg-green-50 text-green-600 text-xs rounded-xl border border-green-100">
                  {addSuccess}
                </div>
              )}

              <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name *</label>
                    <input
                      type="text"
                      required
                      value={addFirstName}
                      onChange={(e) => setAddFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={addLastName}
                      onChange={(e) => setAddLastName(e.target.value)}
                      placeholder="Smith"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enterprise Email *</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clearance Role *</label>
                    <select
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                    >
                      <option value="Fleet Manager">Fleet Manager</option>
                      <option value="Dispatcher">Dispatcher</option>
                      <option value="Safety Officer">Safety Officer</option>
                      <option value="Financial Analyst">Financial Analyst</option>
                      <option value="Maintenance Manager">Maintenance Manager</option>
                      <option value="Driver">Driver</option>
                      <option value="Viewer">Viewer</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee ID (Optional)</label>
                    <input
                      type="text"
                      value={addEmployeeId}
                      onChange={(e) => setAddEmployeeId(e.target.value)}
                      placeholder="EMP-100"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department *</label>
                    <input
                      type="text"
                      required
                      value={addDepartment}
                      onChange={(e) => setAddDepartment(e.target.value)}
                      placeholder="Operations"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation *</label>
                    <input
                      type="text"
                      required
                      value={addDesignation}
                      onChange={(e) => setAddDesignation(e.target.value)}
                      placeholder="Fleet Operator"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      value={addPhoneNumber}
                      onChange={(e) => setAddPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 0199"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profile Photo URL</label>
                    <input
                      type="text"
                      value={addProfilePhoto}
                      onChange={(e) => setAddProfilePhoto(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? 'Adding Employee...' : 'Save Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
