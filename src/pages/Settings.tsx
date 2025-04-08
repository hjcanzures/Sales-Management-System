
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

const Settings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    companyName: "Sales Management Inc.",
    email: user?.email || "",
    notifications: {
      email: true,
      sales: true,
      inventory: false,
      reports: true
    },
    display: {
      darkMode: false,
      compactView: false
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = (key: string, subkey: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof prev],
        [subkey]: value
      }
    }));
  };

  const handleSaveGeneral = () => {
    toast({
      title: "Settings updated",
      description: "Your general settings have been saved successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification preferences updated",
      description: "Your notification settings have been saved successfully.",
    });
  };

  const handleSaveAppearance = () => {
    toast({
      title: "Display preferences updated",
      description: "Your appearance settings have been saved successfully.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your preferences and system settings</p>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your account and company settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneral}>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your data storage and exports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Button variant="outline">Export All Data</Button>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Button variant="outline">Backup Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="email-notifications" 
                  checked={formData.notifications.email}
                  onCheckedChange={(checked) => handleToggleChange('notifications', 'email', checked)}
                />
                <Label htmlFor="email-notifications">Email Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="sales-alerts" 
                  checked={formData.notifications.sales}
                  onCheckedChange={(checked) => handleToggleChange('notifications', 'sales', checked)}
                />
                <Label htmlFor="sales-alerts">Sales Alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="inventory-alerts" 
                  checked={formData.notifications.inventory}
                  onCheckedChange={(checked) => handleToggleChange('notifications', 'inventory', checked)}
                />
                <Label htmlFor="inventory-alerts">Inventory Alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="report-notifications" 
                  checked={formData.notifications.reports}
                  onCheckedChange={(checked) => handleToggleChange('notifications', 'reports', checked)}
                />
                <Label htmlFor="report-notifications">Report Notifications</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="dark-mode" 
                  checked={formData.display.darkMode}
                  onCheckedChange={(checked) => handleToggleChange('display', 'darkMode', checked)}
                />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="compact-view" 
                  checked={formData.display.compactView}
                  onCheckedChange={(checked) => handleToggleChange('display', 'compactView', checked)}
                />
                <Label htmlFor="compact-view">Compact View</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAppearance}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
