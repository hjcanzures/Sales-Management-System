
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  item: {
    name: string;
    icon: React.ReactNode;
    path: string;
    id: string;
  };
  activeItem: string;
  mobile?: boolean;
  onClick: (path: string, id: string) => void;
}

export const NavItem = ({ item, activeItem, mobile = false, onClick }: NavItemProps) => (
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
      onClick={() => onClick(item.path, item.id)}
    >
      {item.icon}
      <span className={mobile ? "ml-3" : "ml-3"}>{item.name}</span>
    </Button>
  </li>
);
