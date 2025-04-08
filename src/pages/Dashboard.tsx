
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { augmentedSales, products, customers, employees } from "@/lib/mockData";
import { DollarSign, Users, Package, User, ArrowUp, ArrowDown } from "lucide-react";

// Define proper types for our sales data
interface MonthlySale {
  month: string;
  amount: number;
}

interface ProductSale {
  name: string;
  sales: number;
}

interface SalesData {
  monthlySales: MonthlySale[];
  productSales: ProductSale[];
}

const Dashboard = () => {
  // Use the proper type for the state
  const [salesData, setSalesData] = useState<SalesData>({ monthlySales: [], productSales: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Process the sales data for charts
    const monthlySales = Array(12).fill(0).map((_, i) => {
      const month = new Date(2023, i, 1).toLocaleString('default', { month: 'short' });
      const amount = augmentedSales
        .filter(sale => sale.saleDate.getMonth() === i)
        .reduce((total, sale) => total + sale.totalAmount, 0);
      return { month, amount };
    });

    // Product sales data
    const productSales = products.map(product => {
      const salesCount = augmentedSales.reduce((count, sale) => {
        const productInSale = sale.saleDetails?.filter(detail => detail.productId === product.id) || [];
        return count + productInSale.reduce((total, detail) => total + detail.quantity, 0);
      }, 0);
      
      return {
        name: product.name,
        sales: salesCount
      };
    });

    setSalesData({ monthlySales, productSales });
    setLoading(false);
  }, []);

  // Calculate KPIs
  const totalSales = augmentedSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCustomers = customers.length;
  const totalProducts = products.length;
  const totalEmployees = employees.length;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your sales management dashboard</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalSales)}</h3>
                <div className="flex items-center mt-1 text-sm font-medium text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>12% from last month</span>
                </div>
              </div>
              <div className="bg-sales-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-sales-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Customers</p>
                <h3 className="text-2xl font-bold mt-1">{totalCustomers}</h3>
                <div className="flex items-center mt-1 text-sm font-medium text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>5% from last month</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Products</p>
                <h3 className="text-2xl font-bold mt-1">{totalProducts}</h3>
                <div className="flex items-center mt-1 text-sm font-medium text-amber-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>2% from last month</span>
                </div>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Employees</p>
                <h3 className="text-2xl font-bold mt-1">{totalEmployees}</h3>
                <div className="flex items-center mt-1 text-sm font-medium text-gray-600">
                  <span>No change</span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={salesData.monthlySales}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Product Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData.productSales}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Sale ID</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Employee</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {augmentedSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">#{sale.id}</td>
                    <td className="px-4 py-3">{sale.customer?.name}</td>
                    <td className="px-4 py-3">{sale.employee?.name}</td>
                    <td className="px-4 py-3">{sale.saleDate.toLocaleDateString()}</td>
                    <td className="px-4 py-3">{formatCurrency(sale.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : sale.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
