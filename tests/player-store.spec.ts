import { describe, expect, it } from "vitest";

import { createPlayerStore, type QueueTrack } from "../src/lib/player/store";

const makeTrack = (id: string): QueueTrack => ({
  id,
  title: `Track ${id}`,
  durationSeconds: 120,
  imageUrl: null,
  createdAt: null,
  model: null,
  audio: { publicUrl: null, b2Mp3Key: `mp3/${id}.mp3`, b2WavKey: null },
  tags: { sound: null, conditions: [] },
});

const createMemoryPersist = () => {
  const db = new Map<string, string>();
  return {
    getItem: (key: string) => db.get(key) ?? null,
    setItem: (key: string, value: string) => db.set(key, value),
    removeItem: (key: string) => db.delete(key),
  };
};

describe("player store", () => {
  it("supports queue actions add next remove reorder clear", () => {
    const store = createPlayerStore();
    store.setQueue([makeTrack("a"), makeTrack("b"), makeTrack("c")]);

    store.play("a");
    store.addNext(makeTrack("d"));
    expect(store.getState().queue.map((track) => track.id)).toEqual(["a", "d", "b", "c"]);

    store.reorder(3, 1);
    expect(store.getState().queue.map((track) => track.id)).toEqual(["a", "c", "d", "b"]);

    store.remove("c");
    expect(store.getState().queue.map((track) => track.id)).toEqual(["a", "d", "b"]);

    store.clear();
    expect(store.getState().queue).toEqual([]);
    expect(store.getState().currentTrackId).toBeNull();
  });

  it("rehydrates from persistence", () => {
    const persist = createMemoryPersist();
    const firstStore = createPlayerStore(persist);
    firstStore.setQueue([makeTrack("x"), makeTrack("y")]);
    firstStore.play("y");

    const secondStore = createPlayerStore(persist);
    secondStore.hydrate();

    expect(secondStore.getState().queue.map((track) => track.id)).toEqual(["x", "y"]);
    expect(secondStore.getState().currentTrackId).toBe("y");
    expect(secondStore.getState().isPlaying).toBe(true);
  });

  it("handles expired URL and invalid track edge cases", () => {
    const store = createPlayerStore();
    store.setQueue([makeTrack("a")]);

    store.play("missing");
    expect(store.getState().playbackError).toBe("Invalid track");
    expect(store.getState().isPlaying).toBe(false);

    store.setPlaybackError("Token expired for signed URL");
    expect(store.getState().playbackError).toBe("Signed URL expired");
    expect(store.getState().isPlaying).toBe(false);
  });

  it("gracefully handles next/prev on empty queue", () => {
    const store = createPlayerStore();

    store.next();
    store.prev();

    expect(store.getState().currentTrackId).toBeNull();
    expect(store.getState().isPlaying).toBe(false);
  });
});
