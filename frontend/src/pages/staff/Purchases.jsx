import React, { useState } from 'react';
import { useSupermarket } from '../../context/SupermarketContext';
import { suppliers } from '../../data/mockData';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export default function Purchases() {
  const { products, receiveStock, transactions } = useSupermarket();
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');

  const purchaseTransactions = transactions.filter(t => t.type === 'PURCHASE');

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
      <h1 className="text-2xl font-bold text-gray-900">Purchase & Restocking</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Record Incoming Stock</h2>
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
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Recent Stock Receipts</h2>
          </div>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">PO Reference</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Quantity added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchaseTransactions.map(txn => {
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
