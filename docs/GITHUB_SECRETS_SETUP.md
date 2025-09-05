# GitHub Actions Secrets Setup

This document outlines the required secrets for the Anamnesis MVP CI/CD pipeline.

## Required Secrets

Configure these secrets in your GitHub repository settings under **Settings → Secrets and variables → Actions**:

### 🔐 Supabase Configuration
- **SUPABASE_URL**: Your Supabase project URL
  - Format: `https://[project-id].supabase.co`
  - Get from: Supabase Dashboard → Settings → API

- **SUPABASE_ANON_KEY**: Your Supabase anonymous public key
  - Safe to use in frontend
  - Get from: Supabase Dashboard → Settings → API

- **SUPABASE_SERVICE_KEY**: Your Supabase service role key  
  - **🚨 KEEP SECRET**: Never expose in frontend
  - Used for server-side operations
  - Get from: Supabase Dashboard → Settings → API

### 🤖 AI Integration
- **DEEPSEEK_API_KEY**: DeepSeek AI API key
  - Used for AI chat functionality
  - Get from: DeepSeek platform dashboard

### 🚀 Deployment (Replit Native)
- **No additional deployment tokens required!** 
- The CI/CD pipeline validates your existing secrets and provides deployment-ready artifacts
- Your Replit environment will automatically serve the built application

## Setup Instructions

1. Go to your GitHub repository
2. Click **Settings** tab
3. Navigate to **Secrets and variables → Actions**
4. Click **New repository secret**
5. Add each secret with the exact name and value

## Security Notes

- Never commit these values to your repository
- Use different keys for staging/production environments
- Rotate keys regularly as a security best practice
- Verify all secrets are configured before triggering deployments

## Testing

After setup, trigger a deployment by pushing to the `main` or `develop` branch. Monitor the Actions tab for any missing secret errors.