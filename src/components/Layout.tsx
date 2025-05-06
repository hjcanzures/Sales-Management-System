
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { 
  LucideHome, 
  Users, 
  Package, 
  ShoppingCart, 
  User, 
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("dashboard");
  
  const handleNavigation = (path: string, item: string) => {
    navigate(path);
    setActiveItem(item);
  };
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  
  // Get display name from user object
  const displayName = user?.name || user?.username || "User";
  
  // Base navigation items for all users
  const baseNavItems = [
    {
      name: "Dashboard",
      icon: <LucideHome className="h-5 w-5" />,
      path: "/dashboard",
      id: "dashboard"
    },
    {
      name: "Sales",
      icon: <ShoppingCart className="h-5 w-5" />,
      path: "/sales",
      id: "sales"
    },
    {
      name: "Reports",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/reports",
      id: "reports"
    },
    {
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings",
      id: "settings"
    }
  ];
  
  // Add User Management for admin users only
  const navItems = isAdmin 
    ? [
        ...baseNavItems,
        {
          name: "User Management",
          icon: <UserCog className="h-5 w-5" />,
          path: "/users",
          id: "users"
        }
      ]
    : baseNavItems;
  
  const NavItem = ({ item, mobile = false }: { item: typeof navItems[0], mobile?: boolean }) => (
    <li>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start",
          activeItem === item.id 
            ? "bg-sales-50 text-sales-700 font-medium" 
            : "text-gray-600 hover:bg-sales-50 hover:text-sales-700",
          mobile ? "px-3 py-2" : "px-3 py-2"
        )}
        onClick={() => handleNavigation(item.path, item.id)}
      >
        {item.icon}
        <span className={mobile ? "ml-3" : "ml-3"}>{item.name}</span>
      </Button>
    </li>
  );

  // Desktop sidebar
  const DesktopSidebar = () => (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-sales-700">Sales Management</h1>
          </div>
          <div className="mt-8 flex-1 px-2 space-y-1">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <Avatar>
                <AvatarFallback className="bg-sales-600 text-white">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{displayName}</p>
                <p className="text-xs font-medium text-gray-500">{user?.role || "user"}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto text-gray-500 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile header with hamburger
  const MobileHeader = () => (
    <div className="md:hidden bg-white border-b border-gray-200">
      <div className="px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-sales-700">Sales Management</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col h-full">
              <div className="py-4 border-b">
                <h2 className="text-lg font-bold text-sales-700">Sales Management</h2>
              </div>
              <div className="flex-1 py-4 overflow-auto">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <NavItem key={item.id} item={item} mobile />
                  ))}
                </ul>
              </div>
              <div className="border-t py-4">
                <div className="flex items-center px-3">
                  <Avatar>
                    <AvatarFallback className="bg-sales-600 text-white">
                      {displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{displayName}</p>
                    <p className="text-xs font-medium text-gray-500">{user?.role || "user"}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto text-gray-500 hover:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  return (
    <div>
      <DesktopSidebar />
      <MobileHeader />
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
