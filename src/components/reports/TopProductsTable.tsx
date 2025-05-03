
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchBar } from "@/components/reports/SearchBar";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface TopProductsTableProps {
  products: Product[];
  onGeneratePDF?: () => void;
}

export function TopProductsTable({ products, onGeneratePDF }: TopProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Product>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredProducts = products
    .filter((product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.prodcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
    
    // Add table with product data
    (doc as any).autoTable({
      startY: 40,
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
    doc.save("top-products-report.pdf");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchBar
          placeholder="Search products..."
          onSearch={setSearchTerm}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleGeneratePDF}>
          <FileText className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

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
                  No products found matching "{searchTerm}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
