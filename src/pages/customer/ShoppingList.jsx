import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AvailabilityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Trash2, 
  ShoppingBag, 
  MapPin, 
  Plus, 
  Minus, 
  Truck, 
  Package, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  Tag, 
  CreditCard, 
  Banknote, 
  ArrowRight,
  ShieldCheck, 
  Clock,
  Navigation,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import StoreAisleMapModal from '../../components/customer/StoreAisleMapModal';
import { isMobileDevice, getUpiDeepLink, DEFAULT_UPI_CONFIG } from '../../lib/payment';

export default function ShoppingList() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { 
    shoppingList, 
    updateCartQuantity, 
    removeFromShoppingList, 
    products, 
    currentUser, 
    placeCustomerOrder,
    storeSettings
  } = useSupermarket();

  // Fulfillment State
  const [fulfillmentType, setFulfillmentType] = useState('DELIVERY'); // 'DELIVERY' | 'TAKEAWAY' | 'SELF_CHECKOUT'
  const [deliverySpeed, setDeliverySpeed] = useState('EXPRESS'); // 'EXPRESS' | 'STANDARD'
  const [selectedAddress, setSelectedAddress] = useState(
    currentUser?.address || 'Flat 402, Green Meadows Apt, Koramangala 4th Block, Bengaluru'
  );
  const [customAddress, setCustomAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Takeaway State
  const [pickupCounter, setPickupCounter] = useState('Counter 02 - Express Pickup Lockers');
  const [pickupSlot, setPickupSlot] = useState('Immediate (Ready in 15 mins)');

  // Promo Code State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Map Modal
  const [mapModalProduct, setMapModalProduct] = useState(null);

  const isMobile = isMobileDevice();

  // Map latest stock data to shopping list items
  const currentList = shoppingList.map(item => {
    const liveProduct = products.find(p => p.id === item.id);
    return {
      ...(liveProduct || item),
      quantity: item.quantity || 1
    };
  });

  // Price calculations with dynamic store settings
  const subtotal = currentList.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  
  const freeThreshold = storeSettings?.freeDeliveryThreshold || 299;
  const expressFee = storeSettings?.expressDeliveryFee || 25;
  const standardFee = storeSettings?.standardDeliveryFee || 15;
  const taxRate = (storeSettings?.taxRate ?? 5) / 100;

  let deliveryFee = 0;
  if (fulfillmentType === 'DELIVERY') {
    if (deliverySpeed === 'EXPRESS') {
      deliveryFee = subtotal >= (freeThreshold + 200) ? 0 : expressFee;
    } else {
      deliveryFee = subtotal >= freeThreshold ? 0 : standardFee;
    }
  }

  let discount = 0;
  if (appliedCoupon === 'SMART50') discount += 50;
  if (appliedCoupon === 'WELCOME20') discount += subtotal * 0.2;
  if (appliedCoupon === 'FREEDEL') deliveryFee = 0;

  if (useLoyaltyPoints && currentUser?.loyaltyPoints) {
    const pointsDiscount = Math.min(subtotal * 0.3, Math.floor(currentUser.loyaltyPoints / 10));
    discount += pointsDiscount;
  }

  const tax = subtotal * taxRate;
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee + tax);


  const upiDeepLink = getUpiDeepLink({
    amount: grandTotal,
    note: `SmartMart ${fulfillmentType} Order`,
    vpa: DEFAULT_UPI_CONFIG.vpa
  });

  const handleApplyCoupon = (code) => {
    const clean = code.trim().toUpperCase();
    if (['SMART50', 'WELCOME20', 'FREEDEL'].includes(clean)) {
      setAppliedCoupon(clean);
      setCouponInput('');
    } else {
      alert("Invalid coupon code. Try SMART50, WELCOME20, or FREEDEL");
    }
  };

  const handleCheckout = () => {
    if (currentList.length === 0) return;
    setIsPlacingOrder(true);

    const targetAddress = customAddress.trim() || selectedAddress;

    // If on phone and payment is UPI / GPay, initiate UPI app intent
    if (paymentMode === 'UPI' && isMobile) {
      window.location.href = upiDeepLink;
    }

    setTimeout(() => {
      const orderId = placeCustomerOrder({
        type: fulfillmentType,
        items: currentList,
        deliveryDetails: {
          address: targetAddress,
          speed: deliverySpeed,
          instructions: deliveryNotes
        },
        takeawayDetails: {
          counter: pickupCounter,
          slot: pickupSlot
        },
        selfCheckoutDetails: {
          gateNumber: 'SmartGate 01'
        },
        paymentMode: paymentMode === 'UPI' ? 'UPI (GPay / PhonePe)' : paymentMode,
        subtotal,
        discount,
        deliveryFee,
        tax,
        grandTotal
      });

      setIsPlacingOrder(false);
      navigate('/customer/orders');
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            {t('my_cart', 'My Shopping List & Cart')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('express_delivery', 'Choose Express Delivery to your doorstep, Store Take Away, or In-Store Self Checkout.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 font-semibold">
            <span className="font-extrabold text-primary-600 dark:text-primary-400">{currentList.length}</span> {t('units_left', 'Items in Cart')}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/customer/products')}>
            + {t('add_to_cart', 'Add More Products')}
          </Button>
        </div>
      </div>

      {currentList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {currentList.map((product) => (
              <div 
                key={product.id} 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all group"
              >
                {/* Image */}
                <Link 
                  to={`/customer/products/${product.id}`} 
                  className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-xl flex-shrink-0 border border-gray-100 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1 group-hover:border-primary-200 transition-colors"
                >
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover rounded-lg" 
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link 
                        to={`/customer/products/${product.id}`} 
                        className="font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-base"
                      >
                        {product.name}
                      </Link>
                      <button 
                        onClick={() => removeFromShoppingList(product.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand} • {product.unit}</p>
                      <AvailabilityBadge stock={product.stock} reorderLevel={product.reorderLevel} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-lg text-gray-900 dark:text-white">
                        ₹{(product.price * product.quantity).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400">
                        (₹{product.price} each)
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 p-1">
                        <button
                          onClick={() => updateCartQuantity(product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-xs hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-gray-900 dark:text-white">
                          {product.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-xs hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Aisle Locator Button */}
                      <button
                        onClick={() => setMapModalProduct(product)}
                        className="text-[11px] font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/70 hover:bg-primary-100 dark:hover:bg-primary-900 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-transparent dark:border-primary-800"
                      >
                        <MapPin className="w-3 h-3" />
                        {t('aisle', 'Aisle')} {product.aisle}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* In-Store Map Banner */}
            <div className="bg-gradient-to-r from-charcoal-900 to-charcoal-800 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary-500 p-2.5 rounded-xl text-white">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Visiting our store in person?</h3>
                  <p className="text-xs text-gray-300">Use our live 2D Aisle Map to locate all items in your cart quickly.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-white border-white/20 bg-white/10 hover:bg-white/20 text-xs" onClick={() => setMapModalProduct(currentList[0])}>
                Open Store Map
              </Button>
            </div>
          </div>

          {/* Right Column: Checkout & Fulfillment Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            
            {/* Fulfillment Mode Selector */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-800 p-5 space-y-4">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Select Fulfillment Mode</h2>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('DELIVERY')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    fulfillmentType === 'DELIVERY'
                      ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-950/70 text-primary-900 dark:text-primary-300 ring-2 ring-primary-500/20 font-bold shadow-xs'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Truck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs">{t('express_delivery', 'Home Delivery')}</span>
                  <span className="text-[10px] text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/60 px-1.5 rounded-full font-bold">15 Mins</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('TAKEAWAY')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    fulfillmentType === 'TAKEAWAY'
                      ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-950/70 text-primary-900 dark:text-primary-300 ring-2 ring-primary-500/20 font-bold shadow-xs'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs">{t('store_takeaway', 'Store Take Away')}</span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-1.5 rounded-full font-semibold">Locker PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('SELF_CHECKOUT')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    fulfillmentType === 'SELF_CHECKOUT'
                      ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-950/70 text-primary-900 dark:text-primary-300 ring-2 ring-primary-500/20 font-bold shadow-xs'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs">{t('self_checkout_instore', 'In-Store Pass')}</span>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-1.5 rounded-full font-bold">Queue-Less</span>
                </button>
              </div>

              {/* Mode-Specific Details */}
              {fulfillmentType === 'DELIVERY' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" /> {t('delivery_address', 'Delivery Address')}
                    </span>
                    <Link to="/customer/login" className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                      {currentUser ? currentUser.name : 'Change Profile'}
                    </Link>
                  </div>

                  <select
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-medium"
                  >
                    {currentUser?.savedAddresses?.map((addr) => (
                      <option key={addr.id} value={addr.address}>
                        {addr.label}: {addr.address}
                      </option>
                    )) || (
                      <option value={selectedAddress}>{selectedAddress}</option>
                    )}
                  </select>

                  <Input
                    placeholder="Or enter new delivery address / landmark..."
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-900 dark:border-slate-700"
                  />

                  {/* Delivery Speed Toggle */}
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('EXPRESS')}
                      className={`p-2.5 rounded-lg border flex flex-col text-left transition-all ${
                        deliverySpeed === 'EXPRESS' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/70 text-primary-900 dark:text-primary-300 font-bold' 
                          : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>⚡ Express Delivery</span>
                        <span className="text-[10px] text-green-600 font-extrabold">{subtotal >= 499 ? 'FREE' : '₹25'}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">Within 15 mins (Rider Assigned)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('STANDARD')}
                      className={`p-2.5 rounded-lg border flex flex-col text-left transition-all ${
                        deliverySpeed === 'STANDARD' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/70 text-primary-900 dark:text-primary-300 font-bold' 
                          : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Standard Slot</span>
                        <span className="text-[10px] text-green-600 font-extrabold">{subtotal >= 299 ? 'FREE' : '₹15'}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">Today within 2 hours</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Takeaway Details */}
              {fulfillmentType === 'TAKEAWAY' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-primary-600" /> Pickup Counter & Locker
                    </span>
                    <span className="text-green-600 font-bold text-[10px] bg-green-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Zero Delivery Fee
                    </span>
                  </div>

                  <select
                    value={pickupCounter}
                    onChange={(e) => setPickupCounter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-medium"
                  >
                    <option>Counter 01 - Main Lobby Express Locker</option>
                    <option>Counter 02 - Express Pickup Lockers (Aisle 1)</option>
                    <option>Counter 03 - Drive-Through Pickup Point</option>
                  </select>
                </div>
              )}

              {/* Self Checkout Pass Info */}
              {fulfillmentType === 'SELF_CHECKOUT' && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 space-y-2 text-xs">
                  <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" /> Digital Turnstile Gate Pass
                  </div>
                  <p className="text-purple-700 dark:text-purple-400 text-[11px] leading-relaxed">
                    Upon instant payment, a dynamic cryptographic QR pass will be generated for Smart Turnstile Gate clearance.
                  </p>
                </div>
              )}

              {/* Coupons & Loyalty Section */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Promo Code (SMART50, WELCOME20)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="pl-8 text-xs uppercase bg-white dark:bg-slate-900 dark:border-slate-700"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleApplyCoupon(couponInput)}
                    disabled={!couponInput.trim()}
                  >
                    Apply
                  </Button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-emerald-950/60 text-green-800 dark:text-emerald-300 p-2.5 rounded-xl border border-green-200 dark:border-emerald-800/60 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Coupon <strong className="font-mono">{appliedCoupon}</strong> Applied!
                    </span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                )}

                {/* Loyalty Points Redemption */}
                {currentUser?.loyaltyPoints > 0 && (
                  <label className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 cursor-pointer text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useLoyaltyPoints}
                        onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-bold text-amber-900 dark:text-amber-300">Redeem SmartPoints ({currentUser.loyaltyPoints} pts)</span>
                    </div>
                    <span className="text-amber-800 dark:text-amber-400 font-extrabold font-mono">
                      Save ₹{Math.min(subtotal * 0.3, Math.floor(currentUser.loyaltyPoints / 10))}
                    </span>
                  </label>
                )}
              </div>

              {/* Bill Summary */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>{t('subtotal', 'Subtotal')} ({currentList.length} items)</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                {fulfillmentType === 'DELIVERY' && (
                  <div className="flex justify-between">
                    <span>{t('delivery_fee', 'Delivery Fee')} ({deliverySpeed})</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {deliveryFee === 0 ? <span className="text-green-600 font-bold">{t('free_delivery', 'FREE')}</span> : `₹${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-700 dark:text-green-400 font-bold">
                    <span>{t('discount', 'Discount Applied')}</span>
                    <span>- ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('taxes', 'Taxes & Fees (5%)')}</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700 pt-3 flex justify-between items-center text-base font-extrabold text-gray-900 dark:text-white">
                  <span>{t('grand_total', 'To Pay')}</span>
                  <span className="text-xl text-primary-700 dark:text-primary-400 font-mono">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">{t('payment_method', 'Payment Method')}</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center font-bold transition-all ${
                      paymentMode === 'UPI' 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/70 text-primary-800 dark:text-primary-300 ring-2 ring-primary-500/20' 
                        : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>Instant UPI</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">GPay / PhonePe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Card')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center font-bold transition-all ${
                      paymentMode === 'Card' 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/70 text-primary-800 dark:text-primary-300 ring-2 ring-primary-500/20' 
                        : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>Card</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">Visa/Mastercard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Cash')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center font-bold transition-all ${
                      paymentMode === 'Cash' 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/70 text-primary-800 dark:text-primary-300 ring-2 ring-primary-500/20' 
                        : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>Cash / Pay Later</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">Pay on Delivery</span>
                  </button>
                </div>

                {/* Mobile vs PC UPI Behavior Box */}
                {paymentMode === 'UPI' && (
                  <div className="mt-3 p-3 bg-primary-50/70 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 rounded-xl text-xs space-y-2">
                    {isMobile ? (
                      <div className="flex items-center gap-2 text-primary-900 dark:text-primary-300">
                        <Smartphone className="w-5 h-5 text-primary-600 flex-shrink-0 animate-bounce" />
                        <div>
                          <div className="font-bold">Mobile Device Detected</div>
                          <div className="text-[11px] text-primary-700 dark:text-primary-400">
                            Clicking checkout will directly open your installed UPI app (GPay, PhonePe, Paytm).
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center">
                        <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1">
                          <QrCode className="w-4 h-4 text-primary-600" /> Scan QR with GPay / Paytm from your Phone:
                        </div>
                        <div className="inline-block p-2 bg-white rounded-xl border border-gray-200 shadow-2xs">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiDeepLink)}`}
                            alt="UPI QR Code"
                            className="w-28 h-28 mx-auto"
                          />
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                          UPI ID: <span className="font-bold text-gray-800 dark:text-gray-200">{DEFAULT_UPI_CONFIG.vpa}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                className="w-full h-14 text-base font-extrabold flex items-center justify-between px-6 shadow-lg shadow-primary-600/20"
                onClick={handleCheckout}
                disabled={isPlacingOrder}
              >
                <span>
                  {isPlacingOrder ? 'Processing...' : (
                    paymentMode === 'UPI' && isMobile 
                      ? '🚀 Open GPay & Pay Order'
                      : (fulfillmentType === 'DELIVERY' ? 'Place Delivery Order' :
                         fulfillmentType === 'TAKEAWAY' ? 'Book Store Take Away' : 'Generate Exit Pass')
                  )}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  ₹{grandTotal.toFixed(2)} <ArrowRight className="w-5 h-5" />
                </span>
              </Button>

            </div>

          </div>

        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-gray-200 dark:border-slate-800 border-dashed p-8">
          <div className="bg-primary-50 dark:bg-primary-950/70 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('empty_cart', 'Your Shopping List is Empty')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm leading-relaxed">
            Browse our fresh supermarket catalog, add items to your cart, and enjoy 15-minute delivery or quick take away!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => navigate('/customer/products')}>
              {t('start_shopping', 'Browse Products')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/customer/scan')}>
              <QrCode className="w-4 h-4 mr-1.5" /> Try In-Store Scan & Go
            </Button>
          </div>
        </div>
      )}

      {/* Aisle Map Modal */}
      <StoreAisleMapModal
        isOpen={!!mapModalProduct}
        onClose={() => setMapModalProduct(null)}
        selectedProduct={mapModalProduct}
      />

    </div>
  );
}
