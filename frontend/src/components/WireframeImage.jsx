import React, { useState, useEffect } from 'react';

/**
 * Direct Original & Category Fallback Image Renderer
 * 
 * 1. Shows original source images instantly.
 * 2. If an article does not have an image, it seamlessly displays the authentic category image.
 * 3. Smooth error handling: switches to category fallback immediately on 404/network error.
 */
export const WireframeImage = React.memo(({
  src,
  alt = 'News image',
  className = '',
  style = {},
  fallbackSrc,
  loading = 'eager',
  fetchPriority = 'high',
  onClick
}) => {
  const initial = src || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(initial);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setHasFailed(false);
  }, [src, fallbackSrc]);

  const activeSrc = currentSrc || fallbackSrc;
  if (!activeSrc) return null;

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onClick={onClick}
      onError={(e) => {
        // If the primary image fails and we haven't tried the fallback yet, switch to fallbackSrc
        if (!hasFailed && fallbackSrc && activeSrc !== fallbackSrc) {
          setHasFailed(true);
          setCurrentSrc(fallbackSrc);
        } else {
          // If fallback also fails or none exists, cleanly hide image
          e.currentTarget.style.display = 'none';
        }
      }}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        ...style
      }}
    />
  );
});

export default WireframeImage;
