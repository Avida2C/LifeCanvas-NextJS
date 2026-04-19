import type { Quote } from "@/types";

const API_NINJAS_KEY =
  process.env.NEXT_PUBLIC_API_NINJAS_KEY?.trim() ?? "";

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/** Drop duplicate quotes (e.g. same text from both APIs). */
const dedupeQuotesByText = (quotes: Quote[]): Quote[] => {
  const seen = new Set<string>();
  return quotes.filter((q) => {
    const key = q.quote.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const ZENQUOTES_RANDOM = "https://zenquotes.io/api/random";

/** ZenQuotes returns one quote per `/api/random` request; fetch several in parallel. */
const fetchZenQuotesRandom = async (count: number): Promise<Quote[]> => {
  const settled = await Promise.allSettled(
    Array.from({ length: count }, async () => {
      const response = await fetch(ZENQUOTES_RANDOM, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`ZenQuotes HTTP ${response.status}`);
      }
      const data: unknown = await response.json();
      if (!Array.isArray(data) || !data[0] || typeof data[0] !== "object") {
        return null;
      }
      const row = data[0] as Record<string, unknown>;
      const quote = String(row.q ?? "").trim();
      if (!quote) return null;
      const author = String(row.a ?? "").trim() || "Unknown";
      return { quote, author } satisfies Quote;
    }),
  );

  const out: Quote[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value) out.push(s.value);
  }
  return dedupeQuotesByText(out);
};

const FALLBACK_QUOTES: Quote[] = [
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    quote: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
  },
  {
    quote:
      "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
  {
    quote:
      "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
  },
  {
    quote: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
  },
];

const FALLBACK_AFFIRMATIONS: Quote[] = [
  {
    quote: "I am capable of achieving great things.",
    author: "Daily Affirmation",
  },
  {
    quote: "I choose to be happy and grateful today.",
    author: "Daily Affirmation",
  },
  {
    quote: "I am worthy of love and respect.",
    author: "Daily Affirmation",
  },
];

export const fetchQuotes = async (): Promise<Quote[]> => {
  const [gardenResult, zenQuotes] = await Promise.allSettled([
    (async () => {
      const response = await fetch(
        "https://quote-garden.onrender.com/api/v3/quotes/random?count=15",
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );
      if (!response.ok) {
        throw new Error(`Quote Garden HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!data?.data || !Array.isArray(data.data)) return [];
      return data.data.map((item: Record<string, string>) => ({
        quote: item.quoteText || item.quote || "",
        author: item.quoteAuthor || item.author || "Unknown",
      })) as Quote[];
    })(),
    fetchZenQuotesRandom(8),
  ]);

  const fromGarden =
    gardenResult.status === "fulfilled" ? gardenResult.value : [];
  const fromZen = zenQuotes.status === "fulfilled" ? zenQuotes.value : [];

  const merged = dedupeQuotesByText([...fromGarden, ...fromZen]).filter(
    (q) => q.quote.trim().length > 0,
  );

  if (merged.length > 0) {
    return shuffleArray(merged);
  }

  return shuffleArray(FALLBACK_QUOTES);
};

export const fetchAffirmations = async (): Promise<Quote[]> => {
  if (!API_NINJAS_KEY) {
    return shuffleArray(FALLBACK_AFFIRMATIONS);
  }

  try {
    const testResponse = await fetch(
      "https://api.api-ninjas.com/v1/quotes?category=inspirational",
      {
        headers: {
          "X-Api-Key": API_NINJAS_KEY,
          Accept: "application/json",
        },
      },
    );

    if (!testResponse.ok) {
      return shuffleArray(FALLBACK_AFFIRMATIONS);
    }

    const testData = await testResponse.json();

    if (!testData?.[0]) {
      return shuffleArray(FALLBACK_AFFIRMATIONS);
    }

    const affirmations: Quote[] = [
      { quote: testData[0].quote, author: testData[0].author },
    ];

    const ninjaHeaders = {
      "X-Api-Key": API_NINJAS_KEY,
      Accept: "application/json",
    } as const;

    const extraSettled = await Promise.allSettled(
      Array.from({ length: 4 }, async () => {
        const response = await fetch(
          "https://api.api-ninjas.com/v1/quotes?category=inspirational",
          { headers: ninjaHeaders },
        );
        if (!response.ok) return null;
        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data[0] || typeof data[0] !== "object")
          return null;
        const row = data[0] as Record<string, unknown>;
        const quote = String(row.quote ?? "").trim();
        const author = String(row.author ?? "").trim() || "Unknown";
        if (!quote) return null;
        return { quote, author } satisfies Quote;
      }),
    );

    for (const s of extraSettled) {
      if (s.status === "fulfilled" && s.value) affirmations.push(s.value);
    }

    return affirmations.length > 0
      ? affirmations
      : shuffleArray(FALLBACK_AFFIRMATIONS);
  } catch {
    return shuffleArray(FALLBACK_AFFIRMATIONS);
  }
};
