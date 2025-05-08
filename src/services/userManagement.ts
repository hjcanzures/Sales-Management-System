
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

// Function to fetch all users from Auth table and store in the database
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    // First try to fetch existing users from public.app_users table
    const { data: existingUsers, error: existingUsersError } = await supabase
      .from('app_users')
      .select('*');
    
    if (existingUsersError) {
      console.error("Error fetching users from app_users table:", existingUsersError);
      // Fall back to mock data for development
      return getMockUsers();
    }

    if (existingUsers && existingUsers.length > 0) {
      return existingUsers.map((user) => ({
        id: user.id,
        name: user.name || user.email?.split('@')[0] || "User",
        email: user.email || "",
        role: user.role || "user",
        status: user.status || "active"
      }));
    }
    
    // If no users found, try to sync from Auth and fall back to mock data if needed
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
    
    const { error } = await supabase
      .from('app_users')
      .update({ status: newStatus })
      .eq('id', userId);
    
    if (error) {
      console.error("Error updating user status:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error toggling user status:", error);
    return false;
  }
};

// Function to toggle user role (admin/user)
export const toggleUserRole = async (userId: string, currentRole: string): Promise<boolean> => {
  try {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    const { error } = await supabase
      .from('app_users')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (error) {
      console.error("Error updating user role:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error toggling user role:", error);
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
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // Not found is okay
      console.error("Error checking existing user:", checkError);
      return false;
    }
    
    // If user exists, update their data
    if (existingUser) {
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          email: user.email,
          name: user.name,
          role: user.role || existingUser.role,
          status: user.status || existingUser.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error("Error updating user in database:", updateError);
        return false;
      }
    } else {
      // If user doesn't exist, create new entry
      const { error: insertError } = await supabase
        .from('app_users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: user.role || 'user',
          status: user.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error("Error inserting user in database:", insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in syncUserToDatabase:", error);
    return false;
  }
};
