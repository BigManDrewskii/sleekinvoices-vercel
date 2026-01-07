import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  Plus,
  FileText,
  FileCheck,
  RefreshCw,
  CreditCard,
  Receipt,
  Package,
  BarChart3,
  ChevronDown
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ResponsiveLogoEnhanced } from "@/components/ResponsiveLogoEnhanced";
import { cn } from "@/lib/utils";

// Navigation structure with grouped items
const navigationConfig = {
  direct: [
    { href: "/dashboard", label: "Dashboard" },
  ],
  billing: {
    label: "Billing",
    items: [
      { href: "/invoices", label: "Invoices", icon: FileText, description: "Create and manage invoices" },
      { href: "/estimates", label: "Estimates", icon: FileCheck, description: "Quotes and proposals" },
      { href: "/recurring-invoices", label: "Recurring", icon: RefreshCw, description: "Automated billing" },
      { href: "/payments", label: "Payments", icon: CreditCard, description: "Track payments received" },
    ],
  },
  clients: { href: "/clients", label: "Clients" },
  finances: {
    label: "Finances",
    items: [
      { href: "/expenses", label: "Expenses", icon: Receipt, description: "Track business expenses" },
      { href: "/products", label: "Products", icon: Package, description: "Products & services catalog" },
      { href: "/analytics", label: "Analytics", icon: BarChart3, description: "Revenue insights" },
    ],
  },
  templates: { href: "/templates", label: "Templates" },
};

export function Navigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = "/";
    },
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  const isGroupActive = (items: { href: string }[]) => {
    return items.some(item => location.startsWith(item.href));
  };

  // Quick Actions Menu
  const QuickActionsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setLocation("/invoices/create")} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          New Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/estimates/create")} className="cursor-pointer">
          <FileCheck className="mr-2 h-4 w-4" />
          New Estimate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/clients")} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          New Client
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/expenses")} className="cursor-pointer">
          <Receipt className="mr-2 h-4 w-4" />
          New Expense
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Desktop Navigation with Grouped Dropdowns
  const DesktopNav = () => (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-1">
        {/* Dashboard - Direct Link */}
        <NavigationMenuItem>
          <Link href="/dashboard">
            <NavigationMenuLink
              className={cn(
                "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                isActive("/dashboard") ? "bg-accent/50 text-foreground" : "text-muted-foreground"
              )}
            >
              Dashboard
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Billing - Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className={cn(
              "text-sm font-medium",
              isGroupActive(navigationConfig.billing.items) ? "bg-accent/50 text-foreground" : "text-muted-foreground"
            )}
          >
            Billing
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
              {navigationConfig.billing.items.map((item) => (
                <li key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        isActive(item.href) && "bg-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <div className="text-sm font-medium leading-none">{item.label}</div>
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Clients - Direct Link */}
        <NavigationMenuItem>
          <Link href="/clients">
            <NavigationMenuLink
              className={cn(
                "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                isActive("/clients") ? "bg-accent/50 text-foreground" : "text-muted-foreground"
              )}
            >
              Clients
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Finances - Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className={cn(
              "text-sm font-medium",
              isGroupActive(navigationConfig.finances.items) ? "bg-accent/50 text-foreground" : "text-muted-foreground"
            )}
          >
            Finances
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[450px] md:grid-cols-2">
              {navigationConfig.finances.items.map((item) => (
                <li key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        isActive(item.href) && "bg-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <div className="text-sm font-medium leading-none">{item.label}</div>
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Templates - Direct Link */}
        <NavigationMenuItem>
          <Link href="/templates">
            <NavigationMenuLink
              className={cn(
                "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                isActive("/templates") ? "bg-accent/50 text-foreground" : "text-muted-foreground"
              )}
            >
              Templates
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );

  // Mobile Navigation with Collapsible Sections
  const MobileNav = () => {
    const [billingOpen, setBillingOpen] = useState(false);
    const [financesOpen, setFinancesOpen] = useState(false);

    return (
      <div className="flex flex-col gap-2">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "block px-4 py-3 text-base font-medium rounded-md transition-colors",
            isActive("/dashboard") ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          onClick={() => setMobileMenuOpen(false)}
        >
          Dashboard
        </Link>

        {/* Billing Section */}
        <div>
          <button
            onClick={() => setBillingOpen(!billingOpen)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-md transition-colors",
              isGroupActive(navigationConfig.billing.items) ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            Billing
            <ChevronDown className={cn("h-4 w-4 transition-transform", billingOpen && "rotate-180")} />
          </button>
          {billingOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {navigationConfig.billing.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
                    isActive(item.href) ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Clients */}
        <Link
          href="/clients"
          className={cn(
            "block px-4 py-3 text-base font-medium rounded-md transition-colors",
            isActive("/clients") ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          onClick={() => setMobileMenuOpen(false)}
        >
          Clients
        </Link>

        {/* Finances Section */}
        <div>
          <button
            onClick={() => setFinancesOpen(!financesOpen)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-md transition-colors",
              isGroupActive(navigationConfig.finances.items) ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            Finances
            <ChevronDown className={cn("h-4 w-4 transition-transform", financesOpen && "rotate-180")} />
          </button>
          {financesOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {navigationConfig.finances.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
                    isActive(item.href) ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Templates */}
        <Link
          href="/templates"
          className={cn(
            "block px-4 py-3 text-base font-medium rounded-md transition-colors",
            isActive("/templates") ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          onClick={() => setMobileMenuOpen(false)}
        >
          Templates
        </Link>
      </div>
    );
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center shrink-0">
            <ResponsiveLogoEnhanced
              variant="wide"
              responsive={true}
              showBrand={false}
            />
          </Link>

          {/* Desktop Navigation */}
          <DesktopNav />

          {/* Global Search - Desktop */}
          <div className="hidden lg:block flex-1 max-w-sm">
            <GlobalSearch />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <QuickActionsMenu />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/subscription" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600"
                  onClick={() => logout.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col gap-4 mt-6">
                  {/* Mobile Search */}
                  <div className="px-2">
                    <GlobalSearch />
                  </div>
                  
                  <div className="border-t pt-4">
                    <MobileNav />
                  </div>
                  
                  <div className="border-t pt-4 mt-2">
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link
                      href="/subscription"
                      className="flex items-center gap-2 px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Subscription
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout.mutate();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
