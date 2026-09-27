import React, { useState } from 'react';
import { 
  Smartphone, 
  Sparkles, 
  X, 
  CheckCircle2, 
  PhoneCall, 
  MessageSquare, 
  Award, 
  ShieldCheck, 
  ArrowRight,
  Gift
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useSupermarket } from '../../context/SupermarketContext';
import { apiUpdateCustomerPhone } from '../../services/api';
import { soundEffects } from '../../lib/audio';

export default function PhonePromptModal({ 
  isOpen, 
  onClose, 
  customTitle, 
  customMessage, 
  bonusPoints = 50 
}) {
  const { currentUser, loginCustomer } = useSupermarket();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Clean phone number
    let clean = phoneNumber.replace(/[\s-]/g, '');
    if (!clean.startsWith('+')) {
      if (clean.length === 10) {
        clean = `+91${clean}`;
      } else if (clean.startsWith('91') && clean.length === 12) {
        clean = `+${clean}`;
      } else {
        setErrorMsg('Please enter a valid 10-digit mobile number (e.g. 98451 23456 or +91 98451 23456).');
        return;
      }
    }

    if (clean.length < 10) {
      setErrorMsg('Invalid phone number format.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiUpdateCustomerPhone(
        currentUser?.id || 'cust_guest',
        currentUser?.email || '',
        clean
      );

      const newPoints = (currentUser?.loyaltyPoints || 100) + bonusPoints;
      const updatedUser = {
        ...(currentUser || { id: 'cust_guest', name: 'SmartMart Shopper', email: 'guest@smartmart.com' }),
        phone: clean,
        loyaltyPoints: newPoints
      };

      if (loginCustomer) {
        loginCustomer(updatedUser);
      }
      localStorage.setItem('sm_current_user', JSON.stringify(updatedUser));
      localStorage.setItem('sm_phone_prompt_dismissed', 'registered');

      soundEffects.playSuccessChime();
      setSuccessMsg(`🎉 Success! Mobile linked: ${clean}. You earned +${bonusPoints} SmartMart points!`);

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2200);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update phone number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('sm_phone_prompt_dismissed', Date.now().toString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-amber-400/40 dark:border-amber-500/30 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-slate-950 relative overflow-hidden">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/90 rounded-2xl shadow-sm text-amber-600">
              <Gift className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-300" /> Exclusive Loyalty Perk
              </span>
              <h2 className="text-xl font-black text-slate-950 mt-1 leading-tight">
                {customTitle || 'Link Your Mobile Number'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-900/90 font-medium mt-2 leading-relaxed">
            {customMessage || 'We noticed your account does not have a phone number registered. Register now to unlock automated Voicemail coupons, 30% OFF flash deals & delivery tracking.'}
          </p>
        </div>

        {/* Benefits Badges */}
        <div className="px-6 py-4 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 shadow-xs border border-amber-200/50 dark:border-amber-800/40">
            <PhoneCall className="w-4 h-4 text-primary-600 mx-auto mb-1" />
            <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 block">Voicemail Deals</span>
            <span className="text-[9px] text-gray-500">Auto audio alerts</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 shadow-xs border border-amber-200/50 dark:border-amber-800/40">
            <MessageSquare className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 block">Instant SMS</span>
            <span className="text-[9px] text-gray-500">Order & OTP dispatch</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 shadow-xs border border-amber-200/50 dark:border-amber-800/40">
            <Award className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">+{bonusPoints} Points</span>
            <span className="text-[9px] text-gray-500">Credited instantly</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {successMsg ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-extrabold">{successMsg}</div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                You will now receive flash discounts and order delivery updates on your mobile.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                  Mobile Number (India / Global)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-bold text-xs">
                    🇮🇳 +91
                  </div>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98451 23456"
                    className="pl-16 h-12 text-sm font-mono font-bold tracking-wider rounded-2xl border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Your number is secured and only used for store coupons &amp; order updates.
                </p>
              </div>

              {errorMsg && (
                <div className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDismiss}
                  className="w-1/3 h-12 text-xs font-bold text-gray-600 dark:text-gray-400 rounded-2xl"
                >
                  Maybe Later
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !phoneNumber.trim()}
                  className="w-2/3 h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Saving Number...'
                  ) : (
                    <>
                      Register &amp; Claim +{bonusPoints} Pts <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
