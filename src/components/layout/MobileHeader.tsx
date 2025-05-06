
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { NavItem } from "./NavItem";
import { UserProfile } from "./UserProfile";

interface MobileHeaderProps {
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

export const MobileHeader = ({ 
  navItems,
  activeItem,
  handleNavigation,
  handleLogout
}: MobileHeaderProps) => {
  return (
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
                    <NavItem 
                      key={item.id} 
                      item={item} 
                      activeItem={activeItem} 
                      mobile 
                      onClick={handleNavigation} 
                    />
                  ))}
                </ul>
              </div>
              <div className="border-t py-4">
                <div className="px-3">
                  <UserProfile onLogout={handleLogout} />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
