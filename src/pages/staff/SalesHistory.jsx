import React, { useState } from 'react';
import { useSupermarket } from '../../context/SupermarketContext';
import { Badge } from '../../components/ui/Badge';

export default function SalesHistory() {
  const { sales, transactions, products } = useSupermarket();
  const [activeTab, setActiveTab] = useState('sales'); // sales | txns

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">History & Reports</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${activeTab === 'sales' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Sales Invoices
          </button>
          <button 
            onClick={() => setActiveTab('txns')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${activeTab === 'txns' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Stock Transactions
          </button>
        </div>
      </div>

      {activeTab === 'sales' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">{sale.id}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {new Date(sale.date).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{sale.staff}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">{sale.items.length} items</td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    <Badge variant={sale.paymentMode === 'Cash' ? 'default' : 'primary'}>
                      {sale.paymentMode}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-gray-900 text-right">₹{sale.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'txns' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Qty Chg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((txn) => {
                const product = products.find(p => p.id === txn.productId);
                return (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-500">
                      {new Date(txn.date).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 text-sm font-medium text-gray-900">{txn.reference}</td>
                    <td className="py-3 px-6 text-sm">
                      <Badge variant={txn.type === 'PURCHASE' ? 'success' : 'danger'}>
                        {txn.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-900">{product?.name || 'Unknown'}</td>
                    <td className={`py-3 px-6 text-sm font-bold text-right ${txn.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
