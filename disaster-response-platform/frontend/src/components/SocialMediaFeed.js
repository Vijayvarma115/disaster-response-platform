import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const SocialMediaFeed = ({ disasterId, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchPosts = async (realtime = false) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_BASE_URL}/disasters/${disasterId}/social-media`,
        {
          headers: { 'x-user-id': currentUser },
          params: { realtime: realtime.toString(), limit: 50 }
        }
      );

      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching social media posts:', error);
      setError('Failed to fetch social media reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchPriorityPosts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_BASE_URL}/disasters/${disasterId}/social-media/priority`,
        {
          headers: { 'x-user-id': currentUser }
        }
      );

      setPosts(response.data.priority_posts);
    } catch (error) {
      console.error('Error fetching priority posts:', error);
      setError('Failed to fetch priority reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'priority') {
      fetchPriorityPosts();
    } else {
      fetchPosts(filter === 'realtime');
    }
  }, [disasterId, filter]);

  // Auto-refresh for realtime updates
  useEffect(() => {
    let interval;
    if (autoRefresh && filter === 'realtime') {
      interval = setInterval(() => {
        fetchPosts(true);
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, filter, disasterId]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🔶';
      case 'low': return '🔵';
      default: return '📝';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'user_report': return '👤';
      default: return '📱';
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
            📱 All Posts
          </button>
          <button
            onClick={() => setFilter('priority')}
            className={`btn ${filter === 'priority' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            🚨 Priority
          </button>
          <button
            onClick={() => setFilter('realtime')}
            className={`btn ${filter === 'realtime' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            🔴 Live Feed
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {filter === 'realtime' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
          )}
          <button
            onClick={() => {
              if (filter === 'priority') {
                fetchPriorityPosts();
              } else {
                fetchPosts(filter === 'realtime');
              }
            }}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            disabled={loading}
          >
            {loading ? '🔄' : '🔄'} Refresh
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

      {/* Posts Feed */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading && posts.length === 0 ? (
          <div className="loading">
            <div>🔄 Loading social media reports...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h4>No reports found</h4>
            <p>
              {filter === 'priority' 
                ? 'No priority reports at this time.' 
                : 'No social media reports available for this disaster.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map(post => (
              <div 
                key={post.id} 
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  borderLeft: `4px solid ${getUrgencyColor(post.urgency)}`,
                  ...(post.isRealtime && { 
                    background: '#f0fdf4', 
                    borderColor: '#10b981',
                    animation: 'pulse 2s infinite'
                  })
                }}
              >
                {/* Post Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{getPlatformIcon(post.platform)}</span>
                    <strong style={{ color: '#374151' }}>{post.user}</strong>
                    {post.isRealtime && (
                      <span style={{ 
                        background: '#10b981', 
                        color: 'white', 
                        padding: '0.125rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '500'
                      }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#6b7280'
                  }}>
                    <span>{getUrgencyIcon(post.urgency)}</span>
                    <span>{formatTimestamp(post.timestamp)}</span>
                  </div>
                </div>

                {/* Post Content */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ 
                    margin: 0, 
                    color: '#374151', 
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {post.content}
                  </p>
                </div>

                {/* Post Footer */}
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
                    {post.location && (
                      <span>📍 {post.location}</span>
                    )}
                    {post.keywords && post.keywords.length > 0 && (
                      <span>🏷️ {post.keywords.join(', ')}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: getUrgencyColor(post.urgency) }}>
                      {post.urgency?.toUpperCase()}
                    </span>
                    {post.verification_status && (
                      <span style={{
                        background: post.verification_status === 'verified' ? '#10b981' : 
                                  post.verification_status === 'pending' ? '#f59e0b' : '#ef4444',
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem'
                      }}>
                        {post.verification_status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {posts.length > 0 && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: '#f8fafc', 
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <span>📊 Total reports: {posts.length}</span>
            <span>🚨 Critical: {posts.filter(p => p.urgency === 'critical').length}</span>
            <span>⚠️ High: {posts.filter(p => p.urgency === 'high').length}</span>
            <span>🔶 Medium: {posts.filter(p => p.urgency === 'medium').length}</span>
            <span>🔵 Low: {posts.filter(p => p.urgency === 'low').length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaFeed;

