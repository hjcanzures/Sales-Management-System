
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { syncUserToDatabase } from "@/services/userManagement";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  toggleUserStatus: (userId: string) => void;
  toggleUserRole: (userId: string) => void;
}

// Enhanced user mock data with roles and status
const enhancedUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    status: "active"
  },
  {
    id: "2",
    name: "Regular User",
    email: "user@example.com",
    role: "user",
    status: "active"
  },
  {
    id: "3",
    name: "Blocked User",
    email: "blocked@example.com",
    role: "user",
    status: "blocked"
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast: uiToast } = useToast();

  // Check for Supabase session on load
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Get user data from Supabase Auth
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || "User",
            email: session.user.email || "",
            role: session.user.user_metadata.role || "user",
            status: session.user.user_metadata.status || "active",
          };
          
          // Set user state immediately
          setUser(userData);
          
          // After setting user state, sync to database in a setTimeout to avoid auth deadlocks
          setTimeout(async () => {
            try {
              // Sync user to our app_users table
              await syncUserToDatabase({
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
                status: userData.status,
              });
              
              // Now fetch the latest user data from our app_users table
              const { data: appUser, error: appUserError } = await supabase
                .from('app_users')
                .select('*')
                .eq('id', userData.id)
                .single();
              
              if (appUserError) {
                console.error("Error fetching app_user:", appUserError);
              } else if (appUser) {
                // Update user state with data from app_users table (which may include status changes)
                setUser({
                  ...userData,
                  role: appUser.role || userData.role,
                  status: appUser.status || userData.status
                });
                
                // Check if user is blocked
                if (appUser.status === 'blocked') {
                  toast.error("Your account has been blocked. Please contact an administrator.");
                  await supabase.auth.signOut();
                  setUser(null);
                }
              }
            } catch (error) {
              console.error("Error syncing user to database:", error);
            }
          }, 0);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || "User",
          email: session.user.email || "",
          role: session.user.user_metadata.role || "user",
          status: "active",
        };
        
        setUser(userData);
        
        // After setting user state, sync to database in a setTimeout to avoid auth deadlocks
        setTimeout(async () => {
          try {
            // Sync user to our app_users table
            await syncUserToDatabase({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              status: userData.status,
            });
            
            // Now fetch the latest user data from our app_users table
            const { data: appUser, error: appUserError } = await supabase
              .from('app_users')
              .select('*')
              .eq('id', userData.id)
              .single();
            
            if (appUserError) {
              console.error("Error fetching app_user:", appUserError);
            } else if (appUser) {
              // Update user state with data from app_users table (which may include status changes)
              setUser({
                ...userData,
                role: appUser.role || userData.role,
                status: appUser.status || userData.status
              });
              
              // Check if user is blocked
              if (appUser.status === 'blocked') {
                toast.error("Your account has been blocked. Please contact an administrator.");
                await supabase.auth.signOut();
                setUser(null);
              }
            }
          } catch (error) {
            console.error("Error syncing user to database:", error);
          }
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login function that works with Supabase and falls back to mock data
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Try Supabase authentication first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log("Supabase auth failed, falling back to mock auth:", error.message);
        
        // Fall back to mock authentication for demo purposes
        const user = enhancedUsers.find(user => user.email === email);
        
        if (user && password === "password" && user.status === "active") {
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          toast.success("Welcome back, " + user.name + "!");
          setLoading(false);
          return true;
        } else if (user && user.status === "blocked") {
          toast.error("Account blocked. Please contact an administrator.");
          setLoading(false);
          return false;
        } else {
          toast.error("Invalid email or password");
          setLoading(false);
          return false;
        }
      }

      // Supabase auth success
      if (data.user) {
        // We'll check app_users table for user status in the onAuthStateChange listener
        toast.success(`Welcome back, ${data.user.user_metadata.full_name || data.user.email?.split('@')[0] || "User"}!`);
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Also clear local storage (for mock auth)
      localStorage.removeItem("user");
      
      setUser(null);
      
      toast.success("You have been successfully logged out");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message);
    }
  };

  // Function to toggle user status (block/unblock)
  const toggleUserStatus = async (userId: string) => {
    try {
      if (user && user.id === userId) {
        toast.error("You cannot block your own account");
        return;
      }
      
      // Get current user status
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('status')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error("Error fetching user status:", userError);
        toast.error("Failed to toggle user status");
        return;
      }
      
      const currentStatus = userData?.status || 'active';
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
      
      // Update status in app_users table
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Error updating user status:", updateError);
        toast.error("Failed to toggle user status");
        return;
      }
      
      toast.success(`User has been ${newStatus === 'active' ? 'unblocked' : 'blocked'}`);
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      toast.error(error.message);
    }
  };

  // Function to toggle user role (admin/user)
  const toggleUserRole = async (userId: string) => {
    try {
      // Get current user role
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error("Error fetching user role:", userError);
        toast.error("Failed to toggle user role");
        return;
      }
      
      const currentRole = userData?.role || 'user';
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      // Update role in app_users table
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Error updating user role:", updateError);
        toast.error("Failed to toggle user role");
        return;
      }
      
      // If the current user is being toggled, update their role in Supabase Auth metadata
      if (user && user.id === userId) {
        try {
          await supabase.auth.updateUser({
            data: { role: newRole }
          });
          
          // Update local user state
          setUser({
            ...user,
            role: newRole
          });
        } catch (error) {
          console.error("Error updating auth user metadata:", error);
        }
      }
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      console.error("Error toggling user role:", error);
      toast.error(error.message);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    toggleUserStatus,
    toggleUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
