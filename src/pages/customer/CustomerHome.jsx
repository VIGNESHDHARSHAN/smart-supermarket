import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Search, 
  ShoppingBag, 
  MapPin, 
  CheckCircle2, 
  Truck, 
  Package, 
  QrCode, 
  Navigation, 
  Sparkles, 
  Plus, 
  Check,
  Clock,
  ArrowRight,
  Bot,
  Utensils
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AvailabilityBadge } from '../../components/ui/Badge';
import StoreAisleMapModal from '../../components/customer/StoreAisleMapModal';

export default function CustomerHome() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { 
    products, 
    addToShoppingList, 
    shoppingList, 
    popularRecipes, 
    addRecipeToCart 
  } = useSupermarket();
  const [searchQuery, setSearchQuery] = useState('');
  const [mapModalProduct, setMapModalProduct] = useState(null);
  const [addedRecipeId, setAddedRecipeId] = useState(null);


  const categories = [
    { name: 'Groceries', count: products.filter(p => p.category === 'Groceries').length, bg: 'bg-orange-100 dark:bg-orange-950/60', text: 'text-orange-700 dark:text-orange-400', icon: '🌾' },
    { name: 'Vegetables', count: products.filter(p => p.category === 'Vegetables').length, bg: 'bg-green-100 dark:bg-emerald-950/60', text: 'text-green-700 dark:text-emerald-400', icon: '🥦' },
    { name: 'Fruits', count: products.filter(p => p.category === 'Fruits').length, bg: 'bg-red-100 dark:bg-rose-950/60', text: 'text-red-700 dark:text-rose-400', icon: '🍎' },
    { name: 'Dairy', count: products.filter(p => p.category === 'Dairy').length, bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-400', icon: '🥛' },
    { name: 'Beverages', count: products.filter(p => p.category === 'Beverages').length, bg: 'bg-cyan-100 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-400', icon: '🧃' },
    { name: 'Personal Care', count: products.filter(p => p.category === 'Personal Care').length, bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-400', icon: '🧴' },
    { name: 'Household', count: products.filter(p => p.category === 'Household').length, bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-400', icon: '🧼' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-700 dark:from-primary-900 dark:via-slate-900 dark:to-emerald-950 rounded-3xl overflow-hidden shadow-xl text-white relative border border-primary-500/20">
        <div className="px-6 py-12 md:py-16 text-center max-w-4xl mx-auto relative z-10">
          
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
            Real-Time Smart Supermarket Platform
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight leading-tight">
            Fresh Groceries Delivered in <span className="text-yellow-300 underline decoration-yellow-400 decoration-wavy decoration-2">15 Minutes</span>
          </h1>
          <p className="text-base md:text-lg text-primary-100 mb-8 max-w-2xl mx-auto font-medium">
            Order online with live GPS delivery tracking, pick up from express store lockers, or enjoy queue-less in-store Scan & Go checkout.
          </p>
          
          {/* Main Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative mb-8">
            <div className="relative flex items-center w-full h-14 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xl focus-within:ring-4 focus-within:ring-yellow-300/50 transition-all border border-transparent dark:border-slate-700">
              <div className="grid place-items-center h-full w-12 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                className="peer h-full w-full outline-none text-gray-800 dark:text-white text-base pr-4 bg-transparent font-medium"
                type="text"
                id="search"
                placeholder={t('search_placeholder', 'Search fresh vegetables, groceries, dairy, drinks...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="h-full px-6 bg-charcoal-900 dark:bg-primary-600 text-white font-bold text-sm hover:bg-black dark:hover:bg-primary-700 transition-colors flex items-center gap-1.5">
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          {/* 3 Interactive Mode Quick Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
            <Link
              to="/customer/products"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 transition-all group flex items-center gap-3"
            >
              <div className="bg-yellow-400 text-charcoal-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs">🛵 15-Min Delivery</div>
                <div className="text-[10px] text-primary-100">Live GPS tracking to door</div>
              </div>
            </Link>

            <Link
              to="/customer/list"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 transition-all group flex items-center gap-3"
            >
              <div className="bg-orange-400 text-charcoal-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs">🛍️ Store Take Away</div>
                <div className="text-[10px] text-primary-100">Express locker PIN pickup</div>
              </div>
            </Link>

            <Link
              to="/customer/scan"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 transition-all group flex items-center gap-3"
            >
              <div className="bg-purple-400 text-charcoal-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs">⚡ In-Store Scan & Go</div>
                <div className="text-[10px] text-primary-100">Skip all cashier queues</div>
              </div>
            </Link>
          </div>

        </div>
      </section>

      {/* Popular Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Shop by Category</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Find products categorized by aisle location in the store</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/customer/products')}>
            View All Categories →
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((category) => (
            <button 
              key={category.name}
              onClick={() => navigate(`/customer/products?category=${encodeURIComponent(category.name)}`)}
              className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 text-2xl ${category.bg} group-hover:scale-110 transition-transform shadow-inner`}>
                {category.icon}
              </div>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-xs group-hover:text-primary-700 dark:group-hover:text-primary-400">{category.name}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{category.count} items</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products with 1-Click Cart Addition */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Today's Featured Essentials</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Live in-stock products with real high-resolution photos</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/customer/products')}>
            Explore All Catalog ({products.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {products.slice(0, 10).map((product) => {
            const inCart = shoppingList.some(item => item.id === product.id);

            return (
              <div 
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="aspect-square bg-gray-50 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center p-2">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      onClick={() => navigate(`/customer/products/${product.id}`)}
                      className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300 cursor-pointer" 
                    />
                    <div className="absolute top-3 right-3">
                      <AvailabilityBadge stock={product.stock} reorderLevel={product.reorderLevel} />
                    </div>

                    {/* Aisle Locator Badge */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMapModalProduct(product);
                      }}
                      className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs hover:bg-white dark:hover:bg-slate-900 text-gray-700 dark:text-gray-200 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 shadow-2xs flex items-center gap-1 transition-colors"
                      title="View on store map"
                    >
                      <MapPin className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                      {t('aisle', 'Aisle')} {product.aisle}
                    </button>
                  </div>

                  {/* Info */}
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

                {/* Price & Add to Cart */}
                <div className="p-4 pt-0 flex items-center justify-between">
                  <span className="font-extrabold text-lg text-gray-900 dark:text-white">₹{product.price}</span>
                  
                  <Button
                    size="sm"
                    variant={inCart ? "outline" : "default"}
                    className={inCart ? "text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/60 text-xs" : "text-xs font-bold"}
                    onClick={() => addToShoppingList(product, 1)}
                  >
                    {inCart ? (
                      <span className="flex items-center gap-1">✓ {t('added', 'Added')}</span>
                    ) : (
                      <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {t('add_to_cart', 'Add')}</span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Chef-Curated Recipes & 1-Click Meal Planner */}
      {popularRecipes && popularRecipes.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                <span>👨‍🍳 Chef Specials</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {t('curated_recipes', 'Chef-Curated Recipes & 1-Click Meal Kits')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cook restaurant-grade meals at home. Add all required grocery ingredients to your cart in 1 click!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularRecipes.map((recipe) => {
              const recipeProducts = products.filter(p => recipe.productIds.includes(p.id));
              const totalCost = recipeProducts.reduce((sum, p) => sum + p.price, 0);
              const isAdded = addedRecipeId === recipe.id;

              const localizedName = language === 'hi' ? (recipe.nameHi || recipe.name)
                : language === 'ta' ? (recipe.nameTa || recipe.name)
                : language === 'te' ? (recipe.nameTe || recipe.name)
                : language === 'es' ? (recipe.nameEs || recipe.name)
                : recipe.name;

              return (
                <div 
                  key={recipe.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-44 bg-gray-100 dark:bg-slate-800 relative overflow-hidden">
                      <img 
                        src={recipe.image} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span>{recipe.time}</span>
                        <span>•</span>
                        <span>{recipe.servings}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono font-black text-sm px-3 py-1 rounded-xl shadow-md border border-gray-200 dark:border-slate-700">
                        ₹{totalCost}
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>{recipe.icon}</span>
                          <span>{localizedName}</span>
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {recipe.description}
                        </p>
                      </div>

                      {/* Ingredients Pills */}
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Includes {recipeProducts.length} Fresh Store Ingredients:</div>
                        <div className="flex flex-wrap gap-1">
                          {recipeProducts.map(p => (
                            <span key={p.id} className="text-[10px] bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md border border-gray-200 dark:border-slate-700">
                              {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Button
                      className={`w-full text-xs font-bold shadow-md flex items-center justify-center gap-2 ${
                        isAdded ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                      }`}
                      onClick={() => {
                        addRecipeToCart(recipe);
                        setAddedRecipeId(recipe.id);
                        setTimeout(() => setAddedRecipeId(null), 2000);
                      }}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>All Ingredients Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>{t('ai_add_recipe_cart', 'Add All Ingredients to Cart')} (₹{totalCost})</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Aisle Map Modal */}
      <StoreAisleMapModal
        isOpen={!!mapModalProduct}
        onClose={() => setMapModalProduct(null)}
        selectedProduct={mapModalProduct}
      />

    </div>
  );
}

