import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { AvailabilityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProductImage } from '../../components/ui/ProductImage';
import { 
  MapPin, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Check, 
  Truck, 
  Package, 
  Navigation, 
  ShoppingBag
} from 'lucide-react';
import StoreAisleMapModal from '../../components/customer/StoreAisleMapModal';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { products, shoppingList, addToShoppingList } = useSupermarket();
  
  const [qty, setQty] = useState(1);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const product = products.find(p => p.id === id);
  const isInList = shoppingList.some(item => item.id === id);

  if (!product) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md mx-auto border border-gray-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">The requested product could not be located in our inventory.</p>
        <Button onClick={() => navigate('/customer/products')}>Back to Catalog</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToShoppingList(product, qty);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Products
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
        
        {/* Product Image Stage */}
        <div className="md:w-1/2 bg-gray-50 dark:bg-slate-800 p-8 flex flex-col items-center justify-center relative min-h-[420px] border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-700">
          <ProductImage 
            src={product.image} 
            alt={product.name}
            category={product.category}
            productName={product.name}
            barcode={product.barcode}
            className="w-full max-h-[340px] object-contain rounded-2xl shadow-xs" 
          />
          <div className="absolute top-4 left-4">
            <AvailabilityBadge stock={product.stock} reorderLevel={product.reorderLevel} className="text-xs px-3 py-1 font-bold shadow-xs" />
          </div>
        </div>

        {/* Product Info & Fulfillment Controls */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between space-y-6">
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider bg-primary-50 dark:bg-primary-950/70 px-2.5 py-1 rounded-md border border-transparent dark:border-primary-800">
                {product.category}
              </span>
              <span className="text-xs font-mono text-gray-400">Code: {product.productCode}</span>
            </div>

            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              {product.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand} • {product.unit}</p>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-4xl font-black text-gray-900 dark:text-white font-mono">₹{product.price}</span>
              <span className="text-xs text-gray-400">Inclusive of all taxes</span>
            </div>

            {/* In-Store Location Box */}
            <div className="mt-6 p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" /> In-Store Shelf Placement
                </span>
                <button
                  onClick={() => setMapModalOpen(true)}
                  className="text-[11px] font-black text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> View Aisle Map →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800/60 shadow-xs">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Aisle Number</div>
                  <div className="text-xl font-black text-blue-900 dark:text-blue-300">Aisle {product.aisle}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800/60 shadow-xs">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Shelf Number</div>
                  <div className="text-xl font-black text-blue-900 dark:text-blue-300">Shelf {product.shelf}</div>
                </div>
              </div>
            </div>

            {/* Delivery & Takeaway Badges */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">⚡ 15-Min Delivery Ready</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">🛍️ Locker Pickup Ready</span>
              </div>
            </div>

          </div>

          {/* Bottom Controls */}
          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 space-y-4">
            
            {/* Quantity Stepper */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('qty', 'Quantity')}:</span>
              <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 p-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-xs hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-gray-900 dark:text-white">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-xs hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 h-12 text-base font-extrabold shadow-md shadow-primary-600/20" 
                onClick={handleAddToCart}
              >
                <Plus className="w-4 h-4 mr-1.5" /> {t('add_to_cart', 'Add')} {qty > 1 ? `${qty} Items` : ''} • ₹{(product.price * qty).toFixed(2)}
              </Button>
              
              <Button 
                variant="outline" 
                className="h-12 text-sm font-bold border-gray-200 dark:border-slate-700" 
                onClick={() => navigate('/customer/list')}
              >
                <ShoppingBag className="w-4 h-4 mr-1.5" /> {t('view_cart', 'View Cart')}
              </Button>
            </div>

          </div>

        </div>

      </div>

      {/* Store Aisle Map Modal */}
      <StoreAisleMapModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        selectedProduct={product}
      />

    </div>
  );
}
