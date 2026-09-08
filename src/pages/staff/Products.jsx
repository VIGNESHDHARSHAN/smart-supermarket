import React, { useState } from 'react';
import { useSupermarket } from '../../context/SupermarketContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProductImage } from '../../components/ui/ProductImage';
import { fetchProductImageFromInternet } from '../../services/imageService';
import { 
  Package, 
  Plus, 
  Search, 
  ScanBarcode, 
  Sparkles, 
  X, 
  Check, 
  Layers, 
  MapPin, 
  DollarSign, 
  Tag,
  Loader2,
  Globe
} from 'lucide-react';

export default function Products() {
  const { products, addNewProduct, adjustProductStock } = useSupermarket();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const [imageFetchStatus, setImageFetchStatus] = useState('');

  // Form State for New Product
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Groceries & Staples',
    price: '',
    mrp: '',
    stock: '50',
    unit: '1 kg',
    aisle: '1',
    shelf: '1',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'
  });

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.barcode.includes(searchTerm) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAutoFetchImage = async () => {
    if (!formData.name.trim() && !formData.barcode.trim()) {
      alert('Please enter a product name or barcode first to search online.');
      return;
    }
    setIsFetchingImage(true);
    setImageFetchStatus('Searching Open Food Facts, Wikimedia & Internet...');
    try {
      const res = await fetchProductImageFromInternet(formData.name, formData.barcode, formData.category);
      if (res && res.imageUrl) {
        setFormData(prev => ({ ...prev, image: res.imageUrl }));
        setImageFetchStatus(`Fetched via ${res.source}`);
      } else {
        setImageFetchStatus('Using category high-definition visual');
      }
    } catch (err) {
      setImageFetchStatus('Error fetching online, fallback applied');
    } finally {
      setIsFetchingImage(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      alert('Please fill in product name and price.');
      return;
    }

    addNewProduct(formData);

    // Reset Form
    setFormData({
      name: '',
      barcode: '',
      category: 'Groceries & Staples',
      price: '',
      mrp: '',
      stock: '50',
      unit: '1 kg',
      aisle: '1',
      shelf: '1',
      image: ''
    });
    setImageFetchStatus('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-7 h-7 text-purple-600" />
            <h1 className="text-2xl font-black text-gray-900">
              Supermarket Product Catalog & Inventory
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage your store inventory, add new products, set barcodes, prices & stock levels synced with database.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs h-11 px-5 rounded-2xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Product to Catalog
        </Button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search catalog by name or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Filter:</span>
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-6 text-[11px] font-black text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="py-3.5 px-6 text-[11px] font-black text-gray-500 uppercase tracking-wider">Barcode & Code</th>
                <th className="py-3.5 px-6 text-[11px] font-black text-gray-500 uppercase tracking-wider">Category</th>
                <th className="py-3.5 px-6 text-[11px] font-black text-gray-500 uppercase tracking-wider">Location</th>
                <th className="py-3.5 px-6 text-[11px] font-black text-gray-500 uppercase tracking-wider">Stock Units</th>
                <th className="py-3.5 px-6 text-[11px] font-black text-gray-500 uppercase tracking-wider text-right">Selling Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-purple-50/40 transition-colors">
                  
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <ProductImage 
                        src={product.image} 
                        alt={product.name} 
                        category={product.category}
                        productName={product.name}
                        barcode={product.barcode}
                        className="w-12 h-12 rounded-xl object-contain bg-gray-50 p-1 border border-gray-200 flex-shrink-0" 
                      />
                      <div>
                        <div className="font-extrabold text-gray-900 text-xs">{product.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">Unit: {product.unit}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-6 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                      <ScanBarcode className="w-3.5 h-3.5 text-purple-600" />
                      <span>{product.barcode}</span>
                    </div>
                    <div className="text-[10px] text-gray-400">{product.productCode || product.id}</div>
                  </td>

                  <td className="py-3.5 px-6">
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {product.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-6 text-gray-600 font-medium">
                    Aisle {product.aisle}, Shelf {product.shelf}
                  </td>

                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2">
                      <span className={`font-black font-mono px-2 py-0.5 rounded-md text-xs ${
                        product.stock > 15 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {product.stock} units
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustProductStock(product.id, -5, 'Manual Stock Reduction')}
                          className="w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-black text-center flex items-center justify-center"
                          title="Reduce 5 units"
                        >
                          -
                        </button>
                        <button
                          onClick={() => adjustProductStock(product.id, 10, 'Stock Restock')}
                          className="w-5 h-5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-black text-center flex items-center justify-center"
                          title="Add 10 units"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-6 text-right font-mono">
                    <div className="font-extrabold text-sm text-gray-900">₹{product.price}</div>
                    {product.mrp && product.mrp > product.price && (
                      <div className="text-[10px] text-gray-400 line-through">MRP ₹{product.mrp}</div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-base text-gray-900">Add New Product to Catalog</h3>
                <p className="text-xs text-gray-400">Add item info & barcode for customer Scan & Go and POS Cashier billing</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              
              <div>
                <label className="font-bold text-gray-700 block mb-1">Product Name *</label>
                <Input
                  placeholder="e.g. Heritage Toned Milk 500ml"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Barcode String (EAN/UPC)</label>
                  <Input
                    placeholder="e.g. 8901058000123"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border-gray-300 rounded-xl p-2 font-medium bg-gray-50 text-gray-900"
                  >
                    <option value="Groceries & Staples">Groceries & Staples</option>
                    <option value="Dairy & Eggs">Dairy & Eggs</option>
                    <option value="Oils & Ghee">Oils & Ghee</option>
                    <option value="Snacks & Instant">Snacks & Instant</option>
                    <option value="Beverages & Drinks">Beverages & Drinks</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Fresh Fruits & Veg">Fresh Fruits & Veg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Selling Price (₹) *</label>
                  <Input
                    type="number"
                    placeholder="e.g. 150"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">MRP Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 180"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Initial Stock</label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Unit</label>
                  <Input
                    placeholder="e.g. 1 kg / 500ml"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Aisle No.</label>
                  <Input
                    type="number"
                    value={formData.aisle}
                    onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Shelf No.</label>
                  <Input
                    type="number"
                    value={formData.shelf}
                    onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    Internet Product Image
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFetchImage}
                    disabled={isFetchingImage}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isFetchingImage ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Fetching Online...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Fetch from Internet
                      </>
                    )}
                  </button>
                </div>

                {/* Preview Box & Status */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center p-1 flex-shrink-0 shadow-2xs">
                    <ProductImage
                      src={formData.image}
                      alt={formData.name || 'Preview'}
                      category={formData.category}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Paste image URL or click 'Fetch from Internet'"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="text-[11px] h-8 font-mono"
                    />
                    {imageFetchStatus && (
                      <p className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> {imageFetchStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs h-11 rounded-xl shadow-md flex items-center justify-center gap-2 mt-2"
              >
                <Check className="w-4 h-4" /> Save Product & Sync Database
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
