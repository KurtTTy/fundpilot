import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Account, Transaction } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DateRangeSelector } from "@/components/dashboard/date-range-selector";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { IncomeExpensesChart } from "@/components/dashboard/income-expenses-chart";
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import { ConnectedAccountItem } from "@/components/dashboard/connected-account-item";
import { TransactionItem } from "@/components/dashboard/transaction-item";
import { AIInsightCard } from "@/components/dashboard/ai-insight-card";
import { useAuth } from "@/hooks/use-auth";
import { CurrencyProvider } from "@/hooks/use-currency";

import { Button } from "@/components/ui/button";
import { Plus, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<string>("today");
  
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });
  
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });
  
  // Calculate summary figures
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  const incomeTransactions = transactions.filter(t => t.type === "income");
  const expenseTransactions = transactions.filter(t => t.type === "expense");
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  
  // AI Insights (static for demo)
  const insights = [
    {
      type: "spending",
      title: "Spending Alert",
      description: "Your restaurant spending is 35% higher than last month. Consider setting a budget for dining out.",
      action: "Create Budget",
      icon: "trending_down",
    },
    {
      type: "saving",
      title: "Saving Opportunity",
      description: "You could save $243/year by switching to a no-fee checking account. Here are some options.",
      action: "View Options",
      icon: "auto_awesome",
    },
    {
      type: "subscription",
      title: "Subscription Tracking",
      description: "You have 8 active subscriptions totaling $112.86/month. We found 2 that you haven't used recently.",
      action: "Review Subscriptions",
      icon: "lightbulb",
    },
    {
      type: "forecast",
      title: "Income Forecast",
      description: "Based on your past 6 months, we project your Q4 income will be $15,240 (up 8% from Q3).",
      action: "View Forecast",
      icon: "account_balance",
    },
  ];

  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Helmet>
          <title>Dashboard | Fund Pilot</title>
          <meta name="description" content="View your financial overview, track expenses and income, and get financial insights." />
        </Helmet>
        
        <Sidebar />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          
          <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Dashboard Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Welcome back, {user?.fullName || user?.username}. Here's your financial overview.</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Income
                </Button>
                <Button size="sm">
                  <Wallet className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            </div>
            
            {/* Date Range Selector */}
            <div className="mb-6">
              <DateRangeSelector value={dateRange} onChange={setDateRange} />
            </div>
            
            {/* Financial Summary Cards */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard 
                title="Total Balance"
                value={totalBalance}
                icon="account_balance"
                color="primary"
                change={3.2}
                changePeriod="Last updated 4h ago"
                isLoading={accountsLoading}
              />
              
              <SummaryCard 
                title="Total Income"
                value={totalIncome}
                icon="trending_up"
                color="success"
                change={12.5}
                changePeriod="This month"
                isLoading={transactionsLoading}
              />
              
              <SummaryCard 
                title="Total Expenses"
                value={totalExpenses}
                icon="trending_down"
                color="error"
                change={8.1}
                changePeriod="This month"
                isLoading={transactionsLoading}
              />
              
              <SummaryCard 
                title="Savings Rate"
                value={savingsRate}
                icon="savings"
                color="secondary"
                isPercentage
                progressValue={savingsRate}
                isLoading={transactionsLoading}
              />
            </div>
            
            {/* Charts Section */}
            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">Income vs Expenses</CardTitle>
                    <div className="flex space-x-2">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <span className="w-2 h-2 mr-1 rounded-full bg-primary-500"></span>
                        Income
                      </div>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="w-2 h-2 mr-1 rounded-full bg-red-500"></span>
                        Expenses
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <IncomeExpensesChart transactions={transactions} />
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">Expense Breakdown</CardTitle>
                    <select className="border-none text-sm font-medium text-gray-700 bg-transparent focus:outline-none focus:ring-0">
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ExpenseBreakdownChart transactions={expenseTransactions} />
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Connected Accounts */}
            <div className="mb-6">
              <Card>
                <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-medium">Connected Accounts</CardTitle>
                  <Button
                    variant="subtle"
                    size="sm"
                    className="text-primary-700 bg-primary-50 hover:bg-primary-100"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Account
                  </Button>
                </CardHeader>
                <CardContent className="px-0 py-0">
                  {accountsLoading ? (
                    <div className="px-6 py-4 space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-500">No accounts connected yet.</p>
                      <Button
                        variant="link"
                        className="mt-2 text-primary-500"
                      >
                        Connect your first account
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {accounts.map((account) => (
                        <ConnectedAccountItem key={account.id} account={account} />
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Transactions */}
            <div className="mb-6">
              <Card>
                <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
                  <Button variant="link" className="text-primary-600 hover:text-primary-900">
                    View all
                  </Button>
                </CardHeader>
                <CardContent className="px-0 py-0">
                  {transactionsLoading ? (
                    <div className="px-6 py-4 space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : recentTransactions.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-500">No transactions found.</p>
                      <Button
                        variant="link"
                        className="mt-2 text-primary-500"
                      >
                        Add your first transaction
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-72">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentTransactions.map(transaction => (
                              <TransactionItem 
                                key={transaction.id} 
                                transaction={transaction} 
                                accounts={accounts}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Smart Insights */}
            <div className="mb-6">
              <Card>
                <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-medium">AI Insights</CardTitle>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    <span className="mr-1">✨</span>
                    Pro Feature
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {insights.map((insight, index) => (
                      <AIInsightCard
                        key={index}
                        type={insight.type}
                        title={insight.title}
                        description={insight.description}
                        actionText={insight.action}
                        icon={insight.icon}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </CurrencyProvider>
  );
}
