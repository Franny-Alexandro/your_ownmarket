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
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: Date;
  createdAt: Date;
}

export interface Sale {
  id: string;
  productName: string;
  quantity: number;
  salePrice: number;
  costPrice: number;
  total: number;
  profit: number;
  date: Date;
  createdAt: Date;
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