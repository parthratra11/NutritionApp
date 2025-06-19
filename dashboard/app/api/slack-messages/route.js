export async function GET() {
  const token = process.env.NEXT_PUBLIC_SLACK_BOT_TOKEN;
  const channelId = process.env.NEXT_PUBLIC_SLACK_CHANNEL_ID;

  if (!token || !channelId) {
    return Response.json(
      { error: "Missing token or channel ID" },
      { status: 400 }
    );
  }

  // Fetch messages from the channel
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

  // Add username to each message
  const messagesWithUsers = await Promise.all(
    data.messages.map(async (msg) => {
      if (!msg.user) return msg; // skip if no user

      try {
        const userRes = await fetch(
          `https://slack.com/api/users.info?user=${msg.user}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const userData = await userRes.json();
        const username =
          userData.ok && userData.user
            ? userData.user.real_name || userData.user.name
            : "Unknown";

        return { ...msg, username };
      } catch (e) {
        return { ...msg, username: "Unknown" };
      }
    })
  );

  return Response.json(messagesWithUsers);
}
