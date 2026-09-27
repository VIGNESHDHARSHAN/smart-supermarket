import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialProducts, initialSales, initialTransactions, popularRecipes } from '../data/mockData';
import { soundEffects } from '../lib/audio';
import { 
  apiFetchProducts, 
  apiCreateOrder, 
  apiAddProduct, 
  apiUpdateProductStock,
  apiFetchDeliveryPartners,
  apiAddDeliveryPartner,
  apiUpdateDeliveryPartnerStatus,
  apiDeleteDeliveryPartner,
  apiFetchStaffMembers,
  apiAddStaffMember,
  apiUpdateStaffStatus,
  apiDeleteStaffMember
} from '../services/api';
import { getCategoryFallbackImage, getCuratedProductImage } from '../services/imageService';
import { checkStoreOpenStatus } from '../lib/storeHours';

const SupermarketContext = createContext();

export const useSupermarket = () => useContext(SupermarketContext);

export const DEFAULT_STORE_SETTINGS = {
  storeName: 'SmartMart Express Supermarket',
  storeAddress: '100ft Road, Indiranagar, Bengaluru - 560038',
  storePhone: '+91 80 4912 3456',
  openingTime: '07:00', // 7:00 AM
  closingTime: '23:00', // 11:00 PM
  enforceStoreHours: true, // Customer purchases restricted to store operating hours
  storeStatusOverride: 'AUTO', // 'AUTO' (system clock), 'FORCE_OPEN' (demo), 'FORCE_CLOSED' (demo)
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

export const DEFAULT_DELIVERY_PARTNERS = [
  {
    id: 'DLV_001',
    name: 'Rajesh Kumar',
    email: 'rajesh@smartmart.com',
    phone: '+91 98765 43210',
    password: '1234',
    vehicleType: 'Electric Scooter',
    vehicleNo: 'KA 05 MN 4821',
    shift: 'Morning (07:00 - 15:00)',
    status: 'AVAILABLE',
    rating: 4.9,
    completedTrips: 142,
    activeOrders: 0,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face'
  },
  {
    id: 'DLV_002',
    name: 'Vikram Singh',
    email: 'vikram@smartmart.com',
    phone: '+91 98450 11223',
    password: '1234',
    vehicleType: 'Motorcycle',
    vehicleNo: 'KA 01 EK 9024',
    shift: 'Afternoon (14:00 - 22:00)',
    status: 'AVAILABLE',
    rating: 4.85,
    completedTrips: 98,
    activeOrders: 0,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face'
  },
  {
    id: 'DLV_003',
    name: 'Sunita Rao',
    email: 'sunita@smartmart.com',
    phone: '+91 97410 55667',
    password: '1234',
    vehicleType: 'Electric Scooter',
    vehicleNo: 'KA 03 GH 1129',
    shift: 'Full Day (09:00 - 18:00)',
    status: 'AVAILABLE',
    rating: 4.95,
    completedTrips: 175,
    activeOrders: 0,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face'
  }
];

export const DEFAULT_STAFF_MEMBERS = [
  {
    id: 'MGR_001',
    name: 'Rohan Mehra',
    email: 'manager@smartmart.com',
    phone: '+91 98800 11223',
    password: 'manager123',
    role: 'MANAGER',
    designation: 'Store General Manager',
    department: 'Store Operations & Administration',
    shift: 'General (09:00 - 19:00)',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face'
  },
  {
    id: 'STF_001',
    name: 'Priya Sundaram',
    email: 'priya.cashier@smartmart.com',
    phone: '+91 98451 22334',
    password: 'staff123',
    role: 'STAFF',
    designation: 'Senior Cashier & POS Operator',
    department: 'Billing & Front Counter',
    shift: 'Morning (07:00 - 15:00)',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=face'
  },
  {
    id: 'STF_002',
    name: 'Arun Verma',
    email: 'arun.inventory@smartmart.com',
    phone: '+91 97412 88990',
    password: 'staff123',
    role: 'STAFF',
    designation: 'Inventory & Stock Supervisor',
    department: 'Warehouse & Aisles',
    shift: 'Afternoon (14:00 - 22:00)',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face'
  },
  {
    id: 'STF_003',
    name: 'Kavita Nair',
    email: 'kavita.floor@smartmart.com',
    phone: '+91 99001 44556',
    password: 'staff123',
    role: 'STAFF',
    designation: 'Floor Associate & Customer Assist',
    department: 'Customer Experience',
    shift: 'Full Day (09:00 - 18:00)',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face'
  }
];

const INITIAL_ORDERS = [];

const SM_CATALOG_VERSION = 'v4_authentic_proper_images';

export const SupermarketProvider = ({ children }) => {
  // Store Settings (Tax, delivery rules, hardware timeouts, store operating hours)
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('sm_store_settings');
    return saved ? { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_STORE_SETTINGS;
  });

  // Real-time Store Open/Closed Status for customer purchases
  const [storeStatus, setStoreStatus] = useState(() => checkStoreOpenStatus(storeSettings));
  // Global AI Chatbot Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const openAiAssistant = () => setAiModalOpen(true);
  const closeAiAssistant = () => setAiModalOpen(false);

  useEffect(() => {
    const refreshStatus = () => {
      setStoreStatus(checkStoreOpenStatus(storeSettings));
    };
    refreshStatus();
    const timer = setInterval(refreshStatus, 30000); // Check every 30s
    return () => clearInterval(timer);
  }, [storeSettings]);

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

  // Staff Auth State
  const [currentStaff, setCurrentStaff] = useState(() => {
    const saved = localStorage.getItem('sm_staff_session');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id && (parsed.role === 'Supermarket Operator' || parsed.role === 'MANAGER' || parsed.role === 'STAFF' || parsed.role === 'ADMIN' || parsed.role === 'Store Staff')) {
        return parsed;
      }
    } catch (e) {}
    return null;
  });

  // Delivery Partner Auth State (Dedicated login for delivery executives)
  const [currentDeliveryPartner, setCurrentDeliveryPartner] = useState(() => {
    const saved = localStorage.getItem('sm_delivery_session');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) return parsed;
    } catch (e) {}
    return null;
  });

  // Delivery Fleet Partners (Live manager-managed delivery personnel)
  const [deliveryPartners, setDeliveryPartners] = useState(() => {
    const saved = localStorage.getItem('sm_delivery_partners');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_DELIVERY_PARTNERS;
  });

  // Working Store Staff & Managers (Managed strictly by Store Manager)
  const [staffMembers, setStaffMembers] = useState(() => {
    const saved = localStorage.getItem('sm_staff_members');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_STAFF_MEMBERS;
  });

  // Sync delivery partners with backend API on mount
  useEffect(() => {
    const syncDeliveryPartners = async () => {
      const backendPartners = await apiFetchDeliveryPartners();
      if (backendPartners && backendPartners.length > 0) {
        setDeliveryPartners(backendPartners);
      }
    };
    syncDeliveryPartners();
  }, []);

  // Sync staff members with backend API on mount
  useEffect(() => {
    const syncStaffMembers = async () => {
      const backendStaff = await apiFetchStaffMembers();
      if (backendStaff && backendStaff.length > 0) {
        setStaffMembers(backendStaff);
      }
    };
    syncStaffMembers();
  }, []);

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
    if (currentUser) {
      localStorage.setItem('sm_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sm_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sm_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('sm_delivery_partners', JSON.stringify(deliveryPartners));
  }, [deliveryPartners]);

  useEffect(() => {
    localStorage.setItem('sm_staff_members', JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    if (currentDeliveryPartner) {
      localStorage.setItem('sm_delivery_session', JSON.stringify(currentDeliveryPartner));
    } else {
      localStorage.removeItem('sm_delivery_session');
    }
  }, [currentDeliveryPartner]);

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

  // Manager Role Privilege Evaluator
  const isManager = Boolean(
    currentStaff && 
    (currentStaff.role === 'MANAGER' || 
     currentStaff.role === 'ADMIN' || 
     currentStaff.role === 'Store Manager' || 
     currentStaff.designation?.toLowerCase().includes('manager'))
  );

  // Staff Authorization Functions
  const loginStaff = (staffData = {}) => {
    const isMgr = staffData.role === 'MANAGER' || staffData.role === 'ADMIN' || staffData.role === 'Store Manager';
    const session = {
      id: staffData.id || (isMgr ? 'MGR_001' : 'STF_001'),
      name: staffData.name || (isMgr ? 'Rohan Mehra' : 'Store Associate'),
      email: staffData.email || (isMgr ? 'manager@smartmart.com' : 'staff@smartmart.com'),
      phone: staffData.phone || '+91 98800 11223',
      role: isMgr ? 'MANAGER' : 'STAFF',
      designation: staffData.designation || (isMgr ? 'Store General Manager' : 'Store Associate & Cashier'),
      department: staffData.department || (isMgr ? 'Store Operations & Administration' : 'Billing & Store Floor'),
      shift: staffData.shift || 'General Shift',
      centerName: storeSettings?.storeName || 'SmartMart Express Supermarket',
      centerCode: 'BLR-IND-102',
      loginTime: new Date().toISOString()
    };
    setCurrentStaff(session);
    localStorage.setItem('sm_staff_session', JSON.stringify(session));
    soundEffects.playSuccessChime();
    return session;
  };

  const logoutStaff = () => {
    setCurrentStaff(null);
    localStorage.removeItem('sm_staff_session');
    soundEffects.playNotificationPing();
  };

  // Staff Team Management Functions (Manager Exclusive)
  const addStaffMember = async (staffData) => {
    if (!isManager) {
      throw new Error('Permission denied: Only Store Manager can onboard new working staff.');
    }
    const newId = (staffData.role === 'MANAGER' ? 'MGR_' : 'STF_') + Date.now().toString().slice(-6);
    const newStaff = {
      id: newId,
      name: staffData.name.trim(),
      email: staffData.email.trim().toLowerCase(),
      phone: staffData.phone.trim(),
      password: (staffData.password || 'staff123').trim(),
      role: staffData.role === 'MANAGER' ? 'MANAGER' : 'STAFF',
      designation: staffData.designation ? staffData.designation.trim() : (staffData.role === 'MANAGER' ? 'Assistant Store Manager' : 'Store Associate & Cashier'),
      department: staffData.department ? staffData.department.trim() : 'Store Floor & Billing',
      shift: staffData.shift || 'Morning (07:00 - 15:00)',
      status: 'ACTIVE',
      avatar: staffData.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(staffData.name)}`
    };

    setStaffMembers(prev => [newStaff, ...prev]);
    try {
      await apiAddStaffMember(newStaff, currentStaff?.role || 'MANAGER');
    } catch (e) {
      console.warn('Backend sync note on addStaffMember:', e.message);
    }
    logActivity('STAFF', 'New Staff Member Onboarded', `${newStaff.name} • ${newStaff.designation}`);
    soundEffects.playSuccessChime();
    return newStaff;
  };

  const updateStaffStatus = async (staffId, status) => {
    if (!isManager) {
      throw new Error('Permission denied: Only Store Manager can modify staff status.');
    }
    setStaffMembers(prev => prev.map(s => (s.id === staffId || s._id === staffId) ? { ...s, status } : s));
    try {
      await apiUpdateStaffStatus(staffId, status, currentStaff?.role || 'MANAGER');
    } catch (e) {
      console.warn('Backend sync note on updateStaffStatus:', e.message);
    }
    soundEffects.playNotificationPing();
  };

  const deleteStaffMember = async (staffId) => {
    if (!isManager) {
      throw new Error('Permission denied: Only Store Manager can remove staff members.');
    }
    setStaffMembers(prev => prev.filter(s => s.id !== staffId && s._id !== staffId));
    try {
      await apiDeleteStaffMember(staffId, currentStaff?.role || 'MANAGER');
    } catch (e) {
      console.warn('Backend sync note on deleteStaffMember:', e.message);
    }
    soundEffects.playNotificationPing();
  };

  // Delivery Partner Auth Functions
  const loginDeliveryPartner = (partnerData) => {
    setCurrentDeliveryPartner(partnerData);
    localStorage.setItem('sm_delivery_session', JSON.stringify(partnerData));
    soundEffects.playSuccessChime();
    return partnerData;
  };

  const logoutDeliveryPartner = () => {
    setCurrentDeliveryPartner(null);
    localStorage.removeItem('sm_delivery_session');
    soundEffects.playNotificationPing();
  };

  // Delivery Fleet Management Functions (Manager Exclusive)
  const addDeliveryPartner = async (partnerData) => {
    if (!isManager) {
      throw new Error('Permission denied: Only Store Manager can onboard new delivery partners.');
    }
    const newId = 'DLV_' + Date.now().toString().slice(-6);
    const newPartner = {
      id: newId,
      name: partnerData.name.trim(),
      email: (partnerData.email || `${partnerData.phone.replace(/\D/g, '')}@smartmart.com`).toLowerCase().trim(),
      phone: partnerData.phone.trim(),
      password: String(partnerData.password || '1234').trim(),
      vehicleType: partnerData.vehicleType || 'Electric Scooter',
      vehicleNo: (partnerData.vehicleNo || 'KA 01 AB 1234').trim().toUpperCase(),
      shift: partnerData.shift || 'Standard (08:00 - 18:00)',
      status: 'AVAILABLE',
      rating: 5.0,
      completedTrips: 0,
      activeOrders: 0,
      avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(partnerData.name)}`
    };

    setDeliveryPartners(prev => [newPartner, ...prev]);
    try {
      await apiAddDeliveryPartner(newPartner, currentStaff?.role || 'MANAGER');
    } catch (e) {
      console.warn('Backend sync note on addDeliveryPartner:', e.message);
    }
    logActivity('DELIVERY', 'New Delivery Partner Added', `${newPartner.name} • ${newPartner.vehicleNo}`);
    soundEffects.playSuccessChime();
    return newPartner;
  };

  const updateDeliveryPartnerStatus = (partnerId, status) => {
    setDeliveryPartners(prev => prev.map(p => p.id === partnerId ? { ...p, status } : p));
    apiUpdateDeliveryPartnerStatus(partnerId, status).catch(() => {});
    soundEffects.playNotificationPing();
  };

  const deleteDeliveryPartner = async (partnerId) => {
    if (!isManager) {
      throw new Error('Permission denied: Only Store Manager can remove delivery partners.');
    }
    setDeliveryPartners(prev => prev.filter(p => p.id !== partnerId));
    try {
      await apiDeleteDeliveryPartner(partnerId, currentStaff?.role || 'MANAGER');
    } catch (e) {
      console.warn('Backend sync note on deleteDeliveryPartner:', e.message);
    }
    soundEffects.playNotificationPing();
  };

  const freeUpRider = (riderId) => {
    if (!riderId) return;
    setDeliveryPartners(prev => prev.map(p => {
      if (p.id === riderId) {
        return {
          ...p,
          status: 'AVAILABLE',
          activeOrders: Math.max(0, (p.activeOrders || 1) - 1),
          completedTrips: (p.completedTrips || 0) + 1
        };
      }
      return p;
    }));
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
    // Check if store is open for customer purchases
    const currentStatus = checkStoreOpenStatus(storeSettings);
    if (!currentStatus.isOpen) {
      soundEffects.playErrorBuzzer();
      alert(`⛔ Store is Currently Closed: ${currentStatus.message}\n\nPurchases are only accepted between ${currentStatus.formattedHours}.`);
      return null;
    }

    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const date = new Date().toISOString();

    // Automatic Delivery Partner Allocation for Online Delivery
    let allocatedRider = null;
    if (type === 'DELIVERY') {
      const available = deliveryPartners.filter(p => p.status === 'AVAILABLE');
      let candidate = null;
      if (available.length > 0) {
        candidate = [...available].sort((a, b) => (a.activeOrders || 0) - (b.activeOrders || 0))[0];
      } else {
        const online = deliveryPartners.filter(p => p.status !== 'OFFLINE');
        if (online.length > 0) {
          candidate = [...online].sort((a, b) => (a.activeOrders || 0) - (b.activeOrders || 0))[0];
        } else if (deliveryPartners.length > 0) {
          candidate = deliveryPartners[0];
        }
      }

      if (candidate) {
        allocatedRider = {
          id: candidate.id,
          name: candidate.name,
          phone: candidate.phone,
          rating: candidate.rating || 4.9,
          trips: (candidate.completedTrips || 100) + 1,
          bikeNo: candidate.vehicleNo,
          vehicleType: candidate.vehicleType || 'Electric Scooter',
          avatar: candidate.avatar,
          progressPercent: 15
        };

        // Mark partner as ON_DELIVERY and increment load
        setDeliveryPartners(prev => prev.map(p => {
          if (p.id === candidate.id) {
            return {
              ...p,
              status: 'ON_DELIVERY',
              activeOrders: (p.activeOrders || 0) + 1
            };
          }
          return p;
        }));

        logActivity('DELIVERY', 'Auto-Allocated Delivery Partner', `${candidate.name} (${candidate.vehicleNo}) assigned to Order #${orderId}`);
      }
    }

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
      rider: allocatedRider,
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
  // Status Modifiers for Staff or Simulation
  const advanceOrderStatus = (orderId, customRider = null) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      if (order.status === 'PLACED') return { ...order, status: 'CONFIRMED' };
      if (order.status === 'CONFIRMED') return { ...order, status: 'PACKING' };
      if (order.status === 'PACKING') {
        let assignedRider = order.rider;
        if (customRider) {
          assignedRider = {
            id: customRider.id,
            name: customRider.name,
            phone: customRider.phone,
            rating: customRider.rating || 4.9,
            trips: (customRider.completedTrips || 100) + 1,
            bikeNo: customRider.vehicleNo || customRider.bikeNo,
            vehicleType: customRider.vehicleType || 'Electric Scooter',
            avatar: customRider.avatar,
            progressPercent: 30
          };
          setDeliveryPartners(plist => plist.map(p => p.id === customRider.id ? { ...p, status: 'ON_DELIVERY', activeOrders: (p.activeOrders || 0) + 1 } : p));
        } else if (assignedRider) {
          assignedRider = { ...assignedRider, progressPercent: 30 };
        }

        if (order.type === 'DELIVERY') return { ...order, status: 'OUT_FOR_DELIVERY', etaMinutes: 10, rider: assignedRider };
        if (order.type === 'TAKEAWAY') return { ...order, status: 'READY_FOR_PICKUP' };
        return { ...order, status: 'READY_TO_EXIT' };
      }
      if (order.status === 'OUT_FOR_DELIVERY') {
        const prog = order.rider?.progressPercent || 30;
        if (prog < 90) {
          return { ...order, rider: { ...order.rider, progressPercent: 90 }, etaMinutes: 2 };
        }
        freeUpRider(order.rider?.id);
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
      if (order.type === 'DELIVERY') {
        freeUpRider(order.rider?.id);
      }
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
      if (order.rider?.id) {
        freeUpRider(order.rider.id);
      }
      return { ...order, status: 'CANCELLED' };
    }));
  };

  // Dedicated Delivery App Status Transition with OTP Verification
  const deliveryUpdateOrderStatus = (orderId, newStatus, otpInput = '') => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return { success: false, error: 'Order not found' };

    if (newStatus === 'DELIVERED') {
      if (targetOrder.otp && otpInput.trim() !== targetOrder.otp.trim()) {
        soundEffects.playErrorBuzzer();
        return { success: false, error: `Invalid Delivery OTP "${otpInput}". Please ask the customer for their 4-digit security code.` };
      }
      freeUpRider(targetOrder.rider?.id);
    }

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          ...(newStatus === 'OUT_FOR_DELIVERY' ? { dispatchedAt: new Date().toISOString(), rider: { ...o.rider, progressPercent: 50 } } : {}),
          ...(newStatus === 'DELIVERED' ? { completedAt: new Date().toISOString(), rider: { ...o.rider, progressPercent: 100 } } : {})
        };
      }
      return o;
    }));

    soundEffects.playSuccessChime();
    logActivity('DELIVERY', `Delivery Status: ${newStatus}`, `Order #${orderId} updated by Delivery Partner`);
    return { success: true };
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
      storeStatus,
      isStoreOpen: storeStatus.isOpen,
      popularRecipes,
      isSimulating,
      setIsSimulating,
      loginCustomer,
      logoutCustomer,
      switchCustomerProfile,
      currentStaff,
      isStaffAuthenticated: Boolean(currentStaff && currentStaff.id && ['Supermarket Operator', 'MANAGER', 'STAFF', 'ADMIN', 'Store Staff'].includes(currentStaff.role)),
      isManager,
      loginStaff,
      logoutStaff,
      staffMembers,
      addStaffMember,
      updateStaffStatus,
      deleteStaffMember,
      currentDeliveryPartner,
      deliveryPartners,
      isDeliveryAuthenticated: Boolean(currentDeliveryPartner && currentDeliveryPartner.id),
      loginDeliveryPartner,
      logoutDeliveryPartner,
      addDeliveryPartner,
      updateDeliveryPartnerStatus,
      deleteDeliveryPartner,
      deliveryUpdateOrderStatus,
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
      aiModalOpen,
      setAiModalOpen,
      openAiAssistant,
      closeAiAssistant,
      resetToDefaultData,
      logActivity
    }}>
      {children}
    </SupermarketContext.Provider>
  );
};

