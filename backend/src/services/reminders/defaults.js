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
