
import { useMemo, useState } from "react";
import { useProductsData } from "@/hooks/useProductsData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { PDFExportButton } from "@/components/reports/PDFExportButton";
import { Product } from "@/types";
import { Slider } from "@/components/ui/slider";

export const TopProductsTable = () => {
  const { products, loading } = useProductsData();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"sales" | "revenue">("revenue");
  const [limit, setLimit] = useState("10");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [monthFilter, setMonthFilter] = useState("all");
  
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);
  
  const months = [
    { value: "all", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    // Filter by search term
    let filtered = products.filter((product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.prodcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort products
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "sales") {
        return (b.sales || 0) - (a.sales || 0);
      }
      return (b.revenue || 0) - (a.revenue || 0);
    });
    
    // Apply limit
    const limitValue = parseInt(limit, 10);
    if (limitValue > 0) {
      filtered = filtered.slice(0, limitValue);
    }
    
    return filtered;
  }, [products, searchTerm, sortBy, limit]);

  // Generate data for PDF export
  const generatePdfData = (products: Product[]) => {
    const headers = ["Rank", "Product Code", "Product Name", "Units Sold", "Revenue", "Unit Price"];
    
    const data = products.map((product, index) => [
      (index + 1).toString(),
      product.prodcode || "",
      product.name || "",
      product.sales?.toString() || "0",
      formatCurrency(product.revenue || 0),
      formatCurrency(product.currentPrice || 0),
    ]);
    
    return { headers, data };
  };

  const { headers, data } = useMemo(() => 
    generatePdfData(filteredProducts), [filteredProducts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Select
              value={yearFilter}
              onValueChange={setYearFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Month</label>
            <Select
              value={monthFilter}
              onValueChange={setMonthFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            <div className="max-w-sm">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-32">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as "sales" | "revenue")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="sales">Units Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger>
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="100">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <PDFExportButton
              title="Top Products Report"
              filename="top-products-report"
              headers={headers}
              data={data}
              orientation="landscape"
              action="download"
            />
            <PDFExportButton
              title="Top Products Report"
              filename="top-products-report"
              headers={headers}
              data={data}
              orientation="landscape"
              action="print"
              variant="default"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Product Code</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">Units Sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Loading products data...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <TableRow key={product.prodcode}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{product.prodcode}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">{product.sales}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.revenue || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.currentPrice || 0)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
