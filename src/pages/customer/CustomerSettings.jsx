import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Settings, 
  User, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Globe, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Check, 
  Save, 
  RotateCcw, 
  Sparkles, 
  DollarSign, 
  Bell, 
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useSupermarket, DEMO_CUSTOMERS } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { soundEffects } from '../../lib/audio';

export default function CustomerSettings() {
  const navigate = useNavigate();
  const { 
    currentUser, 
    loginCustomer, 
    orders, 
    storeSettings, 
    updateStoreSettings, 
    resetToDefaultData 
  } = useSupermarket();
  
  const { language, setLanguage, t, supportedLanguages, currentLangMeta } = useLanguage();
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  // Local State
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'addresses' | 'audio' | 'budget' | 'privacy'
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // Profile Form
  const [profileName, setProfileName] = useState(currentUser?.name || 'Customer');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || 'user@example.com');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '+91 98451 23456');

  // Address Manager State
  const [addresses, setAddresses] = useState(currentUser?.savedAddresses || [
    { id: 'addr_1', label: 'Home', address: 'Flat 402, Green Meadows Apt, 12th Main, Koramangala 4th Block, Bengaluru', isDefault: true },
    { id: 'addr_2', label: 'Work / Office', address: 'Tower B, 4th Floor, Embassy Golf Links, Domlur, Bengaluru', isDefault: false }
  ]);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Audio & Voice Preferences
  const [soundFx, setSoundFx] = useState(storeSettings?.soundFxEnabled !== false);
  const [voiceAi, setVoiceAi] = useState(storeSettings?.voiceAssistantEnabled !== false);

  // Budget Preferences
  const [budgetLimit, setBudgetLimit] = useState(storeSettings?.monthlyBudgetLimit || 2500);

  // Current month total spent
  const currentMonthSpent = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const budgetPercent = Math.min(100, Math.round((currentMonthSpent / (budgetLimit || 1)) * 100));

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...currentUser,
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      savedAddresses: addresses
    };
    loginCustomer(updatedUser);
    soundEffects.playSuccessChime();
    setSavedSuccessMsg('Profile updated successfully!');
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;

    const newAddr = {
      id: 'addr_' + Date.now(),
      label: newLabel || 'Home',
      address: newAddressText.trim(),
      isDefault: addresses.length === 0
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);
    setNewAddressText('');
    setShowAddAddress(false);

    if (currentUser) {
      currentUser.savedAddresses = updated;
    }
    soundEffects.playNotificationPing();
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    if (currentUser) {
      currentUser.savedAddresses = updated;
    }
  };

  const handleSetDefaultAddress = (id) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    const target = updated.find(a => a.id === id);
    if (currentUser && target) {
      currentUser.address = target.address;
      currentUser.savedAddresses = updated;
    }
    soundEffects.playNotificationPing();
  };

  const handleSaveAudioAndBudget = () => {
    updateStoreSettings({
      soundFxEnabled: soundFx,
      voiceAssistantEnabled: voiceAi,
      monthlyBudgetLimit: Number(budgetLimit)
    });
    setSavedSuccessMsg('Preferences saved successfully!');
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  const handleResetApp = () => {
    if (window.confirm("Are you sure you want to reset all supermarket demo data (cart, active orders, and custom products)?")) {
      resetToDefaultData();
      alert("Application restored to pristine default state.");
      navigate('/customer');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            {t('customer_settings', 'Customer Account & Preferences')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your personal profile, delivery addresses, multi-lingual language, audio feedback, and budget.
          </p>
        </div>

        <Link
          to="/customer"
          className="inline-flex items-center text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Store
        </Link>
      </div>

      {/* Success Notification Alert */}
      {savedSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-bold text-sm">{savedSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar Tabs (4 cols) */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-3 border border-gray-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
              activeTab === 'general' 
                ? 'bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/80 shadow-2xs' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
              activeTab === 'addresses' 
                ? 'bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/80 shadow-2xs' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
              activeTab === 'language' 
                ? 'bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/80 shadow-2xs' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Language & Locale ({currentLangMeta.nativeName})</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
              activeTab === 'audio' 
                ? 'bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/80 shadow-2xs' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Voice & Sound FX</span>
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
              activeTab === 'budget' 
                ? 'bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/80 shadow-2xs' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Grocery Budget Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
              activeTab === 'privacy' 
                ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 shadow-2xs' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {/* Tab Content Panel (8 cols) */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-xs">
          
          {/* TAB 1: Profile & General */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-slate-800">
                <img 
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face'} 
                  alt={currentUser?.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-500 shadow-md"
                />
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">{currentUser?.name || 'Customer'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SmartMart Platinum Member</p>
                  <div className="inline-flex items-center gap-1.5 mt-1 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    <span>⭐ {currentUser?.loyaltyPoints || 450} Loyalty Points Available</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <Input 
                    type="text" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <Input 
                    type="tel" 
                    value={profilePhone} 
                    onChange={(e) => setProfilePhone(e.target.value)} 
                    required 
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <Input 
                    type="email" 
                    value={profileEmail} 
                    onChange={(e) => setProfileEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              {/* Theme Mode Toggle Block */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">Theme & Display Mode</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Switch between sleek light or dark mode</div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-xs font-bold shadow-xs hover:border-primary-500 transition-colors"
                >
                  {isDark ? <Moon className="w-4 h-4 text-yellow-300" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span>{isDark ? 'Dark Mode Active' : 'Light Mode Active'}</span>
                </button>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Saved Delivery Addresses</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose your default delivery location for 15-minute dispatch</p>
                </div>
                <Button size="sm" onClick={() => setShowAddAddress(!showAddAddress)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Address
                </Button>
              </div>

              {/* Add Address Collapsible Form */}
              {showAddAddress && (
                <form onSubmit={handleAddNewAddress} className="p-5 bg-primary-50/60 dark:bg-primary-950/40 rounded-2xl border border-primary-200 dark:border-primary-800 space-y-4 animate-in fade-in duration-150">
                  <div className="font-bold text-sm text-primary-900 dark:text-primary-300">Add New Delivery Location</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Label</label>
                      <select
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                      >
                        <option value="Home">Home 🏠</option>
                        <option value="Work / Office">Work / Office 🏢</option>
                        <option value="Parents House">Parents House 👨‍👩‍👧</option>
                        <option value="Other">Other 📍</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Delivery Address</label>
                      <Input
                        type="text"
                        placeholder="House / Flat No, Street, Landmark, City & PIN..."
                        value={newAddressText}
                        onChange={(e) => setNewAddressText(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddAddress(false)}>Cancel</Button>
                    <Button type="submit" size="sm">Save New Address</Button>
                  </div>
                </form>
              )}

              {/* Address List */}
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div 
                    key={addr.id} 
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                      addr.isDefault 
                        ? 'bg-primary-50/40 dark:bg-primary-950/30 border-primary-300 dark:border-primary-800 shadow-2xs' 
                        : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-primary-600 dark:text-primary-400 mt-0.5">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900 dark:text-white">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-md">{addr.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Language & Localization */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Language & Regional Localization</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Select your preferred language for grocery catalog, AI chatbot, and speech</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      soundEffects.playNotificationPing();
                      setSavedSuccessMsg(`Language switched to ${lang.nativeName}!`);
                      setTimeout(() => setSavedSuccessMsg(''), 2500);
                    }}
                    className={`p-4 rounded-2xl border flex items-center justify-between text-left transition-all group ${
                      language === lang.code 
                        ? 'bg-primary-50 dark:bg-primary-950/70 border-primary-500 ring-2 ring-primary-500/20 shadow-xs' 
                        : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{lang.nativeName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</div>
                      </div>
                    </div>
                    {language === lang.code && (
                      <span className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Audio & Voice AI */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">{t('audio_voice_settings', 'Sound Effects & Voice Assistant')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Configure Web Audio feedback, barcode scanner beeps, and AI speech reader</p>
              </div>

              <div className="space-y-4">
                {/* Sound FX Toggle */}
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 rounded-xl">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">{t('enable_sound_fx', 'Interactive Sound Effects (Beeps & Chimes)')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Plays audio feedback for barcode scans, cart updates, and turnstile gates</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundFx}
                    onChange={(e) => setSoundFx(e.target.checked)}
                    className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                  />
                </div>

                {/* Voice AI Text-to-Speech Toggle */}
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">{t('enable_voice_ai', 'AI Voice Reader (Text-to-Speech)')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Speaks AI assistant responses aloud in your selected language</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceAi}
                    onChange={(e) => setVoiceAi(e.target.checked)}
                    className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveAudioAndBudget}>
                  <Save className="w-4 h-4 mr-2" /> Save Audio Preferences
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: Budget Tracker */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">{t('budget_alerts', 'Monthly Grocery Budget Alerts')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Set a monthly limit to prevent overspending on groceries and track expenses</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-primary-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Spent This Month</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">₹{currentMonthSpent.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monthly Budget Target</div>
                    <div className="text-2xl font-black text-primary-700 dark:text-primary-400 font-mono">₹{budgetLimit}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-gray-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-primary-600'
                      }`}
                      style={{ width: `${budgetPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{budgetPercent}% used</span>
                    <span>₹{Math.max(0, budgetLimit - currentMonthSpent).toFixed(2)} remaining</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Adjust Monthly Budget Target (₹)
                </label>
                <Input
                  type="number"
                  min="500"
                  max="50000"
                  step="100"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveAudioAndBudget}>
                  <Save className="w-4 h-4 mr-2" /> Save Budget Limit
                </Button>
              </div>
            </div>
          )}

          {/* TAB 6: Reset Data */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-extrabold text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone & Data Reset
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Restore default demo dataset and clean all browser caches</p>
              </div>

              <div className="p-5 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/60 space-y-3">
                <div className="font-bold text-sm text-red-900 dark:text-red-300">Restore Factory Demo Dataset</div>
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                  This will reset all 35 products to their original high-resolution catalog, flush demo cart items, reset orders, and restore initial store configurations.
                </p>
                <button
                  type="button"
                  onClick={handleResetApp}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Demo Data to Factory State</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
