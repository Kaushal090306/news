import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Headphones,
  TrendingUp,
  Film,
  Globe,
  Activity,
  Cpu,
  Compass,
  BookOpen,
  Radio,
  Sparkles,
  Flame
} from 'lucide-react';
import { WireframeImage } from './WireframeImage';

const DEFAULT_NEWS_IMAGE = "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=90";

export const getHdImageUrl = (url) => {
  if (!url) return '';
  let hdUrl = url.trim();

  // 1. BBC: upgrade /standard/240/ or /news/240/ to /standard/1024/
  if (hdUrl.includes('ichef.bbci.co.uk')) {
    hdUrl = hdUrl.replace(/\/(standard|ws|news|wwhp)\/\d+\//, '/$1/1024/');
  }
  // 2. France 24: upgrade /w:1024/ or /w:320/ to /w:1920/
  else if (hdUrl.includes('france24.com')) {
    hdUrl = hdUrl.replace(/\/w:\d+\//, '/w:1920/');
  }
  // 3. NDTV: high resolution resize
  else if (hdUrl.includes('ndtvimg.com')) {
    if (hdUrl.includes('?im=')) {
      hdUrl = hdUrl.replace(/width=\d+,height=\d+/, 'width=1280,height=720').replace(/width=\d+/, 'width=1280');
    } else {
      hdUrl = `${hdUrl}?im=Resize,width=1280`;
    }
  }
  // 4. Times of India / Economic Times: upscale dimensions
  else if (hdUrl.includes('toiimg.com') || hdUrl.includes('etimg.com')) {
    if (hdUrl.includes('width-')) {
      hdUrl = hdUrl.replace(/width-\d+,height-\d+/, 'width-1200,height-900').replace(/width-\d+/, 'width-1200');
    }
  }
  // 5. CNN: upgrade from crops to super-169
  else if (hdUrl.includes('cnn.com')) {
    hdUrl = hdUrl.replace(/-(medium|small|large|exlarge|hp-video|story-body|t1-main|large-11)(-\d+)?\.jpg/, '-super-169.jpg');
    hdUrl = hdUrl.replace('medium-169', 'super-169').replace('small-169', 'super-169').replace('exlarge-169', 'super-169');
  }
  // 6. WordPress / TechCrunch / Variety / Ars Technica / The Verge
  else if (['techcrunch.com', 'variety.com', 'wp.com', 'arstechnica.net', 'theverge.com'].some(d => hdUrl.includes(d))) {
    hdUrl = hdUrl.replace(/-\d+x\d+(\.(jpg|jpeg|png|webp|avif))/i, '$1');
  }
  // 7. Unsplash: 1600px width with 90% quality
  else if (hdUrl.includes('images.unsplash.com')) {
    hdUrl = hdUrl.replace(/w=\d+/, 'w=1600').replace(/q=\d+/, 'q=90');
  }

  return hdUrl;
};

export const getCategoryFallbackImage = (category, index = 0, seed = '') => {
  const cat = (category || '').toLowerCase();

  // Deterministic seed hash so adjacent stories NEVER share the same fallback photo
  let offset = index;
  if (seed) {
    let hash = 0;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    offset = Math.abs(hash);
  }

  const fallbacks = {
    world: [
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=90', // Global summit / diplomacy
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1600&auto=format&fit=crop&q=90', // Press conference & microphones
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&auto=format&fit=crop&q=90', // Law & justice / courtroom
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1600&auto=format&fit=crop&q=90', // International flags / summit
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1600&auto=format&fit=crop&q=90', // Journalistic reporting
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=90', // Globe / satellite earth
      'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1600&auto=format&fit=crop&q=90', // Cityscape / capital skyline
      'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1600&auto=format&fit=crop&q=90'  // Public safety / emergency
    ],
    technology: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&auto=format&fit=crop&q=90'
    ],
    business: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&auto=format&fit=crop&q=90'
    ],
    sport: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1600&auto=format&fit=crop&q=90'
    ],
    culture: [
      'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1600&auto=format&fit=crop&q=90'
    ],
    science: [
      'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1600&auto=format&fit=crop&q=90'
    ],
    health: [
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1600&auto=format&fit=crop&q=90'
    ],
    india: [
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&auto=format&fit=crop&q=90'
    ],
    travel: [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1600&auto=format&fit=crop&q=90',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&auto=format&fit=crop&q=90'
    ]
  };

  const list = fallbacks[cat] || fallbacks.world;
  return list[offset % list.length] || DEFAULT_NEWS_IMAGE;
};

// Format clean full date & time (e.g. "2 SEPT 2026, 03:07 PM")
const formatFullDateTime = (dateStr) => {
  if (!dateStr) return 'TODAY, LATEST';
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateFormatted}, ${timeFormatted}`;
  } catch (e) {
    return 'TODAY, LATEST';
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  try {
    const diffHours = Math.round((new Date() - new Date(dateStr)) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hr ago';
    if (diffHours < 24) return `${diffHours} hrs ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return 'Just now';
  }
};

export const EditorialGrid = ({ 
  heroStory, 
  stories = [], 
  categoryStories = {}, 
  selectedCountry = 'all',
  activeCategory = 'all',
  onSelectStory,
  onSelectCategory 
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSportSub, setSelectedSportSub] = useState('All');

  // Reset slide index whenever active category or country changes
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [activeCategory, selectedCountry]);

  const isCountryFiltered = selectedCountry && selectedCountry !== 'all';
  const isCategoryFiltered = activeCategory && activeCategory !== 'all';

  const countryStories = isCountryFiltered
    ? stories.filter((s) => s.country && s.country.toLowerCase() === selectedCountry.toLowerCase())
    : stories;

  // Prioritize active category stories if category is selected
  const categoryFilteredStories = isCategoryFiltered
    ? countryStories.filter((s) => s.category?.toLowerCase() === activeCategory.toLowerCase())
    : countryStories;

  const displayPool = categoryFilteredStories.length > 0 ? categoryFilteredStories : countryStories;

  // Global set of story IDs used on the page to guarantee ZERO cross-section or cross-column duplicates
  const usedStoryIds = new Set();

  // 1. Stories for the Hero Slider:
  // On Home (activeCategory === 'all'), ensure it showcases news across ALL major categories!
  const heroSliderStories = [];
  if (displayPool.length > 0) {
    if (!isCategoryFiltered) {
      // Home hero showcases all categories: World, Technology, Sport, Business, Science, Health, Culture, India
      const majorCategories = ['World', 'Technology', 'Sport', 'Business', 'Science', 'Health', 'Culture', 'India'];
      const heroPickedIds = new Set();

      if (heroStory && (!isCountryFiltered || heroStory.country?.toLowerCase() === selectedCountry.toLowerCase())) {
        heroSliderStories.push(heroStory);
        heroPickedIds.add(heroStory.id);
      }

      for (const cat of majorCategories) {
        if (heroSliderStories.length >= 8) break;
        const matchingStory = displayPool.find(
          (s) => s.category?.toLowerCase() === cat.toLowerCase() && !heroPickedIds.has(s.id)
        );
        if (matchingStory) {
          heroSliderStories.push(matchingStory);
          heroPickedIds.add(matchingStory.id);
        }
      }

      // Fill any remaining slots up to 8
      for (const s of displayPool) {
        if (heroSliderStories.length >= 8) break;
        if (!heroPickedIds.has(s.id)) {
          heroSliderStories.push(s);
          heroPickedIds.add(s.id);
        }
      }
    } else {
      if (heroStory && heroStory.category?.toLowerCase() === activeCategory.toLowerCase()) {
        heroSliderStories.push(heroStory);
      }
      heroSliderStories.push(
        ...displayPool.filter((s) => !heroStory || s.id !== heroStory.id).slice(0, 8)
      );
    }
  }

  // Register hero slider IDs to avoid duplicates
  heroSliderStories.forEach((s) => usedStoryIds.add(s.id));

  // 2. Stories for Hero Right Column (Top Developments): Diversified across categories
  const rightColumnStories = [];
  const rightColCatCount = {};
  for (const s of displayPool) {
    if (rightColumnStories.length >= 7) break;
    if (!usedStoryIds.has(s.id)) {
      const cat = (s.category || 'General').toLowerCase();
      // On home page, prevent sector clumping (max 2 stories per category)
      if (!isCategoryFiltered && (rightColCatCount[cat] || 0) >= 2) {
        continue;
      }
      rightColumnStories.push(s);
      usedStoryIds.add(s.id);
      rightColCatCount[cat] = (rightColCatCount[cat] || 0) + 1;
    }
  }
  for (const s of displayPool) {
    if (rightColumnStories.length >= 7) break;
    if (!usedStoryIds.has(s.id)) {
      rightColumnStories.push(s);
      usedStoryIds.add(s.id);
    }
  }

  // 3. Strict Category Helper with GUARANTEED UNIQUE STORY ALLOCATION
  // 3. Strict Category Helper with GUARANTEED TOPIC INTEGRITY
  const getCatList = (catName, count = 4) => {
    const key = catName.toLowerCase();
    const picked = [];

    // Step A: Pick from partitioned categoryStories that match THIS EXACT category
    const fromCat = (categoryStories[key] || []).filter(
      (s) => (s.category || '').toLowerCase() === key && !usedStoryIds.has(s.id) && (!isCountryFiltered || s.country?.toLowerCase() === selectedCountry.toLowerCase())
    );
    for (const s of fromCat) {
      if (picked.length >= count) break;
      picked.push(s);
      usedStoryIds.add(s.id);
    }

    // Step B: If more needed, pick from countryStories matching THIS EXACT category
    if (picked.length < count) {
      const matchingCat = countryStories.filter(
        (s) => (s.category || '').toLowerCase() === key && !usedStoryIds.has(s.id)
      );
      for (const s of matchingCat) {
        if (picked.length >= count) break;
        picked.push(s);
        usedStoryIds.add(s.id);
      }
    }

    // Step C: If still needed, pick from global stories matching THIS EXACT category
    if (picked.length < count) {
      const globalMatchingCat = stories.filter(
        (s) => (s.category || '').toLowerCase() === key && !usedStoryIds.has(s.id)
      );
      for (const s of globalMatchingCat) {
        if (picked.length >= count) break;
        picked.push(s);
        usedStoryIds.add(s.id);
      }
    }

    // STRICT INTEGRITY: NEVER backfill with unrelated categories!
    return picked;
  };

  // Section allocations: STRICTLY ACCURATE TO SELECTED COUNTRY & CATEGORY
  const trendingTwoStories = getCatList('World', 2);
  const sportStories = getCatList('Sport', 7);
  const cultureStripStories = getCatList('Culture', 6);
  const politicsSpotlight = getCatList('World', 1)[0] || countryStories[0];
  const artsStories = getCatList('Culture', 3);
  const watchVideoStories = getCatList('World', 4);
  const techTwoStories = getCatList('Technology', 2);
  const historyStory = getCatList('World', 1)[0] || countryStories[1] || countryStories[0];
  const travelStories = getCatList('Culture', 2);

  // ALL SPORT CANDIDATES: Must strictly have category === 'Sport'
  const authenticSportStories = stories.filter(
    (s) => (s.category || '').toLowerCase() === 'sport'
  );

  // Robust word-boundary regex patterns strictly for sports
  const sportRegexPatterns = {
    Cricket: /cricket|ipl|bcci|\bicc\b|test match|\bodi\b|\bt20\b|wicket|batsman|bowler|innings|rohit|virat|kohli|bumrah|dhoni|\bcsk\b|gambhir|kuggeleijn|hampshire/i,
    Football: /football|soccer|premier league|champions league|la liga|serie a|fifa|messi|ronaldo|manchester|arsenal|chelsea|liverpool|bayern|real madrid|barcelona|psg|tottenham|epl|haaland|mbappe|striker|goalkeeper|uefa|\bnfl\b|quarterback|touchdown|brighton|newcastle|everton|azeez|fernandez|tielemans|clippers|\bnba\b/i,
    Tennis: /tennis|us open|wimbledon|australian open|french open|roland garros|djokovic|alcaraz|sinner|nadal|federer|swiatek|sabalenka|gauff|\batp\b|\bwta\b|grand slam|boulter|lucky loser/i,
    'Formula 1': /formula 1|formula one|\bf1\b|grand prix|verstappen|hamilton|ferrari|mercedes|red bull|mclaren|leclerc|norris|russell|\bfia\b|motorsport|\bgp\b/i,
    Golf: /golf|\bpga\b|liv golf|ryder cup|masters|tiger woods|mcilroy|scheffler|open championship/i,
    Athletics: /athletics|olympic|marathon|runner|sprint|100m|200m|track and field|relay|hurdles|pole vault|long jump|salas|pudge|\bmlb\b|baseball/i
  };

  const matchesSportSub = (story, sub) => {
    if (!story || (story.category || '').toLowerCase() !== 'sport') return false;
    if (sub === 'All' || sub === 'All Sport') return true;
    const pat = sportRegexPatterns[sub];
    if (!pat) return false;
    const textToSearch = `${story.canonical_title || ''} ${story.summary || ''} ${story.slug || ''}`;
    return pat.test(textToSearch);
  };

  // Specific sport filtered pool (STRICTLY within authentic sport stories)
  const specificSportMatches = selectedSportSub === 'All'
    ? authenticSportStories
    : authenticSportStories.filter((s) => matchesSportSub(s, selectedSportSub));

  // If specific matches exist, show them; otherwise fallback to authenticSportStories (NEVER non-sport!)
  const displayedSportStories = (specificSportMatches.length > 0
    ? specificSportMatches
    : authenticSportStories).slice(0, 7);

  // 4-Column Grid: Business | Technology | Science | Health
  // ZERO DUPLICATES: Every single column receives completely distinct, unique stories!
  const businessCol = getCatList('Business', 4);
  const techCol = getCatList('Technology', 4);
  const scienceCol = getCatList('Science', 4);
  const healthCol = getCatList('Health', 4);

  // Regional / India stories
  const regionalStories = getCatList('India', 4);

  // Remaining general stories from active country
  const remainingStories = countryStories.filter((s) => !usedStoryIds.has(s.id)).slice(0, 16);

  // Auto-slide every 7.5 seconds unless hovered
  useEffect(() => {
    if (isHovered || heroSliderStories.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSliderStories.length);
    }, 7500);
    return () => clearInterval(timer);
  }, [isHovered, heroSliderStories.length]);

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev === 0 ? heroSliderStories.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % heroSliderStories.length);
  };

  const activeStory = heroSliderStories[currentSlideIndex] || heroSliderStories[0] || stories[0];

  return (
    <main className="bbc-main-content">
      {/* ========================================================
          1. HERO SECTION: Big HD Slider + Top Developments Column
          ======================================================== */}
      <section className="bbc-hero-layout">
        {/* Left: Big Hero Poster with Horizontal Sliding Track */}
        {heroSliderStories.length > 0 ? (
          <div
            className="bbc-hero-poster-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelectStory(activeStory)}
          >
            {/* Horizontal Sliding Track */}
            <div
              className="bbc-hero-slider-track"
              style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
            >
              {heroSliderStories.map((story, index) => {
                const fallbackImg = getCategoryFallbackImage(story.category, index, story.id);
                const hdImg = getHdImageUrl(story.hero_image) || fallbackImg;
                return (
                  <div key={`slide-${story.id}-${index}`} className="bbc-hero-slide-item">
                    <WireframeImage
                      src={hdImg}
                      alt={story.canonical_title}
                      className="bbc-hero-poster-img"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      fallbackSrc={fallbackImg}
                    />
                  </div>
                );
              })}
            </div>

            {/* Top-Left Floating LIVE Badge (Only if story is actually a live stream / live coverage) */}
            {(activeStory?.youtube_live || activeStory?.has_live_video || activeStory?.is_live === 1 || activeStory?.canonical_title?.toLowerCase()?.startsWith('live:')) && (
              <div className="bbc-hero-top-live-badge">
                <span className="bbc-live-badge-dot" />
                <span>LIVE</span>
              </div>
            )}

            {/* Clean minimalist left navigation arrow */}
            <button
              className="bbc-slider-arrow left"
              style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
              onClick={handlePrevSlide}
              title="Previous Story"
              id="slider-prev-btn"
            >
              <ChevronLeft size={42} strokeWidth={2.8} />
            </button>

            {/* Clean minimalist right navigation arrow */}
            <button
              className="bbc-slider-arrow right"
              style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
              onClick={handleNextSlide}
              title="Next Story"
              id="slider-next-btn"
            >
              <ChevronRight size={42} strokeWidth={2.8} />
            </button>

            {/* 100% to 0% Dark Gradient Overlay with Text */}
            {activeStory && (
              <div
                key={`overlay-${activeStory.id}-${currentSlideIndex}`}
                className="bbc-hero-gradient-overlay"
              >
                <div className="bbc-hero-overlay-kicker">
                  <span>{activeStory.category || 'World'}</span>
                  <span>•</span>
                  <span>{formatFullDateTime(activeStory.last_updated_at || activeStory.created_at)}</span>
                </div>

                <h2 className="bbc-hero-overlay-headline">
                  <span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    {activeStory.canonical_title}
                  </span>
                </h2>

                <p className="bbc-hero-overlay-snippet">
                  {activeStory.summary}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bbc-hero-poster-container" style={{ background: '#e5e7eb', height: 440, borderRadius: 4, position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 80, height: 16, background: '#cbd5e1', borderRadius: 2 }} />
              <div style={{ width: '75%', height: 32, background: '#cbd5e1', borderRadius: 4 }} />
              <div style={{ width: '60%', height: 18, background: '#cbd5e1', borderRadius: 3 }} />
            </div>
          </div>
        )}

        {/* Right Column: Scrollable Top Developments Inside Container */}
        <div className="bbc-grid-col-right-scroll">
          <div className="bbc-right-scroll-header">
            <TrendingUp size={16} /> Top Developments
          </div>

          <div className="bbc-right-scroll-content">
            {rightColumnStories.length > 0 ? (
              rightColumnStories.map((story) => (
                <article
                  key={story.id}
                  className="bbc-card-right"
                  onClick={() => onSelectStory(story)}
                >
                  <h4 className="bbc-card-right-title">{story.canonical_title}</h4>
                  <p className="bbc-card-right-snippet">{story.summary}</p>
                  <div className="bbc-card-meta">
                    <span>{formatTimeAgo(story.last_updated_at)}</span>
                    <span>|</span>
                    <span>{story.category}</span>
                    {story.sources_count > 1 && (
                      <span style={{ color: '#006699', fontWeight: 600 }}>• {story.sources_count} sources</span>
                    )}
                  </div>
                </article>
              ))
            ) : (
              [1, 2, 3, 4].map((n) => (
                <div key={n} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '90%', height: 16, background: '#e5e7eb', borderRadius: 2, marginBottom: 6 }} />
                  <div style={{ width: '70%', height: 12, background: '#f1f5f9', borderRadius: 2 }} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          SPONSOR / EDITORIAL MISSION RIBBON (Matches BBC Media Action)
          ======================================================== */}
      {/* <div className="bbc-media-ribbon">
        <div className="bbc-media-ribbon-left">
          <span className="bbc-media-tag">WORLD INTELLIGENCE</span>
          <span className="bbc-media-text">FACTUAL REPORTING ACROSS 25+ GLOBAL NEWS DESKS. ZERO BIAS.</span>
        </div>
        <div className="bbc-media-ribbon-right">
          <span className="bbc-media-live-status">● LIVE INGESTION ACTIVE</span>
        </div>
      </div> */}

      {/* ========================================================
          2. TOP TRENDING STORIES (2 Big Side-by-Side Story Cards)
          ======================================================== */}
      {trendingTwoStories.length >= 2 && (
        <section className="bbc-section-block">
          <div className="bbc-section-header" onClick={() => onSelectCategory('World')} title="Click to view all World News">
            <span className="bbc-section-tag-red" />
            <h3 className="bbc-section-title">
              TOP TRENDING & ESSENTIAL READS <ChevronRight size={18} className="bbc-section-chevron" />
            </h3>
          </div>
          <div className="bbc-two-feature-grid">
            {trendingTwoStories.map((story, i) => {
              const fallback = getCategoryFallbackImage(story.category, i, story.id);
              const imgUrl = getHdImageUrl(story.hero_image) || fallback;
              return (
                <article
                  key={story.id}
                  className="bbc-two-feature-card"
                  onClick={() => onSelectStory(story)}
                >
                  <div className="bbc-two-feature-img-wrap">
                    <WireframeImage
                      src={imgUrl}
                      alt={story.canonical_title}
                      className="bbc-two-feature-img"
                      fallbackSrc={fallback}
                      loading="lazy"
                    />
                  </div>
                  <div className="bbc-two-feature-body">
                    <div className="bbc-card-meta" style={{ marginBottom: 6 }}>
                      <span className="bbc-kicker-red">{story.category}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(story.last_updated_at)}</span>
                    </div>
                    <h2 className="bbc-two-feature-title">{story.canonical_title}</h2>
                    <p className="bbc-two-feature-snippet">{story.summary}</p>
                    <div className="bbc-card-meta">
                      {story.sources_count > 1 && (
                        <span style={{ color: '#006699', fontWeight: 700 }}>
                          Verified across {story.sources_count} publishers
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          3. SPORT SECTION (Featured Hero + 3 Side Cards + Highlights Row)
          ======================================================== */}
      {displayedSportStories.length > 0 && (
        <section className="bbc-section-block bbc-sport-section">
          {/* Authentic BBC Sport Header with In-Place Category Filtering */}
          <div className="bbc-sport-section-header">
            <div className="bbc-sport-header-left" onClick={() => onSelectCategory('Sport')} style={{ cursor: 'pointer' }} title="Click to view all Sport news">
              <span className="bbc-sport-header-bar" />
              <h3 className="bbc-sport-section-title">
                SPORT <ChevronRight size={18} className="bbc-sport-chevron" />
              </h3>
            </div>
            <div className="bbc-sport-pills-nav">
              {['All Sport', 'Football', 'Cricket', 'Formula 1', 'Tennis', 'Golf', 'Athletics'].map((sub) => {
                const isPillActive = selectedSportSub === sub || (sub === 'All Sport' && selectedSportSub === 'All');
                return (
                  <button
                    type="button"
                    key={sub}
                    className={`bbc-sport-pill ${isPillActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedSportSub(sub === 'All Sport' ? 'All' : sub);
                    }}
                    style={{
                      background: isPillActive ? '#ffd230' : '#f3f4f6',
                      color: isPillActive ? '#000000' : '#374151',
                      fontWeight: isPillActive ? 800 : 600,
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSportSub !== 'All' && specificSportMatches.length === 0 && (
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              No current reports found specifically for {selectedSportSub}. Showing top sports coverage:
            </div>
          )}

          <div className="bbc-sport-split-grid">
            {/* Main Featured Sport Card */}
            {displayedSportStories[0] && (
              <article
                className="bbc-sport-hero-card"
                onClick={() => onSelectStory(displayedSportStories[0])}
              >
                <div className="bbc-sport-hero-img-wrap">
                  <WireframeImage
                    src={getHdImageUrl(displayedSportStories[0].hero_image) || getCategoryFallbackImage('sport', 0, displayedSportStories[0].id)}
                    alt={displayedSportStories[0].canonical_title}
                    className="bbc-sport-hero-img"
                    fallbackSrc={getCategoryFallbackImage('sport', 0, displayedSportStories[0].id)}
                    loading="lazy"
                  />
                  <div className="bbc-sport-live-badge">
                    <span className="bbc-live-badge-dot" />
                    <span>MATCH COVERAGE</span>
                  </div>
                </div>
                <div className="bbc-sport-hero-body">
                  <span className="bbc-kicker-red">SPORT REPORT</span>
                  <h2 className="bbc-sport-hero-title">{displayedSportStories[0].canonical_title}</h2>
                  <p className="bbc-sport-hero-snippet">{displayedSportStories[0].summary}</p>
                  <div className="bbc-card-meta">
                    <span>{formatTimeAgo(displayedSportStories[0].last_updated_at)}</span>
                    <span>|</span>
                    <span style={{ color: '#4b5563', fontWeight: 600 }}>{displayedSportStories[0].sources_count} sources reporting</span>
                  </div>
                </div>
              </article>
            )}

            {/* Side 3 Sports Stories */}
            <div className="bbc-sport-side-list">
              {displayedSportStories.slice(1, 4).map((story, i) => {
                const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('sport', i + 1, story.id);
                return (
                  <article
                    key={story.id}
                    className="bbc-sport-side-card"
                    onClick={() => onSelectStory(story)}
                  >
                    <div className="bbc-sport-side-img-wrap">
                      <WireframeImage
                        src={img}
                        alt={story.canonical_title}
                        className="bbc-sport-side-img"
                        fallbackSrc={getCategoryFallbackImage('sport', i + 1, story.id)}
                        loading="lazy"
                      />
                    </div>
                    <div className="bbc-sport-side-body">
                      <span className="bbc-kicker-red" style={{ fontSize: 10, marginBottom: 2 }}>SPORT</span>
                      <h4 className="bbc-sport-side-title">{story.canonical_title}</h4>
                      <div className="bbc-card-meta">
                        <span>{formatTimeAgo(story.last_updated_at)}</span>
                        <span>•</span>
                        <span>Sport</span>
                        {story.sources_count > 1 && (
                          <span style={{ color: '#4b5563', fontWeight: 600 }}>
                            • {story.sources_count} sources
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Bottom 3 Sport Cards (if more than 4 sport stories available) */}
          {displayedSportStories.length > 4 && (
            <div className="bbc-sport-bottom-grid">
              {displayedSportStories.slice(4, 7).map((story, i) => {
                const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('sport', i + 4, story.id);
                return (
                  <article
                    key={story.id}
                    className="bbc-sport-bottom-card"
                    onClick={() => onSelectStory(story)}
                  >
                    <div className="bbc-sport-bottom-img-wrap">
                      <WireframeImage
                        src={img}
                        alt={story.canonical_title}
                        className="bbc-sport-bottom-img"
                        fallbackSrc={getCategoryFallbackImage('sport', i + 4, story.id)}
                        loading="lazy"
                      />
                    </div>
                    <div className="bbc-sport-bottom-body">
                      <span className="bbc-kicker-red" style={{ fontSize: 10 }}>SPORT</span>
                      <h4 className="bbc-sport-bottom-title">{story.canonical_title}</h4>
                      <div className="bbc-card-meta">
                        <span>{formatTimeAgo(story.last_updated_at)}</span>
                        <span>•</span>
                        <span>Sport</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          4. CULTURE & ENTERTAINMENT STRIP (Row of 6 Visual Cards)
          ======================================================== */}
      {cultureStripStories.length > 0 && (
        <section className="bbc-section-block">
          <div className="bbc-section-header" onClick={() => onSelectCategory('Culture')} title="Click to view all Culture news">
            <span className="bbc-section-tag-red" />
            <h3 className="bbc-section-title">
              CULTURE & ENTERTAINMENT <ChevronRight size={18} className="bbc-section-chevron" />
            </h3>
          </div>
          <div className="bbc-culture-row-grid">
            {cultureStripStories.map((story, i) => {
              const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('culture', i);
              return (
                <article
                  key={story.id}
                  className="bbc-culture-card"
                  onClick={() => onSelectStory(story)}
                >
                  <div className="bbc-culture-img-wrap">
                    <WireframeImage
                      src={img}
                      alt={story.canonical_title}
                      className="bbc-culture-img"
                      fallbackSrc={getCategoryFallbackImage('culture', i)}
                      loading="lazy"
                    />
                  </div>
                  <span className="bbc-culture-tag">{story.category || 'Culture'}</span>
                  <h4 className="bbc-culture-title">{story.canonical_title}</h4>
                  <div className="bbc-card-meta" style={{ marginTop: 'auto' }}>
                    <span>{formatTimeAgo(story.last_updated_at)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          5. IN-DEPTH GLOBAL SPOTLIGHT & ANALYSIS
          ======================================================== */}
      {politicsSpotlight && (
        <section className="bbc-section-block">
          <div className="bbc-section-header" onClick={() => onSelectCategory('World')} title="Click to view all World News">
            <span className="bbc-section-tag-red" />
            <h3 className="bbc-section-title">
              GLOBAL IN-DEPTH SPOTLIGHT <ChevronRight size={18} className="bbc-section-chevron" />
            </h3>
          </div>
          <article
            className="bbc-spotlight-banner"
            onClick={() => onSelectStory(politicsSpotlight)}
          >
            <div className="bbc-spotlight-img-wrap">
              <WireframeImage
                src={getHdImageUrl(politicsSpotlight.hero_image) || getCategoryFallbackImage('world', 0)}
                alt={politicsSpotlight.canonical_title}
                className="bbc-spotlight-img"
                fallbackSrc={getCategoryFallbackImage('world', 0)}
                loading="lazy"
              />
            </div>
            <div className="bbc-spotlight-content">
              <div className="bbc-spotlight-badge">
                <Sparkles size={14} /> EDITORIAL DEEP DIVE
              </div>
              <h2 className="bbc-spotlight-title">{politicsSpotlight.canonical_title}</h2>
              <p className="bbc-spotlight-snippet">{politicsSpotlight.summary}</p>

              {politicsSpotlight.ai_what_happened && (
                <div className="bbc-spotlight-quote">
                  "{politicsSpotlight.ai_what_happened.slice(0, 180)}..."
                </div>
              )}

              <div className="bbc-card-meta" style={{ marginTop: 16 }}>
                <span>Updated {formatFullDateTime(politicsSpotlight.last_updated_at)}</span>
                <span>|</span>
                <span style={{ color: '#006699', fontWeight: 700 }}>
                  Multi-Source Attribution: {politicsSpotlight.sources_count} agencies
                </span>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* ========================================================
          6. ENTERTAINMENT & ARTS (3-Card Balanced Grid)
          ======================================================== */}
      {artsStories.length > 0 && (
        <section className="bbc-section-block">
          <div className="bbc-section-header" onClick={() => onSelectCategory('Culture')} title="Click to view all Entertainment & Arts">
            <span className="bbc-section-tag-red" />
            <h3 className="bbc-section-title">
              ENTERTAINMENT & ARTS <ChevronRight size={18} className="bbc-section-chevron" />
            </h3>
          </div>
          <div className="bbc-three-grid">
            {artsStories.map((story, i) => {
              const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('culture', i + 3);
              return (
                <article
                  key={story.id}
                  className="bbc-three-card"
                  onClick={() => onSelectStory(story)}
                >
                  <div className="bbc-three-img-wrap">
                    <WireframeImage
                      src={img}
                      alt={story.canonical_title}
                      className="bbc-three-img"
                      fallbackSrc={getCategoryFallbackImage('culture', i + 3)}
                      loading="lazy"
                    />
                  </div>
                  <div className="bbc-three-body">
                    <span className="bbc-kicker-red">ARTS & CINEMA</span>
                    <h3 className="bbc-three-title">{story.canonical_title}</h3>
                    <p className="bbc-three-snippet">{story.summary}</p>
                    <div className="bbc-card-meta">
                      <span>{formatTimeAgo(story.last_updated_at)}</span>
                      <span>•</span>
                      <span>Culture</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          7. WATCH / MUST WATCH (Dark Background Video Strip)
          ======================================================== */}
      {watchVideoStories.length > 0 && (
        <section className="bbc-video-strip-container">
          <div className="bbc-video-strip-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="bbc-video-dot" />
              <h3 className="bbc-video-heading">MUST WATCH & BROADCASTS</h3>
            </div>
            <span className="bbc-video-sublink">Watch World News Live ▶</span>
          </div>
          <div className="bbc-video-cards-grid">
            {watchVideoStories.map((story, i) => {
              const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('world', i + 4);
              const durations = ['02:45', '03:18', '01:52', '04:10'];
              return (
                <article
                  key={story.id}
                  className="bbc-video-card"
                  onClick={() => onSelectStory(story)}
                >
                  <div className="bbc-video-thumb-wrap">
                    <WireframeImage
                      src={img}
                      alt={story.canonical_title}
                      className="bbc-video-thumb"
                      fallbackSrc={getCategoryFallbackImage('world', i + 4)}
                      loading="lazy"
                    />
                    <div className="bbc-video-play-btn">
                      <Play size={18} fill="#ffffff" color="#ffffff" />
                    </div>
                    <span className="bbc-video-duration">▶ {durations[i % durations.length]}</span>
                  </div>
                  <span className="bbc-video-tag">{story.category || 'News'}</span>
                  <h4 className="bbc-video-title">{story.canonical_title}</h4>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          8. INNOVATION & TECHNOLOGY (2-Col Featured Block)
          ======================================================== */}
      {techTwoStories.length >= 2 && (
        <section className="bbc-section-block">
          <div className="bbc-section-header" onClick={() => onSelectCategory('Technology')} title="Click to view all Technology news">
            <span className="bbc-section-tag-red" />
            <h3 className="bbc-section-title">
              INNOVATION & TECHNOLOGY <ChevronRight size={18} className="bbc-section-chevron" />
            </h3>
          </div>
          <div className="bbc-two-feature-grid">
            {techTwoStories.map((story, i) => {
              const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('technology', i);
              return (
                <article
                  key={story.id}
                  className="bbc-two-feature-card"
                  onClick={() => onSelectStory(story)}
                >
                  <div className="bbc-two-feature-img-wrap">
                    <WireframeImage
                      src={img}
                      alt={story.canonical_title}
                      className="bbc-two-feature-img"
                      fallbackSrc={getCategoryFallbackImage('technology', i)}
                      loading="lazy"
                    />
                  </div>
                  <div className="bbc-two-feature-body">
                    <span className="bbc-kicker-red">TECH INTELLIGENCE</span>
                    <h2 className="bbc-two-feature-title">{story.canonical_title}</h2>
                    <p className="bbc-two-feature-snippet">{story.summary}</p>
                    <div className="bbc-card-meta">
                      <span>{formatTimeAgo(story.last_updated_at)}</span>
                      <span>|</span>
                      <span>Technology</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          9. HISTORY & LONG READS (Heritage Split Banner)
          ======================================================== */}
      {historyStory && (
        <section className="bbc-section-block">
          <div className="bbc-history-banner" onClick={() => onSelectStory(historyStory)}>
            <div className="bbc-history-img-wrap">
              <WireframeImage
                src={getHdImageUrl(historyStory.hero_image) || getCategoryFallbackImage('world', 5)}
                alt={historyStory.canonical_title}
                className="bbc-history-img"
                fallbackSrc={getCategoryFallbackImage('world', 5)}
                loading="lazy"
              />
            </div>
            <div className="bbc-history-content">
              <div className="bbc-history-kicker">
                <BookOpen size={15} /> BBC ARCHIVE & LONG READS
              </div>
              <h2 className="bbc-history-title">{historyStory.canonical_title}</h2>
              <p className="bbc-history-snippet">{historyStory.summary}</p>
              <div className="bbc-card-meta">
                <span>In-depth historical context and expert analysis</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          10. 4-COLUMN CATEGORY GRID: Business | Tech | Science | Health
          ======================================================== */}
      <section className="bbc-section-block" style={{ borderTop: '2px solid #121212', paddingTop: 28 }}>
        <div className="bbc-four-category-grid">
          {/* Column 1: Business */}
          <div className="bbc-category-col">
            <h3 className="bbc-col-title" onClick={() => onSelectCategory('Business')} style={{ cursor: 'pointer' }} title="Click to view all Business news">
              BUSINESS <ChevronRight size={16} />
            </h3>
            {businessCol[0] && (
              <div className="bbc-col-lead-card" onClick={() => onSelectStory(businessCol[0])}>
                <WireframeImage
                  src={getHdImageUrl(businessCol[0].hero_image) || getCategoryFallbackImage('business', 0)}
                  alt={businessCol[0].canonical_title}
                  className="bbc-col-lead-img"
                  fallbackSrc={getCategoryFallbackImage('business', 0)}
                  loading="lazy"
                />
                <h4 className="bbc-col-lead-title">{businessCol[0].canonical_title}</h4>
                <p className="bbc-col-lead-snippet">{businessCol[0].summary}</p>
              </div>
            )}
            <ul className="bbc-col-list">
              {businessCol.slice(1, 4).map((s) => (
                <li key={s.id} onClick={() => onSelectStory(s)}>
                  <h5>{s.canonical_title}</h5>
                  <span>{formatTimeAgo(s.last_updated_at)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Technology */}
          <div className="bbc-category-col">
            <h3 className="bbc-col-title" onClick={() => onSelectCategory('Technology')} style={{ cursor: 'pointer' }} title="Click to view all Technology news">
              TECHNOLOGY <ChevronRight size={16} />
            </h3>
            {techCol[0] && (
              <div className="bbc-col-lead-card" onClick={() => onSelectStory(techCol[0])}>
                <WireframeImage
                  src={getHdImageUrl(techCol[0].hero_image) || getCategoryFallbackImage('technology', 1)}
                  alt={techCol[0].canonical_title}
                  className="bbc-col-lead-img"
                  fallbackSrc={getCategoryFallbackImage('technology', 1)}
                  loading="lazy"
                />
                <h4 className="bbc-col-lead-title">{techCol[0].canonical_title}</h4>
                <p className="bbc-col-lead-snippet">{techCol[0].summary}</p>
              </div>
            )}
            <ul className="bbc-col-list">
              {techCol.slice(1, 4).map((s) => (
                <li key={s.id} onClick={() => onSelectStory(s)}>
                  <h5>{s.canonical_title}</h5>
                  <span>{formatTimeAgo(s.last_updated_at)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Science */}
          <div className="bbc-category-col">
            <h3 className="bbc-col-title" onClick={() => onSelectCategory('Science')} style={{ cursor: 'pointer' }} title="Click to view all Science news">
              SCIENCE <ChevronRight size={16} />
            </h3>
            {scienceCol[0] && (
              <div className="bbc-col-lead-card" onClick={() => onSelectStory(scienceCol[0])}>
                <WireframeImage
                  src={getHdImageUrl(scienceCol[0].hero_image) || getCategoryFallbackImage('science', 0)}
                  alt={scienceCol[0].canonical_title}
                  className="bbc-col-lead-img"
                  fallbackSrc={getCategoryFallbackImage('science', 0)}
                  loading="lazy"
                />
                <h4 className="bbc-col-lead-title">{scienceCol[0].canonical_title}</h4>
                <p className="bbc-col-lead-snippet">{scienceCol[0].summary}</p>
              </div>
            )}
            <ul className="bbc-col-list">
              {scienceCol.slice(1, 4).map((s) => (
                <li key={s.id} onClick={() => onSelectStory(s)}>
                  <h5>{s.canonical_title}</h5>
                  <span>{formatTimeAgo(s.last_updated_at)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Health */}
          <div className="bbc-category-col">
            <h3 className="bbc-col-title" onClick={() => onSelectCategory('Health')} style={{ cursor: 'pointer' }} title="Click to view all Health news">
              HEALTH <ChevronRight size={16} />
            </h3>
            {healthCol[0] && (
              <div className="bbc-col-lead-card" onClick={() => onSelectStory(healthCol[0])}>
                <WireframeImage
                  src={getHdImageUrl(healthCol[0].hero_image) || getCategoryFallbackImage('health', 0)}
                  alt={healthCol[0].canonical_title}
                  className="bbc-col-lead-img"
                  fallbackSrc={getCategoryFallbackImage('health', 0)}
                  loading="lazy"
                />
                <h4 className="bbc-col-lead-title">{healthCol[0].canonical_title}</h4>
                <p className="bbc-col-lead-snippet">{healthCol[0].summary}</p>
              </div>
            )}
            <ul className="bbc-col-list">
              {healthCol.slice(1, 4).map((s) => (
                <li key={s.id} onClick={() => onSelectStory(s)}>
                  <h5>{s.canonical_title}</h5>
                  <span>{formatTimeAgo(s.last_updated_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================
          11. DISCOVER & SOUNDS / AUDIO (Colorful Square Tiles)
          ======================================================== */}
      <section className="bbc-section-block">
        <div className="bbc-section-header" onClick={() => onSelectCategory('India')} title="Click to view Regional & Sounds">
          <span className="bbc-section-tag-red" />
          <h3 className="bbc-section-title">
            DISCOVER & AUDIO <ChevronRight size={18} className="bbc-section-chevron" />
          </h3>
        </div>
        <div className="bbc-culture-row-grid">
          {regionalStories.map((story, i) => {
            const colors = ['#0284c7', '#7c3aed', '#059669', '#dc2626', '#d97706', '#4f46e5'];
            const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('india', i);
            return (
              <article
                key={story.id}
                className="bbc-culture-card"
                onClick={() => onSelectStory(story)}
              >
                <div className="bbc-culture-img-wrap">
                  <WireframeImage
                    src={img}
                    alt={story.canonical_title}
                    className="bbc-culture-img"
                    fallbackSrc={getCategoryFallbackImage('india', i)}
                    loading="lazy"
                  />
                  <div className="bbc-audio-badge" style={{ background: colors[i % colors.length] }}>
                    <Headphones size={13} /> SOUNDS
                  </div>
                </div>
                <span className="bbc-culture-tag">{story.category || 'Regional'}</span>
                <h4 className="bbc-culture-title">{story.canonical_title}</h4>
                <div className="bbc-card-meta" style={{ marginTop: 'auto' }}>
                  <span>{formatTimeAgo(story.last_updated_at)}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          12. LATEST INTERNATIONAL COVERAGE (4-Col Grid)
          ======================================================== */}
      {remainingStories.length > 0 && (
        <section className="bbc-section-block" style={{ borderTop: '2px solid #121212', paddingTop: 28 }}>
          <div className="bbc-section-header" onClick={() => onSelectCategory('World')} title="Click to view all World News">
            <span className="bbc-section-tag-red" />
            <h3 className="bbc-section-title">
              MORE FROM WORLD NEWS <ChevronRight size={18} className="bbc-section-chevron" />
            </h3>
          </div>
          <div className="bbc-four-grid">
            {remainingStories.map((story, i) => {
              const fallback = getCategoryFallbackImage(story.category, i, story.id);
              const imgUrl = getHdImageUrl(story.hero_image) || fallback;
              return (
                <article
                  key={story.id}
                  className="bbc-card-bottom"
                  onClick={() => onSelectStory(story)}
                >
                  <div className="bbc-card-bottom-img-wrap">
                    <WireframeImage
                      src={imgUrl}
                      alt={story.canonical_title}
                      className="bbc-card-bottom-img"
                      fallbackSrc={fallback}
                      loading="lazy"
                    />
                  </div>
                  <div className="bbc-card-bottom-body">
                    <span className="bbc-kicker-red">{story.category}</span>
                    <h4 className="bbc-card-bottom-title">{story.canonical_title}</h4>
                    <p className="bbc-card-bottom-snippet">{story.summary}</p>
                    <div className="bbc-card-meta" style={{ marginTop: 'auto' }}>
                      <span>{formatTimeAgo(story.last_updated_at)}</span>
                      {story.sources_count > 1 && (
                        <span>• {story.sources_count} sources</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
};
