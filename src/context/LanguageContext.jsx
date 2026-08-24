import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', speechLang: 'en-US' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechLang: 'hi-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', speechLang: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', speechLang: 'te-IN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechLang: 'es-ES' },
];

export const TRANSLATIONS = {
  en: {
    // Navigation
    store_home: 'Store Home',
    products: 'Products',
    scan_go: 'Scan & Go',
    cart_list: 'My Cart & List',
    live_orders: 'Live Orders',
    staff_portal: 'Staff Portal',
    settings: 'Settings',
    search_placeholder: 'Search fresh vegetables, groceries, dairy, drinks...',
    
    // Status badges
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    units_left: 'units left',
    
    // Categories
    all_categories: 'All Categories',
    groceries: 'Groceries',
    dairy: 'Dairy & Cold',
    beverages: 'Beverages',
    personal_care: 'Personal Care',
    household: 'Household Cleaning',
    vegetables: 'Fresh Vegetables',
    fruits: 'Fresh Fruits',
    
    // Cart & Checkout
    add_to_cart: 'Add to Cart',
    added: 'Added',
    view_cart: 'View Cart',
    my_cart: 'My Shopping List & Cart',
    empty_cart: 'Your shopping cart is empty',
    start_shopping: 'Start Shopping',
    subtotal: 'Subtotal',
    discount: 'Discount',
    delivery_fee: 'Delivery Fee',
    free_delivery: 'FREE',
    taxes: 'Taxes (GST 5%)',
    grand_total: 'Grand Total',
    proceed_checkout: 'Proceed to Checkout',
    place_order_pay: 'Place Order & Pay',
    items_in_cart: 'Items in Cart',
    add_more_products: 'Add More Products',
    
    // Fulfillment
    express_delivery: 'Express 15-Min Delivery',
    store_takeaway: 'Store Take Away (Pickup)',
    self_checkout_instore: 'In-Store Self Checkout',
    delivery_address: 'Delivery Address',
    
    // Payment
    payment_method: 'Payment Method',
    pay_with_gpay_upi: 'Pay via GPay / UPI App',
    pay_with_upi_qr: 'Scan UPI QR Code',
    pay_card: 'Credit / Debit Card',
    pay_cash: 'Cash on Delivery',
    upi_mobile_hint: 'Tapping this will open Google Pay / UPI directly on your phone.',
    upi_pc_hint: 'Scan this QR code with any UPI app (GPay, PhonePe, Paytm, BHIM).',
    payment_success: 'Payment Successful',
    
    // Theme & Language & Settings
    theme: 'Theme',
    language: 'Language',
    light_mode: 'Light Mode',
    dark_mode: 'Dark Mode',
    customer_settings: 'Customer Account & Preferences',
    staff_settings: 'Supermarket Store Controls & Settings',
    profile_info: 'Profile Information',
    saved_addresses: 'Saved Delivery Addresses',
    add_new_address: 'Add New Address',
    audio_voice_settings: 'Sound Effects & Voice Assistant',
    enable_sound_fx: 'Interactive Sound Effects (Beeps & Chimes)',
    enable_voice_ai: 'Text-to-Speech Voice Assistant Output',
    budget_alerts: 'Monthly Grocery Budget Alerts',
    store_config: 'Store Management Configuration',
    tax_percentage: 'GST / VAT Tax Rate (%)',
    free_delivery_above: 'Free Delivery Minimum Threshold (₹)',
    gate_auto_close: 'Turnstile Security Gate Auto-Lock Time (sec)',
    reset_data: 'Reset Application Demo Data',
    save_changes: 'Save Changes',
    saved_successfully: 'Settings updated successfully!',
    
    // AI Chatbot Assistant
    ai_genie: 'SmartMart AI Genie',
    ai_greeting: 'Hello! I am your SmartMart AI Shopping Assistant. How can I help you today?',
    ai_help_prompt: 'Ask about products, recipe ingredients, aisles, nutritional facts, or delivery status!',
    ai_listening: 'Listening to your voice...',
    ai_ask_placeholder: 'Ask AI (e.g., "Add ingredients for Paneer Butter Masala", "Where is milk?")...',
    ai_send: 'Send',
    ai_add_recipe_cart: 'Add All Ingredients to Cart',
    ai_quick_suggestions: 'Quick Suggestions',
    ai_locate_product: 'Show Location on Store Map',
    ai_order_status_title: 'Order Status Inquiry',
    
    // Recipes
    curated_recipes: 'Chef-Curated Meal Recipes',
    recipe_ingredients: 'Ingredients Needed',
    cook_time: 'Cook Time',
    servings: 'Servings',
    
    // Common
    aisle: 'Aisle',
    shelf: 'Shelf',
    price: 'Price',
    qty: 'Qty',
    total: 'Total',
    order_id: 'Order ID',
    status: 'Status',
    express: 'Express',
    mins: 'mins',
    clear_all: 'Clear All'
  },
  hi: {
    // Navigation
    store_home: 'स्टोर होम',
    products: 'उत्पाद',
    scan_go: 'स्कैन और गो',
    cart_list: 'मेरी कार्ट और सूची',
    live_orders: 'सक्रिय ऑर्डर',
    staff_portal: 'स्टाफ पोर्टल',
    settings: 'सेटिंग्स',
    search_placeholder: 'ताजी सब्जियां, राशन, दूध, पेय खोजें...',
    
    // Status badges
    in_stock: 'स्टॉक में उपलब्ध',
    low_stock: 'कम स्टॉक',
    out_of_stock: 'स्टॉक समाप्त',
    units_left: 'इकाइयां शेष',
    
    // Categories
    all_categories: 'सभी श्रेणियां',
    groceries: 'किराना और राशन',
    dairy: 'डेयरी और दूध',
    beverages: 'पेय पदार्थ',
    personal_care: 'पर्सनल केयर',
    household: 'घरेलू सफाई',
    vegetables: 'ताजी सब्जियां',
    fruits: 'ताजे फल',
    
    // Cart & Checkout
    add_to_cart: 'कार्ट में जोड़ें',
    added: 'जोड़ा गया',
    view_cart: 'कार्ट देखें',
    my_cart: 'मेरी शॉपिंग सूची और कार्ट',
    empty_cart: 'आपकी शॉपिंग कार्ट खाली है',
    start_shopping: 'खरीदारी शुरू करें',
    subtotal: 'उप-योग',
    discount: 'छूट',
    delivery_fee: 'डिलीवरी शुल्क',
    free_delivery: 'मुफ़्त',
    taxes: 'कर (जीएसटी 5%)',
    grand_total: 'कुल राशि',
    proceed_checkout: 'चेकआउट करें',
    place_order_pay: 'ऑर्डर दें और भुगतान करें',
    items_in_cart: 'कार्ट में वस्तुएं',
    add_more_products: 'और उत्पाद जोड़ें',
    
    // Fulfillment
    express_delivery: '15 मिनट एक्सप्रेस डिलीवरी',
    store_takeaway: 'स्टोर से पिकअप (टेकअवे)',
    self_checkout_instore: 'स्टोर में सेल्फ चेकआउट',
    delivery_address: 'डिलीवरी का पता',
    
    // Payment
    payment_method: 'भुगतान का तरीका',
    pay_with_gpay_upi: 'GPay / UPI ऐप से भुगतान करें',
    pay_with_upi_qr: 'UPI QR कोड स्कैन करें',
    pay_card: 'क्रेडिट / डेबिट कार्ड',
    pay_cash: 'डिलीवरी पर नकद (COD)',
    upi_mobile_hint: 'इस पर क्लिक करने से आपके फोन पर Google Pay / UPI खुल जाएगा।',
    upi_pc_hint: 'किसी भी UPI ऐप (GPay, PhonePe, Paytm) से इस QR को स्कैन करें।',
    payment_success: 'भुगतान सफल',
    
    // Theme & Language & Settings
    theme: 'थीम',
    language: 'भाषा',
    light_mode: 'लाइट मोड',
    dark_mode: 'डार्क मोड',
    customer_settings: 'ग्राहक खाता और प्राथमिकताएं',
    staff_settings: 'सुपरमार्केट स्टोर नियंत्रण एवं सेटिंग्स',
    profile_info: 'प्रोफाइल जानकारी',
    saved_addresses: 'सहेजे गए डिलीवरी पते',
    add_new_address: 'नया पता जोड़ें',
    audio_voice_settings: 'ध्वनि प्रभाव और आवाज सहायक',
    enable_sound_fx: 'इंटरैक्टिव ध्वनि प्रभाव (बीप और घंटी)',
    enable_voice_ai: 'एआई आवाज सहायक (टेक्स्ट-टू-स्पीच)',
    budget_alerts: 'मासिक राशन बजट अलर्ट',
    store_config: 'स्टोर प्रबंधन कॉन्फ़िगरेशन',
    tax_percentage: 'जीएसटी / टैक्स दर (%)',
    free_delivery_above: 'मुफ्त डिलीवरी न्यूनतम सीमा (₹)',
    gate_auto_close: 'टर्नस्टाइल गेट ऑटो-लॉक समय (सेकंड)',
    reset_data: 'डेमो डेटा रीसेट करें',
    save_changes: 'परिवर्तन सहेजें',
    saved_successfully: 'सेटिंग्स सफलतापूर्वक अपडेट की गईं!',
    
    // AI Chatbot Assistant
    ai_genie: 'स्मार्टमार्ट एआई जीनी',
    ai_greeting: 'नमस्ते! मैं आपका स्मार्टमार्ट एआई शॉपिंग सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?',
    ai_help_prompt: 'उत्पादों, रेसिपी सामग्री, आइल लोकेशन या डिलीवरी स्थिति के बारे में पूछें!',
    ai_listening: 'आपकी आवाज सुन रहा हूँ...',
    ai_ask_placeholder: 'एआई से पूछें (उदा. "पनीर बटर मसाला की सामग्री जोड़ें", "दूध कहाँ है?")...',
    ai_send: 'भेजें',
    ai_add_recipe_cart: 'सभी सामग्री कार्ट में जोड़ें',
    ai_quick_suggestions: 'त्वरित सुझाव',
    ai_locate_product: 'स्टोर मैप पर स्थान देखें',
    ai_order_status_title: 'ऑर्डर स्थिति पूछताछ',
    
    // Recipes
    curated_recipes: 'विशेष शेफ रेसिपी',
    recipe_ingredients: 'आवश्यक सामग्री',
    cook_time: 'पकाने का समय',
    servings: 'व्यक्तियों के लिए',
    
    // Common
    aisle: 'आइल (गलियारा)',
    shelf: 'शेल्फ',
    price: 'मूल्य',
    qty: 'मात्रा',
    total: 'कुल',
    order_id: 'ऑर्डर आईडी',
    status: 'स्थिति',
    express: 'एक्सप्रेस',
    mins: 'मिनट',
    clear_all: 'सभी साफ़ करें'
  },
  ta: {
    // Navigation
    store_home: 'முகப்பு',
    products: 'பொருட்கள்',
    scan_go: 'ஸ்கேன் செய்து வாங்கு',
    cart_list: 'என் கூடை & பட்டியல்',
    live_orders: 'நேரலை ஆர்டர்கள்',
    staff_portal: 'பணியாளர் தளம்',
    settings: 'அமைப்புகள்',
    search_placeholder: 'காய்கறிகள், மளிகை, பால், பானங்களை தேடுங்கள்...',
    
    // Status badges
    in_stock: 'கையிருப்பில் உள்ளது',
    low_stock: 'குறைந்த இருப்பு',
    out_of_stock: 'இருப்பு இல்லை',
    units_left: 'எண்ணிக்கை மீதம்',
    
    // Categories
    all_categories: 'அனைத்து பிரிவுகள்',
    groceries: 'மளிகைப் பொருட்கள்',
    dairy: 'பால் & தயிர் பொருட்கள்',
    beverages: 'குளிர்பானங்கள்',
    personal_care: 'சுய பராமரிப்பு',
    household: 'வீட்டு உபயோகம்',
    vegetables: 'காய்கறிகள்',
    fruits: 'பழங்கள்',
    
    // Cart & Checkout
    add_to_cart: 'கூடையில் சேர்',
    added: 'சேர்க்கப்பட்டது',
    view_cart: 'கூடையைப் பார்',
    my_cart: 'என் பொருட்கள் & கூடை',
    empty_cart: 'உங்கள் கூடை காலியாக உள்ளது',
    start_shopping: 'ஷாப்பிங் செய்ய தொடங்குங்கள்',
    subtotal: 'கூட்டுத்தொகை',
    discount: 'தள்ளுபடி',
    delivery_fee: 'டெலிவரி கட்டணம்',
    free_delivery: 'இலவசம்',
    taxes: 'வரி (GST 5%)',
    grand_total: 'மொத்த தொகை',
    proceed_checkout: 'பணம் செலுத்த தொடரவும்',
    place_order_pay: 'ஆர்டர் செய்து பணம் செலுத்துக',
    items_in_cart: 'கூடையில் உள்ள பொருட்கள்',
    add_more_products: 'மேலும் பொருட்கள் சேர்க்க',
    
    // Fulfillment
    express_delivery: '15 நிமிட விரைவு டெலிவரி',
    store_takeaway: 'கடையில் நேரில் பெறுதல்',
    self_checkout_instore: 'சுய செக் அவுட்',
    delivery_address: 'டெலிவரி முகவரி',
    
    // Payment
    payment_method: 'பணம் செலுத்தும் முறை',
    pay_with_gpay_upi: 'GPay / UPI ஆப் மூலம் செலுத்துக',
    pay_with_upi_qr: 'UPI QR ஸ்கேன் செய்க',
    pay_card: 'கிரெடிட் / டெபிட் கார்டு',
    pay_cash: 'பொருளைப் பெற்று பணம் செலுத்துக',
    upi_mobile_hint: 'இதை அழுத்தினால் உங்கள் மொபைலில் GPay / UPI ஆப் நேரடியாக திறக்கும்.',
    upi_pc_hint: 'GPay, PhonePe, Paytm ஆப் கொண்டு இந்த QR குறியீட்டை ஸ்கேன் செய்க.',
    payment_success: 'பணம் செலுத்தப்பட்டது',
    
    // Theme & Language & Settings
    theme: 'தீம்',
    language: 'மொழி',
    light_mode: 'லைட் மோட்',
    dark_mode: 'டார்க் மோட்',
    customer_settings: 'வாடிக்கையாளர் கணக்கு & விருப்பங்கள்',
    staff_settings: 'சூப்பர் மார்க்கெட் மேலாண்மை அமைப்புகள்',
    profile_info: 'சுயவிவர தகவல்',
    saved_addresses: 'சேமிக்கப்பட்ட டெலிவரி முகவரிகள்',
    add_new_address: 'புதிய முகவரி சேர்க்க',
    audio_voice_settings: 'ஒலி & குரல் வழிகாட்டி அமைப்புகள்',
    enable_sound_fx: 'ஊடாடும் ஒலி விளைவுகள் (பீப் ஒலிகள்)',
    enable_voice_ai: 'AI குரல் வாசிப்பு (Text-to-Speech)',
    budget_alerts: 'மாதாந்திர பட்ஜெட் எச்சரிக்கைகள்',
    store_config: 'கடை மேலாண்மை அமைப்புகள்',
    tax_percentage: 'GST வரி விகிதம் (%)',
    free_delivery_above: 'இலவச டெலிவரி வரம்பு (₹)',
    gate_auto_close: 'பாதுகாப்பு கேட் தானியங்கி பூட்டு நேரம் (விநாடிகள்)',
    reset_data: 'டெமோ தரவை மீட்டமைக்கவும்',
    save_changes: 'மாற்றங்களை சேமி',
    saved_successfully: 'அமைப்புகள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன!',
    
    // AI Chatbot Assistant
    ai_genie: 'ஸ்மார்ட்மார்ட் AI ஜீனி',
    ai_greeting: 'வணக்கம்! நான் உங்கள் ஸ்மார்ட்மார்ட் AI ஷாப்பிங் உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
    ai_help_prompt: 'பொருட்கள், சமையல் குறிப்புகள், அடுக்கு எண்கள் அல்லது ஆர்டர் நிலையை கேளுங்கள்!',
    ai_listening: 'உங்கள் குரலை கேட்கிறேன்...',
    ai_ask_placeholder: 'AI-யிடம் கேட்க (எ.கா. "பன்னீர் பட்டர் மசாலா பொருட்கள் சேர்க்க", "பால் எங்கே உள்ளது?")...',
    ai_send: 'அனுப்பு',
    ai_add_recipe_cart: 'அனைத்து பொருட்களையும் கூடையில் சேர்',
    ai_quick_suggestions: 'விரைவு பரிந்துரைகள்',
    ai_locate_product: 'கடையின் வரைபடத்தில் இடத்தை காட்டு',
    ai_order_status_title: 'ஆர்டர் நிலை விசாரணை',
    
    // Recipes
    curated_recipes: 'செஃப் சமையல் குறிப்புகள்',
    recipe_ingredients: 'தேவையான பொருட்கள்',
    cook_time: 'சமைக்கும் நேரம்',
    servings: 'நபர்கள்',
    
    // Common
    aisle: 'பகுதி',
    shelf: 'அடுக்கு',
    price: 'விலை',
    qty: 'அளவு',
    total: 'மொத்தம்',
    order_id: 'ஆர்டர் எண்',
    status: 'நிலை',
    express: 'விரைவு',
    mins: 'நிமிடம்',
    clear_all: 'அனைத்தையும் நீக்கு'
  },
  te: {
    // Navigation
    store_home: 'స్టోర్ హోమ్',
    products: 'ఉత్పత్తులు',
    scan_go: 'స్కాన్ & గో',
    cart_list: 'నా కార్ట్ & జాబితా',
    live_orders: 'లైవ్ ఆర్డర్లు',
    staff_portal: 'సిబ్బంది పోర్టల్',
    settings: 'సెట్టింగ్‌లు',
    search_placeholder: 'కూరగాయలు, కిరాణా, పాలు, పానీయాలను శోధించండి...',
    
    // Status badges
    in_stock: 'స్టాక్ ఉంది',
    low_stock: 'తక్కువ స్టాక్',
    out_of_stock: 'స్టాక్ అయిపోయింది',
    units_left: 'మిగిలినవి',
    
    // Categories
    all_categories: 'అన్ని వర్గాలు',
    groceries: 'కిరాణా సరుకులు',
    dairy: 'పాల ఉత్పత్తులు',
    beverages: 'పానీయాలు',
    personal_care: 'వ్యక్తిగత సంరక్షణ',
    household: 'గృహ శుభ్రత',
    vegetables: 'తాజా కూరగాయలు',
    fruits: 'తాజా పండ్లు',
    
    // Cart & Checkout
    add_to_cart: 'కార్ట్‌కు జోడించు',
    added: 'జోడించబడింది',
    view_cart: 'కార్ట్ చూడండి',
    my_cart: 'నా షాపింగ్ జాబితా & కార్ట్',
    empty_cart: 'మీ షాపింగ్ కార్ట్ ఖాళీగా ఉంది',
    start_shopping: 'షాపింగ్ ప్రారంభించండి',
    subtotal: 'ఉప మొత్తం',
    discount: 'రాయితీ',
    delivery_fee: 'డెలివరీ రుసుము',
    free_delivery: 'ఉచితం',
    taxes: 'పన్నులు (GST 5%)',
    grand_total: 'మొత్తం మొత్తం',
    proceed_checkout: 'చెక్‌అవుట్‌కు వెళ్లండి',
    place_order_pay: 'ఆర్డర్ ఇచ్చి చెల్లించండి',
    items_in_cart: 'కార్ట్‌లోని వస్తువులు',
    add_more_products: 'మరిన్ని ఉత్పత్తులను జోడించండి',
    
    // Fulfillment
    express_delivery: '15 నిమిషాల ఎక్స్‌ప్రెస్ డెలివరీ',
    store_takeaway: 'స్టోర్ నుండి పికప్',
    self_checkout_instore: 'సెల్ఫ్ చెక్ అవుట్',
    delivery_address: 'డెలివరీ చిరునామా',
    
    // Payment
    payment_method: 'చెల్లింపు పద్ధతి',
    pay_with_gpay_upi: 'GPay / UPI యాప్ ద్వారా చెల్లించండి',
    pay_with_upi_qr: 'UPI QR కోడ్‌ను స్కాన్ చేయండి',
    pay_card: 'క్రెడిట్ / డెబిట్ కార్డు',
    pay_cash: 'డెలివరీ వద్ద నగదు',
    upi_mobile_hint: 'ఇది మీ ఫోన్‌లో Google Pay / UPI ని నేరుగా తెరుస్తుంది.',
    upi_pc_hint: 'ఏదైనా UPI యాప్‌తో ఈ QR కోడ్‌ను స్కాన్ చేయండి.',
    payment_success: 'చెల్లింపు విజయవంతమైంది',
    
    // Theme & Language & Settings
    theme: 'థీమ్',
    language: 'భాష',
    light_mode: 'లైట్ మోడ్',
    dark_mode: 'డార్క్ మోడ్',
    customer_settings: 'కస్టమర్ ఖాతా & ప్రాధాన్యతలు',
    staff_settings: 'సూపర్‌మార్కెట్ స్టోర్ సెట్టింగ్‌లు',
    profile_info: 'ప్రొఫైల్ సమాచారం',
    saved_addresses: 'భద్రపరచిన డెలివరీ చిరునామాలు',
    add_new_address: 'కొత్త చిరునామాను జోడించండి',
    audio_voice_settings: 'ధ్వని & వాయిస్ అసిస్టెంట్ సెట్టింగ్‌లు',
    enable_sound_fx: 'ఇంటరాక్టివ్ శబ్దాలు (బీప్స్)',
    enable_voice_ai: 'AI వాయిస్ రీడర్ (టెక్స్ట్-టు-స్పీచ్)',
    budget_alerts: 'నెలవారీ కిరాణా బడ్జెట్ హెచ్చరికలు',
    store_config: 'స్టోర్ నిర్వహణ సెట్టింగ్‌లు',
    tax_percentage: 'GST పన్ను శాతం (%)',
    free_delivery_above: 'ఉచిత డెలివరీ కనీస పరిమితి (₹)',
    gate_auto_close: 'సెక్యూరిటీ గేట్ ఆటో-లాక్ సమయం (సెకన్లు)',
    reset_data: 'డెమో డేటాను రీసెట్ చేయండి',
    save_changes: 'మార్పులను భద్రపరచండి',
    saved_successfully: 'సెట్టింగ్‌లు విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి!',
    
    // AI Chatbot Assistant
    ai_genie: 'స్మార్ట్‌మార్ట్ AI జీనీ',
    ai_greeting: 'నమస్కారం! నేను మీ స్మార్ట్‌మార్ట్ AI షాపింగ్ సహాయకుడిని. ఈ రోజు మీకు ఎలా సహాయపడగలను?',
    ai_help_prompt: 'ఉత్పత్తులు, వంట పదార్థాలు, షెల్ఫ్ స్థానాలు లేదా ఆర్డర్ స్థితి గురించి అడగండి!',
    ai_listening: 'మీ మాట వింటున్నాను...',
    ai_ask_placeholder: 'AI ని అడగండి (ఉదా. "పన్నీర్ బట్టర్ మసాలా పదార్థాలను చేర్చు", "పాలు ఎక్కడ ఉన్నాయి?")...',
    ai_send: 'పంపండి',
    ai_add_recipe_cart: 'అన్ని పదార్థాలను కార్ట్‌కు జోడించు',
    ai_quick_suggestions: 'త్వరిత సూచనలు',
    ai_locate_product: 'స్టోర్ మ్యాప్‌లో స్థానాన్ని చూపించు',
    ai_order_status_title: 'ఆర్డర్ స్థితి విచారణ',
    
    // Recipes
    curated_recipes: 'ప్రత్యేక వంటకాలు',
    recipe_ingredients: 'కావలసిన పదార్థాలు',
    cook_time: 'వండే సమయం',
    servings: 'వ్యక్తులు',
    
    // Common
    aisle: 'నడవ (Aisle)',
    shelf: 'షెల్ఫ్',
    price: 'ధర',
    qty: 'పరిమాణం',
    total: 'మొత్తం',
    order_id: 'ఆర్డర్ ID',
    status: 'స్థితి',
    express: 'ఎక్స్‌ప్రెస్',
    mins: 'నిమిషాలు',
    clear_all: 'అన్నీ క్లియర్ చేయండి'
  },
  es: {
    // Navigation
    store_home: 'Inicio de Tienda',
    products: 'Productos',
    scan_go: 'Escanear y Pagar',
    cart_list: 'Mi Carrito y Lista',
    live_orders: 'Pedidos en Vivo',
    staff_portal: 'Portal de Personal',
    settings: 'Ajustes',
    search_placeholder: 'Buscar verduras frescas, abarrotes, lácteos, bebidas...',
    
    // Status badges
    in_stock: 'En Stock',
    low_stock: 'Poco Stock',
    out_of_stock: 'Agotado',
    units_left: 'unidades restantes',
    
    // Categories
    all_categories: 'Todas las Categorías',
    groceries: 'Abarrotes y Despensa',
    dairy: 'Lácteos y Refrigerados',
    beverages: 'Bebidas y Jugos',
    personal_care: 'Cuidado Personal',
    household: 'Limpieza del Hogar',
    vegetables: 'Verduras Frescas',
    fruits: 'Frutas Frescas',
    
    // Cart & Checkout
    add_to_cart: 'Agregar al Carrito',
    added: 'Agregado',
    view_cart: 'Ver Carrito',
    my_cart: 'Mi Lista de Compras y Carrito',
    empty_cart: 'Tu carrito de compras está vacío',
    start_shopping: 'Comenzar a Comprar',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    delivery_fee: 'Costo de Envío',
    free_delivery: 'GRATIS',
    taxes: 'Impuestos (IVA/GST 5%)',
    grand_total: 'Total General',
    proceed_checkout: 'Proceder al Pago',
    place_order_pay: 'Realizar Pedido y Pagar',
    items_in_cart: 'Artículos en el Carrito',
    add_more_products: 'Agregar Más Productos',
    
    // Fulfillment
    express_delivery: 'Entrega Exprés en 15 Minutos',
    store_takeaway: 'Recogida en Tienda (Takeaway)',
    self_checkout_instore: 'Autocobro en Tienda',
    delivery_address: 'Dirección de Entrega',
    
    // Payment
    payment_method: 'Método de Pago',
    pay_with_gpay_upi: 'Pagar con GPay / UPI App',
    pay_with_upi_qr: 'Escanear Código QR UPI',
    pay_card: 'Tarjeta de Crédito / Débito',
    pay_cash: 'Pago contra Entrega (Efectivo)',
    upi_mobile_hint: 'Al presionar se abrirá directamente tu aplicación Google Pay / UPI.',
    upi_pc_hint: 'Escanea este código QR con cualquier app de pagos (GPay, PhonePe, Paytm).',
    payment_success: 'Pago Exitoso',
    
    // Theme & Language & Settings
    theme: 'Tema',
    language: 'Idioma',
    light_mode: 'Modo Claro',
    dark_mode: 'Modo Oscuro',
    customer_settings: 'Cuenta de Cliente y Preferencias',
    staff_settings: 'Ajustes de Control del Supermercado',
    profile_info: 'Información de Perfil',
    saved_addresses: 'Direcciones de Entrega Guardadas',
    add_new_address: 'Agregar Nueva Dirección',
    audio_voice_settings: 'Efectos de Sonido y Asistente de Voz',
    enable_sound_fx: 'Efectos de Sonido Interactivos (Pitidos)',
    enable_voice_ai: 'Asistente de Voz Inteligente (Texto a Voz)',
    budget_alerts: 'Alertas de Presupuesto Mensual',
    store_config: 'Configuración de Gestión de Tienda',
    tax_percentage: 'Tasa de Impuesto IVA/GST (%)',
    free_delivery_above: 'Umbral Mínimo para Envío Gratis (₹)',
    gate_auto_close: 'Tiempo de Bloqueo Automático del Torniquete (seg)',
    reset_data: 'Restablecer Datos de Demostración',
    save_changes: 'Guardar Cambios',
    saved_successfully: '¡Ajustes actualizados exitosamente!',
    
    // AI Chatbot Assistant
    ai_genie: 'Genio de IA SmartMart',
    ai_greeting: '¡Hola! Soy tu Asistente de Compras con IA de SmartMart. ¿Cómo puedo ayudarte hoy?',
    ai_help_prompt: '¡Pregunta sobre productos, recetas, pasillos o el estado de tu pedido!',
    ai_listening: 'Escuchando tu voz...',
    ai_ask_placeholder: 'Pregunta a la IA (ej. "Ingredientes para pasta", "¿Dónde está la leche?")...',
    ai_send: 'Enviar',
    ai_add_recipe_cart: 'Agregar Todos los Ingredientes al Carrito',
    ai_quick_suggestions: 'Sugerencias Rápidas',
    ai_locate_product: 'Ver Ubicación en el Mapa de Tienda',
    ai_order_status_title: 'Consulta de Estado del Pedido',
    
    // Recipes
    curated_recipes: 'Recetas Exclusivas del Chef',
    recipe_ingredients: 'Ingredientes Necesarios',
    cook_time: 'Tiempo de Preparación',
    servings: 'Porciones',
    
    // Common
    aisle: 'Pasillo',
    shelf: 'Estante',
    price: 'Precio',
    qty: 'Cant.',
    total: 'Total',
    order_id: 'ID Pedido',
    status: 'Estado',
    express: 'Exprés',
    mins: 'mins',
    clear_all: 'Borrar Todo'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('sm_language');
    if (saved && TRANSLATIONS[saved]) return saved;
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('sm_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (langCode) => {
    if (TRANSLATIONS[langCode]) {
      setLanguageState(langCode);
    }
  };

  const t = (key, fallback = '', replacements = {}) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    let text = langDict[key] || TRANSLATIONS.en[key] || fallback || key;

    if (replacements && typeof replacements === 'object') {
      Object.keys(replacements).forEach((placeholder) => {
        text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacements[placeholder]);
      });
    }

    return text;
  };

  const currentLangMeta = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLangMeta
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
