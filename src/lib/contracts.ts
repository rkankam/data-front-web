import { z } from "zod";

export const catalogMetaSchema = z.object({
  generatedAt: z.string().datetime({ offset: true }),
  bucket: z.string().min(1),
  sourcePrefix: z.string().min(1),
  count: z.number().int().nonnegative(),
  version: z.number().int().positive(),
});

export const catalogLiteTrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  durationSeconds: z.number().nonnegative().nullable(),
  audioUrl: z.string().url().nullable(),
  imageUrl: z.string().url().nullable(),
});

export const catalogFullTrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  durationSeconds: z.number().nonnegative().nullable(),
  audio: z.object({
    publicUrl: z.string().url().nullable(),
    b2WavKey: z.string().nullable(),
    b2Mp3Key: z.string().nullable(),
  }),
  imageUrl: z.string().url().nullable(),
  createdAt: z.string().datetime({ offset: true }).nullable(),
  model: z.string().nullable(),
  stats: z.object({
    playCount: z.number().int().nonnegative().nullable(),
    favoriteCount: z.number().int().nonnegative().nullable(),
    isFavorite: z.boolean().nullable(),
  }),
  privacy: z.object({
    privacy: z.string().nullable(),
    allowPublicUse: z.boolean().nullable(),
    canUse: z.boolean().nullable(),
  }),
  tags: z.object({
    sound: z.string().nullable(),
    conditions: z.array(z.string()),
  }),
  source: z.object({
    metadataKey: z.string().min(1),
    filename: z.string().min(1),
  }),
});

export const catalogLiteSchema = z.object({
  meta: catalogMetaSchema,
  tracks: z.array(catalogLiteTrackSchema),
});

export const catalogFullSchema = z.object({
  meta: catalogMetaSchema,
  tracks: z.array(catalogFullTrackSchema),
});

export const signUrlSuccessSchema = z.object({
  url: z.string().url(),
  expiresIn: z.number().int().positive(),
  file: z.string().min(1),
});

export const apiErrorSchema = z.object({
  error: z.string().min(1),
});

export type CatalogMeta = z.infer<typeof catalogMetaSchema>;
export type CatalogLiteTrack = z.infer<typeof catalogLiteTrackSchema>;
export type CatalogFullTrack = z.infer<typeof catalogFullTrackSchema>;
export type CatalogLite = z.infer<typeof catalogLiteSchema>;
export type CatalogFull = z.infer<typeof catalogFullSchema>;
export type SignUrlSuccess = z.infer<typeof signUrlSuccessSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
