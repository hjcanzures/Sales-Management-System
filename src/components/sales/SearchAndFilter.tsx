
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const SearchAndFilter = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: SearchAndFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search sales..."
          className="pl-9"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
        >
          <SelectTrigger>
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
