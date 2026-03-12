// =============================================================================
// HuntLogic — Data Quality Scorer
// =============================================================================
// Scores the quality/confidence of ingested data based on completeness,
// consistency, freshness, and source authority.
// =============================================================================

import type { QualityReport, QualityFlag, ParsedResult } from "../types";

// ---------------------------------------------------------------------------
// Expected field sets by document type
// ---------------------------------------------------------------------------

const EXPECTED_FIELDS: Record<string, string[]> = {
  draw_odds: [
    "unitCode",
    "species",
    "residentType",
    "year",
    "totalApplicants",
    "totalTags",
    "drawRate",
  ],
  harvest_stats: [
    "unitCode",
    "species",
    "year",
    "totalHunters",
    "totalHarvest",
    "successRate",
  ],
  seasons: [
    "species",
    "year",
    "seasonName",
    "weaponType",
    "startDate",
    "endDate",
  ],
  regulation: ["content", "state_code", "year"],
};

// ---------------------------------------------------------------------------
// Valid ranges for numeric fields
// ---------------------------------------------------------------------------

const VALID_RANGES: Record<string, { min: number; max: number }> = {
  drawRate: { min: 0, max: 1 },
  successRate: { min: 0, max: 1 },
  totalApplicants: { min: 0, max: 500_000 },
  totalTags: { min: 0, max: 100_000 },
  totalHunters: { min: 0, max: 500_000 },
  totalHarvest: { min: 0, max: 500_000 },
  minPointsDrawn: { min: 0, max: 50 },
  maxPointsDrawn: { min: 0, max: 50 },
  avgPointsDrawn: { min: 0, max: 50 },
  avgDaysHunted: { min: 0, max: 365 },
  quota: { min: 0, max: 100_000 },
  year: { min: 1990, max: new Date().getFullYear() + 2 },
};

// ---------------------------------------------------------------------------
// Quality Scorer
// ---------------------------------------------------------------------------

export class QualityScorer {
  /**
   * Score the quality of parsed data.
   * Returns an overall score (0-1) and detailed quality report.
   */
  score(
    parsedResult: ParsedResult,
    docType: string,
    authorityTier: number = 3,
    dataYear?: number
  ): QualityReport {
    const flags: QualityFlag[] = [];

    // Completeness
    const completeness = this.scoreCompleteness(
      parsedResult.records,
      docType,
      flags
    );

    // Consistency
    const consistency = this.scoreConsistency(
      parsedResult.records,
      flags
    );

    // Freshness
    const freshness = this.scoreFreshness(dataYear, flags);

    // Authority
    const authority = this.scoreAuthority(authorityTier, flags);

    // Count valid records
    const validRecordCount = parsedResult.records.filter(
      (r) => Object.keys(r).length > 2
    ).length;

    // Weighted overall score
    const overallScore = Math.round(
      (completeness * 0.35 +
        consistency * 0.25 +
        freshness * 0.20 +
        authority * 0.20) * 100
    ) / 100;

    return {
      overallScore,
      completeness,
      consistency,
      freshness,
      authority,
      flags,
      recordCount: parsedResult.records.length,
      validRecordCount,
    };
  }

  // -------------------------------------------------------------------------
  // Completeness: % of expected fields present
  // -------------------------------------------------------------------------

  private scoreCompleteness(
    records: Record<string, unknown>[],
    docType: string,
    flags: QualityFlag[]
  ): number {
    const expectedFields = EXPECTED_FIELDS[docType] || [];
    if (expectedFields.length === 0 || records.length === 0) {
      if (records.length === 0) {
        flags.push({
          field: "_records",
          issue: "No records in parsed result",
          severity: "error",
        });
        return 0;
      }
      return 0.5; // unknown doc type
    }

    let totalExpected = 0;
    let totalPresent = 0;

    for (const record of records) {
      for (const field of expectedFields) {
        totalExpected++;
        const value = record[field];
        if (value !== undefined && value !== null && value !== "") {
          totalPresent++;
        }
      }
    }

    const score = totalExpected > 0 ? totalPresent / totalExpected : 0;

    if (score < 0.5) {
      flags.push({
        field: "_completeness",
        issue: `Low completeness: only ${Math.round(score * 100)}% of expected fields populated`,
        severity: "warning",
      });
    }

    // Check for specific missing fields
    if (records.length > 0) {
      for (const field of expectedFields) {
        const presentCount = records.filter(
          (r) => r[field] !== undefined && r[field] !== null
        ).length;
        const ratio = presentCount / records.length;
        if (ratio === 0) {
          flags.push({
            field,
            issue: `Field "${field}" missing from all records`,
            severity: "warning",
          });
        } else if (ratio < 0.5) {
          flags.push({
            field,
            issue: `Field "${field}" missing from ${Math.round((1 - ratio) * 100)}% of records`,
            severity: "info",
          });
        }
      }
    }

    return Math.round(score * 100) / 100;
  }

  // -------------------------------------------------------------------------
  // Consistency: values within expected ranges
  // -------------------------------------------------------------------------

  private scoreConsistency(
    records: Record<string, unknown>[],
    flags: QualityFlag[]
  ): number {
    if (records.length === 0) return 0;

    let totalChecks = 0;
    let passedChecks = 0;

    for (const record of records) {
      for (const [field, range] of Object.entries(VALID_RANGES)) {
        const value = record[field];
        if (value === undefined || value === null) continue;

        const numValue = typeof value === "number" ? value : parseFloat(String(value));
        if (isNaN(numValue)) continue;

        totalChecks++;
        if (numValue >= range.min && numValue <= range.max) {
          passedChecks++;
        } else {
          flags.push({
            field,
            issue: `Value ${numValue} outside expected range [${range.min}, ${range.max}]`,
            severity: numValue < 0 ? "error" : "warning",
            value: numValue,
          });
        }
      }
    }

    const score = totalChecks > 0 ? passedChecks / totalChecks : 0.8; // default if no checks applicable
    return Math.round(score * 100) / 100;
  }

  // -------------------------------------------------------------------------
  // Freshness: based on age of data
  // -------------------------------------------------------------------------

  private scoreFreshness(
    dataYear: number | undefined,
    flags: QualityFlag[]
  ): number {
    if (!dataYear) return 0.5; // unknown

    const currentYear = new Date().getFullYear();
    const age = currentYear - dataYear;

    if (age <= 0) {
      return 1.0; // current or future year data
    }

    if (age === 1) return 0.9;
    if (age === 2) return 0.75;
    if (age <= 5) return 0.5;

    flags.push({
      field: "year",
      issue: `Data is ${age} years old (year: ${dataYear})`,
      severity: age > 5 ? "warning" : "info",
      value: dataYear,
    });

    if (age <= 10) return 0.3;
    return 0.1;
  }

  // -------------------------------------------------------------------------
  // Authority: based on source tier (1=official, 4=community)
  // -------------------------------------------------------------------------

  private scoreAuthority(
    tier: number,
    flags: QualityFlag[]
  ): number {
    switch (tier) {
      case 1:
        return 1.0; // Official state agency data
      case 2:
        return 0.85; // Verified third-party
      case 3:
        return 0.6; // Expert/analyst
      case 4:
        flags.push({
          field: "_authority",
          issue: "Community-sourced data (tier 4) — use with caution",
          severity: "info",
        });
        return 0.3;
      default:
        return 0.5;
    }
  }

  // -------------------------------------------------------------------------
  // Calculate freshness score for a document based on creation date
  // -------------------------------------------------------------------------

  calculateFreshnessScore(createdAt: Date): number {
    const now = new Date();
    const ageMs = now.getTime() - createdAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays <= 7) return 1.0;
    if (ageDays <= 30) return 0.9;
    if (ageDays <= 90) return 0.75;
    if (ageDays <= 180) return 0.6;
    if (ageDays <= 365) return 0.4;
    return 0.2;
  }
}
