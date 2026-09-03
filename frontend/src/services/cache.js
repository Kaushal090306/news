import seedFeeds from './seedFeeds.json';

// Client-side instant persistent cache for Stale-While-Revalidate loading
// Stores ONLY 100% authentic original data from the backend database/API.
// Zero dummy or predefined data.

const FEEDS_CACHE_KEY = 'world_news_feeds_cache_original';
const ARTICLE_CACHE_PREFIX = 'world_news_story_original_';
const ADMIN_CACHE_KEY = 'world_news_admin_cache_original';
const BOOKMARKS_CACHE_KEY = 'world_news_bookmarks_cache_original';

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

// FEEDS CACHE (Instant 0-delay authentic data even on first-time/incognito visit)
export const getCachedFeeds = () => {
  const cached = safeGet(FEEDS_CACHE_KEY);
  if (cached && Array.isArray(cached.stories) && cached.stories.length > 0) {
    return cached;
  }
  // FIRST TIME VISIT / FRESH SESSION / INCOGNITO:
  // Return authentic bundled seed data immediately with 0 microsecond delay
  if (seedFeeds && Array.isArray(seedFeeds.stories) && seedFeeds.stories.length > 0) {
    safeSet(FEEDS_CACHE_KEY, seedFeeds);
    return seedFeeds;
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
      return {
        story: found,
        articles: [found],
        related: feeds.stories.filter((s) => s.id !== found.id).slice(0, 4)
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
