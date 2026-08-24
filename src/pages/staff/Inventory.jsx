import React, { useState } from 'react';
import { useSupermarket, DEMO_CUSTOMERS } from '../../context/SupermarketContext';
import { suppliers } from '../../data/mockData';
import { AvailabilityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  QrCode, 
  Printer, 
  PackagePlus, 
  Download, 
  Filter, 
  X, 
  Sparkles,
  MapPin,
  Tag
} from 'lucide-react';
import { soundEffects } from '../../lib/audio';

export default function Inventory() {
  const { 
    products, 
    adjustProductStock, 
    receiveStock 
  } = useSupermarket();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Restock Modal
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState(30);
  const [restockSupplier, setRestockSupplier] = useState(suppliers[0]?.id || '');

  // Shelf Label Tag Modal
  const [shelfLabelProduct, setShelfLabelProduct] = useState(null);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.barcode.includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStock = filterStockStatus === 'ALL' || (
      filterStockStatus === 'IN_STOCK' ? (p.stock > p.reorderLevel) :
      filterStockStatus === 'LOW_STOCK' ? (p.stock > 0 && p.stock <= p.reorderLevel) :
      filterStockStatus === 'OUT_OF_STOCK' ? (p.stock === 0) : true
    );

    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const handleQuickAdjust = (productId, delta) => {
    adjustProductStock(productId, delta, delta > 0 ? 'Staff Quick Restock' : 'Staff Stock Adjustment');
  };

  const handleConfirmRestock = (e) => {
    e.preventDefault();
    if (!restockProduct || !restockQty) return;

    receiveStock(restockProduct.id, restockQty, restockSupplier, restockProduct.price * 0.7);
    setRestockProduct(null);
    soundEffects.playSuccessChime();
    alert(`Successfully received +${restockQty} units of ${restockProduct.name}!`);
  };

  const handleExportCSV = () => {
    const headers = "ID,Product Name,Barcode,Category,Location,Price,Stock,Reorder Level\n";
    const rows = products.map(p => 
      `"${p.id}","${p.name}","${p.barcode}","${p.category}","Aisle ${p.aisle} Shelf ${p.shelf}","${p.price}","${p.stock}","${p.reorderLevel}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartMart_Inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    soundEffects.playNotificationPing();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Tag className="w-7 h-7 text-primary-600" />
            Interactive Inventory & Stock Control
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time inline stock adjusters, 1-click supplier restocking, and retail shelf barcode tags.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs font-bold bg-white border-gray-200 text-gray-700"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-gray-500" /> Export CSV
          </Button>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search products or barcode..." 
              className="pl-9 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stock Health Metric Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: `All Catalog (${products.length})`, color: 'bg-charcoal-900 text-white' },
          { id: 'LOW_STOCK', label: `⚠️ Low Stock Warnings (${lowStockCount})`, color: 'bg-amber-600 text-white' },
          { id: 'OUT_OF_STOCK', label: `🚨 Out of Stock (${outOfStockCount})`, color: 'bg-red-600 text-white' },
          { id: 'IN_STOCK', label: `✓ Optimal Levels (${products.length - lowStockCount - outOfStockCount})`, color: 'bg-emerald-600 text-white' }
        ].map(filter => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setFilterStockStatus(filter.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all border ${
              filterStockStatus === filter.id 
                ? `${filter.color} border-transparent shadow-xs` 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Interactive Products Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-5 font-black text-gray-500 uppercase tracking-wider">Product</th>
                <th className="py-3 px-4 font-black text-gray-500 uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 font-black text-gray-500 uppercase tracking-wider">Location</th>
                <th className="py-3 px-4 font-black text-gray-500 uppercase tracking-wider text-right">Price</th>
                <th className="py-3 px-4 font-black text-gray-500 uppercase tracking-wider text-center">Current Stock</th>
                <th className="py-3 px-4 font-black text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="py-3 px-5 font-black text-gray-500 uppercase tracking-wider text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const isLow = product.stock > 0 && product.stock <= product.reorderLevel;
                const isOut = product.stock === 0;

                return (
                  <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-contain bg-gray-50 rounded-xl p-1 border border-gray-200 flex-shrink-0" />
                        <div>
                          <span className="font-extrabold text-gray-900 text-xs block">{product.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{product.barcode} • {product.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{product.category}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px]">
                        Aisle {product.aisle} • Shelf {product.shelf}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-black text-right font-mono">₹{product.price}</td>
                    
                    {/* Inline Quick Stock Adjuster (+ / -) */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center border border-gray-200 rounded-xl bg-gray-50 p-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(product.id, -1)}
                          disabled={product.stock === 0}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-xs hover:bg-gray-100 disabled:opacity-40"
                          title="Decrease 1 unit"
                        >
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className={`w-10 text-center font-black font-mono text-xs ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                          {product.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-xs hover:bg-gray-100"
                          title="Increase 1 unit"
                        >
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(product.id, 10)}
                          className="px-1.5 h-6 flex items-center justify-center bg-primary-50 text-primary-700 font-black text-[9px] rounded-lg ml-0.5 hover:bg-primary-100"
                          title="Quick +10 units"
                        >
                          +10
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <AvailabilityBadge stock={product.stock} reorderLevel={product.reorderLevel} />
                    </td>

                    {/* Quick Restock & Shelf Label Actions */}
                    <td className="py-3 px-5 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRestockProduct(product);
                          setRestockQty(30);
                        }}
                        className="text-[11px] font-bold h-8 px-2.5 bg-primary-50/50 hover:bg-primary-100 text-primary-800 border-primary-200"
                      >
                        <PackagePlus className="w-3.5 h-3.5 mr-1" /> Restock PO
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShelfLabelProduct(product)}
                        className="text-[11px] font-bold h-8 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700"
                        title="Generate printable shelf price label"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" /> Shelf Tag
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-xs text-gray-400 space-y-1">
            <Search className="w-8 h-8 text-gray-300 mx-auto" />
            <p>No products found matching your search filter.</p>
          </div>
        )}
      </div>

      {/* Quick Restock Purchase Order Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-primary-600" /> Restock Purchase Order
                </h3>
                <p className="text-xs text-gray-400">Add incoming supplier inventory to store stock</p>
              </div>
              <button onClick={() => setRestockProduct(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                <img src={restockProduct.image} alt={restockProduct.name} className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-gray-200" />
                <div>
                  <div className="font-extrabold text-gray-900 text-sm">{restockProduct.name}</div>
                  <div className="text-[11px] text-gray-400 font-mono">Current Stock: {restockProduct.stock} • Min: {restockProduct.reorderLevel}</div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Supplier</label>
                <select
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Restock Quantity (Units)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="h-10 text-xs font-mono font-bold"
                  />
                  <div className="flex gap-1">
                    {[20, 50, 100].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setRestockQty(qty)}
                        className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-[11px]"
                      >
                        +{qty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-primary-50 rounded-2xl border border-primary-200 text-primary-900 space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>Estimated Total PO Cost:</span>
                  <span className="font-mono">₹{(restockQty * restockProduct.price * 0.7).toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-primary-700">Calculated with 30% wholesale distributor margin</div>
              </div>

              <Button type="submit" className="w-full h-11 bg-primary-600 hover:bg-primary-700 font-bold text-xs">
                Confirm & Receive +{restockQty} Units →
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Printable Retail Shelf Barcode Tag Modal */}
      {shelfLabelProduct && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-gray-700" /> Retail Shelf Price Label
              </h3>
              <button onClick={() => setShelfLabelProduct(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shelf Price Label Tag Graphic */}
            <div className="p-4 bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-2xl space-y-3 font-mono">
              <div className="flex items-start justify-between border-b border-yellow-200 pb-2">
                <div>
                  <div className="font-sans font-black text-sm text-gray-900">{shelfLabelProduct.name}</div>
                  <div className="text-[10px] text-gray-500">{shelfLabelProduct.brand} • {shelfLabelProduct.unit}</div>
                </div>
                <span className="text-[10px] font-black bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded">
                  AISLE {shelfLabelProduct.aisle}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-gray-400">RETAIL MRP</div>
                  <div className="text-2xl font-black text-gray-900 font-sans">
                    ₹{shelfLabelProduct.price}
                  </div>
                  <div className="text-[9px] text-gray-500">INCL. ALL TAXES</div>
                </div>

                {/* Simulated Barcode Image */}
                <div className="text-center bg-white p-2 rounded-lg border border-gray-200 shadow-xs">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${shelfLabelProduct.barcode}`} 
                    alt="Barcode" 
                    className="w-16 h-16 mx-auto"
                  />
                  <div className="text-[9px] font-mono text-gray-700 mt-1">{shelfLabelProduct.barcode}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 font-sans">
              <Button
                variant="outline"
                className="flex-1 text-xs font-bold"
                onClick={() => {
                  alert("Label sent to Store Zebra Barcode Printer!");
                  setShelfLabelProduct(null);
                }}
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Shelf Tag
              </Button>
              <Button
                className="flex-1 bg-charcoal-900 hover:bg-black text-white text-xs font-bold"
                onClick={() => setShelfLabelProduct(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
