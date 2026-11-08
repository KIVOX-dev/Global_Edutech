# Developer Quick Start Guide

This guide helps new developers get started with the Global Edutech Landing Page project quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or later)
- npm (v9 or later)
- Git
- Visual Studio Code (recommended) or your preferred editor

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/chefgs/global-edutech-landing-page.git
cd global-edutech-landing-page
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# MongoDB - Replace with development database URI
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/globaledutech?retryWrites=true&w=majority

# Email - For testing, you can use a test email account
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
CONTACT_RECEIVER_EMAIL=recipient@example.com
```

For detailed environment variable information, see [ENV_VARIABLES.md](ENV_VARIABLES.md).

### 3. Install Dependencies

```bash
npm install
```

### 4. Initialize the Database

```bash
npm run init-db
```

This script creates the necessary collection, indexes, and adds a sample submission for testing.

### 5. Start the Development Server

```bash
npm run dev
```

The site will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure Overview

### Key Directories

- `app/`: Next.js app directory (pages, layouts, and API routes)
- `components/`: Reusable React components
- `lib/`: Utility functions, data, and services
- `public/`: Static assets (images, fonts, etc.)
- `scripts/`: Database scripts and utilities

### Important Files

- `app/page.tsx`: Main landing page
- `app/courses/[slug]/page.tsx`: Individual course pages
- `app/api/submit-form/route.ts`: Form submission API endpoint
- `app/admin/dashboard/page.tsx`: Admin dashboard
- `lib/mongodb.ts`: MongoDB connection
- `lib/email-service.ts`: Email notification service
- `lib/auth.ts`: Authentication utilities
- `middleware.ts`: Next.js middleware for authentication

## Development Workflow

### 1. Making Changes

1. Create a feature branch from main:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the project's code style

3. Test your changes locally:
   ```bash
   npm run dev
   ```

### 2. Admin Access

To access the admin dashboard:

1. Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Login with:
   - Username: `admin`
   - Password: `globaledutech-admin`

### 3. Testing Features

#### Form Submissions

1. Fill out the contact form on the homepage
2. Check your configured `CONTACT_RECEIVER_EMAIL` for notifications
3. Log into the admin dashboard to see the submission

#### Course Pages

1. Course data is defined in `lib/courses-data.ts`
2. Courses are dynamically rendered at `/courses/[slug]`
3. To add a new course, add it to the courses array in this file

## Common Development Tasks

### Adding New Components

1. Create a new file in the `components/` directory
2. Export your React component
3. Import and use it in the relevant page or layout

### Modifying API Routes

1. API routes are in the `app/api/` directory
2. Each route exports HTTP method handlers (GET, POST, etc.)
3. Follow the existing pattern for consistency

### Styling Components

1. The project uses TailwindCSS for styling
2. Add Tailwind classes directly to elements
3. For custom styles, modify `app/globals.css`

### Working with the Database

1. Database operations are performed using the MongoDB driver
2. Use the `clientPromise` from `lib/mongodb.ts`
3. Follow existing patterns in API routes

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Node.js Driver Documentation](https://docs.mongodb.com/drivers/node/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)

## Common Issues and Solutions

### Database Connection Problems

**Issue**: Cannot connect to MongoDB
**Solution**:
- Check your MongoDB Atlas IP whitelist
- Verify your connection string in `.env.local`
- Make sure your MongoDB Atlas cluster is running

### Email Sending Failures

**Issue**: Form submissions don't send emails
**Solution**:
- Verify SMTP settings in `.env.local`
- For Gmail, make sure you're using an App Password
- Check spam/junk folders

### Next.js Build Errors

**Issue**: Build fails with TypeScript errors
**Solution**:
- Fix type errors indicated in the console
- Run `npm run lint` to check for linting issues
- Check import paths (case sensitivity matters)

## Getting Help

If you encounter any issues not covered here, please contact:

- **Project Lead**: [project-lead@globaledutech.com](mailto:project-lead@globaledutech.com)
- **Tech Support**: [tech-support@globaledutech.com](mailto:tech-support@globaledutech.com)

For more detailed information, refer to:

- [PROJECT_HANDOVER.md](PROJECT_HANDOVER.md): Complete project documentation
- [MAINTENANCE_GUIDE.md](MAINTENANCE_GUIDE.md): Maintenance procedures
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md): Deployment instructions
