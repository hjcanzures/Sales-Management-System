
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Sale, SaleDetail } from "@/types";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface SalesDetailModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SalesDetailModal: React.FC<SalesDetailModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  const generatePDF = () => {
    if (!sale) return;
    
    const doc = new jsPDF();
    
    // Add title and sale details
    doc.setFontSize(18);
    doc.text("Sale Transaction Details", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Transaction ID: ${sale.transno || "N/A"}`, 14, 35);
    doc.text(`Customer: ${sale.customer?.custname || "N/A"}`, 14, 45);
    doc.text(`Employee: ${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim(), 14, 55);
    doc.text(`Date: ${sale.salesdate ? new Date(sale.salesdate).toLocaleDateString() : "N/A"}`, 14, 65);
    doc.text(`Total Amount: $${(sale.totalAmount || 0).toFixed(2)}`, 14, 75);
    
    // Add sales details if available
    const detailsData = (sale.salesDetails || []).map(detail => [
      detail.product?.description || detail.prodcode || "N/A",
      detail.quantity || 0,
      `$${(detail.unitPrice || 0).toFixed(2)}`,
      `$${(detail.subtotal || 0).toFixed(2)}`
    ]);
    
    (doc as any).autoTable({
      startY: 85,
      head: [["Product", "Quantity", "Unit Price", "Subtotal"]],
      body: detailsData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    doc.save(`sale-${sale.transno}.pdf`);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>
        
        {sale && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Transaction ID</h4>
                <p className="text-lg">{sale.transno}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date</h4>
                <p className="text-lg">{sale.salesdate ? new Date(sale.salesdate).toLocaleDateString() : "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                <p className="text-lg">{sale.customer?.custname || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Employee</h4>
                <p className="text-lg">{`${sale.employee?.firstname || ""} ${sale.employee?.lastname || ""}`.trim() || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="text-lg capitalize">{sale.status || "pending"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
                <p className="text-lg font-bold">${(sale.totalAmount || 0).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium mb-2">Items</h4>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(sale.salesDetails || []).map((detail, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detail.product?.description || detail.prodcode || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{detail.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${(detail.unitPrice || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">${(detail.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!sale.salesDetails || sale.salesDetails.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No items found</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium">Total:</td>
                      <td className="px-6 py-4 text-right text-sm font-bold">${(sale.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="default" onClick={generatePDF} disabled={!sale}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
