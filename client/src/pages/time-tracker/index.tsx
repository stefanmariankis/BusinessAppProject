import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TimeEntry, Project, Task, insertTimeEntrySchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Play, Pause, StopCircle, Pencil, Trash2, MoreVertical, Plus, Search, Filter, Clock, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInSeconds, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extend the time entry schema with validations
const timeEntryFormSchema = insertTimeEntrySchema.extend({
  projectId: z.number().optional(),
  taskId: z.number().optional(),
  description: z.string().optional(),
  billable: z.boolean().default(true),
});

type TimeEntryFormValues = z.infer<typeof timeEntryFormSchema>;

const TimeTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntry | null>(null);
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerDescription, setTimerDescription] = useState("");
  const [timerProject, setTimerProject] = useState<number | undefined>(undefined);
  const [timerTask, setTimerTask] = useState<number | undefined>(undefined);
  const [timerBillable, setTimerBillable] = useState(true);
  const [activeTimerEntry, setActiveTimerEntry] = useState<TimeEntry | null>(null);
  const timerStartRef = useRef<Date | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch time entries
  const { data: timeEntries, isLoading: isLoadingTimeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries', { userId: user?.id }],
    enabled: !!user,
  });

  // Fetch projects for dropdown
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  // Fetch tasks for dropdown
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: !!user,
  });

  // Check if there's an active timer (no endTime)
  useEffect(() => {
    if (timeEntries) {
      const activeEntry = timeEntries.find(entry => !entry.endTime && entry.userId === user?.id);
      if (activeEntry) {
        // Resume timer
        setActiveTimerEntry(activeEntry);
        setIsTimerRunning(true);
        setTimerDescription(activeEntry.description || "");
        setTimerProject(activeEntry.projectId || undefined);
        setTimerTask(activeEntry.taskId || undefined);
        setTimerBillable(activeEntry.billable);
        
        // Calculate elapsed seconds
        const start = new Date(activeEntry.startTime);
        const now = new Date();
        const elapsed = differenceInSeconds(now, start);
        setElapsedSeconds(elapsed);
        
        // Start timer
        timerStartRef.current = start;
        startTimerInterval();
      }
    }
  }, [timeEntries, user]);

  // Clean up timer interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Form for adding new time entry
  const addForm = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      userId: user?.id,
      projectId: undefined,
      taskId: undefined,
      description: "",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: 0,
      billable: true,
    },
  });

  // Form for editing time entry
  const editForm = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      userId: user?.id,
      projectId: undefined,
      taskId: undefined,
      description: "",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: 0,
      billable: true,
    },
  });

  // Filter time entries based on search query, date filter, and active tab
  const filteredTimeEntries = timeEntries?.filter(entry => {
    const matchesSearch = entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) || true;
    const matchesDateFilter = dateFilter === "all" || 
                              (dateFilter === "today" && isToday(entry.startTime)) ||
                              (dateFilter === "yesterday" && isYesterday(entry.startTime)) ||
                              (dateFilter === "this-week" && isThisWeek(entry.startTime)) ||
                              (dateFilter === "this-month" && isThisMonth(entry.startTime));
    
    if (activeTab === "all") return matchesSearch && matchesDateFilter;
    if (activeTab === "running") return matchesSearch && !entry.endTime;
    if (activeTab === "billable") return matchesSearch && matchesDateFilter && entry.billable;
    if (activeTab === "non-billable") return matchesSearch && matchesDateFilter && !entry.billable;
    
    return matchesSearch && matchesDateFilter;
  });

  // Date filter helpers
  function isToday(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  function isYesterday(dateString: string) {
    const date = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
  }

  function isThisWeek(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    firstDayOfWeek.setHours(0, 0, 0, 0);
    return date >= firstDayOfWeek;
  }

  function isThisMonth(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    return date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  // Format duration (seconds to HH:MM:SS)
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Format duration for display in table (hours and minutes)
  const formatDurationForDisplay = (seconds: number | null) => {
    if (!seconds) return "00:00";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Start timer interval
  const startTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  // Start timer
  const startTimer = async () => {
    try {
      // Create a new time entry with only startTime
      const response = await apiRequest("POST", "/api/time-entries", {
        userId: user?.id,
        description: timerDescription,
        projectId: timerProject,
        taskId: timerTask,
        startTime: new Date().toISOString(),
        billable: timerBillable
      });
      
      const newEntry = await response.json();
      setActiveTimerEntry(newEntry);
      
      // Start the timer
      setIsTimerRunning(true);
      setElapsedSeconds(0);
      timerStartRef.current = new Date();
      startTimerInterval();
      
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      
      toast({
        title: "Timer started",
        description: "Time tracking has started",
      });
    } catch (error) {
      console.error("Error starting timer:", error);
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  // Stop timer
  const stopTimer = async () => {
    if (!activeTimerEntry) return;
    
    try {
      // Update the time entry with endTime and duration
      const endTime = new Date().toISOString();
      const duration = elapsedSeconds / 3600; // Convert to hours for API
      
      await apiRequest("PUT", `/api/time-entries/${activeTimerEntry.id}`, {
        endTime,
        duration,
        description: timerDescription,
        projectId: timerProject,
        taskId: timerTask,
        billable: timerBillable
      });
      
      // Stop the timer
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      setActiveTimerEntry(null);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      
      toast({
        title: "Timer stopped",
        description: `Time tracked: ${formatDurationForDisplay(elapsedSeconds)}`,
      });
    } catch (error) {
      console.error("Error stopping timer:", error);
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
    }
  };

  // Handle adding a new time entry manually
  const handleAddTimeEntry = async (data: TimeEntryFormValues) => {
    try {
      // Calculate duration from start and end times
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      const durationSeconds = differenceInSeconds(endTime, startTime);
      const durationHours = durationSeconds / 3600; // Convert to hours for API
      
      await apiRequest("POST", "/api/time-entries", {
        ...data,
        userId: user?.id,
        duration: durationHours
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      setIsAddDialogOpen(false);
      addForm.reset();
      
      toast({
        title: "Time entry added",
        description: "The time entry has been added successfully",
      });
    } catch (error) {
      console.error("Error adding time entry:", error);
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive",
      });
    }
  };

  // Handle updating a time entry
  const handleUpdateTimeEntry = async (data: TimeEntryFormValues) => {
    if (!selectedTimeEntry) return;
    
    try {
      // Calculate duration from start and end times
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      const durationSeconds = differenceInSeconds(endTime, startTime);
      const durationHours = durationSeconds / 3600; // Convert to hours for API
      
      await apiRequest("PUT", `/api/time-entries/${selectedTimeEntry.id}`, {
        ...data,
        duration: durationHours
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      setIsEditDialogOpen(false);
      
      toast({
        title: "Time entry updated",
        description: "The time entry has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating time entry:", error);
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a time entry
  const handleDeleteTimeEntry = async () => {
    if (!selectedTimeEntry) return;
    
    try {
      await apiRequest("DELETE", `/api/time-entries/${selectedTimeEntry.id}`, {});
      
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Time entry deleted",
        description: "The time entry has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog and populate form
  const openEditDialog = (timeEntry: TimeEntry) => {
    setSelectedTimeEntry(timeEntry);
    
    // Format dates for datetime-local input
    const startTime = format(new Date(timeEntry.startTime), "yyyy-MM-dd'T'HH:mm");
    const endTime = timeEntry.endTime ? format(new Date(timeEntry.endTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm");
    
    editForm.reset({
      userId: timeEntry.userId,
      projectId: timeEntry.projectId || undefined,
      taskId: timeEntry.taskId || undefined,
      description: timeEntry.description || "",
      startTime,
      endTime,
      duration: timeEntry.duration || 0,
      billable: timeEntry.billable
    });
    
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (timeEntry: TimeEntry) => {
    setSelectedTimeEntry(timeEntry);
    setIsDeleteDialogOpen(true);
  };

  // Get project name by ID
  const getProjectName = (projectId: number | null) => {
    if (!projectId) return "—";
    const project = projects?.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  // Get task name by ID
  const getTaskName = (taskId: number | null) => {
    if (!taskId) return "—";
    const task = tasks?.find(t => t.id === taskId);
    return task ? task.title : "Unknown Task";
  };

  // Calculate total hours for filtered entries
  const calculateTotalHours = () => {
    if (!filteredTimeEntries?.length) return "00:00";
    
    const totalSeconds = filteredTimeEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + (entry.duration * 3600); // Convert hours to seconds
      }
      return total;
    }, 0);
    
    return formatDurationForDisplay(totalSeconds);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
          <CardTitle>Time Tracker</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-stretch">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input 
                placeholder="What are you working on?"
                value={timerDescription}
                onChange={(e) => setTimerDescription(e.target.value)}
                disabled={isTimerRunning}
              />
            </div>
            
            <div className="space-y-2 sm:w-40">
              <label className="text-sm font-medium">Project</label>
              <Select
                value={timerProject?.toString()}
                onValueChange={(value) => setTimerProject(value ? parseInt(value) : undefined)}
                disabled={isTimerRunning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 sm:w-40">
              <label className="text-sm font-medium">Task</label>
              <Select
                value={timerTask?.toString()}
                onValueChange={(value) => setTimerTask(value ? parseInt(value) : undefined)}
                disabled={isTimerRunning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No task</SelectItem>
                  {tasks?.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col justify-end">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox 
                  id="billable" 
                  checked={timerBillable} 
                  onCheckedChange={(checked) => setTimerBillable(!!checked)}
                  disabled={isTimerRunning}
                />
                <label htmlFor="billable" className="text-sm font-medium">Billable</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-xl font-mono font-semibold min-w-[100px] text-center">
                  {formatDuration(elapsedSeconds)}
                </div>
                
                {!isTimerRunning ? (
                  <Button onClick={startTimer} className="flex-1">
                    <Play className="mr-2 h-4 w-4" /> Start
                  </Button>
                ) : (
                  <Button onClick={stopTimer} variant="destructive" className="flex-1">
                    <StopCircle className="mr-2 h-4 w-4" /> Stop
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
          <CardTitle>Time Entries</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="flex space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search entries..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[130px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Entry
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Entries</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="billable">Billable</TabsTrigger>
              <TabsTrigger value="non-billable">Non-Billable</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {isLoadingTimeEntries || isLoadingProjects || isLoadingTasks ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Billable</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTimeEntries && filteredTimeEntries.length > 0 ? (
                        filteredTimeEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{format(new Date(entry.startTime), "MMM d, yyyy")}</TableCell>
                            <TableCell>{entry.description || "—"}</TableCell>
                            <TableCell>{getProjectName(entry.projectId)}</TableCell>
                            <TableCell>{getTaskName(entry.taskId)}</TableCell>
                            <TableCell>{format(new Date(entry.startTime), "HH:mm")}</TableCell>
                            <TableCell>{entry.endTime ? format(new Date(entry.endTime), "HH:mm") : "Running"}</TableCell>
                            <TableCell>
                              {entry.endTime ? formatDurationForDisplay(entry.duration ? entry.duration * 3600 : null) : "—"}
                            </TableCell>
                            <TableCell>
                              {entry.billable ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  Billable
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                  Non-Billable
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openDeleteDialog(entry)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                            {searchQuery || dateFilter !== "all" || activeTab !== "all"
                              ? "No time entries found matching your filters."
                              : "No time entries found. Start tracking your time!"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-4 text-right">
                <div className="text-sm font-medium">
                  Total: <span className="font-semibold">{calculateTotalHours()}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Time Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Time Entry</DialogTitle>
            <DialogDescription>
              Manually add a time entry. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddTimeEntry)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="What did you work on?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select 
                        value={field.value?.toString()} 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No project</SelectItem>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task</FormLabel>
                      <Select 
                        value={field.value?.toString()} 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No task</SelectItem>
                          {tasks?.map((task) => (
                            <SelectItem key={task.id} value={task.id.toString()}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time*</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time*</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
                name="billable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Billable</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Entry</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Time Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>
              Update time entry details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateTimeEntry)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="What did you work on?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select 
                        value={field.value?.toString()} 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No project</SelectItem>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task</FormLabel>
                      <Select 
                        value={field.value?.toString()} 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No task</SelectItem>
                          {tasks?.map((task) => (
                            <SelectItem key={task.id} value={task.id.toString()}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time*</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time*</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="billable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Billable</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Entry</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Time Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteTimeEntry}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimeTracker;
