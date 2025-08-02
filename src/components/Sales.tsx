import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Calendar, AlertCircle, ShoppingCart, Trash2, Edit3 } from 'lucide-react';
import { Sale, Product, CartItem } from '../types';
import { addSale, getSales, getProducts } from '../services/firestore';
import { formatCurrency, formatDate } from '../utils/dateUtils';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribeSales = getSales((sales) => {
      setSales(sales);
      setLoading(false);
    });

    const unsubscribeProducts = getProducts((products) => {
      setProducts(products);
    });

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
    };
  }, []);

  const availableProducts = products.filter(p => p.quantity > 0);
  const selectedProductData = products.find(p => p.name === selectedProduct);

  const addToCart = () => {
    if (!selectedProduct || !quantity || !salePrice) {
      setError('Por favor completa todos los campos');
      return;
    }

    const quantityNum = parseInt(quantity);
    const salePriceNum = parseFloat(salePrice);

    if (quantityNum <= 0 || salePriceNum <= 0) {
      setError('La cantidad y el precio deben ser mayores a 0');
      return;
    }

    if (!selectedProductData) {
      setError('Producto no encontrado');
      return;
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => item.productName === selectedProduct);
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      const existingItem = updatedCart[existingItemIndex];
      const newQuantity = existingItem.quantity + quantityNum;
      
      if (newQuantity > selectedProductData.quantity) {
        setError(`Stock insuficiente. Disponible: ${selectedProductData.quantity}, en carrito: ${existingItem.quantity}`);
        return;
      }
      
      updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        salePrice: salePriceNum
      };
      setCart(updatedCart);
    } else {
      if (quantityNum > selectedProductData.quantity) {
        setError(`Stock insuficiente. Disponible: ${selectedProductData.quantity}`);
        return;
      }

      const newItem: CartItem = {
        productId: selectedProductData.id,
        productName: selectedProduct,
        quantity: quantityNum,
        salePrice: salePriceNum,
        availableStock: selectedProductData.quantity,
        costPrice: selectedProductData.averageCost
      };
      
      setCart([...cart, newItem]);
    }

    // Reset form
    setSelectedProduct('');
    setQuantity('');
    setSalePrice('');
    setError('');
  };

  const removeFromCart = (productName: string) => {
    setCart(cart.filter(item => item.productName !== productName));
  };

  const updateCartItem = (productName: string, field: 'quantity' | 'salePrice', value: string) => {
    const updatedCart = cart.map(item => {
      if (item.productName === productName) {
        const numValue = field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;
        
        if (field === 'quantity' && numValue > item.availableStock) {
          return item; // Don't update if exceeds stock
        }
        
        return { ...item, [field]: numValue };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const getCartTotals = () => {
    const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.salePrice), 0);
    const totalProfit = cart.reduce((sum, item) => sum + ((item.salePrice - item.costPrice) * item.quantity), 0);
    return { totalAmount, totalProfit };
  };

  const handleSubmitSale = async () => {
    if (cart.length === 0) {
      setError('Agrega al menos un producto al carrito');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addSale(cart, new Date(saleDate));
      setCart([]);
      setSaleDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
    } catch (error: any) {
      setError(error.message || 'Error al registrar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  const { totalAmount, totalProfit } = getCartTotals();

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
          <h2 className="text-2xl font-bold text-gray-900">Registro de Ventas</h2>
          <p className="text-gray-600">Administra las ventas con carrito de múltiples productos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Sale Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Nueva Venta</h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Add Product Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Producto
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar producto</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.name}>
                    {product.name} (Stock: {product.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                max={selectedProductData?.quantity || 1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Venta (RD$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50.00"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addToCart}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </button>
            </div>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Carrito de Venta ({cart.length} productos)
              </h4>
              
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{item.productName}</h5>
                      <p className="text-sm text-gray-500">
                        Costo: {formatCurrency(item.costPrice)} | Stock: {item.availableStock}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={item.availableStock}
                          value={item.quantity}
                          onChange={(e) => updateCartItem(item.productName, 'quantity', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-gray-500">×</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.salePrice}
                          onChange={(e) => updateCartItem(item.productName, 'salePrice', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                      
                      <div className="text-right min-w-[80px]">
                        <p className="font-semibold text-blue-600">
                          {formatCurrency(item.quantity * item.salePrice)}
                        </p>
                        <p className="text-xs text-green-600">
                          +{formatCurrency((item.salePrice - item.costPrice) * item.quantity)}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.productName)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold text-gray-900">
                    Total: {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    Ganancia: {formatCurrency(totalProfit)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sale Date and Submit */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Venta
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setCart([]);
                  setError('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitSale}
                disabled={submitting || cart.length === 0}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                <span>{submitting ? 'Registrando...' : 'Registrar Venta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales List */}
      {sales.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ventas registradas</h3>
          <p className="text-gray-500">Comienza registrando tu primera venta</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Ventas</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {sales.map((sale) => (
              <div key={sale.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center text-gray-500 mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(sale.date)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {sale.items?.length || 0} productos vendidos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(sale.totalAmount || 0)}
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      Ganancia: {formatCurrency(sale.totalProfit || 0)}
                    </div>
                  </div>
                </div>
                
                {/* Sale Items */}
                {sale.items && sale.items.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Productos vendidos:</h4>
                    <div className="space-y-2">
                      {sale.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-900">
                            {item.productName} × {item.quantity}
                          </span>
                          <div className="text-right">
                            <span className="text-blue-600 font-medium">
                              {formatCurrency(item.itemTotal)}
                            </span>
                            <span className="text-green-600 ml-2">
                              (+{formatCurrency(item.itemProfit)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;