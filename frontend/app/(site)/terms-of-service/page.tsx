import LegalPage, { LegalSection } from '@/components/shared/LegalPage'

export const metadata = {
  title: 'Terms of Service | Global Edutech',
  description: 'The terms that apply to using the Global Edutech website, enrolling in our programs and using the staff and admin portal.',
}

const sections: LegalSection[] = [
  {
    id: 'agreement', title: 'About these terms',
    body: [
      'These Terms of Service ("Terms") are an agreement between you and Global Edutech ("we", "us"), 69, Rajiv Gandhi Nagar, Uppilipalayam, Coimbatore, Tamil Nadu 641015, India. They apply when you visit our website, send an enquiry, enrol a child in any of our programs (Global Kids, Global Education, Global Academy, Tuition Point and related courses) or use our staff and admin portal.',
      'By using the website or enrolling, you confirm that you have read and accept these Terms and our Privacy Policy. If you do not agree, please do not use the website or enrol. If you are enrolling a child, you confirm that you are the child\'s parent or lawful guardian and are authorised to accept these Terms for them.',
    ],
  },
  {
    id: 'website', title: 'Using the website',
    body: [
      { list: [
        'The website is provided for general information about our programs and to let you contact us. Course details, age groups, timings and schedules are descriptive and may change.',
        'You agree to use the site lawfully. You must not attempt to break into, overload or interfere with the site or the portal, scrape personal data, upload malicious code, or submit false or harmful information.',
        'The enquiry form is for genuine enquiries. We may limit submissions or block abusive use.',
      ] },
    ],
  },
  {
    id: 'programs', title: 'Programs and enrolment',
    body: [
      'Submitting an enquiry does not guarantee a seat. A place is confirmed only when we accept the admission and you have completed the admission formalities and paid the applicable fee as communicated to you.',
      { list: [
        'Information you give us (names, contact details, the child\'s age and any medical, dietary or learning needs we should know about) must be accurate and kept up to date. Please tell us promptly about changes and any health or safety matters affecting your child.',
        'We may group children into batches by age, level and availability, and may change a batch, teacher, venue, timing or mode (offline, online or at home) where reasonably needed. We will tell you in advance wherever we can.',
        'Free demo classes are offered at our discretion and do not oblige either side to continue.',
        'Home-tuition sessions take place at the address you provide. You agree to provide a safe, suitable environment and an adult present or reachable during sessions with children.',
        'We may refuse or end enrolment where the information given is false, where conduct is unsafe or disruptive, or where fees are not paid, in line with these Terms.',
      ] },
    ],
  },
  {
    id: 'fees', title: 'Fees and payments',
    body: [
      { list: [
        'Fees, instalment amounts and due dates are those communicated to you in writing at admission or shown on your fee schedule. Fees are stated in Indian rupees.',
        'Payments can be made by the modes we accept (such as cash, UPI, card, bank transfer or cheque). Please keep your receipt or payment reference. We issue a receipt for each payment recorded.',
        'If an instalment is not paid by its due date it becomes overdue. We send reminders by email to the student and parent contact details you gave us. Continued non-payment may lead to suspension of classes or certificates until dues are cleared.',
        'Refunds, transfers and fee adjustments, if any, follow the fee policy given to you at admission. Fees already paid are not refundable unless that policy or the law says otherwise.',
        'If a payment is recorded incorrectly, we will correct it and the audit record will show the change. Please tell us promptly if you believe a record is wrong.',
      ] },
    ],
  },
  {
    id: 'attendance', title: 'Attendance, conduct and safety',
    body: [
      { list: [
        'Regular attendance helps learning. Attendance is recorded by our teachers each class day, and parents may ask about it at any time. Holidays and non-working days are not counted.',
        'Students are expected to be respectful to teachers and other children. Bullying, violence, damage to property or conduct that endangers others is not allowed and may lead to a warning, suspension or removal.',
        'Parents must drop off and collect children at the times agreed and must tell us who is authorised to collect a child. Children will be released only to authorised persons.',
        'Please keep your child at home when unwell with an illness that may spread, and tell us about absences.',
        'We take reasonable care of children while they are with us. Valuables and personal belongings are brought at the owner\'s risk.',
      ] },
    ],
  },
  {
    id: 'accounts', title: 'Staff and admin portal accounts',
    body: [
      'Accounts are created by an administrator for staff. If you have an account, you agree to:',
      { list: [
        'keep your password confidential, choose a strong password and change the temporary password at first sign-in;',
        'use the portal only for your work with us and access only the records you are authorised to see;',
        'enter attendance, leave and other information accurately and promptly; and',
        'tell an administrator at once if you suspect your account has been misused.',
      ] },
      'Actions in the portal are logged. We may suspend or remove access at any time for security reasons or when your engagement ends. Misuse of student or parent information may lead to disciplinary and legal action.',
    ],
  },
  {
    id: 'content', title: 'Intellectual property',
    body: [
      'The Global Edutech, Global Kids, Global Education, Global Academy, Global Abacus, Global Arts, Global English, Global Handwriting, Global Vedic Maths and Tuition Point names and logos, together with our course material, worksheets, text, graphics and website design, belong to us or our licensors and are protected by law.',
      'You may view and print material for your own personal, non-commercial use for your child\'s learning. You may not copy, distribute, resell, record, publish or create derivative works from our material or classes without our written permission.',
    ],
  },
  {
    id: 'photos', title: 'Photographs and media',
    body: ['With a parent or guardian\'s permission we may take photographs or videos during classes and events and use them in our gallery, brochures or social media to show what we do. We will not use a child\'s image in this way without permission. You may withdraw permission at any time by contacting us, and we will stop future use.'],
  },
  {
    id: 'privacy', title: 'Privacy',
    body: ['Our Privacy Policy explains how we collect, use, store and protect personal information, including that of children. It forms part of these Terms.'],
  },
  {
    id: 'disclaimer', title: 'Disclaimers',
    body: [
      'We aim to give high-quality teaching, but learning outcomes depend on many factors, including the child\'s effort, attendance and practice. We do not guarantee specific marks, ranks, certificates, admissions or job outcomes. Any improvement figures we mention are indicative.',
      'The website and portal are provided "as is" and "as available". We try to keep them secure and available but do not promise they will always be uninterrupted or error-free, and they may be unavailable for maintenance or due to events beyond our control.',
    ],
  },
  {
    id: 'liability', title: 'Limitation of liability',
    body: [
      'To the fullest extent permitted by law, Global Edutech is not liable for indirect, incidental or consequential losses, or for loss caused by events outside our reasonable control (such as natural events, power or internet failure, public health directions or government orders).',
      'Nothing in these Terms excludes or limits liability that cannot be excluded or limited under Indian law, including liability for fraud or for death or personal injury caused by our negligence. Subject to that, our total liability for any claim relating to a program is limited to the fees you paid for that program for the period concerned.',
    ],
  },
  {
    id: 'termination', title: 'Suspension and termination',
    body: [
      'You may stop attending or end enrolment by telling us in writing, subject to the fee policy given at admission. We may suspend or end enrolment or portal access where these Terms are breached, fees remain unpaid, information is false, or safety requires it. Sections that by their nature should continue (such as intellectual property, fees due and liability) continue after termination.',
    ],
  },
  {
    id: 'law', title: 'Governing law and disputes',
    body: [
      'These Terms are governed by the laws of India. We would like to resolve any concern directly, so please contact us first. If a dispute cannot be resolved by discussion, the courts at Coimbatore, Tamil Nadu will have jurisdiction, subject to any mandatory rights you have under law.',
    ],
  },
  {
    id: 'changes', title: 'Changes to these terms',
    body: ['We may update these Terms from time to time. The "Last updated" date shows the latest version. Continued use of the website, the portal or our programs after a change means you accept the updated Terms. We will give notice of significant changes where appropriate.'],
  },
  {
    id: 'contact', title: 'Contact us',
    body: [
      'Questions about these Terms can be sent to:',
      { list: [
        'Global Edutech, 69, Rajiv Gandhi Nagar, Uppilipalayam, Coimbatore, Tamil Nadu 641015',
        'Email: globaleducationgv@gmail.com',
        'Phone: +91 93630 42019 (Mon-Sat)',
      ] },
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms explain the rules for using the Global Edutech website, enrolling a child in our programs and using our staff and admin portal. Please read them together with our Privacy Policy."
      sections={sections}
      other={{ href: '/privacy-policy', label: 'Read the Privacy Policy' }}
    />
  )
}
