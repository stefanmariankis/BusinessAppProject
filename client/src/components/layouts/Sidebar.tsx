import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Receipt,
  FileText,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      queryClient.invalidateQueries();
      navigate("/login");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out.",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { path: "/clients", label: "Clients", icon: <Users className="mr-3 h-5 w-5" /> },
    { path: "/projects", label: "Projects", icon: <FolderKanban className="mr-3 h-5 w-5" /> },
    { path: "/tasks", label: "Tasks", icon: <CheckSquare className="mr-3 h-5 w-5" /> },
    { path: "/invoices", label: "Invoices", icon: <Receipt className="mr-3 h-5 w-5" /> },
    { path: "/contracts", label: "Contracts", icon: <FileText className="mr-3 h-5 w-5" /> },
    { path: "/calendar", label: "Calendar", icon: <Calendar className="mr-3 h-5 w-5" /> },
    { path: "/time-tracker", label: "Time Tracker", icon: <Clock className="mr-3 h-5 w-5" /> },
    { path: "/reports", label: "Reports", icon: <BarChart3 className="mr-3 h-5 w-5" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 h-5 w-5" /> }
  ];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center">
          <div className="rounded-md bg-primary-500 w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">BizFlow</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              location === item.path
                ? "bg-primary-50 text-primary-600" 
                : "text-gray-700 hover:bg-gray-50",
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      
      {/* User Menu */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <Avatar>
            <AvatarImage src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`} />
            <AvatarFallback>{`${user.firstName[0]}${user.lastName[0]}`}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{`${user.firstName} ${user.lastName}`}</p>
            <p className="text-xs font-medium text-gray-500">{user.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="ml-auto text-gray-400 hover:text-gray-500"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-200 md:h-screen flex-col">
        <div className="flex flex-col h-full">
          {sidebarContent}
        </div>
      </aside>
      
      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className={`fixed inset-0 z-40 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="relative flex flex-col w-64 h-full bg-white">
            {sidebarContent}
          </aside>
        </div>
        <button 
          className="fixed bottom-4 right-4 p-3 rounded-full bg-primary-500 text-white shadow-lg z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <span className="text-xl">✕</span> : <span className="text-xl">☰</span>}
        </button>
      </div>
    </>
  );
};

export default Sidebar;
