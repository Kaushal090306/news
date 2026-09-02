import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Bookmark, 
  ShieldAlert, 
  LogOut, 
  ChevronDown, 
  Mail, 
  Edit3, 
  CheckCircle2 
} from 'lucide-react';

export const UserProfileDropdown = ({
  currentUser,
  onLogout,
  onOpenProfile,
  onOpenSettings,
  onOpenBookmarks,
  onOpenAdmin
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = currentUser?.role === 'admin';
  const displayName = currentUser?.full_name || currentUser?.email?.split('@')[0] || 'User';

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bbc-user-dropdown-wrap" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bbc-user-trigger-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: isOpen ? '#e5e7eb' : '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: 20,
          padding: '4px 12px 4px 6px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        title="Account & Settings"
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#121212',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>

        {isAdmin && (
          <span style={{ fontSize: 10, fontWeight: 800, background: '#121212', color: '#fff', padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase' }}>
            Admin
          </span>
        )}

        <ChevronDown 
          size={14} 
          color="#4b5563" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} 
        />
      </button>

      {/* Dropdown Menu Card */}
      {isOpen && (
        <div
          className="bbc-user-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 260,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) both'
          }}
        >
          {/* User Info Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>
              {currentUser?.email}
            </div>
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#15803d', fontWeight: 600 }}>
              <CheckCircle2 size={12} />
              <span>{isAdmin ? 'Verified Administrator' : 'Active Subscriber'}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '6px 0' }}>
            {/* Edit Profile */}
            <button
              onClick={() => { setIsOpen(false); onOpenProfile(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#1e293b',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Edit3 size={15} color="#475569" />
              <span>Edit Profile</span>
            </button>

            {/* Notification & Mail Settings */}
            <button
              onClick={() => { setIsOpen(false); onOpenSettings(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#1e293b',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Settings size={15} color="#475569" />
              <span>Settings & Mail Alerts</span>
            </button>

            {/* Saved Bookmarks */}
            <button
              onClick={() => { setIsOpen(false); onOpenBookmarks(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#1e293b',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Bookmark size={15} color="#475569" />
              <span>Saved Bookmarks</span>
            </button>

            {/* Admin Console (If Admin) */}
            {isAdmin && (
              <button
                onClick={() => { setIsOpen(false); onOpenAdmin(); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#b80000',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <ShieldAlert size={15} color="#b80000" />
                <span>Admin Control Panel</span>
              </button>
            )}
          </div>

          {/* Divider & Sign Out */}
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '6px 0' }}>
            <button
              onClick={() => { setIsOpen(false); onLogout(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                color: '#b80000',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <LogOut size={15} color="#b80000" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
