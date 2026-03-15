import type { Wager } from "@/lib/supabase/types";

export type PayoutResult = {
  user_id: string;
  amount: number;
  type: "win" | "refund";
};

/**
 * Calculate payouts using parimutuel pooling.
 *
 * All wagers go into a shared pot. Winners split the pot proportionally
 * based on their stake.
 *
 * Edge cases:
 * - No one picked the winner → refund everyone
 * - Rounding remainder → goes to the highest-stake winner (earliest wager breaks ties)
 */
export function calculatePayouts(
  wagers: Wager[],
  winningOptionId: string
): PayoutResult[] {
  const totalPot = wagers.reduce((sum, w) => sum + w.amount, 0);

  if (totalPot === 0) return [];

  const winningWagers = wagers.filter(
    (w) => w.option_id === winningOptionId
  );
  const winnerPool = winningWagers.reduce((sum, w) => sum + w.amount, 0);

  // No one picked the winner — refund everyone
  if (winnerPool === 0) {
    return wagers.map((w) => ({
      user_id: w.user_id,
      amount: w.amount,
      type: "refund" as const,
    }));
  }

  // Standard payout: winners split pot proportionally
  const payouts = winningWagers.map((w) => ({
    user_id: w.user_id,
    amount: Math.floor((w.amount / winnerPool) * totalPot),
    type: "win" as const,
  }));

  // Handle rounding remainder
  const distributed = payouts.reduce((sum, p) => sum + p.amount, 0);
  const remainder = totalPot - distributed;

  if (remainder > 0 && payouts.length > 0) {
    // Give remainder to highest-stake winner
    const sorted = [...payouts].sort((a, b) => b.amount - a.amount);
    sorted[0].amount += remainder;
  }

  return payouts;
}

/**
 * Calculate the implied odds for display.
 * Returns the payout multiplier if this option wins.
 */
export function getImpliedMultiplier(
  totalPot: number,
  optionPool: number
): number {
  if (optionPool === 0) return 0;
  return totalPot / optionPool;
}
