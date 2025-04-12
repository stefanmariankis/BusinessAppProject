import { Event } from "@shared/schema";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { format } from "date-fns";
import { CalendarClock, Users, FolderKanban, ChartGantt } from "lucide-react";

interface UpcomingEventsProps {
  events: Event[];
  limit?: number;
}

const UpcomingEvents = ({ events, limit = 3 }: UpcomingEventsProps) => {
  const limitedEvents = limit ? events.slice(0, limit) : events;

  const getEventIcon = (event: Event) => {
    if (event.clientId && !event.projectId) {
      return (
        <div className="bg-primary-100 rounded p-2 mr-3">
          <Users className="text-primary-600 h-5 w-5" />
        </div>
      );
    } else if (event.projectId) {
      return (
        <div className="bg-green-100 rounded p-2 mr-3">
          <FolderKanban className="text-green-600 h-5 w-5" />
        </div>
      );
    } else {
      return (
        <div className="bg-purple-100 rounded p-2 mr-3">
          <ChartGantt className="text-purple-600 h-5 w-5" />
        </div>
      );
    }
  };

  const formatEventTime = (event: Event) => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    // Format date
    const dateFormat = format(startDate, "EEE, MMM d");
    
    // Format time
    const timeFormat = event.allDay
      ? "All day"
      : `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
    
    return `${dateFormat}, ${timeFormat}`;
  };

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Events</h3>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {limitedEvents.length > 0 ? (
          limitedEvents.map((event) => (
            <div key={event.id} className="flex items-center p-2 hover:bg-gray-50 rounded-md">
              {getEventIcon(event)}
              <div>
                <p className="text-sm font-medium text-gray-900">{event.title}</p>
                <p className="text-xs text-gray-500">{formatEventTime(event)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            No upcoming events scheduled.
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 text-right sm:px-6">
        <Link href="/calendar" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View calendar
        </Link>
      </CardFooter>
    </Card>
  );
};

export default UpcomingEvents;
