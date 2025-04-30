
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SearchAndFilter } from "@/components/sales/SearchAndFilter";
import { SalesTable } from "@/components/sales/SalesTable";
import { DeletedSalesList } from "@/components/sales/DeletedSalesList";
import type { Sale } from "@/types";

interface SalesContainerProps {
  onViewDetails: (sale: Sale) => void;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sales: Sale[];
  loading: boolean;
  onSalesUpdate: () => void;
}

export const SalesContainer = ({
  onViewDetails,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sales,
  loading,
  onSalesUpdate
}: SalesContainerProps) => {
  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      searchTerm === "" ||
      (sale.transno?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (sale.customer?.custname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${sale.employee?.firstname || ''} ${sale.employee?.lastname || ''}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || sale.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Loading sales...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales List</CardTitle>
      </CardHeader>
      <CardContent>
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
        
        <SalesTable
          sales={filteredSales}
          onViewDetails={onViewDetails}
          onSaleDeleted={onSalesUpdate}
        />

        <DeletedSalesList onSaleRestored={onSalesUpdate} />
      </CardContent>
    </Card>
  );
};
