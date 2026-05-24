// scripts/prewarm.js
// Seeds the cache with the 50 most-searched dental terms after your first deploy.
// Run once: SITE_URL=https://your-site.vercel.app npm run prewarm
//
// Uses an 8-second delay between requests to stay under OpenAI rate limits.
// Takes ~7 minutes total. Run it, grab a coffee.

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const DELAY_MS = 8000;

const TOP_50_TERMS = [
  "cavity",                      "root canal",                "gingivitis",
  "periodontitis",                "impacted wisdom tooth",     "periapical abscess",
  "dental abscess",               "bruxism",                   "stage 2 bone loss",
  "stage 3 bone loss",            "crown lengthening",         "receding gums",
  "gum disease",                  "tooth sensitivity",         "enamel erosion",
  "dental crown needed",          "cracked tooth syndrome",    "tooth fracture",
  "pulpitis",                     "irreversible pulpitis",     "reversible pulpitis",
  "dental implant needed",        "bone grafting needed",      "sinus lift",
  "apicoectomy",                  "tooth resorption",          "external resorption",
  "internal resorption",          "peri-implantitis",          "dry socket",
  "oral thrush",                  "TMJ disorder",              "teeth grinding",
  "open bite",                    "crossbite",                 "overbite",
  "underbite",                    "diastema",                  "dental fluorosis",
  "leukoplakia",                  "geographic tongue",         "aphthous ulcer",
  "subgingival calculus",         "furcation involvement",     "vertical bone loss",
  "horizontal bone loss",         "crown decay",               "root decay",
  "gum recession",                "abscess tooth",
];

async function warmTerm(term) {
  try {
    const [expRes, illusRes] = await Promise.allSettled([
      fetch(`${SITE_URL}/api/explain`,    { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ term }) }),
      fetch(`${SITE_URL}/api/illustrate`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ term }) }),
    ]);

    const expStatus   = expRes.status   === "fulfilled" ? ((await expRes.value.json()).cached   ? "cached" : "generated") : "failed";
    const illusStatus = illusRes.status === "fulfilled" ? ((await illusRes.value.json()).cached ? "cached" : "generated") : "failed";

    console.log(`  ✓ "${term}"  exp:${expStatus}  illus:${illusStatus}`);
  } catch (err) {
    console.log(`  ✗ "${term}"  error: ${err.message}`);
  }
}

async function main() {
  console.log(`\nPre-warming cache against ${SITE_URL}`);
  console.log(`${TOP_50_TERMS.length} terms · ${DELAY_MS / 1000}s delay · ~${Math.round((TOP_50_TERMS.length * DELAY_MS) / 60000)} min total\n`);
  console.log("─".repeat(60));

  for (let i = 0; i < TOP_50_TERMS.length; i++) {
    process.stdout.write(`[${String(i + 1).padStart(2)}/${TOP_50_TERMS.length}] `);
    await warmTerm(TOP_50_TERMS[i]);
    if (i < TOP_50_TERMS.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("\n" + "─".repeat(60));
  console.log("Done. Check cache stats:");
  console.log(`${SITE_URL}/api/cache-stats?secret=YOUR_ADMIN_SECRET\n`);
}

main();
