# Environment Variables Guide

This document provides detailed information about the environment variables required for the Global Edutech Landing Page project.

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

### MongoDB Configuration

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/globaledutech?retryWrites=true&w=majority
```

- **Purpose**: Connects the application to your MongoDB Atlas database
- **Format**: MongoDB connection string URI
- **Example**: `mongodb+srv://edutech-admin:p@ssw0rd@cluster0.abc123.mongodb.net/globaledutech?retryWrites=true&w=majority`
- **How to obtain**: 
  1. Create a MongoDB Atlas account
  2. Set up a cluster
  3. Create a database user
  4. Get the connection string from the Connect dialog
  5. Replace placeholders with your actual credentials

### Email Configuration

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
CONTACT_RECEIVER_EMAIL=recipient@example.com
```

- **SMTP_HOST**: SMTP server address (default: smtp.gmail.com for Gmail)
- **SMTP_PORT**: SMTP server port (465 for Gmail with SSL)
- **GMAIL_USER**: Email address used to send notifications
- **GMAIL_APP_PASSWORD**: App password for Gmail (not your regular Gmail password)
  - To generate an app password:
    1. Enable 2-Factor Authentication on your Google account
    2. Go to Google Account > Security > App passwords
    3. Generate a new app password for "Mail" and "Other"
- **CONTACT_RECEIVER_EMAIL**: Email address that will receive form submission notifications

### JWT Authentication (Optional but Recommended for Production)

```
JWT_SECRET=your-very-long-random-secret-key
ADMIN_USERNAME=custom-admin-username
ADMIN_PASSWORD=secure-admin-password
```

- **JWT_SECRET**: Secret key for signing JWT tokens (should be at least 32 characters)
- **ADMIN_USERNAME**: Custom username for admin login (overrides the hardcoded "admin")
- **ADMIN_PASSWORD**: Custom password for admin login (overrides the hardcoded "globaledutech-admin")

### Google Maps API (Optional)

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

- **Purpose**: Enables Google Maps integration in the contact section
- **How to obtain**:
  1. Create a project in Google Cloud Console
  2. Enable the Maps JavaScript API
  3. Create an API key with appropriate restrictions

## Development vs Production Environment

### Development

For local development, create a `.env.local` file with the variables above. This file is automatically loaded by Next.js in development mode.

### Production (Vercel)

For production deployment on Vercel:

1. Go to the Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable individually or import from a .env file
4. Ensure that variables are set for the Production environment
5. Deploy or redeploy your application

## Environment Variable Security

Follow these best practices to keep your environment variables secure:

1. Never commit `.env.local` or any file containing secrets to version control
2. Use different credentials for development and production environments
3. Regularly rotate sensitive credentials like database passwords and API keys
4. Apply appropriate IP restrictions to API keys where possible
5. For MongoDB Atlas, restrict database access to specific IP addresses
6. Consider using Vercel's integration with environment variable management services like Doppler or Env0 for larger teams

## Troubleshooting

If you encounter issues related to environment variables:

1. Verify that all required variables are correctly set
2. Check for typos in variable names or values
3. Ensure that the MongoDB connection string is correctly formatted
4. For Vercel deployments, check if the variables are set for the correct environment (Production/Preview/Development)
5. After changing environment variables in Vercel, redeploy your application

## Local Testing with Production Variables

To test your application locally with production environment variables:

1. Create a `.env.production.local` file with your production variables
2. Run the application in production mode:

   ```bash
   npm run build
   npm run start
   ```

This will simulate the production environment on your local machine.
