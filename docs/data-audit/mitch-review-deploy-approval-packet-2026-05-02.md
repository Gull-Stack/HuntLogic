# HuntLogic — Mitch Review Deploy Approval Packet

Date: 2026-05-03
Reviewer source: Mitch product review doc + follow-up algorithm feedback from 2026-05-03
Prepared for: Josh
Status: Updated for review

## Executive take
Mitch's review is strong product feedback and useful QA signal, but it does **not** support a clean deploy approval as-is.

Reason: it surfaced at least three likely trust-killing issues in core flows:
- onboarding may advance with an incomplete profile
- recommendations appears to hit a blocking failure state
- unit ranker submit/execute path is unclear or broken

My recommendation: **do not approve deploy until the P0 items below are verified fixed**.

New today: Mitch also exposed a second, deeper problem — the answer quality is not yet grounded enough for nuanced state-specific strategy questions. The Pennsylvania elk example shows the model is still too generic, too soft, and not consistently backed by structured state-specific knowledge.

---

## Decision summary

### Recommend blocking deploy on these P0 items
1. **Onboarding incomplete-profile bug**
   - Mitch reports the system pushed him through after step 3 of 9
   - That can poison downstream personalization in Playbook, Recommendations, and Unit Ranker

2. **Recommendations failure state**
   - Mitch hit a screen that blocked usage
   - If Recommendations is broken, a core promise of the app is broken

3. **Unit Ranker submit/CTA issue**
   - Mitch could not tell how to actually run it
   - If users cannot execute the tool, it is functionally broken even if backend logic works

4. **Answer quality / grounding gap for strategic hunt questions**
   - Mitch tested a Pennsylvania elk question and got a weak answer from HuntLogic compared with ChatGPT and Claude
   - The HuntLogic answer was too generic, overconfident in the wrong places, and did not show enough zone-level reasoning or source-grounded nuance

### Safe to treat as post-fix or post-deploy polish
- dashboard rename to **Important Dates & Deadlines**
- species taxonomy expansion / cleanup
- groups / outfitters untouched

### Important product-definition work, but not a deploy gate by itself
- Playbook should be a dynamic personalized strategy layer
- Explore should answer **what can I hunt, where?**
- Forecasts should answer **is this path worth pursuing?**
- Simulator should be state-aware by default, not generic
- chat/mentor UX may deserve to be the center of v1

### New strategic requirement from Mitch today
- Expand the research/reference layer by state
- Treat **official state resources as Tier 1**
- Add **trusted hunting sources as Tier 2** for nuance and field intelligence
  - examples explicitly requested: Rokslide, Hunt Talk, MonsterMuleys, and similar sources

---

## P0 deploy blockers

### 1) Onboarding advances with incomplete profile
**Observed signal**
- Mitch reports being pushed through after step 3/9
- Resulting profile was incomplete
- It was unclear that the system needed more information before creating a Playbook

**Why this blocks deploy**
- Every downstream personalized module depends on valid profile state
- Broken onboarding contaminates QA feedback because later failures may be side effects

**Required verification before approval**
- reproduce with Mitch's account or equivalent incomplete user state
- confirm which fields were missing and why the flow advanced
- verify incomplete users are prevented from finishing silently
- verify downstream modules show a clear finish-your-profile CTA instead of soft-failing

**Approval gate**
- Josh should not approve deploy until this flow is reproduced and verified fixed end-to-end

---

### 2) Recommendations failure state
**Observed signal**
- Mitch reports hitting a blocking screen when trying Recommendations

**Why this blocks deploy**
- This is a core value feature
- A broken Recommendations flow destroys trust fast because users interpret it as the app not understanding them

**Required verification before approval**
- capture exact UI state / screenshot
- capture browser console errors
- capture failing network request(s) and backend response
- verify either:
  - Recommendations loads successfully, or
  - the app shows a clear fallback state with actionable next steps

**Approval gate**
- No deploy approval until the failure is reproduced, traced, and either fixed or converted into a non-dead-end experience

---

### 3) Unit Ranker cannot be clearly submitted
**Observed signal**
- Mitch does not see a way to actually submit

**Why this blocks deploy**
- This is a hard stop in the user journey
- The feature may be implemented but still unusable

**Required verification before approval**
- verify the primary CTA is obvious on desktop and mobile
- verify incomplete input states are explained inline
- verify submit transitions correctly to loading, success, and error states
- verify results actually render after successful submit

**Approval gate**
- Do not approve deploy if a first-time user cannot figure out how to run Unit Ranker without hand-holding

---

### 4) Hunt answer quality is not yet state-specific enough
**Observed signal**
- Mitch asked HuntLogic: "I want to apply for Elk in PA. I'm prioritizing trophy quality and elk density over draw odds."
- HuntLogic returned a generic answer centered on long draw odds and broad county-level guidance
- Competing tools returned more actionable zone-level strategies, fallback strategy guidance, and clearer distinctions between density, access, pressure, and trophy potential

**What was weak in the HuntLogic answer**
- too generic and defensive
- too focused on the draw being hard instead of answering the actual ranking question
- did not present a ranked set of zones or a usable strategy
- made unsupported-sounding claims without enough grounding
- did not separate official facts from field-intel-style nuance
- drifted into steering the user toward other western states instead of first answering the Pennsylvania question well

**What better answers did well**
- explained how Pennsylvania elk zone selection actually works
- offered ranked or grouped zone choices
- separated density, trophy potential, access, and pressure as different decision factors
- gave application strategy, not just background info
- used follow-up questions only after first delivering value

**What we should learn from this**
- answer the exact question before broadening scope
- state-specific hunt strategy requires more than regulations; it needs structured local hunting context
- the model should distinguish between:
  - official facts
  - inferred strategy
  - field-informed but non-official nuance
- if confidence is limited, the answer should say so precisely instead of sounding complete

**Approval gate**
- Do not call the algorithm review-ready until we can answer representative state-strategy questions with grounded, specific, useful recommendations

---

## P1 fixes / polish

### 5) Rename dashboard card
Change label to:
- **Important Dates & Deadlines**

This is a fast clarity win. Not a release blocker.

### 6) Expand species taxonomy
Requested additions / cleanup:
- Upland Birds
- Waterfowl
- Small Game
- Predators
- Brown Bear
- Hogs
- Furbearer cleanup
- rename narrow pheasant bucket appropriately

This matters because onboarding taxonomy shapes recommendation quality.

---

## Data-expansion requirements from Mitch's 2026-05-03 feedback

### Tier 1 — official state resources (must be primary)
For each state/species, prioritize:
- state wildlife agency regulations
- official hunt zone / unit maps
- official draw statistics and application rules
- official harvest reports and herd / population summaries
- official season dates, application calendars, and fee tables
- official GIS / hunt planner tools when available

### Tier 2 — trusted hunting intelligence (supplementary)
Use to add nuance that official sources usually do not provide:
- Rokslide
- Hunt Talk / HuntTalk forum
- MonsterMuleys
- Huntin' Fool
- GoHunt editorials / strategy writeups
- trusted state-specific forums, guides, and outfitter intel

### Operating rule
- Tier 2 should **inform strategy**, not overwrite Tier 1 facts
- if Tier 2 conflicts with Tier 1, Tier 1 wins
- if Tier 2 adds reputational or anecdotal guidance, label it as such

### What needs to exist in the dataset
For each priority state/species combination, build a source-backed brief that includes:
- application mechanics
- unit / zone structure
- draw system type
- draw odds by residency and weapon where possible
- harvest success and density indicators
- trophy-quality signals where available
- access mix: public/private, DIY friendliness, terrain style, pressure
- sleeper / overlooked opportunities
- known strategic tradeoffs: density vs access, trophy vs odds, guided vs DIY
- key disclaimers where data is thin or mostly anecdotal

---

## Product-definition insights worth keeping
These are the most valuable parts of Mitch's review. They clarify what the modules are actually supposed to do.

### Playbook
Should be a living strategy based on:
- target species
- motivation / goal
- draw odds
- harvest success
- what the system learns over time

### Unit Ranker
Should output a stack-ranked answer to:
- where should I apply based on my goal?

Example Mitch gave:
- a freezer-focused elk hunter should be guided toward strong success rate + strong draw chance, even if that means cow elk instead of trophy hunts

### Explore
Should answer:
- what can I hunt in this state?
- what is draw vs OTC?
- what overlooked opportunities fit my interests?

### Forecasts
Should answer:
- is this application strategy even worth pursuing?

Point-creep example is strong and probably should become canonical product language.

### Simulator
Should be state-aware by default.
Do **not** ask users to choose a point type unless the state genuinely requires it.

---

## Suggested execution order before Josh review/approval
1. reproduce onboarding bug
2. reproduce Recommendations failure
3. verify Unit Ranker CTA / submit flow
4. write state-research standard for answer grounding
5. build first expanded state brief(s) using Tier 1 + Tier 2 model
6. patch species taxonomy if trivial and low-risk
7. apply dashboard label rename if trivial and low-risk
8. write short module briefs for Playbook / Explore / Forecasts / Simulator so future work stays aligned

---

## What Josh should review
Josh should review this packet with one question in mind:

**Are we approving a deploy of core user flows, or are we approving more design intent than working product?**

Right now, based on Mitch's review, the answer looks like:
- product direction: promising
- current flow quality: not yet deploy-safe without P0 verification
- answer quality / research depth: not yet strong enough for nuanced state-strategy trust

---

## Recommended approval language
### If P0 issues are still unresolved
> Do not approve deploy yet. Fix and verify onboarding completeness, Recommendations stability, Unit Ranker submission flow, and answer-grounding quality first.

### If P0 issues are verified fixed
> Approve deploy with follow-up tickets for taxonomy cleanup, naming polish, module-definition work, and continued state-by-state research expansion.

---

## Appendix — condensed ticket list

### P0
- Fix onboarding advancing with incomplete profile
- Investigate and fix Recommendations failure state
- Fix Unit Ranker submit / CTA flow
- Improve answer grounding for state-specific strategy questions

### P1
- Rename dashboard section to Important Dates & Deadlines
- Expand species taxonomy in onboarding and dependent filters

### Research / data layer
- Define Tier 1 vs Tier 2 source policy per Mitch's guidance
- Build state-by-state source briefs with official resources first
- Add trusted hunting-community nuance as clearly labeled supplementary intel
- Start with representative hard states/questions like Pennsylvania elk

### Product briefs
- Define Playbook as dynamic personalized hunt strategy
- Define Explore as what-can-I-hunt-where discovery surface
- Define Forecasts around worth-pursuing / point-creep logic
- Make Simulator state-aware by default
- Evaluate chat-first mentor UX for v1
