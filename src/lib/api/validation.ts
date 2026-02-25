import { z } from "zod";

const allowedPrefixes = ["audio/", "mp3/", "index/", "metadata/"];

const isAllowedPrefix = (fileName: string) =>
  allowedPrefixes.some((prefix) => fileName.startsWith(prefix));

export const signQuerySchema = z.object({
  file: z.string().min(1, "Missing file query param").refine(isAllowedPrefix, "File not allowed"),
  expiresIn: z
    .coerce
    .number()
    .int()
    .min(60)
    .max(3600)
    .optional()
    .default(900),
});

export const catalogQuerySchema = z.object({
  file: z.string().min(1).default("index/catalog-lite.json").refine((value) => value.startsWith("index/"), "File not allowed"),
});
