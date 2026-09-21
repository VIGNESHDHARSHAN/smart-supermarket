import React, { useState } from 'react';
import { useSupermarket } from '../../context/SupermarketContext';
import { Button } from '../../components/ui/Button';
import { 
  Truck, 
  Package, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  ArrowRight,
  Sparkles,
  FastForward,
  AlertCircle,
  Check,
  X,
  Navigation,
  ShieldCheck,
  Layers,
  Bike
} from 'lucide-react';
import { soundEffects } from '../../lib/audio';

const DEMO_RIDERS = [
  { id: 'r1', name: 'Rajesh Kumar', phone: '+91 98765 43210', rating: 4.9, bikeNo: 'KA 05 MN 4821', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' },
  { id: 'r2', name: 'Vikram Singh', phone: '+91 98450 11223', rating: 4.85, bikeNo: 'KA 01 EK 9024', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face' },
  { id: 'r3', name: 'Sunita Rao', phone: '+91 97410 55667', rating: 4.95, bikeNo: 'KA 03 GH 1129', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face' }
];

export default function StaffOrders() {
  const { 
    orders, 
    advanceOrderStatus, 
    completeOrderImmediately, 
    cancelOrder 
  } = useSupermarket();

  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'DELIVERY' | 'TAKEAWAY' | 'SELF_CHECKOUT'
  const [packingOrder, setPackingOrder] = useState(null);
  const [packedChecklist, setPackedChecklist] = useState({});
  const [assigningRiderOrder, setAssigningRiderOrder] = useState(null);
  const [selectedRider, setSelectedRider] = useState(DEMO_RIDERS[0]);

  const filteredOrders = orders.filter(o => {
    if (filterType === 'ALL') return true;
    return o.type === filterType;
  });

  const placedOrders = filteredOrders.filter(o => o.status === 'PLACED');
  const inProgressOrders = filteredOrders.filter(o => ['CONFIRMED', 'PACKING'].includes(o.status));
  const dispatchedOrders = filteredOrders.filter(o => ['OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'READY_TO_EXIT'].includes(o.status));
  const completedOrders = filteredOrders.filter(o => ['DELIVERED', 'COLLECTED', 'COMPLETED'].includes(o.status));

  // Open Packing Assistant
  const handleOpenPacking = (order) => {
    setPackingOrder(order);
    const initialCheck = {};
    order.items?.forEach(item => {
      initialCheck[item.id] = false;
    });
    setPackedChecklist(initialCheck);
    soundEffects.playNotificationPing();
  };

  const toggleItemPacked = (itemId) => {
    setPackedChecklist(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      soundEffects.playBagPacked();
      return next;
    });
  };

  const handleFinishPacking = () => {
    if (!packingOrder) return;
    advanceOrderStatus(packingOrder.id);
    setPackingOrder(null);
    soundEffects.playSuccessChime();
  };

  // Open Rider Assignment
  const handleOpenAssignRider = (order) => {
    setAssigningRiderOrder(order);
  };

  const handleConfirmAssignRider = () => {
    if (!assigningRiderOrder) return;
    advanceOrderStatus(assigningRiderOrder.id);
    setAssigningRiderOrder(null);
    soundEffects.playSuccessChime();
  };

  // Fast forward all in-progress orders
  const handleFastForwardAll = () => {
    inProgressOrders.forEach(o => advanceOrderStatus(o.id));
    placedOrders.forEach(o => advanceOrderStatus(o.id));
    soundEffects.playSuccessChime();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-primary-600" />
            Online & Delivery Orders Dispatch Hub
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time interactive order board: packing checklists, rider assignment, and delivery tracking.
          </p>
        </div>

        {/* Action Buttons & Fast Forward */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleFastForwardAll}
            className="text-xs font-bold bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
            title="Fast-forward all active orders to the next stage"
          >
            <FastForward className="w-3.5 h-3.5 mr-1 text-amber-600" /> Fast-Forward All
          </Button>

          {/* Filter Channel Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterType === 'ALL' ? 'bg-charcoal-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilterType('DELIVERY')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterType === 'DELIVERY' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              🛵 Delivery
            </button>
            <button
              onClick={() => setFilterType('TAKEAWAY')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterType === 'TAKEAWAY' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              🛍️ Takeaway
            </button>
            <button
              onClick={() => setFilterType('SELF_CHECKOUT')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterType === 'SELF_CHECKOUT' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              ⚡ Scan & Go
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column Kanban Dispatch Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        
        {/* Column 1: New / Placed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" /> New Incoming ({placedOrders.length})
            </span>
          </div>

          <div className="space-y-3">
            {placedOrders.map(order => (
              <StaffOrderCard 
                key={order.id} 
                order={order} 
                onAdvance={() => advanceOrderStatus(order.id)}
                onOpenPacking={() => handleOpenPacking(order)}
                onOpenAssignRider={() => handleOpenAssignRider(order)}
                onComplete={() => completeOrderImmediately(order.id)}
                onCancel={() => cancelOrder(order.id)}
              />
            ))}
            {placedOrders.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-2xl">
                No new pending orders
              </div>
            )}
          </div>
        </div>

        {/* Column 2: In-Progress / Packing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
            <span className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" /> Packing & Preparing ({inProgressOrders.length})
            </span>
          </div>

          <div className="space-y-3">
            {inProgressOrders.map(order => (
              <StaffOrderCard 
                key={order.id} 
                order={order} 
                onAdvance={() => advanceOrderStatus(order.id)}
                onOpenPacking={() => handleOpenPacking(order)}
                onOpenAssignRider={() => handleOpenAssignRider(order)}
                onComplete={() => completeOrderImmediately(order.id)}
                onCancel={() => cancelOrder(order.id)}
              />
            ))}
            {inProgressOrders.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-2xl">
                No orders packing currently
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Out for Delivery / Ready */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-purple-50 rounded-2xl border border-purple-200">
            <span className="font-extrabold text-xs text-purple-900 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-purple-600" /> Dispatched / On The Way ({dispatchedOrders.length})
            </span>
          </div>

          <div className="space-y-3">
            {dispatchedOrders.map(order => (
              <StaffOrderCard 
                key={order.id} 
                order={order} 
                onAdvance={() => advanceOrderStatus(order.id)}
                onOpenPacking={() => handleOpenPacking(order)}
                onOpenAssignRider={() => handleOpenAssignRider(order)}
                onComplete={() => completeOrderImmediately(order.id)}
                onCancel={() => cancelOrder(order.id)}
              />
            ))}
            {dispatchedOrders.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-2xl">
                No orders currently dispatched
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Delivered / Completed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-green-50 rounded-2xl border border-green-200">
            <span className="font-extrabold text-xs text-green-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Fulfilled & Delivered ({completedOrders.length})
            </span>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {completedOrders.slice(0, 10).map(order => (
              <StaffOrderCard 
                key={order.id} 
                order={order} 
                isCompleted={true}
              />
            ))}
            {completedOrders.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-2xl">
                No completed orders yet
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Interactive Step-by-Step Packing Assistant Modal */}
      {packingOrder && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" /> Packing Order #{packingOrder.id}
                </h3>
                <p className="text-xs text-gray-400">Customer: {packingOrder.customerName} • {packingOrder.deliverySpeed || 'Express'}</p>
              </div>
              <button onClick={() => setPackingOrder(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Items Packed:</span>
                <span>
                  {Object.values(packedChecklist).filter(Boolean).length} / {packingOrder.items?.length || 0}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.round((Object.values(packedChecklist).filter(Boolean).length / (packingOrder.items?.length || 1)) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Items Checklist */}
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
              {packingOrder.items?.map((item) => {
                const isPacked = packedChecklist[item.id];

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemPacked(item.id)}
                    className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                      isPacked ? 'bg-blue-50/70 text-blue-950' : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                        isPacked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isPacked && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <img src={item.image} alt={item.name} className="w-9 h-9 object-contain bg-white rounded-lg p-0.5 border border-gray-200" />
                      <div>
                        <div className={`text-xs font-bold ${isPacked ? 'line-through text-blue-900/80' : 'text-gray-900'}`}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          Qty: {item.quantity} • Aisle {item.aisle} • Shelf {item.shelf}
                        </div>
                      </div>
                    </div>

                    <span className="font-extrabold text-xs font-mono">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <Button
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
              onClick={handleFinishPacking}
            >
              Seal Bag & Complete Packing →
            </Button>
          </div>
        </div>
      )}

      {/* Interactive Rider Assignment Modal */}
      {assigningRiderOrder && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Bike className="w-5 h-5 text-purple-600" /> Assign Delivery Rider
                </h3>
                <p className="text-xs text-gray-400">Order #{assigningRiderOrder.id} • {assigningRiderOrder.deliveryAddress}</p>
              </div>
              <button onClick={() => setAssigningRiderOrder(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {DEMO_RIDERS.map(rider => (
                <div
                  key={rider.id}
                  onClick={() => setSelectedRider(rider)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedRider.id === rider.id ? 'border-purple-600 bg-purple-50/70 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={rider.avatar} alt={rider.name} className="w-10 h-10 rounded-full object-cover border border-purple-200" />
                    <div>
                      <div className="font-extrabold text-xs text-gray-900">{rider.name}</div>
                      <div className="text-[10px] text-gray-400">{rider.bikeNo} • ★ {rider.rating}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Ready to Pickup
                  </span>
                </div>
              ))}
            </div>

            <Button
              className="w-full h-12 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md"
              onClick={handleConfirmAssignRider}
            >
              Assign {selectedRider.name} & Dispatch Order →
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}

function StaffOrderCard({ 
  order, 
  onAdvance, 
  onOpenPacking, 
  onOpenAssignRider, 
  onComplete, 
  onCancel, 
  isCompleted = false 
}) {
  const isDelivery = order.type === 'DELIVERY';
  const isTakeaway = order.type === 'TAKEAWAY';

  return (
    <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3 hover:shadow-md transition-all">
      
      {/* Top badges */}
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-xs text-gray-900 font-mono">{order.id}</span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
          isDelivery ? 'bg-primary-100 text-primary-800' : isTakeaway ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {isDelivery ? '🛵 Delivery' : isTakeaway ? '🛍️ Takeaway' : '⚡ Scan & Go'}
        </span>
      </div>

      {/* Customer details */}
      <div className="text-xs space-y-1">
        <div className="font-bold text-gray-900 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-gray-400" /> {order.customerName}
        </div>
        <div className="text-gray-500 text-[11px] truncate flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-gray-400" /> {order.customerPhone}
        </div>
        {isDelivery && (
          <div className="text-gray-500 text-[11px] truncate flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-gray-400" /> {order.deliveryAddress}
          </div>
        )}
      </div>

      {/* Items preview */}
      <div className="bg-gray-50 p-2.5 rounded-2xl text-[11px] text-gray-700 space-y-1">
        <div className="font-semibold text-gray-500 flex items-center justify-between">
          <span>{order.items?.length || 0} Items</span>
          <span className="font-bold text-gray-900 font-mono">₹{order.grandTotal?.toFixed(2)}</span>
        </div>
        {order.items?.slice(0, 2).map((item, idx) => (
          <div key={idx} className="flex justify-between truncate text-[10px]">
            <span className="truncate text-gray-600">{item.quantity}x {item.name}</span>
            <span className="font-mono text-gray-400 ml-1">₹{item.price * item.quantity}</span>
          </div>
        ))}
        {order.items?.length > 2 && (
          <div className="text-[10px] text-primary-600 font-bold">+{order.items.length - 2} more items</div>
        )}
      </div>

      {/* Rider or Takeaway Details if dispatched */}
      {isDelivery && order.rider && (
        <div className="p-2 bg-purple-50 rounded-xl text-[10px] text-purple-900 flex items-center justify-between">
          <span className="font-bold flex items-center gap-1">
            <Bike className="w-3 h-3 text-purple-600" /> Rider: {order.rider.name}
          </span>
          <span className="font-mono">{order.rider.progressPercent || 30}% En Route</span>
        </div>
      )}

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="pt-1 space-y-1.5">
          {order.status === 'PLACED' && (
            <Button size="sm" className="w-full text-xs font-bold bg-primary-600 hover:bg-primary-700" onClick={onAdvance}>
              Accept Order →
            </Button>
          )}

          {order.status === 'CONFIRMED' && (
            <Button size="sm" className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-700" onClick={onOpenPacking}>
              <Package className="w-3.5 h-3.5 mr-1" /> Open Packing Assistant →
            </Button>
          )}

          {order.status === 'PACKING' && (
            isDelivery ? (
              <Button size="sm" className="w-full text-xs font-bold bg-purple-600 hover:bg-purple-700" onClick={onOpenAssignRider}>
                <Bike className="w-3.5 h-3.5 mr-1" /> Assign Rider & Dispatch →
              </Button>
            ) : isTakeaway ? (
              <Button size="sm" className="w-full text-xs font-bold bg-orange-600 hover:bg-orange-700" onClick={onAdvance}>
                Mark Ready for Pickup →
              </Button>
            ) : (
              <Button size="sm" className="w-full text-xs font-bold bg-purple-600 hover:bg-purple-700" onClick={onAdvance}>
                Authorize Exit Pass →
              </Button>
            )
          )}

          {['OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'READY_TO_EXIT'].includes(order.status) && (
            <Button size="sm" className="w-full text-xs font-bold bg-green-600 hover:bg-green-700" onClick={onComplete}>
              Mark Completed & Fulfilled ✓
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
