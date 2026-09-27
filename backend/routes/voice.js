const express = require('express');
const router = express.Router();

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
 * Build dynamic speech message based on order context
 */
function buildVoicemailScript({ customerName = 'Customer', orderId = 'ORD-00000', orderStatus = 'CONFIRMED', customMessage = '' }) {
  if (customMessage && customMessage.trim().length > 0) {
    return customMessage.trim();
  }

  const cleanName = customerName || 'Valued Customer';
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
      voice = 'Polly.Aditi', // Amazon Polly Indian English voice
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
      customMessage: messageText
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    const isTwilioConfigured = !!(accountSid && authToken && fromPhone && !accountSid.includes('your_'));

    if (isTwilioConfigured) {
      // Live Twilio Outbound Voice Call Execution
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);

      // Escape XML entities in speech text
      const escapedText = spokenText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      // TwiML with pause, greeting, message, and repeat if needed
      const twiml = `
        <Response>
          <Pause length="1"/>
          <Say voice="${voice}" language="${language}">
            ${escapedText}
          </Say>
          <Pause length="2"/>
          <Say voice="${voice}" language="${language}">
            This was an automated voicemail notification from SmartMart Supermarket. Goodbye!
          </Say>
        </Response>
      `.trim();

      const call = await client.calls.create({
        to: formattedTo,
        from: fromPhone,
        twiml: twiml,
        // Detect answering machines & leave message after beep
        machineDetection: 'Enable',
        asyncAmd: 'true'
      });

      console.log(`[Twilio Voice] Outbound call placed to ${formattedTo}. SID: ${call.sid}`);

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
      // Simulation / Development Fallback Mode (Full test without requiring paid Twilio account)
      const mockCallSid = `CA_SIM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`[Voicemail Simulation] Call dispatched to ${formattedTo}:`);
      console.log(`[Voicemail Text] "${spokenText}"`);

      return res.status(200).json({
        success: true,
        mode: 'simulated',
        callSid: mockCallSid,
        status: 'queued',
        recipient: formattedTo,
        spokenText,
        message: `[Simulation Mode] Voice notification dispatched to ${formattedTo}. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in backend/.env for real carrier calls.`,
        instructions: {
          step1: 'Sign up at https://www.twilio.com and get a trial phone number',
          step2: 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER into backend/.env',
          step3: 'Restart backend to trigger live phone calls.'
        }
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
 * GET /api/voice/status
 * Check voice provider status
 */
router.get('/status', (req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const isConfigured = !!(accountSid && !accountSid.includes('your_'));
  res.json({
    status: 'OK',
    provider: isConfigured ? 'Twilio Voice (Active)' : 'Simulation Mode (Ready for Twilio Credentials)',
    isLiveConfigured: isConfigured
  });
});

module.exports = router;
