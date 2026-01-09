import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // In development with SKIP_AUTH, always go to dashboard
    if (import.meta.env.DEV) {
      setLocation("/dashboard");
      return;
    }

    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      setLocation("/landing");
    }
  }, [isAuthenticated, loading, setLocation]);

  // Show loading while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="opacity-70"><GearLoader size="md" /></div>
    </div>
  );
}
