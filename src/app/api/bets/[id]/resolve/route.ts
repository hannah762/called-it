import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculatePayouts } from "@/lib/utils/payouts";
import type { Bet, Wager } from "@/lib/supabase/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: betId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { winningOptionId } = body as { winningOptionId: string };

  if (!winningOptionId) {
    return NextResponse.json(
      { error: "Missing winning option" },
      { status: 400 }
    );
  }

  // Fetch the bet
  const { data: betData, error: betError } = await supabase
    .from("bets")
    .select("*")
    .eq("id", betId)
    .single();

  if (betError || !betData) {
    return NextResponse.json({ error: "Bet not found" }, { status: 404 });
  }

  const bet = betData as unknown as Bet;

  // Only the creator can resolve
  if (bet.creator_id !== user.id) {
    return NextResponse.json(
      { error: "Only the bet creator can resolve this" },
      { status: 403 }
    );
  }

  // Must be locked (deadline passed) or still open but past deadline
  if (bet.status === "resolved" || bet.status === "expired") {
    return NextResponse.json(
      { error: "This bet is already " + bet.status },
      { status: 400 }
    );
  }

  // Verify the option belongs to this bet
  const { data: option } = await supabase
    .from("options")
    .select("id")
    .eq("id", winningOptionId)
    .eq("bet_id", betId)
    .single();

  if (!option) {
    return NextResponse.json(
      { error: "Invalid option for this bet" },
      { status: 400 }
    );
  }

  // Get all wagers
  const { data: wagersData } = await supabase
    .from("wagers")
    .select("*")
    .eq("bet_id", betId)
    .order("created_at", { ascending: true });

  const wagers = (wagersData || []) as unknown as Wager[];

  if (wagers.length === 0) {
    // No wagers — just mark as resolved
    await supabase
      .from("bets")
      .update({
        status: "resolved",
        winning_option_id: winningOptionId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", betId);

    return NextResponse.json({ success: true, payouts: [] });
  }

  // Calculate payouts
  const payoutResults = calculatePayouts(wagers, winningOptionId);

  // Write payouts to DB and update balances
  for (const payout of payoutResults) {
    // Insert payout record
    await supabase.from("payouts").insert({
      bet_id: betId,
      user_id: payout.user_id,
      amount: payout.amount,
    });

    // Credit the user's balance
    const { data: profileData } = await supabase
      .from("users")
      .select("coin_balance, streak_current, streak_best")
      .eq("id", payout.user_id)
      .single();

    const profile = profileData as unknown as {
      coin_balance: number;
      streak_current: number;
      streak_best: number;
    } | null;

    if (profile) {
      const updates: Record<string, number> = {
        coin_balance: profile.coin_balance + payout.amount,
      };

      // Update streaks for winners
      if (payout.type === "win") {
        const newStreak = profile.streak_current + 1;
        updates.streak_current = newStreak;
        if (newStreak > profile.streak_best) {
          updates.streak_best = newStreak;
        }
      } else {
        // Refund doesn't break streak
      }

      await supabase.from("users").update(updates).eq("id", payout.user_id);
    }
  }

  // Reset streaks for losers (wagered on non-winning option)
  const loserUserIds = wagers
    .filter((w) => w.option_id !== winningOptionId)
    .map((w) => w.user_id);

  if (loserUserIds.length > 0) {
    await supabase
      .from("users")
      .update({ streak_current: 0 })
      .in("id", loserUserIds);
  }

  // Mark bet as resolved
  await supabase
    .from("bets")
    .update({
      status: "resolved",
      winning_option_id: winningOptionId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", betId);

  return NextResponse.json({
    success: true,
    payouts: payoutResults,
  });
}
