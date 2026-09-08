import React from 'react';

export const Footer = ({ onSelectCategory, onOpenAdmin, currentUser }) => {
  const isAdmin = currentUser && currentUser.role === 'admin';

  return (
    <footer className="bbc-footer">
      <div className="bbc-footer-container">
        <div className="bbc-logo bbc-footer-logo">
          <div className="bbc-logo-box">B</div>
          <div className="bbc-logo-box">B</div>
          <div className="bbc-logo-box">C</div>
        </div>

        <div className="bbc-footer-links">
          <a href="#home" onClick={(e) => { e.preventDefault(); onSelectCategory('all'); }}>Home</a>
          <a href="#news" onClick={(e) => { e.preventDefault(); onSelectCategory('World'); }}>News</a>
          <a href="#sport" onClick={(e) => { e.preventDefault(); onSelectCategory('Sport'); }}>Sport</a>
          <a href="#business" onClick={(e) => { e.preventDefault(); onSelectCategory('Business'); }}>Business</a>
          <a href="#tech" onClick={(e) => { e.preventDefault(); onSelectCategory('Technology'); }}>Innovation</a>
          <a href="#culture" onClick={(e) => { e.preventDefault(); onSelectCategory('Culture'); }}>Culture</a>
          <a href="#earth" onClick={(e) => { e.preventDefault(); onSelectCategory('Science'); }}>Earth</a>
          <a href="/news-sitemap.xml" target="_blank" rel="noreferrer">Google News Sitemap (48h)</a>
          <a href="/sitemap.xml" target="_blank" rel="noreferrer">XML Sitemap</a>
          <a href="/robots.txt" target="_blank" rel="noreferrer">robots.txt</a>
          <a href="#admin" onClick={(e) => { e.preventDefault(); onOpenAdmin(); }} style={{ color: '#ff6b6b', fontWeight: 700 }}>
            Admin Control Room
          </a>
        </div>

        <div className="bbc-footer-legal">
          <p>
            Copyright © 2026 World News Intelligence Platform. All rights reserved. World News delivers independent investigative journalism, live equity intelligence, and verified global reporting.
          </p>
          <p style={{ marginTop: 6, fontSize: 11, color: '#666' }}>
            Fact-checked international coverage and original photojournalism curated by the World News Editorial Bureau.
          </p>
        </div>
      </div>
    </footer>
  );
};
