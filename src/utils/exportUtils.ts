import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency, formatDate } from './dateUtils';
import { DailySummary, Sale, Purchase } from '../types';

export const exportToPDF = async (
  summary: DailySummary,
  sales: Sale[],
  purchases: Purchase[]
) => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text('Reporte Diario - La Gorda Bella Market', 20, 30);
  
  pdf.setFontSize(14);
  pdf.text(`Fecha: ${summary.date}`, 20, 50);
  
  // Summary
  pdf.setFontSize(16);
  pdf.text('Resumen del Día', 20, 70);
  
  pdf.setFontSize(12);
  pdf.text(`Total Invertido: ${formatCurrency(summary.totalInvested)}`, 20, 90);
  pdf.text(`Total Vendido: ${formatCurrency(summary.totalSold)}`, 20, 105);
  pdf.text(`Ganancia Neta: ${formatCurrency(summary.netProfit)}`, 20, 120);
  pdf.text(`Número de Ventas: ${summary.salesCount}`, 20, 135);
  pdf.text(`Número de Compras: ${summary.purchasesCount}`, 20, 150);
  
  // Sales
  if (sales.length > 0) {
    pdf.setFontSize(16);
    pdf.text('Ventas del Día', 20, 180);
    
    pdf.setFontSize(10);
    let yPos = 200;
    
    sales.forEach((sale, index) => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 30;
      }
      
      pdf.text(
        `${index + 1}. ${sale.productName} - Cant: ${sale.quantity} - Precio: ${formatCurrency(sale.salePrice)} - Total: ${formatCurrency(sale.total)}`,
        20,
        yPos
      );
      yPos += 15;
    });
  }
  
  pdf.save(`reporte-${summary.date}.pdf`);
};

export const printReport = () => {
  window.print();
};