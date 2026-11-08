# Maintenance Guide

This guide provides information on regular maintenance tasks, content updates, and best practices for the Global Edutech Landing Page application.

## Regular Maintenance Tasks

### Weekly Tasks

1. **Check Form Submissions**
   - Log into the admin dashboard at `/admin/login`
   - Review new submissions and update their status
   - Follow up with potential students

2. **Monitor Error Logs**
   - Check Vercel deployment logs for any errors
   - Review browser console errors reported by users
   - Address any recurring issues promptly

### Monthly Tasks

1. **Update Dependencies**
   - Run `npm outdated` to see which packages need updates
   - Update packages with security fixes first:
     ```bash
     npm update
     ```
   - Test thoroughly after updates

2. **Database Maintenance**
   - Create a backup of your MongoDB database
   - Check for any slow queries or performance issues
   - Consider archiving old submissions (older than 1 year)

3. **Content Review**
   - Review course information for accuracy
   - Update testimonials with new student success stories
   - Refresh images and marketing content as needed

### Quarterly Tasks

1. **Performance Audit**
   - Run Lighthouse audits to check performance
   - Optimize images and assets if needed
   - Check page load times across different devices

2. **Security Review**
   - Update admin credentials
   - Rotate JWT secret key
   - Review access logs for suspicious activity
   - Check for outdated dependencies with security vulnerabilities

3. **Feature Planning**
   - Plan new features or improvements
   - Prioritize based on user feedback
   - Schedule development for upcoming quarters

## Content Management

### Updating Course Information

The course data is stored in `lib/courses-data.ts`. To update course information:

1. Open the file in your code editor
2. Modify the course objects as needed:
   ```typescript
   {
     id: "preschool-program",
     title: "Preschool Program",
     description: "Our comprehensive preschool program focuses on...",
     ages: "3-5 years",
     duration: "Half-day or full-day options",
     highlights: [
       "Phonics and early reading",
       "Number concepts",
       "Creative arts",
       "Social skills development"
     ],
     image: "/images/preschool-program.jpg"
   }
   ```
3. Save the file and redeploy your application

### Updating Landing Page Content

Most landing page content is contained within React components in the `components/` directory:

- `HeroSection.tsx`: Main banner and hero message
- `ServicesSection.tsx`: Overview of educational services
- `CoursesTabs.tsx`: Course presentation component
- `TestimonialsSection.tsx`: Student/parent testimonials
- `WhyChooseUs.tsx`: Unique selling points
- `ContactSection.tsx`: Contact information and map

To update content:

1. Locate the appropriate component file
2. Edit the text, images, or structure as needed
3. Save changes and redeploy the application

### Adding New Testimonials

To add a new testimonial:

1. Open `components/TestimonialsSection.tsx`
2. Locate the testimonials array
3. Add a new testimonial object:
   ```typescript
   {
     id: "testimonial-4",
     quote: "My child's confidence has improved tremendously...",
     name: "Jane Smith",
     role: "Parent of a 7-year-old",
     image: "/images/testimonial-4.jpg"
   }
   ```
4. Save the file and redeploy your application

## Database Management

### Backing Up MongoDB Data

To create a backup of your MongoDB database:

1. Using MongoDB Atlas:
   - Go to your Atlas cluster
   - Click "Backup" in the left sidebar
   - Click "Create Backup"
   - Select backup options and follow the prompts

2. Using mongodump (CLI):
   ```bash
   mongodump --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/globaledutech" --out=./backup
   ```

### Restoring from Backup

To restore from a backup:

1. Using MongoDB Atlas:
   - Go to your Atlas cluster
   - Click "Backup" in the left sidebar
   - Find your backup and click "Restore"
   - Follow the prompts to restore

2. Using mongorestore (CLI):
   ```bash
   mongorestore --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/globaledutech" --drop ./backup
   ```

### Archiving Old Data

To archive old submissions:

1. Create an archive collection:
   ```javascript
   db.createCollection("globaledutech-enquiry-archive")
   ```

2. Move old records to archive:
   ```javascript
   db.getCollection("globaledutech-enquiry").find({
     createdAt: { $lt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
   }).forEach(function(doc) {
     db.getCollection("globaledutech-enquiry-archive").insertOne(doc);
     db.getCollection("globaledutech-enquiry").deleteOne({ _id: doc._id });
   })
   ```

## Performance Optimization

### Image Optimization

For new images:

1. Compress images before uploading using tools like:
   - [TinyPNG](https://tinypng.com/)
   - [Squoosh](https://squoosh.app/)
   - [ImageOptim](https://imageoptim.com/)

2. Use modern image formats:
   - WebP for most images
   - AVIF for best compression
   - Always provide fallbacks for older browsers

3. Follow image size guidelines:
   - Hero images: max 1920px wide
   - Course thumbnails: 600x400px
   - Testimonial photos: 200x200px

### Code Optimization

1. Remove unused components or code
2. Use dynamic imports for larger components
3. Implement proper code splitting
4. Minimize CSS and JavaScript

## Troubleshooting Common Issues

### Form Submission Failures

If form submissions are failing:

1. Check browser console for errors
2. Verify MongoDB connection in Vercel logs
3. Check if email configuration is correct
4. Test with a sample submission directly through API route

### Email Notification Issues

If email notifications aren't being sent:

1. Verify SMTP settings in environment variables
2. Check if Gmail account has security restrictions
3. Consider using a transactional email service like SendGrid instead
4. Test email functionality using the `/api/test-email` route

### Admin Login Problems

If admin login is failing:

1. Clear browser cookies
2. Check Vercel logs for authentication errors
3. Verify JWT token generation and validation
4. Reset admin credentials if necessary

## Best Practices for Updates

1. **Always test locally first**
   - Make changes in development environment
   - Test thoroughly before pushing to production

2. **Use Vercel preview deployments**
   - Create pull requests for significant changes
   - Use preview URLs to test before merging

3. **Document all changes**
   - Keep a changelog of significant updates
   - Document any configuration changes

4. **Make incremental updates**
   - Avoid large, sweeping changes
   - Deploy small, manageable updates frequently

5. **Backup before major changes**
   - Create database backups before significant updates
   - Take screenshots of current UI for reference

## Contact and Support

For technical support or questions about this project, please contact:

- **Developer Team**: Global Edutech Development Team
- **Email**: dev@globaledutech.com
- **GitHub Repository**: [https://github.com/chefgs/global-edutech-landing-page](https://github.com/chefgs/global-edutech-landing-page)

---

© 2025 Global Edutech Academy. All rights reserved.
