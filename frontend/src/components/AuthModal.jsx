import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { api, setAuthToken, setCachedUser } from '../services/api';

const AVAILABLE_TOPICS = ["World", "India", "Technology", "Business", "Sport", "Health", "Science", "Culture"];

export const AuthModal = ({ isOpen, mode = 'login', onClose, onAuthSuccess }) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedTopics, setSelectedTopics] = useState(["World", "Technology", "Business"]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Handle Google Identity Services (One Tap / SDK)
  useEffect(() => {
    if (!isOpen) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google && window.google.accounts && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response && response.credential) {
              setLoading(true);
              try {
                // Decode Google JWT
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
                
                const res = await api.loginWithGoogle({
                  email: payload.email,
                  full_name: payload.name || payload.given_name || payload.email.split('@')[0],
                  avatar_url: payload.picture || '',
                  google_id: payload.sub || '',
                  credential: response.credential
                });

                if (res && res.access_token) {
                  setAuthToken(res.access_token);
                  setCachedUser(res.user);
                  onAuthSuccess(res.user);
                  onClose();
                }
              } catch (err) {
                setError(err.message || 'Google authentication failed');
              } finally {
                setLoading(false);
              }
            }
          }
        });
      } catch (e) {
        console.warn('Google Identity initialization error:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleGoogleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const gEmail = googleEmail.trim() || email.trim() || 'kaushal.user@gmail.com';
      const gName = googleName.trim() || fullName.trim() || gEmail.split('@')[0];

      const res = await api.loginWithGoogle({
        email: gEmail,
        full_name: gName,
        google_id: 'goog_' + Date.now()
      });

      if (res && res.access_token) {
        setAuthToken(res.access_token);
        setCachedUser(res.user);
        onAuthSuccess(res.user);
        onClose();
      } else {
        throw new Error('Google sign-in failed');
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
      setGooglePromptOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (currentMode === 'signup') {
        const res = await api.signup({
          email,
          password,
          full_name: fullName,
          preferences: { categories: selectedTopics, countries: ["Global"] }
        });
        setAuthToken(res.access_token);
        setCachedUser(res.user);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.login({ email, password });
        setAuthToken(res.access_token);
        setCachedUser(res.user);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bbc-drawer-backdrop open" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div 
        style={{
          background: '#ffffff',
          width: 440,
          maxWidth: '92vw',
          padding: 32,
          borderRadius: 4,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: 16, right: 16, color: '#121212' }}
        >
          <X size={20} />
        </button>

        <div className="bbc-logo" style={{ marginBottom: 20 }}>
          <div className="bbc-logo-box">B</div>
          <div className="bbc-logo-box">B</div>
          <div className="bbc-logo-box">C</div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, fontFamily: 'var(--font-serif)' }}>
          {currentMode === 'signup' ? 'Create your BBC Account' : 'Sign in to your BBC Account'}
        </h2>
        <p style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 18 }}>
          {currentMode === 'signup' 
            ? 'Personalize your feed, save stories, and stay logged in for 15 days.' 
            : 'Sign in with your email or Google account to stay logged in for 15 days.'}
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 2, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* 1-Click Google Sign In Button */}
        <button
          type="button"
          onClick={() => {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (window.google && window.google.accounts && clientId) {
              window.google.accounts.id.prompt();
            } else {
              setGooglePromptOpen(!googlePromptOpen);
            }
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '11px 16px',
            borderRadius: 4,
            border: '1px solid #dadce0',
            background: '#ffffff',
            color: '#3c4043',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 16,
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        {googlePromptOpen && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              Sign in with your Google Account
            </div>
            <input
              type="email"
              placeholder="Enter your Google email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              className="bbc-newsletter-input"
              style={{ marginBottom: 8 }}
            />
            <input
              type="text"
              placeholder="Your Name (Optional)"
              value={googleName}
              onChange={(e) => setGoogleName(e.target.value)}
              className="bbc-newsletter-input"
              style={{ marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="bbc-btn-newsletter"
                style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
              >
                {loading ? 'Connecting Google...' : 'Sign in with Google'}
              </button>
              <button
                type="button"
                onClick={() => setGooglePromptOpen(false)}
                style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 2, background: '#fff' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {currentMode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Full Name</label>
              <input
                type="text"
                className="bbc-newsletter-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Email Address</label>
            <input
              type="email"
              className="bbc-newsletter-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Password</label>
            <input
              type="password"
              className="bbc-newsletter-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {currentMode === 'signup' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Select Your Favorite Topics
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AVAILABLE_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: isSelected ? '#121212' : '#e6e6e6',
                        background: isSelected ? '#121212' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#121212',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {isSelected && <Check size={12} />}
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="bbc-btn-newsletter" 
            disabled={loading}
            style={{ marginBottom: 16 }}
          >
            {loading ? 'Authenticating...' : (currentMode === 'signup' ? 'Register & Continue' : 'Sign In')}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#4a4a4a' }}>
            {currentMode === 'signup' ? (
              <span>Already have an account? <a href="#login" onClick={(e) => { e.preventDefault(); setCurrentMode('login'); }} style={{ fontWeight: 700, color: '#006699' }}>Sign in</a></span>
            ) : (
              <span>Don't have an account? <a href="#signup" onClick={(e) => { e.preventDefault(); setCurrentMode('signup'); }} style={{ fontWeight: 700, color: '#006699' }}>Register now</a></span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
