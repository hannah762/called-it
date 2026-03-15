import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { placeWagerSchema } from "@/lib/validators/bet";
import { MIN_WAGER, MAX_WAGER } from "@/lib/utils/constants";

// Place or update a wager
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

  // Parse and validate body
  const body = await request.json();
  const parsed = placeWagerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { optionId, amount } = parsed.data;

  // Fetch the bet and verify it's open
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("*")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return NextResponse.json({ error: "Bet not found" }, { status: 404 });
  }

  if (bet.status !== "open") {
    return NextResponse.json(
      { error: "Betting is closed for this bet" },
      { status: 400 }
    );
  }

  if (new Date(bet.deadline) <= new Date()) {
    return NextResponse.json(
      { error: "Betting deadline has passed" },
      { status: 400 }
    );
  }

  // Verify the option belongs to this bet
  const { data: option } = await supabase
    .from("options")
    .select("id")
    .eq("id", optionId)
    .eq("bet_id", betId)
    .single();

  if (!option) {
    return NextResponse.json(
      { error: "Invalid option for this bet" },
      { status: 400 }
    );
  }

  // Get user's coin balance
  const { data: profile } = await supabase
    .from("users")
    .select("coin_balance")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Check for existing wager (to handle updates)
  const { data: existingWager } = await supabase
    .from("wagers")
    .select("*")
    .eq("bet_id", betId)
    .eq("user_id", user.id)
    .single();

  // Calculate effective balance (refund old wager if updating)
  const effectiveBalance =
    profile.coin_balance + (existingWager?.amount || 0);

  if (amount > effectiveBalance) {
    return NextResponse.json(
      { error: "Not enough coins" },
      { status: 400 }
    );
  }

  // Upsert the wager
  if (existingWager) {
    // Update existing wager
    const { error: updateError } = await supabase
      .from("wagers")
      .update({ option_id: optionId, amount })
      .eq("id", existingWager.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update wager" },
        { status: 500 }
      );
    }

    // Adjust balance: refund old amount, deduct new amount
    const balanceDiff = existingWager.amount - amount;
    const { error: balanceError } = await supabase
      .from("users")
      .update({ coin_balance: profile.coin_balance + balanceDiff })
      .eq("id", user.id);

    if (balanceError) {
      return NextResponse.json(
        { error: "Failed to update balance" },
        { status: 500 }
      );
    }
  } else {
    // Insert new wager
    const { error: insertError } = await supabase
      .from("wagers")
      .insert({ bet_id: betId, user_id: user.id, option_id: optionId, amount });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to place wager" },
        { status: 500 }
      );
    }

    // Deduct from balance
    const { error: balanceError } = await supabase
      .from("users")
      .update({ coin_balance: profile.coin_balance - amount })
      .eq("id", user.id);

    if (balanceError) {
      return NextResponse.json(
        { error: "Failed to update balance" },
        { status: 500 }
      );
    }

    // Add as participant if not already
    await supabase
      .from("bet_participants")
      .upsert({ bet_id: betId, user_id: user.id }, { onConflict: "bet_id,user_id" });
  }

  return NextResponse.json({ success: true });
}

// Withdraw a wager
export async function DELETE(
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

  // Verify bet is still open
  const { data: bet } = await supabase
    .from("bets")
    .select("status, deadline")
    .eq("id", betId)
    .single();

  if (!bet || bet.status !== "open") {
    return NextResponse.json(
      { error: "Cannot withdraw — betting is closed" },
      { status: 400 }
    );
  }

  // Find and delete the wager
  const { data: wager } = await supabase
    .from("wagers")
    .select("*")
    .eq("bet_id", betId)
    .eq("user_id", user.id)
    .single();

  if (!wager) {
    return NextResponse.json({ error: "No wager to withdraw" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("wagers")
    .delete()
    .eq("id", wager.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to withdraw wager" },
      { status: 500 }
    );
  }

  // Refund coins
  const { data: profile } = await supabase
    .from("users")
    .select("coin_balance")
    .eq("id", user.id)
    .single();

  if (profile) {
    await supabase
      .from("users")
      .update({ coin_balance: profile.coin_balance + wager.amount })
      .eq("id", user.id);
  }

  return NextResponse.json({ success: true });
}
