import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { log } from "./vite";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    // Check if users already exist
    const existingUser = await storage.getUserByUsername("demo");
    if (existingUser) {
      log("Database already seeded");
      return;
    }

    log("Seeding database with initial data...");

    // Create demo user
    const demoUser = await storage.createUser({
      username: "demo",
      email: "demo@example.com",
      password: await hashPassword("password123"),
      fullName: "Demo User",
    });

    // Create some accounts
    const checkingAccount = await storage.createAccount({
      userId: demoUser.id,
      name: "Checking Account",
      type: "bank",
      currency: "USD",
      balance: 4500,
      accountNumber: "****1234",
      icon: "bank",
    });

    const savingsAccount = await storage.createAccount({
      userId: demoUser.id,
      name: "Savings Account",
      type: "bank",
      currency: "USD",
      balance: 12000,
      accountNumber: "****5678",
      icon: "savings",
    });

    const creditCard = await storage.createAccount({
      userId: demoUser.id,
      name: "Credit Card",
      type: "credit",
      currency: "USD",
      balance: -850,
      accountNumber: "****9876",
      icon: "credit_card",
    });

    // Create some transactions
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Salary income
    await storage.createTransaction({
      userId: demoUser.id,
      accountId: checkingAccount.id,
      amount: 3500,
      type: "income",
      category: "Salary",
      description: "Monthly salary",
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      notes: "Regular monthly salary",
    });

    // Rent expense
    await storage.createTransaction({
      userId: demoUser.id,
      accountId: checkingAccount.id,
      amount: 1200,
      type: "expense",
      category: "Housing",
      description: "Monthly rent",
      date: new Date(today.getFullYear(), today.getMonth(), 3),
      notes: "Apartment rent",
    });

    // Grocery expenses
    await storage.createTransaction({
      userId: demoUser.id,
      accountId: checkingAccount.id,
      amount: 85.75,
      type: "expense",
      category: "Groceries",
      description: "Weekly grocery shopping",
      date: new Date(today.getFullYear(), today.getMonth(), 7),
      notes: "Supermarket shopping",
    });

    await storage.createTransaction({
      userId: demoUser.id,
      accountId: creditCard.id,
      amount: 63.25,
      type: "expense",
      category: "Groceries",
      description: "Grocery shopping",
      date: new Date(today.getFullYear(), today.getMonth(), 14),
      notes: "Local market",
    });

    // Dining expenses
    await storage.createTransaction({
      userId: demoUser.id,
      accountId: creditCard.id,
      amount: 45.80,
      type: "expense",
      category: "Dining",
      description: "Dinner at Restaurant",
      date: new Date(today.getFullYear(), today.getMonth(), 10),
      notes: "Dinner with friends",
    });

    // Utility bills
    await storage.createTransaction({
      userId: demoUser.id,
      accountId: checkingAccount.id,
      amount: 120,
      type: "expense",
      category: "Utilities",
      description: "Electricity bill",
      date: new Date(today.getFullYear(), today.getMonth(), 15),
      notes: "Monthly electricity",
    });

    await storage.createTransaction({
      userId: demoUser.id,
      accountId: checkingAccount.id,
      amount: 65,
      type: "expense",
      category: "Utilities",
      description: "Water bill",
      date: new Date(today.getFullYear(), today.getMonth(), 15),
      notes: "Monthly water",
    });

    await storage.createTransaction({
      userId: demoUser.id,
      accountId: checkingAccount.id,
      amount: 80,
      type: "expense",
      category: "Utilities",
      description: "Internet bill",
      date: new Date(today.getFullYear(), today.getMonth(), 16),
      notes: "Monthly internet service",
    });

    // Transfer to savings
    await storage.createTransaction({
      userId: demoUser.id,
      accountId: checkingAccount.id,
      amount: 500,
      type: "transfer",
      category: "Transfer",
      description: "Transfer to savings",
      date: new Date(today.getFullYear(), today.getMonth(), 5),
      notes: "Monthly savings deposit",
    });

    // Previous month transactions
    await storage.createTransaction({
      userId: demoUser.id,
      accountId: checkingAccount.id,
      amount: 3500,
      type: "income",
      category: "Salary",
      description: "Monthly salary",
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      notes: "Regular monthly salary",
    });

    await storage.createTransaction({
      userId: demoUser.id,
      accountId: checkingAccount.id,
      amount: 1200,
      type: "expense",
      category: "Housing",
      description: "Monthly rent",
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 3),
      notes: "Apartment rent",
    });

    // Create a team
    const personalTeam = await storage.createTeam({
      name: "Personal Finance",
      ownerId: demoUser.id,
    });

    log("Database seeded successfully!");
  } catch (error) {
    log("Error seeding database:", error instanceof Error ? error.message : String(error));
  }
}