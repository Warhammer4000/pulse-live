import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import LandingPage from "@/pages/LandingPage";

export function SmartHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
}
