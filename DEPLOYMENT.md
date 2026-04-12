# 🚀 Vercel Deployment Guide

Complete guide to deploy GoldenFleece to Vercel.

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ GitHub account with repository: `rsturua/goldenfleece`
2. ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
3. ✅ Supabase project with credentials
4. ✅ WalletConnect Project ID (optional)

---

## 🎯 Deployment Steps

### Step 1: Prepare Environment Variables

You'll need these three environment variables for Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qyhxgswnrkkwfmukvmie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=4bc3426b9997d9b2fec5e74ac7416bdb
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Sign in with GitHub

2. **Import Repository**
   - Click "Import Git Repository"
   - Find `rsturua/goldenfleece`
   - Click "Import"

3. **Configure Project**
   - **Project Name**: `goldenfleece` (or your choice)
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Add Environment Variables**

   Click "Environment Variables" and add each one:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Your WalletConnect ID |

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Get your production URL! 🎉

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new? New
# - Project name? goldenfleece
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

# Deploy to production
vercel --prod
```

---

## 🔄 Automatic Deployments

Once connected, Vercel will automatically:

- ✅ Deploy every push to `main` branch
- ✅ Create preview deployments for pull requests
- ✅ Run builds with latest code
- ✅ Provide deployment URLs

---

## ✅ Post-Deployment Checklist

After deployment succeeds:

1. **Test the Site**
   - Visit your production URL
   - Test signup/login flow
   - Check dashboard access
   - Try wallet connection

2. **Verify Supabase Connection**
   - Should NOT see "⚠️ Supabase not configured" warnings
   - Authentication should work
   - User profiles should be created

3. **Check Build Logs**
   - No TypeScript errors
   - No build failures
   - All routes compiled successfully

---

## 🐛 Troubleshooting

### Build Fails with TypeScript Errors

**Problem**: `Type error: Type 'typeof import...'`

**Solution**: Ensure you have the latest code with Next.js 16 async params fixes:
```bash
git pull origin main
```

### Environment Variables Not Working

**Problem**: Supabase or WalletConnect not connecting

**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all three variables are set correctly
3. Redeploy the project

### Old Code Being Deployed

**Problem**: Vercel deploying old commits

**Solution**:
1. Check Vercel is connected to `rsturua/goldenfleece` (lowercase)
2. Go to Settings → Git → Verify repository URL
3. Manually trigger redeploy from Deployments tab

---

## 📊 Monitoring

### View Deployment Status

- **Dashboard**: https://vercel.com/rsturua/goldenfleece
- **Deployments**: See all builds and their status
- **Analytics**: View page views and performance

### Logs

- **Build Logs**: Click on any deployment to see full build output
- **Function Logs**: View API route execution logs
- **Error Tracking**: Automatic error detection

---

## 🔐 Security Best Practices

✅ **Never commit `.env.local`** - It's in `.gitignore`
✅ **Use Vercel's environment variables** - Encrypted at rest
✅ **Rotate keys regularly** - Update in Vercel dashboard
✅ **Use different keys** for development vs production

---

## 🎯 Production URL

After deployment, your site will be available at:

- **Production**: `https://goldenfleece.vercel.app`
- **Custom Domain**: Can be added in Vercel settings

---

## 📝 Quick Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Open project in browser
vercel open

# Rollback to previous deployment
vercel rollback

# Remove project
vercel remove goldenfleece
```

---

## ✨ Next Steps

1. **Custom Domain**: Add your domain in Vercel settings
2. **Analytics**: Enable Vercel Analytics for insights
3. **Edge Config**: Set up edge configuration if needed
4. **Team Access**: Invite team members to project

---

**Ready to deploy?** Follow Step 1 above and let's get your site live! 🚀
