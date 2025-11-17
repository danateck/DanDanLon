// ===== server.js - Backend עם תמיכה בתיקיות משותפות =====
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8787;

// ===== PostgreSQL Connection =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL error:', err.stack);
  } else {
    console.log('✅ PostgreSQL connected');
    release();
  }
});

// ===== Middleware =====
app.use(cors({
  origin: ['https://danateck.github.io'],
  credentials: true
}));
app.use(express.json());

// ===== Logging middleware =====
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  console.log('📋 Headers:', {
    'x-dev-email': req.headers['x-dev-email'],
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
  const devEmail = req.headers['x-dev-email'];
  if (devEmail) {
    const email = devEmail.toLowerCase().trim();
    console.log('✅ User from X-Dev-Email:', email);
    return email;
  }
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('⚠️ Firebase token found but not verified yet');
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
        year VARCHAR(10),
        org VARCHAR(255),
        recipient JSONB,
        shared_with JSONB,
        shared_folder_id VARCHAR(255),
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
      CREATE INDEX IF NOT EXISTS idx_trashed ON documents(trashed);
      CREATE INDEX IF NOT EXISTS idx_shared_folder ON documents(shared_folder_id);
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared_folders (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        owner VARCHAR(255) NOT NULL,
        members JSONB NOT NULL DEFAULT '[]',
        created_at BIGINT,
        updated_at BIGINT,
        created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_folder_owner ON shared_folders(owner);
      CREATE INDEX IF NOT EXISTS idx_folder_members ON shared_folders USING GIN(members);
    `);
    
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error);
  }
}

initDB();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now(), database: pool ? 'connected' : 'disconnected' });
});

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

app.get('/api/docs', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const result = await pool.query(`
      SELECT DISTINCT d.*
      FROM documents d
      LEFT JOIN shared_folders sf ON d.shared_folder_id = sf.id
      WHERE d.owner = $1 
         OR d.shared_with ? $1
         OR (d.shared_folder_id IS NOT NULL AND sf.members ? $1)
      ORDER BY d.uploaded_at DESC
    `, [userEmail]);

    console.log(`✅ Found ${result.rows.length} documents`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Load error:', error);
    res.status(500).json({ error: 'Failed to load documents' });
  }
});

app.post('/api/docs', upload.single('file'), async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const id = require('crypto').randomUUID();
    const now = Date.now();
    
    const {
      title = file.originalname,
      category = 'אחר',
      year = new Date().getFullYear().toString(),
      org = '',
      recipient = '[]',
      sharedFolderId = '',
      warrantyStart,
      warrantyExpiresAt,
      autoDeleteAfter
    } = req.body;

    const recipientArray = JSON.parse(recipient || '[]');
    const sharedWith = [];

    if (sharedFolderId) {
      const folderCheck = await pool.query(`SELECT members FROM shared_folders WHERE id = $1`, [sharedFolderId]);
      if (folderCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Folder not found' });
      }
      const members = folderCheck.rows[0].members || [];
      if (!members.includes(userEmail)) {
        return res.status(403).json({ error: 'Not a member of this folder' });
      }
    }

    await pool.query(`
      INSERT INTO documents (
        id, owner, title, file_name, file_size, mime_type, file_data,
        category, year, org, recipient, shared_with, shared_folder_id,
        warranty_start, warranty_expires_at, auto_delete_after,
        uploaded_at, last_modified, last_modified_by, trashed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `, [
      id, userEmail, title, file.originalname, file.size, file.mimetype, file.buffer,
      category, year, org, JSON.stringify(recipientArray), JSON.stringify(sharedWith), 
      sharedFolderId || null,
      warrantyStart || null, warrantyExpiresAt || null, autoDeleteAfter || null,
      now, now, userEmail, false
    ]);

    console.log(`✅ Uploaded: ${id}`);
    
    res.json({
      id,
      owner: userEmail,
      title,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      shared_folder_id: sharedFolderId || null,
      uploaded_at: now
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/docs/:id/download', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { id } = req.params;
    console.log('📥 Download request:', id, 'by', userEmail);

    const result = await pool.query(`
      SELECT d.file_data, d.file_name, d.mime_type, d.owner, d.shared_with, d.shared_folder_id,
             sf.members as folder_members
      FROM documents d
      LEFT JOIN shared_folders sf ON d.shared_folder_id = sf.id
      WHERE d.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      console.log('❌ Document not found:', id);
      return res.status(404).json({ error: 'Not found' });
    }

    const doc = result.rows[0];
    const sharedWith = doc.shared_with || [];
    const folderMembers = doc.folder_members || [];
    
    const hasAccess = 
      doc.owner === userEmail || 
      sharedWith.includes(userEmail) ||
      folderMembers.includes(userEmail);
    
    if (!hasAccess) {
      console.log('❌ Access denied:', userEmail, 'doc:', id);
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!doc.file_data) {
      console.log('❌ No file data:', id);
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

app.put('/api/docs/:id', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) return res.status(401).json({ error: 'Unauthenticated' });

    const { id } = req.params;
    const updates = req.body;

    const checkResult = await pool.query('SELECT owner FROM documents WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (checkResult.rows[0].owner !== userEmail) return res.status(403).json({ error: 'Access denied' });

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['title', 'category', 'year', 'org', 'recipient', 'shared_with', 'shared_folder_id'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(typeof updates[field] === 'object' ? JSON.stringify(updates[field]) : updates[field]);
        paramIndex++;
      }
    });

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    fields.push(`last_modified = $${paramIndex}`);
    values.push(Date.now());
    paramIndex++;
    fields.push(`last_modified_by = $${paramIndex}`);
    values.push(userEmail);
    paramIndex++;
    values.push(id);

    await pool.query(`UPDATE documents SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);

    console.log(`✅ Updated: ${id}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ Update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.put('/api/docs/:id/trash', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) return res.status(401).json({ error: 'Unauthenticated' });

    const { id } = req.params;
    const { trashed } = req.body;

    const result = await pool.query(`
      UPDATE documents SET trashed = $1, last_modified = $2, last_modified_by = $3
      WHERE id = $4 AND owner = $5 RETURNING *
    `, [trashed, Date.now(), userEmail, id, userEmail]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found or access denied' });

    console.log(`✅ ${trashed ? 'Trashed' : 'Restored'}: ${id}`);
    res.json({ success: true, id, trashed });
  } catch (error) {
    console.error('❌ Trash error:', error);
    res.status(500).json({ error: 'Trash operation failed' });
  }
});

app.delete('/api/docs/:id', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) return res.status(401).json({ error: 'Unauthenticated' });

    const { id } = req.params;
    const result = await pool.query(`DELETE FROM documents WHERE id = $1 AND owner = $2 RETURNING id`, [id, userEmail]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found or access denied' });

    console.log(`✅ Deleted: ${id}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// SHARED FOLDERS

app.get('/api/shared-folders', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) return res.status(401).json({ error: 'Unauthenticated' });

    const result = await pool.query(`
      SELECT * FROM shared_folders WHERE owner = $1 OR members ? $1 ORDER BY created_at DESC
    `, [userEmail]);

    console.log(`✅ Found ${result.rows.length} folders`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Load folders error:', error);
    res.status(500).json({ error: 'Failed to load folders' });
  }
});

app.post('/api/shared-folders', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) return res.status(401).json({ error: 'Unauthenticated' });

    const { name, description = '' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const id = require('crypto').randomUUID();
    const now = Date.now();

    await pool.query(`
      INSERT INTO shared_folders (id, name, description, owner, members, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, name.trim(), description, userEmail, JSON.stringify([userEmail]), now, now]);

    console.log(`✅ Created folder: ${id}`);
    res.json({ id, name: name.trim(), description, owner: userEmail, members: [userEmail], created_at: now, updated_at: now });
  } catch (error) {
    console.error('❌ Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

app.put('/api/shared-folders/:id', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) return res.status(401).json({ error: 'Unauthenticated' });

    const { id } = req.params;
    const { name, description } = req.body;

    const checkResult = await pool.query('SELECT owner FROM shared_folders WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    if (checkResult.rows[0].owner !== userEmail) return res.status(403).json({ error: 'Only owner can update folder' });

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(name.trim());
      paramIndex++;
    }
    if (description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    fields.push(`updated_at = $${paramIndex}`);
    values.push(Date.now());
    paramIndex++;
    values.push(id);

    await pool.query(`UPDATE shared_folders SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);

    console.log(`✅ Updated folder: ${id}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ Update folder error:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

app.delete('/api/shared-folders/:id', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) return res.status(401).json({ error: 'Unauthenticated' });

    const { id } = req.params;
    const checkResult = await pool.query('SELECT owner FROM shared_folders WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    if (checkResult.rows[0].owner !== userEmail) return res.status(403).json({ error: 'Only owner can delete folder' });

    await pool.query(`UPDATE documents SET shared_folder_id = NULL WHERE shared_folder_id = $1`, [id]);
    await pool.query('DELETE FROM shared_folders WHERE id = $1', [id]);

    console.log(`✅ Deleted folder: ${id}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

app.post('/api/shared-folders/:id/members', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) return res.status(401).json({ error: 'Unauthenticated' });

    const { id } = req.params;
    const { email } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });

    const newMemberEmail = email.toLowerCase().trim();
    const checkResult = await pool.query('SELECT owner, members FROM shared_folders WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    if (checkResult.rows[0].owner !== userEmail) return res.status(403).json({ error: 'Only owner can add members' });

    const currentMembers = checkResult.rows[0].members || [];
    if (currentMembers.includes(newMemberEmail)) return res.status(400).json({ error: 'User is already a member' });

    const updatedMembers = [...currentMembers, newMemberEmail];
    await pool.query(`UPDATE shared_folders SET members = $1, updated_at = $2 WHERE id = $3`, [JSON.stringify(updatedMembers), Date.now(), id]);

    console.log(`✅ Added member ${newMemberEmail} to folder ${id}`);
    res.json({ success: true, members: updatedMembers });
  } catch (error) {
    console.error('❌ Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

app.delete('/api/shared-folders/:id/members', async (req, res) => {
  try {
    const userEmail = getUserFromRequest(req);
    if (!userEmail) return res.status(401).json({ error: 'Unauthenticated' });

    const { id } = req.params;
    const { email } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });

    const removeMemberEmail = email.toLowerCase().trim();
    const checkResult = await pool.query('SELECT owner, members FROM shared_folders WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    if (checkResult.rows[0].owner !== userEmail) return res.status(403).json({ error: 'Only owner can remove members' });

    const currentMembers = checkResult.rows[0].members || [];
    const updatedMembers = currentMembers.filter(m => m !== removeMemberEmail);
    await pool.query(`UPDATE shared_folders SET members = $1, updated_at = $2 WHERE id = $3`, [JSON.stringify(updatedMembers), Date.now(), id]);

    console.log(`✅ Removed member ${removeMemberEmail} from folder ${id}`);
    res.json({ success: true, members: updatedMembers });
  } catch (error) {
    console.error('❌ Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Ready!`);
});
