
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface SalesHeaderProps {
  onNewSale: () => void;
}

export const SalesHeader = ({ onNewSale }: SalesHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-bold">Sales</h1>
        <p className="text-gray-600 mt-1">Manage and view your sales records</p>
      </div>
      <Button className="bg-blue-600 hover:bg-blue-700" onClick={onNewSale}>
        <PlusCircle className="mr-2 h-4 w-4" />
        New Sale
      </Button>
    </div>
  );
};
