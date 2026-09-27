import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  Phone, 
  Clock, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Navigation, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  KeyRound,
  DollarSign,
  TrendingUp,
  Star,
  Store,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useSupermarket } from '../../context/SupermarketContext';

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { 
    currentDeliveryPartner, 
    logoutDeliveryPartner, 
    orders, 
    updateDeliveryPartnerStatus,
    deliveryUpdateOrderStatus,
    storeSettings
  } = useSupermarket();

  const [otpInput, setOtpInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!currentDeliveryPartner) {
    navigate('/delivery/login', { replace: true });
    return null;
  }

  // Find active orders assigned to this delivery partner
  const myAssignedOrders = orders.filter(o => 
    o.type === 'DELIVERY' && 
    o.rider?.id === currentDeliveryPartner.id &&
    ['PLACED', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY'].includes(o.status)
  );

  const activeOrder = myAssignedOrders[0] || null;

  // Past completed deliveries by this partner
  const myCompletedOrders = orders.filter(o => 
    o.type === 'DELIVERY' && 
    (o.rider?.id === currentDeliveryPartner.id || o.rider?.name === currentDeliveryPartner.name) &&
    o.status === 'DELIVERED'
  );

  const isOnline = currentDeliveryPartner.status !== 'OFFLINE';

  const toggleAvailability = () => {
    const nextStatus = isOnline ? 'OFFLINE' : 'AVAILABLE';
    updateDeliveryPartnerStatus(currentDeliveryPartner.id, nextStatus);
  };

  const handleUpdateStatus = (newStatus) => {
    setErrorMessage('');
    setSuccessMessage('');
    const res = deliveryUpdateOrderStatus(activeOrder.id, newStatus, otpInput);
    if (!res.success) {
      setErrorMessage(res.error);
    } else {
      if (newStatus === 'DELIVERED') {
        setSuccessMessage(`Order #${activeOrder.id} successfully delivered! Payout credited.`);
        setOtpInput('');
      } else {
        setSuccessMessage(`Order status updated to ${newStatus}`);
      }
    }
  };

  const todayEarnings = (myCompletedOrders.length * 50) + (currentDeliveryPartner.completedTrips ? 250 : 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">GoSmart Delivery</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-gray-400'
                }`}>
                  {isOnline ? 'Active On-Duty' : 'Offline'}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 font-mono">
                {storeSettings?.storeName || 'SmartMart Indiranagar'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleAvailability}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isOnline 
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
            <button
              onClick={() => logoutDeliveryPartner()}
              className="p-2 text-gray-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Partner Profile & Metrics */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <img
              src={currentDeliveryPartner.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'}
              alt={currentDeliveryPartner.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
            />
            <div>
              <h2 className="text-xl font-black text-white">{currentDeliveryPartner.name}</h2>
              <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start mt-0.5">
                <Bike className="w-3.5 h-3.5" />
                {currentDeliveryPartner.vehicleType} • <span className="font-mono">{currentDeliveryPartner.vehicleNo}</span>
              </p>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                Phone: {currentDeliveryPartner.phone} • Shift: {currentDeliveryPartner.shift}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <div className="bg-slate-900/80 px-3 py-2.5 rounded-2xl border border-slate-700/80 text-center">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Completed</div>
              <div className="text-lg font-black text-emerald-400">
                {(currentDeliveryPartner.completedTrips || 0) + myCompletedOrders.length}
              </div>
            </div>
            <div className="bg-slate-900/80 px-3 py-2.5 rounded-2xl border border-slate-700/80 text-center">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Earnings</div>
              <div className="text-lg font-black text-amber-400">
                ₹{todayEarnings}
              </div>
            </div>
            <div className="bg-slate-900/80 px-3 py-2.5 rounded-2xl border border-slate-700/80 text-center">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rating</div>
              <div className="text-lg font-black text-yellow-400 flex items-center justify-center gap-0.5">
                <span>★</span> {currentDeliveryPartner.rating || 4.9}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Active Assigned Delivery Task */}
        {activeOrder ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-850 rounded-3xl p-6 border-2 border-amber-500/50 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                  Active Delivery Task
                </span>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  Order #{activeOrder.id}
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-700 text-amber-300 font-mono font-bold">
                    {activeOrder.deliverySpeed || 'EXPRESS'} (15 Min)
                  </span>
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-400 block">Current Status</span>
                <span className="text-sm font-extrabold text-amber-400 uppercase tracking-wide">
                  {activeOrder.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Delivery Destination & Customer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  Delivery Destination
                </div>
                <p className="text-sm font-bold text-white leading-snug">
                  {activeOrder.deliveryAddress}
                </p>
                {activeOrder.deliveryInstructions && (
                  <p className="text-xs text-amber-300/90 italic bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    "{activeOrder.deliveryInstructions}"
                  </p>
                )}
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Customer Details
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{activeOrder.customerName}</div>
                    <div className="text-xs text-gray-400 font-mono">{activeOrder.customerPhone}</div>
                  </div>
                  <a
                    href={`tel:${activeOrder.customerPhone}`}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Customer
                  </a>
                </div>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80">
              <div className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center justify-between">
                <span>Package Contents ({activeOrder.items?.length || 0} items)</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">₹{activeOrder.grandTotal} (Paid: {activeOrder.paymentMode})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {activeOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 text-xs">
                    <span className="font-medium text-gray-200 truncate mr-2">{item.name}</span>
                    <span className="font-mono text-amber-300 flex-shrink-0 font-bold">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rider Step-by-Step Action Controls */}
            <div className="pt-2 border-t border-slate-700/80 space-y-4">
              <div className="text-xs font-bold text-gray-400 uppercase">Fulfillment Action:</div>

              {['PLACED', 'CONFIRMED', 'PACKING'].includes(activeOrder.status) && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-400" />
                    <span>Store packing in progress. Click below once you collect the packed bag from the dispatch counter.</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY')}
                    className="w-full h-12 text-sm font-extrabold bg-blue-500 hover:bg-blue-600 text-white shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Bike className="w-4 h-4" /> Picked Up Bag • Head to Customer
                  </Button>
                </div>
              )}

              {activeOrder.status === 'OUT_FOR_DELIVERY' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                    <div className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4" />
                      Verify 4-Digit Customer OTP to Complete
                    </div>
                    <p className="text-xs text-gray-300">
                      Ask the customer for their 4-digit confirmation code shown on their order screen.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter OTP (e.g. 1234)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <Button
                        type="button"
                        onClick={() => handleUpdateStatus('DELIVERED')}
                        disabled={otpInput.length < 4}
                        className="h-auto px-6 font-extrabold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg cursor-pointer flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete Delivery
                      </Button>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      (Demo hint: Customer OTP for this order is: <span className="text-amber-400 font-bold">{activeOrder.otp || '1234'}</span>)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Standby State */
          <div className="bg-slate-800/60 rounded-3xl p-10 border border-slate-700/80 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Bike className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">You're On Standby</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                {isOnline 
                  ? 'Waiting for new orders. When a customer places a delivery order, the system will automatically allocate it to you.'
                  : 'You are currently offline. Turn your status Online above to receive automatic order assignments.'}
              </p>
            </div>
            {isOnline && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Auto-Allocation Engine Ready
              </div>
            )}
          </div>
        )}

        {/* Completed Delivery History */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Recent Completed Deliveries ({myCompletedOrders.length})
            </h4>
          </div>

          {myCompletedOrders.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400">
              No deliveries completed yet today. Your delivered orders will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {myCompletedOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-white">Order #{order.id}</div>
                      <div className="text-gray-400 truncate max-w-xs">{order.deliveryAddress}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-emerald-400">+₹50.00 Payout</div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {order.completedAt ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Delivered'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
