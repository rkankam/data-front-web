import { describe, expect, it } from "vitest";

import { defaultFilters, searchTracks } from "../../src/lib/search/engine";
import type { QueueTrack } from "../../src/lib/player/store";

const trackFactory = (index: number): QueueTrack => ({
  id: `track-${index}`,
  title: `Track ${index} cinematic ambient ${index % 11 === 0 ? "garage" : ""}`,
  durationSeconds: 120 + (index % 400),
  imageUrl: null,
  createdAt: null,
  model: index % 2 === 0 ? "Model A" : "Model B",
  audio: { publicUrl: null, b2Mp3Key: null, b2WavKey: null },
  tags: {
    sound: index % 3 === 0 ? "ambient chill" : "uk garage",
    conditions: ["club", "mellow", `${index}`],
  },
});

describe("search benchmark", () => {
  it("keeps search under 50ms for 800 tracks", () => {
    const tracks = Array.from({ length: 800 }, (_, index) => trackFactory(index));
    const start = performance.now();

    const result = searchTracks(tracks, {
      ...defaultFilters,
      query: "garage",
      models: ["Model A"],
      maxDurationSeconds: 300,
    });

    const duration = performance.now() - start;

    expect(result.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(50);
  });
});
