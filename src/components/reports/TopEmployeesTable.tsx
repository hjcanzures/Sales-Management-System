
import { useMemo, useState } from "react";
import { useEmployeesData } from "@/hooks/useEmployeesData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PDFExportButton } from "@/components/reports/PDFExportButton";
import { Employee } from "@/types";

export const TopEmployeesTable = () => {
  const { employees, loading } = useEmployeesData();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"sales" | "revenue">("revenue");
  const [limit, setLimit] = useState("10");

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    // Filter by search term
    let filtered = employees.filter((employee) =>
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.empno?.toString().includes(searchTerm.toLowerCase())
    );
    
    // Sort employees
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "sales") {
        return (b.sales || 0) - (a.sales || 0);
      }
      return (b.revenue || 0) - (a.revenue || 0);
    });
    
    // Apply limit
    const limitValue = parseInt(limit, 10);
    if (limitValue > 0) {
      filtered = filtered.slice(0, limitValue);
    }
    
    return filtered;
  }, [employees, searchTerm, sortBy, limit]);

  // Generate data for PDF export
  const generatePdfData = (employees: Employee[]) => {
    const headers = ["Rank", "Employee ID", "Employee Name", "Sales Count", "Revenue", "Hire Date"];
    
    const data = employees.map((employee, index) => [
      (index + 1).toString(),
      employee.empno?.toString() || "",
      employee.name || "",
      employee.sales?.toString() || "0",
      formatCurrency(employee.revenue || 0),
      employee.hireDate ? formatDate(employee.hireDate.toString()) : "N/A",
    ]);
    
    return { headers, data };
  };

  const { headers, data } = useMemo(() => 
    generatePdfData(filteredEmployees), [filteredEmployees]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="max-w-sm">
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-32">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as "sales" | "revenue")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="sales">Sales Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger>
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
                <SelectItem value="100">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <PDFExportButton
            title="Top Employees Report"
            filename="top-employees-report"
            headers={headers}
            data={data}
            orientation="landscape"
            action="download"
          />
          <PDFExportButton
            title="Top Employees Report"
            filename="top-employees-report"
            headers={headers}
            data={data}
            orientation="landscape"
            action="print"
            variant="default"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Sales Count</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Hire Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Loading employees data...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee, index) => (
                <TableRow key={employee.empno}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{employee.empno}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell className="text-right">{employee.sales}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(employee.revenue || 0)}
                  </TableCell>
                  <TableCell>
                    {employee.hireDate 
                      ? formatDate(employee.hireDate.toString())
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
