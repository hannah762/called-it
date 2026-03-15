import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Target, Flame, TrendingUp } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold">
          ?
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to track your stats
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Balance", value: "500", icon: Coins },
          { label: "Accuracy", value: "—", icon: Target },
          { label: "Streak", value: "0", icon: Flame },
          { label: "Net Profit", value: "0", icon: TrendingUp },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center py-4">
              <stat.icon className="mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bet History */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Bet History</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No bets yet.</p>
          </CardContent>
        </Card>
      </section>

      {/* Settings */}
      <Button variant="outline" className="w-full">
        Settings
      </Button>
    </div>
  );
}
