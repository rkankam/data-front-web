"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { QueueTrack } from "@/lib/player/store";
import { CoverImage } from "@/components/CoverImage";

type StickyPlayerProps = {
  title: string;
  src: string | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onAudioError: (message: string) => void;
  duration?: number;
  queue?: QueueTrack[];
  currentTrackId?: string | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onSelectFromQueue?: (trackId: string) => void;
  onToggleMetadata?: () => void;
  showMetadataButton?: boolean;
}
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDuration = (seconds?: number | null): string => {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Spotify Green accent color
const SPOTIFY_GREEN = "#1DB954";

export const StickyPlayer = ({
  title,
  src,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onAudioError,
  duration = 0,
  queue = [],
  currentTrackId,
  isFavorite = false,
  onToggleFavorite,
  onSelectFromQueue,
  onToggleMetadata,
  showMetadataButton = false,
}: StickyPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolume, setShowVolume] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");

  // Handle play/pause state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => onAudioError("Playback failed"));
    } else {
      audio.pause();
    }
  }, [isPlaying, onAudioError]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          onTogglePlay();
          break;
        case "ArrowLeft":
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
          }
          break;
        case "ArrowRight":
          if (audioRef.current) {
            audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duration, onTogglePlay]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setIsLoaded(true);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle seek during drag
  const handleSeek = (clientX: number) => {
    if (!audioRef.current || duration === 0) return;
    const progressBar = document.querySelector('[role="slider"]') as HTMLDivElement;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Start drag
  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleSeek(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const cycleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === "none") return "all";
      if (prev === "all") return "one";
      return "none";
    });
  };

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#181818]">
      {/* Progress Bar */}
      <div
        className="h-1 w-full bg-white/10 cursor-pointer group"
        onClick={handleProgressClick}
        onMouseDown={handleProgressDrag}
        role="slider"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
      >
        <div
          className="h-full transition-all relative"
          style={{
            width: `${progress}%`,
            backgroundColor: SPOTIFY_GREEN
          }}
        >
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
        {/* Track Info - Left */}
        <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[30%]">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-white/10 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex gap-0.5 items-end h-8">
                <span className="w-1 bg-white animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                <span className="w-1 bg-white animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                <span className="w-1 bg-white animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
              </div>
            ) : (
              <svg className="w-8 h-8 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate hover:underline cursor-pointer">{title}</p>
            <p className="text-xs text-neutral-400">
              {isLoaded ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "Loading..."}
            </p>
          </div>
          
          {/* Heart Button */}
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className="p-2 hover:scale-110 transition"
              aria-label={isFavorite ? "Remove from liked" : "Add to liked"
              }
            >
              <svg 
                className="w-5 h-5" 
                fill={isFavorite ? SPOTIFY_GREEN : "none"} 
                stroke={isFavorite ? SPOTIFY_GREEN : "currentColor"} 
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          )}
        </div>

        {/* Controls - Center */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="flex items-center gap-3">
            {/* Shuffle */}
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              className={`p-2 rounded-full hover:bg-white/10 transition ${isShuffled ? 'text-[#1DB954]' : 'text-neutral-400'}`}
              aria-label="Shuffle"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
            </button>

            {/* Previous */}
            <button
              onClick={onPrev}
              className="p-2 rounded-full hover:bg-white/10 transition text-neutral-300 hover:text-white"
              aria-label="Previous track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              className="p-3 rounded-full bg-white text-neutral-950 hover:scale-105 transition shadow-lg"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              className="p-2 rounded-full hover:bg-white/10 transition text-neutral-300 hover:text-white"
              aria-label="Next track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Repeat */}
            <button
              onClick={cycleRepeat}
              className={`p-2 rounded-full hover:bg-white/10 transition ${repeatMode !== 'none' ? 'text-[#1DB954]' : 'text-neutral-400'}`}
              aria-label="Repeat"
            >
              {repeatMode === "one" ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                </svg>
              )}
            </button>

            {/* Metadata Button - Mobile only */}
            {showMetadataButton && (
              <button
                onClick={onToggleMetadata}
                className="p-2 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white lg:hidden"
                aria-label="Track details"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
                </svg>
              </button>
            )}

            {/* Queue Button */}
          </div>
        </div>

        {/* Volume & Queue - Right */}
        <div className="flex items-center gap-2 flex-1 justify-end max-w-[30%]">
          {/* Queue Button */}
          <div className="relative">
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`p-2 rounded-full hover:bg-white/10 transition ${showQueue ? 'text-white' : 'text-neutral-400'}`}
              aria-label="Queue"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
              </svg>
            </button>

            {/* Queue Dropdown */}
            {showQueue && (
              <div className="absolute bottom-full right-0 mb-2 w-80 bg-[#282828] rounded-lg shadow-xl border border-white/10 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white">Queue</h3>
                  <p className="text-xs text-neutral-400">{queue.length} tracks</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {queue.length === 0 ? (
                    <p className="p-4 text-sm text-neutral-400 text-center">Queue is empty</p>
                  ) : (
                    queue.map((track, index) => {
                      const isCurrent = track.id === currentTrackId;
                      return (
                        <button
                          key={track.id}
                          onClick={() => {
                            onSelectFromQueue?.(track.id);
                            setShowQueue(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 hover:bg-white/10 transition text-left ${
                            isCurrent ? 'bg-white/10' : ''
                          }`}
                        >
                          <span className="text-xs text-neutral-500 w-4">{index + 1}</span>
                          <CoverImage
                            src={track.imageUrl}
                            alt={track.title || "Untitled"}
                            trackId={track.id}
                            title={track.title}
                            size="sm"
                            className="shrink-0 !rounded-none"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>{track.title}</p>
                            <p className="text-xs text-neutral-400 truncate">{track.model}</p>
                          </div>
                          <span className="text-xs text-neutral-500">{formatDuration(track.durationSeconds)}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Volume */}
          <div 
            className="relative flex items-center"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <button
              className="p-2 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white"
              aria-label="Volume"
            >
              {volume === 0 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : volume < 0.5 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 9v6h4l5 5V4L9 9H5zm11.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>

            <div 
              className={`absolute bottom-full right-0 mb-2 p-2 bg-[#282828] rounded-lg border border-white/10 transition-opacity ${
                showVolume ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                aria-label="Volume slider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={src ?? undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => onAudioError("Audio load error")}
        onEnded={onNext}
        preload="metadata"
      />
    </footer>
  );
};
