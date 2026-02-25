import { useState } from "react";

type CoverArtPlaceholderProps = {
  title?: string | null;
  trackId: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

// Generate deterministic color based on track ID
const getPlaceholderColor = (trackId: string): string => {
  const hash = trackId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Spotify-inspired color palette
  const colors = [
    "#1DB954", // Spotify Green
    "#E91429", // Red
    "#E91E63", // Pink
    "#9C27B0", // Purple
    "#673AB7", // Deep Purple
    "#3F51B5", // Indigo
    "#2196F3", // Blue
    "#03A9F4", // Light Blue
    "#00BCD4", // Cyan
    "#009688", // Teal
    "#4CAF50", // Green
    "#8BC34A", // Light Green
    "#CDDC39", // Lime
    "#FFEB3B", // Yellow
    "#FFC107", // Amber
    "#FF9800", // Orange
    "#FF5722", // Deep Orange
    "#795548", // Brown
    "#607D8B", // Blue Grey
    "#E91E63", // Pink duplicate
  ];

  return colors[hash % colors.length];
};

// Extract initials from title
const getInitials = (title?: string | null): string => {
  if (!title) return "??";

  // Remove common prefixes and clean
  const cleanTitle = title
    .replace(/^(the|a|an|le|la|les|un|une|des)\s+/i, "")
    .trim();

  if (!cleanTitle) return "??";

  const words = cleanTitle.split(/\s+/).filter(w => w.length > 0);
  const initials = words.slice(0, 2).map(w => w[0]).join("");

  return initials.length > 0 ? initials.toUpperCase() : "??";
};

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-base",
  xl: "w-24 h-24 text-xl",
};

export const CoverArtPlaceholder = ({
  title,
  trackId,
  size = "md",
  className = "",
}: CoverArtPlaceholderProps) => {
  const bgColor = getPlaceholderColor(trackId);
  const initials = getInitials(title);
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`${sizeClass} ${className} flex items-center justify-center rounded-md font-semibold text-white shadow-lg select-none`}
      style={{ backgroundColor: bgColor }}
      title={title || "Untitled"}
    >
      <span className="tracking-wide">{initials}</span>
    </div>
  );
};
