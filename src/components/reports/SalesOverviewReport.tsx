
import { useMemo } from "react";
import { useSalesData } from "@/hooks/useSalesData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import { PDFExportButton } from "@/components/reports/PDFExportButton";

export const SalesOverviewReport = () => {
  const { sales, loading } = useSalesData();

  // Calculate summary statistics
  const summaryData = useMemo(() => {
    if (!sales || sales.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        completedSales: 0,
        pendingSales: 0,
        completionRate: 0
      };
    }

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const averageOrderValue = totalRevenue / totalSales;
    const completedSales = sales.filter(sale => sale.status === 'completed').length;
    const pendingSales = sales.filter(sale => sale.status === 'pending').length;
    const completionRate = (completedSales / totalSales) * 100;

    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      completedSales,
      pendingSales,
      completionRate
    };
  }, [sales]);

  // Monthly sales data for charts
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySales = Array(12).fill(0);
    const monthlyRevenue = Array(12).fill(0);

    if (sales && sales.length > 0) {
      sales.forEach(sale => {
        if (sale.salesdate) {
          const date = new Date(sale.salesdate);
          const month = date.getMonth();
          monthlySales[month]++;
          monthlyRevenue[month] += (sale.totalAmount || 0);
        }
      });
    }

    return months.map((month, i) => ({
      name: month,
      sales: monthlySales[i],
      revenue: monthlyRevenue[i],
    }));
  }, [sales]);

  // Status distribution data
  const statusData = useMemo(() => {
    if (!sales || sales.length === 0) {
      return [
        { name: "Completed", value: 0 },
        { name: "Pending", value: 0 }
      ];
    }

    const completed = sales.filter(sale => sale.status === 'completed').length;
    const pending = sales.filter(sale => sale.status === 'pending').length;

    return [
      { name: "Completed", value: completed },
      { name: "Pending", value: pending }
    ];
  }, [sales]);

  // Generate data for PDF export
  const generatePdfData = () => {
    const headers = ["Metric", "Value"];
    
    const data = [
      ["Total Sales", summaryData.totalSales.toString()],
      ["Total Revenue", formatCurrency(summaryData.totalRevenue)],
      ["Average Order Value", formatCurrency(summaryData.averageOrderValue)],
      ["Completed Sales", summaryData.completedSales.toString()],
      ["Pending Sales", summaryData.pendingSales.toString()],
      ["Completion Rate", `${summaryData.completionRate.toFixed(1)}%`],
    ];
    
    return { headers, data };
  };

  const { headers, data } = useMemo(() => generatePdfData(), [summaryData]);

  if (loading) {
    return <div className="py-10 text-center">Loading sales data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <PDFExportButton
          title="Sales Overview Report"
          filename="sales-overview-report"
          headers={headers}
          data={data}
          action="download"
        />
        <PDFExportButton
          title="Sales Overview Report"
          filename="sales-overview-report"
          headers={headers}
          data={data}
          action="print"
          variant="default"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData.averageOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Sales Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={monthlyData}
              index="name"
              categories={["revenue"]}
              colors={["#9b87f5"]}
              valueFormatter={(value) => formatCurrency(value)}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales Status</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={statusData}
              index="name"
              categories={["value"]}
              colors={["#9b87f5", "#e11d48"]}
              valueFormatter={(value) => `${value} sales`}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={monthlyData}
            index="name"
            categories={["sales"]}
            colors={["#9b87f5"]}
            valueFormatter={(value) => `${value} sales`}
            className="h-[300px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};
