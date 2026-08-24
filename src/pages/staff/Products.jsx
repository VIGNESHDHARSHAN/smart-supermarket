import React from 'react';
import { useSupermarket } from '../../context/SupermarketContext';

export default function Products() {
  const { products } = useSupermarket();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products Database</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
              <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="py-4 px-6 text-sm font-medium text-gray-900">
                  <div className="flex items-center">
                    <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover mr-3 bg-gray-100" />
                    <div>
                      {product.name}
                      <div className="text-xs text-gray-500">Barcode: {product.barcode}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-500">{product.brand}</td>
                <td className="py-4 px-6 text-sm text-gray-500">{product.category}</td>
                <td className="py-4 px-6 text-sm text-gray-500">Aisle {product.aisle}, Shelf {product.shelf}</td>
                <td className="py-4 px-6 text-sm text-gray-900 text-right">₹{product.price} / {product.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
