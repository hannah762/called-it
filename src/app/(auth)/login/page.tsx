"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";

function LoginForm() {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/";

  const supabase = createClient();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedName = displayName.trim();
    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters");
      setLoading(false);
      return;
    }

    // Sign in anonymously
    const { data, error: authError } = await supabase.auth.signInAnonymously();

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create their profile with the display name
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        display_name: trimmedName,
        avatar_url: null,
        coin_balance: 500,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        setError(profileError.message);
        setLoading(false);
        return;
      }

      router.push(redirect);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo & Welcome */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet text-3xl shadow-lg shadow-violet/30">
          <span role="img" aria-label="crystal ball">&#x1F52E;</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Called It!
        </h1>
        <p className="text-muted-foreground">
          Predict the unpredictable with friends
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="space-y-5 p-6">
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="displayName">
                What should we call you?
              </label>
              <input
                id="displayName"
                type="text"
                required
                maxLength={20}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-0 transition-colors"
              />
            </div>
            {error && (
              <p className="text-sm text-coral rounded-lg bg-coral-light px-3 py-2">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading || displayName.trim().length < 2}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Let&apos;s Go!
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Fun footer */}
      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Sparkles className="h-3 w-3 text-gold" />
        Start with 500 coins to bet with
        <Sparkles className="h-3 w-3 text-gold" />
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-violet-light via-background to-background">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
