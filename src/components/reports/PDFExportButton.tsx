
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface PDFExportButtonProps {
  reportTitle: string;
  reportData: any[];
  columns: string[];
  filename: string;
  variant?: "default" | "outline" | "secondary";
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  reportTitle,
  reportData,
  columns,
  filename,
  variant = "outline",
}) => {
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    
    // Add generation metadata
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
    
    // Prepare column data for autoTable
    const tableColumns = columns.map(col => ({
      header: col,
      dataKey: col.toLowerCase().replace(/\s/g, '')
    }));
    
    // Add table
    (doc as any).autoTable({
      startY: 40,
      head: [columns],
      body: reportData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
  };
  
  return (
    <Button variant={variant} onClick={exportToPDF}>
      <FileText className="mr-2 h-4 w-4" /> Export PDF
    </Button>
  );
};
