import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertAccountSchema, insertTransactionSchema, insertTeamSchema, insertTeamMemberSchema } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes (login, register, logout, get current user)
  setupAuth(app);

  // Accounts API
  app.get("/api/accounts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const accounts = await storage.getAccounts(req.user.id);
    res.json(accounts);
  });
  
  app.post("/api/accounts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const accountData = insertAccountSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.get("/api/accounts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const accountId = parseInt(req.params.id);
    const account = await storage.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    if (account.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(account);
  });
  
  app.put("/api/accounts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const accountId = parseInt(req.params.id);
    const account = await storage.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    if (account.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const updatedAccount = await storage.updateAccount(accountId, req.body);
      res.json(updatedAccount);
    } catch (error) {
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.delete("/api/accounts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const accountId = parseInt(req.params.id);
    const account = await storage.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    if (account.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const success = await storage.deleteAccount(accountId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
  
  // Transactions API
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Parse potential filters from query params
    const filters: any = {};
    if (req.query.accountId) {
      filters.accountId = parseInt(req.query.accountId as string);
    }
    if (req.query.type) {
      filters.type = req.query.type as string;
    }
    if (req.query.category) {
      filters.category = req.query.category as string;
    }
    
    const transactions = await storage.getTransactions(req.user.id, filters);
    res.json(transactions);
  });
  
  app.post("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // If accountId is provided, verify it belongs to the user
      if (transactionData.accountId) {
        const account = await storage.getAccount(transactionData.accountId);
        if (!account || account.userId !== req.user.id) {
          return res.status(403).json({ message: "Invalid account ID" });
        }
      }
      
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.get("/api/transactions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const transactionId = parseInt(req.params.id);
    const transaction = await storage.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(transaction);
  });
  
  app.put("/api/transactions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const transactionId = parseInt(req.params.id);
    const transaction = await storage.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const updatedTransaction = await storage.updateTransaction(transactionId, req.body);
      res.json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.delete("/api/transactions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const transactionId = parseInt(req.params.id);
    const transaction = await storage.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const success = await storage.deleteTransaction(transactionId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });
  
  // Teams API
  app.get("/api/teams", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const teams = await storage.getTeams(req.user.id);
    res.json(teams);
  });
  
  app.post("/api/teams", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const teamData = insertTeamSchema.parse({
        ...req.body,
        ownerId: req.user.id
      });
      
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.get("/api/teams/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const teamId = parseInt(req.params.id);
    const team = await storage.getTeam(teamId);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    // Check if user is a member of the team
    const teams = await storage.getTeams(req.user.id);
    if (!teams.find(t => t.id === teamId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(team);
  });
  
  app.get("/api/teams/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const teamId = parseInt(req.params.id);
    const team = await storage.getTeam(teamId);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    // Check if user is a member of the team
    const teams = await storage.getTeams(req.user.id);
    if (!teams.find(t => t.id === teamId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const members = await storage.getTeamMembers(teamId);
    
    // Get full user details for each member
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await storage.getUser(member.userId);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          return {
            ...member,
            user: userWithoutPassword
          };
        }
        return member;
      })
    );
    
    res.json(memberDetails);
  });
  
  app.post("/api/teams/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const teamId = parseInt(req.params.id);
    const team = await storage.getTeam(teamId);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    // Only team owner can add members
    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Only team owner can add members" });
    }
    
    try {
      // Validate username exists
      const userToAdd = await storage.getUserByUsername(req.body.username);
      if (!userToAdd) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already a member
      const members = await storage.getTeamMembers(teamId);
      if (members.some(m => m.userId === userToAdd.id)) {
        return res.status(400).json({ message: "User is already a member" });
      }
      
      const memberData = insertTeamMemberSchema.parse({
        teamId,
        userId: userToAdd.id,
        role: req.body.role || "member"
      });
      
      const member = await storage.addTeamMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.delete("/api/teams/:id/members/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const teamId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    const team = await storage.getTeam(teamId);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    // Only team owner can remove members (unless removing self)
    if (team.ownerId !== req.user.id && userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Cannot remove the owner
    if (userId === team.ownerId) {
      return res.status(400).json({ message: "Cannot remove team owner" });
    }
    
    const success = await storage.removeTeamMember(teamId, userId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Member not found" });
    }
  });

  // User profile API routes
  app.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { fullName, email } = req.body;
      
      // Check if email is already taken by another user
      if (email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      const updatedUser = await storage.updateUser(req.user.id, { 
        fullName, 
        email 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.put("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // In a real application, you would use a proper password verification function
      // This is a simplified example
      if (!(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(req.user.id, { 
        password: hashedPassword 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Simple currency conversion API
  app.get("/api/currency", (req, res) => {
    // Hardcoded exchange rates for simplicity
    // In a real app, this would call an external API
    const rates = {
      USD: 1,
      EUR: 0.93,
      GBP: 0.81,
      JPY: 149.32,
      CAD: 1.37,
      AUD: 1.55,
      CNY: 7.21,
      INR: 83.14,
      PHP: 57.34
    };
    
    res.json(rates);
  });

  const httpServer = createServer(app);
  return httpServer;
}
