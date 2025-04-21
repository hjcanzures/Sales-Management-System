
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Json } from "@/integrations/supabase/types";

interface DeletedSale {
  id: string;
  transno: string;
  salesdate: string;
  metadata: Json;
  deleted_at: string;
  custno?: string;
  empno?: string;
}

export const DeletedSalesList = ({ onSaleRestored }: { onSaleRestored: () => void }) => {
  const [deletedSales, setDeletedSales] = useState<DeletedSale[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeletedSales();
  }, []);

  const fetchDeletedSales = async () => {
    const { data, error } = await supabase
      .from('deleted_sales')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch deleted sales",
        variant: "destructive",
      });
      return;
    }

    setDeletedSales(data || []);
  };

  const handleRestore = async (transno: string) => {
    try {
      // Get the deleted sale data
      const { data: saleData } = await supabase
        .from('deleted_sales')
        .select('*')
        .eq('transno', transno)
        .single();

      if (!saleData) throw new Error("Sale not found");

      // Get the deleted sale details
      const { data: detailsData } = await supabase
        .from('deleted_salesdetail')
        .select('*')
        .eq('transno', transno);

      // Get the deleted payment
      const { data: paymentData } = await supabase
        .from('deleted_payment')
        .select('*')
        .eq('transno', transno);

      // Restore the sale
      await supabase.from('sales').insert({
        transno: saleData.transno,
        custno: saleData.custno,
        empno: saleData.empno,
        salesdate: saleData.salesdate
      });

      // Restore the sale details
      if (detailsData && detailsData.length > 0) {
        await supabase.from('salesdetail').insert(
          detailsData.map(({ id, deleted_at, ...detail }) => detail)
        );
      }

      // Restore the payment if it exists
      if (paymentData && paymentData.length > 0) {
        await supabase.from('payment').insert(
          paymentData.map(({ id, deleted_at, ...payment }) => payment)
        );
      }

      // Delete the backup records
      await supabase.from('deleted_sales').delete().eq('transno', transno);
      await supabase.from('deleted_salesdetail').delete().eq('transno', transno);
      await supabase.from('deleted_payment').delete().eq('transno', transno);

      toast({
        title: "Success",
        description: `Sale #${transno} has been restored`,
      });

      onSaleRestored();
      fetchDeletedSales();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (deletedSales.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Recently Deleted Sales</h3>
      <div className="space-y-4">
        {deletedSales.map((sale) => {
          // Safe access to metadata properties
          const customerName = sale.metadata && typeof sale.metadata === 'object' 
            ? (sale.metadata as any)?.customer?.custname || 'Unknown Customer' 
            : 'Unknown Customer';
          
          const employeeName = sale.metadata && typeof sale.metadata === 'object'
            ? `${(sale.metadata as any)?.employee?.firstname || ''} ${(sale.metadata as any)?.employee?.lastname || ''}`.trim() || 'Unknown Employee'
            : 'Unknown Employee';
            
          return (
            <div key={sale.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <div>
                <p className="font-medium">#{sale.transno}</p>
                <p className="text-sm text-gray-600">
                  {customerName} - {formatDate(sale.salesdate)}
                </p>
                <p className="text-xs text-gray-500">
                  Deleted {new Date(sale.deleted_at).toLocaleString()}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => handleRestore(sale.transno)}
              >
                Restore
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
