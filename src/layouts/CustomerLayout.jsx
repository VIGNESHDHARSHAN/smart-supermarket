import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Store, 
  Search, 
  ShoppingBag, 
  MapPin, 
  Truck, 
  QrCode, 
  User, 
  ChevronDown,
  Navigation,
  ShieldCheck, 
  Award,
  Sun,
  Moon,
  Globe,
  Sparkles,
  Check,
  Bot,
  Settings
} from 'lucide-react';
import { useSupermarket } from '../context/SupermarketContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import CustomerProfileModal from '../components/customer/CustomerProfileModal';
import StoreAisleMapModal from '../components/customer/StoreAisleMapModal';
import AIChatbotModal from '../components/customer/AIChatbotModal';

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { shoppingList, orders, currentUser } = useSupermarket();
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t, supportedLanguages, currentLangMeta } = useLanguage();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [storeMapOpen, setStoreMapOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);


  // Active orders (non-completed)
  const activeOrdersCount = orders.filter(o => 
    !['DELIVERED', 'COLLECTED', 'COMPLETED', 'CANCELLED'].includes(o.status)
  ).length;

  const totalCartCount = shoppingList.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const navItems = [
    { name: t('store_home', 'Store Home'), path: '/customer', icon: Store },
    { name: t('products', 'Products'), path: '/customer/products', icon: Search },
    { name: t('scan_go', 'Scan & Go'), path: '/customer/scan', icon: QrCode, badge: 'Instant' },
    { 
      name: t('cart_list', 'My Cart & List'), 
      path: '/customer/list', 
      icon: ShoppingBag, 
      count: totalCartCount 
    },
    { 
      name: t('live_orders', 'Live Orders'), 
      path: '/customer/orders', 
      icon: Truck, 
      count: activeOrdersCount,
      pulse: activeOrdersCount > 0 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col selection:bg-primary-500 selection:text-white transition-colors duration-200">
      
      {/* Top Real-Time Announcement Bar */}
      <div className="bg-charcoal-900 text-white text-xs py-2 px-4 border-b border-charcoal-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 bg-primary-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              LIVE
            </span>
            <span className="text-gray-200">
              🛵 <strong>{t('express_delivery', 'Express 15-Min Delivery')}</strong> & 🛍️ <strong>{t('store_takeaway', 'Store Take Away')}</strong> active in Bengaluru
            </span>
          </div>

          <div className="flex items-center gap-4 text-gray-300">
            <button
              onClick={() => setStoreMapOpen(true)}
              className="hover:text-white flex items-center gap-1 transition-colors underline decoration-primary-400 decoration-2"
            >
              <Navigation className="w-3.5 h-3.5 text-primary-400" />
              <span>Aisle Map & Store Navigator</span>
            </button>
            <span className="text-gray-600">|</span>
            <Link to="/staff/dashboard" className="hover:text-primary-400 flex items-center gap-1 font-semibold transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('staff_portal', 'Staff Portal')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link to="/customer" className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-tr from-primary-700 to-primary-500 p-2.5 rounded-xl shadow-md group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white leading-none flex items-center gap-1">
                  SmartMart <span className="text-primary-600 dark:text-primary-400">Express</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-400 tracking-wider uppercase mt-0.5">
                  Supermarket & Delivery
                </div>
              </div>
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden lg:flex space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "relative inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 mr-2", isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400")} />
                    {item.name}

                    {item.count > 0 && (
                      <span className={cn(
                        "ml-2 text-xs px-2 py-0.2 rounded-full font-bold",
                        item.pulse 
                          ? "bg-red-500 text-white animate-pulse shadow-sm" 
                          : "bg-primary-600 text-white"
                      )}>
                        {item.count}
                      </span>
                    )}

                    {item.badge && (
                      <span className="ml-1.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black px-1.5 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Controls: Language, Theme, Map & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Language Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-colors border border-transparent dark:border-slate-700"
                  title="Change Language"
                >
                  <span className="text-sm">{currentLangMeta.flag}</span>
                  <span className="hidden md:inline">{currentLangMeta.nativeName}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>

                {langDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setLangDropdownOpen(false)}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      {t('language', 'Language')}
                    </div>
                    {supportedLanguages.map(l => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors",
                          language === l.code
                            ? "bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 font-bold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span>{l.nativeName}</span>
                        </span>
                        {language === l.code && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-yellow-400 transition-colors border border-transparent dark:border-slate-700"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* In-Store Map Button */}
              <button
                onClick={() => setStoreMapOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-colors border border-transparent dark:border-slate-700"
              >
                <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Store Map</span>
              </button>

              {/* User Profile Pill */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full border border-gray-200 dark:border-slate-700 transition-all text-left"
                  >
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face'}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover border border-primary-500"
                    />
                    <div className="hidden sm:block">
                      <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[100px]">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-primary-700 dark:text-primary-400 font-semibold flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" /> {currentUser.loyaltyPoints || 450} pts
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="p-3 bg-primary-50/70 dark:bg-primary-950/50 rounded-xl border border-primary-100 dark:border-primary-900 mb-2">
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{currentUser.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</div>
                        <div className="text-xs text-primary-700 dark:text-primary-400 font-bold mt-1">
                          🎁 {currentUser.loyaltyPoints || 450} SmartPoints Available
                        </div>
                      </div>

                      <div className="space-y-1 text-xs font-medium">
                        <button
                          onClick={() => { setUserDropdownOpen(false); setProfileModalOpen(true); }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200"
                        >
                          <User className="w-4 h-4 text-gray-500" /> Profile & Addresses
                        </button>
                        <button
                          onClick={() => { setUserDropdownOpen(false); setAiModalOpen(true); }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/70 text-primary-700 dark:text-primary-300 font-bold"
                        >
                          <Bot className="w-4 h-4 text-primary-600" /> SmartMart AI Genie
                        </button>
                        <button
                          onClick={() => { setUserDropdownOpen(false); navigate('/customer/settings'); }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200"
                        >
                          <Settings className="w-4 h-4 text-gray-500" /> Account Settings
                        </button>
                        <button
                          onClick={() => { setUserDropdownOpen(false); navigate('/customer/orders'); }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200"
                        >
                          <span className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-500" /> My Orders & Tracking
                          </span>
                          {activeOrdersCount > 0 && (
                            <span className="bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                              {activeOrdersCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => { setUserDropdownOpen(false); navigate('/customer/scan'); }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200"
                        >
                          <QrCode className="w-4 h-4 text-gray-500" /> Scan & Go In-Store
                        </button>
                        <div className="border-t border-gray-100 dark:border-slate-800 my-1"></div>
                        <button
                          onClick={() => { setUserDropdownOpen(false); navigate('/customer/login'); }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold"
                        >
                          <Sparkles className="w-4 h-4 text-primary-600" /> Switch / Customer Login
                        </button>
                        <button
                          onClick={() => { setUserDropdownOpen(false); navigate('/staff/dashboard'); }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-charcoal-800 hover:text-white text-gray-700 dark:text-gray-200"
                        >
                          <ShieldCheck className="w-4 h-4 text-primary-600" /> Staff Admin Portal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/customer/settings"
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/customer/login"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}


            </div>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="lg:hidden border-t border-gray-100 dark:border-slate-800 px-4 py-2 flex justify-around bg-white dark:bg-slate-900 transition-colors">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center py-1 px-2 text-[11px] font-medium",
                  isActive ? "text-primary-600 dark:text-primary-400 font-bold" : "text-gray-500 dark:text-gray-400"
                )}
              >
                <item.icon className="w-5 h-5 mb-0.5" />
                <span>{item.name}</span>
                {item.count > 0 && (
                  <span className="absolute top-0 right-1 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full text-slate-900 dark:text-slate-100">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 mt-16 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-lg text-white">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">SmartMart Express</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Next-generation smart supermarket with live stock visibility, 15-min instant home delivery, store take-away lockers & queue-less self checkout.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-xs uppercase tracking-wider">Fulfillment Options</h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li>🛵 {t('express_delivery', 'Express 15-Minute Home Delivery')}</li>
              <li>🛍️ {t('store_takeaway', 'Store Take Away & Click-and-Collect')}</li>
              <li>⚡ {t('self_checkout_instore', 'In-Store Scan & Go Self-Checkout')}</li>
              <li>📦 Contactless Locker Pickups</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-xs uppercase tracking-wider">Quick Portals</h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/customer/products" className="hover:text-primary-600 dark:hover:text-primary-400">All Products Catalog</Link>
              </li>
              <li>
                <Link to="/customer/orders" className="hover:text-primary-600 dark:hover:text-primary-400">Live Order Tracking</Link>
              </li>
              <li>
                <Link to="/customer/login" className="hover:text-primary-600 dark:hover:text-primary-400">Customer Login / Profiles</Link>
              </li>
              <li>
                <Link to="/staff/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 font-semibold text-primary-700 dark:text-primary-400">Staff Admin Dashboard</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-xs uppercase tracking-wider">Store Location</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              📍 100ft Road, Indiranagar, Bengaluru - 560038
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              ⏰ Open Daily: 7:00 AM – 11:00 PM
            </p>
            <button
              onClick={() => setStoreMapOpen(true)}
              className="mt-3 inline-flex items-center text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Navigation className="w-3.5 h-3.5 mr-1" /> View Store Aisle Map →
            </button>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 dark:text-gray-500 gap-4">
          <div>&copy; 2026 SmartMart Supermarket Operating System. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-gray-600 dark:text-gray-400 font-medium">Real-Time Simulation Engine Active</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Genie Interactive Widget Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={() => setAiModalOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-600 hover:from-primary-700 hover:to-emerald-700 text-white pl-4 pr-5 py-3.5 rounded-full shadow-2xl hover:shadow-primary-500/40 border border-white/30 transition-all hover:scale-105 active:scale-95"
        >
          {/* Glowing pulse ring */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-400 text-[9px] font-black text-charcoal-900 items-center justify-center">✨</span>
          </span>

          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform" />
          </div>

          <div className="text-left">
            <div className="text-xs font-black tracking-tight leading-tight flex items-center gap-1">
              <span>{t('ai_genie', 'SmartMart AI')}</span>
            </div>
            <div className="text-[10px] text-primary-100 font-medium leading-none">
              Recipe & Cart Genie
            </div>
          </div>
        </button>
      </div>

      {/* Modals */}
      <CustomerProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <StoreAisleMapModal isOpen={storeMapOpen} onClose={() => setStoreMapOpen(false)} />
      <AIChatbotModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />

    </div>
  );
}

