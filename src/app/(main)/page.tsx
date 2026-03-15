import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Hash, Clock, Users, ChevronRight, Sparkles, Trophy } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateBetCard } from "@/components/bet/disclaimer-dialog";

// Rotating colors for bet cards
const cardAccents = [
  { bg: "bg-violet-light", border: "border-l-violet", text: "text-violet" },
  { bg: "bg-gold-light", border: "border-l-gold", text: "text-gold" },
  { bg: "bg-mint-light", border: "border-l-mint", text: "text-mint" },
  { bg: "bg-coral-light", border: "border-l-coral", text: "text-coral" },
  { bg: "bg-sky-light", border: "border-l-sky", text: "text-sky" },
];

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeBets: any[] = [];
  let resolvedBets: any[] = [];
  let needsResolution: any[] = [];
  let profile: any = null;

  if (user) {
    // Fetch user profile for balance
    const { data: userProfile } = await supabase
      .from("users")
      .select("display_name, coin_balance")
      .eq("id", user.id)
      .single();
    profile = userProfile;

    // Get bet IDs the user is part of
    const { data: participations } = await supabase
      .from("bet_participants")
      .select("bet_id")
      .eq("user_id", user.id);

    const betIds = participations?.map((p) => p.bet_id) || [];

    if (betIds.length > 0) {
      const { data: active } = await supabase
        .from("bets")
        .select("*, options(*)")
        .in("id", betIds)
        .in("status", ["open", "locked"])
        .order("deadline", { ascending: true });

      activeBets = active || [];

      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: resolved } = await supabase
        .from("bets")
        .select("*, options(*)")
        .in("id", betIds)
        .eq("status", "resolved")
        .gte("resolved_at", sevenDaysAgo)
        .order("resolved_at", { ascending: false });

      resolvedBets = resolved || [];
    }

    const { data: unresolved } = await supabase
      .from("bets")
      .select("*")
      .eq("creator_id", user.id)
      .eq("status", "locked")
      .lt("deadline", new Date().toISOString());

    needsResolution = unresolved || [];
  }

  function timeUntil(deadline: string): string {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff < 0) return "Closed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hey, {profile?.display_name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Ready to make some predictions?
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-1.5 rounded-full bg-gold-light px-3 py-1.5">
            <span className="text-sm">&#x1FA99;</span>
            <span className="text-sm font-bold text-gold-foreground">
              {profile.coin_balance}
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <CreateBetCard />
        <Link href="/join" className="group">
          <Card className="border-0 bg-gold overflow-hidden transition-all hover:shadow-lg hover:shadow-gold/20 active:scale-[0.98]">
            <CardContent className="flex flex-col items-center gap-2 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gold-foreground">
                Join with Code
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Needs Resolution */}
      {needsResolution.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-coral-light">
              <span className="text-xs">&#x26A1;</span>
            </div>
            <h2 className="text-base font-bold">
              Needs Your Call
              <span className="ml-1.5 text-sm font-normal text-coral">
                ({needsResolution.length})
              </span>
            </h2>
          </div>
          {needsResolution.map((bet) => (
            <Link key={bet.id} href={`/bet/${bet.id}`}>
              <Card className="border-l-4 border-l-coral bg-coral-light/30 transition-all hover:shadow-md active:scale-[0.99]">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{bet.question}</p>
                    <p className="text-xs font-medium text-coral">
                      Time to call the winner!
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-coral" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}

      {/* Active Bets */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-light">
            <Sparkles className="h-3.5 w-3.5 text-violet" />
          </div>
          <h2 className="text-base font-bold">Active Bets</h2>
        </div>
        {activeBets.length > 0 ? (
          <div className="space-y-2.5">
            {activeBets.map((bet, i) => {
              const accent = cardAccents[i % cardAccents.length];
              return (
                <Link key={bet.id} href={`/bet/${bet.id}`}>
                  <Card
                    className={`border-l-4 ${accent.border} transition-all hover:shadow-md active:scale-[0.99]`}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {bet.question}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeUntil(bet.deadline)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {bet.options?.length || 0} options
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              bet.status === "open"
                                ? "bg-mint-light text-mint"
                                : "bg-gold-light text-gold-foreground"
                            }`}
                          >
                            {bet.status === "open" ? "Open" : "Locked"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 text-4xl">&#x1F3B2;</div>
              <p className="font-medium text-muted-foreground">
                No active bets yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create one or join a friend&apos;s!
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/bet/create">
                  <PlusCircle className="h-4 w-4" />
                  Create Your First Bet
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recent Results */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold-light">
            <Trophy className="h-3.5 w-3.5 text-gold" />
          </div>
          <h2 className="text-base font-bold">Recent Results</h2>
        </div>
        {resolvedBets.length > 0 ? (
          <div className="space-y-2.5">
            {resolvedBets.map((bet, i) => {
              const accent = cardAccents[(i + 2) % cardAccents.length];
              return (
                <Link key={bet.id} href={`/bet/${bet.id}`}>
                  <Card
                    className={`border-l-4 ${accent.border} transition-all hover:shadow-md active:scale-[0.99]`}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {bet.question}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Resolved{" "}
                          {new Date(bet.resolved_at).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" }
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 text-4xl">&#x1F3C6;</div>
              <p className="font-medium text-muted-foreground">
                No results yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Resolved bets will show up here
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
