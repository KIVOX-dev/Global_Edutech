import { Router } from 'express';
import { enquiries } from '../lib/mongodb.js';
import { sendEnquiryNotification } from '../lib/email-service.js';

const router = Router();

router.post('/submit-form', async (req, res) => {
  try {
    const { formType, ...formData } = req.body || {};
    const { name, email, phone, message, program } = formData;
    if (!name || !email || !phone || !message || !program) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await (await enquiries()).insertOne({
      ...formData,
      formType: formType || 'Program Enquiry',
      createdAt: new Date(),
      status: 'new',
    });

    await sendEnquiryNotification(formData);

    res.json({ success: true, message: 'Form submitted successfully', id: result.insertedId });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, message: 'Error submitting form. Please try again.' });
  }
});

export default router;
