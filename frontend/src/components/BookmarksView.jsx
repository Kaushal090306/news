import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  ArrowLeft, 
  Trash2, 
  Clock, 
  ExternalLink, 
  Search, 
  Filter, 
  BookOpen, 
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { getHdImageUrl, getCategoryFallbackImage } from './EditorialGrid';

export const BookmarksView = ({ onBack, onSelectStory, currentUser, onOpenAuth }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    api.getBookmarks()
      .then((res) => setBookmarks(res.bookmarks || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleRemove = async (storyId, e) => {
    e.stopPropagation();
    try {
      await api.toggleBookmark(storyId);
      setBookmarks(bookmarks.filter((b) => b.id !== storyId));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter bookmarks by category & search term
  const filteredBookmarks = bookmarks.filter((story) => {
    const matchesCat = selectedCategory === 'all' || story.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchFilter.trim() || 
      story.canonical_title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      story.summary?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const uniqueCategories = ['all', ...Array.from(new Set(bookmarks.map((b) => b.category).filter(Boolean)))];

  if (!currentUser) {
    return (
      <div className="bbc-main-content" style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center', padding: '48px 24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <Bookmark size={32} color="#121212" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, marginBottom: 12, color: '#121212' }}>
          Sign In to Access Your Saved Library
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Save in-depth investigations, breaking news, and multi-source analysis to read anytime across your phone, tablet, and computer.
        </p>
        <button 
          className="bbc-btn-register" 
          onClick={() => onOpenAuth('login')}
          style={{ padding: '12px 28px', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          Sign In to Your Account
        </button>
      </div>
    );
  }

  return (
    <div className="bbc-main-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button 
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#121212', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={16} /> Back to News Feed
        </button>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          Personal Reading Hub
        </span>
      </div>

      {/* Page Header Banner */}
      <div style={{ borderBottom: '2px solid #121212', paddingBottom: 20, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#b80000', letterSpacing: '0.8px', marginBottom: 6 }}>
              <BookOpen size={14} /> SAVED STORIES & READING LIST
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 900, color: '#121212', margin: 0 }}>
              Your Reading Library
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: 4, fontSize: 13, fontWeight: 700, color: '#334155' }}>
              📚 {bookmarks.length} {bookmarks.length === 1 ? 'Story Saved' : 'Stories Saved'}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        {bookmarks.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginTop: 24 }}>
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {uniqueCategories.map((cat) => {
                const active = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: active ? '1px solid #121212' : '1px solid #e2e8f0',
                      background: active ? '#121212' : '#ffffff',
                      color: active ? '#ffffff' : '#475569',
                      transition: 'all 0.15s ease',
                      textTransform: 'capitalize'
                    }}
                  >
                    {cat === 'all' ? 'All Topics' : cat}
                  </button>
                );
              })}
            </div>

            {/* Search within Saved */}
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 11 }} />
              <input
                type="text"
                placeholder="Search saved articles..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 12px 0 32px',
                  fontSize: 13,
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#121212', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>Loading your reading library...</div>
        </div>
      ) : bookmarks.length === 0 ? (
        /* Empty State with clean illustration */
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fafafa', border: '1px dashed #cbd5e1', borderRadius: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Bookmark size={26} color="#94a3b8" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
            Your Reading Library is Empty
          </h3>
          <p style={{ color: '#64748b', fontSize: 14, maxWidth: 460, margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            Click the "Save" bookmark button on any story across the homepage or inside articles to store it here for later reading.
          </p>
          <button
            onClick={onBack}
            style={{
              padding: '11px 24px',
              background: '#121212',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Explore Today's Top News
          </button>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <p>No saved stories found matching "{searchFilter}" in {selectedCategory}.</p>
          <button 
            onClick={() => { setSearchFilter(''); setSelectedCategory('all'); }}
            style={{ marginTop: 10, background: 'none', border: 'none', color: '#006699', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Grid of Saved Articles */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredBookmarks.map((story) => {
            const fallbackImg = getCategoryFallbackImage(story.category);
            const hdImg = getHdImageUrl(story.hero_image) || fallbackImg;

            return (
              <article
                key={story.id}
                onClick={() => onSelectStory(story)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                {/* Image Wrap with Category Badge */}
                <div style={{ position: 'relative', height: 180, width: '100%', background: '#f1f5f9', overflow: 'hidden' }}>
                  <img
                    src={hdImg}
                    alt={story.canonical_title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = fallbackImg; }}
                    loading="lazy"
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: '#121212',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      padding: '3px 8px',
                      borderRadius: 3
                    }}
                  >
                    {story.category}
                  </span>
                </div>

                {/* Body Content */}
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                    <Clock size={12} />
                    <span>Saved {new Date(story.last_updated_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <span>3 min read</span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 17,
                      fontWeight: 800,
                      lineHeight: 1.35,
                      color: '#0f172a',
                      marginBottom: 8,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {story.canonical_title}
                  </h3>

                  <p
                    style={{
                      fontSize: 13,
                      color: '#475569',
                      lineHeight: 1.45,
                      marginBottom: 16,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flexGrow: 1
                    }}
                  >
                    {story.summary}
                  </p>

                  {/* Footer with Source count and Remove button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 'auto' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#006699', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={12} /> {story.sources_count || 1} verified sources
                    </span>

                    <button
                      onClick={(e) => handleRemove(story.id, e)}
                      title="Remove from saved reading list"
                      style={{
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: 4,
                        padding: '6px 10px',
                        color: '#b91c1c',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
