// pages/api/cache-stats.js
// Visit: /api/cache-stats?secret=YOUR_ADMIN_SECRET
// Shows cached term count, hit rates, and estimated savings.

export default async function handler(req, res) {
  const secret = process.env.ADMIN_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ error: "Unauthorized — pass ?secret=YOUR_ADMIN_SECRET" });
  }

  if (!process.env.KV_REST_API_URL) {
    return res.status(200).json({ message: "KV not configured — caching is disabled", cached_terms: 0 });
  }

  try {
    const { kv } = await import("@vercel/kv");

    const [illusKeys, expKeys, iHits, iMisses, eHits, eMisses] = await Promise.all([
      kv.keys("illus:*"),
      kv.keys("exp:*"),
      kv.get("stats:illus:hits"),
      kv.get("stats:illus:misses"),
      kv.get("stats:exp:hits"),
      kv.get("stats:exp:misses"),
    ]);

    const ih = Number(iHits ?? 0), im = Number(iMisses ?? 0);
    const eh = Number(eHits ?? 0), em = Number(eMisses ?? 0);
    const iTotal = ih + im, eTotal = eh + em;

    return res.status(200).json({
      illustrations: {
        terms_cached:   illusKeys.length,
        cache_hits:     ih,
        cache_misses:   im,
        hit_rate:       iTotal > 0 ? `${Math.round((ih / iTotal) * 100)}%` : "n/a",
      },
      explanations: {
        terms_cached:   expKeys.length,
        cache_hits:     eh,
        cache_misses:   em,
        hit_rate:       eTotal > 0 ? `${Math.round((eh / eTotal) * 100)}%` : "n/a",
      },
      estimated_savings: {
        on_illustrations:   `$${(ih * 0.08).toFixed(2)}`,
        on_explanations:    `$${(eh * 0.001).toFixed(2)}`,
        total:              `$${((ih * 0.08) + (eh * 0.001)).toFixed(2)}`,
      },
      sample_cached_terms: illusKeys.slice(0, 20).map((k) => k.replace("illus:", "").replace(/-/g, " ")),
      blob_enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
