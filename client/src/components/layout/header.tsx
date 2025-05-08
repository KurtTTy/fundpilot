import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { Menu, Bell, Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function Header() {
  const { user } = useAuth();
  const { currentCurrency, currencies, setCurrency } = useCurrency();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button type="button" className="text-gray-500 hover:text-gray-600">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </div>

          {/* Title - Mobile only */}
          <div className="md:hidden flex items-center">
            <div className="h-8 w-8 rounded-lg bg-primary-500 text-white flex items-center justify-center">
              <span className="material-icons text-sm">flight_takeoff</span>
            </div>
            <h1 className="ml-2 text-lg font-semibold">Fund Pilot</h1>
          </div>

          {/* Search - Desktop */}
          <div className="hidden md:flex md:flex-1 md:ml-0 md:mr-4">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400 h-4 w-4" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search transactions..."
              />
            </div>
          </div>

          {/* Right Nav Items */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-600">
              <Bell className="h-5 w-5" />
            </button>

            <div className="hidden md:flex items-center">
              <div className="flex justify-center items-center">
                <Select value={currentCurrency} onValueChange={setCurrency}>
                  <SelectTrigger className="border-none w-20 text-sm font-medium text-gray-700 bg-transparent focus:outline-none focus:ring-0">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User Menu - Mobile */}
            <div className="md:hidden">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
