import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, UsersIcon, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from "@/types";
import { fetchAllUsers } from "@/services/userManagement";

const UserManagement = () => {
  const { isAdmin, toggleUserStatus, toggleUserRole } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [users, setUsers] = useState<UserType[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users from our app_users table
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await fetchAllUsers();
      setUsers(fetchedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    loadUsers();
    
    // Set up subscription to user changes
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_users' },
        () => {
          // Refresh users list when any changes occur to the app_users table
          loadUsers();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter users based on search query and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchQuery.toLowerCase()));
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

  // Handle user status toggle
  const handleToggleStatus = (userId: string) => {
    // Set processing state to show loading indicator
    setIsProcessing(userId);
    
    // Update user status
    toggleUserStatus(userId);
    
    // Update the user status in our local state
    setUsers(prev => 
      prev.map(user => {
        if (user.id === userId) {
          return { ...user, status: user.status === 'active' ? 'blocked' : 'active' };
        }
        return user;
      })
    );
    
    // Clear processing state
    setTimeout(() => {
      setIsProcessing(null);
    }, 500);
  };

  // Handle opening the edit dialog
  const handleOpenEditDialog = (user: UserType) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  // Handle role toggle
  const handleToggleRole = (userId: string) => {
    setIsProcessing(userId);
    
    // Update user role
    toggleUserRole(userId);
    
    // Update the user role in our local state
    setUsers(prev => 
      prev.map(user => {
        if (user.id === userId) {
          return { ...user, role: user.role === 'admin' ? 'user' : 'admin' };
        }
        return user;
      })
    );
    
    // Close dialog and clear processing state
    setDialogOpen(false);
    setTimeout(() => {
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
              <Button onClick={loadUsers}>
                <User className="h-4 w-4 mr-2" /> Refresh Users
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : sortedUsers.length > 0 ? (
                    sortedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'admin' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                              {user.role}
                            </span>
                          </div>
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenEditDialog(user)}
                            >
                              Edit
                            </Button>
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
                    ))
                  ) : (
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

      {/* Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update role and permissions for this user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="font-medium">User Information</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="font-medium text-right">Name:</div>
                  <div className="col-span-3">{selectedUser.name}</div>
                  
                  <div className="font-medium text-right">Email:</div>
                  <div className="col-span-3">{selectedUser.email}</div>
                  
                  <div className="font-medium text-right">Status:</div>
                  <div className="col-span-3">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  
                  <div className="font-medium text-right">Role:</div>
                  <div className="col-span-3">
                    <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                      selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedUser.role === 'admin' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Role Management</h3>
                <p className="text-sm text-gray-500">
                  {selectedUser.role === 'admin' 
                    ? "Demote this user to a regular user. This will remove administrative privileges." 
                    : "Promote this user to an admin. This will grant full administrative privileges."}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            {selectedUser && (
              <Button 
                onClick={() => handleToggleRole(selectedUser.id)}
                variant={selectedUser.role === 'admin' ? "destructive" : "default"}
                disabled={isProcessing === selectedUser.id}
              >
                {isProcessing === selectedUser.id ? (
                  "Processing..."
                ) : selectedUser.role === 'admin' ? (
                  <>
                    <ShieldX className="h-4 w-4 mr-2" />
                    Demote to User
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Promote to Admin
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
