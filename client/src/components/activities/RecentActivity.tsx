import { Activity } from "@shared/schema";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { 
  FileText, 
  CheckSquare, 
  Users, 
  FolderKanban,
  Receipt,
  CalendarDays
} from "lucide-react";

interface RecentActivityProps {
  activities: Activity[];
  limit?: number;
}

const RecentActivity = ({ activities, limit = 3 }: RecentActivityProps) => {
  const limitedActivities = limit ? activities.slice(0, limit) : activities;

  const getActivityIcon = (entityType: string, action: string) => {
    switch (entityType) {
      case 'invoice':
        return (
          <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
            <Receipt className="h-4 w-4 text-white" />
          </div>
        );
      case 'task':
        return (
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
            <CheckSquare className="h-4 w-4 text-white" />
          </div>
        );
      case 'client':
        return (
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
            <Users className="h-4 w-4 text-white" />
          </div>
        );
      case 'project':
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
            <FolderKanban className="h-4 w-4 text-white" />
          </div>
        );
      case 'contract':
        return (
          <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
            <FileText className="h-4 w-4 text-white" />
          </div>
        );
      case 'event':
        return (
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center ring-8 ring-white">
            <FileText className="h-4 w-4 text-white" />
          </div>
        );
    }
  };
  
  const getActivityTitle = (activity: Activity) => {
    switch (activity.entityType) {
      case 'invoice':
        return `Invoice #${activity.entityId}`;
      case 'task':
        return `Task #${activity.entityId}`;
      case 'client':
        return `Client #${activity.entityId}`;
      case 'project':
        return `Project #${activity.entityId}`;
      case 'contract':
        return `Contract #${activity.entityId}`;
      case 'event':
        return `Event #${activity.entityId}`;
      default:
        return `${activity.entityType} #${activity.entityId}`;
    }
  };

  const getActivityLink = (activity: Activity) => {
    switch (activity.entityType) {
      case 'invoice':
        return `/invoices/${activity.entityId}`;
      case 'task':
        return `/tasks/${activity.entityId}`;
      case 'client':
        return `/clients/${activity.entityId}`;
      case 'project':
        return `/projects/${activity.entityId}`;
      case 'contract':
        return `/contracts/${activity.entityId}`;
      case 'event':
        return `/calendar/${activity.entityId}`;
      default:
        return '#';
    }
  };

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
      </CardHeader>
      <CardContent className="px-4 py-2 h-60 overflow-y-auto">
        {limitedActivities.length > 0 ? (
          limitedActivities.map((activity) => (
            <div key={activity.id} className="relative pb-4">
              <span className="absolute top-0 left-0 h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  {getActivityIcon(activity.entityType, activity.action)}
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <Link 
                        href={getActivityLink(activity)} 
                        className="font-medium text-gray-900"
                      >
                        {getActivityTitle(activity)}
                      </Link>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="mt-1 text-sm text-gray-700">
                    <p>{activity.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-gray-500">
            No recent activities found.
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 text-right sm:px-6">
        <Link href="/activities" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View all activity
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RecentActivity;
