
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesData } from "@/hooks/useSalesData";
import { useProductsData } from "@/hooks/useProductsData";
import { useEmployeesData } from "@/hooks/useEmployeesData";
import { PDFExportButton } from "@/components/reports/PDFExportButton";
import { Input } from "@/components/ui/input";
import { TopProductsTable } from "@/components/reports/TopProductsTable";
import { SalesDetailModal } from "@/components/reports/SalesDetailModal";

const Reports = () => {
  const { sales, loading: salesLoading } = useSalesData();
  const { products, loading: productsLoading } = useProductsData();
  const { employees, loading: employeesLoading } = useEmployeesData();

  const [activeTab, setActiveTab] = useState("sales");
  const [activeSubTab, setActiveSubTab] = useState({
    sales: "monthly",
    products: "performance",
    employees: "performance"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ 
    from: subMonths(new Date(), 3),
    to: new Date() 
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetailsOpen, setDateDetailsOpen] = useState(false);
  
  // Calculate data for charts from sales data
  const monthlySalesData = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    
    if (!sales || sales.length === 0) return [];
    
    sales.forEach(sale => {
      if (sale.salesdate) {
        const date = new Date(sale.salesdate);
        const monthYear = format(date, "MMM yyyy");
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + (sale.totalAmount || 0);
      }
    });
    
    return Object.entries(monthlyData)
      .map(([month, sales]) => ({
        month,
        sales
      }))
      .sort((a, b) => {
        // Sort by date
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [sales]);

  const productPerformanceData = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    return products
      .filter(p => p.sales && p.revenue)
      .slice(0, 10)
      .map(product => ({
        name: product.name || product.description || "",
        sales: product.sales || 0,
        revenue: product.revenue || 0
      }));
  }, [products]);

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    
    return sales.filter(sale => 
      sale.transno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.custname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sales, searchTerm]);

  // Top selling products
  const topSellingProducts = useMemo(() => {
    if (!products) return [];
    
    return [...products]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 10);
  }, [products]);
  
  const handleSaleClick = (sale) => {
    setSelectedSale(sale);
    setDateDetailsOpen(true);
  };

  const handleSubTabChange = (tab, subTab) => {
    setActiveSubTab(prev => ({
      ...prev,
      [tab]: subTab
    }));
  };

  return (
    <div className="space-y-6">
      <SalesDetailModal 
        sale={selectedSale}
        isOpen={saleDetailsOpen}
        onClose={() => setDateDetailsOpen(false)}
      />
      
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600 mt-2">Analytics and business intelligence</p>
      </div>

      {/* Report Type Selection */}
      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          <TabsTrigger value="products">Product Reports</TabsTrigger>
          <TabsTrigger value="employees">Employee Reports</TabsTrigger>
        </TabsList>

        {/* Sales Reports */}
        <TabsContent value="sales" className="space-y-6">
          <div className="flex overflow-x-auto gap-2 pb-2">
            <Button 
              variant={activeSubTab.sales === "monthly" ? "default" : "outline"} 
              onClick={() => handleSubTabChange('sales', 'monthly')}
              className="whitespace-nowrap"
            >
              Monthly Sales Chart
            </Button>
            <Button 
              variant={activeSubTab.sales === "transactions" ? "default" : "outline"} 
              onClick={() => handleSubTabChange('sales', 'transactions')}
              className="whitespace-nowrap"
            >
              Search Transactions
            </Button>
          </div>
          
          {activeSubTab.sales === "monthly" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Monthly Sales Performance</CardTitle>
                  <CardDescription>Revenue trend over time</CardDescription>
                </div>
                <PDFExportButton
                  reportTitle="Monthly Sales Report"
                  reportData={monthlySalesData}
                  columns={[
                    { header: "Month", accessor: "month" },
                    { header: "Sales ($)", accessor: "sales" }
                  ]}
                  filename="monthly-sales-report"
                  variant="default"
                />
              </CardHeader>
              <CardContent className="h-80">
                {salesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading sales data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlySalesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#0ea5e9" 
                        strokeWidth={2} 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
          
          {activeSubTab.sales === "transactions" && (
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Search Sales Transactions</CardTitle>
                    <CardDescription>Find and export specific transactions</CardDescription>
                  </div>
                  <PDFExportButton
                    reportTitle="All Sales Transactions Report"
                    reportData={filteredSales}
                    columns={[
                      { header: "Transaction #", accessor: "transno" },
                      { header: "Customer", accessor: (sale) => sale.customer?.custname || "N/A" },
                      { header: "Employee", accessor: (sale) => `${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim() || "N/A" },
                      { header: "Date", accessor: (sale) => sale.salesdate ? format(new Date(sale.salesdate), "PP") : "N/A" },
                      { header: "Amount", accessor: "totalAmount" }
                    ]}
                    filename="all-sales-transactions"
                    additionalInfo={{
                      "Filter": searchTerm ? `Search: "${searchTerm}"` : "None",
                      "Total Transactions": filteredSales.length.toString()
                    }}
                    variant="default"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full md:max-w-md">
                  <Input
                    placeholder="Search by transaction #, customer, or employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.slice(0, 10).map((sale) => (
                        <TableRow key={sale.transno} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSaleClick(sale)}>
                          <TableCell>{sale.transno}</TableCell>
                          <TableCell>{sale.customer?.custname || "N/A"}</TableCell>
                          <TableCell>{`${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim() || "N/A"}</TableCell>
                          <TableCell>{sale.salesdate ? format(new Date(sale.salesdate), "PP") : "N/A"}</TableCell>
                          <TableCell>${(sale.totalAmount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaleClick(sale);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            {salesLoading ? "Loading sales data..." : `No sales found matching '${searchTerm}'`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Product Reports */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex overflow-x-auto gap-2 pb-2">
            <Button 
              variant={activeSubTab.products === "performance" ? "default" : "outline"} 
              onClick={() => handleSubTabChange('products', 'performance')}
              className="whitespace-nowrap"
            >
              Product Performance
            </Button>
            <Button 
              variant={activeSubTab.products === "top" ? "default" : "outline"} 
              onClick={() => handleSubTabChange('products', 'top')}
              className="whitespace-nowrap"
            >
              Top Products
            </Button>
          </div>
          
          {activeSubTab.products === "performance" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Product Performance</CardTitle>
                  <CardDescription>Sales and revenue by product</CardDescription>
                </div>
                <PDFExportButton
                  reportTitle="Product Performance Report"
                  reportData={productPerformanceData}
                  columns={[
                    { header: "Product", accessor: "name" },
                    { header: "Units Sold", accessor: "sales" },
                    { header: "Revenue ($)", accessor: "revenue" }
                  ]}
                  filename="product-performance-report"
                  variant="default"
                />
              </CardHeader>
              <CardContent className="h-80">
                {productsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading product data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productPerformanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'revenue' ? `$${value}` : value, 
                        name === 'revenue' ? 'Revenue' : 'Units Sold'
                      ]} />
                      <Legend />
                      <Bar dataKey="sales" name="Units Sold" fill="#0ea5e9" />
                      <Bar dataKey="revenue" name="Revenue" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
          
          {activeSubTab.products === "top" && (
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Products with highest sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                <TopProductsTable 
                  products={products || []} 
                  salesData={sales} 
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Employee Reports */}
        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Employee Performance</CardTitle>
                <CardDescription>Sales and revenue by employee</CardDescription>
              </div>
              <PDFExportButton
                reportTitle="Employee Performance Report"
                reportData={employees || []}
                columns={[
                  { header: "Name", accessor: (data) => `${data.firstname || ''} ${data.lastname || ''}`.trim() },
                  { header: "Position", accessor: "position" },
                  { header: "Sales Count", accessor: "sales" },
                  { header: "Revenue ($)", accessor: "revenue" }
                ]}
                filename="employee-performance"
                variant="default"
              />
            </CardHeader>
            <CardContent className="h-80">
              {employeesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading employee data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employees?.slice(0, 10).map(emp => ({
                      name: `${emp.firstname || ''} ${emp.lastname || ''}`.trim(),
                      sales: emp.sales || 0,
                      revenue: emp.revenue || 0
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? `$${value}` : value, 
                      name === 'revenue' ? 'Revenue' : 'Sales Count'
                    ]} />
                    <Legend />
                    <Bar dataKey="sales" name="Sales Count" fill="#0ea5e9" />
                    <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
