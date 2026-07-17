import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { logSignIn } from "@/lib/dashboard.functions";

async function waitForSession(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session.user;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

async function routeAfterLogin(navigate: ReturnType<typeof useNavigate>) {
  // Wait for the session to actually persist to storage — on mobile browsers,
  // signInWithPassword can resolve before storage is written, causing the
  // protected route's beforeLoad to see no user and 404/redirect.
  const user = await waitForSession();
  if (!user) {
    toast.error("Session not established. Please try again.");
    return;
  }
  try {
    await logSignIn();
  } catch {
    /* non-fatal */
  }
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  const to = role ? "/admin" : "/dashboard";
  // Use a hard navigation on mobile to guarantee the router picks up the
  // freshly persisted session in beforeLoad (avoids stale in-memory state).
  await navigate({ to, replace: true });
  if (typeof window !== "undefined" && window.location.pathname === "/auth") {
    window.location.replace(to);
  }
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — E-WEST Hub" },
      { name: "description", content: "Sign in or create an account on E-WEST Hub." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void routeAfterLogin(navigate);
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        await routeAfterLogin(navigate);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      await routeAfterLogin(navigate);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="bg-white p-8 rounded-xl ring-1 ring-black/5">
        <h1 className="text-2xl font-semibold mb-1">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin"
            ? "Access your E-WEST Hub dashboard"
            : "Register as a resident to submit reports and apply for bursaries"}
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full h-10 rounded-md ring-1 ring-border bg-white font-medium text-sm hover:bg-muted transition-colors mb-3 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-4 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          or
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              required
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 px-3 rounded-md ring-1 ring-border bg-white text-sm"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-md ring-1 ring-border bg-white text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-md ring-1 ring-border bg-white text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          {mode === "signin" ? "New to E-WEST Hub?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary font-medium"
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          <Link to="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}