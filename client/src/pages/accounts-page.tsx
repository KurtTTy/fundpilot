import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Account, insertAccountSchema } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { CurrencyProvider, useCurrency } from "@/hooks/use-currency";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Banknote, CreditCard, Wallet, ChevronRight, Trash2, PenSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const accountSchema = insertAccountSchema.omit({ userId: true }).extend({
  balance: z.coerce.number().min(0, "Balance must be a positive number"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

function AccountCard({ account }: { account: Account }) {
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/accounts/${account.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account deleted",
        description: `${account.name} has been removed.`,
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const getAccountIcon = () => {
    switch (account.type) {
      case "bank":
        return <Banknote className="h-6 w-6 text-blue-600" />;
      case "credit":
        return <CreditCard className="h-6 w-6 text-red-600" />;
      case "ewallet":
        return <Wallet className="h-6 w-6 text-purple-600" />;
      case "gcash":
        return <span className="material-icons text-[#0074E0] text-xl">g_translate</span>;
      case "maya":
        return <span className="material-icons text-[#00C1B0] text-xl">payments</span>;
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
      case "gcash":
        return "bg-[#E7F3FF]";
      case "maya":
        return "bg-[#E6F9F7]";
      default:
        return "bg-blue-100";
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`h-12 w-12 rounded-full ${getBgColor()} flex items-center justify-center mr-4`}>
            {getAccountIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
            <p className="text-sm text-gray-500">
              {account.type.charAt(0).toUpperCase() + account.type.slice(1)} • {account.accountNumber}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-semibold ${account.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatAmount(account.balance, account.currency)}
            </p>
            <div className="flex mt-2 space-x-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                <PenSquare className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete the account "{account.name}"? This action cannot be undone.
            </p>
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>
                All transactions associated with this account will still be available in your transaction history.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AccountsList() {
  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });
  
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "bank",
      accountNumber: "",
      balance: 0,
      currency: "USD",
    },
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: AccountFormValues) => {
      const res = await apiRequest("POST", "/api/accounts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account added",
        description: "Your new account has been created successfully.",
      });
      form.reset();
      setIsAddAccountOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: AccountFormValues) => {
    createMutation.mutate(data);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Accounts</h2>
        <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Chase Checking" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bank">Bank Account</SelectItem>
                          <SelectItem value="credit">Credit Card</SelectItem>
                          <SelectItem value="ewallet">E-Wallet</SelectItem>
                          <SelectItem value="gcash">GCash</SelectItem>
                          <SelectItem value="maya">Maya</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Last 4 digits, e.g. 1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balance</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PHP">PHP (₱)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                            <SelectItem value="AUD">AUD (A$)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add Account"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <Banknote className="h-6 w-6 text-primary-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Accounts Yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add your bank accounts, credit cards, or e-wallets to start tracking your finances.
            </p>
            <Button onClick={() => setIsAddAccountOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Helmet>
          <title>Accounts | Fund Pilot</title>
          <meta name="description" content="Manage your bank accounts, credit cards, and e-wallets in one place." />
        </Helmet>
        
        <Sidebar />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          
          <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your bank accounts, credit cards, and e-wallets in one place.</p>
            </div>
            
            <AccountsList />
          </div>
        </main>
      </div>
      
      <MobileNav />
    </CurrencyProvider>
  );
}
