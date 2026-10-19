# Global Edutech Landing Page - Project Handover Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Environment Setup](#environment-setup)
4. [Database Requirements](#database-requirements)
5. [Deployment Guide](#deployment-guide)
6. [Admin Dashboard](#admin-dashboard)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Contact](#contact)

## Project Overview

Global Edutech Landing Page is a modern, responsive web application built with Next.js, designed to showcase educational programs and collect inquiries from prospective students. The application features:

- Public-facing landing page with course information
- Contact forms for general and program-specific inquiries
- Admin dashboard for managing form submissions
- Email notifications for new inquiries
- Excel export functionality for data analysis

The project has transitioned from a static HTML/CSS/JS website to a full-stack Next.js application with MongoDB integration.

## Tech Stack

### Frontend

- **React 18**: UI library
- **Next.js 14**: React framework for server-side rendering and API routes
- **TailwindCSS 3.3**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Swiper**: Carousel/slider component
- **React Hook Form**: Form validation and submission

### Backend

- **Next.js API Routes**: Backend API endpoints
- **MongoDB**: NoSQL database for storing form submissions
- **Nodemailer**: Email service for sending notifications
- **ExcelJS**: Excel file generation for data export
- **Jose**: JWT library for authentication

### Development Tools

- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Environment Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- MongoDB Atlas account (or local MongoDB instance)
- SMTP email provider (Gmail recommended)

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/globaledutech?retryWrites=true&w=majority

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
CONTACT_RECEIVER_EMAIL=recipient@example.com

# Optional: Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/chefgs/global-edutech-landing-page.git
   cd global-edutech-landing-page
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Initialize the database

   ```bash
   npm run init-db
   ```

4. Start the development server

   ```bash
   npm run dev
   ```

## Database Requirements

### MongoDB Setup

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is sufficient for initial setup)
3. Create a database user with read/write permissions
4. Add your IP address to the IP Access List
5. Get your connection string from the "Connect" button
6. Replace `<username>`, `<password>`, and `<cluster>` in the connection string with your credentials

### Database Structure

The application uses a single database called `globaledutech` with the following collection:

- `globaledutech-enquiry`: Stores all form submissions with schema validation

The schema includes the following fields:

- `name`: Student/parent name (required)
- `email`: Contact email (required, validated format)
- `phone`: Contact phone number (required)
- `message`: Inquiry message (required)
- `program`: Selected program or "General Enquiry" (required)
- `studentAge`: Age range of student (optional)
- `preferredTime`: Preferred contact time (optional)
- `formType`: Type of form submitted - "General Enquiry" or "Program Enquiry" (required)
- `createdAt`: Timestamp of submission (auto-generated)
- `status`: Current status of the inquiry (defaults to "New")

### Database Initialization

Run the database initialization script to set up the collection, validation rules, and indexes:

```bash
npm run init-db
```

This script will:

1. Create the required collection if it doesn't exist
2. Set up schema validation
3. Create indexes for better query performance
4. Add a sample submission for testing

## Deployment Guide

### Vercel Deployment (Recommended)

1. Create a Vercel account at [https://vercel.com](https://vercel.com)
2. Install the Vercel CLI:

   ```bash
   npm install -g vercel
   ```

3. Login to Vercel:

   ```bash
   vercel login
   ```

4. Deploy the project:

   ```bash
   vercel
   ```

5. For production deployment:

   ```bash
   vercel --prod
   ```

### Vercel Configuration

1. In the Vercel dashboard, navigate to your project
2. Go to "Settings" > "Environment Variables"
3. Add all the environment variables listed in the [Environment Variables](#environment-variables) section
4. Under "Build & Development Settings":
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Development Command: `npm run dev`

### Custom Domain Setup

1. In the Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Follow the instructions to configure DNS settings
4. Enable HTTPS with automatic SSL certificate

## Admin Dashboard

### Admin Authentication

The admin dashboard is protected with a simple JWT-based authentication system:

- **Username**: admin
- **Password**: globaledutech-admin

For production, you should change these credentials in the `lib/auth.ts` file or ideally move them to environment variables.

### Admin Features

1. **Dashboard Access**: `/admin/login`
2. **Submission Management**: View all form submissions
3. **Status Tracking**: Update the status of each inquiry
4. **Filtering**: Filter submissions by status
5. **Sorting**: Sort by various fields (name, email, date, etc.)
6. **Export**: Download all submissions as an Excel file

### Security Considerations

1. The admin credentials are currently hardcoded and should be moved to environment variables or a secure database for production
2. The JWT secret key should be changed and moved to an environment variable
3. Consider implementing rate limiting on the login endpoint to prevent brute force attacks

## Maintenance

### Regular Tasks

1. **Database Backup**: Set up regular backups of your MongoDB database
2. **Dependency Updates**: Regularly update npm packages for security fixes

   ```bash
   npm update
   ```

3. **Monitor Error Logs**: Check Vercel logs for any application errors

### Content Updates

1. **Course Information**: Update the course data in `lib/courses-data.ts`
2. **Landing Page Content**: Modify text and images in the React components
3. **Contact Information**: Update email and phone details in the footer component

### Performance Monitoring

1. Use Vercel Analytics to monitor page performance
2. Check MongoDB Atlas metrics for database performance
3. Test the site regularly on different devices and browsers

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**:
   - Check if your IP is whitelisted in MongoDB Atlas
   - Verify the connection string in environment variables
   - Ensure the database user has correct permissions

2. **Email Sending Failures**:
   - Check SMTP credentials
   - For Gmail, ensure "Less secure apps" is enabled or use App Password
   - Verify email service provider limits

3. **Admin Login Issues**:
   - Clear browser cookies
   - Check for JWT expiration (currently set to 24 hours)
   - Verify admin credentials in `lib/auth.ts`

4. **Form Submission Errors**:
   - Check browser console for frontend errors
   - Verify API route functionality
   - Check MongoDB connection

### Debugging

1. Enable development logs by setting `NODE_ENV=development`
2. Check browser console for frontend errors
3. Review Vercel deployment logs
4. Examine MongoDB Atlas logs for database issues

## Contact

For technical support or questions about this project, please contact:

- **Developer**: Global Edutech Development Team
- **Email**: dev@globaledutech.com
- **GitHub Repository**: [https://github.com/chefgs/global-edutech-landing-page](https://github.com/chefgs/global-edutech-landing-page)

---

© 2025 Global Edutech Academy. All rights reserved.
