"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Hash } from "lucide-react";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length >= 4) {
      router.push(`/join/${trimmed}`);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Join a Bet</h1>
        <p className="text-sm text-muted-foreground">
          Enter the code your friend shared with you
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-gold-light/50 px-5 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-gold-foreground text-xs font-bold">
            <Hash className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">Join code</span>
        </div>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="e.g., RWAB8X"
              maxLength={10}
              className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-center text-xl font-bold tracking-[0.2em] placeholder:text-muted-foreground/40 placeholder:tracking-[0.2em] focus:border-primary focus:outline-none transition-colors"
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={code.trim().length < 4}
            >
              <ArrowRight className="h-4 w-4" />
              Join Bet
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
