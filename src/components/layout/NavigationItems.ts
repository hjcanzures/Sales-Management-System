
import { 
  LucideHome, 
  Users, 
  Package, 
  ShoppingCart, 
  User, 
  BarChart3,
  Settings,
  UserCog
} from "lucide-react";

export const getNavigationItems = (isAdmin: boolean) => {
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
  return isAdmin 
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
};
