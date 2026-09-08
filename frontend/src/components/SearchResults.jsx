import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Calendar, Tag, Filter, X, Clock, ExternalLink } from 'lucide-react';
import { WireframeImage } from './WireframeImage';
import { getHdImageUrl, getCategoryFallbackImage } from './EditorialGrid';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  try {
    const diffHours = Math.round((new Date() - new Date(dateStr)) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hr ago';
    if (diffHours < 24) return `${diffHours} hrs ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return 'Just now';
  }
};

const formatFullDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
};

export const SearchResults = ({
  query = '',
  stories = [],
  onSelectStory,
  onBack,
  onSearchChange
}) => {
  const [searchInput, setSearchInput] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '24h', '7d', 'older'

  const categories = useMemo(() => {
    const set = new Set();
    stories.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ['All', ...Array.from(set)];
  }, [stories]);

  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      // Category filter
      if (selectedCategory !== 'All' && (s.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Time filter
      if (timeFilter !== 'all' && s.last_updated_at) {
        const storyTime = new Date(s.last_updated_at).getTime();
        const now = Date.now();
        const diffHours = (now - storyTime) / (1000 * 60 * 60);

        if (timeFilter === '24h' && diffHours > 24) return false;
        if (timeFilter === '7d' && diffHours > 24 * 7) return false;
        if (timeFilter === 'older' && diffHours <= 24 * 7) return false;
      }

      return true;
    });
  }, [stories, selectedCategory, timeFilter]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchChange(searchInput.trim());
    }
  };

  return (
    <div className="bbc-main-content" style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '20px 16px 60px 16px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2px solid #121212', paddingBottom: 12 }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 800,
            color: '#121212',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <ArrowLeft size={18} /> Back to Headlines
        </button>

        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--bbc-red)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          ARCHIVE & LIVE INTELLIGENCE SEARCH
        </span>
      </div>

      {/* Search Input Bar */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '16px 20px', marginBottom: 24 }}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search news, topics, companies, or events across all dates..."
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                fontSize: 15,
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                outline: 'none',
                background: '#ffffff',
                color: '#121212',
                fontWeight: 500
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            style={{
              background: '#121212',
              color: '#ffffff',
              padding: '12px 24px',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Search
          </button>
        </form>

        {/* Filters Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 16, alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          {/* Category Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#4b5563', marginRight: 4 }}>Category:</span>
            {categories.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    padding: '3px 10px',
                    borderRadius: 14,
                    border: '1px solid',
                    borderColor: active ? 'var(--bbc-red)' : '#cbd5e1',
                    background: active ? 'var(--bbc-red)' : '#ffffff',
                    color: active ? '#ffffff' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Time Window Pills */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#4b5563', marginRight: 4 }}>Date:</span>
            {[
              { id: 'all', label: 'All History' },
              { id: '24h', label: 'Past 24h' },
              { id: '7d', label: 'Past 7 Days' },
              { id: 'older', label: 'Earlier' }
            ].map((t) => {
              const active = timeFilter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTimeFilter(t.id)}
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    padding: '3px 10px',
                    borderRadius: 14,
                    border: '1px solid',
                    borderColor: active ? '#121212' : '#cbd5e1',
                    background: active ? '#121212' : '#ffffff',
                    color: active ? '#ffffff' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 800, color: '#121212', margin: 0 }}>
          {query ? (
            <>
              Search results for <span style={{ color: 'var(--bbc-red)' }}>"{query}"</span>
            </>
          ) : (
            'All News Archive'
          )}
        </h2>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
          {filteredStories.length} {filteredStories.length === 1 ? 'article' : 'articles'} found
        </span>
      </div>

      {/* Results Grid */}
      {filteredStories.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {filteredStories.map((story, i) => {
            const fallback = getCategoryFallbackImage(story.category, i, story.id);
            const img = getHdImageUrl(story.hero_image) || fallback;
            const fullDate = formatFullDate(story.last_updated_at);
            const timeAgo = formatTimeAgo(story.last_updated_at);

            return (
              <article
                key={story.id}
                onClick={() => onSelectStory(story)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  border: '1px solid #e5e7eb',
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: '#ffffff',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* 16:9 Image Wrapper */}
                <div style={{ width: '100%', aspectRatio: '16 / 9', position: 'relative', overflow: 'hidden', background: '#e5e7eb' }}>
                  <WireframeImage
                    src={img}
                    alt={story.canonical_title}
                    fallbackSrc={fallback}
                    loading="lazy"
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: 'var(--bbc-red)',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: 2,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {story.category || 'News'}
                  </span>
                </div>

                {/* Card Content */}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>
                    <Clock size={12} />
                    <span>{fullDate ? `${fullDate} (${timeAgo})` : timeAgo}</span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 16,
                      fontWeight: 800,
                      lineHeight: 1.3,
                      color: '#121212',
                      margin: '0 0 8px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {story.canonical_title}
                  </h3>

                  <p
                    style={{
                      fontSize: 13,
                      color: '#4b5563',
                      lineHeight: 1.45,
                      margin: '0 0 12px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {story.summary}
                  </p>

                  <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#006699' }}>
                      Full In-Depth Investigation
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--bbc-red)' }}>
                      Read report →
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: 6, border: '1px dashed #cbd5e1' }}>
          <Search size={44} color="#94a3b8" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
            No matching articles found
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 440, margin: '0 auto 20px auto' }}>
            We couldn't find any articles matching your search. Try searching for broader terms like "economy", "technology", "cricket", or select a different date range.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Stock', 'Business', 'Technology', 'World', 'Sport', 'Science'].map((term) => (
              <button
                key={term}
                onClick={() => onSearchChange(term)}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: 14,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#121212',
                  cursor: 'pointer'
                }}
              >
                Search "{term}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
