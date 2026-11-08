# Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the Global Edutech Landing Page to Vercel.

## Prerequisites

- A GitHub, GitLab, or Bitbucket account with your project repository
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- All required environment variables as listed in `ENV_VARIABLES.md`

## Deployment Steps

### 1. Connect Your Repository to Vercel

1. Log in to your Vercel account at [vercel.com](https://vercel.com)
2. Click on "Add New..." > "Project"
3. Import your repository from GitHub, GitLab, or Bitbucket
4. Select the "global-edutech-landing-page" repository

### 2. Configure Project Settings

#### Basic Configuration

- **Framework Preset**: Next.js
- **Root Directory**: ./
- **Build Command**: `npm run build`
- **Output Directory**: .next
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

#### Environment Variables

Add all required environment variables as listed in `ENV_VARIABLES.md`, including:

- `MONGODB_URI`: Your MongoDB connection string
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port
- `GMAIL_USER`: Email address for sending notifications
- `GMAIL_APP_PASSWORD`: App password for Gmail
- `CONTACT_RECEIVER_EMAIL`: Email address to receive notifications
- `JWT_SECRET`: Secret key for JWT tokens (optional but recommended)
- `ADMIN_USERNAME`: Custom admin username (optional)
- `ADMIN_PASSWORD`: Custom admin password (optional)

### 3. Deploy Your Project

1. Click "Deploy" to start the deployment process
2. Vercel will build and deploy your project
3. Once deployment is complete, you'll receive a deployment URL (e.g., `https://global-edutech-landing-page.vercel.app`)

### 4. Verify the Deployment

1. Visit your deployment URL
2. Check that the landing page loads correctly
3. Test form submissions
4. Verify admin dashboard access at `/admin/login`

## Custom Domain Setup

### 1. Add a Custom Domain

1. From your project dashboard, go to "Settings" > "Domains"
2. Click "Add" and enter your domain name (e.g., `globaledutech.com`)
3. Choose between:
   - Buying a domain through Vercel
   - Using a domain you already own

### 2. Configure DNS Settings

If using an existing domain:

1. Vercel will provide you with DNS configuration instructions
2. Update your DNS settings at your domain registrar with the provided values
3. Typically, you'll need to add:
   - An A record pointing to Vercel's IP
   - A CNAME record for the `www` subdomain

### 3. Verify Domain and Enable HTTPS

1. Once DNS changes propagate, Vercel will verify your domain
2. HTTPS will be automatically enabled with a Let's Encrypt certificate
3. Verify that your site is accessible via both:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

## Continuous Deployment

Vercel automatically sets up continuous deployment:

1. Any push to your main/master branch will trigger a new production deployment
2. Pull/Merge requests create preview deployments for testing changes before merging

## Database Initialization

After your first deployment, you need to initialize the database:

1. Go to the Vercel dashboard > "Deployments" tab
2. Click on the "..." menu for your latest deployment
3. Select "Redeploy with Database Initialization"
   - This will run the `npm run init-db` command once

Alternatively, you can run a one-time database initialization manually:

1. Install the Vercel CLI: `npm install -g vercel`
2. Login to Vercel: `vercel login`
3. Run: `vercel env pull .env.local` to get your environment variables
4. Run: `npm run init-db` to initialize the database
5. After initialization is complete, you can remove `.env.local` if you don't need it locally

## Monitoring and Logs

### Deployment Logs

1. In the Vercel dashboard, go to your project
2. Click on a specific deployment
3. Select the "Logs" tab to view build and runtime logs

### Function Logs

1. Go to your project in the Vercel dashboard
2. Select "Functions" from the left sidebar
3. Click on specific functions to view detailed logs
4. This is useful for debugging API routes and server components

## Troubleshooting Common Issues

### Build Failures

1. Check build logs for specific errors
2. Ensure all dependencies are correctly listed in `package.json`
3. Verify that you're using compatible Node.js versions
4. Check for any environment variables that might be missing

### Database Connection Issues

1. Verify your MongoDB connection string in environment variables
2. Ensure your MongoDB Atlas cluster is running and accessible
3. Check if your IP address is whitelisted in MongoDB Atlas
4. Test database connection locally before deploying

### Blank Page or 404 Errors

1. Verify your build output directory is set to `.next`
2. Check if the issue occurs in preview deployments or just production
3. Look for JavaScript errors in your browser console
4. Ensure all routes are properly configured

## Performance Optimization

For optimal performance on Vercel:

1. Enable Vercel Analytics to monitor site performance
2. Use Vercel Edge Functions for globally distributed API routes
3. Configure Vercel Image Optimization for better image loading
4. Add caching headers for static assets

## Recommended Vercel Integrations

1. **Vercel Analytics**: For performance monitoring
2. **Checkly**: For uptime monitoring and synthetic testing
3. **LogDNA** or **Datadog**: For centralized logging
4. **Sentry**: For error tracking

## Support and Resources

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Vercel Status Page: [vercel.statuspage.io](https://vercel.statuspage.io)
