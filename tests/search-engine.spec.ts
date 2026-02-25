import { describe, expect, it } from "vitest";

import { defaultFilters, searchTracks } from "../src/lib/search/engine";
import type { QueueTrack } from "../src/lib/player/store";

const makeTrack = (
  id: string,
  title: string,
  model: string,
  sound: string,
  conditions: string[],
  durationSeconds = 120
): QueueTrack => ({
  id,
  title,
  durationSeconds,
  imageUrl: null,
  createdAt: null,
  model,
  audio: { publicUrl: null, b2Mp3Key: null, b2WavKey: null },
  tags: { sound, conditions },
});

describe("searchTracks", () => {
  const tracks = [
    makeTrack("1", "Jazz Night", "Model A", "jazzy lo-fi", ["saxophone", "mellow"], 180),
    makeTrack("2", "Ambient Pulse", "Model B", "ambient chill", ["pads", "drone"], 260),
    makeTrack("3", "Garage Rush", "Model A", "uk garage", ["2-step", "club"], 210),
  ];

  it("ranks title matches above sound and conditions", () => {
    const result = searchTracks(tracks, { ...defaultFilters, query: "jazz" });
    expect(result[0]?.id).toBe("1");
  });

  it("supports combinable filters", () => {
    const result = searchTracks(tracks, {
      ...defaultFilters,
      moods: ["club"],
      models: ["Model A"],
      maxDurationSeconds: 240,
    });
    expect(result.map((track) => track.id)).toEqual(["3"]);
  });

  it("supports favorites only mode", () => {
    const result = searchTracks(tracks, {
      ...defaultFilters,
      favoritesOnly: true,
      favoriteIds: ["2"],
    });
    expect(result.map((track) => track.id)).toEqual(["2"]);
  });
});
