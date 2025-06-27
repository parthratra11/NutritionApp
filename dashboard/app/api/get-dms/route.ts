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
    const email = searchParams.get("email");

    const dmRes = await fetch(
      "https://slack.com/api/conversations.list?types=im",
      {
        headers: {
          Authorization: `Bearer ${SLACK_USER_TOKEN}`,
        },
      }
    );

    const dmData = await dmRes.json();
    if (!dmData.ok) {
      console.error("Slack API error:", dmData.error);
      return NextResponse.json({ error: dmData.error }, { status: 500 });
    }

    // Handle case where no DM channels exist
    if (!dmData.channels || !Array.isArray(dmData.channels)) {
      console.log("No DM channels found");
      return NextResponse.json({ channels: [] });
    }

    const users = await Promise.all(
      dmData.channels.map(async (dm: { id: string; user: string }) => {
        try {
          const userRes = await fetch(
            `https://slack.com/api/users.info?user=${dm.user}`,
            {
              headers: { Authorization: `Bearer ${SLACK_USER_TOKEN}` },
            }
          );
          const userData = await userRes.json();
          if (!userData.ok) throw new Error(userData.error);
          const username =
            userData.user?.real_name || userData.user?.name || "Unknown";
          const userEmail = userData.user?.profile?.email || "N/A";
          return {
            id: dm.id,
            user: dm.user,
            username,
            email: userEmail,
          };
        } catch (userErr) {
          console.error("Failed to fetch user info for", dm.user, userErr);
          return {
            id: dm.id,
            user: dm.user,
            username: "Unknown",
            email: "N/A",
          };
        }
      })
    );

    // If email is provided, find and return the specific user's DM channel
    if (email) {
      const targetUser = users.find(
        (user) => user.email.toLowerCase() === email.toLowerCase()
      );

      return NextResponse.json({
        channels: users,
        targetUser: targetUser || null,
      });
    }

    // Return in the format expected by frontend
    return NextResponse.json({ channels: users });
  } catch (err) {
    console.error("Failed to fetch DMs:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
