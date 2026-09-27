import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Store, 
  UserCheck, 
  Users, 
  Bike,
  Sparkles,
  KeyRound,
  Building2,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSupermarket } from '../../context/SupermarketContext';
import { apiStaffLogin } from '../../services/api';

export default function ManagerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginStaff, logoutStaff, isStaffAuthenticated, isManager, currentStaff, staffMembers, storeSettings } = useSupermarket();

  const searchParams = new URLSearchParams(location.search);
  const rawFrom = location.state?.from || searchParams.get('redirect');
  const from = (rawFrom && !rawFrom.includes('/manager/login') && !rawFrom.includes('/staff/login')) ? rawFrom : '/staff/dashboard';

  const [email, setEmail] = useState('manager@smartmart.com');
  const [password, setPassword] = useState('manager123');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showSwitchForm, setShowSwitchForm] = useState(false);

  const navigateAfterAuth = (target) => {
    navigate(target, { replace: true });
  };

  const handleManagerLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both your manager email/phone and security password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Attempt API login with expectedRole 'MANAGER'
      const res = await apiStaffLogin(email.trim(), password.trim(), 'MANAGER').catch(err => {
        return { error: err.message };
      });

      if (res && res.staff) {
        loginStaff({
          id: res.staff.id,
          name: res.staff.name,
          email: res.staff.email,
          phone: res.staff.phone,
          role: 'MANAGER',
          designation: res.staff.designation || 'Store General Manager',
          department: res.staff.department || 'Store Operations & Administration',
          shift: res.staff.shift || 'General Shift'
        });
        setLoading(false);
        navigateAfterAuth(from);
        return;
      }

      // If backend explicitly rejected due to role mismatch or invalid password
      if (res && res.error && !res.error.includes('Failed to fetch') && !res.error.includes('NetworkError')) {
        setAuthError(res.error);
        setLoading(false);
        return;
      }

      // 2. Offline / Context Fallback Verification
      const clean = email.trim().toLowerCase();
      const matched = staffMembers.find(s => 
        s.email?.toLowerCase() === clean || 
        s.phone?.replace(/\s+/g, '') === email.trim().replace(/\s+/g, '') ||
        s.phone === email.trim()
      );

      if (!matched) {
        setAuthError('No manager account found with this email or phone. Only store administrators can grant manager access.');
        setLoading(false);
        return;
      }

      // Enforce MANAGER role check
      if (matched.role !== 'MANAGER' && matched.role !== 'ADMIN') {
        setAuthError('Access denied: This account belongs to Working Staff. Please sign in via the Staff Portal.');
        setLoading(false);
        return;
      }

      if (password.trim() && matched.password && matched.password !== password.trim()) {
        setAuthError('Incorrect password. Please verify your credentials.');
        setLoading(false);
        return;
      }

      loginStaff({
        id: matched.id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
        role: 'MANAGER',
        designation: matched.designation || 'Store General Manager',
        department: matched.department || 'Store Operations & Administration',
        shift: matched.shift || 'General Shift'
      });
      setLoading(false);
      navigateAfterAuth(from);
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleQuickFill = (managerAccount) => {
    setEmail(managerAccount.email);
    setPassword(managerAccount.password || 'manager123');
    setAuthError('');
  };

  const currentIsActiveManager = isStaffAuthenticated && isManager;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background executive glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Back Link */}
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/customer"
            className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 text-primary-400" />
            Back to Customer Store
          </Link>
          <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <KeyRound className="w-3 h-3 text-amber-400" /> Executive Portal
          </span>
        </div>

        {/* Portal Branding Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-400/30 mb-4">
            <ShieldCheck className="w-9 h-9 text-slate-950" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Store Manager Portal
          </h2>
          <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
            {storeSettings?.storeName || 'SmartMart Supermarket'} • Operations & Staff Onboarding
          </p>
        </div>

        {/* Manager Authority Notice Pill */}
        <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-200 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Store Manager Authority:</strong> Only authenticated Store Managers can onboard working staff (cashiers, inventory) and register delivery fleet personnel.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10">
          
          {/* Active Manager Session Notice */}
          {currentIsActiveManager && !showSwitchForm ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">
                  Currently Logged In as Store Manager
                </div>
                <div className="text-xs text-amber-300 font-semibold mt-0.5">
                  {currentStaff.name} ({currentStaff.designation || 'Store General Manager'})
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  {currentStaff.email}
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-900/40"
                onClick={() => navigate(from, { replace: true })}
              >
                Go to Store Operations Dashboard →
              </Button>

              <button
                type="button"
                onClick={() => setShowSwitchForm(true)}
                className="w-full text-center text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Sign into another manager account
              </button>
            </div>
          ) : (
            <form onSubmit={handleManagerLogin} className="space-y-5">
              
              {/* Error Message */}
              {authError && (
                <div className="p-3.5 bg-red-950/60 border border-red-700/60 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <p className="font-bold">Manager Authentication Failed</p>
                    <p className="text-[11px] text-red-300 mt-0.5">{authError}</p>
                  </div>
                </div>
              )}

              {/* Manager ID / Email */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Manager Email or Phone
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@smartmart.com"
                    className="bg-slate-950 border-slate-700 text-white placeholder-gray-500 rounded-xl pl-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Manager Password / Security PIN</span>
                  <span className="text-[10px] text-amber-400 font-mono">manager123</span>
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-950 border-slate-700 text-white placeholder-gray-500 rounded-xl pl-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-900/40 text-sm transition-all"
              >
                {loading ? 'Verifying Manager Privileges...' : 'Sign In as Store Manager →'}
              </Button>

              {/* Quick Demo Manager Account Selector */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Quick Demo Credential</span>
                  <span className="text-amber-400">1-Click Test</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickFill({ email: 'manager@smartmart.com', password: 'manager123' })}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" 
                      alt="Rohan Mehra" 
                      className="w-8 h-8 rounded-full border border-amber-500/40 object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        Rohan Mehra
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Store General Manager • Operations & Fleet
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
                </button>
              </div>

            </form>
          )}

          {/* Navigation to Other Portals */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2.5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
              Other Store Portals
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/staff/login"
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-bold text-primary-300 border border-slate-800 hover:border-primary-500/40 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-primary-400" />
                <span>Working Staff</span>
              </Link>

              <Link
                to="/delivery/login"
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-bold text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors"
              >
                <Bike className="w-3.5 h-3.5 text-amber-400" />
                <span>Delivery Fleet</span>
              </Link>
            </div>

            <Link
              to="/customer/login"
              className="flex items-center justify-center gap-1.5 w-full p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-bold text-gray-300 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Shopper Login</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
