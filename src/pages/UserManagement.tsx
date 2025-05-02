
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock users to manage
const mockUsers = [
  { id: "1", name: "Admin User", email: "admin@example.com", role: "admin", status: "active" },
  { id: "2", name: "Regular User", email: "user@example.com", role: "user", status: "active" },
  { id: "3", name: "Blocked User", email: "blocked@example.com", role: "user", status: "blocked" },
];

const UserManagement = () => {
  const { isAdmin, toggleUserStatus } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [users, setUsers] = useState(mockUsers);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Filter users based on search query and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Sort users based on sort field and direction
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Get the field values for comparison
    const fieldA = a[sortField as keyof typeof a] || "";
    const fieldB = b[sortField as keyof typeof b] || "";
    
    // Compare based on sort direction
    if (sortDirection === "asc") {
      return fieldA.toString().localeCompare(fieldB.toString());
    } else {
      return fieldB.toString().localeCompare(fieldA.toString());
    }
  });

  // Function to handle sorting when a column header is clicked
  const handleSort = (field: string) => {
    if (sortField === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // If sorting by a new field, set it and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle filtering as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      // Any additional filtering logic can go here
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle user status toggle with debounce to prevent freezing
  const handleToggleStatus = (userId: string) => {
    // Set processing state to show loading indicator
    setIsProcessing(userId);
    
    // Simulate API call with slight delay
    setTimeout(() => {
      // Update the user status in our local state
      setUsers(prev => 
        prev.map(user => {
          if (user.id === userId) {
            const newStatus = user.status === 'active' ? 'blocked' : 'active';
            
            toast({
              title: `User ${newStatus === 'active' ? 'unblocked' : 'blocked'}`,
              description: `User ${user.name} has been ${newStatus === 'active' ? 'unblocked' : 'blocked'}.`,
              variant: newStatus === 'active' ? 'default' : 'destructive',
            });
            
            return { ...user, status: newStatus };
          }
          return user;
        })
      );
      
      // Call the auth context method
      toggleUserStatus(userId);
      
      // Clear processing state
      setIsProcessing(null);
    }, 500);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <UsersIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-700">Access Restricted</h1>
        <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600 mt-2">Manage system users and their permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage accounts, roles, and access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-center md:w-2/3">
                <Select 
                  defaultValue="all" 
                  onValueChange={setRoleFilter}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Input 
                    placeholder="Search users..." 
                    className="w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Button>
                <User className="h-4 w-4 mr-2" /> Add New User
              </Button>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort("name")}
                    >
                      Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort("email")}
                    >
                      Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort("role")}
                    >
                      Role {sortField === "role" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort("status")}
                    >
                      Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={user.status === 'active' ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                            onClick={() => handleToggleStatus(user.id)}
                            disabled={isProcessing === user.id}
                          >
                            {isProcessing === user.id ? (
                              "Processing..."
                            ) : user.status === 'active' ? (
                              'Block'
                            ) : (
                              'Unblock'
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {searchQuery ? `No users found matching "${searchQuery}"` : "No users found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
