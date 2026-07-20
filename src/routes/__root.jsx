import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
} from "@tanstack/react-router";
import { Toaster, toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { AuthProvider } from "../context/AuthContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Listen for Supabase Auth Events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate({ to: "/reset-password" });
      }
    });

    // 2. Handle URL Hash Parameters (Success & Error cases)
    const handleHashParams = () => {
      const hash = window.location.hash;
      if (!hash) return;

      // Convert hash to an object
      const params = new URLSearchParams(hash.substring(1));

      const error = params.get("error");
      const errorCode = params.get("error_code");
      const type = params.get("type");

      // SUCCESS CASE: Recovery or Signup tokens
      if ((type === "recovery" || type === "signup") && window.location.pathname !== "/reset-password") {
        navigate({ to: "/reset-password" });
      }

      // ERROR CASE: Expired or Invalid links
      if (error === "access_denied" || errorCode === "otp_expired") {
        toast.error("Link Expired or Invalid", {
          description: "This verification or reset link has expired. Please enter your email to receive a new one.",
          duration: 8000,
        });

        // Move them to the auth page and signal that they should see the recovery form
        navigate({ to: "/auth", search: { mode: 'login', expired: true }, replace: true });

        // Clear the hash
        window.history.replaceState(null, null, window.location.pathname);
      }
    };

    handleHashParams();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}

