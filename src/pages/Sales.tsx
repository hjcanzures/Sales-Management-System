
import { useState } from "react";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { SalesContainer } from "@/components/sales/SalesContainer";
import { SaleDetailsModal } from "@/components/sales/SaleDetailsModal";
import { NewSaleDialog } from "@/components/NewSaleDialog";
import { useSalesData } from "@/hooks/useSalesData";
import type { Sale } from "@/types";

const Sales = () => {
  const { sales, loading, fetchSales } = useSalesData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);

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

      {isModalOpen && (
        <SaleDetailsModal
          sale={currentSale}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      <NewSaleDialog 
        isOpen={isNewSaleDialogOpen}
        onClose={() => setIsNewSaleDialogOpen(false)}
        onSaleCreated={handleSaleCreated}
      />
    </div>
  );
};

export default Sales;
