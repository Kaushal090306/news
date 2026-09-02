import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bookmark, 
  ShieldAlert, 
  X, 
  ArrowRight, 
  Calendar, 
  ChevronDown, 
  Globe 
} from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';

export const Header = ({
  activeCategory,
  onSelectCategory,
  selectedCountry = 'all',
  onSelectCountry,
  onOpenDrawer,
  onOpenAuth,
  onOpenBookmarks,
  onOpenAdmin,
  onOpenProfile,
  onOpenSettings,
  currentUser,
  onLogout,
  onSearch,
  stories = [],
  selectedDate = 'all',
  onSelectDate,
  availableDates = []
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countryFilterText, setCountryFilterText] = useState('');

  const searchWrapRef = useRef(null);
  const countryWrapRef = useRef(null);

  // Standard category navigation tabs (without hardcoded India, which is now in the Country Dropdown!)
  const navItems = [
    { id: 'all', label: 'Home' },
    { id: 'World', label: 'News' },
    { id: 'Sport', label: 'Sport' },
    { id: 'Business', label: 'Business' },
    { id: 'Technology', label: 'Technology' },
    { id: 'Health', label: 'Health' },
    { id: 'Culture', label: 'Culture' },
    { id: 'Science', label: 'Earth' },
    { id: 'Live', label: 'Live' }
  ];

  const countriesList = [
    { code: 'all', name: 'Global / All Editions', flag: '🌍' },
    { code: 'India', name: 'India', flag: '🇮🇳' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'France', name: 'France', flag: '🇫🇷' },
    { code: 'Germany', name: 'Germany', flag: '🇩🇪' },
    { code: 'Qatar', name: 'Qatar', flag: '🇶🇦' },
    { code: 'Canada', name: 'Canada', flag: '🇨🇦' },
    { code: 'Japan', name: 'Japan', flag: '🇯🇵' },
    { code: 'Australia', name: 'Australia', flag: '🇦🇺' }
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

  const cleanQuery = searchInput.trim().toLowerCase();

  const matchingTopics = cleanQuery.length > 0
    ? searchableTopics.filter((t) => t.label.toLowerCase().includes(cleanQuery)).slice(0, 5)
    : [];

  const matchingStories = cleanQuery.length > 0 && Array.isArray(stories)
    ? stories.filter((s) => s.canonical_title && s.canonical_title.toLowerCase().includes(cleanQuery)).slice(0, 4)
    : [];

  const filteredCountries = countriesList.filter((c) =>
    c.name.toLowerCase().includes(countryFilterText.trim().toLowerCase())
  );

  const currentCountryObj = countriesList.find(
    (c) => c.code.toLowerCase() === (selectedCountry || 'all').toLowerCase()
  ) || countriesList[0];

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

  // Close suggestions and country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
      }
      if (countryWrapRef.current && !countryWrapRef.current.contains(e.target)) {
        setCountryDropdownOpen(false);
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
          {/* Left: Menu Icon */}
          <div className="bbc-header-left">
            <button 
              className="bbc-menu-search-btn" 
              onClick={onOpenDrawer}
              title="Open Navigation Menu"
              id="nav-menu-btn"
            >
              <Menu size={22} strokeWidth={2.5} />
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
              title="View Saved Stories"
              style={{ marginRight: 4 }}
            >
              <Bookmark size={15} />
              <span className="bbc-saved-text" style={{ fontSize: 12 }}>Saved</span>
            </button>

            {isAdmin && (
              <button 
                className="bbc-action-btn" 
                onClick={onOpenAdmin} 
                title="Admin Control Room"
                style={{ marginRight: 4, background: '#fee2e2', borderColor: '#b80000', color: '#b80000' }}
              >
                <ShieldAlert size={15} color="#b80000" />
                <span className="bbc-admin-text" style={{ fontSize: 12, fontWeight: 700 }}>Admin Panel</span>
              </button>
            )}

            {currentUser ? (
              <UserProfileDropdown
                currentUser={currentUser}
                onLogout={onLogout}
                onOpenProfile={onOpenProfile}
                onOpenSettings={onOpenSettings}
                onOpenBookmarks={onOpenBookmarks}
                onOpenAdmin={onOpenAdmin}
              />
            ) : (
              <div className="bbc-auth-btns">
                <button 
                  className="bbc-btn-register" 
                  onClick={() => onOpenAuth('signup')}
                  id="header-register-btn"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. SUB NAVIGATION BAR (Sticky Row: Navigation Tabs, Searchable Country Dropdown & Search Bar) */}
      <nav className="bbc-subnav-wrapper">
        <div className="bbc-subnav-container">
          {/* Main Category Tabs */}
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

            {/* Country Searchable Dropdown inside category row */}
            <div className="country-dropdown-wrap" ref={countryWrapRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCountryDropdownOpen((prev) => !prev)}
                className={`bbc-nav-item ${selectedCountry !== 'all' ? 'active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: selectedCountry !== 'all' ? 800 : 700,
                  color: selectedCountry !== 'all' ? 'var(--bbc-red)' : 'var(--bbc-black)',
                  padding: '12px 2px'
                }}
              >
                <span>{currentCountryObj.flag}</span>
                <span>{currentCountryObj.name.split('/')[0].trim()}</span>
                <ChevronDown size={14} />
              </button>

              {/* Searchable Country Picker Menu */}
              {countryDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#ffffff',
                    border: '1px solid #121212',
                    borderRadius: 4,
                    boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                    width: 260,
                    zIndex: 2000,
                    padding: 8,
                    animation: 'dropdownFadeIn 0.15s ease'
                  }}
                >
                  <div style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', marginBottom: 6 }}>
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countryFilterText}
                      onChange={(e) => setCountryFilterText(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 3,
                        fontSize: 12,
                        outline: 'none',
                        background: '#f8fafc',
                        color: '#121212'
                      }}
                    />
                  </div>

                  <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredCountries.map((c) => {
                      const isSelected = selectedCountry.toLowerCase() === c.code.toLowerCase();
                      return (
                        <div
                          key={c.code}
                          onClick={() => {
                            onSelectCountry && onSelectCountry(c.code);
                            setCountryDropdownOpen(false);
                            setCountryFilterText('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: isSelected ? 800 : 500,
                            background: isSelected ? '#121212' : 'transparent',
                            color: isSelected ? '#ffffff' : '#1e293b'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{c.flag}</span>
                            <span>{c.name}</span>
                          </span>
                          {isSelected && <span style={{ fontSize: 11, color: '#ffffff' }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar with Integrated Calendar Date Picker */}
          <div className="bbc-subnav-search-wrap" ref={searchWrapRef}>
            <form onSubmit={handleSearchSubmit} className="bbc-subnav-search-input-box">
              <Search size={15} color="#767676" />
              <input
                type="text"
                placeholder="Search topics or pick date..."
                className="bbc-subnav-search-input"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
              />

              {/* Calendar Trigger Button */}
              <button
                type="button"
                onClick={() => setSuggestionsOpen((prev) => !prev)}
                title="Select edition date or browse archive"
                style={{
                  background: selectedDate !== 'all' ? '#121212' : 'none',
                  color: selectedDate !== 'all' ? '#ffffff' : '#475569',
                  border: 'none',
                  borderRadius: 3,
                  padding: '2px 5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                <Calendar size={14} />
                {selectedDate !== 'all' && (
                  <span>{selectedDate.slice(5)}</span>
                )}
              </button>

              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSuggestionsOpen(false); }}
                  style={{ color: '#767676', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Dropdown Menu (Date Selector + Live Search Suggestions) */}
            {suggestionsOpen && (
              <div className="bbc-search-suggestions-menu" style={{ width: 340, right: 0 }}>
                {/* 1. Date / Calendar Picker Section */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#121212', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={13} /> News Archive Date:
                    </span>
                    {selectedDate !== 'all' && (
                      <button
                        onClick={() => {
                          onSelectDate && onSelectDate('all');
                          setSuggestionsOpen(false);
                        }}
                        style={{ fontSize: 11, color: '#b80000', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Reset to Latest
                      </button>
                    )}
                  </div>

                  {/* Quick Date Badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    <button
                      onClick={() => {
                        onSelectDate && onSelectDate('all');
                        setSuggestionsOpen(false);
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: selectedDate === 'all' ? 800 : 600,
                        background: selectedDate === 'all' ? '#121212' : '#ffffff',
                        color: selectedDate === 'all' ? '#ffffff' : '#334155',
                        border: `1px solid ${selectedDate === 'all' ? '#121212' : '#cbd5e1'}`,
                        cursor: 'pointer'
                      }}
                    >
                      All Latest
                    </button>

                    {availableDates.slice(0, 3).map((d) => {
                      const isSelected = selectedDate === d.date_str;
                      const dateObj = new Date(d.date_str + 'T00:00:00');
                      const label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                      return (
                        <button
                          key={d.date_str}
                          onClick={() => {
                            onSelectDate && onSelectDate(d.date_str);
                            setSuggestionsOpen(false);
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: isSelected ? 800 : 600,
                            background: isSelected ? '#121212' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#334155',
                            border: `1px solid ${isSelected ? '#121212' : '#cbd5e1'}`,
                            cursor: 'pointer'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Native Calendar Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Custom Date:</span>
                    <input
                      type="date"
                      value={selectedDate === 'all' ? '' : selectedDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          onSelectDate && onSelectDate(e.target.value);
                          setSuggestionsOpen(false);
                        }
                      }}
                      style={{
                        flexGrow: 1,
                        padding: '3px 6px',
                        borderRadius: 3,
                        border: '1px solid #cbd5e1',
                        fontSize: 11,
                        color: '#1e293b',
                        background: '#ffffff',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* 2. Text Search Suggestions (When User Types) */}
                {cleanQuery.length > 0 && (
                  <>
                    {/* Matching Categories */}
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

                    {/* Matching Stories */}
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
                      <span>Search for "<strong>{searchInput}</strong>"</span>
                      <Search size={14} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};
