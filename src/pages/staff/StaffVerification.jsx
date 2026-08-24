import React, { useState, useEffect } from 'react';
import { useSupermarket } from '../../context/SupermarketContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  ShieldCheck, 
  ScanBarcode, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  Unlock, 
  Lock, 
  User, 
  Clock, 
  Check, 
  QrCode, 
  Receipt, 
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { soundEffects } from '../../lib/audio';

export default function StaffVerification() {
  const { 
    orders, 
    verifyScanAndGoPass, 
    triggerGateUnlock, 
    gateStatus,
    activityFeed 
  } = useSupermarket();

  const [passInput, setPassInput] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifiedItems, setVerifiedItems] = useState({});
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState(false);

  // All Scan & Go orders
  const scanGoOrders = orders.filter(o => o.type === 'SELF_CHECKOUT');
  const pendingScanGoOrders = scanGoOrders.filter(o => o.status !== 'COMPLETED');
  const recentClearedOrders = scanGoOrders.filter(o => o.status === 'COMPLETED');

  // Auto-select latest pending order if none selected
  useEffect(() => {
    if (!selectedOrder && scanGoOrders.length > 0) {
      handleSelectOrder(pendingScanGoOrders[0] || scanGoOrders[0]);
    }
  }, [orders]);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setPassInput(order.id);
    setAuditSuccess(order.status === 'COMPLETED');
    // Pre-populate verification state
    const initialCheck = {};
    order.items?.forEach(item => {
      initialCheck[item.id] = order.status === 'COMPLETED';
    });
    setVerifiedItems(initialCheck);
  };

  const handlePassSearchSubmit = (e) => {
    e.preventDefault();
    if (!passInput.trim()) return;

    const query = passInput.trim().toUpperCase();
    const found = scanGoOrders.find(o => 
      o.id.toUpperCase() === query || 
      (o.exitPassQR && o.exitPassQR.toUpperCase() === query) ||
      ('PASS-' + o.id).toUpperCase() === query
    );

    if (found) {
      handleSelectOrder(found);
      soundEffects.playScanBeep();
    } else {
      soundEffects.playErrorBuzzer();
      alert(`No active Scan & Go pass found for "${passInput}". Try selecting one from the active customer list.`);
    }
  };

  const toggleItemVerify = (itemId) => {
    setVerifiedItems(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      soundEffects.playBagPacked();
      return next;
    });
  };

  const handleVerifyAllItems = () => {
    if (!selectedOrder) return;
    const allChecked = {};
    selectedOrder.items?.forEach(i => {
      allChecked[i.id] = true;
    });
    setVerifiedItems(allChecked);
    soundEffects.playBagPacked();
  };

  const areAllItemsVerified = selectedOrder?.items?.every(i => verifiedItems[i.id]);

  const handleAuthorizeAndUnlock = () => {
    if (!selectedOrder) return;
    setIsAuditing(true);

    setTimeout(() => {
      verifyScanAndGoPass(selectedOrder.id, 'Gate Security Officer #04');
      setIsAuditing(false);
      setAuditSuccess(true);
    }, 600);
  };

  // Calculate estimated total weight
  const totalWeightKg = selectedOrder?.items?.reduce((sum, item) => {
    let weightPerUnit = 0.5;
    if (item.unit?.includes('5kg')) weightPerUnit = 5.0;
    else if (item.unit?.includes('1kg')) weightPerUnit = 1.0;
    else if (item.unit?.includes('1L') || item.unit?.includes('1.25L')) weightPerUnit = 1.2;
    else if (item.unit?.includes('500ml') || item.unit?.includes('500g')) weightPerUnit = 0.5;
    else if (item.unit?.includes('250g') || item.unit?.includes('200g') || item.unit?.includes('340ml')) weightPerUnit = 0.25;
    else if (item.unit?.includes('100g') || item.unit?.includes('70g')) weightPerUnit = 0.1;
    return sum + (weightPerUnit * item.quantity);
  }, 0) || 0;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Turnstile Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
            <h1 className="text-2xl font-black text-gray-900">
              Scan & Go Turnstile Security & Bag Audit Desk
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Verify customer digital exit passes, conduct anti-theft item audits & grant turnstile gate clearance.
          </p>
        </div>

        {/* Turnstile Live Status Pill */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${
          gateStatus.isOpen 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-md shadow-emerald-500/10' 
            : 'bg-charcoal-900 text-white border-charcoal-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${gateStatus.isOpen ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`}></span>
            <div className="text-xs">
              <span className="font-extrabold">{gateStatus.gateId}</span>: {gateStatus.isOpen ? 'UNLOCKED (BARRIER OPEN)' : 'ARMED / LOCKED'}
            </div>
          </div>
          {gateStatus.isOpen && (
            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">
              Clearance Active
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Left Scanner & Customer List, Right Bag Audit & Gate Clearance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Pass Scanner & Active Customers (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Scanner Box */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <ScanBarcode className="w-4 h-4 text-purple-600" /> Security Barcode Scanner
            </h2>

            <form onSubmit={handlePassSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Scan customer QR pass (e.g. ORD-88210)..."
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="pl-9 text-xs font-mono"
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm" className="bg-purple-700 hover:bg-purple-800 text-xs font-bold px-4">
                Scan Pass
              </Button>
            </form>
          </div>

          {/* Active Scan & Go Customers Selector */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
                In-Store Customer Exit Queue ({scanGoOrders.length})
              </h2>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                Tap to audit
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {scanGoOrders.map(order => {
                const isSelected = selectedOrder?.id === order.id;
                const isCompleted = order.status === 'COMPLETED';

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => handleSelectOrder(order)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                      isSelected 
                        ? 'border-purple-600 bg-purple-50/70 shadow-xs' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-gray-900">{order.id}</span>
                        <span className={`text-[10px] font-black px-2 py-0.2 rounded-full uppercase ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {isCompleted ? '✓ Cleared' : '⚡ Awaiting Exit'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" /> {order.customerName}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {order.items?.length || 0} items • ₹{order.grandTotal?.toFixed(2)} • {order.paymentMode}
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-purple-600 translate-x-1' : 'text-gray-300 group-hover:text-gray-500'}`} />
                  </button>
                );
              })}

              {scanGoOrders.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-2xl">
                  No active Scan & Go checkouts yet. Customers will appear here as they pay on their mobile!
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Bag Audit Checklist & Gate Unlock Action (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {selectedOrder ? (
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
              
              {/* Customer Pass Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-mono">
                      PASS-{selectedOrder.id}
                    </span>
                    <span className="text-xs text-gray-400">
                      Paid via {selectedOrder.paymentMode}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900 mt-1">
                    {selectedOrder.customerName}
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-gray-900 font-mono">
                    ₹{selectedOrder.grandTotal?.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Digital Receipt Verified
                  </div>
                </div>
              </div>

              {/* Anti-Theft Weight Sensor Gauge */}
              <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-purple-900">Anti-Theft Optical Weight Verification</div>
                    <div className="text-[11px] text-purple-700">Digital Cart Weight vs Security Scale Sensor</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-purple-900 font-mono">
                    {totalWeightKg.toFixed(2)} kg
                  </div>
                  <div className="text-[10px] text-emerald-700 font-black flex items-center justify-end gap-1">
                    <Check className="w-3 h-3" /> 100% Weight Match
                  </div>
                </div>
              </div>

              {/* Item-by-Item Bag Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                    Physical Bag Item Verification ({selectedOrder.items?.length || 0} Items)
                  </h3>
                  <button
                    type="button"
                    onClick={handleVerifyAllItems}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 underline decoration-dotted"
                  >
                    Mark All Items Verified ✓
                  </button>
                </div>

                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto pr-1 border border-gray-100 rounded-2xl p-2 bg-gray-50/50">
                  {selectedOrder.items?.map((item) => {
                    const isChecked = verifiedItems[item.id];

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => toggleItemVerify(item.id)}
                        className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isChecked ? 'bg-emerald-50/70 text-emerald-900' : 'hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <img src={item.image} alt={item.name} className="w-9 h-9 object-contain bg-white rounded-lg p-0.5 border border-gray-200" />
                          <div>
                            <div className={`text-xs font-bold ${isChecked ? 'line-through text-emerald-800/80' : 'text-gray-900'}`}>
                              {item.name}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              Qty: {item.quantity} • Aisle {item.aisle} • ₹{item.price} each
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
              </div>

              {/* Turnstile Clearance Gate Actions */}
              <div className="pt-2 space-y-3">
                
                {selectedOrder.status === 'COMPLETED' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1">
                    <div className="text-sm font-black text-emerald-900 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Security Audit Cleared & Authorized
                    </div>
                    <p className="text-xs text-emerald-700">
                      Customer was authorized to pass through SmartGate 01. Turnstile gate unlocked.
                    </p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-base shadow-lg shadow-emerald-700/20 rounded-2xl flex items-center justify-center gap-2"
                    onClick={handleAuthorizeAndUnlock}
                    disabled={isAuditing}
                  >
                    <Unlock className="w-5 h-5" />
                    {isAuditing ? 'Authorizing & Opening Barrier...' : 'Authorize Bag & Open Exit Turnstile Gate #1 →'}
                  </Button>
                )}

                <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                  <span>Authorized by: Security Desk Operator #04</span>
                  <button 
                    type="button" 
                    onClick={() => triggerGateUnlock(selectedOrder.id, 'SmartGate 01', selectedOrder.customerName)}
                    className="text-purple-600 hover:text-purple-800 font-bold underline"
                  >
                    Manual Gate Pulse
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-gray-700">No Customer Selected</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Scan an exit barcode pass or select a customer from the left queue to begin bag verification.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
