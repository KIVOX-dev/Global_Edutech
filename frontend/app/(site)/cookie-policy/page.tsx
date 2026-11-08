import LegalPage, { LegalSection } from '@/components/shared/LegalPage'

export const metadata = {
  title: 'Cookie Policy | Global Edutech',
  description: 'The cookies and similar storage Global Edutech uses on its website and staff portal, why we use them and how to control them.',
}

const sections: LegalSection[] = [
  {
    id: 'what-are-cookies', title: 'What are cookies',
    body: [
      'Cookies are small text files that a website saves in your browser. Similar technologies, such as your browser\'s local storage, work in the same way. They let a site remember that you are signed in or remember a choice you made.',
      'This policy explains which of these Global Edutech uses and what you can do about them. It should be read together with our Privacy Policy.',
    ],
  },
  {
    id: 'what-we-use', title: 'What we use and why',
    body: [
      'We keep this list short on purpose. We do not use advertising cookies, we do not use analytics or tracking cookies, and we do not build profiles of visitors or children.',
      { list: [
        'Strictly necessary: "access_token" is a sign-in cookie for the staff and admin portal. It is set only after you sign in, lasts about 15 minutes and renews while you stay signed in. It is HttpOnly (scripts cannot read it) and Secure on the live site.',
        'Strictly necessary: "refresh_token" keeps you signed in without asking for your password again. It is set only after you sign in, lasts up to 7 days, is sent only to our sign-in service, and is HttpOnly and Secure on the live site. It is deleted when you sign out.',
        'Preference (browser storage): "theme" remembers whether you prefer a light or dark appearance. It never leaves your device.',
        'Preference (browser storage): "ge-cookie-consent" remembers the choice you made on the cookie notice so we do not ask again on every visit. It never leaves your device.',
        'Third party, only on the login page: if "Continue with Google" is shown, Google loads its own sign-in button and may set its own cookies to make sign-in work. This happens only after you choose "Accept all", and we do not receive those cookies.',
      ] },
      'Visitors who only browse the public website, without signing in, receive none of the sign-in cookies.',
    ],
  },
  {
    id: 'your-choices', title: 'Your choices',
    body: [
      'When you first visit, a notice lets you choose "Accept all" or "Essential only". Essential only keeps the strictly necessary cookies and turns off the optional ones, which means the Google sign-in button is not loaded until you accept. You can still sign in with your email and password.',
      'You can change your mind at any time with the "Cookie settings" link in the footer of every public page.',
      'You can also delete or block cookies in your browser settings. If you block the strictly necessary cookies, the staff and admin portal cannot keep you signed in and will not work.',
    ],
  },
  {
    id: 'third-parties', title: 'Third parties',
    body: [
      'Our website fonts are included in the site itself, so loading a page does not send your data to a font provider. The only third party that can set cookies is Google, and only through the optional sign-in button on the login page. Google\'s use of its cookies is described in Google\'s own privacy policy.',
    ],
  },
  {
    id: 'children', title: 'Children',
    body: ['Our website is meant for parents and guardians. We do not knowingly use cookies to track or target children.'],
  },
  {
    id: 'changes', title: 'Changes to this policy',
    body: ['If we add a new cookie or change how we use one, we will update this page and the "Last updated" date. If the change needs your consent, we will ask again.'],
  },
  {
    id: 'contact', title: 'Contact',
    body: [
      'Questions about cookies can be sent to:',
      { list: [
        'Global Edutech, 69, Rajiv Gandhi Nagar, Uppilipalayam, Coimbatore, Tamil Nadu 641015',
        'Email: globaleducationgv@gmail.com',
        'Phone: +91 93630 42019 (Mon-Sat)',
      ] },
    ],
  },
]

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="We use as few cookies as possible. This page lists every cookie and similar storage our website and portal use, what each one is for, and how you can control them."
      sections={sections}
      other={{ href: '/privacy-policy', label: 'Read the Privacy Policy' }}
    />
  )
}
