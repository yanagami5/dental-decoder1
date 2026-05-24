import { useState, useCallback } from "react";

// ─── constants ────────────────────────────────────────────────────────────────
const G  = "#2a6e4e";   // brand green (same in light + dark)
const GL = "#e8f3ed";   // light green surface

const CAT_STYLES = {
  "Infection":   { bg: "var(--color-background-danger)",  fg: "var(--color-text-danger)"  },
  "Decay":       { bg: "var(--color-background-warning)", fg: "var(--color-text-warning)" },
  "Gum Disease": { bg: "var(--color-background-danger)",  fg: "var(--color-text-danger)"  },
  "Structural":  { bg: "var(--color-background-info)",    fg: "var(--color-text-info)"    },
  "Alignment":   { bg: "#f0e8fb",                         fg: "#6b3fa8"                   },
  "Nerve":       { bg: "#fde8f0",                         fg: "#a82859"                   },
  "Cosmetic":    { bg: "var(--color-background-success)", fg: "var(--color-text-success)" },
  "Other":       { bg: "var(--color-background-secondary)", fg: "var(--color-text-secondary)" },
};

const EXAMPLES = [
  "Periapical abscess", "Stage 2 bone loss", "Bruxism",
  "Impacted wisdom tooth", "Gingivitis", "Root canal needed",
];

const SECTIONS = [
  { key: "what_it_is",   emoji: "🦷", label: "What it is",        iconBg: "var(--color-background-info)"    },
  { key: "causes",       emoji: "⚡", label: "What caused it",     iconBg: "var(--color-background-warning)" },
  { key: "if_untreated", emoji: "⚠️",  label: "If left untreated",  iconBg: "var(--color-background-danger)"  },
  { key: "treatment",    emoji: "💊", label: "Treatment options",   iconBg: "var(--color-background-success)" },
];

// ─── skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 12, mb = 7, r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, marginBottom: mb,
      background: "linear-gradient(90deg, var(--color-background-secondary) 25%, var(--color-background-tertiary) 50%, var(--color-background-secondary) 75%)",
      backgroundSize: "200% 100%",
      animation: "dd-shimmer 1.5s infinite",
    }} />
  );
}

function usd(n) { return "$" + Number(n).toLocaleString(); }

// ─── component ────────────────────────────────────────────────────────────────
export default function DentalDecoder() {
  // phase tracks the overall page state
  // exp + illustUrl update independently as each API call resolves
  const [phase,      setPhase]     = useState("idle");    // idle | loading | result | error
  const [inputVal,   setInputVal]  = useState("");
  const [term,       setTerm]      = useState("");
  const [exp,        setExp]       = useState(null);
  const [illustUrl,  setIllustUrl] = useState("");
  const [illusLoading, setIllusLoading] = useState(false);

  const runSearch = useCallback(async (override) => {
    const t = (override || inputVal).trim();
    if (!t) return;

    setPhase("loading");
    setTerm(t);
    setExp(null);
    setIllustUrl("");
    setIllusLoading(true);

    // Fire both in parallel — show results as each arrives
    const expPromise = fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: t }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setExp(d); setPhase("result"); })
      .catch(() => setPhase("error"));

    const illusPromise = fetch("/api/illustrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: t }),
    })
      .then((r) => r.json())
      .then((d) => { if (!d.error) setIllustUrl(d.url); })
      .catch(() => {})
      .finally(() => setIllusLoading(false));

    await Promise.allSettled([expPromise, illusPromise]);
  }, [inputVal]);

  const reset = () => { setPhase("idle"); setInputVal(""); setExp(null); setIllustUrl(""); };

  const cat     = exp ? (CAT_STYLES[exp.category] ?? CAT_STYLES["Other"]) : CAT_STYLES["Other"];
  const costLow  = Number(exp?.cost_low  ?? 0);
  const costHigh = Number(exp?.cost_high ?? 0);
  const hasCost  = costLow > 0 || costHigh > 0;
  const MAX      = 5000;
  const barLeft  = Math.min((costLow  / MAX) * 100, 88);
  const barW     = Math.max(Math.min(((costHigh - costLow) / MAX) * 100, 96 - barLeft), 4);

  return (
    <>
      <style>{`
        @keyframes dd-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes dd-fadein  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes dd-spin    { to{transform:rotate(360deg)} }

        .dd-input {
          width: 100%; padding: 14px 54px 14px 18px;
          font-size: 15px; font-family: var(--font-sans);
          border: 1.5px solid var(--color-border-secondary);
          border-radius: 12px;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .dd-input:focus { border-color: ${G}; box-shadow: 0 0 0 3px ${GL}; }
        .dd-input::placeholder { color: var(--color-text-tertiary); }

        .dd-sbtn {
          position: absolute; right: 7px; top: 50%; transform: translateY(-50%);
          background: ${G}; color: #fff; border: none; border-radius: 9px;
          padding: 9px 15px; font-size: 13px; font-weight: 500; cursor: pointer;
          font-family: var(--font-sans); display: flex; align-items: center; gap: 5px;
          transition: background .15s;
        }
        .dd-sbtn:hover  { background: #1e5240; }
        .dd-sbtn:active { transform: translateY(-50%) scale(0.97); }

        .dd-pill {
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-secondary);
          border-radius: 20px; padding: 5px 13px;
          font-size: 12px; color: var(--color-text-secondary);
          cursor: pointer; font-family: var(--font-sans); transition: all .15s;
        }
        .dd-pill:hover { border-color: ${G}; color: ${G}; background: ${GL}; }

        .dd-card {
          background: var(--color-background-primary);
          border-radius: 14px;
          border: 0.5px solid var(--color-border-tertiary);
          padding: 17px 19px;
          animation: dd-fadein .25s ease both;
        }

        .dd-back {
          background: none; border: none; cursor: pointer;
          font-family: var(--font-sans); font-size: 13px;
          color: var(--color-text-secondary);
          display: flex; align-items: center; gap: 5px;
          padding: 0; margin-bottom: 22px; transition: color .15s;
        }
        .dd-back:hover { color: ${G}; }

        .dd-act {
          flex: 1; padding: 9px; font-size: 12px;
          font-family: var(--font-sans);
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-secondary);
          border-radius: 10px; color: var(--color-text-secondary);
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 5px; transition: background .15s;
        }
        .dd-act:hover { background: var(--color-background-secondary); }

        .dd-spinner {
          width: 18px; height: 18px;
          border: 2px solid var(--color-border-secondary);
          border-top-color: ${G};
          border-radius: 50%;
          animation: dd-spin .8s linear infinite;
          flex-shrink: 0;
        }

        .dd-illus-wrap { width: 100%; aspect-ratio: 1; padding: 10px; overflow: hidden; }
        .dd-illus-wrap img { width: 100%; height: 100%; object-fit: contain; border-radius: 6px; display: block; }

        .dd-result-grid {
          display: grid;
          grid-template-columns: 1fr 256px;
          gap: 18px;
          align-items: start;
        }

        @media (max-width: 620px) {
          .dd-result-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ fontFamily: "var(--font-sans)", background: "var(--color-background-tertiary)", color: "var(--color-text-primary)", minHeight: "100vh" }}>

        {/* ── NAV ──────────────────────────────────────────────────────────── */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, letterSpacing: "-0.3px" }}>
            my<span style={{ color: G }}>dentist</span>said
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Free dental decoder</div>
        </nav>

        {/* ── IDLE ─────────────────────────────────────────────────────────── */}
        {phase === "idle" && (
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "50px 22px 44px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", color: G, textTransform: "uppercase", marginBottom: 13 }}>
              Free dental decoder
            </div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 38, lineHeight: 1.1, marginBottom: 14, fontWeight: 400, letterSpacing: "-0.4px" }}>
              Your dentist said{" "}
              <em style={{ color: G, fontStyle: "italic" }}>what?</em>
            </h1>
            <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.65, marginBottom: 30 }}>
              Type any dental term or diagnosis — get a plain-English explanation and a photorealistic AI illustration showing exactly what's happening in your mouth.
            </p>

            <div style={{ position: "relative", maxWidth: 490, margin: "0 auto 14px" }}>
              <input
                className="dd-input"
                value={inputVal}
                autoFocus
                placeholder="e.g. periapical abscess, bone loss, bruxism…"
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
              />
              <button className="dd-sbtn" onClick={() => runSearch()}>
                <i className="ti ti-search" aria-hidden="true" />
                Explain
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginBottom: 34 }}>
              {EXAMPLES.map((ex) => (
                <button key={ex} className="dd-pill" onClick={() => { setInputVal(ex); runSearch(ex); }}>
                  {ex}
                </button>
              ))}
            </div>

            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 20, display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
              {["Plain English", "AI illustration", "US cost ranges"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-secondary)" }}>
                  <i className="ti ti-check" style={{ color: G, fontSize: 14 }} aria-hidden="true" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOADING / RESULT (shared layout) ─────────────────────────────── */}
        {(phase === "loading" || phase === "result") && (
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "26px 22px 54px" }}>
            <button className="dd-back" onClick={reset}>
              <i className="ti ti-arrow-left" aria-hidden="true" /> New search
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 24, paddingBottom: 20, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400 }}>{term}</h1>
              {exp?.category && (
                <span style={{ fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 20, background: cat.bg, color: cat.fg, letterSpacing: "0.4px", whiteSpace: "nowrap" }}>
                  {exp.category}
                </span>
              )}
            </div>

            <div className="dd-result-grid">

              {/* ── Left: explanation ─────────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {exp ? (
                  <>
                    {SECTIONS.map(({ key, emoji, label, iconBg }) =>
                      exp[key] ? (
                        <div key={key} className="dd-card">
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                              {emoji}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                          </div>
                          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.73, margin: 0 }}>{exp[key]}</p>
                        </div>
                      ) : null
                    )}

                    {hasCost && (
                      <div style={{ background: "var(--color-text-primary)", color: "var(--color-background-primary)", borderRadius: 14, padding: "19px 21px", animation: "dd-fadein .3s ease both" }}>
                        <div style={{ fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", opacity: 0.5, marginBottom: 12, fontWeight: 500 }}>
                          Estimated US cost range
                        </div>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400, marginBottom: 4 }}>
                          {usd(costLow)} – {usd(costHigh)}
                        </div>
                        {exp.cost_notes && (
                          <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 14, lineHeight: 1.5 }}>{exp.cost_notes}</div>
                        )}
                        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 5, height: 7, marginBottom: 5, position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: `${barLeft}%`, width: `${barW}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${G}, #4aaa7a)` }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.38, marginBottom: 18 }}>
                          <span>Low</span><span>Typical</span><span>High</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 9, padding: "13px 15px" }}>
                          <div style={{ fontSize: 11, opacity: 0.45, marginBottom: 4 }}>Worried about cost?</div>
                          <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5, marginBottom: 9 }}>
                            Dental savings plans can reduce treatment costs by 15–60%. No waiting periods or claim forms.
                          </div>
                          <a href="https://www.dentalplans.com/" target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: "#4aaa7a", fontWeight: 500, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                            Compare dental savings plans
                            <i className="ti ti-arrow-right" style={{ fontSize: 12 }} aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Skeleton while explanation loads */
                  <>
                    {[["40%", 88], ["36%", 78], ["43%", 82], ["38%", 72]].map(([tw, bw], i) => (
                      <div key={i} className="dd-card" style={{ animation: "none" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                          <Skel w={28} h={28} r={7} mb={0} />
                          <Skel w={tw} h={11} mb={0} />
                        </div>
                        <Skel w="100%" h={11} mb={5} />
                        <Skel w={`${bw}%`} h={11} mb={5} />
                        <Skel w="60%"      h={11} mb={0} />
                      </div>
                    ))}
                    <div style={{ background: "var(--color-text-primary)", borderRadius: 14, padding: "19px 21px" }}>
                      <Skel w="36%" h={9}  mb={12} />
                      <Skel w="55%" h={24} mb={9}  />
                      <Skel w="68%" h={10} mb={15} />
                      <Skel w="100%" h={7} r={4} mb={0} />
                    </div>
                  </>
                )}
              </div>

              {/* ── Right: illustration ───────────────────────────────────── */}
              <div style={{ position: "sticky", top: 76 }}>
                <div style={{ background: "var(--color-background-primary)", borderRadius: 16, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden", marginBottom: 11, animation: "dd-fadein .3s ease both" }}>

                  {/* Panel header */}
                  <div style={{ padding: "10px 14px 0", fontSize: 12, fontWeight: 500, color: G, display: "flex", alignItems: "center", gap: 8 }}>
                    AI illustration
                    {illusLoading && <div className="dd-spinner" />}
                  </div>

                  {/* Image or spinner placeholder */}
                  {illustUrl ? (
                    <div className="dd-illus-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={illustUrl} alt={`Dental illustration of ${term}`} />
                    </div>
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "1", background: "var(--color-background-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
                      <div className="dd-spinner" style={{ width: 24, height: 24 }} />
                      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Generating…</div>
                    </div>
                  )}

                  <div style={{ padding: "9px 14px", fontSize: 11, color: "var(--color-text-tertiary)", borderTop: "0.5px solid var(--color-border-tertiary)", lineHeight: 1.55 }}>
                    AI-generated illustration — for educational purposes only.
                  </div>
                </div>

                <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", padding: "11px 14px", marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.65, margin: 0 }}>
                    Educational only. Costs are US estimates. Always follow your dentist's specific advice for your situation.
                  </p>
                </div>

                {phase === "result" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="dd-act" onClick={() => { try { navigator.clipboard.writeText(window.location.href); } catch {} }}>
                      <i className="ti ti-copy" style={{ fontSize: 14 }} aria-hidden="true" /> Copy link
                    </button>
                    <button className="dd-act" onClick={reset}>
                      <i className="ti ti-search" style={{ fontSize: 14 }} aria-hidden="true" /> New search
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────────────────────── */}
        {phase === "error" && (
          <div style={{ maxWidth: 420, margin: "60px auto", padding: "0 22px", textAlign: "center" }}>
            <div style={{ fontSize: 34, marginBottom: 14 }}>⚠️</div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, marginBottom: 10 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.65, marginBottom: 26 }}>
              Couldn't process that term. Please check your connection and try again.
            </p>
            <button className="dd-pill" style={{ padding: "9px 22px", fontSize: 14 }} onClick={reset}>
              Try again
            </button>
          </div>
        )}

      </div>
    </>
  );
}
