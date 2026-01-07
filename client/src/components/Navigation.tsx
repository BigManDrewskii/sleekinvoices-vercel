import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
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
  X,
  FileCheck,
  RefreshCw,
  CreditCard,
  Receipt,
  Package,
  BarChart3,
  ChevronDown,
  Users,
  LayoutTemplate,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { GlobalSearch } from "@/components/GlobalSearch";
import { cn } from "@/lib/utils";

// Navigation structure with grouped items and icons
const navigationConfig = {
  direct: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
  clients: { href: "/clients", label: "Clients", icon: Users },
  finances: {
    label: "Finances",
    items: [
      { href: "/expenses", label: "Expenses", icon: Receipt, description: "Track business expenses" },
      { href: "/products", label: "Products", icon: Package, description: "Products & services catalog" },
      { href: "/analytics", label: "Analytics", icon: BarChart3, description: "Revenue insights" },
    ],
  },
  templates: { href: "/templates", label: "Templates", icon: LayoutTemplate },
};

// Custom hook for scroll-based navbar effects
function useScrollEffect() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if scrolled past threshold
      setScrolled(currentScrollY > 10);
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return { scrolled, scrollDirection };
}

export function Navigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrolled, scrollDirection } = useScrollEffect();
  
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = "/";
    },
  });

  const isActive = useCallback((href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  }, [location]);

  const isGroupActive = useCallback((items: { href: string }[]) => {
    return items.some(item => location.startsWith(item.href));
  }, [location]);

  // Quick Actions Menu with enhanced styling
  const QuickActionsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          className="h-10 min-w-[44px] gap-1.5 px-3 group relative overflow-hidden"
        >
          <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-52 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        sideOffset={8}
      >
        <DropdownMenuItem 
          onClick={() => setLocation("/invoices/create")} 
          className="cursor-pointer h-11 gap-3 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">New Invoice</span>
            <span className="text-xs text-muted-foreground">Create a new invoice</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLocation("/estimates/create")} 
          className="cursor-pointer h-11 gap-3 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
            <FileCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">New Estimate</span>
            <span className="text-xs text-muted-foreground">Create a quote</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setLocation("/clients")} 
          className="cursor-pointer h-11 gap-3 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500/10 text-green-500">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">New Client</span>
            <span className="text-xs text-muted-foreground">Add a client</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLocation("/expenses")} 
          className="cursor-pointer h-11 gap-3 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500/10 text-orange-500">
            <Receipt className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">New Expense</span>
            <span className="text-xs text-muted-foreground">Track an expense</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Desktop Navigation with enhanced hover effects
  const DesktopNav = () => (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="gap-1">
        {/* Dashboard - Direct Link */}
        <NavigationMenuItem>
          <Link href="/dashboard">
            <NavigationMenuLink
              className={cn(
                "group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                "hover:bg-accent/80 hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                "relative overflow-hidden",
                isActive("/dashboard") 
                  ? "bg-accent text-foreground" 
                  : "text-muted-foreground"
              )}
            >
              <span className="relative z-10">Dashboard</span>
              {isActive("/dashboard") && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Billing - Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className={cn(
              "h-10 px-4 text-sm font-medium rounded-lg transition-all duration-200",
              "hover:bg-accent/80",
              "data-[state=open]:bg-accent",
              isGroupActive(navigationConfig.billing.items) 
                ? "bg-accent/50 text-foreground" 
                : "text-muted-foreground"
            )}
          >
            Billing
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[420px] gap-2 p-4 md:w-[520px] md:grid-cols-2">
              {navigationConfig.billing.items.map((item) => (
                <li key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "group block select-none rounded-lg p-3 leading-none no-underline outline-none transition-all duration-200",
                        "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                        "focus:bg-accent focus:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
                        isActive(item.href) && "bg-accent/60 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-200",
                          isActive(item.href) 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium leading-none mb-1">{item.label}</div>
                          <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
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
                "group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                "hover:bg-accent/80 hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                "relative overflow-hidden",
                isActive("/clients") 
                  ? "bg-accent text-foreground" 
                  : "text-muted-foreground"
              )}
            >
              <span className="relative z-10">Clients</span>
              {isActive("/clients") && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Finances - Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className={cn(
              "h-10 px-4 text-sm font-medium rounded-lg transition-all duration-200",
              "hover:bg-accent/80",
              "data-[state=open]:bg-accent",
              isGroupActive(navigationConfig.finances.items) 
                ? "bg-accent/50 text-foreground" 
                : "text-muted-foreground"
            )}
          >
            Finances
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[380px] gap-2 p-4 md:w-[460px] md:grid-cols-2">
              {navigationConfig.finances.items.map((item) => (
                <li key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "group block select-none rounded-lg p-3 leading-none no-underline outline-none transition-all duration-200",
                        "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                        "focus:bg-accent focus:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
                        isActive(item.href) && "bg-accent/60 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-200",
                          isActive(item.href) 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium leading-none mb-1">{item.label}</div>
                          <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
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
                "group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                "hover:bg-accent/80 hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                "relative overflow-hidden",
                isActive("/templates") 
                  ? "bg-accent text-foreground" 
                  : "text-muted-foreground"
              )}
            >
              <span className="relative z-10">Templates</span>
              {isActive("/templates") && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );

  // Mobile Navigation with improved animations
  const MobileNav = () => {
    const [billingOpen, setBillingOpen] = useState(false);
    const [financesOpen, setFinancesOpen] = useState(false);

    return (
      <div className="flex flex-col gap-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[48px]",
            isActive("/dashboard") 
              ? "bg-accent text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          onClick={() => setMobileMenuOpen(false)}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>

        {/* Billing Section */}
        <div className="space-y-1">
          <button
            onClick={() => setBillingOpen(!billingOpen)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[48px]",
              isGroupActive(navigationConfig.billing.items) 
                ? "bg-accent/50 text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            aria-expanded={billingOpen}
            aria-controls="billing-submenu"
          >
            <span className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              Billing
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300 ease-out",
              billingOpen && "rotate-180"
            )} />
          </button>
          <div 
            id="billing-submenu"
            className={cn(
              "ml-4 space-y-1 overflow-hidden transition-all duration-300 ease-out",
              billingOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            {navigationConfig.billing.items.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all duration-200 min-h-[48px]",
                  isActive(item.href) 
                    ? "bg-accent text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                style={{ 
                  transitionDelay: billingOpen ? `${index * 50}ms` : '0ms',
                  transform: billingOpen ? 'translateX(0)' : 'translateX(-8px)',
                  opacity: billingOpen ? 1 : 0
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Clients */}
        <Link
          href="/clients"
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[48px]",
            isActive("/clients") 
              ? "bg-accent text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Users className="h-5 w-5" />
          Clients
        </Link>

        {/* Finances Section */}
        <div className="space-y-1">
          <button
            onClick={() => setFinancesOpen(!financesOpen)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[48px]",
              isGroupActive(navigationConfig.finances.items) 
                ? "bg-accent/50 text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            aria-expanded={financesOpen}
            aria-controls="finances-submenu"
          >
            <span className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5" />
              Finances
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300 ease-out",
              financesOpen && "rotate-180"
            )} />
          </button>
          <div 
            id="finances-submenu"
            className={cn(
              "ml-4 space-y-1 overflow-hidden transition-all duration-300 ease-out",
              financesOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            {navigationConfig.finances.items.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all duration-200 min-h-[48px]",
                  isActive(item.href) 
                    ? "bg-accent text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                style={{ 
                  transitionDelay: financesOpen ? `${index * 50}ms` : '0ms',
                  transform: financesOpen ? 'translateX(0)' : 'translateX(-8px)',
                  opacity: financesOpen ? 1 : 0
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Templates */}
        <Link
          href="/templates"
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 min-h-[48px]",
            isActive("/templates") 
              ? "bg-accent text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          onClick={() => setMobileMenuOpen(false)}
        >
          <LayoutTemplate className="h-5 w-5" />
          Templates
        </Link>
      </div>
    );
  };

  return (
    <nav 
      className={cn(
        "navbar-sticky transition-all duration-300",
        scrolled && "shadow-md",
        scrollDirection === 'down' && scrolled && "translate-y-0"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="navbar-container">
        <div className="navbar-inner">
          {/* Logo - Dynamic sizing based on breakpoint */}
          <Link 
            href="/dashboard" 
            className="navbar-logo group relative"
            aria-label="SleekInvoices - Go to Dashboard"
          >
            {/* Full logo for desktop */}
            <img
              src="/logo-full.svg"
              alt="SleekInvoices"
              className="navbar-logo-wide transition-all duration-150 ease-out group-hover:scale-[1.03] group-hover:brightness-110 group-active:scale-[0.98]"
              style={{ height: '28px', width: 'auto', maxWidth: '180px' }}
            />
            {/* Icon logo for mobile/tablet */}
            <img
              src="/logo-icon.svg"
              alt="SleekInvoices"
              className="navbar-logo-compact transition-all duration-150 ease-out group-hover:scale-110 group-hover:brightness-110 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.3)] group-active:scale-95"
              style={{ height: '32px', width: '32px', maxWidth: '32px' }}
            />
          </Link>

          {/* Desktop Navigation - Only at lg (1024px+) */}
          <DesktopNav />

          {/* Global Search - Only at xl (1280px+) */}
          <div className="hidden xl:block flex-1 max-w-xs ml-4">
            <GlobalSearch />
          </div>

          {/* Right Side Actions */}
          <div className="navbar-actions">
            {/* Quick Actions */}
            <QuickActionsMenu />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 min-w-[44px] transition-all duration-200 hover:ring-2 hover:ring-primary/20" 
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8 transition-transform duration-200 hover:scale-105">
                    <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-60 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
                sideOffset={8}
              >
                <div className="px-3 py-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <DropdownMenuItem asChild className="h-11 gap-3 cursor-pointer">
                    <Link href="/settings">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="h-11 gap-3 cursor-pointer">
                    <Link href="/subscription">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <span>Subscription</span>
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <div className="py-1">
                  <DropdownMenuItem
                    className="h-11 gap-3 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                    onClick={() => logout.mutate()}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile/Tablet Menu - Visible below lg (1024px) */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 min-w-[44px] transition-all duration-200" 
                  aria-label="Open navigation menu"
                >
                  <Menu className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    mobileMenuOpen && "rotate-90"
                  )} />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-80 max-w-[85vw] p-0"
                hideCloseButton
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header with integrated close button */}
                  <div className="flex items-center gap-3 p-4 border-b border-border/50">
                    <SheetClose 
                      className="flex-shrink-0 rounded-full p-2 bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <X className="size-4" />
                      <span className="sr-only">Close menu</span>
                    </SheetClose>
                    <div className="flex-1 min-w-0">
                      <GlobalSearch />
                    </div>
                  </div>
                  
                  {/* Mobile Navigation */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <MobileNav />
                  </div>
                  
                  {/* Mobile Menu Footer */}
                  <div className="p-4 border-t border-border/50 bg-accent/20 space-y-1">
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 min-h-[48px]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      Settings
                    </Link>
                    <Link
                      href="/subscription"
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 min-h-[48px]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Subscription
                    </Link>
                    <div className="pt-2 mt-2 border-t border-border/30">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout.mutate();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all duration-200 min-h-[48px]"
                      >
                        <LogOut className="h-5 w-5" />
                        Log Out
                      </button>
                    </div>
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
