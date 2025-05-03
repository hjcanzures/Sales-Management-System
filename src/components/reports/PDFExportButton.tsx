
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface PDFExportButtonProps {
  reportTitle: string;
  reportData: any[];
  columns: { header: string; accessor: string }[];
  filename: string;
  additionalInfo?: { [key: string]: string };
  variant?: "default" | "outline" | "secondary";
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  reportTitle,
  reportData,
  columns,
  filename,
  additionalInfo = {},
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
    
    // Add additional info if provided
    let yPosition = 42;
    Object.entries(additionalInfo).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, yPosition);
      yPosition += 10;
    });
    
    // Prepare column headers and row data for autoTable
    const tableHeaders = columns.map(col => col.header);
    
    const tableData = reportData.map(item => 
      columns.map(column => {
        const value = typeof item[column.accessor] !== 'undefined' 
          ? item[column.accessor]
          : column.accessor.split('.').reduce((obj, key) => obj && obj[key], item);
          
        // Format numbers as currency if they appear to be monetary values
        if (typeof value === 'number' && 
           (column.header.toLowerCase().includes('revenue') || 
            column.header.toLowerCase().includes('amount') || 
            column.header.toLowerCase().includes('price'))) {
          return `$${value.toLocaleString()}`;
        }
        
        return value;
      })
    );
    
    // Add table
    (doc as any).autoTable({
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Save the PDF
    doc.save(`${filename}-${new Date().toISOString().slice(0,10)}.pdf`);
  };
  
  return (
    <Button variant={variant} onClick={exportToPDF}>
      <FileText className="mr-2 h-4 w-4" /> Export PDF
    </Button>
  );
};
