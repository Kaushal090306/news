import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_NEWS_IMAGE = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80";

// Format clean full date & time (e.g. "30 AUG 2026, 12:30 AM")
const formatFullDateTime = (dateStr) => {
  if (!dateStr) return '30 AUG 2026, 12:30 AM';
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateFormatted}, ${timeFormatted}`;
  } catch (e) {
    return '30 AUG 2026, 12:30 AM';
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  try {
    const diffHours = Math.round((new Date() - new Date(dateStr)) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hr ago';
    if (diffHours < 24) return `${diffHours} hrs ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return 'Recently';
  }
};

export const EditorialGrid = ({ heroStory, stories = [], onSelectStory }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Take top 10 stories for the Big Hero Poster slider
  const heroSliderStories = [
    ...(heroStory ? [heroStory] : []),
    ...stories.filter((s) => !heroStory || s.id !== heroStory.id)
  ].slice(0, 10);

  // Stories for the Right Column scroll list
  const heroIds = new Set(heroSliderStories.map((s) => s.id));
  const rightColumnStories = stories.filter((s) => !heroIds.has(s.id));
  const rightList = rightColumnStories.length >= 5 ? rightColumnStories : stories.slice(1, 15);

  // Remaining stories for bottom grid
  const remainingStories = stories.slice(10, 22);

  // Auto-slide every 7.5 seconds unless hovered
  useEffect(() => {
    if (isHovered || heroSliderStories.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSliderStories.length);
    }, 7500);
    return () => clearInterval(timer);
  }, [isHovered, heroSliderStories.length]);

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev === 0 ? heroSliderStories.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % heroSliderStories.length);
  };

  const activeStory = heroSliderStories[currentSlideIndex] || heroSliderStories[0];

  return (
    <main className="bbc-main-content">
      {/* 2-Column Hero Section: Big Hero Poster + Right Column Inside Scroll */}
      <section className="bbc-hero-layout">
        {/* Left: Big Hero Poster with Horizontal Sliding Track & Text Slide-Up */}
        {heroSliderStories.length > 0 && (
          <div
            className="bbc-hero-poster-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelectStory(activeStory)}
          >
            {/* Horizontal Sliding Track */}
            <div
              className="bbc-hero-slider-track"
              style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
            >
              {heroSliderStories.map((story, index) => (
                <div key={`slide-${story.id}-${index}`} className="bbc-hero-slide-item">
                  <img
                    src={story.hero_image || DEFAULT_NEWS_IMAGE}
                    alt={story.canonical_title}
                    className="bbc-hero-poster-img"
                    onError={(e) => { e.target.src = DEFAULT_NEWS_IMAGE; }}
                  />
                </div>
              ))}
            </div>

            {/* Top-Left Floating LIVE Badge on Hero Poster */}
            <div className="bbc-hero-top-live-badge">
              <span className="bbc-live-badge-dot" />
              <span>LIVE</span>
            </div>

            {/* Clean minimalist left navigation arrow */}
            <button
              className="bbc-slider-arrow left"
              style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
              onClick={handlePrevSlide}
              title="Previous Story"
              id="slider-prev-btn"
            >
              <ChevronLeft size={42} strokeWidth={2.8} />
            </button>

            {/* Clean minimalist right navigation arrow */}
            <button
              className="bbc-slider-arrow right"
              style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
              onClick={handleNextSlide}
              title="Next Story"
              id="slider-next-btn"
            >
              <ChevronRight size={42} strokeWidth={2.8} />
            </button>

            {/* 100% to 0% Dark Gradient Overlay with Slow Slide-Up Animation */}
            {activeStory && (
              <div
                key={`overlay-${activeStory.id}-${currentSlideIndex}`}
                className="bbc-hero-gradient-overlay"
              >
                {/* Proper Category & Full Date/Time */}
                <div className="bbc-hero-overlay-kicker">
                  <span>{activeStory.category || 'World'}</span>
                  <span>•</span>
                  <span>{formatFullDateTime(activeStory.last_updated_at || activeStory.created_at)}</span>
                </div>

                {/* Clean, Refined Headline */}
                <h2 className="bbc-hero-overlay-headline">
                  <span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    {activeStory.canonical_title}
                  </span>
                </h2>

                <p className="bbc-hero-overlay-snippet">
                  {activeStory.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Right Column: Scrollable Top Developments Inside Container */}
        <div className="bbc-grid-col-right-scroll">
          <div className="bbc-right-scroll-header">
            Top Developments
          </div>

          <div className="bbc-right-scroll-content">
            {rightList.map((story) => (
              <article
                key={story.id}
                className="bbc-card-right"
                onClick={() => onSelectStory(story)}
              >
                <h4 className="bbc-card-right-title">{story.canonical_title}</h4>
                <p className="bbc-card-right-snippet">{story.summary}</p>
                <div className="bbc-card-meta">
                  <span>{formatTimeAgo(story.last_updated_at)}</span>
                  <span>|</span>
                  <span>{story.category}</span>
                  {story.sources_count > 1 && (
                    <span style={{ color: '#006699', fontWeight: 600 }}>• {story.sources_count} sources</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Lower Section: More Stories Grid */}
      {remainingStories.length > 0 && (
        <section style={{ marginTop: 40, borderTop: '2px solid #121212', paddingTop: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Latest International Coverage
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {remainingStories.map((story) => (
              <article
                key={story.id}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}
                onClick={() => onSelectStory(story)}
              >
                {story.hero_image && (
                  <div style={{ height: 160, overflow: 'hidden', background: '#eee', borderRadius: 2 }}>
                    <img
                      src={story.hero_image}
                      alt={story.canonical_title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                      loading="lazy"
                    />
                  </div>
                )}
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
                  {story.canonical_title}
                </h3>
                <p style={{ fontSize: 13, color: '#4a4a4a', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {story.summary}
                </p>
                <div style={{ fontSize: 11, color: '#767676', display: 'flex', gap: 6 }}>
                  <span>{formatTimeAgo(story.last_updated_at)}</span>
                  <span>|</span>
                  <span>{story.category}</span>
                  {story.sources_count > 1 && (
                    <span style={{ color: '#006699', fontWeight: 600 }}>• {story.sources_count} sources</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
