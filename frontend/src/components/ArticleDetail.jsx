import React, { useState } from 'react';
import { Share2, Bookmark, BookmarkCheck, ExternalLink, Sparkles, Check, Globe, Layers, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_NEWS_IMAGE = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80";

export const ArticleDetail = ({
  storyData,
  onBack,
  onSelectStory,
  onOpenAuth,
  currentUser
}) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  if (!storyData || !storyData.story) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: 20 }}>
        <h2>Loading article details...</h2>
      </div>
    );
  }

  const { story, articles = [], related = [] } = storyData;

  const handleToggleBookmark = async () => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    try {
      const res = await api.toggleBookmark(story.id);
      setBookmarked(res.bookmarked);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    try {
      await api.subscribeNewsletter({ email: newsletterEmail, frequency: 'daily' });
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSuccess(false), 5000);
    } catch (e) {
      alert(e.message);
    }
  };

  const takeaways = story.ai_takeaways || [];
  const heroImg = story.hero_image || (articles[0] && articles[0].image_url) || DEFAULT_NEWS_IMAGE;

  return (
    <div className="bbc-article-page">
      {/* Back button */}
      <button 
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, fontWeight: 700, color: '#4a4a4a' }}
      >
        <ArrowLeft size={16} /> Back to all news
      </button>

      {/* Top Banner (Screenshot 2) */}
      <div className="bbc-article-ad-banner">
        <div>
          <span style={{ fontWeight: 900, letterSpacing: 1, fontSize: 14 }}>BBC MEDIA ACTION</span>
          <span style={{ marginLeft: 12, fontSize: 13, color: '#e6e6e6' }}>TRUTH MATTERS. HELP US PROTECT IT.</span>
        </div>
        <button style={{ background: '#b80000', color: '#fff', padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 2 }}>
          Support Our Mission
        </button>
      </div>

      <div className="bbc-article-container">
        {/* Main Article Column */}
        <main className="bbc-article-main">
          <h1 className="bbc-article-headline">
            {story.canonical_title}
          </h1>

          {/* Metadata Row (Screenshot 2) */}
          <div className="bbc-article-meta-row">
            <div>
              <span>Updated {new Date(story.last_updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span style={{ margin: '0 6px' }}>•</span>
              <span style={{ fontWeight: 600, color: '#006699' }}>{story.category}</span>
            </div>

            <div className="bbc-article-actions">
              <button className="bbc-action-btn" onClick={handleShare} title="Share article link">
                {copied ? <Check size={14} color="#15803d" /> : <Share2 size={14} />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>

              <button 
                className={`bbc-action-btn ${bookmarked ? 'active' : ''}`} 
                onClick={handleToggleBookmark}
                title="Save this story to your reading list"
              >
                {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                <span>{bookmarked ? 'Saved' : 'Save'}</span>
              </button>

              <a
                href="https://news.google.com"
                target="_blank"
                rel="noreferrer"
                className="bbc-action-btn"
                style={{ fontSize: 12 }}
              >
                <span>Add as preferred on Google</span>
              </a>
            </div>
          </div>

          {/* Byline */}
          <div className="bbc-article-byline">
            <div className="bbc-author-name">
              {articles[0]?.authors?.[0] || "World News Editorial Bureau"}
            </div>
            <div className="bbc-author-title">
              {story.category} Correspondent, Verified Reporting
            </div>
          </div>

          {/* Hero Image & Caption */}
          <div className="bbc-article-hero-wrap">
            <img
              src={heroImg}
              alt={story.canonical_title}
              className="bbc-article-hero-img"
              onError={(e) => { e.target.src = DEFAULT_NEWS_IMAGE; }}
            />
            <div className="bbc-article-img-caption">
              Associated coverage image: Reporting on {story.canonical_title} across {articles.length} verified news agencies.
            </div>
          </div>

          {/* AI Editorial Synthesis Box (Key Takeaways, What Happened, Why It Matters) */}
          <div className="bbc-ai-synthesis-box">
            <div className="bbc-ai-header">
              <div className="bbc-ai-tag">
                <Sparkles size={16} />
                <span>AI Editorial Intelligence & Key Takeaways</span>
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Factual Multi-Source Extraction</span>
            </div>

            {takeaways && takeaways.length > 0 && (
              <ul className="bbc-ai-takeaway-list">
                {takeaways.map((point, idx) => (
                  <li key={idx} className="bbc-ai-takeaway-item">
                    <span className="bbc-ai-bullet">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {story.ai_what_happened && (
              <div>
                <div className="bbc-ai-section-title">What Happened</div>
                <p className="bbc-ai-section-text">{story.ai_what_happened}</p>
              </div>
            )}

            {story.ai_why_it_matters && (
              <div style={{ marginTop: 12 }}>
                <div className="bbc-ai-section-title">Why It Matters</div>
                <p className="bbc-ai-section-text">{story.ai_why_it_matters}</p>
              </div>
            )}
          </div>

          {/* Multi-Source Coverage & Original Outbound Links (Screenshots 2 & 3) */}
          <div className="bbc-sources-coverage-box">
            <div className="bbc-sources-coverage-header">
              <Layers size={15} style={{ display: 'inline', marginRight: 6 }} />
              Coverage Across {articles.length} Independent Publishers:
            </div>
            <div className="bbc-sources-badge-list">
              {articles.map((art) => (
                <a
                  key={art.id}
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bbc-source-badge-link"
                  title={`Read original article on ${art.source_name}`}
                >
                  <Globe size={13} color="#006699" />
                  <span>{art.source_name}</span>
                  <ExternalLink size={12} color="#767676" />
                </a>
              ))}
            </div>
          </div>

          {/* Full Article Content */}
          <div className="bbc-article-body">
            {articles.map((art, idx) => (
              <div key={art.id} style={{ marginBottom: 24, borderBottom: idx < articles.length - 1 ? '1px dashed #e2e2e2' : 'none', paddingBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#767676', textTransform: 'uppercase', marginBottom: 6 }}>
                  Source: {art.source_name} ({new Date(art.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{art.title}</h3>
                <p>{art.content_text || art.summary}</p>
                <a
                  href={art.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, fontWeight: 700, color: '#b80000', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  Read original full story on {art.source_name} <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </main>

        {/* Right Sidebar: The Essential List (Screenshot 3) */}
        <aside>
          {/* Newsletter Box */}
          <div className="bbc-sidebar-card">
            <h3 className="bbc-newsletter-title">The Essential List</h3>
            <p className="bbc-newsletter-desc">
              The best of World News Intelligence, in your inbox every morning. Fact-checked, multi-source, zero clutter.
            </p>
            <form onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="bbc-newsletter-input"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <button type="submit" className="bbc-btn-newsletter">
                Sign up for free &gt;
              </button>
            </form>
            {newsletterSuccess && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                ✓ Subscribed! You will receive tomorrow's morning briefing.
              </div>
            )}
          </div>

          {/* Related Stories */}
          {related.length > 0 && (
            <div className="bbc-sidebar-card">
              <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', borderBottom: '2px solid #121212', paddingBottom: 6, marginBottom: 14 }}>
                Related in {story.category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {related.map((rel) => (
                  <div
                    key={rel.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectStory(rel)}
                  >
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>
                      {rel.canonical_title}
                    </h4>
                    <span style={{ fontSize: 11, color: '#767676' }}>
                      {rel.sources_count} sources • {rel.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
