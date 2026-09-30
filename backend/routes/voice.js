const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
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
  let cleaned = String(phone).trim().replace(/[^0-9+]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  } else if (cleaned.startsWith('+')) {
    // already has +, keep as is
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = `${defaultCountry}${cleaned.slice(1)}`;
  } else if (cleaned.length === 10) {
    cleaned = `${defaultCountry}${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = `+${cleaned}`;
  } else {
    cleaned = `+${cleaned}`;
  }
  return cleaned.length >= 8 ? cleaned : null;
}

/**
 * Resolve twilio library safely from local or root node_modules
 */
function getTwilioModule() {
  try {
    return require('twilio');
  } catch (e1) {
    try {
      return require(path.resolve(__dirname, '../../node_modules/twilio'));
    } catch (e2) {
      console.warn('Cannot resolve twilio library:', e2.message);
      return null;
    }
  }
}

/**
 * Format Twilio error into user-friendly diagnostic guidance
 */
function parseTwilioError(err, recipient = '') {
  if (!err) return 'Twilio dispatch failed.';
  const code = err.code || err.status;
  const msg = err.message || String(err);

  if (code === 21608 || msg.toLowerCase().includes('unverified')) {
    return `Twilio Free Trial Notice: The recipient number ${recipient} is not verified. On a Twilio trial account, you must add and verify this mobile number in your Twilio Console under "Verified Caller IDs" (https://console.twilio.com/develop/phone-numbers/manage/verified).`;
  }
  if (code === 21211 || msg.toLowerCase().includes('invalid')) {
    return `Invalid phone number format: ${recipient}. Please enter a valid number with country code (e.g. +91 9876543210).`;
  }
  if (code === 20003 || msg.toLowerCase().includes('authenticate')) {
    return 'Twilio Authentication Failed: Please check your Account SID and Auth Token in backend/.env.';
  }
  if (code === 21606 || msg.toLowerCase().includes('not a valid phone number')) {
    return `Twilio from number is not valid or not active on your Twilio account: ${err.message}`;
  }
  return msg;
}

/**
 * Dynamically read and clean Twilio credentials (direct from disk, auto-reloads on .env changes)
 */
function getTwilioCredentials() {
  let fileSid = '', fileToken = '', filePhone = '';
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) return;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const val = match[2].trim().replace(/^['"]|['"]$/g, '');
          if (key === 'TWILIO_ACCOUNT_SID') fileSid = val;
          if (key === 'TWILIO_AUTH_TOKEN') fileToken = val;
          if (key === 'TWILIO_PHONE_NUMBER') filePhone = val;
        }
      });
    }
  } catch (e) {}

  const sid = (fileSid || process.env.TWILIO_ACCOUNT_SID || '').trim().replace(/['"]/g, '');
  const token = (fileToken || process.env.TWILIO_AUTH_TOKEN || '').trim().replace(/['"]/g, '');
  const phone = (filePhone || process.env.TWILIO_PHONE_NUMBER || '').trim().replace(/['"]/g, '');

  const isConfigured = Boolean(
    sid &&
    token &&
    phone &&
    sid.startsWith('AC') &&
    sid.length >= 30 &&
    !sid.includes('your_')
  );

  return { sid, token, phone, isConfigured };
}

/**
 * Check if Twilio is properly configured with live keys
 */
function getTwilioClient() {
  const { sid, token, phone, isConfigured } = getTwilioCredentials();

  if (isConfigured) {
    try {
      const twilio = getTwilioModule();
      if (twilio) {
        return {
          client: twilio(sid, token),
          fromPhone: phone,
          isLive: true
        };
      }
    } catch (err) {
      console.warn('Twilio library initialization error:', err.message);
    }
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
    return res.status(400).json({
      error: parseTwilioError(error, formattedTo),
      details: error.code ? `Twilio Code: ${error.code}` : undefined
    });
  }
});

/**
 * POST /api/voice/send-voicemail
 * Initiates an automated voice phone call / voicemail to the customer's phone number
 */
router.post('/send-voicemail', async (req, res) => {
  let formattedTo = null;
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

    formattedTo = formatE164(to);
    if (!formattedTo) {
      return res.status(400).json({
        error: `Invalid recipient phone number "${to}". Please enter a valid 10-digit mobile number with country code (e.g. +91 9876543210).`
      });
    }

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
        machineDetection: 'Enable'
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
    return res.status(400).json({
      error: parseTwilioError(error, formattedTo || req.body?.to),
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
          results.sms = { success: false, error: parseTwilioError(e, formattedTo), code: e.code };
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
          results.voicemail = { success: false, error: parseTwilioError(e, formattedTo), code: e.code };
        }
      } else {
        results.voicemail = { success: true, mode: 'simulated', callSid: `CA_SIM_${Date.now()}` };
      }
    }

    // Increment campaign count if matching
    const matched = activeCampaigns.find(c => c.promoCode === promoCode || c.title === offerTitle);
    if (matched) matched.totalDispatched = (matched.totalDispatched || 0) + 1;

    const allFailed = Object.values(results).length > 0 && Object.values(results).every(r => !r.success);
    if (allFailed) {
      const errMsg = Object.entries(results)
        .map(([ch, r]) => `${ch}: ${r.error}`)
        .join(' | ');
      return res.status(400).json({
        success: false,
        recipient: formattedTo,
        error: errMsg,
        message: errMsg,
        results
      });
    }

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
    return res.status(500).json({ error: parseTwilioError(error) });
  }
});

/**
 * GET /api/voice/status
 * Check Twilio live connection health and credentials validation
 */
router.get('/status', async (req, res) => {
  try {
    const { sid, token, phone, isConfigured } = getTwilioCredentials();

    let verification = { 
      verified: false, 
      error: null, 
      accountName: null, 
      accountStatus: null, 
      accountType: null,
      isTrial: false,
      verifiedNumbers: []
    };

    if (isConfigured) {
      try {
        const twilio = getTwilioModule();
        if (twilio) {
          const client = twilio(sid, token);
          const acc = await client.api.v2010.accounts(sid).fetch();
          
          let verifiedNumbers = [];
          try {
            const callerIds = await client.outgoingCallerIds.list({ limit: 50 });
            verifiedNumbers = callerIds.map(c => c.phoneNumber);
          } catch (cidErr) {
            console.warn('Could not list verified caller IDs:', cidErr.message);
          }

          verification = {
            verified: true,
            error: null,
            accountName: acc.friendlyName,
            accountStatus: acc.status,
            accountType: acc.type,
            isTrial: acc.type === 'Trial',
            verifiedNumbers
          };
        }
      } catch (err) {
        verification = {
          verified: false,
          error: err.message,
          code: err.code,
          isTrial: false,
          verifiedNumbers: []
        };
      }
    }

    const isLive = isConfigured && verification.verified;

    res.json({
      success: true,
      isLiveConfigured: isLive,
      provider: isLive ? 'Twilio Live Carrier' : 'Simulation Mode',
      hasSid: Boolean(sid),
      hasToken: Boolean(token),
      hasPhone: Boolean(phone),
      sidPreview: sid ? `${sid.substring(0, 6)}...${sid.slice(-4)}` : null,
      fromPhone: phone || null,
      verification,
      troubleshooting: {
        trialAccountNote: 'If you have a Twilio Free Trial account, calls and SMS can ONLY be sent to phone numbers verified under "Verified Caller IDs" in Twilio Console.',
        twilioConsoleUrl: 'https://console.twilio.com',
        verifiedNumbersUrl: 'https://console.twilio.com/develop/phone-numbers/manage/verified'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/voice/verified-caller-ids
 * List all verified numbers in Twilio account
 */
router.get('/verified-caller-ids', async (req, res) => {
  try {
    const { client, isLive } = getTwilioClient();
    if (!isLive) {
      return res.json({ success: true, verifiedNumbers: [], isLive: false });
    }
    const callerIds = await client.outgoingCallerIds.list({ limit: 50 });
    return res.json({
      success: true,
      isLive: true,
      verifiedNumbers: callerIds.map(c => ({
        sid: c.sid,
        phoneNumber: c.phoneNumber,
        friendlyName: c.friendlyName,
        dateCreated: c.dateCreated
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/voice/request-verification
 * Request verification for a new phone number via Twilio Validation Requests API
 * Twilio calls the user's phone and gives a validation code they type on their phone keypad!
 */
router.post('/request-verification', async (req, res) => {
  try {
    const { phoneNumber, friendlyName } = req.body || {};
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }
    const formatted = formatE164(phoneNumber);
    if (!formatted) {
      return res.status(400).json({ error: `Invalid phone number format: "${phoneNumber}". Please use format +91 9876543210.` });
    }

    const { client, isLive } = getTwilioClient();
    if (!isLive) {
      return res.status(400).json({ error: 'Twilio is not configured with live credentials in backend/.env.' });
    }

    const vr = await client.validationRequests.create({
      phoneNumber: formatted,
      friendlyName: friendlyName || 'Customer Caller ID'
    });

    return res.json({
      success: true,
      validationCode: vr.validationCode,
      phoneNumber: vr.phoneNumber,
      callSid: vr.callSid,
      message: `Twilio will call ${formatted} right now! Answer the incoming call and type this 6-digit code: ${vr.validationCode}`
    });
  } catch (err) {
    console.error('[Twilio Validation Request Error]', err);
    return res.status(400).json({
      error: parseTwilioError(err, req.body?.phoneNumber)
    });
  }
});

/**
 * POST /api/voice/config
 * Save and verify Twilio credentials directly from Manager portal
 */
router.post('/config', async (req, res) => {
  try {
    const { accountSid, authToken, phoneNumber } = req.body || {};

    if (!accountSid || !authToken || !phoneNumber) {
      return res.status(400).json({ error: 'Account SID, Auth Token, and Twilio Phone Number are all required.' });
    }

    const cleanSid = accountSid.trim().replace(/['"]/g, '');
    const cleanToken = authToken.trim().replace(/['"]/g, '');
    let cleanPhone = phoneNumber.trim().replace(/['"]/g, '').replace(/[\s-]/g, '');

    if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    if (!cleanSid.startsWith('AC')) {
      return res.status(400).json({ error: 'Invalid Account SID. Twilio Account SID must start with "AC".' });
    }

    // 1. Verify with Twilio API before saving
    let accInfo = null;
    try {
      const twilio = require('twilio');
      const client = twilio(cleanSid, cleanToken);
      accInfo = await client.api.v2010.accounts(cleanSid).fetch();
    } catch (authErr) {
      return res.status(400).json({
        error: `Twilio Authentication Failed: ${authErr.message}. Please double-check your Account SID and Auth Token in Twilio Console.`,
        code: authErr.code
      });
    }

    // 2. Update memory process.env
    process.env.TWILIO_ACCOUNT_SID = cleanSid;
    process.env.TWILIO_AUTH_TOKEN = cleanToken;
    process.env.TWILIO_PHONE_NUMBER = cleanPhone;

    // 3. Persist to backend/.env file
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(__dirname, '../.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const setOrAppend = (content, key, val) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${val}`);
      } else {
        return (content.trim() ? content.trim() + '\n' : '') + `${key}=${val}\n`;
      }
    };

    envContent = setOrAppend(envContent, 'TWILIO_ACCOUNT_SID', cleanSid);
    envContent = setOrAppend(envContent, 'TWILIO_AUTH_TOKEN', cleanToken);
    envContent = setOrAppend(envContent, 'TWILIO_PHONE_NUMBER', cleanPhone);

    fs.writeFileSync(envPath, envContent, 'utf8');

    res.json({
      success: true,
      message: `Twilio connected! Verified account "${accInfo.friendlyName}" (${accInfo.type}). Live phone calls & SMS are now active.`,
      accountName: accInfo.friendlyName,
      accountStatus: accInfo.status,
      accountType: accInfo.type,
      fromPhone: cleanPhone
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/voice/test-dispatch
 * Dispatches a quick live test SMS and/or Voice Call with real-time error diagnostics
 */
router.post('/test-dispatch', async (req, res) => {
  try {
    const { to, type = 'BOTH' } = req.body || {};
    if (!to) {
      return res.status(400).json({ error: 'Recipient phone number is required.' });
    }

    const formattedTo = formatE164(to);
    const { client, fromPhone, isLive } = getTwilioClient();

    if (!isLive) {
      return res.json({
        success: true,
        mode: 'simulated',
        recipient: formattedTo,
        message: 'Running in Simulation Mode. To receive real phone calls and SMS on your device, connect your Twilio credentials.',
        simulated: true
      });
    }

    const diagnostics = { sms: null, voice: null };

    // 1. Test SMS
    if (type === 'SMS' || type === 'BOTH') {
      try {
        const msg = await client.messages.create({
          to: formattedTo,
          from: fromPhone,
          body: `🛒 SmartMart Supermarket: Live telephony test successfully verified! Voicemail and SMS promotions are active.`
        });
        diagnostics.sms = { success: true, sid: msg.sid, status: msg.status };
      } catch (e) {
        const errorText = parseTwilioError(e, formattedTo);
        diagnostics.sms = {
          success: false,
          error: errorText,
          rawError: e.message,
          code: e.code,
          isUnverifiedTrialNumber: e.code === 21608
        };
      }
    }

    // 2. Test Voice Call
    if (type === 'VOICEMAIL' || type === 'BOTH') {
      try {
        const twiml = `
          <Response>
            <Pause length="1"/>
            <Say voice="Polly.Aditi" language="en-IN">
              Hello! This is a live voice test from SmartMart Supermarket. Your Twilio Voicemail and SMS integration is working properly! Thank you and goodbye.
            </Say>
          </Response>
        `;
        const call = await client.calls.create({
          to: formattedTo,
          from: fromPhone,
          twiml
        });
        diagnostics.voice = { success: true, sid: call.sid, status: call.status };
      } catch (e) {
        const errorText = parseTwilioError(e, formattedTo);
        diagnostics.voice = {
          success: false,
          error: errorText,
          rawError: e.message,
          code: e.code,
          isUnverifiedTrialNumber: e.code === 21608
        };
      }
    }

    const overallSuccess = (diagnostics.sms?.success || !diagnostics.sms) && (diagnostics.voice?.success || !diagnostics.voice);

    res.json({
      success: overallSuccess,
      recipient: formattedTo,
      fromPhone,
      diagnostics,
      message: overallSuccess 
        ? `Live test dispatched to ${formattedTo}!` 
        : (diagnostics.voice?.error || diagnostics.sms?.error || 'Twilio test call failed')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    // Filter and normalize recipients to only those with valid phone numbers
    const validRecipients = [];
    const skippedRecipients = [];

    for (const cust of recipients) {
      const rawPhone = typeof cust === 'string' ? cust : (cust?.phone || '');
      const custName = typeof cust === 'string' ? 'Valued Customer' : (cust?.name || 'Valued Customer');
      const formatted = formatE164(rawPhone);

      if (formatted) {
        validRecipients.push({ name: custName, phone: formatted, rawPhone });
      } else {
        skippedRecipients.push({ name: custName, phone: rawPhone, reason: 'Missing or invalid phone number' });
        batchLogs.push({
          type: 'SKIPPED',
          recipient: rawPhone || 'NO_PHONE',
          customerName: custName,
          status: 'SKIPPED',
          error: 'Missing or invalid mobile number'
        });
      }
    }

    if (validRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'None of the registered customers have a valid mobile phone number.',
        message: 'No valid phone numbers found. Please link or update customer phone numbers first.',
        skipped: skippedRecipients.length,
        batchLogs
      });
    }

    for (const cust of validRecipients) {
      const toPhone = cust.phone;
      const custName = cust.name;

      // 1. Send SMS to this customer
      if (channels.includes('SMS')) {
        const smsBody = `🎉 SmartMart Deal Alert: ${offerTitle}! Get ${discountPercent}% OFF with code ${promoCode}. ${description}. Shop express delivery: https://smartmart.store`;
        if (isLive) {
          try {
            const msg = await client.messages.create({ to: toPhone, from: fromPhone, body: smsBody });
            smsSuccessCount++;
            batchLogs.push({ type: 'SMS', recipient: toPhone, customerName: custName, status: 'SENT', sid: msg.sid });
          } catch (e) {
            const errStr = parseTwilioError(e, toPhone);
            batchLogs.push({ type: 'SMS', recipient: toPhone, customerName: custName, status: 'FAILED', error: errStr, code: e.code });
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
            const errStr = parseTwilioError(e, toPhone);
            batchLogs.push({ type: 'VOICEMAIL', recipient: toPhone, customerName: custName, status: 'FAILED', error: errStr, code: e.code });
          }
        } else {
          voicemailSuccessCount++;
          batchLogs.push({ type: 'VOICEMAIL', recipient: toPhone, customerName: custName, status: 'QUEUED (SIMULATED)', sid: `CA_SIM_${Date.now()}` });
        }
      }
    }

    // Update campaign counter
    const matched = activeCampaigns.find(c => c.promoCode === promoCode || c.title === offerTitle);
    if (matched) matched.totalDispatched = (matched.totalDispatched || 0) + validRecipients.length;

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

    const voiceRequested = channels.includes('VOICEMAIL');
    const smsRequested = channels.includes('SMS');
    const overallSuccess = (!voiceRequested || voicemailSuccessCount > 0) && (!smsRequested || smsSuccessCount > 0);

    let resultMsg = `Broadcast dispatched to ${validRecipients.length} customer(s).`;
    if (isLive && voiceRequested && voicemailSuccessCount === 0) {
      const firstErr = batchLogs.find(l => l.type === 'VOICEMAIL' && l.status === 'FAILED')?.error;
      resultMsg = firstErr || 'Twilio failed to place voice calls to the recipient(s).';
    }

    res.status(overallSuccess ? 200 : (isLive ? 400 : 200)).json({
      success: overallSuccess,
      message: resultMsg,
      totalCustomers: validRecipients.length,
      skippedCustomers: skippedRecipients.length,
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


