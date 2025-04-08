
import { Customer, Product, Employee, Sale, SaleDetail, PriceHistory, User } from "@/types";

// Mock Users
export const users: User[] = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "2",
    email: "user@example.com",
    name: "Regular User",
    role: "user",
  },
];

// Mock Customers
export const customers: Customer[] = [
  {
    id: "1",
    name: "Acme Corporation",
    email: "contact@acme.com",
    phone: "123-456-7890",
    address: "123 Main St, Business City, 12345",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    name: "TechSolutions Inc",
    email: "info@techsolutions.com",
    phone: "987-654-3210",
    address: "456 Tech Blvd, Innovation City, 67890",
    createdAt: new Date("2023-02-15"),
    updatedAt: new Date("2023-02-15"),
  },
  {
    id: "3",
    name: "Global Enterprises",
    email: "contact@globalent.com",
    phone: "555-123-4567",
    address: "789 Global Ave, Metro City, 54321",
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2023-03-10"),
  },
];

// Mock Products
export const products: Product[] = [
  {
    id: "1",
    name: "Laptop Pro",
    description: "High-performance laptop for professionals",
    category: "Electronics",
    sku: "LP-2023-001",
    currentPrice: 1299.99,
    stock: 50,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    name: "Office Chair Deluxe",
    description: "Ergonomic office chair with lumbar support",
    category: "Furniture",
    sku: "OC-2023-002",
    currentPrice: 249.99,
    stock: 100,
    createdAt: new Date("2023-02-01"),
    updatedAt: new Date("2023-02-01"),
  },
  {
    id: "3",
    name: "Wireless Headphones",
    description: "Noise-cancelling wireless headphones",
    category: "Electronics",
    sku: "WH-2023-003",
    currentPrice: 179.99,
    stock: 75,
    createdAt: new Date("2023-03-01"),
    updatedAt: new Date("2023-03-01"),
  },
  {
    id: "4",
    name: "Business Software Suite",
    description: "Comprehensive business software package",
    category: "Software",
    sku: "BSS-2023-004",
    currentPrice: 499.99,
    stock: 200,
    createdAt: new Date("2023-04-01"),
    updatedAt: new Date("2023-04-01"),
  },
];

// Mock Price History
export const priceHistory: PriceHistory[] = [
  {
    id: "1",
    productId: "1",
    price: 1199.99,
    effectiveFrom: new Date("2023-01-01"),
    effectiveTo: new Date("2023-03-31"),
    createdAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    productId: "1",
    price: 1299.99,
    effectiveFrom: new Date("2023-04-01"),
    effectiveTo: null,
    createdAt: new Date("2023-04-01"),
  },
  {
    id: "3",
    productId: "2",
    price: 229.99,
    effectiveFrom: new Date("2023-02-01"),
    effectiveTo: new Date("2023-05-31"),
    createdAt: new Date("2023-02-01"),
  },
  {
    id: "4",
    productId: "2",
    price: 249.99,
    effectiveFrom: new Date("2023-06-01"),
    effectiveTo: null,
    createdAt: new Date("2023-06-01"),
  },
];

// Mock Employees
export const employees: Employee[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@company.com",
    phone: "123-456-7890",
    position: "Sales Manager",
    department: "Sales",
    hireDate: new Date("2020-01-15"),
    createdAt: new Date("2020-01-15"),
    updatedAt: new Date("2020-01-15"),
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@company.com",
    phone: "987-654-3210",
    position: "Sales Representative",
    department: "Sales",
    hireDate: new Date("2021-03-10"),
    createdAt: new Date("2021-03-10"),
    updatedAt: new Date("2021-03-10"),
  },
  {
    id: "3",
    name: "Michael Johnson",
    email: "michael.johnson@company.com",
    phone: "555-123-4567",
    position: "Account Manager",
    department: "Sales",
    hireDate: new Date("2022-05-20"),
    createdAt: new Date("2022-05-20"),
    updatedAt: new Date("2022-05-20"),
  },
];

// Mock Sales
export const sales: Sale[] = [
  {
    id: "1",
    customerId: "1",
    employeeId: "2",
    saleDate: new Date("2023-06-15"),
    totalAmount: 3099.97,
    status: "completed",
    paymentMethod: "Credit Card",
    createdAt: new Date("2023-06-15"),
    updatedAt: new Date("2023-06-15"),
  },
  {
    id: "2",
    customerId: "2",
    employeeId: "3",
    saleDate: new Date("2023-07-20"),
    totalAmount: 949.98,
    status: "completed",
    paymentMethod: "Bank Transfer",
    createdAt: new Date("2023-07-20"),
    updatedAt: new Date("2023-07-20"),
  },
  {
    id: "3",
    customerId: "3",
    employeeId: "1",
    saleDate: new Date("2023-08-25"),
    totalAmount: 679.97,
    status: "pending",
    paymentMethod: "Credit Card",
    createdAt: new Date("2023-08-25"),
    updatedAt: new Date("2023-08-25"),
  },
];

// Mock Sale Details
export const saleDetails: SaleDetail[] = [
  {
    id: "1",
    saleId: "1",
    productId: "1",
    quantity: 2,
    unitPrice: 1299.99,
    discount: 0,
    subtotal: 2599.98,
    createdAt: new Date("2023-06-15"),
    updatedAt: new Date("2023-06-15"),
  },
  {
    id: "2",
    saleId: "1",
    productId: "3",
    quantity: 2,
    unitPrice: 179.99,
    discount: 0,
    subtotal: 359.98,
    createdAt: new Date("2023-06-15"),
    updatedAt: new Date("2023-06-15"),
  },
  {
    id: "3",
    saleId: "2",
    productId: "2",
    quantity: 3,
    unitPrice: 249.99,
    discount: 0,
    subtotal: 749.97,
    createdAt: new Date("2023-07-20"),
    updatedAt: new Date("2023-07-20"),
  },
  {
    id: "4",
    saleId: "2",
    productId: "4",
    quantity: 1,
    unitPrice: 499.99,
    discount: 0,
    subtotal: 499.99,
    createdAt: new Date("2023-07-20"),
    updatedAt: new Date("2023-07-20"),
  },
  {
    id: "5",
    saleId: "3",
    productId: "3",
    quantity: 2,
    unitPrice: 179.99,
    discount: 0,
    subtotal: 359.98,
    createdAt: new Date("2023-08-25"),
    updatedAt: new Date("2023-08-25"),
  },
  {
    id: "6",
    saleId: "3",
    productId: "4",
    quantity: 1,
    unitPrice: 499.99,
    discount: 0,
    subtotal: 499.99,
    createdAt: new Date("2023-08-25"),
    updatedAt: new Date("2023-08-25"),
  },
];

// Augment sales with relationships
export const augmentedSales = sales.map(sale => ({
  ...sale,
  customer: customers.find(c => c.id === sale.customerId),
  employee: employees.find(e => e.id === sale.employeeId),
  saleDetails: saleDetails.filter(sd => sd.saleId === sale.id).map(sd => ({
    ...sd,
    product: products.find(p => p.id === sd.productId)
  }))
}));
