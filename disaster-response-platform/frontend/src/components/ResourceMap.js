import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ResourceMap = ({ disasterId, currentUser }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [radius, setRadius] = useState(10);
  const [searchLocation, setSearchLocation] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        radius: radius,
        ...(filter !== 'all' && { type: filter })
      };

      const response = await axios.get(
        `${API_BASE_URL}/disasters/${disasterId}/resources`,
        {
          headers: { 'x-user-id': currentUser },
          params
        }
      );

      setResources(response.data.resources);
      setSearchLocation(response.data.search_location);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchResourceTypes = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/disasters/${disasterId}/resources/types`,
        {
          headers: { 'x-user-id': currentUser }
        }
      );
      return response.data.resource_types;
    } catch (error) {
      console.error('Error fetching resource types:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchResources();
  }, [disasterId, filter, radius]);

  const getResourceIcon = (type) => {
    switch (type) {
      case 'shelter': return '🏠';
      case 'medical': return '🏥';
      case 'food': return '🍽️';
      case 'supplies': return '📦';
      default: return '📍';
    }
  };

  const getResourceColor = (type) => {
    switch (type) {
      case 'shelter': return '#3b82f6';
      case 'medical': return '#ef4444';
      case 'food': return '#10b981';
      case 'supplies': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getCapacityStatus = (resource) => {
    if (!resource.capacity) return null;
    
    const percentage = (resource.current_occupancy / resource.capacity) * 100;
    
    if (percentage >= 90) return { status: 'full', color: '#ef4444', text: 'Nearly Full' };
    if (percentage >= 70) return { status: 'busy', color: '#f59e0b', text: 'Busy' };
    if (percentage >= 30) return { status: 'available', color: '#10b981', text: 'Available' };
    return { status: 'plenty', color: '#10b981', text: 'Plenty of Space' };
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
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
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">All Resources</option>
            <option value="shelter">🏠 Shelters</option>
            <option value="medical">🏥 Medical</option>
            <option value="food">🍽️ Food</option>
            <option value="supplies">📦 Supplies</option>
          </select>

          <select
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            <option value={5}>Within 5km</option>
            <option value={10}>Within 10km</option>
            <option value={20}>Within 20km</option>
            <option value={50}>Within 50km</option>
          </select>
        </div>

        <button
          onClick={fetchResources}
          className="btn btn-outline"
          style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          disabled={loading}
        >
          {loading ? '🔄' : '🔄'} Refresh
        </button>
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

      {/* Search Location Info */}
      {searchLocation && (
        <div style={{ 
          background: '#f0f9ff', 
          padding: '0.75rem', 
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: '#0c4a6e'
        }}>
          📍 Searching within {radius}km of {searchLocation.lat.toFixed(4)}, {searchLocation.lng.toFixed(4)}
        </div>
      )}

      {/* Resources List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading && resources.length === 0 ? (
          <div className="loading">
            <div>🔄 Loading nearby resources...</div>
          </div>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <h4>No resources found</h4>
            <p>No {filter === 'all' ? '' : filter} resources found within {radius}km of the disaster location.</p>
            <button 
              className="btn btn-outline mt-2"
              onClick={() => {
                setRadius(50);
                setFilter('all');
              }}
            >
              Expand Search
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {resources.map(resource => {
              const capacityStatus = getCapacityStatus(resource);
              
              return (
                <div 
                  key={resource.id} 
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    borderLeft: `4px solid ${getResourceColor(resource.type)}`
                  }}
                >
                  {/* Resource Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{getResourceIcon(resource.type)}</span>
                      <div>
                        <h4 style={{ margin: 0, color: '#374151' }}>{resource.name}</h4>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                          📍 {resource.location_name}
                        </p>
                      </div>
                    </div>
                    <div style={{ 
                      textAlign: 'right',
                      fontSize: '0.8rem',
                      color: '#6b7280'
                    }}>
                      <div>📏 {formatDistance(resource.distance)} away</div>
                      <div style={{ 
                        color: getResourceColor(resource.type),
                        fontWeight: '500',
                        textTransform: 'uppercase'
                      }}>
                        {resource.type}
                      </div>
                    </div>
                  </div>

                  {/* Capacity Info */}
                  {resource.capacity && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                          Capacity: {resource.current_occupancy || 0} / {resource.capacity}
                        </span>
                        {capacityStatus && (
                          <span style={{
                            background: capacityStatus.color,
                            color: 'white',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '500'
                          }}>
                            {capacityStatus.text}
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        background: '#f3f4f6', 
                        borderRadius: '4px', 
                        height: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: capacityStatus?.color || '#6b7280',
                          height: '100%',
                          width: `${Math.min((resource.current_occupancy / resource.capacity) * 100, 100)}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {resource.services && resource.services.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.25rem' }}>
                        Services:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {resource.services.map(service => (
                          <span 
                            key={service}
                            style={{
                              background: '#f3f4f6',
                              color: '#374151',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem'
                            }}
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '0.75rem'
                  }}>
                    <div>
                      {resource.contact && (
                        <span>📞 {resource.contact}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        background: resource.status === 'active' ? '#10b981' : '#6b7280',
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem'
                      }}>
                        {resource.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {resources.length > 0 && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: '#f8fafc', 
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <span>📊 Total resources: {resources.length}</span>
            <span>🏠 Shelters: {resources.filter(r => r.type === 'shelter').length}</span>
            <span>🏥 Medical: {resources.filter(r => r.type === 'medical').length}</span>
            <span>🍽️ Food: {resources.filter(r => r.type === 'food').length}</span>
            <span>📦 Supplies: {resources.filter(r => r.type === 'supplies').length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceMap;

