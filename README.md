# MyDentistSaid — Dental Diagnosis Decoder

AI-powered tool that explains any dental diagnosis in plain English with a photorealistic illustration.

---

## Deploy in 3 steps

### 1. Add your API keys to Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Where to get it |
|----------|----------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com/keys](https://console.anthropic.com/keys) |
| `OPENAI_API_KEY`    | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

That's all you need to go live. The site works fully without any other setup.

### 2. Deploy to Vercel

```bash
npm install
npx vercel --prod
```

### 3. (Optional) Enable caching to reduce costs

After your first deploy, connect Vercel KV and Blob to your project:

1. Vercel dashboard → **Storage** → Create a **KV** database → Connect to project
2. Vercel dashboard → **Storage** → Create a **Blob** store → Connect to project
3. Redeploy — the env vars are auto-added by Vercel

Then seed the cache with the 50 most common terms (~7 min, run once):

```bash
SITE_URL=https://your-site.vercel.app npm run prewarm
```

---

## Cost breakdown

| | Without caching | With caching (after warm-up) |
|---|---|---|
| Per search (illustration) | $0.08 | $0.00 |
| Per search (explanation)  | $0.001 | $0.00 |
| 1,000 searches/day        | ~$80/day | ~$2/day (new terms only) |

---

## Monitor cache

```
https://your-site.vercel.app/api/cache-stats?secret=YOUR_ADMIN_SECRET
```

Add `ADMIN_SECRET` to your Vercel env vars to protect this endpoint.

---

## Project structure

```
├── components/DentalDecoder.jsx   ← React UI
├── pages/
│   ├── index.js                   ← Main page + SEO tags
│   ├── _app.js                    ← Global styles
│   ├── _document.js               ← Fonts + HTML head
│   └── api/
│       ├── explain.js             ← Claude explanation endpoint
│       ├── illustrate.js          ← DALL-E 3 illustration endpoint
│       └── cache-stats.js         ← Cache monitoring
└── scripts/prewarm.js             ← Cache seeding script
```
