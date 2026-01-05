import { NextResponse } from "next/server";
import { Pool } from "pg";

// Disable SSL certificate validation for DigitalOcean (development only)
// In production, you should use proper certificates
if (typeof process.env.NODE_TLS_REJECT_UNAUTHORIZED === "undefined") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Allow self-signed certificates for DigitalOcean
      },
      max: 1, // Limit connections for serverless
    });

    // Handle SSL errors at the pool level
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

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set");
      return NextResponse.json(
        {
          error:
            "Database configuration missing. Please set DATABASE_URL in .env.local",
        },
        { status: 500 }
      );
    }

    const client = await getPool().connect();

    try {
      const result = await client.query(SQL_QUERY);
      return NextResponse.json(result.rows, {
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
    console.error("Database query error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", {
      message: errorMessage,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPreview: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL.substring(0, 30)}...`
        : "not set",
    });
    return NextResponse.json(
      { error: "Failed to fetch conversations", details: errorMessage },
      { status: 500 }
    );
  }
}
