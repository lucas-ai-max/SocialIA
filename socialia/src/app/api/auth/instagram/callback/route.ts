import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Chamar o backend pra processar o callback
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const res = await fetch(`${backendUrl}/api/instagram/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (res.ok) {
      return NextResponse.redirect(`${origin}/settings?instagram=connected`);
    }

    return NextResponse.redirect(`${origin}/settings?error=auth_failed`);
  } catch {
    return NextResponse.redirect(`${origin}/settings?error=auth_failed`);
  }
}
