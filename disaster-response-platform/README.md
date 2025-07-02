# 🚨 Disaster Response Coordination Platform

A comprehensive real-time emergency management system that enables efficient coordination of disaster response efforts through social media monitoring, resource mapping, and official updates aggregation.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

The Disaster Response Coordination Platform is designed to streamline emergency response operations by providing:

- **Real-time Communication**: Socket.io-powered live updates
- **Social Media Integration**: Automated monitoring and verification
- **Resource Management**: Dynamic mapping of emergency resources
- **Official Updates**: Aggregation from government and emergency services
- **Image Verification**: AI-powered authenticity checking
- **Geospatial Analysis**: Location-based resource allocation

## ✨ Features

### Core Functionality

- 🚨 **Disaster Management**: Create, track, and manage disaster incidents
- 📱 **Social Media Monitoring**: Real-time social media feed analysis
- 🗺️ **Resource Mapping**: Interactive maps showing nearby emergency resources
- 📢 **Official Updates**: Automated scraping of official emergency communications
- 🔍 **Image Verification**: AI-powered verification of disaster-related images
- 👥 **User Management**: Role-based access control (Admin, Contributor, Citizen)

### Technical Features

- ⚡ **Real-time Updates**: Live data synchronization across all clients
- 🔒 **Secure Authentication**: JWT-based authentication system
- 📊 **Caching System**: Optimized performance with intelligent caching
- 🌐 **RESTful API**: Comprehensive API for all platform operations
- 📱 **Responsive Design**: Mobile-first, responsive user interface
- 🔄 **Auto-refresh**: Configurable automatic data refresh

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **Socket.io Client**: Real-time communication
- **Axios**: HTTP client for API calls
- **CSS3**: Custom responsive styling

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **Socket.io**: Real-time bidirectional communication
- **Supabase**: PostgreSQL database with real-time features

### External Services
- **Google Gemini AI**: Image verification and content analysis
- **Google Maps API**: Geocoding and mapping services
- **Supabase**: Database and authentication

### Development Tools
- **npm**: Package management
- **nodemon**: Development server with hot reload
- **ESLint**: Code linting and formatting

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher
- Supabase account
- Google Cloud Platform account (for APIs)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd disaster-response-platform
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Backend configuration
   cd backend
   cp .env.example .env
   # Edit .env with your API keys (see API_CONFIGURATION_GUIDE.md)
   
   # Frontend configuration
   cd ../frontend
   # .env is already configured for local development
   ```

4. **Set up database**
   - Create a Supabase project
   - Run the SQL script from `backend/database_setup.sql`
   - Update `.env` with your Supabase credentials

5. **Start the application**
   ```bash
   # Start backend (in one terminal)
   cd backend
   npm run dev
   
   # Start frontend (in another terminal)
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📁 Project Structure

```
disaster-response-platform/
├── backend/                    # Node.js/Express backend
│   ├── config/                # Configuration files
│   │   └── supabase.js        # Supabase client configuration
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # Authentication middleware
│   │   ├── errorHandler.js   # Error handling middleware
│   │   └── rateLimit.js      # Rate limiting middleware
│   ├── routes/               # API route handlers
│   │   ├── disasters.js      # Disaster management routes
│   │   ├── geocode.js        # Geocoding routes
│   │   ├── resources.js      # Resource management routes
│   │   ├── socialMedia.js    # Social media routes
│   │   ├── updates.js        # Official updates routes
│   │   └── verification.js   # Image verification routes
│   ├── utils/                # Utility functions
│   │   ├── cache.js          # Caching utilities
│   │   └── logger.js         # Logging utilities
│   ├── .env.example          # Environment variables template
│   ├── database_setup.sql    # Database schema and sample data
│   ├── package.json          # Backend dependencies
│   └── server.js             # Main server file
├── frontend/                  # React frontend
│   ├── public/               # Static assets
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   │   ├── DisasterForm.js      # Disaster creation form
│   │   │   ├── DisasterList.js      # Disaster listing component
│   │   │   ├── ImageVerification.js # Image verification interface
│   │   │   ├── OfficialUpdates.js   # Official updates display
│   │   │   ├── ReportForm.js        # Report submission form
│   │   │   ├── ResourceMap.js       # Resource mapping component
│   │   │   └── SocialMediaFeed.js   # Social media feed
│   │   ├── App.css           # Main stylesheet
│   │   ├── App.js            # Main application component
│   │   └── index.js          # Application entry point
│   ├── .env                  # Frontend environment variables
│   └── package.json          # Frontend dependencies
├── API_CONFIGURATION_GUIDE.md # Detailed API setup guide
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
├── README.md                 # This file
└── testing_results.md        # Testing documentation
```

## 📚 API Documentation

### Authentication

All API endpoints require authentication via the `x-user-id` header:

```bash
curl -H "x-user-id: netrunnerX" http://localhost:3001/api/disasters
```

### Core Endpoints

#### Disasters
- `GET /api/disasters` - List all disasters
- `POST /api/disasters` - Create new disaster
- `GET /api/disasters/:id` - Get disaster details
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Delete disaster

#### Social Media
- `GET /api/disasters/:id/social-media` - Get social media posts
- `POST /api/disasters/:id/social-media/report` - Submit user report
- `GET /api/disasters/:id/social-media/priority` - Get priority posts

#### Resources
- `GET /api/disasters/:id/resources` - Get nearby resources
- `GET /api/disasters/:id/resources/types` - Get resource types

#### Official Updates
- `GET /api/disasters/:id/official-updates` - Get official updates
- `POST /api/disasters/:id/official-updates/refresh` - Refresh updates
- `GET /api/disasters/:id/official-updates/sources` - Get update sources

#### Image Verification
- `POST /api/disasters/:id/verify-image` - Verify single image
- `POST /api/disasters/:id/verify-image/batch` - Verify multiple images
- `GET /api/disasters/:id/verify-image/stats` - Get verification statistics

#### Geocoding
- `GET /api/geocode?address=<address>` - Geocode address to coordinates

### Real-time Events

The application uses Socket.io for real-time updates:

```javascript
// Client-side event listeners
socket.on('disaster_updated', (data) => {
  // Handle disaster updates
});

socket.on('social_media_updated', (data) => {
  // Handle social media updates
});

socket.on('resources_updated', (data) => {
  // Handle resource updates
});
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# OR
MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

### Database Configuration

The application uses Supabase (PostgreSQL) with the following tables:
- `disasters` - Main disaster records
- `reports` - User reports and social media data
- `resources` - Emergency resources
- `cache` - API response caching

See `backend/database_setup.sql` for the complete schema.

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm start
```

### Production

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

Quick production setup:
1. Configure environment variables for production
2. Build frontend: `npm run build`
3. Start backend with PM2: `pm2 start server.js`
4. Configure Nginx as reverse proxy
5. Set up SSL certificate

### Docker Deployment
```bash
docker-compose up -d
```

## 🧪 Testing

### Manual Testing
1. Start both frontend and backend
2. Open http://localhost:3000
3. Test disaster creation
4. Verify real-time updates
5. Test all major features

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# Test disasters endpoint
curl -H "x-user-id: netrunnerX" http://localhost:3001/api/disasters
```

## 🔧 Development

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`
2. **Frontend**: Add components in `frontend/src/components/`
3. **Database**: Update schema in `database_setup.sql`
4. **Documentation**: Update relevant documentation

### Code Style

- Use ESLint for code formatting
- Follow React best practices
- Use meaningful variable names
- Add comments for complex logic

### Performance Optimization

- Implement caching for API responses
- Use React.memo for expensive components
- Optimize database queries
- Enable gzip compression

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines

- Write clear commit messages
- Add tests for new features
- Update documentation
- Follow existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Configuration Guide](API_CONFIGURATION_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Testing Results](testing_results.md)

### Common Issues

1. **Database Connection**: Verify Supabase credentials
2. **API Errors**: Check API keys and rate limits
3. **Build Failures**: Clear node_modules and reinstall
4. **CORS Issues**: Verify backend CORS configuration

### Getting Help

1. Check the documentation
2. Review error logs
3. Test individual components
4. Verify environment configuration

---

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │   Supabase DB   │
│                 │◄──►│                 │◄──►│                 │
│  - UI Components│    │  - REST API     │    │  - PostgreSQL   │
│  - Socket.io    │    │  - Socket.io    │    │  - Real-time    │
│  - State Mgmt   │    │  - Middleware   │    │  - Geospatial   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  External APIs  │    │   Caching Layer │    │   File Storage  │
│                 │    │                 │    │                 │
│  - Google Maps  │    │  - Redis/Memory │    │  - Images       │
│  - Gemini AI    │    │  - API Responses│    │  - Documents    │
│  - Social Media │    │  - Query Cache  │    │  - Logs         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User Interaction**: User interacts with React frontend
2. **API Calls**: Frontend makes REST API calls to backend
3. **Authentication**: Middleware validates user permissions
4. **Business Logic**: Backend processes requests and applies business rules
5. **Database Operations**: Backend queries/updates Supabase database
6. **External APIs**: Backend calls external services (Maps, AI, etc.)
7. **Real-time Updates**: Socket.io broadcasts changes to all connected clients
8. **Response**: Data flows back through the chain to update the UI

---

*Built with ❤️ for emergency response teams and communities worldwide.*

