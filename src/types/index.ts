
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  currentPrice: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  customerId: string;
  employeeId: string;
  saleDate: Date;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  employee?: Employee;
  saleDetails?: SaleDetail[];
}

export interface SaleDetail {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
}
