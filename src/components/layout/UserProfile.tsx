
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface UserProfileProps {
  onLogout: () => void;
}

export const UserProfile = ({ onLogout }: UserProfileProps) => {
  const { user } = useAuth();
  
  // Get display name from user object
  const displayName = user?.name || user?.email?.split('@')[0] || "User";
  
  return (
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
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
