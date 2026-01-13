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
import { UserAvatar } from "@/components/UserAvatar";
import {
  Menu,
  User,
  Settings,
  LogOut,
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
  Mail,
  Search,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Plus } from "@phosphor-icons/react";
import { NavigationIcon } from "@/components/NavigationIcon";
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useKeyboardShortcuts } from "@/contexts/KeyboardShortcutsContext";
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
      { href: "/email-history", label: "Email History", icon: Mail, description: "Track sent emails" },
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
  const { setSearchOpen } = useKeyboardShortcuts();
  
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
          variant="outline"
          className="navbar-quick-action h-11 min-w-[44px] min-h-[44px] gap-1.5 px-3 group relative overflow-hidden border-primary/50 hover:border-primary hover:bg-primary/10 text-primary transition-all duration-200"
        >
          <Plus weight="bold" className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-52 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        sideOffset={8}
      >
        <DropdownMenuItem 
          onClick={() => setLocation("/invoices/guided")} 
          className="cursor-pointer h-11 gap-3 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10 text-purple-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Guided Creator</span>
            <span className="text-xs text-muted-foreground">Step-by-step invoice</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLocation("/invoices/create")} 
          className="cursor-pointer h-11 gap-3 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">New Invoice</span>
            <span className="text-xs text-muted-foreground">Standard form</span>
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

  // Desktop & Tablet Navigation - unified snappy UX with DropdownMenu
  // Shows at lg (1024px+) for full nav, tablet gets hamburger menu for better UX
  const DesktopTabletNav = () => (
    <div className="hidden lg:flex navbar-desktop-tablet-nav">
      <Link
        href="/dashboard"
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px]",
            isActive("/dashboard") 
              ? "bg-accent text-foreground" 
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <NavigationIcon icon={LayoutDashboard} isActive={isActive("/dashboard")} className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px]",
              isGroupActive(navigationConfig.billing.items)
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <NavigationIcon icon={FileText} isActive={isGroupActive(navigationConfig.billing.items)} className="h-4 w-4" />
            <span>Billing</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {navigationConfig.billing.items.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href} className="flex items-center gap-2">
                <NavigationIcon icon={item.icon} isActive={isActive(item.href)} className="h-4 w-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
        <Link
          href="/clients"
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px]",
            isActive("/clients")
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <NavigationIcon icon={Users} isActive={isActive("/clients")} className="h-4 w-4" />
          <span>Clients</span>
        </Link>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px]",
              isGroupActive(navigationConfig.finances.items)
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <NavigationIcon icon={BarChart3} isActive={isGroupActive(navigationConfig.finances.items)} className="h-4 w-4" />
            <span>Finances</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {navigationConfig.finances.items.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href} className="flex items-center gap-2">
                <NavigationIcon icon={item.icon} isActive={isActive(item.href)} className="h-4 w-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
        <Link
          href="/templates"
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px]",
            isActive("/templates")
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <NavigationIcon icon={LayoutTemplate} isActive={isActive("/templates")} className="h-4 w-4" />
          <span>Templates</span>
        </Link>
    </div>
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
          <NavigationIcon icon={LayoutDashboard} isActive={isActive("/dashboard")} className="h-5 w-5" />
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
            aria-label="Billing menu"
          >
            <span className="flex items-center gap-3">
              <NavigationIcon icon={FileText} isActive={isGroupActive(navigationConfig.billing.items)} className="h-5 w-5" />
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
                <NavigationIcon icon={item.icon} isActive={isActive(item.href)} className="h-4 w-4" />
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
          <NavigationIcon icon={Users} isActive={isActive("/clients")} className="h-5 w-5" />
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
            aria-label="Finances menu"
          >
            <span className="flex items-center gap-3">
              <NavigationIcon icon={BarChart3} isActive={isGroupActive(navigationConfig.finances.items)} className="h-5 w-5" />
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
                <NavigationIcon icon={item.icon} isActive={isActive(item.href)} className="h-4 w-4" />
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
          <NavigationIcon icon={LayoutTemplate} isActive={isActive("/templates")} className="h-5 w-5" />
          Templates
        </Link>
      </div>
    );
  };

  return (
    <nav 
      className={cn(
        "navbar-sticky transition-all duration-300",
        scrolled && "scrolled"
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
            {/* Wide logo for desktop (lg+) */}
            <img
              src="/logos/wide/SleekInvoices-Logo-Wide.svg"
              alt="SleekInvoices"
              className="hidden lg:block navbar-logo-wide transition-all duration-150 ease-out group-hover:scale-[1.03] group-hover:brightness-110 group-active:scale-[0.98]"
              style={{ height: '28px', width: 'auto', maxWidth: '200px' }}
            />
            {/* Monogram icon for mobile and tablet (below lg) */}
            <img
              src="/logos/monogram/SleekInvoices-Monogram-White.svg"
              alt="SleekInvoices"
              className="lg:hidden navbar-logo-compact transition-all duration-150 ease-out group-hover:scale-110 group-hover:brightness-110 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.3)] group-active:scale-95"
              style={{ height: '36px', width: '36px', maxWidth: '36px' }}
            />
          </Link>

          {/* Desktop Navigation - Unified UX (1024px+) */}
          <DesktopTabletNav />

          {/* Right Side Actions */}
          <div className="navbar-actions">
            {/* Search Button - All viewports with improved touch targets */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="h-11 min-h-[44px] min-w-[44px] gap-2 px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50"
              aria-label="Open search (Cmd+K)"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden lg:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>

            {/* Quick Actions */}
            <QuickActionsMenu />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center rounded-full h-11 w-11 min-w-[44px] min-h-[44px] hover:ring-2 hover:ring-primary/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="User menu"
                >
                  {user && <UserAvatar user={user} size={44} />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60"
                sideOffset={8}
              >
                <div className="px-3 py-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    {user && <UserAvatar user={user} size={48} />}
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
                    className="h-11 gap-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => logout.mutate()}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu - Visible below lg (1024px) for better tablet experience */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-11 w-11 min-w-[44px] min-h-[44px] transition-all duration-200" 
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
                className="navbar-mobile-menu w-80 max-w-[85vw] p-0"
                hideCloseButton
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header with close button and search */}
                  <div className="flex items-center gap-3 p-4 border-b border-border/50">
                    <SheetClose
                      className="flex-shrink-0 rounded-full p-2 bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <X className="size-4" />
                      <span className="sr-only">Close menu</span>
                    </SheetClose>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTimeout(() => setSearchOpen(true), 150);
                      }}
                      className="flex-1 justify-start text-muted-foreground hover:text-foreground h-10"
                      aria-label="Open search"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <span>Search...</span>
                    </Button>
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

                    {/* Support Links */}
                    <div className="pt-2 mt-2 border-t border-border/30">
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Support
                      </div>
                      <a
                        href="mailto:hello@sleekinvoices.com"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 min-h-[44px]"
                      >
                        <Mail className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">General Inquiries</span>
                          <span className="text-xs text-muted-foreground">hello@sleekinvoices.com</span>
                        </div>
                      </a>
                      <a
                        href="mailto:support@sleekinvoices.com"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 min-h-[44px]"
                      >
                        <Mail className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">Technical Support</span>
                          <span className="text-xs text-muted-foreground">support@sleekinvoices.com</span>
                        </div>
                      </a>
                    </div>

                    <div className="pt-2 mt-2 border-t border-border/30">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout.mutate();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 min-h-[48px]"
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
