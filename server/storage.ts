import {
  User,
  InsertUser,
  Client,
  InsertClient,
  Project,
  InsertProject,
  Task,
  InsertTask,
  TimeEntry,
  InsertTimeEntry,
  Invoice,
  InsertInvoice,
  InvoiceItem,
  InsertInvoiceItem,
  Contract,
  InsertContract,
  Event,
  InsertEvent,
  Activity,
  InsertActivity
} from "@shared/schema";

export interface IStorage {
  sessionStore: any; // Session store for user authentication
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  listClients(): Promise<Client[]>;

  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  listProjects(): Promise<Project[]>;
  listProjectsByClient(clientId: number): Promise<Project[]>;
  listActiveProjects(): Promise<Project[]>;

  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  listTasks(): Promise<Task[]>;
  listTasksByProject(projectId: number): Promise<Task[]>;
  listTasksByAssignee(userId: number): Promise<Task[]>;
  listUpcomingTasks(userId: number, limit?: number): Promise<Task[]>;

  // Time entry operations
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;
  listTimeEntries(): Promise<TimeEntry[]>;
  listTimeEntriesByUser(userId: number): Promise<TimeEntry[]>;
  listTimeEntriesByProject(projectId: number): Promise<TimeEntry[]>;
  listTimeEntriesByTask(taskId: number): Promise<TimeEntry[]>;

  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  listInvoices(): Promise<Invoice[]>;
  listInvoicesByClient(clientId: number): Promise<Invoice[]>;
  listInvoicesByStatus(status: string): Promise<Invoice[]>;
  getInvoiceWithItems(id: number): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined>;

  // Invoice item operations
  getInvoiceItem(id: number): Promise<InvoiceItem | undefined>;
  createInvoiceItem(invoiceItem: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, invoiceItem: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;
  listInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]>;

  // Contract operations
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: number): Promise<boolean>;
  listContracts(): Promise<Contract[]>;
  listContractsByClient(clientId: number): Promise<Contract[]>;
  listContractsByProject(projectId: number): Promise<Contract[]>;

  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  listEvents(): Promise<Event[]>;
  listEventsByUser(userId: number): Promise<Event[]>;
  listUpcomingEvents(limit?: number): Promise<Event[]>;

  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  listActivities(limit?: number): Promise<Activity[]>;
  listActivitiesByUser(userId: number, limit?: number): Promise<Activity[]>;

  // Dashboard operations
  getDashboardStats(userId: number): Promise<{
    clientCount: number;
    activeProjectCount: number;
    pendingInvoiceCount: number;
    revenue: number;
  }>;
}

export class MemStorage implements IStorage {
  sessionStore: any;
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private timeEntries: Map<number, TimeEntry>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private contracts: Map<number, Contract>;
  private events: Map<number, Event>;
  private activities: Map<number, Activity>;

  private userCurrentId: number;
  private clientCurrentId: number;
  private projectCurrentId: number;
  private taskCurrentId: number;
  private timeEntryCurrentId: number;
  private invoiceCurrentId: number;
  private invoiceItemCurrentId: number;
  private contractCurrentId: number;
  private eventCurrentId: number;
  private activityCurrentId: number;

  constructor() {
    this.sessionStore = {};
    this.users = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.timeEntries = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.contracts = new Map();
    this.events = new Map();
    this.activities = new Map();

    this.userCurrentId = 1;
    this.clientCurrentId = 1;
    this.projectCurrentId = 1;
    this.taskCurrentId = 1;
    this.timeEntryCurrentId = 1;
    this.invoiceCurrentId = 1;
    this.invoiceItemCurrentId = 1;
    this.contractCurrentId = 1;
    this.eventCurrentId = 1;
    this.activityCurrentId = 1;

    // Add admin user
    this.createUser({
      username: "admin",
      password: "password123",
      firstName: "Alex",
      lastName: "Moldovan",
      email: "admin@bizflow.com",
      phone: "+40 123 456 789",
      role: "admin",
      language: "en"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientCurrentId++;
    const now = new Date();
    const client: Client = { ...insertClient, id, createdAt: now };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;

    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  async listClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const now = new Date();
    const project: Project = { ...insertProject, id, createdAt: now, completedAt: null };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;

    const updatedProject = { ...project, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  async listProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async listProjectsByClient(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.clientId === clientId,
    );
  }

  async listActiveProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.status === "in_progress",
    );
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskCurrentId++;
    const now = new Date();
    const task: Task = { ...insertTask, id, createdAt: now, completedAt: null };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async listTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async listTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.projectId === projectId,
    );
  }

  async listTasksByAssignee(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.assignedTo === userId,
    );
  }

  async listUpcomingTasks(userId: number, limit: number = 5): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assignedTo === userId && task.status !== 'completed')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, limit);
  }

  // Time entry operations
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.timeEntryCurrentId++;
    const now = new Date();
    const timeEntry: TimeEntry = { ...insertTimeEntry, id, createdAt: now };
    this.timeEntries.set(id, timeEntry);
    return timeEntry;
  }

  async updateTimeEntry(id: number, timeEntryData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const timeEntry = await this.getTimeEntry(id);
    if (!timeEntry) return undefined;

    const updatedTimeEntry = { ...timeEntry, ...timeEntryData };
    this.timeEntries.set(id, updatedTimeEntry);
    return updatedTimeEntry;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  async listTimeEntries(): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values());
  }

  async listTimeEntriesByUser(userId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(
      (timeEntry) => timeEntry.userId === userId,
    );
  }

  async listTimeEntriesByProject(projectId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(
      (timeEntry) => timeEntry.projectId === projectId,
    );
  }

  async listTimeEntriesByTask(taskId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(
      (timeEntry) => timeEntry.taskId === taskId,
    );
  }

  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceCurrentId++;
    const now = new Date();
    const invoice: Invoice = { ...insertInvoice, id, createdAt: now, paidAt: null, paidAmount: null };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;

    const updatedInvoice = { ...invoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const itemsToDelete = Array.from(this.invoiceItems.values())
      .filter(item => item.invoiceId === id)
      .map(item => item.id);
    
    itemsToDelete.forEach(itemId => this.invoiceItems.delete(itemId));
    return this.invoices.delete(id);
  }

  async listInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async listInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.clientId === clientId,
    );
  }

  async listInvoicesByStatus(status: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.status === status,
    );
  }

  async getInvoiceWithItems(id: number): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;

    const items = await this.listInvoiceItemsByInvoice(id);
    return { invoice, items };
  }

  // Invoice item operations
  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    return this.invoiceItems.get(id);
  }

  async createInvoiceItem(insertInvoiceItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = this.invoiceItemCurrentId++;
    const invoiceItem: InvoiceItem = { ...insertInvoiceItem, id };
    this.invoiceItems.set(id, invoiceItem);
    return invoiceItem;
  }

  async updateInvoiceItem(id: number, invoiceItemData: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const invoiceItem = await this.getInvoiceItem(id);
    if (!invoiceItem) return undefined;

    const updatedInvoiceItem = { ...invoiceItem, ...invoiceItemData };
    this.invoiceItems.set(id, updatedInvoiceItem);
    return updatedInvoiceItem;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    return this.invoiceItems.delete(id);
  }

  async listInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(
      (invoiceItem) => invoiceItem.invoiceId === invoiceId,
    );
  }

  // Contract operations
  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.contractCurrentId++;
    const now = new Date();
    const contract: Contract = { ...insertContract, id, createdAt: now, signedAt: null };
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(id: number, contractData: Partial<InsertContract>): Promise<Contract | undefined> {
    const contract = await this.getContract(id);
    if (!contract) return undefined;

    const updatedContract = { ...contract, ...contractData };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }

  async deleteContract(id: number): Promise<boolean> {
    return this.contracts.delete(id);
  }

  async listContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async listContractsByClient(clientId: number): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(
      (contract) => contract.clientId === clientId,
    );
  }

  async listContractsByProject(projectId: number): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(
      (contract) => contract.projectId === projectId,
    );
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventCurrentId++;
    const now = new Date();
    const event: Event = { ...insertEvent, id, createdAt: now };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;

    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  async listEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async listEventsByUser(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.createdBy === userId,
    );
  }

  async listUpcomingEvents(limit: number = 3): Promise<Event[]> {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, limit);
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityCurrentId++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, createdAt: now };
    this.activities.set(id, activity);
    return activity;
  }

  async listActivities(limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async listActivitiesByUser(userId: number, limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Dashboard operations
  async getDashboardStats(userId: number): Promise<{
    clientCount: number;
    activeProjectCount: number;
    pendingInvoiceCount: number;
    revenue: number;
  }> {
    const clients = await this.listClients();
    const activeProjects = await this.listActiveProjects();
    const pendingInvoices = await this.listInvoicesByStatus('sent');
    
    // Calculate revenue from paid invoices for the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const paidInvoices = Array.from(this.invoices.values()).filter(
      invoice => invoice.status === 'paid' && invoice.paidAt && new Date(invoice.paidAt) >= startOfMonth
    );
    
    const revenue = paidInvoices.reduce((total, invoice) => total + (invoice.paidAmount || 0), 0);
    
    return {
      clientCount: clients.length,
      activeProjectCount: activeProjects.length,
      pendingInvoiceCount: pendingInvoices.length,
      revenue
    };
  }
}

import { DatabaseStorage } from './dbStorage';

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
