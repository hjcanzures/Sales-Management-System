
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopProductsTable } from "@/components/reports/TopProductsTable";
import { TopEmployeesTable } from "@/components/reports/TopEmployeesTable";
import { SalesOverviewReport } from "@/components/reports/SalesOverviewReport";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          View and download performance reports for your business
        </p>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="overview">Sales Overview</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="employees">Top Employees</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="overview" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Sales Overview Report</CardTitle>
                <CardDescription>
                  View your overall sales performance and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesOverviewReport />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="products" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Top Products Report</CardTitle>
                <CardDescription>
                  View your best-selling products by sales volume and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopProductsTable />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="employees" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Top Employees Report</CardTitle>
                <CardDescription>
                  View your top-performing employees by sales volume and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopEmployeesTable />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Reports;
