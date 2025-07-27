import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, Plus } from 'lucide-react';
import { Product } from '../types';
import { getProducts } from '../services/firestore';
import { formatCurrency } from '../utils/dateUtils';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getProducts((products) => {
      setProducts(products);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(product => product.quantity < 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventario Actual</h2>
          <p className="text-gray-600">Gestiona los productos de tu bodega</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="font-medium text-orange-800">Productos con Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="text-sm text-orange-700">
                {product.name}: {product.quantity} unidades
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron productos' : 'No hay productos en inventario'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Agrega productos desde la sección de compras'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all hover:shadow-md ${
                product.quantity < 5 
                  ? 'border-orange-200 bg-orange-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    product.quantity < 5 ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    <Package className={`h-6 w-6 ${
                      product.quantity < 5 ? 'text-orange-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                    {product.quantity < 5 && (
                      <span className="text-orange-600 text-sm font-medium">¡Stock Bajo!</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cantidad:</span>
                  <span className={`font-semibold ${
                    product.quantity < 5 ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                    {product.quantity} unidades
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Costo Promedio:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(product.averageCost)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valor Total:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(product.totalCost)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Inventario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{products.length}</p>
              <p className="text-blue-800 font-medium">Productos</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {products.reduce((sum, product) => sum + product.quantity, 0)}
              </p>
              <p className="text-green-800 font-medium">Unidades Totales</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(products.reduce((sum, product) => sum + product.totalCost, 0))}
              </p>
              <p className="text-purple-800 font-medium">Valor Total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;