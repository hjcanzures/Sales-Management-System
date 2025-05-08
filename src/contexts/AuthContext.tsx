
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { users } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  toggleUserStatus: (userId: string) => void;
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
  const { toast } = useToast();

  // Check for Supabase session on load
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || "User",
            email: session.user.email || "",
            role: session.user.user_metadata.role || "user",
            status: "active",
            username: session.user.user_metadata.username || "",
          };
          setUser(userData);
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
          name: session.user.user_metadata.full_name || "User",
          email: session.user.email || "",
          role: session.user.user_metadata.role || "user",
          status: "active",
          username: session.user.user_metadata.username || "",
        };
        setUser(userData);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fallback to mock login if Supabase auth fails or for demo purposes
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
          toast({
            title: "Login successful",
            description: `Welcome back, ${user.name}!`,
          });
          setLoading(false);
          return true;
        } else if (user && user.status === "blocked") {
          toast({
            title: "Account blocked",
            description: "Your account has been blocked. Please contact an administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return false;
        } else {
          toast({
            title: "Login failed",
            description: "Invalid email or password",
            variant: "destructive",
          });
          setLoading(false);
          return false;
        }
      }

      // Supabase auth success
      if (data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.user_metadata.full_name || "User",
          email: data.user.email || "",
          role: data.user.user_metadata.role || "user",
          status: "active",
          username: data.user.user_metadata.username || "",
        };
        setUser(userData);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${userData.name}!`,
        });
        
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login error",
        description: error.message,
        variant: "destructive",
      });
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
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Logout error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Function to toggle user status (block/unblock)
  const toggleUserStatus = (userId: string) => {
    const updatedUsers = enhancedUsers.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === "active" ? "blocked" : "active";
        return { ...u, status: newStatus };
      }
      return u;
    });
    
    // Update our enhancedUsers array
    for (let i = 0; i < enhancedUsers.length; i++) {
      if (enhancedUsers[i].id === userId) {
        enhancedUsers[i].status = enhancedUsers[i].status === "active" ? "blocked" : "active";
        break;
      }
    }
    
    // If the current user is being toggled, update their status
    if (user && user.id === userId) {
      const updatedUser = { ...user, status: user.status === "active" ? "blocked" : "active" };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    
    toast({
      title: "User status updated",
      description: `User has been ${enhancedUsers.find(u => u.id === userId)?.status === "active" ? "unblocked" : "blocked"}`,
    });
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    toggleUserStatus,
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
