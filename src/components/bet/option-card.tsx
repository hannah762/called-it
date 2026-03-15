"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

type OptionCardProps = {
  label: string;
  isWildCard: boolean;
  isSelected: boolean;
  isWinner?: boolean;
  voteCount: number;
  totalVotes: number;
  showVotes: boolean;
  disabled: boolean;
  colorIndex?: number;
  onClick?: () => void;
};

const optionColors = [
  { ring: "ring-violet", bg: "bg-violet", light: "bg-violet-light", text: "text-violet", indicator: "border-violet bg-violet" },
  { ring: "ring-gold", bg: "bg-gold", light: "bg-gold-light", text: "text-gold", indicator: "border-gold bg-gold" },
  { ring: "ring-mint", bg: "bg-mint", light: "bg-mint-light", text: "text-mint", indicator: "border-mint bg-mint" },
  { ring: "ring-coral", bg: "bg-coral", light: "bg-coral-light", text: "text-coral", indicator: "border-coral bg-coral" },
  { ring: "ring-sky", bg: "bg-sky", light: "bg-sky-light", text: "text-sky", indicator: "border-sky bg-sky" },
];

export function OptionCard({
  label,
  isWildCard,
  isSelected,
  isWinner,
  voteCount,
  totalVotes,
  showVotes,
  disabled,
  colorIndex = 0,
  onClick,
}: OptionCardProps) {
  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  const color = optionColors[colorIndex % optionColors.length];

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        !disabled && "cursor-pointer hover:shadow-md active:scale-[0.99]",
        isSelected && `${color.ring} ring-2 border-transparent`,
        isWinner && "ring-2 ring-mint border-transparent bg-mint-light/30",
        disabled && !isWinner && "opacity-70"
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* Vote bar background */}
      {showVotes && totalVotes > 0 && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-500 ease-out",
            isWinner ? "bg-mint-light/60" : `${color.light}/60`
          )}
          style={{ width: `${pct}%` }}
        />
      )}

      <CardContent className="relative flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* Selection indicator */}
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
              isSelected
                ? `${color.indicator} text-white`
                : "border-muted-foreground/20 bg-background",
              isWinner && "border-mint bg-mint text-white"
            )}
          >
            {(isSelected || isWinner) && <Check className="h-4 w-4" strokeWidth={3} />}
          </div>

          <div className="flex items-center gap-2">
            {isWildCard && <span className="text-lg">&#x1F0CF;</span>}
            <span
              className={cn(
                "font-semibold",
                isWinner && "text-mint",
                isSelected && !isWinner && color.text
              )}
            >
              {label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-right">
          {showVotes && (
            <>
              {voteCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {voteCount} {voteCount === 1 ? "vote" : "votes"}
                </span>
              )}
              {totalVotes > 0 && (
                <span
                  className={cn(
                    "rounded-lg px-2 py-1 text-xs font-bold tabular-nums",
                    isSelected || isWinner
                      ? isWinner
                        ? "bg-mint text-white"
                        : `${color.bg} text-white`
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {pct}%
                </span>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
