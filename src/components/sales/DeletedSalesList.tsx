
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

interface CustomerMetadata {
  custname?: string;
  address?: string;
  [key: string]: any;
}

interface EmployeeMetadata {
  firstname?: string;
  lastname?: string;
  [key: string]: any;
}

interface SaleMetadata {
  customer?: CustomerMetadata;
  employee?: EmployeeMetadata;
  [key: string]: any;
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

  const getCustomerName = (metadata: Json): string => {
    if (metadata && typeof metadata === 'object') {
      const saleMetadata = metadata as SaleMetadata;
      return saleMetadata?.customer?.custname || 'Unknown Customer';
    }
    return 'Unknown Customer';
  };

  const getEmployeeName = (metadata: Json): string => {
    if (metadata && typeof metadata === 'object') {
      const saleMetadata = metadata as SaleMetadata;
      const firstName = saleMetadata?.employee?.firstname || '';
      const lastName = saleMetadata?.employee?.lastname || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown Employee';
    }
    return 'Unknown Employee';
  };

  const handleRestore = async (transno: string) => {
    try {
      // Get the deleted sale data
      const { data: saleData, error: saleError } = await supabase
        .from('deleted_sales')
        .select('*')
        .eq('transno', transno)
        .single();

      if (saleError || !saleData) {
        throw new Error(saleError?.message || "Sale not found");
      }

      // Get the deleted sale details
      const { data: detailsData, error: detailsError } = await supabase
        .from('deleted_salesdetail')
        .select('*')
        .eq('transno', transno);

      if (detailsError) {
        throw detailsError;
      }

      // Get the deleted payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('deleted_payment')
        .select('*')
        .eq('transno', transno);

      if (paymentError) {
        throw paymentError;
      }

      // Begin restoration process - first insert the sale
      const { error: insertSaleError } = await supabase.from('sales').insert({
        transno: saleData.transno,
        custno: saleData.custno,
        empno: saleData.empno,
        salesdate: saleData.salesdate
      });

      if (insertSaleError) {
        throw insertSaleError;
      }

      // Restore the sale details if they exist
      if (detailsData && detailsData.length > 0) {
        const detailsToInsert = detailsData.map(({ id, deleted_at, ...detail }) => ({
          transno: detail.transno,
          prodcode: detail.prodcode,
          quantity: detail.quantity
        }));

        const { error: insertDetailsError } = await supabase
          .from('salesdetail')
          .insert(detailsToInsert);

        if (insertDetailsError) {
          throw insertDetailsError;
        }
      }

      // Restore the payment if it exists
      if (paymentData && paymentData.length > 0) {
        const paymentsToInsert = paymentData.map(({ id, deleted_at, ...payment }) => ({
          orno: payment.orno,
          transno: payment.transno,
          paydate: payment.paydate,
          amount: payment.amount
        }));

        const { error: insertPaymentError } = await supabase
          .from('payment')
          .insert(paymentsToInsert);

        if (insertPaymentError) {
          throw insertPaymentError;
        }
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
      console.error("Restore error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to restore sale",
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
        {deletedSales.map((sale) => (
          <div key={sale.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
            <div>
              <p className="font-medium">#{sale.transno}</p>
              <p className="text-sm text-gray-600">
                {getCustomerName(sale.metadata)} - {formatDate(sale.salesdate)}
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
        ))}
      </div>
    </div>
  );
};
