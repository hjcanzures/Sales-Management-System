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
import { ChevronDown, Eye, Trash2 } from "lucide-react";
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
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('transno', saleToDelete.transno);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Sale #${saleToDelete.transno} has been deleted`,
      });

      onSaleDeleted();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaleToDelete(null);
    }
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
              <TableRow key={sale.transno}>
                <TableCell>#{sale.transno}</TableCell>
                <TableCell>{sale.customer?.custname || 'N/A'}</TableCell>
                <TableCell>
                  {sale.employee 
                    ? `${sale.employee.firstname || ''} ${sale.employee.lastname || ''}`
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
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewDetails(sale)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Edit Sale
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setSaleToDelete(sale)}
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
