
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { toast } from "sonner";

export type SupabaseUser = {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    full_name?: string;
    role?: string;
    status?: string;
  };
  created_at: string;
  app_metadata: {
    provider?: string;
  };
}

// Type for app_users table
export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Function to fetch all users from app_users table
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    // Using the function call approach for RPC to avoid typing issues
    const { data, error } = await supabase.functions.invoke('get_app_users') as {
      data: AppUser[] | null;
      error: any;
    };
    
    if (error) {
      console.error("Error fetching users from app_users table:", error);
      // Fall back to mock data for development
      return getMockUsers();
    }

    if (data && data.length > 0) {
      return data.map((user: AppUser) => ({
        id: user.id,
        name: user.name || user.email?.split('@')[0] || "User",
        email: user.email || "",
        role: user.role || "user",
        status: user.status || "active"
      }));
    }
    
    // If no users found, fall back to mock data
    return getMockUsers();
  } catch (error) {
    console.error("Error in fetchAllUsers:", error);
    return getMockUsers();
  }
};

// Function to toggle user status (block/unblock)
export const toggleUserStatus = async (userId: string, currentStatus: string): Promise<boolean> => {
  try {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    
    // Using the function call approach for RPC to avoid typing issues
    const { error } = await supabase.functions.invoke('toggle_user_status', {
      body: { user_id: userId, new_status: newStatus }
    });
    
    if (error) {
      console.error("Error updating user status:", error);
      toast.error("Error updating user status: " + error.message);
      return false;
    }
    
    toast.success(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully`);
    return true;
  } catch (error: any) {
    console.error("Error toggling user status:", error);
    toast.error("Error toggling user status: " + error.message);
    return false;
  }
};

// Function to toggle user role (admin/user)
export const toggleUserRole = async (userId: string, currentRole: string): Promise<boolean> => {
  try {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    // Using the function call approach for RPC to avoid typing issues
    const { error } = await supabase.functions.invoke('toggle_user_role', {
      body: { user_id: userId, new_role: newRole }
    });
    
    if (error) {
      console.error("Error updating user role:", error);
      toast.error("Error updating user role: " + error.message);
      return false;
    }
    
    toast.success(`User role updated to ${newRole} successfully`);
    return true;
  } catch (error: any) {
    console.error("Error toggling user role:", error);
    toast.error("Error toggling user role: " + error.message);
    return false;
  }
};

// Mock users for development
const getMockUsers = (): User[] => {
  return [
    { id: "1", name: "Admin User", email: "admin@example.com", role: "admin", status: "active" },
    { id: "2", name: "Regular User", email: "user@example.com", role: "user", status: "active" },
    { id: "3", name: "Blocked User", email: "blocked@example.com", role: "user", status: "blocked" },
  ];
};

// Function to sync a new user to our app_users table
export const syncUserToDatabase = async (user: {
  id: string;
  email: string;
  name?: string;
  role?: string;
  status?: string;
}): Promise<boolean> => {
  try {
    // Using the function call approach for RPC to avoid typing issues
    const { error } = await supabase.functions.invoke('sync_user_to_database', {
      body: {
        p_id: user.id,
        p_email: user.email,
        p_name: user.name || user.email.split('@')[0],
        p_role: user.role || 'user',
        p_status: user.status || 'active'
      }
    });
    
    if (error) {
      console.error("Error syncing user to database:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in syncUserToDatabase:", error);
    return false;
  }
};
