import React, { useState, useEffect } from 'react';
import { Bookmark, ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export const BookmarksView = ({ onBack, onSelectStory, currentUser, onOpenAuth }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!currentUser) {
    return (
      <div className="bbc-main-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Bookmark size={48} color="#767676" style={{ margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Sign in to view saved stories</h2>
        <p style={{ color: '#666', marginBottom: 20 }}>Sync your reading list across all your devices.</p>
        <button className="bbc-btn-register" onClick={() => onOpenAuth('login')}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bbc-main-content">
      <button 
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, fontWeight: 700, color: '#4a4a4a' }}
      >
        <ArrowLeft size={16} /> Back to news feed
      </button>

      <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-serif)', marginBottom: 20, borderBottom: '2px solid #121212', paddingBottom: 10 }}>
        Your Saved Stories ({bookmarks.length})
      </h1>

      {loading ? (
        <p>Loading bookmarks...</p>
      ) : bookmarks.length === 0 ? (
        <div style={{ padding: '40px 0', color: '#666' }}>
          <p>You haven't saved any stories yet. Click the "Save" bookmark button on any article to keep it for later reading.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {bookmarks.map((story) => (
            <article
              key={story.id}
              style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 2, cursor: 'pointer', position: 'relative' }}
              onClick={() => onSelectStory(story)}
            >
              {story.hero_image && (
                <div style={{ height: 160, overflow: 'hidden', marginBottom: 12, background: '#eee' }}>
                  <img
                    src={story.hero_image}
                    alt={story.canonical_title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.35 }}>
                {story.canonical_title}
              </h3>
              <p style={{ fontSize: 13, color: '#4a4a4a', lineHeight: 1.4, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {story.summary}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#767676' }}>
                <span>{story.category} • {story.sources_count} sources</span>
                <button
                  onClick={(e) => handleRemove(story.id, e)}
                  title="Remove from saved"
                  style={{ color: '#b91c1c' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
