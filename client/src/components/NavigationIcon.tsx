import {
  House,
  FileText,
  CheckSquare,
  ArrowsClockwise,
  CreditCard,
  Users,
  Receipt,
  Package,
  ChartBar,
  SquaresFour,
  type IconWeight,
} from "@phosphor-icons/react";
import { LucideIcon } from "lucide-react";

// Map Lucide icon names to Phosphor icons
const iconMap: Record<
  string,
  React.ComponentType<{ weight?: IconWeight; className?: string }>
> = {
  LayoutDashboard: House,
  FileText: FileText,
  FileCheck: CheckSquare,
  RefreshCw: ArrowsClockwise,
  CreditCard: CreditCard,
  Users: Users,
  Receipt: Receipt,
  Package: Package,
  BarChart3: ChartBar,
  LayoutTemplate: SquaresFour,
};

interface NavigationIconProps {
  icon: LucideIcon;
  isActive?: boolean;
  className?: string;
}

/**
 * NavigationIcon component that renders Phosphor icons with Fill weight when active
 * and Regular weight when inactive, providing clear visual feedback for selected states.
 */
export function NavigationIcon({
  icon,
  isActive = false,
  className = "",
}: NavigationIconProps) {
  const iconName = icon.displayName || icon.name;
  const PhosphorIcon = iconMap[iconName];

  if (PhosphorIcon) {
    return (
      <PhosphorIcon
        weight={isActive ? "fill" : "regular"}
        className={className}
      />
    );
  }

  // Fallback to original Lucide icon if no Phosphor equivalent
  const LucideIconComponent = icon;
  return <LucideIconComponent className={className} />;
}

// Export individual Phosphor icons for direct use
export {
  House,
  FileText as PhosphorFileText,
  CheckSquare as PhosphorCheckSquare,
  ArrowsClockwise,
  CreditCard as PhosphorCreditCard,
  Users as PhosphorUsers,
  Receipt as PhosphorReceipt,
  Package as PhosphorPackage,
  ChartBar,
  SquaresFour,
};
