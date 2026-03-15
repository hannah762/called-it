"use client";

import { useEffect, useState } from "react";

function getTimeRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { expired: true, text: "Closed", d: 0, h: 0, m: 0, s: 0 };

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  let text = "";
  if (d > 0) text = `${d}d ${h}h remaining`;
  else if (h > 0) text = `${h}h ${m}m remaining`;
  else if (m > 0) text = `${m}m ${s}s remaining`;
  else text = `${s}s remaining`;

  return { expired: false, text, d, h, m, s };
}

export function Countdown({
  deadline,
  onExpire,
}: {
  deadline: string;
  onExpire?: () => void;
}) {
  const [time, setTime] = useState(getTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeRemaining(deadline);
      setTime(t);
      if (t.expired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  if (time.expired) {
    return (
      <span className="text-sm font-medium text-amber-600">
        Betting closed
      </span>
    );
  }

  // Urgent styling when under 1 hour
  const urgent = time.d === 0 && time.h === 0;

  return (
    <span
      className={`text-sm font-medium ${
        urgent ? "text-red-500" : "text-muted-foreground"
      }`}
    >
      {time.text}
    </span>
  );
}
