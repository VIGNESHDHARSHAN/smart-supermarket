import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowLeft, ShieldCheck, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';
import { useSupermarket, DEMO_CUSTOMERS } from '../../context/SupermarketContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { triggerGoogleAuth } from '../../lib/payment';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { loginCustomer, currentUser } = useSupermarket();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleCustomLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // Create or load customer session
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
      navigate('/customer');
    }, 500);
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    triggerGoogleAuth({
      onSuccess: (googleUser) => {
        loginCustomer(googleUser);
        setGoogleLoading(false);
        navigate('/customer');
      },
      onError: (err) => {
        setGoogleLoading(false);
      }
    });
  };

  const handleQuickLogin = (demoCustomer) => {
    loginCustomer(demoCustomer);
    navigate('/customer');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Top Return Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/customer"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Return to Supermarket Store
        </Link>
        <Link
          to="/staff/login"
          className="inline-flex items-center text-xs font-semibold text-charcoal-800 bg-white px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-50 shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-primary-600" /> Staff Portal
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/customer" className="inline-flex justify-center hover:opacity-90 transition-opacity">
          <div className="bg-primary-600 p-3 rounded-2xl shadow-lg flex items-center justify-center text-white">
            <Store className="w-8 h-8" />
          </div>
        </Link>
        <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome to SmartMart
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in for instant 15-min delivery, store pickup & exclusive member discounts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Google SSO Button */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 shadow-xs hover:shadow-sm transition-all text-sm group"
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

        {/* 1-Click Quick Demo Login Profiles */}
        <div className="bg-gradient-to-br from-primary-50 to-emerald-50 p-5 rounded-2xl border border-primary-200 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-primary-800 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-primary-600" /> 1-Click Fast Demo Login
          </div>
          
          <div className="space-y-2.5">
            {DEMO_CUSTOMERS.map((cust) => (
              <button
                key={cust.id}
                type="button"
                onClick={() => handleQuickLogin(cust)}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-primary-50/80 rounded-xl border border-primary-100 hover:border-primary-300 shadow-xs transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <img src={cust.avatar} alt={cust.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                  <div>
                    <div className="font-bold text-sm text-gray-900 group-hover:text-primary-700">{cust.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[210px]">{cust.address}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  Login →
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Login Form */}
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl">
          <form className="space-y-5" onSubmit={handleCustomLogin}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number or Email
              </label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                required
                placeholder="e.g. 9845012345 or user@gmail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password / OTP
                </label>
                <span className="text-xs text-gray-400">Any password works for demo</span>
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

            <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to Account'}
            </Button>
          </form>

          {/* Guest Direct Access */}
          <div className="mt-6 pt-6 border-t border-gray-100">
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
              className="w-full py-2.5 text-center text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            >
              Continue as Guest Shopper
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
