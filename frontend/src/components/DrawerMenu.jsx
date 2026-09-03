import React, { useState } from 'react';
import { X, Search, ChevronDown, ChevronUp, ShieldAlert, Bookmark } from 'lucide-react';

export const DrawerMenu = ({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
  onSearch,
  onOpenAdmin,
  onOpenBookmarks,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    News: true,
    Technology: false,
    Business: false,
    Sport: false
  });

  const isAdmin = currentUser && currentUser.role === 'admin';

  const toggleSection = (name) => {
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      onClose();
    }
  };

  const navHierarchy = [
    { id: 'all', label: 'Home', hasSub: false },
    {
      id: 'World',
      label: 'News',
      hasSub: true,
      subItems: [
        { id: 'World', label: 'World News' },
        { id: 'India', label: 'India & South Asia' },
        { id: 'Asia', label: 'Asia Pacific' },
        { id: 'US', label: 'US & Canada' },
        { id: 'Europe', label: 'Europe' },
        { id: 'MiddleEast', label: 'Middle East' }
      ]
    },
    {
      id: 'Sport',
      label: 'Sport',
      hasSub: true,
      subItems: [
        { id: 'Sport', label: 'Premier League & Football' },
        { id: 'Sport', label: 'Cricket & ICC' },
        { id: 'Sport', label: 'Formula 1 & Motorsport' },
        { id: 'Sport', label: 'Tennis' }
      ]
    },
    {
      id: 'Business',
      label: 'Business',
      hasSub: true,
      subItems: [
        { id: 'Business', label: 'Markets & Stocks' },
        { id: 'Business', label: 'Economy & Central Banks' },
        { id: 'Business', label: 'Global Trade' }
      ]
    },
    {
      id: 'Technology',
      label: 'Technology',
      hasSub: true,
      subItems: [
        { id: 'Technology', label: 'Artificial Intelligence' },
        { id: 'Technology', label: 'Cybersecurity' },
        { id: 'Technology', label: 'Startups & Venture Capital' },
        { id: 'Technology', label: 'Hardware & Gadgets' }
      ]
    },
    { id: 'Health', label: 'Health', hasSub: false },
    { id: 'Culture', label: 'Culture', hasSub: false },
    { id: 'Science', label: 'Earth & Science', hasSub: false },
    { id: 'Live', label: 'Live Coverage', hasSub: false }
  ];

  return (
    <div className={`bbc-drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="bbc-drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="bbc-drawer-header">
          <button className="bbc-drawer-close-btn" onClick={onClose} title="Close Menu" id="close-drawer-btn">
            <X size={24} />
          </button>
          <div className="bbc-logo">
            <div className="bbc-logo-box" style={{ width: 24, height: 24, fontSize: 15 }}>B</div>
            <div className="bbc-logo-box" style={{ width: 24, height: 24, fontSize: 15 }}>B</div>
            <div className="bbc-logo-box" style={{ width: 24, height: 24, fontSize: 15 }}>C</div>
          </div>
          <div style={{ width: 24 }}></div>
        </div>

        {/* Search Box inside drawer */}
        <div className="bbc-drawer-search-wrap">
          <form onSubmit={handleSearchSubmit} className="bbc-drawer-search-box">
            <input
              type="text"
              placeholder="Search news, topics and more"
              className="bbc-drawer-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="drawer-search-input"
            />
            <button type="submit" title="Search">
              <Search size={18} color="#4a4a4a" />
            </button>
          </form>
        </div>

        {/* Categories Vertical Accordion List */}
        <ul className="bbc-drawer-nav-list">
          {navHierarchy.map((item) => (
            <React.Fragment key={item.label}>
              <li
                className={`bbc-drawer-nav-item ${activeCategory.toLowerCase() === item.id.toLowerCase() ? 'active' : ''}`}
                onClick={() => {
                  if (item.hasSub) {
                    toggleSection(item.label);
                  } else {
                    onSelectCategory(item.id);
                    onClose();
                  }
                }}
              >
                <span>{item.label}</span>
                {item.hasSub && (
                  expandedSections[item.label] ? <ChevronUp size={18} /> : <ChevronDown size={18} />
                )}
              </li>

              {item.hasSub && expandedSections[item.label] && (
                <div style={{ background: '#f8f8f8', paddingLeft: 20 }}>
                  {item.subItems.map((sub, idx) => (
                    <li
                      key={idx}
                      className="bbc-drawer-nav-item"
                      style={{ fontSize: 14, fontWeight: 500, padding: '8px 20px' }}
                      onClick={() => {
                        onSelectCategory(sub.id);
                        onClose();
                      }}
                    >
                      {sub.label}
                    </li>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}

          <li 
            className="bbc-drawer-nav-item" 
            style={{ marginTop: 15, borderTop: '1px solid #e6e6e6', color: '#006699' }}
            onClick={() => { onOpenBookmarks(); onClose(); }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bookmark size={18} /> Saved Articles
            </span>
          </li>

          <li 
            className="bbc-drawer-nav-item" 
            style={{ color: '#b80000', fontWeight: 700 }}
            onClick={() => { onOpenAdmin(); onClose(); }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} /> Admin Control Room
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
