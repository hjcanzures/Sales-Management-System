import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchBar } from "@/components/reports/SearchBar";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PDFExportButton } from "./PDFExportButton";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import jsPDF from "jspdf"; // Added import for jsPDF

interface TopProductsTableProps {
  products: Product[];
  onGeneratePDF?: () => void;
  salesData?: any[];
}

export function TopProductsTable({ products, onGeneratePDF, salesData }: TopProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Product>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [isFiltering, setIsFiltering] = useState(true);
  const [monthSelectionOpen, setMonthSelectionOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailsOpen, setProductDetailsOpen] = useState(false);
  
  // Generate year options (from current year back to 2000)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);
  
  // Month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const [fromYear, setFromYear] = useState(currentYear.toString());
  const [fromMonth, setFromMonth] = useState("0"); // January (0-indexed)
  const [toYear, setToYear] = useState(currentYear.toString());
  const [toMonth, setToMonth] = useState("11"); // December (0-indexed)

  // Update date range when year or month selections change
  const updateDateRange = () => {
    const fromDate = startOfMonth(new Date(parseInt(fromYear), parseInt(fromMonth), 1));
    const toDate = endOfMonth(new Date(parseInt(toYear), parseInt(toMonth), 1));
    
    // Validate that fromDate is before toDate
    if (fromDate <= toDate) {
      setDateRange({ from: fromDate, to: toDate });
      setIsFiltering(true);
    } else {
      // If invalid range, swap the values
      setDateRange({ from: toDate, to: fromDate });
      setIsFiltering(true);
    }
  };

  // Set initial date range on component mount
  useEffect(() => {
    updateDateRange();
  }, []);

  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setProductDetailsOpen(true);
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Text search filter
        const textMatch = 
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.prodcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase());

        // If we're not filtering by date or date range is incomplete, only apply text filter
        if (!isFiltering || !dateRange.from || !dateRange.to) {
          return textMatch;
        }

        // If we have salesData, filter by date range
        if (salesData && salesData.length > 0) {
          const productSales = salesData.filter(sale => {
            // Check if the sale is for this product
            const hasProduct = sale.salesDetails?.some((detail: any) => 
              detail.prodcode === product.prodcode
            );
            
            // Check if sale date is within range
            const saleDate = new Date(sale.salesdate);
            const inDateRange = saleDate >= dateRange.from! && saleDate <= dateRange.to!;
            
            return hasProduct && inDateRange;
          });
          
          return textMatch && productSales.length > 0;
        }
        
        return textMatch;
      })
      .sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return 0;
      });
  }, [products, searchTerm, sortColumn, sortDirection, isFiltering, dateRange, salesData]);

  const handleGeneratePDF = () => {
    if (onGeneratePDF) {
      onGeneratePDF();
      return;
    }

    // Default PDF generation if no custom handler is provided
    const doc = new jsPDF();
    doc.text("Top Selling Products Report", 14, 22);
    
    // Add date range to the PDF if filtering is active
    if (isFiltering && dateRange.from && dateRange.to) {
      doc.text(`Date Range: ${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`, 14, 32);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42);
    } else {
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
    }
    
    // Add table with product data
    (doc as any).autoTable({
      startY: isFiltering && dateRange.from && dateRange.to ? 50 : 40,
      head: [["Rank", "Product Code", "Product", "Units Sold", "Revenue"]],
      body: filteredProducts.map(product => [
        product.rank,
        product.prodcode,
        product.name,
        product.sales,
        `$${(product.revenue || 0).toLocaleString()}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Save the PDF
    const filename = isFiltering && dateRange.from && dateRange.to 
      ? `top-products-${format(dateRange.from, "yyyy-MM-dd")}-to-${format(dateRange.to, "yyyy-MM-dd")}.pdf` 
      : "top-products-report.pdf";
    doc.save(filename);
  };

  const handleQuickDateRange = (range: string) => {
    const now = new Date();
    let fromDate: Date;
    const toDate = now;
    
    switch (range) {
      case 'thisMonth':
        fromDate = startOfMonth(now);
        break;
      case 'lastMonth':
        fromDate = startOfMonth(subMonths(now, 1));
        break;
      case 'last3Months':
        fromDate = startOfMonth(subMonths(now, 3));
        break;
      case 'last6Months':
        fromDate = startOfMonth(subMonths(now, 6));
        break;
      case 'thisYear':
        fromDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        break;
      case 'lastYear':
        fromDate = new Date(now.getFullYear() - 1, 0, 1); // January 1st of last year
        break;
      default:
        fromDate = subMonths(now, 1); // Default to last month
    }
    
    setDateRange({ from: fromDate, to: toDate });
    
    // Update the dropdown selections to match
    setFromYear(fromDate.getFullYear().toString());
    setFromMonth(fromDate.getMonth().toString());
    setToYear(toDate.getFullYear().toString());
    setToMonth(toDate.getMonth().toString());
    
    setIsFiltering(true);
  };

  return (
    <div className="space-y-4">
      <ProductDetailsModal 
        product={selectedProduct} 
        isOpen={productDetailsOpen} 
        onClose={() => setProductDetailsOpen(false)} 
        dateRange={dateRange}
      />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>View and analyze your best performing products</CardDescription>
            </div>
            <SearchBar
              placeholder="Search products..."
              onSearch={setSearchTerm}
              className="w-full sm:max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <Select
                value="custom"
                onValueChange={handleQuickDateRange}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="last3Months">Last 3 Months</SelectItem>
                  <SelectItem value="last6Months">Last 6 Months</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover open={monthSelectionOpen} onOpenChange={setMonthSelectionOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM yyyy")} - {format(dateRange.to, "MMM yyyy")}
                      </>
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Date Range</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">From</label>
                          <Select value={fromYear} onValueChange={setFromYear}>
                            <SelectTrigger>
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                              {yearOptions.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select value={fromMonth} onValueChange={setFromMonth}>
                            <SelectTrigger>
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month, index) => (
                                <SelectItem key={month} value={index.toString()}>{month}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">To</label>
                          <Select value={toYear} onValueChange={setToYear}>
                            <SelectTrigger>
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                              {yearOptions.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select value={toMonth} onValueChange={setToMonth}>
                            <SelectTrigger>
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month, index) => (
                                <SelectItem key={month} value={index.toString()}>{month}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMonthSelectionOpen(false);
                          setIsFiltering(false);
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={() => {
                          // Update date range based on the selected year and month
                          updateDateRange();
                          setMonthSelectionOpen(false);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <PDFExportButton
              reportTitle="Top Selling Products Report"
              reportData={filteredProducts}
              columns={[
                { header: "Rank", accessor: "rank" },
                { header: "Product Code", accessor: "prodcode" },
                { header: "Product Name", accessor: "name" },
                { header: "Units Sold", accessor: "sales" },
                { header: "Revenue", accessor: "revenue" }
              ]}
              filename={`top-products-${dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}-to-${dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}`}
              additionalInfo={{
                "Date Range": dateRange.from && dateRange.to ? `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}` : "All Time",
                "Filter": searchTerm ? `Search: "${searchTerm}"` : "None"
              }}
              variant="default"
            />
          </div>
          
          {isFiltering && dateRange.from && dateRange.to && (
            <div className="bg-muted/50 text-muted-foreground rounded-md py-2 px-3 text-sm flex justify-between items-center mb-4">
              <span>
                Filtering products with sales from {format(dateRange.from, "PP")} to {format(dateRange.to, "PP")}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDateRange({ from: undefined, to: undefined });
                  setIsFiltering(false);
                }}
              >
                Clear Filter
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead
                    className="cursor-pointer font-semibold"
                    onClick={() => handleSort("rank")}
                  >
                    Rank {sortColumn === "rank" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer font-semibold"
                    onClick={() => handleSort("prodcode")}
                  >
                    Product Code {sortColumn === "prodcode" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer font-semibold"
                    onClick={() => handleSort("name")}
                  >
                    Product {sortColumn === "name" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right font-semibold"
                    onClick={() => handleSort("sales")}
                  >
                    Units Sold {sortColumn === "sales" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right font-semibold"
                    onClick={() => handleSort("revenue")}
                  >
                    Revenue {sortColumn === "revenue" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow 
                    key={product.prodcode} 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleProductClick(product)}
                  >
                    <TableCell>{product.rank}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{product.prodcode}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary hover:underline">
                        {product.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{product.sales?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-right font-medium">${(product.revenue || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      {isFiltering 
                        ? `No products found with sales in the selected date range${searchTerm ? ` matching "${searchTerm}"` : ""}`
                        : searchTerm 
                          ? `No products found matching "${searchTerm}"`
                          : "No products available"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
