export type QueueTrack = {
  id: string;
  title: string;
  durationSeconds: number | null;
  imageUrl: string | null;
  createdAt: string | null;
  model: string | null;
  audio: {
    publicUrl: string | null;
    b2Mp3Key: string | null;
    b2WavKey: string | null;
  };
  tags: {
    sound: string | null;
    conditions: string[];
  };
  stats?: {
    playCount?: number;
    favoriteCount?: number;
    isFavorite?: boolean;
  };
};

export type PlayerState = {
  currentTrackId: string | null;
  queue: QueueTrack[];
  isPlaying: boolean;
  playbackError: string | null;
};

export type PlayerStore = {
  getState: () => PlayerState;
  subscribe: (listener: () => void) => () => void;
  setQueue: (tracks: QueueTrack[]) => void;
  addNext: (track: QueueTrack) => void;
  remove: (trackId: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  clear: () => void;
  play: (trackId?: string) => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  setPlaybackError: (message: string | null) => void;
  hydrate: () => void;
};

type PersistAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const PERSIST_KEY = "rxlab-player-state-v1";

const defaultState = (): PlayerState => ({
  currentTrackId: null,
  queue: [],
  isPlaying: false,
  playbackError: null,
});

const sanitizeState = (input: unknown): PlayerState => {
  if (!input || typeof input !== "object") {
    return defaultState();
  }

  const value = input as Partial<PlayerState>;
  const queue = Array.isArray(value.queue) ? value.queue : [];
  const currentTrackId =
    typeof value.currentTrackId === "string" && queue.some((track) => track.id === value.currentTrackId)
      ? value.currentTrackId
      : queue[0]?.id ?? null;

  return {
    currentTrackId,
    queue,
    isPlaying: Boolean(value.isPlaying),
    playbackError: typeof value.playbackError === "string" ? value.playbackError : null,
  };
};

export const createPlayerStore = (persist?: PersistAdapter): PlayerStore => {
  let state = defaultState();
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const persistState = () => {
    if (!persist) {
      return;
    }
    persist.setItem(PERSIST_KEY, JSON.stringify(state));
  };

  const setState = (next: PlayerState) => {
    state = next;
    persistState();
    notify();
  };

  const getCurrentIndex = () => {
    if (!state.currentTrackId) {
      return -1;
    }
    return state.queue.findIndex((track) => track.id === state.currentTrackId);
  };

  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setQueue: (tracks: QueueTrack[]) => {
      const unique = tracks.filter(
        (track, index) => tracks.findIndex((candidate) => candidate.id === track.id) === index
      );
      setState({
        ...state,
        queue: unique,
        currentTrackId: unique[0]?.id ?? null,
        playbackError: null,
      });
    },
    addNext: (track: QueueTrack) => {
      const currentIndex = getCurrentIndex();
      const withoutDuplicate = state.queue.filter((item) => item.id !== track.id);
      const insertionIndex = currentIndex < 0 ? 0 : currentIndex + 1;
      withoutDuplicate.splice(insertionIndex, 0, track);
      setState({
        ...state,
        queue: withoutDuplicate,
        currentTrackId: state.currentTrackId ?? track.id,
      });
    },
    remove: (trackId: string) => {
      const queue = state.queue.filter((track) => track.id !== trackId);
      const currentTrackId = state.currentTrackId === trackId ? queue[0]?.id ?? null : state.currentTrackId;
      setState({ ...state, queue, currentTrackId });
    },
    reorder: (fromIndex: number, toIndex: number) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.queue.length ||
        toIndex >= state.queue.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      const queue = [...state.queue];
      const [moved] = queue.splice(fromIndex, 1);
      queue.splice(toIndex, 0, moved);
      setState({ ...state, queue });
    },
    clear: () => {
      if (persist) {
        persist.removeItem(PERSIST_KEY);
      }
      state = defaultState();
      notify();
    },
    play: (trackId?: string) => {
      const nextTrackId = trackId ?? state.currentTrackId ?? state.queue[0]?.id ?? null;
      if (!nextTrackId || !state.queue.some((track) => track.id === nextTrackId)) {
        setState({ ...state, isPlaying: false, playbackError: "Invalid track" });
        return;
      }
      setState({ ...state, currentTrackId: nextTrackId, isPlaying: true, playbackError: null });
    },
    pause: () => {
      setState({ ...state, isPlaying: false });
    },
    next: () => {
      const currentIndex = getCurrentIndex();
      if (currentIndex < 0 || currentIndex + 1 >= state.queue.length) {
        setState({ ...state, isPlaying: false });
        return;
      }
      setState({ ...state, currentTrackId: state.queue[currentIndex + 1].id, isPlaying: true });
    },
    prev: () => {
      const currentIndex = getCurrentIndex();
      if (currentIndex <= 0) {
        setState({ ...state, isPlaying: false });
        return;
      }
      setState({ ...state, currentTrackId: state.queue[currentIndex - 1].id, isPlaying: true });
    },
    setPlaybackError: (message: string | null) => {
      const normalized = message?.toLowerCase().includes("expired")
        ? "Signed URL expired"
        : message;
      setState({ ...state, playbackError: normalized ?? null, isPlaying: false });
    },
    hydrate: () => {
      if (!persist) {
        return;
      }
      const value = persist.getItem(PERSIST_KEY);
      if (!value) {
        return;
      }
      try {
        const parsed = JSON.parse(value) as unknown;
        state = sanitizeState(parsed);
        notify();
      } catch {
        persist.removeItem(PERSIST_KEY);
        state = defaultState();
        notify();
      }
    },
  };
};

const getBrowserPersist = (): PersistAdapter | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage;
};

export const playerStore = createPlayerStore(getBrowserPersist());
