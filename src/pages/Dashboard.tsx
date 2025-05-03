
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { useSalesData } from "@/hooks/useSalesData";
import { useProductsData } from "@/hooks/useProductsData";
import { useEmployeesData } from "@/hooks/useEmployeesData";
import { format } from "date-fns";

// Define proper types for our sales data
interface MonthlySale {
  month: string;
  amount: number;
}

interface ProductSale {
  name: string;
  sales: number;
  revenue: number;
}

const Dashboard = () => {
  const { sales, loading: salesLoading } = useSalesData();
  const { products, loading: productsLoading } = useProductsData();
  const { employees, loading: employeesLoading } = useEmployeesData();
  
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [salesGrowth, setSalesGrowth] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Process data for charts
  useEffect(() => {
    if (salesLoading || productsLoading || employeesLoading) {
      setLoading(true);
      return;
    }

    // Calculate total sales amount
    const totalAmount = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    setTotalSales(totalAmount);

    // Process monthly sales data
    const monthlyData: { [key: string]: number } = {};
    
    sales.forEach(sale => {
      if (sale.salesdate) {
        const date = new Date(sale.salesdate);
        const monthYear = format(date, "MMM yyyy");
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + (sale.totalAmount || 0);
      }
    });
    
    const processedMonthlySales = Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }));
    
    setMonthlySales(processedMonthlySales);

    // Calculate sales growth (simplified)
    if (processedMonthlySales.length >= 2) {
      const lastMonth = processedMonthlySales[processedMonthlySales.length - 1].amount;
      const previousMonth = processedMonthlySales[processedMonthlySales.length - 2].amount;
      
      if (previousMonth > 0) {
        const growthPercent = ((lastMonth - previousMonth) / previousMonth) * 100;
        setSalesGrowth(parseFloat(growthPercent.toFixed(1)));
      }
    }

    // Process product sales data
    const topProducts = products
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 5)
      .map(product => ({
        name: product.name || product.description || "",
        sales: product.sales || 0,
        revenue: product.revenue || 0
      }));
    
    setProductSales(topProducts);
    setLoading(false);
  }, [sales, products, employees, salesLoading, productsLoading, employeesLoading]);

  // Format currency
  const formatCurrency = (value: number) => {
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
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalSales)}</h3>
                <div className={`flex items-center mt-1 text-sm font-medium ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {salesGrowth >= 0 ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  <span>{Math.abs(salesGrowth)}% from last month</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
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
                  data={monthlySales}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
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
                  data={productSales}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#0ea5e9" name="Units Sold" />
                  <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
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
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.transno} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">#{sale.transno}</td>
                    <td className="px-4 py-3">{sale.customer?.custname || "N/A"}</td>
                    <td className="px-4 py-3">{`${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim() || "N/A"}</td>
                    <td className="px-4 py-3">{sale.salesdate || "N/A"}</td>
                    <td className="px-4 py-3">{formatCurrency(sale.totalAmount || 0)}</td>
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
                        {sale.status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center">No sales data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
