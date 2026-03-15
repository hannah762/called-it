import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">Who knows their friends best?</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["Profit", "Accuracy", "Streak"].map((filter) => (
          <button
            key={filter}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors first:bg-primary first:text-primary-foreground hover:bg-muted"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No rankings yet.</p>
          <p className="text-sm text-muted-foreground">
            Complete some bets to see who&apos;s on top!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
