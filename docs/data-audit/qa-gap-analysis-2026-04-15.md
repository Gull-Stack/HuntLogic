# HuntLogic QA and Gap Analysis

Date: 2026-04-15
Scope:
- huntlogic/nevada-answer-pack.md
- huntlogic/idaho-answer-pack.md
- huntlogic/texas-answer-pack.md
- huntlogic/anticipated-qa-nv-id-tx.md
- huntlogic/source-map-nv-id-tx.md

## QA checks run
1. Link validation against all URLs in the HuntLogic state-pack files
2. Hard-coded content review for brittle numeric claims and stale maintenance notes
3. Consistency review across Nevada, Idaho, and Texas answer framing
4. Testing-prompt review to ensure questions match the documented source structure

## Findings
### Fixed now
- Replaced 4 broken Texas URLs with live TPWD pages:
  - seasons by county
  - seasons by animal
  - hunting licenses
  - hunting permits / certifications
- Replaced 2 additional broken Texas links in the source map:
  - public hunting
  - hunter education
- Removed brittle hard-coded numeric claims from the source map where the docs should point to controlling sources instead of baking in values.
- Removed stale TPWD maintenance-window note from the source map.
- Updated source-map verification date to 2026-04-15.

### Verified result
- URL validation across the state-pack and testing files now passes: 79 checked, 0 failed.

## Remaining gaps
These are not broken, but they are still missing for true production-grade answer quality:
- No local structured tables yet for unit-by-unit quotas, draw odds, or harvest stats
- No year-normalization layer to prevent cross-year leakage in future answers
- No exact-answer snippets with controlled citations for common high-value questions
- No automated regression runner that executes the anticipated Q&A set against HuntLogic responses

## Hard-coding assessment
Current state after fixes:
- The answer packs are mostly source-first and not dependent on baked numeric values.
- Year-specific URLs remain intentionally because they point to the governing season documents.
- Remaining hard-coded years are acceptable where they identify a specific official document version.

## Recommendation
Use the current packs for framework testing now, but do not call the data layer complete until we add:
1. normalized local tables for quotas / odds / harvest
2. year-aware citations
3. automated Q&A regression checks
