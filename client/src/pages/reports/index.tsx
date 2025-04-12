import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";

// Types for report data
interface RevenueData {
  month: string;
  income: number;
  expenses: number;
}

interface ProjectData {
  name: string;
  hours: number;
  value: number;
}

interface ClientData {
  name: string;
  revenue: number;
  value: number;
}

interface TimeData {
  name: string;
  billable: number;
  nonBillable: number;
}

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("revenue");
  const [dateRange, setDateRange] = useState("this-month");
  const [customStartDate, setCustomStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  
  // Fetch needed data based on report type
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['/api/clients'],
    enabled: !!user,
  });
  
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });
  
  const { data: timeEntries, isLoading: isLoadingTimeEntries } = useQuery({
    queryKey: ['/api/time-entries'],
    enabled: !!user,
  });
  
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/invoices'],
    enabled: !!user,
  });
  
  // Helper function to get start and end dates based on date range selection
  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (dateRange) {
      case "this-month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "last-month":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case "last-3-months":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "last-6-months":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "this-year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case "custom":
        start = new Date(customStartDate);
        end = new Date(customEndDate);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }
    
    return { start, end };
  };
  
  // Generate revenue data for chart
  const generateRevenueData = (): RevenueData[] => {
    if (!invoices) return [];
    
    const { start, end } = getDateRange();
    const months: { [key: string]: RevenueData } = {};
    
    // Initialize months in range
    let currentMonth = new Date(start);
    while (currentMonth <= end) {
      const monthKey = format(currentMonth, "yyyy-MM");
      months[monthKey] = {
        month: format(currentMonth, "MMM yyyy"),
        income: 0,
        expenses: 0
      };
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }
    
    // Add income from invoices
    invoices.forEach(invoice => {
      const invoiceDate = parseISO(invoice.issueDate);
      if (invoiceDate >= start && invoiceDate <= end && invoice.status === "paid") {
        const monthKey = format(invoiceDate, "yyyy-MM");
        if (months[monthKey]) {
          months[monthKey].income += invoice.total;
        }
      }
    });
    
    // Add some mock expenses data for demonstration
    Object.keys(months).forEach(monthKey => {
      months[monthKey].expenses = months[monthKey].income * 0.4; // Just a dummy calculation
    });
    
    return Object.values(months);
  };
  
  // Generate project data for chart
  const generateProjectData = (): ProjectData[] => {
    if (!projects || !timeEntries) return [];
    
    const { start, end } = getDateRange();
    const projectStats: { [key: number]: ProjectData } = {};
    
    // Initialize projects
    projects.forEach(project => {
      projectStats[project.id] = {
        name: project.name,
        hours: 0,
        value: 0
      };
    });
    
    // Add hours from time entries
    timeEntries.forEach(entry => {
      const entryDate = parseISO(entry.startTime);
      if (entryDate >= start && entryDate <= end && entry.projectId && entry.duration) {
        if (projectStats[entry.projectId]) {
          projectStats[entry.projectId].hours += entry.duration;
          if (entry.billable) {
            // Assume an average hourly rate of €50 for demonstration
            projectStats[entry.projectId].value += entry.duration * 50;
          }
        }
      }
    });
    
    // Filter out projects with no hours and sort by hours
    return Object.values(projectStats)
      .filter(project => project.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  };
  
  // Generate client data for chart
  const generateClientData = (): ClientData[] => {
    if (!clients || !invoices) return [];
    
    const { start, end } = getDateRange();
    const clientStats: { [key: number]: ClientData } = {};
    
    // Initialize clients
    clients.forEach(client => {
      clientStats[client.id] = {
        name: client.name,
        revenue: 0,
        value: 0
      };
    });
    
    // Add revenue from invoices
    invoices.forEach(invoice => {
      const invoiceDate = parseISO(invoice.issueDate);
      if (invoiceDate >= start && invoiceDate <= end && invoice.status === "paid") {
        if (clientStats[invoice.clientId]) {
          clientStats[invoice.clientId].revenue += invoice.total;
          clientStats[invoice.clientId].value = clientStats[invoice.clientId].revenue; // For pie chart
        }
      }
    });
    
    // Filter out clients with no revenue and sort by revenue
    return Object.values(clientStats)
      .filter(client => client.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  };
  
  // Generate time data for chart
  const generateTimeData = (): TimeData[] => {
    if (!timeEntries) return [];
    
    const { start, end } = getDateRange();
    const months: { [key: string]: TimeData } = {};
    
    // Initialize months in range
    let currentMonth = new Date(start);
    while (currentMonth <= end) {
      const monthKey = format(currentMonth, "yyyy-MM");
      months[monthKey] = {
        name: format(currentMonth, "MMM yyyy"),
        billable: 0,
        nonBillable: 0
      };
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }
    
    // Add hours from time entries
    timeEntries.forEach(entry => {
      const entryDate = parseISO(entry.startTime);
      if (entryDate >= start && entryDate <= end && entry.duration) {
        const monthKey = format(entryDate, "yyyy-MM");
        if (months[monthKey]) {
          if (entry.billable) {
            months[monthKey].billable += entry.duration;
          } else {
            months[monthKey].nonBillable += entry.duration;
          }
        }
      }
    });
    
    return Object.values(months);
  };
  
  // Generate data based on selected report type
  const getReportData = () => {
    switch (reportType) {
      case "revenue":
        return generateRevenueData();
      case "projects":
        return generateProjectData();
      case "clients":
        return generateClientData();
      case "time":
        return generateTimeData();
      default:
        return [];
    }
  };
  
  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];
  
  // Handle exporting report
  const handleExportReport = () => {
    toast({
      title: "Export started",
      description: "Your report is being prepared for download.",
    });
    
    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: "Your report has been exported successfully.",
      });
    }, 1500);
  };
  
  // Calculate summary stats
  const calculateSummaryStats = () => {
    const { start, end } = getDateRange();
    
    // Revenue stats
    const totalRevenue = invoices
      ? invoices
          .filter(invoice => 
            parseISO(invoice.issueDate) >= start && 
            parseISO(invoice.issueDate) <= end && 
            invoice.status === "paid"
          )
          .reduce((sum, invoice) => sum + invoice.total, 0)
      : 0;
    
    // Time stats
    let billableHours = 0;
    let nonBillableHours = 0;
    
    if (timeEntries) {
      timeEntries.forEach(entry => {
        const entryDate = parseISO(entry.startTime);
        if (entryDate >= start && entryDate <= end && entry.duration) {
          if (entry.billable) {
            billableHours += entry.duration;
          } else {
            nonBillableHours += entry.duration;
          }
        }
      });
    }
    
    // Project stats
    const activeProjects = projects
      ? projects.filter(project => project.status === "in_progress").length
      : 0;
    
    // Client stats
    const activeClients = new Set();
    if (invoices) {
      invoices.forEach(invoice => {
        const invoiceDate = parseISO(invoice.issueDate);
        if (invoiceDate >= start && invoiceDate <= end) {
          activeClients.add(invoice.clientId);
        }
      });
    }
    
    return {
      totalRevenue,
      billableHours,
      nonBillableHours,
      activeProjects,
      activeClients: activeClients.size
    };
  };
  
  const summaryStats = calculateSummaryStats();
  const isLoading = isLoadingClients || isLoadingProjects || isLoadingTimeEntries || isLoadingInvoices;
  
  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
          <CardTitle>Reports</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold">€{summaryStats.totalRevenue.toFixed(2)}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Billable Hours</p>
                <h3 className="text-2xl font-bold">{summaryStats.billableHours.toFixed(1)}h</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Active Projects</p>
                <h3 className="text-2xl font-bold">{summaryStats.activeProjects}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Active Clients</p>
                <h3 className="text-2xl font-bold">{summaryStats.activeClients}</h3>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue & Expenses</SelectItem>
                  <SelectItem value="projects">Project Analysis</SelectItem>
                  <SelectItem value="clients">Client Analysis</SelectItem>
                  <SelectItem value="time">Time Analysis</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[200px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === "custom" && (
              <div className="flex space-x-2">
                <div>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center">to</div>
                <div>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <div className="h-80">
              {reportType === "revenue" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getReportData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${value}`} />
                    <Legend />
                    <Bar dataKey="income" name="Revenue" fill="#0070f3" />
                    <Bar dataKey="expenses" name="Expenses" fill="#ff4c4c" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {reportType === "projects" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getReportData()}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(value, name) => name === "hours" ? `${value}h` : `€${value}`} />
                    <Legend />
                    <Bar dataKey="hours" name="Hours" fill="#0070f3" />
                    <Bar dataKey="value" name="Value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {reportType === "clients" && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getReportData()}
                      nameKey="name"
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {getReportData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              {reportType === "time" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getReportData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
                    <Legend />
                    <Bar dataKey="billable" name="Billable Hours" fill="#10B981" />
                    <Bar dataKey="nonBillable" name="Non-Billable Hours" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Detailed Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="revenue">
            <TabsList className="mb-4">
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
            </TabsList>
            
            <TabsContent value="revenue">
              <p className="text-sm text-gray-500 mb-4">
                Revenue for the selected period: <span className="font-semibold">€{summaryStats.totalRevenue.toFixed(2)}</span>
              </p>
              
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generateRevenueData().map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.month}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{item.income.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{item.expenses.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{(item.income - item.expenses).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="projects">
              <p className="text-sm text-gray-500 mb-4">
                Total hours tracked on projects: <span className="font-semibold">{(summaryStats.billableHours + summaryStats.nonBillableHours).toFixed(1)}h</span>
              </p>
              
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generateProjectData().map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hours.toFixed(1)}h</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{item.value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="clients">
              <p className="text-sm text-gray-500 mb-4">
                Active clients in period: <span className="font-semibold">{summaryStats.activeClients}</span>
              </p>
              
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generateClientData().map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{item.revenue.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(item.revenue / summaryStats.totalRevenue * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="time">
              <p className="text-sm text-gray-500 mb-4">
                Billable hours: <span className="font-semibold">{summaryStats.billableHours.toFixed(1)}h</span> | 
                Non-billable hours: <span className="font-semibold">{summaryStats.nonBillableHours.toFixed(1)}h</span>
              </p>
              
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billable Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non-Billable Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generateTimeData().map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.billable.toFixed(1)}h</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nonBillable.toFixed(1)}h</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(item.billable + item.nonBillable).toFixed(1)}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};

export default Reports;
