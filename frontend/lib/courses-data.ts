// Course data model
export interface Course {
  slug: string;
  title: string;
  category: 'academic' | 'skill' | 'teacher';
  intro: string;
  longDesc: string;
  imageUrl: string;
  learning: string[];
  details: {
    duration: string;
    ageGroup: string;
    schedule: string;
    prerequisites?: string;
  };
  featured?: boolean;
}

// Course data
export const courses: Course[] = [
  {
    slug: 'abacus',
    title: 'Abacus',
    category: 'academic',
    intro: 'Enhances memory, concentration, visualization, and arithmetic speed. Builds mental math skills through bead-based visualization and encourages brain development.',
    longDesc: `
    Abacus programme provides significant benefits to children in enhancing their learning skills, photographic memory, visualization skills, increasing speed, higher concentration, and attaining accuracy and proficiency in all subjects. Abacus focuses on utilizing the innate power of the brain for visualizing the mental abacus procedure. Abacus classes can help to build confidence and concentration levels in daily activities. 

    In addition to calculating the basic functions of addition, subtraction, multiplication, and division, the abacus can calculate roots up to the cubic degree. Children easily get familiar with the beads of this tool and start performing small calculations. The abacus system of mental calculation is a system where users mentally visualize an abacus to carry out arithmetical calculations. No physical abacus is used; only the answers are written down. Calculations can be made at great speed in this way. Abacus stimulates whole-brain development. 

    When children use their index and thumb to move the abacus beads to perform arithmetic calculations, there is quick communication between the finger movements and the brain. The mind performs physical and logical actions at the same time. Any child who knows basic counting from 1 to 100 is technically qualified to be enrolled into Abacus classes.
    `,
    imageUrl: '/images/abacus.png',
    learning: [
      "Improve Concentration",
      "Observation and Listening Skills",
      "Amplify Speed and Accuracy",
      "Boosts Creativity and Increases Self-Confidence",
      "Boost Memory",
      "Sharpen Cerebral Construction of a Child"
    ],
    details: {
      duration: '12 weeks per level',
      ageGroup: '5-12 years',
      schedule: 'Weekdays and Weekend classes',
      prerequisites: 'Child who identifies numbers from 1-100 is eligible'
    },
    featured: true
  },
  {
    slug: 'handwriting',
    title: 'Handwriting',
    category: 'academic',
    intro: 'Focuses on coordination between mind and motor skills. Improves reading, language processing, and fine motor skills. Teaches correct pen grip and posture.',
    longDesc: `
      Handwriting is a process that involves coordination between the mind and motor actions of the brain. Handwriting still forms an integral part of our education system due to the fact that the majority of our examinations are still handwritten. Handwriting reinforces our reading and language processing skills. Writing by hand allows time to slow down the thought process, enabling the writer to think about the words, how they are spelt, and the structure of the writing; all making the writer more adept at the language they are using.
      
      Our handwriting course provides hand-eye coordination, along with fine visual motor skills, to provide fluency in movements and present beautiful handwriting. This course not only helps improve handwriting, but also helps write accurately. As each letter has its own identity, we emphasize each letter and its creation. We teach not only how to write, but also the proper way of holding a pen or pencil and the right angle to place the notebooks. Consistent practice will help develop handwriting. There is no shortcut for handwriting repair and penmanship. Training at Kids Academy is based on identifying technical errors and focusing 100% on repair of these errors. It is a simple recall-based curriculum.
      
      Courses included: English Handwriting, Tamil Handwriting, Hindi Handwriting, Lucida Handwriting, Speed Writing, Calligraphy – Stylish Writing.
      
      Here at Kids Academy, we adopt scientific methods developed by experts in the field of handwriting. When you "write" sentences in the air with your finger, you're actually training the complex group of muscles in your hand and entire arm to support you when you're actually handwriting.
    `,
    imageUrl: '/images/handwriting.png',
    learning: [
      "English, Tamil, Hindi, and Lucida Handwriting",
      "Speed Writing",
      "Calligraphy – Stylish Writing",
      "Scientific methods and personalized error correction"
    ],
    details: {
      duration: 'Flexible program',
      ageGroup: '3+ years',
      schedule: 'Online & Offline, Flexible timings',
      prerequisites: 'None'
    },
    featured: false
  },
  {
    slug: 'arts',
    title: 'Creative Arts & Crafts',
    category: 'skill',
    intro: 'Unleash creativity through painting, sculpting, and other crafts. Develops fine motor skills and artistic expression.',
    longDesc: 'Explore the world of arts and crafts with hands-on activities designed to inspire creativity and develop artistic skills.',
    imageUrl: '/images/arts.png',
    learning: [
      'Painting and Drawing',
      'Sculpting',
      'Crafting with Recycled Materials',
      'Teamwork and Collaboration'
    ],
    details: {
      duration: '8 weeks',
      ageGroup: '5-15 years',
      schedule: 'Weekend classes',
      prerequisites: 'None'
    },
    featured: false
  },
  {
    slug: 'english',
    title: 'English Language Skills',
    category: 'academic',
    intro: 'Enhance communication skills, grammar, and vocabulary. Builds confidence in speaking and writing.',
    longDesc: 'Our English program focuses on improving language skills through interactive and engaging methods.',
    imageUrl: '/images/english.png',
    learning: [
      'Grammar and Vocabulary',
      'Public Speaking',
      'Creative Writing',
      'Reading Comprehension'
    ],
    details: {
      duration: '10 weeks',
      ageGroup: '6-14 years',
      schedule: 'Weekdays and Weekend classes',
      prerequisites: 'Basic English knowledge'
    },
    featured: false
  },
  {
    slug: 'vedic-maths',
    title: 'Vedic Maths',
    category: 'academic',
    intro: 'Learn ancient techniques for faster calculations. Boosts confidence and reduces math anxiety.',
    longDesc: 'Vedic Maths is a collection of techniques to solve mathematical problems in an easy and faster way.',
    imageUrl: '/images/vedicmaths.png',
    learning: [
      'Speed Calculations',
      'Mental Math Techniques',
      'Problem Solving Skills',
      'Confidence Building'
    ],
    details: {
      duration: '12 weeks',
      ageGroup: '8-16 years',
      schedule: 'Weekend classes',
      prerequisites: 'Basic Arithmetic Knowledge'
    },
    featured: true
  },
  {
    slug: 'phonics',
    title: 'Phonics',
    category: 'academic',
    intro: 'Builds foundational reading, spelling, and writing skills using phonics and multi-sensory learning.',
    longDesc: "Phonics is the relationship between letters and sounds. Kids Academy helps children learn to read, spell, and write correctly through a blend of blending and segmenting techniques. Unlike rote memorization, children learn how to spell words using letter sounds. The child-friendly, multi-sensory approach uses songs, actions, and illustrated textbooks. Well-trained teachers customize the program for every child's needs, helping them become fluent readers and confident writers.",
    imageUrl: '/images/globalacademy-all.jpeg',
    learning: [
      "By learning 44 sounds, children can read almost any word",
      "Children will blend sounds to read words, phrases, and sentences",
      "Identify the sounds in a word to spell (Dictation)",
      "Develop the ability to read books independently",
      "No need to memorize words or spellings",
      "Nurture the love for reading through exposure to books"
    ],
    details: {
      duration: '24 weeks',
      ageGroup: '4-8 years',
      schedule: 'Weekdays and Weekend classes',
      prerequisites: 'None'
    },
    featured: false
  },
  {
    slug: 'spoken-english',
    title: 'Spoken English',
    category: 'skill',
    intro: 'Enhances English fluency, pronunciation, grammar, and confidence for practical and professional communication.',
    longDesc: "English is the language of international communication and essential in business, education, and daily life. Kids Academy prioritizes communicative English with a focus on practical skills: preparing for interviews, agreeing/disagreeing, responding to opinions, informal language, pronunciation, and negotiation. Our conversation classes build accuracy, fluency, and vocabulary. Grammar training helps students present themselves professionally and confidently, ensuring they are understood and can communicate naturally and fluently.",
    imageUrl: '/images/english.png',
    learning: [
      "Enhance your spoken English for a professional setting",
      "Refine your English skills for real-life situations",
      "Express ideas and thoughts needed to handle various situations",
      "Communicate flawlessly with confidence and fluency",
      "Enhance your profile and set yourself apart from the crowd",
      "Avoid communication gaps and reach your goals"
    ],
    details: {
      duration: 'Flexible program',
      ageGroup: 'All ages',
      schedule: 'Online & Offline, Flexible timings',
      prerequisites: 'None'
    },
    featured: false
  },
  {
    slug: 'spoken-hindi',
    title: 'Spoken Hindi',
    category: 'skill',
    intro: 'Develops Hindi reading, writing, and speaking skills. Prepares students for Hindi Prachar Sabha exams.',
    longDesc: "Language learning expands horizons. Hindi, written in Devanagari script, is taught through vowels, consonants, and matras. Kids Academy students become proficient in reading, then build vocabulary. Tutors prepare students for all levels of Hindi Sabha exams, making them confident in both written and spoken Hindi.",
    imageUrl: '/images/globalacademy-all.jpeg',
    learning: [
      "Be able to write Hindi flawlessly",
      "Improve your Hindi knowledge",
      "Learn to write Hindi like your mother tongue",
      "Enhance your reading skill by learning all Hindi letters and matras",
      "Enhance your profile and set yourself apart from the crowd"
    ],
    details: {
      duration: 'Flexible program',
      ageGroup: 'All ages',
      schedule: 'Online & Offline, Flexible timings',
      prerequisites: 'None'
    },
    featured: false
  },
  {
    slug: 'drawing-coloring',
    title: 'Drawing & Coloring',
    category: 'skill',
    intro: 'Develops creativity, observation, patience, and artistic technique from basics to advanced levels.',
    longDesc: "Art is a universal language for creativity and emotional growth. Kids Academy's structured, step-by-step curriculum helps students explore ideas, express themselves, and create independently. Courses cover hand drawing, sketching, coloring, portrait making, animals, birds, color pencil, pastels, shading (hatching, smudging, stippling, etc.), painting (acrylic, watercolor, poster), and glass painting. Classes foster creative thinking and artistic skills under the guidance of professional instructors.",
    imageUrl: '/images/globalacademy-all.jpeg',
    learning: [
      "Blossom in arts and other creative fields",
      "Express feelings with or without words",
      "Develop observation and presentation skills",
      "Better concentration and ability to focus",
      "Improves emotional stability",
      "Promotes advanced use of brain functions"
    ],
    details: {
      duration: 'Step-wise program',
      ageGroup: '3+ years',
      schedule: 'Online & Offline, Flexible timings',
      prerequisites: 'None'
    },
    featured: true
  },
  {
    slug: 'rubiks-cube',
    title: 'Rubik\'s Cube',
    category: 'skill',
    intro: 'Teaches logical thinking, pattern recognition, and memory through hands-on puzzle solving.',
    longDesc: "Since the 1970s, the Rubik's Cube has been a favorite for building patience and problem-solving skills. Children learn cube notation, solving algorithms, and how to approach challenges step by step. Solving the cube encourages focus, analytical thinking, and persistence. Kids Academy instructors teach through flexible learning approaches for all ages.",
    imageUrl: '/images/globalacademy-all.jpeg',
    learning: [
      "Improves Problem-Solving Skills",
      "Enhances Spatial Awareness",
      "Boosts Memory",
      "Increases Patience and Persistence",
      "Improves Focus and Concentration",
      "Encourages Analytical Thinking"
    ],
    details: {
      duration: 'Flexible program',
      ageGroup: 'All ages',
      schedule: 'Online & Offline, Flexible timings',
      prerequisites: 'None'
    },
    featured: false
  },
  {
    slug: 'chess',
    title: 'Chess',
    category: 'skill',
    intro: 'Builds strategic, logical, and creative thinking along with memory and emotional intelligence.',
    longDesc: "Chess is a centuries-old strategic board game demanding both skill and foresight. Students learn the rules, tactics, and strategies, gradually building up from opening moves to endgame techniques. Classes enhance cognitive ability, patience, and discipline, with personal coaching and competitive opportunities.",
    imageUrl: '/images/globalacademy-all.jpeg',
    learning: [
      "Improves Cognitive Skills",
      "Enhances Memory",
      "Boosts IQ",
      "Enhances Creativity",
      "Improves Emotional Intelligence",
      "Increases Problem-Solving Speed"
    ],
    details: {
      duration: 'Ongoing program with levels',
      ageGroup: '6-15 years',
      schedule: 'Weekend classes',
      prerequisites: 'None'
    },
    featured: true
  },
  {
    slug: 'imtti',
    title: 'International Montessori Teacher Training Institute(IMTTI)',
    category: 'teacher',
    intro: 'Professional teacher training in Montessori philosophy, methods, and classroom management.',
    longDesc: "Based on Dr. Maria Montessori's philosophy, this program prepares teachers to create environments that foster independence and holistic learning. The training emphasizes hands-on materials, mixed-age groups, peer learning, individualized pacing, and respect for the child's natural curiosity. Graduates are equipped to inspire and guide children in any Montessori classroom.",
    imageUrl: '/images/globalacademy-all.jpeg',
    learning: [
      "Child-Centered Learning: Children follow their interests; teachers guide, not lecture",
      "Mixed-Age Groups: Promoting peer learning and mentorship",
      "Hands-On Learning: Self-correcting materials encourage exploration",
      "Freedom within Limits: Balancing freedom with classroom order",
      "Individualized Learning: Tailored to each child's pace and interests",
      "Respect for the Child: Fostering independence and self-esteem"
    ],
    details: {
      duration: 'Flexible program',
      ageGroup: 'Adults (18+ years)',
      schedule: 'Online & Offline, Flexible timings',
      prerequisites: 'None'
    },
    featured: true
  },
  {
    slug: 'ntt',
    title: 'Nursery Teacher Training (NTT)',
    category: 'teacher',
    intro: 'Comprehensive early childhood educator training for aspiring nursery and kindergarten teachers.',
    longDesc: "NTT prepares teachers with the pedagogical skills, psychology, and classroom management needed for effective nursery-level education. Trainees learn to design engaging learning environments, craft educational activities, use teaching aids, and foster language, numeracy, and motor skills in young children. The program includes child development theory and practical teaching exposure.",
    imageUrl: '/images/globalacademy-all.jpeg',
    learning: [
      "Early childhood development and psychology",
      "Curriculum planning and creative activity design",
      "Child safety, hygiene, and classroom management",
      "Use of play-based and experiential learning",
      "Observation and assessment of young children"
    ],
    details: {
      duration: '1 year',
      ageGroup: 'Adults (18+ years)',
      schedule: 'Flexible schedule',
      prerequisites: '12th standard completion'
    },
    featured: true
  },
  {
    slug: 'french',
    title: 'French Speaking',
    category: 'skill',
    intro: 'Beginner-friendly French language classes for children and adults.',
    longDesc: "This course introduces the basics of spoken and written French. Students learn everyday vocabulary, simple conversation, greetings, grammar essentials, and correct pronunciation. The course uses role-plays, stories, and multimedia resources to immerse learners in French culture. Suitable for school support or travel preparation.",
    imageUrl: '/images/globalacademy-all.jpeg',
    learning: [
      "Conversational French for daily use",
      "Reading and writing French basics",
      "French pronunciation and listening comprehension",
      "French culture, customs, and etiquette"
    ],
    details: {
      duration: 'Beginner to intermediate',
      ageGroup: 'All ages',
      schedule: 'Group and individual classes',
      prerequisites: 'None'
    },
    featured: false
  }
];

// Get all featured courses
export const getFeaturedCourses = () => {
  return courses.filter(course => course.featured);
};

// Get courses by category
export const getCoursesByCategory = (category: 'academic' | 'skill' | 'teacher') => {
  return courses.filter(course => course.category === category);
};

// Get course by slug
export const getCourseBySlug = (slug: string) => {
  return courses.find(course => course.slug === slug);
};

// Get all course categories
export const getCategories = () => {
  return [
    { id: 'academic', name: 'Academic Programs' },
    { id: 'skill', name: 'Skill Development' },
    { id: 'teacher', name: 'Teacher Training' }
  ];
};
