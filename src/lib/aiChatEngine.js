/**
 * SmartMart AI Genie Natural Language Query & Reasoning Engine
 * Handles intent detection, multi-token fuzzy matching, dynamic recipe building,
 * live order tracking status, store FAQs, and multilingual speech/text synthesis.
 */

// Common English & Multilingual Stop Words to strip for intent & product tokenization
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'where', 'can', 'i', 'find', 'get', 'buy', 'show', 'me', 'do', 'you', 'have', 'sell', 'located', 'location',
  'aisle', 'shelf', 'which', 'row', 'how', 'much', 'price', 'cost', 'give', 'want', 'need', 'looking', 'what',
  'please', 'tell', 'about', 'available', 'stock', 'any', 'some', 'there', 'kahan', 'hai', 'kaha', 'irukku',
  'irukadhu', 'ekkada', 'donde', 'esta'
]);

/**
 * Tokenize query string into cleaned lowercase keyword array
 */

export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Main AI Engine Function
 * @param {string} query - Raw user input text
 * @param {Object} context - Supermarket context data { products, orders, popularRecipes, shoppingList, language, t }
 */
export function generateAIResponse(query, context) {
  const { 
    products = [], 
    orders = [], 
    popularRecipes = [], 
    shoppingList = [], 
    language = 'en',
    t = (k, d) => d
  } = context;

  const rawQuery = (query || '').trim();
  const qLower = rawQuery.toLowerCase();
  const tokens = tokenize(rawQuery);
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // -------------------------------------------------------------
  // 1. GREETINGS & INTRODUCTIONS
  // -------------------------------------------------------------
  const isGreeting = /^(hi|hello|hey|greetings|hola|namaste|vanakkam|namaskaram|good morning|good afternoon|good evening|who are you|help)\b/i.test(qLower);
  if (isGreeting && tokens.length <= 2) {
    const greetingText = language === 'hi'
      ? 'नमस्ते! मैं आपका स्मार्टमार्ट एआई शॉपिंग सहायक हूँ। मैं उत्पाद की स्थिति, शेल्फ स्थान, रेसिपी और ऑर्डर ट्रैक करने में आपकी मदद कर सकता हूँ।'
      : language === 'ta'
      ? 'வணக்கம்! நான் உங்கள் ஸ்மார்ட்மார்ட் AI உதவி செயலி. நீங்கள் விரும்பும் பொருட்கள், கடையின் அடுக்கு எண் மற்றும் சமையல் குறிப்புகளை நான் காட்ட முடியும்.'
      : language === 'te'
      ? 'నమస్కారం! నేను మీ స్మార్ట్‌మార్ట్ AI అసిస్టెంట్‌ని. వస్తువుల స్థానం, ధరలు, వంటకాలు మరియు ఆర్డర్ ట్రాకింగ్‌లో నేను మీకు సహాయం చేయగలను.'
      : language === 'es'
      ? '¡Hola! Soy tu asistente de compras SmartMart AI. ¿En qué te puedo ayudar hoy?'
      : 'Hello! I am your SmartMart AI Assistant. I can help you locate products in our aisles, recommend recipes with 1-click cart addition, check stock, and track live orders!';

    return {
      id: 'b_' + Date.now(),
      sender: 'bot',
      type: 'text',
      text: greetingText,
      spokenText: greetingText,
      timestamp,
      suggestions: [
        '🥛 Where is Milk?',
        '🍛 Paneer Butter Masala Recipe',
        '🛵 Track My Live Order',
        '🏷️ Current Offers & Deals',
        '⏰ Store Timings & Address'
      ]
    };
  }

  // -------------------------------------------------------------
  // 2. STORE FAQs (Timings, Payment, Delivery, Address, Contact, Returns)
  // -------------------------------------------------------------
  
  // A. Timings
  if (qLower.includes('timing') || qLower.includes('open') || qLower.includes('close') || qLower.includes('hours') || qLower.includes('schedule')) {
    const text = language === 'hi'
      ? 'स्मार्टमार्ट सुपरमार्केट रोजाना सुबह 7:00 बजे से रात 11:00 बजे तक खुला रहता है।'
      : language === 'ta'
      ? 'ஸ்மார்ட்மார்ட் சூப்பர் மார்க்கெட் தினமும் காலை 7:00 மணி முதல் இரவு 11:00 மணி வரை திறந்திருக்கும்.'
      : language === 'te'
      ? 'స్మార్ట్‌మార్ట్ సూపర్‌మార్కెట్ ప్రతిరోజూ ఉదయం 7:00 నుండి రాత్రి 11:00 వరకు తెరిచి ఉంటుంది.'
      : language === 'es'
      ? 'Nuestra tienda SmartMart abre diariamente de 7:00 AM a 11:00 PM.'
      : 'Our SmartMart Supermarket is open daily from 7:00 AM to 11:00 PM. Express delivery operates until 10:30 PM!';

    return {
      id: 'b_' + Date.now(),
      sender: 'bot',
      type: 'faq',
      text,
      spokenText: text,
      timestamp,
      suggestions: ['📍 View Store Map', '🛵 Delivery Speed', '💳 Payment Methods']
    };
  }

  // B. Payment Methods
  if (qLower.includes('payment') || qLower.includes('pay') || qLower.includes('card') || qLower.includes('upi') || qLower.includes('gpay') || qLower.includes('cash') || qLower.includes('wallet')) {
    const text = language === 'hi'
      ? 'हम सभी मुख्य भुगतान स्वीकार करते हैं: UPI (GPay, PhonePe, Paytm), क्रेडिट/डेबिट कार्ड, स्मार्टपॉइंट वॉलेट, और कैश ऑन डिलीवरी (COD)।'
      : language === 'ta'
      ? 'நாங்கள் UPI (GPay, PhonePe, Paytm), கிரெடிட்/டெபிட் கார்டுகள், ஸ்மார்ட்பாயிண்ட்ஸ் மற்றும் கேஷ் ஆன் டெலிவரி அனைத்தையும் ஏற்கிறோம்.'
      : language === 'te'
      ? 'మేము అన్ని చెల్లింపులను అంగీకరిస్తాము: UPI, క్రెడిట్/డెబిట్ కార్డులు, స్మార్ట్‌పాయింట్లు మరియు క్యాష్ ఆన్ డెలివరీ.'
      : language === 'es'
      ? 'Aceptamos pagos con UPI, tarjetas de crédito/débito, puntos SmartWallet y pago contra entrega (COD).'
      : 'We accept all major payments: UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, SmartPoints Wallet, and Cash on Delivery / Pay at Gate!';

    return {
      id: 'b_' + Date.now(),
      sender: 'bot',
      type: 'faq',
      text,
      spokenText: text,
      timestamp,
      suggestions: ['🛒 View My Cart', '🛵 Place Order', '🎁 Check SmartPoints']
    };
  }

  // C. Delivery Speed & Coverage
  if (qLower.includes('delivery') && (qLower.includes('speed') || qLower.includes('fast') || qLower.includes('time') || qLower.includes('min') || qLower.includes('coverage') || qLower.includes('charge'))) {
    const text = '🚀 We offer 15-Minute Express Home Delivery within 5 km of our store, or instant Pick-Up Lockers for Store Take-Away. FREE delivery on orders above ₹199!';
    return {
      id: 'b_' + Date.now(),
      sender: 'bot',
      type: 'faq',
      text,
      spokenText: 'We offer 15-Minute Express Home Delivery within 5 kilometers, and FREE delivery on orders above 199 rupees!',
      timestamp,
      suggestions: ['🛵 Track My Order', '🍎 Browse Products', '⏰ Store Timings']
    };
  }

  // D. Offers & Deals
  if (qLower.includes('offer') || qLower.includes('deal') || qLower.includes('discount') || qLower.includes('coupon') || qLower.includes('cheap') || qLower.includes('sale')) {
    const dealProducts = products.filter(p => p.price < 100 || (p.dietary && p.dietary.some(d => d.toLowerCase().includes('organic')))).slice(0, 4);
    return {
      id: 'b_' + Date.now(),
      sender: 'bot',
      type: 'products',
      products: dealProducts.length > 0 ? dealProducts : products.slice(0, 4),
      text: '🎉 Today\'s Hot Supermarket Deals & Special Savings (Up to 30% OFF):',
      spokenText: 'Here are today\'s hot supermarket deals and discounted items in stock.',
      timestamp,
      suggestions: ['🍛 Recipe Suggestions', '🛒 View Cart', '📍 Store Map']
    };
  }

  // -------------------------------------------------------------
  // 3. RECIPE & COOKING INTENT
  // -------------------------------------------------------------
  const isRecipeIntent = qLower.includes('recipe') || 
    qLower.includes('cook') || 
    qLower.includes('make') || 
    qLower.includes('dish') || 
    qLower.includes('ingredients for') ||
    qLower.includes('dinner') ||
    qLower.includes('breakfast') ||
    qLower.includes('curry') ||
    qLower.includes('masala') ||
    qLower.includes('biryani') ||
    qLower.includes('pulao') ||
    qLower.includes('smoothie');

  if (isRecipeIntent) {
    // A. Match against popular pre-configured recipes
    let matchedRecipe = popularRecipes.find(r => 
      qLower.includes(r.name.toLowerCase()) || 
      (r.nameHi && qLower.includes(r.nameHi.toLowerCase())) ||
      (r.nameTa && qLower.includes(r.nameTa.toLowerCase())) ||
      (r.nameTe && qLower.includes(r.nameTe.toLowerCase())) ||
      (r.nameEs && qLower.includes(r.nameEs.toLowerCase()))
    );

    // If query has 'paneer', 'pulao', 'smoothie', or specific dish keywords
    if (!matchedRecipe) {
      if (qLower.includes('paneer')) matchedRecipe = popularRecipes.find(r => r.id === 'rec_1');
      else if (qLower.includes('pulao') || qLower.includes('rice') || qLower.includes('biryani')) matchedRecipe = popularRecipes.find(r => r.id === 'rec_2');
      else if (qLower.includes('smoothie') || qLower.includes('drink') || qLower.includes('juice') || qLower.includes('fruit')) matchedRecipe = popularRecipes.find(r => r.id === 'rec_3');
    }

    // Default to first popular recipe if general recipe prompt
    const recipe = matchedRecipe || popularRecipes[0];

    if (recipe) {
      const recipeProducts = products.filter(p => recipe.productIds.includes(p.id));
      const totalCost = recipeProducts.reduce((sum, p) => sum + p.price, 0);

      let spoken = language === 'hi'
        ? `यहाँ ${recipe.name} की रेसिपी सामग्री है। कुल लागत ₹${totalCost} है। आप एक क्लिक में कार्ट में जोड़ सकते हैं।`
        : language === 'ta'
        ? `இதோ ${recipe.name} செய்முறை பொருட்கள். மொத்த விலை ₹${totalCost}. ஒரு கிளிக்கில் கூடையில் சேர்க்கலாம்.`
        : language === 'te'
        ? `ఇక్కడ ${recipe.name} వంటకం పదార్థాలు ఉన్నాయి. మొత్తం ఖర్చు ₹${totalCost}. ఒకే క్లిక్‌తో కార్ట్‌కు జోడించవచ్చు.`
        : language === 'es'
        ? `Aquí tienes los ingredientes para ${recipe.name}. Costo total ₹${totalCost}. Puedes agregarlos al carrito.`
        : `Here are the fresh ingredients for ${recipe.name}. Total cost is ₹${totalCost}. You can add all items to your cart in 1 click!`;

      return {
        id: 'b_' + Date.now(),
        sender: 'bot',
        type: 'recipe',
        recipe,
        recipeProducts,
        totalCost,
        text: `I found the perfect chef recipe: **${recipe.name}** (${recipe.time} • ${recipe.servings || recipe.serves}). Here are the ingredients in stock:`,
        spokenText: spoken,
        timestamp,
        suggestions: [
          '🍚 Fragrant Basmati Pulao',
          '🥤 Superfood Smoothie',
          '🥛 Where is Fresh Milk?',
          '🛵 Track Live Delivery'
        ]
      };
    }
  }

  // -------------------------------------------------------------
  // 4. ORDER TRACKING & LIVE STATUS INTENT
  // -------------------------------------------------------------
  const isOrderIntent = qLower.includes('order') || 
    qLower.includes('track') || 
    qLower.includes('delivery status') || 
    qLower.includes('rider') || 
    qLower.includes('eta') || 
    qLower.includes('ord-');

  if (isOrderIntent) {
    const activeOrder = orders.find(o => !['DELIVERED', 'COLLECTED', 'COMPLETED', 'CANCELLED'].includes(o.status)) || orders[0];
    
    if (activeOrder) {
      let spoken = language === 'hi'
        ? `आपका ऑर्डर ${activeOrder.id} वर्तमान में ${activeOrder.status} है। अनुमानित समय ${activeOrder.etaMinutes || 10} मिनट है।`
        : language === 'ta'
        ? `உங்கள் ஆர்டர் ${activeOrder.id} தற்போது ${activeOrder.status} நிலையில் உள்ளது. வருகை நேரம் ${activeOrder.etaMinutes || 10} நிமிடங்கள்.`
        : language === 'te'
        ? `మీ ఆర్డర్ ${activeOrder.id} ప్రస్తుతం ${activeOrder.status} లో ఉంది. డెలివరీ సమయం ${activeOrder.etaMinutes || 10} నిమిషాలు.`
        : language === 'es'
        ? `Tu pedido ${activeOrder.id} está actualmente en estado ${activeOrder.status}. Tiempo estimado ${activeOrder.etaMinutes || 10} minutos.`
        : `Your order ${activeOrder.id} is currently ${activeOrder.status.replace(/_/g, ' ')}. Estimated delivery in ${activeOrder.etaMinutes || 10} minutes.`;

      return {
        id: 'b_' + Date.now(),
        sender: 'bot',
        type: 'order',
        order: activeOrder,
        text: `Here is your live order delivery status:`,
        spokenText: spoken,
        timestamp,
        suggestions: [
          '🍛 Recipe Ideas for Dinner',
          '🍎 Fresh Fruit Selection',
          '📍 Store Aisle Map'
        ]
      };
    } else {
      const text = 'You don\'t have any active orders running right now. Browse our store catalog to place your express 15-min delivery!';
      return {
        id: 'b_' + Date.now(),
        sender: 'bot',
        type: 'text',
        text,
        spokenText: text,
        timestamp,
        suggestions: [
          '🛒 Browse All Products',
          '🏷️ Supermarket Deals',
          '🍛 Paneer Recipe'
        ]
      };
    }
  }

  // -------------------------------------------------------------
  // 5. PRODUCT & AISLE LOCATION MATCHING ENGINE (TOKEN-BASED NLP)
  // -------------------------------------------------------------
  const isLocationQuery = qLower.includes('where') || 
    qLower.includes('aisle') || 
    qLower.includes('shelf') || 
    qLower.includes('locate') || 
    qLower.includes('find') || 
    qLower.includes('which row') ||
    qLower.includes('map');

  // Score each product by token relevance
  const scoredProducts = products.map(p => {
    let score = 0;
    const nameLower = p.name.toLowerCase();
    const catLower = p.category.toLowerCase();
    const brandLower = p.brand.toLowerCase();
    const dietaryLower = (p.dietary || []).join(' ').toLowerCase();

    // Exact string match bonus
    if (qLower.includes(nameLower) || nameLower.includes(qLower)) {
      score += 15;
    }
    if (qLower.includes(catLower) || catLower.includes(qLower)) {
      score += 8;
    }
    if (qLower.includes(brandLower) || brandLower.includes(qLower)) {
      score += 6;
    }

    // Token match scoring
    tokens.forEach(token => {
      if (nameLower.includes(token)) score += 5;
      if (catLower.includes(token)) score += 4;
      if (brandLower.includes(token)) score += 3;
      if (dietaryLower.includes(token)) score += 2;
    });

    return { product: p, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  const matchedProducts = scoredProducts.map(item => item.product).slice(0, 4);

  if (matchedProducts.length > 0) {
    const first = matchedProducts[0];

    if (isLocationQuery) {
      let spoken = language === 'hi'
        ? `${first.name} आइल नंबर ${first.aisle}, शेल्फ ${first.shelf} पर स्थित है।`
        : language === 'ta'
        ? `${first.name} பகுதி ${first.aisle}, அடுக்கு ${first.shelf} இல் உள்ளது.`
        : language === 'te'
        ? `${first.name} నడవ ${first.aisle}, షెల్ఫ్ ${first.shelf} లో అందుబాటులో ఉంది.`
        : language === 'es'
        ? `${first.name} está ubicado en el Pasillo ${first.aisle}, Estante ${first.shelf}.`
        : `${first.name} is located in Aisle ${first.aisle}, Shelf ${first.shelf}.`;

      return {
        id: 'b_' + Date.now(),
        sender: 'bot',
        type: 'products',
        isLocationSearch: true,
        products: matchedProducts,
        text: `📍 Found in our supermarket aisles! Here is the exact location and live stock:`,
        spokenText: spoken,
        timestamp,
        suggestions: [
          '📍 View on 2D Store Map',
          '🛒 Go to My Cart',
          '🍛 Paneer Butter Masala'
        ]
      };
    } else {
      let spoken = language === 'hi'
        ? `मुझे आपकी खोज के लिए ${matchedProducts.length} उत्पाद मिले हैं।`
        : language === 'ta'
        ? `உங்கள் தேடலுக்கு ${matchedProducts.length} பொருட்கள் கிடைத்துள்ளன.`
        : language === 'te'
        ? `మీ శోధన కోసం ${matchedProducts.length} ఉత్పత్తులు దొరికాయి.`
        : language === 'es'
        ? `He encontrado ${matchedProducts.length} productos para tu búsqueda.`
        : `I found ${matchedProducts.length} item(s) matching your search in stock!`;

      return {
        id: 'b_' + Date.now(),
        sender: 'bot',
        type: 'products',
        products: matchedProducts,
        text: `Here are top matches available in our store right now:`,
        spokenText: spoken,
        timestamp,
        suggestions: [
          '🍛 Suggest a quick dinner recipe',
          '🛵 Track My Order',
          '🛒 View Cart'
        ]
      };
    }
  }

  // -------------------------------------------------------------
  // 6. DEFAULT FALLBACK
  // -------------------------------------------------------------
  let defaultReply = language === 'hi'
    ? 'मैं आपकी पसंदीदा रेसिपी, उत्पाद लोकेशन (आइल और शेल्फ), लाइव स्टॉक, ऑफर्स और ऑर्डर ट्रैकिंग में मदद कर सकता हूँ। आप क्या खोजना चाहते हैं?'
    : language === 'ta'
    ? 'உங்களுக்கு தேவையான சமையல் பொருட்கள், கடையின் அடுக்கு எண்கள், இருப்பு மற்றும் ஆர்டர் நிலையை நான் அறிய உதவ முடியும்.'
    : language === 'te'
    ? 'నేను మీకు వంటకాలు, ఉత్పత్తుల స్థానాలు, స్టాక్ మరియు ఆర్డర్ ట్రాకింగ్‌లో సహాయపడగలను.'
    : language === 'es'
    ? 'Puedo ayudarte a encontrar productos, planificar recetas, ubicar pasillos y rastrear tus pedidos en vivo.'
    : 'I can help you find fresh products, locate aisles & shelves, plan recipes with 1-click cart addition, and track live order deliveries!';

  return {
    id: 'b_' + Date.now(),
    sender: 'bot',
    type: 'text',
    text: defaultReply,
    spokenText: defaultReply,
    timestamp,
    suggestions: [
      '🍛 Paneer Butter Masala Recipe',
      '🥛 Where is Milk?',
      '🛵 Live Delivery Status',
      '🍎 Fresh Fruits Aisle'
    ]
  };
}
