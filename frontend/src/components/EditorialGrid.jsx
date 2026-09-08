import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  Headphones,
  TrendingUp,
  TrendingDown,
  Film,
  Globe,
  Activity,
  Cpu,
  Compass,
  BookOpen,
  Radio,
  Sparkles,
  Flame,
  BarChart2,
  DollarSign
} from 'lucide-react';
import { WireframeImage } from './WireframeImage';

const DEFAULT_NEWS_IMAGE = "";

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

// Authentic journalistic category source image registry
export const getCategoryFallbackImage = (category, index = 0, seed = '') => {
  const cat = (category || '').toLowerCase().trim();

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

  const categorySourceImages = {
    science: [
      'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1600&auto=format&fit=crop&q=90', // Scientific research lab & DNA
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1600&auto=format&fit=crop&q=90', // Laboratory discovery & glassware
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=90', // Deep space observatory & astronomy
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&auto=format&fit=crop&q=90', // Chemistry & physics research
      'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=1600&auto=format&fit=crop&q=90'  // Paleontology & excavation research
    ],
    technology: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=90', // Silicon microchip & computing
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=90', // Cybersecurity & data systems
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1600&auto=format&fit=crop&q=90', // AI robotics & hardware
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&auto=format&fit=crop&q=90'  // Cloud server architecture
    ],
    health: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&auto=format&fit=crop&q=90', // Medical stethoscope & diagnosis
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1600&auto=format&fit=crop&q=90', // Hospital lab & clinical trials
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1600&auto=format&fit=crop&q=90', // Doctor consultation & clinic
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1600&auto=format&fit=crop&q=90'  // Advanced medical scan technology
    ],
    business: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=90', // Financial district skyscrapers
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&auto=format&fit=crop&q=90', // Executive business conference
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&auto=format&fit=crop&q=90', // Global commerce & trade
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1600&auto=format&fit=crop&q=90'  // Markets & commerce
    ],
    sport: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600&auto=format&fit=crop&q=90', // Track athletics & running
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&auto=format&fit=crop&q=90', // Floodlit stadium arena
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1600&auto=format&fit=crop&q=90', // Championship soccer
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1600&auto=format&fit=crop&q=90'  // Cricket arena
    ],
    world: [
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=90', // Global summit & diplomacy
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1600&auto=format&fit=crop&q=90', // Press conference & microphones
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1600&auto=format&fit=crop&q=90', // International flags & summit
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=90'  // Earth globe satellite view
    ],
    stock: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&auto=format&fit=crop&q=90', // Stock trading market screens
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1600&auto=format&fit=crop&q=90'  // NYSE floor trading
    ],
    culture: [
      'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=1600&auto=format&fit=crop&q=90', // Film & cinema festival
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=90', // Stage & musical performance
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format&fit=crop&q=90'  // Cinema film production
    ],
    india: [
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&auto=format&fit=crop&q=90', // National monument / Red Fort
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600&auto=format&fit=crop&q=90'  // India Gate New Delhi
    ]
  };

  const pool = categorySourceImages[cat] || categorySourceImages.world;
  return pool[offset % pool.length];
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

export const formatTimeAgo = (dateStr) => {
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

const LIVE_CHANNELS = {
  dw: {
    id: 'dw',
    name: '24/7 Global News Stream (HD)',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  france24: {
    id: 'france24',
    name: 'France 24 Live (English)',
    type: 'iframe',
    embedUrl: 'https://www.dailymotion.com/embed/video/x2lezs1?autoplay=1'
  },
  skynews: {
    id: 'skynews',
    name: 'Sky News Live Stream',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  }
};

const stockRegexPatterns = {
  'BSE & NSE': /bse|nse|nifty|sensex|dalal street|sebi|tata|reliance|infosys|hdfc|sbi|itc|adani|rupee|lic|kotak|airtel|l&t|maruti|share|shares|dividend|investor|equity|equities/i,
  'Wall Street': /wall street|dow jones|s&p 500|nasdaq|nyse|fed|federal reserve|powell|treasury|us stocks|dollar|yield|bond|bonds|inflation/i,
  'Tech Stocks': /apple|microsoft|nvidia|google|alphabet|amazon|meta|tesla|chip|semiconductor|ai stocks|tech rally|openai|deepseek|broadcom/i,
  'Earnings & IPOs': /ipo|earnings|quarterly|q1|q2|q3|q4|dividend|profit|revenue|listing|valuation|results|merger|acquisition|guidance|target/i
};

const matchesStockSub = (story, sub) => {
  if (!story || (story.category || '').toLowerCase() !== 'stock') return false;
  if (sub === 'All' || sub === 'All Markets') return true;
  const pat = stockRegexPatterns[sub];
  if (!pat) return false;
  const textToSearch = `${story.canonical_title || ''} ${story.summary || ''} ${story.slug || ''}`;
  return pat.test(textToSearch);
};

const sportRegexPatterns = {
  Cricket: /cricket|ipl|bcci|\bicc\b|test match|\bodi\b|\bt20\b|wicket|batsman|bowler|innings|rohit|virat|kohli|bumrah|dhoni|\bcsk\b|gambhir|kuggeleijn|hampshire|babar/i,
  Football: /football|soccer|premier league|champions league|la liga|serie a|fifa|messi|ronaldo|manchester|arsenal|chelsea|liverpool|bayern|real madrid|barcelona|psg|tottenham|epl|haaland|mbappe|striker|goalkeeper|uefa|\bnfl\b|quarterback|touchdown|brighton|newcastle|everton|azeez|fernandez|tielemans|clippers|\bnba\b/i,
  Tennis: /tennis|us open|wimbledon|australian open|french open|roland garros|djokovic|alcaraz|sinner|nadal|federer|swiatek|sabalenka|gauff|\batp\b|\bwta\b|grand slam|boulter|lucky loser/i,
  'Formula 1': /formula 1|formula one|\bf1\b|grand prix|verstappen|hamilton|ferrari|mercedes|red bull|mclaren|leclerc|norris|russell|\bfia\b|motorsport|\bgp\b/i,
  Golf: /golf|\bpga\b|liv golf|ryder cup|masters|tiger woods|mcilroy|scheffler|open championship/i,
  Athletics: /athletics|olympic|marathon|runner|sprint|100m|200m|track and field|relay|hurdles|pole vault|long jump|salas|pudge|\bmlb\b|baseball|badminton/i
};

const matchesSportSub = (story, sub) => {
  if (!story || (story.category || '').toLowerCase() !== 'sport') return false;
  if (sub === 'All' || sub === 'All Sport') return true;
  const pat = sportRegexPatterns[sub];
  if (!pat) return false;
  const textToSearch = `${story.canonical_title || ''} ${story.summary || ''} ${story.slug || ''}`;
  return pat.test(textToSearch);
};

// Pure category interleaver for high-speed zero-jank stream rendering
const interleaveDiverseStories = (storyList) => {
  if (!storyList || storyList.length <= 1) return storyList;
  const buckets = {};
  const categoriesInOrder = [];
  storyList.forEach((s) => {
    const cat = s.category || 'General';
    if (!buckets[cat]) {
      buckets[cat] = [];
      categoriesInOrder.push(cat);
    }
    buckets[cat].push(s);
  });
  const interleaved = [];
  let added = true;
  let round = 0;
  while (added) {
    added = false;
    for (const cat of categoriesInOrder) {
      if (round < buckets[cat].length) {
        interleaved.push(buckets[cat][round]);
        added = true;
      }
    }
    round++;
  }
  return interleaved;
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
  const [selectedStockSub, setSelectedStockSub] = useState('All');
  const [streamCategory, setStreamCategory] = useState('All');
  const [visibleStreamCount, setVisibleStreamCount] = useState(18);

  // Active video player state for MUST WATCH & BROADCASTS
  const [activeVideoItem, setActiveVideoItem] = useState(null);
  const [selectedLiveChannel, setSelectedLiveChannel] = useState('dw');

  // Reset slide index whenever active category or country changes
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [activeCategory, selectedCountry]);

  const isCountryFiltered = selectedCountry && selectedCountry !== 'all';
  const isCategoryFiltered = activeCategory && activeCategory !== 'all';

  // 1. High-speed O(1) category image index across all stories (computed only when stories or categoryStories change)
  const categoryImageIndex = useMemo(() => {
    const map = {};
    for (const s of stories) {
      const cat = (s.category || '').toLowerCase();
      if (cat && s.hero_image && !map[cat]) {
        map[cat] = getHdImageUrl(s.hero_image);
      }
    }
    for (const [cat, list] of Object.entries(categoryStories)) {
      const catKey = cat.toLowerCase();
      if (!map[catKey] && Array.isArray(list)) {
        const found = list.find(s => s && s.hero_image);
        if (found) map[catKey] = getHdImageUrl(found.hero_image);
      }
    }
    return map;
  }, [stories, categoryStories]);

  // 2. High-speed O(1) image resolver: story direct -> category sibling -> category registry fallback
  const resolveStoryImage = useCallback((story, category = '', idx = 0) => {
    if (!story) return getCategoryFallbackImage(category, idx);
    const direct = getHdImageUrl(story.hero_image || story.image_url);
    if (direct && direct.trim() !== '') return direct;

    const catKey = (category || story.category || 'world').toLowerCase();
    if (categoryImageIndex[catKey]) return categoryImageIndex[catKey];

    return getCategoryFallbackImage(catKey, idx, story.id);
  }, [categoryImageIndex]);

  // 3. Master Partitioned Sections Cache: Only recalculates when data or filter props change (NEVER on slide or hover!)
  const partitionedSections = useMemo(() => {
    const countryStories = isCountryFiltered
      ? stories.filter((s) => s.country && s.country.toLowerCase() === selectedCountry.toLowerCase())
      : stories;

    const categoryFilteredStories = isCategoryFiltered
      ? countryStories.filter((s) => s.category?.toLowerCase() === activeCategory.toLowerCase())
      : countryStories;

    const displayPool = categoryFilteredStories.length > 0 ? categoryFilteredStories : countryStories;
    const usedStoryIds = new Set();

    // 1. Stories for the Hero Slider
    const heroSliderStories = [];
    if (displayPool.length > 0) {
      if (!isCategoryFiltered) {
        const majorCategories = ['World', 'Stock', 'Technology', 'Sport', 'Business', 'Science', 'Health', 'Culture', 'India'];
        const heroPickedIds = new Set();

        if (heroStory && (!isCountryFiltered || heroStory.country?.toLowerCase() === selectedCountry.toLowerCase())) {
          heroSliderStories.push(heroStory);
          heroPickedIds.add(heroStory.id);
        }

        for (const cat of majorCategories) {
          if (heroSliderStories.length >= 8) break;
          const matchingStory = displayPool.find(
            (s) => s.category?.toLowerCase() === cat.toLowerCase() && !heroPickedIds.has(s.id) && s.hero_image
          ) || displayPool.find(
            (s) => s.category?.toLowerCase() === cat.toLowerCase() && !heroPickedIds.has(s.id)
          );
          if (matchingStory) {
            heroSliderStories.push(matchingStory);
            heroPickedIds.add(matchingStory.id);
          }
        }

        for (const s of displayPool) {
          if (heroSliderStories.length >= 8) break;
          if (!heroPickedIds.has(s.id) && s.hero_image) {
            heroSliderStories.push(s);
            heroPickedIds.add(s.id);
          }
        }
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

    if (heroSliderStories.length === 0 && stories.length > 0) {
      heroSliderStories.push(...stories.slice(0, 8));
    }
    heroSliderStories.forEach((s) => usedStoryIds.add(s.id));

    // 2. Stories for Hero Right Column (Top Developments)
    const rightColumnStories = [];
    const rightColCatCount = {};
    for (const s of displayPool) {
      if (rightColumnStories.length >= 7) break;
      if (!usedStoryIds.has(s.id)) {
        const cat = (s.category || 'General').toLowerCase();
        if (!isCategoryFiltered && (rightColCatCount[cat] || 0) >= 1) {
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
    if (rightColumnStories.length === 0 && stories.length > 0) {
      for (const s of stories) {
        if (rightColumnStories.length >= 7) break;
        if (!usedStoryIds.has(s.id)) {
          rightColumnStories.push(s);
          usedStoryIds.add(s.id);
        }
      }
    }

    // 3. Category Helper with Guaranteed Topic Integrity
    const getCatList = (catName, count = 4) => {
      const key = catName.toLowerCase();
      const picked = [];

      const fromCat = (categoryStories[key] || [])
        .filter(
          (s) => (s.category || '').toLowerCase() === key && !usedStoryIds.has(s.id) && (!isCountryFiltered || s.country?.toLowerCase() === selectedCountry.toLowerCase())
        )
        .sort((a, b) => (b.hero_image ? 1 : 0) - (a.hero_image ? 1 : 0));
      for (const s of fromCat) {
        if (picked.length >= count) break;
        picked.push(s);
        usedStoryIds.add(s.id);
      }

      if (picked.length < count) {
        const matchingCat = countryStories
          .filter(
            (s) => (s.category || '').toLowerCase() === key && !usedStoryIds.has(s.id)
          )
          .sort((a, b) => (b.hero_image ? 1 : 0) - (a.hero_image ? 1 : 0));
        for (const s of matchingCat) {
          if (picked.length >= count) break;
          picked.push(s);
          usedStoryIds.add(s.id);
        }
      }

      if (picked.length < count) {
        const globalMatchingCat = stories
          .filter(
            (s) => (s.category || '').toLowerCase() === key && !usedStoryIds.has(s.id)
          )
          .sort((a, b) => (b.hero_image ? 1 : 0) - (a.hero_image ? 1 : 0));
        for (const s of globalMatchingCat) {
          if (picked.length >= count) break;
          picked.push(s);
          usedStoryIds.add(s.id);
        }
      }

      return picked;
    };

    // Trending two stories
    const trendingTwoStories = [];
    if (!isCategoryFiltered) {
      const trendingCats = new Set();
      for (const s of displayPool) {
        if (trendingTwoStories.length >= 2) break;
        const cat = (s.category || 'World').toLowerCase();
        if (!usedStoryIds.has(s.id) && !trendingCats.has(cat)) {
          trendingTwoStories.push(s);
          usedStoryIds.add(s.id);
          trendingCats.add(cat);
        }
      }
    }
    if (trendingTwoStories.length < 2) {
      const fallbackWorld = getCatList('World', 2 - trendingTwoStories.length);
      trendingTwoStories.push(...fallbackWorld);
    }

    const stockStories = getCatList('Stock', 8);
    const sportStories = getCatList('Sport', 7);
    const cultureStripStories = getCatList('Culture', 6);
    const politicsSpotlight = getCatList('World', 1)[0] || countryStories[0];
    const artsStories = getCatList('Culture', 3);

    const watchVideoStories = [];
    if (!isCategoryFiltered) {
      const videoCats = new Set();
      for (const s of displayPool) {
        if (watchVideoStories.length >= 4) break;
        const cat = (s.category || 'World').toLowerCase();
        if (!usedStoryIds.has(s.id) && !videoCats.has(cat)) {
          watchVideoStories.push(s);
          usedStoryIds.add(s.id);
          videoCats.add(cat);
        }
      }
    }
    if (watchVideoStories.length < 4) {
      const fallbackVid = getCatList('World', 4 - watchVideoStories.length);
      watchVideoStories.push(...fallbackVid);
    }

    const techTwoStories = getCatList('Technology', 2);
    const historyStory =
      (categoryStories['world'] || []).find((s) => !usedStoryIds.has(s.id) && s.hero_image) ||
      stories.find((s) => !usedStoryIds.has(s.id) && s.hero_image) ||
      getCatList('World', 1)[0] ||
      countryStories[0];
    const travelStories = getCatList('Culture', 2);

    const combinedStockList = [
      ...(categoryStories['stock'] || []),
      ...(categoryStories['Stock'] || []),
      ...stockStories,
      ...stories.filter((s) => (s.category || '').toLowerCase() === 'stock')
    ];

    const authenticStockStories = Array.from(
      new Map(
        combinedStockList
          .filter((s) => (s.category || '').toLowerCase() === 'stock')
          .map((s) => [s.id, s])
      ).values()
    ).sort((a, b) => (b.hero_image ? 1 : 0) - (a.hero_image ? 1 : 0));

    const combinedSportList = [
      ...(categoryStories['sport'] || []),
      ...(categoryStories['Sport'] || []),
      ...sportStories,
      ...stories.filter((s) => (s.category || '').toLowerCase() === 'sport')
    ];

    const authenticSportStories = Array.from(
      new Map(
        combinedSportList
          .filter((s) => (s.category || '').toLowerCase() === 'sport')
          .map((s) => [s.id, s])
      ).values()
    ).sort((a, b) => (b.hero_image ? 1 : 0) - (a.hero_image ? 1 : 0));

    const businessCol = getCatList('Business', 4);
    const techCol = getCatList('Technology', 4);
    const scienceCol = getCatList('Science', 4);
    const healthCol = getCatList('Health', 4);

    const regionalStories = getCatList('India', 4);
    const remainingStories = countryStories.filter((s) => !usedStoryIds.has(s.id)).slice(0, 32);

    return {
      countryStories,
      displayPool,
      heroSliderStories,
      rightColumnStories,
      trendingTwoStories,
      stockStories,
      sportStories,
      cultureStripStories,
      politicsSpotlight,
      artsStories,
      watchVideoStories,
      techTwoStories,
      historyStory,
      travelStories,
      authenticStockStories,
      authenticSportStories,
      businessCol,
      techCol,
      scienceCol,
      healthCol,
      regionalStories,
      remainingStories
    };
  }, [stories, categoryStories, heroStory, selectedCountry, activeCategory, isCountryFiltered, isCategoryFiltered]);

  const {
    heroSliderStories,
    rightColumnStories,
    trendingTwoStories,
    stockStories,
    sportStories,
    cultureStripStories,
    politicsSpotlight,
    artsStories,
    watchVideoStories,
    techTwoStories,
    historyStory,
    travelStories,
    authenticStockStories,
    authenticSportStories,
    businessCol,
    techCol,
    scienceCol,
    healthCol,
    regionalStories,
    remainingStories
  } = partitionedSections;

  // 4. Memoized Subcategory filters for Stock and Sport
  const displayedStockStories = useMemo(() => {
    if (selectedStockSub === 'All' || selectedStockSub === 'All Markets') {
      return authenticStockStories.slice(0, 7);
    }
    const filtered = authenticStockStories.filter((s) => matchesStockSub(s, selectedStockSub));
    return (filtered.length > 0 ? filtered : authenticStockStories).slice(0, 7);
  }, [authenticStockStories, selectedStockSub]);

  const displayedSportStories = useMemo(() => {
    if (selectedSportSub === 'All' || selectedSportSub === 'All Sport') {
      return authenticSportStories.slice(0, 7);
    }
    const filtered = authenticSportStories.filter((s) => matchesSportSub(s, selectedSportSub));
    return (filtered.length > 0 ? filtered : authenticSportStories).slice(0, 7);
  }, [authenticSportStories, selectedSportSub]);

  // 5. Memoized 24-Hour Chronological News Stream
  const streamData = useMemo(() => {
    const rawFiltered = stories.filter((s) => {
      if (isCountryFiltered && s.country?.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false;
      }
      if (streamCategory !== 'All' && (s.category || '').toLowerCase() !== streamCategory.toLowerCase()) {
        return false;
      }
      return true;
    });

    const streamFiltered = streamCategory === 'All' ? interleaveDiverseStories(rawFiltered) : rawFiltered;
    const displayedStream = streamFiltered.slice(0, visibleStreamCount);

    return {
      streamFiltered,
      displayedStream
    };
  }, [stories, selectedCountry, isCountryFiltered, streamCategory, visibleStreamCount]);

  const handlePrevSlide = useCallback((e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev === 0 ? heroSliderStories.length - 1 : prev - 1));
  }, [heroSliderStories.length]);

  const handleNextSlide = useCallback((e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % heroSliderStories.length);
  }, [heroSliderStories.length]);

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
          <div className="bbc-hero-poster-container" style={{ minHeight: 440 }} />
        )}

        {/* Right Column: 4 Top Developments Stories with Small Image Thumbnails */}
        <div className="bbc-grid-col-right-scroll">
          <div className="bbc-right-scroll-header">
            <TrendingUp size={16} /> Top Developments
          </div>

          <div className="bbc-right-scroll-content">
            {rightColumnStories.slice(0, 4).map((story, i) => {
              const fallback = getCategoryFallbackImage(story.category, i, story.id);
              const imgUrl = getHdImageUrl(story.hero_image) || fallback;
              return (
                <article
                  key={story.id}
                  className="bbc-top-dev-card"
                  onClick={() => onSelectStory(story)}
                >
                  <div className="bbc-top-dev-text">
                    <h4 className="bbc-top-dev-title">{story.canonical_title}</h4>
                    <p className="bbc-top-dev-snippet">{story.summary}</p>
                    <div className="bbc-top-dev-meta">
                      <span>{formatTimeAgo(story.last_updated_at)}</span>
                      <span>|</span>
                      <span>{story.category}</span>
                    </div>
                  </div>
                  <div className="bbc-top-dev-thumb-wrap">
                    <WireframeImage
                      src={imgUrl}
                      alt={story.canonical_title}
                      className="bbc-top-dev-thumb"
                      fallbackSrc={fallback}
                      loading="eager"
                    />
                  </div>
                </article>
              );
            })}
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
              TOP TRENDING <ChevronRight size={18} className="bbc-section-chevron" />
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
                      <span style={{ color: 'var(--bbc-red)', fontWeight: 700 }}>
                        Special Report
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          3. STOCK & FINANCIAL MARKETS SECTION
          ======================================================== */}
      {(!isCategoryFiltered || activeCategory.toLowerCase() === 'stock' || displayedStockStories.length > 0) && (
        <section className="bbc-section-block bbc-stock-section">
          {/* Authentic BBC Stock Header with In-Place Category Filtering */}
          <div className="bbc-stock-section-header">
            <div
              className="bbc-stock-header-left"
              onClick={() => onSelectCategory('Stock')}
              style={{ cursor: 'pointer' }}
              title="Click to view all Stock & Market news"
            >
              <span className="bbc-stock-header-bar" />
              <h3 className="bbc-stock-section-title">
                STOCK & MARKETS <ChevronRight size={18} className="bbc-sport-chevron" />
              </h3>
            </div>
            <div className="bbc-stock-pills-nav">
              {['All Markets', 'BSE & NSE', 'Wall Street', 'Tech Stocks', 'Earnings & IPOs'].map((sub) => {
                const isPillActive = selectedStockSub === sub || (sub === 'All Markets' && selectedStockSub === 'All');
                return (
                  <button
                    type="button"
                    key={sub}
                    className={`bbc-stock-pill ${isPillActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedStockSub(sub === 'All Markets' ? 'All' : sub);
                    }}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedStockSub !== 'All' && specificStockMatches.length === 0 && (
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              No current reports found specifically for {selectedStockSub}. Showing top market coverage:
            </div>
          )}

          <div className="bbc-stock-split-grid">
            {/* Main Featured Stock Card */}
            {displayedStockStories[0] && (
              <article
                className="bbc-stock-hero-card"
                onClick={() => onSelectStory(displayedStockStories[0])}
              >
                <div className="bbc-stock-hero-img-wrap">
                  <WireframeImage
                    src={getHdImageUrl(displayedStockStories[0].hero_image) || getCategoryFallbackImage('stock', 0, displayedStockStories[0].id)}
                    alt={displayedStockStories[0].canonical_title}
                    className="bbc-stock-hero-img"
                    fallbackSrc={getCategoryFallbackImage('stock', 0, displayedStockStories[0].id)}
                    loading="lazy"
                  />
                  {/* <div className="bbc-stock-live-badge">
                    <TrendingUp size={12} />
                    <span>MARKET INTELLIGENCE</span>
                  </div> */}
                </div>
                <div className="bbc-stock-hero-body">
                  <span className="bbc-kicker-red">MARKET FOCUS</span>
                  <h2 className="bbc-stock-hero-title">{displayedStockStories[0].canonical_title}</h2>
                  <p className="bbc-stock-hero-snippet">{displayedStockStories[0].summary}</p>
                  <div className="bbc-card-meta">
                    <span>{formatTimeAgo(displayedStockStories[0].last_updated_at)}</span>
                    <span>|</span>
                    <span style={{ color: '#4b5563', fontWeight: 600 }}>Market Analysis</span>
                  </div>
                </div>
              </article>
            )}

            {/* Side 3 Stock Stories */}
            <div className="bbc-stock-side-list">
              {displayedStockStories.slice(1, 4).map((story, i) => {
                const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('stock', i + 1, story.id);
                return (
                  <article
                    key={story.id}
                    className="bbc-stock-side-card"
                    onClick={() => onSelectStory(story)}
                  >
                    <div className="bbc-stock-side-img-wrap">
                      <WireframeImage
                        src={img}
                        alt={story.canonical_title}
                        className="bbc-stock-side-img"
                        fallbackSrc={getCategoryFallbackImage('stock', i + 1, story.id)}
                        loading="lazy"
                      />
                    </div>
                    <div className="bbc-stock-side-body">
                      <span className="bbc-kicker-red" style={{ fontSize: 10, marginBottom: 2 }}>STOCKS & EQUITIES</span>
                      <h4 className="bbc-stock-side-title">{story.canonical_title}</h4>
                      <div className="bbc-card-meta">
                        <span>{formatTimeAgo(story.last_updated_at)}</span>
                        <span>•</span>
                        <span>Stock</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Bottom 3 Stock Cards (if more than 4 stock stories available) */}
          {displayedStockStories.length > 4 && (
            <div className="bbc-stock-bottom-grid">
              {displayedStockStories.slice(4, 7).map((story, i) => {
                const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('stock', i + 4, story.id);
                return (
                  <article
                    key={story.id}
                    className="bbc-stock-bottom-card"
                    onClick={() => onSelectStory(story)}
                  >
                    <div className="bbc-stock-bottom-img-wrap">
                      <WireframeImage
                        src={img}
                        alt={story.canonical_title}
                        className="bbc-stock-bottom-img"
                        fallbackSrc={getCategoryFallbackImage('stock', i + 4, story.id)}
                        loading="lazy"
                      />
                    </div>
                    <div className="bbc-stock-bottom-body">
                      <span className="bbc-kicker-red" style={{ fontSize: 10 }}>MARKETS</span>
                      <h4 className="bbc-stock-bottom-title">{story.canonical_title}</h4>
                      <div className="bbc-card-meta">
                        <span>{formatTimeAgo(story.last_updated_at)}</span>
                        <span>•</span>
                        <span>Stock</span>
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
          4. SPORT SECTION (Featured Hero + 3 Side Cards + Highlights Row)
          ======================================================== */}
      {(!isCategoryFiltered || activeCategory.toLowerCase() === 'sport' || displayedSportStories.length > 0) && (
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
                  {/* <div className="bbc-sport-live-badge">
                    <span className="bbc-live-badge-dot" />
                    <span>MATCH COVERAGE</span>
                  </div> */}
                </div>
                <div className="bbc-sport-hero-body">
                  <span className="bbc-kicker-red">SPORT REPORT</span>
                  <h2 className="bbc-sport-hero-title">{displayedSportStories[0].canonical_title}</h2>
                  <p className="bbc-sport-hero-snippet">{displayedSportStories[0].summary}</p>
                  <div className="bbc-card-meta">
                    <span>{formatTimeAgo(displayedSportStories[0].last_updated_at)}</span>
                    <span>|</span>
                    <span style={{ color: '#4b5563', fontWeight: 600 }}>Match Coverage</span>
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
                <span style={{ color: 'var(--bbc-red)', fontWeight: 700 }}>
                  Exclusive Investigation
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
        <section className="bbc-video-strip-container" id="must-watch-section">
          <div className="bbc-video-strip-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="bbc-video-dot" />
              <h3 className="bbc-video-heading">MUST WATCH & BROADCASTS</h3>
            </div>
            <button
              type="button"
              className="bbc-video-sublink"
              onClick={() => {
                const ch = LIVE_CHANNELS[selectedLiveChannel || 'dw'];
                setActiveVideoItem({
                  type: ch.type || 'video',
                  channelKey: selectedLiveChannel || 'dw',
                  url: ch.url || ch.embedUrl,
                  title: 'World News 24/7 Global International Live Broadcast',
                  category: 'LIVE STREAM',
                  summary: 'Continuous 24-hour international news coverage, breaking headlines, global financial analysis, and investigative journalism live from world bureaus.'
                });
                const sec = document.getElementById('must-watch-section');
                if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#93c5fd',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Watch World News Live ▶
            </button>
          </div>

          {/* INLINE CINEMA VIDEO PLAYER */}
          {activeVideoItem && (
            <div className="bbc-cinema-player-box">
              <div className="bbc-cinema-player-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span className="bbc-cinema-live-badge">
                    <span className="bbc-cinema-live-pulse" />
                    {activeVideoItem.channelKey ? 'LIVE BROADCAST' : 'VIDEO REPORT'}
                  </span>
                  {activeVideoItem.channelKey && (
                    <div className="bbc-cinema-channel-pills">
                      {Object.entries(LIVE_CHANNELS).map(([k, ch]) => (
                        <button
                          key={k}
                          type="button"
                          className={`bbc-cinema-channel-btn ${activeVideoItem.channelKey === k ? 'is-active' : ''}`}
                          onClick={() => {
                            setSelectedLiveChannel(k);
                            setActiveVideoItem((prev) => ({
                              ...prev,
                              channelKey: k,
                              type: ch.type || 'video',
                              url: ch.url || ch.embedUrl,
                              title: `${ch.name} - Global Broadcast`
                            }));
                          }}
                        >
                          {ch.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="bbc-cinema-close-btn"
                  onClick={() => setActiveVideoItem(null)}
                  title="Close Video Player"
                >
                  <X size={15} /> Close Player
                </button>
              </div>

              {/* 16:9 Responsive Video Frame */}
              <div className="bbc-cinema-video-frame">
                {activeVideoItem.type === 'video' || activeVideoItem.url?.endsWith('.mp4') ? (
                  <video
                    key={activeVideoItem.url}
                    src={activeVideoItem.url}
                    controls
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: '520px',
                      backgroundColor: '#000000',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <iframe
                    key={activeVideoItem.url}
                    src={activeVideoItem.url}
                    title={activeVideoItem.title || 'World News Broadcast'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>

              {/* Video Metadata / Summary */}
              <div className="bbc-cinema-meta-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="bbc-cinema-meta-tag">{activeVideoItem.category || 'World'}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>• High Definition Global Feed</span>
                </div>
                <h3 className="bbc-cinema-meta-title">{activeVideoItem.title}</h3>
                {activeVideoItem.summary && (
                  <p className="bbc-cinema-meta-summary">{activeVideoItem.summary}</p>
                )}
                {activeVideoItem.story && (
                  <button
                    type="button"
                    className="bbc-cinema-read-article-btn"
                    onClick={() => onSelectStory(activeVideoItem.story)}
                  >
                    Read In-Depth Text Article ➜
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4 VIDEO CARDS GRID */}
          <div className="bbc-video-cards-grid">
            {watchVideoStories.map((story, i) => {
              const img = getHdImageUrl(story.hero_image) || getCategoryFallbackImage('world', i + 4);
              const durations = ['02:45', '03:18', '01:52', '04:10'];
              const videoStreams = [
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
              ];
              const isCurrentlyPlaying = activeVideoItem?.story?.id === story.id;

              return (
                <article
                  key={story.id}
                  className={`bbc-video-card ${isCurrentlyPlaying ? 'is-active-playing' : ''}`}
                  onClick={() => {
                    const vidUrl = story.video_url || videoStreams[i % videoStreams.length];
                    setActiveVideoItem({
                      type: 'video',
                      story,
                      title: story.canonical_title,
                      category: story.category || 'World',
                      url: vidUrl,
                      summary: story.summary || '',
                      index: i
                    });
                    const sec = document.getElementById('must-watch-section');
                    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                >
                  <div className="bbc-video-thumb-wrap">
                    {isCurrentlyPlaying && (
                      <span className="bbc-video-now-playing-badge">
                        NOW PLAYING 🔴
                      </span>
                    )}
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
                  <span className="bbc-video-tag">{story.category || 'World'}</span>
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
                <div className="bbc-col-lead-img-wrap">
                  <WireframeImage
                    src={resolveStoryImage(businessCol[0], 'business', 0)}
                    alt={businessCol[0].canonical_title}
                    className="bbc-col-lead-img"
                    fallbackSrc={getCategoryFallbackImage('business', 0, businessCol[0].id)}
                    loading="lazy"
                  />
                </div>
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
                <div className="bbc-col-lead-img-wrap">
                  <WireframeImage
                    src={resolveStoryImage(techCol[0], 'technology', 1)}
                    alt={techCol[0].canonical_title}
                    className="bbc-col-lead-img"
                    fallbackSrc={getCategoryFallbackImage('technology', 1, techCol[0].id)}
                    loading="lazy"
                  />
                </div>
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
                <div className="bbc-col-lead-img-wrap">
                  <WireframeImage
                    src={resolveStoryImage(scienceCol[0], 'science', 0)}
                    alt={scienceCol[0].canonical_title}
                    className="bbc-col-lead-img"
                    fallbackSrc={getCategoryFallbackImage('science', 0, scienceCol[0].id)}
                    loading="lazy"
                  />
                </div>
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
                <div className="bbc-col-lead-img-wrap">
                  <WireframeImage
                    src={resolveStoryImage(healthCol[0], 'health', 0)}
                    alt={healthCol[0].canonical_title}
                    className="bbc-col-lead-img"
                    fallbackSrc={getCategoryFallbackImage('health', 0, healthCol[0].id)}
                    loading="lazy"
                  />
                </div>
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
          12. PAST 24 HOURS: COMPLETE CHRONOLOGICAL NEWS STREAM
          ======================================================== */}
      {/* 12. PAST 24 HOURS: COMPLETE CHRONOLOGICAL NEWS STREAM */}
      <section className="bbc-stream-section">
        <div className="bbc-stream-header">
          <div className="bbc-stream-title-group">
            <span className="bbc-stream-bar" />
            <h3 className="bbc-stream-heading">
              MORE NEWS
            </h3>
          </div>
          <span className="bbc-stream-counter">
            Showing {Math.min(streamData.displayedStream.length, streamData.streamFiltered.length)} of {streamData.streamFiltered.length} stories
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="bbc-stream-pills">
          {['All', 'World', 'Business', 'Stock', 'Technology', 'Sport', 'Science', 'Health', 'Culture', 'India'].map((pill) => {
            const isActive = streamCategory.toLowerCase() === pill.toLowerCase();
            return (
              <button
                key={pill}
                className={`bbc-stream-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setStreamCategory(pill);
                  setVisibleStreamCount(18);
                }}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* Stories Grid */}
        <div className="bbc-stream-grid">
          {streamData.displayedStream.map((story, i) => {
            const fallback = getCategoryFallbackImage(story.category, i, story.id);
            const imgUrl = getHdImageUrl(story.hero_image) || fallback;
            return (
              <article
                key={`stream-${story.id}-${i}`}
                className="bbc-stream-card"
                onClick={() => onSelectStory(story)}
              >
                <div className="bbc-stream-img-wrap">
                  <WireframeImage
                    src={imgUrl}
                    alt={story.canonical_title}
                    className="bbc-stream-img"
                    fallbackSrc={fallback}
                    loading="lazy"
                  />
                </div>
                <div className="bbc-stream-body">
                  <div className="bbc-card-meta" style={{ marginBottom: 6 }}>
                    <span className="bbc-kicker-red">{story.category || 'News'}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(story.last_updated_at)}</span>
                  </div>
                  <h4 className="bbc-stream-card-title">{story.canonical_title}</h4>
                  <p className="bbc-stream-card-snippet">{story.summary}</p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Load More Button */}
        {visibleStreamCount < streamData.streamFiltered.length && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 32 }}>
            <button
              className="bbc-stream-load-more-btn"
              onClick={() => setVisibleStreamCount((prev) => prev + 18)}
            >
              Load More
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
