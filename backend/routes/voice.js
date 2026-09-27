const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');

// In-memory campaign and dispatch activity store (backed by server runtime)
let activeCampaigns = [
  {
    id: 'CMP-101',
    title: 'Weekend Fresh Harvest 30% OFF',
    promoCode: 'FRESH30',
    discountPercent: 30,
    category: 'Fruits & Vegetables',
    description: 'Flat 30% off on all organic farm-fresh greens, seasonal fruits, and exotic vegetables.',
    validTill: 'This Sunday Midnight',
    active: true,
    totalDispatched: 142,
    createdAt: new Date().toISOString()
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
    totalDispatched: 89,
    createdAt: new Date().toISOString()
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
    totalDispatched: 64,
    createdAt: new Date().toISOString()
  }
];

let dispatchHistory = [
  {
    id: 'DISP-001',
    type: 'SMS',
    recipient: '+919876500000',
    customerName: 'Ananya Iyer',
    title: 'Weekend Fresh Harvest 30% OFF',
    status: 'DELIVERED',
    provider: 'Twilio SMS',
    sid: 'SM_SIM_101',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'DISP-002',
    type: 'VOICEMAIL',
    recipient: '+919876500000',
    customerName: 'Ananya Iyer',
    title: 'Order ORD-10294 Out For Delivery',
    status: 'COMPLETED',
    provider: 'Twilio Voice',
    sid: 'CA_SIM_102',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  }
];

/**
 * Format phone number to E.164 standard (e.g., +919876543210)
 */
function formatE164(phone, defaultCountry = '+91') {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `${defaultCountry}${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  return `+${cleaned}`;
}

/**
 * Check if Twilio is properly configured with live keys
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  const isConfigured = !!(accountSid && authToken && fromPhone && !accountSid.includes('your_') && accountSid.startsWith('AC'));

  if (isConfigured) {
    const twilio = require('twilio');
    return {
      client: twilio(accountSid, authToken),
      fromPhone,
      isLive: true
    };
  }
  return { client: null, fromPhone: '+10000000000', isLive: false };
}

/**
 * Build speech text for voicemail
 */
function buildVoicemailScript({ customerName = 'Customer', orderId = '', orderStatus = '', customMessage = '', offerTitle = '', promoCode = '', discount = '' }) {
  if (customMessage && customMessage.trim().length > 0) {
    return customMessage.trim();
  }

  const cleanName = customerName || 'Valued Customer';

  // 1. Promotional Offer Voicemail Script
  if (offerTitle) {
    const discountText = discount ? `with an exclusive ${discount}% discount` : 'with special savings';
    const codeText = promoCode ? `Use code ${promoCode} at checkout.` : '';
    return `Hello ${cleanName}, this is SmartMart Supermarket with an exciting announcement! ${offerTitle} is now live ${discountText}. ${codeText} Order online with fifteen-minute doorstep delivery or visit our express store. Thank you and have a wonderful day!`;
  }

  // 2. Order Tracking Voicemail Script
  const cleanId = orderId ? orderId.replace('-', ' ') : 'your order';
  switch (orderStatus) {
    case 'CONFIRMED':
    case 'PACKING':
      return `Hello ${cleanName}, this is SmartMart Supermarket. Your order ${cleanId} has been confirmed and our packing team is assembling your fresh items right now. We will notify you once your order is dispatched. Thank you for shopping with SmartMart!`;
    case 'OUT_FOR_DELIVERY':
      return `Hello ${cleanName}, great news! Your SmartMart order ${cleanId} is out for delivery. Our delivery partner is on the way to your address and should arrive shortly. Please keep your phone accessible. Thank you!`;
    case 'READY_FOR_PICKUP':
      return `Hello ${cleanName}, your SmartMart takeaway order ${cleanId} is packed and ready for pickup at our express counter. Please present your digital order QR code at the counter. See you soon!`;
    case 'DELIVERED':
    case 'COMPLETED':
      return `Hello ${cleanName}, your SmartMart order ${cleanId} has been marked as delivered. We hope you enjoy your purchase! If you have any feedback, please visit our app. Have a wonderful day!`;
    default:
      return `Hello ${cleanName}, this is an automated voice update from SmartMart regarding order ${cleanId}. Your order status is currently ${orderStatus}. Thank you for choosing SmartMart!`;
  }
}

/**
 * POST /api/voice/send-sms
 * Sends an automated SMS to customer with promotional offer or order update
 */
router.post('/send-sms', async (req, res) => {
  try {
    const {
      to,
      customerName = 'Valued Customer',
      messageText = '',
      offerTitle = '',
      promoCode = '',
      discountPercent = 0
    } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Recipient phone number (to) is required.' });
    }

    const formattedTo = formatE164(to);
    let finalBody = messageText;

    if (!finalBody && offerTitle) {
      finalBody = `🎉 SmartMart Offer: ${offerTitle}! Get ${discountPercent}% OFF. Use code ${promoCode || 'DEAL'} at checkout. Shop 15-min delivery: https://smartmart.store`;
    } else if (!finalBody) {
      finalBody = `🛒 SmartMart Supermarket: Hello ${customerName}, your fresh groceries order has been updated. Track live in your SmartMart app.`;
    }

    const { client, fromPhone, isLive } = getTwilioClient();

    if (isLive) {
      const msg = await client.messages.create({
        to: formattedTo,
        from: fromPhone,
        body: finalBody
      });

      console.log(`[Twilio SMS] Message sent to ${formattedTo}. SID: ${msg.sid}`);

      const record = {
        id: `DISP-${Date.now().toString().slice(-4)}`,
        type: 'SMS',
        recipient: formattedTo,
        customerName,
        title: offerTitle || 'SMS Notification',
        status: msg.status || 'SENT',
        provider: 'Twilio Live SMS',
        sid: msg.sid,
        timestamp: new Date().toISOString()
      };
      dispatchHistory.unshift(record);

      return res.status(200).json({
        success: true,
        mode: 'twilio_live',
        sid: msg.sid,
        recipient: formattedTo,
        body: finalBody,
        message: `SMS successfully delivered to ${formattedTo} via Twilio.`
      });
    } else {
      // Simulation mode
      const mockSid = `SM_SIM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[SMS Simulation] To: ${formattedTo} | Content: "${finalBody}"`);

      const record = {
        id: `DISP-${Date.now().toString().slice(-4)}`,
        type: 'SMS',
        recipient: formattedTo,
        customerName,
        title: offerTitle || 'SMS Notification',
        status: 'DELIVERED (SIMULATED)',
        provider: 'Simulation Mode',
        sid: mockSid,
        timestamp: new Date().toISOString()
      };
      dispatchHistory.unshift(record);

      return res.status(200).json({
        success: true,
        mode: 'simulated',
        sid: mockSid,
        recipient: formattedTo,
        body: finalBody,
        message: `[Simulation Mode] SMS dispatched to ${formattedTo}. Add Twilio credentials in backend/.env for real network SMS.`
      });
    }
  } catch (error) {
    console.error('Error in /api/voice/send-sms:', error);
    return res.status(500).json({
      error: error.message || 'Failed to dispatch SMS',
      details: error.code ? `Twilio Code: ${error.code}` : undefined
    });
  }
});

/**
 * POST /api/voice/send-voicemail
 * Initiates an automated voice phone call / voicemail to the customer's phone number
 */
router.post('/send-voicemail', async (req, res) => {
  try {
    const {
      to,
      customerName = 'Customer',
      orderId = '',
      orderStatus = 'OUT_FOR_DELIVERY',
      messageText = '',
      offerTitle = '',
      promoCode = '',
      discountPercent = '',
      voice = 'Polly.Aditi',
      language = 'en-IN'
    } = req.body;

    if (!to) {
      return res.status(400).json({
        error: 'Phone number (to) is required to place a voice call.'
      });
    }

    const formattedTo = formatE164(to);
    const spokenText = buildVoicemailScript({
      customerName,
      orderId,
      orderStatus,
      customMessage: messageText,
      offerTitle,
      promoCode,
      discount: discountPercent
    });

    const { client, fromPhone, isLive } = getTwilioClient();

    if (isLive) {
      const escapedText = spokenText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const twiml = `
        <Response>
          <Pause length="1"/>
          <Say voice="${voice}" language="${language}">
            ${escapedText}
          </Say>
          <Pause length="2"/>
          <Say voice="${voice}" language="${language}">
            This was an automated notification from SmartMart Supermarket. Goodbye!
          </Say>
        </Response>
      `.trim();

      const call = await client.calls.create({
        to: formattedTo,
        from: fromPhone,
        twiml: twiml,
        machineDetection: 'Enable',
        asyncAmd: 'true'
      });

      console.log(`[Twilio Voice] Outbound call placed to ${formattedTo}. SID: ${call.sid}`);

      const record = {
        id: `DISP-${Date.now().toString().slice(-4)}`,
        type: 'VOICEMAIL',
        recipient: formattedTo,
        customerName,
        title: offerTitle || (orderId ? `Order ${orderId} Update` : 'Voice Call'),
        status: call.status || 'QUEUED',
        provider: 'Twilio Live Voice',
        sid: call.sid,
        timestamp: new Date().toISOString()
      };
      dispatchHistory.unshift(record);

      return res.status(200).json({
        success: true,
        mode: 'twilio_live',
        callSid: call.sid,
        status: call.status,
        recipient: formattedTo,
        spokenText,
        message: `Voicemail call initiated successfully to ${formattedTo} via Twilio.`
      });
    } else {
      const mockCallSid = `CA_SIM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[Voicemail Simulation] Call dispatched to ${formattedTo}: "${spokenText}"`);

      const record = {
        id: `DISP-${Date.now().toString().slice(-4)}`,
        type: 'VOICEMAIL',
        recipient: formattedTo,
        customerName,
        title: offerTitle || (orderId ? `Order ${orderId} Update` : 'Voice Call'),
        status: 'QUEUED (SIMULATED)',
        provider: 'Simulation Mode',
        sid: mockCallSid,
        timestamp: new Date().toISOString()
      };
      dispatchHistory.unshift(record);

      return res.status(200).json({
        success: true,
        mode: 'simulated',
        callSid: mockCallSid,
        status: 'queued',
        recipient: formattedTo,
        spokenText,
        message: `[Simulation Mode] Voice notification dispatched to ${formattedTo}. Add credentials in backend/.env for real phone calls.`
      });
    }
  } catch (error) {
    console.error('Error in /api/voice/send-voicemail:', error);
    return res.status(500).json({
      error: error.message || 'Failed to dispatch voicemail call',
      details: error.code ? `Twilio Code: ${error.code}` : undefined
    });
  }
});

/**
 * POST /api/voice/send-offer-alert
 * Dispatches BOTH SMS and Automated Voicemail simultaneously for an offer
 */
router.post('/send-offer-alert', async (req, res) => {
  try {
    const {
      to,
      customerName = 'Valued Customer',
      offerTitle = 'Supermarket Flash Deal',
      promoCode = 'DEAL20',
      discountPercent = 20,
      description = '',
      channels = ['SMS', 'VOICEMAIL']
    } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Recipient phone number is required.' });
    }

    const formattedTo = formatE164(to);
    const results = {};

    // 1. Send SMS if requested
    if (channels.includes('SMS')) {
      const smsBody = `🎉 SmartMart Deal Alert: ${offerTitle}! Enjoy ${discountPercent}% OFF with code ${promoCode}. ${description || 'Fresh fruits, vegetables & groceries delivered in 15 mins'}. Shop now: https://smartmart.store`;
      
      const { client, fromPhone, isLive } = getTwilioClient();
      if (isLive) {
        try {
          const msg = await client.messages.create({
            to: formattedTo,
            from: fromPhone,
            body: smsBody
          });
          results.sms = { success: true, mode: 'twilio_live', sid: msg.sid };
        } catch (e) {
          results.sms = { success: false, error: e.message };
        }
      } else {
        results.sms = { success: true, mode: 'simulated', sid: `SM_SIM_${Date.now()}` };
      }
    }

    // 2. Send Voicemail if requested
    if (channels.includes('VOICEMAIL')) {
      const speech = buildVoicemailScript({
        customerName,
        offerTitle,
        promoCode,
        discount: discountPercent
      });

      const { client, fromPhone, isLive } = getTwilioClient();
      if (isLive) {
        try {
          const escaped = speech.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const twiml = `
            <Response>
              <Pause length="1"/>
              <Say voice="Polly.Aditi" language="en-IN">${escaped}</Say>
              <Pause length="2"/>
              <Say voice="Polly.Aditi" language="en-IN">Thank you for choosing SmartMart Supermarket. Goodbye!</Say>
            </Response>
          `;
          const call = await client.calls.create({
            to: formattedTo,
            from: fromPhone,
            twiml: twiml,
            machineDetection: 'Enable'
          });
          results.voicemail = { success: true, mode: 'twilio_live', callSid: call.sid };
        } catch (e) {
          results.voicemail = { success: false, error: e.message };
        }
      } else {
        results.voicemail = { success: true, mode: 'simulated', callSid: `CA_SIM_${Date.now()}` };
      }
    }

    // Increment campaign count if matching
    const matched = activeCampaigns.find(c => c.promoCode === promoCode || c.title === offerTitle);
    if (matched) matched.totalDispatched = (matched.totalDispatched || 0) + 1;

    return res.status(200).json({
      success: true,
      recipient: formattedTo,
      offerTitle,
      promoCode,
      results,
      message: `Offer alert successfully broadcasted to ${formattedTo} via ${channels.join(' & ')}.`
    });
  } catch (error) {
    console.error('Error in /api/voice/send-offer-alert:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voice/campaigns
 * Get list of active promotional campaigns
 */
router.get('/campaigns', (req, res) => {
  res.json({
    success: true,
    campaigns: activeCampaigns
  });
});

/**
 * POST /api/voice/campaigns
 * Create a new promotional campaign
 */
router.post('/campaigns', (req, res) => {
  try {
    const {
      title,
      promoCode,
      discountPercent = 15,
      category = 'General Storewide',
      description = '',
      validTill = 'Valid for 7 days'
    } = req.body;

    if (!title || !promoCode) {
      return res.status(400).json({ error: 'Title and promo code are required.' });
    }

    const newCampaign = {
      id: `CMP-${Date.now().toString().slice(-4)}`,
      title,
      promoCode: promoCode.toUpperCase().replace(/\s+/g, ''),
      discountPercent: Number(discountPercent),
      category,
      description: description || `Special promotional offer for SmartMart shoppers. Use code ${promoCode} for ${discountPercent}% discount.`,
      validTill,
      active: true,
      totalDispatched: 0,
      createdAt: new Date().toISOString()
    };

    activeCampaigns.unshift(newCampaign);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign: newCampaign
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/voice/history
 * Get recent SMS and Voicemail dispatch logs
 */
router.get('/history', (req, res) => {
  res.json({
    success: true,
    history: dispatchHistory.slice(0, 30)
  });
});

/**
 * GET /api/voice/customers
 * Returns all registered customers with phone numbers for mass broadcast
 */
router.get('/customers', async (req, res) => {
  try {
    const customersMap = new Map();

    // 1. Fetch from User collection
    try {
      const dbUsers = await User.find({ role: 'CUSTOMER' }).lean();
      dbUsers.forEach(u => {
        if (u.phone) {
          const formatted = formatE164(u.phone);
          customersMap.set(formatted, {
            id: u.id || u._id.toString(),
            name: u.name,
            phone: formatted,
            email: u.email,
            loyaltyPoints: u.loyaltyPoints || 100,
            source: 'Registered Account'
          });
        }
      });
    } catch (e) {
      console.warn('Note reading User collection:', e.message);
    }

    // 2. Fetch from Order collection
    try {
      const orders = await Order.find({ customerPhone: { $exists: true, $ne: '' } }).lean();
      orders.forEach(o => {
        if (o.customerPhone) {
          const formatted = formatE164(o.customerPhone);
          if (!customersMap.has(formatted)) {
            customersMap.set(formatted, {
              id: o.customerId || `cust_${Date.now()}`,
              name: o.customerName || 'Customer',
              phone: formatted,
              email: 'shopper@smartmart.com',
              loyaltyPoints: 150,
              source: 'Order History'
            });
          }
        }
      });
    } catch (e) {
      console.warn('Note reading Order collection:', e.message);
    }

    // 3. Fallback demo registered customers if DB list is currently empty
    if (customersMap.size === 0) {
      const fallbackCustomers = [
        { id: 'cust_1', name: 'Ananya Iyer', phone: '+919876500000', email: 'ananya.iyer@gmail.com', loyaltyPoints: 350, source: 'Registered Profile' },
        { id: 'cust_2', name: 'Rohan Sharma', phone: '+919845123456', email: 'rohan.sharma@yahoo.com', loyaltyPoints: 210, source: 'Frequent Shopper' },
        { id: 'cust_3', name: 'Priya Patel', phone: '+919741098765', email: 'priya.patel@outlook.com', loyaltyPoints: 480, source: 'Club Member' },
        { id: 'cust_4', name: 'Siddharth Rao', phone: '+919886512340', email: 'siddharth.rao@gmail.com', loyaltyPoints: 120, source: 'Online Customer' },
        { id: 'cust_5', name: 'Kavita Nair', phone: '+919823055441', email: 'kavita.nair@gmail.com', loyaltyPoints: 290, source: 'Store Loyalty Member' }
      ];
      fallbackCustomers.forEach(c => customersMap.set(c.phone, c));
    }

    const customersList = Array.from(customersMap.values());
    res.json({
      success: true,
      count: customersList.length,
      customers: customersList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/voice/broadcast-all
 * Broadcasts an offer via SMS and/or Voicemail to ALL registered customers
 */
router.post('/broadcast-all', async (req, res) => {
  try {
    const {
      offerTitle = 'Mega Weekend 30% OFF',
      promoCode = 'SUPER30',
      discountPercent = 30,
      description = 'Flat 30% off on fresh groceries and pantry essentials.',
      channels = ['SMS', 'VOICEMAIL'],
      targetRecipients = []
    } = req.body;

    let recipients = targetRecipients;
    if (!recipients || recipients.length === 0) {
      const customersMap = new Map();
      try {
        const dbUsers = await User.find({ role: 'CUSTOMER' }).lean();
        dbUsers.forEach(u => {
          if (u.phone) customersMap.set(formatE164(u.phone), { name: u.name, phone: formatE164(u.phone) });
        });
        const orders = await Order.find({ customerPhone: { $exists: true, $ne: '' } }).lean();
        orders.forEach(o => {
          if (o.customerPhone) customersMap.set(formatE164(o.customerPhone), { name: o.customerName || 'Shopper', phone: formatE164(o.customerPhone) });
        });
      } catch (e) {}

      if (customersMap.size === 0) {
        customersMap.set('+919876500000', { name: 'Ananya Iyer', phone: '+919876500000' });
        customersMap.set('+919845123456', { name: 'Rohan Sharma', phone: '+919845123456' });
        customersMap.set('+919741098765', { name: 'Priya Patel', phone: '+919741098765' });
        customersMap.set('+919886512340', { name: 'Siddharth Rao', phone: '+919886512340' });
        customersMap.set('+919823055441', { name: 'Kavita Nair', phone: '+919823055441' });
      }
      recipients = Array.from(customersMap.values());
    }

    const { client, fromPhone, isLive } = getTwilioClient();
    const batchLogs = [];
    let smsSuccessCount = 0;
    let voicemailSuccessCount = 0;

    for (const cust of recipients) {
      const toPhone = formatE164(cust.phone || cust);
      const custName = cust.name || 'Valued Shopper';

      // 1. Send SMS to this customer
      if (channels.includes('SMS')) {
        const smsBody = `🎉 SmartMart Deal Alert: ${offerTitle}! Get ${discountPercent}% OFF with code ${promoCode}. ${description}. Shop express delivery: https://smartmart.store`;
        if (isLive) {
          try {
            const msg = await client.messages.create({ to: toPhone, from: fromPhone, body: smsBody });
            smsSuccessCount++;
            batchLogs.push({ type: 'SMS', recipient: toPhone, customerName: custName, status: 'SENT', sid: msg.sid });
          } catch (e) {
            batchLogs.push({ type: 'SMS', recipient: toPhone, customerName: custName, status: 'FAILED', error: e.message });
          }
        } else {
          smsSuccessCount++;
          batchLogs.push({ type: 'SMS', recipient: toPhone, customerName: custName, status: 'DELIVERED (SIMULATED)', sid: `SM_SIM_${Date.now()}` });
        }
      }

      // 2. Send Voicemail to this customer
      if (channels.includes('VOICEMAIL')) {
        const speech = buildVoicemailScript({ customerName: custName, offerTitle, promoCode, discount: discountPercent });
        if (isLive) {
          try {
            const escaped = speech.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const twiml = `
              <Response>
                <Pause length="1"/>
                <Say voice="Polly.Aditi" language="en-IN">${escaped}</Say>
                <Pause length="2"/>
                <Say voice="Polly.Aditi" language="en-IN">Thank you for shopping at SmartMart Supermarket. Goodbye!</Say>
              </Response>
            `;
            const call = await client.calls.create({ to: toPhone, from: fromPhone, twiml, machineDetection: 'Enable' });
            voicemailSuccessCount++;
            batchLogs.push({ type: 'VOICEMAIL', recipient: toPhone, customerName: custName, status: 'QUEUED', sid: call.sid });
          } catch (e) {
            batchLogs.push({ type: 'VOICEMAIL', recipient: toPhone, customerName: custName, status: 'FAILED', error: e.message });
          }
        } else {
          voicemailSuccessCount++;
          batchLogs.push({ type: 'VOICEMAIL', recipient: toPhone, customerName: custName, status: 'QUEUED (SIMULATED)', sid: `CA_SIM_${Date.now()}` });
        }
      }
    }

    // Update campaign counter
    const matched = activeCampaigns.find(c => c.promoCode === promoCode || c.title === offerTitle);
    if (matched) matched.totalDispatched = (matched.totalDispatched || 0) + recipients.length;

    // Prepend to recent history
    batchLogs.forEach(log => {
      dispatchHistory.unshift({
        id: `DISP-${Date.now().toString().slice(-4)}_${Math.random().toString(36).substring(2, 5)}`,
        type: log.type,
        recipient: log.recipient,
        customerName: log.customerName,
        title: offerTitle,
        status: log.status,
        provider: isLive ? 'Twilio Live' : 'Simulation Mode',
        sid: log.sid || 'N/A',
        timestamp: new Date().toISOString()
      });
    });

    res.json({
      success: true,
      message: `Mass broadcast successfully delivered to ${recipients.length} registered customer phone numbers!`,
      totalCustomers: recipients.length,
      smsSent: smsSuccessCount,
      voicemailsPlaced: voicemailSuccessCount,
      isLive,
      batchLogs
    });
  } catch (err) {
    console.error('Error in /api/voice/broadcast-all:', err);
    res.status(500).json({ error: err.message });
  }
});

// System notification state for users missing phone numbers
let systemNotification = {
  active: true,
  type: 'PHONE_REGISTRATION_PROMPT',
  title: '🎁 Exclusive 30% OFF Deal: Link Your Mobile Number!',
  message: 'Register your mobile number to receive automated Voicemail coupons, 30% OFF flash discounts, and live delivery SMS. Plus get 50 bonus SmartMart points!',
  bonusPoints: 50,
  updatedAt: new Date().toISOString()
};

/**
 * GET /api/voice/phone-stats
 * Returns statistics of customers with phone numbers vs without phone numbers
 */
router.get('/phone-stats', async (req, res) => {
  try {
    let allUsers = [];
    try {
      allUsers = await User.find({ role: 'CUSTOMER' }).lean();
    } catch (e) {}

    const registered = [];
    const missing = [];

    allUsers.forEach(u => {
      const hasPhone = u.phone && u.phone.trim().length >= 8 && !u.phone.includes('00000');
      if (hasPhone) {
        registered.push({ id: u.id || u._id, name: u.name, email: u.email, phone: u.phone });
      } else {
        missing.push({ id: u.id || u._id, name: u.name, email: u.email });
      }
    });

    if (allUsers.length === 0) {
      registered.push({ id: 'u1', name: 'Ananya Iyer', phone: '+919876500000' });
      missing.push({ id: 'u2', name: 'Guest Shopper', email: 'guest@smartmart.com' });
      missing.push({ id: 'u3', name: 'Google Shopper', email: 'google.user@gmail.com' });
    }

    res.json({
      success: true,
      registeredCount: registered.length,
      missingPhoneCount: missing.length,
      registeredUsers: registered,
      missingPhoneUsers: missing,
      notification: systemNotification
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/voice/notify-unregistered-users
 * Triggers an in-app notification prompt for all users who haven't registered phone numbers
 */
router.post('/notify-unregistered-users', (req, res) => {
  const { title, message, bonusPoints } = req.body || {};
  systemNotification = {
    active: true,
    type: 'PHONE_REGISTRATION_PROMPT',
    title: title || '🎁 Exclusive 30% OFF Voicemail & SMS Deals: Link Your Mobile Number!',
    message: message || 'Link your mobile number to receive automated Voicemail discounts and SMS delivery alerts. Earn +50 bonus SmartMart Points instantly!',
    bonusPoints: Number(bonusPoints) || 50,
    triggeredAt: new Date().toISOString()
  };

  console.log('[System Broadcast] Notification triggered for users missing phone numbers:', systemNotification.title);

  res.json({
    success: true,
    message: 'In-app notification prompt triggered for all users without phone numbers!',
    notification: systemNotification
  });
});

/**
 * GET /api/voice/system-notifications
 * Returns active system prompts for frontend consumers
 */
router.get('/system-notifications', (req, res) => {
  res.json({
    success: true,
    notification: systemNotification
  });
});

module.exports = router;


