import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default async function JoinBetPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If logged in, try to join the bet automatically
  if (user) {
    // Look up the bet by join code
    const { data: bet } = await supabase
      .from("bets")
      .select("id")
      .eq("join_code", upperCode)
      .single();

    if (bet) {
      // Check if already a participant
      const { data: existing } = await supabase
        .from("bet_participants")
        .select("bet_id")
        .eq("bet_id", bet.id)
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        // Ensure user profile exists
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          const displayName =
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Player";

          await supabase.from("users").insert({
            id: user.id,
            display_name: displayName,
            avatar_url: null,
            coin_balance: 500,
          });
        }

        // Join the bet
        await supabase.from("bet_participants").insert({
          bet_id: bet.id,
          user_id: user.id,
        });
      }

      // Redirect to the bet detail page
      redirect(`/bet/${bet.id}`);
    }

    // Bet not found — show error
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-coral-light via-background to-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet text-3xl shadow-lg shadow-violet/30">
              <span role="img" aria-label="crystal ball">&#x1F52E;</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Called It!</h1>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="space-y-4 p-6 text-center">
              <div className="text-4xl">&#x1F914;</div>
              <p className="text-lg font-semibold">Bet not found</p>
              <p className="text-sm text-muted-foreground">
                The code <span className="font-mono font-bold text-foreground">{upperCode}</span> doesn&apos;t match any active bet. Double-check and try again.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/">Go Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not logged in — show sign-in prompt
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-gold-light via-background to-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet text-3xl shadow-lg shadow-violet/30">
            <span role="img" aria-label="crystal ball">&#x1F52E;</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Called It!</h1>
        </div>

        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet via-gold to-mint" />
          <CardContent className="space-y-5 p-6 text-center">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                You&apos;ve been invited to join
              </p>
              <div className="rounded-xl bg-violet-light p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet">
                  Join code
                </p>
                <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em] text-violet">
                  {upperCode}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Pick a name to join this prediction and start betting.
            </p>

            <Button asChild size="lg" className="w-full">
              <Link href={`/login?redirect=/join/${upperCode}`}>
                Join the Bet
              </Link>
            </Button>

            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-gold" />
              New players get 500 coins to start
              <Sparkles className="h-3 w-3 text-gold" />
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
