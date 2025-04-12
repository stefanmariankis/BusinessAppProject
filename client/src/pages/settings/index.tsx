import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t, setLanguage } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Profile form schema 
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Notification settings schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  projectUpdates: z.boolean().default(true),
  taskAssignments: z.boolean().default(true),
  invoiceReminders: z.boolean().default(true),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

const Settings = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      projectUpdates: true,
      taskAssignments: true,
      invoiceReminders: true,
    },
  });

  // Handle profile update
  const handleProfileUpdate = async (data: ProfileFormValues) => {
    if (!user) return;
    
    try {
      const response = await apiRequest("PUT", `/api/users/${user.id}`, data);
      const updatedUser = await response.json();
      
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (data: PasswordFormValues) => {
    if (!user) return;
    
    try {
      await apiRequest("POST", "/api/auth/change-password", {
        userId: user.id,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      passwordForm.reset();
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: "Failed to update password. Check your current password.",
        variant: "destructive",
      });
    }
  };

  // Handle notification settings update
  const handleNotificationUpdate = async (data: NotificationFormValues) => {
    if (!user) return;
    
    try {
      // This is just a mock for now - in a real app, you'd send this to a backend API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    }
  };

  // Handle language change
  const handleLanguageChange = async (language: 'en' | 'ro') => {
    if (!user) return;
    
    try {
      await apiRequest("PUT", `/api/users/${user.id}`, {
        language
      });
      
      setLanguage(language);
      
      toast({
        title: "Language updated",
        description: `Language changed to ${language === 'en' ? 'English' : 'Romanian'}`,
      });
    } catch (error) {
      console.error("Error updating language:", error);
      toast({
        title: "Error",
        description: "Failed to update language setting",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t('settings')}</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
              <TabsTrigger value="password">{t('security')}</TabsTrigger>
              <TabsTrigger value="notifications">{t('notifications')}</TabsTrigger>
              <TabsTrigger value="preferences">{t('language')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit">Save Changes</Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="password">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit">Update Password</Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(handleNotificationUpdate)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium leading-6">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium leading-6">Project Updates</h3>
                        <p className="text-sm text-gray-500">Get notified when projects are updated</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="projectUpdates"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium leading-6">Task Assignments</h3>
                        <p className="text-sm text-gray-500">Get notified when tasks are assigned to you</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="taskAssignments"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium leading-6">Invoice Reminders</h3>
                        <p className="text-sm text-gray-500">Get notified about invoice deadlines</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="invoiceReminders"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit">Save Preferences</Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="preferences">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium leading-6 mb-2">Language</h3>
                  <Select
                    defaultValue={user?.language || "en"}
                    onValueChange={(value) => handleLanguageChange(value as 'en' | 'ro')}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ro">Romanian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium leading-6 mb-2">Theme</h3>
                  <p className="text-sm text-gray-500 mb-4">Choose your preferred theme</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">Light</Button>
                    <Button variant="outline" className="flex-1">Dark</Button>
                    <Button variant="outline" className="flex-1">System</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};

export default Settings;