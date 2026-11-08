// node scripts/build-knowledge.mjs : regenerates src/services/ai/knowledge.json from the website's course data,
// so the chatbot and reply drafts only ever repeat what the website says.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.resolve(here, '../../frontend/data/courses.ts'), 'utf8');

const str = (block, key) => {
  const m = block.match(new RegExp(`${key}:\\s*(?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"|\`([^\`]*)\`)`));
  const v = m && (m[1] ?? m[2] ?? m[3]);
  return v ? v.replace(/\\'/g, "'").replace(/\s+/g, ' ').trim() : undefined;
};

const blocks = src.split(/\n\s*\{\s*\n\s*slug:/).slice(1).map((b) => `slug:${b}`);
const courses = blocks.map((b) => {
  const learning = [...(b.match(/learning:\s*\[([\s\S]*?)\]/)?.[1] || '').matchAll(/"([^"]+)"|'([^']+)'/g)].map((m) => m[1] || m[2]);
  return {
    slug: str(b, 'slug'),
    title: str(b, 'title'),
    category: str(b, 'category'),
    intro: str(b, 'intro'),
    ageGroup: str(b, 'ageGroup'),
    duration: str(b, 'duration'),
    schedule: str(b, 'schedule'),
    prerequisites: str(b, 'prerequisites'),
    learning,
  };
}).filter((c) => c.slug && c.title);

const knowledge = {
  institute: {
    name: 'Global Edutech',
    tagline: 'Nurturing Young Minds',
    address: '69, Rajiv Gandhi Nagar, Uppilipalayam, Coimbatore, Tamil Nadu 641015',
    phone: '+91 93630 42019',
    email: 'globaleducationgv@gmail.com',
    days: 'Monday to Saturday',
    freeDemo: true,
    modes: 'Every course is available online and offline.',
  },
  programs: [
    { name: 'Global Kids', type: 'Preschool', ages: '2-6 years' },
    { name: 'Global Education', type: 'After-school programs', ages: '5-12 years' },
    { name: 'Tuition Point', type: 'Home tuitions', ages: 'Class 1-10' },
  ],
  courses,
};
writeFileSync(path.resolve(here, '../src/services/ai/knowledge.json'), `${JSON.stringify(knowledge, null, 2)}\n`);
console.log(`knowledge.json written with ${courses.length} courses`);
