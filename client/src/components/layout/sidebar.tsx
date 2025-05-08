import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, PlaneTakeoff } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/accounts", label: "Accounts", icon: "account_balance_wallet" },
    { href: "/transactions", label: "Transactions", icon: "payments" },
    { href: "/reports", label: "Reports", icon: "insights" },
    { href: "/calculator", label: "Calculator", icon: "calculate" },
    { href: "/currency", label: "Currency", icon: "currency_exchange" },
    { href: "/team", label: "Team", icon: "groups" },
    { href: "/profile", label: "My Profile", icon: "person" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 pt-5 pb-4 flex-shrink-0 h-full">
      {/* Logo and Brand */}
      <div className="px-6 flex items-center">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary-500 text-white flex items-center justify-center">
            <PlaneTakeoff className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Fund Pilot</h1>
        </div>
        <div className="ml-auto">
          <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
            {user?.isPro ? "Pro" : "Basic"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex-grow overflow-y-auto scrollbar-hide">
        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location === item.href
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span
                  className={`material-icons mr-3 ${
                    location === item.href ? "text-primary-500" : "text-gray-400"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
      </div>

      {/* Upgrade to Pro */}
      {!user?.isPro && (
        <div className="px-4 mt-4">
          <div className="px-4 py-3 bg-primary-50 rounded-lg">
            <div className="flex items-start">
              <span className="material-icons text-primary-500 mr-3">
                upgrade
              </span>
              <div>
                <h3 className="text-sm font-medium text-primary-800">
                  Upgrade to Pro
                </h3>
                <p className="mt-1 text-xs text-primary-700">
                  Get advanced features and team collaboration
                </p>
                <button className="mt-2 text-xs px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition">
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="border-t border-gray-200 mt-4 pt-4 px-4">
        <div className="flex items-center px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-gray-400 hover:text-gray-500"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
