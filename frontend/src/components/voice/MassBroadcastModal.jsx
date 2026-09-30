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
  Tag,
  Settings,
  Volume2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FastForward,
  CheckCheck,
  Edit3,
  RotateCcw,
  Plus
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  apiGetRegisteredCustomers, 
  apiBroadcastToAllCustomers, 
  apiGetVoiceStatus,
  apiTestCustomSpeech
} from '../../services/api';
import { soundEffects } from '../../lib/audio';
import TwilioConfigModal from './TwilioConfigModal';

export default function MassBroadcastModal({
  isOpen,
  onClose,
  preselectedOffer = null,
  campaigns = [],
  onBroadcastSuccess = () => {}
}) {
  const [customers, setCustomers] = useState([]);
  const [selectedPhones, setSelectedPhones] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [dispatchedLinks, setDispatchedLinks] = useState(new Set());
  const [activeBurstQueue, setActiveBurstQueue] = useState(null);

  const [selectedOffer, setSelectedOffer] = useState(preselectedOffer || null);
  const [isCustomOfferMode, setIsCustomOfferMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('Flash Sale 30% OFF');
  const [customPromoCode, setCustomPromoCode] = useState('FLASH30');
  const [customDiscount, setCustomDiscount] = useState('30');
  const [customDescription, setCustomDescription] = useState('Flat 30% off on fresh groceries today.');

  // Editable Voicemail & SMS Script
  const [voicemailText, setVoicemailText] = useState('');
  const [isCustomEdited, setIsCustomEdited] = useState(false);
  const [isTestCalling, setIsTestCalling] = useState(false);
  const [testCallStatus, setTestCallStatus] = useState(null);
  
  const [sendVoicemail, setSendVoicemail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [result, setResult] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState({ provider: 'Checking...', isLiveConfigured: false });
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [showTwilioConfig, setShowTwilioConfig] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  const getDefaultVoicemailScript = (title, discount, promo) => {
    const t = title || 'Special Supermarket Offer';
    const d = discount ? `${discount}%` : 'exclusive';
    const c = promo ? `Use coupon code ${promo} at checkout.` : '';
    return `Hello [Customer Name], this is SmartMart Supermarket with an exciting announcement! ${t} is now live with flat ${d} discount. ${c} Order online for fifteen-minute doorstep delivery or visit our express store today!`;
  };

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setTestCallStatus(null);
      setSearchQuery('');
      setCurrentPage(1);

      let initialOffer = preselectedOffer;
      if (!initialOffer && campaigns && campaigns.length > 0) {
        initialOffer = campaigns[0];
      }
      if (initialOffer) {
        setSelectedOffer(initialOffer);
        setIsCustomOfferMode(false);
        setVoicemailText(prev => (prev && isCustomEdited ? prev : getDefaultVoicemailScript(initialOffer.title, initialOffer.discountPercent, initialOffer.promoCode)));
      }

      setIsLoadingCustomers(true);
      Promise.all([
        apiGetRegisteredCustomers(),
        apiGetVoiceStatus()
      ]).then(([res, status]) => {
        const custList = Array.isArray(res) ? res : (res?.customers || []);
        setCustomers(custList);
        // Default: select all customers initially
        setSelectedPhones(new Set(custList.map(c => c.phone)));
        setVoiceStatus(status || {});
        setIsLoadingCustomers(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeTitle = isCustomOfferMode ? customTitle : (selectedOffer ? selectedOffer.title : customTitle);
  const activePromoCode = isCustomOfferMode ? customPromoCode : (selectedOffer ? selectedOffer.promoCode : customPromoCode);
  const activeDiscount = isCustomOfferMode ? customDiscount : (selectedOffer ? selectedOffer.discountPercent : customDiscount);
  const activeDescription = isCustomOfferMode ? customDescription : (selectedOffer ? selectedOffer.description : customDescription);

  // Handle offer selection and update voicemail template if user hasn't typed custom
  const handleSelectOffer = (camp) => {
    setIsCustomOfferMode(false);
    setSelectedOffer(camp);
    if (!isCustomEdited) {
      setVoicemailText(getDefaultVoicemailScript(camp.title, camp.discountPercent, camp.promoCode));
    }
  };

  const handleSelectCustomOfferMode = () => {
    setIsCustomOfferMode(true);
    setSelectedOffer(null);
    if (!isCustomEdited) {
      setVoicemailText(getDefaultVoicemailScript(customTitle, customDiscount, customPromoCode));
    }
  };

  const handleApplyTemplate = (tplText) => {
    setVoicemailText(tplText);
    setIsCustomEdited(true);
  };

  const handleResetVoicemail = () => {
    setIsCustomEdited(false);
    setVoicemailText(getDefaultVoicemailScript(activeTitle, activeDiscount, activePromoCode));
  };

  const handleInsertTag = (tag) => {
    setVoicemailText(prev => {
      if (prev.includes(tag)) return prev;
      return `${prev} ${tag}`;
    });
    setIsCustomEdited(true);
  };

  // Filter customers by search query
  const filteredCustomers = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const handleSelectPageOnly = () => {
    const next = new Set(selectedPhones);
    paginatedCustomers.forEach(c => next.add(c.phone));
    setSelectedPhones(next);
  };

  const handleDeselectPageOnly = () => {
    const next = new Set(selectedPhones);
    paginatedCustomers.forEach(c => next.delete(c.phone));
    setSelectedPhones(next);
  };

  const handleStartBurstQueue = (type = 'WHATSAPP') => {
    if (!result?.batchLogs) return;
    const items = result.batchLogs.filter(l => (type === 'WHATSAPP' ? Boolean(l.waLink) : Boolean(l.smsLink)));
    if (items.length === 0) {
      alert(`No ${type} links ready to burst.`);
      return;
    }
    setActiveBurstQueue({ type, index: 0, items });
    const firstUrl = type === 'WHATSAPP' ? items[0].waLink : items[0].smsLink;
    window.open(firstUrl, '_blank');
    setDispatchedLinks(prev => new Set(prev).add(`${type}-${items[0].recipient}`));
  };

  const handleBurstQueueNext = () => {
    if (!activeBurstQueue) return;
    const nextIdx = activeBurstQueue.index + 1;
    if (nextIdx >= activeBurstQueue.items.length) {
      soundEffects.playSuccessChime();
      alert(`🎉 All ${activeBurstQueue.items.length} ${activeBurstQueue.type} burst messages processed!`);
      setActiveBurstQueue(null);
      return;
    }
    setActiveBurstQueue(prev => ({ ...prev, index: nextIdx }));
    const nextItem = activeBurstQueue.items[nextIdx];
    const url = activeBurstQueue.type === 'WHATSAPP' ? nextItem.waLink : nextItem.smsLink;
    window.open(url, '_blank');
    setDispatchedLinks(prev => new Set(prev).add(`${activeBurstQueue.type}-${nextItem.recipient}`));
  };

  const handleMarkDispatched = (type, recipient, url) => {
    setDispatchedLinks(prev => new Set(prev).add(`${type}-${recipient}`));
    window.open(url, '_blank');
  };

  // Selection helpers
  const isAllFilteredSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedPhones.has(c.phone));
  const isSomeFilteredSelected = filteredCustomers.some(c => selectedPhones.has(c.phone)) && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    const next = new Set(selectedPhones);
    if (isAllFilteredSelected) {
      // Unselect all currently filtered
      filteredCustomers.forEach(c => next.delete(c.phone));
    } else {
      // Select all currently filtered
      filteredCustomers.forEach(c => next.add(c.phone));
    }
    setSelectedPhones(next);
  };

  const handleSelectAllGlobal = () => {
    setSelectedPhones(new Set(customers.map(c => c.phone)));
  };

  const handleClearAllGlobal = () => {
    setSelectedPhones(new Set());
  };

  const handleToggleCustomer = (phone) => {
    const next = new Set(selectedPhones);
    if (next.has(phone)) {
      next.delete(phone);
    } else {
      next.add(phone);
    }
    setSelectedPhones(next);
  };

  const handlePlayVoicemail = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser speech synthesis is not supported on this device.');
      return;
    }
    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    const scriptText = (voicemailText || getDefaultVoicemailScript(activeTitle, activeDiscount, activePromoCode))
      .replace(/\[Customer Name\]|\{name\}/gi, 'Valued Customer');

    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India')) ||
                           voices.find(v => v.lang.includes('en-US')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsPlayingSpeech(true);
    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleTestCallToMyPhone = async () => {
    const currentScript = (voicemailText || getDefaultVoicemailScript(activeTitle, activeDiscount, activePromoCode)).trim();
    setIsTestCalling(true);
    setTestCallStatus(null);
    try {
      const resp = await apiTestCustomSpeech({
        to: '+919514134125',
        text: currentScript,
        customerName: 'Vignesh Dharshan'
      });
      setTestCallStatus({
        success: true,
        message: resp.message || 'Call placed! Answer your phone and press 1 to hear your custom announcement.'
      });
      soundEffects.playSuccessChime();
    } catch (err) {
      setTestCallStatus({
        success: false,
        message: err.message || 'Failed to place test call.'
      });
      soundEffects.playErrorBuzzer();
    } finally {
      setIsTestCalling(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const currentScript = (voicemailText || getDefaultVoicemailScript(activeTitle, activeDiscount, activePromoCode)).trim();
    const cleanDigits = '919514134125';
    const cleanMsg = currentScript.replace(/\[Customer Name\]|\{name\}/gi, 'Vignesh');
    const waUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(cleanMsg)}`;
    window.open(waUrl, '_blank');
  };

  const handleOpenSMS = () => {
    const currentScript = (voicemailText || getDefaultVoicemailScript(activeTitle, activeDiscount, activePromoCode)).trim();
    const cleanDigits = '919514134125';
    const cleanMsg = currentScript.replace(/\[Customer Name\]|\{name\}/gi, 'Vignesh');
    const smsUrl = `sms:+${cleanDigits}?body=${encodeURIComponent(cleanMsg)}`;
    window.open(smsUrl, '_blank');
  };

  const handleLaunchBlast = async () => {
    if (!activeTitle || !activePromoCode) {
      alert('Please specify an offer title and promo code.');
      return;
    }

    const channels = [];
    if (sendVoicemail) channels.push('VOICEMAIL');
    if (sendWhatsApp) channels.push('WHATSAPP');
    if (sendSMS) channels.push('SMS');

    if (channels.length === 0) {
      alert('Please select at least one channel (Voice Call, WhatsApp, or SMS).');
      return;
    }

    // Filter to selected customers
    const selectedCustomersList = customers.filter(c => selectedPhones.has(c.phone));
    if (selectedCustomersList.length === 0) {
      alert('Please select at least one customer to broadcast to.');
      return;
    }

    const currentScript = (voicemailText || getDefaultVoicemailScript(activeTitle, activeDiscount, activePromoCode)).trim();

    const confirmMsg = `Confirm mass outreach? This will send ${channels.join(' & ')} to ${selectedCustomersList.length} selected customer(s).`;
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
        targetRecipients: selectedCustomersList,
        customMessage: currentScript,
        voicemailMessage: currentScript,
        messageText: currentScript
      });

      setResult(resp);
      if (resp.success) {
        soundEffects.playSuccessChime();
        onBroadcastSuccess();
      } else {
        soundEffects.playErrorBuzzer();
      }
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
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">Mass Outreach &amp; Voice Burst</h3>
                <button
                  type="button"
                  onClick={() => setShowTwilioConfig(true)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${
                    voiceStatus.isLiveConfigured 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                  }`}
                  title="Configure Twilio live credentials"
                >
                  <Settings className="w-2.5 h-2.5" />
                  <span>{voiceStatus.isLiveConfigured ? 'Twilio Live' : 'Simulation Mode'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Broadcast offers via automated Voicemail &amp; SMS to selected customer phone numbers
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

        {/* Customer Selection & Pagination Section */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-extrabold text-xs text-gray-800 dark:text-gray-200">
                Audience: <strong className="text-amber-600 dark:text-amber-400">{selectedPhones.size}</strong> of {customers.length} Selected
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleSelectPageOnly}
                className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                title="Select all customers on this page"
              >
                Select Page ({paginatedCustomers.length})
              </button>
              <button
                type="button"
                onClick={handleSelectAllGlobal}
                className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                title="Select all customers across all pages"
              >
                Select All ({customers.length})
              </button>
              <button
                type="button"
                onClick={handleClearAllGlobal}
                className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                title="Clear all selected"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Search bar & Master Checkbox */}
          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer shrink-0 select-none">
              <input
                type="checkbox"
                checked={isAllFilteredSelected}
                ref={el => { if (el) el.indeterminate = isSomeFilteredSelected; }}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-[11px]">Select Page / Filtered</span>
            </label>

            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by customer name or phone..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-amber-500 outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Customer Rows List */}
          <div className="space-y-1.5 min-h-[140px]">
            {isLoadingCustomers ? (
              <div className="text-xs text-gray-400 p-6 text-center">Loading customer list...</div>
            ) : paginatedCustomers.length === 0 ? (
              <div className="text-xs text-gray-400 p-6 text-center">
                No customers match "{searchQuery}"
              </div>
            ) : (
              paginatedCustomers.map(c => {
                const isSelected = selectedPhones.has(c.phone);
                return (
                  <div
                    key={c.phone}
                    onClick={() => handleToggleCustomer(c.phone)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-gray-900 dark:text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-900/60 border-gray-200 dark:border-slate-700 opacity-60 text-gray-500 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent container click
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 pointer-events-none cursor-pointer"
                      />
                      <div>
                        <div className="font-extrabold text-xs flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.source && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-500 font-normal">
                              {c.source}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{c.phone}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {isSelected ? (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                          Included ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 px-2 py-0.5">
                          Excluded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Full Professional Pagination Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2.5 border-t border-gray-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap">
              <span>
                Showing <strong>{filteredCustomers.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredCustomers.length)}</strong> of <strong>{filteredCustomers.length}</strong>
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <div className="flex items-center gap-1">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-[11px] font-bold outline-hidden"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={9999}>All</option>
                </select>
              </div>
            </div>

            {/* Page Navigation Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-1 rounded-md border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded-md border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-0.5 text-[11px] font-bold"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) => (
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-xs">...</span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`w-6 h-6 rounded-md text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                        safeCurrentPage === p 
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs' 
                          : 'border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                ))}
              </div>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-0.5 rounded-md border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-0.5 text-[11px] font-bold"
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1 rounded-md border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Offer Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              1. Choose Offer Preset OR Create Custom Offer:
            </label>
            <span className="text-[10px] text-gray-500 font-medium">Click any card below</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {campaigns.map(camp => (
              <div
                key={camp.id}
                onClick={() => handleSelectOffer(camp)}
                className={`p-2.5 rounded-2xl border cursor-pointer transition-all text-left ${
                  !isCustomOfferMode && selectedOffer?.id === camp.id 
                    ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30 shadow-xs' 
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

            {/* Custom Offer Card */}
            <div
              onClick={handleSelectCustomOfferMode}
              className={`p-2.5 rounded-2xl border cursor-pointer transition-all text-left flex flex-col justify-between ${
                isCustomOfferMode 
                  ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30 shadow-xs' 
                  : 'border-dashed border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">✍️ Custom</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{customDiscount}% OFF</span>
              </div>
              <div className="font-extrabold text-xs truncate text-gray-900 dark:text-white">Create Custom Deal</div>
            </div>
          </div>

          {/* If Custom Offer Mode is active, show editable inputs */}
          {isCustomOfferMode && (
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 space-y-2 animate-in fade-in">
              <div className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Custom Offer Details:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">Offer Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => {
                      setCustomTitle(e.target.value);
                      if (!isCustomEdited) {
                        setVoicemailText(getDefaultVoicemailScript(e.target.value, customDiscount, customPromoCode));
                      }
                    }}
                    placeholder="e.g. Flash Sale 30% OFF"
                    className="w-full text-xs p-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">Promo / Coupon Code</label>
                  <input
                    type="text"
                    value={customPromoCode}
                    onChange={(e) => {
                      setCustomPromoCode(e.target.value);
                      if (!isCustomEdited) {
                        setVoicemailText(getDefaultVoicemailScript(customTitle, customDiscount, e.target.value));
                      }
                    }}
                    placeholder="e.g. FLASH30"
                    className="w-full text-xs p-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">Discount %</label>
                  <input
                    type="number"
                    value={customDiscount}
                    onChange={(e) => {
                      setCustomDiscount(e.target.value);
                      if (!isCustomEdited) {
                        setVoicemailText(getDefaultVoicemailScript(customTitle, e.target.value, customPromoCode));
                      }
                    }}
                    placeholder="30"
                    className="w-full text-xs p-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Editable Message Card for All Channels */}
        <div className="p-4 bg-gradient-to-br from-amber-50/90 via-indigo-50/40 to-emerald-50/40 dark:from-slate-800 dark:to-slate-800/90 rounded-2xl border border-amber-300/80 dark:border-slate-700 text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="font-black text-xs text-gray-900 dark:text-white block">
                  2. Customize Broadcast Message (Voice Call, WhatsApp &amp; SMS)
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  Type your custom announcement below. Used across all active channels.
                </span>
              </div>
              {isCustomEdited && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 shrink-0">
                  Customized
                </span>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleInsertTag('[Customer Name]')}
                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                title="Insert customer name placeholder"
              >
                <Plus className="w-3 h-3" />
                <span>[Customer Name]</span>
              </button>

              <button
                type="button"
                onClick={handleResetVoicemail}
                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                title="Reset to default template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              <Button
                type="button"
                size="sm"
                onClick={handlePlayVoicemail}
                className={`text-[11px] font-black h-7 px-2.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all ${
                  isPlayingSpeech 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Volume2 className="w-3 h-3" />
                <span>{isPlayingSpeech ? 'Stop' : '▶️ Preview Audio'}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleTestCallToMyPhone}
                disabled={isTestCalling}
                className="text-[11px] font-black h-7 px-2.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer disabled:opacity-50"
                title="Directly dial +91 95141 34125 to hear this customized message on your phone"
              >
                <PhoneCall className="w-3 h-3" />
                <span>{isTestCalling ? '📞 Calling...' : '📞 Call My Phone'}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenWhatsApp}
                className="text-[11px] font-black h-7 px-2.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                title="Open directly in WhatsApp with your customized announcement pre-filled"
              >
                <MessageSquare className="w-3 h-3 text-emerald-100" />
                <span>💬 WhatsApp</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenSMS}
                className="text-[11px] font-black h-7 px-2.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                title="Open directly in native SMS app with your customized announcement pre-filled"
              >
                <MessageSquare className="w-3 h-3 text-blue-100" />
                <span>📱 SMS App</span>
              </Button>
            </div>
          </div>

          {/* Quick 1-Click Message Templates */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Quick Templates:</span>
            <button
              type="button"
              onClick={() => handleApplyTemplate(`Hello [Customer Name], this is SmartMart Supermarket! Enjoy flat ${activeDiscount}% OFF on all groceries today. Use coupon code ${activePromoCode} at checkout.`)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/60 hover:bg-amber-50 text-amber-800 dark:text-amber-300 cursor-pointer shadow-2xs"
            >
              🏷️ {activeDiscount}% OFF Deal
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate(`Hello [Customer Name], SmartMart fifteen-minute express doorstep grocery delivery is now live in your area! Order now and get free delivery with code ${activePromoCode}.`)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300 cursor-pointer shadow-2xs"
            >
              🚚 15-Min Free Delivery
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate(`Hello [Customer Name], special weekend savings at SmartMart Supermarket! Flat ${activeDiscount}% off on fresh fruits, vegetables, and essentials. Order online or visit today!`)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800/60 hover:bg-indigo-50 text-indigo-800 dark:text-indigo-300 cursor-pointer shadow-2xs"
            >
              🎁 Weekend Savings
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('')}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 text-gray-500 cursor-pointer shadow-2xs"
              title="Clear text to write completely from scratch"
            >
              🧹 Clear Blank
            </button>
          </div>

          <textarea
            rows={3}
            value={voicemailText}
            onChange={(e) => {
              setVoicemailText(e.target.value);
              setIsCustomEdited(true);
            }}
            placeholder="Type your custom announcement text here (speaks in voice call, sends in WhatsApp and SMS)..."
            className="w-full text-xs p-3 rounded-xl border border-amber-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden font-medium text-gray-800 dark:text-gray-100 shadow-inner"
          />

          {testCallStatus && (
            <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
              testCallStatus.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              {testCallStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />}
              <div>
                <p className="font-bold">{testCallStatus.message}</p>
                {testCallStatus.success && (
                  <p className="text-[10px] opacity-80 mt-0.5">
                    Twilio Trial Note: When answering, press <strong>1</strong> on your phone keypad to execute the announcement.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>
              💡 <em>[Customer Name]</em> will be personalized automatically for each selected recipient.
            </span>
            <span className="font-mono font-medium">
              {voicemailText.length} chars
            </span>
          </div>
        </div>

        {/* Broadcast Channels */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
            Dispatch Channels (Simultaneous Omnichannel):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Voice Call */}
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
                <span className="text-xs">Voice Call (Working)</span>
              </div>
            </label>

            {/* WhatsApp */}
            <label className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
              sendWhatsApp 
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold' 
                : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400'
            }`}>
              <input
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs">WhatsApp (wa.me)</span>
              </div>
            </label>

            {/* SMS */}
            <label className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
              sendSMS 
                ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold' 
                : 'border-gray-200 dark:border-slate-800 text-gray-400 dark:text-gray-500'
            }`}>
              <input
                type="checkbox"
                checked={sendSMS}
                onChange={(e) => setSendSMS(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs">SMS (DLT Notice)</span>
              </div>
            </label>
          </div>
        </div>

        {/* Twilio Trial Keypad Instructions */}
        <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300">
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            <span>Twilio Trial Account Phone Answering Tip:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-indigo-900/90 dark:text-indigo-200/90">
            When your customer or test device answers the incoming call, Twilio prompts: <em>"Press any key to execute your code"</em>. <strong>Press 1 on your phone dial pad</strong> to immediately start playing the supermarket voice offer.
          </p>
        </div>

        {/* Result status banner */}
        {result && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
            result.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="font-black text-sm flex items-center gap-2">
              {result.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span>{result.success ? 'Mass Broadcast Processed' : 'Broadcast Dispatch Warning'}</span>
            </div>
            <p className="text-xs opacity-90 leading-relaxed">{result.message || result.error}</p>
            {result.totalCustomers && (
              <div className="grid grid-cols-4 gap-2 pt-2 text-center font-bold">
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] text-gray-500">Recipients</div>
                  <div className="text-base font-black font-mono">{result.totalCustomers}</div>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] text-emerald-600 font-bold">WhatsApp</div>
                  <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                    {result.whatsAppSent !== undefined ? result.whatsAppSent : (result.batchLogs ? result.batchLogs.filter(l => l.type === 'WHATSAPP' && (l.status === 'SENT' || l.status === 'READY_IN_WHATSAPP')).length : 0)}
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <div className="text-[10px] text-indigo-600 font-bold">Voicemails</div>
                  <div className="text-base font-black font-mono text-indigo-700 dark:text-indigo-300">{result.voicemailsPlaced || 0}</div>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-gray-200 dark:border-slate-800">
                  <div className="text-[10px] text-gray-500">SMS</div>
                  <div className="text-base font-black font-mono text-gray-700 dark:text-gray-300">{result.smsSent || 0}</div>
                </div>
              </div>
            )}
            {result.batchLogs && result.batchLogs.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="font-bold text-[11px] text-gray-700 dark:text-gray-300">
                    Dispatch Log &amp; 1-Click Multi-Burst:
                  </div>
                  
                  {/* Multi-Burst Launch Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {result.batchLogs.some(l => l.waLink) && (
                      <button
                        type="button"
                        onClick={() => handleStartBurstQueue('WHATSAPP')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                        title="Start guided 1-click burst sender for WhatsApp"
                      >
                        <Zap className="w-3 h-3 text-emerald-200 fill-emerald-200" />
                        <span>⚡ Burst WhatsApp ({result.batchLogs.filter(l => l.waLink).length})</span>
                      </button>
                    )}

                    {result.batchLogs.some(l => l.smsLink) && (
                      <button
                        type="button"
                        onClick={() => handleStartBurstQueue('SMS')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                        title="Start guided 1-click burst sender for SMS"
                      >
                        <Zap className="w-3 h-3 text-blue-200 fill-blue-200" />
                        <span>📱 Burst SMS ({result.batchLogs.filter(l => l.smsLink).length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Burst Queue Runner Bar */}
                {activeBurstQueue && activeBurstQueue.items[activeBurstQueue.index] && (
                  <div className="p-3 bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-blue-500/15 border-2 border-amber-500/40 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-black">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                        <Zap className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
                        <span>
                          Bursting {activeBurstQueue.type}: Recipient {activeBurstQueue.index + 1} of {activeBurstQueue.items.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveBurstQueue(null)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
                      >
                        ✕ Cancel
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-amber-300/60 dark:border-slate-700">
                      <div>
                        <div className="font-extrabold text-xs text-gray-900 dark:text-white">
                          {activeBurstQueue.items[activeBurstQueue.index].customerName || 'Customer'}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500">
                          {activeBurstQueue.items[activeBurstQueue.index].recipient}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = activeBurstQueue.items[activeBurstQueue.index];
                            const url = activeBurstQueue.type === 'WHATSAPP' ? cur.waLink : cur.smsLink;
                            window.open(url, '_blank');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                        >
                          Re-open
                        </button>
                        <button
                          type="button"
                          onClick={handleBurstQueueNext}
                          className="px-3 py-1 text-[11px] font-black rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>{activeBurstQueue.index + 1 === activeBurstQueue.items.length ? 'Finish ✓' : 'Next Recipient ⏭️'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[10px]">
                  {result.batchLogs.map((log, idx) => {
                    const isWaDispatched = dispatchedLinks.has(`WHATSAPP-${log.recipient}`);
                    const isSmsDispatched = dispatchedLinks.has(`SMS-${log.recipient}`);
                    return (
                      <div key={idx} className="flex items-center justify-between p-1.5 bg-white/70 dark:bg-slate-900/70 rounded-lg border border-gray-100 dark:border-slate-800">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate max-w-[130px] font-bold text-gray-900 dark:text-gray-100">{log.customerName || log.recipient}</span>
                          <span className="text-[9px] text-gray-500">{log.recipient}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded-sm font-bold ${
                            log.status === 'QUEUED' || log.status === 'SENT' || log.status === 'READY_IN_WHATSAPP' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300' :
                            log.status.includes('SIMULATED') ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'
                          }`}>
                            {log.type}: {log.status}
                          </span>
                          {log.waLink && (
                            <button
                              type="button"
                              onClick={() => handleMarkDispatched('WHATSAPP', log.recipient, log.waLink)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 active:scale-95 font-bold rounded text-[10px] shadow-xs cursor-pointer ${
                                isWaDispatched
                                  ? 'bg-emerald-800 text-emerald-100 border border-emerald-600'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title="Click to open pre-filled message in WhatsApp"
                            >
                              <span>{isWaDispatched ? '✓ WA Sent' : 'Open WA 💬'}</span>
                            </button>
                          )}
                          {log.smsLink && (
                            <button
                              type="button"
                              onClick={() => handleMarkDispatched('SMS', log.recipient, log.smsLink)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 active:scale-95 font-bold rounded text-[10px] shadow-xs cursor-pointer ${
                                isSmsDispatched
                                  ? 'bg-blue-800 text-blue-100 border border-blue-600'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                              title="Click to open pre-filled message in SMS app"
                            >
                              <span>{isSmsDispatched ? '✓ SMS Sent' : 'Open SMS 📱'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {result.batchLogs.some(l => String(l.error).includes('Verified') || String(l.error).includes('trial')) && (
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold mt-1 leading-snug">
                    👉 On a Twilio Free Trial account, numbers must be verified at <a href="https://console.twilio.com/develop/phone-numbers/manage/verified" target="_blank" rel="noreferrer" className="underline font-black">Twilio Console Verified Caller IDs</a> before they can receive calls.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 px-3 text-xs font-bold shrink-0"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            type="button"
            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
            onClick={handleOpenWhatsApp}
            title="Open customized offer message pre-filled in WhatsApp"
          >
            <MessageSquare className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Open WhatsApp 💬</span>
          </Button>

          <Button
            type="button"
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
            onClick={handleOpenSMS}
            title="Open customized offer message pre-filled in native SMS app"
          >
            <MessageSquare className="w-4 h-4 text-blue-100 shrink-0" />
            <span>Open SMS App 📱</span>
          </Button>

          {(() => {
            const activeChannels = [];
            if (sendWhatsApp) activeChannels.push('WhatsApp');
            if (sendSMS) activeChannels.push('SMS');
            if (sendVoicemail) activeChannels.push('Voice Call');
            const channelStr = activeChannels.length > 0 ? activeChannels.join(' & ') : 'Broadcast';

            return (
              <Button
                type="button"
                className="flex-2 h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleLaunchBlast}
                disabled={isBroadcasting || selectedPhones.size === 0}
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>
                  {isBroadcasting 
                    ? `Delivering ${channelStr} to ${selectedPhones.size} Customers...` 
                    : selectedPhones.size === 0 
                      ? 'Select At Least 1 Customer' 
                      : `🚀 Burst ${channelStr} to ${selectedPhones.size} Customer${selectedPhones.size === 1 ? '' : 's'} Now`
                  }
                </span>
              </Button>
            );
          })()}
        </div>

      </div>

      {/* Twilio Telephony Setup Modal */}
      {showTwilioConfig && (
        <TwilioConfigModal
          isOpen={showTwilioConfig}
          onClose={() => setShowTwilioConfig(false)}
          onConfigUpdated={() => {
            apiGetVoiceStatus().then(st => setVoiceStatus(st || {}));
          }}
        />
      )}
    </div>
  );
}
