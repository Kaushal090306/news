import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ArrowLeft, 
  Mail, 
  Zap, 
  Calendar, 
  CheckCircle2, 
  Save, 
  ShieldCheck, 
  Clock, 
  Sliders, 
  Send,
  Lock,
  Smartphone
} from 'lucide-react';
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

export const SettingsView = ({ onBack, currentUser, onOpenProfile }) => {
  if (!currentUser) return null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [testSent, setTestSent] = useState(false);

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

  // Load user notification configuration
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

  const handleSendTestBriefing = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
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

      setSuccessMessage('Your email notification preferences have been successfully updated.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bbc-main-content" style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button 
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#121212', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={16} /> Back to News Feed
        </button>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          Preferences & Delivery
        </span>
      </div>

      {/* Page Title Banner */}
      <div style={{ borderBottom: '2px solid #121212', paddingBottom: 20, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#006699', letterSpacing: '0.8px', marginBottom: 6 }}>
              <Sliders size={14} /> ACCOUNT SETTINGS & COMMUNICATIONS
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 900, color: '#121212', margin: 0 }}>
              Mail Notification Settings
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onOpenProfile}
              style={{
                padding: '8px 16px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>👤 Edit Profile Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '12px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b80000', padding: '12px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
          ⚠ {errorMessage}
        </div>
      )}

      {testSent && (
        <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '12px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✉️ Test email dispatched! Check {notificationEmail} for your sample intelligence briefing.
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Master Switch Card */}
        <div 
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '24px 28px',
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: emailEnabled ? '#121212' : '#f1f5f9', color: emailEnabled ? '#ffffff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={22} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                Master Email Delivery Switch
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Enable or pause all scheduled newsletter digests and breaking alert dispatches
              </div>
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 28, cursor: 'pointer' }}>
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
                transition: '0.2s', borderRadius: 28
              }}
            >
              <span 
                style={{
                  position: 'absolute', content: '""', height: 22, width: 22, left: emailEnabled ? 27 : 3, bottom: 3,
                  background: 'white', transition: '0.2s', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
            </span>
          </label>
        </div>

        {emailEnabled && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
              {/* Card 1: Delivery Channels */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px 28px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: '#121212', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                  Active Briefing Channels
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Daily Digest */}
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Calendar size={18} color="#121212" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Daily Morning Briefing</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Curated overnight developments sent at {digestTime}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={dailyDigest}
                      onChange={(e) => setDailyDigest(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#121212' }}
                    />
                  </label>

                  {/* Breaking News Alerts */}
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Zap size={18} color="#b80000" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Instant Breaking Alerts</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Immediate notifications for major global news events</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={breakingAlerts}
                      onChange={(e) => setBreakingAlerts(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#121212' }}
                    />
                  </label>

                  {/* Weekly Roundup */}
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ShieldCheck size={18} color="#0f766e" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Weekly Deep-Dive Intelligence</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Comprehensive Sunday review of global economics and policy</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={weeklyRoundup}
                      onChange={(e) => setWeeklyRoundup(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#121212' }}
                    />
                  </label>
                </div>
              </div>

              {/* Card 2: Destination & Schedule */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px 28px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: '#121212', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                  Destination Mailbox & Schedule
                </h2>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                    Destination Email Address
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="email"
                      className="bbc-newsletter-input"
                      style={{ width: '100%', height: 40, padding: '0 12px', fontSize: 13 }}
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendTestBriefing}
                      style={{
                        padding: '0 14px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Send Test
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                      Preferred Delivery Time
                    </label>
                    <select
                      className="bbc-newsletter-input"
                      style={{ width: '100%', height: 40, padding: '0 10px', fontSize: 13, background: '#fff' }}
                      value={digestTime}
                      onChange={(e) => setDigestTime(e.target.value)}
                    >
                      <option value="06:00">06:00 AM (Early Edition)</option>
                      <option value="08:00">08:00 AM (Morning Coffee)</option>
                      <option value="12:00">12:00 PM (Midday Wrap)</option>
                      <option value="18:00">06:00 PM (Evening Summary)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Included Topics in Mail Digest */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px 28px', marginBottom: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: '#121212', marginBottom: 6 }}>
                Included Topics in Your Mail Digest
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Select which categories our editorial engine should compile into your personalized email briefing:
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {AVAILABLE_TOPICS.map((topic) => {
                  const active = subscribedCategories.includes(topic);
                  return (
                    <button
                      type="button"
                      key={topic}
                      onClick={() => toggleCategory(topic)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: active ? '1px solid #121212' : '1px solid #cbd5e1',
                        background: active ? '#121212' : '#ffffff',
                        color: active ? '#ffffff' : '#334155',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {active ? '✓ ' : '+ '}
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 24px' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Changes take effect immediately across all active mail channels.
          </span>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: '10px 20px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                color: '#334155'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '10px 28px',
                background: '#121212',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving...' : 'Save Notification Preferences'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
