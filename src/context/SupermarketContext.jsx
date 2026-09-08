import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialProducts, initialSales, initialTransactions, popularRecipes } from '../data/mockData';
import { soundEffects } from '../lib/audio';
import { apiFetchProducts, apiCreateOrder, apiAddProduct, apiUpdateProductStock } from '../services/api';
import { getCategoryFallbackImage, getCuratedProductImage } from '../services/imageService';

const SupermarketContext = createContext();

export const useSupermarket = () => useContext(SupermarketContext);

export const DEFAULT_STORE_SETTINGS = {
  storeName: 'SmartMart Express Supermarket',
  storeAddress: '100ft Road, Indiranagar, Bengaluru - 560038',
  storePhone: '+91 80 4912 3456',
  taxRate: 5, // %
  freeDeliveryThreshold: 299, // INR
  expressDeliveryFee: 25,
  standardDeliveryFee: 15,
  gateTimeoutSeconds: 7,
  soundFxEnabled: true,
  voiceAssistantEnabled: true,
  currencySymbol: '₹',
  monthlyBudgetLimit: 2500
};


export const DEFAULT_GUEST_USER = {
  id: 'guest_user',
  name: 'Guest Customer',
  email: 'guest@smartmart.com',
  phone: '+91 98765 00000',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
  address: '100ft Road, Indiranagar, Bengaluru - 560038',
  loyaltyPoints: 100,
  savedAddresses: [
    { id: 'addr_guest', label: 'Home', address: '100ft Road, Indiranagar, Bengaluru - 560038', isDefault: true }
  ]
};

export const DEMO_CUSTOMERS = [DEFAULT_GUEST_USER];

const INITIAL_ORDERS = [];

const SM_CATALOG_VERSION = 'v3_internet_images';

export const SupermarketProvider = ({ children }) => {
  // Store Settings (Tax, delivery rules, hardware timeouts)
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('sm_store_settings');
    return saved ? { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_STORE_SETTINGS;
  });

  // Products (hydrated from REST API or store product catalog with version migration)
  const [products, setProducts] = useState(() => {
    const savedVersion = localStorage.getItem('sm_catalog_version');
    const saved = localStorage.getItem('sm_products');

    if (saved && savedVersion === SM_CATALOG_VERSION) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        return initialProducts;
      }
    }

    // Auto-migrate cached products to new authentic images
    localStorage.setItem('sm_catalog_version', SM_CATALOG_VERSION);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const initialMap = new Map(initialProducts.map(p => [p.id, p.image]));
          const updated = parsed.map(p => {
            if (initialMap.has(p.id)) {
              return { ...p, image: initialMap.get(p.id) };
            }
            return p;
          });
          localStorage.setItem('sm_products', JSON.stringify(updated));
          return updated;
        }
      } catch (e) {}
    }

    localStorage.setItem('sm_products', JSON.stringify(initialProducts));
    return initialProducts;
  });

  // Sync products with backend REST API on mount
  useEffect(() => {
    const syncBackendCatalog = async () => {
      const backendProducts = await apiFetchProducts();
      if (backendProducts && backendProducts.length > 0) {
        setProducts(backendProducts);
      }
    };
    syncBackendCatalog();
  }, []);


  // POS Sales (real store sales)
  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sm_sales');
    return saved ? JSON.parse(saved) : [];
  });

  // Transactions
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('sm_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Cart / Shopping List
  const [shoppingList, setShoppingList] = useState(() => {
    const saved = localStorage.getItem('sm_shopping_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(item => ({ ...item, quantity: item.quantity || 1 }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Customer Auth (Default NULL = Non-logged-in guest visitor on initial web page load)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Online Orders (Delivery, Take Away, Scan & Go)
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('sm_orders');
    return saved ? JSON.parse(saved) : [];
  });


  // Real-time Activity Ticker Notifications
  const [liveTicker, setLiveTicker] = useState([
    { id: 1, text: '⚡ Express 15-min delivery available across Bengaluru', time: 'Just now', type: 'offer' },
    { id: 2, text: '📦 Fresh organic fruits & vegetables restocked in Aisle 7 & 8', time: '2m ago', type: 'stock' }
  ]);

  const [isSimulating, setIsSimulating] = useState(true);

  // Persistence
  useEffect(() => {
    localStorage.setItem('sm_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sm_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('sm_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sm_shopping_list', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem('sm_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sm_orders', JSON.stringify(orders));
  }, [orders]);

  // Real-Time Background Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setOrders(prevOrders => {
        let changed = false;
        const updated = prevOrders.map(order => {
          // Status progression rules
          if (order.status === 'PLACED') {
            changed = true;
            return {
              ...order,
              status: 'CONFIRMED',
              confirmedAt: new Date().toISOString()
            };
          }
          if (order.status === 'CONFIRMED') {
            changed = true;
            return {
              ...order,
              status: 'PACKING',
              packingAt: new Date().toISOString()
            };
          }
          if (order.status === 'PACKING') {
            changed = true;
            if (order.type === 'DELIVERY') {
              return {
                ...order,
                status: 'OUT_FOR_DELIVERY',
                dispatchedAt: new Date().toISOString(),
                rider: order.rider || {
                  name: 'Vikram Singh',
                  phone: '+91 98450 11223',
                  rating: 4.85,
                  trips: 890,
                  bikeNo: 'KA 01 EK 9024',
                  avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
                  progressPercent: 20
                }
              };
            } else if (order.type === 'TAKEAWAY') {
              return {
                ...order,
                status: 'READY_FOR_PICKUP',
                readyAt: new Date().toISOString()
              };
            } else if (order.type === 'SELF_CHECKOUT') {
              return {
                ...order,
                status: 'READY_TO_EXIT',
                readyAt: new Date().toISOString()
              };
            }
          }
          if (order.status === 'OUT_FOR_DELIVERY' && order.rider) {
            const currentProg = order.rider.progressPercent || 20;
            if (currentProg < 95) {
              changed = true;
              const nextProg = Math.min(95, currentProg + 15);
              const remainingEta = Math.max(2, Math.round(order.etaMinutes * (1 - nextProg / 100)));
              return {
                ...order,
                etaMinutes: remainingEta,
                rider: { ...order.rider, progressPercent: nextProg }
              };
            }
          }
          return order;
        });

        return changed ? updated : prevOrders;
      });
    }, 14000); // Check every 14 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Auth Functions
  const loginCustomer = (customerData) => {
    setCurrentUser(customerData);
    soundEffects.playNotificationPing();
  };

  const logoutCustomer = () => {
    setCurrentUser(null);
  };

  const switchCustomerProfile = (customerId) => {
    const found = DEMO_CUSTOMERS.find(c => c.id === customerId);
    if (found) {
      setCurrentUser(found);
      soundEffects.playNotificationPing();
    }
  };

  // Cart & Shopping List Functions
  const addToShoppingList = (product, qty = 1) => {
    setShoppingList(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });
    soundEffects.playScanBeep();
  };

  const updateCartQuantity = (productId, delta) => {
    setShoppingList(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromShoppingList = (productId) => {
    setShoppingList(prev => prev.filter(item => item.id !== productId));
  };

  const clearShoppingList = () => {
    setShoppingList([]);
  };

  // Order Placement (Delivery, Take Away, Self Checkout)
  const placeCustomerOrder = ({
    type = 'DELIVERY',
    items = [],
    deliveryDetails = {},
    takeawayDetails = {},
    selfCheckoutDetails = {},
    paymentMode = 'UPI',
    discount = 0,
    deliveryFee = 0,
    tax = 0,
    grandTotal = 0,
    subtotal = 0
  }) => {
    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const date = new Date().toISOString();

    const newOrder = {
      id: orderId,
      type,
      status: 'PLACED',
      customerId: currentUser?.id || 'cust_guest',
      customerName: currentUser?.name || 'Customer',
      customerPhone: currentUser?.phone || '+91 99999 00000',
      createdAt: date,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        image: item.image,
        aisle: item.aisle,
        shelf: item.shelf
      })),
      subtotal,
      discount,
      deliveryFee,
      tax,
      grandTotal,
      paymentMode,
      // Delivery
      deliveryAddress: deliveryDetails.address || currentUser?.address || '123 Market Street, Bengaluru',
      deliverySpeed: deliveryDetails.speed || 'EXPRESS',
      deliveryInstructions: deliveryDetails.instructions || '',
      etaMinutes: deliveryDetails.speed === 'EXPRESS' ? 15 : 45,
      otp: String(Math.floor(1000 + Math.random() * 9000)),
      rider: {
        name: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        rating: 4.9,
        trips: 1420,
        bikeNo: 'KA 05 MN 4821',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
        progressPercent: 10
      },
      // Takeaway
      pickupCounter: takeawayDetails.counter || 'Express Counter #02',
      lockerPin: String(Math.floor(1000 + Math.random() * 9000)),
      pickupCode: 'TKW-' + orderId.replace('ORD-', ''),
      pickupSlot: takeawayDetails.slot || 'Ready in 15 mins',
      // Self Checkout
      exitPassQR: 'PASS-' + orderId,
      gateNumber: 'Express SmartGate 01'
    };

    // Sync with backend API if server is running
    apiCreateOrder({
      type,
      items,
      paymentMode,
      subtotal,
      discount,
      deliveryFee,
      tax,
      grandTotal,
      selfCheckoutDetails
    }).catch(err => console.warn('Order saved to local context (backend server offline):', err));

    // Deduct stock
    setProducts(prevProducts => prevProducts.map(p => {
      const orderItem = items.find(i => i.id === p.id);
      if (orderItem) {
        return { ...p, stock: Math.max(0, p.stock - orderItem.quantity) };
      }
      return p;
    }));

    // Record in sales history as online order
    const saleRecord = {
      id: orderId,
      date,
      staff: type === 'DELIVERY' ? 'Online Delivery' : type === 'TAKEAWAY' ? 'Store Pickup' : 'Self-Checkout',
      total: grandTotal,
      paymentMode,
      status: 'In Progress',
      items: items.map(item => ({ productId: item.id, qty: item.quantity, price: item.price }))
    };
    setSales(prev => [saleRecord, ...prev]);

    setOrders(prev => [newOrder, ...prev]);
    clearShoppingList();

    // Reward loyalty points
    if (currentUser) {
      const earnedPoints = Math.floor(grandTotal / 10);
      setCurrentUser(prev => ({
        ...prev,
        loyaltyPoints: (prev.loyaltyPoints || 0) + earnedPoints
      }));
    }


    // Sound effect
    soundEffects.playSuccessChime();

    return orderId;
  };

  // Status Modifiers for Staff or Simulation
  const advanceOrderStatus = (orderId) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      if (order.status === 'PLACED') return { ...order, status: 'CONFIRMED' };
      if (order.status === 'CONFIRMED') return { ...order, status: 'PACKING' };
      if (order.status === 'PACKING') {
        if (order.type === 'DELIVERY') return { ...order, status: 'OUT_FOR_DELIVERY', etaMinutes: 10, rider: { ...order.rider, progressPercent: 30 } };
        if (order.type === 'TAKEAWAY') return { ...order, status: 'READY_FOR_PICKUP' };
        return { ...order, status: 'READY_TO_EXIT' };
      }
      if (order.status === 'OUT_FOR_DELIVERY') {
        const prog = order.rider?.progressPercent || 30;
        if (prog < 90) {
          return { ...order, rider: { ...order.rider, progressPercent: 90 }, etaMinutes: 2 };
        }
        return { ...order, status: 'DELIVERED', completedAt: new Date().toISOString(), rider: { ...order.rider, progressPercent: 100 } };
      }
      if (order.status === 'READY_FOR_PICKUP') return { ...order, status: 'COLLECTED', completedAt: new Date().toISOString() };
      if (order.status === 'READY_TO_EXIT') return { ...order, status: 'COMPLETED', completedAt: new Date().toISOString() };

      return order;
    }));
    soundEffects.playNotificationPing();
  };

  const completeOrderImmediately = (orderId) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const finalStatus = order.type === 'DELIVERY' ? 'DELIVERED' : order.type === 'TAKEAWAY' ? 'COLLECTED' : 'COMPLETED';
      return {
        ...order,
        status: finalStatus,
        completedAt: new Date().toISOString(),
        rider: order.rider ? { ...order.rider, progressPercent: 100 } : undefined
      };
    }));
    soundEffects.playSuccessChime();
  };

  const cancelOrder = (orderId) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return { ...order, status: 'CANCELLED' };
    }));
  };

  // Staff POS sale processing
  const processSale = (cart, paymentMode, staff = 'Admin') => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const invoiceId = 'INV' + Math.floor(Math.random() * 100000);
    const date = new Date().toISOString();

    const saleRecord = {
      id: invoiceId,
      date,
      staff,
      total,
      paymentMode,
      status: 'Completed',
      items: cart.map(item => ({ productId: item.id, qty: item.quantity, price: item.price }))
    };

    const newTransactions = cart.map(item => ({
      id: 'TXN' + Math.floor(Math.random() * 100000),
      date,
      productId: item.id,
      type: 'SALE',
      quantity: -item.quantity,
      reference: invoiceId,
      staff
    }));

    setSales(prev => [saleRecord, ...prev]);
    setTransactions(prev => [...newTransactions, ...prev]);
    
    // Decrease inventory
    setProducts(prevProducts => prevProducts.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    }));

    soundEffects.playSuccessChime();
    return invoiceId;
  };

  const receiveStock = (productId, quantity, supplierId, cost) => {
    const date = new Date().toISOString();
    const poNumber = 'PO' + Math.floor(Math.random() * 100000);
    
    const newTxn = {
      id: 'TXN' + Math.floor(Math.random() * 100000),
      date,
      productId,
      type: 'PURCHASE',
      quantity: parseInt(quantity, 10),
      reference: poNumber,
      staff: 'Admin'
    };

    setTransactions(prev => [newTxn, ...prev]);
    
    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === productId) {
        return { ...p, stock: p.stock + parseInt(quantity, 10) };
      }
      return p;
    }));
    soundEffects.playNotificationPing();
  };

  // Parked Carts for Cashier POS
  const [parkedCarts, setParkedCarts] = useState(() => {
    const saved = localStorage.getItem('sm_parked_carts');
    return saved ? JSON.parse(saved) : [];
  });

  // Turnstile Gate Simulation State
  const [gateStatus, setGateStatus] = useState({
    isOpen: false,
    orderId: null,
    gateId: 'SmartGate-01',
    customerName: null,
    timestamp: null
  });

  // Live Activity Feed for Staff Dashboard & Tickers
  const [activityFeed, setActivityFeed] = useState(() => [
    { id: 1, type: 'SALE', title: 'POS Bill #INV1010 generated', detail: '₹130.00 • Counter 1', time: '5m ago', timestamp: Date.now() - 300000 },
    { id: 2, type: 'SCAN_GO', title: 'Self-Checkout Pass Validated', detail: 'SmartGate 01 • Turnstile Cleared', time: '12m ago', timestamp: Date.now() - 720000 },
    { id: 3, type: 'RESTOCK', title: 'Stock Restock PO103 received', detail: 'Britannia Cheese Slices (+20)', time: '25m ago', timestamp: Date.now() - 1500000 },
    { id: 4, type: 'ORDER', title: 'New Express Delivery Placed', detail: 'ORD-88210 • Ananya Iyer', time: '35m ago', timestamp: Date.now() - 2100000 }
  ]);

  const logActivity = (type, title, detail) => {
    const newEvent = {
      id: Date.now(),
      type,
      title,
      detail,
      time: 'Just now',
      timestamp: Date.now()
    };
    setActivityFeed(prev => [newEvent, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    localStorage.setItem('sm_parked_carts', JSON.stringify(parkedCarts));
  }, [parkedCarts]);

  // Park a cart
  const parkCart = (cartItems, customerPhone = '', customerName = 'Guest') => {
    if (!cartItems || cartItems.length === 0) return;
    const parkId = 'PARK-' + Math.floor(100 + Math.random() * 900);
    const newPark = {
      id: parkId,
      items: cartItems,
      customerPhone,
      customerName,
      total: cartItems.reduce((s, i) => s + (i.price * i.quantity), 0),
      parkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setParkedCarts(prev => [newPark, ...prev]);
    soundEffects.playNotificationPing();
    logActivity('POS', `Cart Parked (${parkId})`, `${cartItems.length} items • ${customerName}`);
    return parkId;
  };

  const deleteParkedCart = (id) => {
    setParkedCarts(prev => prev.filter(c => c.id !== id));
  };

  // Trigger Smart Turnstile Gate Clearance
  const triggerGateUnlock = (orderId, gateId = 'SmartGate 01', customerName = 'Customer') => {
    soundEffects.playGateUnlock();
    setGateStatus({
      isOpen: true,
      orderId,
      gateId,
      customerName,
      timestamp: new Date().toLocaleTimeString()
    });

    logActivity('SCAN_GO', `Turnstile Gate Unlocked`, `${gateId} • Pass #${orderId}`);

    // Auto-close gate after 7 seconds
    setTimeout(() => {
      setGateStatus(prev => ({ ...prev, isOpen: false }));
    }, 7000);
  };

  // Staff Security Scan & Go Verification
  const verifyScanAndGoPass = (orderId, staffName = 'Gate Security Officer') => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId || order.exitPassQR === orderId) {
        return {
          ...order,
          status: 'COMPLETED',
          securityVerified: true,
          verifiedAt: new Date().toISOString(),
          verifiedBy: staffName
        };
      }
      return order;
    }));

    triggerGateUnlock(orderId, 'SmartGate 01', 'Verified Customer');
    soundEffects.playSuccessChime();
    logActivity('SECURITY', `Scan & Go Order Verified`, `Bag check match 100% • Auth by ${staffName}`);
  };

  // Inline Stock Adjuster & REST API Database Sync
  const adjustProductStock = (productId, delta, reason = 'Quick Adjustment') => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    const newStock = Math.max(0, targetProduct.stock + delta);
    const date = new Date().toISOString();

    const txn = {
      id: 'TXN' + Math.floor(Math.random() * 100000),
      date,
      productId,
      type: delta > 0 ? 'PURCHASE' : 'SALE',
      quantity: delta,
      reference: 'ADJ-' + reason.replace(/\s+/g, '_').toUpperCase(),
      staff: 'Admin'
    };

    setTransactions(prev => [txn, ...prev]);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    
    // Sync stock with REST API SQLite database
    apiUpdateProductStock(productId, newStock).catch(err => console.warn('Stock update database note:', err));

    if (delta > 0) {
      soundEffects.playNotificationPing();
    } else {
      soundEffects.playScanBeep();
    }

    logActivity('STOCK', `Stock Adjusted: ${targetProduct.name}`, `${delta > 0 ? '+' : ''}${delta} units (${newStock} remaining)`);
  };

  // Add New Product to Store Catalog & REST API Database
  const addNewProduct = (productData) => {
    const newId = 'PRD-' + Date.now();
    const formattedProduct = {
      id: newId,
      productCode: productData.productCode || newId,
      barcode: productData.barcode || String(Math.floor(8900000000000 + Math.random() * 900000000000)),
      name: productData.name,
      category: productData.category || 'General',
      price: Number(productData.price) || 0,
      mrp: Number(productData.mrp) || Number(productData.price) || 0,
      stock: Number(productData.stock) || 50,
      unit: productData.unit || '1 unit',
      aisle: Number(productData.aisle) || 1,
      shelf: Number(productData.shelf) || 1,
      image: productData.image && productData.image !== 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'
        ? productData.image
        : (getCuratedProductImage(productData.name) || getCategoryFallbackImage(productData.category)),
      dietary: productData.dietary || []
    };

    setProducts(prev => [formattedProduct, ...prev]);
    apiAddProduct(formattedProduct).catch(err => console.warn('Add product database note:', err));
    soundEffects.playSuccessChime();
    logActivity('STOCK', `New Product Added: ${formattedProduct.name}`, `Aisle ${formattedProduct.aisle} • ₹${formattedProduct.price}`);
    return formattedProduct;
  };

  // Available Promotional Coupons
  const PROMO_COUPONS = {
    'SCAN10': { code: 'SCAN10', type: 'PERCENT', value: 10, label: '10% Instant Off on Scan & Go', minOrder: 100 },
    'SUPER50': { code: 'SUPER50', type: 'FLAT', value: 50, label: '₹50 Off on orders above ₹300', minOrder: 300 },
    'FREEMILK': { code: 'FREEMILK', type: 'FLAT', value: 27, label: 'Free Amul Milk (₹27 Off)', minOrder: 150 },
    'STAFF15': { code: 'STAFF15', type: 'PERCENT', value: 15, label: '15% Employee / Staff Discount', minOrder: 50 }
  };

  const validateCoupon = (code, subtotal) => {
    const upper = (code || '').trim().toUpperCase();
    const coupon = PROMO_COUPONS[upper];
    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }
    if (subtotal < coupon.minOrder) {
      return { valid: false, error: `Minimum order value of ₹${coupon.minOrder} required` };
    }
    const discountAmount = coupon.type === 'PERCENT' ? (subtotal * (coupon.value / 100)) : coupon.value;
    return {
      valid: true,
      coupon,
      discount: discountAmount
    };
  };

  const getProductAvailability = (input, reorderLevel) => {
    let targetStock = null;
    let targetReorder = Number(reorderLevel) || 15;

    if (typeof input === 'object' && input !== null) {
      targetStock = Number(input.stock);
      targetReorder = Number(input.reorderLevel) || targetReorder;
    } else if (typeof input === 'string') {
      const product = products.find(p => p.id === input || p.productCode === input || p.barcode === input);
      if (product) {
        targetStock = Number(product.stock);
        targetReorder = Number(product.reorderLevel) || targetReorder;
      }
    } else if (typeof input === 'number') {
      targetStock = input;
    }

    if (targetStock === null || isNaN(targetStock) || targetStock <= 0) {
      return { status: 'OUT_OF_STOCK', text: 'Out of Stock', color: 'red' };
    }
    if (targetStock <= targetReorder) {
      return { status: 'LOW_STOCK', text: 'Low Stock', color: 'amber' };
    }
    return { status: 'IN_STOCK', text: 'In Stock', color: 'emerald' };
  };

  // Store Settings Manager
  const updateStoreSettings = (newSettings) => {
    setStoreSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('sm_store_settings', JSON.stringify(updated));
      return updated;
    });
    soundEffects.playNotificationPing();
  };

  // Add Recipe Ingredients to Shopping List in 1 click
  const addRecipeToCart = (recipeOrId) => {
    let recipe = typeof recipeOrId === 'object' ? recipeOrId : popularRecipes.find(r => r.id === recipeOrId);
    if (!recipe) return 0;

    const itemsToAdd = products.filter(p => recipe.productIds.includes(p.id));
    if (itemsToAdd.length === 0) return 0;

    setShoppingList(prev => {
      let nextList = [...prev];
      itemsToAdd.forEach(prod => {
        const idx = nextList.findIndex(item => item.id === prod.id);
        if (idx >= 0) {
          nextList[idx] = { ...nextList[idx], quantity: nextList[idx].quantity + 1 };
        } else {
          nextList.push({ ...prod, quantity: 1 });
        }
      });
      return nextList;
    });

    soundEffects.playSuccessChime();
    logActivity('CART', `Recipe Ingredients Added`, `${recipe.name} (${itemsToAdd.length} items)`);
    return itemsToAdd.length;
  };

  // Reset demo data to factory state
  const resetToDefaultData = () => {
    localStorage.removeItem('sm_products');
    localStorage.removeItem('sm_sales');
    localStorage.removeItem('sm_transactions');
    localStorage.removeItem('sm_shopping_list');
    localStorage.removeItem('sm_orders');
    localStorage.removeItem('sm_store_settings');
    localStorage.removeItem('sm_parked_carts');

    setProducts(initialProducts);
    setSales(initialSales);
    setTransactions(initialTransactions);
    setShoppingList([]);
    setOrders(INITIAL_ORDERS);
    setStoreSettings(DEFAULT_STORE_SETTINGS);
    setParkedCarts([]);
    setCurrentUser(DEMO_CUSTOMERS[0]);

    soundEffects.playSuccessChime();
  };

  return (
    <SupermarketContext.Provider value={{
      products,
      sales,
      transactions,
      shoppingList,
      currentUser,
      orders,
      liveTicker,
      activityFeed,
      gateStatus,
      parkedCarts,
      PROMO_COUPONS,
      storeSettings,
      popularRecipes,
      isSimulating,
      setIsSimulating,
      loginCustomer,
      logoutCustomer,
      switchCustomerProfile,
      addToShoppingList,
      updateCartQuantity,
      removeFromShoppingList,
      clearShoppingList,
      addRecipeToCart,
      placeCustomerOrder,
      advanceOrderStatus,
      completeOrderImmediately,
      cancelOrder,
      processSale,
      receiveStock,
      getProductAvailability,
      parkCart,
      deleteParkedCart,
      triggerGateUnlock,
      verifyScanAndGoPass,
      adjustProductStock,
      addNewProduct,
      validateCoupon,
      updateStoreSettings,
      resetToDefaultData,
      logActivity
    }}>
      {children}
    </SupermarketContext.Provider>
  );
};

