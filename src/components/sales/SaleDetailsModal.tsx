
import { Sale } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { X, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SaleDetailsModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleDetailsModal = ({ sale, isOpen, onClose }: SaleDetailsModalProps) => {
  const { toast } = useToast();
  
  if (!sale && !isOpen) return null;

  const handlePrint = () => {
    toast({
      title: "Print requested",
      description: "Print functionality will be implemented soon",
    });
    // In a real implementation, this would trigger the print functionality
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              {sale ? `Transaction #${sale.transno} details` : 'Loading...'}
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        {sale && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Sale Information</h3>
                <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-sm font-medium">Date:</div>
                    <div>{formatDate(sale.salesdate)}</div>
                    <div className="text-sm font-medium">Status:</div>
                    <div>
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
                    </div>
                    <div className="text-sm font-medium">Payment Date:</div>
                    <div>{sale.payment ? formatDate(sale.payment.paydate) : 'Not paid'}</div>
                    <div className="text-sm font-medium">Total Amount:</div>
                    <div className="font-bold">
                      {sale.totalAmount !== undefined ? formatCurrency(sale.totalAmount) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer & Employee</h3>
                <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700">Customer:</div>
                    <div>{sale.customer?.custname || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{sale.customer?.address || 'No address'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Handled by:</div>
                    <div>
                      {sale.employee 
                        ? `${sale.employee.firstname || ''} ${sale.employee.lastname || ''}`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Products</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sale.salesDetails?.map((detail) => (
                      <tr key={detail.prodcode}>
                        <td className="px-4 py-3">{detail.product?.description || detail.prodcode}</td>
                        <td className="px-4 py-3">{detail.quantity}</td>
                        <td className="px-4 py-3">{detail.unitPrice !== undefined ? formatCurrency(detail.unitPrice) : 'N/A'}</td>
                        <td className="px-4 py-3 font-medium">{detail.subtotal !== undefined ? formatCurrency(detail.subtotal) : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium">Total:</td>
                      <td className="px-4 py-3 font-bold">
                        {sale.totalAmount !== undefined ? formatCurrency(sale.totalAmount) : 'N/A'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
