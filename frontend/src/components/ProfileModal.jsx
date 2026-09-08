import React, { useState } from 'react';
import { X, User, Globe, Check, Save } from 'lucide-react';
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
  { id: 'Global', label: 'Global Edition' },
  { id: 'India', label: 'India Edition' },
  { id: 'US', label: 'US & Americas' },
  { id: 'UK', label: 'UK & Europe' },
  { id: 'Asia', label: 'Asia Pacific' }
];

export const ProfileModal = ({ isOpen, onClose, currentUser, onUpdateUser }) => {
  if (!isOpen || !currentUser) return null;

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

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
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
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bbc-modal-overlay" onClick={onClose}>
      <div 
        className="bbc-modal-card" 
        style={{ maxWidth: 520, padding: '28px 32px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#121212', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 800, margin: 0 }}>
                Edit Profile
              </h2>
              <span style={{ fontSize: 12, color: '#64748b' }}>{currentUser.email}</span>
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
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
              Full Name
            </label>
            <input
              type="text"
              className="bbc-newsletter-input"
              style={{ width: '100%', height: 42, padding: '0 12px', fontSize: 14 }}
              placeholder="e.g. Eleanor Vance"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
              Preferred Edition / Region
            </label>
            <select
              className="bbc-newsletter-input"
              style={{ width: '100%', height: 42, padding: '0 12px', fontSize: 14, background: '#fff' }}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {AVAILABLE_COUNTRIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
              Topics of Interest (Personalized Feed)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVAILABLE_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    style={{
                      padding: '6px 14px',
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
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

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
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
