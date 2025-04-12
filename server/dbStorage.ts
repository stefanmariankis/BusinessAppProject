import { db } from './db';
import { users, clients, projects, tasks, timeEntries, invoices, invoiceItems, contracts, events, activities } from '@shared/schema';
import { 
  User, InsertUser, 
  Client, InsertClient, 
  Project, InsertProject, 
  Task, InsertTask, 
  TimeEntry, InsertTimeEntry, 
  Invoice, InsertInvoice, 
  InvoiceItem, InsertInvoiceItem, 
  Contract, InsertContract, 
  Event, InsertEvent, 
  Activity, InsertActivity 
} from '@shared/schema';
import { eq, desc, lte, gte, and, isNull, sql } from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db';
import { IStorage } from './storage';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db.update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number): Promise<boolean> {
    const [client] = await db.delete(clients)
      .where(eq(clients.id, id))
      .returning();
    return !!client;
  }

  async listClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db.update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const [project] = await db.delete(projects)
      .where(eq(projects.id, id))
      .returning();
    return !!project;
  }

  async listProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async listProjectsByClient(clientId: number): Promise<Project[]> {
    return await db.select()
      .from(projects)
      .where(eq(projects.clientId, clientId));
  }

  async listActiveProjects(): Promise<Project[]> {
    return await db.select()
      .from(projects)
      .where(eq(projects.status, 'in_progress'));
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const [task] = await db.delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    return !!task;
  }

  async listTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async listTasksByProject(projectId: number): Promise<Task[]> {
    return await db.select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
  }

  async listTasksByAssignee(userId: number): Promise<Task[]> {
    return await db.select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId));
  }

  async listUpcomingTasks(userId: number, limit: number = 5): Promise<Task[]> {
    // Get tasks assigned to the user that are not completed, ordered by due date
    return await db.select()
      .from(tasks)
      .where(and(
        eq(tasks.assignedTo, userId),
        isNull(tasks.completedAt)
      ))
      .limit(limit);
  }

  // Time entry operations
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return timeEntry || undefined;
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [timeEntry] = await db.insert(timeEntries).values(insertTimeEntry).returning();
    return timeEntry;
  }

  async updateTimeEntry(id: number, timeEntryData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db.update(timeEntries)
      .set(timeEntryData)
      .where(eq(timeEntries.id, id))
      .returning();
    return timeEntry || undefined;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const [timeEntry] = await db.delete(timeEntries)
      .where(eq(timeEntries.id, id))
      .returning();
    return !!timeEntry;
  }

  async listTimeEntries(): Promise<TimeEntry[]> {
    return await db.select().from(timeEntries);
  }

  async listTimeEntriesByUser(userId: number): Promise<TimeEntry[]> {
    return await db.select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId));
  }

  async listTimeEntriesByProject(projectId: number): Promise<TimeEntry[]> {
    return await db.select()
      .from(timeEntries)
      .where(eq(timeEntries.projectId, projectId));
  }

  async listTimeEntriesByTask(taskId: number): Promise<TimeEntry[]> {
    return await db.select()
      .from(timeEntries)
      .where(eq(timeEntries.taskId, taskId));
  }

  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db.update(invoices)
      .set(invoiceData)
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const [invoice] = await db.delete(invoices)
      .where(eq(invoices.id, id))
      .returning();
    return !!invoice;
  }

  async listInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async listInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return await db.select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId));
  }

  async listInvoicesByStatus(status: string): Promise<Invoice[]> {
    return await db.select()
      .from(invoices)
      .where(eq(invoices.status, status));
  }

  async getInvoiceWithItems(id: number): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) return undefined;

    const items = await db.select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return { invoice, items };
  }

  // Invoice item operations
  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    const [invoiceItem] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    return invoiceItem || undefined;
  }

  async createInvoiceItem(insertInvoiceItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const [invoiceItem] = await db.insert(invoiceItems).values(insertInvoiceItem).returning();
    return invoiceItem;
  }

  async updateInvoiceItem(id: number, invoiceItemData: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const [invoiceItem] = await db.update(invoiceItems)
      .set(invoiceItemData)
      .where(eq(invoiceItems.id, id))
      .returning();
    return invoiceItem || undefined;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    const [invoiceItem] = await db.delete(invoiceItems)
      .where(eq(invoiceItems.id, id))
      .returning();
    return !!invoiceItem;
  }

  async listInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  // Contract operations
  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await db.insert(contracts).values(insertContract).returning();
    return contract;
  }

  async updateContract(id: number, contractData: Partial<InsertContract>): Promise<Contract | undefined> {
    const [contract] = await db.update(contracts)
      .set(contractData)
      .where(eq(contracts.id, id))
      .returning();
    return contract || undefined;
  }

  async deleteContract(id: number): Promise<boolean> {
    const [contract] = await db.delete(contracts)
      .where(eq(contracts.id, id))
      .returning();
    return !!contract;
  }

  async listContracts(): Promise<Contract[]> {
    return await db.select().from(contracts);
  }

  async listContractsByClient(clientId: number): Promise<Contract[]> {
    return await db.select()
      .from(contracts)
      .where(eq(contracts.clientId, clientId));
  }

  async listContractsByProject(projectId: number): Promise<Contract[]> {
    return await db.select()
      .from(contracts)
      .where(eq(contracts.projectId, projectId));
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const [event] = await db.delete(events)
      .where(eq(events.id, id))
      .returning();
    return !!event;
  }

  async listEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async listEventsByUser(userId: number): Promise<Event[]> {
    return await db.select()
      .from(events)
      .where(eq(events.userId, userId));
  }

  async listUpcomingEvents(limit: number = 3): Promise<Event[]> {
    const today = new Date();
    return await db.select()
      .from(events)
      .where(gte(events.startDate, today))
      .orderBy(events.startDate)
      .limit(limit);
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  async listActivities(limit: number = 10): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async listActivitiesByUser(userId: number, limit: number = 10): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  // Dashboard operations
  async getDashboardStats(userId: number): Promise<{
    clientCount: number;
    activeProjectCount: number;
    pendingInvoiceCount: number;
    revenue: number;
  }> {
    // Get client count
    const [clientCountResult] = await db.select({ count: sql<number>`count(*)` }).from(clients);
    const clientCount = clientCountResult.count;

    // Get active project count
    const [activeProjectCountResult] = await db.select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, 'in_progress'));
    const activeProjectCount = activeProjectCountResult.count;

    // Get pending invoice count
    const [pendingInvoiceCountResult] = await db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.status, 'sent'));
    const pendingInvoiceCount = pendingInvoiceCountResult.count;

    // Get revenue (sum of paid invoices)
    const [revenueResult] = await db.select({ 
      total: sql<number>`coalesce(sum(amount), 0)` 
    })
    .from(invoices)
    .where(eq(invoices.status, 'paid'));
    const revenue = revenueResult.total;

    return {
      clientCount,
      activeProjectCount,
      pendingInvoiceCount,
      revenue,
    };
  }
}