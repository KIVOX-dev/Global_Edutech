// Default reminder templates. Placeholders: {student_name} {parent_name} {amount_due} {due_date}
// {course} {institute_name} {payment_instructions}
export const DEFAULT_TEMPLATES = {
  beforeDue: {
    subject: 'Fee reminder: {amount_due} due on {due_date}',
    html: '<p>Dear {parent_name},</p><p>This is a friendly reminder that a fee instalment of <strong>{amount_due}</strong> for <strong>{student_name}</strong> ({course}) is due on <strong>{due_date}</strong>.</p><p>{payment_instructions}</p><p>Regards,<br/>{institute_name}</p>',
  },
  dueToday: {
    subject: 'Fee due today: {amount_due} for {student_name}',
    html: '<p>Dear {parent_name},</p><p>The fee instalment of <strong>{amount_due}</strong> for <strong>{student_name}</strong> ({course}) is due <strong>today ({due_date})</strong>.</p><p>{payment_instructions}</p><p>Regards,<br/>{institute_name}</p>',
  },
  overdue: {
    subject: 'Overdue fee: {amount_due} for {student_name}',
    html: '<p>Dear {parent_name},</p><p>The fee instalment of <strong>{amount_due}</strong> for <strong>{student_name}</strong> ({course}) was due on <strong>{due_date}</strong> and is now overdue. Please clear it at the earliest.</p><p>{payment_instructions}</p><p>If you have already paid, please ignore this message.</p><p>Regards,<br/>{institute_name}</p>',
  },
};

// Built-in Tamil and Hindi versions of the default reminders. They are used when a language is selected and no
// custom translation has been saved, and as the fallback when the AI translator is unavailable.
export const TRANSLATIONS = {
  ta: {
    beforeDue: {
      subject: 'கட்டண நினைவூட்டல்: {amount_due} - {due_date} அன்று செலுத்த வேண்டும்',
      html: '<p>அன்புள்ள {parent_name},</p><p>{student_name} ({course}) அவர்களின் கட்டணத் தவணை <strong>{amount_due}</strong> தொகையை <strong>{due_date}</strong> அன்று செலுத்த வேண்டும்.</p><p>{payment_instructions}</p><p>நன்றி,<br/>{institute_name}</p>',
    },
    dueToday: {
      subject: 'இன்று கட்டணம் செலுத்தும் நாள்: {amount_due} - {student_name}',
      html: '<p>அன்புள்ள {parent_name},</p><p>{student_name} ({course}) அவர்களின் கட்டணத் தவணை <strong>{amount_due}</strong> தொகையை <strong>இன்று ({due_date})</strong> செலுத்த வேண்டும்.</p><p>{payment_instructions}</p><p>நன்றி,<br/>{institute_name}</p>',
    },
    overdue: {
      subject: 'நிலுவைக் கட்டணம்: {amount_due} - {student_name}',
      html: '<p>அன்புள்ள {parent_name},</p><p>{student_name} ({course}) அவர்களின் கட்டணத் தவணை <strong>{amount_due}</strong> தொகையை <strong>{due_date}</strong> அன்று செலுத்தியிருக்க வேண்டும்; தற்போது அது நிலுவையில் உள்ளது. தயவுசெய்து விரைவில் செலுத்தவும்.</p><p>{payment_instructions}</p><p>ஏற்கனவே செலுத்தியிருந்தால் இந்தச் செய்தியைப் புறக்கணிக்கவும்.</p><p>நன்றி,<br/>{institute_name}</p>',
    },
  },
  hi: {
    beforeDue: {
      subject: 'फीस रिमाइंडर: {amount_due} - {due_date} तक देय',
      html: '<p>प्रिय {parent_name},</p><p>{student_name} ({course}) की फीस किस्त <strong>{amount_due}</strong>, <strong>{due_date}</strong> तक जमा करनी है।</p><p>{payment_instructions}</p><p>धन्यवाद,<br/>{institute_name}</p>',
    },
    dueToday: {
      subject: 'आज फीस जमा करने की तिथि: {amount_due} - {student_name}',
      html: '<p>प्रिय {parent_name},</p><p>{student_name} ({course}) की फीस किस्त <strong>{amount_due}</strong> <strong>आज ({due_date})</strong> जमा करनी है।</p><p>{payment_instructions}</p><p>धन्यवाद,<br/>{institute_name}</p>',
    },
    overdue: {
      subject: 'बकाया फीस: {amount_due} - {student_name}',
      html: '<p>प्रिय {parent_name},</p><p>{student_name} ({course}) की फीस किस्त <strong>{amount_due}</strong> <strong>{due_date}</strong> को देय थी और अब बकाया है। कृपया जल्द से जल्द भुगतान करें।</p><p>{payment_instructions}</p><p>यदि आप भुगतान कर चुके हैं तो कृपया इस संदेश को अनदेखा करें।</p><p>धन्यवाद,<br/>{institute_name}</p>',
    },
  },
};

export const LANGUAGES = { en: 'English', ta: 'Tamil', hi: 'Hindi' };
