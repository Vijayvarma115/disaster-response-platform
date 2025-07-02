# API Configuration Guide
## Disaster Response Coordination Platform

This guide provides step-by-step instructions for configuring all external APIs and services required for the Disaster Response Coordination Platform.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Database Setup](#supabase-database-setup)
3. [Google Gemini AI API](#google-gemini-ai-api)
4. [Google Maps API](#google-maps-api)
5. [Mapbox API (Alternative)](#mapbox-api-alternative)
6. [Environment Variables Configuration](#environment-variables-configuration)
7. [Database Schema Setup](#database-schema-setup)
8. [Testing Configuration](#testing-configuration)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- A Google Cloud Platform account
- A Supabase account
- Basic understanding of environment variables
- Access to the project files

---

## Supabase Database Setup

### Step 1: Create Supabase Project

1. **Sign up/Login to Supabase**
   - Go to [https://supabase.com](https://supabase.com)
   - Create an account or log in
   - Click "New Project"

2. **Create New Project**
   - Organization: Select or create an organization
   - Project Name: `disaster-response-platform`
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to your users
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 2-3 minutes
   - You'll see a dashboard when ready

### Step 2: Get Supabase Credentials

1. **Navigate to Settings**
   - In your project dashboard, click "Settings" (gear icon)
   - Click "API" in the left sidebar

2. **Copy Required Values**
   - **Project URL**: Copy the URL (starts with `https://`)
   - **Anon Public Key**: Copy the `anon` `public` key
   - **Service Role Key**: Copy the `service_role` `secret` key (for admin operations)

### Step 3: Configure Database Schema

1. **Open SQL Editor**
   - In Supabase dashboard, click "SQL Editor"
   - Click "New query"

2. **Run Database Setup**
   - Copy the entire contents of `backend/database_setup.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

3. **Verify Setup**
   - Go to "Table Editor"
   - You should see tables: `disasters`, `reports`, `resources`, `cache`
   - Sample data should be populated

---

## Google Gemini AI API

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" dropdown
   - Click "New Project"
   - Project name: `disaster-response-ai`
   - Click "Create"

### Step 2: Enable Gemini API

1. **Enable APIs**
   - Go to "APIs & Services" > "Library"
   - Search for "Generative Language API"
   - Click on it and click "Enable"

2. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key (starts with `AIza...`)
   - Click "Restrict Key" for security

3. **Restrict API Key (Recommended)**
   - API restrictions: Select "Restrict key"
   - Select "Generative Language API"
   - Click "Save"

---

## Google Maps API

### Step 1: Enable Maps APIs

1. **In Google Cloud Console**
   - Same project as Gemini API
   - Go to "APIs & Services" > "Library"

2. **Enable Required APIs**
   - Search and enable: "Maps JavaScript API"
   - Search and enable: "Geocoding API"
   - Search and enable: "Places API"

### Step 2: Create Maps API Key

1. **Create Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

2. **Restrict API Key**
   - Click "Restrict Key"
   - API restrictions: Select the Maps APIs you enabled
   - Application restrictions: Set based on your deployment
   - Click "Save"

---

## Mapbox API (Alternative)

If you prefer Mapbox over Google Maps:

### Step 1: Create Mapbox Account

1. **Sign up for Mapbox**
   - Go to [https://www.mapbox.com](https://www.mapbox.com)
   - Click "Sign up" and create account

2. **Get Access Token**
   - Go to your account dashboard
   - Copy the "Default public token"
   - Or create a new token with required scopes

### Step 2: Configure Scopes (if creating new token)

Required scopes for the application:
- `styles:read`
- `fonts:read`
- `datasets:read`
- `geocoding`

---

## Environment Variables Configuration

### Step 1: Backend Configuration

1. **Edit Backend .env File**
   - Open `backend/.env`
   - Replace placeholder values with your actual credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Gemini AI API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps API Configuration (Choose one)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Mapbox Configuration (Alternative to Google Maps)
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Mock Authentication Users (for development)
MOCK_USERS=netrunnerX,reliefAdmin
```

### Step 2: Frontend Configuration

1. **Edit Frontend .env File**
   - Open `frontend/.env`
   - Update API URLs if needed:

```env
# Frontend Environment Variables
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

### Step 3: Production Configuration

For production deployment:

1. **Backend Production .env**
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Gemini AI API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=production

# Authentication (implement proper auth in production)
JWT_SECRET=your_jwt_secret_here
```

2. **Frontend Production .env**
```env
# Frontend Environment Variables
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

---

## Database Schema Setup

The database schema is automatically created when you run the SQL script. Here's what gets created:

### Tables Created

1. **disasters** - Main disaster records
2. **reports** - User-submitted reports and social media data
3. **resources** - Emergency resources (shelters, medical, food, supplies)
4. **cache** - API response caching

### Sample Data

The script includes sample data for testing:
- 3 sample disasters in NYC area
- Sample resources (shelters, food banks)
- Sample reports from users

### Indexes and Performance

- Geospatial indexes for location-based queries
- GIN indexes for JSON and array columns
- Regular indexes for common query patterns

---

## Testing Configuration

### Step 1: Verify Database Connection

1. **Start the Backend**
   ```bash
   cd backend
   npm start
   ```

2. **Check Logs**
   - Look for "Server running on port 3001"
   - No database connection errors

### Step 2: Test API Endpoints

1. **Test Health Check**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"OK","timestamp":"..."}`

2. **Test Disasters Endpoint**
   ```bash
   curl -H "x-user-id: netrunnerX" http://localhost:3001/api/disasters
   ```
   Should return list of disasters

### Step 3: Test Frontend Integration

1. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

2. **Open Browser**
   - Go to `http://localhost:3000`
   - Should see disaster list (if database configured)
   - Try creating a new disaster

### Step 4: Test Real-time Features

1. **Open Multiple Browser Tabs**
   - Create a disaster in one tab
   - Should see real-time updates in other tabs

---

## Troubleshooting

### Common Issues

#### 1. "Failed to create disaster" Error

**Cause**: Database not configured or connection failed

**Solution**:
- Verify Supabase credentials in `.env`
- Check if database schema was created
- Verify network connectivity to Supabase

#### 2. "Error fetching disasters" Error

**Cause**: Backend not running or API endpoint issues

**Solution**:
- Ensure backend is running on port 3001
- Check backend logs for errors
- Verify CORS configuration

#### 3. Maps Not Loading

**Cause**: Invalid Google Maps API key

**Solution**:
- Verify API key is correct
- Check if Maps APIs are enabled in Google Cloud
- Verify API key restrictions

#### 4. AI Features Not Working

**Cause**: Invalid Gemini API key

**Solution**:
- Verify Gemini API key is correct
- Check if Generative Language API is enabled
- Verify API quotas and billing

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

### API Rate Limits

Be aware of rate limits:
- **Google Maps**: 40,000 requests/month (free tier)
- **Gemini AI**: Varies by model and usage
- **Supabase**: 50,000 requests/month (free tier)

### Security Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Restrict API keys to specific domains/IPs in production

2. **Database Security**
   - Enable Row Level Security (RLS) in production
   - Use service role key only for admin operations
   - Implement proper authentication

3. **CORS Configuration**
   - Restrict CORS to specific domains in production
   - Current configuration allows all origins (development only)

---

## Support

If you encounter issues:

1. **Check Logs**: Backend and frontend console logs
2. **Verify Configuration**: Double-check all API keys and URLs
3. **Test Individually**: Test each service separately
4. **Documentation**: Refer to official API documentation

### Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [Mapbox Documentation](https://docs.mapbox.com)

---

*This guide covers all external API configurations required for the Disaster Response Coordination Platform. Follow each section carefully and test thoroughly before deploying to production.*

