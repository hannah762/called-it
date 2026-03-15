import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Clock, Coins, Target, Flame, Trophy } from "lucide-react";

const cardAccents = [
  { border: "border-l-violet" },
  { border: "border-l-gold" },
  { border: "border-l-mint" },
  { border: "border-l-coral" },
  { border: "border-l-sky" },
];

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: any = null;
  let activeBets: any[] = [];
  let pastBets: any[] = [];
  let totalVoted = 0;
  let totalWins = 0;

  if (user) {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = profileData as any;

    // Get all bet IDs user is part of (participants + created)
    const { data: participations } = await supabase
      .from("bet_participants")
      .select("bet_id")
      .eq("user_id", user.id);

    const participantBetIds = ((participations || []) as any[]).map(
      (p: any) => p.bet_id
    );

    const { data: createdBets } = await supabase
      .from("bets")
      .select("id")
      .eq("creator_id", user.id);

    const createdBetIds = ((createdBets || []) as any[]).map(
      (b: any) => b.id
    );

    const betIds = [...new Set([...participantBetIds, ...createdBetIds])];

    if (betIds.length > 0) {
      // Active bets (open or locked)
      const { data: active } = await supabase
        .from("bets")
        .select("*")
        .in("id", betIds)
        .in("status", ["open", "locked"])
        .order("deadline", { ascending: true });

      activeBets = (active || []) as any[];

      // Past bets (resolved) — fetch without the join that might fail
      const { data: past } = await supabase
        .from("bets")
        .select("*")
        .in("id", betIds)
        .eq("status", "resolved")
        .order("resolved_at", { ascending: false })
        .limit(20);

      pastBets = (past || []) as any[];
    }

    // Calculate accuracy: get all user's wagers on resolved bets
    const { data: userWagers } = await supabase
      .from("wagers")
      .select("bet_id, option_id")
      .eq("user_id", user.id);

    const allWagers = (userWagers || []) as any[];

    if (allWagers.length > 0) {
      // Get all resolved bets the user wagered on
      const wageredBetIds = allWagers.map((w: any) => w.bet_id);
      const { data: resolvedBets } = await supabase
        .from("bets")
        .select("id, winning_option_id")
        .in("id", wageredBetIds)
        .eq("status", "resolved");

      const resolved = (resolvedBets || []) as any[];

      // Count wins vs total resolved bets voted on
      for (const bet of resolved) {
        const wager = allWagers.find((w: any) => w.bet_id === bet.id);
        if (wager) {
          totalVoted++;
          if (wager.option_id === bet.winning_option_id) {
            totalWins++;
          }
        }
      }
    }
  }

  const accuracy = totalVoted > 0 ? Math.round((totalWins / totalVoted) * 100) : 0;
  const initial = profile?.display_name?.[0]?.toUpperCase() || "?";

  function timeUntil(deadline: string): string {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff < 0) return "Closed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // Build a lookup for past bets: did the user win or lose?
  // We already have pastBets and can check against wagers
  const pastBetResults: Record<string, "win" | "loss" | "no_vote"> = {};
  if (user) {
    const { data: userWagers } = await supabase
      .from("wagers")
      .select("bet_id, option_id")
      .eq("user_id", user.id);

    const wagerMap = new Map(
      ((userWagers || []) as any[]).map((w: any) => [w.bet_id, w.option_id])
    );

    for (const bet of pastBets) {
      const userOptionId = wagerMap.get(bet.id);
      if (!userOptionId) {
        pastBetResults[bet.id] = "no_vote";
      } else if (userOptionId === bet.winning_option_id) {
        pastBetResults[bet.id] = "win";
      } else {
        pastBetResults[bet.id] = "loss";
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet text-2xl font-bold text-white shadow-lg shadow-violet/30">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile?.display_name || "Player"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Joined {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })
              : "recently"}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 bg-gold-light/50">
          <CardContent className="flex flex-col items-center py-4">
            <Coins className="mb-1 h-5 w-5 text-gold" />
            <p className="text-2xl font-bold">{profile?.coin_balance ?? 0}</p>
            <p className="text-xs text-muted-foreground">Coins</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-mint-light/50">
          <CardContent className="flex flex-col items-center py-4">
            <Target className="mb-1 h-5 w-5 text-mint" />
            <p className="text-2xl font-bold">{totalVoted > 0 ? `${accuracy}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">
              Accuracy{totalVoted > 0 ? ` (${totalWins}/${totalVoted})` : ""}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-coral-light/50">
          <CardContent className="flex flex-col items-center py-4">
            <Flame className="mb-1 h-5 w-5 text-coral" />
            <p className="text-2xl font-bold">{profile?.streak_current ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Win Streak{profile?.streak_best > 0 ? ` (best: ${profile.streak_best})` : ""}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-violet-light/50">
          <CardContent className="flex flex-col items-center py-4">
            <Trophy className="mb-1 h-5 w-5 text-violet" />
            <p className="text-2xl font-bold">{totalWins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Bets */}
      <section className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-light text-xs">&#x1F3AF;</span>
          My Active Bets
          {activeBets.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({activeBets.length})
            </span>
          )}
        </h2>
        {activeBets.length > 0 ? (
          <div className="space-y-2.5">
            {activeBets.map((bet: any, i: number) => {
              const accent = cardAccents[i % cardAccents.length];
              return (
                <Link key={bet.id} href={`/bet/${bet.id}`}>
                  <Card className={`border-l-4 ${accent.border} transition-all hover:shadow-md active:scale-[0.99]`}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{bet.question}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeUntil(bet.deadline)}
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
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No active bets right now
            </CardContent>
          </Card>
        )}
      </section>

      {/* Past Bets */}
      <section className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold-light text-xs">&#x1F3C6;</span>
          Past Bets
        </h2>
        {pastBets.length > 0 ? (
          <div className="space-y-2.5">
            {pastBets.map((bet: any, i: number) => {
              const result = pastBetResults[bet.id];
              const resultConfig = {
                win: { label: "Called It!", color: "text-mint", bg: "bg-mint-light", emoji: "&#x2705;" },
                loss: { label: "Bad Call", color: "text-coral", bg: "bg-coral-light", emoji: "&#x274C;" },
                no_vote: { label: "Sat Out", color: "text-muted-foreground", bg: "bg-muted", emoji: "&#x1F937;" },
              };
              const config = resultConfig[result || "no_vote"];

              return (
                <Link key={bet.id} href={`/bet/${bet.id}`}>
                  <Card className="transition-all hover:shadow-md active:scale-[0.99]">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{bet.question}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Resolved {new Date(bet.resolved_at).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bg} ${config.color}`}
                            dangerouslySetInnerHTML={{ __html: `${config.emoji} ${config.label}` }}
                          />
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
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No resolved bets yet
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
