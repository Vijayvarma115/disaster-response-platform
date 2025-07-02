import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const DisasterForm = ({ onDisasterCreated, currentUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    location_name: '',
    description: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagAdd = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/disasters`, formData, {
        headers: { 'x-user-id': currentUser }
      });

      onDisasterCreated(response.data);
      
      // Reset form
      setFormData({
        title: '',
        location_name: '',
        description: '',
        tags: []
      });
      setTagInput('');
    } catch (error) {
      console.error('Error creating disaster:', error);
      setError(error.response?.data?.error || 'Failed to create disaster');
    } finally {
      setLoading(false);
    }
  };

  const suggestedTags = ['flood', 'earthquake', 'fire', 'hurricane', 'tornado', 'emergency', 'urgent', 'medical', 'evacuation'];

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="error-message mb-3" style={{ 
            background: '#fef2f2', 
            color: '#dc2626', 
            padding: '1rem', 
            borderRadius: '6px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title">Disaster Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., NYC Flooding Emergency"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="location_name">Location</label>
          <input
            type="text"
            id="location_name"
            name="location_name"
            value={formData.location_name}
            onChange={handleInputChange}
            placeholder="e.g., Manhattan, NYC"
          />
          <small style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Location will be automatically geocoded for mapping
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the disaster situation, affected areas, and immediate needs..."
            required
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tag-input">
            {formData.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagAdd}
              placeholder="Type a tag and press Enter"
            />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <small style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Suggested tags:
            </small>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              {suggestedTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (!formData.tags.includes(tag)) {
                      setFormData(prev => ({
                        ...prev,
                        tags: [...prev.tags, tag]
                      }));
                    }
                  }}
                  style={{
                    background: formData.tags.includes(tag) ? '#dc2626' : '#f3f4f6',
                    color: formData.tags.includes(tag) ? 'white' : '#374151',
                    border: 'none',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !formData.title || !formData.description}
          >
            {loading ? '🔄 Creating...' : '🚨 Create Disaster Report'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => {
              setFormData({
                title: '',
                location_name: '',
                description: '',
                tags: []
              });
              setTagInput('');
              setError('');
            }}
          >
            Clear Form
          </button>
        </div>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>💡 Tips for Creating Disaster Reports</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e' }}>
          <li>Use clear, descriptive titles that indicate the type and location of disaster</li>
          <li>Include specific location information for accurate mapping and resource allocation</li>
          <li>Provide detailed descriptions of the situation, affected areas, and immediate needs</li>
          <li>Use relevant tags to help categorize and filter the disaster report</li>
          <li>Reports will be automatically shared with emergency response teams</li>
        </ul>
      </div>
    </div>
  );
};

export default DisasterForm;

