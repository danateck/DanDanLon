// ===== server.js - Backend מתוקן עם מערכת pending files מלאה =====
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


// ========================================
// 🎯 מערכת מגבלות אחסון לפי דרגות
// ========================================
const STORAGE_LIMITS = {
  free: 200 * 1024 * 1024,          // 200MB
  standard: 2 * 1024 * 1024 * 1024, // 2GB
  advanced: 10 * 1024 * 1024 * 1024, // 10GB
  pro: 20 * 1024 * 1024 * 1024,     // 20GB
  premium: 50 * 1024 * 1024 * 1024, // 50GB
  premium_plus: 50 * 1024 * 1024 * 1024 // 50GB + dynamic
};

/**
 * מחזיר את מגבלת האחסון של משתמש בבייטים
 */
async function getUserStorageLimitBytes(userEmail) {
  try {
    const result = await pool.query(
      `SELECT subscription FROM users WHERE email = $1`,
      [userEmail]
    );

    if (!result.rows.length) {
      return STORAGE_LIMITS.free; // ברירת מחדל
    }

    const sub = result.rows[0].subscription || {};
    const planId = (sub.plan || 'free').toLowerCase();
    
    let baseLimit = STORAGE_LIMITS[planId] || STORAGE_LIMITS.free;
    
    // Premium+ עם GB נוספים
    if (planId === 'premium_plus' && sub.extraStorageGB > 0) {
      baseLimit += sub.extraStorageGB * 1024 * 1024 * 1024;
    }
    
    return baseLimit;
  } catch (err) {
    console.error('❌ getUserStorageLimitBytes error:', err);
    return STORAGE_LIMITS.free;
  }
}

/**
 * מחזיר את השימוש הנוכחי של משתמש (כולל קבצים משותפים אליו)
 */
async function getUserCurrentUsageBytes(userEmail) {
  try {
    const result = await pool.query(
      `
      SELECT COALESCE(SUM(file_size), 0) AS used_bytes
      FROM documents
      WHERE (owner = $1 OR shared_with ? $1)
        AND NOT (deleted_for ? $1)
        AND trashed = false
      `,
      [userEmail]
    );
    
    return Number(result.rows[0]?.used_bytes || 0);
  } catch (err) {
    console.error('❌ getUserCurrentUsageBytes error:', err);
    return 0;
  }
}


// ========================================
// 🔧 עזרים
// ========================================
function getUserFromRequest(req) {
  return req.headers['x-user-email'] || req.headers['x-dev-email'] || null;
}

// ========================================
// 🗄️ הגדרת הטבלאות
// ========================================
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        subscription JSONB DEFAULT '{"plan": "free", "status": "active"}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        owner TEXT NOT NULL,
        file_name TEXT,
        file_data TEXT,
        mime_type TEXT,
        file_size BIGINT DEFAULT 0,
        category TEXT,
        sub_category TEXT,
        year INTEGER,
        org TEXT,
        recipient JSONB,
        shared_with JSONB DEFAULT '{}'::jsonb,
        deleted_for JSONB DEFAULT '{}'::jsonb,
        trashed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_modified BIGINT,
        last_modified_by TEXT
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_owner ON documents(owner);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_shared ON documents USING GIN(shared_with);
    `);

    // טבלה לקבצים ממתינים לשיתוף
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_shared_docs (
        id SERIAL PRIMARY KEY,
        doc_id TEXT NOT NULL,
        from_user TEXT NOT NULL,
        to_user TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(doc_id, to_user)
      )
    `);

    console.log('✅ All tables ready');
  } catch (err) {
    console.error('❌ Table init error:', err);
  }
})();


// ========================================
// 📄 API: POST /api/docs - העלאת מסמך חדש
// ========================================
app.post('/api/docs', async (req, res) => {
  try {
    const ownerRaw = getUserFromRequest(req);
    if (!ownerRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const owner = ownerRaw.trim().toLowerCase();

    const {
      id, fileName, fileData, mimeType, fileSize,
      category, subCategory, year, org, recipient
    } = req.body;

    if (!id || !fileName || !fileData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const size = Number(fileSize || 0);
    
    // בדיקת מגבלת אחסון
    const currentUsage = await getUserCurrentUsageBytes(owner);
    const storageLimit = await getUserStorageLimitBytes(owner);
    
    if (currentUsage + size > storageLimit) {
      return res.status(403).json({ 
        error: 'אין מספיק מקום באחסון. יש למחוק קבצים או לשדרג את המנוי.',
        currentUsage,
        storageLimit,
        needed: size
      });
    }

    const recipientArray = Array.isArray(recipient) ? recipient : [];
    const sharedWith = [];

    await pool.query(
      `
      INSERT INTO documents (
        id, owner, file_name, file_data, mime_type, file_size,
        category, sub_category, year, org, recipient, shared_with,
        created_at, last_modified, last_modified_by, trashed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, $14, false)
      ON CONFLICT (id) DO UPDATE SET
        file_name = EXCLUDED.file_name,
        file_data = EXCLUDED.file_data,
        mime_type = EXCLUDED.mime_type,
        file_size = EXCLUDED.file_size,
        category = EXCLUDED.category,
        sub_category = EXCLUDED.sub_category,
        year = EXCLUDED.year,
        org = EXCLUDED.org,
        recipient = EXCLUDED.recipient,
        last_modified = EXCLUDED.last_modified,
        last_modified_by = EXCLUDED.last_modified_by
      `,
      [
        id, owner, fileName, fileData, mimeType, size,
        category, subCategory, year, org, 
        JSON.stringify(recipientArray), 
        JSON.stringify(sharedWith),
        Date.now(), owner
      ]
    );

    console.log(`✅ Document uploaded: ${id} by ${owner}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ POST /api/docs error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});


// ========================================
// 📥 API: GET /api/docs - קבלת מסמכים
// ========================================
app.get('/api/docs', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const userEmail = userEmailRaw.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT id, file_name, mime_type, file_size, owner, shared_with, deleted_for,
             category, sub_category, year, org, recipient, trashed,
             created_at, last_modified, last_modified_by
      FROM documents
      WHERE (owner = $1 OR shared_with ? $1)
        AND NOT (deleted_for ? $1)
      ORDER BY created_at DESC
      `,
      [userEmail]
    );

    const docs = result.rows.map(doc => {
      let sharedWithEmails = [];
      const sw = doc.shared_with;
      
      if (Array.isArray(sw)) {
        sharedWithEmails = sw.filter(e => e && typeof e === 'string');
      } else if (sw && typeof sw === 'object') {
        sharedWithEmails = Object.keys(sw).filter(k => sw[k]);
      } else if (typeof sw === 'string') {
        try {
          const parsed = JSON.parse(sw);
          if (Array.isArray(parsed)) {
            sharedWithEmails = parsed.filter(e => e && typeof e === 'string');
          } else if (parsed && typeof parsed === 'object') {
            sharedWithEmails = Object.keys(parsed).filter(k => parsed[k]);
          }
        } catch (e) {
          console.warn('⚠️ Could not parse shared_with string JSON:', sw);
        }
      }

      let deletedForEmails = [];
      if (doc.deleted_for) {
        if (Array.isArray(doc.deleted_for)) {
          deletedForEmails = doc.deleted_for;
        } else if (typeof doc.deleted_for === 'object') {
          deletedForEmails = Object.keys(doc.deleted_for).filter(k => doc.deleted_for[k]);
        }
      }

      const isOwner = (doc.owner.trim().toLowerCase() === userEmail);
      const isShared = sharedWithEmails.includes(userEmail);
      const isDeleted = deletedForEmails.includes(userEmail);

      if (isDeleted) return null;

      sharedWithEmails.forEach(email => {
        if (!deletedForEmails.includes(email)) {
          deletedForEmails.push(email);
        }
      });

      return {
        id: doc.id,
        fileName: doc.file_name,
        mimeType: doc.mime_type,
        fileSize: doc.file_size,
        owner: doc.owner,
        category: doc.category,
        subCategory: doc.sub_category,
        year: doc.year,
        org: doc.org,
        recipient: doc.recipient,
        sharedWith: sharedWithEmails,
        trashed: doc.trashed || false,
        createdAt: doc.created_at,
        lastModified: doc.last_modified,
        lastModifiedBy: doc.last_modified_by,
        isOwner,
        isShared
      };
    }).filter(Boolean);

    res.json({ documents: docs });
  } catch (error) {
    console.error('❌ GET /api/docs error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});


// ========================================
// 📄 API: GET /api/docs/:id - קבלת מסמך מסוים
// ========================================
app.get('/api/docs/:id', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const userEmail = userEmailRaw.trim().toLowerCase();
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT file_data, file_name, mime_type, owner, shared_with, deleted_for
      FROM documents
      WHERE id = $1
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];
    let sharedWithEmails = [];
    const sw = doc.shared_with;

    if (Array.isArray(sw)) {
      sharedWithEmails = sw.filter(e => e && typeof e === 'string');
    } else if (sw && typeof sw === 'object') {
      sharedWithEmails = Object.keys(sw).filter(k => sw[k]);
    } else if (typeof sw === 'string') {
      try {
        const parsed = JSON.parse(sw);
        if (Array.isArray(parsed)) {
          sharedWithEmails = parsed.filter(e => e && typeof e === 'string');
        } else if (parsed && typeof parsed === 'object') {
          sharedWithEmails = Object.keys(parsed).filter(k => parsed[k]);
        }
      } catch (e) {
        console.warn('⚠️ Could not parse shared_with:', sw);
      }
    }

    const isOwner = (doc.owner.trim().toLowerCase() === userEmail);
    const hasAccess = isOwner || sharedWithEmails.includes(userEmail);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let deletedForEmails = [];
    if (doc.deleted_for) {
      if (Array.isArray(doc.deleted_for)) {
        deletedForEmails = doc.deleted_for;
      } else if (typeof doc.deleted_for === 'object') {
        deletedForEmails = Object.keys(doc.deleted_for).filter(k => doc.deleted_for[k]);
      }
    }

    if (deletedForEmails.includes(userEmail)) {
      return res.status(404).json({ error: 'Document deleted' });
    }

    res.json({
      id,
      fileName: doc.file_name,
      fileData: doc.file_data,
      mimeType: doc.mime_type,
      owner: doc.owner,
      sharedWith: sharedWithEmails,
      isOwner,
      isShared: !isOwner
    });
  } catch (error) {
    console.error('❌ GET /api/docs/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});


// ========================================
// 🔗 API: POST /api/docs/:id/share - שיתוף מסמך
// ========================================
app.post('/api/docs/:id/share', async (req, res) => {
  try {
    const fromUserRaw = getUserFromRequest(req);
    if (!fromUserRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const fromUser = fromUserRaw.trim().toLowerCase();
    const { id } = req.params;
    const { targetEmail } = req.body;

    if (!targetEmail) {
      return res.status(400).json({ error: 'Missing targetEmail' });
    }
    const toUser = targetEmail.trim().toLowerCase();

    // 1️⃣ טוענים את המסמך ובודקים שהשולח הוא הבעלים
    const docResult = await pool.query(
      `
      SELECT id, owner, file_size, shared_with
      FROM documents
      WHERE id = $1
      `,
      [id]
    );

    if (!docResult.rows.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docResult.rows[0];
    if (doc.owner.trim().toLowerCase() !== fromUser) {
      return res.status(403).json({ error: 'Only owner can share' });
    }

    const fileSize = Number(doc.file_size || 0);

    // 2️⃣ מחשבים כמה אחסון היעד כבר משתמש
    const usedBytes = await getUserCurrentUsageBytes(toUser);
    const maxBytes = await getUserStorageLimitBytes(toUser);
    const willBe = usedBytes + fileSize;

    // 3️⃣ אין מספיק מקום → נכנס לטבלת pending_shared_docs ולא משותף בפועל
    if (willBe > maxBytes) {
      await pool.query(
        `
        INSERT INTO pending_shared_docs (doc_id, from_user, to_user)
        VALUES ($1, $2, $3)
        ON CONFLICT (doc_id, to_user) DO NOTHING
        `,
        [doc.id, fromUser, toUser]
      );

      return res.json({
        status: 'pending',
        reason: 'no_space',
        message: `הקובץ ממתין לשיתוף. ${toUser} צריך לפנות מקום או לשדרג את המנוי.`
      });
    }

    // 4️⃣ יש מספיק מקום → מוסיפים ל-shared_with
    let sharedWith = doc.shared_with || {};

    if (Array.isArray(sharedWith)) {
      if (!sharedWith.includes(toUser)) {
        sharedWith.push(toUser);
      }
    } else if (typeof sharedWith === 'object' && sharedWith !== null) {
      sharedWith[toUser] = true;
    } else if (typeof sharedWith === 'string') {
      try {
        const parsed = JSON.parse(sharedWith);
        if (Array.isArray(parsed)) {
          if (!parsed.includes(toUser)) parsed.push(toUser);
          sharedWith = parsed;
        } else if (parsed && typeof parsed === 'object') {
          parsed[toUser] = true;
          sharedWith = parsed;
        } else {
          sharedWith = { [toUser]: true };
        }
      } catch (e) {
        sharedWith = { [toUser]: true };
      }
    } else {
      sharedWith = { [toUser]: true };
    }

    await pool.query(
      `
      UPDATE documents
      SET shared_with = $1
      WHERE id = $2
      `,
      [JSON.stringify(sharedWith), doc.id]
    );

    return res.json({
      status: 'shared',
      toUser,
    });
  } catch (err) {
    console.error('❌ /api/docs/:id/share error:', err);
    return res.status(500).json({ error: 'Share failed' });
  }
});


// ========================================
// 📋 API: GET /api/pending-shares - קבלת קבצים ממתינים לשיתוף
// ========================================
app.get('/api/pending-shares', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const userEmail = userEmailRaw.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT p.id, p.doc_id, p.from_user, p.created_at,
             d.file_name, d.file_size
      FROM pending_shared_docs p
      JOIN documents d ON d.id = p.doc_id
      WHERE p.to_user = $1
      ORDER BY p.created_at DESC
      `,
      [userEmail]
    );

    const pending = result.rows.map(row => ({
      pendingId: row.id,
      docId: row.doc_id,
      fromUser: row.from_user,
      fileName: row.file_name,
      fileSize: row.file_size,
      createdAt: row.created_at
    }));

    res.json({ pending });
  } catch (err) {
    console.error('❌ GET /api/pending-shares error:', err);
    res.status(500).json({ error: 'Failed to get pending shares' });
  }
});


// ========================================
// ✅ API: POST /api/accept-pending/:pendingId - קבלת קובץ ממתין
// ========================================
app.post('/api/accept-pending/:pendingId', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const userEmail = userEmailRaw.trim().toLowerCase();
    const { pendingId } = req.params;

    // 1️⃣ מוצא את הרשומה ה-pending
    const pendingResult = await pool.query(
      `
      SELECT p.doc_id, p.from_user, d.file_size, d.shared_with
      FROM pending_shared_docs p
      JOIN documents d ON d.id = p.doc_id
      WHERE p.id = $1 AND p.to_user = $2
      `,
      [pendingId, userEmail]
    );

    if (!pendingResult.rows.length) {
      return res.status(404).json({ error: 'Pending share not found' });
    }

    const pending = pendingResult.rows[0];
    const fileSize = Number(pending.file_size || 0);

    // 2️⃣ בודק אם יש מקום עכשיו
    const usedBytes = await getUserCurrentUsageBytes(userEmail);
    const maxBytes = await getUserStorageLimitBytes(userEmail);

    if (usedBytes + fileSize > maxBytes) {
      return res.status(403).json({ 
        error: 'עדיין אין מספיק מקום באחסון',
        currentUsage: usedBytes,
        storageLimit: maxBytes,
        needed: fileSize
      });
    }

    // 3️⃣ מוסיף ל-shared_with
    let sharedWith = pending.shared_with || {};

    if (Array.isArray(sharedWith)) {
      if (!sharedWith.includes(userEmail)) {
        sharedWith.push(userEmail);
      }
    } else if (typeof sharedWith === 'object' && sharedWith !== null) {
      sharedWith[userEmail] = true;
    } else {
      sharedWith = { [userEmail]: true };
    }

    await pool.query(
      `
      UPDATE documents
      SET shared_with = $1
      WHERE id = $2
      `,
      [JSON.stringify(sharedWith), pending.doc_id]
    );

    // 4️⃣ מוחק מה-pending
    await pool.query(
      `DELETE FROM pending_shared_docs WHERE id = $1`,
      [pendingId]
    );

    res.json({ 
      success: true, 
      docId: pending.doc_id,
      message: 'הקובץ נוסף בהצלחה'
    });
  } catch (err) {
    console.error('❌ POST /api/accept-pending error:', err);
    res.status(500).json({ error: 'Failed to accept pending share' });
  }
});


// ========================================
// ❌ API: DELETE /api/pending-shares/:pendingId - דחיית קובץ ממתין
// ========================================
app.delete('/api/pending-shares/:pendingId', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const userEmail = userEmailRaw.trim().toLowerCase();
    const { pendingId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM pending_shared_docs
      WHERE id = $1 AND to_user = $2
      RETURNING doc_id
      `,
      [pendingId, userEmail]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Pending share not found' });
    }

    res.json({ 
      success: true,
      docId: result.rows[0].doc_id,
      message: 'הקובץ נדחה'
    });
  } catch (err) {
    console.error('❌ DELETE /api/pending-shares error:', err);
    res.status(500).json({ error: 'Failed to reject pending share' });
  }
});


// ========================================
// 🗑️ API: PUT /api/docs/:id/trash - העברה לסל מחזור
// ========================================
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


// ========================================
// 🗑️ API: DELETE /api/docs/:id - מחיקת מסמך
// ========================================
app.delete('/api/docs/:id', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const userEmail = userEmailRaw.trim().toLowerCase();
    const { id } = req.params;

    const docResult = await pool.query(
      `SELECT owner, shared_with FROM documents WHERE id = $1`,
      [id]
    );

    if (!docResult.rows.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docResult.rows[0];
    const isOwner = (doc.owner.trim().toLowerCase() === userEmail);

    if (isOwner) {
      // הבעלים מוחק → מוחק לגמרי
      await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
      console.log(`✅ Document permanently deleted by owner: ${id}`);
      res.json({ success: true, message: 'Document deleted permanently' });
    } else {
      // משתמש משותף מוחק → מסמן ב-deleted_for
      const result = await pool.query(
        `
        SELECT deleted_for FROM documents WHERE id = $1
        `,
        [id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Document not found' });
      }

      let deletedFor = result.rows[0].deleted_for || {};
      
      if (Array.isArray(deletedFor)) {
        if (!deletedFor.includes(userEmail)) {
          deletedFor.push(userEmail);
        }
      } else if (typeof deletedFor === 'object') {
        deletedFor[userEmail] = true;
      } else {
        deletedFor = { [userEmail]: true };
      }

      await pool.query(
        `UPDATE documents SET deleted_for = $1 WHERE id = $2`,
        [JSON.stringify(deletedFor), id]
      );

      console.log(`✅ Document marked deleted for: ${userEmail}`);
      res.json({ success: true, message: 'Document removed from your view' });
    }
  } catch (error) {
    console.error('❌ DELETE /api/docs/:id error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});


// ========================================
// 👤 API: GET /api/user/subscription - קבלת מידע על המנוי
// ========================================
app.get('/api/user/subscription', async (req, res) => {
  try {
    const userEmailRaw = getUserFromRequest(req);
    if (!userEmailRaw) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const userEmail = userEmailRaw.trim().toLowerCase();

    const result = await pool.query(
      `SELECT subscription FROM users WHERE email = $1`,
      [userEmail]
    );

    if (!result.rows.length) {
      // משתמש חדש - יוצר מנוי חינמי
      await pool.query(
        `INSERT INTO users (email, subscription) VALUES ($1, $2)`,
        [userEmail, JSON.stringify({ plan: 'free', status: 'active' })]
      );
      return res.json({ plan: 'free', status: 'active' });
    }

    const sub = result.rows[0].subscription || { plan: 'free', status: 'active' };
    res.json(sub);
  } catch (err) {
    console.error('❌ GET /api/user/subscription error:', err);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});


// ========================================
// 🚀 הפעלת השרת
// ========================================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});