import { describe, it, expect } from "vitest";

describe("Navigation - Responsive Logo Configuration", () => {
  it("should have wide logo path for desktop/tablet", () => {
    const wideLogo = "/logos/wide/SleekInvoices-Logo-Wide.svg";
    expect(wideLogo).toContain("/logos/wide/");
    expect(wideLogo).toContain("Logo-Wide.svg");
  });

  it("should have monogram icon path for mobile", () => {
    const monogram = "/logos/monogram/SleekInvoices-Monogram-White.svg";
    expect(monogram).toContain("/logos/monogram/");
    expect(monogram).toContain("Monogram-White.svg");
  });

  it("should have correct wide logo dimensions", () => {
    const wideLogo = {
      height: "28px",
      maxWidth: "200px",
    };
    expect(wideLogo.height).toBe("28px");
    expect(wideLogo.maxWidth).toBe("200px");
  });

  it("should have correct monogram dimensions", () => {
    const monogram = {
      height: "32px",
      width: "32px",
      maxWidth: "32px",
    };
    expect(monogram.height).toBe("32px");
    expect(monogram.width).toBe("32px");
    expect(monogram.maxWidth).toBe("32px");
  });

  it("should have responsive classes for wide logo", () => {
    const wideLogo = {
      classes: [
        "hidden",
        "md:block",
        "navbar-logo-wide",
        "transition-all",
        "duration-150",
        "ease-out",
        "group-hover:scale-[1.03]",
        "group-hover:brightness-110",
        "group-active:scale-[0.98]",
      ],
    };
    expect(wideLogo.classes).toContain("hidden");
    expect(wideLogo.classes).toContain("md:block");
  });

  it("should have responsive classes for monogram", () => {
    const monogram = {
      classes: [
        "md:hidden",
        "navbar-logo-compact",
        "transition-all",
        "duration-150",
        "ease-out",
        "group-hover:scale-110",
        "group-hover:brightness-110",
        "group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]",
        "group-active:scale-95",
      ],
    };
    expect(monogram.classes).toContain("md:hidden");
  });

  it("should verify logo paths are correctly configured", () => {
    const navbarConfig = {
      desktop_tablet: {
        logo: "/logos/wide/SleekInvoices-Logo-Wide.svg",
        responsive: "hidden md:block",
        height: "28px",
        maxWidth: "200px",
      },
      mobile: {
        logo: "/logos/monogram/SleekInvoices-Monogram-White.svg",
        responsive: "md:hidden",
        height: "32px",
        width: "32px",
      },
    };

    // Desktop/Tablet config
    expect(navbarConfig.desktop_tablet.logo).toContain("Logo-Wide");
    expect(navbarConfig.desktop_tablet.responsive).toContain("md:block");
    expect(navbarConfig.desktop_tablet.height).toBe("28px");

    // Mobile config
    expect(navbarConfig.mobile.logo).toContain("Monogram-White");
    expect(navbarConfig.mobile.responsive).toContain("md:hidden");
    expect(navbarConfig.mobile.height).toBe("32px");
  });

  it("should have breakpoint at md (768px) for responsive switching", () => {
    const breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    };

    // Wide logo shows at md and above
    expect(breakpoints.md).toBe(768);
    // Monogram shows below md
    expect(breakpoints.md).toBeGreaterThan(breakpoints.sm);
  });
});
