import React, { useState } from 'react';
import { X, User, MapPin, Award, Phone, Mail, CheckCircle2, Plus, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSupermarket, DEMO_CUSTOMERS } from '../../context/SupermarketContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNavigate } from 'react-router-dom';

export default function CustomerProfileModal({ isOpen, onClose }) {
  const { currentUser, switchCustomerProfile, logoutCustomer } = useSupermarket();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile'); // profile | addresses | switch
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddressLabel || !newAddressText) return;
    
    // update current user in local state
    const newAddr = {
      id: 'addr_' + Date.now(),
      label: newAddressLabel,
      address: newAddressText,
      isDefault: false
    };

    currentUser.savedAddresses = [...(currentUser.savedAddresses || []), newAddr];
    setNewAddressLabel('');
    setNewAddressText('');
    setShowAddAddress(false);
  };

  const handleLogout = () => {
    logoutCustomer();
    onClose();
    navigate('/customer/login');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face'}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full border-2 border-white/50 object-cover shadow-md"
            />
            <div>
              <h2 className="text-xl font-bold">{currentUser.name}</h2>
              <p className="text-xs text-primary-100 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {currentUser.email}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-xs">
                <Award className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                <span>{currentUser.loyaltyPoints || 450} SmartMart Points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-6 pt-3 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-700 dark:text-primary-400 font-bold'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'addresses'
                ? 'border-primary-600 text-primary-700 dark:text-primary-400 font-bold'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            Saved Addresses ({currentUser.savedAddresses?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('switch')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'switch'
                ? 'border-primary-600 text-primary-700 dark:text-primary-400 font-bold'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            Switch Demo User
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          
          {/* Profile Info Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Name</label>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{currentUser.name}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Primary Mobile Number</label>
                  <div className="font-medium text-gray-800 dark:text-gray-200">{currentUser.phone || '+91 98451 23456'}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Default Delivery Address</label>
                  <div className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{currentUser.address}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nearby Landmark</label>
                  <div className="font-medium text-gray-800 dark:text-gray-200">{currentUser.landmark || 'Opposite Sony World Signal'}</div>
                </div>
              </div>

              {/* Loyalty Reward Card */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 text-white p-2 rounded-lg">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-300">SmartMart Gold Membership</div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400">Earn 5% points on every 15-min delivery order</div>
                  </div>
                </div>
                <div className="text-right font-bold text-amber-900 dark:text-amber-300 text-sm">
                  {currentUser.loyaltyPoints} Pts
                </div>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {currentUser.savedAddresses?.map((addr) => (
                  <div 
                    key={addr.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 flex items-start justify-between text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {addr.label}
                          {addr.isDefault && (
                            <span className="text-[9px] bg-green-100 dark:bg-emerald-950 text-green-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{addr.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!showAddAddress ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs" 
                  onClick={() => setShowAddAddress(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add New Address
                </Button>
              ) : (
                <form onSubmit={handleAddAddress} className="p-3 bg-gray-50 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2.5 text-xs">
                  <div className="font-bold text-gray-900 dark:text-white">Add Delivery Address</div>
                  <Input 
                    placeholder="Label (e.g. Home, Office, Gym)" 
                    value={newAddressLabel} 
                    onChange={e => setNewAddressLabel(e.target.value)}
                    className="text-xs dark:bg-slate-900"
                    required
                  />
                  <Input 
                    placeholder="Full Address & Flat No" 
                    value={newAddressText} 
                    onChange={e => setNewAddressText(e.target.value)}
                    className="text-xs dark:bg-slate-900"
                    required
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddAddress(false)}>Cancel</Button>
                    <Button type="submit" size="sm">Save Address</Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Switch Customer Profile Tab */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Select another pre-configured customer profile to test different loyalty points and addresses:
              </div>
              {DEMO_CUSTOMERS.map((cust) => {
                const isSelected = cust.id === currentUser.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => {
                      switchCustomerProfile(cust.id);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/70 shadow-xs'
                        : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={cust.avatar} alt={cust.name} className="w-10 h-10 rounded-full object-cover border" />
                      <div>
                        <div className="font-bold text-xs text-gray-900 dark:text-white">{cust.name}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">{cust.email}</div>
                        <div className="text-[10px] text-primary-700 dark:text-primary-400 font-semibold mt-0.5">
                          🎁 {cust.loyaltyPoints} Points
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-primary-700 dark:text-primary-300 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-primary-600" /> Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <button
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400 hover:text-red-800 font-bold flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
          
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>

      </div>
    </div>
  );
}
