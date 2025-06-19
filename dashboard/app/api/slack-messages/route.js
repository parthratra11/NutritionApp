// app/api/slack-messages/route.js

export async function GET() {
  const token = process.env.NEXT_PUBLIC_SLACK_BOT_TOKEN;
  const channelId = process.env.NEXT_PUBLIC_SLACK_CHANNEL_ID; // Add this to .env

  if (!token || !channelId) {
    return Response.json(
      { error: "Missing token or channel ID" },
      { status: 400 }
    );
  }

  const slackRes = await fetch(
    `https://slack.com/api/conversations.history?channel=${channelId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const contentType = slackRes.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const text = await slackRes.text();
    return Response.json(
      { error: "Invalid response", raw: text },
      { status: 500 }
    );
  }

  const data = await slackRes.json();
  if (!data.ok) {
    return Response.json({ error: data.error }, { status: 500 });
  }

  return Response.json(data.messages);
}
