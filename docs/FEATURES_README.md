# Global Edutech Website

A modern landing page and admin dashboard for Global Edutech Academy - providing various educational programs for students.

Official website: [www.globaledutech.co.in](https://www.globaledutech.co.in)

## Features List

### Home Page Features

- Responsive hero section with eye-catching illustrations
- Services section highlighting key educational offerings
- Testimonials section showcasing student success stories
- Course highlight cards with SVG text-based graphics
- Why Choose Us section with key benefits
- Contact section with form and Google Maps integration
- Footer with social links and navigation

### Courses Section Features

- Tab-based navigation for course categories
- Dynamic course cards with SVG text-based graphics
- Individual course detail pages with:
  - Floating navigation buttons (back to courses, home)
  - Course description
  - Registration form
  - Course-specific SVG graphics
- Not-found page for invalid course slugs

### Contact Section Features

- Integrated Google Maps showing Coimbatore location
- Contact form with validation
- Contact details including:
  - Address
  - Phone numbers
  - Email address
  - Operating hours

### Admin Section Features

- Secure login with JWT authentication
- Dashboard with submission management
- Status filtering (New, Contacted, In Progress, Enrolled, Closed)
- Sortable data table columns
- Export to Excel functionality
- Auto-login option for development
- Middleware-based route protection

## API Endpoint Details

### Public Endpoints

#### Form Submission

- **Endpoint**: `https://www.globaledutech.co.in/api/submit-form`
- **Method**: POST
- **Purpose**: Submit contact or course inquiry forms
- **Required Fields**: name, email, phone, message, program
- **Optional Fields**: studentAge, preferredTime, formType
- **Response**: Confirmation with submission ID

#### Email Testing

- **Endpoint**: `https://www.globaledutech.co.in/api/test-email`
- **Method**: GET
- **Purpose**: Test email functionality (development only)
- **Response**: Email test status

### Admin Endpoints

#### Login

- **Endpoint**: `https://www.globaledutech.co.in/api/admin/login`
- **Method**: POST
- **Purpose**: Authenticate admin users
- **Required Fields**: username, password
- **Response**: Authentication status and JWT token in cookie

#### Logout

- **Endpoint**: `https://www.globaledutech.co.in/api/admin/logout`
- **Method**: POST
- **Purpose**: End admin session
- **Response**: Logout confirmation

#### Get Submissions

- **Endpoint**: `https://www.globaledutech.co.in/api/admin/submissions`
- **Method**: GET
- **Purpose**: Retrieve form submissions with filtering and pagination
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `sortBy`: Field to sort by (default: timestamp)
  - `sortOrder`: Sort direction (asc/desc, default: desc)
  - `status`: Filter by status (New, Contacted, In Progress, Enrolled, Closed, or 'all')
- **Response**: Paginated submissions with metadata

#### Update Submission Status

- **Endpoint**: `https://www.globaledutech.co.in/api/admin/submissions`
- **Method**: PUT
- **Purpose**: Update status of a submission
- **Required Fields**: id, status
- **Valid Status Values**: New, Contacted, In Progress, Enrolled, Closed
- **Response**: Update confirmation

#### Export Submissions

- **Endpoint**: `https://www.globaledutech.co.in/api/admin/export`
- **Method**: GET
- **Purpose**: Export all submissions to Excel
- **Query Parameters**:
  - `sortBy`: Field to sort by (default: timestamp)
  - `sortOrder`: Sort direction (asc/desc, default: desc)
- **Response**: Excel file download

## Technical Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas
- **Authentication**: JWT (jose library)
- **Email**: Nodemailer with Gmail SMTP
- **Export**: ExcelJS for spreadsheet generation
- **Maps**: Google Maps API integration

## Environment Variables

The application requires the following environment variables:

- `MONGODB_URI`: MongoDB connection string
- `GMAIL_USER`: Email for sending notifications
- `GMAIL_APP_PASSWORD`: App password for Gmail
- `SMTP_HOST`: SMTP server (smtp.gmail.com)
- `SMTP_PORT`: SMTP port (465)
- `CONTACT_RECEIVER_EMAIL`: Email to receive notifications
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key

## URLs

- **Main Website**: [https://www.globaledutech.co.in](https://www.globaledutech.co.in)
- **Courses Page**: [https://www.globaledutech.co.in/courses](https://www.globaledutech.co.in/courses)
- **Admin Login**: [https://www.globaledutech.co.in/admin/login](https://www.globaledutech.co.in/admin/login)
- **Admin Dashboard**: [https://www.globaledutech.co.in/admin/dashboard](https://www.globaledutech.co.in/admin/dashboard)
