import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ImageVerification = ({ disasterId, currentUser, onVerificationComplete }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [stats, setStats] = useState(null);
  const [flaggedImages, setFlaggedImages] = useState([]);
  const [activeTab, setActiveTab] = useState('single');

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/disasters/${disasterId}/verify-image/stats`,
        {
          headers: { 'x-user-id': currentUser }
        }
      );
      setStats(response.data.verification_stats);
    } catch (error) {
      console.error('Error fetching verification stats:', error);
    }
  };

  const fetchFlaggedImages = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/disasters/${disasterId}/verify-image/flagged`,
        {
          headers: { 'x-user-id': currentUser }
        }
      );
      setFlaggedImages(response.data.flagged_images);
    } catch (error) {
      console.error('Error fetching flagged images:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFlaggedImages();
  }, [disasterId]);

  const verifySingleImage = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/disasters/${disasterId}/verify-image`,
        { image_url: imageUrl },
        {
          headers: { 'x-user-id': currentUser }
        }
      );

      setVerificationResult(response.data);
      onVerificationComplete();
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error verifying image:', error);
      setError(error.response?.data?.error || 'Failed to verify image');
    } finally {
      setLoading(false);
    }
  };

  const verifyBatchImages = async () => {
    const validUrls = batchUrls.filter(url => url.trim());
    
    if (validUrls.length === 0) {
      setError('Please enter at least one image URL');
      return;
    }

    setLoading(true);
    setError('');
    setBatchResults(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/disasters/${disasterId}/verify-image/batch`,
        { image_urls: validUrls },
        {
          headers: { 'x-user-id': currentUser }
        }
      );

      setBatchResults(response.data);
      onVerificationComplete();
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error verifying batch images:', error);
      setError(error.response?.data?.error || 'Failed to verify images');
    } finally {
      setLoading(false);
    }
  };

  const addBatchUrl = () => {
    setBatchUrls([...batchUrls, '']);
  };

  const removeBatchUrl = (index) => {
    setBatchUrls(batchUrls.filter((_, i) => i !== index));
  };

  const updateBatchUrl = (index, value) => {
    const newUrls = [...batchUrls];
    newUrls[index] = value;
    setBatchUrls(newUrls);
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#10b981';
      case 'flagged': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#dc2626';
      case 'unrelated': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getVerificationStatusIcon = (status) => {
    switch (status) {
      case 'verified': return '✅';
      case 'flagged': return '🚩';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      case 'unrelated': return '❓';
      default: return '❓';
    }
  };

  const sampleImageUrls = [
    'https://example.com/flood-damage-manhattan.jpg',
    'https://example.com/emergency-shelter-setup.jpg',
    'https://example.com/rescue-operation-progress.jpg',
    'https://example.com/infrastructure-damage.jpg'
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {[
          { id: 'single', label: '🔍 Single Image', icon: '🖼️' },
          { id: 'batch', label: '📦 Batch Verification', icon: '📚' },
          { id: 'stats', label: '📊 Statistics', icon: '📈' },
          { id: 'flagged', label: '🚩 Flagged Images', icon: '⚠️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#dc2626' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
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

      {/* Single Image Verification */}
      {activeTab === 'single' && (
        <div className="form-container">
          <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>🔍 Single Image Verification</h3>
          
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/disaster-image.jpg"
            />
            <small style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Enter the URL of an image to verify its authenticity and disaster context
            </small>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              📋 Sample URLs (Click to use)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {sampleImageUrls.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setImageUrl(url)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: '#3b82f6'
                  }}
                >
                  {url}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={verifySingleImage}
            className="btn btn-primary"
            disabled={loading || !imageUrl.trim()}
          >
            {loading ? '🔄 Verifying...' : '🔍 Verify Image'}
          </button>

          {/* Single Verification Result */}
          {verificationResult && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1.5rem', 
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              borderLeft: `4px solid ${getVerificationStatusColor(verificationResult.verification.verification_status)}`
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: 0, color: '#374151' }}>Verification Result</h4>
                <span style={{
                  background: getVerificationStatusColor(verificationResult.verification.verification_status),
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {getVerificationStatusIcon(verificationResult.verification.verification_status)}
                  {verificationResult.verification.verification_status.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <strong>Authenticity Score:</strong>
                  <div style={{ 
                    background: '#f3f4f6', 
                    borderRadius: '4px', 
                    height: '8px',
                    marginTop: '0.25rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: verificationResult.verification.authenticity_score > 70 ? '#10b981' : 
                                verificationResult.verification.authenticity_score > 40 ? '#f59e0b' : '#ef4444',
                      height: '100%',
                      width: `${verificationResult.verification.authenticity_score}%`
                    }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {verificationResult.verification.authenticity_score.toFixed(1)}%
                  </span>
                </div>

                <div>
                  <strong>Confidence:</strong>
                  <div style={{ 
                    background: '#f3f4f6', 
                    borderRadius: '4px', 
                    height: '8px',
                    marginTop: '0.25rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: '#3b82f6',
                      height: '100%',
                      width: `${verificationResult.verification.confidence}%`
                    }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {verificationResult.verification.confidence.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>Analysis:</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', lineHeight: '1.5' }}>
                  {verificationResult.verification.context_analysis}
                </p>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                <div><strong>Manipulation Detected:</strong> {verificationResult.verification.manipulation_detected ? 'Yes' : 'No'}</div>
                <div><strong>Disaster Context:</strong> {verificationResult.verification.disaster_context ? 'Yes' : 'No'}</div>
                <div><strong>Verified At:</strong> {new Date(verificationResult.verification.verified_at).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Verification */}
      {activeTab === 'batch' && (
        <div className="form-container">
          <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>📦 Batch Image Verification</h3>
          <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
            Verify multiple images at once (maximum 10 images per batch)
          </p>

          {batchUrls.map((url, index) => (
            <div key={index} className="form-group">
              <label>Image URL {index + 1}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateBatchUrl(index, e.target.value)}
                  placeholder={`https://example.com/image-${index + 1}.jpg`}
                  style={{ flex: 1 }}
                />
                {batchUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBatchUrl(index)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    ❌
                  </button>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={addBatchUrl}
              className="btn btn-outline"
              disabled={batchUrls.length >= 10}
            >
              ➕ Add URL
            </button>
            <button 
              onClick={verifyBatchImages}
              className="btn btn-primary"
              disabled={loading || batchUrls.filter(url => url.trim()).length === 0}
            >
              {loading ? '🔄 Verifying...' : '🔍 Verify All Images'}
            </button>
          </div>

          {/* Batch Results */}
          {batchResults && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                Batch Verification Results ({batchResults.successful_verifications}/{batchResults.total_images} successful)
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {batchResults.results.map((result, index) => (
                  <div 
                    key={index}
                    style={{
                      background: result.success ? 'white' : '#fef2f2',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      borderLeft: result.success ? 
                        `4px solid ${getVerificationStatusColor(result.verification?.verification_status)}` :
                        '4px solid #ef4444'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: '#6b7280', wordBreak: 'break-all' }}>
                        {result.image_url}
                      </span>
                      {result.success ? (
                        <span style={{
                          background: getVerificationStatusColor(result.verification.verification_status),
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem'
                        }}>
                          {result.verification.verification_status.toUpperCase()}
                        </span>
                      ) : (
                        <span style={{
                          background: '#ef4444',
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem'
                        }}>
                          FAILED
                        </span>
                      )}
                    </div>
                    
                    {result.success && (
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        Authenticity: {result.verification.authenticity_score.toFixed(1)}% | 
                        Confidence: {result.verification.confidence.toFixed(1)}%
                      </div>
                    )}
                    
                    {!result.success && (
                      <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {activeTab === 'stats' && (
        <div>
          <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>📊 Verification Statistics</h3>
          
          {stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>📈 Overall Stats</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>Total Images: <strong>{stats.total_images_verified}</strong></div>
                  <div>Average Authenticity: <strong>{stats.average_authenticity_score.toFixed(1)}%</strong></div>
                  <div>Average Confidence: <strong>{stats.average_confidence.toFixed(1)}%</strong></div>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>✅ Verification Status</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }} />
                    Verified: <strong>{stats.verified_count}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }} />
                    Flagged: <strong>{stats.flagged_count}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%' }} />
                    Pending: <strong>{stats.pending_count}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: '#dc2626', borderRadius: '50%' }} />
                    Rejected: <strong>{stats.rejected_count}</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>🔧 Verification Methods</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>AI Analysis: <strong>{stats.verification_methods.gemini_ai}</strong></div>
                  <div>Manual Review: <strong>{stats.verification_methods.manual_review}</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="loading">Loading statistics...</div>
          )}
        </div>
      )}

      {/* Flagged Images */}
      {activeTab === 'flagged' && (
        <div>
          <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>🚩 Flagged Images</h3>
          
          {flaggedImages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {flaggedImages.map(image => (
                <div 
                  key={image.id}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    borderLeft: '4px solid #ef4444'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280', wordBreak: 'break-all' }}>
                      {image.image_url}
                    </span>
                    <span style={{
                      background: '#ef4444',
                      color: 'white',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem'
                    }}>
                      🚩 FLAGGED
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Reason:</strong> {image.reason}
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Authenticity: {image.authenticity_score.toFixed(1)}% | 
                    Confidence: {image.confidence.toFixed(1)}% | 
                    Flagged: {new Date(image.flagged_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h4>No flagged images</h4>
              <p>All verified images have passed authenticity checks.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageVerification;

