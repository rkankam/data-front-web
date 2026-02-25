import type { QueueTrack } from "../player/store";

export type SearchFilters = {
  query: string;
  moods: string[];
  models: string[];
  maxDurationSeconds: number | null;
  favoritesOnly: boolean;
  favoriteIds: string[];
};

export const defaultFilters: SearchFilters = {
  query: "",
  moods: [],
  models: [],
  maxDurationSeconds: null,
  favoritesOnly: false,
  favoriteIds: [],
};

const includes = (value: string | null | undefined, query: string) =>
  typeof value === "string" && value.toLowerCase().includes(query);

const scoreTrack = (track: QueueTrack, query: string) => {
  if (!query) {
    return 0;
  }

  let score = 0;
  if (includes(track.title, query)) {
    score += 10;
  }

  if (includes(track.tags.sound, query)) {
    score += 5;
  }

  for (const condition of track.tags.conditions) {
    if (condition.toLowerCase().includes(query)) {
      score += 2;
    }
  }

  return score;
};

const toMoodText = (track: QueueTrack) =>
  `${track.tags.sound ?? ""} ${track.tags.conditions.join(" ")}`.toLowerCase();

const matchesMood = (track: QueueTrack, moods: string[]) => {
  if (moods.length === 0) {
    return true;
  }
  const corpus = toMoodText(track);
  return moods.every((mood) => corpus.includes(mood.toLowerCase()));
};

const matchesModel = (track: QueueTrack, models: string[]) => {
  if (models.length === 0) {
    return true;
  }
  return models.includes(track.model ?? "");
};

const matchesDuration = (track: QueueTrack, maxDurationSeconds: number | null) => {
  if (!maxDurationSeconds) {
    return true;
  }
  return typeof track.durationSeconds === "number" && track.durationSeconds <= maxDurationSeconds;
};

const matchesFavorite = (track: QueueTrack, filters: SearchFilters) => {
  if (!filters.favoritesOnly) {
    return true;
  }
  return filters.favoriteIds.includes(track.id);
};

export const searchTracks = (tracks: QueueTrack[], filters: SearchFilters) => {
  const normalizedQuery = filters.query.trim().toLowerCase();

  const scored = tracks
    .filter((track) => matchesMood(track, filters.moods))
    .filter((track) => matchesModel(track, filters.models))
    .filter((track) => matchesDuration(track, filters.maxDurationSeconds))
    .filter((track) => matchesFavorite(track, filters))
    .map((track) => ({ track, score: scoreTrack(track, normalizedQuery) }))
    .filter(({ score, track }) => {
      if (!normalizedQuery) {
        return true;
      }
      return score > 0 || includes(track.model, normalizedQuery);
    })
    .sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title));

  return scored.map((entry) => entry.track);
};
