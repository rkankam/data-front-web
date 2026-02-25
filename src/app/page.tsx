"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Sora } from "next/font/google";

import { MetadataPanel } from "@/components/MetadataPanel";
import { QueuePanel } from "@/components/QueuePanel";
import { SearchBar } from "@/components/SearchBar";
import { StickyPlayer } from "@/components/StickyPlayer";
import { TrackRow } from "@/components/TrackRow";
import { endTimer, recordMetric, startTimer } from "@/lib/observability/metrics";
import { playerStore, type QueueTrack } from "@/lib/player/store";
import { defaultFilters, searchTracks } from "@/lib/search/engine";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type CatalogResponse = {
  tracks: QueueTrack[];
};

type SortOption = "newest" | "oldest" | "az" | "duration";

const formatDuration = (value?: number | null) => {
  if (!value || Number.isNaN(value)) return "--:--";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const keyModes = {
  ArrowDown: 1,
  ArrowUp: -1,
} as const;

// Skeleton component for loading state
const TrackRowSkeleton = () => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 animate-pulse">
    <div className="h-12 w-12 rounded-lg bg-white/10" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-3/4 rounded bg-white/10" />
      <div className="h-3 w-1/2 rounded bg-white/10" />
    </div>
    <div className="h-6 w-12 rounded-full bg-white/10" />
  </div>
);

export default function Home() {
  const [filters, setFilters] = useState(defaultFilters);
  const [tracks, setTracks] = useState<QueueTrack[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showMetadata, setShowMetadata] = useState(false);
  const [showMetadataPanel, setShowMetadataPanel] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [playerState, setPlayerState] = useState(playerStore.getState());

  // Set page title
  useEffect(() => {
    document.title = "Capsule Radio";
  }, []);

  useEffect(() => {
    playerStore.hydrate();
    setPlayerState(playerStore.getState());
    return playerStore.subscribe(() => {
      setPlayerState(playerStore.getState());
    });
  }, []);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const timer = startTimer();
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/catalog?file=index/catalog.json");
        if (!response.ok) {
          throw new Error(`Catalog error: ${response.status}`);
        }
        const data = (await response.json()) as CatalogResponse;
        const loaded = data.tracks ?? [];
        setTracks(loaded);
        setSelectedId(loaded[0]?.id ?? null);
        playerStore.setQueue(loaded);
        recordMetric({ name: "time_to_first_play_ready_ms", value: endTimer(timer), tags: { source: "catalog" } });
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Unknown catalog error");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedId) ?? null,
    [tracks, selectedId]
  );

  // Sort and filter tracks
  const sortedTracks = useMemo(() => {
    const sorted = [...tracks].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        case "oldest":
          return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
        case "az":
          return (a.title ?? "").localeCompare(b.title ?? "");
        case "duration":
          return (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0);
        default:
          return 0;
      }
    });
    return sorted;
  }, [tracks, sortBy]);

  const visibleTracks = useMemo(
    () => {
      const timer = startTimer();
      const result = searchTracks(sortedTracks, {
        ...filters,
        favoriteIds,
      });
      recordMetric({ name: "search_latency_ms", value: endTimer(timer), tags: { query: filters.query || "_empty" } });
      return result;
    },
    [filters, sortedTracks, favoriteIds]
  );

  useEffect(() => {
    const resolve = async () => {
      if (!selectedTrack?.audio.b2Mp3Key) {
        setPlayUrl(selectedTrack?.audio.publicUrl ?? null);
        return;
      }

      try {
        const response = await fetch(
          `/api/b2/sign?file=${encodeURIComponent(selectedTrack.audio.b2Mp3Key)}`
        );
        if (!response.ok) {
          throw new Error(`Sign error: ${response.status}`);
        }
        const data = (await response.json()) as { url?: string };
        setPlayUrl(data.url ?? selectedTrack.audio.publicUrl ?? null);
      } catch {
        recordMetric({ name: "signing_error_count", value: 1, tags: { route: "/api/b2/sign" } });
        playerStore.setPlaybackError("Signed URL expired");
        setPlayUrl(selectedTrack.audio.publicUrl ?? null);
      }
    };

    resolve();
  }, [selectedTrack]);

  const onToggleFavorite = () => {
    if (!selectedTrack) {
      return;
    }
    setFavoriteIds((current) =>
      current.includes(selectedTrack.id)
        ? current.filter((id) => id !== selectedTrack.id)
        : [...current, selectedTrack.id]
    );
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = keyModes[event.key as keyof typeof keyModes];
    if (!delta) {
      if (event.key === "Enter" && selectedId) {
        playerStore.play(selectedId);
      }
      return;
    }
    event.preventDefault();
    const index = visibleTracks.findIndex((track) => track.id === selectedId);
    const nextIndex = Math.max(0, Math.min(visibleTracks.length - 1, index + delta));
    setSelectedId(visibleTracks[nextIndex]?.id ?? selectedId);
  };

  return (
    <div className={`${sora.className} min-h-screen bg-[#121212] pb-36 text-white`}>
      <main className="relative" aria-label="Music library">
        <div className="absolute inset-0 bg-[#121212]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 md:px-6 pb-16 pt-6 md:pt-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">RxLab Dataset Player</p>
              <h1 className="text-2xl md:text-4xl font-semibold">Capsule Radio</h1>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-neutral-300">
              {isLoading ? "Loading..." : `${tracks.length} tracks`}
            </div>
          </header>

          {/* Main Content: Library + Metadata */}
          <div className="flex flex-col md:flex-row lg:flex-row gap-6">
            {/* Library Panel - Full width on mobile, flex-1 on desktop */}
            <div className="flex-1 min-w-0">
              <section className="rounded-3xl border border-white/10 bg-[#181818] p-4 md:p-6 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="flex flex-col md:flex-row md:flex-wrap items-start md:items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Library</h2>
                  <SearchBar
                    value={filters.query}
                    onChange={(value) => setFilters((current) => ({ ...current, query: value }))}
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Sort tracks by"
                    className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-neutral-300 focus:outline-none focus:border-[#1DB954]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z</option>
                    <option value="duration">Duration</option>
                  </select>

                  {/* Tablet Metadata Toggle */}
                  <button
                    onClick={() => setShowMetadataPanel(!showMetadataPanel)}
                    className={`hidden md:flex lg:hidden items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition ${
                      showMetadataPanel
                        ? 'bg-[#1DB954] text-white'
                        : 'bg-[#282828] text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                    aria-label={showMetadataPanel ? 'Hide metadata' : 'Show metadata'}
                    aria-expanded={showMetadataPanel}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showMetadataPanel ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      )}
                    </svg>
                  </button>

                </div>

                <div
                  className="mt-4 md:mt-6 max-h-[50vh] lg:max-h-[60vh] space-y-2 overflow-auto pr-1 focus:outline-none"
                  role="list"
                  tabIndex={0}
                  onKeyDown={onListKeyDown}
                  aria-label="Track list"
                >
                  {isLoading && (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <TrackRowSkeleton key={i} />
                      ))}
                    </div>
                  )}
                  {error && (
                    <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
                      {error}
                    </div>
                  )}
                  {!isLoading && !error && visibleTracks.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                      No results found.
                    </div>
                  )}

                  {!isLoading && !error && visibleTracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      active={selectedId === track.id}
                      onSelect={() => {
                        setSelectedId(track.id);
                        playerStore.play(track.id);
                      }}
                      onAddNext={() => playerStore.addNext(track)}
                      durationLabel={formatDuration(track.durationSeconds)}
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* Metadata Panel - Hidden on mobile (use modal), visible on desktop lg, collapsible on tablet */}
            <div className={`hidden md:flex flex-col gap-4 transition-all duration-300 ${
              showMetadataPanel ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden'
            } lg:!w-72 lg:!opacity-100 shrink-0`}>
              {showMetadataPanel && (
                <MetadataPanel
                  track={selectedTrack}
                  isFavorite={selectedTrack ? favoriteIds.includes(selectedTrack.id) : false}
                />
              )}
            </div>


          </div>

          {/* Close inner div and main */}
        </div>
      </main>


      <StickyPlayer
        title={selectedTrack?.title ?? "Select a track"}
        src={playUrl}
        isPlaying={playerState.isPlaying}
        duration={selectedTrack?.durationSeconds ?? 0}
        queue={playerState.queue}
        currentTrackId={playerState.currentTrackId}
        isFavorite={selectedTrack ? favoriteIds.includes(selectedTrack.id) : false}
        onToggleFavorite={onToggleFavorite}
        showMetadataButton={!!selectedTrack}
        onToggleMetadata={() => setShowMetadata(true)}
        onSelectFromQueue={(trackId) => {
          setSelectedId(trackId);
          playerStore.play(trackId);
        }}
        onTogglePlay={() => {
          if (playerState.isPlaying) {
            playerStore.pause();
          } else {
            playerStore.play(selectedId ?? undefined);
          }
        }}
        onPrev={() => {
          playerStore.prev();
          setSelectedId(playerStore.getState().currentTrackId);
        }}
        onNext={() => {
          playerStore.next();
          setSelectedId(playerStore.getState().currentTrackId);
        }}
        onAudioError={(message) => playerStore.setPlaybackError(message)}
      />

      {/* Mobile Metadata Modal */}
      {showMetadata && selectedTrack && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-end lg:hidden"
          onClick={() => setShowMetadata(false)}
        >
          <div 
            className="w-full bg-[#181818] rounded-t-3xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#181818] p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Track Details</h3>
              <button 
                onClick={() => setShowMetadata(false)}
                className="p-2 rounded-full hover:bg-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <MetadataPanel track={selectedTrack} isFavorite={favoriteIds.includes(selectedTrack.id)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
