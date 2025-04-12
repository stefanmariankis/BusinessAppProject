import { Project, Client } from "@shared/schema";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProjectStatusProps {
  projects: Project[];
  clients: Client[];
  limit?: number;
}

const ProjectStatus = ({ projects, clients, limit }: ProjectStatusProps) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const filteredProjects = projects
    .filter(project => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return project.status === "in_progress";
      if (statusFilter === "completed") return project.status === "completed";
      return true;
    })
    .slice(0, limit);

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getInitialBackgroundColor = (projectId: number) => {
    const colors = [
      "bg-primary-100 text-primary-700",
      "bg-green-100 text-green-700",
      "bg-blue-100 text-blue-700",
      "bg-yellow-100 text-yellow-700",
      "bg-indigo-100 text-indigo-700",
      "bg-purple-100 text-purple-700",
      "bg-pink-100 text-pink-700"
    ];
    
    return colors[projectId % colors.length];
  };

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Project Status</h3>
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="active">Active Projects</SelectItem>
              <SelectItem value="completed">Completed Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const clientName = getClientName(project.clientId);
                return (
                  <li key={project.id} className="py-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={getInitialBackgroundColor(project.id)}>
                            {getInitials(project.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Client: {clientName}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm text-gray-500 mr-2">{project.progress}%</p>
                          <div className="w-32">
                            <Progress value={project.progress} className="h-2.5" />
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {project.deadline 
                            ? `Deadline: ${format(new Date(project.deadline), "MMM d, yyyy")}`
                            : "No deadline set"}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="py-4 text-center text-gray-500">
                No projects found with the selected filter.
              </li>
            )}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 text-right sm:px-6">
        <Link href="/projects" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View all projects
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProjectStatus;
