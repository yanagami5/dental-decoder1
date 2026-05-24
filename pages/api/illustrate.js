// pages/api/illustrate.js
//
// Generates a photorealistic dental illustration using DALL-E 3.
//
// With KV + Blob:  generates once, stores image permanently in Blob CDN,
//                  caches URL in KV forever — zero cost on repeat searches.
// With KV only:    caches DALL-E URL (valid ~1hr, then re-generates)
// Without either:  calls DALL-E 3 every time — fully functional, just no caching.
//
// Required:  OPENAI_API_KEY
// Optional:  KV_REST_API_URL + KV_REST_API_TOKEN  (url caching)
//            BLOB_READ_WRITE_TOKEN                 (permanent image storage)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { term } = req.body ?? {};
  if (!term?.trim()) return res.status(400).json({ error: "Missing term" });

  const clean = term.trim();
  const key   = cacheKey("illus", clean);

  // ── 1. Try cache ────────────────────────────────────────────────────────────
  if (kvEnabled()) {
    try {
      const { kv } = await import("@vercel/kv");
      const cached = await kv.get(key);
      if (cached) {
        console.log(`[illustrate] HIT ${key}`);
        await kv.incr("stats:illus:hits").catch(() => {});
        return res.status(200).json({ url: cached, cached: true });
      }
    } catch (e) {
      console.warn("[illustrate] KV read failed:", e.message);
    }
  }

  if (kvEnabled()) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.incr("stats:illus:misses").catch(() => {});
    } catch {}
  }

  // ── 2. Generate with DALL-E 3 ───────────────────────────────────────────────
  let dalleUrl;
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model:   "dall-e-3",
        prompt:  buildPrompt(clean),
        n:       1,
        size:    "1024x1024",
        quality: "hd",
        style:   "natural",
      }),
    });

    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    dalleUrl = d.data[0].url;
  } catch (err) {
    console.error("[illustrate] DALL-E failed:", err.message);
    return res.status(500).json({ error: "Image generation failed. Please try again." });
  }

  // ── 3. Upload to Vercel Blob for a permanent URL ─────────────────────────────
  // DALL-E URLs expire after ~1 hour. Blob gives a permanent CDN URL.
  let permanentUrl = dalleUrl; // fallback: use temp URL if Blob not configured

  if (blobEnabled()) {
    try {
      const { put }   = await import("@vercel/blob");
      const imgRes    = await fetch(dalleUrl);
      const imgBuffer = await imgRes.arrayBuffer();
      const slug      = key.replace("illus:", "");
      const blob      = await put(`dental-illustrations/${slug}.png`, imgBuffer, {
        access:      "public",
        contentType: "image/png",
      });
      permanentUrl = blob.url;
      console.log(`[illustrate] stored in Blob: ${blob.url}`);
    } catch (e) {
      console.warn("[illustrate] Blob upload failed, using temp URL:", e.message);
    }
  }

  // ── 4. Cache the URL in KV ──────────────────────────────────────────────────
  // No TTL when Blob is enabled (permanent URL).
  // 45-min TTL when only DALL-E temp URL available.
  if (kvEnabled()) {
    try {
      const { kv }    = await import("@vercel/kv");
      const kvOptions = blobEnabled() ? {} : { ex: 2700 }; // 45 min for temp URL
      await kv.set(key, permanentUrl, kvOptions);
      console.log(`[illustrate] cached in KV: ${key}`);
    } catch (e) {
      console.warn("[illustrate] KV write failed:", e.message);
    }
  }

  return res.status(200).json({ url: permanentUrl, cached: false });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function kvEnabled()   { return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN); }
function blobEnabled() { return !!process.env.BLOB_READ_WRITE_TOKEN; }

function cacheKey(prefix, term) {
  return (
    prefix + ":" +
    term.toLowerCase().trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 80)
  );
}

// ─── DALL-E 3 prompt ──────────────────────────────────────────────────────────
function buildPrompt(term) {
  const t = term.toLowerCase();

  const isInfection  = /abscess|infect|swelling|pus/.test(t);
  const isDecay      = /cav|decay|caries/.test(t);
  const isBoneLoss   = /bone loss|periapical|resorption/.test(t);
  const isGumDisease = /gingivit|periodont|gum disease|bleeding/.test(t);
  const isBruxism    = /bruxism|grind|clench|attrition|wear/.test(t);
  const isImpacted   = /impacted|wisdom|eruption/.test(t);
  const isRootCanal  = /root canal|pulpit|pulp necrosis/.test(t);
  const isStructural = /crack|fracture|broken|chip/.test(t);

  const base = [
    `Professional dental medical illustration of "${term}"`,
    "anatomical cross-section of a human tooth and surrounding oral tissue",
    `showing "${term}" clearly and prominently`,
    "Netter's Atlas of Human Anatomy illustration style",
    "clean white background",
    "highly detailed: enamel, dentin, pulp chamber, root canals, cementum, periodontal ligament, alveolar bone, gingival tissue",
    "accurate anatomical proportions",
    "clean callout lines with labels in sans-serif type",
    "color palette: cream-white enamel, pale yellow dentin, pink pulp, pink-red gum, tan-beige bone",
    "traditional medical illustration — NOT a photograph, NOT 3D render",
  ].join(", ");

  let detail = "";
  if (isInfection) {
    detail = "bright red inflammatory abscess at the root apex, dark red pus pocket, reddish infection spreading into bone, visibly inflamed tissue";
  } else if (isDecay) {
    detail = "dark brown-black carious lesion in crown, cavity through enamel into dentin, demineralized chalky border, stark contrast with healthy enamel";
  } else if (isBoneLoss) {
    detail = "significantly reduced bone height around roots, exposed root surfaces, dashed reference line showing healthy bone level, current bone clearly lower";
  } else if (isGumDisease) {
    detail = "inflamed deep-red swollen gingiva, deep periodontal pockets in cross-section, calculus deposits at gumline, bleeding at gingival margins";
  } else if (isBruxism) {
    detail = "heavily flattened worn crown surfaces, loss of cusp anatomy, exposed yellow dentin where enamel worn through, micro-cracks in enamel";
  } else if (isImpacted) {
    detail = "tooth trapped beneath gumline at an angle, overlying bone in cross-section, adjacent roots shown, bone partially cutaway to reveal impacted tooth";
  } else if (isRootCanal) {
    detail = "deep red inflamed or necrotic pulp in chamber and canals, periapical inflammation at root tips, detailed view of pulp anatomy";
  } else if (isStructural) {
    detail = "visible crack or fracture line propagating from crown toward root, intact surrounding structure for contrast, crack highlighted with subtle shadowing";
  } else {
    detail = `highlighted affected area for "${term}" with red or orange tones showing abnormality clearly`;
  }

  return `${base}. ${detail}. Ultra-detailed, crisp sharp edges, 4K quality medical diagram, tooth centered in composition.`;
}
