const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('world_news_token');
export const setAuthToken = (token) => localStorage.setItem('world_news_token', token);
export const removeAuthToken = () => localStorage.removeItem('world_news_token');

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorData.detail || 'Request failed');
  }

  return response.json();
};

export const api = {
  // Stories & Feeds
  getStories: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    return request(`/stories${query ? `?${query}` : ''}`);
  },
  getStoriesByCategory: (date = null, country = null) => {
    const params = new URLSearchParams();
    if (date && date !== 'all') params.append('date', date);
    if (country && country !== 'all') params.append('country', country);
    const q = params.toString();
    return request(`/stories/by-category${q ? `?${q}` : ''}`);
  },
  getAvailableDates: () => request('/stories/dates'),
  getHeroStory: (category) => {
    const cat = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/stories/hero${cat}`);
  },
  getBreakingNews: () => request('/stories/breaking'),
  getStoryDetail: (identifier) => request(`/stories/detail/${encodeURIComponent(identifier)}`),

  // Bookmarks
  getBookmarks: () => request('/bookmarks'),
  toggleBookmark: (storyId) => request(`/bookmarks/${storyId}/toggle`, { method: 'POST' }),

  // Auth & Profile
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getNotifications: () => request('/auth/notifications'),
  updateNotifications: (data) => request('/auth/notifications', { method: 'PUT', body: JSON.stringify(data) }),
  updatePreferences: (prefs) => request('/auth/preferences', { method: 'PUT', body: JSON.stringify(prefs) }),

  // Sources & Admin
  getSources: () => request('/sources'),
  getAdminStats: () => request('/admin/stats'),
  triggerFetch: (sourceId = null) => request(`/admin/trigger-fetch${sourceId ? `?source_id=${sourceId}` : ''}`, { method: 'POST' }),
  toggleSource: (sourceId) => request(`/admin/sources/${sourceId}/toggle`, { method: 'POST' }),
  getAdminLogs: () => request('/admin/logs'),
  getAdminClusters: () => request('/admin/clusters'),

  // Newsletter
  subscribeNewsletter: (data) => request('/newsletter/subscribe', { method: 'POST', body: JSON.stringify(data) }),
  previewNewsletter: () => request('/newsletter/preview'),
};
