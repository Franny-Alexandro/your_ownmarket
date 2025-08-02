export interface Product {
  id: string;
  name: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id: string;
  items: PurchaseItem[];
  supplier?: string;
  totalAmount: number;
  date: Date;
  createdAt: Date;
}

export interface PurchaseItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
}

export interface CartPurchaseItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Return {
  id: string;
  purchaseId: string;
  items: ReturnItem[];
  reason: string;
  totalAmount: number;
  date: Date;
  createdAt: Date;
}

export interface ReturnItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  totalProfit: number;
  date: Date;
  createdAt: Date;
}

export interface SaleItem {
  productName: string;
  quantity: number;
  salePrice: number;
  costPrice: number;
  itemTotal: number;
  itemProfit: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  availableStock: number;
  costPrice: number;
}

export interface DailySummary {
  date: string;
  totalInvested: number;
  totalSold: number;
  netProfit: number;
  salesCount: number;
  purchasesCount: number;
}

export interface MonthlySummary {
  month: string;
  totalInvested: number;
  totalSold: number;
  netProfit: number;
  salesCount: number;
  purchasesCount: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'vendedor';
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  user: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
}