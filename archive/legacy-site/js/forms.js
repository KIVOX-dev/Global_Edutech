// Form handling and validation for Global EduTech Landing Page

// Form validation patterns
const ValidationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    name: /^[a-zA-Z\s]{2,50}$/
};

// Form messages
const FormMessages = {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    name: 'Please enter a valid name (2-50 characters, letters only)',
    minLength: 'This field must be at least {min} characters long',
    maxLength: 'This field must be no more than {max} characters long'
};

// Initialize form handling
document.addEventListener('DOMContentLoaded', function() {
    initializeContactForm();
    initializeNewsletterForm();
    setupFormValidation();
});

// Contact form initialization
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', handleContactFormSubmission);
    
    // Real-time validation
    const formInputs = contactForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Newsletter form initialization
function initializeNewsletterForm() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', handleNewsletterSubmission);
    });
}

// Handle contact form submission
async function handleContactFormSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Validate all fields
    if (!validateForm(form)) {
        showFormMessage('Please correct the errors above.', 'error');
        return;
    }
    
    // Disable submit button and show loading
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting AI Recommendations...';
    
    try {
        // Collect form data
        const formData = {
            name: form.name.value,
            email: form.email.value,
            userInterests: [form.interests.value],
            experienceLevel: form.experience.value,
            goals: form.goals.value
        };
        
        // Get AI recommendations
        const response = await fetch('/api/personalized-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to get recommendations');
        }
        
        const recommendations = await response.json();
        
        // Show success message with recommendations
        showContactFormSuccess(formData, recommendations);
        
        // Reset form
        form.reset();
        clearAllFieldErrors(form);
        
    } catch (error) {
        console.error('Error submitting contact form:', error);
        showFormMessage('Sorry, there was an error processing your request. Please try again.', 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Handle newsletter form submission
async function handleNewsletterSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!emailInput.value || !ValidationPatterns.email.test(emailInput.value)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        return;
    }
    
    // Disable submit button and show loading
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        // Simulate newsletter subscription
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success message
        showFormMessage('Thank you for subscribing! You\'ll receive our latest updates.', 'success');
        
        // Reset form
        emailInput.value = '';
        clearFieldError(emailInput);
        
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        showFormMessage('Sorry, there was an error. Please try again.', 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Form validation
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Validate individual field
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    const fieldType = field.type;
    const isRequired = field.hasAttribute('required');
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (isRequired && !value) {
        showFieldError(field, FormMessages.required);
        return false;
    }
    
    // Skip validation if field is empty and not required
    if (!value && !isRequired) {
        return true;
    }
    
    // Type-specific validation
    switch (fieldType) {
        case 'email':
            if (!ValidationPatterns.email.test(value)) {
                showFieldError(field, FormMessages.email);
                return false;
            }
            break;
            
        case 'tel':
            if (!ValidationPatterns.phone.test(value)) {
                showFieldError(field, FormMessages.phone);
                return false;
            }
            break;
            
        case 'text':
            if (field.name === 'name' && !ValidationPatterns.name.test(value)) {
                showFieldError(field, FormMessages.name);
                return false;
            }
            break;
            
        case 'textarea':
            if (value.length < 10) {
                showFieldError(field, FormMessages.minLength.replace('{min}', '10'));
                return false;
            }
            if (value.length > 1000) {
                showFieldError(field, FormMessages.maxLength.replace('{max}', '1000'));
                return false;
            }
            break;
    }
    
    // Additional validation for select fields
    if (field.tagName.toLowerCase() === 'select' && isRequired && !value) {
        showFieldError(field, FormMessages.required);
        return false;
    }
    
    return true;
}

// Show field error
function showFieldError(field, message) {
    // Remove existing error
    clearFieldError(field);
    
    // Add error class
    field.classList.add('error');
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    // Insert error message after the field
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

// Clear all field errors in a form
function clearAllFieldErrors(form) {
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => clearFieldError(field));
}

// Show form message
function showFormMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.form-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `form-message form-message-${type}`;
    messageElement.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Insert message at the top of the contact section
    const contactSection = document.getElementById('contact');
    const sectionHeader = contactSection.querySelector('.section-header');
    sectionHeader.appendChild(messageElement);
    
    // Auto-remove message after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
    
    // Scroll to message
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Show contact form success with AI recommendations
function showContactFormSuccess(formData, recommendations) {
    const successHTML = `
        <div class="form-success">
            <h4><i class="fas fa-check-circle"></i> Thank you, ${formData.name}!</h4>
            <p>We've received your information and our AI has generated personalized recommendations for you.</p>
            
            <div class="ai-recommendations">
                <h5><i class="fas fa-magic"></i> Your AI-Powered Recommendations:</h5>
                
                <div class="recommendation-message">
                    <p>${recommendations.personalizedMessage}</p>
                </div>
                
                <div class="recommended-courses">
                    <h6>Recommended Courses:</h6>
                    <ul>
                        ${recommendations.recommendedCourses.map(course => `<li>${course}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="next-steps">
                    <h6>Next Steps:</h6>
                    <ol>
                        ${recommendations.nextSteps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
                
                <div class="recommendation-actions">
                    <p><strong>What's next?</strong> Our enrollment advisor will contact you within 24 hours to discuss these recommendations and help you get started!</p>
                    <button class="btn btn-primary" onclick="openChatbot()">
                        <i class="fas fa-robot"></i> Chat with AI Assistant
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Show in modal
    const modalContent = document.getElementById('personalizationContent');
    modalContent.innerHTML = successHTML;
    openPersonalizationModal();
}

// Setup additional form validation
function setupFormValidation() {
    // Add custom styles for form validation
    const style = document.createElement('style');
    style.textContent = `
        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
            border-color: #E53E3E;
            box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
        }
        
        .field-error {
            color: #E53E3E;
            font-size: 0.875rem;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .field-error::before {
            content: '⚠';
        }
        
        .form-message {
            padding: var(--spacing-md);
            border-radius: var(--radius-md);
            margin: var(--spacing-md) 0;
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            font-weight: 500;
        }
        
        .form-message-success {
            background: #F0FFF4;
            color: #22543D;
            border: 1px solid #9AE6B4;
        }
        
        .form-message-error {
            background: #FED7D7;
            color: #742A2A;
            border: 1px solid #FEB2B2;
        }
        
        .form-message-info {
            background: #EBF8FF;
            color: #2A4365;
            border: 1px solid #90CDF4;
        }
        
        .form-success {
            text-align: left;
        }
        
        .ai-recommendations {
            background: var(--light-gray);
            padding: var(--spacing-md);
            border-radius: var(--radius-md);
            margin-top: var(--spacing-md);
        }
        
        .recommendation-message {
            background: var(--white);
            padding: var(--spacing-sm);
            border-radius: var(--radius-sm);
            margin: var(--spacing-sm) 0;
            border-left: 4px solid var(--primary-color);
        }
        
        .recommended-courses ul,
        .next-steps ol {
            margin: var(--spacing-sm) 0;
            padding-left: var(--spacing-md);
        }
        
        .recommended-courses li,
        .next-steps li {
            margin-bottom: var(--spacing-xs);
            line-height: 1.5;
        }
        
        .recommendation-actions {
            margin-top: var(--spacing-md);
            padding-top: var(--spacing-md);
            border-top: 1px solid #E2E8F0;
            text-align: center;
        }
    `;
    document.head.appendChild(style);
}

// Smart form auto-completion using AI
async function smartAutoComplete(field, value) {
    if (value.length < 3) return;
    
    try {
        // This would integrate with an AI service for smart suggestions
        // For now, we'll provide some basic suggestions
        const suggestions = getSuggestions(field.name, value);
        showSuggestions(field, suggestions);
    } catch (error) {
        console.error('Error getting smart suggestions:', error);
    }
}

// Get suggestions based on field type and value
function getSuggestions(fieldName, value) {
    const suggestions = {
        goals: [
            'Advance my career in technology',
            'Switch to a career in data science',
            'Start my own tech business',
            'Become a full-stack developer',
            'Master artificial intelligence',
            'Get promoted to senior position'
        ],
        interests: [
            'Machine Learning',
            'Web Development',
            'Data Science',
            'Cybersecurity',
            'Cloud Computing',
            'Mobile Development'
        ]
    };
    
    const fieldSuggestions = suggestions[fieldName] || [];
    return fieldSuggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase())
    );
}

// Show suggestions dropdown
function showSuggestions(field, suggestions) {
    // Remove existing suggestions
    const existingSuggestions = field.parentNode.querySelector('.suggestions-dropdown');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    if (suggestions.length === 0) return;
    
    // Create suggestions dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'suggestions-dropdown';
    dropdown.innerHTML = suggestions.map(suggestion => 
        `<div class="suggestion-item" onclick="selectSuggestion('${field.id}', '${suggestion}')">${suggestion}</div>`
    ).join('');
    
    // Insert dropdown
    field.parentNode.appendChild(dropdown);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (dropdown.parentNode) {
            dropdown.remove();
        }
    }, 5000);
}

// Select suggestion
function selectSuggestion(fieldId, suggestion) {
    const field = document.getElementById(fieldId);
    if (field) {
        if (field.tagName.toLowerCase() === 'textarea') {
            field.value = suggestion;
        } else {
            field.value = suggestion;
        }
        
        // Remove suggestions dropdown
        const dropdown = field.parentNode.querySelector('.suggestions-dropdown');
        if (dropdown) {
            dropdown.remove();
        }
        
        // Trigger validation
        validateField({ target: field });
    }
}

// Add suggestions dropdown styles
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .suggestions-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--white);
            border: 1px solid #E2E8F0;
            border-top: none;
            border-radius: 0 0 var(--radius-md) var(--radius-md);
            box-shadow: var(--shadow-md);
            z-index: 100;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .suggestion-item {
            padding: var(--spacing-sm);
            cursor: pointer;
            transition: background var(--transition-fast);
        }
        
        .suggestion-item:hover {
            background: var(--light-gray);
        }
        
        .form-group {
            position: relative;
        }
    `;
    document.head.appendChild(style);
});

// Export functions for global access
window.validateForm = validateForm;
window.validateField = validateField;
window.showFormMessage = showFormMessage;
window.clearAllFieldErrors = clearAllFieldErrors;
window.selectSuggestion = selectSuggestion;
