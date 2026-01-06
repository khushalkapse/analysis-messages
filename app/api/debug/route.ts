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

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const senderId = searchParams.get("sender_id");
    const inputQuery = searchParams.get("input_query");

    if (!senderId || !inputQuery) {
      return NextResponse.json(
        { error: "Missing required parameters: sender_id and input_query" },
        { status: 400 }
      );
    }

    const client = await getPool().connect();

    try {
      // Step 1: Get trace_id from instagram_webhook_analytics
      const traceResult = await client.query(
        `SELECT trace_id FROM instagram_webhook_analytics WHERE sender_id = $1 AND input_query = $2 LIMIT 1`,
        [senderId, inputQuery]
      );

      if (traceResult.rows.length === 0) {
        return NextResponse.json(
          { error: "No trace_id found for the given sender_id and input_query" },
          { status: 404 }
        );
      }

      const traceId = traceResult.rows[0].trace_id;

      // Step 2: Get id, total_request_time_ms, search_input from llm_analytics
      const analyticsResult = await client.query(
        `SELECT * FROM llm_analytics WHERE trace_id = $1 LIMIT 1`,
        [traceId]
      );

      if (analyticsResult.rows.length === 0) {
        return NextResponse.json(
          { error: "No analytics data found for the given trace_id" },
          { status: 404 }
        );
      }

      const analyticsId = analyticsResult.rows[0].id;

      // Step 3: Get all columns from llm_calls
      const callsResult = await client.query(
        `SELECT * FROM llm_calls WHERE analytics_id = $1`,
        [analyticsId]
      );

      return NextResponse.json(
        {
          input: analyticsResult.rows[0],
          output: callsResult.rows,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database query error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch debug data", details: errorMessage },
      { status: 500 }
    );
  }
}

