import Avatar from 'boring-avatars';
import { cn } from '@/lib/utils';

const COLORS = ['#5f6fff', '#764ba2', '#667eea', '#10b981', '#f59e0b'];

interface UserAvatarProps {
  user: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    avatarType?: 'initials' | 'boring' | 'upload' | null;
  };
  size?: number;
  className?: string;
}

export function UserAvatar({ user, size = 32, className }: UserAvatarProps) {
  const getInitials = () => {
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || 'U';
  };

  const baseClasses = cn(
    "rounded-full overflow-hidden flex items-center justify-center",
    className
  );

  // Upload type - show custom uploaded image
  if (user.avatarType === 'upload' && user.avatarUrl) {
    return (
      <div
        className={baseClasses}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <img
          src={user.avatarUrl}
          alt={user.name || 'User avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Boring type - show generated avatar
  if (user.avatarType === 'boring' && user.avatarUrl) {
    // Parse avatarUrl format: "style:seed"
    const [variant, seed] = user.avatarUrl.split(':');
    return (
      <div
        className={baseClasses}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <Avatar
          size={size}
          name={seed || user.email || user.name || 'User'}
          variant={variant as any}
          colors={COLORS}
        />
      </div>
    );
  }

  // Default: Initials type or fallback
  return (
    <div
      className={cn(baseClasses, "bg-primary/10 text-primary font-semibold")}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        fontSize: size * 0.4
      }}
    >
      {getInitials()}
    </div>
  );
}
