import { z } from "zod";

// ============================================================================
// Common schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const stateCodeSchema = z
  .string()
  .length(2)
  .toUpperCase()
  .refine(
    (code) =>
      [
        "CO", "WY", "MT", "ID", "NM", "AZ", "UT", "NV", "OR", "WA", "CA",
      ].includes(code),
    { message: "Unsupported state code" }
  );

// ============================================================================
// User schemas
// ============================================================================

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  experienceLevel: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
});

export const hunterPreferencesSchema = z.object({
  targetSpecies: z.array(z.string()).default([]),
  targetStates: z.array(stateCodeSchema).default([]),
  weaponTypes: z
    .array(z.enum(["rifle", "archery", "muzzleloader", "shotgun", "any"]))
    .default([]),
  huntStyles: z.array(z.string()).default([]),
  physicalFitness: z.string().max(50).nullable().optional(),
  maxTravelDistance: z.number().int().positive().nullable().optional(),
  budgetRange: z
    .object({
      min: z.number().nonnegative(),
      max: z.number().positive(),
    })
    .nullable()
    .optional(),
  willingnessToWait: z.number().int().min(0).max(20).nullable().optional(),
  preferPublicLand: z.boolean().default(true),
});

// ============================================================================
// Point holdings schemas
// ============================================================================

export const pointHoldingSchema = z.object({
  stateCode: stateCodeSchema,
  species: z.string().min(1).max(100),
  pointType: z.enum(["preference", "bonus", "loyalty"]),
  points: z.number().int().nonnegative(),
  asOfYear: z.number().int().min(2000).max(2100),
});

// ============================================================================
// Search schemas
// ============================================================================

export const searchSchema = z.object({
  q: z.string().min(1).max(500),
  type: z.enum(["units", "species", "states", "all"]).default("all"),
  state: stateCodeSchema.optional(),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

// ============================================================================
// Chat schemas
// ============================================================================

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(10000),
  conversationId: z.string().uuid().optional(),
});

// ============================================================================
// Type exports
// ============================================================================

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type HunterPreferencesInput = z.infer<typeof hunterPreferencesSchema>;
export type PointHoldingInput = z.infer<typeof pointHoldingSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
