import React from 'react';
import { X, MapPin, Navigation, Info, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';

export default function StoreAisleMapModal({ isOpen, onClose, selectedProduct, highlightedAisle = null }) {
  if (!isOpen) return null;

  const targetAisle = selectedProduct ? selectedProduct.aisle : highlightedAisle;

  const aisles = [
    { number: 1, name: 'Rice, Atta & Grains', category: 'Groceries', color: 'from-amber-500 to-amber-600', icon: '🌾' },
    { number: 2, name: 'Snacks & Noodles', category: 'Groceries', color: 'from-orange-500 to-orange-600', icon: '🍜' },
    { number: 3, name: 'Household & Cleaning', category: 'Household', color: 'from-emerald-500 to-emerald-600', icon: '🧼' },
    { number: 4, name: 'Personal Care & Beauty', category: 'Personal Care', color: 'from-pink-500 to-pink-600', icon: '🧴' },
    { number: 5, name: 'Beverages & Juices', category: 'Beverages', color: 'from-cyan-500 to-cyan-600', icon: '🧃' },
    { number: 6, name: 'Dairy & Cold Storage', category: 'Dairy', color: 'from-blue-500 to-blue-600', icon: '🥛' },
    { number: 7, name: 'Fresh Vegetables', category: 'Vegetables', color: 'from-green-500 to-green-600', icon: '🥦' },
    { number: 8, name: 'Fresh Fruits', category: 'Fruits', color: 'from-red-500 to-red-600', icon: '🍎' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-charcoal-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-charcoal-800 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 p-2.5 rounded-xl text-white shadow-md">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold">SmartMart In-Store Map & Aisle Navigator</h2>
              <p className="text-xs text-gray-300">Live 2D Interactive Store Layout & Product Locator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-charcoal-800 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Highlight Banner if product selected */}
        {selectedProduct && (
          <div className="bg-primary-50 dark:bg-primary-950/60 border-b border-primary-100 dark:border-primary-900 p-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-12 h-12 object-cover bg-white dark:bg-slate-800 rounded-lg p-1 border border-primary-200 dark:border-primary-800" />
              <div>
                <div className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider">Locating Product</div>
                <div className="font-semibold text-gray-900 dark:text-white">{selectedProduct.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{selectedProduct.brand} • ₹{selectedProduct.price}</div>
              </div>
            </div>
            <div className="text-right bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-xs border border-primary-200 dark:border-primary-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Location</div>
              <div className="text-lg font-black text-primary-700 dark:text-primary-300">Aisle {selectedProduct.aisle} • Shelf {selectedProduct.shelf}</div>
            </div>
          </div>
        )}

        {/* 2D Interactive Map Grid */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950">
          
          {/* Store Entrance & Turnstile */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 px-6 rounded-xl border border-gray-200 dark:border-slate-800 mb-6 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">🚪 Main Store Entrance</span>
            </div>
            <div className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
              ⚡ Smart Turnstile Gate (Scan & Go Exit)
            </div>
          </div>

          {/* Aisles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {aisles.map((aisle) => {
              const isTarget = targetAisle === aisle.number;
              
              return (
                <div
                  key={aisle.number}
                  className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-36 ${
                    isTarget
                      ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-950/80 shadow-lg ring-4 ring-primary-500/20 scale-105 z-10'
                      : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-md'
                  }`}
                >
                  {isTarget && (
                    <span className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-bounce flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> HERE
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white bg-gradient-to-br ${aisle.color} shadow-xs`}>
                      {aisle.number}
                    </span>
                    <span className="text-2xl">{aisle.icon}</span>
                  </div>

                  <div>
                    <div className="text-xs font-extrabold text-gray-900 dark:text-white leading-tight">
                      {aisle.name}
                    </div>
                    <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase mt-0.5">
                      {aisle.category}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Store Checkout Counters Footer */}
          <div className="mt-6 flex justify-between items-center bg-white dark:bg-slate-900 p-3 px-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xs text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1 font-semibold">
              🛍️ Express Pickup Lockers (Aisle 1 Corner)
            </span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              💳 Cashier POS Billing Desks (Front Counter 01 - 04)
            </span>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-end">
          <Button onClick={onClose} className="text-xs font-bold px-6">
            Close Map
          </Button>
        </div>

      </div>
    </div>
  );
}
