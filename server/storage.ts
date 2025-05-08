import { 
  User, InsertUser, 
  Account, InsertAccount, 
  Transaction, InsertTransaction,
  Team, InsertTeam,
  TeamMember, InsertTeamMember,
  users, accounts, transactions, teams, teamMembers
} from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Account methods
  getAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Transaction methods
  getTransactions(userId: number, filters?: Partial<Transaction>): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Team methods
  getTeams(userId: number): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Team member methods
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Account methods
  async getAccounts(userId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }
  
  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }
  
  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }
  
  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    const [updatedAccount] = await db.update(accounts)
      .set(updates)
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return result.count > 0;
  }
  
  // Transaction methods
  async getTransactions(userId: number, filters?: Partial<Transaction>): Promise<Transaction[]> {
    // Start with base query
    let query = db.select().from(transactions).where(eq(transactions.userId, userId));
    
    // Apply filters
    if (filters) {
      if (filters.accountId) {
        query = query.where(eq(transactions.accountId, filters.accountId));
      }
      if (filters.type) {
        query = query.where(eq(transactions.type, filters.type));
      }
      if (filters.category) {
        query = query.where(eq(transactions.category, filters.category));
      }
    }
    
    // Order by date descending
    return await query.orderBy(desc(transactions.date));
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    
    // Update account balance if accountId is provided
    if (transaction.accountId) {
      const account = await this.getAccount(transaction.accountId);
      if (account) {
        let balanceChange = transaction.amount;
        if (transaction.type === 'expense') {
          balanceChange = -Math.abs(transaction.amount);
        }
        
        await this.updateAccount(account.id, {
          balance: account.balance + balanceChange
        });
      }
    }
    
    return newTransaction;
  }
  
  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db.update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return result.count > 0;
  }
  
  // Team methods
  async getTeams(userId: number): Promise<Team[]> {
    // Get teams owned by user
    const ownedTeams = await db.select().from(teams).where(eq(teams.ownerId, userId));
    
    // Get team IDs where user is a member
    const teamMemberships = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    const memberTeamIds = teamMemberships.map(m => m.teamId);
    
    if (memberTeamIds.length === 0) {
      return ownedTeams;
    }
    
    // Get teams user is a member of
    const memberTeams = await db.select().from(teams).where(
      teams.id.in(memberTeamIds)
    );
    
    // Combine and deduplicate
    const allTeams = [...ownedTeams, ...memberTeams];
    const uniqueTeams = allTeams.filter((team, index, self) => 
      index === self.findIndex(t => t.id === team.id)
    );
    
    return uniqueTeams;
  }
  
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }
  
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    
    // Add owner as team member with 'owner' role
    await this.addTeamMember({
      teamId: newTeam.id,
      userId: team.ownerId,
      role: 'owner'
    });
    
    return newTeam;
  }
  
  async updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined> {
    const [updatedTeam] = await db.update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }
  
  async deleteTeam(id: number): Promise<boolean> {
    // Delete all team members first
    await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
    
    // Then delete the team
    const result = await db.delete(teams).where(eq(teams.id, id));
    return result.count > 0;
  }
  
  // Team member methods
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }
  
  async addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(teamMember).returning();
    return newMember;
  }
  
  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const result = await db.delete(teamMembers).where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      )
    );
    return result.count > 0;
  }
}

export const storage = new DatabaseStorage();
