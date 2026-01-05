import { NextResponse } from "next/server";
import { Pool } from "pg";

// Disable SSL certificate validation for DigitalOcean (development only)
if (typeof process.env.NODE_TLS_REJECT_UNAUTHORIZED === "undefined") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 1,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }
  return pool;
}

const SQL_QUERY = `
WITH msgs AS (
  SELECT
    sender_id,
    receiver_id,
    created_at AS ts,
    1 AS ord,
    jsonb_build_object(
      'ts', created_at,
      'role', 'user',
      'payload', (to_jsonb(i) - 'response')
    ) AS msg
  FROM instagram_webhook_analytics i

  UNION ALL

  SELECT
    sender_id,
    receiver_id,
    created_at AS ts,
    2 AS ord,
    jsonb_build_object(
      'ts', created_at,
      'role', 'assistant',
      'payload', response::jsonb
    ) AS msg
  FROM instagram_webhook_analytics
  WHERE response IS NOT NULL
)

SELECT
  sender_id,
  receiver_id,
  jsonb_agg(msg ORDER BY ts, ord) AS conversation
FROM msgs
GROUP BY sender_id, receiver_id
ORDER BY sender_id;
`;

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    // Get receiver_id filter from query parameters
    const { searchParams } = new URL(request.url);
    const receiverIdFilter = searchParams.get("receiver_id") || null;

    const client = await getPool().connect();

    try {
      const result = await client.query(SQL_QUERY);
      let conversations = result.rows;

      // Filter by receiver_id if provided
      if (receiverIdFilter) {
        conversations = conversations.filter(
          (conv: any) => conv.receiver_id === receiverIdFilter
        );
      }

      // Calculate analytics
      const analytics = {
        totalConversations: conversations.length,
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        responseTypes: {
          dm_text: 0,
          dm_carousel: 0,
          comment_reply: 0,
          button_template: 0,
        },
        receiverIds: {} as Record<string, number>,
        senderIds: {} as Record<string, number>,
        verificationCodes: 0,
        productCarousels: 0,
        topSenders: [] as Array<{ sender_id: string; count: number }>,
        topReceivers: [] as Array<{ receiver_id: string; count: number }>,
      };

      // Track message counts per sender for ranking
      const senderMessageCounts: Record<string, number> = {};

      conversations.forEach((conv: any) => {
        // Count receiver_ids
        analytics.receiverIds[conv.receiver_id] =
          (analytics.receiverIds[conv.receiver_id] || 0) + 1;

        // Count sender_ids (for conversation count)
        analytics.senderIds[conv.sender_id] =
          (analytics.senderIds[conv.sender_id] || 0) + 1;

        if (conv.conversation && Array.isArray(conv.conversation)) {
          // Count messages per sender
          const messageCount = conv.conversation.length;
          senderMessageCounts[conv.sender_id] =
            (senderMessageCounts[conv.sender_id] || 0) + messageCount;

          conv.conversation.forEach((msg: any) => {
            analytics.totalMessages++;

            // Count by role
            if (msg.role === "user") {
              analytics.userMessages++;

              // Check for verification codes
              if (
                msg.payload?.input_query
                  ?.toLowerCase()
                  .includes("verify me with velvee")
              ) {
                analytics.verificationCodes++;
              }
            } else if (msg.role === "assistant") {
              analytics.assistantMessages++;

              // Analyze response types
              if (Array.isArray(msg.payload)) {
                msg.payload.forEach((item: any) => {
                  if (item.channel === "dm_text") {
                    analytics.responseTypes.dm_text++;

                    // Check for button template
                    if (
                      item.payload?.message?.attachment?.payload
                        ?.template_type === "button"
                    ) {
                      analytics.responseTypes.button_template++;
                    }
                  } else if (item.channel === "dm_carousel") {
                    analytics.responseTypes.dm_carousel++;
                    analytics.productCarousels++;
                  } else if (item.channel === "comment_reply") {
                    analytics.responseTypes.comment_reply++;
                  }
                });
              }
            }
          });
        }
      });

      // Get top senders ranked by total messages in their conversations
      analytics.topSenders = Object.entries(senderMessageCounts)
        .map(([sender_id, count]) => ({ sender_id, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get top receivers
      analytics.topReceivers = Object.entries(analytics.receiverIds)
        .map(([receiver_id, count]) => ({
          receiver_id,
          count: count as number,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return NextResponse.json(analytics, {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Analytics query error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
