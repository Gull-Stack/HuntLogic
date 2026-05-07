# Mitch April 30 Review — Follow-up Plan

Source: [April 30 Review doc](https://docs.google.com/document/d/1NDjMIN-0A__b3WSDIaoaSyu6R4u_r40VsfN-hA5ZAoY) (mitch@huntlogic.ai)
Updated: 2026-05-07

This document tracks the items from Mitch's April 30 review that are **not yet built**. The items that have shipped (or are shipping today) are tracked in their own commits — see `feat: address Mitch's April 30 review items #4, #7, #8, #9, #12` (`078710c`) and `feat(chat): add knowledge-pack grounding with Pennsylvania elk pack` (`165d2aa`).

---

## Status snapshot

| # | Item | Status |
|---|---|---|
| 1 | Persona research (Randy Newburg etc.) for Grizz mentor voice | **Not started** — see plan below |
| 2 | Chat as core dashboard/home feature | **Not started** — see plan below |
| 3 | HeroHire-style concierge inspiration | Exploratory — folded into #2 plan |
| 4 | Species categories | ✅ Shipped `078710c` |
| 5 | "Important Dates & Deadlines" rename | ✅ Shipped `bddca60` |
| 6 | Playbook continuously evolves | Direction — partially addressed by #7 |
| 7 | Profile-incomplete signaling on Playbook | ✅ Shipped `078710c` |
| 8 | Recommendations error fix | ✅ Shipped `078710c` |
| 9 | Unit Ranker (stack-rank by goal) | ✅ Shipped `078710c` (recs API restructured) |
| 10 | Explore — state-based hunt views, OTC/draw, suggestions | **Not started** — see plan below |
| 11 | Forecasts — "is it worth applying" decision support | **Not started** — see plan below |
| 12 | Simulator point-type lockdown by state | ✅ Shipped `078710c` |
| — | PA elk grounding (May 3 follow-up) | ✅ Shipped `165d2aa` |

---

## #1 — Persona research

**Mitch's ask:** "We should have Grizz research the following brands/personalities to understand the persona he's building. So if he goes and watches videos by Randy Newburg, that's a great example of the type of mentor we want the agent to embody."

**Type:** Meta / coaching / non-code.

**Plan:**
- Maintainer: Grizz himself, in his own workspace.
- Output: a single `~/HuntLogic/docs/grizz-persona-guide.md` capturing voice, tone, archetypes, sample call-and-response, what to avoid.
- Source material: Randy Newburg (Hunt Talk Radio, MeatEater appearances), Steven Rinella (MeatEater), Remi Warren (Solo Hunter, Apex Predator), Cam Hanes (Keep Hammering — endurance/archery), Mark Kenyon (Wired to Hunt — whitetail/eastern), Joe Rogan/Jocko interviews on MeatEater.
- After draft, fold into chat system prompt and into knowledge-pack writing style.
- **Size:** half a day for Grizz once he has the source list.
- **Ready-to-build gate:** none — Grizz can start any time.

## #2 — Chat as core dashboard feature

**Mitch's ask:** "Think chat needs to be a core feature on the home/dashboard page, especially in the beginning. We'll need to think through how we cover costs associated with chat, but for v1 I think it'll be an 'early gratification' factor. Plus, it'll be the best way for us to really get to know the person and gather the information we need for these modules to all then do their thing. Could we even do something like this? https://herohire.ai/ Where we make it a true conversation with the concierge/mentor?"

**Type:** UX restructure + new dashboard component.

**Current state:** `/chat` exists as a separate route. Dashboard home (`(dashboard)/dashboard/page.tsx`) does not embed chat.

**Plan:**
1. Build a `ConciergeChatCard` component (`src/components/dashboard/ConciergeChatCard.tsx`) — chat composer + last 3-5 messages, prominent on dashboard above the fold.
2. Reuse existing chat API + streaming (`/api/v1/chat`) — no new backend.
3. Always-visible suggested prompts seeded from profile completeness — feeds the "gather info we need" loop Mitch called out.
4. Cost guard: rate-limit per user/day on the dashboard surface (cheaper variant of the chat model — likely Sonnet 4.5 or Haiku — full Sonnet 4.6 only in dedicated `/chat`).
5. HeroHire-style "talk to a concierge" phrasing in copy: not "Ask a question" but "Tell me about your hunt this season."

**Files touched:**
- `src/components/dashboard/ConciergeChatCard.tsx` (new)
- `src/app/(dashboard)/dashboard/page.tsx` (add card)
- `src/app/api/v1/chat/route.ts` (rate-limit branch for dashboard surface — optional v2)

**Size:** ~4-6 hours including SOP review.
**Ready-to-build gate:** decide rate-limit policy and which model the dashboard card uses (cost call).

## #10 — Explore feature

**Mitch's ask:** "On Explore, the idea is for someone to get a sense of what they can hunt, where. So if I live in Texas, I want to know what all I can hunt in my state. Which animals are draw vs OTC, etc. Or maybe I want to see what all I can hunt in Alabama, or New York, etc. Then, this is also where we can explore unique finds, such as the special elk lottery in Kentucky. I also think this is where the system can start to suggest or flag opportunities that align with the user's interest. So for example if we learn that our hunter is a HUGE waterfowl junky, we would want to suggest hunting North and South Dakota during early waterfowl, such a unique but overlooked opportunity."

**Type:** Major new feature with three layers.

**Current state:** `/explore` route exists with `map/page.tsx` and `page.tsx`. Need to verify what's already there before scoping.

**Plan (3 layers):**

**Layer 1 — State picker view:** "I live in Texas, what can I hunt here?"
- Route: `/explore` (overhaul existing index page).
- Filters: state (default = user's home state), residency (resident/nonresident), category (big game, upland, waterfowl, small game, predators, hogs, furbearer).
- For each state × species: tag-access summary (OTC / draw / lottery), season window, residency rules, link to recommendations seeded with that combo.
- Data source: `species`, `states`, existing `huntUnits` + `seasons` tables. May need a new aggregate query/cache.

**Layer 2 — Cross-state discovery:** "What can I hunt in Alabama / NY?"
- Same UI, just unfiltered or different state selected.
- Dropdown to switch state freely.

**Layer 3 — Suggested unique opportunities:** "Special KY elk lottery; ND/SD early waterfowl"
- Curated `unique_opportunities` JSON or DB table — slug, headline, blurb, state, species, eligibility, deadline.
- Surfaced as a horizontal carousel on the explore landing.
- Personalization: filter/rank by user's species interests + travel tolerance.

**Files touched:**
- `src/app/(dashboard)/explore/page.tsx` (rewrite)
- `src/app/(dashboard)/explore/[stateCode]/page.tsx` (new — state-specific drilldown)
- `src/app/api/v1/explore/route.ts` (new — aggregates)
- `src/app/api/v1/explore/opportunities/route.ts` (new)
- `src/lib/db/schema/exploration.ts` (new — unique_opportunities table) **OR** seed JSON in `docs/knowledge/`
- `docs/knowledge/unique-opportunities/*.md` (initial curated list)

**Size:** 2-3 days including SOP review and content authoring.
**Ready-to-build gate:** Mitch confirms the 3-layer interpretation; product decides DB-table vs static-JSON for the curated opportunities.

## #11 — Forecasts feature

**Mitch's ask:** "On forecasts, the idea is for the tool to essentially forecast whether or not it's worth applying in a state based on your goals. So Wyoming is a great example here, because of what's called 'point creep'... 18 points to draw this year, then 18.9, then 19.8... mathematically guaranteed that you will die before you ever draw some hunts, so there's NO REASON to apply for them. That's forecaster, is it'll say, 'you know what... it's really not worth it, because at this rate you're not going to draw it till 2100, and you'll be dead. Instead, let's start applying here, or let's do guided in unit xyz in Wyoming, etc.'"

**Type:** Major analytical feature with statistical model.

**Current state:** `/forecasts` route exists. Need to verify what's already there.

**Plan:**

**Model:**
- Per-unit historical points-to-draw series (5-10 yrs).
- Linear regression on points-needed-vs-year → projected point requirement at year N.
- User's current points + max-build-rate (1/yr typically) → projected draw year.
- Cross with user's age + life-expectancy lookup → "will you draw before you die" boolean + confidence band.

**Output UI:**
- Table per unit user is watching: "Year you draw at current pace: 2073. Your projected age: 89. Probability of drawing in your lifetime: 12%."
- Three labeled bands: Worth applying (high probability) / Build patiently (medium) / Reconsider (low — show alternatives).
- "Reconsider" rows surface alternatives: 3-5 lower-tier units in the same state + outfitter/guided options.

**Files touched:**
- `src/services/intelligence/forecast-engine.ts` (already exists per typecheck — extend with point-creep model; currently has `sumYY` unused warning suggesting half-built regression code)
- `src/app/(dashboard)/forecasts/page.tsx` (rewrite)
- `src/app/api/v1/forecasts/point-creep/route.ts` (new)
- `src/lib/db/schema/draw-history.ts` (new or extend — needs N years of points-to-draw history per unit)
- `docs/data-audit/draw-history-sources.md` (new — where to ingest the historical data from)

**Size:** 3-5 days including data ingestion, model validation, SOP review.
**Ready-to-build gate:** confirm we can ingest 5-10 years of per-unit draw history for at least the priority states (WY, CO, MT, NM, NV). Without that data, the forecast is hand-wavy. **Big gate** — this might be the long pole.

---

## Recommended sequencing

1. **Now (Mitch backlog #1, #2):** Grizz writes persona guide (#1) + ConciergeChatCard for dashboard (#2). Both small, both unblocked. ~1 day combined.
2. **This week (#10):** Explore feature layer 1 + 2 (state-based hunt views). Skip layer 3 (curated opportunities) until persona/voice is set. ~2 days.
3. **Next week (#11):** Forecast feature, contingent on draw-history ingestion. ~3-5 days.
4. **Then (#3):** Layer 3 of Explore (unique-opportunities carousel) once we have a clear concierge voice from #1.

All four go through Grizz's two-stage SOP. Today's commits (`078710c`, `165d2aa`) explicitly bypassed the Grok review under direct authorization from Josh; **future builds should follow the SOP as written.**

---

## Forecast data depth — confirmed gap (2026-05-07 audit)

`draw_odds` table state at audit time:
- 2,129 total rows, all year=2025
- NV 2025: 1,734 rows, 198 units, 7 species (good — units linked)
- WY 2025: 395 rows, 5 species, **0 units linked** (parser bug — see below)
- **Units with 3+ years of history: 0**
- **Units with 5+ years of history: 0**

**Implication:** the forecast point-creep regression engine
(`src/services/intelligence/forecast-engine.ts`) cannot produce a meaningful
slope from a single data point. `forecastPointCreep()` and the trend
projection it drives will always degenerate to flat / "hold" for any unit.
This is the actual block on Mitch's #11 vision being useful.

### Backfill workstream

Multi-year seed scaffolding is at `scripts/seed-wgfd-multiyear.ts`.
Accepts a year + URL manifest. The bottleneck is **manual URL discovery**:
WGFD media IDs differ per year and cannot be predicted. Process per year:

1. Visit https://wgfd.wyo.gov/Hunting/Apply-to-Hunt → Drawing Statistics archive
2. For each big-game species (Elk, Mule Deer, Pronghorn, Bighorn, Moose), copy the NR Random PDF URL
3. Add to `HISTORICAL_MANIFEST` in the script with the correct year tag
4. Run `DATABASE_URL=... YEAR=<year> npx tsx scripts/seed-wgfd-multiyear.ts`
5. Verify with `scripts/check-draw-odds-coverage.ts`

Target: 5+ years (2020-2024) for each priority state (WY, CO, MT, NV, NM,
ID, UT, AZ). Roughly half a day of manual URL gathering + script runs per state.

### WY hunt_unit linkage bug

WY draw_odds rows show `hunt_unit_id=null` AND no `unit` field in
`raw_data`. The `DrawOddsTableParser` isn't extracting unit codes from
WGFD PDFs at all (NV works fine). Diagnosis script at
`scripts/diag-wy-units.ts`. Fix likely needs:
- Inspect a WGFD PDF text dump
- Adjust `column_mappings` in seed-wgfd-draw-odds.ts to match actual columns
- Or add a WGFD-specific parser variant in `src/services/ingestion/parsers/`

Until this is fixed, WY forecasts at unit level won't have any data even
once historical years are seeded — the rows will exist but be unreachable
by `forecastPointCreep(state, species, unit)` since `unit` is null.

---

## Mobile experience audit — pending credentials

Mitch in the meeting: "How much of hunt logic will be done on mobile? I would
anticipate quite a bit, probably 60 to 70%." Mobile is a P0 surface.

**Production hostname split** — `huntlogic.vercel.app` middleware-redirects
unauthenticated visitors to `huntlogic-site.vercel.app` (a separate marketing
project). Public visitors see the marketing site; everything we shipped today
lives in the authenticated app.

A complete mobile audit needs:
- **Public side** — auditable freely. Targets: marketing landing, login,
  signup, pricing, features. iPhone SE (375), iPhone 14 (390), Android (360).
- **Authenticated side** — needs test creds. Targets: dashboard, explore,
  forecasts, simulator, recommendations, profile/points, chat, calendar.

When test credentials are provided, run the audit at all three viewport sizes,
capture screenshots, identify issues (touch targets &lt;44px, overflow,
hidden CTAs, illegible text, broken layouts), and ship the fixes.

---

## New bugs surfaced from the 2026-05-07 meeting transcript

Items not yet addressed (separate from the April 30 review):

1. **Simulator point weighting** — Mitch tested NV elk:
   - 1 bonus point → predicted draw 2037 (should be ~2045-2050)
   - 15 bonus points → returned same answer (should change to ~2030-2035)
   - WY 5 preference points → "broke the simulation"
   The simulator isn't reading user-input points into the year projection
   formula. Likely the same kind of "form value not actually wired to API"
   pattern as the points-persistence P0 bug fixed in `99c83ff`.

2. **State Accounts credentials don't save** — Settings → State Accounts.
   Mitch entered Nevada credentials and saw them not persist. Same suspected
   pattern as the points UI before the fix — the form is local-state only.

3. **Playbook should project points-over-time** — "in 2-4 years you'll have
   X points → your odds will go up." New feature: take user's current points,
   add 1/year (or appropriate build rate per state), project forward, compute
   draw odds at each milestone.

4. **Calendar notify-me on a deadline** — SMS/email reminder when user opts
   into a specific deadline. ("Hunt Reminder" service is the inspiration.)

5. **Concierge auto-apply** — Mitch + Mike's biggest differentiator vision.
   Long-term work. Saved state-agency credentials → AI agent applies for tags
   on user's behalf based on saved hunting prefs.

All five are fresh feature/bug workstreams; each needs its own SOP cycle
once xAI funding restores Grok review.
