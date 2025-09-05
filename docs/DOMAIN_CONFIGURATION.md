# Anamnesis MVP - Domain Configuration Guide

## 🌐 Domain Structure

### Production Domains
- **MVP Application**: `mvp.anamnesis.health`
- **API Endpoints**: `api.anamnesis.health`

### Staging Domains  
- **MVP Staging**: `staging.anamnesis.health`
- **API Staging**: `api.anamnesis.health` (with staging traffic routing)

## 🔧 Replit Deployment Setup

### DNS Configuration Required

Add these DNS records to your domain registrar:

#### For `mvp.anamnesis.health` (Production)
```
Type: A
Name: mvp
Value: [Replit Production IP]
```

#### For `staging.anamnesis.health` (Staging)
```
Type: A  
Name: staging
Value: [Replit Staging IP]
```

#### For `api.anamnesis.health` (API)
```
Type: A
Name: api
Value: [Replit API IP]
```

### SSL/TLS Certificates
- ✅ **Auto-configured by Replit**
- ✅ **HTTPS enforcement enabled**
- ✅ **TLS 1.2+ required**

## 🚀 Deployment Process

### Staging Deployment (`develop` branch)
1. **Target**: `staging.anamnesis.health`
2. **API**: `api.anamnesis.health` (staging traffic)
3. **Features Validated**:
   - Authentication system
   - AI chat streaming
   - Legal framework (/legal)
   - Admin dashboard integration

### Production Deployment (`main` branch)  
1. **Target**: `mvp.anamnesis.health`
2. **API**: `api.anamnesis.health` (production traffic)
3. **Full Feature Set**:
   - Complete authentication
   - AI streaming with instant abort
   - Legal compliance framework
   - Enterprise admin monitoring

## 🔒 Security Configuration

### HTTPS Enforcement
- All domains redirect HTTP → HTTPS
- HSTS headers enabled
- Secure cookie settings

### CORS Policy
```javascript
// Production: mvp.anamnesis.health
// Staging: staging.anamnesis.health  
// API: api.anamnesis.health
```

### Rate Limiting
- API endpoints: 20 requests/minute
- Authentication: 10 attempts/minute
- WebSocket: 5 concurrent connections

## 📋 Validation Checklist

### Domain Accessibility
- [ ] `mvp.anamnesis.health` responds with 200
- [ ] `staging.anamnesis.health` responds with 200
- [ ] `api.anamnesis.health/system/status` responds with 200

### SSL/HTTPS  
- [ ] All domains force HTTPS redirect
- [ ] SSL certificates valid and trusted
- [ ] HSTS headers present

### Core Features
- [ ] Authentication flow functional
- [ ] AI chat streaming operational  
- [ ] Stop AI function (<1s response)
- [ ] Legal pages accessible at /legal
- [ ] Admin dashboard monitoring active

## 🎯 Next Steps

1. **Configure DNS records** at your domain registrar
2. **Link domains** in Replit Deployment settings
3. **Test staging** deployment with `develop` branch
4. **Deploy production** with `main` branch
5. **Validate all features** across both environments

**DNS Propagation**: Allow up to 48 hours for full global propagation.