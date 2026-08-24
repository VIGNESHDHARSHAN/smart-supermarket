import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Settings, 
  Store, 
  DollarSign, 
  Truck, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Volume2, 
  Activity, 
  ArrowLeft,
  Lock,
  Layers
} from 'lucide-react';
import { useSupermarket } from '../../context/SupermarketContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { soundEffects } from '../../lib/audio';

export default function StaffSettings() {
  const navigate = useNavigate();
  const { 
    storeSettings, 
    updateStoreSettings, 
    resetToDefaultData,
    isSimulating,
    setIsSimulating
  } = useSupermarket();

  const [savedMsg, setSavedMsg] = useState('');

  // Store Form State
  const [storeName, setStoreName] = useState(storeSettings?.storeName || 'SmartMart Express Supermarket');
  const [storeAddress, setStoreAddress] = useState(storeSettings?.storeAddress || '100ft Road, Indiranagar, Bengaluru - 560038');
  const [storePhone, setStorePhone] = useState(storeSettings?.storePhone || '+91 80 4912 3456');

  // Tax & Delivery State
  const [taxRate, setTaxRate] = useState(storeSettings?.taxRate || 5);
  const [freeThreshold, setFreeThreshold] = useState(storeSettings?.freeDeliveryThreshold || 299);
  const [expressFee, setExpressFee] = useState(storeSettings?.expressDeliveryFee || 25);
  const [standardFee, setStandardFee] = useState(storeSettings?.standardDeliveryFee || 15);

  // Security Gate Hardware
  const [gateTimeout, setGateTimeout] = useState(storeSettings?.gateTimeoutSeconds || 7);

  const handleSaveStoreConfig = (e) => {
    e.preventDefault();
    updateStoreSettings({
      storeName,
      storeAddress,
      storePhone,
      taxRate: Number(taxRate),
      freeDeliveryThreshold: Number(freeThreshold),
      expressDeliveryFee: Number(expressFee),
      standardDeliveryFee: Number(standardFee),
      gateTimeoutSeconds: Number(gateTimeout)
    });
    soundEffects.playSuccessChime();
    setSavedMsg('Store configuration saved successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleFactoryReset = () => {
    if (window.confirm("Restore entire supermarket system to factory demo default state?")) {
      resetToDefaultData();
      alert("System restored to factory default.");
      navigate('/staff/dashboard');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Store Management & Hardware Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure supermarket details, tax computation, delivery fees, turnstile security, and order dispatch engine.
          </p>
        </div>

        <Link
          to="/staff/dashboard"
          className="inline-flex items-center text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard
        </Link>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-bold text-sm">{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveStoreConfig} className="space-y-6">
        
        {/* Card 1: Store Identification */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-slate-800">
            <Store className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-extrabold text-base text-gray-900 dark:text-white">Store Identity & Location</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Store Name (Printed on Invoices & Receipts)
              </label>
              <Input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Support Helpline / Contact
              </label>
              <Input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Store Physical Address
              </label>
              <Input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Card 2: Taxes & Delivery Pricing */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-slate-800">
            <DollarSign className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-extrabold text-base text-gray-900 dark:text-white">Taxes & Delivery Fee Rules</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                GST / VAT Tax Rate (%)
              </label>
              <Input
                type="number"
                min="0"
                max="28"
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Free Delivery Minimum (₹)
              </label>
              <Input
                type="number"
                min="0"
                step="10"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                15-Min Express Delivery Fee (₹)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={expressFee}
                onChange={(e) => setExpressFee(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Standard Delivery Fee (₹)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={standardFee}
                onChange={(e) => setStandardFee(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Card 3: Turnstile Gate Security Hardware */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-extrabold text-base text-gray-900 dark:text-white">Smart Turnstile Gate & Security Hardware</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Gate Auto-Lock Duration (Seconds)
              </label>
              <Input
                type="number"
                min="3"
                max="30"
                value={gateTimeout}
                onChange={(e) => setGateTimeout(e.target.value)}
                required
              />
              <p className="text-[11px] text-gray-500 mt-1">Time until optical turnstile gate automatically relocks after customer scan</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-white">Live Background Simulator</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Simulates real-time rider progression & incoming customer orders</div>
              </div>
              <input
                type="checkbox"
                checked={isSimulating}
                onChange={(e) => setIsSimulating(e.target.checked)}
                className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleFactoryReset}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-2xl text-xs font-bold border border-red-200 dark:border-red-800 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Factory Reset Demo Data</span>
          </button>

          <Button type="submit" className="h-12 px-6 text-sm font-bold flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>Save Store Configuration</span>
          </Button>
        </div>

      </form>

    </div>
  );
}
