// ===== server.js - Backend מתוקן עם logging טוב יותר =====
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8787;


app.use(cors({
  origin: ['https://danateck.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-Email', 'X-User-Email', 'X-Folder-Id', 'X-Shared-Access'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors());

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const nodemailer = require('nodemailer');

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


app.post('/api/auth/send-2fa', async (req, res) => {
  try {
    const userEmail = req.body.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // קוד 6 ספרות
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();

    // שומרות קוד בטבלה כמו קודם
    await pool.query(
      `INSERT INTO login_codes (email, code, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (email) DO UPDATE SET code = $2, created_at = NOW()`,
      [userEmail, code]
    );

    // ❌ לא שולחים יותר מייל דרך Nodemailer / SMTP
    // await mailer.sendMail({ ... });

    // ✅ שולחים את הקוד לפרונט שישלח אותו במייל דרך EmailJS
    res.json({ success: true, code });
  } catch (err) {
    console.error('❌ 2FA mail error:', err);
    res.status(500).json({ error: 'Failed to generate 2FA code' });
  }
});



app.post("/api/auth/verify-2fa", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Missing email or code" });
  }

  const result = await pool.query(
    "SELECT code FROM login_codes WHERE email = $1",
    [email]
  );

  if (!result.rows.length) {
    return res.status(400).json({ error: "No code found" });
  }

  const correct = result.rows[0].code;

  if (correct !== code) {
    return res.status(401).json({ error: "Invalid code" });
  }

  // success  
  return res.json({ success: true });
});




pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL error:', err.stack);
  } else {
    console.log('✅ PostgreSQL connected');
    release();
  }
});




// ===== Logging middleware =====
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  console.log('📋 Headers:', {
    'x-dev-email': req.headers['x-dev-email'],
    'x-user-email': req.headers['x-user-email'],
    'authorization': req.headers.authorization ? 'Bearer ...' : 'none'
  });
  next();
});

// ===== File Upload =====
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ===== Helper: Get user from request =====
function getUserFromRequest(req) {
  // Dev mode - email in header (priority!)
  const devEmail = req.headers['x-dev-email'] || req.headers['x-user-email'];
  if (devEmail) {
    const email = devEmail.toLowerCase().trim();
    console.log('✅ User from header:', email);
    return email;
  }
  
  // Firebase token (future)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('⚠️ Firebase token found but not verified yet');
    // TODO: Verify token
  }
  
  console.log('❌ No user found in request');
  return null;
}

// ===== Create Tables =====
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        owner VARCHAR(255) NOT NULL,
        title VARCHAR(500),
        file_name VARCHAR(500),
        file_size BIGINT,
        mime_type VARCHAR(100),
        file_data BYTEA,
        category VARCHAR(100),
        sub_category VARCHAR(100),
        year VARCHAR(10),
        org VARCHAR(255),
        recipient JSONB,
        shared_with JSONB,
        deleted_for JSONB DEFAULT '{}',
        warranty_start VARCHAR(50),
        warranty_expires_at VARCHAR(50),
        auto_delete_after VARCHAR(50),
        uploaded_at BIGINT,
        last_modified BIGINT,
        last_modified_by VARCHAR(255),
        deleted_at BIGINT,
        deleted_by VARCHAR(255),
        trashed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_owner ON documents(owner);
      CREATE INDEX IF NOT EXISTS idx_shared ON documents USING GIN(shared_with);
      CREATE INDEX IF NOT EXISTS idx_deleted_for ON documents USING GIN(deleted_for);
      CREATE INDEX IF NOT EXISTS idx_trashed ON documents(trashed);

      CREATE TABLE IF NOT EXISTS login_codes (
        email VARCHAR(255) PRIMARY KEY,
        code VARCHAR(6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error);
  }
}

initDB().then(() => addMissingColumns());

// ===== API ENDPOINTS =====

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: Date.now(),
    database: pool ? 'connected' : 'disconnected'
  });
});

// Test auth endpoint
app.get('/api/test-auth', (req, res) => {
  const user = getUserFromRequest(req);
  res.json({
    authenticated: !!user,
    user: user,
    headers: {
      'x-dev-email': req.headers['x-dev-email'],
      'authorization': req.headers.authorization ? 'present' : 'missing'
    }
  });
});

// 1️⃣ GET /api/docs - Load documents
app.get('/api/docs', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) {
      console.log('❌ Unauthorized: no user email');
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    console.log('📂 Loading docs for:', userEmail);

    const result = await pool.query(`
      SELECT 
  id, owner, title, file_name, file_size, mime_type,
  category, sub_category, year, org, recipient, shared_with,
  warranty_start, warranty_expires_at, auto_delete_after,
  uploaded_at, last_modified, last_modified_by,
  deleted_at, deleted_by, trashed, deleted_for
FROM documents
WHERE (owner = $1 OR shared_with ? $1)
  AND NOT (deleted_for ? $1)
ORDER BY uploaded_at DESC

    `, [userEmail]);

    console.log(`✅ Found ${result.rows.length} documents`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Load error:', error);
    res.status(500).json({ error: 'Failed to load documents' });
  }
});

// 2️⃣ POST /api/docs - Upload document
app.post('/api/docs', upload.single('file'), async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) {
      console.log('❌ Upload unauthorized: no user');
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📤 Upload from:', userEmail);
    console.log('📄 File:', file.originalname, file.size, 'bytes');

    const id = require('crypto').randomUUID();
    const now = Date.now();
    
    const {
  title = file.originalname,
  category = 'אחר',
  subCategory = '',
  year = new Date().getFullYear().toString(),
  org = '',
  recipient = '[]',
  warrantyStart,
  warrantyExpiresAt,
  autoDeleteAfter
} = req.body;


    const recipientArray = JSON.parse(recipient || '[]');
    const sharedWith = [];

    await pool.query(`
      INSERT INTO documents (
  id, owner, title, file_name, file_size, mime_type, file_data,
  category, sub_category, year, org, recipient, shared_with,
  warranty_start, warranty_expires_at, auto_delete_after,
  uploaded_at, last_modified, last_modified_by, trashed
) VALUES ($1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20)

    `, [
  id, userEmail, title, file.originalname, file.size, file.mimetype, file.buffer,
  category, subCategory, year, org, JSON.stringify(recipientArray), JSON.stringify(sharedWith),
  warrantyStart || null, warrantyExpiresAt || null, autoDeleteAfter || null,
  now, now, userEmail, false
]
);

    console.log(`✅ Uploaded: ${id}`);
    
    res.json({
      id,
      owner: userEmail,
      title,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_at: now
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 3️⃣ GET /api/docs/:id/download - Download file
// 3️⃣ GET /api/docs/:id/download - Download file (FIXED)
app.get('/api/docs/:id/download', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { id } = req.params;
    console.log('📥 Download request:', { id, user: userEmail });

    const result = await pool.query(`
      SELECT file_data, file_name, mime_type, owner, shared_with
      FROM documents
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      console.log('❌ Document not found:', id);
      return res.status(404).json({ error: 'Not found' });
    }

    const doc = result.rows[0];
    
    // 🔑 Parse shared_with properly
    let sharedWith = [];
    if (doc.shared_with) {
      if (typeof doc.shared_with === 'string') {
        try { sharedWith = JSON.parse(doc.shared_with); } catch (e) { sharedWith = []; }
      } else if (Array.isArray(doc.shared_with)) {
        sharedWith = doc.shared_with;
      }
    }
    
    // Normalize to lowercase
    sharedWith = sharedWith.map(e => (e || '').toLowerCase());
    const ownerEmail = (doc.owner || '').toLowerCase();
    const requestingUser = userEmail.toLowerCase();

    console.log('🔐 Access check:', { owner: ownerEmail, user: requestingUser, sharedWith });
    
    // Check access
    if (ownerEmail !== requestingUser && !sharedWith.includes(requestingUser)) {
      console.log('❌ Access denied for:', requestingUser);
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!doc.file_data) {
      return res.status(404).json({ error: 'No file data' });
    }

    console.log('✅ Sending file:', doc.file_name);
    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.file_name)}"`);
    res.send(doc.file_data);
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// 4️⃣ PUT /api/docs/:id - Update document
app.put('/api/docs/:id', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { id } = req.params;
    const updates = req.body;

    const checkResult = await pool.query('SELECT owner FROM documents WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (checkResult.rows[0].owner !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
  'title',
  'category',
  'year',
  'org',
  'recipient',
  'shared_with',
  'warranty_start',
  'warranty_expires_at',
  'auto_delete_after'
];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(typeof updates[field] === 'object' ? JSON.stringify(updates[field]) : updates[field]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push(`last_modified = $${paramIndex}`);
    values.push(Date.now());
    paramIndex++;

    fields.push(`last_modified_by = $${paramIndex}`);
    values.push(userEmail);
    paramIndex++;

    values.push(id);

    await pool.query(`
      UPDATE documents
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `, values);

    console.log(`✅ Updated: ${id}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ Update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// 5️⃣ PUT /api/docs/:id/trash - Move to/from trash
app.put('/api/docs/:id/trash', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { id } = req.params;
    const { trashed } = req.body;

    const result = await pool.query(`
      UPDATE documents
      SET trashed = $1, last_modified = $2, last_modified_by = $3
      WHERE id = $4 AND owner = $5
      RETURNING *
    `, [trashed, Date.now(), userEmail, id, userEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found or access denied' });
    }

    console.log(`✅ ${trashed ? 'Trashed' : 'Restored'}: ${id}`);
    res.json({ success: true, id, trashed });
  } catch (error) {
    console.error('❌ Trash error:', error);
    res.status(500).json({ error: 'Trash operation failed' });
  }
});

// 6️⃣ DELETE /api/docs/:id - Delete permanently (respect shared users)
app.delete('/api/docs/:id', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const userEmail = userEmailRaw.trim().toLowerCase();
    const { id } = req.params;

    // טוענים את המסמך מה-DB
    const result = await pool.query(
      `SELECT owner, shared_with, deleted_for
       FROM documents
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      // 🆕 אם המסמך לא קיים בשרת בכלל - נאשר מחיקה מלאה
      console.log('📝 Document not in backend, approving full deletion');
      return res.json({ 
        ok: true, 
        deletedForAll: true,
        notInBackend: true  // דגל חדש
      });
    }

    const row = result.rows[0];

    // 🔹 בעלים
    let owner = (row.owner || '').trim().toLowerCase();

    // 🔹 פירוק shared_with למערך אימיילים
    let sharedWithArr = [];
    const sw = row.shared_with;

    if (Array.isArray(sw)) {
      // shared_with הוא כבר מערך
      sharedWithArr = sw
        .map(e => String(e || '').trim().toLowerCase())
        .filter(Boolean);
    } else if (sw && typeof sw === 'object') {
      // במקרה שנשמר כאובייקט { email: true }
      sharedWithArr = Object.keys(sw)
        .filter(k => sw[k])
        .map(k => String(k || '').trim().toLowerCase());
    } else if (typeof sw === 'string' && sw.trim()) {
      // במקרה נדיר שנשמר כמחרוזת JSON
      try {
        const parsed = JSON.parse(sw);
        if (Array.isArray(parsed)) {
          sharedWithArr = parsed
            .map(e => String(e || '').trim().toLowerCase())
            .filter(Boolean);
        }
      } catch (e) {
        console.warn('shared_with is string but not JSON:', sw);
      }
    }

    const isOwner = owner === userEmail;
    const isSharedWithUser = sharedWithArr.includes(userEmail);

    // 🆕 בדיקה: אם המשתמש הנוכחי הוא הבעלים ואין שיתופים פעילים
    const hasNoActiveShares = sharedWithArr.length === 0;

    // אם המשתמש בכלל לא קשור למסמך – חסימה
    if (!isOwner && !isSharedWithUser) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    // 🆕 אם הבעלים מוחק ואין שיתופים - מחיקה מלאה מיידית
    if (isOwner && hasNoActiveShares) {
      console.log('📝 Owner deleting doc with no active shares - full deletion');
      await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
      return res.json({ 
        ok: true, 
        deletedForAll: true,
        reason: 'owner_with_no_shares'
      });
    }

    // 🔹 ניהול deleted_for – מי כבר מחק לצמיתות
    let deletedFor = row.deleted_for || {};
    if (typeof deletedFor === 'string') {
      try {
        deletedFor = JSON.parse(deletedFor) || {};
      } catch {
        deletedFor = {};
      }
    }
    if (!deletedFor || typeof deletedFor !== 'object') {
      deletedFor = {};
    }

    // מסמנים שהמשתמש הנוכחי מחק לצמיתות
    deletedFor[userEmail] = true;

    // כל המשתתפים במסמך = בעלים + כל מי ששיתפת אליו
    const participants = new Set(
      [owner, ...sharedWithArr].filter(Boolean)
    );

    // משתתפים שעדיין *לא* מחקו
    const activeParticipants = [...participants].filter(
      email => !deletedFor[email]
    );

    // 🎯 מקרה 1: כולם מחקו לצמיתות → מוחקים מהרנדר
    if (activeParticipants.length === 0) {
      await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
      return res.json({ ok: true, deletedForAll: true });
    }

    // 🎯 מקרה 2: עדיין יש מישהו שלא מחק → משאירים, רק מסתירים ממי שמחק

    // אם הבעלים מחק – מעבירים בעלות למשתתף הראשון שעוד קיים
    if (deletedFor[owner]) {
      owner = activeParticipants[0];
    }

    await pool.query(
      `UPDATE documents
       SET owner = $1,
           deleted_for = $2,
           last_modified = $3,
           last_modified_by = $4
       WHERE id = $5`,
      [owner, deletedFor, Date.now(), userEmailRaw, id]
    );

    return res.json({
      ok: true,
      deletedForAll: false,
      newOwner: owner
    });
  } catch (err) {
    console.error('❌ Error deleting document:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// ===== Start server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Ready to accept requests`);
});
// ===== Add missing column if table already exists =====
async function addMissingColumns() {
  try {
    await pool.query(`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS deleted_for JSONB DEFAULT '{}';
      
      CREATE INDEX IF NOT EXISTS idx_deleted_for 
      ON documents USING GIN(deleted_for);
    `);
    console.log('✅ Ensured deleted_for column exists');
  } catch (error) {
    // Ignore if already exists
    if (!error.message.includes('already exists')) {
      console.error('⚠️ Column check:', error.message);
    }
  }
}