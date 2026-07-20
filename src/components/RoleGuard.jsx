import { useAuth } from "@/context/AuthContext";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RoleGuard({ children, role: requiredRole }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Super admins can bypass role guards
  if (role === "super_admin") {
    return children;
  }

  if (role !== requiredRole) {
    return (
      <div className="container-page flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="mt-2 max-w-sm text-muted-foreground">
          You don't have the required permissions to view this page. This area
          is restricted to {requiredRole}s.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/">Go back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
