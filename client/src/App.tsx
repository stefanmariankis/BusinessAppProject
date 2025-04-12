import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Projects from "@/pages/projects";
import Tasks from "@/pages/tasks";
import Invoices from "@/pages/invoices";
import Contracts from "@/pages/contracts";
import Calendar from "@/pages/calendar";
import TimeTracker from "@/pages/time-tracker";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";

function App() {
  const { user, setUser, setIsLoading } = useAuth();
  
  // Skip the session check for now and go straight to the login screen
  useEffect(() => {
    // Set isLoading to false to show login screen
    setIsLoading(false);
    
    // Set the language from the user preferences if available
    if (user?.language) {
      document.documentElement.lang = user.language;
    }
  }, [user, setIsLoading]);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        {user ? <Dashboard /> : <Login />}
      </Route>
      
      {/* Protected routes */}
      <Route path="/">
        {user ? (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/dashboard">
        {user ? (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/clients">
        {user ? (
          <DashboardLayout>
            <Clients />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/projects">
        {user ? (
          <DashboardLayout>
            <Projects />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/tasks">
        {user ? (
          <DashboardLayout>
            <Tasks />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/invoices">
        {user ? (
          <DashboardLayout>
            <Invoices />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/contracts">
        {user ? (
          <DashboardLayout>
            <Contracts />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/calendar">
        {user ? (
          <DashboardLayout>
            <Calendar />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/time-tracker">
        {user ? (
          <DashboardLayout>
            <TimeTracker />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/reports">
        {user ? (
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/settings">
        {user ? (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      {/* Fallback route */}
      <Route>
        {user ? (
          <DashboardLayout>
            <NotFound />
          </DashboardLayout>
        ) : (
          <Login />
        )}
      </Route>
    </Switch>
  );
}

export default App;
