import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, Purchase, Sale } from '../types';

// Products
export const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  try {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const getProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, 'products'), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
    callback(products);
  });
};

// Purchases
export const addPurchase = async (purchase: Omit<Purchase, 'id' | 'createdAt'>) => {
  try {
    const batch = writeBatch(db);
    
    // Add purchase record
    const purchaseRef = doc(collection(db, 'purchases'));
    batch.set(purchaseRef, {
      ...purchase,
      createdAt: serverTimestamp()
    });

    // Update or create product
    const productsQuery = query(
      collection(db, 'products'),
      where('name', '==', purchase.productName)
    );
    const productsSnapshot = await getDocs(productsQuery);
    
    if (productsSnapshot.empty) {
      // Create new product
      const productRef = doc(collection(db, 'products'));
      batch.set(productRef, {
        name: purchase.productName,
        quantity: purchase.quantity,
        averageCost: purchase.unitPrice,
        totalCost: purchase.total,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing product
      const productDoc = productsSnapshot.docs[0];
      const productData = productDoc.data() as Product;
      
      const newQuantity = productData.quantity + purchase.quantity;
      const newTotalCost = productData.totalCost + purchase.total;
      const newAverageCost = newTotalCost / newQuantity;
      
      batch.update(productDoc.ref, {
        quantity: newQuantity,
        averageCost: newAverageCost,
        totalCost: newTotalCost,
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
    return purchaseRef.id;
  } catch (error) {
    console.error('Error adding purchase:', error);
    throw error;
  }
};

export const getPurchases = (callback: (purchases: Purchase[]) => void) => {
  const q = query(collection(db, 'purchases'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const purchases = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Purchase[];
    callback(purchases);
  });
};

// Sales
export const addSale = async (cartItems: any[], saleDate: Date) => {
  try {
    const batch = writeBatch(db);
    
    // Validate stock and prepare sale items
    const saleItems: any[] = [];
    let totalAmount = 0;
    let totalProfit = 0;

    for (const cartItem of cartItems) {
      const productsQuery = query(
        collection(db, 'products'),
        where('name', '==', cartItem.productName)
      );
      const productsSnapshot = await getDocs(productsQuery);
      
      if (productsSnapshot.empty) {
        throw new Error(`Producto "${cartItem.productName}" no encontrado en inventario`);
      }

      const productDoc = productsSnapshot.docs[0];
      const productData = productDoc.data() as Product;
      
      if (productData.quantity < cartItem.quantity) {
        throw new Error(`Stock insuficiente para "${cartItem.productName}". Disponible: ${productData.quantity}`);
      }

      const itemTotal = cartItem.quantity * cartItem.salePrice;
      const itemProfit = (cartItem.salePrice - productData.averageCost) * cartItem.quantity;
      
      saleItems.push({
        productName: cartItem.productName,
        quantity: cartItem.quantity,
        salePrice: cartItem.salePrice,
        costPrice: productData.averageCost,
        itemTotal,
        itemProfit
      });

      totalAmount += itemTotal;
      totalProfit += itemProfit;

      // Update product quantity
      const newQuantity = productData.quantity - cartItem.quantity;
      const newTotalCost = newQuantity * productData.averageCost;
      
      batch.update(productDoc.ref, {
        quantity: newQuantity,
        totalCost: newTotalCost,
        updatedAt: serverTimestamp()
      });
    }

    // Add sale record
    const saleRef = doc(collection(db, 'sales'));
    batch.set(saleRef, {
      items: saleItems,
      totalAmount,
      totalProfit,
      date: saleDate,
      createdAt: serverTimestamp()
    });

    await batch.commit();
    return saleRef.id;
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
};

export const getSales = (callback: (sales: Sale[]) => void) => {
  const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Sale[];
    callback(sales);
  });
};