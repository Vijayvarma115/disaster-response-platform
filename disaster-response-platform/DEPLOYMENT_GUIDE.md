# Deployment Guide
## Disaster Response Coordination Platform

This guide provides comprehensive instructions for deploying the Disaster Response Coordination Platform to production environments.

## 📋 Table of Contents

1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Platform Deployment](#cloud-platform-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Database Migration](#database-migration)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Deployment Options

### 1. Local Development
- **Use Case**: Development and testing
- **Requirements**: Node.js, npm
- **Complexity**: Low

### 2. Traditional Server Deployment
- **Use Case**: Self-hosted production
- **Requirements**: Linux server, Node.js, PM2, Nginx
- **Complexity**: Medium

### 3. Docker Deployment
- **Use Case**: Containerized deployment
- **Requirements**: Docker, Docker Compose
- **Complexity**: Medium

### 4. Cloud Platform Deployment
- **Use Case**: Scalable cloud deployment
- **Options**: Vercel, Netlify, Heroku, AWS, Google Cloud
- **Complexity**: Low to High

---

## Prerequisites

### System Requirements

**Minimum Requirements:**
- Node.js 18.0 or higher
- npm 8.0 or higher
- 2GB RAM
- 10GB disk space

**Recommended Requirements:**
- Node.js 20.0 or higher
- npm 10.0 or higher
- 4GB RAM
- 20GB disk space
- SSD storage

### External Services

Before deployment, ensure you have:
- ✅ Supabase project configured
- ✅ Google Gemini AI API key
- ✅ Google Maps API key (or Mapbox)
- ✅ Domain name (for production)
- ✅ SSL certificate (for production)

---

## Local Development Setup

### Step 1: Clone and Install

```bash
# Extract the project files
cd disaster-response-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

1. **Backend Configuration**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys (see API_CONFIGURATION_GUIDE.md)
   ```

2. **Frontend Configuration**
   ```bash
   cd frontend
   # .env is already configured for local development
   ```

### Step 3: Start Development Servers

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   # Server runs on http://localhost:3001
   ```

2. **Start Frontend** (in new terminal)
   ```bash
   cd frontend
   npm start
   # App runs on http://localhost:3000
   ```

### Step 4: Verify Setup

- Open `http://localhost:3000`
- Check that both frontend and backend are running
- Test creating a disaster report
- Verify real-time features work

---

## Production Deployment

### Option 1: Traditional Server Deployment

#### Step 1: Server Setup

1. **Prepare Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx for reverse proxy
   sudo apt install nginx -y
   ```

2. **Create Application User**
   ```bash
   sudo adduser --system --group --home /opt/disaster-response disaster-response
   sudo mkdir -p /opt/disaster-response
   sudo chown disaster-response:disaster-response /opt/disaster-response
   ```

#### Step 2: Deploy Application

1. **Upload Files**
   ```bash
   # Copy project files to server
   scp -r disaster-response-platform user@your-server:/opt/disaster-response/
   ```

2. **Install Dependencies**
   ```bash
   sudo su - disaster-response
   cd /opt/disaster-response/disaster-response-platform
   
   # Install backend dependencies
   cd backend
   npm ci --production
   
   # Build and install frontend
   cd ../frontend
   npm ci
   npm run build
   ```

#### Step 3: Configure Environment

1. **Backend Environment**
   ```bash
   cd /opt/disaster-response/disaster-response-platform/backend
   cp .env.example .env
   # Edit .env with production values
   nano .env
   ```

2. **Production Environment Variables**
   ```env
   # Production Backend .env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_production_anon_key
   GEMINI_API_KEY=your_production_gemini_key
   GOOGLE_MAPS_API_KEY=your_production_maps_key
   PORT=3001
   NODE_ENV=production
   ```

#### Step 4: Configure PM2

1. **Create PM2 Configuration**
   ```bash
   cd /opt/disaster-response/disaster-response-platform
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'disaster-response-backend',
       script: './backend/server.js',
       cwd: '/opt/disaster-response/disaster-response-platform',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       },
       error_file: '/var/log/disaster-response/error.log',
       out_file: '/var/log/disaster-response/out.log',
       log_file: '/var/log/disaster-response/combined.log',
       time: true
     }]
   };
   EOF
   ```

2. **Start Application**
   ```bash
   # Create log directory
   sudo mkdir -p /var/log/disaster-response
   sudo chown disaster-response:disaster-response /var/log/disaster-response
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

#### Step 5: Configure Nginx

1. **Create Nginx Configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/disaster-response
   ```

2. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       # Frontend (React build)
       location / {
           root /opt/disaster-response/disaster-response-platform/frontend/build;
           index index.html index.htm;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Socket.io
       location /socket.io/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/disaster-response /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Step 6: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Docker Deployment

### Step 1: Create Dockerfiles

1. **Backend Dockerfile**
   ```dockerfile
   # backend/Dockerfile
   FROM node:20-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --production
   
   COPY . .
   
   EXPOSE 3001
   
   USER node
   
   CMD ["npm", "start"]
   ```

2. **Frontend Dockerfile**
   ```dockerfile
   # frontend/Dockerfile
   FROM node:20-alpine as build
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci
   
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   
   EXPOSE 80
   
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Frontend Nginx Config**
   ```nginx
   # frontend/nginx.conf
   events {
       worker_connections 1024;
   }
   
   http {
       include /etc/nginx/mime.types;
       default_type application/octet-stream;
       
       server {
           listen 80;
           server_name localhost;
           
           location / {
               root /usr/share/nginx/html;
               index index.html index.htm;
               try_files $uri $uri/ /index.html;
           }
       }
   }
   ```

### Step 2: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
    restart: unless-stopped
    
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

### Step 3: Deploy with Docker

```bash
# Create environment file
cp .env.example .env
# Edit .env with production values

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Cloud Platform Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel

1. **Prepare Frontend**
   ```bash
   cd frontend
   # Update .env for production
   echo "REACT_APP_API_URL=https://your-backend.railway.app/api" > .env.production
   echo "REACT_APP_SOCKET_URL=https://your-backend.railway.app" >> .env.production
   ```

2. **Deploy to Vercel**
   - Connect GitHub repository to Vercel
   - Set build command: `npm run build`
   - Set output directory: `build`
   - Add environment variables in Vercel dashboard

#### Backend on Railway

1. **Prepare Backend**
   - Push code to GitHub
   - Connect repository to Railway

2. **Configure Railway**
   - Add environment variables in Railway dashboard
   - Set start command: `npm start`
   - Configure custom domain

### Option 2: AWS Deployment

#### Using AWS Amplify (Frontend) + Elastic Beanstalk (Backend)

1. **Frontend on Amplify**
   - Connect GitHub repository
   - Configure build settings
   - Add environment variables

2. **Backend on Elastic Beanstalk**
   - Create application
   - Upload deployment package
   - Configure environment variables

---

## Environment Configuration

### Production Environment Variables

#### Backend (.env)
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key

# AI Services
GEMINI_API_KEY=your_production_gemini_key

# Maps
GOOGLE_MAPS_API_KEY=your_production_maps_key

# Server
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

---

## Database Migration

### Initial Setup

1. **Run Database Schema**
   - Execute `backend/database_setup.sql` in Supabase SQL Editor
   - Verify all tables are created
   - Check sample data is inserted

### Production Considerations

1. **Backup Strategy**
   - Enable automated backups in Supabase
   - Regular manual backups before updates

2. **Performance Optimization**
   - Monitor query performance
   - Add indexes as needed
   - Configure connection pooling

---

## Monitoring and Maintenance

### Health Checks

1. **Application Health**
   ```bash
   # Check backend health
   curl https://your-domain.com/api/health
   
   # Check frontend
   curl https://your-domain.com
   ```

2. **Database Health**
   - Monitor Supabase dashboard
   - Check connection counts
   - Monitor query performance

### Logging

1. **Backend Logs**
   - PM2 logs: `pm2 logs`
   - Application logs in `/var/log/disaster-response/`

2. **Frontend Logs**
   - Browser console for client-side errors
   - Nginx access logs: `/var/log/nginx/access.log`

### Performance Monitoring

1. **Metrics to Monitor**
   - Response times
   - Error rates
   - Database query performance
   - Memory and CPU usage

2. **Tools**
   - PM2 monitoring
   - Nginx status module
   - Supabase dashboard
   - Google Cloud Console (for APIs)

### Updates and Maintenance

1. **Application Updates**
   ```bash
   # Pull latest code
   git pull origin main
   
   # Update dependencies
   npm ci --production
   
   # Rebuild frontend
   cd frontend && npm run build
   
   # Restart backend
   pm2 restart disaster-response-backend
   ```

2. **Security Updates**
   - Regular dependency updates
   - Security patches for OS
   - SSL certificate renewal

---

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Symptoms**: PM2 shows app as errored
**Solutions**:
- Check logs: `pm2 logs`
- Verify environment variables
- Check port availability
- Verify file permissions

#### 2. Database Connection Issues

**Symptoms**: "Database connection failed" errors
**Solutions**:
- Verify Supabase credentials
- Check network connectivity
- Verify database schema exists

#### 3. Frontend Not Loading

**Symptoms**: Blank page or 404 errors
**Solutions**:
- Check Nginx configuration
- Verify build files exist
- Check browser console for errors

#### 4. API Calls Failing

**Symptoms**: Network errors in frontend
**Solutions**:
- Verify backend is running
- Check CORS configuration
- Verify API endpoints

### Debug Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs disaster-response-backend

# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Check port usage
sudo netstat -tlnp | grep :3001

# Check disk space
df -h

# Check memory usage
free -h
```

### Performance Optimization

1. **Backend Optimization**
   - Enable gzip compression
   - Implement caching
   - Optimize database queries
   - Use connection pooling

2. **Frontend Optimization**
   - Enable Nginx gzip
   - Set proper cache headers
   - Optimize images
   - Use CDN for static assets

---

## Security Checklist

### Pre-Deployment Security

- [ ] Environment variables secured
- [ ] API keys restricted to domains
- [ ] Database RLS policies configured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented

### Post-Deployment Security

- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup verification
- [ ] SSL certificate monitoring
- [ ] API usage monitoring

---

*This deployment guide covers multiple deployment scenarios for the Disaster Response Coordination Platform. Choose the option that best fits your infrastructure and requirements.*

