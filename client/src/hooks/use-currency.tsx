import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type CurrencyRates = Record<string, number>;

type CurrencyContextType = {
  currentCurrency: string;
  currencies: string[];
  setCurrency: (currency: string) => void;
  convert: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatAmount: (amount: number, currency?: string) => string;
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currentCurrency, setCurrentCurrency] = useState<string>("USD");
  
  const { data: rates = { USD: 1 }, isLoading } = useQuery<CurrencyRates>({
    queryKey: ["/api/currency"],
    staleTime: 60 * 60 * 1000, // 1 hour
  });
  
  const currencies = Object.keys(rates);
  
  const setCurrency = (currency: string) => {
    if (currencies.includes(currency)) {
      setCurrentCurrency(currency);
    }
  };
  
  const convert = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (!rates || !rates[fromCurrency] || !rates[toCurrency]) {
      return amount;
    }
    
    // Convert from source currency to USD (base currency)
    const amountInUsd = amount / rates[fromCurrency];
    // Convert from USD to target currency
    return amountInUsd * rates[toCurrency];
  };
  
  const formatAmount = (amount: number, currency = currentCurrency): string => {
    const currencySymbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      CNY: "¥",
      INR: "₹",
      PHP: "₱"
    };
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  };
  
  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        currencies,
        setCurrency,
        convert,
        formatAmount,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
