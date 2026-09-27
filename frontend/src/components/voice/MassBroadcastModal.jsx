import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  PhoneCall, 
  MessageSquare, 
  Users, 
  Sparkles, 
  Radio, 
  ShieldCheck, 
  Check, 
  Clock,
  Zap,
  Tag
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  apiGetRegisteredCustomers, 
  apiBroadcastToAllCustomers, 
  apiGetVoiceStatus 
} from '../../services/api';
import { soundEffects } from '../../lib/audio';

export default function MassBroadcastModal({
  isOpen,
  onClose,
  preselectedOffer = null,
  campaigns = [],
  onBroadcastSuccess = () => {}
}) {
  const [customers, setCustomers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(preselectedOffer || null);
  const [customTitle, setCustomTitle] = useState('');
  const [customPromoCode, setCustomPromoCode] = useState('');
  const [customDiscount, setCustomDiscount] = useState('25');
  const [customDescription, setCustomDescription] = useState('');
  
  const [sendSMS, setSendSMS] = useState(true);
  const [sendVoicemail, setSendVoicemail] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [result, setResult] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState({ provider: 'Checking...', isLiveConfigured: false });
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      if (preselectedOffer) {
        setSelectedOffer(preselectedOffer);
      } else if (campaigns.length > 0 && !selectedOffer) {
        setSelectedOffer(campaigns[0]);
      }

      setIsLoadingCustomers(true);
      Promise.all([
        apiGetRegisteredCustomers(),
        apiGetVoiceStatus()
      ]).then(([custList, status]) => {
        setCustomers(custList || []);
        setVoiceStatus(status || {});
        setIsLoadingCustomers(false);
      });
    }
  }, [isOpen, preselectedOffer, campaigns]);

  if (!isOpen) return null;

  const activeTitle = selectedOffer ? selectedOffer.title : customTitle;
  const activePromoCode = selectedOffer ? selectedOffer.promoCode : customPromoCode;
  const activeDiscount = selectedOffer ? selectedOffer.discountPercent : customDiscount;
  const activeDescription = selectedOffer ? selectedOffer.description : customDescription;

  const handleLaunchBlast = async () => {
    if (!activeTitle || !activePromoCode) {
      alert('Please specify an offer title and promo code.');
      return;
    }

    const channels = [];
    if (sendSMS) channels.push('SMS');
    if (sendVoicemail) channels.push('VOICEMAIL');

    if (channels.length === 0) {
      alert('Please select at least one channel (SMS or Voicemail).');
      return;
    }

    const confirmMsg = `Confirm mass outreach? This will send ${channels.join(' & ')} to all ${customers.length} registered customers.`;
    if (!window.confirm(confirmMsg)) return;

    setIsBroadcasting(true);
    setResult(null);

    try {
      const resp = await apiBroadcastToAllCustomers({
        offerTitle: activeTitle,
        promoCode: activePromoCode,
        discountPercent: Number(activeDiscount) || 20,
        description: activeDescription,
        channels,
        targetRecipients: customers
      });

      setResult(resp);
      soundEffects.playSuccessChime();
      onBroadcastSuccess();
    } catch (err) {
      setResult({
        success: false,
        error: err.message || 'Failed to dispatch mass broadcast.'
      });
      soundEffects.playErrorBuzzer();
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Megaphone className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                Mass Customer Outreach &amp; Blast
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  voiceStatus.isLiveConfigured 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {voiceStatus.isLiveConfigured ? 'Twilio Live' : 'Simulation Mode'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Broadcast offers via automated Voicemail &amp; SMS to all registered phone numbers
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Registered Customers Badge Count & Preview */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-extrabold text-xs text-gray-800 dark:text-gray-200">
              <Users className="w-4 h-4 text-primary-600" />
              <span>Target Audience: {customers.length} Registered Customers</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              100% Reach
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {isLoadingCustomers ? (
              <span className="text-xs text-gray-400">Loading registered customer list...</span>
            ) : (
              customers.map(c => (
                <span 
                  key={c.phone}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-[11px] font-medium"
                >
                  <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                  <span className="font-mono text-gray-400 text-[10px]">{c.phone}</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Offer Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
            Choose Promotional Offer to Broadcast
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {campaigns.map(camp => (
              <div
                key={camp.id}
                onClick={() => setSelectedOffer(camp)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-left ${
                  selectedOffer?.id === camp.id 
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs' 
                    : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                  <span className="font-mono">{camp.promoCode}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold">{camp.discountPercent}% OFF</span>
                </div>
                <div className="font-extrabold text-xs truncate text-gray-900 dark:text-white">{camp.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Broadcast Channels */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
            Dispatch Channels (Simultaneous Omnichannel):
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
              sendSMS 
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold' 
                : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400'
            }`}>
              <input
                type="checkbox"
                checked={sendSMS}
                onChange={(e) => setSendSMS(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs">SMS Text Message</span>
              </div>
            </label>

            <label className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
              sendVoicemail 
                ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold' 
                : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400'
            }`}>
              <input
                type="checkbox"
                checked={sendVoicemail}
                onChange={(e) => setSendVoicemail(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs">Automated Voicemail Call</span>
              </div>
            </label>
          </div>
        </div>

        {/* Message Preview */}
        <div className="p-3.5 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs space-y-1">
          <div className="font-bold text-gray-500 uppercase text-[10px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Voice &amp; SMS Broadcast Preview
          </div>
          <div className="font-mono text-gray-700 dark:text-gray-200 text-[11px] leading-relaxed">
            "Hello [Customer Name], this is SmartMart Supermarket with an exciting announcement! <strong>{activeTitle}</strong> is now live with <strong>{activeDiscount}% OFF</strong>. Use code <strong>{activePromoCode}</strong> at checkout. Order online or visit our store today!"
          </div>
        </div>

        {/* Result status banner */}
        {result && (
          <div className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-in fade-in ${
            result.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="font-black text-sm flex items-center gap-2">
              {result.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
              {result.success ? 'Mass Broadcast Completed Successfully!' : 'Broadcast Failed'}
            </div>
            <p className="text-xs opacity-90">{result.message || result.error}</p>
            {result.totalCustomers && (
              <div className="grid grid-cols-3 gap-2 pt-2 text-center font-bold">
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] text-gray-500">Recipients</div>
                  <div className="text-base font-black font-mono">{result.totalCustomers}</div>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] text-gray-500">SMS Sent</div>
                  <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">{result.smsSent}</div>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] text-gray-500">Voicemails</div>
                  <div className="text-base font-black font-mono text-indigo-700 dark:text-indigo-300">{result.voicemailsPlaced}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 text-xs font-bold"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            type="button"
            className="flex-2 h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2"
            onClick={handleLaunchBlast}
            disabled={isBroadcasting || customers.length === 0}
          >
            <Send className="w-4 h-4" />
            {isBroadcasting 
              ? `Delivering to ${customers.length} Customers...` 
              : `Blast to All ${customers.length} Registered Customers Now`
            }
          </Button>
        </div>

      </div>
    </div>
  );
}
