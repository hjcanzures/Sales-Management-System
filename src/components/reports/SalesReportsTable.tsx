
import { useMemo, useState } from "react";
import { useSalesData } from "@/hooks/useSalesData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { PDFExportButton } from "@/components/reports/PDFExportButton";
import { Search, FileText } from "lucide-react";
import { type Sale } from "@/types";

export const SalesReportsTable = () => {
  const { sales, loading } = useSalesData();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    
    if (!searchTerm.trim()) return sales;
    
    const lowerSearch = searchTerm.toLowerCase();
    return sales.filter((sale) => 
      sale.transno?.toLowerCase().includes(lowerSearch) ||
      sale.customer?.custname?.toLowerCase().includes(lowerSearch) ||
      sale.employee?.firstname?.toLowerCase().includes(lowerSearch) ||
      sale.employee?.lastname?.toLowerCase().includes(lowerSearch) ||
      sale.salesdate?.toString().includes(lowerSearch)
    );
  }, [sales, searchTerm]);

  // Generate PDF data for a specific transaction
  const generateTransactionPdfData = (sale: Sale) => {
    const headers = ["Detail", "Value"];
    
    const data = [
      ["Transaction No", sale.transno || ""],
      ["Date", sale.salesdate ? new Date(sale.salesdate).toLocaleDateString() : ""],
      ["Customer", sale.customer?.custname || ""],
      ["Employee", `${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`],
      ["Status", sale.status || ""],
      ["Total Amount", formatCurrency(sale.totalAmount || 0)],
    ];

    // Add details for each product
    if (sale.salesDetails && sale.salesDetails.length > 0) {
      data.push(["", ""]); // Spacer
      data.push(["Products:", ""]);
      
      sale.salesDetails.forEach((detail, index) => {
        data.push([
          `${index + 1}. ${detail.product?.description || "Unknown Product"}`,
          `${detail.quantity || 0} @ ${formatCurrency(detail.unitPrice || 0)} = ${formatCurrency(detail.subtotal || 0)}`
        ]);
      });
    }
    
    return { 
      headers, 
      data,
      title: `Transaction ${sale.transno}`,
      filename: `transaction-${sale.transno}`
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Loading sales data...
                </TableCell>
              </TableRow>
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => {
                const { headers, data, title, filename } = generateTransactionPdfData(sale);
                return (
                  <TableRow key={sale.transno}>
                    <TableCell>{sale.transno}</TableCell>
                    <TableCell>
                      {sale.salesdate ? new Date(sale.salesdate).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{sale.customer?.custname || "-"}</TableCell>
                    <TableCell>
                      {sale.employee?.firstname} {sale.employee?.lastname}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.totalAmount || 0)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sale.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {sale.status === "completed" ? "Completed" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <PDFExportButton
                        title={title}
                        filename={filename}
                        headers={headers}
                        data={data}
                        action="download"
                        variant="ghost"
                        size="sm"
                        className="px-2"
                      />
                      <PDFExportButton
                        title={title}
                        filename={filename}
                        headers={headers}
                        data={data}
                        action="print"
                        variant="ghost"
                        size="sm"
                        className="px-2"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
