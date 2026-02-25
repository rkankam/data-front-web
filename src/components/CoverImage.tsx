import { useState } from "react";
import Image from "next/image";
import { CoverArtPlaceholder } from "./CoverArtPlaceholder";

type CoverImageProps = {
  src?: string | null;
  alt: string;
  trackId: string;
  title?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  unoptimized?: boolean;
};

/**
 * Smart cover image component with fallback to placeholder
 * Attempts to load image, falls back to placeholder on error
 */
export const CoverImage = ({
  src,
  alt,
  trackId,
  title,
  size = "md",
  className = "",
  unoptimized = false,
}: CoverImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(!!src);

  // Don't try to load if no source or already errored
  const shouldShowImage = src && !imageError && imageLoaded;

  const handleError = () => {
    setImageError(true);
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative overflow-hidden bg-[#282828] rounded-md shadow-lg`}>
      {shouldShowImage ? (
        <Image
          src={src!}
          alt={alt}
          width={size === "xl" ? 96 : size === "lg" ? 64 : size === "md" ? 48 : 32}
          height={size === "xl" ? 96 : size === "lg" ? 64 : size === "md" ? 48 : 32}
          className="w-full h-full object-cover"
          unoptimized={unoptimized}
          onError={handleError}
          onLoad={handleLoad}
          priority={size === "sm"} // Prioritize small images (track list)
        />
      ) : (
        <CoverArtPlaceholder
          title={title}
          trackId={trackId}
          size={size}
          className="w-full h-full"
        />
      )}
    </div>
  );
};
