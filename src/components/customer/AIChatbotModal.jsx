import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ShoppingBag, 
  MapPin, 
  Truck, 
  Plus, 
  Check, 
  ArrowRight, 
  Utensils, 
  RotateCcw,
  Navigation,
  Flame,
  Clock,
  Heart
} from 'lucide-react';
import { useSupermarket } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { soundEffects } from '../../lib/audio';
import StoreAisleMapModal from './StoreAisleMapModal';

export default function AIChatbotModal({ isOpen, onClose }) {
  const { 
    products, 
    orders, 
    popularRecipes, 
    addToShoppingList, 
    addRecipeToCart, 
    shoppingList,
    storeSettings
  } = useSupermarket();
  
  const { language, t, currentLangMeta } = useLanguage();
  const { isDark } = useTheme();

  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(storeSettings?.voiceAssistantEnabled !== false);
  const [messages, setMessages] = useState(() => [
    {
      id: 'm_welcome',
      sender: 'bot',
      text: t('ai_greeting', 'Hello! I am your SmartMart AI Shopping Assistant. How can I help you today?'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        '🍛 Paneer Butter Masala Recipe',
        '🥛 Where is Fresh Milk?',
        '🥦 Organic Veggies & Greens',
        '🛵 Track My Order',
        '☕ Tea & Coffee Aisle'
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [mapModalProduct, setMapModalProduct] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Setup Speech Recognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = currentLangMeta?.speechLang || 'en-US';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputMessage(transcript);
            handleSendMessage(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language, currentLangMeta]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please type your message.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = currentLangMeta?.speechLang || 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
        soundEffects.playNotificationPing();
      } catch (e) {
        console.warn("Speech recognition start error:", e);
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    soundEffects.playScanBeep();
    const userMsg = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = generateAIResponse(query);
      setIsTyping(false);
      setMessages(prev => [...prev, aiResponse]);

      // Speak response if voiceEnabled
      if (voiceEnabled && aiResponse.spokenText) {
        soundEffects.speakText(aiResponse.spokenText, currentLangMeta?.speechLang || 'en-US');
      } else {
        soundEffects.playNotificationPing();
      }
    }, 600);
  };

  // AI Natural Language Reasoning Engine
  const generateAIResponse = (query) => {
    const qLower = query.toLowerCase();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Recipe & Meal Planning Request
    const matchedRecipe = popularRecipes.find(r => 
      qLower.includes(r.name.toLowerCase()) || 
      (r.nameHi && qLower.includes(r.nameHi.toLowerCase())) ||
      (r.nameTa && qLower.includes(r.nameTa.toLowerCase())) ||
      (r.nameTe && qLower.includes(r.nameTe.toLowerCase())) ||
      (r.nameEs && qLower.includes(r.nameEs.toLowerCase())) ||
      qLower.includes('paneer') || 
      qLower.includes('pulao') || 
      qLower.includes('biryani') || 
      qLower.includes('smoothie') || 
      qLower.includes('recipe') || 
      qLower.includes('cook') || 
      qLower.includes('meal')
    );

    if (matchedRecipe || qLower.includes('recipe') || qLower.includes('cook')) {
      const recipe = matchedRecipe || popularRecipes[0];
      const recipeProducts = products.filter(p => recipe.productIds.includes(p.id));
      const totalCost = recipeProducts.reduce((sum, p) => sum + p.price, 0);

      let spoken = language === 'hi'
        ? `यहाँ ${recipe.name} की रेसिपी सामग्री है। कुल लागत ₹${totalCost} है। आप एक क्लिक में सभी सामग्री कार्ट में जोड़ सकते हैं।`
        : language === 'ta'
        ? `இதோ ${recipe.name} செய்முறை பொருட்கள். மொத்த விலை ₹${totalCost}. ஒரு கிளிக்கில் அனைத்தையும் கூடையில் சேர்க்கலாம்.`
        : language === 'te'
        ? `ఇక్కడ ${recipe.name} వంటకం పదార్థాలు ఉన్నాయి. మొత్తం ఖర్చు ₹${totalCost}. ఒకే క్లిక్‌తో కార్ట్‌కు జోడించవచ్చు.`
        : language === 'es'
        ? `Aquí tienes los ingredientes para ${recipe.name}. Costo total ₹${totalCost}. Puedes agregarlos al carrito en un clic.`
        : `Here are the ingredients for ${recipe.name}. Total cost is ₹${totalCost}. You can add all items directly to your cart in 1 click.`;

      return {
        id: 'b_' + Date.now(),
        sender: 'bot',
        type: 'recipe',
        recipe,
        recipeProducts,
        totalCost,
        text: `I found the perfect chef recipe: **${recipe.name}** (${recipe.time} • ${recipe.servings}). Here are the fresh ingredients from our aisles:`,
        spokenText: spoken,
        timestamp,
        suggestions: [
          '🍚 Fragrant Vegetable Pulao',
          '🥤 Superfood Smoothie',
          '🥛 Where is Milk?',
          '🛵 Track My Order'
        ]
      };
    }

    // 2. Order Tracking & Delivery Inquiry
    if (qLower.includes('order') || qLower.includes('track') || qLower.includes('delivery') || qLower.includes('rider') || qLower.includes('ord-')) {
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
          text: `Here is your latest live order status:`,
          spokenText: spoken,
          timestamp,
          suggestions: [
            '🍛 What can I cook tonight?',
            '🍎 Fresh Fruits in Stock',
            '📍 In-store Map Navigator'
          ]
        };
      }
    }

    // 3. In-Store Location / Aisle Search
    if (qLower.includes('where') || qLower.includes('aisle') || qLower.includes('shelf') || qLower.includes('find') || qLower.includes('locate')) {
      const matched = products.filter(p => 
        qLower.includes(p.name.toLowerCase()) || 
        qLower.includes(p.category.toLowerCase()) ||
        qLower.includes(p.brand.toLowerCase())
      ).slice(0, 3);

      if (matched.length > 0) {
        const first = matched[0];
        let spoken = language === 'hi'
          ? `${first.name} आइल नंबर ${first.aisle}, शेल्फ ${first.shelf} पर उपलब्ध है।`
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
          products: matched,
          text: `Found in our supermarket! Here is the exact aisle placement and live stock:`,
          spokenText: spoken,
          timestamp,
          suggestions: [
            '📍 View on 2D Store Map',
            '🍛 Paneer Butter Masala',
            '🛒 Go to My Cart'
          ]
        };
      }
    }

    // 4. Product / Category Keyword Search
    const searchMatches = products.filter(p => {
      return p.name.toLowerCase().includes(qLower) ||
        p.category.toLowerCase().includes(qLower) ||
        p.brand.toLowerCase().includes(qLower) ||
        (p.dietary && p.dietary.some(d => d.toLowerCase().includes(qLower)));
    }).slice(0, 4);

    if (searchMatches.length > 0) {
      let spoken = language === 'hi'
        ? `मुझे आपकी खोज के लिए ${searchMatches.length} उत्पाद मिले हैं।`
        : language === 'ta'
        ? `உங்கள் தேடலுக்கு ${searchMatches.length} பொருட்கள் கிடைத்துள்ளன.`
        : language === 'te'
        ? `మీ శోధన కోసం ${searchMatches.length} ఉత్పత్తులు దొరికాయి.`
        : language === 'es'
        ? `He encontrado ${searchMatches.length} productos para tu búsqueda.`
        : `I found ${searchMatches.length} items matching your request.`;

      return {
        id: 'b_' + Date.now(),
        sender: 'bot',
        type: 'products',
        products: searchMatches,
        text: `Here are the top matches available in our store right now:`,
        spokenText: spoken,
        timestamp,
        suggestions: [
          '🍛 Suggest a quick dinner recipe',
          '🛵 Track My Order',
          '🛒 View Cart'
        ]
      };
    }

    // 5. Default General Assistance
    let defaultReply = language === 'hi'
      ? 'मैं आपकी पसंदीदा रेसिपी, उत्पाद लोकेशन, लाइव स्टॉक और ऑर्डर ट्रैकिंग में मदद कर सकता हूँ। आप क्या खोजना चाहते हैं?'
      : language === 'ta'
      ? 'உங்களுக்கு தேவையான சமையல் பொருட்கள், கடையின் அடுக்கு எண்கள், இருப்பு மற்றும் ஆர்டர் நிலையை நான் அறிய உதவ முடியும்.'
      : language === 'te'
      ? 'నేను మీకు వంటకాలు, ఉత్పత్తుల స్థానాలు, స్టాక్ మరియు ఆర్డర్ ట్రాకింగ్‌లో సహాయపడగలను.'
      : language === 'es'
      ? 'Puedo ayudarte a encontrar productos, planificar recetas, ubicar pasillos y rastrear tus pedidos en vivo.'
      : 'I can help you find fresh products, plan recipes with 1-click cart addition, locate in-store aisles, and track live deliveries.';

    return {
      id: 'b_' + Date.now(),
      sender: 'bot',
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[90vh] max-h-[700px] rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
        
        {/* Chatbot Header */}
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-700 dark:from-primary-950 dark:via-slate-900 dark:to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-primary-500/20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Bot className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-primary-800 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight leading-tight">
                  {t('ai_genie', 'SmartMart AI Genie')}
                </h3>
                <span className="bg-yellow-400 text-charcoal-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI v2.5
                </span>
              </div>
              <p className="text-xs text-primary-100/90 flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Multilingual In-Store Assistant • {currentLangMeta?.nativeName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Voice Audio Toggle */}
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                soundEffects.stopSpeaking();
              }}
              title={voiceEnabled ? "Voice Output Active" : "Voice Output Muted"}
              className={`p-2 rounded-xl border transition-all ${voiceEnabled ? 'bg-white/20 border-white/30 text-yellow-300' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                soundEffects.stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70 dark:bg-slate-950/60">
          
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[85%]">
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`p-4 rounded-2xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary-600 text-white rounded-br-xs shadow-md font-medium' 
                    : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 rounded-bl-xs shadow-sm border border-gray-200 dark:border-slate-800'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>

                  {/* Recipe Card Component */}
                  {msg.type === 'recipe' && msg.recipe && (
                    <div className="mt-3 bg-gradient-to-br from-amber-50/70 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 space-y-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={msg.recipe.image} 
                          alt={msg.recipe.name} 
                          className="w-14 h-14 rounded-xl object-cover border border-amber-200 dark:border-amber-800 shadow-xs" 
                        />
                        <div>
                          <div className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span>{msg.recipe.icon}</span> {msg.recipe.name}
                          </div>
                          <div className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-0.5">
                            ⏱️ {msg.recipe.time} • 👥 {msg.recipe.servings}
                          </div>
                          <div className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                            Total Recipe Cost: <span className="font-mono text-primary-600 dark:text-primary-400">₹{msg.totalCost}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ingredients list pills */}
                      <div className="space-y-1.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/50">
                        <div className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Fresh Ingredients Included:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.recipeProducts?.map(prod => (
                            <div key={prod.id} className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-100 dark:border-slate-700 text-xs">
                              <img src={prod.image} alt={prod.name} className="w-7 h-7 rounded-md object-cover" />
                              <div className="truncate flex-1">
                                <div className="font-semibold truncate">{prod.name}</div>
                                <div className="text-[10px] text-gray-400">Aisle {prod.aisle} • ₹{prod.price}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 1-Click Add All To Cart Action */}
                      <button
                        onClick={() => addRecipeToCart(msg.recipe)}
                        className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 group active:scale-98"
                      >
                        <Plus className="w-4 h-4 group-hover:scale-120 transition-transform" />
                        <span>{t('ai_add_recipe_cart', 'Add All Ingredients to Cart')} (₹{msg.totalCost})</span>
                      </button>
                    </div>
                  )}

                  {/* Products Grid Component */}
                  {msg.type === 'products' && msg.products && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.products.map(prod => {
                        const inCart = shoppingList.some(item => item.id === prod.id);
                        return (
                          <div 
                            key={prod.id} 
                            className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <img src={prod.image} alt={prod.name} className="w-11 h-11 rounded-lg object-cover bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800" />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs text-gray-900 dark:text-white truncate">{prod.name}</div>
                                <div className="text-[11px] font-bold text-primary-600 dark:text-primary-400 font-mono">₹{prod.price} / {prod.unit}</div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" /> Aisle {prod.aisle}, Shelf {prod.shelf}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-slate-700">
                              <button
                                onClick={() => addToShoppingList(prod, 1)}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                  inCart 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                                }`}
                              >
                                {inCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                <span>{inCart ? 'Added' : 'Add to Cart'}</span>
                              </button>

                              <button
                                onClick={() => setMapModalProduct(prod)}
                                title="Locate on 2D store map"
                                className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 text-[11px] font-bold transition-colors"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Order Status Card Component */}
                  {msg.type === 'order' && msg.order && (
                    <div className="mt-3 bg-blue-50/80 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-extrabold text-xs text-blue-900 dark:text-blue-300">{msg.order.id}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                          {msg.order.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        🛵 ETA: <span className="font-bold text-gray-900 dark:text-white">{msg.order.etaMinutes || 12} mins</span> • Rider: <span className="font-semibold">{msg.order.rider?.name || 'Assigned Partner'}</span>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${msg.order.rider?.progressPercent || 40}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 text-right mt-1.5">
                    {msg.timestamp}
                  </div>
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2.5 ml-11 flex flex-wrap gap-1.5">
                  {msg.suggestions.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="text-xs bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-950/70 hover:text-primary-700 dark:hover:text-primary-300 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-gray-400 text-xs italic ml-11">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce delay-100"></span>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce delay-200"></span>
              <span>AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Voice Mic */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }} 
            className="flex items-center gap-2"
          >
            {/* Mic Speech-to-Text Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl transition-all flex items-center justify-center ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg ring-4 ring-red-300/40' 
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              title={isListening ? "Listening... Click to stop" : "Speak with AI Assistant"}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input Text Box */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? t('ai_listening', 'Listening to your voice...') : t('ai_ask_placeholder', 'Ask AI (e.g. "Paneer Butter Masala recipe", "Where is milk?")...')}
              className="flex-1 h-12 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="h-12 px-5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>{t('ai_send', 'Send')}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* Embedded In-Store Aisle Map Modal */}
      {mapModalProduct && (
        <StoreAisleMapModal
          isOpen={!!mapModalProduct}
          onClose={() => setMapModalProduct(null)}
          selectedProduct={mapModalProduct}
        />
      )}

    </div>
  );
}
