import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Sparkles, 
  X, 
  Gift, 
  PhoneCall, 
  MessageSquare, 
  Award, 
  ChevronRight,
  BellRing
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useSupermarket } from '../../context/SupermarketContext';
import { apiGetSystemNotifications } from '../../services/api';
import PhonePromptModal from './PhonePromptModal';

export default function PhoneRegistrationBanner() {
  const { currentUser } = useSupermarket();
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [systemNotification, setSystemNotification] = useState(null);

  // Check if current user is missing a valid phone number
  const hasValidPhone = currentUser?.phone && 
    currentUser.phone.trim().length >= 8 && 
    !currentUser.phone.includes('00000');

  // Fetch active manager broadcasts for users missing phone numbers
  useEffect(() => {
    let isMounted = true;
    const checkNotification = async () => {
      try {
        const data = await apiGetSystemNotifications();
        if (isMounted && data?.notification?.active) {
          setSystemNotification(data.notification);
        }
      } catch (e) {
        // Silently catch
      }
    };

    checkNotification();
    const interval = setInterval(checkNotification, 20000); // 20s interval
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Check session storage dismissal
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('sm_phone_banner_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('sm_phone_banner_dismissed', 'true');
  };

  // If user already has a valid phone and there's no forced prompt, don't show
  if (hasValidPhone) return null;

  // If dismissed, render a subtle floating pill on the bottom-right so they can still claim their bonus
  if (dismissed) {
    return (
      <>
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 animate-bounce">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-full shadow-xl border border-amber-300 transition-transform active:scale-95"
            title="Link mobile to receive Voicemail & SMS offers"
          >
            <BellRing className="w-3.5 h-3.5 animate-spin" />
            <span>Link Phone for +50 Pts</span>
          </button>
        </div>

        <PhonePromptModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          customTitle={systemNotification?.title}
          customMessage={systemNotification?.message}
          bonusPoints={systemNotification?.bonusPoints || 50}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-4 py-2.5 shadow-sm border-b border-amber-600 relative overflow-hidden transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <span className="p-1.5 bg-slate-950 text-amber-300 rounded-xl font-black shrink-0 shadow-xs">
              <Gift className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <span className="font-black bg-slate-950/80 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ⚠️ Action Required
                </span>
                <span className="font-extrabold text-slate-950 text-xs sm:text-sm">
                  {systemNotification?.title || '🎁 Special Offer: Register Your Mobile Number to Unlock 30% OFF Voicemail & SMS Deals!'}
                </span>
                <span className="bg-white/90 text-amber-900 font-black px-2 py-0.5 rounded-full text-[10px] shadow-2xs">
                  +50 SmartPoints Bonus
                </span>
              </div>
              <p className="text-[11px] text-slate-950/85 mt-0.5 line-clamp-1">
                {systemNotification?.message || 'Link your mobile to get automated voicemail coupons, 30% flash discounts, and real-time delivery SMS tracking.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Register Mobile &amp; Claim +50 Pts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            <button
              onClick={handleDismiss}
              className="p-1 text-slate-950/70 hover:text-slate-950 hover:bg-black/10 rounded-lg transition-colors"
              title="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      <PhonePromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        customTitle={systemNotification?.title}
        customMessage={systemNotification?.message}
        bonusPoints={systemNotification?.bonusPoints || 50}
      />
    </>
  );
}
