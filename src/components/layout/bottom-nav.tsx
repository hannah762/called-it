"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, PlusCircle, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home, color: "text-violet" },
  { href: "/leaderboard", label: "Ranks", icon: Trophy, color: "text-gold" },
  { href: "/bet/create", label: "Create", icon: PlusCircle, primary: true, color: "text-white" },
  { href: "/activity", label: "Activity", icon: Bell, color: "text-coral" },
  { href: "/profile", label: "Profile", icon: User, color: "text-sky" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-[4.5rem] max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet shadow-lg shadow-violet/30 transition-transform active:scale-90">
                  <item.icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-violet">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                  isActive && "bg-secondary"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? item.color : ""
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
