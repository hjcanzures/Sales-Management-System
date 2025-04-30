
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Customer, Employee, Product } from "@/types";

interface NewSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: () => void;
}

export const NewSaleDialog = ({ isOpen, onClose, onSaleCreated }: NewSaleDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ prodcode: string; quantity: number }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  
  const { toast } = useToast();

  // Fetch customers, employees and products on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const { data: customerData, error: customerError } = await supabase
          .from('customer')
          .select('custno, custname, address');
        
        if (customerError) throw customerError;
        setCustomers(customerData || []);

        // Fetch employees
        const { data: employeeData, error: employeeError } = await supabase
          .from('employee')
          .select('empno, firstname, lastname');
        
        if (employeeError) throw employeeError;
        setEmployees(employeeData || []);

        // Fetch products with latest prices
        const { data: productData, error: productError } = await supabase
          .from('product')
          .select('prodcode, description, unit');
        
        if (productError) throw productError;
        setProducts(productData || []);

      } catch (error: any) {
        toast({
          title: "Error fetching data",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, []);

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, { prodcode: "", quantity: 1 }]);
  };

  const updateProductSelection = (index: number, prodcode: string, quantity: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index] = { prodcode, quantity };
    setSelectedProducts(newProducts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the transaction number
      const { data: transnoData, error: transnoError } = await supabase
        .rpc('generate_next_transno');

      if (transnoError) throw transnoError;

      // Insert the new sale
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          transno: transnoData,
          custno: selectedCustomer,
          empno: selectedEmployee,
          salesdate: new Date().toISOString().split('T')[0]
        });

      if (saleError) throw saleError;

      // Insert sale details
      const salesDetails = selectedProducts.map(product => ({
        transno: transnoData,
        prodcode: product.prodcode,
        quantity: product.quantity
      }));

      const { error: detailsError } = await supabase
        .from('salesdetail')
        .insert(salesDetails);

      if (detailsError) throw detailsError;

      toast({
        title: "Success",
        description: `Sale created with transaction number: ${transnoData}`,
      });

      onSaleCreated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.custno} value={customer.custno || ""}>
                        {customer.custname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.empno} value={employee.empno || ""}>
                        {`${employee.firstname} ${employee.lastname}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Products</Label>
              {selectedProducts.map((selectedProduct, index) => (
                <div key={index} className="flex gap-4">
                  <Select
                    value={selectedProduct.prodcode}
                    onValueChange={(value) => updateProductSelection(index, value, selectedProduct.quantity)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.prodcode} value={product.prodcode || ""}>
                          {product.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={selectedProduct.quantity}
                    onChange={(e) => updateProductSelection(index, selectedProduct.prodcode, parseInt(e.target.value) || 0)}
                    className="w-24"
                    placeholder="Qty"
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addProduct}>
                Add Product
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
