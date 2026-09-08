import React, { useRef, useEffect } from 'react';

/**
 * High-performance Image Renderer
 *
 * - Zero unnecessary re-renders: uses ref + DOM mutation for fallback logic
 * - No skeleton/wireframe phase — image appears immediately from browser cache or network
 * - Seamlessly falls back to category image on 404/network error
 * - React.memo prevents re-renders unless src/fallbackSrc props actually change
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
  const imgRef = useRef(null);
  const hasFailed = useRef(false);
  const lastSrc = useRef(null);

  // Only update the DOM src when the prop actually changes — no setState, no re-render
  useEffect(() => {
    const newSrc = src || fallbackSrc;
    if (!imgRef.current || newSrc === lastSrc.current) return;
    lastSrc.current = newSrc;
    hasFailed.current = false;
    imgRef.current.src = newSrc;
    imgRef.current.style.display = 'block';
  }, [src, fallbackSrc]);

  const activeSrc = src || fallbackSrc;
  if (!activeSrc) return null;

  return (
    <img
      ref={imgRef}
      src={activeSrc}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onClick={onClick}
      onError={(e) => {
        if (!hasFailed.current && fallbackSrc && e.currentTarget.src !== fallbackSrc) {
          hasFailed.current = true;
          e.currentTarget.src = fallbackSrc;
        } else {
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
}, (prev, next) => {
  // Custom equality: only re-render if actual image sources change
  return prev.src === next.src && prev.fallbackSrc === next.fallbackSrc && prev.className === next.className;
});

export default WireframeImage;
