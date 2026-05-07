# Nevada Answer Pack

Date: 2026-04-15
Agency: Nevada Department of Wildlife (NDOW)
Primary authority: https://www.ndow.org

## Purpose
This file is an answer-ready reference for HuntLogic testing. Use NDOW official material first. If a user asks something not grounded in these sources, say so and point to the source class needed.

## Nevada system summary
- Nevada is a draw state with a bonus point system.
- Bonus point data is published by NDOW and should be used for point-level context and application strategy, not invented from generic hunting knowledge.
- Quotas are published through commission regulations and quota PDFs.
- Harvest and hunt statistics are published by NDOW in Excel and PDF form.

## Source priority
1. NDOW regulations / commission regulation PDFs
2. NDOW quotas PDFs
3. NDOW bonus point tables
4. NDOW hunt statistics Excel / PDFs
5. NDOW HuntNV / hunt information sheets
6. eRegulations only as a secondary mirror, not primary truth

## Core official sources
### Regulations and season structure
- Rules and regulations hub:
  https://www.ndow.org/get-outside/rules-regulations/
- 2025-2026 and 2026-2027 big game seasons:
  https://www.ndow.org/wp-content/uploads/2025/07/CR25-07-2025-2026-and-2026-2027-Big-Game-Seasons.pdf
- Amendment to season tables:
  https://www.ndow.org/wp-content/uploads/2025/08/CR-25-07-Amendment1-2025-2026-and-2026-2027-Big-Game-Seasons-NBWC-Approved-March-2025-FINAL.pdf
- Big game regulations book mirror:
  https://www.eregulations.com/nevada/hunting/big-game

### Tags, draw, quotas, deadlines
- 2025-2026 big game quotas:
  https://www.ndow.org/wp-content/uploads/2025/06/20B-CR25-13-Big-Game-Quotas-for-the-2025-2026-Seasons-Corrected.pdf
- 2025 application deadlines:
  https://www.ndow.org/wp-content/uploads/2025/01/20A-CR25-01-2025-Application-Deadlines.pdf
- Licensing / application portal:
  https://ndowlicensing.com
- Fees / apply-buy:
  https://www.ndow.org/apply-buy/apply-buy-hunting#fees
- Draw eligibility and important dates:
  https://www.ndow.org/apply-buy/apply-buy-hunting#accodrion-3

### Statistics, bonus points, planning
- Hunt statistics hub:
  https://www.ndow.org/blog/hunt-statistics/
- 2025 hunt data Excel:
  https://www.ndow.org/wp-content/uploads/2026/03/2025-Nevada-Big-Game-Hunt-Data.xlsx
- Bonus point data:
  https://www.ndow.org/blog/bonus-point-data/
- Bonus point program explainer:
  https://www.ndow.org/blog/bonus-point-program/
- 2025 big game status book draft:
  https://www.ndow.org/wp-content/uploads/2025/06/2025-Big-Game-Status-Book-Draft-4_30_25.pdf
- HuntNV interactive tool:
  https://experience.arcgis.com/experience/83e23630dfb64d84952b983924e5a2f7
- Hunt information sheets:
  https://www.ndow.org/blog/hunt-information-sheets/
- Hunt unit boundaries:
  https://www.ndow.org/blog/hunt-unit-boundaries/

## What HuntLogic should be able to answer for Nevada
- When are the application deadlines and when do draw results come out?
- How does the Nevada bonus point system work?
- Where do I find quota counts by species and unit?
- What were harvest and success patterns in recent years?
- What sources should I use to compare units before applying?
- Where are the official hunt unit maps and biologist sheets?

## Guardrails
- Do not present eRegulations as the primary legal authority when NDOW PDFs exist.
- Do not invent draw odds from general impressions. Use bonus point tables and published hunt stats.
- Do not mix proposal, amendment, and final quota documents without saying which document controls.
- If a user asks for an exact quota, unit, or deadline, cite the specific NDOW document class.

## Testing prompts Nevada should handle
- Explain Nevada's bonus point system in plain English.
- Show me where to verify 2025-2026 big game quotas.
- What official sources should I use before applying for a Nevada mule deer tag?
- Where can I see unit-level hunt stats and harvest information?
- If I want biologist notes on a Nevada hunt unit, where do I look?

## Not yet normalized
- Species-by-species extracted quota tables
- Unit-by-unit extracted hunt stats inside a local structured table
- Ready-made answer snippets with exact numeric examples
