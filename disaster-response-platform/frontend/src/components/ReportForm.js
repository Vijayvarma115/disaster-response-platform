import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ReportForm = ({ disasterId, currentUser, onReportSubmitted }) => {
  const [formData, setFormData] = useState({
    content: '',
    image_url: '',
    location: '',
    urgency: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/disasters/${disasterId}/social-media/report`,
        formData,
        {
          headers: { 'x-user-id': currentUser }
        }
      );

      setSuccess('Report submitted successfully! It will be reviewed and added to the social media feed.');
      onReportSubmitted(response.data);
      
      // Reset form
      setFormData({
        content: '',
        image_url: '',
        location: '',
        urgency: 'medium'
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const urgencyOptions = [
    { value: 'low', label: 'Low - General information', color: '#10b981' },
    { value: 'medium', label: 'Medium - Needs attention', color: '#f59e0b' },
    { value: 'high', label: 'High - Urgent assistance needed', color: '#ef4444' },
    { value: 'critical', label: 'Critical - Immediate emergency', color: '#dc2626' }
  ];

  const reportTemplates = [
    {
      title: 'Need Assistance',
      content: 'Need immediate assistance at [location]. Situation: [describe situation]. Number of people affected: [number]. Contact: [phone/email]'
    },
    {
      title: 'Offer Help',
      content: 'Available to help with [type of assistance] in [area]. Can provide: [resources/services]. Contact me at: [contact info]'
    },
    {
      title: 'Resource Available',
      content: 'Have [resource type] available for disaster victims. Location: [where]. Quantity: [amount]. How to access: [instructions]'
    },
    {
      title: 'Situation Update',
      content: 'Current situation at [location]: [description]. Roads: [status]. Utilities: [status]. Safety concerns: [any concerns]'
    }
  ];

  return (
    <div className="form-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>📝 Submit Social Media Report</h3>
        <p style={{ margin: 0, color: '#6b7280' }}>
          Share information about needs, offers, or situation updates related to this disaster.
        </p>
      </div>

      {error && (
        <div style={{ 
          background: '#fef2f2', 
          color: '#dc2626', 
          padding: '1rem', 
          borderRadius: '6px',
          border: '1px solid #fecaca',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#f0fdf4', 
          color: '#166534', 
          padding: '1rem', 
          borderRadius: '6px',
          border: '1px solid #bbf7d0',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      {/* Quick Templates */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          📋 Quick Templates (Click to use)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {reportTemplates.map((template, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, content: template.content }))}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '0.75rem',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#f1f5f9';
                e.target.style.borderColor = '#cbd5e1';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.borderColor = '#e2e8f0';
              }}
            >
              <strong>{template.title}</strong>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="content">Report Content *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Describe the situation, needs, offers, or updates. Be specific about location and contact information if relevant."
            required
            rows={5}
          />
          <small style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Include specific details like location, number of people affected, type of assistance needed, etc.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="location">Specific Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g., 123 Main St, Lower East Side, Building 5 Apt 3A"
          />
          <small style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Provide specific address or landmark for better resource allocation
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="image_url">Image URL (Optional)</label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
          <small style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Link to an image that shows the situation (will be verified for authenticity)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="urgency">Urgency Level</label>
          <select
            id="urgency"
            name="urgency"
            value={formData.urgency}
            onChange={handleInputChange}
          >
            {urgencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div 
              style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: urgencyOptions.find(o => o.value === formData.urgency)?.color 
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {urgencyOptions.find(o => o.value === formData.urgency)?.label}
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !formData.content}
          >
            {loading ? '🔄 Submitting...' : '📤 Submit Report'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => {
              setFormData({
                content: '',
                image_url: '',
                location: '',
                urgency: 'medium'
              });
              setError('');
              setSuccess('');
            }}
          >
            Clear Form
          </button>
        </div>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fffbeb', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>⚠️ Important Guidelines</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e', fontSize: '0.9rem' }}>
          <li>Only submit accurate, first-hand information</li>
          <li>Include contact information if you need assistance or can provide help</li>
          <li>Use appropriate urgency levels - critical should only be used for life-threatening situations</li>
          <li>Images will be automatically verified for authenticity</li>
          <li>Reports are shared with emergency response teams and the public</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportForm;

