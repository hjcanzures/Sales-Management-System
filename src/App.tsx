
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/Auth/SignUp";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Protected Route Component
interface ProtectedRouteProps {
  element: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ element, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Layout>{element}</Layout>;
};

// Initialize QueryClient
const queryClient = new QueryClient();

// App component with routes
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/sales" element={<ProtectedRoute element={<Sales />} />} />
            <Route path="/customers" element={<ProtectedRoute element={<Customers />} />} />
            <Route path="/products" element={<ProtectedRoute element={<Products />} />} />
            <Route path="/employees" element={<ProtectedRoute element={<Employees />} />} />
            <Route path="/reports" element={<ProtectedRoute element={<Reports />} />} />
            <Route path="/users" element={<ProtectedRoute element={<UserManagement />} adminOnly={true} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
