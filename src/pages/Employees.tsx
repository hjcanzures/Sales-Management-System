
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User } from "lucide-react";

interface Employee {
  empno: string;
  firstname: string | null;
  lastname: string | null;
  hiredate: string | null;
  birthdate: string | null;
  gender: string | null;
  sepdate: string | null;
  job?: {
    jobcode: string;
    jobdesc: string | null;
  };
  current_salary?: number | null;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        // Get all employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employee')
          .select('*');

        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          return;
        }

        // For each employee, get the most recent job and salary
        const employeesWithDetails = await Promise.all(employeesData?.map(async (employee) => {
          const { data: jobHistoryData } = await supabase
            .from('jobhistory')
            .select('jobcode, salary, effdate, deptcode')
            .eq('empno', employee.empno)
            .order('effdate', { ascending: false })
            .limit(1);

          let jobDetails = null;
          if (jobHistoryData && jobHistoryData.length > 0) {
            const { data: jobData } = await supabase
              .from('job')
              .select('*')
              .eq('jobcode', jobHistoryData[0].jobcode)
              .single();
            
            jobDetails = jobData;
          }

          return {
            ...employee,
            job: jobDetails,
            current_salary: jobHistoryData && jobHistoryData.length > 0 ? jobHistoryData[0].salary : null
          };
        }) || []);

        setEmployees(employeesWithDetails);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Loading employees...</span>
      </div>
    );
  }

  // Calculate active employees (those without a separation date)
  const activeEmployees = employees.filter(emp => !emp.sepdate);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Employees</h1>
        <p className="text-gray-600 mt-2">Manage your workforce</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
                <h3 className="text-2xl font-bold mt-1">{employees.length}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Employees</p>
                <h3 className="text-2xl font-bold mt-1">{activeEmployees.length}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((employee) => {
                  const fullName = [employee.firstname, employee.lastname].filter(Boolean).join(' ') || 'N/A';
                  const formattedHireDate = employee.hiredate 
                    ? new Date(employee.hiredate).toLocaleDateString() 
                    : 'N/A';
                  const isActive = !employee.sepdate;
                  
                  return (
                    <TableRow key={employee.empno}>
                      <TableCell className="font-medium">{employee.empno}</TableCell>
                      <TableCell>{fullName}</TableCell>
                      <TableCell>{employee.job?.jobdesc || 'N/A'}</TableCell>
                      <TableCell>{formattedHireDate}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No employees found
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

export default Employees;
