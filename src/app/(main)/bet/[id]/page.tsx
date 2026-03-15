import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BetDetail } from "@/components/bet/bet-detail";

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

  // Fetch bet with options
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("*")
    .eq("id", id)
    .single();

  if (betError || !bet) notFound();

  // Fetch options
  const { data: options } = await supabase
    .from("options")
    .select("*")
    .eq("bet_id", id)
    .order("sort_order", { ascending: true });

  // Fetch wagers with user info
  const { data: wagers } = await supabase
    .from("wagers")
    .select("*, user:users(id, display_name, avatar_url)")
    .eq("bet_id", id)
    .order("created_at", { ascending: true });

  // Fetch payouts with user info (only if resolved)
  let payouts: any[] = [];
  if (bet.status === "resolved") {
    const { data } = await supabase
      .from("payouts")
      .select("*, user:users(id, display_name)")
      .eq("bet_id", id);
    payouts = data || [];
  }

  // Fetch participant count
  const { count: participantCount } = await supabase
    .from("bet_participants")
    .select("*", { count: "exact", head: true })
    .eq("bet_id", id);

  // Get current user's balance
  const { data: profile } = await supabase
    .from("users")
    .select("coin_balance")
    .eq("id", user.id)
    .single();

  // Get creator name
  const { data: creator } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", bet.creator_id)
    .single();

  // Auto-join as participant if not already
  await supabase
    .from("bet_participants")
    .upsert(
      { bet_id: id, user_id: user.id },
      { onConflict: "bet_id,user_id" }
    );

  return (
    <BetDetail
      bet={bet}
      options={options || []}
      wagers={(wagers as any) || []}
      payouts={payouts}
      participantCount={participantCount || 0}
      currentUserId={user.id}
      currentUserBalance={profile?.coin_balance || 0}
      creatorName={creator?.display_name || "Unknown"}
    />
  );
}
