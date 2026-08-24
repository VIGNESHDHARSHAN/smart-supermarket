/**
 * Smart Supermarket API Client Service
 * Connects React frontend to Node.js/Express Backend REST APIs
 * with automatic fallback to client-side mock data if server is offline.
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch Product Catalog
 */
export const apiFetchProducts = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE_URL}/products?${params}`);
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
    const res = await fetch(`${API_BASE_URL}/products/barcode/${encodeURIComponent(barcode)}`);
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
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
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
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
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
    const res = await fetch(`${API_BASE_URL}/orders`, {
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
    const res = await fetch(`${API_BASE_URL}/gate/verify`, {
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
