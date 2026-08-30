import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DrawerMenu } from './components/DrawerMenu';
import { BreakingTicker } from './components/BreakingTicker';
import { EditorialGrid } from './components/EditorialGrid';
import { ArticleDetail } from './components/ArticleDetail';
import { BookmarksView } from './components/BookmarksView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { api, getAuthToken, removeAuthToken } from './services/api';
import './styles/bbc-theme.css';

export function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroStory, setHeroStory] = useState(null);
  const [stories, setStories] = useState([]);
  const [breakingStories, setBreakingStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyDetailData, setStoryDetailData] = useState(null);
  const [viewMode, setViewMode] = useState('feed'); // 'feed', 'article', 'bookmarks', 'admin'

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth profile on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getProfile()
        .then((res) => {
          setCurrentUser(res.user);
        })
        .catch(() => removeAuthToken());
    }
  }, []);

  // Fetch feeds whenever category or search changes
  useEffect(() => {
    loadFeedData();
  }, [activeCategory, searchQuery]);

  const loadFeedData = async () => {
    setLoading(true);
    try {
      const [storiesRes, heroRes, breakingRes] = await Promise.all([
        api.getStories({
          category: activeCategory !== 'all' ? activeCategory : undefined,
          search: searchQuery || undefined,
          limit: 30
        }),
        api.getHeroStory(activeCategory !== 'all' ? activeCategory : undefined),
        api.getBreakingNews()
      ]);

      setStories(storiesRes.stories || []);
      setHeroStory(heroRes.hero || storiesRes.stories?.[0] || null);
      setBreakingStories(breakingRes.breaking || []);
    } catch (e) {
      console.error("Error loading feed data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Open full article view
  const handleSelectStory = async (story) => {
    setSelectedStory(story);
    setViewMode('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const detail = await api.getStoryDetail(story.slug || story.id);
      setStoryDetailData(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setSelectedStory(null);
    setViewMode('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setActiveCategory('all');
    setSelectedStory(null);
    setViewMode('feed');
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setViewMode('feed');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    if (user && user.role === 'admin') {
      // Automatically switch to Admin Control Room if logging in with admin credentials
      setViewMode('admin');
    } else {
      setViewMode('feed');
    }
  };

  return (
    <div className="bbc-app-root">
      {/* Top Header with Sticky Top Bar & Category Navigation */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={handleCategorySelect}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
        onOpenBookmarks={() => setViewMode('bookmarks')}
        onOpenAdmin={() => setViewMode('admin')}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSearch={handleSearch}
        stories={stories}
      />

      {/* Slide-out Left Drawer Menu (Screenshot 5) */}
      <DrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeCategory={activeCategory}
        onSelectCategory={handleCategorySelect}
        onSearch={handleSearch}
        onOpenAdmin={() => { setViewMode('admin'); setDrawerOpen(false); }}
        onOpenBookmarks={() => { setViewMode('bookmarks'); setDrawerOpen(false); }}
        currentUser={currentUser}
      />

      {/* Breaking News Ticker Ribbon */}
      <BreakingTicker
        breakingStories={breakingStories}
        onSelectStory={handleSelectStory}
      />

      {/* Search status filter indicator */}
      {searchQuery && (
        <div style={{ maxWidth: 1280, margin: '14px auto 0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: '#4a4a4a' }}>
            Search results for: <strong>"{searchQuery}"</strong> ({stories.length} stories found)
          </span>
          <button 
            onClick={() => setSearchQuery('')}
            style={{ fontSize: 12, fontWeight: 700, color: '#b80000', textDecoration: 'underline' }}
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Main Views */}
      {viewMode === 'feed' && (
        <>
          {loading ? (
            <div style={{ maxWidth: 1280, margin: '60px auto', textAlign: 'center', padding: 20 }}>
              <div className="bbc-logo" style={{ justifyContent: 'center', marginBottom: 16 }}>
                <div className="bbc-logo-box">B</div>
                <div className="bbc-logo-box">B</div>
                <div className="bbc-logo-box">C</div>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#666' }}>
                Fetching & clustering live world news from Neon PostgreSQL...
              </p>
            </div>
          ) : stories.length === 0 ? (
            <div style={{ maxWidth: 1280, margin: '60px auto', textAlign: 'center', padding: 20 }}>
              <h2>No stories found for "{activeCategory}"</h2>
              <p style={{ marginTop: 8, color: '#666' }}>Try selecting another topic or clear your search.</p>
              <button 
                className="bbc-btn-register" 
                style={{ marginTop: 16 }}
                onClick={() => handleCategorySelect('all')}
              >
                Back to All News
              </button>
            </div>
          ) : (
            <EditorialGrid
              heroStory={heroStory}
              stories={stories}
              onSelectStory={handleSelectStory}
            />
          )}
        </>
      )}

      {viewMode === 'article' && (
        <ArticleDetail
          storyData={storyDetailData || { story: selectedStory, articles: [], related: [] }}
          onBack={() => setViewMode('feed')}
          onSelectStory={handleSelectStory}
          onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
          currentUser={currentUser}
        />
      )}

      {viewMode === 'bookmarks' && (
        <BookmarksView
          onBack={() => setViewMode('feed')}
          onSelectStory={handleSelectStory}
          currentUser={currentUser}
          onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
        />
      )}

      {viewMode === 'admin' && (
        <AdminPanel
          onBack={() => setViewMode('feed')}
        />
      )}

      {/* Auth & Preferences Modal */}
      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Global BBC Footer */}
      <Footer
        onSelectCategory={handleCategorySelect}
        onOpenAdmin={() => setViewMode('admin')}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
