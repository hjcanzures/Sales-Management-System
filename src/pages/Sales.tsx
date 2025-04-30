
import { useState } from "react";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { SalesContainer } from "@/components/sales/SalesContainer";
import { SaleDetailsModal } from "@/components/sales/SaleDetailsModal";
import { NewSaleDialog } from "@/components/NewSaleDialog";
import { useSalesData } from "@/hooks/useSalesData";
import type { Sale } from "@/types";

const Sales = () => {
  // Fix the order of hooks to be consistent
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);
  // useSalesData must be called after all useState hooks
  const { sales, loading, fetchSales } = useSalesData();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const viewSaleDetails = (sale: Sale) => {
    setCurrentSale(sale);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Small delay to ensure modal is fully closed before clearing the data
    setTimeout(() => {
      setCurrentSale(null);
    }, 300);
  };

  const handleNewSale = () => {
    setIsNewSaleDialogOpen(true);
  };

  const handleSaleCreated = () => {
    fetchSales();
    setIsNewSaleDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <SalesHeader onNewSale={handleNewSale} />
      
      <SalesContainer 
        onViewDetails={viewSaleDetails}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilter}
        sales={sales}
        loading={loading}
        onSalesUpdate={fetchSales}
      />

      <SaleDetailsModal
        sale={currentSale}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <NewSaleDialog 
        isOpen={isNewSaleDialogOpen}
        onClose={() => setIsNewSaleDialogOpen(false)}
        onSaleCreated={handleSaleCreated}
      />
    </div>
  );
};

export default Sales;
