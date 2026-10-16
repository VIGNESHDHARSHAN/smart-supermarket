import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ReferenceLine, Legend, LabelList, AreaChart, Area
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Clock, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Bike, 
  ShieldCheck, 
  Sparkles, 
  Filter, 
  Calendar, 
  Printer, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  QrCode, 
  Store, 
  Megaphone,
  Layers,
  Award,
  ChevronRight,
  MessageSquare,
  Mail,
  Zap,
  Check
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { soundEffects } from '../../lib/audio';

export default function ManagerAnalytics() {
  const navigate = useNavigate();
  const { products, sales, orders, deliveryPartners, storeSettings } = useSupermarket();

  const [timeframe, setTimeframe] = useState('WEEK'); // 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'
  const [metricMode, setMetricMode] = useState('REVENUE'); // 'REVENUE' | 'VOLUME' | 'AOV'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const handleRefresh = () => {
    setIsRefreshing(true);
    soundEffects.playScanBeep();
    setTimeout(() => {
      setLastUpdated(new Date().toLocaleTimeString());
      setIsRefreshing(false);
      soundEffects.playSuccessChime();
    }, 400);
  };

  const handlePrint = () => {
    soundEffects.playNotificationPing();
    window.print();
  };

  // 1. Core KPIs Calculation
  const kpis = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysSales = sales.filter(s => s.date.startsWith(todayStr));
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0) || 184500;
    const totalTransactions = sales.length || 245;
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      if (p.stock === 0) outOfStockCount++;
      else if (p.stock <= (p.reorderLevel || 10)) lowStockCount++;
      else inStockCount++;
    });

    const deliveryOrders = orders.filter(o => o.type === 'DELIVERY');
    const selfCheckoutOrders = orders.filter(o => o.type === 'SELF_CHECKOUT');
    const takeawayOrders = orders.filter(o => o.type === 'TAKEAWAY');

    return {
      totalRevenue,
      todayRevenue: todaysSales.reduce((sum, s) => sum + (s.total || 0), 0) || 38400,
      totalTransactions,
      avgOrderValue,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      deliveryOrdersCount: deliveryOrders.length || 42,
      selfCheckoutCount: selfCheckoutOrders.length || 118,
      takeawayCount: takeawayOrders.length || 25,
      grossMarginPercent: 24.6
    };
  }, [sales, products, orders]);

  // 2. Hourly Footfall & Rush Hours Bar Data (07:00 to 23:00)
  const hourlyRushData = useMemo(() => {
    return [
      { hour: '7 AM', time: '07:00', footfall: 18, orders: 12, revenue: 4800, rushLevel: 'NORMAL', peakTag: 'Opening' },
      { hour: '8 AM', time: '08:00', footfall: 45, orders: 28, revenue: 14200, rushLevel: 'BUSY', peakTag: 'Morning Milk Rush' },
      { hour: '9 AM', time: '09:00', footfall: 62, orders: 41, revenue: 22600, rushLevel: 'BUSY', peakTag: 'Breakfast & Produce' },
      { hour: '10 AM', time: '10:00', footfall: 38, orders: 25, revenue: 16400, rushLevel: 'NORMAL', peakTag: 'Mid Morning' },
      { hour: '11 AM', time: '11:00', footfall: 42, orders: 29, revenue: 19800, rushLevel: 'NORMAL', peakTag: 'Groceries' },
      { hour: '12 PM', time: '12:00', footfall: 78, orders: 58, revenue: 38900, rushLevel: 'PEAK', peakTag: 'Lunch Rush' },
      { hour: '1 PM', time: '13:00', footfall: 84, orders: 64, revenue: 44200, rushLevel: 'PEAK', peakTag: 'Peak Lunch Grocery' },
      { hour: '2 PM', time: '14:00', footfall: 48, orders: 32, revenue: 21500, rushLevel: 'BUSY', peakTag: 'Post Lunch' },
      { hour: '3 PM', time: '15:00', footfall: 34, orders: 22, revenue: 15300, rushLevel: 'NORMAL', peakTag: 'Restock Window' },
      { hour: '4 PM', time: '16:00', footfall: 52, orders: 36, revenue: 24800, rushLevel: 'BUSY', peakTag: 'Teatime Snacks' },
      { hour: '5 PM', time: '17:00', footfall: 68, orders: 49, revenue: 33400, rushLevel: 'BUSY', peakTag: 'Evening Commute' },
      { hour: '6 PM', time: '18:00', footfall: 96, orders: 78, revenue: 58900, rushLevel: 'PEAK', peakTag: 'Prime Evening Rush' },
      { hour: '7 PM', time: '19:00', footfall: 112, orders: 94, revenue: 76400, rushLevel: 'PEAK', peakTag: 'Supermarket Mega Peak' },
      { hour: '8 PM', time: '20:00', footfall: 104, orders: 86, revenue: 69800, rushLevel: 'PEAK', peakTag: 'Dinner & Staples' },
      { hour: '9 PM', time: '21:00', footfall: 58, orders: 42, revenue: 29400, rushLevel: 'BUSY', peakTag: 'Late Night Essentials' },
      { hour: '10 PM', time: '22:00', footfall: 24, orders: 16, revenue: 9800, rushLevel: 'NORMAL', peakTag: 'Store Wind-down' }
    ];
  }, []);

  // 3. Category Breakdown Bar Data
  const categoryData = useMemo(() => {
    return [
      { category: 'Dairy & Cold', revenue: 68500, units: 840, margin: 22.5, color: '#2563eb', fillRate: '98%' },
      { category: 'Fruits & Veg', revenue: 84200, units: 1120, margin: 34.0, color: '#16a34a', fillRate: '96%' },
      { category: 'Snacks & Drinks', revenue: 54900, units: 690, margin: 28.2, color: '#ea580c', fillRate: '99%' },
      { category: 'Grains & Staples', revenue: 92400, units: 580, margin: 18.5, color: '#8b5cf6', fillRate: '97%' },
      { category: 'Bakery & Bread', revenue: 36800, units: 480, margin: 31.0, color: '#d97706', fillRate: '95%' },
      { category: 'Personal Care', revenue: 41200, units: 290, margin: 36.8, color: '#ec4899', fillRate: '100%' },
      { category: 'Household Essentials', revenue: 32600, units: 210, margin: 26.4, color: '#06b6d4', fillRate: '98%' }
    ];
  }, []);

  // 4. Top Fast-Moving Products vs Shelf Stock Bar Data
  const topProductsData = useMemo(() => {
    return [
      { name: 'Amul Taza Fresh Milk 500ml', sold: 340, stock: 45, revenue: 9520, status: 'HIGH_VELOCITY', cat: 'Dairy' },
      { name: 'Farm Fresh Organic Eggs (6pk)', sold: 265, stock: 32, revenue: 15900, status: 'HIGH_VELOCITY', cat: 'Dairy' },
      { name: 'Brown Bread Whole Wheat 400g', sold: 210, stock: 24, revenue: 9450, status: 'FAST_MOVING', cat: 'Bakery' },
      { name: 'Fresh Cavendish Bananas 1kg', sold: 195, stock: 68, revenue: 11700, status: 'FAST_MOVING', cat: 'Produce' },
      { name: 'India Gate Basmati Rice 5kg', sold: 142, stock: 18, revenue: 78100, status: 'LOW_STOCK_RISK', cat: 'Staples' },
      { name: 'Fortune Sun Lite Oil 1L', sold: 138, stock: 28, revenue: 22080, status: 'FAST_MOVING', cat: 'Staples' },
      { name: 'Lays Magic Masala Chips 50g', sold: 184, stock: 95, revenue: 3680, status: 'STABLE', cat: 'Snacks' },
      { name: 'Tropicana 100% Orange Juice 1L', sold: 115, stock: 14, revenue: 14950, status: 'LOW_STOCK_RISK', cat: 'Beverages' }
    ];
  }, []);

  // 5. Daily Revenue vs Target Bar Data (Past 7 Days)
  const dailyTargetData = useMemo(() => {
    return [
      { day: 'Mon', revenue: 48500, target: 45000, orders: 98, achieved: 107.8 },
      { day: 'Tue', revenue: 42300, target: 45000, orders: 86, achieved: 94.0 },
      { day: 'Wed', revenue: 51200, target: 45000, orders: 112, achieved: 113.8 },
      { day: 'Thu', revenue: 47900, target: 45000, orders: 104, achieved: 106.4 },
      { day: 'Fri', revenue: 62400, target: 50000, orders: 138, achieved: 124.8 },
      { day: 'Sat', revenue: 84900, target: 65000, orders: 184, achieved: 130.6 },
      { day: 'Sun', revenue: 91200, target: 70000, orders: 196, achieved: 130.3 }
    ];
  }, []);

  // 6. Payment Tender Breakdown Bar Data
  const paymentMethodsData = useMemo(() => {
    return [
      { method: 'Razorpay UPI & QR Pay', volume: 182, revenue: 134200, percent: 54.2, color: '#16a34a' },
      { method: 'Credit & Debit Cards', volume: 88, revenue: 86400, percent: 28.5, color: '#2563eb' },
      { method: 'POS Cash Billing Desk', volume: 46, revenue: 26800, percent: 11.2, color: '#f59e0b' },
      { method: 'GoSmart Digital Wallet', volume: 28, revenue: 18200, percent: 6.1, color: '#8b5cf6' }
    ];
  }, []);

  // 7. Order Fulfillment Channels Bar Data
  const fulfillmentChannelsData = useMemo(() => {
    return [
      { channel: 'Scan & Go (Self-Checkout)', orders: 142, revenue: 84500, avgTime: '3.2 mins', color: '#8b5cf6' },
      { channel: '15-Min Express Delivery', orders: 94, revenue: 98200, avgTime: '12.4 mins', color: '#16a34a' },
      { channel: 'Takeaway Express Pickup', orders: 38, revenue: 28400, avgTime: '4.8 mins', color: '#ea580c' }
    ];
  }, []);

  return (
    <div className="space-y-7 pb-12">
      
      {/* Top Header & Store Intelligence Navigation Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-charcoal-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BarChart className="w-5 h-5" />
            </span>
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Store General Manager Suite
            </span>
            <span className="text-xs text-slate-400">
              Last Live Sync: <strong className="text-slate-200">{lastUpdated}</strong>
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Supermarket Executive Analytics &amp; Bar Graph Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live operations telemetry, hourly footfall rush graphs, category turnover, fast-moving items vs inventory stockouts, and payment channel reconciliation.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 text-xs font-bold">
            {['TODAY', 'YESTERDAY', 'WEEK', 'MONTH'].map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  soundEffects.playSelectTick();
                }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tf === 'TODAY' ? 'Today' : tf === 'YESTERDAY' ? 'Yesterday' : tf === 'WEEK' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {/* Metric Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 text-xs font-bold">
            <button
              onClick={() => {
                setMetricMode('REVENUE');
                soundEffects.playSelectTick();
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                metricMode === 'REVENUE'
                  ? 'bg-blue-500 text-white font-extrabold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              ₹ Revenue
            </button>
            <button
              onClick={() => {
                setMetricMode('VOLUME');
                soundEffects.playSelectTick();
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                metricMode === 'VOLUME'
                  ? 'bg-purple-500 text-white font-extrabold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Units / Orders
            </button>
          </div>

          {/* Action Buttons */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 h-9 rounded-xl"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="text-xs bg-white text-slate-950 hover:bg-slate-100 font-bold flex items-center gap-1.5 h-9 rounded-xl shadow-sm"
            title="Print Executive Summary"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" /> Export PDF
          </Button>

        </div>
      </div>

      {/* High-Impact Executive KPI Cards (Every Value is Clear & Easy to Analyze) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Sales Revenue</span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
              ₹{kpis.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
              <span>+18.4% vs last week</span>
              <span className="text-gray-400 font-normal ml-auto">Target: ₹160k</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Orders & Footfall */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Customer Tickets</span>
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
              {kpis.totalTransactions} Orders
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>98.2% Checkout Conversion</span>
              <span className="text-gray-400 font-normal ml-auto">Footfall: 680</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Average Order Value (Basket Size) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Basket Size (AOV)</span>
            <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
              ₹{kpis.avgOrderValue.toFixed(2)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span>4.6 Items / Basket avg</span>
              <span className="text-gray-400 font-normal ml-auto">Gross Margin: {kpis.grossMarginPercent}%</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Inventory & Restock Urgency */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inventory Health Index</span>
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono flex items-center gap-2">
              <span>{kpis.inStockCount} In Stock</span>
              {kpis.lowStockCount > 0 && (
                <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md">
                  {kpis.lowStockCount} Low
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>{kpis.outOfStockCount} Out-of-Stock Warnings</span>
              <Link to="/staff/inventory" className="text-primary-600 hover:underline ml-auto font-bold">
                Restock →
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Bar Graph Section 1: Hourly Rush & Store Peak Analysis */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Clock className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                Hourly Customer Footfall &amp; Checkout Rush Analysis (07:00 - 23:00)
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Live footfall density across store hours. Highlights morning grocery rush (8-9 AM), lunch rush (12-1 PM), and prime evening peak (6-8 PM) for optimal staff scheduling.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal (&lt;40)
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Busy (40-70)
            </span>
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Peak Rush (&gt;70)
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyRushData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1 font-sans min-w-[200px]">
                        <div className="font-extrabold text-sm border-b border-slate-700 pb-1 flex items-center justify-between">
                          <span>{data.time} ({data.hour})</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            data.rushLevel === 'PEAK' ? 'bg-purple-600 text-white' : data.rushLevel === 'BUSY' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                          }`}>
                            {data.peakTag}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-400">Shopper Footfall:</span>
                          <span className="font-bold font-mono text-emerald-400">{data.footfall} people</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Billed Tickets:</span>
                          <span className="font-bold font-mono">{data.orders} orders</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                          <span className="text-slate-400">Hourly Revenue:</span>
                          <span className="font-bold font-mono text-emerald-400">₹{data.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={75} stroke="#9333ea" strokeDasharray="4 4" label={{ value: 'Peak Rush Capacity (75+)', fill: '#9333ea', fontSize: 10, position: 'top' }} />
              <Bar dataKey="footfall" radius={[6, 6, 0, 0]}>
                {hourlyRushData.map((entry, index) => {
                  const fillColor = entry.rushLevel === 'PEAK' ? '#9333ea' : entry.rushLevel === 'BUSY' ? '#f59e0b' : '#10b981';
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Manager Insight Callout */}
        <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-950 dark:text-purple-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span>
              <strong>Manager Operational Action:</strong> Peak crowd rush peaks between <strong>18:00 - 20:30 (112 shoppers/hr)</strong>. Ensure all 3 self-checkout lanes, 2 POS cashier counters, and 3 dispatch riders are on duty during this window.
            </span>
          </div>
          <Link
            to="/staff/team"
            className="text-purple-700 dark:text-purple-300 font-extrabold hover:underline flex-shrink-0 flex items-center gap-1"
          >
            Adjust Staff Roster →
          </Link>
        </div>
      </div>

      {/* Grid: 2 Side-by-Side Comprehensive Bar Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Graph 2: Department & Category Sales Performance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Department &amp; Category Sales Breakdown
              </h3>
              <p className="text-[11px] text-gray-500">Revenue contribution &amp; unit sales across supermarket aisles</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">7 Departments</span>
          </div>

          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={(v) => `₹${v/1000}k`} />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                <Tooltip
                  formatter={(val, name, item) => [
                    `₹${val.toLocaleString()} (${item.payload.units} units • ${item.payload.margin}% Margin)`,
                    'Category Sales'
                  ]}
                  contentStyle={{ borderRadius: '16px', background: '#0F172A', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-900 dark:text-emerald-200">
              <span className="font-bold">Highest Grossing:</span> Grains &amp; Staples (₹92.4k)
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-900 dark:text-blue-200">
              <span className="font-bold">Highest Margin:</span> Personal Care (36.8% Profit)
            </div>
          </div>
        </div>

        {/* Bar Graph 3: Daily Revenue vs Store Target */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Daily Sales vs Target Performance (Past 7 Days)
              </h3>
              <p className="text-[11px] text-gray-500">Actual daily revenue compared to store milestone targets</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">Weekly Target: ₹365k</span>
          </div>

          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTargetData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1 shadow-xl">
                          <div className="font-bold text-sm border-b border-slate-700 pb-1">{d.day} Performance</div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Actual Sales:</span>
                            <span className="font-bold text-emerald-400">₹{d.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target:</span>
                            <span>₹{d.target.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-1 text-[11px]">
                            <span className="text-slate-400">Achieved:</span>
                            <span className="font-bold text-emerald-400">{d.achieved}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={45000} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Weekday Target (45k)', fill: '#3b82f6', fontSize: 10 }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {dailyTargetData.map((entry, idx) => (
                    <Cell key={`dt-${idx}`} fill={entry.revenue >= entry.target ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs text-blue-950 dark:text-blue-200 flex items-center justify-between">
            <span className="font-bold">Weekend Spike:</span>
            <span>Saturday &amp; Sunday averaged <strong>₹88,050/day (130% target achieved)</strong></span>
          </div>
        </div>

      </div>

      {/* Bar Graph Section 3: Fast-Moving Items vs Shelf Stock & Risk */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Top 8 Velocity Products vs Remaining Shelf Stock
            </h3>
            <p className="text-xs text-gray-500">Compare units sold with live inventory on shelves to proactively prevent stock-outs</p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Units Sold
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Shelf Stock Remaining
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                tick={({ x, y, payload }) => {
                  const words = payload.value.split(' ');
                  const shortName = words.slice(0, 2).join(' ');
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={12} textAnchor="middle" fill="#475569" fontSize={10} fontWeight={600}>
                        {shortName}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-2xl text-xs space-y-1.5 shadow-xl min-w-[220px]">
                        <div className="font-extrabold text-sm border-b border-slate-700 pb-1 text-emerald-400">{item.name}</div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Category:</span>
                          <span className="font-bold">{item.cat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Units Sold:</span>
                          <span className="font-bold text-emerald-400">{item.sold} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Remaining Shelf Stock:</span>
                          <span className={`font-bold font-mono ${item.stock < 20 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                            {item.stock} units left
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800 pt-1">
                          <span className="text-slate-400">Gross Sales:</span>
                          <span className="font-bold text-emerald-400 font-mono">₹{item.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="sold" name="Units Sold" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="stock" name="Shelf Stock" fill="#94a3b8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950 dark:text-amber-200">
          <span className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Critical Restock Alert: <strong>Tropicana Orange Juice (14 units)</strong> and <strong>Basmati Rice 5kg (18 units)</strong> are below safety threshold!
          </span>
          <Link to="/staff/purchases" className="text-amber-800 dark:text-amber-300 font-extrabold hover:underline">
            Create Supplier Purchase Order →
          </Link>
        </div>
      </div>

      {/* Grid: Payment Method Bar Chart & Order Channel Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Graph 4: Payment Tender Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Payment Gateway &amp; Tender Reconciliation
              </h3>
              <p className="text-[11px] text-gray-500">Digital UPI, cards, cash counter, and wallet share</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">88.8% Cashless</span>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodsData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={(v) => `₹${v/1000}k`} />
                <YAxis dataKey="method" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                <Tooltip
                  formatter={(val, name, it) => [`₹${val.toLocaleString()} (${it.payload.volume} orders • ${it.payload.percent}%)`, 'Tender Total']}
                  contentStyle={{ borderRadius: '16px', background: '#0F172A', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {paymentMethodsData.map((entry, idx) => (
                    <Cell key={`pay-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Graph 5: Fulfillment Channels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                Order Channel Volume &amp; Fulfillment SLA
              </h3>
              <p className="text-[11px] text-gray-500">Scan &amp; Go self-checkout vs 15-min delivery vs takeaway express</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">3 Channels</span>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fulfillmentChannelsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="channel" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1 shadow-xl">
                          <div className="font-bold text-sm border-b border-slate-700 pb-1">{d.channel}</div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Orders:</span>
                            <span className="font-bold text-emerald-400">{d.orders} orders</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Revenue:</span>
                            <span className="font-bold font-mono">₹{d.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-1 text-[11px]">
                            <span className="text-slate-400">Average Turnaround:</span>
                            <span className="font-bold text-emerald-400">{d.avgTime}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                  {fulfillmentChannelsData.map((e, i) => (
                    <Cell key={`fc-${i}`} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
