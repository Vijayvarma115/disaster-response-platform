import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const OfficialUpdates = ({ disasterId, currentUser }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sources, setSources] = useState([]);

  const fetchUpdates = async (fresh = false) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        limit: 20,
        ...(filter !== 'all' && filter !== 'fresh' && { priority: filter }),
        ...(fresh && { fresh: 'true' })
      };

      const response = await axios.get(
        `${API_BASE_URL}/disasters/${disasterId}/official-updates`,
        {
          headers: { 'x-user-id': currentUser },
          params
        }
      );

      setUpdates(response.data.updates);
    } catch (error) {
      console.error('Error fetching official updates:', error);
      setError('Failed to fetch official updates');
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/disasters/${disasterId}/official-updates/sources`,
        {
          headers: { 'x-user-id': currentUser }
        }
      );
      setSources(response.data.sources);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const refreshUpdates = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/disasters/${disasterId}/official-updates/refresh`,
        {},
        {
          headers: { 'x-user-id': currentUser }
        }
      );
      // Fetch fresh updates after refresh
      fetchUpdates(true);
    } catch (error) {
      console.error('Error refreshing updates:', error);
      setError('Failed to refresh updates');
    }
  };

  useEffect(() => {
    fetchUpdates(filter === 'fresh');
    fetchSources();
  }, [disasterId, filter]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📢';
      case 'low': return 'ℹ️';
      default: return '📄';
    }
  };

  const getSourceIcon = (source) => {
    if (source.includes('FEMA')) return '🏛️';
    if (source.includes('NYC') || source.includes('City')) return '🏙️';
    if (source.includes('Red Cross')) return '🔴';
    if (source.includes('Health')) return '🏥';
    if (source.includes('MTA') || source.includes('Transportation')) return '🚇';
    return '📰';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'evacuation': return '#dc2626';
      case 'shelter': return '#3b82f6';
      case 'health': return '#10b981';
      case 'transportation': return '#f59e0b';
      case 'official': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            📄 All Updates
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`btn ${filter === 'critical' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            🚨 Critical
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`btn ${filter === 'high' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            ⚠️ High Priority
          </button>
          <button
            onClick={() => setFilter('fresh')}
            className={`btn ${filter === 'fresh' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            🔄 Fresh Data
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => fetchUpdates(filter === 'fresh')}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            disabled={loading}
          >
            {loading ? '🔄' : '🔄'} Refresh
          </button>
          <button
            onClick={refreshUpdates}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            disabled={loading}
          >
            🌐 Scrape Fresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          background: '#fef2f2', 
          color: '#dc2626', 
          padding: '1rem', 
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Sources Info */}
      {sources.length > 0 && (
        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.9rem' }}>
            📡 Monitoring {sources.length} Official Sources
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {sources.map(source => (
              <span 
                key={source.name}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {getSourceIcon(source.name)} {source.name} ({source.update_count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Updates Feed */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading && updates.length === 0 ? (
          <div className="loading">
            <div>🔄 Loading official updates...</div>
          </div>
        ) : updates.length === 0 ? (
          <div className="empty-state">
            <h4>No official updates found</h4>
            <p>
              {filter === 'fresh' 
                ? 'No fresh updates available from official sources.' 
                : `No ${filter === 'all' ? '' : filter + ' priority'} official updates found.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {updates.map(update => (
              <div 
                key={update.id} 
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  borderLeft: `4px solid ${getPriorityColor(update.priority)}`,
                  ...(update.isScraped && { 
                    background: '#fffbeb', 
                    borderColor: '#f59e0b'
                  })
                }}
              >
                {/* Update Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{getSourceIcon(update.source)}</span>
                    <div>
                      <strong style={{ color: '#374151' }}>{update.source}</strong>
                      {update.isScraped && (
                        <span style={{ 
                          background: '#f59e0b', 
                          color: 'white', 
                          padding: '0.125rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          marginLeft: '0.5rem'
                        }}>
                          FRESH
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#6b7280'
                  }}>
                    <span>{getPriorityIcon(update.priority)}</span>
                    <span>{formatTimestamp(update.published_at)}</span>
                  </div>
                </div>

                {/* Update Title */}
                <h4 style={{ 
                  margin: '0 0 0.75rem 0', 
                  color: '#1e293b',
                  fontSize: '1.1rem',
                  lineHeight: '1.4'
                }}>
                  {update.title}
                </h4>

                {/* Update Content */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ 
                    margin: 0, 
                    color: '#374151', 
                    lineHeight: '1.6',
                    fontSize: '0.95rem'
                  }}>
                    {update.content}
                  </p>
                </div>

                {/* Update Footer */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  borderTop: '1px solid #f3f4f6',
                  paddingTop: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {update.url && (
                      <a 
                        href={update.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          color: '#3b82f6', 
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        🔗 View Source
                      </a>
                    )}
                    {update.tags && update.tags.length > 0 && (
                      <span>🏷️ {update.tags.join(', ')}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      background: getCategoryColor(update.category),
                      color: 'white',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem'
                    }}>
                      {update.category?.toUpperCase()}
                    </span>
                    <span style={{ color: getPriorityColor(update.priority) }}>
                      {update.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {updates.length > 0 && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: '#f8fafc', 
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <span>📊 Total updates: {updates.length}</span>
            <span>🚨 Critical: {updates.filter(u => u.priority === 'critical').length}</span>
            <span>⚠️ High: {updates.filter(u => u.priority === 'high').length}</span>
            <span>📢 Medium: {updates.filter(u => u.priority === 'medium').length}</span>
            <span>ℹ️ Low: {updates.filter(u => u.priority === 'low').length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficialUpdates;

