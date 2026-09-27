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
    return { key: 'rzp_test_SmartMart2026' };
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
  try {
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to dispatch voicemail');
    }
    return await res.json();
  } catch (err) {
    console.warn('apiSendVoicemail fallback note:', err.message);
    // Client-side simulation fallback if backend is unreachable
    return {
      success: true,
      mode: 'client_simulated',
      callSid: `CA_CLIENT_${Date.now()}`,
      status: 'completed',
      recipient: to,
      message: `Voicemail simulated to ${to} (Order ${orderId})`
    };
  }
};

/**
 * Check Voice provider status
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



