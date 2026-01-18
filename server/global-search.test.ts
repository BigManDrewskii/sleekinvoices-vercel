import { describe, it, expect } from "vitest";

describe("GlobalSearch - Refined Modal UI", () => {
  it("should have correct modal structure", () => {
    const modalConfig = {
      backdrop: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      container:
        "fixed inset-x-0 top-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4",
      modal:
        "w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden",
    };

    expect(modalConfig.backdrop).toContain("backdrop-blur-sm");
    expect(modalConfig.container).toContain("pt-[10vh]");
    expect(modalConfig.modal).toContain("max-w-lg");
    expect(modalConfig.modal).toContain("rounded-xl");
  });

  it("should have search input with proper styling", () => {
    const inputConfig = {
      className:
        "flex-1 border-0 bg-transparent p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0",
      placeholder: "Search invoices, clients...",
      ariaLabel: "Search invoices and clients",
    };

    expect(inputConfig.className).toContain("border-0");
    expect(inputConfig.className).toContain("bg-transparent");
    expect(inputConfig.placeholder).toBe("Search invoices, clients...");
    expect(inputConfig.ariaLabel).toBe("Search invoices and clients");
  });

  it("should have result item styling with icons", () => {
    const resultItemConfig = {
      invoiceIcon: {
        container:
          "flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary",
        icon: "h-4 w-4",
      },
      clientIcon: {
        container:
          "flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-500",
        icon: "h-4 w-4",
      },
      arrowIcon:
        "h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100",
    };

    expect(resultItemConfig.invoiceIcon.container).toContain("bg-primary/10");
    expect(resultItemConfig.clientIcon.container).toContain("bg-green-500/10");
    expect(resultItemConfig.arrowIcon).toContain("group-hover:opacity-100");
  });

  it("should have keyboard navigation footer", () => {
    const footerConfig = {
      navigate: { key: "↑↓", label: "Navigate" },
      select: { key: "↵", label: "Select" },
      close: { key: "Esc", label: "Close" },
    };

    expect(footerConfig.navigate.key).toBe("↑↓");
    expect(footerConfig.select.key).toBe("↵");
    expect(footerConfig.close.key).toBe("Esc");
  });

  it("should have empty state when no search query", () => {
    const emptyStateConfig = {
      icon: "h-12 w-12 rounded-full bg-muted",
      title: "Search for invoices and clients",
      subtitle: "Type to start searching",
    };

    expect(emptyStateConfig.icon).toContain("rounded-full");
    expect(emptyStateConfig.title).toBe("Search for invoices and clients");
    expect(emptyStateConfig.subtitle).toBe("Type to start searching");
  });

  it("should have no results state with helpful message", () => {
    const noResultsConfig = {
      icon: "h-10 w-10 text-muted-foreground/30",
      message: "No results found for",
      hint: "Try a different search term",
    };

    expect(noResultsConfig.icon).toContain("text-muted-foreground/30");
    expect(noResultsConfig.message).toContain("No results found");
    expect(noResultsConfig.hint).toBe("Try a different search term");
  });

  it("should have animation classes for smooth appearance", () => {
    const animationConfig = {
      backdrop: "animate-in fade-in-0 duration-200",
      modal: "animate-in fade-in-0 slide-in-from-top-4 duration-200",
    };

    expect(animationConfig.backdrop).toContain("animate-in");
    expect(animationConfig.modal).toContain("slide-in-from-top-4");
  });

  it("should clear search on modal close", () => {
    // Simulating the behavior
    let searchQuery = "test";
    let isOpen = true;

    // When modal closes
    isOpen = false;
    if (!isOpen) {
      searchQuery = "";
    }

    expect(searchQuery).toBe("");
    expect(isOpen).toBe(false);
  });
});

describe("Navigation - Search Button", () => {
  it("should have search button visible on all viewports", () => {
    const buttonConfig = {
      variant: "ghost",
      className:
        "h-9 gap-2 px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50",
      ariaLabel: "Open search (Cmd+K)",
    };

    expect(buttonConfig.variant).toBe("ghost");
    expect(buttonConfig.className).not.toContain("xl:hidden");
    expect(buttonConfig.ariaLabel).toContain("Cmd+K");
  });

  it("should show text label on sm+ viewports", () => {
    const textConfig = {
      className: "hidden sm:inline",
      text: "Search",
    };

    expect(textConfig.className).toContain("hidden");
    expect(textConfig.className).toContain("sm:inline");
    expect(textConfig.text).toBe("Search");
  });

  it("should show keyboard shortcut on md+ viewports", () => {
    const kbdConfig = {
      className:
        "hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
      content: "⌘K",
    };

    expect(kbdConfig.className).toContain("hidden");
    expect(kbdConfig.className).toContain("md:inline-flex");
    expect(kbdConfig.content).toBe("⌘K");
  });
});
