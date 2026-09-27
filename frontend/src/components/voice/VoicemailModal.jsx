import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  X, 
  Volume2, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Radio, 
  Clock, 
  Settings,
  ShieldCheck,
  Play,
  Square
} from 'lucide-react';
import { Button } from '../ui/Button';
import { apiSendVoicemail, apiGetVoiceStatus } from '../../services/api';
import { soundEffects } from '../../lib/audio';

export default function VoicemailModal({
  isOpen,
  onClose,
  customerName = 'Valued Customer',
  customerPhone = '+91 98765 00000',
  orderId = 'ORD-00000',
  orderStatus = 'OUT_FOR_DELIVERY',
  riderName = ''
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('DEFAULT');
  const [customText, setCustomText] = useState('');
  const [voice, setVoice] = useState('Polly.Aditi');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  const [voiceProvider, setVoiceProvider] = useState({ provider: 'Checking...', isLiveConfigured: false });
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      apiGetVoiceStatus().then(status => {
        if (status) setVoiceProvider(status);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Preset message templates
  const templates = {
    OUT_FOR_DELIVERY: `Hello ${customerName}, your SmartMart order ${orderId} is out for delivery with ${riderName || 'our rider'}. Your groceries will arrive in 15 minutes. Thank you!`,
    CONFIRMED: `Hello ${customerName}, your SmartMart order ${orderId} has been confirmed. Our store team is hand-picking and packaging your items right now.`,
    READY_FOR_PICKUP: `Hello ${customerName}, your takeaway order ${orderId} is packed and ready for pickup at our SmartMart express counter. Please present your digital barcode.`,
    DELIVERED: `Hello ${customerName}, your order ${orderId} has been successfully delivered. Thank you for choosing SmartMart Supermarket!`,
  };

  const currentMessage = customText.trim().length > 0 
    ? customText 
    : (templates[selectedTemplate] || templates.OUT_FOR_DELIVERY);

  // Preview local speech
  const handlePlayPreview = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingPreview) {
        window.speechSynthesis.cancel();
        setIsPlayingPreview(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentMessage);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingPreview(false);
      utterance.onerror = () => setIsPlayingPreview(false);

      setIsPlayingPreview(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Dispatch live or simulated voicemail via Twilio Voice API
  const handleSendVoicemail = async () => {
    setIsSending(true);
    setResult(null);
    try {
      const resp = await apiSendVoicemail({
        to: customerPhone,
        customerName,
        orderId,
        orderStatus,
        messageText: currentMessage,
        voice,
        language: 'en-IN'
      });

      setResult(resp);
      soundEffects.playSuccessChime();
    } catch (err) {
      setResult({
        success: false,
        error: err.message || 'Failed to place voicemail call.'
      });
      soundEffects.playErrorBuzzer();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                Send Automated Voicemail
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  voiceProvider.isLiveConfigured 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {voiceProvider.isLiveConfigured ? 'Twilio Live' : 'Simulation Mode'}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                PSTN Voice Call & Answering Machine Message
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Info Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div>
            <div className="font-extrabold text-gray-900">{customerName}</div>
            <div className="font-mono text-gray-500">{customerPhone}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Order Ref</span>
            <span className="font-mono font-black text-indigo-600">{orderId}</span>
          </div>
        </div>

        {/* Template Selectors */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 block">Select Voicemail Script</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'OUT_FOR_DELIVERY', label: '🛵 Out for Delivery' },
              { id: 'CONFIRMED', label: '📦 Packing Order' },
              { id: 'READY_FOR_PICKUP', label: '🛍️ Ready for Pickup' },
              { id: 'DELIVERED', label: '✓ Order Delivered' },
            ].map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  setSelectedTemplate(tpl.id);
                  setCustomText('');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                  selectedTemplate === tpl.id && !customText
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speech Text Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700">Spoken Speech / Message</label>
            <button
              type="button"
              onClick={handlePlayPreview}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {isPlayingPreview ? <Square className="w-3 h-3 text-rose-500" /> : <Play className="w-3 h-3" />}
              {isPlayingPreview ? 'Stop Audio' : 'Preview Voice'}
            </button>
          </div>
          <textarea
            rows={3}
            value={customText || templates[selectedTemplate] || templates.OUT_FOR_DELIVERY}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full text-xs p-3 rounded-2xl border border-gray-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden font-medium text-gray-800"
            placeholder="Customize the voicemail message here..."
          />
        </div>

        {/* Result Feedback Banner */}
        {result && (
          <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
            result.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="font-extrabold flex items-center gap-1.5">
              {result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              {result.success ? 'Voicemail Call Dispatched!' : 'Call Failed'}
            </div>
            <p className="text-[11px] opacity-90">{result.message || result.error}</p>
            {result.callSid && (
              <div className="text-[10px] font-mono text-gray-500 pt-1">
                Call SID: <span className="font-bold text-gray-700">{result.callSid}</span>
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
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
          >
            Close
          </Button>

          <Button
            type="button"
            className="flex-2 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2"
            onClick={handleSendVoicemail}
            disabled={isSending}
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Placing Voice Call...' : 'Send Voicemail Now'}
          </Button>
        </div>

      </div>
    </div>
  );
}
