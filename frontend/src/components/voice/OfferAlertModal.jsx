import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  PhoneCall, 
  MessageSquare, 
  Tag, 
  Percent, 
  Sparkles,
  Volume2,
  Settings
} from 'lucide-react';
import { Button } from '../ui/Button';
import { apiSendOfferAlert, apiGetVoiceStatus } from '../../services/api';
import { soundEffects } from '../../lib/audio';
import TwilioConfigModal from './TwilioConfigModal';

export default function OfferAlertModal({
  isOpen,
  onClose,
  offer = null,
  defaultPhone = '+91 98765 00000',
  defaultName = 'Ananya Iyer'
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [customerName, setCustomerName] = useState(defaultName);
  const [sendSMS, setSendSMS] = useState(true);
  const [sendVoicemail, setSendVoicemail] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  const [voiceProvider, setVoiceProvider] = useState({ provider: 'Checking...', isLiveConfigured: false });
  const [showTwilioConfig, setShowTwilioConfig] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  const fetchProviderStatus = () => {
    apiGetVoiceStatus().then(status => {
      if (status) setVoiceProvider(status);
    });
  };

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      if (defaultPhone) setPhone(defaultPhone);
      if (defaultName) setCustomerName(defaultName);
      fetchProviderStatus();
    }
  }, [isOpen, defaultPhone, defaultName]);

  const handlePlayVoicemail = () => {
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support audio speech synthesis.');
      return;
    }
    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }
    const cleanName = customerName || 'Valued Shopper';
    const text = `Hello ${cleanName}, this is SmartMart Supermarket with an exciting announcement! ${offer.title} is now live with an exclusive ${offer.discountPercent} percent discount. Use coupon code ${offer.promoCode} at checkout. Order online with fifteen-minute doorstep delivery or visit our express store. Thank you and have a wonderful day!`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India') || v.lang === 'en-GB');
    if (indVoice) utterance.voice = indVoice;
    utterance.onstart = () => setIsPlayingSpeech(true);
    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen || !offer) return null;

  const handleDispatch = async () => {
    if (!phone || phone.trim().length < 8) {
      alert('Please enter a valid phone number.');
      return;
    }

    const channels = [];
    if (sendSMS) channels.push('SMS');
    if (sendVoicemail) channels.push('VOICEMAIL');

    if (channels.length === 0) {
      alert('Please select at least one channel (SMS or Voicemail).');
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const resp = await apiSendOfferAlert({
        to: phone,
        customerName: customerName || 'Valued Shopper',
        offerTitle: offer.title,
        promoCode: offer.promoCode,
        discountPercent: offer.discountPercent,
        description: offer.description,
        channels
      });

      setResult(resp);
      soundEffects.playSuccessChime();
    } catch (err) {
      setResult({
        success: false,
        error: err.message || 'Failed to dispatch offer notification.'
      });
      soundEffects.playErrorBuzzer();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 text-gray-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
              <Megaphone className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">Send Offer to Phone</h3>
                <button
                  type="button"
                  onClick={() => setShowTwilioConfig(true)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${
                    voiceProvider.isLiveConfigured 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                  }`}
                  title="Configure Twilio live credentials"
                >
                  <Settings className="w-2.5 h-2.5" />
                  <span>{voiceProvider.isLiveConfigured ? 'Twilio Live' : 'Simulation'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automated SMS &amp; Voicemail Deal Alert
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

        {/* Selected Offer Card Preview */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> {offer.category || 'Special Promotion'}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs font-mono">
              {offer.discountPercent}% OFF
            </span>
          </div>
          <div className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">
            {offer.title}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {offer.description}
          </p>
          <div className="pt-1 flex items-center gap-2">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Coupon:</span>
            <span className="font-mono font-black text-xs text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
              {offer.promoCode}
            </span>
          </div>
        </div>

        {/* In-Browser Voicemail Audio Speech Player */}
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-600" />
            <div>
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                Hear Voicemail Audio Script
              </span>
              <span className="text-[10px] text-purple-700 dark:text-purple-300">
                Spoken aloud via browser voice synthesis
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handlePlayVoicemail}
            className={`text-xs font-black h-8 px-3 rounded-xl shadow-xs flex items-center gap-1.5 transition-all ${
              isPlayingSpeech 
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isPlayingSpeech ? 'Stop' : '▶️ Listen to Voicemail'}</span>
          </Button>
        </div>

        {/* Live Carrier vs Simulation Status Callout */}
        {!voiceProvider.isLiveConfigured && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-[11px] leading-tight">
                Currently in <strong>Simulation Mode</strong>. Voicemail audio plays in browser. To ring your physical phone, connect Twilio.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTwilioConfig(true)}
              className="text-[11px] font-black underline text-primary-700 dark:text-primary-300 shrink-0 hover:text-primary-800"
            >
              Setup Twilio
            </button>
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Mobile Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
            />
          </div>

          {/* Delivery Channels Checklist */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
              Select Alert Channels:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                sendSMS 
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold' 
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
              }`}>
                <input
                  type="checkbox"
                  checked={sendSMS}
                  onChange={(e) => setSendSMS(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs">SMS Text</span>
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                sendVoicemail 
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-bold' 
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
              }`}>
                <input
                  type="checkbox"
                  checked={sendVoicemail}
                  onChange={(e) => setSendVoicemail(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <PhoneCall className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs">Voice / Call</span>
              </label>
            </div>
          </div>
        </div>

        {/* Result status */}
        {result && (
          <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
            result.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="font-extrabold flex items-center gap-1.5">
              {result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{result.success ? 'Offer Alert Dispatched!' : 'Dispatch Notice'}</span>
            </div>
            <p className="text-[11px] opacity-95 leading-relaxed">{result.message || result.error}</p>
            {String(result.error || result.message).includes('Verified') && (
              <div className="pt-1.5 text-[10px] border-t border-rose-200 dark:border-rose-800/60 text-indigo-700 dark:text-indigo-300">
                👉 Add this number to your <a href="https://console.twilio.com/develop/phone-numbers/manage/verified" target="_blank" rel="noreferrer" className="underline font-black">Twilio Console Verified Caller IDs</a> to receive live test calls on a Free Trial account.
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11 text-xs font-bold"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="flex-2 h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2"
            onClick={handleDispatch}
            disabled={isSending}
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Sending Alerts...' : 'Broadcast to Phone Now'}
          </Button>
        </div>

      </div>

      {/* Twilio Settings & Diagnostics Modal */}
      {showTwilioConfig && (
        <TwilioConfigModal
          isOpen={showTwilioConfig}
          onClose={() => {
            setShowTwilioConfig(false);
            fetchProviderStatus();
          }}
          onConfigSaved={fetchProviderStatus}
        />
      )}

    </div>
  );
}
