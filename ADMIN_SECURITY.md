# Secure Admin Panel Documentation

## Overview
This project includes a highly secure admin panel with multiple layers of protection against unauthorized access and discovery.

## Security Features

### 1. Hidden Access Route
- Admin panel is NOT accessible through common routes like `/admin` or `/dashboard`
- Uses obscured route: `/admin-dashboard-secure` with token authentication
- URL structure is not discoverable through normal means

### 2. Honeypot Protection
The following routes trigger infinite redirect loops for unauthorized access:
- `/admin`, `/admin/`, `/admin-panel`, `/admin-panel/`
- `/dashboard`, `/dashboard/`, `/control`, `/control/`
- `/manage`, `/manage/`, `/backend`, `/backend/`
- `/cp`, `/cp/`, `/wp-admin`, `/wp-admin/`
- `/administrator`, `/administrator/`

### 3. Token-Based Authentication
- Secure token generation using crypto.randomBytes
- Tokens expire after 24 hours
- Session-based token storage on client
- API endpoints require valid admin tokens

### 4. Pattern Detection
- Monitors for suspicious request patterns
- Automatically redirects suspicious requests to honeypot
- Detects common attack vectors and admin panel discovery attempts

### 5. Environment Security
- Admin secret should be set via ADMIN_SECRET environment variable
- Fallback to generated random secret if not provided
- Secrets are never exposed in client-side code

## Access Instructions

### Setup
1. Set environment variable (recommended):
   ```bash
   export ADMIN_SECRET=your-secure-secret-here
   ```

2. Or use the generated secret from `.admin-secret` file

### Access Methods

#### Method 1: Direct URL Access
```
http://localhost:3000/admin-dashboard-secure?token=YOUR_ADMIN_SECRET
```

#### Method 2: API Authentication
1. First get an admin token:
   ```bash
   curl -X POST http://localhost:3000/api/admin/auth \
        -H "Content-Type: application/json" \
        -d '{"secret":"YOUR_ADMIN_SECRET"}'
   ```

2. Use the returned token for API calls:
   ```bash
   curl -H "X-Admin-Token: YOUR_TOKEN" \
        http://localhost:3000/api/admin/stats
   ```

## Admin Panel Features

### Dashboard Stats
- Total views across all videos
- Unique viewer count
- Trending video identification
- Engagement rate calculation
- Real-time updates every 30 seconds

### Charts & Visualization
- Views over time (last 24 hours)
- Video performance comparison
- Interactive charts using Chart.js

### Video Management
- Complete video statistics table
- Search and filter functionality
- Sort by views, likes, shares, engagement
- Individual video stat reset capability

### Activity Logging
- Real-time activity feed
- Admin action tracking
- Error logging
- Automatic log rotation (50 entries max)

### Security Monitoring
- Failed access attempt detection
- Suspicious pattern monitoring
- Automated honeypot redirection

## API Endpoints

### Admin Authentication
- `POST /api/admin/auth` - Generate admin token
- Headers: `Content-Type: application/json`
- Body: `{"secret": "ADMIN_SECRET"}`

### Admin Stats
- `GET /api/admin/stats` - Get dashboard statistics
- Headers: `X-Admin-Token: TOKEN`

### Video Management
- `POST /api/admin/videos/:id/reset` - Reset video statistics
- Headers: `X-Admin-Token: TOKEN`

## Security Best Practices

### For Production
1. **Use strong environment variables**:
   ```bash
   export ADMIN_SECRET=$(openssl rand -hex 32)
   ```

2. **Enable HTTPS**:
   - All admin routes should use HTTPS only
   - Set secure cookie flags

3. **IP Whitelisting**:
   - Restrict admin access to specific IP addresses
   - Use firewall rules or reverse proxy configuration

4. **Rate Limiting**:
   - Implement rate limiting on admin endpoints
   - Add CAPTCHA for repeated failed attempts

5. **Logging & Monitoring**:
   - Log all admin access attempts
   - Set up alerts for suspicious activity
   - Monitor honeypot trigger frequency

### Additional Security Measures
- Admin tokens automatically expire after 24 hours
- Session storage used (not localStorage) for better security
- URL tokens are immediately removed from browser history
- All admin API calls require authentication headers
- Failed authentication triggers honeypot redirection

## Troubleshooting

### Cannot Access Admin Panel
1. Verify the admin secret is correct
2. Check that the URL includes the token parameter
3. Ensure the server is running and accessible
4. Check browser console for authentication errors

### Honeypot Redirection
If you're being redirected in loops:
1. Clear browser cache and cookies
2. Ensure you're using the correct admin URL
3. Check that you're not accessing common admin routes
4. Verify your user agent string isn't suspicious

### API Authentication Failures
1. Verify admin token is valid and not expired
2. Check X-Admin-Token header is properly set
3. Ensure token was generated with correct secret
4. Generate new token if current one expired

## Warning
- Never share admin secrets or tokens
- Regularly rotate admin secrets in production
- Monitor access logs for security breaches
- Keep the admin panel URL confidential