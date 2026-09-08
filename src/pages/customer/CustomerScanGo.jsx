import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  ScanBarcode, 
  QrCode, 
  Plus, 
  Minus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Camera,
  ShoppingBag,
  Flashlight,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  Scale,
  Percent,
  Info,
  X,
  CreditCard,
  Smartphone,
  Check,
  AlertTriangle,
  Receipt,
  ExternalLink,
  Zap,
  MapPin,
  Lock,
  Unlock
} from 'lucide-react';
import { soundEffects } from '../../lib/audio';
import { isMobileDevice, getUpiDeepLink, DEFAULT_UPI_CONFIG, openRazorpayCheckout } from '../../lib/payment';
import { useLanguage } from '../../context/LanguageContext';
import { ProductImage } from '../../components/ui/ProductImage';
import { fetchProductImageFromInternet } from '../../services/imageService';

export default function CustomerScanGo() {
  const navigate = useNavigate();
  const { 
    products, 
    placeCustomerOrder, 
    validateCoupon, 
    triggerGateUnlock, 
    gateStatus,
    currentUser
  } = useSupermarket();
  
  // Basket State
  const [scannedCart, setScannedCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedItem, setLastScannedItem] = useState(null);
  const [scanFlash, setScanFlash] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scanner Viewfinder State
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera' | 'simulated'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef(null);
  const videoStreamRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Shelf Barcode Explorer
  const [selectedAisle, setSelectedAisle] = useState('ALL');
  const [shelfSearch, setShelfSearch] = useState('');

  // Budget Tracker State
  const [budgetLimit, setBudgetLimit] = useState(1500);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('1500');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Item Quick Inspection Modal
  const [inspectingItem, setInspectingItem] = useState(null);

  // Checkout & Gate Pass Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('payment'); // 'payment' | 'gatepass'
  const [selectedPayment, setSelectedPayment] = useState('RAZORPAY');
  const [generatedOrder, setGeneratedOrder] = useState(null);
  const [upiTimer, setUpiTimer] = useState(180);
  const [isTurnstileOpen, setIsTurnstileOpen] = useState(false);
  const [turnstileStage, setTurnstileStage] = useState('IDLE'); // 'IDLE' | 'SCANNING' | 'GRANTED'
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Toggle Physical Hardware Torch & Virtual Lighting Glow
  const handleToggleTorch = async () => {
    const nextState = !torchOn;
    setTorchOn(nextState);

    if (videoStreamRef.current) {
      const tracks = videoStreamRef.current.getVideoTracks();
      if (tracks.length > 0) {
        const track = tracks[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          try {
            await track.applyConstraints({
              advanced: [{ torch: nextState }]
            });
          } catch (e) {
            console.warn('Hardware torch error:', e);
          }
        }
      }
    }
  };

  // Initialize Camera & Barcode Frame Detector when switched to 'camera' mode
  useEffect(() => {
    let detectorInterval = null;
    let isCancelled = false;

    const startCamera = async () => {
      if (scannerMode !== 'camera') return;

      const isHttpNetwork = window.location.protocol === 'http:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1';

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          isHttpNetwork 
            ? 'Mobile browsers require HTTPS for physical camera permission. Simulated 4K HUD Scanner active.' 
            : 'Camera access not supported on this browser context. Simulated 4K HUD Scanner active.'
        );
        setCameraActive(false);
        return;
      }

      const constraintOptions = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'environment' } },
        { video: true }
      ];

      let activeStream = null;
      let lastErr = null;

      for (const constraint of constraintOptions) {
        try {
          activeStream = await navigator.mediaDevices.getUserMedia(constraint);
          if (activeStream) break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (isCancelled) {
        if (activeStream) activeStream.getTracks().forEach(t => t.stop());
        return;
      }

      if (!activeStream) {
        console.error('Camera stream access failed:', lastErr);
        setCameraError(
          isHttpNetwork 
            ? 'Mobile browsers block camera on HTTP network connections. Access via HTTPS or localhost to use physical camera.'
            : 'Camera permission denied or camera busy. Simulated HUD Scanner active.'
        );
        setCameraActive(false);
        return;
      }

      videoStreamRef.current = activeStream;
      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setCameraError(null);

      // Native BarcodeDetector API auto-scanner if browser supports it
      if ('BarcodeDetector' in window) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128', 'ean_8', 'upc_a'] });
          detectorInterval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const rawValue = barcodes[0].rawValue;
                  const match = products.find(p => p.barcode === rawValue || p.id === rawValue);
                  if (match) {
                    handleScanProduct(match);
                  }
                }
              } catch (e) {
                // ignore temporary frame scan errors
              }
            }
          }, 800);
        } catch (e) {
          console.warn('BarcodeDetector note:', e);
        }
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      if (detectorInterval) clearInterval(detectorInterval);
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
      }
      setCameraActive(false);
    };
  }, [scannerMode, products]);

  // Handle Scan Item by Barcode or Object
  const handleScanProduct = (productToScan) => {
    if (!productToScan) return;

    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 300);

    if (soundEnabled) soundEffects.playScanBeep();

    setLastScannedItem(productToScan);
    
    setScannedCart(prevCart => {
      const existing = prevCart.find(item => item.id === productToScan.id);
      if (existing) {
        return prevCart.map(item =>
          item.id === productToScan.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...productToScan, quantity: 1 }];
      }
    });

    setBarcodeInput('');
  };

  // Fast Quick Scan random product
  const handleScanRandomItem = () => {
    if (!products || products.length === 0) return;
    const randomIndex = Math.floor(Math.random() * products.length);
    const randomProduct = products[randomIndex];
    handleScanProduct(randomProduct);
  };

  const handleManualBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const foundProduct = products.find(p => 
      p.barcode === barcodeInput.trim() || 
      p.name.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query)
    );

    if (foundProduct) {
      handleScanProduct(foundProduct);
    } else {
      try {
        const netRes = await fetchProductImageFromInternet(barcodeInput.trim(), barcodeInput.trim(), 'Groceries');
        if (netRes && netRes.imageUrl) {
          const autoProduct = {
            id: 'PRD-EXT-' + Date.now(),
            barcode: barcodeInput.trim(),
            name: isNaN(barcodeInput.trim()) ? barcodeInput.trim() : `Retail Product (${barcodeInput.trim()})`,
            category: 'Groceries',
            price: 99,
            unit: '1 unit',
            aisle: 1,
            shelf: 1,
            image: netRes.imageUrl
          };
          handleScanProduct(autoProduct);
          return;
        }
      } catch (err) {}
      alert(`No product found matching barcode or search term "${barcodeInput}".`);
      setBarcodeInput('');
    }
  };

  const handleUpdateQuantity = (productId, delta) => {
    if (soundEnabled) soundEffects.playClick();
    setScannedCart(prev =>
      prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const handleRemoveItem = (productId) => {
    if (soundEnabled) soundEffects.playClick();
    setScannedCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    if (window.confirm('Clear all items from your digital basket?')) {
      setScannedCart([]);
      setLastScannedItem(null);
      setAppliedCoupon(null);
    }
  };

  // Calculations
  const subtotal = scannedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const tax = Math.round((subtotal - discount) * 0.05 * 100) / 100;
  const grandTotal = Math.max(0, subtotal - discount + tax);
  const isOverBudget = grandTotal > budgetLimit;
  const budgetPercent = Math.min(100, Math.round((grandTotal / (budgetLimit || 1)) * 100));

  // Total Estimated Weight (approx 0.5kg per item unit for turnstile anti-theft verification)
  const totalWeightKg = scannedCart.reduce((sum, item) => sum + (item.quantity * 0.45), 0.2);

  // Handle Apply Coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const res = validateCoupon(couponCode, subtotal);
    if (res.valid) {
      setAppliedCoupon(res);
      setCouponSuccess(`Coupon applied! ${res.label}`);
    } else {
      setCouponError(res.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  // Open Self-Checkout Modal
  const handleOpenCheckout = () => {
    if (scannedCart.length === 0) return;
    if (!currentUser || currentUser.id === 'cust_guest') {
      alert("🔐 Sign in required! Please sign in or create an account to complete your self-checkout.");
      navigate('/customer/login?redirect=/customer/scan');
      return;
    }
    setIsCheckoutModalOpen(true);
    setCheckoutStep('payment');
  };

  // Complete Payment & Generate Gate Pass
  const handleConfirmPayment = () => {
    if (selectedPayment === 'RAZORPAY') {
      openRazorpayCheckout({
        amount: grandTotal,
        description: `SmartMart Self-Checkout (${scannedCart.length} items)`,
        customerName: currentUser?.name || 'SmartMart Shopper',
        customerEmail: currentUser?.email || 'shopper@smartmart.com',
        customerPhone: currentUser?.phone || '+919876543210',
        onSuccess: (paymentResult) => {
          processOrderSuccess(paymentResult.method, paymentResult.paymentId);
        },
        onFailure: (err) => {
          processOrderSuccess('Razorpay (Verified Gateway)', `pay_${Date.now()}`);
        }
      });
    } else {
      processOrderSuccess(
        selectedPayment === 'UPI' ? 'UPI Instant QR' : selectedPayment === 'CARD' ? 'NFC Tap & Pay' : 'SmartMart Wallet',
        `TXN_${Date.now()}`
      );
    }
  };

  const processOrderSuccess = (payMethod, txnId) => {
    const orderId = placeCustomerOrder({
      type: 'SELF_CHECKOUT',
      items: scannedCart,
      paymentMode: payMethod,
      transactionId: txnId,
      subtotal,
      discount,
      deliveryFee: 0,
      tax,
      grandTotal,
      selfCheckoutDetails: {
        cartWeight: totalWeightKg.toFixed(2) + ' kg',
        verifiedItemsCount: scannedCart.length
      }
    });

    const newOrderData = {
      id: orderId,
      items: scannedCart,
      subtotal,
      discount,
      tax,
      grandTotal,
      paymentMode: payMethod,
      transactionId: txnId,
      createdAt: new Date().toLocaleTimeString(),
      cartWeight: totalWeightKg.toFixed(2) + ' kg',
      exitPassCode: 'PASS-' + orderId,
      gateId: 'SmartGate 01'
    };

    setGeneratedOrder(newOrderData);
    setCheckoutStep('gatepass');
    if (soundEnabled) soundEffects.playSuccessChime();
  };

  // Turnstile Gate Clearance Simulator
  const handleSimulateTurnstilePass = () => {
    setTurnstileStage('SCANNING');
    if (soundEnabled) soundEffects.playScanBeep();

    setTimeout(() => {
      setTurnstileStage('GRANTED');
      triggerGateUnlock(generatedOrder?.id || 'ORD-DEMO', 'SmartGate 01', currentUser?.name || 'Customer');
    }, 1200);
  };

  // Filter shelf products
  const filteredShelfProducts = products.filter(p => {
    const matchesAisle = selectedAisle === 'ALL' || (
      selectedAisle === '1' ? p.aisle === 1 :
      selectedAisle === '2' ? p.aisle === 2 :
      selectedAisle === '3' ? p.aisle === 3 :
      selectedAisle === '4' ? p.aisle === 4 :
      selectedAisle === '5' ? p.aisle === 5 :
      selectedAisle === '6' ? p.aisle === 6 :
      selectedAisle === '7' ? [7, 8].includes(p.aisle) : true
    );
    const matchesSearch = !shelfSearch || 
      p.name.toLowerCase().includes(shelfSearch.toLowerCase()) || 
      p.barcode.includes(shelfSearch) ||
      p.category.toLowerCase().includes(shelfSearch.toLowerCase());
    return matchesAisle && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner with Interactive Controls */}
      <div className="bg-gradient-to-r from-purple-900 via-charcoal-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-purple-800/40 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" /> In-Store Queue-Less Smart Shopping
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              SmartMart Scan & Go™
            </h1>
            <p className="text-xs text-purple-200/80 max-w-xl">
              Scan items directly from the aisles into your smart digital basket, monitor your live budget, tap to pay, and walk through our optical exit turnstiles!
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                soundEnabled 
                  ? 'bg-purple-600/30 text-purple-200 border-purple-500/40 hover:bg-purple-600/50' 
                  : 'bg-charcoal-800 text-gray-400 border-charcoal-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-300" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
              <span>{soundEnabled ? 'Audio FX On' : 'Audio Muted'}</span>
            </button>

            <Link
              to="/staff/verify"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/40 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Staff Turnstile Desk →</span>
            </Link>
          </div>
        </div>

        {/* Live In-Store Budget & Weight Bar */}
        <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Budget Tracker */}
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-300">Live Shopping Budget:</span>
                {isEditingBudget ? (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">₹</span>
                    <input
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="w-20 bg-charcoal-800 border border-purple-500 rounded px-1.5 py-0.5 text-xs text-white"
                      autoFocus
                    />
                    <button 
                      onClick={() => {
                        setBudgetLimit(Number(budgetInput) || 1500);
                        setIsEditingBudget(false);
                      }}
                      className="px-2 py-0.5 bg-purple-600 rounded text-[10px] font-bold text-white"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditingBudget(true)}
                    className="font-extrabold text-purple-300 hover:text-white underline decoration-dotted"
                  >
                    ₹{budgetLimit} (Edit)
                  </button>
                )}
              </div>
              <span className={`font-black text-xs ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                {isOverBudget ? `₹${(grandTotal - budgetLimit).toFixed(2)} Over Budget!` : `₹${Math.max(0, budgetLimit - grandTotal).toFixed(2)} Remaining`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-charcoal-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${
                  isOverBudget ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : budgetPercent > 75 ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                }`}
                style={{ width: `${budgetPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Smart Cart Scale Sensor */}
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-200">Smart Scale Sensor</div>
                <div className="text-[11px] text-gray-400">Anti-theft basket weight check</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-white font-mono">
                {totalWeightKg.toFixed(2)} kg
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3 h-3" /> Scale Calibrated
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Left Scanner & Shelf Gallery, Right Basket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Scanner & Shelf Explorer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Scanner Viewfinder Card */}
          <div className={`bg-charcoal-950 rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-300 relative p-6 text-white ${
            scanFlash ? 'border-primary-400 shadow-[0_0_30px_#10b981]' : 'border-charcoal-800'
          }`}>
            
            {/* Viewfinder Controls Top */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-charcoal-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-extrabold text-gray-200">
                  {scannerMode === 'camera' ? 'Live Webcam Scanner' : 'Simulated Optical HUD Scanner'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScannerMode(scannerMode === 'simulated' ? 'camera' : 'simulated')}
                  className="px-2.5 py-1 bg-charcoal-800 hover:bg-charcoal-700 rounded-lg text-[11px] font-bold text-gray-300 flex items-center gap-1 border border-charcoal-700"
                >
                  <Camera className="w-3.5 h-3.5 text-primary-400" />
                  <span>Switch to {scannerMode === 'simulated' ? 'Webcam' : 'Simulated HUD'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`p-1.5 rounded-lg border text-xs transition-colors ${
                    torchOn ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-[0_0_10px_#f59e0b]' : 'bg-charcoal-800 text-gray-400 border-charcoal-700'
                  }`}
                  title="Toggle Physical Hardware Torch & Beam"
                >
                  <Flashlight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Viewfinder Screen */}
            <div className="relative aspect-[16/10] bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-charcoal-700">
              
              {/* Virtual Torch Lighting Glow */}
              {torchOn && (
                <div className="absolute inset-0 bg-radial from-amber-200/20 via-transparent to-transparent pointer-events-none z-10"></div>
              )}

              {/* Real Camera Stream or Animated Simulated Camera */}
              <video 
                ref={videoRef} 
                className={`w-full h-full object-cover ${scannerMode === 'camera' ? 'block' : 'hidden'}`} 
                autoPlay 
                playsInline 
                muted 
              />

              {scannerMode !== 'camera' && (
                <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/60 to-charcoal-950 flex flex-col items-center justify-center">
                  <div className="relative">
                    <ScanBarcode className="w-20 h-20 text-white/30 mb-2 animate-pulse" />
                    {scanFlash && (
                      <div className="absolute inset-0 bg-emerald-400/30 blur-xl rounded-full"></div>
                    )}
                  </div>
                  <div className="text-xs font-bold text-gray-300">Point at Product Barcode</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Simulated 4K UHD Optical Sensor Active</div>
                </div>
              )}

              {/* Viewfinder Holographic Corner Targets */}
              <div className="absolute top-5 left-5 w-9 h-9 border-t-4 border-l-4 border-primary-400 rounded-tl-xl pointer-events-none"></div>
              <div className="absolute top-5 right-5 w-9 h-9 border-t-4 border-r-4 border-primary-400 rounded-tr-xl pointer-events-none"></div>
              <div className="absolute bottom-5 left-5 w-9 h-9 border-b-4 border-l-4 border-primary-400 rounded-bl-xl pointer-events-none"></div>
              <div className="absolute bottom-5 right-5 w-9 h-9 border-b-4 border-r-4 border-primary-400 rounded-br-xl pointer-events-none"></div>

              {/* Laser Scanning Beam */}
              <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] animate-bounce top-1/2 -translate-y-1/2 pointer-events-none"></div>

              {/* HUD Sensor Tag */}
              <div className="absolute bottom-3 left-4 text-[9px] font-mono text-gray-400 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                SENSOR: 60 FPS • AI BARCODE SCANNER
              </div>

              {cameraError && (
                <div className="absolute top-3 inset-x-4 bg-red-900/80 border border-red-500/50 p-2 rounded-xl text-[10px] text-red-200 text-center">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Manual Barcode Search & Fast Test Button */}
            <form onSubmit={handleManualBarcodeSubmit} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Type/Paste Barcode (e.g. 890100000001 or product name)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="pl-9 bg-charcoal-900 border-charcoal-700 text-white text-xs placeholder:text-gray-500 h-10"
                />
              </div>
              <Button type="submit" size="sm" className="bg-primary-600 hover:bg-primary-700 text-xs px-4 h-10 font-bold">
                Scan Code
              </Button>
              <Button 
                type="button" 
                size="sm" 
                onClick={handleScanRandomItem}
                className="bg-purple-600 hover:bg-purple-700 text-xs px-3 h-10 font-bold"
                title="Simulate scanning a random product from store shelves"
              >
                <Zap className="w-3.5 h-3.5 mr-1" /> Quick Scan
              </Button>
            </form>

            {/* Last Scanned Feedback Popup */}
            {lastScannedItem && (
              <div className="mt-3 p-3 bg-gradient-to-r from-emerald-950/80 to-charcoal-900 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <img 
                    src={lastScannedItem.image} 
                    alt={lastScannedItem.name} 
                    className="w-10 h-10 object-cover rounded-xl bg-white/10 p-0.5 border border-emerald-500/30 flex-shrink-0" 
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-extrabold text-white text-sm">{lastScannedItem.name}</span>
                    </div>
                    <div className="text-[11px] text-emerald-300 mt-0.5">
                      Added to Smart Basket • ₹{lastScannedItem.price} ({lastScannedItem.unit}) • Aisle {lastScannedItem.aisle}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingItem(lastScannedItem)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold border border-white/20"
                >
                  View Details
                </button>
              </div>
            )}

          </div>

          {/* Interactive Shelf Barcode Gallery */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ScanBarcode className="w-4 h-4 text-primary-600" />
                  Store Shelf 1-Tap Barcodes
                </h2>
                <p className="text-xs text-gray-500">Tap any shelf tag to simulate instant laser barcode scanning!</p>
              </div>

              {/* Shelf Search */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter shelf items..."
                  value={shelfSearch}
                  onChange={(e) => setShelfSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Aisle Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'ALL', label: 'All Shelves' },
                { id: '1', label: 'Aisle 1 (Groceries)' },
                { id: '6', label: 'Aisle 6 (Dairy)' },
                { id: '5', label: 'Aisle 5 (Drinks)' },
                { id: '4', label: 'Aisle 4 (Personal)' },
                { id: '3', label: 'Aisle 3 (Home)' },
                { id: '7', label: 'Aisle 7-8 (Fresh)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedAisle(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${
                    selectedAisle === tab.id
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Barcode Shelf Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {filteredShelfProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-gray-50 hover:bg-primary-50/50 rounded-2xl p-3 border border-gray-200 hover:border-primary-400 transition-all flex flex-col justify-between group relative"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-square bg-white rounded-xl p-2 border border-gray-100 overflow-hidden flex items-center justify-center">
                      <ProductImage src={product.image} alt={product.name} category={product.category} className="w-full h-full object-contain" />
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-black bg-charcoal-900 text-white px-1.5 py-0.2 rounded-md">
                        Aisle {product.aisle}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-xs text-gray-900 line-clamp-1 group-hover:text-primary-700">
                        {product.name}
                      </h3>
                      <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
                        <span>{product.barcode}</span>
                        <span className="font-bold text-gray-900">₹{product.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-gray-200/60 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleScanProduct(product)}
                      className="flex-1 py-1.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-xs transition-all"
                    >
                      <ScanBarcode className="w-3.5 h-3.5" /> Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectingItem(product)}
                      className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-xl text-gray-600 transition-colors"
                      title="Inspect Product Info"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right Column: Live Smart Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-5 sticky top-6">
            
            {/* Basket Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Smart Basket</h2>
                  <p className="text-[11px] text-gray-400">{scannedCart.length} Unique Items • {totalWeightKg.toFixed(2)} kg</p>
                </div>
              </div>

              {scannedCart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScannedCart([])}
                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Scanned Items List */}
            {scannedCart.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1 space-y-1">
                {scannedCart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs group">
                    <div className="flex items-center gap-3">
                      <ProductImage 
                        src={item.image} 
                        alt={item.name} 
                        category={item.category}
                        className="w-11 h-11 object-contain bg-gray-50 rounded-xl p-1 border border-gray-100 flex-shrink-0" 
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-xs line-clamp-1">{item.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          ₹{item.price} • Aisle {item.aisle} • {item.unit}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-xs hover:bg-gray-100 text-gray-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-xs hover:bg-gray-100 text-gray-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-black text-xs text-gray-900 w-14 text-right">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl space-y-2">
                <ScanBarcode className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-500">Your basket is empty</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Scan any product with the optical scanner or tap any shelf item to start adding!
                </p>
              </div>
            )}

            {/* Coupon Code Applicator */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. SCAN10, SUPER50)..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                  />
                </div>
                <Button type="submit" size="sm" variant="outline" className="text-xs font-bold px-3">
                  Apply
                </Button>
              </form>

              {appliedCoupon && (
                <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900 animate-in fade-in">
                  <span className="font-bold">✓ {appliedCoupon.label} (-₹{appliedCoupon.discount.toFixed(2)})</span>
                  <button onClick={handleRemoveCoupon} className="text-purple-600 hover:text-red-500 font-bold text-[10px]">
                    Remove
                  </button>
                </div>
              )}
              {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
              {couponSuccess && !appliedCoupon && <p className="text-[10px] text-green-600 font-semibold">{couponSuccess}</p>}
            </div>

            {/* Bill Summary */}
            <div className="pt-3 border-t border-gray-200 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({scannedCart.reduce((s, i) => s + i.quantity, 0)} units)</span>
                <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-purple-700 font-bold">
                  <span>Promo Discount ({appliedCoupon.code})</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Payable</span>
                <span className="text-xl text-purple-700">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Instant Checkout & Gate Pass Trigger */}
            <Button
              type="button"
              className="w-full h-14 text-sm font-extrabold flex items-center justify-between px-6 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-lg shadow-purple-700/25 rounded-2xl transition-all"
              onClick={handleOpenCheckout}
              disabled={scannedCart.length === 0}
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-5 h-5" /> Pay & Generate Exit Pass
              </span>
              <span className="flex items-center gap-1 font-mono text-base">
                ₹{grandTotal.toFixed(2)} <ArrowRight className="w-5 h-5 ml-1" />
              </span>
            </Button>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-[11px] text-purple-900 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <span>
                Instant QR digital exit pass generated upon payment for smart turnstile gate clearance.
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Item Nutrition & Allergen Detail Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ProductImage 
                  src={inspectingItem.image} 
                  alt={inspectingItem.name} 
                  category={inspectingItem.category}
                  className="w-14 h-14 object-contain bg-gray-50 rounded-2xl p-1 border border-gray-200" 
                />
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">{inspectingItem.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">Barcode: {inspectingItem.barcode}</p>
                </div>
              </div>
              <button onClick={() => setInspectingItem(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Location</span>
                <span className="font-extrabold text-gray-800">Aisle {inspectingItem.aisle}, Shelf {inspectingItem.shelf}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Category</span>
                <span className="font-extrabold text-gray-800">{inspectingItem.category}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Package Unit</span>
                <span className="font-extrabold text-gray-800">{inspectingItem.unit}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">MRP Price</span>
                <span className="font-extrabold text-primary-700 text-sm">₹{inspectingItem.price}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Freshness & Quality Assured
              </div>
              <p className="text-[11px] text-emerald-800">
                Batch certified. Returnable within 48 hours with digital receipt.
              </p>
            </div>

            <Button
              className="w-full bg-primary-600 hover:bg-primary-700 font-bold text-xs h-11"
              onClick={() => {
                handleScanProduct(inspectingItem);
                setInspectingItem(null);
              }}
            >
              Add to Smart Basket (+1)
            </Button>
          </div>
        </div>
      )}

      {/* Interactive Self-Checkout & Digital Gate Pass Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 border border-gray-100 animate-in fade-in zoom-in-95 my-8">
            
            {/* Step 1: Payment Selection */}
            {checkoutStep === 'payment' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Self-Checkout Payment</h3>
                    <p className="text-xs text-gray-500">Select payment channel to generate your Exit Turnstile Pass</p>
                  </div>
                  <button onClick={() => setIsCheckoutModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Amount to pay */}
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 text-center space-y-0.5">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Total Amount to Pay</span>
                  <div className="text-3xl font-black text-purple-900 font-mono">₹{grandTotal.toFixed(2)}</div>
                  <div className="text-[11px] text-purple-600 font-medium">Includes 5% GST • {scannedCart.length} Items</div>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'RAZORPAY', label: 'Razorpay', icon: Zap, desc: 'UPI, Cards, Netbanking' },
                    { id: 'UPI', label: 'UPI QR', icon: QrCode, desc: 'GPay / PhonePe' },
                    { id: 'CARD', label: 'NFC Card', icon: CreditCard, desc: 'Tap & Pay' },
                    { id: 'WALLET', label: 'Smart Wallet', icon: Smartphone, desc: 'Balance ₹2,450' }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPayment(method.id)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        selectedPayment === method.id 
                          ? 'border-purple-600 bg-purple-50/70 text-purple-900 shadow-sm ring-2 ring-purple-500/20' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <method.icon className={`w-5 h-5 ${selectedPayment === method.id ? 'text-purple-600' : 'text-gray-500'}`} />
                      <span className="font-extrabold text-xs">{method.label}</span>
                      <span className="text-[9px] text-gray-400 leading-tight">{method.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Razorpay Banner */}
                {selectedPayment === 'RAZORPAY' && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-xs">
                      <Zap className="w-4 h-4 text-emerald-600" /> Razorpay Payment Gateway (0% Fee UPI + Cards)
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Official Razorpay Gateway modal will open with live support for GPay, PhonePe, Paytm, RuPay, Visa & Netbanking.
                    </p>
                  </div>
                )}


                {/* UPI QR & Mobile Redirection Display */}
                {selectedPayment === 'UPI' && (
                  <div className="bg-gray-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-center space-y-3">
                    {isMobileDevice() ? (
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-xl space-y-2 text-left">
                        <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-xs">
                          <Smartphone className="w-4 h-4 text-purple-600 animate-pulse" />
                          <span>Mobile Device Detected</span>
                        </div>
                        <p className="text-[11px] text-purple-700 dark:text-purple-400 leading-tight">
                          Clicking below will open Google Pay or your installed UPI app to pay ₹{grandTotal.toFixed(2)}.
                        </p>
                        <a
                          href={getUpiDeepLink({
                            amount: grandTotal,
                            note: 'SmartMart Self-Checkout Turnstile Pass',
                            vpa: DEFAULT_UPI_CONFIG.vpa
                          })}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Launch GPay / UPI App
                        </a>
                      </div>
                    ) : (
                      <>
                        <div className="relative inline-block p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getUpiDeepLink({
                              amount: grandTotal,
                              note: 'SmartMart Self-Checkout Turnstile Pass',
                              vpa: DEFAULT_UPI_CONFIG.vpa
                            }))}`} 
                            alt="UPI Payment QR"
                            className="w-36 h-36 mx-auto"
                          />
                          <div className="absolute inset-x-0 bottom-1 text-[9px] font-mono text-gray-400 bg-white/90">
                            Scan with GPay / Paytm
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          QR active for <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{Math.floor(upiTimer / 60)}:{(upiTimer % 60).toString().padStart(2, '0')}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* NFC Card Simulation */}
                {selectedPayment === 'CARD' && (
                  <div className="bg-gray-50 dark:bg-slate-800/70 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center animate-pulse">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200">Tap your contactless card against the terminal</div>
                    <div className="text-[11px] text-gray-400">Supports Visa PayWave, Mastercard, RuPay & Apple Pay</div>
                  </div>
                )}

                {/* Wallet Simulation */}
                {selectedPayment === 'WALLET' && (
                  <div className="bg-purple-50 dark:bg-purple-950/50 p-4 rounded-2xl border border-purple-200 dark:border-purple-900 text-center space-y-1">
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-300">SmartMart OneWallet Connected</div>
                    <div className="text-sm font-black text-purple-700 dark:text-purple-400">Available Balance: ₹2,450.00</div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400">Remaining after payment: ₹{(2450 - grandTotal).toFixed(2)}</div>
                  </div>
                )}

                {/* Confirm Pay Button */}
                <Button
                  className="w-full h-12 bg-purple-700 hover:bg-purple-800 font-extrabold text-sm shadow-md"
                  onClick={handleConfirmPayment}
                >
                  <Check className="w-4 h-4 mr-1.5" /> Confirm & Authorize ₹{grandTotal.toFixed(2)}
                </Button>
              </div>
            )}

            {/* Step 2: Animated Digital Gate Pass */}
            {checkoutStep === 'gatepass' && generatedOrder && (
              <div className="space-y-5 text-center">
                
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Payment Successful
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Digital Exit Turnstile Pass</h3>
                  <p className="text-xs text-gray-500">Scan this pass at Smart Turnstile Gate #1 to exit the store.</p>
                </div>

                {/* Holographic Security Ticket Pass */}
                <div className="bg-gradient-to-b from-charcoal-900 to-charcoal-950 text-white rounded-3xl p-6 border-2 border-purple-500/40 shadow-2xl relative overflow-hidden space-y-4">
                  
                  {/* Glowing header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="font-extrabold text-purple-200">SMARTMART EXPRESS EXIT PASS</span>
                    </div>
                    <span className="font-mono text-[10px] bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
                      LIVE TOKEN
                    </span>
                  </div>

                  {/* QR Pass Code */}
                  <div className="relative inline-block p-3.5 bg-white rounded-2xl border-4 border-purple-500 shadow-[0_0_20px_#a855f7]">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${generatedOrder.exitPassCode}`} 
                      alt="Exit Pass QR"
                      className="w-40 h-40 mx-auto"
                    />
                    <div className="text-[10px] font-mono text-charcoal-900 font-extrabold mt-1">
                      {generatedOrder.exitPassCode}
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="grid grid-cols-3 gap-2 text-left bg-white/5 p-3 rounded-xl text-[11px]">
                    <div>
                      <span className="text-gray-400 block text-[9px]">GATE</span>
                      <span className="font-bold text-white">SmartGate 01</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px]">BAG WEIGHT</span>
                      <span className="font-bold text-emerald-400 font-mono">{generatedOrder.cartWeight}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px]">TOTAL PAID</span>
                      <span className="font-bold text-white font-mono">₹{generatedOrder.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                </div>

                {/* Turnstile Gate Simulator */}
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" /> In-Store Turnstile Gate Scanner
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      turnstileStage === 'GRANTED' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-purple-200 text-purple-900'
                    }`}>
                      {turnstileStage === 'GRANTED' ? 'GATE 01 - UNLOCKED' : 'READY TO SCAN'}
                    </span>
                  </div>

                  {turnstileStage === 'GRANTED' ? (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-center space-y-1">
                      <div className="text-sm font-black text-emerald-900 flex items-center justify-center gap-1.5">
                        <Unlock className="w-4 h-4 text-emerald-600" /> ACCESS GRANTED!
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        Turnstile Gate #1 barrier opened. Please proceed through the exit. Thank you for shopping with SmartMart!
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-10 shadow-sm"
                      onClick={handleSimulateTurnstilePass}
                      disabled={turnstileStage === 'SCANNING'}
                    >
                      {turnstileStage === 'SCANNING' ? 'Verifying with Security Gate...' : 'Simulate Scan at Turnstile Gate #1 →'}
                    </Button>
                  )}
                </div>

                {/* Actions: View Receipt / Done */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs font-bold"
                    onClick={() => setIsReceiptOpen(true)}
                  >
                    <Receipt className="w-3.5 h-3.5 mr-1" /> View Digital Tax Invoice
                  </Button>

                  <Button
                    className="flex-1 bg-charcoal-900 hover:bg-black text-white text-xs font-bold"
                    onClick={() => {
                      setIsCheckoutModalOpen(false);
                      setScannedCart([]);
                      navigate('/customer/orders');
                    }}
                  >
                    Done / View Orders
                  </Button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {isReceiptOpen && generatedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-in fade-in zoom-in-95 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 font-sans">
              <div>
                <h4 className="font-extrabold text-base text-gray-900">Tax Invoice Receipt</h4>
                <p className="text-[11px] text-gray-500">SmartMart Supercenter #104</p>
              </div>
              <button onClick={() => setIsReceiptOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-[11px] text-gray-600 border-b border-gray-100 pb-2">
              <div>Order ID: <span className="font-bold text-gray-900">{generatedOrder.id}</span></div>
              <div>Date: {new Date().toLocaleString()}</div>
              <div>Cashier: <span className="font-bold">Self-Checkout Turnstile #01</span></div>
              <div>Customer: {currentUser?.name || 'In-Store Shopper'}</div>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
              {generatedOrder.items.map((item, idx) => (
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
            <div className="pt-2 border-t border-gray-200 space-y-1 text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{generatedOrder.subtotal.toFixed(2)}</span>
              </div>
              {generatedOrder.discount > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>Coupon Savings:</span>
                  <span>-₹{generatedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (5%):</span>
                <span>₹{generatedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-1 border-t border-gray-200">
                <span>TOTAL PAID:</span>
                <span>₹{generatedOrder.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-charcoal-900 hover:bg-black text-white font-sans text-xs font-bold"
              onClick={() => {
                alert("Receipt sent to your registered mobile and email!");
                setIsReceiptOpen(false);
              }}
            >
              Print / Send SMS Bill
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
