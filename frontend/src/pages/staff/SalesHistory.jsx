import React, { useState } from 'react';
import { useSupermarket } from '../../context/SupermarketContext';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';

export default function SalesHistory() {
  const { sales, transactions, products } = useSupermarket();
  const [activeTab, setActiveTab] = useState('sales'); // sales | txns
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(10);
  const [txnsPage, setTxnsPage] = useState(1);
  const [txnsPageSize, setTxnsPageSize] = useState(10);

  const paginatedSales = sales.slice((salesPage - 1) * salesPageSize, salesPage * salesPageSize);
  const paginatedTxns = transactions.slice((txnsPage - 1) * txnsPageSize, txnsPage * txnsPageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">History & Reports</h1>
          <p className="text-xs text-gray-500 mt-1">Audit trail for store billing invoices and inventory movements</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'sales' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Sales Invoices ({sales.length})
          </button>
          <button 
            onClick={() => setActiveTab('txns')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'txns' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Stock Transactions ({transactions.length})
          </button>
        </div>
      </div>

      {activeTab === 'sales' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
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
                {paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-sm text-gray-500">
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={salesPage}
            totalItems={sales.length}
            pageSize={salesPageSize}
            onPageChange={setSalesPage}
            onPageSizeChange={(size) => {
              setSalesPageSize(size);
              setSalesPage(1);
            }}
          />
        </div>
      )}

      {activeTab === 'txns' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
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
                {paginatedTxns.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-sm text-gray-500">
                      No stock movement transactions recorded.
                    </td>
                  </tr>
                ) : (
                  paginatedTxns.map((txn) => {
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
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={txnsPage}
            totalItems={transactions.length}
            pageSize={txnsPageSize}
            onPageChange={setTxnsPage}
            onPageSizeChange={(size) => {
              setTxnsPageSize(size);
              setTxnsPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
