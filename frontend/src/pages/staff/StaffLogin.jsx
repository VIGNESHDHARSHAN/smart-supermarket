import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Store, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Bike,
  Users,
  KeyRound,
  ChevronRight,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getGoogleClientId, saveGoogleClientId, redirectToGoogleOAuth, parseGoogleOAuthHash } from '../../lib/payment';
import { apiGoogleLogin, apiStaffLogin } from '../../services/api';
import { useSupermarket } from '../../context/SupermarketContext';

export default function StaffLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginStaff, logoutStaff, isStaffAuthenticated, currentStaff, staffMembers, storeSettings } = useSupermarket();

  const searchParams = new URLSearchParams(location.search);
  const rawFrom = location.state?.from || searchParams.get('redirect');
  const from = (rawFrom && !rawFrom.includes('/staff/login')) ? rawFrom : '/staff/dashboard';

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showClientIdPrompt, setShowClientIdPrompt] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(getGoogleClientId() || '');
  const [email, setEmail] = useState('priya.cashier@smartmart.com');
  const [password, setPassword] = useState('staff123');
  const [authError, setAuthError] = useState('');
  const [showSwitchForm, setShowSwitchForm] = useState(false);

  const navigateAfterAuth = (target) => {
    const historyIdx = window.history.state?.idx;
    if (historyIdx && historyIdx > 0 && location.state?.from === target) {
      navigate(-1);
    } else {
      navigate(target, { replace: true });
    }
  };

  // Handle return redirect from accounts.google.com
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      const googleUser = await parseGoogleOAuthHash(true);
      if (googleUser) {
        try {
          await apiGoogleLogin(googleUser, true);
        } catch (e) {}
        loginStaff({
          name: googleUser.name || 'Google Staff Employee',
          email: googleUser.email || 'staff@smartmart.com',
          role: 'STAFF',
          designation: 'Floor Associate & POS Operator'
        });
        navigateAfterAuth(from);
      }
    };
    handleGoogleRedirect();
  }, [navigate, from, loginStaff]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both staff ID and security password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Attempt API login
      const res = await apiStaffLogin(email.trim(), password.trim(), null).catch(err => {
        return { error: err.message };
      });

      if (res && res.staff) {
        loginStaff({
          id: res.staff.id,
          name: res.staff.name,
          email: res.staff.email,
          phone: res.staff.phone,
          role: res.staff.role || 'STAFF',
          designation: res.staff.designation || 'Store Associate & Cashier',
          department: res.staff.department || 'Billing & Front Counter',
          shift: res.staff.shift || 'Morning (07:00 - 15:00)'
        });
        setLoading(false);
        navigateAfterAuth(from);
        return;
      }

      // If backend explicitly rejected due to invalid password or missing user
      if (res && res.error && !res.error.includes('Failed to fetch') && !res.error.includes('NetworkError')) {
        setAuthError(res.error);
        setLoading(false);
        return;
      }

      // 2. Offline / Local fallback match
      const clean = email.trim().toLowerCase();
      const matched = staffMembers.find(s => 
        s.email?.toLowerCase() === clean || 
        s.phone?.replace(/\s+/g, '') === email.trim().replace(/\s+/g, '') ||
        s.phone === email.trim()
      );

      if (!matched) {
        setAuthError('No staff account found with this email/phone. Please ask your Store Manager to onboard you.');
        setLoading(false);
        return;
      }

      if (password.trim() && matched.password && matched.password !== password.trim()) {
        setAuthError('Incorrect password. Default staff password is staff123.');
        setLoading(false);
        return;
      }

      loginStaff({
        id: matched.id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
        role: matched.role || 'STAFF',
        designation: matched.designation || 'Store Associate & Cashier',
        department: matched.department || 'Store Floor & Billing',
        shift: matched.shift || 'Morning (07:00 - 15:00)'
      });
      setLoading(false);
      navigateAfterAuth(from);
    } catch (err) {
      setAuthError(err.message || 'Staff authentication failed.');
      setLoading(false);
    }
  };

  const handleQuickFill = (staff) => {
    setEmail(staff.email);
    setPassword(staff.password || 'staff123');
    setAuthError('');
  };

  const handleGoogleStaffLogin = () => {
    const liveClientId = getGoogleClientId();
    if (liveClientId) {
      setGoogleLoading(true);
      redirectToGoogleOAuth(true);
    } else {
      setShowClientIdPrompt(true);
    }
  };

  const handleSaveAndGoToGoogle = (e) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    saveGoogleClientId(clientIdInput.trim());
    setGoogleLoading(true);
    redirectToGoogleOAuth(true);
  };

  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Return to Customer Store Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1 && !document.referrer.includes('/staff/login')) {
              navigate(-1);
            } else {
              navigate('/customer', { replace: true });
            }
          }}
          className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Customer Store
        </button>
        <div className="flex items-center gap-2">
          <Link
            to="/manager/login"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" /> Manager Portal →
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            to="/delivery/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Bike className="w-3.5 h-3.5 text-amber-400" /> Riders
          </Link>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center">
            <img src="/gosmart-logo.png" alt="GoSmart Supermarket" className="h-14 w-auto object-contain" />
          </div>
        </div>

        {/* Supermarket Center Name Banner */}
        <div className="mt-4 flex flex-col items-center justify-center gap-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-charcoal-800 border border-charcoal-700 rounded-full text-xs font-bold text-primary-400">
            <Store className="w-3.5 h-3.5" />
            <span>{storeSettings?.storeName || 'SmartMart Express Supermarket'}</span>
          </div>
          <div className="text-xs font-semibold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Indiranagar Supercenter • Terminal #01
          </div>
        </div>

        <h2 className="mt-3 text-center text-2xl font-black text-white tracking-tight">
          Working Staff Terminal
        </h2>
        <p className="mt-1 text-center text-xs text-gray-400">
          POS Billing Counter, Turnstile Gate Security & Inventory Restock
        </p>

        {/* Manager Portal Switch Callout Banner */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <div className="font-bold">Are you the Store Manager?</div>
              <div className="text-[10px] text-gray-400">Managers onboard staff & fleet</div>
            </div>
          </div>
          <Link
            to="/manager/login"
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
          >
            Manager Portal →
          </Link>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {isStaffAuthenticated && !showSwitchForm ? (
          /* Active Staff Session Card */
          <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6 border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-9 h-9 text-emerald-600" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Operator Session
              </span>
              <h3 className="mt-3 text-xl font-black text-gray-900">
                {currentStaff?.name || 'Authorized Staff'}
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {currentStaff?.email} • {currentStaff?.designation || currentStaff?.role}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={() => navigate(from, { replace: true })}
                className="w-full h-12 text-base font-extrabold bg-charcoal-900 hover:bg-black shadow-lg"
              >
                Open Staff Dashboard →
              </Button>

              <button
                type="button"
                onClick={() => setShowSwitchForm(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                Sign In with Different Credentials
              </button>

              <button
                type="button"
                onClick={() => logoutStaff()}
                className="w-full py-2 px-4 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                Sign Out from Terminal
              </button>
            </div>
          </div>
        ) : (
          /* Staff Credentials Form */
          <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6 border border-gray-100">
            {showSwitchForm && isStaffAuthenticated && (
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-600">Switch Operator Profile</span>
                <button
                  type="button"
                  onClick={() => setShowSwitchForm(false)}
                  className="text-xs text-primary-600 hover:underline font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-semibold">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Google Workspace Staff SSO */}
            <div>
              <button
                type="button"
                onClick={handleGoogleStaffLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold rounded-xl border border-gray-300 transition-all text-sm group"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Redirecting to accounts.google.com...' : 'Sign in with Google Workspace'}</span>
              </button>

              {showClientIdPrompt && (
                <form onSubmit={handleSaveAndGoToGoogle} className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-left">
                  <div className="text-xs text-gray-600">
                    Google requires a <strong>Google OAuth Client ID</strong> to navigate to accounts.google.com:
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Paste Client ID (e.g. 123...apps.googleusercontent.com)"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-hidden focus:border-primary-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 px-3 bg-charcoal-900 hover:bg-black text-white font-bold rounded-lg text-xs"
                    >
                      Go to accounts.google.com →
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClientIdPrompt(false)}
                      className="px-2.5 py-1.5 text-xs text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="bg-white px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">or Working Staff Login</span>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Staff Email or Phone
                </label>
                <Input 
                  id="email" 
                  name="email" 
                  type="text" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya.cashier@smartmart.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center justify-between">
                  <span>Security Password / PIN</span>
                  <span className="text-[10px] text-primary-600 font-mono">staff123</span>
                </label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Button type="submit" className="w-full h-12 text-base font-extrabold bg-charcoal-900 hover:bg-black shadow-lg" disabled={loading}>
                  {loading ? 'Authenticating Staff...' : 'Sign in to Staff Portal →'}
                </Button>
              </div>

              {/* Quick Working Staff Demo Account Selector */}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Working Staff Quick Demo</span>
                  <span className="text-primary-600">1-Click Test</span>
                </div>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill({ email: 'priya.cashier@smartmart.com', password: 'staff123' })}
                    className="w-full text-left p-2 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face" 
                        alt="Priya" 
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-primary-700">
                          Priya Sundaram
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Senior Cashier & POS Operator (Billing)
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill({ email: 'arun.inventory@smartmart.com', password: 'staff123' })}
                    className="w-full text-left p-2 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face" 
                        alt="Arun" 
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-primary-700">
                          Arun Verma
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Inventory & Stock Supervisor (Warehouse)
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
