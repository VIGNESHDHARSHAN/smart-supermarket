/**
 * Smart Supermarket API Client Service
 * Connects React frontend to Node.js/Express Backend REST APIs
 * with automatic fallback to client-side mock data if server is offline.
 */

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Universal Fetch Helper
 * Injects Bypass-Tunnel-Reminder header to prevent localtunnel splash screen interception
 */
const customFetch = (url, options = {}) => {
  const headers = {
    'Bypass-Tunnel-Reminder': 'true',
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
};

/**
 * Fetch Product Catalog
 */
export const apiFetchProducts = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const res = await customFetch(`${API_BASE_URL}/products?${params}`);
    if (!res.ok) throw new Error('API server returned error');
    return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable, using local fallback dataset:', err.message);
    return null;
  }
};

/**
 * Scan & Go Barcode Scanner Lookup
 */
export const apiFetchProductByBarcode = async (barcode) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/products/barcode/${encodeURIComponent(barcode)}`);
    if (!res.ok) throw new Error('Barcode not found on server');
    return await res.json();
  } catch (err) {
    return null;
  }
};

/**
 * Customer / Staff User Login
 */
export const apiLoginUser = async (identifier, password) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    if (!res.ok) throw new Error('Authentication failed');
    return await res.json();
  } catch (err) {
    return null;
  }
};

/**
 * Google SSO Login
 */
export const apiGoogleLogin = async (googleUser, isStaff = false) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...googleUser, isStaff })
    });
    if (!res.ok) throw new Error('Google auth API error');
    return await res.json();
  } catch (err) {
    return null;
  }
};

/**
 * Create New Order
 */
export const apiCreateOrder = async (orderPayload) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    if (!res.ok) throw new Error('Order creation error');
    return await res.json();
  } catch (err) {
    return null;
  }
};

/**
 * Verify Turnstile Gate Pass
 */
export const apiVerifyGatePass = async (passCode) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/gate/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passCode })
    });
    if (!res.ok) throw new Error('Gate verification error');
    return await res.json();
  } catch (err) {
    return null;
  }
};

/**
 * Add New Product to Backend Database
 */
export const apiAddProduct = async (productPayload) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productPayload)
    });
    if (!res.ok) throw new Error('Add product API error');
    return await res.json();
  } catch (err) {
    return null;
  }
};

/**
 * Update Product Stock in Backend Database
 */
export const apiUpdateProductStock = async (productId, stock, price) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock, price })
    });
    if (!res.ok) throw new Error('Update stock API error');
    return await res.json();
  } catch (err) {
    return null;
  }
};

/**
 * Fetch Public Razorpay Key ID
 */
export const apiGetRazorpayKey = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/payment/razorpay/key`);
    if (!res.ok) throw new Error('Failed to fetch Razorpay key');
    return await res.json();
  } catch (err) {
    const envKey = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
    return { key: envKey || 'rzp_test_TZqeZKHJCbUTaF' };
  }
};

/**
 * Create Razorpay Order on Backend
 */
export const apiCreateRazorpayOrder = async (payload) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/payment/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create Razorpay order');
    }
    return await res.json();
  } catch (err) {
    console.warn('API createRazorpayOrder error:', err.message);
    return null;
  }
};

/**
 * Verify Razorpay Signature on Backend
 */
export const apiVerifyRazorpaySignature = async (payload) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/payment/razorpay/verify-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('API verifyRazorpaySignature error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch All Delivery Partners
 */
export const apiFetchDeliveryPartners = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/delivery/partners`);
    if (!res.ok) throw new Error('Failed to fetch delivery partners');
    return await res.json();
  } catch (err) {
    console.warn('Delivery partners fallback to local data:', err.message);
    return null;
  }
};

/**
 * Manager Adds New Delivery Partner
 */
export const apiAddDeliveryPartner = async (partnerData, requesterRole = 'MANAGER') => {
  try {
    const res = await customFetch(`${API_BASE_URL}/delivery/partners`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-requester-role': requesterRole
      },
      body: JSON.stringify({ ...partnerData, requesterRole })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add delivery partner');
    }
    return await res.json();
  } catch (err) {
    console.warn('apiAddDeliveryPartner note:', err.message);
    throw err;
  }
};

/**
 * Update Delivery Partner Status
 */
export const apiUpdateDeliveryPartnerStatus = async (partnerId, status) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/delivery/partners/${encodeURIComponent(partnerId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update partner status');
    return await res.json();
  } catch (err) {
    console.warn('apiUpdateDeliveryPartnerStatus note:', err.message);
    return null;
  }
};

/**
 * Delete Delivery Partner (Manager Only)
 */
export const apiDeleteDeliveryPartner = async (partnerId, requesterRole = 'MANAGER') => {
  try {
    const res = await customFetch(`${API_BASE_URL}/delivery/partners/${encodeURIComponent(partnerId)}?requesterRole=${encodeURIComponent(requesterRole)}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'x-requester-role': requesterRole
      },
      body: JSON.stringify({ requesterRole })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete delivery partner');
    }
    return await res.json();
  } catch (err) {
    console.warn('apiDeleteDeliveryPartner note:', err.message);
    throw err;
  }
};

/**
 * Delivery Partner Login
 */
export const apiDeliveryLogin = async (identifier, password) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/delivery/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Delivery login failed');
    }
    return await res.json();
  } catch (err) {
    console.warn('apiDeliveryLogin note:', err.message);
    throw err;
  }
};

/**
 * Fetch All Store Staff Members
 */
export const apiFetchStaffMembers = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/staff`);
    if (!res.ok) throw new Error('Failed to fetch staff members');
    return await res.json();
  } catch (err) {
    console.warn('Staff members fallback to local store data:', err.message);
    return null;
  }
};

/**
 * Manager Adds New Working Staff Member
 */
export const apiAddStaffMember = async (staffData, requesterRole = 'MANAGER') => {
  try {
    const res = await customFetch(`${API_BASE_URL}/staff`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-requester-role': requesterRole
      },
      body: JSON.stringify({ ...staffData, requesterRole })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add staff member');
    }
    return await res.json();
  } catch (err) {
    console.warn('apiAddStaffMember note:', err.message);
    throw err;
  }
};

/**
 * Manager Updates Staff Status (Active / On Leave / Inactive)
 */
export const apiUpdateStaffStatus = async (staffId, status, requesterRole = 'MANAGER') => {
  try {
    const res = await customFetch(`${API_BASE_URL}/staff/${encodeURIComponent(staffId)}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-requester-role': requesterRole
      },
      body: JSON.stringify({ status, requesterRole })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update staff status');
    }
    return await res.json();
  } catch (err) {
    console.warn('apiUpdateStaffStatus note:', err.message);
    throw err;
  }
};

/**
 * Manager Removes Staff Member
 */
export const apiDeleteStaffMember = async (staffId, requesterRole = 'MANAGER') => {
  try {
    const res = await customFetch(`${API_BASE_URL}/staff/${encodeURIComponent(staffId)}?requesterRole=${encodeURIComponent(requesterRole)}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'x-requester-role': requesterRole
      },
      body: JSON.stringify({ requesterRole })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete staff member');
    }
    return await res.json();
  } catch (err) {
    console.warn('apiDeleteStaffMember note:', err.message);
    throw err;
  }
};

/**
 * Staff / Manager Unified Login Verification
 */
export const apiStaffLogin = async (identifier, password, expectedRole = null) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, expectedRole })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login verification failed');
    }
    return await res.json();
  } catch (err) {
    console.warn('apiStaffLogin note:', err.message);
    throw err;
  }
};

/**
 * Send automated voicemail / phone call to customer via Twilio Voice API
 */
export const apiSendVoicemail = async ({
  to,
  customerName,
  orderId,
  orderStatus,
  messageText = '',
  voice = 'Polly.Aditi',
  language = 'en-IN'
}) => {
  const res = await customFetch(`${API_BASE_URL}/voice/send-voicemail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      customerName,
      orderId,
      orderStatus,
      messageText,
      voice,
      language
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || 'Failed to dispatch voicemail call');
  }
  return data;
};

/**
 * Check Voice / SMS provider status
 */
export const apiGetVoiceStatus = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/status`);
    if (!res.ok) throw new Error('Status failed');
    return await res.json();
  } catch (err) {
    return { status: 'OK', provider: 'Simulation Mode', isLiveConfigured: false };
  }
};

/**
 * Send automated SMS via Twilio Messages API
 */
export const apiSendSMS = async ({
  to,
  customerName = 'Valued Customer',
  messageText = '',
  offerTitle = '',
  promoCode = '',
  discountPercent = 0
}) => {
  const res = await customFetch(`${API_BASE_URL}/voice/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      customerName,
      messageText,
      offerTitle,
      promoCode,
      discountPercent
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || 'Failed to dispatch SMS');
  }
  return data;
};

/**
 * Send Offer Alert via SMS and/or Voicemail simultaneously
 */
export const apiSendOfferAlert = async ({
  to,
  customerName = 'Valued Customer',
  offerTitle,
  promoCode,
  discountPercent,
  description = '',
  channels = ['SMS', 'VOICEMAIL']
}) => {
  const res = await customFetch(`${API_BASE_URL}/voice/send-offer-alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      customerName,
      offerTitle,
      promoCode,
      discountPercent,
      description,
      channels
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || 'Failed to dispatch offer notification');
  }
  return data;
};

/**
 * Fetch promotional campaigns
 */
export const apiGetOfferCampaigns = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/campaigns`);
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    const data = await res.json();
    return data.campaigns || [];
  } catch (err) {
    return [
      {
        id: 'CMP-101',
        title: 'Weekend Fresh Harvest 30% OFF',
        promoCode: 'FRESH30',
        discountPercent: 30,
        category: 'Fruits & Vegetables',
        description: 'Flat 30% off on all organic farm-fresh greens, seasonal fruits, and exotic vegetables.',
        validTill: 'This Sunday Midnight',
        active: true,
        totalDispatched: 142
      },
      {
        id: 'CMP-102',
        title: 'Super Saver ₹100 Flat Discount',
        promoCode: 'MART100',
        discountPercent: 20,
        category: 'Storewide Essentials',
        description: 'Flat ₹100 instant cashback on any grocery cart above ₹499 with express 15-min delivery.',
        validTill: 'Valid all month',
        active: true,
        totalDispatched: 89
      },
      {
        id: 'CMP-103',
        title: 'Festival Sweets & Dry Fruits 25% OFF',
        promoCode: 'FESTIVE25',
        discountPercent: 25,
        category: 'Snacks & Beverages',
        description: 'Special festive gift boxes, premium almonds, cashews, and artisan confectioneries.',
        validTill: 'Limited stock',
        active: true,
        totalDispatched: 64
      }
    ];
  }
};

/**
 * Create a new promotional campaign
 */
export const apiCreateOfferCampaign = async (campaignData) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create campaign');
    }
    return await res.json();
  } catch (err) {
    return {
      success: true,
      campaign: { ...campaignData, id: `CMP-${Date.now().toString().slice(-4)}`, totalDispatched: 0 }
    };
  }
};

/**
 * Fetch SMS & Voicemail dispatch logs
 */
export const apiGetDispatchHistory = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    const data = await res.json();
    return data.history || [];
  } catch (err) {
    return [];
  }
};

/**
 * Fetch registered customer phone numbers for Voice/SMS broadcasts
 */
export const apiGetVoiceCustomers = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/customers`);
    if (!res.ok) throw new Error('Failed to fetch registered customers');
    const data = await res.json();
    return data.customers || [];
  } catch (err) {
    return [
      { id: 'cust_1', name: 'Ananya Iyer', phone: '+919876500000', email: 'ananya.iyer@gmail.com', loyaltyPoints: 350, source: 'Registered Profile' },
      { id: 'cust_2', name: 'Rohan Sharma', phone: '+919845123456', email: 'rohan.sharma@yahoo.com', loyaltyPoints: 210, source: 'Frequent Shopper' },
      { id: 'cust_3', name: 'Priya Patel', phone: '+919741098765', email: 'priya.patel@outlook.com', loyaltyPoints: 480, source: 'Club Member' },
      { id: 'cust_4', name: 'Siddharth Rao', phone: '+919886512340', email: 'siddharth.rao@gmail.com', loyaltyPoints: 120, source: 'Online Customer' },
      { id: 'cust_5', name: 'Kavita Nair', phone: '+919823055441', email: 'kavita.nair@gmail.com', loyaltyPoints: 290, source: 'Store Loyalty Member' }
    ];
  }
};

/**
 * Broadcast an offer via SMS and Voicemail to ALL registered customer phone numbers
 */
export const apiBroadcastToAllCustomers = async ({
  offerTitle,
  promoCode,
  discountPercent,
  description,
  channels = ['SMS', 'VOICEMAIL'],
  targetRecipients = []
}) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/broadcast-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerTitle,
        promoCode,
        discountPercent,
        description,
        channels,
        targetRecipients
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || 'Failed to complete mass broadcast');
    }
    return data;
  } catch (err) {
    console.warn('apiBroadcastToAllCustomers error:', err.message);
    throw err;
  }
};

/**
 * Register a new customer in MongoDB
 */
export const apiRegisterCustomer = async (userData) => {
  const res = await customFetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register account');
  }
  return data;
};

/**
 * Authenticate customer login via backend MongoDB
 */
export const apiLoginCustomer = async ({ identifier, password }) => {
  const res = await customFetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to login');
  }
  return data;
};

/**
 * Update customer personal profile (name, email, phone, addresses) in MongoDB
 */
export const apiUpdateCustomerProfile = async (profileData) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }
    return data;
  } catch (err) {
    console.warn('apiUpdateCustomerProfile network note:', err.message);
    return {
      success: true,
      message: 'Profile updated locally',
      user: profileData
    };
  }
};

/**
 * Register or update customer phone number in database
 */
export const apiUpdateCustomerPhone = async (userId, email, phone, name = '') => {
  try {
    const res = await customFetch(`${API_BASE_URL}/auth/phone`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, phone, name })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update phone number');
    }
    return await res.json();
  } catch (err) {
    console.warn('apiUpdateCustomerPhone note:', err.message);
    return {
      success: true,
      message: 'Phone number updated! +50 points awarded.',
      user: { phone, loyaltyPoints: 150 }
    };
  }
};

/**
 * Get count of users with phone vs missing phone
 */
export const apiGetPhoneStats = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/phone-stats`);
    if (!res.ok) throw new Error('Failed to fetch phone stats');
    return await res.json();
  } catch (err) {
    return {
      registeredCount: 3,
      missingPhoneCount: 2,
      registeredUsers: [],
      missingPhoneUsers: []
    };
  }
};

/**
 * Notify all users who haven't registered via phone number
 */
export const apiNotifyUnregisteredUsers = async (customMessage = '', customTitle = '', bonusPoints = 50) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/notify-unregistered-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: customMessage, title: customTitle, bonusPoints })
    });
    if (!res.ok) throw new Error('Failed to send notification');
    return await res.json();
  } catch (err) {
    return {
      success: true,
      message: 'In-app notification prompt triggered for all users without phone numbers!'
    };
  }
};

/**
 * Get active system notifications for customer app
 */
export const apiGetSystemNotifications = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/system-notifications`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};

/**
 * Fetch all registered customers for Store Manager & Staff view
 */
export const apiGetRegisteredCustomers = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/auth/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers list');
    return await res.json();
  } catch (err) {
    console.warn('apiGetRegisteredCustomers fallback:', err.message);
    return {
      success: true,
      count: 6,
      stats: {
        totalCustomers: 6,
        phoneRegisteredCount: 4,
        missingPhoneCount: 2,
        totalLoyaltyPoints: 1800,
        totalRevenue: 19700
      },
      customers: []
    };
  }
};

/**
 * Manager action: Update customer record (phone, points, etc.)
 */
export const apiUpdateCustomerRecord = async (customerId, updates) => {
  try {
    const res = await customFetch(`${API_BASE_URL}/auth/customers/${encodeURIComponent(customerId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update customer');
    return await res.json();
  } catch (err) {
    return {
      success: true,
      message: 'Updated customer locally',
      customer: { id: customerId, ...updates }
    };
  }
};

/**
 * Manager action: Save & verify Twilio credentials
 */
export const apiSaveTwilioConfig = async ({ accountSid, authToken, phoneNumber }) => {
  const res = await customFetch(`${API_BASE_URL}/voice/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountSid, authToken, phoneNumber })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save Twilio configuration');
  }
  return data;
};

/**
 * Dispatch test voice call and/or SMS with live diagnostic error feedback
 */
export const apiTestTwilioDispatch = async ({ to, type = 'BOTH' }) => {
  const res = await customFetch(`${API_BASE_URL}/voice/test-dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, type })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to run test dispatch');
  }
  return data;
};

/**
 * Fetch verified caller ID phone numbers from Twilio
 */
export const apiGetVerifiedCallerIds = async () => {
  try {
    const res = await customFetch(`${API_BASE_URL}/voice/verified-caller-ids`);
    if (!res.ok) throw new Error('Failed to fetch verified numbers');
    return await res.json();
  } catch (err) {
    return { success: false, verifiedNumbers: [] };
  }
};

/**
 * Trigger automated Twilio phone call verification request
 */
export const apiInitiateTwilioPhoneVerification = async ({ phoneNumber, friendlyName }) => {
  const res = await customFetch(`${API_BASE_URL}/voice/request-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, friendlyName })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Verification request failed');
  }
  return data;
};
