import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, Zap, Calendar, Check, Save, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

const AVAILABLE_TOPICS = [
  'World',
  'Technology',
  'Business',
  'Science',
  'Health',
  'Sport',
  'Culture',
  'India'
];

export const SettingsModal = ({ isOpen, onClose, currentUser }) => {
  if (!isOpen || !currentUser) return null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Notification configuration states
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [breakingAlerts, setBreakingAlerts] = useState(true);
  const [weeklyRoundup, setWeeklyRoundup] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState('daily');
  const [digestTime, setDigestTime] = useState('08:00');
  const [subscribedCategories, setSubscribedCategories] = useState([
    'World', 'Technology', 'Business', 'Science', 'Health', 'Sport'
  ]);
  const [notificationEmail, setNotificationEmail] = useState(currentUser.email || '');

  // Load existing user notification configuration
  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        const res = await api.getNotifications();
        if (mounted && res.notifications) {
          const n = res.notifications;
          setEmailEnabled(n.email_notifications_enabled !== false);
          setDailyDigest(n.daily_digest !== false);
          setBreakingAlerts(n.breaking_alerts !== false);
          setWeeklyRoundup(!!n.weekly_roundup);
          setDigestFrequency(n.digest_frequency || 'daily');
          setDigestTime(n.digest_time || '08:00');
          if (Array.isArray(n.subscribed_categories)) {
            setSubscribedCategories(n.subscribed_categories);
          }
          if (n.notification_email) {
            setNotificationEmail(n.notification_email);
          }
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchSettings();
    return () => { mounted = false; };
  }, [currentUser]);

  const toggleCategory = (cat) => {
    if (subscribedCategories.includes(cat)) {
      if (subscribedCategories.length > 1) {
        setSubscribedCategories(subscribedCategories.filter((c) => c !== cat));
      }
    } else {
      setSubscribedCategories([...subscribedCategories, cat]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.updateNotifications({
        email_notifications_enabled: emailEnabled,
        daily_digest: dailyDigest,
        breaking_alerts: breakingAlerts,
        weekly_roundup: weeklyRoundup,
        digest_frequency: digestFrequency,
        digest_time: digestTime,
        subscribed_categories: subscribedCategories,
        notification_email: notificationEmail.trim() || currentUser.email
      });

      setSuccessMessage('Email notification preferences saved successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bbc-modal-overlay" onClick={onClose}>
      <div 
        className="bbc-modal-card" 
        style={{ maxWidth: 580, padding: '28px 32px', maxHeight: '90vh', overflowY: 'auto' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#121212', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 800, margin: 0 }}>
                Notification & Mail Settings
              </h2>
              <span style={{ fontSize: 12, color: '#64748b' }}>Configure your email briefings & real-time news alerts</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {successMessage && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: 4, fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={15} /> {successMessage}
          </div>
        )}

        {errorMessage && (
          <div style={{ background: '#fee2e2', color: '#b80000', padding: '10px 14px', borderRadius: 4, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Master Email Toggle */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} color="#121212" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Email News Deliveries</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Receive intelligence briefings directly in your mailbox</div>
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span 
                  style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    background: emailEnabled ? '#121212' : '#cbd5e1',
                    transition: '0.2s', borderRadius: 24
                  }}
                >
                  <span 
                    style={{
                      position: 'absolute', content: '""', height: 18, width: 18, left: emailEnabled ? 23 : 3, bottom: 3,
                      background: 'white', transition: '0.2s', borderRadius: '50%'
                    }}
                  />
                </span>
              </label>
            </div>
          </div>

          {emailEnabled && (
            <>
              {/* Delivery Email Input */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                  Deliver Briefings To
                </label>
                <input
                  type="email"
                  className="bbc-newsletter-input"
                  style={{ width: '100%', height: 42, padding: '0 12px', fontSize: 14 }}
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              {/* Notification Types */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                  Subscription Channels & Formats
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Daily Morning Digest */}
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Calendar size={16} color="#121212" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Daily Morning Briefing</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Curated overnight developments delivered at 8:00 AM</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={dailyDigest}
                      onChange={(e) => setDailyDigest(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#121212' }}
                    />
                  </label>

                  {/* Breaking News Alerts */}
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Zap size={16} color="#b80000" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Instant Breaking News Alerts</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Immediate notifications for major high-impact geopolitical events</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={breakingAlerts}
                      onChange={(e) => setBreakingAlerts(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#121212' }}
                    />
                  </label>

                  {/* Weekly Review */}
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ShieldCheck size={16} color="#0f766e" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Weekly Deep-Dive Intelligence</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Comprehensive Sunday review of global economics & tech trends</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={weeklyRoundup}
                      onChange={(e) => setWeeklyRoundup(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#121212' }}
                    />
                  </label>
                </div>
              </div>

              {/* Frequency Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                    Digest Frequency
                  </label>
                  <select
                    className="bbc-newsletter-input"
                    style={{ width: '100%', height: 40, padding: '0 10px', fontSize: 13, background: '#fff' }}
                    value={digestFrequency}
                    onChange={(e) => setDigestFrequency(e.target.value)}
                  >
                    <option value="daily">Daily Digest</option>
                    <option value="twice_daily">Twice Daily (Morning & Evening)</option>
                    <option value="weekly">Weekly Summary Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                    Delivery Time
                  </label>
                  <select
                    className="bbc-newsletter-input"
                    style={{ width: '100%', height: 40, padding: '0 10px', fontSize: 13, background: '#fff' }}
                    value={digestTime}
                    onChange={(e) => setDigestTime(e.target.value)}
                  >
                    <option value="06:00">06:00 AM (Early Edition)</option>
                    <option value="08:00">08:00 AM (Standard Morning)</option>
                    <option value="12:00">12:00 PM (Midday Briefing)</option>
                    <option value="18:00">06:00 PM (Evening Wrap)</option>
                  </select>
                </div>
              </div>

              {/* Subscribed Category Topics */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                  Include Topics in Your Mail Digest
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AVAILABLE_TOPICS.map((topic) => {
                    const active = subscribedCategories.includes(topic);
                    return (
                      <button
                        type="button"
                        key={topic}
                        onClick={() => toggleCategory(topic)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: active ? '1px solid #121212' : '1px solid #cbd5e1',
                          background: active ? '#121212' : '#ffffff',
                          color: active ? '#ffffff' : '#334155',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {active && <Check size={12} style={{ display: 'inline', marginRight: 4 }} />}
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{ padding: '8px 20px', background: '#121212', color: '#fff', border: '1px solid #121212', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save Notification Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
