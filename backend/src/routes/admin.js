import { Router } from 'express';
import { ObjectId } from 'mongodb';
import ExcelJS from 'exceljs';
import { enquiries } from '../lib/mongodb.js';
import {
  generateToken, validateCredentials, setAuthCookie, clearAuthCookie, requireAdmin,
} from '../lib/auth.js';
import { isProd } from '../lib/config.js';

const router = Router();

const VALID_STATUSES = ['New', 'Contacted', 'In Progress', 'Enrolled', 'Closed'];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The dashboard sorts by "timestamp"; stored documents use createdAt
const sortField = (param) => (param === 'timestamp' ? 'createdAt' : param);

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!validateCredentials(username, password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    setAuthCookie(res, await generateToken());
    res.json({ message: 'Authentication successful', success: true, redirectTo: '/admin/dashboard' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logout successful' });
});

// Development convenience only
router.post('/auto-login', async (req, res) => {
  if (isProd) return res.status(403).json({ error: 'Auto-login not available in production' });
  try {
    setAuthCookie(res, await generateToken());
    res.json({ message: 'Auto-login successful' });
  } catch {
    res.status(500).json({ error: 'Auto-login failed' });
  }
});

router.get('/submissions', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const sortBy = sortField(req.query.sortBy || 'timestamp');
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const status = req.query.status || 'all';

    const filter = status !== 'all'
      ? { status: { $regex: `^${escapeRegex(String(status))}$`, $options: 'i' } }
      : {};

    const collection = await enquiries();
    const totalCount = await collection.countDocuments(filter);
    const submissions = await collection
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      submissions,
      pagination: { totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page, limit },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.put('/submissions', requireAdmin, async (req, res) => {
  try {
    const { id, status } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'Missing required fields: id and status' });
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status value' });
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID format' });

    const result = await (await enquiries()).updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Submission not found' });

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({ error: 'Failed to update submission status' });
  }
});

router.get('/export', requireAdmin, async (req, res) => {
  try {
    const sortBy = sortField(req.query.sortBy || 'timestamp');
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const submissions = await (await enquiries()).find({}).sort({ [sortBy]: sortOrder }).toArray();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Global Edutech Admin';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Submissions');
    sheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Program/Course', key: 'program', width: 25 },
      { header: 'Message', key: 'message', width: 50 },
      { header: 'Student Age', key: 'studentAge', width: 12 },
      { header: 'Preferred Time', key: 'preferredTime', width: 20 },
      { header: 'Form Type', key: 'formType', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date Submitted', key: 'createdAt', width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const s of submissions) {
      sheet.addRow({
        name: s.name || 'N/A',
        email: s.email || 'N/A',
        phone: s.phone || 'N/A',
        program: s.program || s.course || 'N/A',
        message: s.message || 'N/A',
        studentAge: s.studentAge || 'N/A',
        preferredTime: s.preferredTime || 'N/A',
        formType: s.formType || 'Program Enquiry',
        status: s.status || 'new',
        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleString() : 'N/A',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="global-edutech-submissions.xlsx"',
    });
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error exporting submissions:', error);
    res.status(500).json({ error: 'Failed to export submissions' });
  }
});

export default router;
