const path = require('path');
try { require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); } catch (e) {}
const express = require('express');
const router = express.Router();

const getAIConfig = () => {
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || '').trim();

  const hasGemini = Boolean(geminiKey && !geminiKey.includes('your_gemini'));
  const hasOpenAI = Boolean(openaiKey && !openaiKey.includes('your_openai'));
  const hasGroq = Boolean(groqKey && !groqKey.includes('your_groq'));

  if (hasGemini) {
    return {
      configured: true,
      provider: 'gemini',
      model: (process.env.GEMINI_MODEL || 'gemini-3.6-flash').trim(),
      apiKey: geminiKey
    };
  }
  if (hasGroq) {
    return {
      configured: true,
      provider: 'groq',
      model: (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim(),
      apiKey: groqKey
    };
  }
  if (hasOpenAI) {
    return {
      configured: true,
      provider: 'openai',
      model: (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim(),
      apiKey: openaiKey
    };
  }

  return { configured: false, provider: 'local', model: 'rule-based', apiKey: '' };
};

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  es: 'Spanish'
};

const buildSystemPrompt = ({ language = 'en', context = {} }) => {
  const langName = LANGUAGE_NAMES[language] || 'English';
  const products = Array.isArray(context.products) ? context.products.slice(0, 40) : [];
  const orders = Array.isArray(context.orders) ? context.orders.slice(0, 5) : [];
  const cart = Array.isArray(context.shoppingList) ? context.shoppingList.slice(0, 20) : [];
  const currentTime = context.clientTime || new Date().toLocaleString();

  return `You are Gemma, a smart, friendly, and capable Generative AI assistant (powered by Gemini) inside SmartMart Express Supermarket.

CURRENT LOCAL DATE & TIME: ${currentTime}
STORE INFO: Open daily 7:00 AM – 11:00 PM; 15-minute express delivery within 5 km, free delivery above ₹199; payments: Razorpay UPI/Cards/Netbanking, PayPal Global, SmartWallet, Cash on Delivery.

You can answer ANY question the user asks—just like Gemini or ChatGPT—including general knowledge, current time/date (using CURRENT LOCAL DATE & TIME above), cooking & recipes, nutrition & health, meal planning, math, budgeting, product comparisons, or everyday questions, as well as SmartMart store help.

Guidelines:
- Respond in ${langName} (unless the user explicitly writes in another language, in which case match their language).
- Give thorough, genuinely helpful, well-structured answers. Do not refuse general questions just because they aren't in the store catalog.
- Format "text" cleanly using line breaks, numbered steps or bullet points (- ), and **bold** for key terms. Avoid ### headings or --- dividers.
- When the user's question relates to groceries, cooking, ingredients, or their orders/cart, also weave in relevant items from the STORE CATALOG (with exact ₹ prices and aisles) or CUSTOMER'S RECENT ORDERS below.

STORE CATALOG (reference exact IDs, names, ₹ prices, and aisles when recommending in-store items):
${JSON.stringify(products)}

CUSTOMER'S CURRENT CART:
${JSON.stringify(cart)}

CUSTOMER'S RECENT ORDERS:
${JSON.stringify(orders)}

Always reply with a valid JSON object matching this exact schema:
{
  "text": "Your helpful, complete response for the chat bubble",
  "spokenText": "A natural, concise plain-text summary without emojis or markdown for voice TTS",
  "matchedProductIds": ["id1", "id2"],
  "suggestions": ["Short follow-up chip 1", "Short follow-up chip 2", "Short follow-up chip 3"]
}
Only include product IDs in "matchedProductIds" that actually exist in STORE CATALOG above (up to 4 most relevant items). If no store products apply to the user's question, return [].`;
};

const safeParseAIJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

// 1. Check Generative AI configuration status
router.get('/status', (req, res) => {
  const cfg = getAIConfig();
  res.json({
    configured: cfg.configured,
    provider: cfg.provider,
    model: cfg.model
  });
});

// 2. Generative AI Chat Endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'en', context = {} } = req.body;
    const userMessage = (message || '').trim();
    if (!userMessage) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const cfg = getAIConfig();
    if (!cfg.configured) {
      return res.json({
        success: false,
        fallback: true,
        reason: 'NO_AI_KEY_CONFIGURED'
      });
    }

    const systemPrompt = buildSystemPrompt({ language, context });
    const recentHistory = Array.isArray(history)
      ? history
          .filter((m) => m && m.text && (m.sender === 'user' || m.sender === 'bot'))
          .slice(-8)
      : [];

    let rawResponseText = '';

    if (cfg.provider === 'gemini') {
      const contents = [
        ...recentHistory.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: String(m.text) }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const candidateModels = [...new Set([
        cfg.model,
        'gemini-3.6-flash',
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.1-flash-lite'
      ].filter(Boolean))];

      let lastGeminiErr = null;
      for (const modelName of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const apiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json'
              }
            })
          });
          clearTimeout(timeout);

          const data = await apiRes.json();
          if (apiRes.ok) {
            rawResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (rawResponseText) break;
          }

          lastGeminiErr = data?.error?.message || `Gemini API error (${apiRes.status})`;
          if (![404, 429, 500, 503].includes(apiRes.status)) {
            throw new Error(lastGeminiErr);
          }
        } catch (modelErr) {
          lastGeminiErr = modelErr.message;
          if (modelErr.name !== 'AbortError' && !lastGeminiErr.includes('Gemini API error') && !lastGeminiErr.includes('high demand')) {
            // Network/timeout on this model -> continue to next candidate
          }
        }
      }

      if (!rawResponseText) {
        throw new Error(lastGeminiErr || 'All Gemini models unavailable');
      }
    } else {
      // OpenAI or Groq (OpenAI-compatible endpoint)
      const endpoint = cfg.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: String(m.text)
        })),
        { role: 'user', content: userMessage }
      ];

      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          temperature: 0.6,
          max_tokens: 700,
          response_format: { type: 'json_object' }
        })
      });

      const data = await apiRes.json();
      if (!apiRes.ok) {
        throw new Error(data?.error?.message || `${cfg.provider} API error (${apiRes.status})`);
      }

      rawResponseText = data?.choices?.[0]?.message?.content || '';
    }

    const parsed = safeParseAIJson(rawResponseText);
    const replyText = (parsed?.text || rawResponseText || '').trim();
    if (!replyText) {
      throw new Error('Empty response from AI provider');
    }

    return res.json({
      success: true,
      provider: cfg.provider,
      model: cfg.model,
      text: replyText,
      spokenText: (parsed?.spokenText || replyText).replace(/[*_`#]/g, '').trim(),
      matchedProductIds: Array.isArray(parsed?.matchedProductIds) ? parsed.matchedProductIds.slice(0, 4) : [],
      suggestions: Array.isArray(parsed?.suggestions) && parsed.suggestions.length > 0
        ? parsed.suggestions.slice(0, 4)
        : ['🥛 Where is Milk?', '🍛 Suggest a Recipe', '🛵 Track My Order']
    });
  } catch (err) {
    console.warn('⚠️ Generative AI Chat fallback:', err.message);
    return res.json({
      success: false,
      fallback: true,
      reason: err.message
    });
  }
});

module.exports = router;
