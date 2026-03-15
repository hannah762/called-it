import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BetDetail } from "@/components/bet/bet-detail";
import type { Bet, Option } from "@/lib/supabase/types";

export default async function BetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Fetch bet
  const { data: betData, error: betError } = await supabase
    .from("bets")
    .select("*")
    .eq("id", id)
    .single();

  if (betError || !betData) notFound();
  const bet = betData as unknown as Bet;

  // Fetch options
  const { data: optionsData } = await supabase
    .from("options")
    .select("*")
    .eq("bet_id", id)
    .order("sort_order", { ascending: true });
  const options = (optionsData || []) as unknown as Option[];

  // Fetch wagers with user info
  const { data: wagersData } = await supabase
    .from("wagers")
    .select("*, user:users(id, display_name, avatar_url)")
    .eq("bet_id", id)
    .order("created_at", { ascending: true });
  const wagers = (wagersData || []) as any[];

  // Fetch payouts with user info (only if resolved)
  let payouts: any[] = [];
  if (bet.status === "resolved") {
    const { data } = await supabase
      .from("payouts")
      .select("*, user:users(id, display_name)")
      .eq("bet_id", id);
    payouts = (data || []) as any[];
  }

  // Fetch participant count
  const { count: participantCount } = await supabase
    .from("bet_participants")
    .select("*", { count: "exact", head: true })
    .eq("bet_id", id);

  // Get current user's balance
  const { data: profileData } = await supabase
    .from("users")
    .select("coin_balance")
    .eq("id", user.id)
    .single();
  const profile = profileData as unknown as { coin_balance: number } | null;

  // Get creator name
  const { data: creatorData } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", bet.creator_id)
    .single();
  const creator = creatorData as unknown as { display_name: string } | null;

  // Auto-join as participant if not already
  await supabase
    .from("bet_participants")
    .upsert(
      { bet_id: id, user_id: user.id },
      { onConflict: "bet_id,user_id" }
    );

  return (
    <div className="-mx-5 -my-6 min-h-screen bg-gradient-to-b from-violet-light via-violet-light/30 to-background">
      <div className="px-5 py-6">
        <BetDetail
          bet={bet}
          options={options}
          wagers={wagers}
          payouts={payouts}
          participantCount={participantCount || 0}
          currentUserId={user.id}
          currentUserBalance={profile?.coin_balance || 0}
          creatorName={creator?.display_name || "Unknown"}
        />
      </div>
    </div>
  );
}
