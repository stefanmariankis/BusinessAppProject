interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    // Dashboard
    dashboard: "Dashboard",
    welcomeBack: "Welcome back, check your business overview.",
    totalClients: "Total Clients",
    activeProjects: "Active Projects",
    pendingInvoices: "Pending Invoices",
    revenue: "Revenue (MTD)",
    viewAll: "View all",
    viewReport: "View report",
    upcomingTasks: "Upcoming Tasks",
    recentActivity: "Recent Activity",
    upcomingEvents: "Upcoming Events",
    projectStatus: "Project Status",
    financialSummary: "Financial Summary",
    viewDetailedReports: "View detailed reports",
    
    // Clients
    clients: "Clients",
    addClient: "Add Client",
    clientName: "Client Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    viewDetails: "View Details",
    
    // Projects
    projects: "Projects",
    addProject: "Add Project",
    projectName: "Project Name",
    client: "Client",
    status: "Status",
    progress: "Progress",
    deadline: "Deadline",
    budget: "Budget",
    
    // Tasks
    tasks: "Tasks",
    addTask: "Add Task",
    taskTitle: "Task Title",
    project: "Project",
    assignedTo: "Assigned To",
    priority: "Priority",
    taskDueDate: "Due Date", 
    description: "Description",
    highPriority: "High Priority",
    mediumPriority: "Medium Priority",
    lowPriority: "Low Priority",
    
    // Invoices
    invoices: "Invoices",
    createInvoice: "Create Invoice",
    invoiceNumber: "Invoice Number",
    issueDate: "Issue Date",
    dueDate: "Due Date",
    amount: "Amount",
    paid: "Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
    draft: "Draft",
    
    // Contracts
    contracts: "Contracts",
    createContract: "Create Contract",
    contractTitle: "Contract Title",
    value: "Value",
    startDate: "Start Date",
    endDate: "End Date",
    signed: "Signed",
    unsigned: "Unsigned",
    
    // Calendar
    calendar: "Calendar",
    addEvent: "Add Event",
    today: "Today",
    month: "Month",
    week: "Week",
    day: "Day",
    
    // Time Tracker
    timeTracker: "Time Tracker",
    startTimer: "Start Timer",
    stopTimer: "Stop Timer",
    duration: "Duration",
    date: "Date",
    
    // Reports
    reports: "Reports",
    generateReport: "Generate Report",
    reportType: "Report Type",
    dateRange: "Date Range",
    download: "Download",
    
    // Settings
    settings: "Settings",
    profile: "Profile",
    notifications: "Notifications",
    security: "Security",
    language: "Language",
    theme: "Theme",
    save: "Save",
    cancel: "Cancel",
    
    // Auth
    login: "Login",
    logout: "Logout",
    username: "Username",
    password: "Password",
    forgotPassword: "Forgot Password?",
    signIn: "Sign In",
    
    // General
    filter: "Filter",
    search: "Search",
    allProjects: "All Projects",
    activeProjectsOnly: "Active Projects",
    completedProjects: "Completed Projects",
    noDataFound: "No data found",
    loading: "Loading...",
    success: "Success!",
    error: "Error!",
    confirm: "Confirm",
    viewAllActivity: "View all activity",
    viewCalendar: "View calendar",
  },
  ro: {
    // Dashboard
    dashboard: "Tablou de bord",
    welcomeBack: "Bine ai revenit, verifică-ți activitatea.",
    totalClients: "Total Clienți",
    activeProjects: "Proiecte Active",
    pendingInvoices: "Facturi în așteptare",
    revenue: "Venituri (Luna curentă)",
    viewAll: "Vezi tot",
    viewReport: "Vezi raportul",
    upcomingTasks: "Sarcini viitoare",
    recentActivity: "Activitate recentă",
    upcomingEvents: "Evenimente viitoare",
    projectStatus: "Status proiecte",
    financialSummary: "Sumar financiar",
    viewDetailedReports: "Vezi rapoarte detaliate",
    
    // Clients
    clients: "Clienți",
    addClient: "Adaugă Client",
    clientName: "Nume Client",
    email: "Email",
    phone: "Telefon",
    address: "Adresă",
    actions: "Acțiuni",
    edit: "Editează",
    delete: "Șterge",
    viewDetails: "Vezi detalii",
    
    // Projects
    projects: "Proiecte",
    addProject: "Adaugă Proiect",
    projectName: "Nume Proiect",
    client: "Client",
    status: "Status",
    progress: "Progres",
    deadline: "Termen limită",
    budget: "Buget",
    
    // Tasks
    tasks: "Sarcini",
    addTask: "Adaugă Sarcină",
    taskTitle: "Titlu Sarcină",
    project: "Proiect",
    assignedTo: "Asignat lui",
    priority: "Prioritate",
    taskDueDate: "Data scadentă",
    description: "Descriere",
    highPriority: "Prioritate înaltă",
    mediumPriority: "Prioritate medie",
    lowPriority: "Prioritate scăzută",
    
    // Invoices
    invoices: "Facturi",
    createInvoice: "Creează Factură",
    invoiceNumber: "Număr Factură",
    issueDate: "Data emiterii",
    dueDate: "Data scadentă",
    amount: "Sumă",
    paid: "Plătită",
    unpaid: "Neplătită",
    overdue: "Întârziată",
    draft: "Schiță",
    
    // Contracts
    contracts: "Contracte",
    createContract: "Creează Contract",
    contractTitle: "Titlu Contract",
    value: "Valoare",
    startDate: "Data începerii",
    endDate: "Data încheierii",
    signed: "Semnat",
    unsigned: "Nesemnat",
    
    // Calendar
    calendar: "Calendar",
    addEvent: "Adaugă Eveniment",
    today: "Azi",
    month: "Lună",
    week: "Săptămână",
    day: "Zi",
    
    // Time Tracker
    timeTracker: "Cronometru",
    startTimer: "Pornește cronometrul",
    stopTimer: "Oprește cronometrul",
    duration: "Durată",
    date: "Dată",
    
    // Reports
    reports: "Rapoarte",
    generateReport: "Generează Raport",
    reportType: "Tip Raport",
    dateRange: "Interval de timp",
    download: "Descarcă",
    
    // Settings
    settings: "Setări",
    profile: "Profil",
    notifications: "Notificări",
    security: "Securitate",
    language: "Limbă",
    theme: "Temă",
    save: "Salvează",
    cancel: "Anulează",
    
    // Auth
    login: "Autentificare",
    logout: "Deconectare",
    username: "Nume utilizator",
    password: "Parolă",
    forgotPassword: "Ai uitat parola?",
    signIn: "Conectare",
    
    // General
    filter: "Filtrează",
    search: "Caută",
    allProjects: "Toate Proiectele",
    activeProjectsOnly: "Doar Proiecte Active",
    completedProjects: "Proiecte Finalizate",
    noDataFound: "Nu s-au găsit date",
    loading: "Se încarcă...",
    success: "Succes!",
    error: "Eroare!",
    confirm: "Confirmă",
    viewAllActivity: "Vezi toată activitatea",
    viewCalendar: "Vezi calendarul",
  }
};

let currentLanguage = 'en';

export const setLanguage = (lang: 'en' | 'ro') => {
  currentLanguage = lang;
};

export const t = (key: string): string => {
  if (!translations[currentLanguage]) {
    return key;
  }
  
  return translations[currentLanguage][key] || key;
};

// Initialize language from user preference or browser
export const initializeLanguage = (userLanguage?: string) => {
  if (userLanguage && (userLanguage === 'en' || userLanguage === 'ro')) {
    setLanguage(userLanguage);
    return;
  }

  // Fallback to browser language
  const browserLang = navigator.language.substring(0, 2);
  if (browserLang === 'ro') {
    setLanguage('ro');
  } else {
    setLanguage('en');
  }
};
