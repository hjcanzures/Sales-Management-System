
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Sale } from "@/types";

export const useSalesData = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchSales();
  }, []);

  return { sales, loading, fetchSales };
};
