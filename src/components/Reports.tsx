import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Calendar, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { Sale, Purchase, DailySummary } from '../types';
import { getSales, getPurchases } from '../services/firestore';
import { formatCurrency, formatDate, getDateRange, isToday, isSameMonth } from '../utils/dateUtils';
import { exportToPDF, printReport } from '../utils/exportUtils';

const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsubscribeSales = getSales((sales) => {
      setSales(sales);
    });

    const unsubscribePurchases = getPurchases((purchases) => {
      setPurchases(purchases);
      setLoading(false);
    });

    return () => {
      unsubscribeSales();
      unsubscribePurchases();
    };
  }, []);

  const getFilteredData = () => {
    let filteredSales: Sale[] = [];
    let filteredPurchases: Purchase[] = [];

    if (selectedPeriod === 'today') {
      filteredSales = sales.filter(sale => isToday(new Date(sale.date)));
      filteredPurchases = purchases.filter(purchase => isToday(new Date(purchase.date)));
    } else if (selectedPeriod === 'week') {
      const { start, end } = getDateRange(7);
      filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= start && saleDate <= end;
      });
      filteredPurchases = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.date);
        return purchaseDate >= start && purchaseDate <= end;
      });
    } else if (selectedPeriod === 'month') {
      const currentMonth = new Date();
      filteredSales = sales.filter(sale => isSameMonth(new Date(sale.date), currentMonth));
      filteredPurchases = purchases.filter(purchase => isSameMonth(new Date(purchase.date), currentMonth));
    }

    return { filteredSales, filteredPurchases };
  };

  const { filteredSales, filteredPurchases } = getFilteredData();

  const summary = {
    totalInvested: filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0),
    totalSold: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    netProfit: filteredSales.reduce((sum, sale) => sum + sale.profit, 0),
    salesCount: filteredSales.length,
    purchasesCount: filteredPurchases.length
  };

  // Top selling products
  const productSales = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.productName]) {
      acc[sale.productName] = { quantity: 0, revenue: 0, profit: 0 };
    }
    acc[sale.productName].quantity += sale.quantity;
    acc[sale.productName].revenue += sale.total;
    acc[sale.productName].profit += sale.profit;
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number; profit: number }>);

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b.quantity - a.quantity)
    .slice(0, 5);

  const handleExportPDF = async () => {
    const dailySummary: DailySummary = {
      date: selectedPeriod === 'today' ? formatDate(new Date()) : `${selectedPeriod} actual`,
      ...summary
    };

    await exportToPDF(dailySummary, filteredSales, filteredPurchases);
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
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h2>
          <p className="text-gray-600">Analiza el rendimiento de tu negocio</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exportar PDF</span>
          </button>
          <button
            onClick={printReport}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Período de Análisis</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'today', label: 'Hoy' },
            { value: 'week', label: 'Última Semana' },
            { value: 'month', label: 'Este Mes' }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invertido</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalInvested)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendido</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalSold)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ganancia Neta</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.netProfit)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Margen de Ganancia</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary.totalSold > 0 ? `${((summary.netProfit / summary.totalSold) * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Más Vendidos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Producto</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Cantidad</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Ingresos</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map(([productName, data], index) => (
                  <tr key={productName} className="border-b border-gray-100">
                    <td className="py-3">
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mr-3">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{productName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-900">{data.quantity}</td>
                    <td className="py-3 text-right font-semibold text-blue-600">
                      {formatCurrency(data.revenue)}
                    </td>
                    <td className="py-3 text-right font-semibold text-green-600">
                      {formatCurrency(data.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas Recientes</h3>
          {filteredSales.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay ventas en este período</p>
          ) : (
            <div className="space-y-3">
              {filteredSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{sale.productName}</p>
                    <p className="text-sm text-gray-500">{formatDate(sale.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{formatCurrency(sale.total)}</p>
                    <p className="text-sm text-green-600">+{formatCurrency(sale.profit)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compras Recientes</h3>
          {filteredPurchases.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay compras en este período</p>
          ) : (
            <div className="space-y-3">
              {filteredPurchases.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{purchase.productName}</p>
                    <p className="text-sm text-gray-500">{formatDate(purchase.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{formatCurrency(purchase.total)}</p>
                    <p className="text-sm text-gray-600">{purchase.quantity} unidades</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;