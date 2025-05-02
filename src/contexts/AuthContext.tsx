
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { users } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";

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

  // Check if user is already logged in from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    // Simulate network request delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user by email in our enhanced users array
    const user = enhancedUsers.find(user => user.email === email);
    
    if (user && password === "password" && user.status === "active") { // Check both password and status
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      setLoading(false);
      return true;
    } else if (user && user.status === "blocked") {
      // Handle blocked user case
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
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
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
