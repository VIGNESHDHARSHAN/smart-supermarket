import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { AvailabilityBadge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ProductImage } from '../../components/ui/ProductImage';
import { Search, Filter, MapPin, Plus, Check, ShoppingBag } from 'lucide-react';
import StoreAisleMapModal from '../../components/customer/StoreAisleMapModal';

export default function ProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { products, addToShoppingList, shoppingList } = useSupermarket();
  
  const query = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';
  
  const [localQuery, setLocalQuery] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [mapModalProduct, setMapModalProduct] = useState(null);

  useEffect(() => {
    setLocalQuery(query);
    setSelectedCategory(categoryFilter);
  }, [query, categoryFilter]);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (localQuery) params.set('q', localQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    setSearchParams(params);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(query.toLowerCase()) || 
                          p.brand.toLowerCase().includes(query.toLowerCase()) ||
                          p.barcode === query ||
                          p.productCode.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Filter className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Filters</span>
            {(categoryFilter || query) && (
              <button 
                onClick={() => { setSearchParams({}); setLocalQuery(''); setSelectedCategory(''); }}
                className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline font-bold"
              >
                Clear
              </button>
            )}
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-2">Category</label>
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value) {
                    params.set('category', e.target.value);
                  } else {
                    params.delete('category');
                  }
                  setSearchParams(params);
                }}
                className="w-full border-gray-300 dark:border-slate-700 rounded-xl shadow-xs p-2 font-medium bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
              >
                <option value="">{t('all_categories', 'All Categories')} ({products.length})</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c} ({products.filter(p => p.category === c).length})</option>
                ))}
              </select>
            </div>

            {/* Quick Category Buttons */}
            <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-slate-800">
              {categories.map(c => {
                const isSelected = selectedCategory === c;
                return (
                  <button
                    key={c}
                    onClick={() => {
                      const newCat = isSelected ? '' : c;
                      setSelectedCategory(newCat);
                      const params = new URLSearchParams(searchParams);
                      if (newCat) params.set('category', newCat);
                      else params.delete('category');
                      setSearchParams(params);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                      isSelected 
                        ? 'bg-primary-50 dark:bg-primary-950/70 text-primary-800 dark:text-primary-300 font-bold' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{c}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                      {products.filter(p => p.category === c).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog */}
      <div className="flex-1 space-y-6">
        
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative">
          <Input 
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={t('search_placeholder', 'Search by product name, brand, barcode (e.g. 890100000001)...')}
            className="h-14 pl-12 pr-28 text-base rounded-2xl shadow-xs border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Button type="submit" size="sm" className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-xs h-9">
            Search
          </Button>
        </form>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div>
            Showing <span className="font-extrabold text-gray-900 dark:text-white">{filteredProducts.length}</span> items
            {query && <span> for "<strong className="text-gray-900 dark:text-white">{query}</strong>"</span>}
            {categoryFilter && <span> in <strong className="text-primary-700 dark:text-primary-400">{categoryFilter}</strong></span>}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => {
              const inCart = shoppingList.some(item => item.id === product.id);

              return (
                <div 
                  key={product.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Image */}
                    <div className="aspect-[4/3] bg-gray-50 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center p-2">
                      <ProductImage 
                        src={product.image} 
                        alt={product.name}
                        category={product.category}
                        productName={product.name}
                        barcode={product.barcode}
                        onClick={() => navigate(`/customer/products/${product.id}`)}
                        className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300 cursor-pointer" 
                      />
                      <div className="absolute top-3 right-3">
                        <AvailabilityBadge stock={product.stock} reorderLevel={product.reorderLevel} />
                      </div>

                      {/* Map Locator Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMapModalProduct(product);
                        }}
                        className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs hover:bg-white dark:hover:bg-slate-900 text-gray-700 dark:text-gray-200 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 shadow-2xs flex items-center gap-1 transition-colors"
                        title="Locate on store map"
                      >
                        <MapPin className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                        {t('aisle', 'Aisle')} {product.aisle}, {t('shelf', 'Shelf')} {product.shelf}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
                        {product.category}
                      </div>
                      <h3 
                        onClick={() => navigate(`/customer/products/${product.id}`)}
                        className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 min-h-[40px] hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors"
                      >
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.brand} • {product.unit}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 mt-3 pt-3">
                    <span className="font-extrabold text-lg text-gray-900 dark:text-white">₹{product.price}</span>

                    <Button
                      size="sm"
                      variant={inCart ? "outline" : "default"}
                      className={inCart ? "text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/60 text-xs" : "text-xs font-bold"}
                      onClick={() => addToShoppingList(product, 1)}
                    >
                      {inCart ? (
                        <span className="flex items-center gap-1">✓ In List</span>
                      ) : (
                        <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {t('add_to_cart', 'Add')}</span>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 border-dashed p-8">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">No products found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">We couldn't find anything matching your search criteria.</p>
            <Button onClick={() => { setSearchParams({}); setLocalQuery(''); setSelectedCategory(''); }}>
              {t('clear_all', 'Clear All Filters')}
            </Button>
          </div>
        )}

      </div>

      {/* Aisle Map Modal */}
      <StoreAisleMapModal
        isOpen={!!mapModalProduct}
        onClose={() => setMapModalProduct(null)}
        selectedProduct={mapModalProduct}
      />

    </div>
  );
}
