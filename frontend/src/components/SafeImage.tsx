'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  fallbackClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  sizes,
  fallbackClassName = '',
}) => {
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Determine if the image is external (should be unoptimized)
  const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));

  const handleError = useCallback(() => {
    if (retryCount < 1) {
      setRetryCount((prev) => prev + 1);
      // Force a re-render by briefly setting error to true then false,
      // which changes the key and triggers a retry.
      setError(true);
      setTimeout(() => setError(false), 100);
    } else {
      setError(true);
    }
  }, [retryCount]);

  if (!src || error) {
    const fallbackClasses = fill
      ? `absolute inset-0 bg-muted-foreground/20 rounded-md ${fallbackClassName}`
      : `bg-muted-foreground/20 rounded-md flex items-center justify-center ${fallbackClassName}`;

    return (
      <div
        className={fallbackClasses}
        style={!fill && width && height ? { width, height } : undefined}
        title={alt}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        onError={handleError}
        key={`${src}-${retryCount}`}
        unoptimized={isExternal}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 24}
      height={height || 24}
      className={className}
      onError={handleError}
      key={`${src}-${retryCount}`}
      unoptimized={isExternal}
    />
  );
};
