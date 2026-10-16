import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User, 
  Truck, 
  Package, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Bike,
  PhoneCall
} from 'lucide-react';
import { Button } from '../ui/Button';
import { apiSendOrderNotification } from '../../services/api';
import { soundEffects } from '../../lib/audio';

export default function OrderNotificationModal({ order, isOpen, onClose, onNotificationSent }) {
  if (!isOpen || !order) return null;

  const [channels, setChannels] = useState({
    sms: true,
    email: Boolean(order.customerEmail || true),
    voicemail: false
  });

  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '+91 98765 00000');
  const [customerEmail, setCustomerEmail] = useState(
    order.customerEmail || (order.customerId?.includes('@') ? order.customerId : 'ananya.iyer@gmail.com')
  );

  // Default intelligent message tailored to current order status
  const getStatusDefaultMessage = () => {
    const status = order.status;
    const name = order.customerName || 'Customer';
    const id = order.id;

    if (status === 'OUT_FOR_DELIVERY') {
      const riderName = order.rider?.name || 'our delivery partner';
      return `🛵 SmartMart: Hi ${name}, your order #${id} is OUT FOR DELIVERY! ${riderName} is en route to your address. Track live in your SmartMart app.`;
    }
    if (status === 'READY_FOR_PICKUP') {
      return `🛍️ SmartMart: Hi ${name}, your takeaway order #${id} is PACKED & READY FOR PICKUP at the express counter. Present your digital order pass to collect!`;
    }
    if (status === 'DELIVERED' || status === 'COMPLETED') {
      return `✅ SmartMart: Hi ${name}, order #${id} has been delivered successfully! Thank you for shopping with SmartMart Supermarket.`;
    }
    if (status === 'PACKING') {
      return `📦 SmartMart: Hi ${name}, order #${id} is being packed by our store team with 100% fresh grocery selection.`;
    }
    return `🛒 SmartMart: Hi ${name}, order #${id} has been confirmed. We are preparing your items for fast dispatch!`;
  };

  const [customMessage, setCustomMessage] = useState(getStatusDefaultMessage());
  const [sending, setSending] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleChannel = (key) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendNotification = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setResultStatus(null);

    const activeChannels = [];
    if (channels.sms && customerPhone) activeChannels.push('SMS');
    if (channels.email && customerEmail) activeChannels.push('EMAIL');
    if (channels.voicemail && customerPhone) activeChannels.push('VOICEMAIL');

    if (activeChannels.length === 0) {
      setErrorMsg('Please select at least one active notification channel (SMS or Email).');
      return;
    }

    setSending(true);
    try {
      const res = await apiSendOrderNotification({
        orderId: order.id,
        customerName: order.customerName || 'Customer',
        customerPhone,
        customerEmail,
        orderStatus: order.status || 'CONFIRMED',
        orderDetails: order,
        channels: activeChannels,
        customMessage
      });

      setResultStatus(res);
      soundEffects.playSuccessChime();
      if (onNotificationSent) onNotificationSent(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch notification');
      soundEffects.playErrorBuzzer();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5 text-gray-900 dark:text-white relative animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Customer Dispatch & Notification</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Send real-time SMS alerts & HTML email receipts for Order <strong className="font-mono text-emerald-600">#{order.id}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary Pill */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-bold">{order.customerName}</span>
            <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide">
              {order.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-gray-600 dark:text-gray-300">
            <span>{order.items?.length || 0} items</span>
            <span className="font-bold text-gray-900 dark:text-white">₹{Number(order.grandTotal || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Channel Toggles */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Dispatch Channels
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            
            {/* SMS Toggle */}
            <div 
              onClick={() => toggleChannel('sms')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                channels.sms 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 shadow-xs' 
                  : 'bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-gray-500'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${channels.sms ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
              <div className="text-left">
                <div className="font-bold text-xs">SMS Alert</div>
                <div className="text-[10px] opacity-75">Phone Text</div>
              </div>
            </div>

            {/* Email Toggle */}
            <div 
              onClick={() => toggleChannel('email')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                channels.email 
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 text-blue-950 dark:text-blue-100 shadow-xs' 
                  : 'bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-gray-500'
              }`}
            >
              <Mail className={`w-4 h-4 ${channels.email ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              <div className="text-left">
                <div className="font-bold text-xs">Email Invoice</div>
                <div className="text-[10px] opacity-75">HTML Receipt</div>
              </div>
            </div>

            {/* Voicemail Toggle */}
            <div 
              onClick={() => toggleChannel('voicemail')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                channels.voicemail 
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 text-purple-950 dark:text-purple-100 shadow-xs' 
                  : 'bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-gray-500'
              }`}
            >
              <PhoneCall className={`w-4 h-4 ${channels.voicemail ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
              <div className="text-left">
                <div className="font-bold text-xs">Voice Call</div>
                <div className="text-[10px] opacity-75">Speech Call</div>
              </div>
            </div>

          </div>
        </div>

        {/* Contact Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Customer Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Customer Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Editable Message Preview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Notification Text Message Content
            </label>
            <button
              type="button"
              onClick={() => setCustomMessage(getStatusDefaultMessage())}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Template
            </button>
          </div>
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 leading-relaxed font-sans"
            placeholder="Type message text here..."
          />
        </div>

        {/* Rider Assignment Info if applicable */}
        {order.rider && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs flex items-center justify-between text-purple-900 dark:text-purple-200">
            <span className="font-bold flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-purple-600" /> Rider Attached: {order.rider.name} ({order.rider.bikeNo})
            </span>
            <span className="font-mono text-[11px]">{order.rider.phone}</span>
          </div>
        )}

        {/* Result & Feedback Alerts */}
        {resultStatus && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {resultStatus.message || 'Notification dispatched successfully!'}
            </div>
            {resultStatus.results?.sms && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 pl-5">
                • SMS: {resultStatus.results.sms.mode === 'twilio_live' ? 'Delivered via Twilio Live carrier' : 'Delivered via SmartMart SMS Gateway'}
              </div>
            )}
            {resultStatus.results?.email && (
              <div className="text-[11px] text-blue-700 dark:text-blue-300 pl-5">
                • Email: {resultStatus.results.email.mode === 'smtp_live' ? 'Delivered via Live SMTP' : 'Delivered via SmartMart Instant Mailer'}
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            {resultStatus ? 'Close' : 'Cancel'}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSendNotification}
            disabled={sending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 flex items-center gap-1.5 shadow-md"
          >
            {sending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Send SMS & Email Alerts
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
