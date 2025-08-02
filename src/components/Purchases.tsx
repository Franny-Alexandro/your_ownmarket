import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Calendar, Trash2, Package } from 'lucide-react';
import { Purchase, CartPurchaseItem } from '../types';
import { addPurchase, getPurchases } from '../services/firestore';
import { formatCurrency, formatDate } from '../utils/dateUtils';

const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cart, setCart] = useState<CartPurchaseItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form fields for adding products to cart
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  useEffect(() => {
    const unsubscribe = getPurchases((purchases) => {
      setPurchases(purchases);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const addToCart = () => {
    if (!productName.trim() || !quantity || !unitPrice) {
      setError('Por favor completa todos los campos del producto');
      return;
    }

    const quantityNum = parseInt(quantity);
    const unitPriceNum = parseFloat(unitPrice);

    if (quantityNum <= 0 || unitPriceNum <= 0) {
      setError('La cantidad y el precio deben ser mayores a 0');
      return;
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => 
      item.productName.toLowerCase() === productName.trim().toLowerCase()
    );
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + quantityNum,
        unitPrice: unitPriceNum
      };
      setCart(updatedCart);
    } else {
      const newItem: CartPurchaseItem = {
        productName: productName.trim(),
        quantity: quantityNum,
        unitPrice: unitPriceNum
      };
      setCart([...cart, newItem]);
    }

    // Reset form
    setProductName('');
    setQuantity('');
    setUnitPrice('');
    setError('');
  };

  const removeFromCart = (productName: string) => {
    setCart(cart.filter(item => item.productName !== productName));
  };

  const updateCartItem = (productName: string, field: 'quantity' | 'unitPrice', value: string) => {
    const updatedCart = cart.map(item => {
      if (item.productName === productName) {
        const numValue = field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;
        return { ...item, [field]: numValue };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmitPurchase = async () => {
    if (cart.length === 0) {
      setError('Agrega al menos un producto al carrito');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addPurchase(cart, supplier, new Date(purchaseDate));
      setCart([]);
      setSupplier('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
    } catch (error: any) {
      setError(error.message || 'Error al registrar la compra');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Registro de Compras</h2>
          <p className="text-gray-600">Administra las entradas de productos con carrito múltiple</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Compra</span>
        </button>
      </div>

      {/* Purchase Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Nueva Compra</h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Supplier and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor (Opcional)
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: Distribuidora Central"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Compra
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Add Product Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: Arroz Diana 5lb"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Unitario (RD$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="45.00"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
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
                Carrito de Compra ({cart.length} productos)
              </h4>
              
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{item.productName}</h5>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartItem(item.productName, 'quantity', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-gray-500">×</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateCartItem(item.productName, 'unitPrice', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                      
                      <div className="text-right min-w-[80px]">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(item.quantity * item.unitPrice)}
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
                    Total de la Compra: {formatCurrency(getCartTotal())}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
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
              onClick={handleSubmitPurchase}
              disabled={submitting || cart.length === 0}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{submitting ? 'Registrando...' : 'Registrar Compra'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Purchases List */}
      {purchases.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay compras registradas</h3>
          <p className="text-gray-500">Comienza registrando tu primera compra</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Compras</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center text-gray-500 mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(purchase.date)}
                    </div>
                    {purchase.supplier && (
                      <div className="text-sm text-gray-600 mb-1">
                        Proveedor: {purchase.supplier}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      {purchase.items?.length || 0} productos comprados
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(purchase.totalAmount || 0)}
                    </div>
                  </div>
                </div>
                
                {/* Purchase Items */}
                {purchase.items && purchase.items.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Productos comprados:</h4>
                    <div className="space-y-2">
                      {purchase.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-900">
                            {item.productName} × {item.quantity}
                          </span>
                          <div className="text-right">
                            <span className="text-gray-600">
                              {formatCurrency(item.unitPrice)} c/u
                            </span>
                            <span className="text-green-600 font-medium ml-2">
                              {formatCurrency(item.itemTotal)}
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

export default Purchases;