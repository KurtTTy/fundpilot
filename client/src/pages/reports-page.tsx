import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CurrencyProvider, useCurrency } from "@/hooks/use-currency";
import { DateRangeSelector } from "@/components/dashboard/date-range-selector";
import { IncomeExpensesChart } from "@/components/dashboard/income-expenses-chart";
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import { format, subMonths, parseISO } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<string>("month");
  const [reportTab, setReportTab] = useState<string>("overview");

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<
    Transaction[]
  >({
    queryKey: ["/api/transactions"],
  });

  const { formatAmount } = useCurrency();

  // Filter transactions based on date range
  const filteredTransactions = transactions.filter((transaction) => {
    const date =
      typeof transaction.date === "string"
        ? parseISO(transaction.date)
        : new Date(transaction.date);
    const now = new Date();

    switch (dateRange) {
      case "today":
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      case "week":
        const lastWeek = subMonths(now, 0);
        lastWeek.setDate(now.getDate() - 7);
        return date >= lastWeek && date <= now;
      case "month":
        const lastMonth = subMonths(now, 0);
        lastMonth.setDate(1);
        return date >= lastMonth && date <= now;
      case "year":
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  const incomeTransactions = filteredTransactions.filter(
    (t) => t.type === "income"
  );
  const expenseTransactions = filteredTransactions.filter(
    (t) => t.type === "expense"
  );

  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const totalExpenses = expenseTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );
  const netSavings = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Create data for savings trend
  const savingsTrendData = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), 11 - i);
    const monthTransactions = transactions.filter((t) => {
      const tDate =
        typeof t.date === "string"
          ? parseISO(t.date)
          : new Date(t.date);
      return (
        tDate.getMonth() === date.getMonth() &&
        tDate.getFullYear() === date.getFullYear()
      );
    });

    const monthIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const monthExpenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const monthSavings = monthIncome - monthExpenses;
    const monthSavingsRate = monthIncome > 0 ? (monthSavings / monthIncome) * 100 : 0;

    return {
      month: format(date, "MMM"),
      savingsRate: monthSavingsRate,
      savings: monthSavings,
    };
  });

  // Create category spending data
  const categorySpendingData = (() => {
    const categories: Record<string, number> = {};
    
    expenseTransactions.forEach((transaction) => {
      categories[transaction.category] = (categories[transaction.category] || 0) + Math.abs(transaction.amount);
    });
    
    return Object.entries(categories)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  })();

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-sm mb-1">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.name === 'savingsRate' 
                ? `${entry.value.toFixed(1)}%` 
                : formatAmount(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Helmet>
          <title>Reports | Fund Pilot</title>
          <meta
            name="description"
            content="Analyze your financial data with detailed reports and visualizations."
          />
        </Helmet>

        <Sidebar />

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />

          <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
              <p className="mt-1 text-sm text-gray-500">
                Analyze your financial data and trends.
              </p>
            </div>

            <div className="mb-6">
              <DateRangeSelector
                value={dateRange}
                onChange={setDateRange}
              />
            </div>

            <Tabs value={reportTab} onValueChange={setReportTab}>
              <TabsList className="mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="income">Income Analysis</TabsTrigger>
                <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
                <TabsTrigger value="savings">Savings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-gray-900">
                        Total Income
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {transactionsLoading ? (
                        <Skeleton className="h-10 w-32" />
                      ) : (
                        <div className="text-2xl font-bold text-green-600">
                          {formatAmount(totalIncome)}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-gray-900">
                        Total Expenses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {transactionsLoading ? (
                        <Skeleton className="h-10 w-32" />
                      ) : (
                        <div className="text-2xl font-bold text-red-600">
                          {formatAmount(totalExpenses)}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-gray-900">
                        Net Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {transactionsLoading ? (
                        <Skeleton className="h-10 w-32" />
                      ) : (
                        <div
                          className={`text-2xl font-bold ${
                            netSavings >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatAmount(netSavings)}
                          <span className="ml-2 text-sm font-medium text-gray-500">
                            ({savingsRate.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Income vs Expenses Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Income vs Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <Skeleton className="h-80 w-full" />
                    ) : (
                      <IncomeExpensesChart transactions={transactions} />
                    )}
                  </CardContent>
                </Card>

                {/* Expense Breakdown Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <Skeleton className="h-80 w-full" />
                    ) : (
                      <ExpenseBreakdownChart
                        transactions={expenseTransactions}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="income" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Income Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <Skeleton className="h-80 w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart
                          data={savingsTrendData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="savings"
                            name="Savings"
                            stroke="#22C55E"
                            fill="#22C55E"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses" className="space-y-6">
                {/* Category Spending */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category Spending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <Skeleton className="h-80 w-full" />
                    ) : (
                      <div className="space-y-4">
                        {categorySpendingData.map((item) => (
                          <div key={item.category}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">
                                {item.category}
                              </span>
                              <span className="text-sm font-medium">
                                {formatAmount(item.amount)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (item.amount / totalExpenses) * 100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="savings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Savings Rate Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <Skeleton className="h-80 w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                          data={savingsTrendData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="savingsRate"
                            name="Savings Rate"
                            stroke="#1E88E5"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <MobileNav />
    </CurrencyProvider>
  );
}
