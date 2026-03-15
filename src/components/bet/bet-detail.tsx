"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptionCard } from "./option-card";
import { Countdown } from "./countdown";
import {
  Clock,
  Users,
  Trophy,
  Share2,
  AlertTriangle,
  Undo2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FIXED_WAGER } from "@/lib/utils/constants";
import type { Bet, Option, Wager, Payout, User } from "@/lib/supabase/types";

type WagerWithUser = Wager & { user: Pick<User, "id" | "display_name" | "avatar_url"> };
type PayoutWithUser = Payout & { user: Pick<User, "id" | "display_name"> };

type BetDetailProps = {
  bet: Bet;
  options: Option[];
  wagers: WagerWithUser[];
  payouts: PayoutWithUser[];
  participantCount: number;
  currentUserId: string;
  currentUserBalance: number;
  creatorName: string;
};

const avatarColors = [
  "bg-violet text-white",
  "bg-gold text-gold-foreground",
  "bg-mint text-white",
  "bg-coral text-white",
  "bg-sky text-white",
];

export function BetDetail({
  bet: initialBet,
  options,
  wagers: initialWagers,
  payouts: initialPayouts,
  participantCount: initialParticipantCount,
  currentUserId,
  currentUserBalance: initialBalance,
  creatorName,
}: BetDetailProps) {
  const router = useRouter();
  const supabase = createClient();

  const [bet, setBet] = useState(initialBet);
  const [wagers, setWagers] = useState(initialWagers);
  const [payouts, setPayouts] = useState(initialPayouts);
  const [participantCount, setParticipantCount] = useState(initialParticipantCount);
  const [balance, setBalance] = useState(initialBalance);

  // Wager form state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolution state
  const [resolveOptionId, setResolveOptionId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);

  const isCreator = bet.creator_id === currentUserId;
  const myWager = wagers.find((w) => w.user_id === currentUserId);
  const hasWagered = !!myWager;

  // Initialize selected option from existing wager
  useEffect(() => {
    if (myWager) {
      setSelectedOptionId(myWager.option_id);
    }
  }, [myWager]);

  // Pool calculations
  const optionPools = useMemo(() => {
    const pools: Record<string, { amount: number; count: number }> = {};
    for (const opt of options) {
      pools[opt.id] = { amount: 0, count: 0 };
    }
    for (const w of wagers) {
      if (pools[w.option_id]) {
        pools[w.option_id].amount += w.amount;
        pools[w.option_id].count += 1;
      }
    }
    return pools;
  }, [options, wagers]);

  const totalPool = useMemo(
    () => wagers.reduce((sum, w) => sum + w.amount, 0),
    [wagers]
  );

  // ---- Real-time subscriptions ----
  useEffect(() => {
    const channel = supabase
      .channel(`bet-${bet.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wagers", filter: `bet_id=eq.${bet.id}` },
        () => {
          fetchWagers();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bets", filter: `id=eq.${bet.id}` },
        (payload) => {
          setBet(payload.new as Bet);
          if ((payload.new as Bet).status === "resolved") {
            fetchPayouts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bet.id]);

  const fetchWagers = useCallback(async () => {
    const { data } = await supabase
      .from("wagers")
      .select("*, user:users(id, display_name, avatar_url)")
      .eq("bet_id", bet.id);
    if (data) setWagers(data as WagerWithUser[]);
  }, [bet.id, supabase]);

  const fetchPayouts = useCallback(async () => {
    const { data } = await supabase
      .from("payouts")
      .select("*, user:users(id, display_name)")
      .eq("bet_id", bet.id);
    if (data) setPayouts(data as PayoutWithUser[]);
  }, [bet.id, supabase]);

  // ---- Actions ----

  async function placeWager() {
    if (!selectedOptionId) {
      setError("Pick an outcome first!");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/bets/${bet.id}/wager`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selectedOptionId, amount: FIXED_WAGER }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("coin_balance")
        .eq("id", currentUserId)
        .single();
      if (profile) setBalance(profile.coin_balance);

      await fetchWagers();
    } catch {
      setError("Network error — try again");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function withdrawWager() {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/bets/${bet.id}/wager`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSelectedOptionId(null);

      const { data: profile } = await supabase
        .from("users")
        .select("coin_balance")
        .eq("id", currentUserId)
        .single();
      if (profile) setBalance(profile.coin_balance);

      await fetchWagers();
    } catch {
      setError("Network error — try again");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resolveBet() {
    if (!resolveOptionId) return;
    setIsResolving(true);
    setError(null);

    try {
      const res = await fetch(`/api/bets/${bet.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winningOptionId: resolveOptionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setShowResolveConfirm(false);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setIsResolving(false);
    }
  }

  const [shareCopied, setShareCopied] = useState(false);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/join/${bet.join_code}`;
    const text = `What's your prediction? "${bet.question}" — join with code ${bet.join_code}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Called It!", text, url });
        return;
      }
    } catch {
      // User cancelled or share failed — fall through to copy
    }

    const copied = await copyToClipboard(url);
    if (copied) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }

  // ---- Status ----
  const statusConfig = {
    open: { label: "Open", className: "bg-mint-light text-mint border-mint/20" },
    locked: { label: "Locked", className: "bg-gold-light text-gold-foreground border-gold/20" },
    resolved: { label: "Resolved", className: "bg-violet-light text-violet border-violet/20" },
    expired: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
  };

  const deadlinePassed = new Date(bet.deadline) <= new Date();
  const needsResolution = isCreator && (bet.status === "locked" || (bet.status === "open" && deadlinePassed));
  const isOpen = bet.status === "open" && !deadlinePassed;
  const isLocked = bet.status === "locked" || (bet.status === "open" && deadlinePassed);
  const isResolved = bet.status === "resolved";
  const isExpired = bet.status === "expired";

  const myPayout = payouts.find((p) => p.user_id === currentUserId);
  const didWin = isResolved && myWager && myWager.option_id === bet.winning_option_id;
  const didLose = isResolved && myWager && myWager.option_id !== bet.winning_option_id;
  const didNotVote = isResolved && !myWager;

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={statusConfig[bet.status].className} variant="outline">
              {statusConfig[bet.status].label}
            </Badge>
            {isCreator && (
              <Badge variant="outline" className="text-xs bg-violet/10 text-violet border-violet/20">
                Your bet
              </Badge>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight leading-tight">
            {bet.question}
          </h1>

          {bet.stakes && (
            <p className="mt-2 text-sm font-semibold text-coral">
              &#x1F525; {bet.stakes}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-violet-light/60 px-3 py-1 text-xs text-violet font-medium">
              <Clock className="h-3 w-3" />
              {isOpen ? (
                <Countdown deadline={bet.deadline} onExpire={() => router.refresh()} />
              ) : deadlinePassed ? (
                "Betting closed"
              ) : (
                new Date(bet.deadline).toLocaleDateString()
              )}
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-violet-light/60 px-3 py-1 text-xs text-violet font-medium">
              <Users className="h-3 w-3" />
              {wagers.length} {wagers.length === 1 ? "vote" : "votes"}
            </div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Created by {isCreator ? "you" : creatorName}
          </p>
        </CardContent>
      </Card>

      {/* Result banners */}
      {didWin && (
        <Card className="border-0 bg-gradient-to-r from-mint to-mint/80 shadow-lg shadow-mint/20 overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              &#x1F3C6;
            </div>
            <div>
              <p className="text-lg font-bold text-white">YOU CALLED IT!</p>
              <p className="text-sm text-white/80">
                You earned {myPayout?.amount || 0} coins
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {didLose && (
        <Card className="border-0 bg-gradient-to-r from-coral to-coral/80 shadow-lg shadow-coral/20 overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              &#x1F627;
            </div>
            <div>
              <p className="text-lg font-bold text-white">BAD CALL!</p>
              <p className="text-sm text-white/80">
                Better luck next time
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {didNotVote && (
        <Card className="border-0 bg-gradient-to-r from-gold to-gold/80 shadow-lg shadow-gold/20 overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              &#x1F937;
            </div>
            <div>
              <p className="text-lg font-bold text-gold-foreground">YOU SAT THIS ONE OUT</p>
              <p className="text-sm text-gold-foreground/70">
                No pick, no glory!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired banner */}
      {isExpired && (
        <Card className="border-0 bg-muted">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-semibold text-foreground">Bet expired</p>
              <p className="text-sm text-muted-foreground">
                This bet wasn&apos;t resolved in time. All wagers were refunded.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options list */}
      <div className="space-y-2.5">
        {options
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((option, index) => {
            const pool = optionPools[option.id] || { amount: 0, count: 0 };

            return (
              <OptionCard
                key={option.id}
                label={option.label}
                isWildCard={option.is_wild_card}
                isSelected={
                  isOpen
                    ? selectedOptionId === option.id
                    : needsResolution
                    ? resolveOptionId === option.id
                    : false
                }
                isWinner={isResolved && bet.winning_option_id === option.id}
                voteCount={pool.count}
                totalVotes={wagers.length}
                showVotes={hasWagered || isLocked || isResolved || isExpired}
                disabled={(!isOpen && !needsResolution) || isSubmitting}
                colorIndex={index}
                onClick={() => {
                  if (isOpen) {
                    setSelectedOptionId(option.id);
                    setError(null);
                  } else if (needsResolution) {
                    setResolveOptionId(option.id);
                    setShowResolveConfirm(false);
                    setError(null);
                  }
                }}
              />
            );
          })}
      </div>

      {/* Vote action — only for open bets */}
      {isOpen && (
        <div className="space-y-3">
          {error && (
            <div className="rounded-xl bg-coral-light px-3 py-2 text-sm font-medium text-coral">
              {error}
            </div>
          )}

          {!hasWagered ? (
            <Button
              size="lg"
              className="w-full"
              disabled={!selectedOptionId || isSubmitting}
              onClick={placeWager}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Lock In My Pick
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="lg"
                className="flex-1"
                disabled={!selectedOptionId || selectedOptionId === myWager?.option_id || isSubmitting}
                onClick={placeWager}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Change Pick
              </Button>
              <Button
                size="lg"
                variant="outline"
                disabled={isSubmitting}
                onClick={withdrawWager}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Locked state — predictions revealed */}
      {isLocked && !needsResolution && (
        <Card className="border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="py-6 text-center">
            <div className="mb-2 text-3xl">&#x1F510;</div>
            <p className="text-lg font-bold">Predictions are sealed!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Waiting for {creatorName} to call the winner...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Prediction list (locked & resolved) */}
      {(isLocked || isResolved) && wagers.length > 0 && (
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-violet" />
              {isResolved ? "Final Predictions" : "What everyone picked"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {wagers.map((w, i) => {
              const optLabel = options.find((o) => o.id === w.option_id)?.label || "?";
              const isWinningPick = isResolved && w.option_id === bet.winning_option_id;
              const payout = payouts.find((p) => p.user_id === w.user_id);
              const colorClass = avatarColors[i % avatarColors.length];

              return (
                <div
                  key={w.id}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isWinningPick ? "bg-mint-light/50" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}
                    >
                      {w.user.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <span className="font-semibold">
                        {w.user_id === currentUserId ? "You" : w.user.display_name}
                      </span>
                      {isCreator && w.user_id === bet.creator_id && (
                        <span className="ml-1 text-xs text-muted-foreground">(creator)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isWinningPick ? "text-mint" : ""}`}>
                      {optLabel}
                    </p>
                    {isWinningPick && (
                      <p className="text-xs font-semibold text-mint">
                        &#x2705; Called it!
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Resolution UI — creator only */}
      {needsResolution && (
        <Card className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <div className="h-1 bg-gradient-to-r from-coral to-gold" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-coral">
              <Trophy className="h-5 w-5" />
              Time to call it!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select the winning outcome above, then confirm.
            </p>

            {error && (
              <div className="rounded-xl bg-coral-light px-3 py-2 text-sm font-medium text-coral">
                {error}
              </div>
            )}

            {!showResolveConfirm ? (
              <Button
                className="w-full"
                disabled={!resolveOptionId}
                onClick={() => setShowResolveConfirm(true)}
              >
                Resolve Bet
              </Button>
            ) : (
              <div className="space-y-3 rounded-xl bg-coral-light/50 p-4">
                <p className="text-sm font-medium text-foreground">
                  Are you sure?{" "}
                  <strong className="text-coral">
                    {options.find((o) => o.id === resolveOptionId)?.label}
                  </strong>{" "}
                  wins. This can&apos;t be undone.
                </p>
                {resolveOptionId === myWager?.option_id && (
                  <p className="text-xs text-muted-foreground">
                    Note: You also bet on this outcome.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={isResolving}
                    onClick={resolveBet}
                  >
                    {isResolving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowResolveConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Share button */}
      <Button variant="outline" className="w-full bg-white/70 backdrop-blur-sm border-violet/20 hover:bg-white/90" onClick={handleShare}>
        {shareCopied ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Link Copied!
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share Bet
          </>
        )}
      </Button>

      {/* Join code footer */}
      <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-violet/10 px-4 py-3 text-center">
        <p className="text-xs text-violet/60">Join code</p>
        <p className="font-mono text-lg font-black tracking-[0.2em] text-violet">
          {bet.join_code}
        </p>
      </div>
    </div>
  );
}
