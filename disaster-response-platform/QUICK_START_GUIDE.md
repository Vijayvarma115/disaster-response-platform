# 🚀 Quick Start Guide
## Disaster Response Coordination Platform

This guide will get you up and running with the Disaster Response Coordination Platform in under 10 minutes.

## 📋 What You Need

Before starting, make sure you have:
- ✅ Node.js 18+ installed ([Download here](https://nodejs.org/))
- ✅ A Supabase account ([Sign up here](https://supabase.com))
- ✅ A Google Cloud account ([Sign up here](https://cloud.google.com))

## 🎯 5-Minute Setup

### Step 1: Extract and Install (2 minutes)

```bash
# Extract the project
unzip disaster-response-platform.zip
cd disaster-response-platform

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Configure APIs (3 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) → New Project
   - Copy your Project URL and API Key

2. **Get Google AI API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create API key for Gemini

3. **Configure Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your keys:
   # SUPABASE_URL=https://your-project.supabase.co
   # SUPABASE_ANON_KEY=your_key_here
   # GEMINI_API_KEY=your_gemini_key_here
   ```

4. **Setup Database**
   - In Supabase dashboard → SQL Editor
   - Copy & paste contents of `backend/database_setup.sql`
   - Click "Run"

### Step 3: Start the Application (30 seconds)

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend
cd frontend
npm start
```

**🎉 Done!** Open http://localhost:3000

## 🧪 Test It Works

1. **Check Connection**: You should see "Connected: Online" at the bottom
2. **Create Disaster**: Click "Create Disaster" tab and fill out the form
3. **Test Real-time**: Open another browser tab - changes should sync instantly

## 🔧 If Something Goes Wrong

### Backend Won't Start
- Check if Node.js is installed: `node --version`
- Verify .env file has correct Supabase credentials
- Check port 3001 isn't in use: `lsof -i :3001`

### Frontend Shows Errors
- Check backend is running on port 3001
- Look for errors in browser console (F12)
- Verify npm install completed successfully

### Database Errors
- Verify Supabase project is active
- Check if SQL script ran successfully
- Confirm API keys are correct

## 📚 Next Steps

Once everything is working:

1. **Read the Documentation**
   - `README.md` - Complete overview
   - `API_CONFIGURATION_GUIDE.md` - Detailed API setup
   - `DEPLOYMENT_GUIDE.md` - Production deployment

2. **Configure Additional Features**
   - Google Maps API for mapping features
   - Mapbox as alternative to Google Maps
   - Production environment variables

3. **Deploy to Production**
   - Follow the deployment guide
   - Configure SSL certificates
   - Set up monitoring

## 🆘 Need Help?

1. **Check the logs**: Backend terminal shows detailed error messages
2. **Browser console**: Press F12 to see frontend errors
3. **Documentation**: All guides are in the project folder
4. **Test individually**: Start backend first, then frontend

## 🎯 Key Features to Try

- **Create Disasters**: Test the disaster creation form
- **Real-time Updates**: Open multiple browser tabs
- **User Switching**: Try different user roles from the dropdown
- **Social Media**: Submit reports and see them appear
- **Image Verification**: Upload images for AI verification

---

**🚨 Important**: This is a development setup. For production use, follow the deployment guide and configure proper security measures.

**💡 Tip**: Keep both terminal windows open to see real-time logs from backend and frontend.

---

*Need more help? Check the comprehensive documentation in the project folder!*

