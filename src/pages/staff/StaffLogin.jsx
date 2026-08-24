import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { triggerGoogleAuth } from '../../lib/payment';

export default function StaffLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate('/staff/dashboard');
    }, 500);
  };

  const handleGoogleStaffLogin = () => {
    setGoogleLoading(true);
    triggerGoogleAuth({
      isStaff: true,
      onSuccess: () => {
        setGoogleLoading(false);
        navigate('/staff/dashboard');
      },
      onError: () => {
        setGoogleLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Return to Customer Store Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/customer"
          className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Customer Store
        </Link>
        <Link
          to="/customer/login"
          className="inline-flex items-center text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
        >
          Customer Login →
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="bg-primary-500 p-3.5 rounded-2xl shadow-lg text-white">
            <ShieldCheck className="w-9 h-9" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-3xl font-extrabold text-white tracking-tight">
          SmartMart Staff Operating System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          POS Billing, Inventory Control & Online Order Dispatching
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 space-y-6">
          
          {/* Google Workspace Staff SSO */}
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
            <span>{googleLoading ? 'Verifying Google SSO...' : 'Sign in with Google Workspace'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">or Staff Credentials</span>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Staff ID / Email
              </label>
              <Input 
                id="email" 
                name="email" 
                type="text" 
                required 
                defaultValue="admin@smartmart.com" 
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Security Password
              </label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                defaultValue="superadmin123" 
              />
            </div>

            <div>
              <Button type="submit" className="w-full h-12 text-base font-bold bg-charcoal-900 hover:bg-black" disabled={loading}>
                {loading ? 'Authenticating Staff...' : 'Sign in to Staff Portal'}
              </Button>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-center text-gray-500 border border-gray-100">
              Demo credentials pre-filled. Click sign in to open dashboard.
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
