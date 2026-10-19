import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// Serve the main landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './index.html'));
});

// Mock API endpoints for development (without AI for now)
app.post('/api/generate-course', async (req, res) => {
    // Mock course generation
    const mockCourse = {
        title: "AI & Machine Learning Fundamentals",
        description: "Master the basics of artificial intelligence and machine learning with hands-on projects.",
        duration: "12 weeks",
        level: "Intermediate",
        price: "$299",
        highlights: [
            "Python programming for AI",
            "Machine learning algorithms",
            "Neural networks basics",
            "Real-world projects"
        ]
    };
    
    setTimeout(() => res.json(mockCourse), 1000);
});

app.post('/api/generate-testimonials', async (req, res) => {
    const mockTestimonials = [{
        name: "Sarah Johnson",
        role: "Data Scientist",
        company: "TechCorp Inc.",
        content: "The AI course completely transformed my career. I went from being a business analyst to landing my dream job as a data scientist.",
        rating: 5
    }];
    
    setTimeout(() => res.json(mockTestimonials), 1000);
});

app.post('/api/personalized-recommendations', async (req, res) => {
    const mockRecommendations = {
        personalizedMessage: "Based on your interests and goals, we've identified some great opportunities for you!",
        recommendedCourses: [
            "AI & Machine Learning Fundamentals",
            "Data Science Professional Certificate",
            "Python for Data Analysis"
        ],
        nextSteps: [
            "Review the recommended courses",
            "Schedule a consultation call",
            "Start with our free introductory module"
        ]
    };
    
    setTimeout(() => res.json(mockRecommendations), 1000);
});

app.post('/api/chatbot', async (req, res) => {
    const mockResponse = {
        response: "Thank you for your question! I'd be happy to help you learn more about our courses. Our AI & Machine Learning program is very popular among professionals looking to advance their careers.",
        suggestedActions: [
            "Tell me about course pricing",
            "What are the prerequisites?",
            "How do I enroll?"
        ]
    };
    
    setTimeout(() => res.json(mockResponse), 1000);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'Global EduTech Landing Page is running (Demo Mode)',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Global EduTech Landing Page server running on http://localhost:${PORT}`);
    console.log(`🤖 Demo mode: AI features are using mock data`);
    console.log(`📝 To enable real AI features, set up Google AI API key in .env file`);
});

export default app;
