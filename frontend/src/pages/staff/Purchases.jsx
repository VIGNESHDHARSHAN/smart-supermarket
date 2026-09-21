import React, { useState } from 'react';
import { useSupermarket } from '../../context/SupermarketContext';
import { suppliers } from '../../data/mockData';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';

export default function Purchases() {
  const { products, receiveStock, transactions } = useSupermarket();
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const purchaseTransactions = transactions.filter(t => t.type === 'PURCHASE');
  const paginatedPurchases = purchaseTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleReceiveStock = (e) => {
    e.preventDefault();
    if (!selectedProduct || !selectedSupplier || !quantity || !unitCost) {
      alert("Please fill all fields");
      return;
    }

    receiveStock(selectedProduct, quantity, selectedSupplier, unitCost);
    
    // Reset form
    setSelectedProduct('');
    setSelectedSupplier('');
    setQuantity('');
    setUnitCost('');
    
    alert("Stock received successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Purchase & Restocking</h1>
        <p className="text-xs text-gray-500 mt-1">Receive new batch shipments from suppliers directly into inventory</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Record Incoming Stock</h2>
          <form onSubmit={handleReceiveStock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                <option value="">Select a supplier...</option>
                {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                {(!suppliers || suppliers.length === 0) && <option value="SUP001">Direct Distributor (Default)</option>}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Select a product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.barcode})</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₹)</label>
                <Input type="number" min="0.01" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            
            <Button type="submit" className="w-full mt-4">Receive Stock</Button>
          </form>
        </div>

        {/* Recent Purchases */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Stock Receipts</h2>
                <p className="text-xs text-gray-500">History of incoming shipments</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {purchaseTransactions.length} Total Receipts
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">PO Reference</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Quantity added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-sm text-gray-500">
                        No purchase transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedPurchases.map(txn => {
                      const product = products.find(p => p.id === txn.productId);
                      return (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(txn.date).toLocaleDateString()} {new Date(txn.date).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{txn.reference}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{product?.name || 'Unknown'}</td>
                          <td className="py-3 px-4 text-sm font-bold text-green-600 text-right">+{txn.quantity}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={purchaseTransactions.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
