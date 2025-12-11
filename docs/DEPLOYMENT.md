# Deployment Guide

## Backend Deployment

### Render.com (Free Tier)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. New → Web Service
4. Connect GitHub repository
5. Settings:
   - **Name:** baseball-stats-api
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
6. Add Environment Variables:
   - `JWT_SECRET`: your-secret-key
   - `NODE_ENV`: production
7. Click "Create Web Service"

### Railway.app
```bash
cd backend
railway login
railway init
railway add
railway up
```

Set environment variables in Railway dashboard.

### Traditional VPS (DigitalOcean, Linode)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone YOUR_REPO
cd baseball-stats-tracker/backend
npm install

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name baseball-stats-api
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt install nginx
# Configure nginx to proxy to localhost:3001
```

## Frontend Deployment

### Vercel (Recommended)
```bash
cd frontend
npm install -g vercel
vercel login
vercel

# For production
vercel --prod
```

Environment variables:
- `VITE_API_URL`: Your backend URL

### Netlify
```bash
cd frontend
npm run build

# Install Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy

# For production
netlify deploy --prod
```

Create `frontend/netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.com/api/:splat"
  status = 200
```

### GitHub Pages
```bash
cd frontend
npm run build

# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d dist"

npm run deploy
```

Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/baseball-stats-tracker/',
  // ... rest of config
})
```

## Database Considerations

### Production Database

For production, consider upgrading from SQLite:

**PostgreSQL:**
- Render.com offers free PostgreSQL
- Railway.app offers PostgreSQL add-on

**MySQL:**
- Available on most hosting providers

Update connection in `server.js` accordingly.

## Environment Variables

### Backend (.env)
```env
PORT=3001
JWT_SECRET=your-super-secret-key-min-32-characters
NODE_ENV=production
DATABASE_URL=your-database-url (if using PostgreSQL)
```

### Frontend
```env
VITE_API_URL=https://your-backend-url.com
```

## SSL/HTTPS

Most platforms (Render, Vercel, Netlify) provide automatic SSL.

For VPS, use Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Monitoring

- Use PM2 for process management
- Setup error logging
- Monitor API performance
- Regular database backups

## Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Regular security updates

## Performance

- Enable compression
- Setup CDN for static files
- Database indexing
- Caching strategies
- Image optimization

## Backup Strategy
```bash
# Backup SQLite database
cp baseball_stats.db backup_$(date +%Y%m%d).db

# Automated daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Backend not starting
- Check environment variables
- Verify Node.js version
- Check port availability
- Review error logs

### Frontend API errors
- Verify API URL
- Check CORS settings
- Test backend directly
- Review network tab

### Database issues
- Check file permissions
- Verify disk space
- Test database connectivity
- Review schema