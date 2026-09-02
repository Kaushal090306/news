import React, { useState } from 'react';
import { 
  User, 
  ArrowLeft, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  Bookmark,
  Calendar,
  Lock
} from 'lucide-react';
import { api } from '../services/api';

const AVAILABLE_CATEGORIES = [
  'World',
  'Business',
  'Technology',
  'Science',
  'Health',
  'Sport',
  'Culture',
  'India'
];

const AVAILABLE_COUNTRIES = [
  { id: 'Global', label: 'Global Edition', desc: 'Comprehensive international coverage' },
  { id: 'India', label: 'India Edition', desc: 'Regional and domestic South Asian intelligence' },
  { id: 'US', label: 'US & Americas', desc: 'North & South America political and market trends' },
  { id: 'UK', label: 'UK & Europe', desc: 'European politics, economy, and European Union policy' },
  { id: 'Asia', label: 'Asia Pacific', desc: 'East Asian economic shifts and tech hubs' }
];

export const ProfileView = ({ onBack, currentUser, onUpdateUser, onOpenSettings, onOpenBookmarks }) => {
  if (!currentUser) return null;

  const currentPrefs = currentUser.preferences || {};
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [selectedCountry, setSelectedCountry] = useState(
    (currentPrefs.countries && currentPrefs.countries[0]) || 'Global'
  );
  const [selectedCategories, setSelectedCategories] = useState(
    currentPrefs.categories || ['World', 'Technology', 'Business']
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const displayName = fullName || currentUser.email.split('@')[0];
  const isAdmin = currentUser.role === 'admin';

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSelectAll = () => {
    setSelectedCategories([...AVAILABLE_CATEGORIES]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.updateProfile({
        full_name: fullName.trim(),
        preferred_country: selectedCountry,
        preferred_categories: selectedCategories
      });

      if (res.user) {
        onUpdateUser(res.user);
        setSuccessMessage('Your profile changes have been successfully saved.');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile');
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
          Account Management
        </span>
      </div>

      {/* Hero Profile Banner */}
      <div 
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '28px 32px',
          marginBottom: 28,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div 
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#121212',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontFamily: 'var(--font-serif)',
              fontWeight: 900,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, color: '#121212', margin: 0 }}>
                {displayName}
              </h1>
              <span 
                style={{
                  background: isAdmin ? '#121212' : '#f1f5f9',
                  color: isAdmin ? '#ffffff' : '#334155',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4,
                  textTransform: 'uppercase'
                }}
              >
                {isAdmin ? 'Administrator' : 'Subscriber'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: '#64748b' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Mail size={13} /> {currentUser.email}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#15803d', fontWeight: 600 }}>
                <ShieldCheck size={14} /> Verified Member
              </span>
            </div>
          </div>
        </div>

        {/* Quick Jump Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onOpenBookmarks}
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
            <Bookmark size={14} />
            <span>Saved Stories</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
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
            <span>Mail Settings ⚙️</span>
          </button>
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

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 28 }}>
          {/* Card 1: Identity & Personal Information */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px 28px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: '#121212', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
              Personal Identity
            </h2>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                className="bbc-newsletter-input"
                style={{ width: '100%', height: 42, padding: '0 12px', fontSize: 14 }}
                placeholder="e.g. Kaushal Savaliya"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                Email Address (Primary Account)
              </label>
              <input
                type="email"
                className="bbc-newsletter-input"
                style={{ width: '100%', height: 42, padding: '0 12px', fontSize: 14, background: '#f8fafc', color: '#64748b' }}
                value={currentUser.email}
                disabled
              />
              <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                Verified login identity. Contact support to update email address.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                Account Membership Tier
              </label>
              <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13, color: '#334155', fontWeight: 600 }}>
                {isAdmin ? '🛡️ Administrator Access' : '⭐ Standard Verified Reader'}
              </div>
            </div>
          </div>

          {/* Card 2: Preferred Edition / Regional Focus */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px 28px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: '#121212', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
              Regional Edition Focus
            </h2>

            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              Select your primary regional perspective to prioritize localized breaking news and lead headlines:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {AVAILABLE_COUNTRIES.map((country) => {
                const active = selectedCountry === country.id;
                return (
                  <label
                    key={country.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 6,
                      border: active ? '2px solid #121212' : '1px solid #e2e8f0',
                      background: active ? '#fcfcfc' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#121212' }}>
                        {country.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {country.desc}
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="edition"
                      value={country.id}
                      checked={active}
                      onChange={() => setSelectedCountry(country.id)}
                      style={{ accentColor: '#121212', width: 16, height: 16 }}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Topic & Personalized Feed Selection */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px 28px', marginBottom: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: '#121212', margin: 0 }}>
                Topics of Interest & Newsfeed Customization
              </h2>
              <span style={{ fontSize: 12, color: '#64748b' }}>Customize which editorial verticals you wish to prioritize</span>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{ background: 'none', border: 'none', color: '#006699', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Select All Topics
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {AVAILABLE_CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: active ? '1px solid #121212' : '1px solid #cbd5e1',
                    background: active ? '#121212' : '#ffffff',
                    color: active ? '#ffffff' : '#334155',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {active ? '✓ ' : '+ '}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 24px' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Ensure your changes are saved before navigating away.
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
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
