import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

// Components
import DisasterForm from './components/DisasterForm';
import DisasterList from './components/DisasterList';
import ReportForm from './components/ReportForm';
import SocialMediaFeed from './components/SocialMediaFeed';
import ResourceMap from './components/ResourceMap';
import OfficialUpdates from './components/OfficialUpdates';
import ImageVerification from './components/ImageVerification';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState('netrunnerX'); // Mock user
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [disasters, setDisasters] = useState([]);
  const [activeTab, setActiveTab] = useState('disasters');
  const [notifications, setNotifications] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001');
    setSocket(newSocket);

    // Listen for real-time updates
    newSocket.on('disaster_updated', (data) => {
      console.log('Disaster updated:', data);
      addNotification(`Disaster ${data.action}: ${data.disaster.title}`, 'info');
      if (data.action === 'create') {
        setDisasters(prev => [data.disaster, ...prev]);
      } else if (data.action === 'update') {
        setDisasters(prev => prev.map(d => d.id === data.disaster.id ? data.disaster : d));
      } else if (data.action === 'delete') {
        setDisasters(prev => prev.filter(d => d.id !== data.disaster.id));
      }
    });

    newSocket.on('social_media_updated', (data) => {
      console.log('Social media updated:', data);
      addNotification(`New social media reports for disaster`, 'info');
    });

    newSocket.on('resources_updated', (data) => {
      console.log('Resources updated:', data);
      addNotification(`Resources updated for disaster`, 'info');
    });

    return () => newSocket.close();
  }, []);

  // Fetch disasters on component mount
  useEffect(() => {
    fetchDisasters();
  }, []);

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const fetchDisasters = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/disasters`, {
        headers: { 'x-user-id': currentUser }
      });
      setDisasters(response.data.disasters);
    } catch (error) {
      console.error('Error fetching disasters:', error);
      addNotification('Error fetching disasters', 'error');
    }
  };

  const handleDisasterCreated = (disaster) => {
    setDisasters(prev => [disaster, ...prev]);
    addNotification('Disaster created successfully', 'success');
  };

  const handleDisasterSelected = (disaster) => {
    setSelectedDisaster(disaster);
    setActiveTab('details');
  };

  const tabs = [
    { id: 'disasters', label: 'Disasters', icon: '🚨' },
    { id: 'create', label: 'Create Disaster', icon: '➕' },
    { id: 'details', label: 'Disaster Details', icon: '📋', disabled: !selectedDisaster },
    { id: 'reports', label: 'Submit Report', icon: '📝', disabled: !selectedDisaster },
    { id: 'verification', label: 'Image Verification', icon: '🔍', disabled: !selectedDisaster }
  ];

  return (
    <div className="App">
      <header className="app-header">
        <h1>🚨 Disaster Response Coordination Platform</h1>
        <div className="user-info">
          <span>User: {currentUser}</span>
          <select 
            value={currentUser} 
            onChange={(e) => setCurrentUser(e.target.value)}
            className="user-select"
          >
            <option value="netrunnerX">netrunnerX (Admin)</option>
            <option value="reliefAdmin">reliefAdmin (Admin)</option>
            <option value="contributor1">contributor1 (Contributor)</option>
            <option value="citizen1">citizen1 (Contributor)</option>
          </select>
        </div>
      </header>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map(notification => (
            <div key={notification.id} className={`notification ${notification.type}`}>
              {notification.message}
              <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'disasters' && (
          <div className="disasters-view">
            <h2>Active Disasters</h2>
            <DisasterList 
              disasters={disasters}
              onDisasterSelect={handleDisasterSelected}
              currentUser={currentUser}
            />
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-view">
            <h2>Create New Disaster Report</h2>
            <DisasterForm 
              onDisasterCreated={handleDisasterCreated}
              currentUser={currentUser}
            />
          </div>
        )}

        {activeTab === 'details' && selectedDisaster && (
          <div className="details-view">
            <h2>Disaster Details: {selectedDisaster.title}</h2>
            <div className="details-grid">
              <div className="details-section">
                <h3>📍 Location & Info</h3>
                <p><strong>Location:</strong> {selectedDisaster.location_name || 'Not specified'}</p>
                <p><strong>Description:</strong> {selectedDisaster.description}</p>
                <p><strong>Tags:</strong> {selectedDisaster.tags?.join(', ') || 'None'}</p>
                <p><strong>Owner:</strong> {selectedDisaster.owner_id}</p>
                <p><strong>Created:</strong> {new Date(selectedDisaster.created_at).toLocaleString()}</p>
              </div>
              
              <div className="details-section">
                <h3>📱 Social Media Reports</h3>
                <SocialMediaFeed 
                  disasterId={selectedDisaster.id}
                  currentUser={currentUser}
                />
              </div>
              
              <div className="details-section">
                <h3>🏥 Nearby Resources</h3>
                <ResourceMap 
                  disasterId={selectedDisaster.id}
                  currentUser={currentUser}
                />
              </div>
              
              <div className="details-section">
                <h3>📢 Official Updates</h3>
                <OfficialUpdates 
                  disasterId={selectedDisaster.id}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && selectedDisaster && (
          <div className="reports-view">
            <h2>Submit Report for: {selectedDisaster.title}</h2>
            <ReportForm 
              disasterId={selectedDisaster.id}
              currentUser={currentUser}
              onReportSubmitted={() => addNotification('Report submitted successfully', 'success')}
            />
          </div>
        )}

        {activeTab === 'verification' && selectedDisaster && (
          <div className="verification-view">
            <h2>Image Verification for: {selectedDisaster.title}</h2>
            <ImageVerification 
              disasterId={selectedDisaster.id}
              currentUser={currentUser}
              onVerificationComplete={() => addNotification('Image verification completed', 'success')}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Disaster Response Coordination Platform - Real-time Emergency Management</p>
        <p>Connected: {socket?.connected ? '🟢 Online' : '🔴 Offline'}</p>
      </footer>
    </div>
  );
}

export default App;

