import React, { useState, useEffect } from 'react';
import { RotateCcw, Calendar, AlertCircle, Package, ArrowLeft } from 'lucide-react';
import { Purchase, Return, ReturnItem } from '../types';
import { getPurchases, getReturns, addReturn } from '../services/firestore';
import { formatCurrency, formatDate } from '../utils/dateUtils';

const Returns: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribePurchases = getPurchases((purchases) => {
      setPurchases(purchases);
    });

    const unsubscribeReturns = getReturns((returns) => {
      setReturns(returns);
      setLoading(false);
    });

    return () => {
      unsubscribePurchases();
      unsubscribeReturns();
    };
  }, []);

  const selectPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setReturnItems([]);
    setError('');
  };

  const addReturnItem = (purchaseItem: any, returnQuantity: number) => {
    if (returnQuantity <= 0 || returnQuantity > purchaseItem.quantity) {
      setError(`La cantidad a devolver debe ser entre 1 y ${purchaseItem.quantity}`);
      return;
    }

    const existingItemIndex = returnItems.findIndex(
      item => item.productName === purchaseItem.productName
    );

    const newReturnItem: ReturnItem = {
      productName: purchaseItem.productName,
      quantity: returnQuantity,
      unitPrice: purchaseItem.unitPrice,
      itemTotal: returnQuantity * purchaseItem.unitPrice
    };

    if (existingItemIndex >= 0) {
      const updatedItems = [...returnItems];
      updatedItems[existingItemIndex] = newReturnItem;
      setReturnItems(updatedItems);
    } else {
      setReturnItems([...returnItems, newReturnItem]);
    }

    setError('');
  };

  const removeReturnItem = (productName: string) => {
    setReturnItems(returnItems.filter(item => item.productName !== productName));
  };

  const getTotalReturnAmount = () => {
    return returnItems.reduce((sum, item) => sum + item.itemTotal, 0);
  };

  const handleSubmitReturn = async () => {
    if (!selectedPurchase) {
      setError('Selecciona una compra');
      return;
    }

    if (returnItems.length === 0) {
      setError('Agrega al menos un producto a devolver');
      return;
    }

    if (!reason.trim()) {
      setError('Especifica el motivo de la devolución');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const returnData: Omit<Return, 'id' | 'createdAt'> = {
        purchaseId: selectedPurchase.id,
        items: returnItems,
        reason: reason.trim(),
        totalAmount: getTotalReturnAmount(),
        date: new Date(returnDate)
      };

      await addReturn(returnData);
      
      // Reset form
      setSelectedPurchase(null);
      setReturnItems([]);
      setReason('');
      setReturnDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
    } catch (error: any) {
      setError(error.message || 'Error al registrar la devolución');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Devoluciones y Cambios</h2>
          <p className="text-gray-600">Gestiona las devoluciones de productos comprados</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Nueva Devolución</span>
          </button>
        )}
      </div>

      {/* Return Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Registrar Devolución</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedPurchase(null);
                setReturnItems([]);
                setError('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {!selectedPurchase ? (
            // Purchase Selection
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Selecciona la compra a devolver:</h4>
              {purchases.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay compras registradas</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      onClick={() => selectPurchase(purchase)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center text-gray-500 mb-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(purchase.date)}
                          </div>
                          {purchase.supplier && (
                            <p className="text-sm text-gray-600">Proveedor: {purchase.supplier}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(purchase.totalAmount || 0)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {purchase.items?.length || 0} productos
                          </p>
                        </div>
                      </div>
                      
                      {purchase.items && purchase.items.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <p className="font-medium mb-1">Productos:</p>
                          <div className="flex flex-wrap gap-2">
                            {purchase.items.slice(0, 3).map((item, index) => (
                              <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {item.productName} ({item.quantity})
                              </span>
                            ))}
                            {purchase.items.length > 3 && (
                              <span className="text-gray-500 text-xs">
                                +{purchase.items.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Return Items Selection
            <div>
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">
                  Compra seleccionada - {formatDate(selectedPurchase.date)}
                </h4>
                {selectedPurchase.supplier && (
                  <p className="text-sm text-gray-600 mb-2">Proveedor: {selectedPurchase.supplier}</p>
                )}
                <p className="text-sm text-gray-600">
                  Total: {formatCurrency(selectedPurchase.totalAmount || 0)}
                </p>
              </div>

              {/* Products to Return */}
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-3">Productos a devolver:</h5>
                <div className="space-y-3">
                  {selectedPurchase.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-900">{item.productName}</h6>
                        <p className="text-sm text-gray-600">
                          Comprado: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          placeholder="Cantidad"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 0;
                            if (quantity > 0) {
                              addReturnItem(item, quantity);
                            } else {
                              removeReturnItem(item.productName);
                            }
                          }}
                        />
                        <span className="text-sm text-gray-500">de {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Summary */}
              {returnItems.length > 0 && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h5 className="font-medium text-orange-800 mb-3">Resumen de devolución:</h5>
                  <div className="space-y-2">
                    {returnItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-orange-700">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-medium text-orange-800">
                          {formatCurrency(item.itemTotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-orange-300">
                    <div className="flex justify-between font-semibold text-orange-800">
                      <span>Total a devolver:</span>
                      <span>{formatCurrency(getTotalReturnAmount())}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la devolución
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ej: Producto defectuoso, cambio de proveedor, etc."
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de devolución
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cambiar Compra
                </button>
                <button
                  onClick={handleSubmitReturn}
                  disabled={submitting || returnItems.length === 0}
                  className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{submitting ? 'Registrando...' : 'Registrar Devolución'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Returns History */}
      {returns.length === 0 ? (
        <div className="text-center py-12">
          <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay devoluciones registradas</h3>
          <p className="text-gray-500">Las devoluciones aparecerán aquí una vez registradas</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Devoluciones</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {returns.map((returnRecord) => (
              <div key={returnRecord.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center text-gray-500 mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(returnRecord.date)}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Motivo: {returnRecord.reason}
                    </div>
                    <div className="text-sm text-gray-600">
                      {returnRecord.items?.length || 0} productos devueltos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-orange-600">
                      -{formatCurrency(returnRecord.totalAmount || 0)}
                    </div>
                  </div>
                </div>
                
                {/* Return Items */}
                {returnRecord.items && returnRecord.items.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 mb-3">Productos devueltos:</h4>
                    <div className="space-y-2">
                      {returnRecord.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-orange-700">
                            {item.productName} × {item.quantity}
                          </span>
                          <span className="font-medium text-orange-800">
                            {formatCurrency(item.itemTotal)}
                          </span>
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

export default Returns;