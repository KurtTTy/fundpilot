import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, Account, insertTransactionSchema } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CurrencyProvider, useCurrency } from "@/hooks/use-currency";
import { TransactionItem } from "@/components/dashboard/transaction-item";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, Search, Filter, ArrowUpDown } from "lucide-react";

const transactionSchema = insertTransactionSchema.omit({ userId: true }).extend({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.date(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const CATEGORIES = {
  income: ["Salary", "Freelance", "Investments", "Gifts", "Refunds", "Other"],
  expense: ["Food", "Housing", "Transportation", "Entertainment", "Shopping", "Utilities", "Healthcare", "Education", "Travel", "Personal", "Other"],
  transfer: ["Internal Transfer", "External Transfer", "Investment", "Savings", "Other"]
};

function TransactionsList() {
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });
  
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });
  
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<string>("expense");
  const { toast } = useToast();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "",
      type: "expense",
      date: new Date(),
      notes: "",
    },
  });
  
  // Reset form values when transaction type changes
  const handleTransactionTypeChange = (value: string) => {
    setTransactionType(value);
    form.setValue("type", value);
    form.setValue("category", "");
  };
  
  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Transaction added",
        description: "Your transaction has been recorded successfully.",
      });
      form.reset({
        amount: 0,
        description: "",
        category: "",
        type: transactionType,
        date: new Date(),
        notes: "",
      });
      setIsAddTransactionOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: TransactionFormValues) => {
    createMutation.mutate(data);
  };
  
  // Group transactions by date
  const groupedTransactions: Record<string, Transaction[]> = {};
  
  if (transactions.length > 0) {
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateString = format(date, 'yyyy-MM-dd');
      
      if (!groupedTransactions[dateString]) {
        groupedTransactions[dateString] = [];
      }
      
      groupedTransactions[dateString].push(transaction);
    });
  }
  
  const isLoading = transactionsLoading || accountsLoading;
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            className="pl-10" 
            placeholder="Search transactions..." 
          />
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Sort
          </Button>
          
          <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="expense" onValueChange={handleTransactionTypeChange}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="expense">Expense</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="transfer">Transfer</TabsTrigger>
                </TabsList>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="What was this transaction for?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CATEGORIES[transactionType as keyof typeof CATEGORIES].map(category => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map(account => (
                                  <SelectItem key={account.id} value={account.id.toString()}>
                                    {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any additional details about this transaction"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                        className="w-full"
                      >
                        {createMutation.isPending ? "Adding..." : "Add Transaction"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <PlusCircle className="h-6 w-6 text-primary-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start tracking your income and expenses by adding your first transaction.
            </p>
            <Button onClick={() => setIsAddTransactionOpen(true)}>
              Add Your First Transaction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="max-h-[calc(100vh-240px)]">
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
                  {Object.entries(groupedTransactions)
                    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                    .map(([dateString, txs]) => (
                      txs.map((transaction, index) => (
                        <TransactionItem 
                          key={transaction.id}
                          transaction={transaction}
                          accounts={accounts}
                          showDateHeader={index === 0}
                        />
                      ))
                    ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Helmet>
          <title>Transactions | Fund Pilot</title>
          <meta name="description" content="View and manage your financial transactions, track expenses and income." />
        </Helmet>
        
        <Sidebar />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          
          <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
              <p className="mt-1 text-sm text-gray-500">View and manage your financial transactions.</p>
            </div>
            
            <TransactionsList />
          </div>
        </main>
      </div>
      
      <MobileNav />
    </CurrencyProvider>
  );
}
