import React, { useState, useRef, useEffect } from 'react';

/**
 * WireframeImage Component
 * 
 * Guarantees that:
 * 1. Content (text, headlines, tags, summaries) renders 100% instantly without waiting for images.
 * 2. While the image is downloading, a sleek, light-grey wireframe placeholder preserves the exact
 *    dimensions and aspect ratio (preventing layout shift CLS = 0).
 * 3. As soon as the image arrives, it seamlessly replaces the wireframe.
 * 4. Zero loading screens, spinners, or pulsating animations anywhere.
 */
export const WireframeImage = ({
  src,
  alt = 'News image',
  className = '',
  style = {},
  fallbackSrc,
  loading = 'lazy',
  fetchPriority = 'auto',
  onClick
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Check if image is already cached in browser memory (instant 0ms display)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  const activeSrc = hasError ? (fallbackSrc || src) : (src || fallbackSrc);

  return (
    <div
      className={`bbc-wireframe-img-box ${className}`}
      onClick={onClick}
      style={{
        position: 'relative',
        backgroundColor: '#e5e7eb', // Light grey wireframe
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        ...style
      }}
    >
      {/* Light grey wireframe placeholder (No spinner, no animation) */}
      {!loaded && (
        <div
          className="bbc-wireframe-placeholder"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          {/* Subtle minimalist SVG icon in light wireframe */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.6 }}
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </div>
      )}

      {/* Actual Image */}
      {activeSrc && (
        <img
          ref={imgRef}
          src={activeSrc}
          alt={alt}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!hasError && fallbackSrc && src !== fallbackSrc) {
              setHasError(true);
            } else {
              setLoaded(true);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.18s ease-out',
            position: 'relative',
            zIndex: 2
          }}
        />
      )}
    </div>
  );
};

export default WireframeImage;
