import { Link, useLocation } from "wouter";

export function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/accounts", label: "Accounts", icon: "account_balance_wallet" },
    { href: "/transactions", label: "Add", icon: "add_circle" },
    { href: "/reports", label: "Reports", icon: "insights" },
    { href: "/team", label: "More", icon: "more_horiz" },
  ];

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={`flex flex-col items-center p-3 ${
                location === item.href ? "text-primary-500" : "text-gray-400"
              }`}
            >
              <span className="material-icons">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
