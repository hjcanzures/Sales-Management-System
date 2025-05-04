
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesData } from "@/hooks/useSalesData";
import { useProductsData } from "@/hooks/useProductsData";
import { useEmployeesData } from "@/hooks/useEmployeesData";
import { PDFExportButton } from "@/components/reports/PDFExportButton";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Reports = () => {
  const { sales, loading: salesLoading } = useSalesData();
  const { products, loading: productsLoading } = useProductsData();
  const { employees, loading: employeesLoading } = useEmployeesData();

  const [activeTab, setActiveTab] = useState("sales");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ 
    from: subMonths(new Date(), 3),
    to: new Date() 
  });
  
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

  // Function to handle export of all transactions
  const handleGenerateAllTransactionsPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("All Sales Transactions Report", 14, 22);
    
    // Add generation metadata
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Total Transactions: ${filteredSales.length}`, 14, 42);
    
    if (searchTerm) {
      doc.text(`Filter: "${searchTerm}"`, 14, 52);
    }
    
    const transactionsData = filteredSales.map(sale => [
      sale.transno,
      sale.customer?.custname || "N/A",
      `${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim() || "N/A",
      sale.salesdate ? format(new Date(sale.salesdate), "PP") : "N/A",
      `$${(sale.totalAmount || 0).toFixed(2)}`
    ]);
    
    (doc as any).autoTable({
      startY: searchTerm ? 62 : 52,
      head: [["Transaction #", "Customer", "Employee", "Date", "Amount"]],
      body: transactionsData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Save the PDF
    doc.save(`all-transactions-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Function to generate PDF for a single transaction
  const handleGenerateSalesPDF = (transactionId: string) => {
    const sale = sales.find(s => s.transno === transactionId);
    
    if (!sale) return;
    
    const doc = new jsPDF();
    
    // Add title and transaction details
    doc.setFontSize(18);
    doc.text("Sales Transaction Report", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Transaction: ${sale.transno}`, 14, 35);
    doc.text(`Customer: ${sale.customer?.custname || "N/A"}`, 14, 45);
    doc.text(`Date: ${sale.salesdate ? format(new Date(sale.salesdate), "PP") : "N/A"}`, 14, 55);
    doc.text(`Total Amount: $${(sale.totalAmount || 0).toFixed(2)}`, 14, 65);
    
    // Add sales details if available
    if (sale.salesDetails && sale.salesDetails.length > 0) {
      const detailsData = sale.salesDetails.map(detail => [
        detail.product?.name || detail.prodcode || "",
        detail.quantity || 0,
        `$${(detail.unitPrice || 0).toFixed(2)}`,
        `$${(detail.subtotal || 0).toFixed(2)}`
      ]);
      
      (doc as any).autoTable({
        startY: 75,
        head: [["Product", "Quantity", "Unit Price", "Subtotal"]],
        body: detailsData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
    }
    
    // Save the PDF
    doc.save(`transaction-${sale.transno}.pdf`);
  };

  // Top selling products
  const topSellingProducts = useMemo(() => {
    if (!products) return [];
    
    return [...products]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 10);
  }, [products]);

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Sales Chart */}
            <Card className="col-span-1 md:col-span-2">
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

            {/* Search Transactions */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Search Sales Transactions</CardTitle>
                <CardDescription>Find and export specific transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div className="relative w-full md:max-w-md">
                    <Input
                      placeholder="Search by transaction #, customer, or employee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <Button 
                    variant="default" 
                    onClick={handleGenerateAllTransactionsPDF}
                    disabled={filteredSales.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export All as PDF
                  </Button>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.slice(0, 10).map((sale) => (
                        <TableRow key={sale.transno}>
                          <TableCell>{sale.transno}</TableCell>
                          <TableCell>{sale.customer?.custname}</TableCell>
                          <TableCell>{sale.salesdate ? format(new Date(sale.salesdate), "PP") : ""}</TableCell>
                          <TableCell>${(sale.totalAmount || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleGenerateSalesPDF(sale.transno || "")}
                            >
                              <Download className="h-4 w-4 mr-1" /> PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            {salesLoading ? "Loading sales data..." : `No sales found matching '${searchTerm}'`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Product Reports */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Performance Chart */}
            <Card className="col-span-1 md:col-span-2">
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

            {/* Top Selling Products */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Products with highest sales volume</CardDescription>
                </div>
                <PDFExportButton
                  reportTitle="Top Selling Products Report"
                  reportData={topSellingProducts}
                  columns={[
                    { header: "Product Code", accessor: "prodcode" },
                    { header: "Product Name", accessor: "name" },
                    { header: "Units Sold", accessor: "sales" },
                    { header: "Revenue ($)", accessor: "revenue" }
                  ]}
                  filename="top-selling-products"
                  variant="default"
                />
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Code</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSellingProducts.map((product) => (
                        <TableRow key={product.prodcode}>
                          <TableCell>{product.prodcode}</TableCell>
                          <TableCell>{product.name || product.description}</TableCell>
                          <TableCell className="text-right">{product.sales || 0}</TableCell>
                          <TableCell className="text-right">${(product.revenue || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {topSellingProducts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            {productsLoading ? "Loading product data..." : "No product data available"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
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
