import { z } from "zod";

const idSchema = z
  .string()
  .trim()
  .min(1, "Invalid id.")
  .max(64, "Invalid id.");

const nullableText = (max: number, tooLongMessage: string) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) {
        return null;
      }

      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().max(max, tooLongMessage).nullable(),
  );

const nullableInteger = (
  min: number,
  max: number,
  minMessage: string,
  maxMessage: string,
) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      if (typeof value === "string") {
        return Number(value);
      }

      return value;
    },
    z
      .number()
      .int("Must be a whole number.")
      .min(min, minMessage)
      .max(max, maxMessage)
      .nullable(),
  );

const optionalIdSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  idSchema.optional(),
);

export const clientPayloadSchema = z
  .object({
    name: z.string().trim().min(1, "Client name is required.").max(120, "Client name is too long."),
    engagementType: z.enum(["TIME_BASED", "PROJECT_BASED"]),
    workingDaysPerWeek: nullableInteger(
      1,
      7,
      "Working days must be at least 1.",
      "Working days cannot be more than 7.",
    ),
    workingHoursPerDay: nullableInteger(
      1,
      24,
      "Working hours must be at least 1.",
      "Working hours cannot be more than 24.",
    ),
    notes: nullableText(1000, "Notes are too long."),
  })
  .superRefine((value, context) => {
    if (
      value.engagementType === "TIME_BASED" &&
      (value.workingDaysPerWeek === null || value.workingHoursPerDay === null)
    ) {
      if (value.workingDaysPerWeek === null) {
        context.addIssue({
          code: "custom",
          path: ["workingDaysPerWeek"],
          message: "Working days are required for time based engagement.",
        });
      }

      if (value.workingHoursPerDay === null) {
        context.addIssue({
          code: "custom",
          path: ["workingHoursPerDay"],
          message: "Working hours are required for time based engagement.",
        });
      }
    }
  })
  .transform((value) => {
    if (value.engagementType === "PROJECT_BASED") {
      return {
        ...value,
        workingDaysPerWeek: null,
        workingHoursPerDay: null,
      };
    }

    return value;
  });

export const projectPayloadSchema = z.object({
  clientId: idSchema,
  name: z.string().trim().min(1, "Project name is required.").max(120, "Project name is too long."),
  description: nullableText(1000, "Description is too long."),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]),
});

export const codebasePayloadSchema = z.object({
  projectId: idSchema,
  name: z.string().trim().min(1, "Codebase name is required.").max(120, "Codebase name is too long."),
  type: z.enum(["WEB", "API", "MOBILE_ANDROID", "MOBILE_IOS", "DESKTOP", "INFRA", "OTHER"]),
  description: nullableText(1000, "Description is too long."),
});

export const linkPayloadSchema = z.object({
  projectId: idSchema,
  codebaseId: optionalIdSchema.nullable().transform((value) => value ?? null),
  title: z.string().trim().min(1, "Link title is required.").max(160, "Link title is too long."),
  url: z
    .string()
    .trim()
    .min(1, "Link URL is required.")
    .url("Enter a valid URL including http:// or https://.")
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Only http:// or https:// URLs are allowed."),
  category: z.enum([
    "REPOSITORY",
    "SERVER",
    "COMMUNICATION",
    "DOCUMENTATION",
    "DESIGN",
    "TRACKING",
    "OTHER",
  ]),
  notes: nullableText(1000, "Notes are too long."),
});

export const resourceIdParamsSchema = z.object({
  id: idSchema,
});

export const projectListFiltersSchema = z.object({
  clientId: optionalIdSchema,
});

export const codebaseListFiltersSchema = z.object({
  projectId: optionalIdSchema,
});

export const linkListFiltersSchema = z.object({
  projectId: optionalIdSchema,
  codebaseId: optionalIdSchema,
});
