import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Bike, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Store,
  User,
  Zap,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSupermarket } from '../../context/SupermarketContext';
import { apiDeliveryLogin } from '../../services/api';

export default function DeliveryLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    deliveryPartners, 
    loginDeliveryPartner, 
    isDeliveryAuthenticated, 
    currentDeliveryPartner,
    logoutDeliveryPartner,
    storeSettings 
  } = useSupermarket();

  const searchParams = new URLSearchParams(location.search);
  const rawFrom = location.state?.from || searchParams.get('redirect');
  const from = (rawFrom && !rawFrom.includes('/delivery/login')) ? rawFrom : '/delivery/dashboard';

  const [identifier, setIdentifier] = useState('rajesh@smartmart.com');
  const [password, setPassword] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showSwitchForm, setShowSwitchForm] = useState(false);

  const navigateAfterAuth = (target) => {
    navigate(target, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!identifier.trim()) {
      setAuthError('Please enter your registered phone number or email.');
      return;
    }

    setLoading(true);

    try {
      // First attempt backend API login
      const res = await apiDeliveryLogin(identifier.trim(), password.trim()).catch(() => null);
      if (res && res.partner) {
        loginDeliveryPartner(res.partner);
        setLoading(false);
        navigateAfterAuth(from);
        return;
      }

      // Local fallback verification with context partners
      const clean = identifier.trim().toLowerCase();
      const matched = deliveryPartners.find(p => 
        p.email?.toLowerCase() === clean || 
        p.phone?.replace(/\s+/g, '') === identifier.trim().replace(/\s+/g, '') ||
        p.phone === identifier.trim()
      );

      if (!matched) {
        setAuthError('No delivery partner account found with this phone/email. Please ask your store manager to add you.');
        setLoading(false);
        return;
      }

      if (password && matched.password && matched.password !== password.trim()) {
        setAuthError('Incorrect delivery PIN/password. (Default PIN: 1234)');
        setLoading(false);
        return;
      }

      loginDeliveryPartner(matched);
      setLoading(false);
      navigateAfterAuth(from);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check credentials.');
      setLoading(false);
    }
  };

  const handleQuickSelectRider = (rider) => {
    setIdentifier(rider.email || rider.phone);
    setPassword(rider.password || '1234');
    setAuthError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation & Portal Switcher */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/customer"
          className="inline-flex items-center text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Customer Store
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/customer/login"
            className="text-xs text-gray-400 hover:text-primary-400 font-medium transition-colors"
          >
            Shoppers
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            to="/staff/login"
            className="text-xs text-gray-400 hover:text-blue-400 font-medium transition-colors"
          >
            Working Staff
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            to="/manager/login"
            className="text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors"
          >
            Manager
          </Link>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-xl mb-3">
          <Bike className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-xs font-bold text-amber-400 mb-2">
          <Store className="w-3.5 h-3.5" />
          <span>{storeSettings?.storeName || 'SmartMart Supermarket'}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Delivery Partner Portal
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-400">
          Order Dispatch, Real-Time Navigation & Doorstep OTP Delivery
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        {isDeliveryAuthenticated && !showSwitchForm ? (
          /* Active Delivery Session Card */
          <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6 border border-slate-700 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="relative w-20 h-20 mx-auto">
              <img
                src={currentDeliveryPartner?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'}
                alt={currentDeliveryPartner?.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-800 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              </span>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bike className="w-3.5 h-3.5" />
                Active Delivery Executive
              </span>
              <h3 className="mt-3 text-xl font-black text-white">
                {currentDeliveryPartner?.name || 'Delivery Partner'}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-1">
                {currentDeliveryPartner?.phone} • {currentDeliveryPartner?.vehicleNo}
              </p>
              <div className="mt-2 text-xs text-emerald-400 font-semibold">
                ★ {currentDeliveryPartner?.rating || 4.9} Rating • {currentDeliveryPartner?.completedTrips || 0} Deliveries Completed
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={() => navigate(from, { replace: true })}
                className="w-full h-12 text-base font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg cursor-pointer"
              >
                Open Delivery Dashboard →
              </Button>

              <button
                type="button"
                onClick={() => setShowSwitchForm(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-700/60 text-xs font-bold text-gray-300 transition-colors cursor-pointer"
              >
                Sign In with Different Rider Account
              </button>

              <button
                type="button"
                onClick={() => logoutDeliveryPartner()}
                className="w-full py-2 px-4 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                Sign Out from Partner Device
              </button>
            </div>
          </div>
        ) : (
          /* Delivery Partner Login Form */
          <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-700">
            <form onSubmit={handleLogin} className="space-y-5">
              {authError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Phone Number or Email ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+91 98765 43210 or rajesh@smartmart.com"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Password / 4-Digit Delivery PIN
                  </label>
                  <span className="text-[11px] text-amber-400 font-mono">Default: 1234</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter 4-digit PIN or password"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 tracking-wider"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-sm font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    Authenticating Partner...
                  </span>
                ) : (
                  <>
                    <Bike className="w-4 h-4" /> Sign In to Delivery App
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Rider Accounts Helper */}
            <div className="mt-6 pt-5 border-t border-slate-700/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Quick Select Registered Delivery Partner:
                </span>
              </div>
              <div className="space-y-1.5">
                {deliveryPartners.map((rider) => (
                  <button
                    key={rider.id}
                    type="button"
                    onClick={() => handleQuickSelectRider(rider)}
                    className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      identifier === rider.email || identifier === rider.phone
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900/60 border-slate-700 hover:bg-slate-700/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={rider.avatar} alt={rider.name} className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          {rider.name}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            rider.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {rider.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {rider.vehicleNo} • {rider.phone}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold">Select →</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 text-center">
                <p className="text-[11px] text-gray-400">
                  New delivery executive? The Store Manager can register you in the{' '}
                  <Link to="/staff/login" className="text-amber-400 underline font-semibold">
                    Staff Portal → Delivery Fleet
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
