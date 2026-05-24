// pages/api/explain.js
//
// Returns a structured JSON explanation of any dental term.
// Caches in Vercel KV for 30 days when KV env vars are present.
// Works without KV — just calls Claude every time.
//
// Required:  ANTHROPIC_API_KEY
// Optional:  KV_REST_API_URL + KV_REST_API_TOKEN  (for caching)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { term } = req.body ?? {};
  if (!term?.trim()) return res.status(400).json({ error: "Missing term" });

  const clean = term.trim();
  const key   = cacheKey("exp", clean);

  // ── 1. Try cache ────────────────────────────────────────────────────────────
  if (kvEnabled()) {
    try {
      const { kv } = await import("@vercel/kv");
      const cached = await kv.get(key);
      if (cached) {
        console.log(`[explain] HIT ${key}`);
        await kv.incr("stats:exp:hits").catch(() => {});
        return res.status(200).json({ ...cached, cached: true });
      }
    } catch (e) {
      console.warn("[explain] KV read failed:", e.message);
    }
  }

  // ── 2. Call Claude ──────────────────────────────────────────────────────────
  if (kvEnabled()) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.incr("stats:exp:misses").catch(() => {});
    } catch {}
  }

  let parsed;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 900,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: "user", content: `Dental term or diagnosis: "${clean}"` }],
      }),
    });

    const d = await r.json();
    if (d.error) throw new Error(d.error.message);

    const text = d.content.find((b) => b.type === "text")?.text ?? "";
    parsed = JSON.parse(text.replace(/```json\n?|```/g, "").trim());
  } catch (err) {
    console.error("[explain] Claude failed:", err.message);
    return res.status(500).json({ error: "Explanation failed. Please try again." });
  }

  // ── 3. Cache result — 30-day TTL ────────────────────────────────────────────
  if (kvEnabled()) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set(key, parsed, { ex: 2_592_000 }); // 30 days
      console.log(`[explain] cached ${key}`);
    } catch (e) {
      console.warn("[explain] KV write failed:", e.message);
    }
  }

  return res.status(200).json({ ...parsed, cached: false });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function kvEnabled() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function cacheKey(prefix, term) {
  return (
    prefix + ":" +
    term.toLowerCase().trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 80)
  );
}

const SYSTEM_PROMPT = `You are a dental health educator explaining diagnoses to patients with zero medical background. Be honest, clear, and reassuring — never alarmist. Return ONLY a raw JSON object, no markdown fences, no extra text. Schema:
{
  "what_it_is":   "2-3 plain English sentences",
  "causes":       "2-3 sentences on what causes this",
  "if_untreated": "2-3 sentences on risks of not treating",
  "treatment":    "2-3 sentences on treatment options",
  "cost_low":     700,
  "cost_high":    1400,
  "cost_notes":   "brief note on what drives US cost variation",
  "category":     "Infection"
}
Rules: category must be one of: Infection, Decay, Gum Disease, Structural, Alignment, Nerve, Cosmetic, Other. cost_low and cost_high are plain integers.`;
