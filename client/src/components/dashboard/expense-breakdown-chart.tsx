import { useMemo } from "react";
import { Transaction } from "@shared/schema";
import { useCurrency } from "@/hooks/use-currency";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector
} from "recharts";
import { useState } from "react";

interface ExpenseBreakdownChartProps {
  transactions: Transaction[];
}

export function ExpenseBreakdownChart({ transactions }: ExpenseBreakdownChartProps) {
  const { formatAmount } = useCurrency();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  
  const chartData = useMemo(() => {
    // Group transactions by category and sum up the amounts
    const categories: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const { category, amount } = transaction;
        categories[category] = (categories[category] || 0) + Math.abs(amount);
      }
    });
    
    // Convert to chart data format and sort by amount (descending)
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);
  
  // Colors for the pie chart segments
  const COLORS = [
    '#1E88E5', '#26A69A', '#F59E0B', '#EF4444', '#9C27B0', 
    '#3949AB', '#00897B', '#FFC107', '#E53935', '#673AB7'
  ];
  
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    
    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#333" className="text-sm font-medium">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#333" className="text-lg font-semibold">
          {formatAmount(value)}
        </text>
        <text x={cx} y={cy} dy={25} textAnchor="middle" fill="#666" className="text-xs">
          {`${(value / transactions.reduce((sum, t) => t.type === 'expense' ? sum + Math.abs(t.amount) : sum, 0) * 100).toFixed(1)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 4}
          outerRadius={outerRadius}
          fill={fill}
        />
      </g>
    );
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalExpenses = transactions.reduce(
        (sum, t) => (t.type === 'expense' ? sum + Math.abs(t.amount) : sum),
        0
      );
      const percentage = ((data.value / totalExpenses) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-sm mb-1">{data.name}</p>
          <p className="text-sm">{formatAmount(data.value)}</p>
          <p className="text-xs text-gray-500">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(undefined);
  };
  
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No expense data available</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={chartData}
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout="vertical" 
          align="right" 
          verticalAlign="middle"
          formatter={(value, entry: any, index) => {
            return (
              <span className="text-xs">
                {value} ({((chartData[index].value / transactions.reduce((sum, t) => t.type === 'expense' ? sum + Math.abs(t.amount) : sum, 0)) * 100).toFixed(0)}%)
              </span>
            )
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
