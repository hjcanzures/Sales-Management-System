
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DesktopSidebar } from "./layout/DesktopSidebar";
import { MobileHeader } from "./layout/MobileHeader";
import { getNavigationItems } from "./layout/NavigationItems";

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
  
  const navItems = getNavigationItems(isAdmin);

  return (
    <div>
      <DesktopSidebar 
        navItems={navItems}
        activeItem={activeItem}
        handleNavigation={handleNavigation}
        handleLogout={handleLogout}
      />
      <MobileHeader 
        navItems={navItems}
        activeItem={activeItem}
        handleNavigation={handleNavigation}
        handleLogout={handleLogout}
      />
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
