import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Store, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  Sparkles, 
  UserPlus, 
  LogIn, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Award,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSupermarket, DEMO_CUSTOMERS } from '../../context/SupermarketContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { triggerGoogleAuth } from '../../lib/payment';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { loginCustomer, currentUser } = useSupermarket();

  // Mode: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/customer';

  // Handle Login Submission
  const handleCustomLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or mobile number.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const user = {
        id: 'cust_' + Date.now(),
        name: identifier.includes('@') ? identifier.split('@')[0] : 'Shopper ' + identifier.slice(-4),
        email: identifier.includes('@') ? identifier : `${identifier}@smartmart.com`,
        phone: identifier.match(/^\+?\d+$/) ? identifier : '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
        address: '124, 5th Cross, 6th Main, Indiranagar, Bengaluru - 560038',
        loyaltyPoints: 100,
        savedAddresses: [
          { id: 'addr_c1', label: 'Home', address: '124, 5th Cross, Indiranagar, Bengaluru', isDefault: true }
        ]
      };

      loginCustomer(user);
      setLoading(false);
      navigate(redirectPath);
    }, 500);
  };

  // Handle Create Account Submission
  const handleCreateAccount = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const newUser = {
        id: 'cust_new_' + Date.now(),
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 100)}?w=120&h=120&fit=crop&crop=face`,
        address: address.trim() || '100ft Road, Indiranagar, Bengaluru - 560038',
        loyaltyPoints: 150, // 150 Welcome SmartPoints Bonus!
        savedAddresses: [
          { id: 'addr_new1', label: 'Primary Home Address', address: address.trim() || 'Indiranagar, Bengaluru', isDefault: true }
        ]
      };

      loginCustomer(newUser);
      setLoading(false);
      setSuccessMessage('Account created successfully! Welcome bonus +150 SmartPoints added 🎉');

      setTimeout(() => {
        navigate(redirectPath);
      }, 700);
    }, 600);
  };

  // Handle Google SSO Login
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setErrorMessage('');
    try {
      triggerGoogleAuth({
        onSuccess: (googleUser) => {
          loginCustomer(googleUser);
          setGoogleLoading(false);
          navigate(redirectPath);
        },
        onError: (err) => {
          setGoogleLoading(false);
          setErrorMessage('Google Authentication failed. Please try traditional login.');
        }
      });
    } catch (e) {
      setGoogleLoading(false);
    }
  };

  const handleQuickLogin = (demoCustomer) => {
    loginCustomer(demoCustomer);
    navigate(redirectPath);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      
      {/* Top Navigation Links */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/customer"
          className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Return to Supermarket Store
        </Link>
        <Link
          to="/staff/login"
          className="inline-flex items-center text-xs font-semibold text-charcoal-800 dark:text-gray-200 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-gray-200 dark:border-slate-800 hover:bg-gray-50 shadow-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-primary-600 dark:text-primary-400" /> Staff Portal
        </Link>
      </div>

      {/* Main Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/customer" className="inline-flex justify-center hover:opacity-90 transition-opacity">
          <div className="bg-gradient-to-tr from-primary-700 to-primary-500 p-3.5 rounded-2xl shadow-lg flex items-center justify-center text-white">
            <Store className="w-8 h-8" />
          </div>
        </Link>
        <h2 className="mt-4 text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Welcome to SmartMart Express
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sign in or create an account to unlock 15-min express delivery & self-checkout
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Google SSO Button */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-300 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all text-sm group"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
          </button>
        </div>

        {/* 1-Click Fast Demo Login Profiles */}
        <div className="bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-950/40 dark:to-emerald-950/40 p-5 rounded-2xl border border-primary-200/80 dark:border-primary-900/60 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-primary-800 dark:text-primary-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" /> 1-Click Fast Demo Login
          </div>
          
          <div className="space-y-2">
            {DEMO_CUSTOMERS.map((cust) => (
              <button
                key={cust.id}
                type="button"
                onClick={() => handleQuickLogin(cust)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-primary-50/80 dark:hover:bg-primary-950/70 rounded-xl border border-primary-100 dark:border-slate-800 hover:border-primary-300 shadow-2xs transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <img src={cust.avatar} alt={cust.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700" />
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300">{cust.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[210px]">{cust.address}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  Login →
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Selector: Sign In vs Create Account */}
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-gray-200 dark:border-slate-800 rounded-2xl space-y-6">
          
          <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'signup'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {activeTab === 'login' ? (
            <form className="space-y-5" onSubmit={handleCustomLogin}>
              <div>
                <label htmlFor="identifier" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Mobile Phone or Email
                </label>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  placeholder="e.g. 9845012345 or customer@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Password / OTP
                  </label>
                  <span className="text-[11px] text-gray-400">Demo password accepted</span>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base font-extrabold shadow-md shadow-primary-600/20" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In to Account'}
              </Button>
            </form>
          ) : (
            /* CREATE ACCOUNT FORM */
            <form className="space-y-4" onSubmit={handleCreateAccount}>
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Award className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                <span>Sign up today & get +150 SmartPoints Welcome Reward!</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Mobile Phone *
                  </label>
                  <Input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Default Delivery Address
                </label>
                <Input
                  type="text"
                  placeholder="House No, Street Name, Area, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-extrabold shadow-md shadow-primary-600/20" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account & Get 150 SmartPoints'}
              </Button>
            </form>
          )}

          {/* Guest Direct Access */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                loginCustomer({
                  id: 'cust_guest',
                  name: 'Guest Shopper',
                  email: 'guest@smartmart.com',
                  phone: '+91 99999 00000',
                  avatar: '',
                  address: 'Store Customer - Local Area',
                  loyaltyPoints: 0,
                  savedAddresses: []
                });
                navigate('/customer');
              }}
              className="w-full py-2.5 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
            >
              Continue as Guest Shopper (Browse Only)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
