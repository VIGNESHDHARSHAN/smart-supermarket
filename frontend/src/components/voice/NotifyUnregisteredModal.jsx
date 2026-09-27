import React, { useState } from 'react';
import { 
  Bell, 
  Smartphone, 
  Sparkles, 
  X, 
  Users, 
  CheckCircle2, 
  Send, 
  AlertCircle, 
  Gift, 
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { apiNotifyUnregisteredUsers } from '../../services/api';
import { soundEffects } from '../../lib/audio';

export default function NotifyUnregisteredModal({ 
  isOpen, 
  onClose, 
  missingUsers = [], 
  onSuccess 
}) {
  const [title, setTitle] = useState('🎁 Exclusive 30% OFF Voicemail & SMS Deals: Link Your Mobile Number!');
  const [message, setMessage] = useState('Register your phone number to receive flash Voicemail coupons, 30% OFF deals, and live delivery SMS. Plus get 50 bonus SmartMart points!');
  const [bonusPoints, setBonusPoints] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  const handleDispatch = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiNotifyUnregisteredUsers(message, title, bonusPoints);
      soundEffects.playSuccessChime();
      setSuccessResult({
        count: missingUsers.length || 2,
        title,
        message
      });

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setSuccessResult(null);
        onClose();
      }, 2400);
    } catch (err) {
      alert('Error triggering notification: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-amber-300 dark:border-amber-800/60 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/90 rounded-2xl shadow-sm text-amber-600">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full">
                Customer Mobile Onboarding
              </span>
              <h2 className="text-xl font-black text-slate-950 mt-1 leading-tight">
                Notify Users Without Phone Numbers
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-900/90 font-medium mt-2">
            Broadcast an interactive in-app prompt and loyalty bonus to all registered customers who haven't yet linked a mobile number.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successResult ? (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-black text-emerald-900 dark:text-emerald-100">
                Outreach Prompt Successfully Broadcast!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                Active in-app banner and prompt modal triggered for all customers lacking a phone number. They will be awarded +{bonusPoints} points upon registering.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDispatch} className="space-y-4">
              
              {/* Audience Summary Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-xs font-black text-gray-900 dark:text-white">
                      Target Audience: {missingUsers.length > 0 ? `${missingUsers.length} Customers` : 'All Customers Missing Phone'}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Users registered through Google OAuth or email without mobile
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 font-mono">
                  {missingUsers.length || '3'} pending
                </span>
              </div>

              {/* Sample Missing Users Preview */}
              {missingUsers.length > 0 && (
                <div className="max-h-28 overflow-y-auto space-y-1 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 text-[11px]">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Pending Customers Preview:
                  </div>
                  {missingUsers.slice(0, 5).map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-gray-700 dark:text-gray-300 py-0.5">
                      <span className="font-semibold">{u.name || 'Shopper'}</span>
                      <span className="text-gray-400 font-mono">{u.email || 'No email'}</span>
                    </div>
                  ))}
                  {missingUsers.length > 5 && (
                    <div className="text-[10px] text-gray-400 italic">
                      + {missingUsers.length - 5} more customers
                    </div>
                  )}
                </div>
              )}

              {/* Notification Title */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1">
                  Notification Title / Headline
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 text-xs font-semibold rounded-xl"
                  required
                />
              </div>

              {/* Notification Message */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1">
                  Promotional Incentive &amp; Call to Action
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  required
                />
              </div>

              {/* Bonus Points Incentive */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/40">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    Registration Incentive Reward:
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(Number(e.target.value))}
                    className="w-20 h-8 text-xs font-mono font-bold text-center rounded-lg"
                    min="10"
                    max="500"
                  />
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Points</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-10 px-5 rounded-xl shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? (
                    'Broadcasting Alert...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Dispatch In-App Alert to All Users
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
