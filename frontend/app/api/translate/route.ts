import { NextRequest, NextResponse } from "next/server";

function containsBengali(text: string): boolean {
  return /[ঀ-৿]/.test(text);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text: string = (body as any).text ?? "";

  if (!text || !containsBengali(text)) {
    return NextResponse.json({ translated: text });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ translated: text });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate this Bengali medicine name or query to English. Reply with ONLY the English translation, no explanation: "${text}"`,
            }],
          }],
        }),
      }
    );

    if (!res.ok) return NextResponse.json({ translated: text });
    const data = await res.json();
    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? text;
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ translated: text });
  }
}
