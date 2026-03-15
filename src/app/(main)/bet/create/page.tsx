"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, Share2, Copy, Check, Sparkles } from "lucide-react";
import {
  JOIN_CODE_LENGTH,
  MAX_QUESTION_LENGTH,
  MAX_OPTION_LENGTH,
  MIN_OPTIONS,
  MAX_OPTIONS,
} from "@/lib/utils/constants";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const stepColors = [
  { num: "bg-violet text-white", accent: "text-violet" },
  { num: "bg-gold text-gold-foreground", accent: "text-gold" },
  { num: "bg-coral text-white", accent: "text-coral" },
  { num: "bg-mint text-mint-foreground", accent: "text-mint" },
];

export default function CreateBetPage() {
  const router = useRouter();
  const supabase = createClient();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [stakes, setStakes] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createdBet, setCreatedBet] = useState<{
    id: string;
    joinCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function addOption() {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, ""]);
    }
  }

  function removeOption(index: number) {
    if (options.length > MIN_OPTIONS) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (question.trim().length < 5) {
      setError("Question must be at least 5 characters.");
      return;
    }
    const filledOptions = options.filter((o) => o.trim().length > 0);
    if (filledOptions.length < MIN_OPTIONS) {
      setError(`Add at least ${MIN_OPTIONS} options.`);
      return;
    }
    if (!deadline) {
      setError("Set a deadline for when betting closes.");
      return;
    }
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      setError("Deadline must be in the future.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Ensure user profile exists
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
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

      const joinCode = generateJoinCode();

      const { data: bet, error: betError } = await supabase
        .from("bets")
        .insert({
          creator_id: user.id,
          question: question.trim(),
          stakes: stakes.trim() || null,
          deadline: deadlineDate.toISOString(),
          join_code: joinCode,
        })
        .select("id")
        .single();

      if (betError) throw betError;

      const optionRows = [
        ...filledOptions.map((label, i) => ({
          bet_id: bet.id,
          label: label.trim(),
          is_wild_card: false,
          sort_order: i,
        })),
        {
          bet_id: bet.id,
          label: "Something else entirely",
          is_wild_card: true,
          sort_order: filledOptions.length,
        },
      ];

      const { error: optionsError } = await supabase
        .from("options")
        .insert(optionRows);

      if (optionsError) throw optionsError;

      await supabase.from("bet_participants").insert({
        bet_id: bet.id,
        user_id: user.id,
      });

      setCreatedBet({ id: bet.id, joinCode });
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
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

  async function handleCopyLink() {
    if (!createdBet) return;
    const url = `${window.location.origin}/join/${createdBet.joinCode}`;
    const didCopy = await copyToClipboard(url);
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (!createdBet) return;
    const url = `${window.location.origin}/join/${createdBet.joinCode}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Called It!",
          text: question,
          url,
        });
        return;
      }
    } catch {
      // User cancelled or share failed
    }
    handleCopyLink();
  }

  // --- Post-creation share screen ---
  if (createdBet) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3 pt-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mint shadow-lg shadow-mint/30 text-3xl">
            &#x1F389;
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bet Created!
          </h1>
          <p className="text-muted-foreground">
            Share with friends so they can predict
          </p>
        </div>

        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet via-gold to-mint" />
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your question
              </p>
              <p className="mt-1 text-lg font-bold">{question}</p>
            </div>
            {stakes.trim() && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What&apos;s on the line
                </p>
                <p className="mt-1 text-sm font-semibold text-coral">&#x1F525; {stakes}</p>
              </div>
            )}
            <div className="rounded-xl bg-violet-light p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet">
                Join code
              </p>
              <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em] text-violet">
                {createdBet.joinCode}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleShare} size="lg">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button onClick={handleCopyLink} variant="outline" size="lg">
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full text-primary"
          onClick={() => router.push(`/bet/${createdBet.id}`)}
        >
          View your bet &rarr;
        </Button>
      </div>
    );
  }

  // --- Create bet form ---
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a Bet</h1>
        <p className="text-sm text-muted-foreground">
          What&apos;s your bold prediction?
        </p>
      </div>

      {/* Step 1: Question */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-violet-light/50 px-5 py-3">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${stepColors[0].num} text-xs font-bold`}>
            1
          </div>
          <span className="text-sm font-semibold">What are you predicting?</span>
        </div>
        <CardContent className="space-y-2 p-5">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g., "How will mom react to the news?"'
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            maxLength={MAX_QUESTION_LENGTH}
          />
          <p className="text-right text-xs text-muted-foreground">
            {question.length}/{MAX_QUESTION_LENGTH}
          </p>
        </CardContent>
      </Card>

      {/* Step 2: Options */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-gold-light/50 px-5 py-3">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${stepColors[1].num} text-xs font-bold`}>
            2
          </div>
          <span className="text-sm font-semibold">What could happen?</span>
        </div>
        <CardContent className="space-y-3 p-5">
          {options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-xl border-2 border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                maxLength={MAX_OPTION_LENGTH}
              />
              {options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-coral-light hover:text-coral transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <div className="rounded-xl border-2 border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            &#x1F0CF; Something else entirely (always included)
          </div>
          {options.length < MAX_OPTIONS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addOption}
            >
              <Plus className="h-4 w-4" />
              Add option
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Stakes */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-coral-light/50 px-5 py-3">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${stepColors[2].num} text-xs font-bold`}>
            3
          </div>
          <span className="text-sm font-semibold">What&apos;s on the line?</span>
        </div>
        <CardContent className="space-y-2 p-5">
          <input
            type="text"
            value={stakes}
            onChange={(e) => setStakes(e.target.value)}
            placeholder='e.g., "Loser buys dinner" or "Bragging rights"'
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Optional — what does the winner get?
          </p>
        </CardContent>
      </Card>

      {/* Step 4: Deadline */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-mint-light/50 px-5 py-3">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${stepColors[3].num} text-xs font-bold`}>
            4
          </div>
          <span className="text-sm font-semibold">When does betting close?</span>
        </div>
        <CardContent className="p-5">
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors"
          />
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-coral-light px-4 py-3 text-sm font-medium text-coral">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Create &amp; Share
      </Button>
    </form>
  );
}
