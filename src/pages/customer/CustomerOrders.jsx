import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button';
import { 
  Truck, 
  Package, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Navigation, 
  ShieldCheck, 
  Sparkles, 
  FastForward, 
  RotateCcw, 
  ChevronRight,
  Store,
  AlertCircle
} from 'lucide-react';

export default function CustomerOrders() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { orders, advanceOrderStatus, completeOrderImmediately, currentUser } = useSupermarket();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [callingRider, setCallingRider] = useState(false);

  // Filter orders
  const activeOrders = orders.filter(o => !['DELIVERED', 'COLLECTED', 'COMPLETED', 'CANCELLED'].includes(o.status));
  const completedOrders = orders.filter(o => ['DELIVERED', 'COLLECTED', 'COMPLETED', 'CANCELLED'].includes(o.status));

  const displayOrders = activeTab === 'active' ? activeOrders : completedOrders;

  // Default selected order to first active order or first order
  const currentFocusedOrder = selectedOrderId 
    ? orders.find(o => o.id === selectedOrderId) 
    : (activeOrders[0] || completedOrders[0] || null);

  const handleCallRider = () => {
    setCallingRider(true);
    setTimeout(() => {
      alert("📞 Connecting call to Delivery Partner (Simulated)... Rider Rajesh Kumar: 'Hello! I am near your gate with your SmartMart order.'");
      setCallingRider(false);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            {t('live_orders', 'Live Orders & Delivery Tracker')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time GPS tracking for home deliveries, digital pickup QR codes & order history.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Live Active ({activeOrders.length})</span>
            {activeOrders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'completed'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            Past Completed ({completedOrders.length})
          </button>
        </div>
      </div>

      {displayOrders.length > 0 && currentFocusedOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Orders List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
              Select Order to Track
            </div>

            {displayOrders.map((order) => {
              const isSelected = order.id === currentFocusedOrder.id;
              const isDelivery = order.type === 'DELIVERY';
              const isTakeaway = order.type === 'TAKEAWAY';

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-white dark:bg-slate-900 shadow-md ring-2 ring-primary-500/20'
                      : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">{order.id}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      ['DELIVERED', 'COLLECTED', 'COMPLETED'].includes(order.status)
                        ? 'bg-green-100 dark:bg-emerald-950 text-green-800 dark:text-emerald-300'
                        : order.status === 'OUT_FOR_DELIVERY'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 animate-pulse'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {isDelivery && <Truck className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
                    {isTakeaway && <Package className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />}
                    {!isDelivery && !isTakeaway && <QrCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                    <span className="font-medium capitalize">
                      {isDelivery ? 'Home Delivery' : isTakeaway ? 'Store Take Away' : 'In-Store Scan & Go'}
                    </span>
                    <span>•</span>
                    <span>{order.items?.length || 0} Items</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-slate-800 font-bold">
                    <span className="text-gray-900 dark:text-white">₹{order.grandTotal?.toFixed(2)}</span>
                    <span className="text-primary-600 dark:text-primary-400 flex items-center">
                      Track Live <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Real-Time Tracking & Simulation (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Order Overview Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-gray-200 dark:border-slate-800 p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/70 px-2.5 py-1 rounded-lg">
                      {currentFocusedOrder.type === 'DELIVERY' ? '🛵 Home Delivery' : currentFocusedOrder.type === 'TAKEAWAY' ? '🛍️ Store Take Away' : '⚡ In-Store Checkout'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Order #{currentFocusedOrder.id}</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                    {currentFocusedOrder.status === 'OUT_FOR_DELIVERY' && '🛵 Rider is on the way!'}
                    {currentFocusedOrder.status === 'READY_FOR_PICKUP' && '🛍️ Your order is ready at the pickup locker!'}
                    {currentFocusedOrder.status === 'READY_TO_EXIT' && '⚡ Digital Exit Pass Ready'}
                    {currentFocusedOrder.status === 'PACKING' && '📦 Store is packing your fresh items'}
                    {currentFocusedOrder.status === 'CONFIRMED' && '✓ Order confirmed by store'}
                    {currentFocusedOrder.status === 'PLACED' && '⏳ Order placed successfully'}
                    {currentFocusedOrder.status === 'DELIVERED' && '🎉 Order Delivered Successfully!'}
                    {currentFocusedOrder.status === 'COLLECTED' && '🎉 Order Collected Successfully!'}
                    {currentFocusedOrder.status === 'COMPLETED' && '🎉 Checkout Completed!'}
                  </h2>
                </div>

                {/* Fast Forward Simulation Controls */}
                {!['DELIVERED', 'COLLECTED', 'COMPLETED', 'CANCELLED'].includes(currentFocusedOrder.status) && (
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-gray-200 dark:border-slate-700">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-white dark:bg-slate-900 shadow-xs hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-700 border-gray-200 dark:border-slate-700"
                      onClick={() => advanceOrderStatus(currentFocusedOrder.id)}
                      title="Advance to next step"
                    >
                      <FastForward className="w-3.5 h-3.5 mr-1 text-primary-600 dark:text-primary-400" /> Next Stage
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => completeOrderImmediately(currentFocusedOrder.id)}
                      title="Instantly mark finished"
                    >
                      ⚡ Finish Order
                    </Button>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                  <span>Current Step: <strong className="text-primary-600 dark:text-primary-400">{currentFocusedOrder.status.replace(/_/g, ' ')}</strong></span>
                  <span className="font-mono text-gray-500 dark:text-gray-400">Payment: {currentFocusedOrder.paymentMode}</span>
                </div>
              </div>

              {/* Rider Section (For Delivery) */}
              {currentFocusedOrder.type === 'DELIVERY' && currentFocusedOrder.rider && (
                <div className="p-4 bg-primary-50/70 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentFocusedOrder.rider.avatar}
                      alt={currentFocusedOrder.rider.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary-500"
                    />
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        {currentFocusedOrder.rider.name}
                        <span className="text-[10px] bg-primary-200 dark:bg-primary-900 text-primary-900 dark:text-primary-300 px-1.5 py-0.2 rounded font-bold">★ {currentFocusedOrder.rider.rating}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{currentFocusedOrder.rider.bikeNo} • Express Partner</div>
                    </div>
                  </div>
                  <Button size="sm" onClick={handleCallRider} disabled={callingRider}>
                    <Phone className="w-3.5 h-3.5 mr-1" /> Call Rider
                  </Button>
                </div>
              )}

              {/* Locker PIN Section (For Takeaway) */}
              {currentFocusedOrder.type === 'TAKEAWAY' && (
                <div className="p-5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 rounded-2xl text-center space-y-2">
                  <div className="text-xs font-bold text-orange-900 dark:text-orange-300">
                    Pickup Locker: {currentFocusedOrder.pickupCounter || 'Counter 02 - Express Lockers'}
                  </div>
                  <div className="text-3xl font-black font-mono text-orange-700 dark:text-orange-400 tracking-widest">
                    PIN: {currentFocusedOrder.lockerPin || '8219'}
                  </div>
                  <p className="text-[11px] text-orange-600 dark:text-orange-400">
                    Enter this 4-digit PIN on the smart locker touchscreen to unlock your compartment.
                  </p>
                </div>
              )}

            </div>

            {/* Order Items Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-gray-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Order Items ({currentFocusedOrder.items?.length || 0})</h3>

              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {currentFocusedOrder.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-gray-100 dark:border-slate-700" />
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity} • Aisle {item.aisle || 1}</div>
                      </div>
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white font-mono">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total breakdown */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">₹{currentFocusedOrder.subtotal?.toFixed(2)}</span>
                </div>
                {currentFocusedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-700 dark:text-emerald-400 font-bold">
                    <span>Discount</span>
                    <span className="font-mono">- ₹{currentFocusedOrder.discount?.toFixed(2)}</span>
                  </div>
                )}
                {currentFocusedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">₹{currentFocusedOrder.deliveryFee?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxes (5%)</span>
                  <span className="font-mono">₹{currentFocusedOrder.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-base font-black text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-slate-800">
                  <span>Total Paid ({currentFocusedOrder.paymentMode})</span>
                  <span className="text-primary-700 dark:text-primary-400 text-lg font-mono">₹{currentFocusedOrder.grandTotal?.toFixed(2)}</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-gray-200 dark:border-slate-800 border-dashed p-8">
          <div className="bg-primary-50 dark:bg-primary-950/70 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
            <Truck className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No {activeTab === 'active' ? 'Active' : 'Past'} Orders Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm leading-relaxed">
            Order your favorite grocery items with instant 15-minute delivery or store take-away.
          </p>
          <Button onClick={() => navigate('/customer/products')}>
            Start Shopping Now
          </Button>
        </div>
      )}

    </div>
  );
}
