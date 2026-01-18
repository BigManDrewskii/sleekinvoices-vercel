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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Menu,
  User,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  RefreshCw,
  CreditCard,
  Receipt,
  Package,
  BarChart3,
  ChevronDown,
  LayoutTemplate,
  LayoutDashboard as LayoutDashboardIcon,
  Sparkles,
  Mail,
  Search,
  BookOpen,
  FileCheck,
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
import { useScreenSize } from "@/hooks/useScreenSize";

// Navigation structure with grouped items and icons
const navigationConfig = {
  direct: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  ],
  billing: {
    label: "Billing",
    items: [
      {
        href: "/invoices",
        label: "Invoices",
        icon: FileText,
        description: "Create and manage invoices",
      },
      {
        href: "/estimates",
        label: "Estimates",
        icon: FileCheck,
        description: "Quotes and proposals",
      },
      {
        href: "/recurring-invoices",
        label: "Recurring",
        icon: RefreshCw,
        description: "Automated billing",
      },
      {
        href: "/payments",
        label: "Payments",
        icon: CreditCard,
        description: "Track payments received",
      },
    ],
  },
  clients: { href: "/clients", label: "Clients", icon: Users },
  finances: {
    label: "Finances",
    items: [
      {
        href: "/expenses",
        label: "Expenses",
        icon: Receipt,
        description: "Track business expenses",
      },
      {
        href: "/products",
        label: "Products",
        icon: Package,
        description: "Products & services catalog",
      },
      {
        href: "/analytics",
        label: "Analytics",
        icon: BarChart3,
        description: "Revenue insights",
      },
      {
        href: "/email-history",
        label: "Email History",
        icon: Mail,
        description: "Track sent emails",
      },
    ],
  },
  templates: { href: "/templates", label: "Templates", icon: LayoutTemplate },
  docs: { href: "/docs", label: "Docs", icon: BookOpen },
};

export function Navigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setSearchOpen } = useKeyboardShortcuts();
  const size = useScreenSize();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = "/";
    },
  });

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") {
        return location === "/" || location === "/dashboard";
      }
      return location.startsWith(href);
    },
    [location]
  );

  const isGroupActive = useCallback(
    (items: { href: string }[]) => {
      return items.some(item => location.startsWith(item.href));
    },
    [location]
  );

  // Search Button with ⌘K badge
  const SearchButton = () => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setSearchOpen(true)}
      className="h-11 min-w-[44px] w-11 lg:w-auto rounded-[8.4px] px-3 lg:px-4 gap-2 text-[var(--nav-text-color)] border border-[rgba(55,77,88,0.3)] hover:bg-accent/30 hover:border-accent/50 transition-all"
      aria-label="Open search (⌘K)"
    >
      <Search className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm font-medium hidden lg:inline">Search</span>
      <span className="h-5 rounded px-1.5 bg-[rgba(25,39,48,0.5)] border border-[rgba(55,77,88,0.5)] text-[7.5px] font-medium font-sans hidden lg:inline-block">
        ⌘K
      </span>
    </Button>
  );

  // Quick Actions Menu with enhanced styling
  const QuickActionsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-11 min-w-[44px] w-11 lg:w-auto rounded-[8.4px] px-3 lg:px-4 gap-2 text-[var(--nav-text-color)] border-[var(--nav-button-border)] hover:bg-accent/30 transition-all"
        >
          <Plus weight="bold" className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium hidden lg:inline">New</span>
          <ChevronDown className="h-3 w-3 opacity-60 hidden lg:inline" />
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
            <span className="text-xs text-muted-foreground">
              Step-by-step invoice
            </span>
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
            <span className="text-xs text-muted-foreground">
              Create a quote
            </span>
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
            <span className="text-xs text-muted-foreground">
              Track an expense
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Desktop Layout (≥1024px): Full navigation + all actions
  const DesktopNav = () => (
    <>
      {/* Navigation Links */}
      <div className="flex items-center gap-1">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-[10.4px] min-h-[40px] transition-all duration-200 active:scale-[0.98]",
            isActive("/dashboard")
              ? `bg-white/5 text-[var(--nav-text-color)] hover:bg-white/10 hover:shadow-sm`
              : `text-[var(--nav-text-color)]/80 hover:text-[var(--nav-text-color)] hover:bg-accent/20 hover:shadow-sm`
          )}
        >
          <LayoutDashboardIcon className="h-4 w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">Dashboard</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-[10.4px] min-h-[40px] transition-all duration-200 active:scale-[0.98]",
                isGroupActive(navigationConfig.billing.items)
                  ? `bg-white/5 text-[var(--nav-text-color)] hover:bg-white/10 hover:shadow-sm`
                  : `text-[var(--nav-text-color)]/80 hover:text-[var(--nav-text-color)] hover:bg-accent/20 hover:shadow-sm`
              )}
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Billing</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {navigationConfig.billing.items.map(item => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  <NavigationIcon
                    icon={item.icon}
                    isActive={isActive(item.href)}
                    className="h-4 w-4"
                  />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href="/clients"
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-[10.4px] min-h-[40px] transition-all duration-200 active:scale-[0.98]",
            isActive("/clients")
              ? `bg-white/5 text-[var(--nav-text-color)] hover:bg-white/10 hover:shadow-sm`
              : `text-[var(--nav-text-color)]/80 hover:text-[var(--nav-text-color)] hover:bg-accent/20 hover:shadow-sm`
          )}
        >
          <Users className="h-4 w-4" />
          <span className="whitespace-nowrap">Clients</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-[10.4px] min-h-[40px] transition-all duration-200 active:scale-[0.98]",
                isGroupActive(navigationConfig.finances.items)
                  ? `bg-white/5 text-[var(--nav-text-color)] hover:bg-white/10 hover:shadow-sm`
                  : `text-[var(--nav-text-color)]/80 hover:text-[var(--nav-text-color)] hover:bg-accent/20 hover:shadow-sm`
              )}
            >
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Finances</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {navigationConfig.finances.items.map(item => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  <NavigationIcon
                    icon={item.icon}
                    isActive={isActive(item.href)}
                    className="h-4 w-4"
                  />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href="/templates"
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-[10.4px] min-h-[40px] transition-all duration-200 active:scale-[0.98]",
            isActive("/templates")
              ? `bg-white/5 text-[var(--nav-text-color)] hover:bg-white/10 hover:shadow-sm`
              : `text-[var(--nav-text-color)]/80 hover:text-[var(--nav-text-color)] hover:bg-accent/20 hover:shadow-sm`
          )}
        >
          <LayoutTemplate className="h-4 w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">Templates</span>
        </Link>

        <Link
          href="/docs"
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-[10.4px] min-h-[40px] transition-all duration-200 active:scale-[0.98]",
            isActive("/docs")
              ? `bg-white/5 text-[var(--nav-text-color)] hover:bg-white/10 hover:shadow-sm`
              : `text-[var(--nav-text-color)]/80 hover:text-[var(--nav-text-color)] hover:bg-accent/20 hover:shadow-sm`
          )}
        >
          <BookOpen className="h-4 w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">Docs</span>
        </Link>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pl-4 border-l border-[rgba(55,77,88,0.3)]">
        <SearchButton />
        <QuickActionsMenu />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-11 w-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[14.4px] border-[var(--nav-button-border)] transition-all duration-200"
            >
              <div className="relative">
                <span className="text-[#94a3b8] font-semibold text-lg leading-6">
                  LD
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
            <div className="px-3 py-3 border-b border-[rgba(36,38,40,0.5)]">
              <div className="flex items-center gap-3">
                {user && <UserAvatar user={user} size="md" bordered />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-[#94a3b8]">
                    {user?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || "-"}
                  </p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="py-1">
              <DropdownMenuItem asChild className="h-11 gap-3 cursor-pointer">
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="h-11 gap-3 cursor-pointer">
                <Link href="/subscription" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span>Subscription</span>
                </Link>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="h-11 gap-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => logout.mutate()}
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  // Tablet Layout (768px-1024px): Hamburger + Search + New + User (logo in main nav, nav links in hamburger)
  const TabletNav = () => (
    <div className="flex items-center gap-2">
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-w-[44px] min-h-[44px] text-[var(--nav-text-color)]"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-80 max-w-[85vw] p-0"
          hideCloseButton
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <Accordion type="single" collapsible className="border-0">
              <AccordionItem value="billing">
                <AccordionTrigger className="h-14 px-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium text-[var(--nav-text-color)]">
                      Billing
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-[rgba(36,38,40,0.5)] bg-[rgba(17,29,34,0.95)]">
                  <div className="space-y-1 px-4 py-2">
                    {navigationConfig.billing.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <NavigationIcon
                          icon={item.icon}
                          isActive={isActive(item.href)}
                          className="h-4 w-4"
                        />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="finances">
                <AccordionTrigger className="h-14 px-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5" />
                    <span className="font-medium text-[var(--nav-text-color)]">
                      Finances
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-[rgba(36,38,40,0.5)] bg-[rgba(17,29,34,0.95)]">
                  <div className="space-y-1 px-4 py-2">
                    {navigationConfig.finances.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <NavigationIcon
                          icon={item.icon}
                          isActive={isActive(item.href)}
                          className="h-4 w-4"
                        />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <Link
                href="/clients"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-5 w-5" />
                <span className="font-medium text-[var(--nav-text-color)]">
                  Clients
                </span>
              </Link>

              <Link
                href="/templates"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutTemplate className="h-5 w-5" />
                <span className="font-medium text-[var(--nav-text-color)]">
                  Templates
                </span>
              </Link>

              <Link
                href="/docs"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium text-[var(--nav-text-color)]">
                  Docs
                </span>
              </Link>
            </Accordion>
          </div>
        </SheetContent>
      </Sheet>

      <SearchButton />
      <QuickActionsMenu />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-11 w-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-200 hover:ring-2 hover:ring-primary/20"
          >
            {user && <UserAvatar user={user} size="sm" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
          <div className="px-3 py-3 border-b border-[rgba(36,38,40,0.5)]">
            <div className="flex items-center gap-3">
              {user && <UserAvatar user={user} size="md" bordered />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[#94a3b8]">
                  {user?.name || "-"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "-"}
                </p>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <div className="py-1">
            <DropdownMenuItem asChild className="h-11 gap-3 cursor-pointer">
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="h-11 gap-3 cursor-pointer">
              <Link href="/subscription" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span>Subscription</span>
              </Link>
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout.mutate()}
            className="h-11 gap-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Mobile Layout (<768px): Hamburger + Search + New + User (logo in main nav, nav links in hamburger)
  const MobileNav = () => (
    <div className="flex items-center gap-2">
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-w-[44px] min-h-[44px] text-[var(--nav-text-color)]"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-80 max-w-[85vw] p-0"
          hideCloseButton
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <Accordion type="single" collapsible className="border-0">
              <AccordionItem value="billing">
                <AccordionTrigger className="h-14 px-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium text-[var(--nav-text-color)]">
                      Billing
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-[rgba(36,38,40,0.5)] bg-[rgba(17,29,34,0.95)]">
                  <div className="space-y-1 px-4 py-2">
                    {navigationConfig.billing.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <NavigationIcon
                          icon={item.icon}
                          isActive={isActive(item.href)}
                          className="h-4 w-4"
                        />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="finances">
                <AccordionTrigger className="h-14 px-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5" />
                    <span className="font-medium text-[var(--nav-text-color)]">
                      Finances
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-[rgba(36,38,40,0.5)] bg-[rgba(17,29,34,0.95)]">
                  <div className="space-y-1 px-4 py-2">
                    {navigationConfig.finances.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <NavigationIcon
                          icon={item.icon}
                          isActive={isActive(item.href)}
                          className="h-4 w-4"
                        />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <Link
                href="/clients"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-5 w-5" />
                <span className="font-medium text-[var(--nav-text-color)]">
                  Clients
                </span>
              </Link>

              <Link
                href="/templates"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutTemplate className="h-5 w-5" />
                <span className="font-medium text-[var(--nav-text-color)]">
                  Templates
                </span>
              </Link>

              <Link
                href="/docs"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium text-[var(--nav-text-color)]">
                  Docs
                </span>
              </Link>
            </Accordion>
          </div>
        </SheetContent>
      </Sheet>

      <SearchButton />

      <QuickActionsMenu />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-11 w-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-200 hover:ring-2 hover:ring-primary/20"
          >
            {user && <UserAvatar user={user} size="sm" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
          <div className="px-3 py-3 border-b border-[rgba(36,38,40,0.5)]">
            <div className="flex items-center gap-3">
              {user && <UserAvatar user={user} size="md" bordered />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[#94a3b8]">
                  {user?.name || "-"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "-"}
                </p>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <div className="py-1">
            <DropdownMenuItem asChild className="h-11 gap-3 cursor-pointer">
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="h-11 gap-3 cursor-pointer">
              <Link href="/subscription" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span>Subscription</span>
              </Link>
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout.mutate()}
            className="h-11 gap-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <nav
      className="relative w-full border-b border-[var(--nav-border-color)] bg-[var(--nav-bg)] backdrop-blur-[var(--nav-backdrop-blur)] rounded-b-[22px]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="px-5 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo - wide for desktop, monogram for tablet/mobile */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            aria-label="SleekInvoices - Go to Dashboard"
          >
            {size === "desktop" ? (
              <img
                src="/logos/wide/SleekInvoices-Logo-Wide.svg"
                alt=""
                className="h-7 w-auto"
              />
            ) : (
              <img
                src="/logos/monogram/SleekInvoices-Monogram-White.svg"
                alt=""
                className="h-9 w-9"
              />
            )}
          </Link>

          {/* Center: Navigation based on screen size */}
          {size === "desktop" && <DesktopNav />}
          {size === "tablet" && <TabletNav />}
          {size === "mobile" && <MobileNav />}
        </div>
      </div>
    </nav>
  );
}
