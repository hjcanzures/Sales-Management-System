
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchBar } from "@/components/reports/SearchBar";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { FileText, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
    from: undefined,
    to: undefined,
  });
  const [isFiltering, setIsFiltering] = useState(false);

  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Filter products by date range if applicable
  const filteredProducts = products
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
          const hasProduct = sale.saleDetails?.some((detail: any) => 
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

  const handleApplyDateFilter = () => {
    if (dateRange.from && dateRange.to) {
      setIsFiltering(true);
    }
  };

  const handleResetDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
    setIsFiltering(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <SearchBar
          placeholder="Search products..."
          onSearch={setSearchTerm}
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                  </>
                ) : (
                  <span>Select date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
              <div className="flex items-center justify-between p-3 border-t border-border">
                <Button variant="ghost" size="sm" onClick={handleResetDateFilter}>
                  Reset
                </Button>
                <Button size="sm" onClick={handleApplyDateFilter}>
                  Apply Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={handleGeneratePDF}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>
      
      {isFiltering && dateRange.from && dateRange.to && (
        <div className="bg-muted/50 text-muted-foreground rounded-md py-2 px-3 text-sm flex justify-between items-center">
          <span>
            Filtering products with sales from {format(dateRange.from, "PP")} to {format(dateRange.to, "PP")}
          </span>
          <Button variant="ghost" size="sm" onClick={handleResetDateFilter}>
            Clear Filter
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("rank")}
              >
                Rank {sortColumn === "rank" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("prodcode")}
              >
                Product Code {sortColumn === "prodcode" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Product {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("sales")}
              >
                Units Sold {sortColumn === "sales" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("revenue")}
              >
                Revenue {sortColumn === "revenue" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.prodcode}>
                <TableCell>{product.rank}</TableCell>
                <TableCell>{product.prodcode}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell className="text-right">{product.sales}</TableCell>
                <TableCell className="text-right">${(product.revenue || 0).toLocaleString()}</TableCell>
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
    </div>
  );
}
