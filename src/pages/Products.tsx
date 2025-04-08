
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package } from "lucide-react";

interface Product {
  prodcode: string;
  description: string | null;
  unit: string | null;
  current_price?: number | null;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // First get all products
        const { data: productsData, error: productsError } = await supabase
          .from('product')
          .select('*');

        if (productsError) {
          console.error('Error fetching products:', productsError);
          return;
        }

        // For each product, get the most recent price
        const productsWithPrices = await Promise.all(productsData?.map(async (product) => {
          const { data: priceData } = await supabase
            .from('pricehist')
            .select('unitprice')
            .eq('prodcode', product.prodcode)
            .order('effdate', { ascending: false })
            .limit(1);

          return {
            ...product,
            current_price: priceData && priceData.length > 0 ? priceData[0].unitprice : null
          };
        }) || []);

        setProducts(productsWithPrices);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-gray-600 mt-2">Manage your product catalog</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <h3 className="text-2xl font-bold mt-1">{products.length}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Current Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.prodcode}>
                    <TableCell className="font-medium">{product.prodcode}</TableCell>
                    <TableCell>{product.description || 'N/A'}</TableCell>
                    <TableCell>{product.unit || 'N/A'}</TableCell>
                    <TableCell>
                      {product.current_price !== null 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(product.current_price))
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
