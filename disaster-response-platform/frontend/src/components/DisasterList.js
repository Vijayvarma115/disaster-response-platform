import React, { useState } from 'react';

const DisasterList = ({ disasters, onDisasterSelect, currentUser }) => {
  const [filter, setFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  // Get unique tags from all disasters
  const allTags = [...new Set(disasters.flatMap(d => d.tags || []))];

  // Filter disasters
  const filteredDisasters = disasters.filter(disaster => {
    const matchesSearch = !filter || 
      disaster.title.toLowerCase().includes(filter.toLowerCase()) ||
      disaster.description.toLowerCase().includes(filter.toLowerCase()) ||
      disaster.location_name?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesTag = !tagFilter || (disaster.tags && disaster.tags.includes(tagFilter));
    
    return matchesSearch && matchesTag;
  });

  // Sort disasters
  const sortedDisasters = [...filteredDisasters].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'location':
        return (a.location_name || '').localeCompare(b.location_name || '');
      case 'created_at':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPriorityColor = (tags) => {
    if (tags?.includes('urgent') || tags?.includes('critical')) return '#dc2626';
    if (tags?.includes('emergency')) return '#ea580c';
    return '#dc2626';
  };

  if (disasters.length === 0) {
    return (
      <div className="empty-state">
        <h3>No disasters reported yet</h3>
        <p>Create the first disaster report to get started with emergency coordination.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters and Controls */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              🔍 Search Disasters
            </label>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by title, description, or location..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              🏷️ Filter by Tag
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="">All tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              📊 Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            >
              <option value="created_at">Newest first</option>
              <option value="title">Title A-Z</option>
              <option value="location">Location A-Z</option>
            </select>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Showing {sortedDisasters.length} of {disasters.length} disasters
            </div>
          </div>
        </div>
      </div>

      {/* Disaster Cards */}
      <div className="disaster-list">
        {sortedDisasters.map(disaster => (
          <div 
            key={disaster.id} 
            className="disaster-card"
            onClick={() => onDisasterSelect(disaster)}
            style={{ borderLeftColor: getPriorityColor(disaster.tags) }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h3>{disaster.title}</h3>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'right' }}>
                <div>{formatDate(disaster.created_at)}</div>
                <div>by {disaster.owner_id}</div>
              </div>
            </div>

            {disaster.location_name && (
              <p style={{ margin: '0.25rem 0', color: '#374151', fontWeight: '500' }}>
                📍 {disaster.location_name}
              </p>
            )}

            <p style={{ 
              margin: '0.5rem 0', 
              color: '#6b7280',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {disaster.description}
            </p>

            {disaster.tags && disaster.tags.length > 0 && (
              <div className="disaster-tags">
                {disaster.tags.map(tag => (
                  <span key={tag} className="disaster-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{ 
              marginTop: '1rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              color: '#6b7280'
            }}>
              <span>Click to view details and manage response</span>
              <span style={{ color: getPriorityColor(disaster.tags) }}>
                {disaster.tags?.includes('urgent') ? '🚨 URGENT' : 
                 disaster.tags?.includes('critical') ? '⚠️ CRITICAL' : 
                 disaster.tags?.includes('emergency') ? '🔴 EMERGENCY' : '📋 ACTIVE'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {sortedDisasters.length === 0 && filter && (
        <div className="empty-state">
          <h3>No disasters match your search</h3>
          <p>Try adjusting your search terms or filters.</p>
          <button 
            className="btn btn-outline mt-2"
            onClick={() => {
              setFilter('');
              setTagFilter('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default DisasterList;

