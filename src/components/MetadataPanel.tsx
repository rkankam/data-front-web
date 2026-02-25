"use client";

import { useState } from "react";
import Image from "next/image";
import type { QueueTrack } from "@/lib/player/store";
import { CoverImage } from "@/components/CoverImage";

type MetadataPanelProps = {
  track: QueueTrack | null;
  isFavorite: boolean;
};

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  } catch {
    return "N/A";
  }
};

const formatDuration = (seconds?: number | null): string => {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const MetadataPanel = ({ track, isFavorite }: MetadataPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (value: string) => {
    if (typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!track) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/40 backdrop-blur">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-left"
          aria-expanded={isExpanded}
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
            <h3 className="text-lg font-semibold text-white">Meta</h3>
          </div>
        </button>
        <p className="mt-4 text-sm text-neutral-400">Aucune piste sélectionnée.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5 transition"
        aria-expanded={isExpanded}
        aria-label="Metadata panel"
      >
        <div className="flex items-center gap-3">
          <svg 
            className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Meta</h3>
          
          {/* Track Preview in Header */}
          <div className="flex items-center gap-2">
            <CoverImage
              src={track.imageUrl}
              alt={track.title || "Untitled"}
              trackId={track.id}
              title={track.title}
              size="sm"
              className="!rounded-none" // Override default rounded
            />
            <span className="text-sm text-neutral-300 truncate max-w-[150px]">{track.title}</span>
          </div>
        </div>

        {isFavorite && (
          <span className="text-[#1DB954]" aria-label="Favorite">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
        )}
      </button>

      {/* Expandable Content */}
      <div 
        className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-white/5 space-y-4">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Model</p>
              <p className="text-sm text-white mt-1">{track.model ?? "N/A"}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Duration</p>
              <p className="text-sm text-white mt-1">{formatDuration(track.durationSeconds)}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Created</p>
              <p className="text-sm text-white mt-1">{formatDate(track.createdAt)}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Plays</p>
              <p className="text-sm text-white mt-1">{track.stats?.playCount ?? 0}</p>
            </div>
          </div>

          {/* Prompt & Conditions */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">Prompt & Conditions</h4>
              <button 
                onClick={() => copyToClipboard(track.tags.sound ?? "")}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-neutral-300 whitespace-pre-wrap">{track.tags.sound ?? "N/A"}</p>
            
            {track.tags.conditions && track.tags.conditions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Conditions</p>
                <div className="flex flex-wrap gap-1">
                  {track.tags.conditions.map((condition, i) => (
                    <span 
                      key={i} 
                      className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-neutral-300"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Technical Info */}
          <details className="rounded-xl border border-white/10 bg-black/30 p-4">
            <summary className="cursor-pointer text-sm text-neutral-400 hover:text-white transition">
              Technical Details
            </summary>
            <div className="mt-3 space-y-2 text-xs text-neutral-500">
              <p><span className="text-neutral-400">ID:</span> {track.id}</p>
              <p><span className="text-neutral-400">MP3 Key:</span> {track.audio.b2Mp3Key ?? "N/A"}</p>
              <p><span className="text-neutral-400">Public URL:</span> {track.audio.publicUrl ? "Available" : "N/A"}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
