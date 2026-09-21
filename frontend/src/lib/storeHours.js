/**
 * Smart Supermarket Store Hours & Purchasing Policy Utility
 * Manages store operating hours, open/close status, and purchasing restrictions.
 */

/**
 * Format 24-hour time "HH:MM" into friendly 12-hour string (e.g. "7:00 AM")
 */
export const formatTime12H = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minutePad = String(m || 0).padStart(2, '0');
  return `${hour12}:${minutePad} ${period}`;
};

/**
 * Check if the store is currently open for customer purchases
 * @param {Object} storeSettings
 * @returns {Object} status details
 */
export const checkStoreOpenStatus = (storeSettings = {}) => {
  const openingTime = storeSettings.openingTime || '07:00';
  const closingTime = storeSettings.closingTime || '23:00';
  const enforceHours = storeSettings.enforceStoreHours !== false; // default true
  const override = storeSettings.storeStatusOverride || 'AUTO';

  const formattedOpen = formatTime12H(openingTime);
  const formattedClose = formatTime12H(closingTime);
  const formattedHours = `${formattedOpen} – ${formattedClose}`;

  // If override is active
  if (override === 'FORCE_OPEN') {
    return {
      isOpen: true,
      enforced: enforceHours,
      override: 'FORCE_OPEN',
      openingTime,
      closingTime,
      formattedOpen,
      formattedClose,
      formattedHours,
      message: `Store is Open (Staff Override Active). Regular hours: ${formattedHours}.`
    };
  }

  if (override === 'FORCE_CLOSED') {
    return {
      isOpen: false,
      enforced: true,
      override: 'FORCE_CLOSED',
      openingTime,
      closingTime,
      formattedOpen,
      formattedClose,
      formattedHours,
      message: `Store is currently closed (Staff Override Active). Regular hours: ${formattedHours}.`
    };
  }

  // If enforcement is disabled by staff
  if (!enforceHours) {
    return {
      isOpen: true,
      enforced: false,
      override: 'AUTO',
      openingTime,
      closingTime,
      formattedOpen,
      formattedClose,
      formattedHours,
      message: `Store hours enforcement is disabled. Operating 24/7 for testing.`
    };
  }

  // Calculate based on current system time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openingTime.split(':').map(Number);
  const [closeH, closeM] = closingTime.split(':').map(Number);

  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  let isOpen = false;

  if (openMinutes <= closeMinutes) {
    // Standard same-day hours (e.g. 07:00 to 23:00)
    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Overnight hours (e.g. 20:00 to 04:00)
    isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  const nextOpenMessage = currentMinutes < openMinutes 
    ? `Opens today at ${formattedOpen}`
    : `Opens tomorrow at ${formattedOpen}`;

  return {
    isOpen,
    enforced: true,
    override: 'AUTO',
    openingTime,
    closingTime,
    formattedOpen,
    formattedClose,
    formattedHours,
    nextOpenMessage,
    message: isOpen
      ? `Store is Open! Operating hours: ${formattedHours}.`
      : `Store is Closed for purchases. Operating hours are ${formattedHours}. (${nextOpenMessage})`
  };
};
