
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, PriceHistory } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useProductsData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('product')
        .select('prodcode, description, unit');

      if (productsError) {
        throw productsError;
      }

      const processedProducts = await Promise.all(
        (productsData || []).map(async (product) => {
          try {
            // Get latest price
            const { data: priceData, error: priceError } = await supabase
              .from('pricehist')
              .select('unitprice, effdate')
              .eq('prodcode', product.prodcode)
              .order('effdate', { ascending: false })
              .limit(1)
              .single();

            if (priceError && priceError.code !== 'PGRST116') { // PGRST116 is "No rows returned"
              console.error('Error fetching price:', priceError);
            }

            // Get total quantity sold
            const { data: salesData, error: salesError } = await supabase
              .from('salesdetail')
              .select('quantity')
              .eq('prodcode', product.prodcode);

            if (salesError) {
              console.error('Error fetching sales details:', salesError);
            }

            const totalSold = (salesData || []).reduce((sum, detail) => sum + (detail.quantity || 0), 0);
            const revenue = totalSold * (priceData?.unitprice || 0);

            return {
              prodcode: product.prodcode,
              name: product.description,
              description: product.description,
              unit: product.unit,
              currentPrice: priceData?.unitprice || 0,
              sales: totalSold,
              revenue: revenue,
              rank: 0 // Will be calculated after sorting
            } as Product;
          } catch (err) {
            console.error('Error processing product:', err);
            return {
              prodcode: product.prodcode,
              name: product.description,
              description: product.description,
              unit: product.unit,
              currentPrice: 0,
              sales: 0,
              revenue: 0,
              rank: 0
            } as Product;
          }
        })
      );

      // Sort by sales and assign rank
      processedProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
      processedProducts.forEach((product, index) => {
        product.rank = index + 1;
      });

      setProducts(processedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load product data. Please try again.",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, fetchProducts };
};
