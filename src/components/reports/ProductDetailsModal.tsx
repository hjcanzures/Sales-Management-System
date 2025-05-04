
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";
import { PDFExportButton } from "./PDFExportButton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  dateRange?: { from: Date | undefined; to: Date | undefined };
}

interface MonthlySalesData {
  month: string;
  sales: number;
  revenue: number;
}

interface TransactionData {
  transno: string;
  date: string;
  customer: string;
  quantity: number;
  amount: number;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
  product, 
  isOpen, 
  onClose,
  dateRange
}) => {
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!product || !isOpen) return;
      
      setLoading(true);
      
      try {
        // Get sales for this product
        let query = supabase
          .from('salesdetail')
          .select(`
            quantity,
            sales:transno (
              transno,
              salesdate,
              custno,
              customer:custno (custname)
            ),
            product:prodcode (
              description
            )
          `)
          .eq('prodcode', product.prodcode);
        
        // Apply date range filter if provided
        const { data: salesData, error: salesError } = await query;
        
        if (salesError) {
          console.error('Error fetching sales details:', salesError);
          return;
        }

        // Get price history for accurate revenue calculation
        const { data: priceData, error: priceError } = await supabase
          .from('pricehist')
          .select('unitprice, effdate')
          .eq('prodcode', product.prodcode)
          .order('effdate', { ascending: false });
        
        if (priceError) {
          console.error('Error fetching price history:', priceError);
          return;
        }
        
        // Process sales by month
        const monthlyData: Record<string, { sales: number; revenue: number }> = {};
        const transactionsList: TransactionData[] = [];
        
        if (salesData && salesData.length > 0) {
          salesData.forEach(sale => {
            if (sale.sales && sale.sales.salesdate) {
              const saleDate = new Date(sale.sales.salesdate);
              
              // Skip if outside date range
              if (dateRange && dateRange.from && dateRange.to) {
                if (saleDate < dateRange.from || saleDate > dateRange.to) {
                  return;
                }
              }
              
              const monthYear = format(saleDate, 'MMM yyyy');
              
              // Find the price applicable at the time of sale
              const applicablePrice = priceData?.find(price => 
                new Date(price.effdate) <= saleDate
              )?.unitprice || 0;
              
              // Calculate revenue
              const quantity = sale.quantity || 0;
              const revenue = quantity * applicablePrice;
              
              // Aggregate monthly data
              if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { sales: 0, revenue: 0 };
              }
              monthlyData[monthYear].sales += quantity;
              monthlyData[monthYear].revenue += revenue;
              
              // Add to transactions list
              transactionsList.push({
                transno: sale.sales.transno || 'Unknown',
                date: format(saleDate, 'PPP'),
                customer: sale.sales.customer?.custname || 'Unknown',
                quantity: quantity,
                amount: revenue
              });
            }
          });
        }
        
        // Convert to array and sort by date
        const monthlySales = Object.entries(monthlyData)
          .map(([month, data]) => ({
            month,
            sales: data.sales,
            revenue: data.revenue
          }))
          .sort((a, b) => {
            // Sort by date (assuming month is in format "MMM yyyy")
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            return dateA.getTime() - dateB.getTime();
          });
        
        setMonthlySalesData(monthlySales);
        setTransactions(transactionsList);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [product, isOpen, dateRange]);

  if (!product) return null;
  
  // Calculate totals
  const totalSales = monthlySalesData.reduce((sum, data) => sum + data.sales, 0);
  const totalRevenue = monthlySalesData.reduce((sum, data) => sum + data.revenue, 0);
  const averageSalesPerMonth = monthlySalesData.length > 0 ? totalSales / monthlySalesData.length : 0;
  const averageRevenuePerMonth = monthlySalesData.length > 0 ? totalRevenue / monthlySalesData.length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {product.name || product.description || product.prodcode}
          </DialogTitle>
          <DialogDescription>
            Product Code: <span className="font-semibold">{product.prodcode}</span>
            {dateRange?.from && dateRange?.to && (
              <span className="ml-4">
                Date Range: {format(dateRange.from, 'PP')} - {format(dateRange.to, 'PP')}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Sales Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ) : (
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Total Units Sold:</dt>
                        <dd className="font-bold">{totalSales.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Total Revenue:</dt>
                        <dd className="font-bold">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Current Price:</dt>
                        <dd className="font-bold">${product.currentPrice?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Unit:</dt>
                        <dd className="font-medium">{product.unit || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Ranking:</dt>
                        <dd className="font-medium">#{product.rank || "N/A"}</dd>
                      </div>
                    </dl>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Average Monthly</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Average Units per Month:</dt>
                        <dd className="font-bold">{averageSalesPerMonth.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Average Revenue per Month:</dt>
                        <dd className="font-bold">${averageRevenuePerMonth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Months with Sales:</dt>
                        <dd className="font-medium">{monthlySalesData.length || 0}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Transactions:</dt>
                        <dd className="font-medium">{transactions.length}</dd>
                      </div>
                    </dl>
                  )}
                </CardContent>
              </Card>
            </div>

            {loading ? (
              <div className="h-64 w-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            ) : monthlySalesData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlySalesData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === "revenue" ? `$${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : value,
                            name === "revenue" ? "Revenue" : "Units Sold"
                          ]}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="sales" name="Units Sold" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-muted-foreground">No sales data available for this product</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="monthly" className="py-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : monthlySalesData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Sales Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlySalesData.map((data, index) => (
                        <TableRow key={index}>
                          <TableCell>{data.month}</TableCell>
                          <TableCell className="text-right">{data.sales.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${data.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{totalSales.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-muted-foreground">No monthly sales data available for this product</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="transactions" className="py-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell>{transaction.transno}</TableCell>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.customer}</TableCell>
                          <TableCell className="text-right">{transaction.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${transaction.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-muted-foreground">No transactions available for this product</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <PDFExportButton
            reportTitle={`Product Report: ${product.name || product.description || product.prodcode}`}
            reportData={[
              ...monthlySalesData.map(data => ({ 
                type: 'Monthly Data',
                month: data.month, 
                sales: data.sales,
                revenue: data.revenue 
              })),
              ...transactions.map(trans => ({
                type: 'Transaction',
                id: trans.transno,
                date: trans.date,
                customer: trans.customer,
                quantity: trans.quantity,
                amount: trans.amount
              }))
            ]}
            columns={[
              { header: "Data Type", accessor: "type" },
              { header: "Month/ID", accessor: data => data.month || data.id || "" },
              { header: "Sales/Date", accessor: data => data.sales?.toString() || data.date || "" },
              { header: "Revenue/Customer", accessor: data => (typeof data.revenue === 'number' ? `$${data.revenue.toFixed(2)}` : data.customer || "") },
              { header: "Quantity", accessor: data => data.quantity?.toString() || "" },
              { header: "Amount", accessor: data => (typeof data.amount === 'number' ? `$${data.amount.toFixed(2)}` : "") }
            ]}
            filename={`product-report-${product.prodcode}`}
            additionalInfo={{
              "Product": product.name || product.description || product.prodcode,
              "Product Code": product.prodcode,
              "Current Price": product.currentPrice ? `$${product.currentPrice.toFixed(2)}` : "N/A",
              "Total Units Sold": totalSales.toString(),
              "Total Revenue": `$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
            }}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
