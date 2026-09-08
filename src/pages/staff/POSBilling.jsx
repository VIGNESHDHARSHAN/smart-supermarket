import React, { useState, useRef, useEffect } from 'react';
import { useSupermarket, DEMO_CUSTOMERS } from '../../context/SupermarketContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProductImage } from '../../components/ui/ProductImage';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  ScanBarcode, 
  CheckCircle2, 
  QrCode, 
  Pause, 
  Play, 
  User, 
  Percent, 
  Receipt, 
  Sparkles, 
  X, 
  Clock, 
  Printer,
  ChevronRight,
  Zap,
  Layers
} from 'lucide-react';
import { soundEffects } from '../../lib/audio';

export default function POSBilling() {
  const { 
    products, 
    processSale, 
    parkCart, 
    parkedCarts, 
    deleteParkedCart,
    validateCoupon 
  } = useSupermarket();

  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');
  
  // Payment & Cashier Tender State
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [cashTendered, setCashTendered] = useState('');
  
  // Customer & Loyalty State
  const [customerPhone, setCustomerPhone] = useState('');
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Invoice & Parked Modals
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [isParkModalOpen, setIsParkModalOpen] = useState(false);

  const barcodeRef = useRef(null);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, [completedInvoice]);

  // Handle Barcode Search & Fast Scan
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const product = products.find(p => 
      p.barcode.toLowerCase() === query || 
      p.productCode.toLowerCase() === query ||
      p.name.toLowerCase().includes(query)
    );

    if (product) {
      addProductToCart(product);
      setBarcodeInput('');
    } else {
      soundEffects.playErrorBuzzer();
      alert("Product not found in catalog!");
    }
  };

  const addProductToCart = (product) => {
    if (product.stock === 0) {
      soundEffects.playErrorBuzzer();
      alert("Product is Out of Stock!");
      return;
    }

    soundEffects.playScanBeep();

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          soundEffects.playErrorBuzzer();
          alert(`Max stock reached (${product.stock} available)!`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.stock) {
          soundEffects.playErrorBuzzer();
          alert(`Cannot exceed available stock of ${item.stock}`);
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Customer Loyalty Lookup
  const handlePhoneLookup = (phone) => {
    setCustomerPhone(phone);
    const found = DEMO_CUSTOMERS.find(c => c.phone.includes(phone) || c.id === phone);
    if (found) {
      setActiveCustomer(found);
      setRedeemedPoints(0);
      soundEffects.playNotificationPing();
    } else {
      setActiveCustomer(null);
      setRedeemedPoints(0);
    }
  };

  // Coupon Application
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const res = validateCoupon(couponCode, subtotal);
    if (res.valid) {
      setAppliedCoupon({ code: res.coupon.code, discount: res.discount, label: res.coupon.label });
      soundEffects.playCouponApplause();
    } else {
      setAppliedCoupon(null);
      setCouponError(res.error);
      soundEffects.playErrorBuzzer();
    }
  };

  // Parking and Recalling Carts
  const handleParkActiveCart = () => {
    if (cart.length === 0) return;
    parkCart(cart, customerPhone, activeCustomer?.name || 'In-Store Shopper');
    setCart([]);
    setAppliedCoupon(null);
    setRedeemedPoints(0);
    setActiveCustomer(null);
    setCustomerPhone('');
  };

  const handleRecallParkedCart = (parked) => {
    setCart(parked.items);
    if (parked.customerPhone) {
      handlePhoneLookup(parked.customerPhone);
    }
    deleteParkedCart(parked.id);
    setIsParkModalOpen(false);
    soundEffects.playSuccessChime();
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const loyaltyDiscount = redeemedPoints * 0.1; // 10 pts = ₹1 discount
  const totalDiscount = couponDiscount + loyaltyDiscount;
  const taxableSubtotal = Math.max(0, subtotal - totalDiscount);
  const tax = taxableSubtotal * 0.05;
  const grandTotal = taxableSubtotal + tax;

  // Tender & Change Due
  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashNum - grandTotal);

  // Complete Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const invoiceId = processSale(cart, paymentMode, 'Cashier Counter 01');
    soundEffects.playCashRegister();

    setCompletedInvoice({
      invoiceId,
      items: cart,
      subtotal,
      discount: totalDiscount,
      tax,
      grandTotal,
      paymentMode,
      cashTendered: paymentMode === 'Cash' ? cashNum : grandTotal,
      changeDue: paymentMode === 'Cash' ? changeDue : 0,
      customer: activeCustomer?.name || 'Walk-in Customer',
      date: new Date().toLocaleString()
    });

    // Reset Form
    setCart([]);
    setCashTendered('');
    setAppliedCoupon(null);
    setCouponCode('');
    setRedeemedPoints(0);
    setActiveCustomer(null);
    setCustomerPhone('');
  };

  // Filter products for fast-pick grid
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !productSearch || 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.barcode.includes(productSearch);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Fast Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary-600" />
            POS Cashier Terminal & Instant Checkout
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Rapid barcode billing, cashier fast-pick catalog, customer loyalty redemption, and change calculation.
          </p>
        </div>

        {/* Parked Carts Counter */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsParkModalOpen(true)}
            className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs"
          >
            <Layers className="w-4 h-4 mr-1.5 text-amber-600" />
            Parked Carts ({parkedCarts.length})
          </Button>

          {cart.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleParkActiveCart}
              className="text-xs font-bold text-gray-700"
              title="Hold current bill to attend next customer"
            >
              <Pause className="w-3.5 h-3.5 mr-1" /> Hold Bill
            </Button>
          )}
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Barcode Scanner & Fast-Pick Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Barcode Search Bar */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  ref={barcodeRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan or enter barcode / product code (e.g. 890100000001)..."
                  className="pl-11 h-12 text-sm font-mono border-gray-300 focus:border-primary-500 rounded-2xl"
                  autoFocus
                />
              </div>
              <Button type="submit" className="h-12 px-6 bg-primary-600 hover:bg-primary-700 font-bold text-xs rounded-2xl">
                Add Item
              </Button>
            </form>
          </div>

          {/* Fast-Pick Product Grid Card */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Cashier Fast-Pick Catalog
              </h2>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'ALL', label: 'All Items' },
                { id: 'Groceries', label: 'Groceries' },
                { id: 'Dairy', label: 'Dairy' },
                { id: 'Beverages', label: 'Drinks' },
                { id: 'Personal Care', label: 'Personal' },
                { id: 'Household', label: 'Home' },
                { id: 'Vegetables', label: 'Veg' },
                { id: 'Fruits', label: 'Fruits' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${
                    selectedCategory === cat.id
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Product Quick-Tap Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredProducts.map(product => {
                const inCartItem = cart.find(c => c.id === product.id);
                const isOutOfStock = product.stock === 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProductToCart(product)}
                    disabled={isOutOfStock}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between group relative ${
                      isOutOfStock 
                        ? 'bg-gray-100/70 border-gray-200 opacity-60 cursor-not-allowed' 
                        : inCartItem 
                        ? 'bg-primary-50/70 border-primary-400 shadow-xs' 
                        : 'bg-gray-50 hover:bg-primary-50/40 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {inCartItem && (
                      <span className="absolute top-2 right-2 bg-primary-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                        {inCartItem.quantity}
                      </span>
                    )}

                    <div className="flex items-center gap-2.5">
                      <ProductImage src={product.image} alt={product.name} category={product.category} className="w-10 h-10 object-contain bg-white rounded-xl p-1 border border-gray-100 flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-extrabold text-xs text-gray-900 truncate group-hover:text-primary-700">{product.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">₹{product.price} • {product.unit}</div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 font-mono">Stock: {product.stock}</span>
                      <span className="font-black text-primary-700">+ Add</span>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

        </div>

        {/* Right Column: Active Bill, Loyalty, Tender & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-5">
            
            {/* Bill Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Current Sale Bill</h2>
                <p className="text-[11px] text-gray-400">{cart.length} line items • Counter #01</p>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs font-bold text-red-500 hover:text-red-700"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer Loyalty Phone Lookup */}
            <div className="bg-purple-50/60 rounded-2xl p-3 border border-purple-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-900 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-600" /> Customer Loyalty Lookup
                </span>
                {activeCustomer && (
                  <span className="text-[10px] font-black bg-purple-200 text-purple-900 px-2 py-0.2 rounded-full">
                    {activeCustomer.loyaltyPoints} Points Available
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter customer mobile / pick demo..."
                  value={customerPhone}
                  onChange={(e) => handlePhoneLookup(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <select 
                  onChange={(e) => handlePhoneLookup(e.target.value)}
                  className="text-xs bg-white border border-purple-200 rounded-xl px-2 py-1.5 font-medium text-gray-700"
                >
                  <option value="">Demo Customer...</option>
                  {DEMO_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {activeCustomer && activeCustomer.loyaltyPoints > 0 && (
                <div className="pt-2 border-t border-purple-200/50 flex items-center justify-between text-xs">
                  <span className="text-purple-800 text-[11px]">
                    Redeem Points (Max {activeCustomer.loyaltyPoints}):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min="0"
                      max={activeCustomer.loyaltyPoints}
                      step="10"
                      value={redeemedPoints}
                      onChange={(e) => setRedeemedPoints(Number(e.target.value))}
                      className="w-24 accent-purple-600"
                    />
                    <span className="font-bold text-purple-900 font-mono text-[11px]">
                      -₹{(redeemedPoints * 0.1).toFixed(0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items Table */}
            <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <div className="font-extrabold text-gray-900 text-xs truncate">{item.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">₹{item.price} each • {item.barcode}</div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center bg-white rounded hover:bg-gray-100">
                        <Minus className="w-2.5 h-2.5 text-gray-600" />
                      </button>
                      <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center bg-white rounded hover:bg-gray-100">
                        <Plus className="w-2.5 h-2.5 text-gray-600" />
                      </button>
                    </div>

                    <span className="font-black text-xs text-gray-900 w-14 text-right">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>

                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-10 text-center text-xs text-gray-400 space-y-1">
                  <ScanBarcode className="w-8 h-8 text-gray-300 mx-auto" />
                  <p>Cart is empty. Scan or tap items on the left to begin.</p>
                </div>
              )}
            </div>

            {/* Bill Summary Calculations */}
            <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} units)</span>
                <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-purple-700 font-bold">
                  <span>Discounts & Loyalty Points</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                <span>Grand Total</span>
                <span className="text-xl text-primary-700 font-mono">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-black text-gray-700">Payment Channel</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Cash', icon: Banknote },
                  { id: 'UPI', icon: QrCode },
                  { id: 'Card', icon: CreditCard }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id)}
                    className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      paymentMode === m.id 
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5" />
                    {m.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tender Calculator */}
            {paymentMode === 'Cash' && (
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Cash Received (₹):</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={grandTotal.toFixed(2)}
                    className="w-28 text-right font-mono font-black text-sm bg-white border border-gray-300 rounded-lg px-2 py-1"
                  />
                </div>

                {/* Quick Tender Currency Pills */}
                <div className="flex items-center gap-1.5 justify-end">
                  {[50, 100, 200, 500, 2000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(String(amt))}
                      className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-700"
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashTendered(String(grandTotal.toFixed(2)))}
                    className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded text-[10px] font-bold"
                  >
                    Exact
                  </button>
                </div>

                {/* Change Due Display */}
                {cashNum > 0 && (
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-600">Change Due to Return:</span>
                    <span className={`text-sm font-black font-mono ${changeDue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {changeDue >= 0 ? `₹${changeDue.toFixed(2)}` : 'Insufficient Cash'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Button */}
            <Button
              className="w-full h-14 text-sm font-extrabold bg-primary-600 hover:bg-primary-700 text-white rounded-2xl flex items-center justify-between px-6 shadow-lg shadow-primary-700/20"
              disabled={cart.length === 0}
              onClick={handleCompleteSale}
            >
              <span>Complete Sale & Print Bill</span>
              <span className="font-mono text-base">₹{grandTotal.toFixed(2)} →</span>
            </Button>

          </div>

        </div>

      </div>

      {/* Parked Carts Modal */}
      {isParkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" /> Parked Bills Queue
              </h3>
              <button onClick={() => setIsParkModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {parkedCarts.map(parked => (
                <div key={parked.id} className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-900">{parked.id}</span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {parked.parkedAt}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-800">{parked.customerName}</div>
                    <div className="text-[11px] text-gray-500">{parked.items.length} items • ₹{parked.total.toFixed(2)}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleRecallParkedCart(parked)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8"
                    >
                      Recall Bill
                    </Button>
                    <button
                      onClick={() => deleteParkedCart(parked.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {parkedCarts.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">
                  No parked bills on hold.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Completed Receipt Modal */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-in fade-in zoom-in-95 font-mono text-xs">
            
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 font-sans">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-black text-base text-gray-900">Sale Transaction Successful</h4>
                  <p className="text-[10px] text-gray-400">Invoice #{completedInvoice.invoiceId}</p>
                </div>
              </div>
              <button onClick={() => setCompletedInvoice(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Details Header */}
            <div className="text-center space-y-1 py-2 border-b border-dashed border-gray-300">
              <div className="font-sans font-black text-sm text-gray-900">SMARTMART SUPERMARKET</div>
              <div className="text-[10px] text-gray-500">100ft Road, Indiranagar, Bengaluru - 560038</div>
              <div className="text-[10px] text-gray-500">GSTIN: 29AABCU9603R1ZM • POS Terminal #01</div>
            </div>

            <div className="space-y-1 text-[11px] text-gray-600 border-b border-dashed border-gray-300 pb-2">
              <div>Invoice: <span className="font-bold text-gray-900">{completedInvoice.invoiceId}</span></div>
              <div>Date: {completedInvoice.date}</div>
              <div>Customer: {completedInvoice.customer}</div>
              <div>Payment Mode: <span className="font-bold text-gray-900">{completedInvoice.paymentMode}</span></div>
            </div>

            {/* Itemized List */}
            <div className="divide-y divide-gray-100 max-h-44 overflow-y-auto pr-1">
              {completedInvoice.items.map((item, idx) => (
                <div key={idx} className="py-1.5 flex justify-between">
                  <div>
                    <div className="font-bold text-gray-900">{item.name}</div>
                    <div className="text-[10px] text-gray-400">{item.quantity} x ₹{item.price}</div>
                  </div>
                  <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-2 border-t border-dashed border-gray-300 space-y-1 text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{completedInvoice.subtotal.toFixed(2)}</span>
              </div>
              {completedInvoice.discount > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>Discounts:</span>
                  <span>-₹{completedInvoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (5%):</span>
                <span>₹{completedInvoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-1 border-t border-gray-300">
                <span>TOTAL AMOUNT:</span>
                <span>₹{completedInvoice.grandTotal.toFixed(2)}</span>
              </div>
              {completedInvoice.paymentMode === 'Cash' && (
                <>
                  <div className="flex justify-between text-gray-500 pt-1">
                    <span>Cash Tendered:</span>
                    <span>₹{completedInvoice.cashTendered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Change Returned:</span>
                    <span>₹{completedInvoice.changeDue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 font-sans">
              <Button
                variant="outline"
                className="flex-1 text-xs font-bold"
                onClick={() => {
                  alert("Invoice printed on POS Thermal Receipt Printer!");
                }}
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Thermal Bill
              </Button>
              <Button
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold"
                onClick={() => setCompletedInvoice(null)}
              >
                Start New Bill →
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
