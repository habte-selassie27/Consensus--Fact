import { NextResponse } from "next/server";
import { getCheck, getRecentChecks } from "@/lib/genlayer";

export const dynamic = "force-dynamic";

// CORS for external consumers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Missing check id" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Special case: list recent checks
  if (id === "recent") {
    try {
      const url = new URL(_request.url);
      const limit = Math.min(
        Math.max(Number(url.searchParams.get("limit") ?? 10), 1),
        50
      );
      const checks = await getRecentChecks(limit);
      return NextResponse.json({ checks }, { headers: CORS_HEADERS });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to fetch recent checks" },
        { status: 502, headers: CORS_HEADERS }
      );
    }
  }

  try {
    const record = await getCheck(id);
    return NextResponse.json(record, { headers: CORS_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check not found";
    const status = /not found/i.test(message) ? 404 : 502;
    return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
  }
}
