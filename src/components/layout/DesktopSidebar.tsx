
import { NavItem } from "./NavItem";
import { UserProfile } from "./UserProfile";

interface DesktopSidebarProps {
  navItems: Array<{
    name: string;
    icon: React.ReactNode;
    path: string;
    id: string;
  }>;
  activeItem: string;
  handleNavigation: (path: string, item: string) => void;
  handleLogout: () => void;
}

export const DesktopSidebar = ({ 
  navItems,
  activeItem,
  handleNavigation,
  handleLogout
}: DesktopSidebarProps) => {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-sales-700">Sales Management</h1>
          </div>
          <div className="mt-8 flex-1 px-2 space-y-1">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <NavItem 
                  key={item.id} 
                  item={item} 
                  activeItem={activeItem} 
                  onClick={handleNavigation} 
                />
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <UserProfile onLogout={handleLogout} />
        </div>
      </div>
    </div>
  );
};
