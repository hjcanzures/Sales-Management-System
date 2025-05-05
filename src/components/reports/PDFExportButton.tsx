
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

interface PDFExportButtonProps {
  title: string;
  filename: string;
  headers: string[];
  data: (string | number)[][];
  orientation?: "portrait" | "landscape";
  action?: "download" | "print";
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
  className?: string;
}

export const PDFExportButton = ({
  title,
  filename,
  headers,
  data,
  orientation = "portrait",
  action = "download",
  variant = "outline",
  size = "default",
  className,
}: PDFExportButtonProps) => {
  const { toast } = useToast();
  
  const generatePDF = () => {
    try {
      // Initialize PDF document
      const doc = new jsPDF({
        orientation: orientation,
        unit: "mm",
      });
      
      // Add title
      const pageWidth = orientation === "portrait" ? 210 : 297;
      doc.setFontSize(18);
      doc.text(title, pageWidth / 2, 15, { align: "center" });
      
      // Add date
      doc.setFontSize(10);
      const today = new Date().toLocaleDateString();
      doc.text(`Generated on: ${today}`, pageWidth / 2, 22, { align: "center" });
      
      // Add table
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 30,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
      
      // Handle action (download or print)
      if (action === "download") {
        doc.save(`${filename}.pdf`);
        toast({
          title: "Success",
          description: `${title} has been downloaded`,
        });
      } else if (action === "print") {
        // Open PDF in new window and print
        const pdfOutput = doc.output("bloburl");
        if (pdfOutput) {
          // Open PDF in a new window
          const printWindow = window.open(pdfOutput.toString(), "_blank");
          if (printWindow) {
            // Trigger print dialog
            setTimeout(() => {
              printWindow.print();
              toast({
                title: "Success",
                description: `${title} has been sent to printer`,
              });
            }, 500);
          } else {
            toast({
              title: "Error",
              description: "Unable to open print dialog. Please check your popup blocker settings.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={generatePDF} 
      className={className}
    >
      {action === "download" ? (
        <>
          <Download className="h-4 w-4" />
          <span>Export PDF</span>
        </>
      ) : (
        <>
          <Printer className="h-4 w-4" />
          <span>Print PDF</span>
        </>
      )}
    </Button>
  );
};
