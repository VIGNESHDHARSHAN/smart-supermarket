import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Search, 
  ShoppingBag, 
  MapPin, 
  CheckCircle2, 
  Truck, 
  Package, 
  QrCode, 
  Navigation, 
  Sparkles, 
  Plus, 
  Check,
  Clock,
  ArrowRight,
  Bot,
  Utensils
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AvailabilityBadge } from '../../components/ui/Badge';
import { ProductImage } from '../../components/ui/ProductImage';
import StoreAisleMapModal from '../../components/customer/StoreAisleMapModal';

export default function CustomerHome() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { 
    products, 
    addToShoppingList, 
    shoppingList, 
    popularRecipes, 
    addRecipeToCart,
    currentUser,
    openAiAssistant,
    orders
  } = useSupermarket();
  const [searchQuery, setSearchQuery] = useState('');
  const [mapModalProduct, setMapModalProduct] = useState(null);
  const [addedRecipeId, setAddedRecipeId] = useState(null);


  const categories = [
    { name: 'Groceries', count: products.filter(p => p.category === 'Groceries').length, bg: 'bg-orange-100 dark:bg-orange-950/60', text: 'text-orange-700 dark:text-orange-400', icon: '🌾' },
    { name: 'Vegetables', count: products.filter(p => p.category === 'Vegetables').length, bg: 'bg-green-100 dark:bg-emerald-950/60', text: 'text-green-700 dark:text-emerald-400', icon: '🥦' },
    { name: 'Fruits', count: products.filter(p => p.category === 'Fruits').length, bg: 'bg-red-100 dark:bg-rose-950/60', text: 'text-red-700 dark:text-rose-400', icon: '🍎' },
    { name: 'Dairy', count: products.filter(p => p.category === 'Dairy').length, bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-400', icon: '🥛' },
    { name: 'Beverages', count: products.filter(p => p.category === 'Beverages').length, bg: 'bg-cyan-100 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-400', icon: '🧃' },
    { name: 'Personal Care', count: products.filter(p => p.category === 'Personal Care').length, bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-400', icon: '🧴' },
    { name: 'Household', count: products.filter(p => p.category === 'Household').length, bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-400', icon: '🧼' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* Hero Section with Interactive 3D Avatar Concierge */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-700 dark:from-primary-950 dark:via-slate-900 dark:to-emerald-950 rounded-3xl overflow-hidden shadow-2xl text-white relative border border-primary-500/30">
        
        {/* Background ambient lighting orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="px-6 py-10 md:py-14 max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Headlines, Search & Quick Tiles (7 cols on lg) */}
            <div className="lg:col-span-7 text-left space-y-6">
              
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase border border-white/20 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
                  Real-Time Smart Supermarket
                </div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-400/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-200 border border-emerald-400/30 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Meet Gemma • AI Shopping Concierge</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Fresh Groceries Delivered in <span className="text-yellow-300 underline decoration-yellow-400 decoration-wavy decoration-2">15 Minutes</span>
              </h1>

              <p className="text-sm sm:text-base text-primary-100 max-w-xl font-medium leading-relaxed">
                Order online with live GPS delivery tracking, pick up from express store lockers, or enjoy queue-less in-store Scan &amp; Go checkout.
              </p>

              {/* Main Search Bar */}
              <form onSubmit={handleSearch} className="max-w-xl relative">
                <div className="relative flex items-center w-full h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xl focus-within:ring-4 focus-within:ring-yellow-300/50 transition-all border border-transparent dark:border-slate-700">
                  <div className="grid place-items-center h-full w-12 text-gray-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    className="peer h-full w-full outline-none text-gray-800 dark:text-white text-sm sm:text-base pr-4 bg-transparent font-medium"
                    type="text"
                    id="search"
                    placeholder={t('search_placeholder', 'Search fresh vegetables, groceries, dairy, drinks...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="h-full px-5 sm:px-6 bg-charcoal-900 dark:bg-primary-600 text-white font-bold text-xs sm:text-sm hover:bg-black dark:hover:bg-primary-700 transition-colors flex items-center gap-1.5">
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* 3 Interactive Mode Quick Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <Link
                  to="/customer/products"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 transition-all group flex items-center gap-3"
                >
                  <div className="bg-yellow-400 text-charcoal-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">🛵 15-Min Delivery</div>
                    <div className="text-[10px] text-primary-100">Live GPS tracking</div>
                  </div>
                </Link>

                <Link
                  to="/customer/list"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 transition-all group flex items-center gap-3"
                >
                  <div className="bg-orange-400 text-charcoal-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">🛍️ Store Take Away</div>
                    <div className="text-[10px] text-primary-100">Express locker PIN</div>
                  </div>
                </Link>

                <Link
                  to="/customer/scan"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 transition-all group flex items-center gap-3"
                >
                  <div className="bg-purple-400 text-charcoal-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">⚡ In-Store Scan &amp; Go</div>
                    <div className="text-[10px] text-primary-100">Skip all queues</div>
                  </div>
                </Link>
              </div>

            </div>

            {/* Right Column: Attractive 3D Avatar Showcase (5 cols on lg) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div 
                onClick={() => openAiAssistant?.()}
                className="w-full max-w-md bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border-2 border-emerald-400/40 shadow-[0_20px_50px_rgba(16,185,129,0.25)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.4)] transition-all duration-300 group cursor-pointer relative overflow-hidden text-left"
              >
                {/* Decorative background glow */}
                <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-400/30 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Live AI Concierge
                  </span>
                  <span className="text-[11px] font-bold text-yellow-300 flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/30">
                    <Sparkles className="w-3 h-3 text-yellow-300" /> 1-Tap Voice &amp; Chat
                  </span>
                </div>

                {/* Avatar Portrait with Glowing Gradient Frame */}
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative flex-shrink-0">
                    {/* Pulsing glow ring around avatar */}
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-indigo-500 opacity-75 blur-xs group-hover:opacity-100 transition-opacity animate-pulse" />
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-slate-950">
                      <img 
                        src="/smart-avatar.jpg" 
                        alt="Gemma AI Smart Concierge" 
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" 
                      />
                      {/* Active online badge */}
                      <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full shadow-xs" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">Gemma</h3>
                      <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">v2.5</span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-200">Your GoSmart Shopping Concierge</p>
                    <p className="text-[11px] text-primary-100/90 leading-tight">
                      Instant aisle guidance, recipe calculators, &amp; voice assistance.
                    </p>
                  </div>
                </div>

                {/* Speech Bubble Dialogue */}
                <div className="mt-4 bg-white/15 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/20 shadow-inner relative z-10 space-y-2">
                  <div className="text-xs text-slate-100 font-medium leading-relaxed flex items-start gap-2">
                    <span className="text-base">👋</span>
                    <span>
                      "Hi there! Looking for shelf locations, Chef recipe kits, or instant cart addition? Tap me to start chatting!"
                    </span>
                  </div>

                  {/* Quick Click Prompts */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { icon: '🥛', text: 'Where is Milk?' },
                      { icon: '🍛', text: 'Paneer Recipe' },
                      { icon: '🗺️', text: 'Aisle Map' }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAiAssistant?.();
                        }}
                        className="text-[11px] font-semibold bg-white/10 hover:bg-emerald-500/30 text-white px-2.5 py-1 rounded-lg border border-white/15 transition-colors flex items-center gap-1"
                      >
                        <span>{chip.icon}</span>
                        <span>{chip.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-4 relative z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAiAssistant?.();
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-primary-500 hover:from-emerald-300 hover:to-primary-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-98"
                  >
                    <Bot className="w-4 h-4 text-slate-950" />
                    <span>Talk to Gemma (Voice &amp; Text Assistant)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Customer Avatar & Express Membership Welcome Bar */}
      {currentUser && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-primary-500 shadow-md ring-2 ring-primary-300/30 bg-primary-50 dark:bg-slate-800">
                <img 
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face'} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-xs" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white truncate">
                  Welcome back, {currentUser.name}!
                </h2>
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  VIP Shopper
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-bold text-primary-600 dark:text-primary-400">
                  <span>🪙</span> {currentUser.loyaltyPoints || 100} Reward Coins
                </span>
                <span>•</span>
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  📍 {currentUser.address}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <Link
              to="/customer/orders"
              className="px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all border border-gray-200 dark:border-slate-700 flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span>Track Orders ({orders ? orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length : 0})</span>
            </Link>

            <Link
              to="/customer/scan"
              className="px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan &amp; Go</span>
            </Link>

            <button
              type="button"
              onClick={() => openAiAssistant?.()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Gemma</span>
            </button>
          </div>
        </section>
      )}


      {/* Popular Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Shop by Category</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Find products categorized by aisle location in the store</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/customer/products')}>
            View All Categories →
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((category) => (
            <button 
              key={category.name}
              onClick={() => navigate(`/customer/products?category=${encodeURIComponent(category.name)}`)}
              className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 text-2xl ${category.bg} group-hover:scale-110 transition-transform shadow-inner`}>
                {category.icon}
              </div>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-xs group-hover:text-primary-700 dark:group-hover:text-primary-400">{category.name}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{category.count} items</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products with 1-Click Cart Addition */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Today's Featured Essentials</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Live in-stock products with real high-resolution photos</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/customer/products')}>
            Explore All Catalog ({products.length})
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border-2 border-dashed border-gray-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Store Catalog Ready for Setup</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Your store catalog is clean and ready to be populated with your local supermarket's inventory.
              </p>
            </div>
            <Link to="/staff/products">
              <Button className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add First Product to Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {products.slice(0, 10).map((product) => {
              const inCart = shoppingList.some(item => item.id === product.id);

              return (
                <div 
                  key={product.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="aspect-square bg-gray-50 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center p-2">
                      <ProductImage 
                        src={product.image} 
                        alt={product.name}
                        category={product.category}
                        productName={product.name}
                        barcode={product.barcode}
                        onClick={() => navigate(`/customer/products/${product.id}`)}
                        className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300 cursor-pointer" 
                      />
                      <div className="absolute top-3 right-3">
                        <AvailabilityBadge stock={product.stock} reorderLevel={product.reorderLevel} />
                      </div>

                      {/* Aisle Locator Badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMapModalProduct(product);
                        }}
                        className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs hover:bg-white dark:hover:bg-slate-900 text-gray-700 dark:text-gray-200 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 shadow-2xs flex items-center gap-1 transition-colors"
                        title="View on store map"
                      >
                        <MapPin className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                        {t('aisle', 'Aisle')} {product.aisle}
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
                        {product.category}
                      </div>
                      <h3 
                        onClick={() => navigate(`/customer/products/${product.id}`)}
                        className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 min-h-[40px] hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors"
                      >
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.brand} • {product.unit}</p>
                    </div>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="p-4 pt-0 flex items-center justify-between">
                    <span className="font-extrabold text-lg text-gray-900 dark:text-white">₹{product.price}</span>
                    
                    <Button
                      size="sm"
                      variant={inCart ? "outline" : "default"}
                      className={inCart ? "text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/60 text-xs" : "text-xs font-bold"}
                      onClick={() => addToShoppingList(product, 1)}
                    >
                      {inCart ? (
                        <span className="flex items-center gap-1">✓ {t('added', 'Added')}</span>
                      ) : (
                        <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {t('add_to_cart', 'Add')}</span>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Chef-Curated Recipes & 1-Click Meal Planner */}
      {popularRecipes && popularRecipes.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                <span>👨‍🍳 Chef Specials</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {t('curated_recipes', 'Chef-Curated Recipes & 1-Click Meal Kits')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cook restaurant-grade meals at home. Add all required grocery ingredients to your cart in 1 click!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularRecipes.map((recipe) => {
              const recipeProducts = products.filter(p => recipe.productIds.includes(p.id));
              const totalCost = recipeProducts.reduce((sum, p) => sum + p.price, 0);
              const isAdded = addedRecipeId === recipe.id;

              const localizedName = language === 'hi' ? (recipe.nameHi || recipe.name)
                : language === 'ta' ? (recipe.nameTa || recipe.name)
                : language === 'te' ? (recipe.nameTe || recipe.name)
                : language === 'es' ? (recipe.nameEs || recipe.name)
                : recipe.name;

              return (
                <div 
                  key={recipe.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-44 bg-gray-100 dark:bg-slate-800 relative overflow-hidden">
                      <img 
                        src={recipe.image} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span>{recipe.time}</span>
                        <span>•</span>
                        <span>{recipe.servings}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono font-black text-sm px-3 py-1 rounded-xl shadow-md border border-gray-200 dark:border-slate-700">
                        ₹{totalCost}
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>{recipe.icon}</span>
                          <span>{localizedName}</span>
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {recipe.description}
                        </p>
                      </div>

                      {/* Ingredients Pills */}
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Includes {recipeProducts.length} Fresh Store Ingredients:</div>
                        <div className="flex flex-wrap gap-1">
                          {recipeProducts.map(p => (
                            <span key={p.id} className="text-[10px] bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md border border-gray-200 dark:border-slate-700">
                              {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Button
                      className={`w-full text-xs font-bold shadow-md flex items-center justify-center gap-2 ${
                        isAdded ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                      }`}
                      onClick={() => {
                        addRecipeToCart(recipe);
                        setAddedRecipeId(recipe.id);
                        setTimeout(() => setAddedRecipeId(null), 2000);
                      }}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>All Ingredients Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>{t('ai_add_recipe_cart', 'Add All Ingredients to Cart')} (₹{totalCost})</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Aisle Map Modal */}
      <StoreAisleMapModal
        isOpen={!!mapModalProduct}
        onClose={() => setMapModalProduct(null)}
        selectedProduct={mapModalProduct}
      />

    </div>
  );
}

