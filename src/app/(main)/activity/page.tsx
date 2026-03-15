import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">Your notifications and updates.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground">
            Bet invites and results will show up here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
