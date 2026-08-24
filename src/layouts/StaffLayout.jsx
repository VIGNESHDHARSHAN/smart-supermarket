import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackageSearch, 
  History, 
  Truck, 
  Package,
  LogOut,
  Store,
  ArrowLeft,
  ShieldCheck,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Settings
} from 'lucide-react';

import { useState } from 'react';
import { cn } from '../lib/utils';
import { useSupermarket } from '../context/SupermarketContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function StaffLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders } = useSupermarket();
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t, supportedLanguages, currentLangMeta } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const activeOnlineOrdersCount = orders.filter(o => 
    !['DELIVERED', 'COLLECTED', 'COMPLETED', 'CANCELLED'].includes(o.status)
  ).length;

  const pendingScanGoCount = orders.filter(o => 
    o.type === 'SELF_CHECKOUT' && o.status !== 'COMPLETED'
  ).length;

  const navigation = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    { 
      name: 'Turnstile Gate & Security', 
      href: '/staff/verify', 
      icon: ShieldCheck,
      badge: pendingScanGoCount > 0 ? pendingScanGoCount : null
    },
    { 
      name: 'Online & Delivery Orders', 
      href: '/staff/orders', 
      icon: Truck,
      badge: activeOnlineOrdersCount > 0 ? activeOnlineOrdersCount : null
    },
    { name: 'POS Billing Counter', href: '/staff/pos', icon: ShoppingCart },
    { name: 'Inventory Management', href: '/staff/inventory', icon: PackageSearch },
    { name: 'Products Catalog', href: '/staff/products', icon: Package },
    { name: 'Supplier Purchases', href: '/staff/purchases', icon: Truck },
    { name: 'Sales & History', href: '/staff/sales', icon: History },
    { name: 'Store Settings', href: '/staff/settings', icon: Settings },
  ];


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      
      {/* Sidebar */}
      <div className="w-64 bg-charcoal-900 dark:bg-slate-900 text-white flex-shrink-0 flex flex-col justify-between border-r border-charcoal-800 dark:border-slate-800">
        
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 bg-charcoal-950 dark:bg-slate-950 border-b border-charcoal-800 dark:border-slate-800">
            <div className="flex items-center">
              <Store className="w-6 h-6 text-primary-500 mr-2" />
              <span className="font-bold text-lg tracking-tight">SmartMart Admin</span>
            </div>
          </div>

          {/* Customer Store Switcher Banner */}
          <div className="p-3">
            <Link
              to="/customer"
              className="flex items-center justify-between p-2.5 bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 hover:text-white rounded-xl border border-primary-500/30 transition-all text-xs font-bold"
            >
              <span className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-primary-400" /> Go to Customer Store
              </span>
              <span className="text-[10px] bg-primary-500 text-white px-1.5 py-0.2 rounded font-mono">Live</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    isActive ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-300 hover:bg-charcoal-800 dark:hover:bg-slate-800 hover:text-white',
                    'group flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all'
                  )}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={cn(
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300',
                        'mr-3 flex-shrink-0 h-4 w-4'
                      )}
                    />
                    {item.name}
                  </div>

                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Logout & Switch */}
        <div className="p-4 border-t border-charcoal-800 dark:border-slate-800 space-y-2">
          <Link
            to="/customer"
            className="flex items-center w-full px-3 py-2 text-xs font-semibold text-gray-300 rounded-xl hover:bg-charcoal-800 dark:hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2.5 h-4 w-4 text-primary-400" />
            Switch to Customer Portal
          </Link>
          <Link
            to="/staff/login"
            className="flex items-center w-full px-3 py-2 text-xs font-semibold text-red-400 rounded-xl hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut className="mr-2.5 h-4 w-4 text-red-400" />
            Sign Out Staff
          </Link>
        </div>

      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Staff Top Header */}
        <header className="bg-white dark:bg-slate-900 shadow-xs border-b border-gray-200 dark:border-slate-800 h-16 flex items-center px-8 justify-between transition-colors">
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-green-100 dark:bg-emerald-950/70 text-green-800 dark:text-emerald-300 border dark:border-emerald-800/60 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Store System Online (Indiranagar Supercenter)
            </span>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-colors border border-transparent dark:border-slate-700"
              >
                <span className="text-sm">{currentLangMeta.flag}</span>
                <span className="hidden sm:inline">{currentLangMeta.name}</span>
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

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-yellow-400 transition-colors border border-transparent dark:border-slate-700"
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Link to Customer Store */}
            <Link
              to="/customer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/70 hover:bg-primary-100 dark:hover:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-xl text-xs font-bold border border-primary-200 dark:border-primary-800 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Customer Storefront →</span>
            </Link>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-800"></div>

            {/* Admin Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 border border-primary-300 dark:border-primary-700 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xs">
                AD
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Admin Manager</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Supermarket Operator</div>
              </div>
            </div>

          </div>
        </header>

        {/* Dynamic Route Body */}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8 transition-colors">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
