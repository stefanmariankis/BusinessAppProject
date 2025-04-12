import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertClientSchema, 
  insertProjectSchema, 
  insertTaskSchema, 
  insertTimeEntrySchema, 
  insertInvoiceSchema, 
  insertInvoiceItemSchema, 
  insertContractSchema, 
  insertEventSchema, 
  insertActivitySchema
} from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint pentru verificarea stării aplicației
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Setup authentication and session
  setupAuth(app);
  
  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };

  // User routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users', error: (error as Error).message });
    }
  });

  app.get('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user', error: (error as Error).message });
    }
  });

  app.post('/api/users', isAuthenticated, async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid user data', errors: validation.error.errors });
      }
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      const user = await storage.createUser(validation.data);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user', error: (error as Error).message });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertUserSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid user data', errors: validation.error.errors });
      }
      
      const user = await storage.updateUser(id, validation.data);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user', error: (error as Error).message });
    }
  });

  // Client routes
  app.get('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.listClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch clients', error: (error as Error).message });
    }
  });

  app.get('/api/clients/:id', isAuthenticated, async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client', error: (error as Error).message });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const validation = insertClientSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid client data', errors: validation.error.errors });
      }
      
      const client = await storage.createClient(validation.data);
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'create',
        entityType: 'client',
        entityId: client.id,
        description: `Added new client: ${client.name}`
      });
      
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create client', error: (error as Error).message });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertClientSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid client data', errors: validation.error.errors });
      }
      
      const client = await storage.updateClient(id, validation.data);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'client',
        entityId: client.id,
        description: `Updated client: ${client.name}`
      });
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update client', error: (error as Error).message });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      const deleted = await storage.deleteClient(id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete client' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'delete',
        entityType: 'client',
        entityId: id,
        description: `Deleted client: ${client.name}`
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete client', error: (error as Error).message });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      if (clientId) {
        const projects = await storage.listProjectsByClient(clientId);
        return res.json(projects);
      }
      
      const projects = await storage.listProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch projects', error: (error as Error).message });
    }
  });

  app.get('/api/projects/active', isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.listActiveProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch active projects', error: (error as Error).message });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch project', error: (error as Error).message });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const validation = insertProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid project data', errors: validation.error.errors });
      }
      
      const project = await storage.createProject(validation.data);
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'create',
        entityType: 'project',
        entityId: project.id,
        description: `Created new project: ${project.name}`
      });
      
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create project', error: (error as Error).message });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertProjectSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid project data', errors: validation.error.errors });
      }
      
      const project = await storage.updateProject(id, validation.data);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'project',
        entityId: project.id,
        description: `Updated project: ${project.name}`
      });
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update project', error: (error as Error).message });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete project' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'delete',
        entityType: 'project',
        entityId: id,
        description: `Deleted project: ${project.name}`
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete project', error: (error as Error).message });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const assignedTo = req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined;
      
      if (projectId) {
        const tasks = await storage.listTasksByProject(projectId);
        return res.json(tasks);
      }
      
      if (assignedTo) {
        const tasks = await storage.listTasksByAssignee(assignedTo);
        return res.json(tasks);
      }
      
      const tasks = await storage.listTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tasks', error: (error as Error).message });
    }
  });

  app.get('/api/tasks/upcoming', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const tasks = await storage.listUpcomingTasks(userId, limit);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch upcoming tasks', error: (error as Error).message });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch task', error: (error as Error).message });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const validation = insertTaskSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid task data', errors: validation.error.errors });
      }
      
      const task = await storage.createTask(validation.data);
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'create',
        entityType: 'task',
        entityId: task.id,
        description: `Created new task: ${task.title}`
      });
      
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create task', error: (error as Error).message });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertTaskSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid task data', errors: validation.error.errors });
      }
      
      // Check if task is being completed
      const task = await storage.getTask(id);
      if (task && !task.completedAt && validation.data.status === 'completed') {
        validation.data.completedAt = new Date();
      }
      
      const updatedTask = await storage.updateTask(id, validation.data);
      if (!updatedTask) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'task',
        entityId: updatedTask.id,
        description: `Updated task: ${updatedTask.title}`
      });
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update task', error: (error as Error).message });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete task' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'delete',
        entityType: 'task',
        entityId: id,
        description: `Deleted task: ${task.title}`
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete task', error: (error as Error).message });
    }
  });

  // Time entry routes
  app.get('/api/time-entries', isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const taskId = req.query.taskId ? parseInt(req.query.taskId as string) : undefined;
      
      if (userId) {
        const entries = await storage.listTimeEntriesByUser(userId);
        return res.json(entries);
      }
      
      if (projectId) {
        const entries = await storage.listTimeEntriesByProject(projectId);
        return res.json(entries);
      }
      
      if (taskId) {
        const entries = await storage.listTimeEntriesByTask(taskId);
        return res.json(entries);
      }
      
      const entries = await storage.listTimeEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch time entries', error: (error as Error).message });
    }
  });

  app.get('/api/time-entries/:id', isAuthenticated, async (req, res) => {
    try {
      const entry = await storage.getTimeEntry(parseInt(req.params.id));
      if (!entry) {
        return res.status(404).json({ message: 'Time entry not found' });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch time entry', error: (error as Error).message });
    }
  });

  app.post('/api/time-entries', isAuthenticated, async (req, res) => {
    try {
      const validation = insertTimeEntrySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid time entry data', errors: validation.error.errors });
      }
      
      // Calculate duration if endTime is provided
      let data = validation.data;
      if (data.endTime) {
        const start = new Date(data.startTime).getTime();
        const end = new Date(data.endTime).getTime();
        data.duration = (end - start) / (1000 * 60 * 60); // in hours
      }
      
      const entry = await storage.createTimeEntry(data);
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'create',
        entityType: 'time_entry',
        entityId: entry.id,
        description: `Logged time: ${entry.duration ? `${entry.duration.toFixed(2)} hours` : 'Started timer'}`
      });
      
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create time entry', error: (error as Error).message });
    }
  });

  app.put('/api/time-entries/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertTimeEntrySchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid time entry data', errors: validation.error.errors });
      }
      
      // Calculate duration if endTime is provided
      let data = validation.data;
      if (data.endTime) {
        const timeEntry = await storage.getTimeEntry(id);
        if (timeEntry) {
          const start = new Date(data.startTime || timeEntry.startTime).getTime();
          const end = new Date(data.endTime).getTime();
          data.duration = (end - start) / (1000 * 60 * 60); // in hours
        }
      }
      
      const entry = await storage.updateTimeEntry(id, data);
      if (!entry) {
        return res.status(404).json({ message: 'Time entry not found' });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update time entry', error: (error as Error).message });
    }
  });

  app.delete('/api/time-entries/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTimeEntry(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Time entry not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete time entry', error: (error as Error).message });
    }
  });

  // Invoice routes
  app.get('/api/invoices', isAuthenticated, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      if (clientId) {
        const invoices = await storage.listInvoicesByClient(clientId);
        return res.json(invoices);
      }
      
      if (status) {
        const invoices = await storage.listInvoicesByStatus(status);
        return res.json(invoices);
      }
      
      const invoices = await storage.listInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch invoices', error: (error as Error).message });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.getInvoiceWithItems(id);
      if (!result) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch invoice', error: (error as Error).message });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req, res) => {
    try {
      const validation = insertInvoiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid invoice data', errors: validation.error.errors });
      }
      
      const invoice = await storage.createInvoice(validation.data);
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'create',
        entityType: 'invoice',
        entityId: invoice.id,
        description: `Created invoice #${invoice.invoiceNumber} for €${invoice.total.toFixed(2)}`
      });
      
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create invoice', error: (error as Error).message });
    }
  });

  app.post('/api/invoices/:id/items', isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      const validation = insertInvoiceItemSchema.safeParse({ ...req.body, invoiceId });
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid invoice item data', errors: validation.error.errors });
      }
      
      const item = await storage.createInvoiceItem(validation.data);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create invoice item', error: (error as Error).message });
    }
  });

  app.put('/api/invoices/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertInvoiceSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid invoice data', errors: validation.error.errors });
      }
      
      // Check if status is being changed to paid
      const data = validation.data;
      if (data.status === 'paid' && !data.paidAt) {
        data.paidAt = new Date();
      }
      
      const invoice = await storage.updateInvoice(id, data);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'invoice',
        entityId: invoice.id,
        description: `Updated invoice #${invoice.invoiceNumber}`
      });
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update invoice', error: (error as Error).message });
    }
  });

  app.delete('/api/invoices/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      const deleted = await storage.deleteInvoice(id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete invoice' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'delete',
        entityType: 'invoice',
        entityId: id,
        description: `Deleted invoice #${invoice.invoiceNumber}`
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete invoice', error: (error as Error).message });
    }
  });

  // Contract routes
  app.get('/api/contracts', isAuthenticated, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      if (clientId) {
        const contracts = await storage.listContractsByClient(clientId);
        return res.json(contracts);
      }
      
      if (projectId) {
        const contracts = await storage.listContractsByProject(projectId);
        return res.json(contracts);
      }
      
      const contracts = await storage.listContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch contracts', error: (error as Error).message });
    }
  });

  app.get('/api/contracts/:id', isAuthenticated, async (req, res) => {
    try {
      const contract = await storage.getContract(parseInt(req.params.id));
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch contract', error: (error as Error).message });
    }
  });

  app.post('/api/contracts', isAuthenticated, async (req, res) => {
    try {
      const validation = insertContractSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid contract data', errors: validation.error.errors });
      }
      
      const contract = await storage.createContract(validation.data);
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'create',
        entityType: 'contract',
        entityId: contract.id,
        description: `Created new contract: ${contract.title}`
      });
      
      res.status(201).json(contract);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create contract', error: (error as Error).message });
    }
  });

  app.put('/api/contracts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertContractSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid contract data', errors: validation.error.errors });
      }
      
      // If both parties have signed, update the signedAt timestamp
      const data = validation.data;
      const contract = await storage.getContract(id);
      
      if (contract && !contract.signedAt && 
          ((data.signedByClient && contract.signedByMe) || 
           (data.signedByMe && contract.signedByClient) || 
           (data.signedByClient && data.signedByMe))) {
        data.signedAt = new Date();
        data.status = 'signed';
      }
      
      const updatedContract = await storage.updateContract(id, data);
      if (!updatedContract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'contract',
        entityId: updatedContract.id,
        description: `Updated contract: ${updatedContract.title}`
      });
      
      res.json(updatedContract);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update contract', error: (error as Error).message });
    }
  });

  app.delete('/api/contracts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      const deleted = await storage.deleteContract(id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete contract' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'delete',
        entityType: 'contract',
        entityId: id,
        description: `Deleted contract: ${contract.title}`
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete contract', error: (error as Error).message });
    }
  });

  // Event routes
  app.get('/api/events', isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (userId) {
        const events = await storage.listEventsByUser(userId);
        return res.json(events);
      }
      
      const events = await storage.listEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch events', error: (error as Error).message });
    }
  });

  app.get('/api/events/upcoming', isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const events = await storage.listUpcomingEvents(limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch upcoming events', error: (error as Error).message });
    }
  });

  app.get('/api/events/:id', isAuthenticated, async (req, res) => {
    try {
      const event = await storage.getEvent(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event', error: (error as Error).message });
    }
  });

  app.post('/api/events', isAuthenticated, async (req, res) => {
    try {
      const validation = insertEventSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid event data', errors: validation.error.errors });
      }
      
      const event = await storage.createEvent(validation.data);
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'create',
        entityType: 'event',
        entityId: event.id,
        description: `Created new event: ${event.title}`
      });
      
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create event', error: (error as Error).message });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertEventSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid event data', errors: validation.error.errors });
      }
      
      const event = await storage.updateEvent(id, validation.data);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'event',
        entityId: event.id,
        description: `Updated event: ${event.title}`
      });
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update event', error: (error as Error).message });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const deleted = await storage.deleteEvent(id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete event' });
      }
      
      // Record activity
      await storage.createActivity({
        userId: (req.user as any).id,
        action: 'delete',
        entityType: 'event',
        entityId: id,
        description: `Deleted event: ${event.title}`
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event', error: (error as Error).message });
    }
  });

  // Activity routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (userId) {
        const activities = await storage.listActivitiesByUser(userId, limit);
        return res.json(activities);
      }
      
      const activities = await storage.listActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch activities', error: (error as Error).message });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard stats', error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
