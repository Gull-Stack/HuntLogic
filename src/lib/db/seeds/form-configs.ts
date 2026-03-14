import { db } from "@/lib/db";
import { stateFormConfigs, states } from "@/lib/db/schema";

// =============================================================================
// State Form Configs Seed — 2026 Draw Year
// =============================================================================
// Dynamic form schemas for 9 states: CO, WY, MT, AZ, NM, ID, UT, NV, OR.
// Each state has different application requirements, portal IDs,
// hunt selection formats, and supporting document needs.
// =============================================================================

interface StateFormConfig {
  stateCode: string;
  formType: string;
  schema: object;
  fieldMapping: object;
  validationRules: object;
  submissionUrl: string;
  instructions: string;
  metadata: object;
}

// ---------------------------------------------------------------------------
// COLORADO (CPW)
// ---------------------------------------------------------------------------
// CPW Customer ID required. Up to 4 hunt code choices.
// Habitat Stamp must be purchased before applying.
// Party applications supported (up to 6).
// ---------------------------------------------------------------------------

const CO_FORM: StateFormConfig = {
  stateCode: "CO",
  formType: "application",
  schema: {
    sections: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "cpwCustomerId",
            type: "text",
            label: "CPW Customer ID",
            required: true,
            helpText: "Your Colorado Parks & Wildlife customer number. Found in your CPW online account under My Account.",
            pattern: "^[0-9]{7,10}$",
            patternMessage: "CPW Customer ID must be 7-10 digits",
          },
          {
            name: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true,
          },
          {
            name: "ssn",
            type: "ssn",
            label: "Social Security Number",
            required: true,
            encrypted: true,
            helpText: "Required by CPW for identity verification. Stored encrypted.",
          },
          {
            name: "hunterEdNumber",
            type: "text",
            label: "Hunter Education Certificate Number",
            required: true,
            helpText: "From any US state or Canadian province",
          },
        ],
      },
      {
        title: "Hunt Selections",
        fields: [
          {
            name: "species",
            type: "select",
            label: "Species",
            required: true,
            options: ["Elk", "Deer", "Antelope", "Moose", "Mountain Goat", "Bighorn Sheep", "Bear"],
          },
          {
            name: "huntChoice1",
            type: "text",
            label: "1st Choice Hunt Code",
            required: true,
            helpText: "e.g., EE001O1R — species/unit/season/method",
            pattern: "^[A-Z]{2}[0-9]{3}[A-Z][0-9][A-Z]$",
            patternMessage: "Hunt code must follow CPW format (e.g., EE001O1R)",
          },
          {
            name: "huntChoice2",
            type: "text",
            label: "2nd Choice Hunt Code",
            required: false,
          },
          {
            name: "huntChoice3",
            type: "text",
            label: "3rd Choice Hunt Code",
            required: false,
          },
          {
            name: "huntChoice4",
            type: "text",
            label: "4th Choice Hunt Code",
            required: false,
            helpText: "Consider an OTC backup unit for your 4th choice",
          },
        ],
      },
      {
        title: "Preferences & Options",
        fields: [
          {
            name: "purchasePoints",
            type: "checkbox",
            label: "Purchase preference point if unsuccessful",
            required: false,
            default: true,
            helpText: "Recommended to build points for future draws",
          },
          {
            name: "habitatStampPurchased",
            type: "checkbox",
            label: "I have purchased my 2026 Habitat Stamp ($10)",
            required: true,
            helpText: "Must be purchased BEFORE applying. Available at cpw.state.co.us",
          },
          {
            name: "partyApplication",
            type: "checkbox",
            label: "This is a party (group) application",
            required: false,
            default: false,
          },
          {
            name: "partyLeaderId",
            type: "text",
            label: "Party Leader CPW Customer ID",
            required: false,
            visibleWhen: { field: "partyApplication", value: true },
            helpText: "One member's CPW ID must be designated as leader",
          },
        ],
      },
    ],
    maxChoices: 4,
    partyApplicationSupported: true,
    maxPartySize: 6,
    requiredDocuments: [
      "Hunter Education Certificate",
      "Valid Government-Issued Photo ID",
      "Habitat Stamp (purchased for 2026)",
    ],
    portalUrl: "https://cpw.state.co.us",
  },
  fieldMapping: {
    "cpwCustomerId": "cid",
    "dateOfBirth": "dob",
    "ssn": "ssn",
    "hunterEdNumber": "huntered",
    "huntChoice1": "choice1",
    "huntChoice2": "choice2",
    "huntChoice3": "choice3",
    "huntChoice4": "choice4",
    "purchasePoints": "buypoints",
    "partyApplication": "isparty",
    "partyLeaderId": "partyleader",
  },
  validationRules: {
    ageMinimum: 12,
    hunterEdRequired: true,
    habitatStampRequired: true,
    duplicateChoicesAllowed: false,
    maxChoiceCount: 4,
  },
  submissionUrl: "https://cpw.state.co.us/thingstodo/Pages/BigGameApplications.aspx",
  instructions: "Log into CPW portal, navigate to Apply for License, select your species, enter hunt codes for choices 1-4, confirm Habitat Stamp is on file, then submit payment.",
  metadata: {
    applicationWindow: { open: "2026-03-01", close: "2026-04-01" },
    drawResultsExpected: "2026-06-01",
    refundPolicy: "Application fee non-refundable. Tag fee refunded if unsuccessful.",
    paymentMethods: ["credit_card", "debit_card"],
    pointType: "preference",
  },
};

// ---------------------------------------------------------------------------
// WYOMING (WGFD)
// ---------------------------------------------------------------------------
// WGFD Account # required. Area-based selections (not hunt codes).
// Full tag price charged upfront, refunded if not drawn.
// Party applications not supported for most species.
// ---------------------------------------------------------------------------

const WY_FORM: StateFormConfig = {
  stateCode: "WY",
  formType: "application",
  schema: {
    sections: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "wgfdAccountNumber",
            type: "text",
            label: "WGFD Account Number",
            required: true,
            helpText: "Your Wyoming Game & Fish customer account number.",
            pattern: "^[0-9]{6,10}$",
            patternMessage: "WGFD Account Number must be 6-10 digits",
          },
          {
            name: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true,
          },
          {
            name: "ssn",
            type: "ssn",
            label: "Social Security Number",
            required: true,
            encrypted: true,
          },
          {
            name: "hunterEdNumber",
            type: "text",
            label: "Hunter Education Certificate Number",
            required: true,
          },
          {
            name: "residencyStatus",
            type: "select",
            label: "Residency Status",
            required: true,
            options: ["Resident", "Nonresident"],
            helpText: "Must have been a WY resident for 1+ year to qualify as resident",
          },
        ],
      },
      {
        title: "Hunt Area Selections",
        fields: [
          {
            name: "species",
            type: "select",
            label: "Species",
            required: true,
            options: ["Elk", "Deer", "Antelope", "Moose", "Bighorn Sheep"],
          },
          {
            name: "huntType",
            type: "select",
            label: "Hunt Type / Weapon",
            required: true,
            options: ["Rifle", "Archery"],
            helpText: "Wyoming does not have separate muzzleloader seasons for most species",
          },
          {
            name: "huntArea1",
            type: "text",
            label: "1st Choice Hunt Area",
            required: true,
            helpText: "Area number from WGFD regulation booklet (e.g., 7, 100, 130)",
            pattern: "^[0-9]{1,4}$",
          },
          {
            name: "huntArea2",
            type: "text",
            label: "2nd Choice Hunt Area",
            required: false,
          },
        ],
      },
      {
        title: "Fees & Options",
        fields: [
          {
            name: "acknowledgeUpfrontTag",
            type: "checkbox",
            label: "I understand the full tag fee will be charged upfront and refunded if I am not drawn",
            required: true,
            helpText: "Wyoming charges the full license fee at time of application. You will be refunded if unsuccessful.",
          },
          {
            name: "purchasePointOnly",
            type: "checkbox",
            label: "Purchase preference point only (do not enter draw)",
            required: false,
            default: false,
            helpText: "Select this to buy a point without entering the draw this year",
          },
          {
            name: "conservationStampPurchased",
            type: "checkbox",
            label: "I have purchased my 2026 Conservation Stamp",
            required: true,
          },
        ],
      },
    ],
    maxChoices: 2,
    partyApplicationSupported: false,
    maxPartySize: 1,
    requiredDocuments: [
      "Hunter Education Certificate",
      "Valid Government-Issued Photo ID",
      "Conservation Stamp (purchased for 2026)",
      "Proof of Residency (if claiming resident status)",
    ],
    portalUrl: "https://wgfd.wyo.gov",
  },
  fieldMapping: {
    "wgfdAccountNumber": "acct_no",
    "dateOfBirth": "dob",
    "ssn": "ssn",
    "hunterEdNumber": "hunter_ed",
    "species": "species",
    "huntType": "weapon",
    "huntArea1": "area1",
    "huntArea2": "area2",
    "purchasePointOnly": "point_only",
  },
  validationRules: {
    ageMinimum: 12,
    hunterEdRequired: true,
    conservationStampRequired: true,
    upfrontTagPayment: true,
    duplicateAreasAllowed: false,
    maxChoiceCount: 2,
  },
  submissionUrl: "https://wgfd.wyo.gov/apply-or-buy",
  instructions: "Log into WGFD portal, select Apply for License, choose species and hunt area(s), confirm conservation stamp, acknowledge upfront tag fee, then submit payment.",
  metadata: {
    applicationWindow: {
      elk: { open: "2026-01-04", close: "2026-01-31" },
      deer: { open: "2026-07-01", close: "2026-07-31" },
      antelope: { open: "2026-07-01", close: "2026-07-31" },
      moose: { open: "2026-01-04", close: "2026-01-31" },
      bighorn_sheep: { open: "2026-01-04", close: "2026-01-31" },
    },
    drawResultsExpected: "Elk/Moose/Sheep: 2026-03-15, Deer/Antelope: 2026-08-15",
    refundPolicy: "Full tag fee refunded if not drawn. Application fee non-refundable.",
    paymentMethods: ["credit_card", "electronic_check"],
    pointType: "preference",
  },
};

// ---------------------------------------------------------------------------
// MONTANA (MFWP)
// ---------------------------------------------------------------------------
// MyFWP Account # (ALS number) required. Base license purchase required first.
// Permit district selections. Bonus point system (squared).
// Non-residents must purchase base hunting license before applying.
// ---------------------------------------------------------------------------

const MT_FORM: StateFormConfig = {
  stateCode: "MT",
  formType: "application",
  schema: {
    sections: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "myfwpAccountId",
            type: "text",
            label: "MyFWP Account Number (ALS #)",
            required: true,
            helpText: "Your Montana FWP Automated Licensing System number. Found under My Account at fwp.mt.gov.",
            pattern: "^[0-9]{7,12}$",
            patternMessage: "ALS number must be 7-12 digits",
          },
          {
            name: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true,
          },
          {
            name: "ssn",
            type: "ssn",
            label: "Social Security Number",
            required: true,
            encrypted: true,
          },
          {
            name: "hunterEdNumber",
            type: "text",
            label: "Hunter Education Certificate Number",
            required: true,
          },
          {
            name: "residencyStatus",
            type: "select",
            label: "Residency Status",
            required: true,
            options: ["Resident", "Nonresident"],
          },
        ],
      },
      {
        title: "License Prerequisites",
        fields: [
          {
            name: "baseLicensePurchased",
            type: "checkbox",
            label: "I have purchased my 2026 Conservation License ($10) and Base Hunting License",
            required: true,
            helpText: "Non-residents: Base Hunting License is $120. Residents: $15. Conservation License is $10 for all.",
          },
          {
            name: "baseLicenseNumber",
            type: "text",
            label: "Base Hunting License Number",
            required: true,
            helpText: "License confirmation number from MyFWP",
          },
        ],
      },
      {
        title: "Permit Selections",
        fields: [
          {
            name: "species",
            type: "select",
            label: "Species",
            required: true,
            options: ["Elk", "Deer", "Antelope", "Moose", "Mountain Goat", "Bighorn Sheep"],
          },
          {
            name: "permitType",
            type: "select",
            label: "Permit Type",
            required: true,
            options: ["Limited Entry", "B License", "Elk Combo (NR)"],
            helpText: "Limited Entry for restricted districts. B License for antlerless. Elk Combo for NR general + limited.",
          },
          {
            name: "districtChoice1",
            type: "text",
            label: "1st Choice District / Hunt District Number",
            required: true,
            helpText: "e.g., 270, 411, 700. See MT Hunting Regulation booklet.",
            pattern: "^[0-9]{1,4}$",
          },
          {
            name: "districtChoice2",
            type: "text",
            label: "2nd Choice District / Hunt District Number",
            required: false,
          },
        ],
      },
      {
        title: "Preferences",
        fields: [
          {
            name: "purchaseBonusPoint",
            type: "checkbox",
            label: "Purchase bonus point if unsuccessful",
            required: false,
            default: true,
            helpText: "Montana bonus points square your chances. 3 points = 9x odds vs. first-time applicant.",
          },
          {
            name: "pointOnlyPurchase",
            type: "checkbox",
            label: "Purchase point only (do not enter draw)",
            required: false,
            default: false,
          },
        ],
      },
    ],
    maxChoices: 2,
    partyApplicationSupported: true,
    maxPartySize: 4,
    requiredDocuments: [
      "Hunter Education Certificate",
      "Valid Government-Issued Photo ID",
      "Conservation License (2026)",
      "Base Hunting License (2026)",
    ],
    portalUrl: "https://fwp.mt.gov",
  },
  fieldMapping: {
    "myfwpAccountId": "als_num",
    "dateOfBirth": "dob",
    "ssn": "ssn",
    "hunterEdNumber": "hunter_ed",
    "species": "species",
    "permitType": "permit_type",
    "districtChoice1": "district1",
    "districtChoice2": "district2",
    "purchaseBonusPoint": "buy_bonus",
    "pointOnlyPurchase": "point_only",
  },
  validationRules: {
    ageMinimum: 12,
    hunterEdRequired: true,
    baseLicenseRequired: true,
    conservationLicenseRequired: true,
    duplicateDistrictsAllowed: false,
    maxChoiceCount: 2,
  },
  submissionUrl: "https://fwp.mt.gov/buyAndApply",
  instructions: "Log into MyFWP, ensure base hunting and conservation licenses are purchased, navigate to Apply for Permits, select species and district(s), then submit payment.",
  metadata: {
    applicationWindow: {
      elk: { open: "2026-03-01", close: "2026-04-01" },
      deer: { open: "2026-03-01", close: "2026-04-01" },
      antelope: { open: "2026-03-01", close: "2026-06-01" },
      moose: { open: "2026-03-01", close: "2026-04-01" },
      mountain_goat: { open: "2026-03-01", close: "2026-04-01" },
      bighorn_sheep: { open: "2026-03-01", close: "2026-04-01" },
    },
    drawResultsExpected: "Elk/Deer: mid-March, Antelope: mid-June",
    refundPolicy: "Application fee non-refundable. Permit fees charged on draw.",
    paymentMethods: ["credit_card"],
    pointType: "bonus",
    bonusPointSquaring: true,
  },
};

// ---------------------------------------------------------------------------
// ARIZONA (AZGFD)
// ---------------------------------------------------------------------------
// AZGFD Portal ID required. Hunt number selections (up to 3).
// Bonus points auto-earned on unsuccessful draw. Hunting license required.
// Separate draws for different species groups with different deadlines.
// ---------------------------------------------------------------------------

const AZ_FORM: StateFormConfig = {
  stateCode: "AZ",
  formType: "application",
  schema: {
    sections: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "azgfdPortalId",
            type: "text",
            label: "AZGFD Portal ID / Customer ID",
            required: true,
            helpText: "Your Arizona Game & Fish Department customer number. Found at azgfd.com/license/portal.",
            pattern: "^[0-9]{6,10}$",
            patternMessage: "AZGFD Portal ID must be 6-10 digits",
          },
          {
            name: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true,
          },
          {
            name: "hunterEdNumber",
            type: "text",
            label: "Hunter Education Certificate Number",
            required: true,
          },
          {
            name: "residencyStatus",
            type: "select",
            label: "Residency Status",
            required: true,
            options: ["Resident", "Nonresident"],
          },
        ],
      },
      {
        title: "License Verification",
        fields: [
          {
            name: "huntingLicensePurchased",
            type: "checkbox",
            label: "I have purchased my 2026 General Hunting License",
            required: true,
            helpText: "Resident: $37 | Nonresident: $160. Valid 365 days from purchase.",
          },
          {
            name: "huntingLicenseNumber",
            type: "text",
            label: "Hunting License Number",
            required: true,
            helpText: "License number from AZGFD portal",
          },
        ],
      },
      {
        title: "Hunt Number Selections",
        fields: [
          {
            name: "species",
            type: "select",
            label: "Species",
            required: true,
            options: ["Elk", "Deer", "Antelope", "Javelina", "Bighorn Sheep", "Buffalo"],
          },
          {
            name: "huntNumber1",
            type: "text",
            label: "1st Choice Hunt Number",
            required: true,
            helpText: "5-digit hunt number from AZ Hunting Regulations (e.g., 10001, 22015)",
            pattern: "^[0-9]{4,6}$",
          },
          {
            name: "huntNumber2",
            type: "text",
            label: "2nd Choice Hunt Number",
            required: false,
          },
          {
            name: "huntNumber3",
            type: "text",
            label: "3rd Choice Hunt Number",
            required: false,
          },
        ],
      },
      {
        title: "Bonus Points & Options",
        fields: [
          {
            name: "bonusPointInfo",
            type: "info",
            label: "Bonus Point Information",
            helpText: "Arizona automatically awards a bonus point for unsuccessful draw applications. No separate purchase needed. Points increase odds but don't guarantee a tag.",
          },
          {
            name: "pointOnlyApplication",
            type: "checkbox",
            label: "Submit bonus point-only application (do not enter draw)",
            required: false,
            default: false,
            helpText: "Submit application for bonus point only. Same $13 fee applies.",
          },
        ],
      },
    ],
    maxChoices: 3,
    partyApplicationSupported: true,
    maxPartySize: 4,
    requiredDocuments: [
      "Hunter Education Certificate",
      "Valid Government-Issued Photo ID",
      "General Hunting License (2026)",
    ],
    portalUrl: "https://www.azgfd.com/license/portal",
  },
  fieldMapping: {
    "azgfdPortalId": "customer_id",
    "dateOfBirth": "dob",
    "hunterEdNumber": "hunter_ed",
    "species": "species",
    "huntNumber1": "hunt1",
    "huntNumber2": "hunt2",
    "huntNumber3": "hunt3",
    "pointOnlyApplication": "point_only",
  },
  validationRules: {
    ageMinimum: 10,
    hunterEdRequired: true,
    huntingLicenseRequired: true,
    duplicateHuntNumbersAllowed: false,
    maxChoiceCount: 3,
  },
  submissionUrl: "https://www.azgfd.com/license/portal",
  instructions: "Log into AZGFD portal, verify hunting license is on file, navigate to Apply for Draw, select species and enter hunt number(s), then submit payment ($13 app fee).",
  metadata: {
    applicationWindow: {
      elk: { open: "2026-01-14", close: "2026-02-11" },
      deer: { open: "2026-05-26", close: "2026-06-09" },
      antelope: { open: "2026-05-26", close: "2026-06-09" },
      javelina: { open: "2026-05-26", close: "2026-06-09" },
      bighorn_sheep: { open: "2026-05-26", close: "2026-06-09" },
      buffalo: { open: "2026-05-26", close: "2026-06-09" },
    },
    drawResultsExpected: "Elk: ~5 weeks after deadline; Deer/Antelope: ~5 weeks after deadline",
    refundPolicy: "Application fee non-refundable. Tag fee charged only upon draw.",
    paymentMethods: ["credit_card", "debit_card"],
    pointType: "bonus",
    autoPointEarn: true,
  },
};

// ---------------------------------------------------------------------------
// NEW MEXICO (NMDGF)
// ---------------------------------------------------------------------------
// NMDGF Account # required. Up to 3 hunt choices per species.
// Pure random lottery — NO preference or bonus point system.
// Game-Hunting License + Habitat Management stamp required.
// Oryx and ibex have separate exotic draw periods.
// ---------------------------------------------------------------------------

const NM_FORM: StateFormConfig = {
  stateCode: "NM",
  formType: "application",
  schema: {
    sections: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "nmdgfAccountNumber",
            type: "text",
            label: "NMDGF Account Number",
            required: true,
            helpText: "Your New Mexico Department of Game & Fish customer number.",
            pattern: "^[0-9]{6,12}$",
            patternMessage: "NMDGF Account Number must be 6-12 digits",
          },
          {
            name: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true,
          },
          {
            name: "ssn",
            type: "ssn",
            label: "Social Security Number",
            required: true,
            encrypted: true,
          },
          {
            name: "hunterEdNumber",
            type: "text",
            label: "Hunter Education Certificate Number",
            required: true,
          },
          {
            name: "residencyStatus",
            type: "select",
            label: "Residency Status",
            required: true,
            options: ["Resident", "Nonresident"],
          },
        ],
      },
      {
        title: "License Prerequisites",
        fields: [
          {
            name: "gameHuntingLicensePurchased",
            type: "checkbox",
            label: "I have purchased my 2026-2027 Game-Hunting License",
            required: true,
            helpText: "Resident: $15 | Nonresident: $65. Valid April 1 through March 31.",
          },
          {
            name: "habitatStampPurchased",
            type: "checkbox",
            label: "I have purchased my Habitat Management & Access Validation ($5)",
            required: true,
            helpText: "Required annually in addition to hunting license.",
          },
        ],
      },
      {
        title: "Hunt Selections",
        fields: [
          {
            name: "species",
            type: "select",
            label: "Species",
            required: true,
            options: ["Elk", "Deer", "Antelope", "Oryx", "Ibex", "Bighorn Sheep"],
          },
          {
            name: "huntSelection1",
            type: "text",
            label: "1st Choice Hunt Code",
            required: true,
            helpText: "Hunt code from NMDGF Big Game rules and information booklet",
          },
          {
            name: "huntSelection2",
            type: "text",
            label: "2nd Choice Hunt Code",
            required: false,
          },
          {
            name: "huntSelection3",
            type: "text",
            label: "3rd Choice Hunt Code",
            required: false,
          },
        ],
      },
      {
        title: "Draw Information",
        fields: [
          {
            name: "drawInfo",
            type: "info",
            label: "New Mexico Draw System",
            helpText: "New Mexico uses a pure random lottery with no point system. Every applicant has equal odds regardless of how many years they have applied. Apply every year for the best cumulative chance.",
          },
          {
            name: "outfitterSetAside",
            type: "checkbox",
            label: "Apply in Outfitter Set-Aside pool",
            required: false,
            default: false,
            helpText: "If hunting with a registered outfitter, you may apply in the set-aside pool for potentially better odds. Requires signed outfitter contract.",
          },
          {
            name: "outfitterRegistrationNumber",
            type: "text",
            label: "Outfitter Registration Number",
            required: false,
            visibleWhen: { field: "outfitterSetAside", value: true },
          },
        ],
      },
    ],
    maxChoices: 3,
    partyApplicationSupported: false,
    maxPartySize: 1,
    requiredDocuments: [
      "Hunter Education Certificate",
      "Valid Government-Issued Photo ID",
      "Game-Hunting License (2026-2027)",
      "Habitat Management & Access Validation (2026)",
      "Outfitter Contract (if applying in set-aside pool)",
    ],
    portalUrl: "https://onlinesales.wildlife.state.nm.us",
  },
  fieldMapping: {
    "nmdgfAccountNumber": "cust_id",
    "dateOfBirth": "dob",
    "ssn": "ssn",
    "hunterEdNumber": "hunter_ed",
    "species": "species",
    "huntSelection1": "hunt1",
    "huntSelection2": "hunt2",
    "huntSelection3": "hunt3",
    "outfitterSetAside": "osa",
    "outfitterRegistrationNumber": "outfitter_reg",
  },
  validationRules: {
    ageMinimum: 12,
    hunterEdRequired: true,
    gameHuntingLicenseRequired: true,
    habitatStampRequired: true,
    duplicateSelectionsAllowed: false,
    maxChoiceCount: 3,
    noPointSystem: true,
  },
  submissionUrl: "https://onlinesales.wildlife.state.nm.us",
  instructions: "Log into NMDGF portal, verify game-hunting license and habitat stamp are on file, navigate to Big Game Draw, select species and enter hunt code(s), then submit $12 application fee.",
  metadata: {
    applicationWindow: {
      elk: { open: "2026-02-18", close: "2026-03-18" },
      deer: { open: "2026-02-18", close: "2026-03-18" },
      antelope: { open: "2026-02-18", close: "2026-03-18" },
      bighorn_sheep: { open: "2026-02-18", close: "2026-03-18" },
      oryx: { open: "2026-02-18", close: "2026-03-18" },
      ibex: { open: "2026-02-18", close: "2026-03-18" },
    },
    drawResultsExpected: "Approximately 6 weeks after deadline",
    refundPolicy: "Application fee non-refundable. Tag fee charged only upon successful draw.",
    paymentMethods: ["credit_card"],
    pointType: null,
    pureLottery: true,
  },
};

// ---------------------------------------------------------------------------
// IDAHO (IDFG)
// ---------------------------------------------------------------------------
// IDFG Customer Number required. Controlled hunt number selections (up to 3).
// Hunter ed required. No party applications for most species.
// No state-specific stamp requirement for controlled hunt apps.
// ---------------------------------------------------------------------------

const ID_FORM: StateFormConfig = {
  stateCode: "ID",
  formType: "application",
  schema: {
    sections: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "idfgCustomerNumber",
            type: "text",
            label: "IDFG Customer Number",
            required: true,
            helpText: "Your Idaho Fish and Game customer number. Found in your IDFG online account.",
            pattern: "^[0-9]{6,12}$",
            patternMessage: "IDFG Customer Number must be 6-12 digits",
          },
          {
            name: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true,
          },
          {
            name: "hunterEdNumber",
            type: "text",
            label: "Hunter Education Certificate Number",
            required: true,
            helpText: "From any US state or Canadian province",
          },
          {
            name: "residencyStatus",
            type: "select",
            label: "Residency Status",
            required: true,
            options: ["Resident", "Nonresident"],
            helpText: "Must have been an Idaho resident for 6+ months to qualify as resident",
          },
        ],
      },
      {
        title: "Controlled Hunt Selections",
        fields: [
          {
            name: "species",
            type: "select",
            label: "Species",
            required: true,
            options: ["Elk", "Mule Deer", "Whitetail", "Pronghorn", "Moose", "Mountain Goat", "Bighorn Sheep", "Black Bear", "Mountain Lion", "Turkey"],
          },
          {
            name: "weaponType",
            type: "select",
            label: "Weapon Type",
            required: true,
            options: ["Any Weapon", "Archery", "Muzzleloader"],
            helpText: "Select weapon type for this controlled hunt application",
          },
          {
            name: "controlledHunt1",
            type: "text",
            label: "1st Choice Controlled Hunt Number",
            required: true,
            helpText: "Controlled hunt number from IDFG regulation booklet (e.g., 1001, 6027)",
            pattern: "^[0-9]{3,5}$",
          },
          {
            name: "controlledHunt2",
            type: "text",
            label: "2nd Choice Controlled Hunt Number",
            required: false,
          },
          {
            name: "controlledHunt3",
            type: "text",
            label: "3rd Choice Controlled Hunt Number",
            required: false,
          },
        ],
      },
      {
        title: "Options",
        fields: [
          {
            name: "drawInfo",
            type: "info",
            label: "Idaho Draw System",
            helpText: "Idaho uses a random draw for controlled hunts. There is no preference or bonus point system. Unsuccessful applicants receive no accumulated advantage. Apply every year for the best chance.",
          },
        ],
      },
    ],
    maxChoices: 3,
    partyApplicationSupported: false,
    maxPartySize: 1,
    requiredDocuments: [
      "Hunter Education Certificate",
      "Valid Government-Issued Photo ID",
      "Idaho Hunting License (2026)",
    ],
    portalUrl: "https://idfg.idaho.gov",
  },
  fieldMapping: {
    "idfgCustomerNumber": "cust_num",
    "dateOfBirth": "dob",
    "hunterEdNumber": "hunter_ed",
    "species": "species",
    "weaponType": "weapon",
    "controlledHunt1": "hunt1",
    "controlledHunt2": "hunt2",
    "controlledHunt3": "hunt3",
  },
  validationRules: {
    ageMinimum: 10,
    hunterEdRequired: true,
    huntingLicenseRequired: true,
    duplicateHuntNumbersAllowed: false,
    maxChoiceCount: 3,
  },
  submissionUrl: "https://idfg.idaho.gov/buy-apply",
  instructions: "Log into IDFG portal at idfg.idaho.gov, navigate to Controlled Hunt Applications, select species, enter up to 3 controlled hunt numbers, then submit payment ($14.75-$41.75 app fee).",
  metadata: {
    applicationWindow: { open: "2026-04-01", close: "2026-04-30" },
    drawResultsExpected: "2026-06-15",
    refundPolicy: "Application fee non-refundable. Tag fee charged only upon successful draw.",
    paymentMethods: ["credit_card", "debit_card"],
    pointType: null,
    pureLottery: true,
  },
};

// ---------------------------------------------------------------------------
// UTAH (UDWR)
// ---------------------------------------------------------------------------
// DWR Customer ID required. Hunt unit/weapon choices. Bonus point system.
// Conservation permit option. Application windows vary by species.
// Hunting license required before applying.
// ---------------------------------------------------------------------------

const UT_FORM: StateFormConfig = {
  stateCode: "UT",
  formType: "application",
  schema: {
    sections: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "dwrCustomerId",
            type: "text",
            label: "DWR Customer ID",
            required: true,
            helpText: "Your Utah Division of Wildlife Resources customer number. Found at wildlife.utah.gov under My Account.",
            pattern: "^[0-9]{6,12}$",
            patternMessage: "DWR Customer ID must be 6-12 digits",
          },
          {
            name: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true,
          },
          {
            name: "ssn",
            type: "ssn",
            label: "Social Security Number",
            required: true,
            encrypted: true,
            helpText: "Required by UDWR for identity verification. Stored encrypted.",
          },
          {
            name: "hunterEdNumber",
            type: "text",
            label: "Hunter Education Certificate Number",
            required: true,
          },
          {
            name: "residencyStatus",
            type: "select",
            label: "Residency Status",
            required: true,
            options: ["Resident", "Nonresident"],
            helpText: "Must have maintained a Utah domicile for 6+ consecutive months",
          },
        ],
      },
      {
        title: "License Verification",
        fields: [
          {
            name: "huntingLicensePurchased",
            type: "checkbox",
            label: "I have purchased my 2026 Hunting License or Combination License",
            required: true,
            helpText: "Resident Combination: $34 | NR Hunting: $65. Must be on file before applying.",
          },
        ],
      },
      {
        title: "Hunt Selections",
        fields: [
          {
            name: "species",
            type: "select",
            label: "Species",
            required: true,
            options: ["Elk", "Deer", "Pronghorn", "Moose", "Mountain Goat", "Bighorn Sheep", "Black Bear", "Bison", "Turkey", "Mountain Lion"],
          },
          {
            name: "permitType",
            type: "select",
            label: "Permit Type",
            required: true,
            options: ["General Season", "Limited Entry", "Once-in-a-Lifetime", "Premium Limited Entry"],
            helpText: "General season for deer/elk; Limited Entry and OIAL for trophy units.",
          },
          {
            name: "huntUnit1",
            type: "text",
            label: "1st Choice Hunt Unit",
            required: true,
            helpText: "Unit code from UDWR guidebook (e.g., Book Cliffs, Wasatch, La Sal)",
          },
          {
            name: "weaponType",
            type: "select",
            label: "Weapon Type",
            required: true,
            options: ["Any Legal Weapon", "Archery", "Muzzleloader"],
          },
          {
            name: "huntUnit2",
            type: "text",
            label: "2nd Choice Hunt Unit",
            required: false,
          },
          {
            name: "huntUnit3",
            type: "text",
            label: "3rd Choice Hunt Unit",
            required: false,
          },
        ],
      },
      {
        title: "Bonus Points & Options",
        fields: [
          {
            name: "purchaseBonusPoint",
            type: "checkbox",
            label: "Purchase bonus point if unsuccessful ($10)",
            required: false,
            default: true,
            helpText: "Recommended. Bonus points increase your odds in future draws. Weighted random draw.",
          },
          {
            name: "bonusPointOnly",
            type: "checkbox",
            label: "Purchase bonus point only (do not enter draw)",
            required: false,
            default: false,
          },
          {
            name: "conservationPermitOption",
            type: "checkbox",
            label: "Enter me in the conservation permit drawing",
            required: false,
            default: false,
            helpText: "Conservation permits are awarded at SFW/MDF banquets. Additional fees apply if awarded.",
          },
        ],
      },
    ],
    maxChoices: 3,
    partyApplicationSupported: true,
    maxPartySize: 4,
    requiredDocuments: [
      "Hunter Education Certificate",
      "Valid Government-Issued Photo ID",
      "Hunting License or Combination License (2026)",
    ],
    portalUrl: "https://wildlife.utah.gov",
  },
  fieldMapping: {
    "dwrCustomerId": "cust_id",
    "dateOfBirth": "dob",
    "ssn": "ssn",
    "hunterEdNumber": "hunter_ed",
    "species": "species",
    "permitType": "permit_type",
    "huntUnit1": "unit1",
    "huntUnit2": "unit2",
    "huntUnit3": "unit3",
    "weaponType": "weapon",
    "purchaseBonusPoint": "buy_bonus",
    "bonusPointOnly": "bonus_only",
    "conservationPermitOption": "conservation_opt",
  },
  validationRules: {
    ageMinimum: 12,
    hunterEdRequired: true,
    huntingLicenseRequired: true,
    duplicateUnitsAllowed: false,
    maxChoiceCount: 3,
  },
  submissionUrl: "https://wildlife.utah.gov/draw-application.html",
  instructions: "Log into Utah DWR portal at wildlife.utah.gov, verify hunting license is on file, navigate to Apply for Draw Permits, select species/permit type and hunt unit(s), confirm bonus point preference, then submit $10 application fee.",
  metadata: {
    applicationWindow: {
      general_deer_elk: { open: "2026-01-15", close: "2026-02-15" },
      limited_entry: { open: "2026-02-01", close: "2026-03-05" },
      once_in_a_lifetime: { open: "2026-02-01", close: "2026-03-05" },
      turkey: { open: "2026-01-15", close: "2026-02-15" },
      black_bear: { open: "2026-02-01", close: "2026-03-05" },
      mountain_lion: { open: "2026-02-01", close: "2026-03-05" },
    },
    drawResultsExpected: "General: 2026-05-01, LE/OIAL: 2026-06-01",
    refundPolicy: "Application fee non-refundable. Permit fee charged only upon successful draw.",
    paymentMethods: ["credit_card", "debit_card"],
    pointType: "bonus",
  },
};

// ---------------------------------------------------------------------------
// NEVADA (NDOW)
// ---------------------------------------------------------------------------
// NDOW ID number required. Up to 5 hunt unit choices per species.
// Bonus point system with separate purchase option.
// Hunting license required before applying.
// ---------------------------------------------------------------------------

const NV_FORM: StateFormConfig = {
  stateCode: "NV",
  formType: "application",
  schema: {
    sections: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "ndowIdNumber",
            type: "text",
            label: "NDOW ID Number",
            required: true,
            helpText: "Your Nevada Department of Wildlife customer ID number. Found in your NDOW online account.",
            pattern: "^[0-9]{6,12}$",
            patternMessage: "NDOW ID Number must be 6-12 digits",
          },
          {
            name: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true,
          },
          {
            name: "ssn",
            type: "ssn",
            label: "Social Security Number",
            required: true,
            encrypted: true,
            helpText: "Required by NDOW for identity verification. Stored encrypted.",
          },
          {
            name: "hunterEdNumber",
            type: "text",
            label: "Hunter Education Certificate Number",
            required: true,
          },
          {
            name: "residencyStatus",
            type: "select",
            label: "Residency Status",
            required: true,
            options: ["Resident", "Nonresident"],
            helpText: "Must have continuously resided in Nevada for 12+ months",
          },
        ],
      },
      {
        title: "License Verification",
        fields: [
          {
            name: "huntingLicensePurchased",
            type: "checkbox",
            label: "I have purchased my 2026 Hunting License",
            required: true,
            helpText: "Resident: $33 | Nonresident: $142. Valid for the license year.",
          },
        ],
      },
      {
        title: "Hunt Unit Selections",
        fields: [
          {
            name: "species",
            type: "select",
            label: "Species",
            required: true,
            options: ["Elk", "Mule Deer", "Pronghorn", "Bighorn Sheep", "Mountain Goat", "Mountain Lion"],
          },
          {
            name: "weaponType",
            type: "select",
            label: "Weapon Type",
            required: true,
            options: ["Any Legal Weapon", "Archery", "Muzzleloader"],
          },
          {
            name: "huntChoice1",
            type: "text",
            label: "1st Choice Hunt Unit / Area",
            required: true,
            helpText: "Unit/area number from NDOW Big Game Digest (e.g., 031, 062, 231)",
            pattern: "^[0-9]{2,4}$",
          },
          {
            name: "huntChoice2",
            type: "text",
            label: "2nd Choice Hunt Unit / Area",
            required: false,
          },
          {
            name: "huntChoice3",
            type: "text",
            label: "3rd Choice Hunt Unit / Area",
            required: false,
          },
          {
            name: "huntChoice4",
            type: "text",
            label: "4th Choice Hunt Unit / Area",
            required: false,
          },
          {
            name: "huntChoice5",
            type: "text",
            label: "5th Choice Hunt Unit / Area",
            required: false,
          },
        ],
      },
      {
        title: "Bonus Points & Options",
        fields: [
          {
            name: "purchaseBonusPoint",
            type: "checkbox",
            label: "Purchase bonus point if unsuccessful",
            required: false,
            default: true,
            helpText: "Resident: $15 | Nonresident: $142. Bonus points are squared in the draw (3 pts = 9x odds).",
          },
          {
            name: "bonusPointOnly",
            type: "checkbox",
            label: "Purchase bonus point only (do not enter draw)",
            required: false,
            default: false,
            helpText: "Select this to buy a bonus point without entering the draw",
          },
        ],
      },
    ],
    maxChoices: 5,
    partyApplicationSupported: false,
    maxPartySize: 1,
    requiredDocuments: [
      "Hunter Education Certificate",
      "Valid Government-Issued Photo ID",
      "Nevada Hunting License (2026)",
    ],
    portalUrl: "https://www.ndow.org",
  },
  fieldMapping: {
    "ndowIdNumber": "ndow_id",
    "dateOfBirth": "dob",
    "ssn": "ssn",
    "hunterEdNumber": "hunter_ed",
    "species": "species",
    "weaponType": "weapon",
    "huntChoice1": "choice1",
    "huntChoice2": "choice2",
    "huntChoice3": "choice3",
    "huntChoice4": "choice4",
    "huntChoice5": "choice5",
    "purchaseBonusPoint": "buy_bonus",
    "bonusPointOnly": "bonus_only",
  },
  validationRules: {
    ageMinimum: 12,
    hunterEdRequired: true,
    huntingLicenseRequired: true,
    duplicateChoicesAllowed: false,
    maxChoiceCount: 5,
  },
  submissionUrl: "https://www.ndow.org/hunt/tag-application/",
  instructions: "Log into NDOW portal at ndow.org, verify hunting license is on file, navigate to Tag Applications, select species and enter up to 5 hunt unit choices, confirm bonus point preference, then submit $15 application fee.",
  metadata: {
    applicationWindow: { open: "2026-03-01", close: "2026-04-15" },
    drawResultsExpected: "2026-06-15",
    refundPolicy: "Application fee non-refundable. Tag fee charged only upon successful draw.",
    paymentMethods: ["credit_card", "debit_card"],
    pointType: "bonus",
    bonusPointSquaring: true,
  },
};

// ---------------------------------------------------------------------------
// OREGON (ODFW)
// ---------------------------------------------------------------------------
// ODFW Customer ID required. Up to 5 controlled hunt choices.
// Preference point system. Preference point purchase optional.
// Hunting license required before applying.
// ---------------------------------------------------------------------------

const OR_FORM: StateFormConfig = {
  stateCode: "OR",
  formType: "application",
  schema: {
    sections: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "odfwCustomerId",
            type: "text",
            label: "ODFW Customer ID",
            required: true,
            helpText: "Your Oregon Department of Fish and Wildlife customer number. Found at myodfw.com under My Account.",
            pattern: "^[0-9]{6,12}$",
            patternMessage: "ODFW Customer ID must be 6-12 digits",
          },
          {
            name: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true,
          },
          {
            name: "hunterEdNumber",
            type: "text",
            label: "Hunter Education Certificate Number",
            required: true,
            helpText: "From any US state or Canadian province. Oregon accepts all.",
          },
          {
            name: "residencyStatus",
            type: "select",
            label: "Residency Status",
            required: true,
            options: ["Resident", "Nonresident"],
            helpText: "Must have been an Oregon resident for 6+ months to qualify",
          },
        ],
      },
      {
        title: "License Verification",
        fields: [
          {
            name: "huntingLicensePurchased",
            type: "checkbox",
            label: "I have purchased my 2026 Hunting License",
            required: true,
            helpText: "Resident: $33 | Nonresident: $167.50. Valid for the calendar year.",
          },
        ],
      },
      {
        title: "Controlled Hunt Selections",
        fields: [
          {
            name: "species",
            type: "select",
            label: "Species",
            required: true,
            options: ["Elk", "Deer", "Pronghorn", "Bighorn Sheep", "Mountain Goat", "Black Bear", "Mountain Lion", "Turkey"],
          },
          {
            name: "weaponType",
            type: "select",
            label: "Weapon Type",
            required: true,
            options: ["Rifle", "Archery", "Muzzleloader"],
          },
          {
            name: "huntChoice1",
            type: "text",
            label: "1st Choice Controlled Hunt",
            required: true,
            helpText: "Controlled hunt code from ODFW regulations (e.g., 200A1, 251M1)",
            pattern: "^[0-9]{3}[A-Z][0-9]$",
            patternMessage: "Controlled hunt code must follow ODFW format (e.g., 200A1)",
          },
          {
            name: "huntChoice2",
            type: "text",
            label: "2nd Choice Controlled Hunt",
            required: false,
          },
          {
            name: "huntChoice3",
            type: "text",
            label: "3rd Choice Controlled Hunt",
            required: false,
          },
          {
            name: "huntChoice4",
            type: "text",
            label: "4th Choice Controlled Hunt",
            required: false,
          },
          {
            name: "huntChoice5",
            type: "text",
            label: "5th Choice Controlled Hunt",
            required: false,
          },
        ],
      },
      {
        title: "Preference Points & Options",
        fields: [
          {
            name: "purchasePreferencePoint",
            type: "checkbox",
            label: "Purchase preference point if unsuccessful ($8)",
            required: false,
            default: true,
            helpText: "Recommended. Preference points guarantee you draw before applicants with fewer points.",
          },
          {
            name: "pointOnlyPurchase",
            type: "checkbox",
            label: "Purchase preference point only (do not enter draw)",
            required: false,
            default: false,
            helpText: "Select this to buy a preference point without entering the draw this year",
          },
          {
            name: "partyApplication",
            type: "checkbox",
            label: "This is a party (group) application",
            required: false,
            default: false,
          },
          {
            name: "partyLeaderId",
            type: "text",
            label: "Party Leader ODFW Customer ID",
            required: false,
            visibleWhen: { field: "partyApplication", value: true },
            helpText: "One member's ODFW ID must be designated as leader",
          },
        ],
      },
    ],
    maxChoices: 5,
    partyApplicationSupported: true,
    maxPartySize: 6,
    requiredDocuments: [
      "Hunter Education Certificate",
      "Valid Government-Issued Photo ID",
      "Oregon Hunting License (2026)",
    ],
    portalUrl: "https://myodfw.com",
  },
  fieldMapping: {
    "odfwCustomerId": "cust_id",
    "dateOfBirth": "dob",
    "hunterEdNumber": "hunter_ed",
    "species": "species",
    "weaponType": "weapon",
    "huntChoice1": "hunt1",
    "huntChoice2": "hunt2",
    "huntChoice3": "hunt3",
    "huntChoice4": "hunt4",
    "huntChoice5": "hunt5",
    "purchasePreferencePoint": "buy_point",
    "pointOnlyPurchase": "point_only",
    "partyApplication": "is_party",
    "partyLeaderId": "party_leader",
  },
  validationRules: {
    ageMinimum: 12,
    hunterEdRequired: true,
    huntingLicenseRequired: true,
    duplicateChoicesAllowed: false,
    maxChoiceCount: 5,
  },
  submissionUrl: "https://myodfw.com/hunting/controlled-hunt-drawing",
  instructions: "Log into ODFW portal at myodfw.com, verify hunting license is on file, navigate to Controlled Hunt Drawing, select species and enter up to 5 controlled hunt codes, confirm preference point preference, then submit $8 application fee.",
  metadata: {
    applicationWindow: { open: "2026-05-01", close: "2026-05-15" },
    drawResultsExpected: "2026-06-20",
    refundPolicy: "Application fee non-refundable. Tag fee charged only upon successful draw.",
    paymentMethods: ["credit_card", "debit_card", "electronic_check"],
    pointType: "preference",
  },
};

// =============================================================================
// All form configs
// =============================================================================

const ALL_FORM_CONFIGS: StateFormConfig[] = [
  CO_FORM,
  WY_FORM,
  MT_FORM,
  AZ_FORM,
  NM_FORM,
  ID_FORM,
  UT_FORM,
  NV_FORM,
  OR_FORM,
];

// =============================================================================
// Seed function
// =============================================================================

export async function seedFormConfigs() {
  console.log("Seeding state form configs...");

  // Build state lookup
  const allStates = await db.select().from(states);
  const stateMap = new Map<string, string>();
  for (const s of allStates) {
    stateMap.set(s.code, s.id);
  }

  const values = [];
  const skipped: string[] = [];

  for (const config of ALL_FORM_CONFIGS) {
    const stateId = stateMap.get(config.stateCode);
    if (!stateId) {
      skipped.push(`State not found: ${config.stateCode}`);
      continue;
    }

    values.push({
      stateId,
      speciesId: null, // state-level form config (not species-specific)
      formType: config.formType,
      year: 2026,
      schema: config.schema,
      fieldMapping: config.fieldMapping,
      validationRules: config.validationRules,
      submissionUrl: config.submissionUrl,
      instructions: config.instructions,
      active: true,
      metadata: config.metadata,
    });
  }

  if (skipped.length > 0) {
    console.log(`  -> Skipped ${skipped.length} entries:`);
    for (const s of skipped) {
      console.log(`     - ${s}`);
    }
  }

  const result = await db
    .insert(stateFormConfigs)
    .values(values)
    .onConflictDoNothing()
    .returning();

  console.log(
    `  -> ${result.length} form config entries inserted (${values.length} resolved from ${ALL_FORM_CONFIGS.length} states)`
  );
}
