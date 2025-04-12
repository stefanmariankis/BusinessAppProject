import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/stats/StatCard";
import TaskList from "@/components/tasks/TaskList";
import RecentActivity from "@/components/activities/RecentActivity";
import UpcomingEvents from "@/components/calendar/UpcomingEvents";
import ProjectStatus from "@/components/projects/ProjectStatus";
import FinancialSummary from "@/components/financials/FinancialSummary";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  FolderKanban, 
  Receipt, 
  EuroIcon
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user,
  });

  // Fetch upcoming tasks
  const { data: upcomingTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/tasks/upcoming'],
    enabled: !!user,
  });

  // Fetch recent activities
  const { data: recentActivities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/activities', { limit: 5 }],
    enabled: !!user,
  });

  // Fetch upcoming events
  const { data: upcomingEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/events/upcoming'],
    enabled: !!user,
  });

  // Fetch projects and clients for project status
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['/api/clients'],
    enabled: !!user,
  });

  // Prepare financial data for the FinancialSummary component
  const financialData = {
    revenue: dashboardStats?.revenue || 0,
    outstandingInvoices: dashboardStats?.pendingInvoiceCount ? dashboardStats.pendingInvoiceCount * 2000 : 0, // Just for demo
    expenses: dashboardStats?.revenue ? Math.floor(dashboardStats.revenue * 0.4) : 0, // Just for demo
    profitMargin: dashboardStats?.revenue ? 60 : 0, // Just for demo
    monthlyChange: 12, // Just for demo
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6">
              <Skeleton className="h-10 w-10 rounded-md mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Clients"
              value={dashboardStats?.clientCount || 0}
              icon={<Users className="h-5 w-5" />}
              iconBgColor="bg-primary-100"
              iconColor="text-primary-600"
              linkText="View all"
              linkHref="/clients"
            />
            
            <StatCard
              title="Active Projects"
              value={dashboardStats?.activeProjectCount || 0}
              icon={<FolderKanban className="h-5 w-5" />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
              linkText="View all"
              linkHref="/projects"
            />
            
            <StatCard
              title="Pending Invoices"
              value={dashboardStats?.pendingInvoiceCount || 0}
              icon={<Receipt className="h-5 w-5" />}
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
              linkText="View all"
              linkHref="/invoices"
            />
            
            <StatCard
              title="Revenue (MTD)"
              value={`€${dashboardStats?.revenue.toLocaleString() || 0}`}
              icon={<EuroIcon className="h-5 w-5" />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              linkText="View report"
              linkHref="/reports"
            />
          </>
        )}
      </div>
      
      {/* Main Dashboard Content */}
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-12">
        {/* Upcoming Tasks */}
        <div className="md:col-span-7">
          {isLoadingTasks ? (
            <div className="bg-white shadow rounded-lg p-6">
              <Skeleton className="h-8 w-56 mb-4" />
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="py-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <TaskList tasks={upcomingTasks || []} />
          )}
        </div>
        
        {/* Recent Activity & Calendar */}
        <div className="md:col-span-5 space-y-5">
          {isLoadingActivities ? (
            <div className="bg-white shadow rounded-lg p-6">
              <Skeleton className="h-8 w-56 mb-4" />
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="py-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <RecentActivity activities={recentActivities || []} />
          )}
          
          {isLoadingEvents ? (
            <div className="bg-white shadow rounded-lg p-6">
              <Skeleton className="h-8 w-56 mb-4" />
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="py-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <UpcomingEvents events={upcomingEvents || []} />
          )}
        </div>
      </div>
      
      {/* Project Status & Financials */}
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-12">
        {/* Project Status */}
        <div className="md:col-span-7">
          {isLoadingProjects || isLoadingClients ? (
            <div className="bg-white shadow rounded-lg p-6">
              <Skeleton className="h-8 w-56 mb-4" />
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="py-3">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full mr-4" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ProjectStatus projects={projects || []} clients={clients || []} />
          )}
        </div>
        
        {/* Financial Summary */}
        <div className="md:col-span-5">
          {isLoadingStats ? (
            <div className="bg-white shadow rounded-lg p-6">
              <Skeleton className="h-8 w-56 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-5 w-16 mb-4" />
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <FinancialSummary financialData={financialData} />
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
