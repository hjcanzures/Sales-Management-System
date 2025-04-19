
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NewSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: () => void;
}

export const NewSaleDialog = ({ isOpen, onClose, onSaleCreated }: NewSaleDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState("");
  const [employee, setEmployee] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the transaction number from the database function
      const { data: transnoData, error: transnoError } = await supabase
        .rpc('generate_next_transno');

      if (transnoError) throw transnoError;

      const transno = transnoData;

      // Insert the new sale
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          transno,
          custno: customer,
          empno: employee,
          salesdate: new Date().toISOString().split('T')[0]
        });

      if (saleError) throw saleError;

      toast({
        title: "Success",
        description: `Sale created with transaction number: ${transno}`,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select value={customer} onValueChange={setCustomer} required>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUST001">Customer 1</SelectItem>
                <SelectItem value="CUST002">Customer 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={employee} onValueChange={setEmployee} required>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMP001">Employee 1</SelectItem>
                <SelectItem value="EMP002">Employee 2</SelectItem>
              </SelectContent>
            </Select>
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
