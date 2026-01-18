import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { isLocalDevMode } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // In local dev mode with SKIP_AUTH, always go to dashboard
    if (isLocalDevMode()) {
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
      <div className="opacity-70">
        <GearLoader size="md" />
      </div>
    </div>
  );
}
