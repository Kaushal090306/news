import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DrawerMenu } from './components/DrawerMenu';
import { BreakingTicker } from './components/BreakingTicker';
import { EditorialGrid } from './components/EditorialGrid';
import { ArticleDetail } from './components/ArticleDetail';
import { BookmarksView } from './components/BookmarksView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { Calendar } from 'lucide-react';
import { api, getAuthToken, removeAuthToken } from './services/api';
import './styles/bbc-theme.css';

export function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [availableDates, setAvailableDates] = useState([]);
  const [categoryStories, setCategoryStories] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [heroStory, setHeroStory] = useState(null);
  const [stories, setStories] = useState([]);
  const [breakingStories, setBreakingStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyDetailData, setStoryDetailData] = useState(null);
  const [viewMode, setViewMode] = useState('feed'); // 'feed', 'article', 'bookmarks', 'profile', 'settings', 'admin'

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth profile on mount & check for deep linked story in URL
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getProfile()
        .then((res) => {
          setCurrentUser(res.user);
        })
        .catch(() => removeAuthToken());
    }

    // Fetch available archive dates
    api.getAvailableDates()
      .then((res) => setAvailableDates(res.dates || []))
      .catch((err) => console.error('Error fetching available dates:', err));

    // Check if a specific story is requested in the URL (e.g., ?story=slug-or-id)
    const urlParams = new URLSearchParams(window.location.search);
    const storyParam = urlParams.get('story');
    if (storyParam) {
      api.getStoryDetail(storyParam)
        .then((detail) => {
          if (detail && detail.story) {
            setSelectedStory(detail.story);
            setStoryDetailData(detail);
            setViewMode('article');
          }
        })
        .catch((err) => console.error('Error loading deep-linked story:', err));
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sParam = params.get('story');
      if (sParam) {
        api.getStoryDetail(sParam).then((detail) => {
          if (detail && detail.story) {
            setSelectedStory(detail.story);
            setStoryDetailData(detail);
            setViewMode('article');
          }
        });
      } else {
        setSelectedStory(null);
        setStoryDetailData(null);
        setViewMode('feed');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch feeds whenever category, search, date, or country changes
  useEffect(() => {
    loadFeedData();
  }, [activeCategory, searchQuery, selectedDate, selectedCountry]);

  const loadFeedData = async () => {
    setLoading(true);
    try {
      const dateParam = selectedDate !== 'all' ? selectedDate : undefined;
      const countryParam = selectedCountry !== 'all' ? selectedCountry : undefined;

      const [storiesRes, heroRes, breakingRes, catRes] = await Promise.all([
        api.getStories({
          category: activeCategory !== 'all' ? activeCategory : undefined,
          country: countryParam,
          search: searchQuery || undefined,
          date: dateParam,
          limit: 150
        }),
        api.getHeroStory(activeCategory),
        api.getBreakingNews(),
        api.getStoriesByCategory(dateParam, countryParam)
      ]);

      setStories(storiesRes.stories || []);
      setHeroStory(heroRes.story || (storiesRes.stories && storiesRes.stories[0]) || null);
      setBreakingStories(breakingRes.breaking || []);
      setCategoryStories(catRes.categories || {});
    } catch (err) {
      console.error('Failed to load feed data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStory = async (story) => {
    if (!story) return;
    setSelectedStory(story);
    setViewMode('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update browser URL so it is directly sharable
    const storyIdentifier = story.slug || story.id;
    const newUrl = `${window.location.pathname}?story=${encodeURIComponent(storyIdentifier)}`;
    window.history.pushState({ storyId: storyIdentifier }, '', newUrl);

    try {
      const detail = await api.getStoryDetail(storyIdentifier);
      setStoryDetailData(detail);
    } catch (err) {
      console.error('Failed to fetch full story detail:', err);
      setStoryDetailData({ story, articles: [], related: [] });
    }
  };

  const handleBackToFeed = () => {
    setSelectedStory(null);
    setStoryDetailData(null);
    setViewMode('feed');
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    if (viewMode !== 'feed') {
      setViewMode('feed');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (viewMode !== 'feed') {
      setViewMode('feed');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setViewMode('feed');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
  };

  return (
    <div className="bbc-app-root">
      {/* Top Header with Sticky Top Bar & Category Navigation */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={handleCategorySelect}
        selectedCountry={selectedCountry}
        onSelectCountry={(c) => setSelectedCountry(c)}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
        onOpenBookmarks={() => { setViewMode('bookmarks'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onOpenAdmin={() => { setViewMode('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onOpenProfile={() => { setViewMode('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onOpenSettings={() => { setViewMode('settings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSearch={handleSearch}
        stories={stories}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(d)}
        availableDates={availableDates}
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

      {/* Red Breaking News Bar (Strictly filtered to selected country) */}
      <BreakingTicker 
        breakingStories={
          selectedCountry !== 'all'
            ? (breakingStories.filter((s) => s.country?.toLowerCase() === selectedCountry.toLowerCase()).length > 0
                ? breakingStories.filter((s) => s.country?.toLowerCase() === selectedCountry.toLowerCase())
                : stories.slice(0, 8))
            : breakingStories
        } 
        onSelectStory={handleSelectStory}
      />

      {/* Main View Router - Instant Rendering */}
      {viewMode === 'feed' && (
        <>
          {loading && stories.length === 0 ? (
            <div className="bbc-main-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#121212', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: '#121212' }}>
                Loading World News...
              </div>
            </div>
          ) : (
            <EditorialGrid
              heroStory={heroStory}
              stories={stories}
              categoryStories={categoryStories}
              selectedCountry={selectedCountry}
              onSelectStory={handleSelectStory}
              onSelectCategory={handleCategorySelect}
            />
          )}
        </>
      )}

      {viewMode === 'article' && (
        <ArticleDetail
          storyData={storyDetailData || { story: selectedStory, articles: [], related: [] }}
          onBack={handleBackToFeed}
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

      {viewMode === 'profile' && (
        <ProfileView
          onBack={() => setViewMode('feed')}
          currentUser={currentUser}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          onOpenSettings={() => { setViewMode('settings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onOpenBookmarks={() => { setViewMode('bookmarks'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}

      {viewMode === 'settings' && (
        <SettingsView
          onBack={() => setViewMode('feed')}
          currentUser={currentUser}
          onOpenProfile={() => { setViewMode('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}

      {viewMode === 'admin' && (
        <AdminPanel
          onBack={() => setViewMode('feed')}
        />
      )}

      {/* Auth Modal */}
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
