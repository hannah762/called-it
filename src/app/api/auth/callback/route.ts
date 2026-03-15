import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirect = searchParams.get("redirect") || "/";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component context
          }
        },
      },
    }
  );

  let authError = null;

  if (code) {
    // PKCE flow (OAuth or magic link with PKCE)
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (token_hash && type) {
    // Magic link / OTP token hash flow
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "magiclink",
    });
    authError = error;
  } else {
    // No code or token_hash — redirect to login
    return NextResponse.redirect(new URL("/login", origin));
  }

  if (!authError) {
    // Check if user has a profile, create one if not
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        // First sign-in — create profile with starting balance
        const displayName =
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          (user.phone ? `Player ${user.phone.slice(-4)}` : "Player");

        await supabase.from("users").insert({
          id: user.id,
          display_name: displayName,
          avatar_url: user.user_metadata?.avatar_url || null,
          coin_balance: 500,
        });
      }
    }

    return NextResponse.redirect(new URL(redirect, origin));
  }

  console.error("Auth callback error:", authError);
  return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
}
