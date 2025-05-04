
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, Download, FileChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesData } from "@/hooks/useSalesData";
import { useProductsData } from "@/hooks/useProductsData";
import { useEmployeesData } from "@/hooks/useEmployeesData";
import { SearchBar } from "@/components/reports/SearchBar";
import { TopProductsTable } from "@/components/reports/TopProductsTable";
import { PDFExportButton } from "@/components/reports/PDFExportButton";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Reports = () => {
  const { sales, loading: salesLoading } = useSalesData();
  const { products, loading: productsLoading } = useProductsData();
  const { employees, loading: employeesLoading } = useEmployeesData();

  const [activeTab, setActiveTab] = useState("sales");
  const [currentView, setCurrentView] = useState("monthlySales");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ 
    from: subMonths(new Date(), 1),
    to: new Date() 
  });
  
  // Calculate data for charts from real data
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
        // Sort by date (assuming month is in format "MMM yyyy")
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

  const employeePerformanceData = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    
    return employees
      .filter(e => e.sales && e.revenue)
      .slice(0, 10)
      .map(employee => ({
        name: employee.name || `${employee.firstname || ""} ${employee.lastname || ""}`.trim(),
        sales: employee.sales || 0,
        revenue: employee.revenue || 0
      }));
  }, [employees]);

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    
    return sales.filter(sale => 
      sale.transno?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer?.custname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim().toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sales, searchQuery]);

  // PDF export for sales transactions
  const handleGenerateSalesPDF = (transactionId) => {
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
    
    // Add signature line
    doc.line(14, 180, 100, 180);
    doc.text("Authorized Signature", 14, 190);
    
    // Save the PDF
    doc.save(`transaction-${sale.transno}.pdf`);
  };

  // Generate PDF of all transactions
  const handleGenerateAllTransactionsPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("All Sales Transactions Report", 14, 22);
    
    // Add generation metadata
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Total Transactions: ${filteredSales.length}`, 14, 42);
    
    if (searchQuery) {
      doc.text(`Filter: "${searchQuery}"`, 14, 52);
    }
    
    const transactionsData = filteredSales.map(sale => [
      sale.transno,
      sale.customer?.custname || "N/A",
      `${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim() || "N/A",
      sale.salesdate ? format(new Date(sale.salesdate), "PP") : "N/A",
      `$${(sale.totalAmount || 0).toFixed(2)}`
    ]);
    
    (doc as any).autoTable({
      startY: searchQuery ? 62 : 52,
      head: [["Transaction #", "Customer", "Employee", "Date", "Amount"]],
      body: transactionsData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Save the PDF
    doc.save(`all-transactions-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const renderContent = () => {
    // Sales Reports Section
    if (activeTab === "sales") {
      // Monthly Sales Chart View
      if (currentView === "monthlySales") {
        return (
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monthly Sales</CardTitle>
                <CardDescription>Sales performance over time</CardDescription>
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
        );
      }
      
      // Transactions Search View
      if (currentView === "searchTransactions") {
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Search Sales by Transaction</CardTitle>
              <CardDescription>
                Find and generate reports for specific transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                  <SearchBar 
                    placeholder="Search by transaction, customer, or employee..." 
                    onSearch={setSearchQuery}
                    className="w-full md:w-auto"
                  />
                  
                  <Button 
                    variant="outline" 
                    onClick={handleGenerateAllTransactionsPDF}
                    disabled={filteredSales.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download All as PDF
                  </Button>
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
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.transno}>
                          <TableCell>{sale.transno}</TableCell>
                          <TableCell>{sale.customer?.custname}</TableCell>
                          <TableCell>{`${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim()}</TableCell>
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
                          <TableCell colSpan={6} className="text-center py-4">
                            {salesLoading ? "Loading sales data..." : `No sales found matching '${searchQuery}'`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }
    }
    
    // Product Reports Section
    if (activeTab === "products") {
      // Product Performance Chart
      if (currentView === "productPerformance") {
        return (
          <Card className="w-full">
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
        );
      }
      
      // Top Products List
      if (currentView === "topProducts") {
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                View and analyze your best performing products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopProductsTable 
                products={products} 
                salesData={sales}
              />
            </CardContent>
          </Card>
        );
      }
    }
    
    // Employee Reports Section
    if (activeTab === "employees") {
      return (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Employee Performance</CardTitle>
              <CardDescription>Sales and revenue by employee</CardDescription>
            </div>
            <PDFExportButton
              reportTitle="Employee Performance Report"
              reportData={employeePerformanceData}
              columns={[
                { header: "Employee", accessor: "name" },
                { header: "Sales Count", accessor: "sales" },
                { header: "Revenue ($)", accessor: "revenue" }
              ]}
              filename="employee-performance-report"
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
                  data={employeePerformanceData}
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
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600 mt-2">Analytics and business intelligence</p>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={activeTab === "sales" ? "default" : "outline"}
          className="flex items-center gap-1"
          onClick={() => {
            setActiveTab("sales");
            setCurrentView("monthlySales");
          }}
        >
          Sales Reports
        </Button>
        
        <Button 
          variant={activeTab === "products" ? "default" : "outline"}
          className="flex items-center gap-1"
          onClick={() => {
            setActiveTab("products");
            setCurrentView("productPerformance");
          }}
        >
          Product Reports
        </Button>
        
        <Button 
          variant={activeTab === "employees" ? "default" : "outline"}
          className="flex items-center gap-1"
          onClick={() => {
            setActiveTab("employees");
          }}
        >
          Employee Reports
        </Button>
      </div>
      
      {/* Sub Navigation */}
      {activeTab === "sales" && (
        <div className="flex gap-2">
          <Button 
            variant={currentView === "monthlySales" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCurrentView("monthlySales")}
          >
            Monthly Sales Chart
          </Button>
          <Button 
            variant={currentView === "searchTransactions" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCurrentView("searchTransactions")}
          >
            Search Transactions
          </Button>
        </div>
      )}
      
      {activeTab === "products" && (
        <div className="flex gap-2">
          <Button 
            variant={currentView === "productPerformance" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCurrentView("productPerformance")}
          >
            Product Performance
          </Button>
          <Button 
            variant={currentView === "topProducts" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCurrentView("topProducts")}
          >
            Top Products
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default Reports;
