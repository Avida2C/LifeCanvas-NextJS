import { NextResponse } from "next/server";

const QUOTE_GARDEN_RANDOM =
  "https://quote-garden.onrender.com/api/v3/quotes/random?count=15";

/**
 * Proxies Quote Garden so the client does not hit CORS / rate limits from the browser.
 * Inspire calls this route; the server fetches upstream.
 */
export async function GET() {
  try {
    const response = await fetch(QUOTE_GARDEN_RANDOM, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "upstream", status: response.status },
        { status: 502 },
      );
    }
    const data: unknown = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
