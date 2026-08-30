import React, { useState } from 'react';
import { X, Check, Shield } from 'lucide-react';
import { api, setAuthToken } from '../services/api';

const AVAILABLE_TOPICS = ["World", "India", "Technology", "Business", "Sport", "Health", "Science", "Culture"];

export const AuthModal = ({ isOpen, mode = 'login', onClose, onAuthSuccess }) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedTopics, setSelectedTopics] = useState(["World", "Technology", "Business"]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleFillAdmin = () => {
    setEmail('admin@bbcnews.ai');
    setPassword('admin123456');
    setCurrentMode('login');
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
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.login({ email, password });
        setAuthToken(res.access_token);
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
          borderRadius: 2,
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
        <p style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 20 }}>
          {currentMode === 'signup' 
            ? 'Personalize your feed, save stories, and receive factual morning digests.' 
            : 'Sign in with your account or admin credentials.'}
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 2, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

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

          {/* Quick Demo Helper for Admin */}
          {currentMode === 'login' && (
            <div 
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '10px 12px',
                borderRadius: 4,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={13} color="#b80000" /> Admin Credentials:
                </span>
                <span style={{ color: '#475569' }}>admin@bbcnews.ai / admin123456</span>
              </div>
              <button
                type="button"
                onClick={handleFillAdmin}
                style={{ fontSize: 11, fontWeight: 700, color: '#006699', textDecoration: 'underline' }}
              >
                Auto-fill
              </button>
            </div>
          )}

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
