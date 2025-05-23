import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Sale } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useSalesData = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSales = useCallback(async () => {
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
        throw salesError;
      }

      const processedSales = await Promise.all(
        (salesData || []).map(async (sale) => {
          try {
            // Get payment data
            const { data: paymentData, error: paymentError } = await supabase
              .from('payment')
              .select('amount, paydate')
              .eq('transno', sale.transno)
              .maybeSingle(); // Use maybeSingle instead of single to avoid errors

            if (paymentError && paymentError.code !== 'PGRST116') { // PGRST116 is "No rows returned"
              console.error('Error fetching payment:', paymentError);
            }

            // Get sales details
            const { data: detailsData, error: detailsError } = await supabase
              .from('salesdetail')
              .select(`
                prodcode,
                quantity,
                product:prodcode (description)
              `)
              .eq('transno', sale.transno);

            if (detailsError) {
              console.error('Error fetching sales details:', detailsError);
              return null;
            }

            // Calculate sale totals with price data
            const salesDetails = await Promise.all(
              (detailsData || []).map(async (detail) => {
                try {
                  const { data: priceData, error: priceError } = await supabase
                    .from('pricehist')
                    .select('unitprice')
                    .eq('prodcode', detail.prodcode)
                    .order('effdate', { ascending: false })
                    .limit(1)
                    .maybeSingle(); // Use maybeSingle instead of single

                  if (priceError && priceError.code !== 'PGRST116') {
                    console.error('Error fetching price:', priceError);
                  }

                  const unitPrice = priceData?.unitprice || 0;
                  const subtotal = (detail.quantity || 0) * unitPrice;

                  return {
                    ...detail,
                    unitPrice,
                    subtotal,
                    discount: 0
                  };
                } catch (err) {
                  console.error('Error processing sale detail:', err);
                  return {
                    ...detail,
                    unitPrice: 0,
                    subtotal: 0,
                    discount: 0
                  };
                }
              })
            );

            const totalAmount = salesDetails.reduce((sum, detail) => sum + (detail.subtotal || 0), 0);

            // Determine status based on payment
            let status = 'pending';
            if (paymentData && paymentData.amount >= totalAmount) {
              status = 'completed';
            }

            return {
              ...sale,
              payment: paymentData || undefined,
              salesDetails,
              totalAmount,
              status
            } as Sale;
          } catch (err) {
            console.error('Error processing sale:', err);
            return null;
          }
        })
      );

      // Filter out any null items from failed processing
      const validSales = processedSales.filter(Boolean) as Sale[];
      setSales(validSales);
      
      console.log('Fetched sales data:', validSales.length, 'records');
    } catch (error: any) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data. Please try again.",
        variant: "destructive",
      });
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSales();
    
    // Set up a refresh interval to keep data in sync
    const intervalId = setInterval(() => {
      fetchSales();
    }, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [fetchSales]);

  return { sales, loading, fetchSales };
};
