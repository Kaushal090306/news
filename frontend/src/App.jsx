import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DrawerMenu } from './components/DrawerMenu';
import { BreakingTicker } from './components/BreakingTicker';
import { EditorialGrid } from './components/EditorialGrid';
import { SearchResults } from './components/SearchResults';
import { ArticleDetail } from './components/ArticleDetail';
import { BookmarksView } from './components/BookmarksView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { api, getAuthToken, removeAuthToken, getCachedUser, setCachedUser } from './services/api';
import { 
  getCachedFeeds, 
  setCachedFeeds, 
  getCachedStoryDetail, 
  setCachedStoryDetail 
} from './services/cache';
import './styles/bbc-theme.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Crash caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 20px', maxWidth: 720, margin: '0 auto', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#121212', marginBottom: 12 }}>Unable to display this article</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, maxWidth: 480 }}>
            An unexpected error occurred while loading this report. You can return to the headlines or refresh.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
              else window.location.href = window.location.pathname;
            }}
            style={{
              padding: '10px 24px',
              background: 'var(--bbc-red, #b80000)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Back to News Feed
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const initialFeeds = getCachedFeeds();
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialStoryParam = urlParams.get('story');
  const initialSearchParam = urlParams.get('search');
  const initialCachedStory = initialStoryParam ? getCachedStoryDetail(initialStoryParam) : null;

  const [activeCategory, setActiveCategory] = useState(() => urlParams.get('category') || 'all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [searchQuery, setSearchQuery] = useState(() => initialSearchParam || '');
  const [searchResults, setSearchResults] = useState([]);
  const [stories, setStories] = useState(() => initialFeeds.stories || []);
  const [heroStory, setHeroStory] = useState(() => initialFeeds.heroStory || null);
  const [breakingStories, setBreakingStories] = useState(() => initialFeeds.breakingStories || []);
  const [categoryStories, setCategoryStories] = useState(() => initialFeeds.categoryStories || {});
  const [availableDates, setAvailableDates] = useState(() => initialFeeds.availableDates || []);

  const [selectedStory, setSelectedStory] = useState(() => initialCachedStory?.story || null);
  const [storyDetailData, setStoryDetailData] = useState(() => initialCachedStory || null);
  const [viewMode, setViewMode] = useState(() => {
    if (initialStoryParam) return 'article';
    if (initialSearchParam) return 'search';
    const viewParam = urlParams.get('view') || urlParams.get('tab');
    if (viewParam === 'admin' || urlParams.get('admin') === 'true') return 'admin';
    if (viewParam === 'bookmarks') return 'bookmarks';
    if (viewParam === 'profile') return 'profile';
    if (viewParam === 'settings') return 'settings';
    return 'feed';
  });

  // Track scroll position and category when opening an article so Back returns to exact viewport
  const lastFeedScrollPos = useRef(0);
  const lastFeedCategory = useRef(urlParams.get('category') || 'all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(() => getCachedUser());
  const [isArticleLoading, setIsArticleLoading] = useState(false);

  // Check auth profile on mount & check for deep linked story in URL
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getProfile()
        .then((res) => {
          if (res && res.user) {
            setCurrentUser(res.user);
            setCachedUser(res.user);
          }
        })
        .catch(() => removeAuthToken());
    }

    // Fetch available archive dates
    api.getAvailableDates()
      .then((res) => setAvailableDates(res.dates || []))
      .catch((err) => console.error('Error fetching available dates:', err));

    // Check if a specific story is requested in the URL (e.g., ?story=slug-or-id)
    const storyParam = urlParams.get('story');
    if (storyParam) {
      api.getStoryDetail(storyParam)
        .then((detail) => {
          if (detail && detail.story) {
            setSelectedStory(detail.story);
            setStoryDetailData(detail);
            setCachedStoryDetail(storyParam, detail);
            setViewMode('article');
          }
        })
        .catch((err) => console.warn('Background load deep-linked story error:', err));
    }

    const handlePopState = (e) => {
      const params = new URLSearchParams(window.location.search);
      const sParam = params.get('story');
      const vParam = params.get('view') || params.get('tab');
      const cParam = params.get('category');
      const state = e.state || {};

      if (sParam) {
        const cached = getCachedStoryDetail(sParam);
        if (cached) {
          setSelectedStory(cached.story);
          setStoryDetailData(cached);
          setViewMode('article');
        }
        api.getStoryDetail(sParam).then((detail) => {
          if (detail && detail.story) {
            setSelectedStory(detail.story);
            setStoryDetailData(detail);
            setCachedStoryDetail(sParam, detail);
            setViewMode('article');
          }
        });
      } else if (vParam === 'admin' || params.get('admin') === 'true') {
        setViewMode('admin');
      } else if (vParam === 'bookmarks') {
        setViewMode('bookmarks');
      } else if (params.get('search') || state.view === 'search') {
        const q = params.get('search') || state.query || '';
        setSearchQuery(q);
        setViewMode('search');
        if (q) {
          api.getStories({ search: q, limit: 300 }).then((res) => {
            if (res && res.stories) setSearchResults(res.stories);
          });
        }
      } else {
        // Return to news feed at exact scroll position and category
        setSelectedStory(null);
        setStoryDetailData(null);
        setViewMode('feed');

        const restoredCategory = state.category || cParam || lastFeedCategory.current || 'all';
        setActiveCategory(restoredCategory);
        lastFeedCategory.current = restoredCategory;

        const targetScroll = state.scrollPos !== undefined ? state.scrollPos : lastFeedScrollPos.current;
        requestAnimationFrame(() => {
          window.scrollTo({ top: targetScroll, behavior: 'instant' });
          setTimeout(() => {
            window.scrollTo({ top: targetScroll, behavior: 'instant' });
          }, 60);
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch feeds only on page load / page refresh, or when country or search explicitly changes
  useEffect(() => {
    loadFeedData(true);
  }, [searchQuery, selectedCountry]);

  const loadFeedData = async (isInitialOrMajorChange = false) => {
    try {
      const countryParam = selectedCountry !== 'all' ? selectedCountry : undefined;

      const [storiesRes, heroRes, breakingRes, catRes] = await Promise.all([
        api.getStories({
          country: countryParam,
          search: searchQuery || undefined,
          limit: 250
        }),
        api.getHeroStory(),
        api.getBreakingNews(),
        api.getStoriesByCategory(undefined, countryParam)
      ]);

      let newStories = stories;
      let newHero = heroStory;
      let newBreaking = breakingStories;
      let newCategories = categoryStories;

      if (storiesRes && storiesRes.stories && storiesRes.stories.length > 0) {
        newStories = storiesRes.stories;
        setStories(newStories);
      }
      if (heroRes && heroRes.story) {
        newHero = heroRes.story;
        setHeroStory(newHero);
      }
      if (breakingRes && breakingRes.breaking) {
        newBreaking = breakingRes.breaking;
        setBreakingStories(newBreaking);
      }
      if (catRes && catRes.categories) {
        newCategories = catRes.categories;
        setCategoryStories(newCategories);
      }

      setCachedFeeds({
        stories: newStories,
        heroStory: newHero,
        breakingStories: newBreaking,
        categoryStories: newCategories,
        availableDates: availableDates
      });
    } catch (err) {
      console.warn('Silent feed sync error:', err);
    }
  };

  // Background pre-cache feed story details for instant 0ms clicks
  useEffect(() => {
    if (stories && stories.length > 0) {
      const timer = setTimeout(() => {
        stories.slice(0, 25).forEach((s) => {
          const sid = s.slug || s.id;
          if (sid && !getCachedStoryDetail(sid)) {
            api.getStoryDetail(sid).then((d) => {
              if (d && d.story) setCachedStoryDetail(sid, d);
            }).catch(() => {});
          }
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [stories]);

  const handleSelectStory = async (story) => {
    if (!story) return;
    const storyIdentifier = story.slug || story.id;
    const cachedDetail = getCachedStoryDetail(storyIdentifier);

    // If opening from the feed, memorize the exact viewport scroll position and active category
    if (viewMode === 'feed') {
      lastFeedScrollPos.current = window.scrollY || document.documentElement.scrollTop || 0;
      lastFeedCategory.current = activeCategory;
    }

    setSelectedStory(story);

    const openWithFinalDetail = (detail) => {
      setStoryDetailData(detail);
      setCachedStoryDetail(storyIdentifier, detail);
      setIsArticleLoading(false);
      setViewMode('article');
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Update browser URL preserving active category and saved scroll position
      const catQuery = activeCategory && activeCategory !== 'all' ? `&category=${encodeURIComponent(activeCategory)}` : '';
      const newUrl = `${window.location.pathname}?story=${encodeURIComponent(storyIdentifier)}${catQuery}`;
      window.history.pushState({ 
        storyId: storyIdentifier, 
        scrollPos: lastFeedScrollPos.current, 
        category: activeCategory 
      }, '', newUrl);
    };

    if (cachedDetail && cachedDetail.story) {
      openWithFinalDetail(cachedDetail);
      return;
    }

    // Backend responds in <15ms - fetch directly so PROPER content is displayed directly with ZERO content change!
    try {
      const detail = await api.getStoryDetail(storyIdentifier);
      if (detail && detail.story) {
        openWithFinalDetail(detail);
        return;
      }
    } catch (err) {
      console.warn('Story detail fetch fallback:', err);
    }

    // Offline / network failure fallback
    const relatedFallback = stories.filter((s) => s.id !== story.id && s.category === story.category).slice(0, 5);
    const catFallback = stories.filter((s) => s.id !== story.id && s.category === story.category).slice(5, 11);
    openWithFinalDetail({ 
      story, 
      articles: [story], 
      related: relatedFallback.length > 0 ? relatedFallback : stories.filter(s => s.id !== story.id).slice(0, 5),
      category_stories: catFallback.length > 0 ? catFallback : stories.filter(s => s.id !== story.id).slice(5, 11),
      trending: breakingStories.slice(0, 5),
      top_stories: stories.filter(s => s.id !== story.id).slice(0, 6)
    });
  };

  const handleBackToFeed = () => {
    // Return to feed without resetting to home or scrolling to top
    setSelectedStory(null);
    setStoryDetailData(null);
    setViewMode('feed');

    const targetCategory = lastFeedCategory.current || activeCategory;
    if (targetCategory && targetCategory !== activeCategory) {
      setActiveCategory(targetCategory);
    }

    const backUrl = targetCategory && targetCategory !== 'all' 
      ? `${window.location.pathname}?category=${encodeURIComponent(targetCategory)}` 
      : window.location.pathname;
    window.history.pushState({ category: targetCategory, scrollPos: lastFeedScrollPos.current }, '', backUrl);

    const savedPos = lastFeedScrollPos.current || 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedPos, behavior: 'instant' });
      setTimeout(() => {
        window.scrollTo({ top: savedPos, behavior: 'instant' });
      }, 50);
    });
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    lastFeedCategory.current = cat;
    lastFeedScrollPos.current = 0;
    if (viewMode !== 'feed') {
      setViewMode('feed');
    }
    const catUrl = cat && cat !== 'all' 
      ? `${window.location.pathname}?category=${encodeURIComponent(cat)}` 
      : window.location.pathname;
    window.history.pushState({ category: cat }, '', catUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = async (query) => {
    if (!query || !query.trim()) return;
    const cleanQ = query.trim();
    setSearchQuery(cleanQ);
    setViewMode('search');
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.history.pushState({ view: 'search', query: cleanQ }, '', `?search=${encodeURIComponent(cleanQ)}`);

    try {
      const res = await api.getStories({ search: cleanQ, limit: 300 });
      if (res && Array.isArray(res.stories)) {
        setSearchResults(res.stories);
      }
    } catch (e) {
      console.warn('Search error:', e);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setViewMode('feed');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setCachedUser(user);
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
        onOpenBookmarks={() => { 
          setViewMode('bookmarks'); 
          window.history.pushState({ view: 'bookmarks' }, '', '?view=bookmarks');
          window.scrollTo({ top: 0, behavior: 'instant' }); 
        }}
        onOpenAdmin={() => { 
          setViewMode('admin'); 
          window.history.pushState({ view: 'admin' }, '', '?view=admin');
          window.scrollTo({ top: 0, behavior: 'instant' }); 
        }}
        onOpenProfile={() => { setViewMode('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onOpenSettings={() => { setViewMode('settings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
        onOpenAdmin={() => { 
          setViewMode('admin'); 
          window.history.pushState({ view: 'admin' }, '', '?view=admin');
          setDrawerOpen(false); 
        }}
        onOpenBookmarks={() => { 
          setViewMode('bookmarks'); 
          window.history.pushState({ view: 'bookmarks' }, '', '?view=bookmarks');
          setDrawerOpen(false); 
        }}
        currentUser={currentUser}
      />

      {/* Live Moving Price Ticker (Country-Adapted Real-Time Markets, Fuel & Bullion) */}
      <BreakingTicker 
        selectedCountry={selectedCountry}
        onSelectCategory={handleCategorySelect}
        onSelectStory={handleSelectStory}
      />

      {/* Main View Router - Instant Rendering (Zero Spinners) */}
      {viewMode === 'feed' && (
        <EditorialGrid
          heroStory={heroStory}
          stories={stories}
          categoryStories={categoryStories}
          selectedCountry={selectedCountry}
          activeCategory={activeCategory}
          onSelectStory={handleSelectStory}
          onSelectCategory={handleCategorySelect}
        />
      )}

      {viewMode === 'search' && (
        <SearchResults
          query={searchQuery}
          stories={searchResults.length > 0 ? searchResults : stories.filter(s => (s.canonical_title || '').toLowerCase().includes(searchQuery.toLowerCase()))}
          onSelectStory={handleSelectStory}
          onBack={() => {
            setViewMode('feed');
            setSearchQuery('');
            window.history.pushState({}, '', window.location.pathname);
          }}
          onSearchChange={handleSearch}
        />
      )}

      {viewMode === 'article' && (
        <ErrorBoundary onReset={handleBackToFeed}>
          <ArticleDetail
            storyData={storyDetailData || {
              story: selectedStory,
              articles: selectedStory ? [selectedStory] : [],
              related: stories.filter(s => s.id !== selectedStory?.id && s.category === selectedStory?.category).slice(0, 5),
              category_stories: stories.filter(s => s.id !== selectedStory?.id && s.category === selectedStory?.category).slice(0, 6),
              trending: breakingStories.filter(s => s.id !== selectedStory?.id).slice(0, 6),
              top_stories: stories.filter(s => s.id !== selectedStory?.id).slice(0, 6)
            }}
            onBack={handleBackToFeed}
            onSelectStory={handleSelectStory}
            onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
            currentUser={currentUser}
            allStories={stories}
            trendingStories={breakingStories}
            isDetailLoading={isArticleLoading}
          />
        </ErrorBoundary>
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
        onOpenAdmin={() => {
          setViewMode('admin');
          window.history.pushState({ view: 'admin' }, '', '?view=admin');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
