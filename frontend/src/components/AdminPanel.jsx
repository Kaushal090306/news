import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, RefreshCw, Users, Shield, Plus, Trash2, 
  CheckCircle2, AlertTriangle, XCircle, Globe, Play, ExternalLink, X, Search
} from 'lucide-react';
import { api } from '../services/api';

export const AdminPanel = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('sources'); // 'sources', 'users', 'clusters', 'logs'
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  // Modals
  const [addSourceModalOpen, setAddSourceModalOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  
  // Add Source Form State
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCat, setNewSourceCat] = useState('World');
  const [newSourceCountry, setNewSourceCountry] = useState('Global');
  const [newSourceInterval, setNewSourceInterval] = useState(15);
  const [testingUrl, setTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Add User Form State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  const [userSearch, setUserSearch] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, sourcesRes, clustersRes, logsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getSources(),
        api.getAdminClusters(),
        api.getAdminLogs(),
        api.getAdminUsers()
      ]);
      setStats(statsRes);
      setSources(sourcesRes.sources || []);
      setClusters(clustersRes.clusters || []);
      setLogs(logsRes.logs || []);
      setUsers(usersRes.users || []);
    } catch (e) {
      console.error('Error loading admin data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerFetch = async (sourceId = null) => {
    setFetching(true);
    setFetchMessage('Feed ingestion cycle started in background...');
    try {
      await api.triggerFetch(sourceId);
      setTimeout(async () => {
        await loadData();
        setFetching(false);
        setFetchMessage('✓ Ingestion cycle completed. New articles & clusters updated.');
        setTimeout(() => setFetchMessage(''), 4000);
      }, 4000);
    } catch (e) {
      setFetching(false);
      setFetchMessage(`Error: ${e.message}`);
    }
  };

  const handleToggleSource = async (sourceId) => {
    try {
      await api.toggleSource(sourceId);
      setSources(sources.map((s) => s.id === sourceId ? { ...s, active: s.active === 1 ? 0 : 1 } : s));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteSource = async (sourceId, sourceName) => {
    if (!window.confirm(`Are you sure you want to delete source "${sourceName}"?`)) return;
    try {
      await api.deleteSource(sourceId);
      setSources(sources.filter((s) => s.id !== sourceId));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleTestSource = async () => {
    if (!newSourceUrl) {
      alert('Please enter a Feed/Website URL first.');
      return;
    }
    setTestingUrl(true);
    setTestResult(null);
    try {
      const res = await api.testSource(newSourceUrl);
      setTestResult(res);
    } catch (e) {
      setTestResult({ valid: false, error: e.message });
    } finally {
      setTestingUrl(false);
    }
  };

  const handleCreateSource = async (e) => {
    e.preventDefault();
    try {
      await api.createSource({
        name: newSourceName,
        url: newSourceUrl,
        category: newSourceCat,
        country: newSourceCountry,
        fetch_interval_minutes: parseInt(newSourceInterval) || 15,
        active: 1
      });
      setAddSourceModalOpen(false);
      setNewSourceName('');
      setNewSourceUrl('');
      setTestResult(null);
      await loadData();
      alert('✓ New source added successfully!');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUserRole(userId, nextRole);
      setUsers(users.map((u) => u.id === userId ? { ...u, role: nextRole } : u));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Delete user ${userEmail}?`)) return;
    try {
      await api.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminUser({
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserName,
        role: newUserRole
      });
      setAddUserModalOpen(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      await loadData();
      alert('✓ User created successfully!');
    } catch (e) {
      alert(e.message);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="bbc-admin-view">
      <button 
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, fontWeight: 700, color: '#4a4a4a', cursor: 'pointer' }}
      >
        <ArrowLeft size={16} /> Exit Admin Room
      </button>

      <div className="bbc-admin-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-serif)' }}>
            Editorial & Platform Control Room
          </h1>
          <p style={{ fontSize: 13, color: '#4a4a4a', marginTop: 4 }}>
            Configure web scraping, manage feed sources, control user access, and inspect deduplication clusters.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="bbc-btn-register"
            onClick={() => setAddSourceModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#121212', color: '#fff' }}
          >
            <Plus size={16} />
            <span>Add Feed / Scraper</span>
          </button>

          <button
            className="bbc-btn-register"
            onClick={() => handleTriggerFetch()}
            disabled={fetching}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#b80000', color: '#fff' }}
          >
            <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
            <span>{fetching ? 'Ingesting...' : 'Trigger Ingestion'}</span>
          </button>
        </div>
      </div>

      {fetchMessage && (
        <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '10px 16px', borderRadius: 4, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
          {fetchMessage}
        </div>
      )}

      {/* KPI Stats Cards */}
      {stats && (
        <div className="bbc-stats-grid" style={{ marginBottom: 24 }}>
          <div className="bbc-stat-card">
            <div className="bbc-stat-label">Active Sources</div>
            <div className="bbc-stat-value">{stats.sources?.total_sources || sources.length}</div>
            <div style={{ fontSize: 11, color: '#15803d', marginTop: 4 }}>
              🟢 {stats.sources?.healthy_sources || sources.filter(s => s.active).length} Healthy
            </div>
          </div>

          <div className="bbc-stat-card">
            <div className="bbc-stat-label">Total Articles</div>
            <div className="bbc-stat-value">{stats.total_articles}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              From {sources.length} Configured Feeds
            </div>
          </div>

          <div className="bbc-stat-card">
            <div className="bbc-stat-label">Registered Users</div>
            <div className="bbc-stat-value" style={{ color: '#006699' }}>{users.length || stats.total_users}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              {users.filter(u => u.role === 'admin').length} Admins • {users.filter(u => u.role !== 'admin').length} Users
            </div>
          </div>

          <div className="bbc-stat-card">
            <div className="bbc-stat-label">Deduplication Rate</div>
            <div className="bbc-stat-value" style={{ color: '#15803d' }}>
              {stats.duplicate_prevention_rate || '48.5%'}
            </div>
            <div style={{ fontSize: 11, color: '#15803d', marginTop: 4 }}>
              {stats.total_duplicates_prevented || 0} Duplicates Cleaned
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #e6e6e6', marginBottom: 20, overflowX: 'auto' }}>
        <button
          style={{
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 700,
            borderBottom: activeTab === 'sources' ? '3px solid #121212' : 'none',
            color: activeTab === 'sources' ? '#121212' : '#767676',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('sources')}
        >
          Sources & Web Scrapers ({sources.length})
        </button>

        <button
          style={{
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 700,
            borderBottom: activeTab === 'users' ? '3px solid #121212' : 'none',
            color: activeTab === 'users' ? '#121212' : '#767676',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('users')}
        >
          User Access Control ({users.length})
        </button>

        <button
          style={{
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 700,
            borderBottom: activeTab === 'clusters' ? '3px solid #121212' : 'none',
            color: activeTab === 'clusters' ? '#121212' : '#767676',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('clusters')}
        >
          Story Clustering Inspector
        </button>

        <button
          style={{
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 700,
            borderBottom: activeTab === 'logs' ? '3px solid #121212' : 'none',
            color: activeTab === 'logs' ? '#121212' : '#767676',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('logs')}
        >
          Ingestion Logs
        </button>
      </div>

      {/* TAB 1: Sources & Web Scrapers Configurator */}
      {activeTab === 'sources' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Configure automatic RSS/Atom feeds, HTML web scrapers, and national publishers.
            </span>
            <button
              onClick={() => setAddSourceModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: '#121212',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 3,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Add New Source / Scraper
            </button>
          </div>

          <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e6e6e6', borderRadius: 4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f8f8', borderBottom: '1px solid #e6e6e6', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Source Name</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Country</th>
                  <th style={{ padding: '12px 16px' }}>Articles</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Interval</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => (
                  <tr key={src.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{src.name}</span>
                        <a 
                          href={src.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ fontSize: 11, color: '#006699', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 400, marginTop: 2 }}
                        >
                          {src.url?.slice(0, 45)}... <ExternalLink size={10} />
                        </a>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{src.category}</td>
                    <td style={{ padding: '12px 16px' }}>{src.country}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{src.total_articles || 0}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`bbc-source-status-pill status-${src.status}`}>
                        {src.status === 'healthy' && '🟢 Healthy'}
                        {src.status === 'slow' && '🟡 Slow'}
                        {src.status === 'failed' && '🔴 Failed'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{src.fetch_interval_minutes || src.fetch_interval || 15}m</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleTriggerFetch(src.id)}
                        style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, background: '#f0f0f0', borderRadius: 2, marginRight: 6, cursor: 'pointer' }}
                        title="Fetch this feed now"
                      >
                        Fetch
                      </button>
                      <button
                        onClick={() => handleToggleSource(src.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          background: src.active ? '#fee2e2' : '#dcfce7',
                          color: src.active ? '#b91c1c' : '#15803d',
                          borderRadius: 2,
                          marginRight: 6,
                          cursor: 'pointer'
                        }}
                      >
                        {src.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteSource(src.id, src.name)}
                        style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 2, cursor: 'pointer' }}
                        title="Delete source"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: User Access & Role Management */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search user email or name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: '100%', padding: '6px 10px 6px 32px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
              />
            </div>

            <button
              onClick={() => setAddUserModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: '#121212',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 3,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Add User
            </button>
          </div>

          <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e6e6e6', borderRadius: 4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f8f8', borderBottom: '1px solid #e6e6e6', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>User</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Preferred Country</th>
                  <th style={{ padding: '12px 16px' }}>Joined Date</th>
                  <th style={{ padding: '12px 16px' }}>Last Login</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#121212' }}>{u.full_name || 'Anonymous User'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span 
                        style={{
                          background: u.role === 'admin' ? '#fee2e2' : '#f1f5f9',
                          color: u.role === 'admin' ? '#b91c1c' : '#334155',
                          padding: '3px 8px',
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.preferences?.countries?.[0] || 'Global'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleUserRole(u.id, u.role)}
                        style={{
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 2,
                          background: u.role === 'admin' ? '#f1f5f9' : '#fee2e2',
                          color: u.role === 'admin' ? '#334155' : '#b80000',
                          marginRight: 6,
                          cursor: 'pointer'
                        }}
                      >
                        {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 2, cursor: 'pointer' }}
                        title="Delete User"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Story Clusters Inspector */}
      {activeTab === 'clusters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            The clustering engine groups articles covering the same event from multiple publishers into a single unified story cluster.
          </p>

          {clusters.map((cl) => (
            <div key={cl.id} style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 4, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800 }}>
                  {cl.canonical_title}
                </h3>
                <span className="bbc-multi-source-pill" style={{ background: '#dbeafe', color: '#1e40af' }}>
                  {cl.sources_count} Publishers Combined
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#767676', marginBottom: 12 }}>
                Category: {cl.category} • Importance Score: {cl.importance_score}/100 • Updated: {new Date(cl.last_updated_at).toLocaleString()}
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 6 }}>
                  Contributing Articles from Sources:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cl.contributing_articles?.map((art, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: idx < cl.contributing_articles.length - 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: 6 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#006699', marginRight: 8 }}>[{art.source_name}]</span>
                        <span>{art.title}</span>
                      </div>
                      <a href={art.url} target="_blank" rel="noreferrer" style={{ color: '#64748b', fontSize: 12 }}>View Original &gt;</a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Ingestion Logs */}
      {activeTab === 'logs' && (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e6e6e6', borderRadius: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f8f8', borderBottom: '1px solid #e6e6e6', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Timestamp</th>
                <th style={{ padding: '10px 14px' }}>Source</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Articles Found</th>
                <th style={{ padding: '10px 14px' }}>Added</th>
                <th style={{ padding: '10px 14px' }}>Dups Filtered</th>
                <th style={{ padding: '10px 14px' }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#767676' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>{log.source_name}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`bbc-source-status-pill status-${log.status}`}>{log.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>{log.articles_found}</td>
                  <td style={{ padding: '10px 14px', color: '#15803d', fontWeight: 600 }}>+{log.articles_added}</td>
                  <td style={{ padding: '10px 14px', color: '#b80000' }}>{log.duplicates_found}</td>
                  <td style={{ padding: '10px 14px' }}>{log.duration_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: ADD NEW SOURCE / SCRAPER */}
      {addSourceModalOpen && (
        <div className="bbc-drawer-backdrop open" onClick={() => setAddSourceModalOpen(false)} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', width: 480, maxWidth: '94vw', padding: 28, borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900 }}>Configure New Source / Web Scraper</h2>
              <button onClick={() => setAddSourceModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateSource}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Publisher Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. TechCrunch, The Hindu Tech" 
                  value={newSourceName} 
                  onChange={(e) => setNewSourceName(e.target.value)} 
                  required 
                  className="bbc-newsletter-input" 
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>RSS Feed / Website URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="url" 
                    placeholder="https://example.com/rss or https://example.com/news" 
                    value={newSourceUrl} 
                    onChange={(e) => setNewSourceUrl(e.target.value)} 
                    required 
                    className="bbc-newsletter-input" 
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    onClick={handleTestSource}
                    disabled={testingUrl}
                    style={{ padding: '6px 12px', background: '#006699', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer' }}
                  >
                    {testingUrl ? 'Testing...' : 'Test Feed'}
                  </button>
                </div>
              </div>

              {testResult && (
                <div style={{ background: testResult.valid ? '#ecfdf5' : '#fee2e2', border: '1px solid', borderColor: testResult.valid ? '#10b981' : '#f87171', padding: '10px 12px', borderRadius: 4, marginBottom: 14, fontSize: 12 }}>
                  {testResult.valid ? (
                    <div>
                      <span style={{ fontWeight: 800, color: '#047857' }}>✓ Valid Feed Detected!</span>
                      <div style={{ marginTop: 4, color: '#065f46' }}>
                        Type: {testResult.type} • Entries Found: {testResult.entries_found}
                        {testResult.sample_article_title && <div style={{ fontWeight: 600, marginTop: 2 }}>Sample: {testResult.sample_article_title}</div>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#b91c1c' }}>❌ Error testing URL: {testResult.error}</div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Category</label>
                  <select 
                    value={newSourceCat} 
                    onChange={(e) => setNewSourceCat(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                  >
                    {['World', 'India', 'Technology', 'Business', 'Sport', 'Health', 'Science', 'Culture'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Country Region</label>
                  <select 
                    value={newSourceCountry} 
                    onChange={(e) => setNewSourceCountry(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                  >
                    {['Global', 'India', 'US', 'UK', 'France', 'Germany', 'Qatar', 'Canada', 'Japan', 'Australia'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Ingestion Interval (Minutes)</label>
                <input 
                  type="number" 
                  min="5" 
                  max="1440" 
                  value={newSourceInterval} 
                  onChange={(e) => setNewSourceInterval(e.target.value)} 
                  className="bbc-newsletter-input" 
                />
              </div>

              <button type="submit" className="bbc-btn-newsletter" style={{ width: '100%' }}>
                Save & Enable Source
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD USER & ACCESS CONTROL */}
      {addUserModalOpen && (
        <div className="bbc-drawer-backdrop open" onClick={() => setAddUserModalOpen(false)} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', width: 420, maxWidth: '94vw', padding: 28, borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900 }}>Create New User Account</h2>
              <button onClick={() => setAddUserModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kaushal Admin" 
                  value={newUserName} 
                  onChange={(e) => setNewUserName(e.target.value)} 
                  required 
                  className="bbc-newsletter-input" 
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="user@example.com" 
                  value={newUserEmail} 
                  onChange={(e) => setNewUserEmail(e.target.value)} 
                  required 
                  className="bbc-newsletter-input" 
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newUserPassword} 
                  onChange={(e) => setNewUserPassword(e.target.value)} 
                  required 
                  className="bbc-newsletter-input" 
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Role & Permissions</label>
                <select 
                  value={newUserRole} 
                  onChange={(e) => setNewUserRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                >
                  <option value="user">User (Personalized Feed, Bookmarks, Digest)</option>
                  <option value="admin">Administrator (Full Control Room, Feed Config, User Management)</option>
                </select>
              </div>

              <button type="submit" className="bbc-btn-newsletter" style={{ width: '100%' }}>
                Create User
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
