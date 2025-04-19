import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Search, Filter, ChevronDown, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { NewSaleDialog } from "@/components/NewSaleDialog";

interface SaleDetail {
  prodcode: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  subtotal?: number;
  product?: {
    description: string;
  };
}

interface Sale {
  transno: string;
  salesdate: string;
  custno: string;
  empno: string;
  customer?: {
    custname: string;
    address: string;
  };
  employee?: {
    firstname: string;
    lastname: string;
    jobposition?: string;
  };
  payment?: {
    amount: number;
    paydate: string;
  };
  salesDetails?: SaleDetail[];
  totalAmount?: number;
  status?: string;
}

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      // Fetch sales with customer and employee information
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          transno,
          salesdate,
          custno,
          empno,
          customer:custno (custname, address),
          employee:empno (firstname, lastname)
        `);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        return;
      }

      // For each sale, fetch payment details
      const salesWithDetails = await Promise.all(
        (salesData || []).map(async (sale) => {
          // Get payment information
          const { data: paymentData } = await supabase
            .from('payment')
            .select('amount, paydate')
            .eq('transno', sale.transno)
            .single();

          // Get sales details with product information
          const { data: detailsData } = await supabase
            .from('salesdetail')
            .select(`
              prodcode,
              quantity,
              product:prodcode (description)
            `)
            .eq('transno', sale.transno);

          // Get pricing information for products
          const salesDetails = await Promise.all(
            (detailsData || []).map(async (detail) => {
              const { data: priceData } = await supabase
                .from('pricehist')
                .select('unitprice')
                .eq('prodcode', detail.prodcode)
                .order('effdate', { ascending: false })
                .limit(1)
                .single();

              const unitPrice = priceData?.unitprice || 0;
              const subtotal = (detail.quantity || 0) * unitPrice;
              const discount = 0; // Default discount

              return {
                ...detail,
                unitPrice,
                subtotal,
                discount
              };
            })
          );

          // Calculate total amount
          const totalAmount = salesDetails.reduce((sum, detail) => sum + (detail.subtotal || 0), 0);

          // Determine status based on payment (simple logic)
          let status = 'pending';
          if (paymentData && paymentData.amount >= totalAmount) {
            status = 'completed';
          } else if (!paymentData) {
            status = 'pending';
          }

          return {
            ...sale,
            payment: paymentData || undefined,
            salesDetails,
            totalAmount,
            status
          };
        })
      );

      setSales(salesWithDetails);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = () => {
    setIsNewSaleDialogOpen(true);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const viewSaleDetails = (sale: Sale) => {
    setCurrentSale(sale);
    setIsModalOpen(true);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Filter sales based on search term and status
  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      searchTerm === "" ||
      sale.transno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customer?.custname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${sale.employee?.firstname || ''} ${sale.employee?.lastname || ''}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || sale.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Loading sales...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-gray-600 mt-1">Manage and view your sales records</p>
        </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNewSale}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sales..."
                className="pl-9"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilter}
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

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.transno}>
                      <TableCell>#{sale.transno}</TableCell>
                      <TableCell>{sale.customer?.custname || 'N/A'}</TableCell>
                      <TableCell>
                        {sale.employee 
                          ? `${sale.employee.firstname || ''} ${sale.employee.lastname || ''}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatDate(sale.salesdate)}
                      </TableCell>
                      <TableCell>
                        {sale.totalAmount !== undefined ? formatCurrency(sale.totalAmount) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sale.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : sale.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => viewSaleDetails(sale)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Edit Sale
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete Sale
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6"
                    >
                      No sales found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sale Details Modal */}
      {currentSale && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Sale Details</DialogTitle>
              <DialogDescription>
                Transaction #{currentSale.transno} details
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Sale Information</h3>
                <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-sm font-medium">Date:</div>
                    <div>{formatDate(currentSale.salesdate)}</div>
                    <div className="text-sm font-medium">Status:</div>
                    <div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          currentSale.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : currentSale.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {currentSale.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium">Payment Date:</div>
                    <div>{currentSale.payment ? formatDate(currentSale.payment.paydate) : 'Not paid'}</div>
                    <div className="text-sm font-medium">Total Amount:</div>
                    <div className="font-bold">
                      {currentSale.totalAmount !== undefined ? formatCurrency(currentSale.totalAmount) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer & Employee</h3>
                <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700">Customer:</div>
                    <div>{currentSale.customer?.custname || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{currentSale.customer?.address || 'No address'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Handled by:</div>
                    <div>
                      {currentSale.employee 
                        ? `${currentSale.employee.firstname || ''} ${currentSale.employee.lastname || ''}`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Products</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentSale.salesDetails?.map((detail) => (
                      <tr key={detail.prodcode}>
                        <td className="px-4 py-3">{detail.product?.description || detail.prodcode}</td>
                        <td className="px-4 py-3">{detail.quantity}</td>
                        <td className="px-4 py-3">{detail.unitPrice !== undefined ? formatCurrency(detail.unitPrice) : 'N/A'}</td>
                        <td className="px-4 py-3 font-medium">{detail.subtotal !== undefined ? formatCurrency(detail.subtotal) : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium">Total:</td>
                      <td className="px-4 py-3 font-bold">
                        {currentSale.totalAmount !== undefined ? formatCurrency(currentSale.totalAmount) : 'N/A'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              <Button>Print Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <NewSaleDialog 
        isOpen={isNewSaleDialogOpen}
        onClose={() => setIsNewSaleDialogOpen(false)}
        onSaleCreated={fetchSales}
      />
    </div>
  );
};

export default Sales;
