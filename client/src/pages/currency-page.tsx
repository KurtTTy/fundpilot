import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CurrencyProvider, useCurrency } from "@/hooks/use-currency";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, ArrowDownUp, RefreshCw } from "lucide-react";

// Currency flag icons - using country codes
const currencyFlags: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  CNY: "🇨🇳",
  INR: "🇮🇳",
};

const currencyNames: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
};

export default function CurrencyPage() {
  const { currencies, convert } = useCurrency();
  
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  const [amount, setAmount] = useState<string>("100");
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  
  const { data: rates, isLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/currency"],
  });
  
  // Effect to convert amount when any dependency changes
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const result = convert(numAmount, fromCurrency, toCurrency);
    setConvertedAmount(result);
  }, [amount, fromCurrency, toCurrency, convert]);
  
  // Swap currencies
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };
  
  // Format date for "last updated"
  const formatDate = () => {
    return new Date().toLocaleString();
  };
  
  // Popular currency pairs
  const popularPairs = [
    { from: "USD", to: "EUR" },
    { from: "USD", to: "GBP" },
    { from: "EUR", to: "GBP" },
    { from: "USD", to: "JPY" },
    { from: "USD", to: "CAD" },
    { from: "GBP", to: "EUR" },
  ];

  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Helmet>
          <title>Currency Converter | Fund Pilot</title>
          <meta
            name="description"
            content="Convert between different currencies using real-time exchange rates."
          />
        </Helmet>

        <Sidebar />

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />

          <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Currency Converter
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Convert between different currencies using real-time exchange rates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main converter */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Currency Converter</CardTitle>
                  <CardDescription>
                    Enter an amount and select currencies to convert
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          From
                        </label>
                        <Select
                          value={fromCurrency}
                          onValueChange={setFromCurrency}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                <div className="flex items-center">
                                  <span className="mr-2">
                                    {currencyFlags[currency] || "🏳️"}
                                  </span>
                                  <span>
                                    {currency} - {currencyNames[currency] || currency}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          To
                        </label>
                        <Select
                          value={toCurrency}
                          onValueChange={setToCurrency}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                <div className="flex items-center">
                                  <span className="mr-2">
                                    {currencyFlags[currency] || "🏳️"}
                                  </span>
                                  <span>
                                    {currency} - {currencyNames[currency] || currency}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Amount
                        </label>
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="text-lg"
                        />
                      </div>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="mx-4 mt-6"
                        onClick={handleSwapCurrencies}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Converted Amount
                        </label>
                        <div className="h-10 flex items-center px-3 border border-gray-300 rounded-md bg-gray-50 text-lg font-medium">
                          {isLoading ? (
                            <Skeleton className="h-6 w-full" />
                          ) : (
                            <>{convertedAmount.toFixed(2)} {toCurrency}</>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-blue-700">
                            Exchange Rate
                          </div>
                          <div className="font-medium">
                            {isLoading ? (
                              <Skeleton className="h-6 w-24" />
                            ) : (
                              <>
                                1 {fromCurrency} = {convert(1, fromCurrency, toCurrency).toFixed(4)} {toCurrency}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Last updated: {formatDate()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Popular currency pairs */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Pairs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </>
                    ) : (
                      popularPairs.map((pair, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">
                                {currencyFlags[pair.from]}
                              </span>
                              <div>
                                <div className="font-medium">{pair.from}</div>
                                <div className="text-xs text-gray-500">
                                  {currencyNames[pair.from]}
                                </div>
                              </div>
                            </div>
                            
                            <ArrowDownUp className="h-4 w-4 text-gray-400 mx-2" />
                            
                            <div className="flex items-center">
                              <span className="text-lg mr-2">
                                {currencyFlags[pair.to]}
                              </span>
                              <div>
                                <div className="font-medium">{pair.to}</div>
                                <div className="text-xs text-gray-500">
                                  {currencyNames[pair.to]}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm text-right">
                            1 {pair.from} = {convert(1, pair.from, pair.to).toFixed(4)} {pair.to}
                          </div>
                          
                          <Button
                            variant="link"
                            className="text-primary-500 p-0 h-auto mt-1 text-xs w-full text-right"
                            onClick={() => {
                              setFromCurrency(pair.from);
                              setToCurrency(pair.to);
                            }}
                          >
                            Use this pair
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="outline" size="sm">
                    View All Currency Pairs
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Exchange Rate Table */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Exchange Rate Table</CardTitle>
                <CardDescription>
                  Current exchange rates for major currencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Currency
                        </th>
                        {currencies.slice(0, 5).map((currency) => (
                          <th
                            key={currency}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {currency}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4">
                            <Skeleton className="h-20 w-full" />
                          </td>
                        </tr>
                      ) : (
                        currencies.slice(0, 5).map((fromCurr) => (
                          <tr key={fromCurr}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">
                                  {currencyFlags[fromCurr]}
                                </span>
                                <div>
                                  <div className="font-medium">{fromCurr}</div>
                                  <div className="text-xs text-gray-500">
                                    {currencyNames[fromCurr]}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {currencies.slice(0, 5).map((toCurr) => (
                              <td
                                key={`${fromCurr}-${toCurr}`}
                                className="px-6 py-4 whitespace-nowrap text-sm"
                              >
                                {fromCurr === toCurr
                                  ? "1.0000"
                                  : convert(1, fromCurr, toCurr).toFixed(4)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <MobileNav />
    </CurrencyProvider>
  );
}
