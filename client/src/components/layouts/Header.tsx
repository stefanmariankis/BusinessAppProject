import { useState, useEffect } from "react";
import { Search, Bell, Globe, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { user, setUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!user) return null;

  const handleLanguageChange = async (language: "en" | "ro") => {
    try {
      // Update the user's language preference
      const updatedUser = await apiRequest("PUT", `/api/users/${user.id}`, {
        language
      });
      
      setUser({ ...user, language });
      
      // Update the document language
      document.documentElement.lang = language;
      
      toast({
        title: "Language updated",
        description: language === "en" ? "Language set to English" : "Limba a fost setată la Română",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update language preference",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white shadow-sm z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <button 
            type="button" 
            className="md:hidden text-gray-500 hover:text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Search */}
          <div className="max-w-lg w-full lg:max-w-xs hidden md:block ml-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                id="search" 
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500" 
                placeholder="Search..." 
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Right section */}
          <div className="flex items-center space-x-4">
            <div className="flex">
              <button 
                type="button" 
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    type="button" 
                    className="p-1 ml-3 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Language</span>
                    <Globe className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange("ro")}>
                    Română
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
