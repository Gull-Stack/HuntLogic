# Idaho Answer Pack

Date: 2026-04-15
Agency: Idaho Department of Fish and Game (IDFG)
Primary authority: https://idfg.idaho.gov

## Purpose
This file is an answer-ready reference for HuntLogic testing. Use IDFG official material first, especially the rules pages and the Hunt Planner / odds / stats tools.

## Idaho system summary
- Idaho uses a different structure than Nevada. Controlled hunts and OTC opportunities both matter.
- IDFG publishes official rules, controlled hunt information, drawing odds, harvest statistics, and hunt planner tools directly.
- Idaho answers should clearly separate OTC tags, controlled hunts, leftover tags, and nonresident quota constraints.

## Source priority
1. IDFG seasons and rules pages / PDFs
2. Controlled hunt info, application, and results pages
3. IDFG Hunt Planner, odds, and harvest statistics tools
4. Official fee and quota pages
5. Supporting program pages, like Super Hunt or capped elk zones

## Core official sources
### Rules and seasons
- Big game seasons and rules:
  https://idfg.idaho.gov/rules/big-game
- Seasons and rules master index:
  https://idfg.idaho.gov/rules
- Moose / sheep / goat rules:
  https://idfg.idaho.gov/rules/moose-sheep-goat/brochure
- 2026 big game seasons and rules PDF:
  https://idfg.idaho.gov/sites/default/files/seasons-rules-big-game-2026.pdf
- 2025-26 booklet announcement:
  https://idfg.idaho.gov/article/2025-26-idaho-big-game-season-and-rules-available-online

### Controlled hunts, tags, quotas
- Controlled hunt info:
  https://idfg.idaho.gov/licenses/tag/controlled
- Application info:
  https://idfg.idaho.gov/licenses/controlled/apply
- Drawing results:
  https://idfg.idaho.gov/ch
- Leftover / unclaimed controlled tags:
  https://idfg.idaho.gov/licenses/tag/unsold-controlled-hunts
- Returned sold-out tags:
  https://idfg.idaho.gov/licenses/tag/returns
- General season OTC tag info:
  https://idfg.idaho.gov/licenses/tag/otc
- Resident capped elk zones:
  https://idfg.idaho.gov/licenses/tag/resident/elk
- Nonresident general deer and elk tag quotas:
  https://idfg.idaho.gov/licenses/tag/quotas/nonresident
- Harvest quotas:
  https://idfg.idaho.gov/hunt/harvest-quotas
- 2026 nonresident tag supplement:
  https://idfg.idaho.gov/sites/default/files/seasons-rules-big-game-supplemental-proclamation-2026-2.pdf

### Odds, stats, planning
- Drawing odds:
  https://idfg.idaho.gov/ifwis/huntplanner/odds/
- Harvest statistics:
  https://idfg.idaho.gov/ifwis/huntplanner/stats/
- Hunt Planner:
  https://idfg.idaho.gov/ifwis/huntPlanner/
- State of Deer and Elk:
  https://idfg.idaho.gov/stateofdeerandelk
- Mandatory hunter report:
  https://idfg.idaho.gov/hunt/report

### Fees and programs
- Resident fees:
  https://idfg.idaho.gov/licenses/fees-resident
- Nonresident fees:
  https://idfg.idaho.gov/licenses/fees-nonresident
- Super Hunt:
  https://idfg.idaho.gov/superhunt
- Second tags:
  https://idfg.idaho.gov/licenses/tag/second

## What HuntLogic should be able to answer for Idaho
- Is this hunt OTC or controlled?
- Where do I find official drawing odds by hunt and year?
- Where do I see harvest stats by unit, weapon, and species?
- What happens after the main draw, are there leftover or returned tags?
- What are the nonresident quota constraints?
- Where should I look for rule-book authority versus live planning tools?

## Guardrails
- Do not treat Idaho like a pure draw state or a pure OTC state. It is both, depending on hunt type.
- Do not answer nonresident availability questions without checking the quota pages and supplemental rules.
- Do not invent odds. Use IDFG's odds tool.
- Do not answer harvest questions from memory when the stats tool exists.

## Testing prompts Idaho should handle
- Where do I find official Idaho controlled hunt odds?
- How do leftover or unclaimed controlled hunt tags work in Idaho?
- What official source shows harvest stats by hunt unit?
- How should I distinguish OTC from controlled tags when planning an Idaho hunt?
- Where do nonresidents verify deer and elk tag quota constraints?

## Not yet normalized
- Structured extraction of odds outputs by hunt number
- Structured extraction of harvest stats into local tables
- Ready-made answer snippets with exact examples by species and unit
