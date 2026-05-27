import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { access_token } = await req.json();
  if (!access_token || typeof access_token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true });
  res.cookies.set("mv_token", access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
