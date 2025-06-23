import { NextResponse } from "next/server";

const SLACK_USER_TOKEN = process.env.NEXT_PUBLIC_SLACK_ADMIN_TOKEN;

export async function GET(req: Request) {
  if (!SLACK_USER_TOKEN) {
    return NextResponse.json(
      { error: "Missing Slack user token" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel");
    if (!channel) {
      return NextResponse.json(
        { error: "Missing channel parameter" },
        { status: 400 }
      );
    }

    // Reduce limit to 20 to minimize rate limit risk
    const historyRes = await fetch(
      `https://slack.com/api/conversations.history?channel=${channel}&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${SLACK_USER_TOKEN}`,
        },
      }
    );

    const historyData = await historyRes.json();
    if (!historyData.ok) {
      console.error("Slack API error:", historyData.error);
      return NextResponse.json({ error: historyData.error }, { status: 500 });
    }

    if (!historyData.messages || !Array.isArray(historyData.messages)) {
      return NextResponse.json({ messages: [] });
    }

    // In-memory cache for user info during this request
    const userCache: Record<string, string> = {};

    const messages = await Promise.all(
      historyData.messages.map(
        async (msg: {
          user?: string;
          text: string;
          ts: string;
          bot_id?: string;
        }) => {
          if (!msg.user || msg.bot_id) {
            return {
              ...msg,
              username: msg.bot_id ? "Admin" : "System",
            };
          }

          // Use cache to avoid duplicate users.info calls
          if (userCache[msg.user]) {
            return {
              ...msg,
              username: userCache[msg.user],
            };
          }

          try {
            const userRes = await fetch(
              `https://slack.com/api/users.info?user=${msg.user}`,
              {
                headers: { Authorization: `Bearer ${SLACK_USER_TOKEN}` },
              }
            );
            const userData = await userRes.json();
            const username =
              userData.user?.real_name || userData.user?.name || "Unknown";
            if (userData.ok) {
              userCache[msg.user] = username;
            }
            return {
              ...msg,
              username,
            };
          } catch (userErr) {
            console.error("Failed to fetch user info for", msg.user, userErr);
            return { ...msg, username: "Unknown" };
          }
        }
      )
    );

    const sortedMessages = messages.sort(
      (a, b) => parseFloat(a.ts) - parseFloat(b.ts)
    );

    return NextResponse.json({ messages: sortedMessages });
  } catch (err) {
    console.error("Failed to fetch DM history:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
