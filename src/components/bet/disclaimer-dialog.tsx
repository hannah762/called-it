"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, ArrowRight } from "lucide-react";

export function CreateBetCard() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button onClick={() => setOpen(true)} className="group w-full text-left">
        <Card className="border-0 bg-violet overflow-hidden transition-all hover:shadow-lg hover:shadow-violet/20 active:scale-[0.98]">
          <CardContent className="flex flex-col items-center gap-2 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">
              Create a Bet
            </span>
          </CardContent>
        </Card>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <div className="mx-auto mb-2 text-4xl">&#x1F3B2;</div>
            <DialogTitle className="text-center">Before you bet...</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-violet-light/50 p-3">
              <p className="text-sm">
                <span className="font-semibold">&#x1F3AE; This is a game.</span>{" "}
                Called It! uses virtual coins for fun with friends — no real
                money is involved.
              </p>
            </div>
            <div className="rounded-xl bg-gold-light/50 p-3">
              <p className="text-sm">
                <span className="font-semibold">&#x1F91D; Play fair.</span>{" "}
                You&apos;re the host — your friends trust you to call the winner
                honestly.
              </p>
            </div>
            <div className="rounded-xl bg-mint-light/50 p-3">
              <p className="text-sm">
                <span className="font-semibold">&#x1F49A; Don&apos;t be an asshole.</span>{" "}
                Called It! is about having fun, not making fun.
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={() => {
              setOpen(false);
              router.push("/bet/create");
            }}
          >
            <ArrowRight className="h-4 w-4" />
            Got It, Let&apos;s Go!
          </Button>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            By continuing, you agree to keep things fun and friendly.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
