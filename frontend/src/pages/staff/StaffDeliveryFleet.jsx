import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Trash2, 
  Power, 
  Star, 
  TrendingUp, 
  Package, 
  Clock, 
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSupermarket } from '../../context/SupermarketContext';

export default function StaffDeliveryFleet() {
  const navigate = useNavigate();
  const { 
    deliveryPartners, 
    addDeliveryPartner, 
    updateDeliveryPartnerStatus, 
    deleteDeliveryPartner, 
    orders,
    loginDeliveryPartner,
    storeSettings,
    isManager,
    currentStaff
  } = useSupermarket();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('1234');
  const [vehicleType, setVehicleType] = useState('Electric Scooter');
  const [vehicleNo, setVehicleNo] = useState('');
  const [shift, setShift] = useState('Morning (07:00 - 15:00)');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Metrics
  const totalFleet = deliveryPartners.length;
  const availableRiders = deliveryPartners.filter(p => p.status === 'AVAILABLE').length;
  const onDeliveryRiders = deliveryPartners.filter(p => p.status === 'ON_DELIVERY').length;
  const offlineRiders = deliveryPartners.filter(p => p.status === 'OFFLINE').length;

  const totalDeliveredToday = orders.filter(o => o.type === 'DELIVERY' && o.status === 'DELIVERED').length;

  // Filtered partners
  const filteredPartners = deliveryPartners.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.vehicleNo?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    if (!isManager) {
      alert('Permission Denied: Only Store Manager can onboard new delivery personnel.');
      return;
    }
    setName('');
    setPhone('');
    setEmail('');
    setPassword('1234');
    setVehicleType('Electric Scooter');
    setVehicleNo('');
    setShift('Morning (07:00 - 15:00)');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isManager) {
      setFormError('Permission denied: Only Store Manager can onboard delivery partners.');
      return;
    }

    if (!name.trim()) {
      setFormError('Please enter the delivery person’s full name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter a valid contact phone number.');
      return;
    }
    if (!vehicleNo.trim()) {
      setFormError('Please enter the vehicle registration plate number (e.g. KA 01 AB 1234).');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDeliveryPartner({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: password.trim(),
        vehicleType,
        vehicleNo: vehicleNo.trim().toUpperCase(),
        shift
      });
      setIsSubmitting(false);
      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to add delivery person.');
      setIsSubmitting(false);
    }
  };

  const handleTestLogin = (partner) => {
    loginDeliveryPartner(partner);
    navigate('/delivery/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Bike className="w-6 h-6" />
            </span>
            Delivery Fleet & Personnel
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Store Operations Fleet • Register New Delivery Executives & Monitor Auto-Allocation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManager ? (
            <Button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-md cursor-pointer flex items-center gap-2 rounded-xl text-xs px-4 py-2.5"
            >
              <UserPlus className="w-4 h-4" /> Add Delivery Person
            </Button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-xl text-xs font-semibold border border-gray-200 dark:border-slate-700">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>Manager Privileges Required to Onboard</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Privilege Banner */}
      {isManager ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Store General Manager Authority Active</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Manager Access
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Logged in as <strong>{currentStaff?.name || 'Store Manager'}</strong>. You are authorized to onboard new riders, update shifts, and allocate orders.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
            Fleet Control: ON
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Working Staff Terminal Mode (Fleet Monitor)</span>
                <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Working Staff
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Viewing live delivery fleet availability. Per store policy, only <strong>Store Manager</strong> can register new delivery personnel.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/manager/login')}
            className="text-xs font-bold text-amber-500 hover:text-amber-600 underline flex items-center gap-1"
          >
            <span>Manager Login</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Real-time Fleet Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Fleet</span>
            <Bike className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">{totalFleet}</div>
          <div className="text-[11px] text-gray-500 mt-1">Registered delivery partners</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Available</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{availableRiders}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Ready for automatic assignment</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">On Delivery</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">{onDeliveryRiders}</div>
          <div className="text-[11px] text-blue-600/80 mt-1">Currently fulfilling customer orders</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Completed Today</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{totalDeliveredToday}</div>
          <div className="text-[11px] text-amber-600/80 mt-1">Online doorstep deliveries</div>
        </div>
      </div>

      {/* Auto-Allocation Status Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3 text-xs">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-amber-900 dark:text-amber-200">
          <span className="font-bold">Automatic Allocation Active: </span>
          When any customer places a home delivery order, the supermarket system automatically selects an available rider from this list based on shift and least active deliveries.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by rider name, vehicle or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'AVAILABLE', 'ON_DELIVERY', 'OFFLINE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'ALL' ? 'All Partners' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Partners Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartners.map((partner) => {
          const isBusy = partner.status === 'ON_DELIVERY';
          const isOffline = partner.status === 'OFFLINE';

          return (
            <div
              key={partner.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              {/* Partner Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={partner.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'}
                    alt={partner.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-400"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      {partner.name}
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                      {partner.phone}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    partner.status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                      : partner.status === 'ON_DELIVERY'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700'
                  }`}
                >
                  {partner.status.replace('_', ' ')}
                </span>
              </div>

              {/* Details & Specs */}
              <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Vehicle:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{partner.vehicleType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Plate Number:</span>
                  <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">{partner.vehicleNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Shift:</span>
                  <span className="text-gray-700 dark:text-gray-300">{partner.shift}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Login PIN:</span>
                  <span className="font-mono text-gray-500">{partner.password || '1234'}</span>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{partner.rating || 5.0}</span>
                </div>
                <div className="text-gray-500 font-medium">
                  {partner.completedTrips || 0} lifetime deliveries
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => updateDeliveryPartnerStatus(partner.id, isOffline ? 'AVAILABLE' : 'OFFLINE')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    isOffline
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-gray-300'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {isOffline ? 'Make Online' : 'Set Offline'}
                </button>

                <button
                  type="button"
                  onClick={() => handleTestLogin(partner)}
                  className="py-1.5 px-3 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  title="Log in directly as this delivery executive"
                >
                  <ExternalLink className="w-3 h-3" />
                  Test Portal
                </button>
              </div>

              {isManager && deliveryPartners.length > 1 && (
                <div className="text-right">
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove delivery partner "${partner.name}"?`)) {
                        deleteDeliveryPartner(partner.id);
                      }
                    }}
                    className="text-[11px] text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Remove Partner
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredPartners.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800">
          <Bike className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No delivery personnel found</h3>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your search criteria or register a new delivery person.</p>
        </div>
      )}

      {/* Add Delivery Person Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                    Add New Delivery Person
                  </h3>
                  <p className="text-xs text-gray-500">
                    Register a new driver/rider for automated doorstep order allocation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Login Password / PIN
                  </label>
                  <input
                    type="text"
                    placeholder="1234"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="ramesh@smartmart.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Electric Scooter">Electric Scooter (EV)</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Van">Delivery Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Vehicle Registration Plate *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="KA 05 MN 4821"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Shift Timing
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                  <option value="Afternoon (14:00 - 22:00)">Afternoon (14:00 - 22:00)</option>
                  <option value="Full Day (09:00 - 18:00)">Full Day (09:00 - 18:00)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Save & Register Person'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
