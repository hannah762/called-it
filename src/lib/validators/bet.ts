import { z } from "zod/v4";

export const createBetSchema = z.object({
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(150, "Question must be under 150 characters"),
  options: z
    .array(
      z.object({
        label: z
          .string()
          .min(1, "Option can't be empty")
          .max(60, "Option must be under 60 characters"),
      })
    )
    .min(2, "Add at least 2 options")
    .max(5, "Maximum 5 custom options"),
  deadline: z.coerce
    .date()
    .refine(
      (date) => date > new Date(Date.now() + 5 * 60 * 1000),
      "Deadline must be at least 5 minutes from now"
    )
    .refine(
      (date) => date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      "Deadline must be within 30 days"
    ),
});

export type CreateBetInput = z.infer<typeof createBetSchema>;

export const placeWagerSchema = z.object({
  optionId: z.string().uuid("Invalid option"),
  amount: z
    .number()
    .int("Must be a whole number")
    .min(1, "Invalid amount"),
});

export type PlaceWagerInput = z.infer<typeof placeWagerSchema>;
