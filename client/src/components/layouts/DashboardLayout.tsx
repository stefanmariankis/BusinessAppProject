import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Extract current page title from location
  const getPageTitle = () => {
    const path = location.substring(1);
    if (path === "") return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 font-sans antialiased text-gray-800">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, check your business overview.
            </p>
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
