import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  generateCourseContent, 
  generateTestimonials, 
  getPersonalizedRecommendations,
  chatbotResponse,
  optimizeContent 
} from './genkit-flows.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Serve the main landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// API Routes for AI-powered features

// Generate course content
app.post('/api/generate-course', async (req, res) => {
  try {
    const { courseType, targetAudience, skillLevel } = req.body;
    
    if (!courseType || !targetAudience || !skillLevel) {
      return res.status(400).json({ 
        error: 'Missing required fields: courseType, targetAudience, skillLevel' 
      });
    }

    const course = await generateCourseContent({
      courseType,
      targetAudience,
      skillLevel
    });

    res.json(course);
  } catch (error) {
    console.error('Error generating course:', error);
    res.status(500).json({ error: 'Failed to generate course content' });
  }
});

// Generate testimonials
app.post('/api/generate-testimonials', async (req, res) => {
  try {
    const { courseType, count = 3 } = req.body;
    
    if (!courseType) {
      return res.status(400).json({ error: 'Missing required field: courseType' });
    }

    const testimonials = await generateTestimonials({
      courseType,
      count
    });

    res.json(testimonials);
  } catch (error) {
    console.error('Error generating testimonials:', error);
    res.status(500).json({ error: 'Failed to generate testimonials' });
  }
});

// Get personalized recommendations
app.post('/api/personalized-recommendations', async (req, res) => {
  try {
    const { userInterests, experienceLevel, goals } = req.body;
    
    if (!userInterests || !experienceLevel || !goals) {
      return res.status(400).json({ 
        error: 'Missing required fields: userInterests, experienceLevel, goals' 
      });
    }

    const recommendations = await getPersonalizedRecommendations({
      userInterests,
      experienceLevel,
      goals
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get personalized recommendations' });
  }
});

// Chatbot endpoint
app.post('/api/chatbot', async (req, res) => {
  try {
    const { userMessage, conversationHistory } = req.body;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'Missing required field: userMessage' });
    }

    const response = await chatbotResponse({
      userMessage,
      conversationHistory
    });

    res.json(response);
  } catch (error) {
    console.error('Error in chatbot response:', error);
    res.status(500).json({ error: 'Failed to get chatbot response' });
  }
});

// Content optimization endpoint
app.post('/api/optimize-content', async (req, res) => {
  try {
    const { currentContent, targetAudience, optimizationGoal } = req.body;
    
    if (!currentContent || !targetAudience || !optimizationGoal) {
      return res.status(400).json({ 
        error: 'Missing required fields: currentContent, targetAudience, optimizationGoal' 
      });
    }

    const optimized = await optimizeContent({
      currentContent,
      targetAudience,
      optimizationGoal
    });

    res.json(optimized);
  } catch (error) {
    console.error('Error optimizing content:', error);
    res.status(500).json({ error: 'Failed to optimize content' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Global EduTech AI-powered landing page is running',
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
  console.log(`🤖 AI-powered features available at /api/*`);
});

export default app;
