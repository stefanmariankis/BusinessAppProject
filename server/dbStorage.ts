import { IStorage } from "./storage";
import { 
  User, 
  users, 
  clients, 
  projects, 
  tasks, 
  timeEntries, 
  invoices, 
  invoiceItems, 
  contracts, 
  events, 
  activities,
  InsertUser,
  InsertClient,
  InsertProject,
  InsertTask,
  InsertTimeEntry,
  InsertInvoice,
  InsertInvoiceItem,
  InsertContract,
  InsertEvent,
  InsertActivity,
  Client,
  Project,
  Task,
  TimeEntry,
  Invoice,
  InvoiceItem,
  Contract,
  Event,
  Activity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, sql } from 'drizzle-orm';
import { pool } from "./db";
import connectPg from "connect-pg-simple";
import session from "express-session";

// Configurare pentru session store
const PostgresStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresStore({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  // Utilizatori
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values({
        ...insertUser,
        role: insertUser.role || "user",
        language: insertUser.language || "ro",
        phone: insertUser.phone || null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateUser:", error);
      return undefined;
    }
  }

  async listUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error in listUsers:", error);
      return [];
    }
  }

  // Clienți
  async getClient(id: number): Promise<Client | undefined> {
    try {
      const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getClient:", error);
      return undefined;
    }
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    try {
      const result = await db.insert(clients).values({
        ...insertClient,
        phone: insertClient.phone || null,
        address: insertClient.address || null,
        city: insertClient.city || null,
        country: insertClient.country || null,
        contactPerson: insertClient.contactPerson || null,
        notes: insertClient.notes || null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createClient:", error);
      throw error;
    }
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    try {
      const result = await db.update(clients)
        .set(clientData)
        .where(eq(clients.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateClient:", error);
      return undefined;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      const result = await db.delete(clients).where(eq(clients.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteClient:", error);
      return false;
    }
  }

  async listClients(): Promise<Client[]> {
    try {
      return await db.select().from(clients);
    } catch (error) {
      console.error("Error in listClients:", error);
      return [];
    }
  }

  // Proiecte
  async getProject(id: number): Promise<Project | undefined> {
    try {
      const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getProject:", error);
      return undefined;
    }
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    try {
      const result = await db.insert(projects).values({
        ...insertProject,
        status: insertProject.status || "not_started",
        progress: insertProject.progress || 0,
        description: insertProject.description || null,
        startDate: insertProject.startDate || null,
        deadline: insertProject.deadline || null,
        completedAt: null,
        budget: insertProject.budget || null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createProject:", error);
      throw error;
    }
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    try {
      const result = await db.update(projects)
        .set(projectData)
        .where(eq(projects.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateProject:", error);
      return undefined;
    }
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      const result = await db.delete(projects).where(eq(projects.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteProject:", error);
      return false;
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects);
    } catch (error) {
      console.error("Error in listProjects:", error);
      return [];
    }
  }

  async listProjectsByClient(clientId: number): Promise<Project[]> {
    try {
      return await db.select().from(projects).where(eq(projects.clientId, clientId));
    } catch (error) {
      console.error("Error in listProjectsByClient:", error);
      return [];
    }
  }

  async listActiveProjects(): Promise<Project[]> {
    try {
      return await db
        .select()
        .from(projects)
        .where(
          or(
            eq(projects.status, "not_started"),
            eq(projects.status, "in_progress")
          )
        );
    } catch (error) {
      console.error("Error in listActiveProjects:", error);
      return [];
    }
  }

  // Sarcini
  async getTask(id: number): Promise<Task | undefined> {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getTask:", error);
      return undefined;
    }
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    try {
      const result = await db.insert(tasks).values({
        ...insertTask,
        status: insertTask.status || "todo",
        priority: insertTask.priority || "medium",
        description: insertTask.description || null,
        dueDate: insertTask.dueDate || null,
        estimatedHours: insertTask.estimatedHours || null,
        completedAt: null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createTask:", error);
      throw error;
    }
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    try {
      const result = await db.update(tasks)
        .set(taskData)
        .where(eq(tasks.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateTask:", error);
      return undefined;
    }
  }

  async deleteTask(id: number): Promise<boolean> {
    try {
      const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteTask:", error);
      return false;
    }
  }

  async listTasks(): Promise<Task[]> {
    try {
      return await db.select().from(tasks);
    } catch (error) {
      console.error("Error in listTasks:", error);
      return [];
    }
  }

  async listTasksByProject(projectId: number): Promise<Task[]> {
    try {
      return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
    } catch (error) {
      console.error("Error in listTasksByProject:", error);
      return [];
    }
  }

  async listTasksByAssignee(userId: number): Promise<Task[]> {
    try {
      return await db.select().from(tasks).where(eq(tasks.assignedTo, userId));
    } catch (error) {
      console.error("Error in listTasksByAssignee:", error);
      return [];
    }
  }

  async listUpcomingTasks(userId: number, limit: number = 5): Promise<Task[]> {
    try {
      return await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.assignedTo, userId),
            or(
              eq(tasks.status, "todo"),
              eq(tasks.status, "in_progress")
            )
          )
        )
        .orderBy(tasks.dueDate)
        .limit(limit);
    } catch (error) {
      console.error("Error in listUpcomingTasks:", error);
      return [];
    }
  }

  // Înregistrări de timp
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    try {
      const result = await db.select().from(timeEntries).where(eq(timeEntries.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getTimeEntry:", error);
      return undefined;
    }
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    try {
      const result = await db.insert(timeEntries).values({
        ...insertTimeEntry,
        description: insertTimeEntry.description || null,
        projectId: insertTimeEntry.projectId || null,
        taskId: insertTimeEntry.taskId || null,
        endTime: insertTimeEntry.endTime || null,
        duration: insertTimeEntry.duration || null,
        billable: insertTimeEntry.billable !== undefined ? insertTimeEntry.billable : true,
        invoiceId: insertTimeEntry.invoiceId || null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createTimeEntry:", error);
      throw error;
    }
  }

  async updateTimeEntry(id: number, timeEntryData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    try {
      const result = await db.update(timeEntries)
        .set(timeEntryData)
        .where(eq(timeEntries.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateTimeEntry:", error);
      return undefined;
    }
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    try {
      const result = await db.delete(timeEntries).where(eq(timeEntries.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteTimeEntry:", error);
      return false;
    }
  }

  async listTimeEntries(): Promise<TimeEntry[]> {
    try {
      return await db.select().from(timeEntries);
    } catch (error) {
      console.error("Error in listTimeEntries:", error);
      return [];
    }
  }

  async listTimeEntriesByUser(userId: number): Promise<TimeEntry[]> {
    try {
      return await db.select().from(timeEntries).where(eq(timeEntries.userId, userId));
    } catch (error) {
      console.error("Error in listTimeEntriesByUser:", error);
      return [];
    }
  }

  async listTimeEntriesByProject(projectId: number): Promise<TimeEntry[]> {
    try {
      return await db.select().from(timeEntries).where(eq(timeEntries.projectId, projectId));
    } catch (error) {
      console.error("Error in listTimeEntriesByProject:", error);
      return [];
    }
  }

  async listTimeEntriesByTask(taskId: number): Promise<TimeEntry[]> {
    try {
      return await db.select().from(timeEntries).where(eq(timeEntries.taskId, taskId));
    } catch (error) {
      console.error("Error in listTimeEntriesByTask:", error);
      return [];
    }
  }

  // Facturi
  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getInvoice:", error);
      return undefined;
    }
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    try {
      const result = await db.insert(invoices).values({
        ...insertInvoice,
        status: insertInvoice.status || "draft",
        notes: insertInvoice.notes || null,
        tax: insertInvoice.tax || null,
        discount: insertInvoice.discount || null,
        terms: insertInvoice.terms || null,
        paidAt: null,
        paidAmount: null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createInvoice:", error);
      throw error;
    }
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    try {
      // Dacă factura este marcată ca plătită și nu are deja o dată de plată, o adăugăm
      if (invoiceData.status === "paid") {
        const invoice = await this.getInvoice(id);
        if (invoice && !invoice.paidAt) {
          const now = new Date();
          invoiceData = {
            ...invoiceData,
            paidAt: now,
            paidAmount: invoice.total
          };
        }
      }
      
      const result = await db.update(invoices)
        .set(invoiceData)
        .where(eq(invoices.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateInvoice:", error);
      return undefined;
    }
  }

  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteInvoice:", error);
      return false;
    }
  }

  async listInvoices(): Promise<Invoice[]> {
    try {
      return await db.select().from(invoices);
    } catch (error) {
      console.error("Error in listInvoices:", error);
      return [];
    }
  }

  async listInvoicesByClient(clientId: number): Promise<Invoice[]> {
    try {
      return await db.select().from(invoices).where(eq(invoices.clientId, clientId));
    } catch (error) {
      console.error("Error in listInvoicesByClient:", error);
      return [];
    }
  }

  async listInvoicesByStatus(status: string): Promise<Invoice[]> {
    try {
      return await db.select().from(invoices).where(eq(invoices.status, status));
    } catch (error) {
      console.error("Error in listInvoicesByStatus:", error);
      return [];
    }
  }

  async getInvoiceWithItems(id: number): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined> {
    try {
      const invoice = await this.getInvoice(id);
      if (!invoice) return undefined;
      
      const items = await this.listInvoiceItemsByInvoice(id);
      return {
        invoice,
        items
      };
    } catch (error) {
      console.error("Error in getInvoiceWithItems:", error);
      return undefined;
    }
  }

  // Elemente de factură
  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    try {
      const result = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getInvoiceItem:", error);
      return undefined;
    }
  }

  async createInvoiceItem(insertInvoiceItem: InsertInvoiceItem): Promise<InvoiceItem> {
    try {
      const result = await db.insert(invoiceItems).values({
        ...insertInvoiceItem,
        projectId: insertInvoiceItem.projectId || null,
        taskId: insertInvoiceItem.taskId || null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createInvoiceItem:", error);
      throw error;
    }
  }

  async updateInvoiceItem(id: number, invoiceItemData: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    try {
      const result = await db.update(invoiceItems)
        .set(invoiceItemData)
        .where(eq(invoiceItems.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateInvoiceItem:", error);
      return undefined;
    }
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(invoiceItems).where(eq(invoiceItems.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteInvoiceItem:", error);
      return false;
    }
  }

  async listInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    try {
      return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    } catch (error) {
      console.error("Error in listInvoiceItemsByInvoice:", error);
      return [];
    }
  }

  // Contracte
  async getContract(id: number): Promise<Contract | undefined> {
    try {
      const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getContract:", error);
      return undefined;
    }
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    try {
      const result = await db.insert(contracts).values({
        ...insertContract,
        status: insertContract.status || "draft",
        startDate: insertContract.startDate || null,
        endDate: insertContract.endDate || null,
        value: insertContract.value || null,
        terms: insertContract.terms || null,
        projectId: insertContract.projectId || null,
        signedByClient: insertContract.signedByClient || false,
        signedByMe: insertContract.signedByMe || false,
        signedAt: null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createContract:", error);
      throw error;
    }
  }

  async updateContract(id: number, contractData: Partial<InsertContract>): Promise<Contract | undefined> {
    try {
      // Dacă contractul este marcat ca semnat, actualizăm data semnării
      if (contractData.status === "signed") {
        const contract = await this.getContract(id);
        if (contract && !contract.signedAt && contractData.signedByClient && contractData.signedByMe) {
          contractData = {
            ...contractData,
            signedAt: new Date()
          };
        }
      }
      
      const result = await db.update(contracts)
        .set(contractData)
        .where(eq(contracts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateContract:", error);
      return undefined;
    }
  }

  async deleteContract(id: number): Promise<boolean> {
    try {
      const result = await db.delete(contracts).where(eq(contracts.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteContract:", error);
      return false;
    }
  }

  async listContracts(): Promise<Contract[]> {
    try {
      return await db.select().from(contracts);
    } catch (error) {
      console.error("Error in listContracts:", error);
      return [];
    }
  }

  async listContractsByClient(clientId: number): Promise<Contract[]> {
    try {
      return await db.select().from(contracts).where(eq(contracts.clientId, clientId));
    } catch (error) {
      console.error("Error in listContractsByClient:", error);
      return [];
    }
  }

  async listContractsByProject(projectId: number): Promise<Contract[]> {
    try {
      return await db.select().from(contracts).where(eq(contracts.projectId, projectId));
    } catch (error) {
      console.error("Error in listContractsByProject:", error);
      return [];
    }
  }

  // Evenimente
  async getEvent(id: number): Promise<Event | undefined> {
    try {
      const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getEvent:", error);
      return undefined;
    }
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    try {
      const result = await db.insert(events).values({
        ...insertEvent,
        description: insertEvent.description || null,
        clientId: insertEvent.clientId || null,
        projectId: insertEvent.projectId || null,
        allDay: insertEvent.allDay || false
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createEvent:", error);
      throw error;
    }
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    try {
      const result = await db.update(events)
        .set(eventData)
        .where(eq(events.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateEvent:", error);
      return undefined;
    }
  }

  async deleteEvent(id: number): Promise<boolean> {
    try {
      const result = await db.delete(events).where(eq(events.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteEvent:", error);
      return false;
    }
  }

  async listEvents(): Promise<Event[]> {
    try {
      return await db.select().from(events);
    } catch (error) {
      console.error("Error in listEvents:", error);
      return [];
    }
  }

  async listEventsByUser(userId: number): Promise<Event[]> {
    try {
      return await db.select().from(events).where(eq(events.createdBy, userId));
    } catch (error) {
      console.error("Error in listEventsByUser:", error);
      return [];
    }
  }

  async listUpcomingEvents(limit: number = 3): Promise<Event[]> {
    try {
      const now = new Date();
      return await db
        .select()
        .from(events)
        .where(gte(events.startTime, now))
        .orderBy(events.startTime)
        .limit(limit);
    } catch (error) {
      console.error("Error in listUpcomingEvents:", error);
      return [];
    }
  }

  // Activități
  async getActivity(id: number): Promise<Activity | undefined> {
    try {
      const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getActivity:", error);
      return undefined;
    }
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    try {
      const result = await db.insert(activities).values({
        ...insertActivity,
        description: insertActivity.description || null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createActivity:", error);
      throw error;
    }
  }

  async listActivities(limit: number = 10): Promise<Activity[]> {
    try {
      return await db
        .select()
        .from(activities)
        .orderBy(desc(activities.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error in listActivities:", error);
      return [];
    }
  }

  async listActivitiesByUser(userId: number, limit: number = 10): Promise<Activity[]> {
    try {
      return await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error in listActivitiesByUser:", error);
      return [];
    }
  }

  // Dashboard Stats
  async getDashboardStats(userId: number): Promise<{
    activeProjects: number;
    pendingTasks: number;
    draftInvoices: number;
    overdueInvoices: number;
    totalEarnings: number;
    clientCount: number;
  }> {
    try {
      // Număr proiecte active
      const activeProjects = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(or(
          eq(projects.status, "not_started"),
          eq(projects.status, "in_progress")
        ));
      
      // Număr sarcini în așteptare
      const pendingTasks = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(and(
          eq(tasks.assignedTo, userId),
          or(
            eq(tasks.status, "todo"),
            eq(tasks.status, "in_progress")
          )
        ));
      
      // Număr facturi în draft
      const draftInvoices = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(eq(invoices.status, "draft"));
      
      // Număr facturi restante
      const overdueInvoices = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(and(
          eq(invoices.status, "sent"),
          lte(invoices.dueDate, new Date())
        ));
      
      // Total câștiguri
      const totalEarnings = await db
        .select({ total: sql<number>`COALESCE(SUM(paid_amount), 0)` })
        .from(invoices)
        .where(eq(invoices.status, "paid"));
      
      // Număr clienți
      const clientCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(clients);
      
      return {
        activeProjects: activeProjects[0]?.count || 0,
        pendingTasks: pendingTasks[0]?.count || 0,
        draftInvoices: draftInvoices[0]?.count || 0,
        overdueInvoices: overdueInvoices[0]?.count || 0,
        totalEarnings: totalEarnings[0]?.total || 0,
        clientCount: clientCount[0]?.count || 0
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      return {
        activeProjects: 0,
        pendingTasks: 0,
        draftInvoices: 0,
        overdueInvoices: 0,
        totalEarnings: 0,
        clientCount: 0
      };
    }
  }
}