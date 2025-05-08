import { Transaction, Account } from "@shared/schema";
import { useCurrency } from "@/hooks/use-currency";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TransactionItemProps {
  transaction: Transaction;
  accounts: Account[];
  showDateHeader?: boolean;
}

export function TransactionItem({ transaction, accounts, showDateHeader = false }: TransactionItemProps) {
  const { formatAmount } = useCurrency();
  
  const account = accounts.find(a => a.id === transaction.accountId);
  
  const formatDate = (date: string | Date) => {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(parsedDate, 'MMM dd, yyyy');
  };
  
  const getIcon = () => {
    switch (transaction.type) {
      case "income":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case "expense":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    }
  };
  
  const getCategoryColor = () => {
    switch (transaction.type) {
      case "income":
        return "bg-green-100 text-green-800";
      case "expense":
        return "bg-yellow-100 text-yellow-800";
      case "transfer":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getAmountColor = () => {
    switch (transaction.type) {
      case "income":
        return "text-green-600";
      case "expense":
        return "text-red-600";
      case "transfer":
        return "text-blue-600";
      default:
        return "text-gray-900";
    }
  };
  
  const getAmountPrefix = () => {
    switch (transaction.type) {
      case "income":
        return "+";
      case "expense":
        return "-";
      default:
        return "";
    }
  };
  
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(transaction.date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
            <div className="text-xs text-gray-500">{transaction.notes || "No notes"}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor()}`}>
          {transaction.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {account?.name || "Unknown Account"}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getAmountColor()}`}>
        {getAmountPrefix()}{formatAmount(Math.abs(transaction.amount))}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Transaction</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
