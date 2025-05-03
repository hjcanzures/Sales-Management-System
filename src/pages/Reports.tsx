
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, Download, FileText, Search, ChartBarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesData } from "@/hooks/useSalesData";
import { useProductsData } from "@/hooks/useProductsData";
import { useEmployeesData } from "@/hooks/useEmployeesData";
import { SearchBar } from "@/components/reports/SearchBar";
import { TopProductsTable } from "@/components/reports/TopProductsTable";
import { PDFExportButton } from "@/components/reports/PDFExportButton";

const Reports = () => {
  const { sales, loading: salesLoading } = useSalesData();
  const { products, loading: productsLoading } = useProductsData();
  const { employees, loading: employeesLoading } = useEmployeesData();

  const [date, setDate] = useState<Date>();
  const [reportType, setReportType] = useState("sales");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState({ 
    from: subMonths(new Date(), 1),
    to: new Date() 
  });
  const [currentSection, setCurrentSection] = useState("charts");
  
  // Calculate data for charts from real data
  const monthlySalesData = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
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
    return products.slice(0, 10).map(product => ({
      name: product.name || product.description || "",
      sales: product.sales || 0,
      revenue: product.revenue || 0
    }));
  }, [products]);

  const employeePerformanceData = useMemo(() => {
    return employees.slice(0, 10).map(employee => ({
      name: employee.name || `${employee.firstname || ""} ${employee.lastname || ""}`.trim(),
      sales: employee.sales || 0,
      revenue: employee.revenue || 0
    }));
  }, [employees]);

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    return sales.filter(sale => 
      sale.transno?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer?.custname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim().toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sales, searchQuery]);

  // PDF export functions for different report types
  const handleGenerateSalesReportPDF = () => {
    const columns = [
      { header: "Month", accessor: "month" },
      { header: "Sales ($)", accessor: "sales" }
    ];
    
    return (
      <PDFExportButton
        reportTitle="Monthly Sales Report"
        reportData={monthlySalesData}
        columns={columns}
        filename="monthly-sales-report"
      />
    );
  };
  
  const handleGenerateProductReportPDF = () => {
    const columns = [
      { header: "Product", accessor: "name" },
      { header: "Units Sold", accessor: "sales" },
      { header: "Revenue ($)", accessor: "revenue" }
    ];
    
    return (
      <PDFExportButton
        reportTitle="Product Performance Report"
        reportData={productPerformanceData}
        columns={columns}
        filename="product-performance-report"
      />
    );
  };
  
  const handleGenerateEmployeeReportPDF = () => {
    const columns = [
      { header: "Employee", accessor: "name" },
      { header: "Sales Count", accessor: "sales" },
      { header: "Revenue ($)", accessor: "revenue" }
    ];
    
    return (
      <PDFExportButton
        reportTitle="Employee Performance Report"
        reportData={employeePerformanceData}
        columns={columns}
        filename="employee-performance-report"
      />
    );
  };
  
  // Handle PDF generation for sales transaction
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
    if (sale.saleDetails && sale.saleDetails.length > 0) {
      const detailsData = sale.saleDetails.map(detail => [
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600 mt-2">Analytics and business intelligence</p>
      </div>
      
      <NavigationMenu className="max-w-full w-full justify-start">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger 
              className={cn(activeTab === "sales" ? "bg-sales-50 text-sales-700" : "")}
              onClick={() => setActiveTab("sales")}
            >
              Sales Reports
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid grid-cols-2 gap-3 p-4 w-[400px]">
                <div className="row-span-3">
                  <NavigationMenuLink asChild>
                    <a
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-sales-50 to-sales-100 p-6 no-underline outline-none focus:shadow-md"
                      href="#"
                      onClick={(e) => {e.preventDefault(); setCurrentSection("charts"); setReportType("sales");}}
                    >
                      <div className="mb-2 mt-4 text-lg font-medium">Monthly Sales</div>
                      <p className="text-sm leading-tight text-sales-700">
                        View performance over time and analyze trends
                      </p>
                    </a>
                  </NavigationMenuLink>
                </div>
                <NavigationMenuLink asChild>
                  <a
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="#"
                    onClick={(e) => {e.preventDefault(); setCurrentSection("salesByTransaction");}}
                  >
                    <div className="text-sm font-medium leading-none">Search by Transaction</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Find and print individual transaction reports
                    </p>
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="#"
                    onClick={(e) => {e.preventDefault(); setCurrentSection("topProducts");}}
                  >
                    <div className="text-sm font-medium leading-none">Top Selling Products</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Analyze best performing products by sales range
                    </p>
                  </a>
                </NavigationMenuLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuTrigger 
              className={cn(activeTab === "products" ? "bg-sales-50 text-sales-700" : "")}
              onClick={() => {setActiveTab("products"); setReportType("products"); setCurrentSection("charts");}}
            >
              Product Reports
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid grid-cols-1 gap-3 p-4 w-[300px]">
                <NavigationMenuLink asChild>
                  <a
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="#"
                    onClick={(e) => {e.preventDefault(); setCurrentSection("productPerformance"); setReportType("products");}}
                  >
                    <div className="text-sm font-medium leading-none">Product Performance</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      View sales and revenue by product
                    </p>
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="#"
                    onClick={(e) => {e.preventDefault(); setCurrentSection("topProductsList"); setReportType("topProducts");}}
                  >
                    <div className="text-sm font-medium leading-none">Top Products Ranking</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      View and search top selling products
                    </p>
                  </a>
                </NavigationMenuLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuTrigger 
              className={cn(activeTab === "employees" ? "bg-sales-50 text-sales-700" : "")}
              onClick={() => {setActiveTab("employees"); setReportType("employees"); setCurrentSection("charts");}}
            >
              Employee Reports
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      
      {currentSection === "charts" && (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-auto">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select report" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales Reports</SelectItem>
                <SelectItem value="products">Product Reports</SelectItem>
                <SelectItem value="employees">Employee Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            {reportType === "sales" && handleGenerateSalesReportPDF()}
            {reportType === "products" && handleGenerateProductReportPDF()}
            {reportType === "employees" && handleGenerateEmployeeReportPDF()}
          </div>
        </div>
      )}
      
      {currentSection === "topProductsList" && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              View and search for the best performing products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsTable 
              products={products} 
              salesData={sales}
            />
          </CardContent>
        </Card>
      )}
      
      {currentSection === "salesByTransaction" && (
        <Card>
          <CardHeader>
            <CardTitle>Search Sales by Transaction</CardTitle>
            <CardDescription>
              Find and generate reports for specific transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SearchBar 
                placeholder="Search by transaction number, customer, or employee..." 
                onSearch={setSearchQuery}
              />
              
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
                          <Button variant="outline" size="sm" onClick={() => handleGenerateSalesPDF(sale.transno || "")}>
                            <FileText className="h-4 w-4 mr-1" /> PDF
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
      )}
      
      {currentSection === "topProducts" && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Analyze products by sales within a specific date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsTable 
              products={products} 
              salesData={sales}
            />
          </CardContent>
        </Card>
      )}
      
      {currentSection === "productPerformance" && (
        <Card>
          <CardHeader>
            <CardTitle>Product Performance Analysis</CardTitle>
            <CardDescription>
              Detailed analysis of product sales and revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SearchBar 
                placeholder="Search by product name or code..." 
                onSearch={setSearchQuery} 
                className="max-w-md"
              />
            
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productPerformanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Legend />
                    <Bar dataKey="sales" name="Units Sold" fill="#0ea5e9" />
                    <Bar dataKey="revenue" name="Revenue" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-end">
                {handleGenerateProductReportPDF()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {currentSection === "charts" && (
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
          </TabsList>
          
          <TabsContent value="charts" className="space-y-6">
            {reportType === "sales" && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Sales</CardTitle>
                  <CardDescription>
                    Sales performance over the past months
                  </CardDescription>
                  <SearchBar 
                    placeholder="Search sales..." 
                    onSearch={setSearchQuery} 
                    className="mt-4 max-w-md" 
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
                        <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}
            
            {reportType === "products" && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Performance</CardTitle>
                  <CardDescription>
                    Sales and revenue by product
                  </CardDescription>
                  <SearchBar 
                    placeholder="Search products..." 
                    onSearch={setSearchQuery} 
                    className="mt-4 max-w-md" 
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
                        <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                        <Legend />
                        <Bar dataKey="sales" name="Units Sold" fill="#0ea5e9" />
                        <Bar dataKey="revenue" name="Revenue" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}
            
            {reportType === "employees" && (
              <Card>
                <CardHeader>
                  <CardTitle>Employee Performance</CardTitle>
                  <CardDescription>
                    Sales and revenue by employee
                  </CardDescription>
                  <SearchBar 
                    placeholder="Search employees..." 
                    onSearch={setSearchQuery} 
                    className="mt-4 max-w-md" 
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
                        <Tooltip formatter={(value, name) => [name === 'revenue' ? `$${value}` : value, name === 'revenue' ? 'Revenue' : 'Sales Count']} />
                        <Legend />
                        <Bar dataKey="sales" name="Sales Count" fill="#0ea5e9" />
                        <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="tables">
            <Card>
              <CardHeader>
                <CardTitle>{reportType === "sales" ? "Sales Data" : reportType === "products" ? "Product Data" : "Employee Data"}</CardTitle>
                <SearchBar 
                  placeholder={`Search ${reportType}...`}
                  onSearch={setSearchQuery} 
                  className="mt-4 max-w-md" 
                />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {reportType === "sales" && (
                        <TableRow>
                          <TableHead>Transaction #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total Amount ($)</TableHead>
                        </TableRow>
                      )}
                      {reportType === "products" && (
                        <TableRow>
                          <TableHead>Product Code</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Units Sold</TableHead>
                          <TableHead className="text-right">Revenue ($)</TableHead>
                        </TableRow>
                      )}
                      {reportType === "employees" && (
                        <TableRow>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Sales Count</TableHead>
                          <TableHead className="text-right">Revenue ($)</TableHead>
                        </TableRow>
                      )}
                    </TableHeader>
                    <TableBody>
                      {reportType === "sales" && filteredSales.map((item) => (
                        <TableRow key={item.transno}>
                          <TableCell>{item.transno}</TableCell>
                          <TableCell>{item.customer?.custname}</TableCell>
                          <TableCell>{`${item.employee?.firstname || ""} ${item.employee?.lastname || ""}`.trim()}</TableCell>
                          <TableCell>{item.salesdate ? format(new Date(item.salesdate), "PP") : ""}</TableCell>
                          <TableCell className="text-right">{(item.totalAmount || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {reportType === "products" && products
                        .filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                   p.prodcode?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((item) => (
                          <TableRow key={item.prodcode}>
                            <TableCell>{item.prodcode}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">{(item.sales || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right">${(item.revenue || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      {reportType === "employees" && employees
                        .filter(e => e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                   e.empno?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((item) => (
                          <TableRow key={item.empno}>
                            <TableCell>{item.empno}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">{(item.sales || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right">${(item.revenue || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      {(reportType === "sales" && filteredSales.length === 0) ||
                       (reportType === "products" && products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) ||
                       (reportType === "employees" && employees.filter(e => e.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            {searchQuery ? `No ${reportType} found matching "${searchQuery}"` : `No ${reportType} data available`}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Reports;
