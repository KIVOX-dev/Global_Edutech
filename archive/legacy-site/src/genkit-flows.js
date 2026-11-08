import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';

// Configure Genkit with Google AI
const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

// Schema for course generation
const CourseSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.string(),
  level: z.string(),
  price: z.string(),
  highlights: z.array(z.string()),
});

// Schema for testimonial generation
const TestimonialSchema = z.object({
  name: z.string(),
  role: z.string(),
  company: z.string(),
  content: z.string(),
  rating: z.number(),
});

// Flow to generate course content
export const generateCourseContent = defineFlow(
  {
    name: 'generateCourseContent',
    inputSchema: z.object({
      courseType: z.string(),
      targetAudience: z.string(),
      skillLevel: z.string(),
    }),
    outputSchema: CourseSchema,
  },
  async (input) => {
    const prompt = `
    Generate a detailed course for an education academy with the following specifications:
    - Course Type: ${input.courseType}
    - Target Audience: ${input.targetAudience}
    - Skill Level: ${input.skillLevel}
    
    Please provide:
    1. An engaging course title
    2. A compelling description (2-3 sentences)
    3. Course duration
    4. Skill level
    5. Competitive pricing
    6. 3-4 key highlights/learning outcomes
    
    Make it professional and appealing to prospective students.
    `;

    const response = await ai.generate({
      prompt,
      output: { schema: CourseSchema },
    });

    return response.output;
  }
);

// Flow to generate testimonials
export const generateTestimonials = defineFlow(
  {
    name: 'generateTestimonials',
    inputSchema: z.object({
      courseType: z.string(),
      count: z.number().default(3),
    }),
    outputSchema: z.array(TestimonialSchema),
  },
  async (input) => {
    const testimonials = [];
    
    for (let i = 0; i < input.count; i++) {
      const prompt = `
      Generate a realistic student testimonial for a ${input.courseType} course at an education academy.
      
      Include:
      - Student name (diverse backgrounds)
      - Their role/profession
      - Company they work for
      - Authentic testimonial content (2-3 sentences)
      - Rating (4-5 stars)
      
      Make it genuine and specific to the course benefits.
      `;

      const response = await ai.generate({
        prompt,
        output: { schema: TestimonialSchema },
      });

      testimonials.push(response.output);
    }

    return testimonials;
  }
);

// Flow to generate personalized content recommendations
export const getPersonalizedRecommendations = defineFlow(
  {
    name: 'getPersonalizedRecommendations',
    inputSchema: z.object({
      userInterests: z.array(z.string()),
      experienceLevel: z.string(),
      goals: z.string(),
    }),
    outputSchema: z.object({
      recommendedCourses: z.array(z.string()),
      personalizedMessage: z.string(),
      nextSteps: z.array(z.string()),
    }),
  },
  async (input) => {
    const prompt = `
    Based on a prospective student's profile, provide personalized recommendations:
    
    Student Profile:
    - Interests: ${input.userInterests.join(', ')}
    - Experience Level: ${input.experienceLevel}
    - Goals: ${input.goals}
    
    Provide:
    1. 3-4 recommended courses that match their profile
    2. A personalized welcome message
    3. Suggested next steps for enrollment
    
    Make it encouraging and tailored to their specific situation.
    `;

    const response = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          recommendedCourses: z.array(z.string()),
          personalizedMessage: z.string(),
          nextSteps: z.array(z.string()),
        }),
      },
    });

    return response.output;
  }
);

// Flow for AI-powered chatbot responses
export const chatbotResponse = defineFlow(
  {
    name: 'chatbotResponse',
    inputSchema: z.object({
      userMessage: z.string(),
      conversationHistory: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      response: z.string(),
      suggestedActions: z.array(z.string()),
    }),
  },
  async (input) => {
    const context = input.conversationHistory ? 
      `Previous conversation: ${input.conversationHistory.join('\n')}` : '';
    
    const prompt = `
    You are a helpful assistant for Global EduTech Academy. Respond to student inquiries professionally and helpfully.
    
    ${context}
    
    Student Question: ${input.userMessage}
    
    Provide:
    1. A helpful and informative response
    2. 2-3 suggested actions the student can take
    
    Focus on courses, enrollment, schedules, pricing, and career outcomes.
    Keep responses concise but informative.
    `;

    const response = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          response: z.string(),
          suggestedActions: z.array(z.string()),
        }),
      },
    });

    return response.output;
  }
);

// Flow to optimize landing page content
export const optimizeContent = defineFlow(
  {
    name: 'optimizeContent',
    inputSchema: z.object({
      currentContent: z.string(),
      targetAudience: z.string(),
      optimizationGoal: z.string(),
    }),
    outputSchema: z.object({
      optimizedContent: z.string(),
      improvements: z.array(z.string()),
    }),
  },
  async (input) => {
    const prompt = `
    Optimize this landing page content for better conversion:
    
    Current Content: ${input.currentContent}
    Target Audience: ${input.targetAudience}
    Goal: ${input.optimizationGoal}
    
    Provide:
    1. Improved, more compelling content
    2. List of specific improvements made
    
    Focus on clarity, persuasion, and call-to-action effectiveness.
    `;

    const response = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          optimizedContent: z.string(),
          improvements: z.array(z.string()),
        }),
      },
    });

    return response.output;
  }
);

export default ai;
