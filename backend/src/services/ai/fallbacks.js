import { createRequire } from 'node:module';

// Built-in (non-AI) behaviour. Used whenever Groq is not configured, rate limited, over its daily cap or down,
// so every feature keeps working on free-tier keys.
const knowledge = createRequire(import.meta.url)('./knowledge.json');
export { knowledge };

export const CATEGORIES = ['Preschool', 'After-School', 'Home Tuition', 'Teacher Training', 'General', 'Spam'];
const INST = knowledge.institute;

// ---------- enquiry triage ----------
export function triageByRules(e) {
  const text = `${e.program || ''} ${e.message || ''}`.toLowerCase();
  const urls = (text.match(/https?:\/\/|www\./g) || []).length;
  let category = 'General';
  if (urls >= 2 || /\b(seo|crypto|bitcoin|loan|casino|viagra|backlink|forex)\b/.test(text)) category = 'Spam';
  else if (/teacher training|ntt|imtti|montessori teacher/.test(text)) category = 'Teacher Training';
  else if (/home tuition|tuition|tutor|class\s*(\d|10)/.test(text)) category = 'Home Tuition';
  else if (/pre-?school|play ?school|nursery|kindergarten|\bkg\b|toddler/.test(text)) category = 'Preschool';
  else if (/after-?school|abacus|vedic|handwriting|art|craft|english|hindi|french|chess|rubik|phonics|skill|camp/.test(text)) category = 'After-School';
  const urgency = /\b(urgent\w*|asap|immediate\w*|today|tomorrow|this week|right away)\b/.test(text) ? 'high' : 'normal';
  const summary = String(e.message || '').replace(/\s+/g, ' ').trim().slice(0, 140);
  return { category, urgency, summary };
}

// ---------- reply drafts ----------
const REPLIES = {
  en: ({ name, program }) => `Hello ${name}, thank you for contacting Global Edutech${program ? ` about ${program}` : ''}. We would love to help. Could you tell us a convenient time for a call? All our courses are available online and offline. You can also reach us on ${INST.phone}.\n\n- Global Edutech team`,
  ta: ({ name, program }) => `வணக்கம் ${name}, ${program ? `${program} குறித்து ` : ''}Global Edutech-ஐ தொடர்பு கொண்டதற்கு நன்றி. உங்களுக்கு உதவ ஆவலாக உள்ளோம். உங்களை அழைக்க ஏற்ற நேரத்தைத் தெரிவிக்கவும். எங்கள் அனைத்துப் படிப்புகளும் ஆன்லைனிலும் நேரிலும் கிடைக்கும். ${INST.phone} என்ற எண்ணிலும் தொடர்பு கொள்ளலாம்.\n\n- Global Edutech குழு`,
  hi: ({ name, program }) => `नमस्ते ${name}, ${program ? `${program} के बारे में ` : ''}Global Edutech से संपर्क करने के लिए धन्यवाद। हमें आपकी सहायता करके खुशी होगी। कृपया बताएं कि कॉल के लिए आपको कौन सा समय सुविधाजनक रहेगा। हमारे सभी कोर्स ऑनलाइन और ऑफलाइन उपलब्ध हैं। आप हमें ${INST.phone} पर भी संपर्क कर सकते हैं।\n\n- Global Edutech टीम`,
};

export function replyFallback({ name = 'there', program, channel = 'whatsapp', language = 'en' }) {
  const first = String(name).trim().split(/\s+/)[0] || 'there';
  const body = (REPLIES[language] || REPLIES.en)({ name: first, program });
  return channel === 'email' ? `Subject: Your enquiry at Global Edutech\n\n${body}` : body;
}

// ---------- website chatbot ----------
const ALIASES = {
  abacus: ['abacus'], handwriting: ['handwriting', 'hand writing', 'penmanship'], arts: ['art', 'craft', 'arts'],
  english: ['english language', 'grammar', 'vocabulary'], 'vedic-maths': ['vedic', 'maths', 'math'],
  phonics: ['phonics', 'phonic'], 'spoken-english': ['spoken english'], 'spoken-hindi': ['hindi'],
  'drawing-coloring': ['drawing', 'coloring', 'colouring'], 'rubiks-cube': ['rubik', 'cube'], chess: ['chess'],
  imtti: ['imtti', 'montessori'], ntt: ['ntt', 'nursery teacher', 'teacher training'], french: ['french'],
};

const ENQUIRE = { label: 'Send an enquiry', href: '/enquiry' };
const call = `call us on ${INST.phone} (${INST.days})`;

export function findCourse(text) {
  const t = text.toLowerCase();
  let best = null;
  for (const c of knowledge.courses) {
    const keys = [c.title.toLowerCase(), c.slug.replace(/-/g, ' '), ...(ALIASES[c.slug] || [])];
    const hit = keys.filter((k) => t.includes(k)).sort((a, b) => b.length - a.length)[0];
    if (hit && (!best || hit.length > best.len)) best = { course: c, len: hit.length };
  }
  return best?.course || null;
}

export function chatFallback(question) {
  const q = String(question || '').toLowerCase();
  if (/[^\u0000-ɏ\s\d.,!?'"()@:/+-]/.test(q)) {
    // Tamil / Hindi etc.: give a short multilingual hand-off
    return { reply: `Thank you for your message. Please ${call}, or send an enquiry and we will reply soon.\nநன்றி. ${INST.phone} என்ற எண்ணில் அழைக்கவும் அல்லது விசாரணை அனுப்பவும்.\nधन्यवाद। कृपया ${INST.phone} पर कॉल करें या पूछताछ भेजें।`, links: [ENQUIRE] };
  }
  const course = findCourse(q);
  if (course) {
    return {
      reply: `${course.title}: ${course.intro} Age group: ${course.ageGroup}. Duration: ${course.duration}. It is available online and offline. Send an enquiry for fees and batch timings, or ${call}.`,
      links: [{ label: `About ${course.title}`, href: `/courses/${course.slug}` }, ENQUIRE],
    };
  }
  if (/\b(fee|fees|price|cost|charges|payment)\b/.test(q)) return { reply: `Fees depend on the program and batch, so I can't quote a number here. Please send an enquiry or ${call} and we will share the exact fees.`, links: [ENQUIRE] };
  if (/\b(online|offline|zoom|home|mode)\b/.test(q) && !/tuition/.test(q)) return { reply: `${INST.modes} Tell us which you prefer in the enquiry form.`, links: [ENQUIRE] };
  const age = q.match(/(\d{1,2})\s*(?:years?|yrs?|y\/o|year old)/);
  const cls = q.match(/class\s*(\d{1,2})|grade\s*(\d{1,2})|std\s*(\d{1,2})/);
  if (cls || /tuition/.test(q)) return { reply: 'Tuition Point offers home tuitions for Class 1 to 10 with verified tutors who teach one-to-one at your doorstep. Online tuition is available too. Send an enquiry and we will match a tutor.', links: [ENQUIRE] };
  if (age) {
    const n = Number(age[1]);
    const reply = n <= 5
      ? 'For ages 2 to 6, Global Kids is our play-based preschool. Phonics, Drawing & Coloring and Handwriting also suit young children.'
      : n <= 12
        ? 'For ages 5 to 12, Global Education after-school programs fit well: Abacus, Vedic Maths, English, Handwriting, Arts, Chess and more.'
        : 'For older children we have Vedic Maths, English, Spoken English, Chess, Rubik\'s Cube and home tuition up to Class 10.';
    return { reply: `${reply} Every course is available online and offline.`, links: [{ label: 'See all courses', href: '/courses' }, ENQUIRE] };
  }
  if (/\b(timing|timings|schedule|batch|when|time)\b/.test(q)) return { reply: `Classes run ${INST.days.toLowerCase()}, with weekday and weekend batches. Tell us your preferred time in the enquiry form and we will confirm a batch.`, links: [ENQUIRE] };
  if (/\b(where|address|location|reach|visit|map)\b/.test(q)) return { reply: `You can visit us at ${INST.address}.`, links: [ENQUIRE] };
  if (/\b(phone|call|number|contact|email|mail|whatsapp)\b/.test(q)) return { reply: `You can ${call}, or email ${INST.email}.`, links: [ENQUIRE] };
  if (/\b(demo|trial|free)\b/.test(q)) return { reply: 'Yes, we offer a free demo class. Send an enquiry with your preferred time and we will arrange it.', links: [ENQUIRE] };
  if (/\b(hi|hello|hey|vanakkam|namaste)\b/.test(q)) return { reply: 'Hello! I can help with our courses, age groups, online or offline classes and demo classes. What would you like to know?', links: [{ label: 'See all courses', href: '/courses' }] };
  return {
    reply: `We run a preschool (Global Kids, ages 2-6), after-school programs (ages 5-12) and home tuitions (Class 1-10). Ask me about a course, an age group or online classes, or ${call}.`,
    links: [{ label: 'See all courses', href: '/courses' }, ENQUIRE],
  };
}
