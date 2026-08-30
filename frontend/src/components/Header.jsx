import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bookmark, ShieldAlert, User, LogOut, X, ArrowRight } from 'lucide-react';

export const Header = ({
  activeCategory,
  onSelectCategory,
  onOpenDrawer,
  onOpenAuth,
  onOpenBookmarks,
  onOpenAdmin,
  currentUser,
  onLogout,
  onSearch,
  stories = []
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchWrapRef = useRef(null);

  const navItems = [
    { id: 'all', label: 'Home' },
    { id: 'World', label: 'News' },
    { id: 'Sport', label: 'Sport' },
    { id: 'Business', label: 'Business' },
    { id: 'Technology', label: 'Technology' },
    { id: 'Health', label: 'Health' },
    { id: 'Culture', label: 'Culture' },
    { id: 'India', label: 'India' },
    { id: 'Science', label: 'Earth' },
    { id: 'Live', label: 'Live' }
  ];

  const searchableTopics = [
    { id: 'World', label: 'World News', type: 'Category' },
    { id: 'India', label: 'India & South Asia', type: 'Category' },
    { id: 'Technology', label: 'Technology & AI', type: 'Category' },
    { id: 'Business', label: 'Business & Economy', type: 'Category' },
    { id: 'Sport', label: 'Sport & Football', type: 'Category' },
    { id: 'Health', label: 'Health & Science', type: 'Category' },
    { id: 'Culture', label: 'Culture & Arts', type: 'Category' },
    { id: 'Science', label: 'Earth & Climate', type: 'Category' },
    { id: 'Politics', label: 'Global Politics & Elections', type: 'Topic' },
    { id: 'Markets', label: 'Stock Markets & Finance', type: 'Topic' },
    { id: 'Space', label: 'Space & Astronomy', type: 'Topic' },
    { id: 'Climate', label: 'Climate Change & Green Energy', type: 'Topic' }
  ];

  const isAdmin = currentUser && currentUser.role === 'admin';

  // Letterwise filtering: only when searchInput is not empty
  const cleanQuery = searchInput.trim().toLowerCase();

  const matchingTopics = cleanQuery.length > 0
    ? searchableTopics.filter((t) => t.label.toLowerCase().includes(cleanQuery)).slice(0, 5)
    : [];

  const matchingStories = cleanQuery.length > 0 && Array.isArray(stories)
    ? stories.filter((s) => s.canonical_title && s.canonical_title.toLowerCase().includes(cleanQuery)).slice(0, 4)
    : [];

  const hasSuggestions = cleanQuery.length > 0 && (matchingTopics.length > 0 || matchingStories.length > 0);

  // Highlight matched letters helper
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    return (
      <span>
        {before}
        <span className="bbc-suggestion-highlight">{match}</span>
        {after}
      </span>
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      setSuggestionsOpen(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* 1. TOP HEADER (STICKY - Contains Logo, Hamburger Menu, Auth & Profile) */}
      <header className="bbc-top-header">
        <div className="bbc-header-container">
          {/* Left: Menu & Search Icon */}
          <div className="bbc-header-left">
            <button 
              className="bbc-menu-search-btn" 
              onClick={onOpenDrawer}
              title="Open Navigation Menu & Search"
              id="nav-menu-btn"
            >
              <Menu size={22} strokeWidth={2.5} />
              <Search size={18} strokeWidth={2.5} style={{ marginLeft: -2 }} />
            </button>
          </div>

          {/* Center: BBC 3-Boxes Logo */}
          <div className="bbc-logo" onClick={() => onSelectCategory('all')} title="World News Intelligence Home">
            <div className="bbc-logo-box">B</div>
            <div className="bbc-logo-box">B</div>
            <div className="bbc-logo-box">C</div>
          </div>

          {/* Right: User Auth & Bookmarks */}
          <div className="bbc-header-right">
            <button 
              className="bbc-action-btn" 
              onClick={onOpenBookmarks} 
              title="View Bookmarks"
              style={{ marginRight: 4 }}
            >
              <Bookmark size={15} />
              <span style={{ fontSize: 12 }}>Saved</span>
            </button>

            {isAdmin && (
              <button 
                className="bbc-action-btn" 
                onClick={onOpenAdmin} 
                title="Admin Control Room"
                style={{ marginRight: 4, background: '#fee2e2', borderColor: '#b80000', color: '#b80000' }}
              >
                <ShieldAlert size={15} color="#b80000" />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Admin Panel</span>
              </button>
            )}

            {currentUser ? (
              <div className="bbc-user-badge" onClick={onLogout} title="Click to Sign Out">
                <User size={16} />
                <span>{currentUser.full_name || currentUser.email.split('@')[0]}</span>
                {isAdmin && (
                  <span style={{ fontSize: 10, background: '#121212', color: '#fff', padding: '1px 5px', borderRadius: 2 }}>
                    Admin
                  </span>
                )}
                <LogOut size={14} color="#767676" />
              </div>
            ) : (
              <>
                <button 
                  className="bbc-btn-register" 
                  onClick={() => onOpenAuth('signup')}
                  id="btn-register"
                >
                  Register
                </button>
                <button 
                  className="bbc-btn-signin" 
                  onClick={() => onOpenAuth('login')}
                  id="btn-signin"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. SECONDARY CATEGORY & SEARCH ROW (NON-STICKY - SCROLLS WITH PAGE) */}
      <nav className="bbc-subnav-wrapper">
        <div className="bbc-subnav-container">
          {/* Category Links (Natural non-scrolling flex) */}
          <div className="bbc-categories-scroll">
            {navItems.map((item) => (
              <div
                key={item.id}
                className={`bbc-nav-item ${activeCategory.toLowerCase() === item.id.toLowerCase() ? 'active' : ''}`}
                onClick={() => onSelectCategory(item.id)}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Search Bar with Top-Layer Floating Letterwise Suggestions */}
          <div className="bbc-subnav-search-wrap" ref={searchWrapRef}>
            <form onSubmit={handleSearchSubmit} className="bbc-subnav-search-input-box">
              <Search size={15} color="#767676" />
              <input
                type="text"
                placeholder="Search categories & topics..."
                className="bbc-subnav-search-input"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => {
                  if (searchInput.trim().length > 0) setSuggestionsOpen(true);
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSuggestionsOpen(false); }}
                  style={{ color: '#767676', display: 'flex', alignItems: 'center' }}
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Top-Layer Floating Letterwise Suggestion Box (Only shows when user types) */}
            {suggestionsOpen && cleanQuery.length > 0 && (
              <div className="bbc-search-suggestions-menu">
                {/* Matching Category/Topic Suggestions */}
                {matchingTopics.map((topic) => (
                  <div
                    key={`topic-${topic.id}`}
                    className="bbc-search-suggestion-item"
                    onClick={() => {
                      onSelectCategory(topic.id);
                      setSearchInput('');
                      setSuggestionsOpen(false);
                    }}
                  >
                    <div>
                      <div>{highlightMatch(topic.label, cleanQuery)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        {topic.type}
                      </div>
                    </div>
                    <ArrowRight size={14} color="#94a3b8" />
                  </div>
                ))}

                {/* Matching Story Headlines */}
                {matchingStories.map((story) => (
                  <div
                    key={`story-${story.id}`}
                    className="bbc-search-suggestion-item"
                    onClick={() => {
                      onSearch(story.canonical_title);
                      setSearchInput('');
                      setSuggestionsOpen(false);
                    }}
                  >
                    <div style={{ paddingRight: 8 }}>
                      <div style={{ fontSize: 12, lineHeight: 1.35, fontWeight: 600 }}>
                        {highlightMatch(story.canonical_title, cleanQuery)}
                      </div>
                      <div style={{ fontSize: 10, color: '#006699', fontWeight: 700, marginTop: 2 }}>
                        {story.category || 'World News'}
                      </div>
                    </div>
                    <Search size={13} color="#94a3b8" />
                  </div>
                ))}

                {/* Direct Search Option */}
                <div
                  className="bbc-search-suggestion-item"
                  style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa', fontWeight: 700, color: '#b80000' }}
                  onClick={() => {
                    onSearch(cleanQuery);
                    setSuggestionsOpen(false);
                  }}
                >
                  <span>Search all world news for "<strong>{searchInput}</strong>"</span>
                  <Search size={14} />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};
