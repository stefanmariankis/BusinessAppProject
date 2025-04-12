import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Event, Client, Project, insertEventSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isSameMonth, isSameDay, parseISO } from "date-fns";

// Extend the event schema with validations
const eventFormSchema = insertEventSchema.extend({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  allDay: z.boolean().default(false),
  clientId: z.number().optional(),
  projectId: z.number().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const Calendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewEventDialogOpen, setIsViewEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch events
  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    enabled: !!user,
  });

  // Fetch clients for dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    enabled: !!user,
  });

  // Fetch projects for dropdown
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  // Form for adding new event
  const addForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: selectedDate ? `${format(selectedDate, "yyyy-MM-dd")}T09:00` : `${format(new Date(), "yyyy-MM-dd")}T09:00`,
      endTime: selectedDate ? `${format(selectedDate, "yyyy-MM-dd")}T10:00` : `${format(new Date(), "yyyy-MM-dd")}T10:00`,
      allDay: false,
      clientId: undefined,
      projectId: undefined,
      createdBy: user?.id
    },
  });

  // Update form default values when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      addForm.setValue("startTime", `${format(selectedDate, "yyyy-MM-dd")}T09:00`);
      addForm.setValue("endTime", `${format(selectedDate, "yyyy-MM-dd")}T10:00`);
    }
  }, [selectedDate, addForm]);

  // Handle adding a new event
  const handleAddEvent = async (data: EventFormValues) => {
    try {
      await apiRequest("POST", "/api/events", {
        ...data,
        createdBy: user?.id
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsAddDialogOpen(false);
      addForm.reset();
      
      toast({
        title: "Event created",
        description: "The event has been created successfully",
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };

  // Handle deleting an event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await apiRequest("DELETE", `/api/events/${selectedEvent.id}`, {});
      
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsViewEventDialogOpen(false);
      
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  // Navigation functions
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    
    return events.filter(event => {
      const eventDate = parseISO(event.startTime);
      return isSameDay(eventDate, day);
    });
  };

  // Get client name by ID
  const getClientName = (clientId: number | null) => {
    if (!clientId) return null;
    const client = clients?.find(c => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  // Get project name by ID
  const getProjectName = (projectId: number | null) => {
    if (!projectId) return null;
    const project = projects?.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  // Format event time
  const formatEventTime = (event: Event) => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    if (event.allDay) {
      return "All day";
    }
    
    return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
  };

  // Open the add event dialog for a specific date
  const openAddEventDialog = (date: Date) => {
    setSelectedDate(date);
    setIsAddDialogOpen(true);
  };

  // Open the view event dialog
  const openViewEventDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsViewEventDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
          <CardTitle>Calendar</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => openAddEventDialog(new Date())}>
              <Plus className="mr-2 h-4 w-4" /> New Event
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
          </div>
          
          {isLoadingEvents ? (
            <div className="space-y-3">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {/* Calendar header - day names */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="bg-white p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {monthDays.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                
                return (
                  <div
                    key={i}
                    className={`relative bg-white min-h-[120px] p-1 transition-all hover:bg-gray-50 border-t border-gray-200 ${
                      !isCurrentMonth ? "opacity-40" : ""
                    } ${isToday(day) ? "bg-blue-50" : ""} ${
                      isSelected ? "ring-2 ring-primary-500 z-10" : ""
                    }`}
                    onClick={() => openAddEventDialog(day)}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-sm font-medium p-1 h-7 w-7 flex items-center justify-center rounded-full ${
                          isToday(day) ? "bg-primary-500 text-white" : ""
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                    
                    <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded bg-primary-100 text-primary-800 truncate cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewEventDialog(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          + {dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event on your calendar. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddEvent)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Event description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="allDay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>All day event</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time*</FormLabel>
                      <FormControl>
                        <Input type={addForm.watch("allDay") ? "date" : "datetime-local"} {...field} />
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
                        <Input type={addForm.watch("allDay") ? "date" : "datetime-local"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select 
                        value={field.value?.toString()} 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
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
                          <SelectItem value="">None</SelectItem>
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
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Event</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      {selectedEvent && (
        <Dialog open={isViewEventDialogOpen} onOpenChange={setIsViewEventDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <DialogDescription>
                {formatEventTime(selectedEvent)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedEvent.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {getClientName(selectedEvent.clientId) && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Client</h4>
                    <p className="text-sm text-gray-700">{getClientName(selectedEvent.clientId)}</p>
                  </div>
                )}
                
                {getProjectName(selectedEvent.projectId) && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Project</h4>
                    <p className="text-sm text-gray-700">{getProjectName(selectedEvent.projectId)}</p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewEventDialogOpen(false)}>
                Close
              </Button>
              <Button variant="destructive" onClick={handleDeleteEvent}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Calendar;
