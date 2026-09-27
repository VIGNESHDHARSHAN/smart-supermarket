import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Send, 
  PhoneCall, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Sparkles, 
  Radio, 
  RefreshCw, 
  ShieldCheck, 
  Settings,
  AlertCircle,
  Users
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { 
  apiGetOfferCampaigns, 
  apiCreateOfferCampaign, 
  apiGetDispatchHistory, 
  apiGetVoiceStatus 
} from '../../services/api';
import { soundEffects } from '../../lib/audio';
import OfferAlertModal from '../../components/voice/OfferAlertModal';
import MassBroadcastModal from '../../components/voice/MassBroadcastModal';

export default function StaffCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [history, setHistory] = useState([]);
  const [voiceStatus, setVoiceStatus] = useState({ provider: 'Checking...', isLiveConfigured: false });
  const [isLoading, setIsLoading] = useState(true);

  // New Campaign Form Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('20');
  const [newCategory, setNewCategory] = useState('Fruits & Vegetables');
  const [newDesc, setNewDesc] = useState('');
  const [newExpiry, setNewExpiry] = useState('Valid for 7 days');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected offer for dispatch
  const [dispatchOffer, setDispatchOffer] = useState(null);
  const [showMassBroadcastModal, setShowMassBroadcastModal] = useState(false);
  const [massBroadcastOffer, setMassBroadcastOffer] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cList, hList, status] = await Promise.all([
        apiGetOfferCampaigns(),
        apiGetDispatchHistory(),
        apiGetVoiceStatus()
      ]);
      setCampaigns(cList || []);
      setHistory(hList || []);
      setVoiceStatus(status || {});
    } catch (err) {
      console.warn('Error loading campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newTitle || !newPromoCode) {
      alert('Please fill in both Offer Title and Promo Code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiCreateOfferCampaign({
        title: newTitle,
        promoCode: newPromoCode,
        discountPercent: Number(newDiscount) || 15,
        category: newCategory,
        description: newDesc,
        validTill: newExpiry
      });

      if (res.campaign) {
        setCampaigns(prev => [res.campaign, ...prev]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewPromoCode('');
        setNewDesc('');
        soundEffects.playSuccessChime();
      }
    } catch (err) {
      alert('Failed to create campaign: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-amber-500" />
              Promotions &amp; Customer Outreach
            </h1>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
              voiceStatus.isLiveConfigured 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {voiceStatus.isLiveConfigured ? 'Twilio Live SMS & Voice' : 'Simulation Mode'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Broadcast promotional deals, flash discounts, and seasonal offers via automated SMS and phone Voicemail.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create New Offer
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setMassBroadcastOffer(null);
              setShowMassBroadcastModal(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white font-black text-xs shadow-md flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Blast to All Customers
          </Button>
        </div>
      </div>

      {/* Info Callout */}
      {!voiceStatus.isLiveConfigured && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold block">Running in Instant Simulation Mode</span>
            <p className="opacity-90">
              You can test creating campaigns and sending offer alerts to test numbers right now without spending telephony balance. To enable live carrier calls and SMS, enter your <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">TWILIO_ACCOUNT_SID</code>, <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">TWILIO_AUTH_TOKEN</code>, and <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">TWILIO_PHONE_NUMBER</code> in <code className="font-mono font-bold">backend/.env</code>.
            </p>
          </div>
        </div>
      )}

      {/* Active Campaigns Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary-600" />
            Active Promotional Campaigns ({campaigns.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {campaigns.map((camp) => (
            <div 
              key={camp.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-200 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                    {camp.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs font-mono shadow-xs">
                    {camp.discountPercent}% OFF
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-gray-900 dark:text-white leading-snug">
                    {camp.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {camp.description}
                  </p>
                </div>

                <div className="p-2.5 bg-gray-50 dark:bg-slate-800/80 rounded-2xl flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Coupon Code:</span>
                  <span className="font-mono font-black text-xs text-primary-600 dark:text-primary-400 tracking-wider">
                    {camp.promoCode}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Dispatched: <strong className="text-gray-700 dark:text-gray-200 font-mono">{camp.totalDispatched || 0} times</strong></span>
                  <span className="text-[10px]">{camp.validTill}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDispatchOffer(camp)}
                    className="h-10 text-xs font-bold flex items-center justify-center gap-1 border-gray-300 dark:border-slate-700"
                  >
                    <Send className="w-3 h-3" /> Test / Single
                  </Button>

                  <Button
                    onClick={() => {
                      setMassBroadcastOffer(camp);
                      setShowMassBroadcastModal(true);
                    }}
                    className="h-10 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1"
                  >
                    <Users className="w-3 h-3" /> Blast All
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dispatch History Log */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Recent Outbound Dispatch Logs ({history.length})
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Offer / Purpose</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold flex items-center gap-1.5">
                      {log.type === 'SMS' ? (
                        <span className="p-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <MessageSquare className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          <PhoneCall className="w-3 h-3" />
                        </span>
                      )}
                      <span>{log.type}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div>{log.recipient}</div>
                      <div className="text-[10px] text-gray-400 font-sans">{log.customerName}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">
                      {log.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                      {log.provider}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">
                      No broadcast dispatches recorded yet. Click "Broadcast via SMS &amp; Voicemail" above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateCampaign}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 text-gray-900 dark:text-white"
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Create New Offer Campaign
              </h3>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">Campaign Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Mega Weekend 40% Off Organic Greens"
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Promo Code</label>
                  <input 
                    type="text" 
                    value={newPromoCode}
                    onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MEGA40"
                    className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Discount %</label>
                  <input 
                    type="number" 
                    value={newDiscount}
                    onChange={e => setNewDiscount(e.target.value)}
                    min="1"
                    max="90"
                    className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden font-medium"
                >
                  <option value="Fruits & Vegetables">Fruits &amp; Vegetables</option>
                  <option value="Dairy & Bakery">Dairy &amp; Bakery</option>
                  <option value="Snacks & Beverages">Snacks &amp; Beverages</option>
                  <option value="Storewide Essentials">Storewide Essentials</option>
                  <option value="Festival Special">Festival Special</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Description / Customer Benefit</label>
                <textarea 
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Fresh organic farm produce at flat discount..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Validity Text</label>
                <input 
                  type="text" 
                  value={newExpiry}
                  onChange={e => setNewExpiry(e.target.value)}
                  placeholder="e.g. Valid until Sunday midnight"
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 text-xs font-bold"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-2 h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md"
              >
                {isSubmitting ? 'Saving Campaign...' : 'Publish Campaign'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Offer Alert Dispatch Modal */}
      {dispatchOffer && (
        <OfferAlertModal
          isOpen={!!dispatchOffer}
          onClose={() => setDispatchOffer(null)}
          offer={dispatchOffer}
          defaultPhone="+91 98765 00000"
          defaultName="Ananya Iyer"
        />
      )}

      {/* Mass Broadcast to All Registered Customers Modal */}
      {showMassBroadcastModal && (
        <MassBroadcastModal
          isOpen={showMassBroadcastModal}
          onClose={() => {
            setShowMassBroadcastModal(false);
            setMassBroadcastOffer(null);
          }}
          preselectedOffer={massBroadcastOffer}
          campaigns={campaigns}
          onBroadcastSuccess={loadData}
        />
      )}

    </div>
  );
}
