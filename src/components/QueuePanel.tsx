"use client";

import { useState } from "react";
import Image from "next/image";
import type { QueueTrack } from "@/lib/player/store";

type QueuePanelProps = {
  queue: QueueTrack[];
  currentTrackId: string | null;
  onSelect: (trackId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (trackId: string) => void;
  onClear: () => void;
};

const formatDuration = (seconds?: number | null): string => {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const QueuePanel = ({
  queue,
  currentTrackId,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
  onClear,
}: QueuePanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5 transition"
        aria-expanded={isExpanded}
        aria-label="Queue panel"
      >
        <div className="flex items-center gap-2">
          <svg 
            className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Queue</h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-neutral-300">
            {queue.length}
          </span>
        </div>
      </button>

      {queue.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="mr-4 rounded-full border border-white/20 px-3 py-1 text-xs text-neutral-300 hover:bg-white/10 transition"
          aria-label="Clear queue"
        >
          Clear
        </button>
      )}

      {/* Expandable Content */}

      {/* Expandable Content */}
      <div 
        className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-white/5">
          {queue.length === 0 ? (
            <p className="py-4 text-sm text-neutral-400 text-center">Queue vide</p>
          ) : (
            <ul className="space-y-1 max-h-80 overflow-y-auto" role="list" aria-label="Playback queue">
              {queue.map((track, index) => {
                const isCurrent = currentTrackId === track.id;
                return (
                  <li 
                    key={track.id} 
                    className={`flex items-center gap-2 rounded-lg px-2 py-2 transition ${
                      isCurrent 
                        ? 'bg-cyan-400/10 border border-cyan-400/30' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {/* Playing Indicator */}
                    <div className="w-6 flex justify-center">
                      {isCurrent ? (
                        <div className="flex gap-0.5 items-end h-4">
                          <span className="w-1 bg-cyan-400 animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                          <span className="w-1 bg-cyan-400 animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                          <span className="w-1 bg-cyan-400 animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500">{index + 1}</span>
                      )}
                    </div>

                    {/* Cover Art Thumbnail */}
                    <div className="w-8 h-8 rounded overflow-hidden bg-white/10 shrink-0">
                      {track.imageUrl ? (
                        <Image 
                          src={track.imageUrl} 
                          alt="" 
                          width={32} 
                          height={32} 
                          className="w-full h-full object-cover"
                          unoptimized 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Track Info */}
                    <button
                      onClick={() => onSelect(track.id)}
                      className={`flex-1 text-left min-w-0 truncate text-sm ${
                        isCurrent ? "text-cyan-300 font-medium" : "text-neutral-200"
                      }`}
                      aria-label={`Select ${track.title} from queue`}
                    >
                      <span className="truncate block">{track.title}</span>
                    </button>

                    {/* Duration */}
                    <span className="text-xs text-neutral-500 shrink-0">
                      {formatDuration(track.durationSeconds)}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onMoveUp(index)} 
                        disabled={index === 0}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move up"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 14l5-5 5 5z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onMoveDown(index)} 
                        disabled={index === queue.length - 1}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move down"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 10l5 5 5-5z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onRemove(track.id)} 
                        className="p-1 text-neutral-400 hover:text-red-400"
                        aria-label="Remove from queue"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
