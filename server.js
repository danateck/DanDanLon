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
  limits: {}  // ללא מגבלת גודל
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

    // 🔴 מגבלה ריאלית ל-DB (לא למנוי!) – כדי שלא יפיל את Postgres
const MAX_DB_FILE_SIZE = 20 * 1024 * 1024; // 20MB לדוגמה

if (file.size > MAX_DB_FILE_SIZE) {
  console.warn(
    `⚠️ File too big for DB: ${file.size} bytes (limit ${MAX_DB_FILE_SIZE})`
  );
  return res.status(413).json({
    error: 'file_too_large_for_db',
    message: 'הקובץ גדול מדי כדי להישמר במסד הנתונים בשרת הנוכחי'
  });
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

  res.status(500).json({
    error: 'Upload failed',
    message: error?.message || String(error),
    code: error?.code || null
  });
}

});

// 3️⃣ GET /api/docs/:id/download - Download file
// 3️⃣ GET /api/docs/:id/download - Download file (FIXED)
app.get('/api/docs/:id/download', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const requestingUser = userEmailRaw.trim().toLowerCase();
    const { id } = req.params;
    console.log('📥 Download request:', { id, user: requestingUser });

    const result = await pool.query(`
      SELECT file_data, file_name, mime_type, owner, shared_with, deleted_for
      FROM documents
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      console.log('❌ Document not found:', id);
      return res.status(404).json({ error: 'Not found' });
    }

    const doc = result.rows[0];

    // ---------- פירוש shared_with בצורה גמישה ----------
    let sharedWithEmails = [];
    const sw = doc.shared_with;

    if (sw) {
      if (Array.isArray(sw)) {
        // במקרה נדיר שזה נשמר כמערך מיילים
        sharedWithEmails = sw
          .map(e => (e || '').toString().trim().toLowerCase())
          .filter(Boolean);
      } else if (typeof sw === 'object') {
        // JSONB אובייקט: { "user1@mail": true, "user2@mail": true }
        sharedWithEmails = Object.keys(sw)
          .filter(k => sw[k])
          .map(k => k.trim().toLowerCase());
      } else if (typeof sw === 'string') {
        // מחרוזת – ננסה לפרש כ-JSON
        try {
          const parsed = JSON.parse(sw);
          if (Array.isArray(parsed)) {
            sharedWithEmails = parsed
              .map(e => (e || '').toString().trim().toLowerCase())
              .filter(Boolean);
          } else if (parsed && typeof parsed === 'object') {
            sharedWithEmails = Object.keys(parsed)
              .filter(k => parsed[k])
              .map(k => k.trim().toLowerCase());
          }
        } catch (e) {
          console.warn('⚠️ Could not parse shared_with string JSON:', sw);
        }
      }
    }

    // ---------- פירוש deleted_for ----------
    let deletedFor = {};
    const df = doc.deleted_for;
    if (df) {
      if (typeof df === 'object') {
        deletedFor = df;
      } else if (typeof df === 'string') {
        try {
          const parsedDf = JSON.parse(df);
          if (parsedDf && typeof parsedDf === 'object') {
            deletedFor = parsedDf;
          }
        } catch (e) {
          console.warn('⚠️ Could not parse deleted_for JSON string:', df);
        }
      }
    }

    // ננרמל גם את המפתחות ל-lowercase לבדיקה
    const normalizedDeletedFor = {};
    Object.keys(deletedFor || {}).forEach(k => {
      const key = (k || '').toString().trim().toLowerCase();
      if (key) normalizedDeletedFor[key] = !!deletedFor[k];
    });

    // אם המשתמש הזה מחק לעצמו לצמיתות → אין לו גישה
    if (normalizedDeletedFor[requestingUser]) {
      console.log('❌ Access denied (deleted_for) for:', requestingUser);
      return res.status(403).json({ error: 'Access denied' });
    }

    // ---------- קביעת רשימת המשתתפים במסמך ----------
    let ownerEmail = (doc.owner || '').toString().trim().toLowerCase();

    const participantsSet = new Set();

    // נוסיף owner רק אם זה לא "0" ולא ריק
    if (ownerEmail && ownerEmail !== '0') {
      participantsSet.add(ownerEmail);
    }

    // נוסיף כל Shared
    sharedWithEmails.forEach(email => {
      if (email) participantsSet.add(email);
    });

    const participants = Array.from(participantsSet);

    console.log('🔐 Access check:', {
      owner: ownerEmail,
      user: requestingUser,
      sharedWith: sharedWithEmails,
      participants,
      deletedFor: normalizedDeletedFor
    });

    // אם המשתמש בכלל לא מופיע ברשימת המשתתפים → אין הרשאה
    if (!participants.includes(requestingUser)) {
      console.log('❌ Access denied (not participant):', requestingUser);
      return res.status(403).json({ error: 'Access denied' });
    }

    // ---------- בדיקת קובץ ----------
    if (!doc.file_data) {
      return res.status(404).json({ error: 'No file data' });
    }

    console.log('✅ Sending file:', doc.file_name);
    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(doc.file_name || 'document')}"`
    );
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

app.delete('/api/docs/:id', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const userEmail = userEmailRaw.trim().toLowerCase();
    const { id } = req.params;

    // נטען את המסמך מה-DB
    const result = await pool.query(
      `SELECT id, owner, shared_with, deleted_for
       FROM documents
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];

    // ---------- פירוש shared_with בצורה נכונה ----------
    let sharedWithEmails = [];
    const sw = doc.shared_with;

    if (sw) {
      if (Array.isArray(sw)) {
        // JSONB שנשמר כמערך ['a@mail', 'b@mail']
        sharedWithEmails = sw
          .map(e => (e || '').toString().trim().toLowerCase())
          .filter(e => e && e.includes('@'));
      } else if (typeof sw === 'object') {
        // JSONB שנשמר כאובייקט { "a@mail": true, "b@mail": true }
        sharedWithEmails = Object.keys(sw)
          .filter(k => sw[k])
          .map(k => k.trim().toLowerCase())
          .filter(e => e && e.includes('@'));
      } else if (typeof sw === 'string') {
        // במקרה שנשמר כמחרוזת JSON
        try {
          const parsed = JSON.parse(sw);
          if (Array.isArray(parsed)) {
            sharedWithEmails = parsed
              .map(e => (e || '').toString().trim().toLowerCase())
              .filter(e => e && e.includes('@'));
          } else if (parsed && typeof parsed === 'object') {
            sharedWithEmails = Object.keys(parsed)
              .filter(k => parsed[k])
              .map(k => k.trim().toLowerCase())
              .filter(e => e && e.includes('@'));
          }
        } catch (e) {
          console.warn('⚠️ Could not parse shared_with string JSON:', sw);
        }
      }
    }

    // ---------- פירוש deleted_for ----------
    let deletedFor = {};
    const df = doc.deleted_for;
    if (df) {
      if (typeof df === 'object') {
        deletedFor = df;
      } else if (typeof df === 'string') {
        try {
          const parsedDf = JSON.parse(df);
          if (parsedDf && typeof parsedDf === 'object') {
            deletedFor = parsedDf;
          }
        } catch (e) {
          console.warn('⚠️ Could not parse deleted_for JSON string:', df);
        }
      }
    }
    if (!deletedFor || typeof deletedFor !== 'object') {
      deletedFor = {};
    }

    // ---------- רשימת כל המשתתפים במסמך ----------
    let ownerEmail = (doc.owner || '').toString().trim().toLowerCase();

    const participantsSet = new Set();

    // נוסיף owner רק אם זה מייל אמיתי
    if (ownerEmail && ownerEmail !== '0' && ownerEmail.includes('@')) {
      participantsSet.add(ownerEmail);
    }

    // נוסיף את כל המיילים התקינים מתוך shared_with
    sharedWithEmails.forEach(email => {
      if (email && email.includes('@')) {
        participantsSet.add(email);
      }
    });

    const participants = Array.from(participantsSet);

    // אם המשתמש בכלל לא קשור למסמך – אין לו זכות למחוק
    if (!participants.includes(userEmail)) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    // נסמן שהמשתמש הנוכחי מחק לצמיתות
    const newDeletedFor = { ...deletedFor };
    newDeletedFor[userEmail] = true;

    // מי עדיין "חי" במסמך אחרי המחיקה הזאת? (לא מחוקים)
    const remaining = participants.filter(email => !newDeletedFor[email]);

    // ---------- אם אף אחד לא נשאר → מוחקים לגמרי ----------
    if (remaining.length === 0) {
      await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
      return res.json({
        ok: true,
        hardDeleted: true,
        deletedForAll: true,
      });
    }

    // ---------- יש עדיין משתמשים: קובעים בעלות חדשה ----------
    const newOwnerEmail = remaining[0]; // תמיד מייל אמיתי (עבר דרך includes('@'))

    const newSharedWith = {};
    remaining.slice(1).forEach(email => {
      newSharedWith[email] = true;
    });

    await pool.query(
      `
      UPDATE documents
      SET owner = $1,
          shared_with = $2,
          deleted_for = $3
      WHERE id = $4
      `,
      [newOwnerEmail, newSharedWith, newDeletedFor, id]
    );

    return res.json({
      ok: true,
      hardDeleted: false,
      deletedForAll: false,
      newOwner: newOwnerEmail,
      deletedFor: userEmail,
    });
  } catch (err) {
    console.error('Error deleting document:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});





// 📦 סטטיסטיקת אחסון לפי בעלות בלבד
app.get('/api/storage-stats', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const userEmail = userEmailRaw.trim().toLowerCase();

    // רק קבצים שהמשתמש הוא הבעלים שלהם
    const result = await pool.query(
      `
      SELECT 
        COALESCE(SUM(file_size), 0) AS used_bytes,
        COUNT(*) AS docs_count
      FROM documents
      WHERE owner = $1
        AND NOT (deleted_for ? $1)
      `,
      [userEmail]
    );

    const row = result.rows[0] || { used_bytes: 0, docs_count: 0 };

    res.json({
      usedBytes: Number(row.used_bytes) || 0,
      docsCount: Number(row.docs_count) || 0,
    });
  } catch (err) {
    console.error('❌ /api/storage-stats error:', err);
    res.status(500).json({ error: 'Failed to load storage stats' });
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