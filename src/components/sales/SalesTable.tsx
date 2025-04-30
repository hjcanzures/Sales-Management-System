
import { Sale } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, Eye, Trash2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DeleteSaleDialog } from "./DeleteSaleDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SalesTableProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
  onSaleDeleted: () => void;
}

export const SalesTable = ({ sales, onViewDetails, onSaleDeleted }: SalesTableProps) => {
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const { toast } = useToast();

  const handleDeleteSale = async () => {
    if (!saleToDelete?.transno) return;

    try {
      // First delete the related salesdetails
      const { error: detailsError } = await supabase
        .from('salesdetail')
        .delete()
        .eq('transno', saleToDelete.transno);
        
      if (detailsError) throw detailsError;
      
      // Then delete any related payments
      const { error: paymentError } = await supabase
        .from('payment')
        .delete()
        .eq('transno', saleToDelete.transno);
        
      if (paymentError) throw paymentError;
      
      // Finally delete the sale itself
      const { error: salesError } = await supabase
        .from('sales')
        .delete()
        .eq('transno', saleToDelete.transno);

      if (salesError) throw salesError;

      toast({
        title: "Success",
        description: `Sale #${saleToDelete.transno} has been deleted`,
      });

      onSaleDeleted();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete sale",
        variant: "destructive",
      });
    } finally {
      setSaleToDelete(null);
    }
  };

  const handleEditSale = (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    toast({
      title: "Edit Sale",
      description: `Edit functionality for Sale #${sale.transno} will be implemented soon`,
    });
  };

  const handleRowClick = (sale: Sale) => {
    onViewDetails(sale);
  };

  const handleViewDetailsClick = (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering row click
    onViewDetails(sale);
  };

  const handleDeleteClick = (sale: Sale, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering row click
    setSaleToDelete(sale);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <TableRow 
                key={sale.transno}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(sale)}
              >
                <TableCell>#{sale.transno}</TableCell>
                <TableCell>{sale.customer?.custname || 'N/A'}</TableCell>
                <TableCell>
                  {sale.employee 
                    ? `${sale.employee.firstname || ''} ${sale.employee.lastname || ''}`.trim() || 'N/A'
                    : 'N/A'}
                </TableCell>
                <TableCell>{formatDate(sale.salesdate)}</TableCell>
                <TableCell>
                  {sale.totalAmount !== undefined ? formatCurrency(sale.totalAmount) : 'N/A'}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sale.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : sale.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sale.status}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleViewDetailsClick(sale, e)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleEditSale(sale, e)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Sale
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => handleDeleteClick(sale, e)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Sale
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                No sales found matching your criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <DeleteSaleDialog
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={handleDeleteSale}
        saleNumber={saleToDelete?.transno || ''}
      />
    </div>
  );
};
