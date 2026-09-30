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
  if (code === 21408 || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('geo')) {
    return `Voice Geo-Permissions: International calling permission is not enabled for destination region. Please enable India / International Voice in Twilio Console -> Voice -> Settings -> Geo Permissions.`;
  }
  if (code === 572006 || msg.toLowerCase().includes('template') || msg.toLowerCase().includes('dlt')) {
    return `Twilio SMS / TRAI Notice: Indian telecom regulations block custom promotional SMS to Indian numbers (+91) on trial accounts without TRAI DLT registration (Twilio error 572006). Automated Voice Calls and WhatsApp are the working channels!`;
  }
  if (code === 21654 || msg.toLowerCase().includes('contentsid')) {
    return `Twilio WhatsApp Notice: Meta requires pre-approved Content Templates for business outbound WhatsApp outside the 24h window. Use the direct WhatsApp button to open and send instantly!`;
  }
  if (code === 0 || msg.toLowerCase().includes('disallowed parameter') || msg.toLowerCase().includes('trial accounts have limited parameter')) {
    return `Twilio Trial Parameter Notice: Trial accounts require a public URL parameter instead of raw inline TwiML. Now handled automatically via Twimlet fallback.`;
  }
  return msg;
}

/**
 * Sanitizes voice text for Twilio XML / Amazon Polly SSML.
 * Strips emojis, converts currency symbols (₹ -> Rupees), converts % -> percent,
 * converts & -> and, @ -> at, removes unescaped quotes, and escapes XML characters.
 * Prevents Amazon Polly parse crashes (Twilio "An application error has occurred. Goodbye").
 */
function sanitizeSpeechForTwiML(rawText) {
  if (!rawText) return '';
  let cleaned = String(rawText);

  // 1. Convert Currency symbols
  cleaned = cleaned.replace(/₹\s*([0-9]+)/g, '$1 Rupees');
  cleaned = cleaned.replace(/₹/g, ' Rupees ');
  cleaned = cleaned.replace(/\$\s*([0-9]+)/g, '$1 Dollars');

  // 2. Convert % to 'percent'
  cleaned = cleaned.replace(/([0-9]+)\s*%/g, '$1 percent');
  cleaned = cleaned.replace(/%/g, ' percent ');

  // 3. Convert & to 'and'
  cleaned = cleaned.replace(/&/g, ' and ');

  // 4. Convert @ to 'at'
  cleaned = cleaned.replace(/@/g, ' at ');

  // 5. Strip all emojis and 4-byte UTF-8 characters that crash Amazon Polly / XML parsers
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '');

  // 6. Clean whitespace and quotes
  cleaned = cleaned.replace(/["']/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 7. XML escape standard entities
  cleaned = cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return cleaned;
}

/**
 * Builds Twilio Call parameters compatible with both Trial and Full accounts.
 * On Twilio Free Trial accounts, passing raw inline 'twiml' strings or 'machineDetection: Enable'
 * causes error 400 code 0 (Invalid or disallowed parameters provided).
 * Converting the TwiML into Twilio's official Twimlet echo URL ensures full compatibility.
 */
function buildTwilioCallParams(formattedTo, fromPhone, twimlString) {
  const echoUrl = `https://twimlets.com/echo?Twiml=${encodeURIComponent(twimlString.trim())}`;
  return {
    to: formattedTo,
    from: fromPhone,
    url: echoUrl
  };
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
 * POST /api/voice/send-whatsapp
 * Dispatches an automated WhatsApp notification or generates a 1-click wa.me direct blast link
 */
router.post('/send-whatsapp', async (req, res) => {
  let formattedTo = null;
  try {
    const {
      to,
      customerName = 'Valued Customer',
      message = '',
      messageText = '',
      customMessage = '',
      offerTitle = '',
      promoCode = '',
      discountPercent = 20
    } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Recipient phone number is required.' });
    }

    formattedTo = formatE164(to);
    let finalBody = customMessage || messageText || message;
    if (!finalBody && offerTitle) {
      finalBody = `🛒 *SmartMart Deal Alert: ${offerTitle}!*\n\nHello ${customerName}! Enjoy *${discountPercent}% OFF* with code *${promoCode || 'DEAL'}*.\n\nFresh groceries delivered in 15 mins: https://smartmart.store`;
    } else if (!finalBody) {
      finalBody = `🛒 *SmartMart Supermarket*: Hello ${customerName}, your grocery order update is ready. Track in your SmartMart app.`;
    }

    finalBody = finalBody.replace(/\[Customer Name\]|\{name\}/gi, customerName);

    const cleanDigits = formattedTo.replace(/[^0-9]/g, '');
    const directWaUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(finalBody)}`;

    const { client, fromPhone, isLive } = getTwilioClient();

    if (isLive) {
      try {
        const waMsg = await client.messages.create({
          to: `whatsapp:${formattedTo}`,
          from: `whatsapp:${fromPhone}`,
          body: finalBody
        });

        console.log(`[Twilio WhatsApp] Message sent to ${formattedTo}. SID: ${waMsg.sid}`);

        const record = {
          id: `DISP-${Date.now().toString().slice(-4)}`,
          type: 'WHATSAPP',
          recipient: formattedTo,
          customerName,
          title: offerTitle || 'WhatsApp Alert',
          status: waMsg.status || 'SENT',
          provider: 'Twilio WhatsApp',
          sid: waMsg.sid,
          timestamp: new Date().toISOString()
        };
        dispatchHistory.unshift(record);

        return res.status(200).json({
          success: true,
          mode: 'twilio_live',
          sid: waMsg.sid,
          recipient: formattedTo,
          body: finalBody,
          waLink: directWaUrl,
          message: `WhatsApp message dispatched successfully to ${formattedTo}!`
        });
      } catch (waErr) {
        console.warn(`[Twilio WhatsApp API Notice] ${waErr.message} (Code: ${waErr.code})`);

        // Record fallback direct link in dispatch history
        const record = {
          id: `DISP-${Date.now().toString().slice(-4)}`,
          type: 'WHATSAPP',
          recipient: formattedTo,
          customerName,
          title: offerTitle || 'WhatsApp Alert',
          status: 'READY_IN_WHATSAPP',
          provider: 'WhatsApp Click-to-Chat',
          sid: `WA_${Date.now()}`,
          timestamp: new Date().toISOString()
        };
        dispatchHistory.unshift(record);

        return res.status(200).json({
          success: true,
          mode: 'direct_link',
          fallback: true,
          waLink: directWaUrl,
          recipient: formattedTo,
          body: finalBody,
          message: `WhatsApp direct link ready! Click the WhatsApp button to open and send immediately without template restrictions.`
        });
      }
    } else {
      // Simulation mode
      return res.status(200).json({
        success: true,
        mode: 'simulated',
        waLink: directWaUrl,
        recipient: formattedTo,
        body: finalBody,
        message: `[Simulation Mode] WhatsApp message prepared for ${formattedTo}`
      });
    }
  } catch (error) {
    console.error('Error in /api/voice/send-whatsapp:', error);
    return res.status(400).json({
      error: parseTwilioError(error, formattedTo)
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
      customMessage = '',
      voicemailMessage = '',
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

    const rawSpeech = buildVoicemailScript({
      customerName,
      orderId,
      orderStatus,
      customMessage: customMessage || voicemailMessage || messageText,
      offerTitle,
      promoCode,
      discount: discountPercent
    });
    const spokenText = sanitizeSpeechForTwiML(rawSpeech);

    const { client, fromPhone, isLive } = getTwilioClient();

    if (isLive) {
      const twiml = `
        <Response>
          <Pause length="1"/>
          <Say voice="${voice}" language="${language}">
            ${spokenText}
          </Say>
          <Pause length="2"/>
          <Say voice="${voice}" language="${language}">
            This was an automated notification from SmartMart Supermarket. Goodbye!
          </Say>
        </Response>
      `.trim();

      const callParams = buildTwilioCallParams(formattedTo, fromPhone, twiml);
      const call = await client.calls.create(callParams);

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
      channels = ['SMS', 'VOICEMAIL'],
      customMessage = '',
      voicemailMessage = '',
      messageText = ''
    } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Recipient phone number is required.' });
    }

    const formattedTo = formatE164(to);
    const results = {};
    const customText = (customMessage || voicemailMessage || messageText || '').trim();

    // 1. Send SMS if requested
    if (channels.includes('SMS')) {
      const smsBody = customText
        ? customText.replace(/\[Customer Name\]|\{name\}/gi, customerName)
        : `🎉 SmartMart Deal Alert: ${offerTitle}! Enjoy ${discountPercent}% OFF with code ${promoCode}. ${description || 'Fresh fruits, vegetables & groceries delivered in 15 mins'}. Shop now: https://smartmart.store`;
      
      const directSmsUrl = `sms:${formattedTo}?body=${encodeURIComponent(smsBody)}`;
      const { client, fromPhone, isLive } = getTwilioClient();
      if (isLive) {
        try {
          const msg = await client.messages.create({
            to: formattedTo,
            from: fromPhone,
            body: smsBody
          });
          results.sms = { success: true, mode: 'twilio_live', sid: msg.sid, smsLink: directSmsUrl };
        } catch (e) {
          results.sms = { success: false, error: parseTwilioError(e, formattedTo), code: e.code, smsLink: directSmsUrl };
        }
      } else {
        results.sms = { success: true, mode: 'simulated', sid: `SM_SIM_${Date.now()}`, smsLink: directSmsUrl };
      }
    }

    // 2. Send Voicemail if requested
    if (channels.includes('VOICEMAIL')) {
      const rawSpeech = customText
        ? customText.replace(/\[Customer Name\]|\{name\}/gi, customerName)
        : buildVoicemailScript({
            customerName,
            offerTitle,
            promoCode,
            discount: discountPercent
          });
      const speech = sanitizeSpeechForTwiML(rawSpeech);
      console.log(`[Twilio Offer Alert Voice] To: ${formattedTo} | Speech: "${speech}"`);

      const { client, fromPhone, isLive } = getTwilioClient();
      if (isLive) {
        try {
          const twiml = `
            <Response>
              <Pause length="1"/>
              <Say voice="Polly.Aditi" language="en-IN">${speech}</Say>
              <Pause length="2"/>
              <Say voice="Polly.Aditi" language="en-IN">Repeating your exclusive offer: ${speech}</Say>
              <Pause length="1"/>
              <Say voice="Polly.Aditi" language="en-IN">Thank you for choosing SmartMart Supermarket. Goodbye!</Say>
            </Response>
          `;
          const callParams = buildTwilioCallParams(formattedTo, fromPhone, twiml);
          const call = await client.calls.create(callParams);
          results.voicemail = { success: true, mode: 'twilio_live', callSid: call.sid };
        } catch (e) {
          results.voicemail = { success: false, error: parseTwilioError(e, formattedTo), code: e.code };
        }
      } else {
        results.voicemail = { success: true, mode: 'simulated', callSid: `CA_SIM_${Date.now()}` };
      }
    }

    // 3. Send WhatsApp if requested
    if (channels.includes('WHATSAPP')) {
      const waText = customText
        ? customText.replace(/\[Customer Name\]|\{name\}/gi, customerName)
        : `🛒 *SmartMart Deal Alert: ${offerTitle}!*\n\nHello ${customerName}! Enjoy *${discountPercent}% OFF* with coupon code *${promoCode}*.\n\nShop 15-min delivery: https://smartmart.store`;

      const cleanDigits = formattedTo.replace(/[^0-9]/g, '');
      const directWaUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(waText)}`;

      const { client, fromPhone, isLive } = getTwilioClient();
      if (isLive) {
        try {
          const waMsg = await client.messages.create({
            to: `whatsapp:${formattedTo}`,
            from: `whatsapp:${fromPhone}`,
            body: waText
          });
          results.whatsapp = { success: true, mode: 'twilio_live', sid: waMsg.sid, waLink: directWaUrl };
        } catch (e) {
          results.whatsapp = { 
            success: true, 
            mode: 'direct_link', 
            fallback: true, 
            waLink: directWaUrl, 
            error: parseTwilioError(e, formattedTo), 
            code: e.code 
          };
        }
      } else {
        results.whatsapp = { success: true, mode: 'simulated', sid: `WA_SIM_${Date.now()}`, waLink: directWaUrl };
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

    let summaryMessage = '';
    const parts = [];
    if (results.voicemail?.success) parts.push('Voice Call');
    if (results.whatsapp?.success) parts.push('WhatsApp');
    if (results.sms?.success) parts.push('SMS');

    if (parts.length > 0) {
      summaryMessage = `Dispatched successfully via ${parts.join(' & ')} to ${formattedTo}!`;
    } else {
      summaryMessage = `Notification processed for ${formattedTo}.`;
    }

    if (results.sms && !results.sms.success) {
      summaryMessage += ' (Note: Twilio trial accounts cannot deliver custom SMS to Indian +91 numbers without TRAI DLT; use Voice Call and WhatsApp).';
    }

    return res.status(200).json({
      success: true,
      recipient: formattedTo,
      offerTitle,
      promoCode,
      results,
      waLink: results.whatsapp?.waLink,
      smsLink: results.sms?.smsLink,
      message: summaryMessage
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

          let balance = null;
          try {
            const balRes = await client.balance.fetch();
            balance = balRes.balance;
          } catch (bErr) {}

          let activeNumbers = [];
          try {
            const pns = await client.incomingPhoneNumbers.list({ limit: 10 });
            activeNumbers = pns.map(p => p.phoneNumber);
          } catch (pnErr) {}

          verification = {
            verified: true,
            error: null,
            accountName: acc.friendlyName,
            accountStatus: acc.status,
            accountType: acc.type,
            isTrial: acc.type === 'Trial',
            balance,
            activeNumbers,
            verifiedNumbers
          };
        }
      } catch (err) {
        verification = {
          verified: false,
          error: err.message,
          code: err.code,
          isTrial: false,
          balance: null,
          activeNumbers: [],
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
 * ALL /api/voice/incoming and /api/voice/inbound
 * TwiML Webhook for Inbound Calls to the Supermarket's Twilio Number
 * Greets caller, gives self-service options, and allows leaving a recorded Voicemail!
 */
router.all(['/incoming', '/inbound'], (req, res) => {
  const caller = req.body?.From || req.query?.From || 'Customer';
  console.log(`[Twilio Inbound Call] Incoming call received from ${caller}`);

  const twiml = `
    <Response>
      <Gather action="/api/voice/inbound-gather" method="POST" numDigits="1" timeout="7">
        <Say voice="Polly.Aditi" language="en-IN">
          Thank you for calling SmartMart Supermarket automated helpline.
          Press 1 to hear current store discounts and promo codes.
          Press 2 to check home delivery timings.
          Press 3 to leave a voice message or inquiry for our store manager.
        </Say>
      </Gather>
      <Say voice="Polly.Aditi" language="en-IN">
        We did not receive your key press. Please leave your voicemail message after the tone. Press pound when finished.
      </Say>
      <Record action="/api/voice/recording-callback" maxLength="60" finishOnKey="#" playBeep="true"/>
    </Response>
  `.trim();

  res.type('text/xml');
  res.send(twiml);
});

/**
 * ALL /api/voice/inbound-gather
 * Handles keypad selection from inbound callers
 */
router.all('/inbound-gather', (req, res) => {
  const digits = req.body?.Digits || req.query?.Digits;

  let twiml = '';
  if (digits === '1') {
    const topCampaign = activeCampaigns[0];
    const dealMsg = topCampaign 
      ? `Our featured deal today is ${topCampaign.title}. Use promo code ${topCampaign.promoCode} at checkout for flat ${topCampaign.discountPercent} percent discount.`
      : 'Enjoy flat 20 percent off on all fresh fruits and vegetables today.';
    twiml = `
      <Response>
        <Say voice="Polly.Aditi" language="en-IN">${dealMsg} Order now through your SmartMart mobile app or website. Thank you for calling!</Say>
        <Pause length="1"/>
        <Say voice="Polly.Aditi" language="en-IN">Goodbye!</Say>
      </Response>
    `;
  } else if (digits === '2') {
    twiml = `
      <Response>
        <Say voice="Polly.Aditi" language="en-IN">
          SmartMart offers express 15-minute doorstep delivery everyday between 7 AM and 11 PM. Our takeaway pickup counter is open 24 hours.
        </Say>
        <Pause length="1"/>
        <Say voice="Polly.Aditi" language="en-IN">Thank you for calling SmartMart Supermarket. Goodbye!</Say>
      </Response>
    `;
  } else if (digits === '3') {
    twiml = `
      <Response>
        <Say voice="Polly.Aditi" language="en-IN">
          Please state your name, order number, and message after the beep. Press pound when done.
        </Say>
        <Record action="/api/voice/recording-callback" maxLength="120" finishOnKey="#" playBeep="true"/>
      </Response>
    `;
  } else {
    twiml = `
      <Response>
        <Say voice="Polly.Aditi" language="en-IN">
          Invalid option selected. Please leave your message after the tone.
        </Say>
        <Record action="/api/voice/recording-callback" maxLength="60" finishOnKey="#" playBeep="true"/>
      </Response>
    `;
  }

  res.type('text/xml');
  res.send(twiml.trim());
});

/**
 * ALL /api/voice/recording-callback
 * Receives Twilio Voicemail recordings from callers and stores them in dispatch history
 */
router.all('/recording-callback', (req, res) => {
  const recordingUrl = req.body?.RecordingUrl || req.query?.RecordingUrl;
  const caller = req.body?.From || req.query?.From || 'Caller';
  const duration = req.body?.RecordingDuration || req.query?.RecordingDuration || '0';
  const callSid = req.body?.CallSid || req.query?.CallSid || `REC_${Date.now()}`;

  console.log(`[Incoming Voicemail Recorded] From: ${caller} | Duration: ${duration}s | URL: ${recordingUrl}`);

  if (recordingUrl) {
    const record = {
      id: `VM-IN-${Date.now().toString().slice(-4)}`,
      type: 'INCOMING_VOICEMAIL',
      recipient: caller,
      customerName: 'Customer Inbound Caller',
      title: `Voicemail (${duration}s audio message)`,
      status: 'RECEIVED',
      provider: 'Twilio Inbound Voice',
      recordingUrl: `${recordingUrl}.mp3`,
      sid: callSid,
      timestamp: new Date().toISOString()
    };
    dispatchHistory.unshift(record);
  }

  const twiml = `
    <Response>
      <Say voice="Polly.Aditi" language="en-IN">
        Thank you! Your voicemail message has been recorded and delivered to the SmartMart management team. Have a wonderful day!
      </Say>
    </Response>
  `.trim();

  res.type('text/xml');
  res.send(twiml);
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
        const callParams = buildTwilioCallParams(formattedTo, fromPhone, twiml);
        const call = await client.calls.create(callParams);
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
      targetRecipients = [],
      customMessage = '',
      voicemailMessage = '',
      messageText = ''
    } = req.body;

    const customText = (customMessage || voicemailMessage || messageText || '').trim();

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
    let whatsappSuccessCount = 0;

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

      // 1. Send SMS to this customer (prioritizing user customized text)
      if (channels.includes('SMS')) {
        const smsBody = customText
          ? customText.replace(/\[Customer Name\]|\{name\}/gi, custName)
          : `🎉 SmartMart Deal Alert: ${offerTitle}! Get ${discountPercent}% OFF with code ${promoCode}. ${description}. Shop express delivery: https://smartmart.store`;
        const directSmsUrl = `sms:${toPhone}?body=${encodeURIComponent(smsBody)}`;
        if (isLive) {
          try {
            const msg = await client.messages.create({ to: toPhone, from: fromPhone, body: smsBody });
            smsSuccessCount++;
            batchLogs.push({ type: 'SMS', recipient: toPhone, customerName: custName, status: 'SENT', sid: msg.sid, smsLink: directSmsUrl });
          } catch (e) {
            const errStr = parseTwilioError(e, toPhone);
            batchLogs.push({ 
              type: 'SMS', 
              recipient: toPhone, 
              customerName: custName, 
              status: e.code === 572006 ? 'TRIAL_RESTRICTED' : 'FAILED', 
              error: errStr, 
              code: e.code,
              smsLink: directSmsUrl
            });
          }
        } else {
          smsSuccessCount++;
          batchLogs.push({ type: 'SMS', recipient: toPhone, customerName: custName, status: 'DELIVERED (SIMULATED)', sid: `SM_SIM_${Date.now()}`, smsLink: directSmsUrl });
        }
      }

      // 2. Send Voicemail to this customer (prioritizing sanitized customized speech)
      if (channels.includes('VOICEMAIL')) {
        const rawSpeech = customText
          ? customText.replace(/\[Customer Name\]|\{name\}/gi, custName)
          : buildVoicemailScript({ customerName: custName, offerTitle, promoCode, discount: discountPercent });

        const speech = sanitizeSpeechForTwiML(rawSpeech);
        console.log(`[Broadcast-All Voice] To: ${toPhone} (${custName}) | Spoken speech: "${speech}"`);

        if (isLive) {
          try {
            const twiml = `
              <Response>
                <Pause length="1"/>
                <Say voice="Polly.Aditi" language="en-IN">${speech}</Say>
                <Pause length="2"/>
                <Say voice="Polly.Aditi" language="en-IN">Repeating the announcement: ${speech}</Say>
                <Pause length="1"/>
                <Say voice="Polly.Aditi" language="en-IN">Thank you for shopping at SmartMart Supermarket. Goodbye!</Say>
              </Response>
            `;
            const callParams = buildTwilioCallParams(toPhone, fromPhone, twiml);
            const call = await client.calls.create(callParams);
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

      // 3. Send WhatsApp to this customer
      if (channels.includes('WHATSAPP')) {
        const waBody = customText
          ? customText.replace(/\[Customer Name\]|\{name\}/gi, custName)
          : `🛒 *SmartMart Deal Alert: ${offerTitle}!*\n\nHello ${custName}! Get *${discountPercent}% OFF* with code *${promoCode}*.\n\nShop now: https://smartmart.store`;

        const cleanDigits = toPhone.replace(/[^0-9]/g, '');
        const directWaUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(waBody)}`;

        if (isLive) {
          try {
            const waMsg = await client.messages.create({
              to: `whatsapp:${toPhone}`,
              from: `whatsapp:${fromPhone}`,
              body: waBody
            });
            whatsappSuccessCount++;
            batchLogs.push({ type: 'WHATSAPP', recipient: toPhone, customerName: custName, status: 'SENT', sid: waMsg.sid, waLink: directWaUrl });
          } catch (e) {
            whatsappSuccessCount++;
            batchLogs.push({ 
              type: 'WHATSAPP', 
              recipient: toPhone, 
              customerName: custName, 
              status: 'READY_IN_WHATSAPP', 
              error: parseTwilioError(e, toPhone), 
              code: e.code, 
              waLink: directWaUrl 
            });
          }
        } else {
          whatsappSuccessCount++;
          batchLogs.push({ type: 'WHATSAPP', recipient: toPhone, customerName: custName, status: 'DELIVERED (SIMULATED)', sid: `WA_SIM_${Date.now()}`, waLink: directWaUrl });
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
    const waRequested = channels.includes('WHATSAPP');
    const smsRequested = channels.includes('SMS');
    const overallSuccess = (!voiceRequested || voicemailSuccessCount > 0) || (!waRequested || whatsappSuccessCount > 0);

    const activeDeliveredChannels = [];
    if (voicemailSuccessCount > 0) activeDeliveredChannels.push(`${voicemailSuccessCount} Voice Calls placed`);
    if (whatsappSuccessCount > 0) activeDeliveredChannels.push(`${whatsappSuccessCount} WhatsApp alerts ready`);
    if (smsSuccessCount > 0) activeDeliveredChannels.push(`${smsSuccessCount} SMS delivered`);

    let resultMsg = activeDeliveredChannels.length > 0 
      ? `Dispatched: ${activeDeliveredChannels.join(', ')}.`
      : `Broadcast dispatched to ${validRecipients.length} customer(s).`;

    if (isLive && smsRequested && smsSuccessCount === 0) {
      resultMsg += ' Note: Indian TRAI DLT blocks custom promotional SMS on Twilio trial accounts; Voice Call and WhatsApp have delivered your announcement.';
    }

    res.status(overallSuccess ? 200 : 400).json({
      success: overallSuccess,
      message: resultMsg,
      totalCustomers: validRecipients.length,
      skippedCustomers: skippedRecipients.length,
      smsSent: smsSuccessCount,
      voicemailsPlaced: voicemailSuccessCount,
      whatsappSent: whatsappSuccessCount,
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

/**
 * POST /api/voice/test-custom-speech
 * Directly dials a phone number to test and verify customized speech audio
 */
router.post('/test-custom-speech', async (req, res) => {
  try {
    const { 
      to = '+919514134125', 
      text = 'Hello, this is a test of your customized voice announcement from SmartMart Supermarket.', 
      customerName = 'Vignesh' 
    } = req.body || {};

    const formattedTo = formatE164(to);
    if (!formattedTo) {
      return res.status(400).json({ error: `Invalid destination number: ${to}` });
    }

    const { client, fromPhone, isLive } = getTwilioClient();
    const rawSpeech = (text || '').replace(/\[Customer Name\]|\{name\}/gi, customerName);
    const cleanSpeech = sanitizeSpeechForTwiML(rawSpeech);

    console.log(`[Test Custom Speech] Destination: ${formattedTo} | Speech: "${cleanSpeech}"`);

    if (!isLive) {
      return res.json({
        success: true,
        mode: 'simulated',
        spokenText: cleanSpeech,
        recipient: formattedTo,
        message: `[Simulation Mode] Voice call simulated to ${formattedTo}. Speech: "${cleanSpeech}"`
      });
    }

    const twiml = `
      <Response>
        <Pause length="1"/>
        <Say voice="Polly.Aditi" language="en-IN">${cleanSpeech}</Say>
        <Pause length="2"/>
        <Say voice="Polly.Aditi" language="en-IN">Repeating your customized message: ${cleanSpeech}</Say>
        <Pause length="1"/>
        <Say voice="Polly.Aditi" language="en-IN">Thank you! Test announcement completed. Goodbye!</Say>
      </Response>
    `.trim();

    const callParams = buildTwilioCallParams(formattedTo, fromPhone, twiml);
    const call = await client.calls.create(callParams);

    console.log(`[Test Custom Speech Call] SID: ${call.sid} | To: ${formattedTo}`);

    // Prepend to recent history
    dispatchHistory.unshift({
      id: `DISP-${Date.now().toString().slice(-4)}_TST`,
      type: 'VOICEMAIL',
      recipient: formattedTo,
      customerName,
      title: 'Custom Message Test Call',
      status: 'QUEUED',
      provider: 'Twilio Live',
      sid: call.sid,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      callSid: call.sid,
      recipient: formattedTo,
      spokenText: cleanSpeech,
      message: `Call placed to ${formattedTo}! Answer and press 1 to hear: "${cleanSpeech.substring(0, 60)}..."`
    });
  } catch (err) {
    console.error('Error in /test-custom-speech:', err);
    return res.status(400).json({
      error: parseTwilioError(err, req.body?.to || '')
    });
  }
});

module.exports = router;



