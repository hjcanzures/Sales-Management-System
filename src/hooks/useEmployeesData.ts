
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Employee, Sale } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useEmployeesData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data: employeeData, error: employeeError } = await supabase
        .from('employee')
        .select('empno, firstname, lastname, hiredate');

      if (employeeError) {
        throw employeeError;
      }

      const processedEmployees = await Promise.all(
        (employeeData || []).map(async (employee) => {
          try {
            // Get sales associated with this employee
            const { data: salesData, error: salesError } = await supabase
              .from('sales')
              .select('transno')
              .eq('empno', employee.empno);

            if (salesError) {
              console.error('Error fetching sales:', salesError);
            }

            const salesCount = (salesData || []).length;
            
            // Calculate revenue from sales
            let totalRevenue = 0;
            for (const sale of (salesData || [])) {
              // Get sales details for each sale
              const { data: detailsData, error: detailsError } = await supabase
                .from('salesdetail')
                .select('prodcode, quantity')
                .eq('transno', sale.transno);
              
              if (detailsError) {
                console.error('Error fetching sales details:', detailsError);
                continue;
              }
              
              // Calculate revenue for each sale detail
              for (const detail of (detailsData || [])) {
                // Get price for the product
                const { data: priceData, error: priceError } = await supabase
                  .from('pricehist')
                  .select('unitprice')
                  .eq('prodcode', detail.prodcode)
                  .order('effdate', { ascending: false })
                  .limit(1)
                  .single();
                
                if (priceError && priceError.code !== 'PGRST116') {
                  console.error('Error fetching price:', priceError);
                  continue;
                }
                
                totalRevenue += (detail.quantity || 0) * (priceData?.unitprice || 0);
              }
            }

            return {
              empno: employee.empno,
              firstname: employee.firstname,
              lastname: employee.lastname,
              name: `${employee.firstname || ''} ${employee.lastname || ''}`.trim(),
              hireDate: employee.hiredate ? new Date(employee.hiredate) : undefined,
              sales: salesCount,
              revenue: totalRevenue
            } as Employee;
          } catch (err) {
            console.error('Error processing employee:', err);
            return {
              empno: employee.empno,
              firstname: employee.firstname,
              lastname: employee.lastname,
              name: `${employee.firstname || ''} ${employee.lastname || ''}`.trim(),
              hireDate: employee.hiredate ? new Date(employee.hiredate) : undefined,
              sales: 0,
              revenue: 0
            } as Employee;
          }
        })
      );

      setEmployees(processedEmployees);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employee data. Please try again.",
        variant: "destructive",
      });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { employees, loading, fetchEmployees };
};
