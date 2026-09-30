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
  AlertTriangle,
  MessageSquare,
  PhoneCall
} from 'lucide-react';
import { useSupermarket, DEMO_CUSTOMERS } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { soundEffects } from '../../lib/audio';
import { apiUpdateCustomerPhone, apiUpdateCustomerProfile, apiTestTwilioDispatch, apiGetVoiceStatus, apiInitiateTwilioPhoneVerification } from '../../services/api';

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
  const [profileAddress, setProfileAddress] = useState(currentUser?.address || '');

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
  const [smsAlerts, setSmsAlerts] = useState(storeSettings?.smsAlertsEnabled !== false);
  const [voicemailAlerts, setVoicemailAlerts] = useState(storeSettings?.voicemailAlertsEnabled !== false);

  // Budget Preferences
  const [budgetLimit, setBudgetLimit] = useState(storeSettings?.monthlyBudgetLimit || 2500);

  // Current month total spent
  const currentMonthSpent = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const budgetPercent = Math.min(100, Math.round((currentMonthSpent / (budgetLimit || 1)) * 100));

  const [isTestingCall, setIsTestingCall] = useState(false);
  const [testCallResult, setTestCallResult] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState(null);
  const [isVerifyingTwilio, setIsVerifyingTwilio] = useState(false);
  const [verificationResponse, setVerificationResponse] = useState(null);

  React.useEffect(() => {
    apiGetVoiceStatus().then(st => setVoiceStatus(st)).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setProfileName(currentUser.name);
      if (currentUser.email) setProfileEmail(currentUser.email);
      if (currentUser.phone) setProfilePhone(currentUser.phone);
      if (currentUser.address) setProfileAddress(currentUser.address);
      if (Array.isArray(currentUser.savedAddresses) && currentUser.savedAddresses.length > 0) {
        setAddresses(currentUser.savedAddresses);
      }
    }
  }, [currentUser]);

  const cleanPhoneDigits = (profilePhone || '').replace(/[^0-9]/g, '');
  const isPhoneVerifiedOnTwilio = Boolean(
    cleanPhoneDigits.length >= 8 &&
    voiceStatus?.verification?.verifiedNumbers?.some(vn => {
      const cleanVn = vn.replace(/[^0-9]/g, '');
      return cleanVn.endsWith(cleanPhoneDigits.slice(-10));
    })
  );

  const handleRequestTwilioVerification = async () => {
    if (!profilePhone || profilePhone.trim().length < 8) {
      alert('Please enter your mobile phone number first.');
      return;
    }
    setIsVerifyingTwilio(true);
    setVerificationResponse(null);
    try {
      const resp = await apiInitiateTwilioPhoneVerification({
        phoneNumber: profilePhone.trim(),
        friendlyName: profileName || currentUser?.name || 'Customer'
      });
      setVerificationResponse(resp);
      soundEffects.playSuccessChime();
    } catch (err) {
      setVerificationResponse({
        success: false,
        error: err.message || 'Twilio verification request failed.'
      });
      soundEffects.playErrorBuzzer();
    } finally {
      setIsVerifyingTwilio(false);
    }
  };

  const handleRefreshTwilioStatus = async () => {
    try {
      const st = await apiGetVoiceStatus();
      setVoiceStatus(st);
      soundEffects.playSuccessChime();
    } catch (e) {}
  };

  const handleTestVoiceCall = async () => {
    if (!profilePhone || profilePhone.trim().length < 8) {
      alert('Please enter a valid mobile number first.');
      return;
    }
    setIsTestingCall(true);
    setTestCallResult(null);

    // Save profile / phone first so it's registered in MongoDB
    try {
      await apiUpdateCustomerPhone(currentUser?.id, currentUser?.email || profileEmail, profilePhone.trim(), profileName);
    } catch (e) {}

    try {
      const resp = await apiTestTwilioDispatch({ to: profilePhone, type: 'VOICEMAIL' });
      setTestCallResult(resp);
      if (resp.success) {
        soundEffects.playSuccessChime();
      } else {
        soundEffects.playErrorBuzzer();
      }
    } catch (err) {
      setTestCallResult({
        success: false,
        message: err.message || 'Call failed'
      });
      soundEffects.playErrorBuzzer();
    } finally {
      setIsTestingCall(false);
    }
  };

  const syncAddressesToBackend = async (newAddresses, primaryAddr) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      savedAddresses: newAddresses,
      address: primaryAddr || currentUser.address || ''
    };
    loginCustomer(updatedUser);
    try {
      await apiUpdateCustomerProfile({
        id: currentUser?.id,
        userId: currentUser?.id,
        email: currentUser?.email,
        phone: currentUser?.phone,
        address: primaryAddr || currentUser.address || '',
        savedAddresses: newAddresses
      });
    } catch (e) {
      console.warn('Sync address to MongoDB note:', e.message);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const primaryAddr = profileAddress.trim() || addresses.find(a => a.isDefault)?.address || currentUser?.address || '';
    
    // Update default address in list if changed
    let updatedAddresses = [...addresses];
    if (primaryAddr) {
      const existingDefIdx = updatedAddresses.findIndex(a => a.isDefault);
      if (existingDefIdx >= 0) {
        updatedAddresses[existingDefIdx] = { ...updatedAddresses[existingDefIdx], address: primaryAddr };
      } else if (updatedAddresses.length === 0) {
        updatedAddresses = [{ id: 'addr_' + Date.now(), label: 'Home', address: primaryAddr, isDefault: true }];
      }
    }

    const updatedUser = {
      ...currentUser,
      name: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
      address: primaryAddr,
      savedAddresses: updatedAddresses
    };
    loginCustomer(updatedUser);
    setAddresses(updatedAddresses);
    
    // Persist full profile directly to MongoDB backend!
    try {
      await apiUpdateCustomerProfile({
        id: currentUser?.id,
        userId: currentUser?.id,
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        address: primaryAddr,
        savedAddresses: updatedAddresses
      });
    } catch (err) {
      console.warn('Backend profile sync note:', err.message);
    }

    soundEffects.playSuccessChime();
    setSavedSuccessMsg('Profile updated and saved to database successfully!');
    setTimeout(() => setSavedSuccessMsg(''), 3500);
  };

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;

    const isFirst = addresses.length === 0;
    const newAddr = {
      id: 'addr_' + Date.now(),
      label: newLabel || 'Home',
      address: newAddressText.trim(),
      isDefault: isFirst
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);
    setNewAddressText('');
    setShowAddAddress(false);

    syncAddressesToBackend(updated, isFirst ? newAddr.address : undefined);
    soundEffects.playNotificationPing();
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    const newDefault = updated.find(a => a.isDefault)?.address || (updated[0]?.address || '');
    syncAddressesToBackend(updated, newDefault);
  };

  const handleSetDefaultAddress = (id) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    const target = updated.find(a => a.id === id);
    syncAddressesToBackend(updated, target?.address);
    soundEffects.playNotificationPing();
  };

  const handleSaveAudioAndBudget = () => {
    updateStoreSettings({
      soundFxEnabled: soundFx,
      voiceAssistantEnabled: voiceAi,
      smsAlertsEnabled: smsAlerts,
      voicemailAlertsEnabled: voicemailAlerts,
      monthlyBudgetLimit: Number(budgetLimit)
    });
    setSavedSuccessMsg('Notification and Audio preferences saved successfully!');
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

        <button
          type="button"
          onClick={() => {
            if (window.history.state?.idx > 0) {
              navigate(-1);
            } else {
              navigate('/customer', { replace: true });
            }
          }}
          className="inline-flex items-center text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Store
        </button>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Phone Number
                      </label>
                      {voiceStatus?.verification?.isTrial && (
                        isPhoneVerifiedOnTwilio ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Twilio Verified ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Trial Unverified
                          </span>
                        )
                      )}
                    </div>
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      🎁 +50 Pts &amp; Voicemail Deals
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Input 
                      type="tel" 
                      value={profilePhone} 
                      onChange={(e) => setProfilePhone(e.target.value)} 
                      placeholder="+91 98451 23456"
                      required 
                    />
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        Include country code (e.g. <code>+91</code> for India).
                      </p>
                      
                      <div className="flex items-center gap-1.5">
                        {!isPhoneVerifiedOnTwilio && voiceStatus?.verification?.isTrial && (
                          <button
                            type="button"
                            onClick={handleRequestTwilioVerification}
                            disabled={isVerifyingTwilio || !profilePhone}
                            className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg flex items-center gap-1 shadow-xs transition-colors shrink-0"
                            title="Twilio calls your phone and speaks a validation code"
                          >
                            <PhoneCall className={`w-3 h-3 ${isVerifyingTwilio ? 'animate-bounce' : ''}`} />
                            <span>{isVerifyingTwilio ? 'Initiating Call...' : '⚡ Verify Phone'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleTestVoiceCall}
                          disabled={isTestingCall || !profilePhone}
                          className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-1 shadow-xs transition-colors shrink-0"
                        >
                          <PhoneCall className={`w-3 h-3 ${isTestingCall ? 'animate-bounce' : ''}`} />
                          <span>{isTestingCall ? 'Calling Phone...' : '📞 Test Voice Call'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Verification Call Ongoing Display */}
                  {verificationResponse && (
                    <div className={`mt-2.5 p-3.5 rounded-2xl border text-xs animate-in fade-in space-y-2 ${
                      verificationResponse.success 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200' 
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                    }`}>
                      {verificationResponse.success ? (
                        <>
                          <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                            <PhoneCall className="w-4 h-4 animate-bounce" />
                            <span>Twilio is calling your phone right now!</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            Pick up the incoming phone call from Twilio. When the automated voice asks, type this 6-digit code on your phone's dial pad:
                          </p>
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Twilio Validation Code:</span>
                            <span className="text-2xl font-black font-mono tracking-widest text-indigo-600 dark:text-indigo-400">
                              {verificationResponse.validationCode}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-gray-500">Entered the code on your phone?</span>
                            <button
                              type="button"
                              onClick={handleRefreshTwilioStatus}
                              className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                            >
                              Check Verification Status ↻
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Verification Call Failed
                          </div>
                          <p className="text-[11px] mt-1">{verificationResponse.error}</p>
                          <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800/60 flex items-center justify-between">
                            <span className="text-[10px]">Prefer SMS verification instead?</span>
                            <a 
                              href="https://console.twilio.com/develop/phone-numbers/manage/verified" 
                              target="_blank" 
                              rel="noreferrer"
                              className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 underline"
                            >
                              Verify in Twilio Console →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test Call Diagnostic Feedback */}
                  {testCallResult && (
                    <div className={`mt-2.5 p-3 rounded-xl border text-xs space-y-1 animate-in fade-in ${
                      testCallResult.success 
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                        : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5">
                        {testCallResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                        <span>{testCallResult.success ? 'Call Dispatched Successfully!' : 'Telephony Notice'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-95">
                        {testCallResult.message}
                      </p>
                      {testCallResult.diagnostics?.voice?.isUnverifiedTrialNumber && (
                        <div className="pt-2 text-[11px] border-t border-rose-200 dark:border-rose-800/60 space-y-1">
                          <div>
                            <strong>Why call didn't ring:</strong> Your Twilio account is a <em>Free Trial</em>, which blocks calls to numbers that haven't been verified first.
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleRequestTwilioVerification}
                              className="px-2 py-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded shadow-xs"
                            >
                              📞 Verify via Instant Phone Call
                            </button>
                            <span className="text-[10px] text-gray-500">or</span>
                            <a 
                              href="https://console.twilio.com/develop/phone-numbers/manage/verified" 
                              target="_blank" 
                              rel="noreferrer" 
                              className="underline font-bold text-indigo-600 dark:text-indigo-400"
                            >
                              Verify via Twilio Console (SMS OTP) →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {voiceStatus?.verification?.isTrial && (
                    <div className="mt-2.5 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <strong className="flex items-center gap-1 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Twilio Free Trial Active
                        </strong>
                        <a 
                          href="https://console.twilio.com/develop/phone-numbers/manage/verified" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 underline"
                        >
                          Twilio Console →
                        </a>
                      </div>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                        Twilio Trial accounts can only place calls to numbers listed under <em>Verified Caller IDs</em>.
                      </p>
                      {voiceStatus.verification.verifiedNumbers?.length > 0 ? (
                        <div className="pt-1 border-t border-amber-200/80 dark:border-amber-800/50">
                          <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">Currently verified numbers on your account:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {voiceStatus.verification.verifiedNumbers.map((num, idx) => (
                              <span key={idx} className="font-mono text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-bold text-gray-800 dark:text-gray-200">
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-700 dark:text-amber-400">
                          No verified numbers found yet. Add your mobile number to start receiving live calls.
                        </div>
                      )}
                    </div>
                  )}
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Primary Delivery Address
                  </label>
                  <Input 
                    type="text" 
                    value={profileAddress} 
                    onChange={(e) => setProfileAddress(e.target.value)} 
                    placeholder="e.g. Flat 402, Green Meadows Apt, Koramangala 4th Block, Bengaluru"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Used as the default delivery destination for your fast express delivery orders.
                  </p>
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

                {/* SMS Deal Alerts Toggle */}
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">SMS Flash Offers &amp; Coupon Codes</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Receive special grocery discount promo codes and delivery updates via text SMS</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                {/* Voicemail / Automated Voice Alerts Toggle */}
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">Automated Voicemail &amp; Voice Deal Calls</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Receive voice announcements for seasonal bumper deals and out-for-delivery alerts</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={voicemailAlerts}
                    onChange={(e) => setVoicemailAlerts(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveAudioAndBudget}>
                  <Save className="w-4 h-4 mr-2" /> Save Notification &amp; Audio Preferences
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
