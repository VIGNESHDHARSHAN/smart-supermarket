import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Trash2, 
  Phone, 
  Mail, 
  Clock, 
  Briefcase, 
  Building2, 
  KeyRound, 
  Sparkles, 
  X,
  UserCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSupermarket } from '../../context/SupermarketContext';

export default function StaffTeamManagement() {
  const navigate = useNavigate();
  const { 
    staffMembers, 
    addStaffMember, 
    updateStaffStatus, 
    deleteStaffMember, 
    isManager, 
    currentStaff,
    loginStaff,
    storeSettings 
  } = useSupermarket();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('staff123');
  const [role, setRole] = useState('STAFF');
  const [designation, setDesignation] = useState('Senior Cashier & POS Operator');
  const [department, setDepartment] = useState('Billing & Front Counter');
  const [shift, setShift] = useState('Morning (07:00 - 15:00)');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Metrics
  const totalStaff = staffMembers.length;
  const managersCount = staffMembers.filter(s => s.role === 'MANAGER' || s.role === 'ADMIN').length;
  const workingStaffCount = staffMembers.filter(s => s.role === 'STAFF').length;
  const activeCount = staffMembers.filter(s => s.status === 'ACTIVE').length;

  // Filtered staff list
  const filteredStaff = staffMembers.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = filterDepartment === 'ALL' || s.department === filterDepartment;
    const matchesRole = filterRole === 'ALL' || s.role === filterRole;

    return matchesSearch && matchesDept && matchesRole;
  });

  const handleOpenAddModal = () => {
    if (!isManager) {
      alert("Permission Denied: Only Store Manager can onboard new staff members.");
      return;
    }
    setName('');
    setEmail('');
    setPhone('');
    setPassword('staff123');
    setRole('STAFF');
    setDesignation('Senior Cashier & POS Operator');
    setDepartment('Billing & Front Counter');
    setShift('Morning (07:00 - 15:00)');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isManager) {
      setFormError('Permission denied: Only Store Manager can onboard new working staff.');
      return;
    }

    if (!name.trim()) {
      setFormError('Please enter the staff member full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid corporate email address.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter a valid phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addStaffMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim() || 'staff123',
        role,
        designation: designation.trim(),
        department: department.trim(),
        shift
      });
      setIsSubmitting(false);
      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to onboard staff member.');
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!isManager) {
      alert("Permission denied: Only Store Manager can remove staff members.");
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${staffName} from the store team?`)) {
      try {
        await deleteStaffMember(staffId);
      } catch (err) {
        alert(err.message || 'Failed to remove staff member.');
      }
    }
  };

  const handleToggleStatus = async (staff) => {
    if (!isManager) {
      alert("Permission denied: Only Store Manager can change staff active status.");
      return;
    }
    const nextStatus = staff.status === 'ACTIVE' ? 'ON_LEAVE' : 'ACTIVE';
    try {
      await updateStaffStatus(staff.id || staff._id, nextStatus);
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
              <Users className="w-6 h-6" />
            </span>
            Store Staff & Working Personnel
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Store Operations Roster • Working Staff (Cashiers, Billing, Inventory, Floor) & Manager Controls
          </p>
        </div>

        {/* Manager-only Action Button */}
        <div>
          {isManager ? (
            <Button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-900/20 text-xs px-4 py-2.5 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Onboard New Staff Member</span>
            </Button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-xl text-xs font-semibold border border-gray-200 dark:border-slate-700">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>Manager Privileges Required to Onboard</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Privilege Banner */}
      {isManager ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Store General Manager Mode Active</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Full Authority
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Logged in as <strong>{currentStaff?.name || 'Rohan Mehra'}</strong> ({currentStaff?.email}). You have full authority to onboard and manage working staff and delivery executives.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
            Terminal Access: MGR-AUTH-01
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Working Staff Terminal Mode (Read-Only Roster)</span>
                <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Working Staff
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Logged in as <strong>{currentStaff?.name || 'Store Associate'}</strong> ({currentStaff?.designation}). Per supermarket security policy, only the <strong>Store Manager</strong> can onboard or remove personnel.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/manager/login')}
            className="text-xs font-bold text-amber-500 hover:text-amber-600 underline flex items-center gap-1"
          >
            <span>Switch to Manager Portal</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Total Team
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {totalStaff}
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
            {activeCount} Active on duty
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Working Staff
          </div>
          <div className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-1">
            {workingStaffCount}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            Cashiers, Inventory, Floor
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Store Managers
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {managersCount}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            Operations & Administration
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Store Location
          </div>
          <div className="text-sm font-black text-gray-900 dark:text-white mt-1 truncate">
            Indiranagar Supercenter
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            Terminal Station #01
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, email, phone, role..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-primary-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-hidden"
          >
            <option value="ALL">All Departments</option>
            <option value="Billing & Front Counter">Billing & Front Counter</option>
            <option value="Warehouse & Aisles">Warehouse & Aisles</option>
            <option value="Customer Experience">Customer Experience</option>
            <option value="Store Operations & Administration">Operations & Admin</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-hidden"
          >
            <option value="ALL">All Roles</option>
            <option value="STAFF">Working Staff Only</option>
            <option value="MANAGER">Store Managers Only</option>
          </select>
        </div>
      </div>

      {/* Staff Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => {
          const isStaffManager = staff.role === 'MANAGER' || staff.role === 'ADMIN';

          return (
            <div 
              key={staff.id || staff._id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between ${
                isStaffManager 
                  ? 'border-amber-400/40 dark:border-amber-500/30' 
                  : 'border-gray-100 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Staff Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face'}
                      alt={staff.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-slate-700 shadow-2xs"
                    />
                    <div>
                      <div className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                        {staff.name}
                      </div>
                      <div className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-0.5">
                        {staff.designation || 'Store Associate'}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        ID: {staff.id || staff._id}
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    isStaffManager 
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}>
                    {isStaffManager ? 'Store Manager' : 'Working Staff'}
                  </span>
                </div>

                {/* Details list */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" /> Department:
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[170px]">
                      {staff.department || 'Store Floor'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> Shift:
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {staff.shift || 'General Shift'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone:
                    </span>
                    <span className="font-mono text-gray-800 dark:text-gray-200 font-semibold">
                      {staff.phone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> Email:
                    </span>
                    <span className="font-mono text-gray-800 dark:text-gray-200 truncate max-w-[170px]">
                      {staff.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  staff.status === 'ACTIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  {staff.status === 'ACTIVE' ? 'Active On Duty' : 'On Leave'}
                </span>

                {isManager && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(staff)}
                      title="Toggle Active / Leave Status"
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {staff.status === 'ACTIVE' ? 'Mark Leave' : 'Mark Active'}
                    </button>

                    {/* Cannot delete the primary manager account */}
                    {staff.id !== 'MGR_001' && staff.email !== 'manager@smartmart.com' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff.id || staff._id, staff.name)}
                        title="Remove Staff Member"
                        className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-lg text-xs transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No staff members found</h3>
          <p className="text-xs text-gray-400 mt-1">Try modifying your search or department filter</p>
        </div>
      )}

      {/* Onboard New Staff Modal (Manager Exclusive) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Onboard New Store Staff
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Store Manager Authority • Register Cashier, Inventory or Floor Associate
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateStaff} className="mt-4 space-y-4">
              
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Corporate Email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@smartmart.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number *
                  </label>
                  <Input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 77889"
                  />
                </div>
              </div>

              {/* Role & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Role Category *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-hidden"
                  >
                    <option value="STAFF">Working Staff (Associate / Cashier)</option>
                    <option value="MANAGER">Managerial Staff (Assistant Manager)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Cashier & POS Operator"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-800 dark:text-gray-200 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Department & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-hidden"
                  >
                    <option value="Billing & Front Counter">Billing & Front Counter</option>
                    <option value="Warehouse & Aisles">Warehouse & Aisles</option>
                    <option value="Customer Experience">Customer Experience</option>
                    <option value="Store Operations & Administration">Store Operations & Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Shift Timing *
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-hidden"
                  >
                    <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                    <option value="Afternoon (14:00 - 22:00)">Afternoon (14:00 - 22:00)</option>
                    <option value="Full Day (09:00 - 18:00)">Full Day (09:00 - 18:00)</option>
                    <option value="General (09:00 - 19:00)">General (09:00 - 19:00)</option>
                  </select>
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Assigned Terminal Password (Default: staff123)
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="staff123"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  {isSubmitting ? 'Onboarding Staff...' : 'Confirm & Register Staff Member'}
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
