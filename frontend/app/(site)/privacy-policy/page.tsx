import LegalPage, { LegalSection } from '@/components/shared/LegalPage'

export const metadata = {
  title: 'Privacy Policy | Global Edutech',
  description: 'How Global Edutech collects, uses, stores and protects personal information of students, parents, staff and website visitors.',
}

const sections: LegalSection[] = [
  {
    id: 'who-we-are', title: 'Who we are',
    body: [
      'Global Edutech ("we", "us", "our") runs preschool, after-school and home-tuition programs under the Global Kids, Global Education, Global Academy and Tuition Point names. Our address is 69, Rajiv Gandhi Nagar, Uppilipalayam, Coimbatore, Tamil Nadu 641015, India.',
      'For the purposes of Indian data-protection law we are the "Data Fiduciary" for the personal data described in this policy. You can reach us at globaleducationgv@gmail.com or +91 93630 42019 (Monday to Saturday).',
    ],
  },
  {
    id: 'scope', title: 'Who this policy covers',
    body: [
      'This policy applies to visitors of our website, parents and guardians who contact us or enrol a child, students (who are usually children), and our staff and tutors who use our staff portal.',
      'Because many of our students are under 18, we treat children\'s information with extra care. We collect a child\'s personal data only with the consent of a parent or lawful guardian, and we do not track children or show them targeted advertising.',
    ],
  },
  {
    id: 'what-we-collect', title: 'Information we collect',
    body: [
      'We collect only what we need to run our programs.',
      { list: [
        'Website enquiry form: your name, email address, phone number, the program you are interested in, the child\'s age range, your preferred contact time and the message you write.',
        'Admission and student records: student name, admission number, date-related details we need, course and batch, the student\'s own phone or email (if any), parent or guardian name, email and phone, status, and an optional photo and documents (for example identity or school records) that you choose to give us.',
        'Attendance and learning records: daily attendance marks (present, absent, late, excused) with optional notes, made by our teachers.',
        'Fee and payment records: fee instalments, amounts due and paid, payment dates, payment mode (cash, UPI, card, bank, cheque), reference numbers and receipts. We do not store card numbers, UPI PINs or bank passwords.',
        'Staff records: name, email, phone, employee ID, designation, join date, shift timings, check-in and check-out times, leave requests and optional documents or photo.',
        'Account and security data: login email, a securely hashed password (we never store passwords in readable form), last login time, and an audit log of important actions taken in the admin panel.',
        'Technical data: IP address, browser type and request logs created automatically when you use the website or portal, used for security and to keep the service running.',
      ] },
    ],
  },
  {
    id: 'how-we-use', title: 'How we use your information',
    body: [
      { list: [
        'To respond to enquiries and arrange demo classes, counselling and admissions.',
        'To teach, manage batches, mark and report attendance, and share progress with parents.',
        'To raise fee instalments, record payments, issue receipts and send fee reminders by email before and after due dates.',
        'To operate staff accounts, attendance, leave and payroll-related administration.',
        'To keep our systems secure, prevent misuse, investigate incidents and keep an audit trail.',
        'To meet legal, tax, accounting and regulatory obligations.',
      ] },
      'We do not sell personal information. We do not use student data for advertising, and we do not send marketing emails to parents unless they have agreed to receive them.',
    ],
  },
  {
    id: 'legal-basis', title: 'Consent and lawful grounds',
    body: [
      'We process personal data on the basis of your consent (for example when you submit an enquiry or enrol a child), to perform our agreement with you (providing classes and managing fees), to comply with the law, and for legitimate uses permitted under the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000 and rules made under them.',
      'You may withdraw consent at any time by writing to us. Withdrawing consent does not affect processing that already happened, and we may need to keep certain records (such as fee receipts) where the law requires it.',
    ],
  },
  {
    id: 'sharing', title: 'Who we share information with',
    body: [
      'We share information only with service providers who help us run our systems, under confidentiality and security obligations, and only what they need to do their job:',
      { list: [
        'MongoDB Atlas: cloud database where our records are stored.',
        'Backblaze B2: private cloud storage for uploaded photos, documents, receipts and exports. Files are not public and are opened only through short-lived, access-controlled links.',
        'Brevo: email delivery service used to send fee reminders, password-reset links, login details and enquiry notifications.',
        'Groq (AI provider, optional): helps draft replies to enquiries, translate reminder emails, power the website chat assistant and summarise totals for administrators. We send only what is needed: for enquiry replies the first name, program, age range and message (never phone number or email); for summaries only totals without student names; for the chat assistant only what the visitor types. Please do not enter personal details in the chat. AI drafts are always reviewed by our staff before being sent, and the site works without AI.',
        'Zoho Catalyst: the hosting platform on which the website and portal run.',
        'Google Fonts and Google Maps: used to display fonts and our location on the website. Your browser may send standard request data (such as IP address) to Google when these load.',
      ] },
      'We may also disclose information if required by law, court order or a government authority, or to protect the safety and rights of children, our staff or others. Our teachers and administrators can see only the records they need: staff see their own batches and students, and only administrators manage fees and settings.',
    ],
  },
  {
    id: 'cookies', title: 'Cookies and similar technologies',
    body: [
      'When you sign in to the staff or admin portal we set strictly necessary cookies (an access token and a refresh token). They are marked HttpOnly and, in production, Secure, so scripts cannot read them, and they are used only to keep you signed in. We do not use them for tracking or advertising.',
      'The public website does not use advertising or cross-site tracking cookies. Your browser may store ordinary local preferences. You can block cookies in your browser, but the portal will not work without the sign-in cookies. A full list of every cookie we use is in our Cookie Policy at /cookie-policy.',
    ],
  },
  {
    id: 'storage-security', title: 'Where data is stored and how we protect it',
    body: [
      'Data is stored with the cloud providers listed above and may be processed on servers outside your city or country. We take reasonable security steps appropriate to the data, including:',
      { list: [
        'Encrypted connections (HTTPS) and private cloud storage with short-lived access links.',
        'Passwords stored only as salted one-way hashes, account lock-out after repeated failed sign-ins, and automatic sign-out of deactivated accounts.',
        'Role-based access: every request is checked on the server, and staff cannot open administrator areas or other teachers\' data.',
        'Input validation, rate limiting, and an audit log of changes to important records such as attendance corrections and payments.',
        'Limiting uploads to JPG, PNG and PDF files up to 5 MB and removing files that do not meet these limits.',
      ] },
      'No system is perfectly secure. If a personal-data breach occurs that is likely to affect you, we will investigate promptly and notify the affected people and the authorities as required by law.',
    ],
  },
  {
    id: 'retention', title: 'How long we keep information',
    body: [
      'We keep personal data only as long as it is needed for the purpose it was collected, or as the law requires.',
      { list: [
        'Enquiries that do not lead to admission: kept for up to 24 months so we can follow up, then deleted or anonymised.',
        'Student, attendance and learning records: kept while the child is enrolled and for a reasonable period afterwards for reference and certificates.',
        'Fee and payment records and receipts: kept for the period required by Indian tax and accounting laws.',
        'Staff records: kept during employment and for the period needed for legal and administrative purposes after it ends.',
        'Security and audit logs: kept for a limited period for security and dispute resolution.',
      ] },
      'When data is no longer needed we delete it or remove the details that identify a person.',
    ],
  },
  {
    id: 'rights', title: 'Your rights',
    body: [
      'Subject to applicable law, you (or a parent or guardian acting for a child) may:',
      { list: [
        'ask for a summary of the personal data we hold and how it is used;',
        'ask us to correct inaccurate or incomplete data and to update it;',
        'ask us to erase data that is no longer needed, unless we must keep it by law;',
        'withdraw consent for processing that depends on consent;',
        'nominate another person to exercise these rights on your behalf; and',
        'raise a grievance with us and, if it is not resolved, with the Data Protection Board of India.',
      ] },
      'To make a request, email globaleducationgv@gmail.com or call +91 93630 42019. We may need to verify your identity (and, for a child, the parent or guardian\'s identity) before acting, and we aim to respond within a reasonable time.',
    ],
  },
  {
    id: 'children', title: 'Children\'s privacy',
    body: [
      'Our programs are designed for children, but our website and enquiry form are meant for parents and guardians. We ask for a child\'s details only through a parent or guardian or during admission. Parents may review, correct or ask us to delete their child\'s information at any time by contacting us.',
      'Photographs or videos of children are used for marketing (for example in our gallery or on social media) only with the parent\'s or guardian\'s permission. You may withdraw that permission at any time and we will stop using the material going forward.',
    ],
  },
  {
    id: 'communications', title: 'Emails and calls',
    body: [
      'We send service messages such as fee reminders, receipts, password resets and responses to your enquiries. These are needed to run your account or follow up your request. If you have asked us to stop contacting you, tell us and we will do so, except for messages we must send about fees due or legal matters.',
    ],
  },
  {
    id: 'links', title: 'Links to other websites',
    body: ['Our website may link to or embed third-party services such as maps. They have their own privacy practices and we are not responsible for them. Please read their policies.'],
  },
  {
    id: 'changes', title: 'Changes to this policy',
    body: ['We may update this policy from time to time, for example when we add a feature or when the law changes. The "Last updated" date at the top shows the latest version. Material changes will be highlighted on the website or sent to you where appropriate.'],
  },
  {
    id: 'contact', title: 'Contact and grievances',
    body: [
      'Questions, requests or complaints about privacy can be sent to:',
      { list: [
        'Global Edutech, 69, Rajiv Gandhi Nagar, Uppilipalayam, Coimbatore, Tamil Nadu 641015',
        'Email: globaleducationgv@gmail.com',
        'Phone: +91 93630 42019 (Mon-Sat)',
      ] },
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Your trust matters to us, especially because we work with children. This policy explains in plain language what personal information Global Edutech collects, why we collect it, who can see it, how we protect it and what choices you have."
      sections={sections}
      other={{ href: '/terms-of-service', label: 'Read the Terms of Service' }}
    />
  )
}
