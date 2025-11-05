// server/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Pool } from 'pg';
import admin from 'firebase-admin';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- CORS ---
const allowed = (process.env.CORS_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked: ' + origin), false);
  },
  credentials: true
}));
app.use(express.json());

// --- Health & root (make sure these are BEFORE app.listen) ---
app.get('/', (_req, res) => res.send('EcoDocs API up'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Firebase Admin (optional, safe if unset) ---
let verifyIdToken = async () => null;
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
  verifyIdToken = async (token) => (await admin.auth().verifyIdToken(token))?.email?.toLowerCase();
}

// --- Auth helper ---
async function ensureUser({ email, displayName, photoURL }) {
  await pool.query(
    `INSERT INTO app_users(email, display_name, photo_url) VALUES($1,$2,$3)
     ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name, photo_url = EXCLUDED.photo_url`,
    [email, displayName || null, photoURL || null]
  );
}

async function auth(req, res, next) {
  try {
    let email = null, displayName = null, photoURL = null;

    const m = (req.headers.authorization || '').match(/^Bearer (.+)$/i);
    if (m) {
      try {
        const decoded = await admin.auth().verifyIdToken(m[1]);
        email = decoded?.email?.toLowerCase();
        displayName = decoded?.name || null;
        photoURL = decoded?.picture || null;
      } catch {}
    }

    // DEV fallback (remove for production if you want strict auth)
    if (!email && req.headers['x-dev-email']) {
      email = String(req.headers['x-dev-email']).toLowerCase();
    }

    if (!email) return res.status(401).json({ error: 'Unauthenticated' });
    req.userEmail = email;
    await ensureUser({ email, displayName, photoURL });
    next();
  } catch (e) {
    console.error('auth error', e);
    res.status(401).json({ error: 'Unauthenticated' });
  }
}

// --- API routes (unchanged) ---
app.get('/api/me', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT email, display_name, photo_url, created_at FROM app_users WHERE email=$1',
    [req.userEmail]
  );
  res.json(rows[0] || { email: req.userEmail });
});

app.get('/api/docs', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, title, file_name, mime_type, file_size, category, year, org,
            recipient, shared_with, warranty_start, warranty_expires_at, auto_delete_after,
            uploaded_at, last_modified, (file_url IS NOT NULL) AS has_remote_url
     FROM documents
     WHERE owner_email = $1
     ORDER BY uploaded_at DESC`,
    [req.userEmail]
  );
  res.json(rows);
});

app.post('/api/docs', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const {
      title, category, year, org, recipient,
      warrantyStart, warrantyExpiresAt, autoDeleteAfter
    } = req.body;
    const recipients = recipient ? JSON.parse(recipient) : [];

    const { rows } = await pool.query(
      `INSERT INTO documents(
         owner_email, title, file_name, mime_type, file_size, category, year, org,
         recipient, shared_with, warranty_start, warranty_expires_at, auto_delete_after, file_data
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id, uploaded_at`,
      [
        req.userEmail,
        title || req.file.originalname,
        req.file.originalname,
        req.file.mimetype,
        req.file.size || null,
        category || null, year || null, org || null,
        JSON.stringify(recipients), [],
        warrantyStart || null, warrantyExpiresAt || null, autoDeleteAfter || null,
        req.file.buffer
      ]
    );

    res.json({
      id: rows[0].id,
      title: title || req.file.originalname,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size || null,
      category: category || null, year: year || null, org: org || null,
      recipient: recipients, uploadedAt: rows[0].uploaded_at
    });
  } catch (e) {
    console.error('upload error', e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/docs/:id/download', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT file_name, mime_type, file_data FROM documents
     WHERE id = $1 AND owner_email = $2`,
    [req.params.id, req.userEmail]
  );
  if (!rows.length) return res.status(404).end();
  res.setHeader('Content-Type', rows[0].mime_type);
  res.setHeader('Content-Disposition', `attachment; filename="${rows[0].file_name}"`);
  res.send(rows[0].file_data);
});

app.delete('/api/docs/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM documents WHERE id=$1 AND owner_email=$2', [req.params.id, req.userEmail]);
  res.json({ ok: true });
});

// --- Start ---
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`EcoDocs API running on :${PORT}`));
