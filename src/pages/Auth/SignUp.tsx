
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SignUp = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const { toast } = useToast();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);
  const toggleConfirmPasswordVisibility = () => setIsConfirmPasswordVisible(!isConfirmPasswordVisible);

  // Define form validation schema
  const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    username: z.string().min(3, { message: "Username must be at least 3 characters." })
      .regex(/^[a-z0-9_-]+$/, { message: "Username can only contain lowercase letters, numbers, underscores, and hyphens." }),
    email: authMethod === "email" ? z.string().email({ message: "Please enter a valid email address." }) : z.string().optional(),
    phone: authMethod === "phone" ? z.string().regex(/^\+?[1-9]\d{9,14}$/, { message: "Please enter a valid phone number." }) : z.string().optional(),
    password: z.string().min(8, { message: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
      .regex(/[0-9]/, { message: "Password must contain at least one number." }),
    confirmPassword: z.string()
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  }).refine(
    data => {
      if (authMethod === "email") return !!data.email;
      if (authMethod === "phone") return !!data.phone;
      return true;
    },
    {
      message: authMethod === "email" ? "Email is required" : "Phone number is required",
      path: [authMethod]
    }
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: ""
    }
  });

  const handleSignUp = async (values: FormValues) => {
    setLoading(true);

    try {
      // Prepare auth credentials based on auth method
      const authCredentials = authMethod === "email" 
        ? { email: values.email, password: values.password }
        : { phone: values.phone, password: values.password };

      // Create user metadata
      const metadata = {
        full_name: values.name,
        username: values.username
      };

      // Sign up with Supabase
      const { error, data } = await supabase.auth.signUp({
        ...authCredentials,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (error) throw error;

      // Show different messages for email vs phone verification
      if (authMethod === "email") {
        toast({
          title: "Registration successful",
          description: "Please check your email to confirm your account.",
        });
      } else {
        toast({
          title: "Registration successful",
          description: "Please check your phone for the verification code.",
        });
      }

      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sales-700">Sales Management System</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Enter your details to create an account</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignUp)}>
              <CardContent className="space-y-4">
                {/* Authentication Method Tabs */}
                <Tabs 
                  defaultValue="email" 
                  value={authMethod} 
                  onValueChange={(value) => setAuthMethod(value as "email" | "phone")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="phone">Phone</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="mt-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="name@example.com" 
                              type="email" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="phone" className="mt-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1234567890" 
                              type="tel" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
                
                {/* Full Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Username Field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                          <Input placeholder="johndoe" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={isPasswordVisible ? "text" : "password"} 
                            placeholder="••••••••" 
                            {...field}
                          />
                          <button 
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                            onClick={togglePasswordVisibility}
                          >
                            {isPasswordVisible ? 
                              <EyeOff className="h-4 w-4" /> : 
                              <Eye className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={isConfirmPasswordVisible ? "text" : "password"} 
                            placeholder="••••••••" 
                            {...field}
                          />
                          <button 
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                            onClick={toggleConfirmPasswordVisibility}
                          >
                            {isConfirmPasswordVisible ? 
                              <EyeOff className="h-4 w-4" /> : 
                              <Eye className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create account"}
                </Button>
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
                    Sign in
                  </Button>
                </p>
              </CardFooter>
            </form>
          </Form>
        </Card>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Demo Credentials:</p>
          <p>Email: admin@example.com | Password: password</p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
