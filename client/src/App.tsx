import { Switch, Route } from "wouter";
import { useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AuthPage from "@/pages/auth-page";
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
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Componenta înlocuitoare pentru rutele protejate
const DashboardRoute = ({ component: Component }: { component: React.ComponentType }) => {
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
};

function App() {
  const { user } = useAuth();
  
  // Setează limba în funcție de preferințele utilizatorului
  useEffect(() => {    
    if (user?.language) {
      document.documentElement.lang = user.language;
    }
  }, [user]);

  return (
    <Switch>
      {/* Rută publică pentru autentificare */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Rute protejate */}
      <ProtectedRoute 
        path="/" 
        component={() => <DashboardRoute component={Dashboard} />} 
      />
      
      <ProtectedRoute 
        path="/dashboard" 
        component={() => <DashboardRoute component={Dashboard} />} 
      />
      
      <ProtectedRoute 
        path="/clients" 
        component={() => <DashboardRoute component={Clients} />} 
      />
      
      <ProtectedRoute 
        path="/projects" 
        component={() => <DashboardRoute component={Projects} />} 
      />
      
      <ProtectedRoute 
        path="/tasks" 
        component={() => <DashboardRoute component={Tasks} />} 
      />
      
      <ProtectedRoute 
        path="/invoices" 
        component={() => <DashboardRoute component={Invoices} />} 
      />
      
      <ProtectedRoute 
        path="/contracts" 
        component={() => <DashboardRoute component={Contracts} />} 
      />
      
      <ProtectedRoute 
        path="/calendar" 
        component={() => <DashboardRoute component={Calendar} />} 
      />
      
      <ProtectedRoute 
        path="/time-tracker" 
        component={() => <DashboardRoute component={TimeTracker} />} 
      />
      
      <ProtectedRoute 
        path="/reports" 
        component={() => <DashboardRoute component={Reports} />} 
      />
      
      <ProtectedRoute 
        path="/settings" 
        component={() => <DashboardRoute component={Settings} />} 
      />
      
      {/* Ruta de fallback */}
      <Route>
        <DashboardLayout>
          <NotFound />
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

export default App;
