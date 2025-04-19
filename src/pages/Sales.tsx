
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewSaleDialog } from "@/components/NewSaleDialog";
import { SearchAndFilter } from "@/components/sales/SearchAndFilter";
import { SalesTable } from "@/components/sales/SalesTable";
import { SaleDetailsModal } from "@/components/sales/SaleDetailsModal";
import type { Sale } from "@/types";

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          transno,
          salesdate,
          custno,
          empno,
          customer:custno (custname, address),
          employee:empno (firstname, lastname)
        `);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        return;
      }

      const salesWithDetails = await Promise.all(
        (salesData || []).map(async (sale) => {
          const { data: paymentData } = await supabase
            .from('payment')
            .select('amount, paydate')
            .eq('transno', sale.transno)
            .single();

          const { data: detailsData } = await supabase
            .from('salesdetail')
            .select(`
              prodcode,
              quantity,
              product:prodcode (description)
            `)
            .eq('transno', sale.transno);

          const salesDetails = await Promise.all(
            (detailsData || []).map(async (detail) => {
              const { data: priceData } = await supabase
                .from('pricehist')
                .select('unitprice')
                .eq('prodcode', detail.prodcode)
                .order('effdate', { ascending: false })
                .limit(1)
                .single();

              const unitPrice = priceData?.unitprice || 0;
              const subtotal = (detail.quantity || 0) * unitPrice;
              const discount = 0;

              return {
                ...detail,
                unitPrice,
                subtotal,
                discount
              };
            })
          );

          const totalAmount = salesDetails.reduce((sum, detail) => sum + (detail.subtotal || 0), 0);

          let status = 'pending';
          if (paymentData && paymentData.amount >= totalAmount) {
            status = 'completed';
          } else if (!paymentData) {
            status = 'pending';
          }

          return {
            ...sale,
            payment: paymentData || undefined,
            salesDetails,
            totalAmount,
            status
          } as Sale;
        })
      );

      setSales(salesWithDetails);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = () => {
    setIsNewSaleDialogOpen(true);
  };

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-gray-600 mt-1">Manage and view your sales records</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNewSale}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilter}
          />
          
          <SalesTable
            sales={filteredSales}
            onViewDetails={viewSaleDetails}
          />
        </CardContent>
      </Card>

      <SaleDetailsModal
        sale={currentSale}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <NewSaleDialog 
        isOpen={isNewSaleDialogOpen}
        onClose={() => setIsNewSaleDialogOpen(false)}
        onSaleCreated={fetchSales}
      />
    </div>
  );
};

export default Sales;
