"use client";

import Image from "next/image";
import { CoverImage } from "@/components/CoverImage";
import type { QueueTrack } from "@/lib/player/store";

type TrackRowProps = {
  track: QueueTrack;
  active: boolean;
  onSelect: () => void;
  onAddNext: () => void;
  durationLabel: string;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  } catch {
    return "";
  }
};

export const TrackRow = ({ track, active, onSelect, onAddNext, durationLabel }: TrackRowProps) => {
  return (
    <div
      className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2 transition-all ${
        active 
          ? "border-cyan-400/70 bg-cyan-400/10 shadow-lg shadow-cyan-400/10" 
          : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/40"
      }`}
      role="listitem"
    >
      {/* Cover Art */}
      <button
        onClick={onSelect}
        className="shrink-0 relative"
        aria-label={`Play ${track.title}`}
      >
        <CoverImage
          src={track.imageUrl}
          alt={track.title || "Untitled"}
          trackId={track.id}
          title={track.title}
          size="md"
          className="transition-transform group-hover:scale-105"
        />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-md">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </button>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${active ? "text-cyan-300" : "text-white"}`}>
          {track.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          {track.model && (
            <span className="truncate max-w-[120px]">{track.model}</span>
          )}
          {track.model && track.createdAt && <span>•</span>}
          {track.createdAt && (
            <span className="text-neutral-500">{formatDate(track.createdAt)}</span>
          )}
        </div>
      </div>

      {/* Actions - visible on hover */}
      <button
        className="shrink-0 rounded-full border border-lime-300/50 px-3 py-1 text-xs text-lime-200 opacity-0 group-hover:opacity-100 hover:bg-lime-200/10 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onAddNext();
        }}
        aria-label={`Add ${track.title} next`}
      >
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Add
        </span>
      </button>

      {/* Duration */}
      <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-xs text-neutral-400">
        {durationLabel}
      </span>
    </div>
  );
};
