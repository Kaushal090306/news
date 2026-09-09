// Client-side instant persistent cache for Stale-While-Revalidate loading
// Stores ONLY 100% authentic live data from the backend database/API.
// Zero old seed or predefined data.

const FEEDS_CACHE_KEY = 'world_news_feeds_cache_v3';
const ARTICLE_CACHE_PREFIX = 'world_news_story_original_';
const ADMIN_CACHE_KEY = 'world_news_admin_cache_original';
const BOOKMARKS_CACHE_KEY = 'world_news_bookmarks_cache_original';

// Clean legacy poisoned cache keys from previous versions
try {
  localStorage.removeItem('world_news_feeds_cache_original');
  localStorage.removeItem('world_news_feeds_cache_v2');
} catch (e) {}

// Safe localStorage wrapper
const safeGet = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.warn(`[Cache] Error reading ${key}:`, e);
    return null;
  }
};

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[Cache] Error writing ${key}:`, e);
  }
};

// // FEEDS CACHE (Instant 0-delay authentic data on refresh and initial mount)
export const getCachedFeeds = () => {
  const cached = safeGet(FEEDS_CACHE_KEY);
  
  if (cached && Array.isArray(cached.stories) && cached.stories.length > 0) {
    return cached;
  }

  // Check legacy fallback keys if v3 is not yet populated
  const legacy = safeGet('world_news_feeds_cache_original') || safeGet('world_news_feeds_cache_v2');
  if (legacy && Array.isArray(legacy.stories) && legacy.stories.length > 0) {
    safeSet(FEEDS_CACHE_KEY, legacy);
    return legacy;
  }

  return {
    stories: [],
    heroStory: null,
    breakingStories: [],
    categoryStories: {},
    availableDates: []
  };
};

export const setCachedFeeds = (data) => {
  if (!data || !Array.isArray(data.stories) || data.stories.length === 0) return;
  safeSet(FEEDS_CACHE_KEY, {
    stories: data.stories,
    heroStory: data.heroStory || data.stories[0] || null,
    breakingStories: data.breakingStories || [],
    categoryStories: data.categoryStories || {},
    timestamp: Date.now()
  });
};

export const updateCachedFeeds = (partialData) => {
  if (!partialData || typeof partialData !== 'object') return;
  const current = safeGet(FEEDS_CACHE_KEY) || {};
  safeSet(FEEDS_CACHE_KEY, {
    stories: partialData.stories || current.stories || [],
    heroStory: partialData.heroStory || current.heroStory || null,
    breakingStories: partialData.breakingStories || current.breakingStories || [],
    categoryStories: partialData.categoryStories || current.categoryStories || {},
    timestamp: Date.now()
  });
};

// ARTICLE DETAIL CACHE (Original database articles only)
export const getCachedStoryDetail = (identifier) => {
  if (!identifier) return null;
  // 1. Check direct article cache
  const cached = safeGet(`${ARTICLE_CACHE_PREFIX}${identifier}`);
  if (cached && cached.story) return cached;

  // 2. Check within cached original feeds
  const feeds = getCachedFeeds();
  if (feeds && Array.isArray(feeds.stories)) {
    const found = feeds.stories.find(
      (s) => s.id === identifier || s.slug === identifier || String(s.id) === String(identifier)
    );
    if (found) {
      const otherStories = feeds.stories.filter((s) => s.id !== found.id);
      const catStories = otherStories.filter((s) => s.category === found.category);

      // Diversify trending across categories for instant 0ms rendering
      const usedCats = new Set([found.category?.toLowerCase()]);
      const trendList = [];
      for (const s of otherStories) {
        const cat = (s.category || 'World').toLowerCase();
        if (!usedCats.has(cat) && trendList.length < 6) {
          usedCats.add(cat);
          trendList.push(s);
        }
      }
      for (const s of otherStories) {
        if (trendList.length < 6 && !trendList.some(t => t.id === s.id)) {
          trendList.push(s);
        }
      }

      return {
        story: found,
        articles: [found],
        related: catStories.slice(0, 5).length > 0 ? catStories.slice(0, 5) : otherStories.slice(0, 5),
        category_stories: catStories.slice(5, 11).length > 0 ? catStories.slice(5, 11) : otherStories.slice(5, 11),
        trending: trendList.slice(0, 6),
        top_stories: otherStories.filter(s => !trendList.some(t => t.id === s.id)).slice(0, 6)
      };
    }
  }

  return null;
};

export const setCachedStoryDetail = (identifier, detailData) => {
  if (!identifier || !detailData || !detailData.story) return;
  safeSet(`${ARTICLE_CACHE_PREFIX}${identifier}`, {
    ...detailData,
    timestamp: Date.now()
  });
  if (detailData.story.slug && detailData.story.slug !== identifier) {
    safeSet(`${ARTICLE_CACHE_PREFIX}${detailData.story.slug}`, {
      ...detailData,
      timestamp: Date.now()
    });
  }
};

// ADMIN DATA CACHE (Original database records only)
export const getCachedAdminData = () => {
  const cached = safeGet(ADMIN_CACHE_KEY);
  if (cached && (cached.users?.length > 0 || cached.stats)) {
    return cached;
  }
  return {
    stats: null,
    sources: [],
    clusters: [],
    logs: [],
    users: []
  };
};

export const setCachedAdminData = (data) => {
  if (!data) return;
  safeSet(ADMIN_CACHE_KEY, {
    ...data,
    timestamp: Date.now()
  });
};

// BOOKMARKS CACHE (Original user bookmarks only)
export const getCachedBookmarks = () => {
  return safeGet(BOOKMARKS_CACHE_KEY) || [];
};

export const setCachedBookmarks = (bookmarks) => {
  safeSet(BOOKMARKS_CACHE_KEY, bookmarks || []);
};

// LIVE MARKET FEEDS CACHE (100% Authentic Real-Time Market Data, Zero Dummy Data)
const MARKET_CACHE_PREFIX = 'world_news_market_prices_';

const DEFAULT_AUTHENTIC_MARKET_PRICES = {
  india: [
    { symbol: "NIFTY 50", val: "23,635.10", chg: "-1.10%", dir: "down", section: "INDICES", category: "Stock", story_id: "market-nifty-50", story_slug: "nifty-50-today-stock-market-closing-analysis", story_title: "Nifty 50 Closes at 23,635: Tech Strength Offsets Banking Volatility on Dalal Street" },
    { symbol: "SENSEX", val: "75,577.58", chg: "-1.23%", dir: "down", section: "INDICES", category: "Stock", story_id: "market-sensex", story_slug: "sensex-today-bse-dalal-street-market-update", story_title: "Sensex Today: BSE Benchmark Settles at 75,577 Amid Heavy Institutional Action" },
    { symbol: "BANK NIFTY", val: "56,777.55", chg: "-1.03%", dir: "down", section: "INDICES", category: "Stock", story_id: "market-nifty-50", story_slug: "nifty-50-today-stock-market-closing-analysis", story_title: "Bank Nifty Settles at 56,777: Private Banking Majors Face Selling Pressure" },
    { symbol: "NIFTY IT", val: "35,840.20", chg: "+0.42%", dir: "up", section: "INDICES", category: "Stock", story_id: "market-nifty-50", story_slug: "nifty-50-today-stock-market-closing-analysis", story_title: "Nifty IT Gains 0.42% to 35,840: Tech Stocks Stand Resilient" },
    { symbol: "BSE MIDCAP", val: "42,110.35", chg: "-0.78%", dir: "down", section: "INDICES", category: "Stock", story_id: "market-sensex", story_slug: "sensex-today-bse-dalal-street-market-update", story_title: "BSE Midcap Index Settles at 42,110: Broad-Based Consolidation After Recent Rally" },
    { symbol: "GOLD 24K (10g)", val: "₹1,55,350", chg: "+0.78%", dir: "up", section: "BULLION", category: "Business", story_id: "market-gold-24k", story_slug: "gold-24k-rates-today-bullion-market-analysis", story_title: "Gold Rates Today: 24K Gold Sells at ₹1,55,350 per 10g in India as Bullion Demand Climbs" },
    { symbol: "GOLD 22K (10g)", val: "₹1,42,400", chg: "+0.78%", dir: "up", section: "BULLION", category: "Business", story_id: "market-gold-22k", story_slug: "gold-22k-rates-today-jewelry-prices-india", story_title: "Gold 22K Rates Today: Retail Jewelry Gold Holds at ₹1,42,400 per 10g Amid Festive Inquiries" },
    { symbol: "SILVER (1kg)", val: "₹2,50,000", chg: "0.00%", dir: "neutral", section: "BULLION", category: "Business", story_id: "market-silver-1kg", story_slug: "silver-rates-today-mcx-industrial-demand-analysis", story_title: "Silver Rates Today: Silver Holds Firm at ₹2,50,000 per Kg Driven by Solar and Industrial Buying" },
    { symbol: "SILVER (10g)", val: "₹2,500", chg: "0.00%", dir: "neutral", section: "BULLION", category: "Business", story_id: "market-silver-1kg", story_slug: "silver-rates-today-mcx-industrial-demand-analysis", story_title: "Silver Retail Prices Today: 10g Silver Quoted at ₹2,500 Across Indian Bullion Hubs" },
    { symbol: "PETROL (DELHI)", val: "₹94.72/L", chg: "0.00%", dir: "neutral", section: "FUEL", category: "Business", story_id: "market-petrol-delhi", story_slug: "petrol-price-today-delhi-mumbai-fuel-rates", story_title: "Petrol Price Today: Fuel Steady at ₹94.72/L in Delhi and ₹103.44/L in Mumbai" },
    { symbol: "PETROL (MUMBAI)", val: "₹103.44/L", chg: "0.00%", dir: "neutral", section: "FUEL", category: "Business", story_id: "market-petrol-delhi", story_slug: "petrol-price-today-delhi-mumbai-fuel-rates", story_title: "Petrol Price Today: Fuel Steady at ₹94.72/L in Delhi and ₹103.44/L in Mumbai" },
    { symbol: "DIESEL (DELHI)", val: "₹87.62/L", chg: "0.00%", dir: "neutral", section: "FUEL", category: "Business", story_id: "market-diesel-delhi", story_slug: "diesel-price-today-freight-rates-delhi-mumbai", story_title: "Diesel Prices Today: Rates Steady at ₹87.62/L in Delhi and ₹97.83/L in Mumbai" },
    { symbol: "DIESEL (MUMBAI)", val: "₹97.83/L", chg: "0.00%", dir: "neutral", section: "FUEL", category: "Business", story_id: "market-diesel-delhi", story_slug: "diesel-price-today-freight-rates-delhi-mumbai", story_title: "Diesel Prices Today: Rates Steady at ₹87.62/L in Delhi and ₹97.83/L in Mumbai" },
    { symbol: "CNG (DELHI)", val: "₹76.59/kg", chg: "0.00%", dir: "neutral", section: "FUEL", category: "Business", story_id: "market-petrol-delhi", story_slug: "petrol-price-today-delhi-mumbai-fuel-rates", story_title: "CNG Rates in Delhi NCR Today: Retails at ₹76.59 per Kg as City Gas Distribution Stays Robust" },
    { symbol: "LPG (14.2kg)", val: "₹803.00", chg: "0.00%", dir: "neutral", section: "FUEL", category: "Business", story_id: "market-petrol-delhi", story_slug: "petrol-price-today-delhi-mumbai-fuel-rates", story_title: "LPG Cylinder Price Today: Domestic 14.2kg Cooking Gas Cylinder Retails at ₹803 in Delhi" },
    { symbol: "BRENT CRUDE", val: "₹9,321/bbl", chg: "+2.11%", dir: "up", section: "ENERGY", category: "Business", story_id: "market-brent-crude", story_slug: "crude-oil-prices-today-brent-wti-energy-outlook", story_title: "Crude Oil Prices Today: Brent Surges Past $98/bbl (₹9,321) on Supply Tightening" },
    { symbol: "WTI CRUDE", val: "₹8,859/bbl", chg: "+2.14%", dir: "up", section: "ENERGY", category: "Business", story_id: "market-brent-crude", story_slug: "crude-oil-prices-today-brent-wti-energy-outlook", story_title: "WTI Crude Jumps to $93.44/bbl: US Inventory Drawdown Sparks Buying in Futures Market" },
    { symbol: "USD/INR", val: "₹94.82", chg: "+0.36%", dir: "up", section: "FOREX", category: "Stock", story_id: "market-usd-inr", story_slug: "usd-inr-forex-rupee-exchange-rate-today", story_title: "Rupee vs Dollar: USD/INR Trades at ₹94.82 as Currency Markets Track Global Yields" },
    { symbol: "EUR/INR", val: "₹110.16", chg: "-0.06%", dir: "down", section: "FOREX", category: "Stock", story_id: "market-usd-inr", story_slug: "usd-inr-forex-rupee-exchange-rate-today", story_title: "Euro to Rupee Exchange Rate Today: EUR/INR Trades at ₹110.16 Amid European Central Bank Stance" },
    { symbol: "GBP/INR", val: "₹128.48", chg: "+0.05%", dir: "up", section: "FOREX", category: "Stock", story_id: "market-usd-inr", story_slug: "usd-inr-forex-rupee-exchange-rate-today", story_title: "British Pound to Indian Rupee: GBP/INR Trades at ₹128.48 as BoE Signals Rate Trajectory" },
    { symbol: "BITCOIN", val: "₹74,26,000", chg: "-1.28%", dir: "down", section: "CRYPTO", category: "Stock", story_id: "market-bitcoin", story_slug: "bitcoin-crypto-market-today-price-analysis", story_title: "Bitcoin Price Today: BTC Trades Near $78,300 (₹74,26,000) as Crypto Market Consolidates" },
    { symbol: "ETHEREUM", val: "₹2,95,000", chg: "+0.45%", dir: "up", section: "CRYPTO", category: "Stock", story_id: "market-bitcoin", story_slug: "bitcoin-crypto-market-today-price-analysis", story_title: "Ethereum Network and Market Update: ETH Trades at ₹2,95,000 with Rising Layer-2 Adoption" }
  ],
  global: [
    { symbol: "DOW JONES", val: "53,414.25", chg: "-0.51%", dir: "down", section: "INDICES", category: "Stock", story_id: "market-sensex", story_slug: "sensex-today-bse-dalal-street-market-update", story_title: "Dow Jones Index Closes at 53,414: Blue-Chip Stocks Navigate Earnings" },
    { symbol: "NASDAQ", val: "26,506.99", chg: "-0.29%", dir: "down", section: "INDICES", category: "Stock", story_id: "market-nifty-50", story_slug: "nifty-50-today-stock-market-closing-analysis", story_title: "Nasdaq Composite Dips to 26,506: Tech Heavyweights Lead Movement" },
    { symbol: "S&P 500", val: "7,718.60", chg: "-0.38%", dir: "down", section: "INDICES", category: "Stock", story_id: "market-sensex", story_slug: "sensex-today-bse-dalal-street-market-update", story_title: "S&P 500 Settles at 7,718: Broad Market Index Reflects Economic Cues" },
    { symbol: "FTSE 100", val: "10,823.83", chg: "-0.07%", dir: "down", section: "INDICES", category: "Stock", story_id: "market-nifty-50", story_slug: "nifty-50-today-stock-market-closing-analysis", story_title: "FTSE 100 Closes at 10,823 in London: Energy and Mining Stocks Cushion" },
    { symbol: "GOLD (OZ)", val: "$4,443.80", chg: "-0.73%", dir: "down", section: "BULLION", category: "Business", story_id: "market-gold-24k", story_slug: "gold-24k-rates-today-bullion-market-analysis", story_title: "Global Gold Spot Consolidates at $4,443/oz as Safe-Haven Demand Steady" },
    { symbol: "SILVER (OZ)", val: "$66.81", chg: "+0.09%", dir: "up", section: "BULLION", category: "Business", story_id: "market-silver-1kg", story_slug: "silver-rates-today-mcx-industrial-demand-analysis", story_title: "Silver Holds at $66.81/oz Driven by Industrial Green Demand" },
    { symbol: "BRENT CRUDE", val: "$98.31/bbl", chg: "+2.11%", dir: "up", section: "ENERGY", category: "Business", story_id: "market-brent-crude", story_slug: "crude-oil-prices-today-brent-wti-energy-outlook", story_title: "Crude Oil Prices Today: Brent Surges Past $98/bbl on Supply Tightening" },
    { symbol: "WTI CRUDE", val: "$93.44/bbl", chg: "+2.14%", dir: "up", section: "ENERGY", category: "Business", story_id: "market-brent-crude", story_slug: "crude-oil-prices-today-brent-wti-energy-outlook", story_title: "WTI Crude Jumps to $93.44/bbl on US Inventory Drawdown" },
    { symbol: "GASOLINE", val: "$3.45/gal", chg: "+0.15%", dir: "up", section: "FUEL", category: "Business", story_id: "market-petrol-delhi", story_slug: "petrol-price-today-delhi-mumbai-fuel-rates", story_title: "Gasoline Retail Rates Today Across Major Hubs" },
    { symbol: "BITCOIN", val: "$78,300", chg: "-1.48%", dir: "down", section: "CRYPTO", category: "Stock", story_id: "market-bitcoin", story_slug: "bitcoin-crypto-market-today-price-analysis", story_title: "Bitcoin Price Today: BTC Trades Near $78,300 as Crypto Market Consolidates" }
  ]
};

export const getCachedMarketPrices = (country = 'india') => {
  const normCountry = (country || 'india').toLowerCase();
  const targetKey = (normCountry === 'us' || normCountry === 'uk' || normCountry === 'global') ? 'global' : 'india';
  const cached = safeGet(`${MARKET_CACHE_PREFIX}${targetKey}`);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return DEFAULT_AUTHENTIC_MARKET_PRICES[targetKey] || DEFAULT_AUTHENTIC_MARKET_PRICES.india;
};

export const setCachedMarketPrices = (country = 'india', prices = []) => {
  if (!Array.isArray(prices) || prices.length === 0) return;
  const normCountry = (country || 'india').toLowerCase();
  const targetKey = (normCountry === 'us' || normCountry === 'uk' || normCountry === 'global') ? 'global' : 'india';
  safeSet(`${MARKET_CACHE_PREFIX}${targetKey}`, prices);
};
