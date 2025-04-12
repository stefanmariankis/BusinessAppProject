import { useState } from "react";
import { Task } from "@shared/schema";
import { Link } from "wouter";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Folder, User, Clock, Filter, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isToday, addDays, isTomorrow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TaskListProps {
  tasks: Task[];
  title?: string;
  showFilters?: boolean;
  limit?: number;
}

const TaskList = ({ 
  tasks, 
  title = "Upcoming Tasks", 
  showFilters = true, 
  limit 
}: TaskListProps) => {
  const [filter, setFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredTasks = limit ? tasks.slice(0, limit) : tasks;

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      case 'medium':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDueDate = (dueDate: Date | null | undefined) => {
    if (!dueDate) return 'No due date';
    
    if (isToday(new Date(dueDate))) {
      return 'Due today';
    } else if (isTomorrow(new Date(dueDate))) {
      return 'Due tomorrow';
    } else if (isPast(new Date(dueDate))) {
      return `Overdue (${format(new Date(dueDate), 'MMM d')})`;
    } else {
      return `Due ${format(new Date(dueDate), 'MMM d')}`;
    }
  };

  const handleTaskToggle = async (task: Task, completed: boolean) => {
    try {
      const updatedTask = await apiRequest("PUT", `/api/tasks/${task.id}`, {
        status: completed ? 'completed' : 'todo'
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/upcoming'] });
      
      toast({
        title: completed ? "Task completed" : "Task reopened",
        description: `"${task.title}" has been ${completed ? 'marked as complete' : 'reopened'}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        {showFilters && (
          <div className="flex space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-1 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter(null)}>
                  All Tasks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('high')}>
                  High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('medium')}>
                  Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('low')}>
                  Low Priority
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/tasks/new">
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                New Task
              </Button>
            </Link>
          </div>
        )}
      </CardHeader>
      <div>
        <ul className="divide-y divide-gray-200">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <li key={task.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox 
                        id={`task-${task.id}`}
                        checked={task.status === 'completed'}
                        onCheckedChange={(checked) => handleTaskToggle(task, Boolean(checked))}
                      />
                      <label 
                        htmlFor={`task-${task.id}`} 
                        className={`ml-3 block text-sm font-medium ${
                          task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'
                        }`}
                      >
                        {task.title}
                      </label>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      {task.projectId && (
                        <p className="flex items-center text-xs text-gray-500">
                          <Folder className="mr-1.5 h-4 w-4" />
                          <span>Project {task.projectId}</span>
                        </p>
                      )}
                      <p className="mt-1 flex items-center text-xs text-gray-500 sm:mt-0 sm:ml-4">
                        <User className="mr-1.5 h-4 w-4" />
                        <span>
                          {task.assignedTo ? `Assigned to user ${task.assignedTo}` : 'Unassigned'}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-gray-500 sm:mt-0">
                      <Clock className="mr-1.5 h-4 w-4" />
                      <p>{formatDueDate(task.dueDate)}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 sm:px-6 text-center text-gray-500">
              No tasks found. Create a new task to get started!
            </li>
          )}
        </ul>
      </div>
      <CardFooter className="bg-gray-50 px-4 py-3 text-right sm:px-6">
        <Link href="/tasks" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View all tasks
        </Link>
      </CardFooter>
    </Card>
  );
};

export default TaskList;
