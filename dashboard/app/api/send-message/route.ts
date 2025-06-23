import { NextResponse } from "next/server";

const SLACK_USER_TOKEN = process.env.NEXT_PUBLIC_SLACK_ADMIN_TOKEN;

export async function POST(req: Request) {
  if (!SLACK_USER_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Missing Slack user token" },
      { status: 500 }
    );
  }

  try {
    const { channel, text } = await req.json();

    // Strict validation for channel and text
    if (typeof channel !== "string" || !channel.startsWith("D")) {
      return NextResponse.json(
        { ok: false, error: "Invalid channel ID" },
        { status: 400 }
      );
    }
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { ok: false, error: "Text must be a non-empty string" },
        { status: 400 }
      );
    }

    console.log("Sending message to channel:", channel, "Message:", text);

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_USER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        text: text.trim(),
      }),
    });

    const data = await slackRes.json();
    console.log("Slack API response:", data);

    if (!data.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || "Failed to send message" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Message sent successfully",
      ts: data.ts,
      channel: data.channel,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
