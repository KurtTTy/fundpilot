import { useMemo } from "react";
import { Transaction } from "@shared/schema";
import { useCurrency } from "@/hooks/use-currency";
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface IncomeExpensesChartProps {
  transactions: Transaction[];
}

export function IncomeExpensesChart({ transactions }: IncomeExpensesChartProps) {
  const { formatAmount } = useCurrency();
  
  const chartData = useMemo(() => {
    const now = new Date();
    const monthsToShow = 6;
    
    // Initialize data with empty months
    const data = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      data.push({
        month: format(date, 'MMM'),
        income: 0,
        expenses: 0,
        date: date,
      });
    }
    
    // Map transactions to months
    transactions.forEach(transaction => {
      const transactionDate = typeof transaction.date === 'string' 
        ? parseISO(transaction.date) 
        : new Date(transaction.date);
      
      // Check if transaction is within our range
      const monthIndex = data.findIndex(d => 
        transactionDate >= startOfMonth(d.date) && 
        transactionDate <= endOfMonth(d.date)
      );
      
      if (monthIndex !== -1) {
        if (transaction.type === 'income') {
          data[monthIndex].income += transaction.amount;
        } else if (transaction.type === 'expense') {
          data[monthIndex].expenses += Math.abs(transaction.amount);
        }
      }
    });
    
    return data;
  }, [transactions]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-sm mb-1">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatAmount(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis
          tickFormatter={(value) => `${value > 999 ? `${(value / 1000).toFixed(0)}k` : value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#1E88E5" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
