export default function HomePage() {
  return (
    <main className="bg-bg text-ink">
      {/* 1. Top stripe */}
      <div className="stripe">
        <span className="stripe-live-dot" aria-hidden="true" />
        <span>3 LIVE NOW</span>
        <span className="stripe-sep" aria-hidden="true" />
        <span>14 MATCHES TODAY</span>
        <span className="stripe-sep" aria-hidden="true" />
        <span>87 ACTIVE PLAYERS</span>
      </div>

      {/* 2 + 3. Hero: headline, subtitle, stat strip */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 md:pt-20 pb-16 md:pb-24">
        <h1 className="display-h1 max-w-5xl">
          eFootball tournaments,{" "}
          <span className="display-italic-accent">played for real.</span>
        </h1>

        <p className="mt-8 md:mt-10 max-w-2xl text-lg md:text-xl text-ink/70 leading-relaxed">
          Compete in structured cups and ladders with verified results, live
          brackets, and a community that takes the game seriously. Built for
          players who want their wins to count.
        </p>

        <div className="mt-12 md:mt-16 grid grid-cols-3 hairline-strong-t hairline-strong-b">
          <div className="py-6 pr-6 border-r border-ink/15">
            <div className="label">Players</div>
            <div className="mt-2 font-sans font-black text-4xl md:text-5xl tabular-nums">
              87
            </div>
          </div>
          <div className="py-6 px-6 border-r border-ink/15">
            <div className="label">Tournaments</div>
            <div className="mt-2 font-sans font-black text-4xl md:text-5xl tabular-nums">
              12
            </div>
          </div>
          <div className="py-6 pl-6">
            <div className="label">Matches</div>
            <div className="mt-2 font-sans font-black text-4xl md:text-5xl tabular-nums">
              312
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured cup */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 pb-16 md:pb-24">
        <h2 className="section-head">Featured cup.</h2>

        <div className="card-brutalist mt-10 p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="pill pill-open">OPEN</span>
            <span className="label">Featured · Season 4</span>
          </div>

          <h3 className="font-sans font-black text-[40px] md:text-[56px] leading-[0.95] tracking-tight">
            Summer Cup S4
          </h3>

          <p className="mt-6 max-w-2xl text-lg text-ink/70 leading-relaxed">
            Single-elimination World Cup format. 48-player cap, seeded by
            ladder rating. Live-streamed semifinals and final, with verified
            results pushed to the global standings.
          </p>

          <div className="mt-10 grid grid-cols-2 hairline-strong-t hairline-strong-b">
            <div className="py-5 pr-5 border-r border-b border-ink/15">
              <div className="label">Players</div>
              <div className="mt-1 font-sans font-black text-2xl md:text-3xl tabular-nums">
                38
                <span className="text-ink/40">/48</span>
              </div>
            </div>
            <div className="py-5 pl-5 border-b border-ink/15">
              <div className="label">Closes</div>
              <div className="mt-1 font-sans font-black text-2xl md:text-3xl tabular-nums">
                18h
              </div>
            </div>
            <div className="py-5 pr-5 border-r border-ink/15">
              <div className="label">Starts</div>
              <div className="mt-1 font-sans font-black text-2xl md:text-3xl">
                May 14
              </div>
            </div>
            <div className="py-5 pl-5">
              <div className="label">Format</div>
              <div className="mt-1 font-sans font-black text-2xl md:text-3xl">
                WC
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="bg-accent text-bg font-sans font-bold uppercase tracking-wider text-sm px-6 py-3 border border-accent hover:bg-ink hover:border-ink transition-colors"
            >
              Register now →
            </button>
            <button
              type="button"
              className="bg-transparent text-ink font-sans font-bold uppercase tracking-wider text-sm px-6 py-3 border border-ink hover:bg-ink hover:text-bg transition-colors"
            >
              Format details
            </button>
          </div>
        </div>
      </section>

      {/* 5. Active /03 */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 pb-24">
        <h2 className="section-head">
          Active
          <span className="font-mono text-ink/40 ml-2 text-base align-middle">
            /03
          </span>
        </h2>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 — Friday Knockout #15 (LIVE) */}
          <article className="card-brutalist-sm overflow-hidden flex flex-col">
            <div className="aspect-[16/9] bg-gradient-to-br from-live via-live/70 to-ink relative">
              <div className="absolute top-4 left-4">
                <span className="pill pill-live">● LIVE</span>
              </div>
              <div className="absolute bottom-4 left-4 label-strong text-bg/90">
                Round 2 · Quarterfinals
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="font-sans font-black text-2xl leading-tight tracking-tight">
                Friday Knockout #15
              </h3>
              <p className="mt-2 text-sm text-ink/70 leading-relaxed">
                Weekly single-elimination cup. 16 players, 90-minute window,
                winner-takes-all rating boost.
              </p>
              <div className="mt-5 pt-4 hairline-strong-t flex items-center justify-between label">
                <span>Round 2 of 4</span>
                <span className="tabular-nums">14/16 active</span>
              </div>
              <button
                type="button"
                className="mt-5 w-full bg-ink text-bg font-sans font-bold uppercase tracking-wider text-sm px-4 py-3 border border-ink hover:bg-accent hover:border-accent transition-colors"
              >
                View tournament →
              </button>
            </div>
          </article>

          {/* Card 2 — Spring Ladder S3 (LIVE) */}
          <article className="card-brutalist-sm overflow-hidden flex flex-col">
            <div className="aspect-[16/9] bg-gradient-to-br from-accent via-accent/70 to-ink relative">
              <div className="absolute top-4 left-4">
                <span className="pill pill-live">● LIVE</span>
              </div>
              <div className="absolute bottom-4 left-4 label-strong text-bg/90">
                Season 3 · Week 6
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="font-sans font-black text-2xl leading-tight tracking-tight">
                Spring Ladder S3
              </h3>
              <p className="mt-2 text-sm text-ink/70 leading-relaxed">
                Rolling Elo ladder. Challenge anyone within 200 rating points.
                Top 8 qualify for the playoff bracket.
              </p>
              <div className="mt-5 pt-4 hairline-strong-t flex items-center justify-between label">
                <span>Week 6 of 12</span>
                <span className="tabular-nums">42 players</span>
              </div>
              <button
                type="button"
                className="mt-5 w-full bg-ink text-bg font-sans font-bold uppercase tracking-wider text-sm px-4 py-3 border border-ink hover:bg-accent hover:border-accent transition-colors"
              >
                View tournament →
              </button>
            </div>
          </article>

          {/* Card 3 — Monsoon Cup 2026 (DRAFT) */}
          <article className="card-brutalist-sm overflow-hidden flex flex-col">
            <div className="aspect-[16/9] bg-gradient-to-br from-warn via-warn/60 to-surface-2 relative">
              <div className="absolute top-4 left-4">
                <span className="pill">DRAFT</span>
              </div>
              <div className="absolute bottom-4 left-4 label-strong text-ink/80">
                Drafting · Opens Jun 1
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="font-sans font-black text-2xl leading-tight tracking-tight">
                Monsoon Cup 2026
              </h3>
              <p className="mt-2 text-sm text-ink/70 leading-relaxed">
                Group stage into double-elimination knockouts. Captains drafting
                rosters now — registration opens after seeding.
              </p>
              <div className="mt-5 pt-4 hairline-strong-t flex items-center justify-between label">
                <span>Drafting</span>
                <span>Opens Jun 1</span>
              </div>
              <button
                type="button"
                className="mt-5 w-full bg-ink text-bg font-sans font-bold uppercase tracking-wider text-sm px-4 py-3 border border-ink hover:bg-accent hover:border-accent transition-colors"
              >
                View tournament →
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
