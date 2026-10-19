// AI-powered features for Global EduTech Landing Page

// Generate AI-powered course content
async function generateAICourses() {
    const coursesContainer = document.getElementById('coursesContainer');
    
    try {
        // Show loading state
        coursesContainer.innerHTML = `
            <div class="loading course-card">
                <div class="loading-shimmer"></div>
                <p><i class="fas fa-magic"></i> AI is generating amazing courses for you...</p>
            </div>
        `;

        // Course types to generate
        const courseTypes = [
            { type: 'Artificial Intelligence & Machine Learning', audience: 'working professionals', level: 'intermediate' },
            { type: 'Full Stack Web Development', audience: 'career changers', level: 'beginner' },
            { type: 'Data Science & Analytics', audience: 'business analysts', level: 'intermediate' },
            { type: 'Cybersecurity Fundamentals', audience: 'IT professionals', level: 'beginner' }
        ];

        const courses = [];

        // Generate courses in parallel
        const coursePromises = courseTypes.map(async (courseConfig) => {
            const response = await fetch('/api/generate-course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(courseConfig)
            });

            if (!response.ok) {
                throw new Error(`Failed to generate ${courseConfig.type} course`);
            }

            return await response.json();
        });

        const generatedCourses = await Promise.all(coursePromises);
        courses.push(...generatedCourses);

        // Display generated courses
        displayCourses(courses);

    } catch (error) {
        console.error('Error generating AI courses:', error);
        
        // Show fallback content
        coursesContainer.innerHTML = `
            <div class="error-message course-card">
                <div class="course-content">
                    <h3><i class="fas fa-exclamation-triangle"></i> Unable to Generate Courses</h3>
                    <p>We're having trouble connecting to our AI service. Here are some of our popular courses:</p>
                    <button class="btn btn-primary" onclick="loadFallbackCourses()">
                        <i class="fas fa-refresh"></i> Load Default Courses
                    </button>
                </div>
            </div>
        `;
    }
}

// Display courses in the UI
function displayCourses(courses) {
    const coursesContainer = document.getElementById('coursesContainer');
    
    const coursesHTML = courses.map(course => `
        <div class="course-card">
            <div class="course-image">
                <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                
                <div class="course-meta">
                    <span><i class="fas fa-clock"></i> ${course.duration}</span>
                    <span><i class="fas fa-signal"></i> ${course.level}</span>
                </div>
                
                <ul class="course-highlights">
                    ${course.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                </ul>
                
                <div class="course-footer">
                    <span class="course-price">${course.price}</span>
                    <button class="btn btn-primary" onclick="enrollInCourse('${course.title}')">
                        <i class="fas fa-plus"></i> Enroll Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    coursesContainer.innerHTML = coursesHTML;
}

// Generate AI-powered testimonials
async function generateAITestimonials() {
    const testimonialsContainer = document.getElementById('testimonialsContainer');
    
    try {
        // Show loading state
        testimonialsContainer.innerHTML = `
            <div class="loading testimonial-card">
                <div class="loading-shimmer"></div>
                <p><i class="fas fa-magic"></i> AI is creating inspiring success stories...</p>
            </div>
        `;

        // Generate testimonials for different course types
        const courseTypes = ['AI & Machine Learning', 'Web Development', 'Data Science'];
        const testimonials = [];

        for (const courseType of courseTypes) {
            const response = await fetch('/api/generate-testimonials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    courseType,
                    count: 1
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to generate testimonials for ${courseType}`);
            }

            const generated = await response.json();
            testimonials.push(...generated);
        }

        // Display generated testimonials
        displayTestimonials(testimonials);

    } catch (error) {
        console.error('Error generating AI testimonials:', error);
        
        // Show fallback content
        testimonialsContainer.innerHTML = `
            <div class="error-message testimonial-card">
                <div class="testimonial-content">
                    <h3><i class="fas fa-exclamation-triangle"></i> Unable to Generate Testimonials</h3>
                    <p>We're having trouble connecting to our AI service. Loading default testimonials...</p>
                </div>
            </div>
        `;
        
        // Load fallback testimonials after a delay
        setTimeout(loadFallbackTestimonials, 2000);
    }
}

// Display testimonials in the UI
function displayTestimonials(testimonials) {
    const testimonialsContainer = document.getElementById('testimonialsContainer');
    
    const testimonialsHTML = testimonials.map(testimonial => `
        <div class="testimonial-card">
            <div class="testimonial-rating">
                ${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}
            </div>
            <div class="testimonial-content">
                "${testimonial.content}"
            </div>
            <div class="testimonial-author">
                <div class="author-avatar">
                    ${testimonial.name.charAt(0)}
                </div>
                <div class="author-info">
                    <h4>${testimonial.name}</h4>
                    <p>${testimonial.role} at ${testimonial.company}</p>
                </div>
            </div>
        </div>
    `).join('');
    
    testimonialsContainer.innerHTML = testimonialsHTML;
}

// Load fallback courses when AI generation fails
function loadFallbackCourses() {
    const fallbackCourses = [
        {
            title: "AI & Machine Learning Fundamentals",
            description: "Master the basics of artificial intelligence and machine learning with hands-on projects and real-world applications.",
            duration: "12 weeks",
            level: "Beginner",
            price: "$299",
            highlights: [
                "Python programming for AI",
                "Machine learning algorithms",
                "Neural networks basics",
                "Real-world projects"
            ]
        },
        {
            title: "Full Stack Web Development Bootcamp",
            description: "Learn modern web development from frontend to backend with React, Node.js, and cloud deployment.",
            duration: "16 weeks",
            level: "Beginner",
            price: "$399",
            highlights: [
                "React & JavaScript",
                "Node.js & Express",
                "Database design",
                "Cloud deployment"
            ]
        },
        {
            title: "Data Science Professional Certificate",
            description: "Become a data scientist with Python, SQL, and advanced analytics techniques for business insights.",
            duration: "14 weeks",
            level: "Intermediate",
            price: "$349",
            highlights: [
                "Python for data science",
                "Statistical analysis",
                "Data visualization",
                "Machine learning"
            ]
        },
        {
            title: "Cybersecurity Specialist Program",
            description: "Protect organizations from cyber threats with comprehensive security training and certification preparation.",
            duration: "10 weeks",
            level: "Intermediate",
            price: "$279",
            highlights: [
                "Network security",
                "Ethical hacking",
                "Security frameworks",
                "Incident response"
            ]
        }
    ];
    
    displayCourses(fallbackCourses);
}

// Load fallback testimonials when AI generation fails
function loadFallbackTestimonials() {
    const fallbackTestimonials = [
        {
            name: "Sarah Johnson",
            role: "Data Scientist",
            company: "TechCorp Inc.",
            content: "The AI course completely transformed my career. I went from being a business analyst to landing my dream job as a data scientist. The hands-on projects were invaluable!",
            rating: 5
        },
        {
            name: "Michael Chen",
            role: "Full Stack Developer",
            company: "StartupXYZ",
            content: "Amazing web development program! The instructors were knowledgeable and the curriculum was up-to-date with industry standards. Highly recommend!",
            rating: 5
        },
        {
            name: "Emily Rodriguez",
            role: "Cybersecurity Analyst",
            company: "SecureBank",
            content: "The cybersecurity program gave me the skills and confidence to switch careers. The practical labs and real-world scenarios were excellent preparation.",
            rating: 4
        }
    ];
    
    displayTestimonials(fallbackTestimonials);
}

// Enroll in course function
function enrollInCourse(courseTitle) {
    // Open chatbot with enrollment inquiry
    openChatbot();
    
    // Pre-fill chatbot with enrollment message
    setTimeout(() => {
        const chatbotInput = document.getElementById('chatbotInput');
        if (chatbotInput) {
            chatbotInput.value = `I'm interested in enrolling in the "${courseTitle}" course. Can you help me with the enrollment process?`;
            chatbotInput.focus();
        }
    }, 500);
}

// Optimize content using AI
async function optimizeContent(elementId, targetAudience, goal) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentContent = element.textContent || element.innerText;
    
    try {
        const response = await fetch('/api/optimize-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentContent,
                targetAudience,
                optimizationGoal: goal
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to optimize content');
        }
        
        const data = await response.json();
        
        // Update content with optimized version
        element.innerHTML = data.optimizedContent;
        
        // Show improvements in console
        console.log('Content optimized:', data.improvements);
        
        return data;
        
    } catch (error) {
        console.error('Error optimizing content:', error);
        return null;
    }
}

// Auto-optimize hero content for better conversion
async function autoOptimizeHero() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (heroTitle) {
        await optimizeContent('hero-title', 'prospective students', 'increase enrollment conversion');
    }
    
    if (heroSubtitle) {
        await optimizeContent('hero-subtitle', 'working professionals', 'highlight career benefits');
    }
}

// Smart form suggestions using AI
async function getSmartFormSuggestions(formData) {
    try {
        const response = await fetch('/api/personalized-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to get smart suggestions');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Error getting smart suggestions:', error);
        return null;
    }
}

// Real-time content personalization
function personalizeContent(userProfile) {
    if (!userProfile) return;
    
    // Personalize hero section
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && userProfile.interests) {
        const interests = userProfile.interests.join(', ');
        heroTitle.innerHTML = `Transform Your Career in <span class="highlight">${interests}</span>`;
    }
    
    // Personalize course recommendations
    if (userProfile.experienceLevel) {
        const levelBadges = document.querySelectorAll('.course-meta span:contains("Level")');
        levelBadges.forEach(badge => {
            if (badge.textContent.toLowerCase().includes(userProfile.experienceLevel.toLowerCase())) {
                badge.style.background = 'var(--accent-color)';
                badge.style.color = 'white';
                badge.style.padding = '4px 8px';
                badge.style.borderRadius = '4px';
            }
        });
    }
}

// A/B testing for different AI-generated content versions
async function runABTest(elementId, variations) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Randomly select a variation
    const selectedVariation = variations[Math.floor(Math.random() * variations.length)];
    
    // Apply the variation
    element.innerHTML = selectedVariation.content;
    
    // Track the variation (in a real app, this would go to analytics)
    console.log(`A/B Test: Showing variation "${selectedVariation.name}" for element "${elementId}"`);
    
    return selectedVariation;
}

// Initialize AI features when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Auto-generate content on page load
    setTimeout(() => {
        generateAICourses();
        generateAITestimonials();
    }, 1000);
    
    // Auto-optimize content after initial load
    setTimeout(() => {
        autoOptimizeHero();
    }, 3000);
});

// Export functions for global access
window.generateAICourses = generateAICourses;
window.generateAITestimonials = generateAITestimonials;
window.loadFallbackCourses = loadFallbackCourses;
window.loadFallbackTestimonials = loadFallbackTestimonials;
window.enrollInCourse = enrollInCourse;
window.optimizeContent = optimizeContent;
window.personalizeContent = personalizeContent;
window.runABTest = runABTest;
