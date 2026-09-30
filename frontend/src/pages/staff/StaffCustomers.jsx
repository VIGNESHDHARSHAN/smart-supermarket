import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Award, 
  ShoppingBag, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  PhoneCall, 
  MessageSquare, 
  Bell, 
  Plus, 
  Edit3, 
  Download, 
  RefreshCw, 
  Smartphone, 
  ArrowUpDown, 
  X, 
  ExternalLink,
  Gift,
  Check,
  UserCheck,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  apiGetRegisteredCustomers, 
  apiUpdateCustomerRecord,
  apiGetOfferCampaigns,
  apiGetVoiceStatus
} from '../../services/api';
import { soundEffects } from '../../lib/audio';
import OfferAlertModal from '../../components/voice/OfferAlertModal';
import NotifyUnregisteredModal from '../../components/voice/NotifyUnregisteredModal';
import MassBroadcastModal from '../../components/voice/MassBroadcastModal';

export default function StaffCustomers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    phoneRegisteredCount: 0,
    missingPhoneCount: 0,
    totalLoyaltyPoints: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PHONE_ONLY' | 'MISSING_PHONE' | 'VIP'
  const [sortBy, setSortBy] = useState('LATEST'); // 'LATEST' | 'POINTS' | 'SPEND' | 'NAME'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedCustomerForOutreach, setSelectedCustomerForOutreach] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showMassBroadcastModal, setShowMassBroadcastModal] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [voiceStatus, setVoiceStatus] = useState(null);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPoints, setEditPoints] = useState(100);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [res, camps, vStatus] = await Promise.all([
        apiGetRegisteredCustomers(),
        apiGetOfferCampaigns(),
        apiGetVoiceStatus().catch(() => null)
      ]);
      if (res?.customers) {
        setCustomers(res.customers);
      }
      if (res?.stats) {
        setStats(res.stats);
      }
      if (camps) setCampaigns(camps);
      if (vStatus) setVoiceStatus(vStatus);
    } catch (err) {
      console.warn('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered and Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (activeFilter === 'PHONE_ONLY') return c.phoneRegistered;
      if (activeFilter === 'MISSING_PHONE') return !c.phoneRegistered;
      if (activeFilter === 'VIP') return (c.loyaltyPoints >= 300 || (c.totalSpend && c.totalSpend > 2500));

      return true;
    }).sort((a, b) => {
      if (sortBy === 'POINTS') return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
      if (sortBy === 'SPEND') return (b.totalSpend || 0) - (a.totalSpend || 0);
      if (sortBy === 'NAME') return (a.name || '').localeCompare(b.name || '');
      // Default: Latest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [customers, searchTerm, activeFilter, sortBy]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Open Edit Modal
  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name || '');
    setEditEmail(customer.email || '');
    setEditPhone(customer.phone || '');
    setEditAddress(customer.address || '');
    setEditPoints(customer.loyaltyPoints || 100);
  };

  // Save Edit Customer Record
  const handleSaveCustomerEdit = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSavingEdit(true);
    try {
      const updates = {
        name: editName.trim(),
        email: editEmail.toLowerCase().trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        loyaltyPoints: Number(editPoints)
      };

      const res = await apiUpdateCustomerRecord(editingCustomer.id, updates);
      const updatedCust = res?.customer || { ...editingCustomer, ...updates };

      // Update local state immediately
      setCustomers(prev => prev.map(c => {
        if (c.id === editingCustomer.id) {
          const hasPhone = updates.phone.length >= 8 && !updates.phone.includes('00000');
          return {
            ...c,
            ...updatedCust,
            name: updates.name || c.name,
            email: updates.email || c.email,
            phone: updates.phone,
            address: updates.address,
            phoneRegistered: hasPhone,
            loyaltyPoints: Number(editPoints)
          };
        }
        return c;
      }));

      soundEffects.playSuccessChime();
      setEditingCustomer(null);
    } catch (err) {
      alert('Error updating customer: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Customer ID', 'Full Name', 'Email', 'Phone', 'Phone Registered', 'Loyalty Points', 'Orders Count', 'Total Spent (INR)', 'Source'];
    const rows = filteredCustomers.map(c => [
      c.id,
      `"${c.name}"`,
      c.email,
      c.phone ? `"${c.phone}"` : 'Missing',
      c.phoneRegistered ? 'YES' : 'NO',
      c.loyaltyPoints || 0,
      c.ordersCount || 0,
      c.totalSpend || 0,
      `"${c.source || 'Registered'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartMart_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const missingUsersList = useMemo(() => {
    return customers.filter(c => !c.phoneRegistered);
  }, [customers]);

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-7 h-7 text-primary-600" />
              Registered Customers Directory
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
              Manager CRM Portal
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            View all registered shoppers, track mobile phone onboarding, manage loyalty points, and dispatch automated Voicemail &amp; SMS alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setShowNotifyModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md flex items-center gap-1.5"
          >
            <Bell className="w-4 h-4 text-amber-300" /> Notify Missing Phones ({stats.missingPhoneCount || 0})
          </Button>

          <Button
            size="sm"
            onClick={() => setShowMassBroadcastModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5"
          >
            <PhoneCall className="w-4 h-4" /> Blast Voice / SMS
          </Button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Customers</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
              {stats.totalCustomers || customers.length}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Active supermarket shoppers</div>
          </div>
        </div>

        {/* Ready Mobile Numbers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-emerald-200 dark:border-emerald-800/40 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Phone Registered</div>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono mt-0.5">
              {stats.phoneRegisteredCount || customers.filter(c => c.phoneRegistered).length}
            </div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">Ready for Voicemail &amp; SMS</div>
          </div>
        </div>

        {/* Missing Phone Numbers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-amber-200 dark:border-amber-800/40 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Missing Phone</div>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono mt-0.5">
              {stats.missingPhoneCount || customers.filter(c => !c.phoneRegistered).length}
            </div>
            <div className="text-[10px] text-amber-600/80 mt-0.5">In-app prompt targeted</div>
          </div>
        </div>

        {/* Total Loyalty Points */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-purple-200 dark:border-purple-800/40 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Points Circulating</div>
            <div className="text-2xl font-black text-purple-900 dark:text-purple-200 font-mono mt-0.5">
              {(stats.totalLoyaltyPoints || customers.reduce((s, c) => s + (c.loyaltyPoints || 0), 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-600/80 mt-0.5">Active SmartPoints</div>
          </div>
        </div>

        {/* Lifetime Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-primary-50 dark:bg-primary-950 text-primary-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Spend</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
              ₹{(stats.totalRevenue || customers.reduce((s, c) => s + (c.totalSpend || 0), 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Lifetime orders spend</div>
          </div>
        </div>

      </div>

      {/* Twilio Free Trial Notice Banner */}
      {voiceStatus?.verification?.isTrial && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Twilio Free Trial Active: Phone calls and SMS can ONLY connect to verified phone numbers.
              </span>
              <p className="text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                On Twilio trial accounts, outbound calls to unverified numbers are blocked by Twilio. To test calls with any customer's mobile number, add it under Verified Caller IDs in your Twilio Console.
              </p>
              {voiceStatus.verification.verifiedNumbers?.length > 0 && (
                <p className="mt-1 font-mono text-[11px] text-amber-800 dark:text-amber-300">
                  Verified in Twilio: <strong>{voiceStatus.verification.verifiedNumbers.join(', ')}</strong>
                </p>
              )}
            </div>
          </div>
          <a
            href="https://console.twilio.com/develop/phone-numbers/manage/verified"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <span>Verify Numbers</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-xs rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'ALL', label: `All (${customers.length})` },
            { id: 'PHONE_ONLY', label: `📱 Phone Verified (${customers.filter(c => c.phoneRegistered).length})` },
            { id: 'MISSING_PHONE', label: `⚠️ Missing Phone (${customers.filter(c => !c.phoneRegistered).length})` },
            { id: 'VIP', label: '⭐ VIP / Top Shoppers' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort & View Mode Toggle */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 rounded-xl text-xs font-bold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200"
          >
            <option value="LATEST">Sort: Newest First</option>
            <option value="POINTS">Sort: Highest Loyalty Points</option>
            <option value="SPEND">Sort: Highest Total Spend</option>
            <option value="NAME">Sort: Customer Name (A-Z)</option>
          </select>

          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-2xs text-primary-600' : 'text-gray-400'}`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-2xs text-primary-600' : 'text-gray-400'}`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Customer Directory Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 uppercase font-black tracking-wider text-gray-400 text-[10px]">
                <tr>
                  <th className="py-4 px-6">Customer Profile</th>
                  <th className="py-4 px-6">Mobile Phone Number</th>
                  <th className="py-4 px-6">SmartPoints</th>
                  <th className="py-4 px-6">Orders &amp; Spend</th>
                  <th className="py-4 px-6">Registration Source</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="font-bold">No registered customers found matching "{searchTerm}"</p>
                      <button 
                        onClick={() => { setSearchTerm(''); setActiveFilter('ALL'); }}
                        className="text-xs text-primary-600 font-bold mt-2 hover:underline"
                      >
                        Reset Search Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((cust) => (
                    <tr 
                      key={cust.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Customer Profile */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={cust.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cust.name)}`} 
                            alt={cust.name} 
                            className="w-10 h-10 rounded-2xl object-cover border border-gray-200 dark:border-slate-700 bg-gray-100 shrink-0" 
                          />
                          <div>
                            <div className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                              {cust.name}
                              {cust.loyaltyPoints >= 400 && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[170px]">{cust.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="py-4 px-6">
                        {cust.phoneRegistered ? (
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              {cust.phone}
                            </span>
                            <span className="inline-block text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                              Twilio Ready (Voice &amp; SMS)
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-500" /> Not Registered
                            </span>
                            <button
                              onClick={() => handleOpenEdit(cust)}
                              className="block text-[11px] text-primary-600 font-bold hover:underline"
                            >
                              + Add Phone Number
                            </button>
                          </div>
                        )}
                      </td>

                      {/* SmartPoints */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
                            <Award className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-mono font-black text-sm text-gray-900 dark:text-white">
                              {cust.loyaltyPoints || 0} Pts
                            </div>
                            <div className="text-[10px] text-gray-400">
                              ≈ ₹{Math.floor((cust.loyaltyPoints || 0) / 10)} discount
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Orders & Spend */}
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-black text-gray-900 dark:text-white font-mono text-xs">
                            ₹{(cust.totalSpend || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {cust.ordersCount || 0} orders completed
                          </div>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-mono">
                          {cust.source || 'Online Shopper'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {cust.phoneRegistered ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCustomerForOutreach(cust)}
                              className="text-[11px] font-bold h-8 px-2.5 flex items-center gap-1 text-primary-600 border-primary-200 hover:bg-primary-50 dark:border-primary-800"
                              title="Send Voicemail or SMS Offer to this customer"
                            >
                              <PhoneCall className="w-3.5 h-3.5" /> Voice / SMS
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowNotifyModal(true)}
                              className="text-[11px] font-bold h-8 px-2.5 flex items-center gap-1 text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800"
                              title="Prompt customer to register phone"
                            >
                              <Bell className="w-3.5 h-3.5" /> Prompt Mobile
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(cust)}
                            className="text-[11px] font-bold h-8 px-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            title="Edit customer details or loyalty points"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-200 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500">
                    {cust.source || 'Registered'}
                  </span>
                  {cust.phoneRegistered ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Phone Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" /> Phone Missing
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={cust.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cust.name)}`}
                    alt={cust.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-slate-700"
                  />
                  <div>
                    <h3 className="font-black text-base text-gray-900 dark:text-white leading-tight">
                      {cust.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{cust.email}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Mobile Phone:</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                      {cust.phone || <span className="text-amber-500">Not registered</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Loyalty Points:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Award className="w-3 h-3" /> {cust.loyaltyPoints || 0} Pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Lifetime Spend:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      ₹{(cust.totalSpend || 0).toLocaleString()} ({cust.ordersCount || 0} orders)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                {cust.phoneRegistered ? (
                  <Button
                    size="sm"
                    onClick={() => setSelectedCustomerForOutreach(cust)}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs h-9 flex items-center justify-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call / SMS
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setShowNotifyModal(true)}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-9 flex items-center justify-center gap-1"
                  >
                    <Bell className="w-3.5 h-3.5" /> Prompt Phone
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(cust)}
                  className="px-3 h-9 text-xs font-bold"
                  title="Edit customer details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination Toolbar */}
      {filteredCustomers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400 flex-wrap">
            <span>
              Showing <strong className="text-gray-900 dark:text-white">{startIndex + 1}–{Math.min(startIndex + pageSize, filteredCustomers.length)}</strong> of <strong className="text-gray-900 dark:text-white">{filteredCustomers.length}</strong> customers
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-bold outline-hidden cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={9999}>All</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-xl border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs font-bold transition-all"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) => (
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-xs">...</span>
                ) : (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                      safeCurrentPage === p 
                        ? 'bg-primary-600 text-white font-black shadow-xs' 
                        : 'border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                )
              ))}
            </div>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-xl border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs font-bold transition-all"
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-primary-600 to-indigo-700 text-white relative">
              <button
                onClick={() => setEditingCustomer(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <img
                  src={editingCustomer.avatar}
                  alt={editingCustomer.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-white/40"
                />
                <div>
                  <h3 className="text-lg font-black">{editingCustomer.name}</h3>
                  <p className="text-xs text-indigo-100 font-mono">{editingCustomer.email}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveCustomerEdit} className="p-6 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1">
                    Customer Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="h-9 text-xs font-bold rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="customer@domain.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="h-9 text-xs font-mono font-bold rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1">
                  Mobile Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="+91 98451 23456"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-9 text-xs font-mono font-bold rounded-xl"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Enables automated Voicemail deals and delivery tracking SMS.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1">
                  Primary Delivery Address
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Flat 402, Green Meadows Apt, Koramangala, Bengaluru"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1">
                  SmartMart Loyalty Points
                </label>
                <Input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value)}
                  min="0"
                  max="10000"
                  className="h-9 text-xs font-mono font-bold rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCustomer(null)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEdit}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-black text-xs h-9 px-4 rounded-xl shadow-md"
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save Customer Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Customer Outreach Modal (Send Voicemail / SMS) */}
      {selectedCustomerForOutreach && (
        <OfferAlertModal
          isOpen={!!selectedCustomerForOutreach}
          onClose={() => setSelectedCustomerForOutreach(null)}
          offer={campaigns[0] || {
            title: 'Weekend 30% OFF Flash Sale',
            promoCode: 'FRESH30',
            discountPercent: 30,
            category: 'Storewide Essentials'
          }}
          defaultPhone={selectedCustomerForOutreach.phone}
          defaultName={selectedCustomerForOutreach.name}
        />
      )}

      {/* Notify Customers Missing Phone Numbers Modal */}
      {showNotifyModal && (
        <NotifyUnregisteredModal
          isOpen={showNotifyModal}
          onClose={() => setShowNotifyModal(false)}
          missingUsers={missingUsersList}
          onSuccess={loadData}
        />
      )}

      {/* Mass Broadcast to All Registered Customers Modal */}
      {showMassBroadcastModal && (
        <MassBroadcastModal
          isOpen={showMassBroadcastModal}
          onClose={() => setShowMassBroadcastModal(false)}
          campaigns={campaigns}
          onBroadcastSuccess={loadData}
        />
      )}

    </div>
  );
}
