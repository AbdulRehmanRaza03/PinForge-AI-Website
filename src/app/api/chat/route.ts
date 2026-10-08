import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/chat-prompt";

/**
 * POST /api/chat
 *
 * Server-side proxy to the DeepSeek chat completions API. The API key lives
 * only in process.env.DEEPSEEK_API_KEY and is NEVER exposed to the client.
 */

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  // 1. Parse the request body.
  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const messages: ChatMessage[] = body?.messages ?? [];

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "A non-empty 'messages' array is required." },
      { status: 400 },
    );
  }

  // 2. Read the API key from the environment (server-side only).
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "DEEPSEEK_API_KEY is not configured on the server. Add it to .env.local.",
      },
      { status: 500 },
    );
  }

  // 3. Call DeepSeek.
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    // Handle non-2xx responses from DeepSeek.
    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: `DeepSeek API error (${response.status}).`,
          detail: text.slice(0, 500),
        },
        { status: response.status === 401 ? 401 : 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const reply =
      data.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response right now. Please try again.";

    // 4. Return the assistant reply.
    return NextResponse.json({ reply });
  } catch (err) {
    // Network / unexpected errors.
    return NextResponse.json(
      { error: "Failed to reach the AI service. Please try again shortly." },
      { status: 502 },
    );
  }
}
