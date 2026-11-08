// Main JavaScript functionality for Global EduTech Landing Page

// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeAnimations();
    initializeStatCounters();
    initializeScrollEffects();
    loadInitialContent();
});

// Navigation functionality
function initializeNavigation() {
    // Mobile menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'var(--white)';
            header.style.backdropFilter = 'none';
        }
    });
}

// Animation effects
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .course-card, .testimonial-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Statistics counter animation
function initializeStatCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const countUp = (element, target) => {
        let current = 0;
        const increment = target / 100;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 20);
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                countUp(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    });

    statNumbers.forEach(stat => observer.observe(stat));
}

// Scroll effects
function initializeScrollEffects() {
    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroImage = document.querySelector('.hero-img');
        
        if (heroImage) {
            const rate = scrolled * -0.3;
            heroImage.style.transform = `translateY(${rate}px)`;
        }
    });

    // Active navigation link highlighting
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    });
}

// Utility function to scroll to a section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Load initial content
async function loadInitialContent() {
    try {
        // Load default courses if not already loaded
        const coursesContainer = document.getElementById('coursesContainer');
        if (coursesContainer && coursesContainer.children.length === 1) {
            await generateAICourses();
        }

        // Load default testimonials if not already loaded
        const testimonialsContainer = document.getElementById('testimonialsContainer');
        if (testimonialsContainer && testimonialsContainer.children.length === 1) {
            await generateAITestimonials();
        }
    } catch (error) {
        console.error('Error loading initial content:', error);
    }
}

// Chatbot functionality
function openChatbot() {
    const chatbot = document.getElementById('chatbot');
    if (chatbot) {
        chatbot.style.display = 'flex';
        document.getElementById('chatbotInput').focus();
    }
}

function closeChatbot() {
    const chatbot = document.getElementById('chatbot');
    if (chatbot) {
        chatbot.style.display = 'none';
    }
}

// Send chatbot message
async function sendChatbotMessage() {
    const input = document.getElementById('chatbotInput');
    const messagesContainer = document.getElementById('chatbotMessages');
    
    if (!input.value.trim()) return;

    const userMessage = input.value;
    input.value = '';

    // Add user message to chat
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'message user-message';
    userMessageElement.innerHTML = `<p>${userMessage}</p>`;
    messagesContainer.appendChild(userMessageElement);

    // Add typing indicator
    const typingElement = document.createElement('div');
    typingElement.className = 'message bot-message typing';
    typingElement.innerHTML = '<p>AI is thinking...</p>';
    messagesContainer.appendChild(typingElement);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        // Get conversation history
        const conversationHistory = Array.from(messagesContainer.querySelectorAll('.message p'))
            .map(p => p.textContent)
            .slice(-10); // Last 10 messages

        const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userMessage,
                conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get chatbot response');
        }

        const data = await response.json();

        // Remove typing indicator
        messagesContainer.removeChild(typingElement);

        // Add bot response
        const botMessageElement = document.createElement('div');
        botMessageElement.className = 'message bot-message';
        botMessageElement.innerHTML = `
            <p>${data.response}</p>
            ${data.suggestedActions.length > 0 ? `
                <div class="suggested-actions">
                    ${data.suggestedActions.map(action => 
                        `<button class="btn btn-secondary btn-small" onclick="handleSuggestedAction('${action}')">${action}</button>`
                    ).join('')}
                </div>
            ` : ''}
        `;
        messagesContainer.appendChild(botMessageElement);

    } catch (error) {
        console.error('Error sending chatbot message:', error);
        
        // Remove typing indicator
        messagesContainer.removeChild(typingElement);

        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'message bot-message';
        errorElement.innerHTML = '<p>Sorry, I\'m having trouble responding right now. Please try again later.</p>';
        messagesContainer.appendChild(errorElement);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle suggested actions from chatbot
function handleSuggestedAction(action) {
    const input = document.getElementById('chatbotInput');
    input.value = action;
    sendChatbotMessage();
}

// Allow Enter key to send chatbot messages
document.addEventListener('DOMContentLoaded', function() {
    const chatbotInput = document.getElementById('chatbotInput');
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatbotMessage();
            }
        });
    }
});

// Personalization modal functions
function openPersonalizationModal() {
    const modal = document.getElementById('personalizationModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closePersonalizationModal() {
    const modal = document.getElementById('personalizationModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('personalizationModal');
    if (modal && e.target === modal) {
        closePersonalizationModal();
    }
    
    const chatbot = document.getElementById('chatbot');
    if (chatbot && !chatbot.contains(e.target) && !e.target.closest('[onclick*="openChatbot"]')) {
        // Don't auto-close chatbot for now
    }
});

// Get personalized recommendations
async function getPersonalizedRecommendations() {
    // Show modal with form
    const modalContent = document.getElementById('personalizationContent');
    modalContent.innerHTML = `
        <form id="personalizationForm">
            <div class="form-group">
                <label for="userInterests">What are you interested in learning?</label>
                <select id="userInterests" multiple required>
                    <option value="ai-ml">Artificial Intelligence & Machine Learning</option>
                    <option value="data-science">Data Science & Analytics</option>
                    <option value="web-development">Web Development</option>
                    <option value="cybersecurity">Cybersecurity</option>
                    <option value="digital-marketing">Digital Marketing</option>
                    <option value="business-analytics">Business Analytics</option>
                </select>
                <small>Hold Ctrl/Cmd to select multiple options</small>
            </div>
            
            <div class="form-group">
                <label for="userExperience">Your experience level:</label>
                <select id="userExperience" required>
                    <option value="">Select your level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="userGoals">What are your career goals?</label>
                <textarea id="userGoals" rows="3" placeholder="Tell us about your aspirations..." required></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary btn-large">
                <i class="fas fa-magic"></i> Get AI Recommendations
            </button>
        </form>
    `;
    
    openPersonalizationModal();
    
    // Handle form submission
    document.getElementById('personalizationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const interests = Array.from(document.getElementById('userInterests').selectedOptions)
            .map(option => option.value);
        const experience = document.getElementById('userExperience').value;
        const goals = document.getElementById('userGoals').value;
        
        try {
            modalContent.innerHTML = '<div class="loading"><div class="loading-shimmer"></div><p>AI is generating your personalized recommendations...</p></div>';
            
            const response = await fetch('/api/personalized-recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userInterests: interests,
                    experienceLevel: experience,
                    goals
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get recommendations');
            }
            
            const data = await response.json();
            
            modalContent.innerHTML = `
                <div class="recommendations-result">
                    <h4><i class="fas fa-star"></i> Your Personalized Recommendations</h4>
                    
                    <div class="personalized-message">
                        <p>${data.personalizedMessage}</p>
                    </div>
                    
                    <div class="recommended-courses">
                        <h5>Recommended Courses:</h5>
                        <ul>
                            ${data.recommendedCourses.map(course => `<li>${course}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="next-steps">
                        <h5>Next Steps:</h5>
                        <ol>
                            ${data.nextSteps.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="scrollToSection('courses'); closePersonalizationModal();">
                            <i class="fas fa-graduation-cap"></i> View Courses
                        </button>
                        <button class="btn btn-secondary" onclick="scrollToSection('contact'); closePersonalizationModal();">
                            <i class="fas fa-envelope"></i> Contact Us
                        </button>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error getting recommendations:', error);
            modalContent.innerHTML = `
                <div class="error-message">
                    <p><i class="fas fa-exclamation-triangle"></i> Sorry, we couldn't generate recommendations right now. Please try again later.</p>
                    <button class="btn btn-primary" onclick="closePersonalizationModal()">Close</button>
                </div>
            `;
        }
    });
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Service worker registration (for PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

// Export functions for global access
window.scrollToSection = scrollToSection;
window.openChatbot = openChatbot;
window.closeChatbot = closeChatbot;
window.sendChatbotMessage = sendChatbotMessage;
window.handleSuggestedAction = handleSuggestedAction;
window.getPersonalizedRecommendations = getPersonalizedRecommendations;
window.openPersonalizationModal = openPersonalizationModal;
window.closePersonalizationModal = closePersonalizationModal;
