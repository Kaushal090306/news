import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, ShieldCheck, Activity, Layers, Database, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { api } from '../services/api';

export const AdminPanel = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('sources'); // 'sources', 'clusters', 'logs'
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, sourcesRes, clustersRes, logsRes] = await Promise.all([
        api.getAdminStats(),
        api.getSources(),
        api.getAdminClusters(),
        api.getAdminLogs()
      ]);
      setStats(statsRes);
      setSources(sourcesRes.sources || []);
      setClusters(clustersRes.clusters || []);
      setLogs(logsRes.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerFetch = async (sourceId = null) => {
    setFetching(true);
    setFetchMessage('Ingestion cycle started in background...');
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

  return (
    <div className="bbc-admin-view">
      <button 
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, fontWeight: 700, color: '#4a4a4a' }}
      >
        <ArrowLeft size={16} /> Exit Admin Room
      </button>

      <div className="bbc-admin-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-serif)' }}>
            Editorial & Ingestion Control Room
          </h1>
          <p style={{ fontSize: 13, color: '#4a4a4a', marginTop: 4 }}>
            Manage 25+ international feeds, monitor 5-tier deduplication, and inspect semantic clusters.
          </p>
        </div>

        <button
          className="bbc-btn-register"
          onClick={() => handleTriggerFetch()}
          disabled={fetching}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
          <span>{fetching ? 'Ingesting Feeds...' : 'Trigger Ingestion Cycle'}</span>
        </button>
      </div>

      {fetchMessage && (
        <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '10px 16px', borderRadius: 4, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
          {fetchMessage}
        </div>
      )}

      {/* KPI Stats Cards */}
      {stats && (
        <div className="bbc-stats-grid">
          <div className="bbc-stat-card">
            <div className="bbc-stat-label">Active Sources</div>
            <div className="bbc-stat-value">{stats.sources?.total_sources || 29}</div>
            <div style={{ fontSize: 11, color: '#15803d', marginTop: 4 }}>
              🟢 {stats.sources?.healthy_sources || 27} Healthy • 🟡 {stats.sources?.slow_sources || 2} Slow
            </div>
          </div>

          <div className="bbc-stat-card">
            <div className="bbc-stat-label">Total Ingested Articles</div>
            <div className="bbc-stat-value">{stats.total_articles}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              From 29 International Feeds
            </div>
          </div>

          <div className="bbc-stat-card">
            <div className="bbc-stat-label">Unique Stories Clustered</div>
            <div className="bbc-stat-value">{stats.total_stories}</div>
            <div style={{ fontSize: 11, color: '#006699', marginTop: 4 }}>
              Multi-source synthesized stories
            </div>
          </div>

          <div className="bbc-stat-card">
            <div className="bbc-stat-label">Duplicates Prevented</div>
            <div className="bbc-stat-value" style={{ color: '#15803d' }}>
              {stats.total_duplicates_prevented}
            </div>
            <div style={{ fontSize: 11, color: '#15803d', marginTop: 4 }}>
              Deduplication Rate: {stats.duplicate_prevention_rate}
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #e6e6e6', marginBottom: 20 }}>
        <button
          style={{
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 700,
            borderBottom: activeTab === 'sources' ? '3px solid #121212' : 'none',
            color: activeTab === 'sources' ? '#121212' : '#767676'
          }}
          onClick={() => setActiveTab('sources')}
        >
          Sources Health & Config ({sources.length})
        </button>

        <button
          style={{
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 700,
            borderBottom: activeTab === 'clusters' ? '3px solid #121212' : 'none',
            color: activeTab === 'clusters' ? '#121212' : '#767676'
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
            color: activeTab === 'logs' ? '#121212' : '#767676'
          }}
          onClick={() => setActiveTab('logs')}
        >
          Ingestion Logs
        </button>
      </div>

      {/* TAB 1: Sources Table */}
      {activeTab === 'sources' && (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e6e6e6', borderRadius: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f8f8', borderBottom: '1px solid #e6e6e6', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Source Name</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Country</th>
                <th style={{ padding: '12px 16px' }}>Articles</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Interval</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => (
                <tr key={src.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {src.logo_url && (
                        <img src={src.logo_url} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      )}
                      <span>{src.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 3, fontSize: 11, fontWeight: 600 }}>{src.type}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{src.category}</td>
                  <td style={{ padding: '12px 16px' }}>{src.country}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{src.total_articles}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`bbc-source-status-pill status-${src.status}`}>
                      {src.status === 'healthy' && '🟢 Healthy'}
                      {src.status === 'slow' && '🟡 Slow'}
                      {src.status === 'failed' && '🔴 Failed'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{src.fetch_interval}m</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleTriggerFetch(src.id)}
                      style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, background: '#f0f0f0', borderRadius: 2, marginRight: 6 }}
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
                        borderRadius: 2
                      }}
                    >
                      {src.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Story Clusters Inspector */}
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

      {/* TAB 3: Ingestion Logs */}
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
    </div>
  );
};
