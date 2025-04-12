import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const statusEnum = pgEnum('status', ['pending', 'in_progress', 'completed', 'canceled']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'canceled']);
export const contractStatusEnum = pgEnum('contract_status', ['draft', 'sent', 'signed', 'expired', 'canceled']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'review', 'completed']);
export const projectStatusEnum = pgEnum('project_status', ['not_started', 'in_progress', 'on_hold', 'completed', 'canceled']);
export const languageEnum = pgEnum('language', ['en', 'ro']);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull().default("user"),
  language: languageEnum("language").notNull().default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Clients Table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  contactPerson: text("contact_person"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// Projects Table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  clientId: integer("client_id").notNull().references(() => clients.id),
  status: projectStatusEnum("status").notNull().default("not_started"),
  startDate: timestamp("start_date"),
  deadline: timestamp("deadline"),
  completedAt: timestamp("completed_at"),
  budget: doublePrecision("budget"),
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// Tasks Table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  projectId: integer("project_id").references(() => projects.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: priorityEnum("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  estimatedHours: doublePrecision("estimated_hours"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// Time Entries Table
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id),
  projectId: integer("project_id").references(() => projects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: doublePrecision("duration"),
  billable: boolean("billable").notNull().default(true),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invoices Table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  subtotal: doublePrecision("subtotal").notNull(),
  tax: doublePrecision("tax"),
  discount: doublePrecision("discount"),
  total: doublePrecision("total").notNull(),
  notes: text("notes"),
  terms: text("terms"),
  paidAt: timestamp("paid_at"),
  paidAmount: doublePrecision("paid_amount"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// Invoice Items Table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  amount: doublePrecision("amount").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  taskId: integer("task_id").references(() => tasks.id),
});

// Contracts Table
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  status: contractStatusEnum("status").notNull().default("draft"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  value: doublePrecision("value"),
  terms: text("terms"),
  signedByClient: boolean("signed_by_client").default(false),
  signedByMe: boolean("signed_by_me").default(false),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// Events Table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  allDay: boolean("all_day").default(false),
  clientId: integer("client_id").references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// Activities Table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertClientSchema = createInsertSchema(clients).omit({ 
  id: true, 
  createdAt: true 
});

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  createdAt: true, 
  completedAt: true 
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ 
  id: true, 
  createdAt: true, 
  completedAt: true 
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ 
  id: true, 
  createdAt: true 
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ 
  id: true, 
  createdAt: true, 
  paidAt: true 
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ 
  id: true 
});

export const insertContractSchema = createInsertSchema(contracts).omit({ 
  id: true, 
  createdAt: true, 
  signedAt: true 
});

export const insertEventSchema = createInsertSchema(events).omit({ 
  id: true, 
  createdAt: true 
});

export const insertActivitySchema = createInsertSchema(activities).omit({ 
  id: true, 
  createdAt: true 
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
