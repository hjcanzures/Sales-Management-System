
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
import { X, Printer, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface SaleDetailsModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleDetailsModal = ({ sale, isOpen, onClose }: SaleDetailsModalProps) => {
  const { toast } = useToast();
  
  if (!sale) return null;

  const handlePrint = () => {
    toast({
      title: "Print requested",
      description: "Print functionality will be implemented soon",
    });
    // In a real implementation, this would trigger the print functionality
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text("Sales Invoice", 14, 22);
      
      // Add invoice details
      doc.setFontSize(11);
      doc.text(`Transaction #: ${sale.transno || 'N/A'}`, 14, 30);
      doc.text(`Date: ${formatDate(sale.salesdate)}`, 14, 36);
      doc.text(`Status: ${sale.status || 'N/A'}`, 14, 42);
      
      // Customer & Employee info
      doc.text("Customer:", 14, 52);
      doc.text(`${sale.customer?.custname || 'N/A'}`, 14, 58);
      doc.text(`${sale.customer?.address || 'No address'}`, 14, 64);
      
      doc.text("Employee:", 120, 52);
      doc.text(
        `${sale.employee ? `${sale.employee.firstname || ''} ${sale.employee.lastname || ''}` : 'N/A'}`,
        120, 58
      );
      
      // Create table for products
      const tableColumn = ["Product", "Quantity", "Unit Price", "Subtotal"];
      const tableRows = sale.salesDetails?.map(detail => [
        detail.product?.description || detail.prodcode || 'N/A',
        detail.quantity?.toString() || '0',
        detail.unitPrice !== undefined ? formatCurrency(detail.unitPrice) : 'N/A',
        detail.subtotal !== undefined ? formatCurrency(detail.subtotal) : 'N/A'
      ]) || [];
      
      // Add products table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });
      
      // Add total at the bottom
      const finalY = (doc as any).lastAutoTable.finalY || 120;
      doc.text(`Total Amount: ${sale.totalAmount !== undefined ? formatCurrency(sale.totalAmount) : 'N/A'}`, 130, finalY + 10);
      
      // Save the PDF
      doc.save(`Invoice-${sale.transno}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: `Invoice ${sale.transno} has been downloaded.`,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]" onInteractOutside={(e) => {
        e.preventDefault();
        onClose();
      }} onEscapeKeyDown={(e) => {
        e.preventDefault(); 
        onClose();
      }}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              Transaction #{sale.transno} details
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
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
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="secondary">
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
