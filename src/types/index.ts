
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
}

export interface Customer {
  id?: string;
  custno?: string;
  custname?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  id?: string;
  prodcode?: string;
  name?: string;
  description?: string;
  category?: string;
  sku?: string;
  unit?: string;
  currentPrice?: number;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PriceHistory {
  id?: string;
  productId?: string;
  prodcode?: string;
  price?: number;
  unitprice?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  effdate?: Date;
  createdAt?: Date;
}

export interface Employee {
  id?: string;
  empno?: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hireDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Sale {
  id?: string;
  transno?: string;
  customerId?: string;
  custno?: string;
  employeeId?: string;
  empno?: string;
  saleDate?: Date;
  salesdate?: string;
  totalAmount?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  paymentMethod?: string;
  createdAt?: Date;
  updatedAt?: Date;
  customer?: Customer;
  employee?: Employee;
  saleDetails?: SaleDetail[];
  salesDetails?: SaleDetail[];
  payment?: {
    amount: number;
    paydate: string;
  };
}

export interface SaleDetail {
  id?: string;
  saleId?: string;
  transno?: string;
  productId?: string;
  prodcode?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  subtotal?: number;
  createdAt?: Date;
  updatedAt?: Date;
  product?: Product;
}
