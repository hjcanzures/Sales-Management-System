
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileText, Search, ChartBarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data (will be replaced with real data from Supabase)
const monthlySalesData = [
  { month: "Jan", sales: 4000 },
  { month: "Feb", sales: 3000 },
  { month: "Mar", sales: 5000 },
  { month: "Apr", sales: 2780 },
  { month: "May", sales: 1890 },
  { month: "Jun", sales: 2390 },
  { month: "Jul", sales: 3490 },
];

const productPerformanceData = [
  { name: "Product A", sales: 4000, revenue: 24000 },
  { name: "Product B", sales: 3000, revenue: 18000 },
  { name: "Product C", sales: 2000, revenue: 22000 },
  { name: "Product D", sales: 2780, revenue: 29000 },
  { name: "Product E", sales: 1890, revenue: 18900 },
];

const topSellingProductsData = [
  { id: "1", name: "Product A", sales: 532, revenue: 42560, rank: 1 },
  { id: "2", name: "Product D", sales: 423, revenue: 38070, rank: 2 },
  { id: "3", name: "Product E", sales: 387, revenue: 34830, rank: 3 },
  { id: "4", name: "Product B", sales: 298, revenue: 23840, rank: 4 },
  { id: "5", name: "Product C", sales: 276, revenue: 24840, rank: 5 },
  { id: "6", name: "Product F", sales: 243, revenue: 21870, rank: 6 },
  { id: "7", name: "Product G", sales: 209, revenue: 18810, rank: 7 },
  { id: "8", name: "Product H", sales: 187, revenue: 16830, rank: 8 },
  { id: "9", name: "Product I", sales: 153, revenue: 13770, rank: 9 },
  { id: "10", name: "Product J", sales: 128, revenue: 11520, rank: 10 },
];

const employeePerformanceData = [
  { name: "Smith", sales: 120, revenue: 98000 },
  { name: "Johnson", sales: 98, revenue: 72000 },
  { name: "Williams", sales: 86, revenue: 68000 },
  { name: "Brown", sales: 99, revenue: 79000 },
  { name: "Jones", sales: 85, revenue: 61000 },
];

// Mock sales transactions
const sampleTransactions = [
  { transno: 'TR000123', customer: 'John Doe', date: '2023-05-01', total: 1250.00 },
  { transno: 'TR000124', customer: 'Jane Smith', date: '2023-05-02', total: 450.75 },
  { transno: 'TR000125', customer: 'Robert Johnson', date: '2023-05-03', total: 789.50 },
  { transno: 'TR000126', customer: 'Lisa Brown', date: '2023-05-04', total: 1100.25 },
];

const Reports = () => {
  const [date, setDate] = useState<Date>();
  const [reportType, setReportType] = useState("sales");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sales");
  const [saleRange, setSaleRange] = useState({ from: "", to: "" });
  const [currentSection, setCurrentSection] = useState("charts");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Filter products based on search term
  const filteredProducts = topSellingProductsData
    .filter(product => product.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
    .sort((a, b) => {
      const aValue = a[sortColumn as keyof typeof a];
      const bValue = b[sortColumn as keyof typeof b];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // For string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

  // Sort function to handle column sorting  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Handle PDF generation for reports
  const handleGenerateReportPDF = () => {
    const doc = new jsPDF();
    const title = reportType === "sales" ? "Monthly Sales Report" : 
                  reportType === "products" ? "Product Performance Report" : 
                  reportType === "topProducts" ? "Top Selling Products Report" :
                  "Employee Performance Report";
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add report metadata
    doc.setFontSize(12);
    doc.text(`Generated: ${format(new Date(), "PP")}`, 14, 32);
    
    // Define the data based on report type
    let reportData = [];
    let columns = [];
    
    if (reportType === "sales") {
      columns = [["Month", "Sales ($)"]];
      reportData = monthlySalesData.map(item => [item.month, item.sales]);
    } else if (reportType === "products") {
      columns = [["Product", "Units Sold", "Revenue ($)"]];
      reportData = productPerformanceData.map(item => [item.name, item.sales, item.revenue]);
    } else if (reportType === "topProducts") {
      columns = [["Rank", "Product", "Units Sold", "Revenue ($)"]];
      reportData = filteredProducts.map(item => [item.rank, item.name, item.sales, item.revenue]);
    } else {
      columns = [["Employee", "Sales Count", "Revenue ($)"]];
      reportData = employeePerformanceData.map(item => [item.name, item.sales, item.revenue]);
    }
    
    // Add table with data
    (doc as any).autoTable({
      startY: 40,
      head: columns,
      body: reportData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Save the PDF
    doc.save(`${reportType}-report.pdf`);
  };
  
  // Handle PDF generation for sales transaction
  const handleGenerateSalesPDF = (transactionId: string) => {
    const transaction = sampleTransactions.find(tx => tx.transno === transactionId);
    
    if (!transaction) return;
    
    const doc = new jsPDF();
    
    // Add title and transaction details
    doc.setFontSize(18);
    doc.text("Sales Transaction Report", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Transaction: ${transaction.transno}`, 14, 35);
    doc.text(`Customer: ${transaction.customer}`, 14, 45);
    doc.text(`Date: ${transaction.date}`, 14, 55);
    doc.text(`Total Amount: $${transaction.total.toFixed(2)}`, 14, 65);
    
    // Add signature line
    doc.line(14, 100, 100, 100);
    doc.text("Authorized Signature", 14, 110);
    
    // Save the PDF
    doc.save(`transaction-${transaction.transno}.pdf`);
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
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" onClick={handleGenerateReportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
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
            <div className="flex items-center mt-4">
              <Search className="mr-2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search products..." 
                value={productSearchTerm} 
                onChange={(e) => setProductSearchTerm(e.target.value)} 
                className="w-full max-w-sm" 
              />
              <Button variant="outline" className="ml-2" onClick={handleGenerateReportPDF}>
                <FileText className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('rank')}
                  >
                    Rank {sortColumn === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('name')}
                  >
                    Product {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-right" 
                    onClick={() => handleSort('sales')}
                  >
                    Units Sold {sortColumn === 'sales' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-right" 
                    onClick={() => handleSort('revenue')}
                  >
                    Revenue {sortColumn === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.rank}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right">{product.sales}</TableCell>
                    <TableCell className="text-right">${product.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      No products found matching "{productSearchTerm}"
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="transactionSearch">Transaction Number</Label>
                  <Input 
                    id="transactionSearch" 
                    placeholder="Enter transaction number..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
                </div>
                <div className="flex items-end">
                  <Button>Search</Button>
                </div>
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
                    {sampleTransactions
                      .filter(tx => searchQuery ? tx.transno.toLowerCase().includes(searchQuery.toLowerCase()) : true)
                      .map((transaction) => (
                        <TableRow key={transaction.transno}>
                          <TableCell>{transaction.transno}</TableCell>
                          <TableCell>{transaction.customer}</TableCell>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>${transaction.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleGenerateSalesPDF(transaction.transno)}>
                                <FileText className="h-4 w-4 mr-1" /> PDF
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {searchQuery && sampleTransactions.filter(tx => 
                      tx.transno.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No transactions found matching '{searchQuery}'
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input 
                    id="fromDate" 
                    type="date" 
                    value={saleRange.from} 
                    onChange={(e) => setSaleRange(prev => ({...prev, from: e.target.value}))} 
                  />
                </div>
                <div>
                  <Label htmlFor="toDate">To Date</Label>
                  <Input 
                    id="toDate" 
                    type="date" 
                    value={saleRange.to} 
                    onChange={(e) => setSaleRange(prev => ({...prev, to: e.target.value}))} 
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Generate Report</Button>
              </div>
              
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
                <Button variant="outline" onClick={handleGenerateReportPDF}>
                  <FileText className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>
            </div>
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
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={handleGenerateReportPDF}>
                <FileText className="h-4 w-4 mr-2" /> Download PDF
              </Button>
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
                </CardHeader>
                <CardContent className="h-80">
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
                </CardHeader>
                <CardContent className="h-80">
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
                </CardHeader>
                <CardContent className="h-80">
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
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="tables">
            <Card>
              <CardHeader>
                <CardTitle>{reportType === "sales" ? "Sales Data" : reportType === "products" ? "Product Data" : "Employee Data"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {reportType === "sales" && (
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Sales ($)</TableHead>
                        </TableRow>
                      )}
                      {reportType === "products" && (
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Units Sold</TableHead>
                          <TableHead className="text-right">Revenue ($)</TableHead>
                        </TableRow>
                      )}
                      {reportType === "employees" && (
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead className="text-right">Sales Count</TableHead>
                          <TableHead className="text-right">Revenue ($)</TableHead>
                        </TableRow>
                      )}
                    </TableHeader>
                    <TableBody>
                      {reportType === "sales" && monthlySalesData.map((item) => (
                        <TableRow key={item.month}>
                          <TableCell>{item.month}</TableCell>
                          <TableCell className="text-right">{item.sales.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {reportType === "products" && productPerformanceData.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{item.sales.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {reportType === "employees" && employeePerformanceData.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{item.sales.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
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
