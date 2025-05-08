import { Account } from "@shared/schema";
import { useCurrency } from "@/hooks/use-currency";
import { ChevronRight, CreditCard, Wallet, Building, Banknote } from "lucide-react";

interface ConnectedAccountItemProps {
  account: Account;
}

export function ConnectedAccountItem({ account }: ConnectedAccountItemProps) {
  const { formatAmount } = useCurrency();
  
  const getAccountIcon = () => {
    switch (account.type) {
      case "bank":
        return <Building className="h-6 w-6 text-blue-600" />;
      case "credit":
        return <CreditCard className="h-6 w-6 text-red-600" />;
      case "ewallet":
        return <Wallet className="h-6 w-6 text-purple-600" />;
      default:
        return <Banknote className="h-6 w-6 text-blue-600" />;
    }
  };
  
  const getBgColor = () => {
    switch (account.type) {
      case "bank":
        return "bg-blue-100";
      case "credit":
        return "bg-red-100";
      case "ewallet":
        return "bg-purple-100";
      default:
        return "bg-blue-100";
    }
  };
  
  return (
    <li>
      <div className="px-4 py-4 flex items-center sm:px-6">
        <div className="min-w-0 flex-1 flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-12 w-12 rounded-full ${getBgColor()} flex items-center justify-center`}>
              {getAccountIcon()}
            </div>
          </div>
          <div className="min-w-0 flex-1 px-4">
            <div>
              <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
              <p className="mt-1 text-sm text-gray-500">Account ending in {account.accountNumber.slice(-4)}</p>
            </div>
          </div>
        </div>
        <div className="ml-5 flex-shrink-0">
          <div className="flex items-center">
            <span className={`text-lg font-semibold ${account.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatAmount(account.balance, account.currency)}
            </span>
            <ChevronRight className="ml-2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </li>
  );
}
