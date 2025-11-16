// ═══════════════════════════════════════════════════════════════════
// api-bridge-IMPROVED.js - גרסה משופרת עם סנכרון Firestore
// ═══════════════════════════════════════════════════════════════════

const API_BASE = (location.hostname === 'localhost')
  ? 'http://localhost:8787'
  : 'https://eco-files.onrender.com'; // 👈 שני את ה-URL שלך כאן!

console.log("🔗 API Bridge loading... Base URL:", API_BASE);

// ═════════════════ Helper Functions ═════════════════

async function getAuthHeaders() {
  const headers = {};
  
  if (window.auth?.currentUser && typeof window.auth.currentUser.getIdToken === 'function') {
    try {
      const token = await window.auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      console.warn('⚠️ Could not get Firebase token:', err);
    }
  }
  
  const userEmail = (typeof getCurrentUserEmail === "function")
    ? getCurrentUserEmail()
    : (auth.currentUser?.email ?? "").toLowerCase();
    
  if (userEmail) {
    headers['X-Dev-Email'] = userEmail;
  }
  
  return headers;
}

function getCurrentUser() {
  if (typeof getCurrentUserEmail === "function") {
    return getCurrentUserEmail();
  }
  return (auth.currentUser?.email ?? "").toLowerCase();
}

function isFirebaseAvailable() {
  return !!(window.db && window.fs && window.app);
}

// ═════════════════ 1. Load Documents ═════════════════

async function loadDocuments() {
  const me = getCurrentUser();
  if (!me) {
    console.warn('⚠️ No user logged in');
    return [];
  }

  try {
    // ✅ Load from Render
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/docs`, { headers });
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const list = await res.json();
    console.log(`✅ Loaded ${list.length} documents from Render`);
    
    // Transform to frontend format
    const docs = list.map(d => ({
      id: d.id,
      title: d.title || d.file_name,
      fileName: d.file_name,
      fileType: d.mime_type,
      fileSize: d.file_size,
      category: d.category || 'אחר',
      year: d.year || '',
      org: d.org || '',
      recipient: Array.isArray(d.recipient) ? d.recipient : [],
      sharedWith: d.shared_with || [],
      uploadedAt: d.uploaded_at,
      lastModified: d.last_modified,
      lastModifiedBy: d.last_modified_by,
      owner: d.owner,
      _trashed: d.trashed || false,
      deletedAt: d.deleted_at,
      deletedBy: d.deleted_by,
      hasFile: true,
      downloadURL: `${API_BASE}/api/docs/${d.id}/download`
    }));
    
    // ✅ Sync to Firestore (background, don't wait)
    if (isFirebaseAvailable()) {
      syncToFirestore(docs).catch(err => 
        console.warn("⚠️ Firestore sync failed:", err)
      );
    }
    
    return docs;
    
  } catch (error) {
    console.error('❌ Render API failed:', error);
    
    // ✅ Fallback to Firestore
    if (isFirebaseAvailable()) {
      console.log("🔄 Falling back to Firestore...");
      return await loadFromFirestore(me);
    }
    
    return [];
  }
}

// Helper: Load from Firestore
async function loadFromFirestore(userEmail) {
  try {
    const col = window.fs.collection(window.db, "documents");
    const qOwned = window.fs.query(col, window.fs.where("owner", "==", userEmail));
    const qShared = window.fs.query(col, window.fs.where("sharedWith", "array-contains", userEmail));
    
    const [ownedSnap, sharedSnap] = await Promise.all([
      window.fs.getDocs(qOwned),
      window.fs.getDocs(qShared)
    ]);
    
    const byId = new Map();
    ownedSnap.forEach(doc => byId.set(doc.id, { id: doc.id, ...doc.data() }));
    sharedSnap.forEach(doc => byId.set(doc.id, { id: doc.id, ...doc.data() }));
    
    const docs = Array.from(byId.values());
    console.log(`✅ Loaded ${docs.length} documents from Firestore`);
    return docs;
  } catch (err) {
    console.error("❌ Firestore load failed:", err);
    return [];
  }
}

// Helper: Sync to Firestore (background)
async function syncToFirestore(docs) {
  if (!Array.isArray(docs) || docs.length === 0) return;
  
  console.log(`🔄 Syncing ${docs.length} documents to Firestore...`);
  
  for (const doc of docs) {
    try {
      const docRef = window.fs.doc(window.db, "documents", doc.id);
      await window.fs.setDoc(docRef, {
        title: doc.title,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        category: doc.category,
        year: doc.year,
        org: doc.org,
        recipient: doc.recipient,
        sharedWith: doc.sharedWith,
        owner: doc.owner,
        uploadedAt: doc.uploadedAt,
        lastModified: doc.lastModified,
        lastModifiedBy: doc.lastModifiedBy,
        _trashed: doc._trashed,
        deletedAt: doc.deletedAt,
        deletedBy: doc.deletedBy
      }, { merge: true });
    } catch (err) {
      console.warn(`⚠️ Failed to sync doc ${doc.id}:`, err);
    }
  }
  
  console.log("✅ Firestore sync complete");
}

// ═════════════════ 2. Upload Document ═════════════════

async function uploadDocument(file, metadata = {}) {
  const me = getCurrentUser();
  if (!me) throw new Error("User not logged in");

  try {
    // ✅ Upload to Render
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', metadata.title ?? file.name);
    fd.append('category', metadata.category ?? 'אחר');
    fd.append('year', metadata.year ?? String(new Date().getFullYear()));
    fd.append('org', metadata.org ?? '');
    fd.append('recipient', JSON.stringify(Array.isArray(metadata.recipient) ? metadata.recipient : []));
    
    if (metadata.warrantyStart) fd.append('warrantyStart', metadata.warrantyStart);
    if (metadata.warrantyExpiresAt) fd.append('warrantyExpiresAt', metadata.warrantyExpiresAt);
    if (metadata.autoDeleteAfter) fd.append('autoDeleteAfter', metadata.autoDeleteAfter);

    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/docs`, { 
      method: 'POST', 
      headers, 
      body: fd 
    });
    
    if (!res.ok) {
      throw new Error(`Upload failed: ${await res.text()}`);
    }
    
    const result = await res.json();
    console.log('✅ Document uploaded to Render:', result.id);
    
    const doc = {
      id: result.id,
      title: result.title || result.file_name,
      fileName: result.file_name,
      fileSize: result.file_size,
      fileType: result.mime_type,
      category: metadata.category ?? 'אחר',
      year: metadata.year ?? String(new Date().getFullYear()),
      org: metadata.org ?? '',
      recipient: metadata.recipient || [],
      sharedWith: metadata.sharedWith || [],
      owner: me,
      uploadedAt: result.uploaded_at || Date.now(),
      lastModified: result.uploaded_at || Date.now(),
      _trashed: false,
      hasFile: true,
      downloadURL: `${API_BASE}/api/docs/${result.id}/download`
    };
    
    // ✅ Sync to Firestore
    if (isFirebaseAvailable()) {
      try {
        const docRef = window.fs.doc(window.db, "documents", result.id);
        await window.fs.setDoc(docRef, doc, { merge: true });
        console.log("✅ Document synced to Firestore");
      } catch (err) {
        console.warn("⚠️ Firestore sync failed:", err);
      }
    }
    
    // ✅ Update local cache
    if (Array.isArray(window.allDocsData)) {
      window.allDocsData.push(doc);
    }
    
    return doc;
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}

// ═════════════════ 3. Update Document ═════════════════

async function updateDocument(docId, updates) {
  try {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    const res = await fetch(`${API_BASE}/api/docs/${docId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    
    if (!res.ok) {
      throw new Error(`Update failed: ${await res.text()}`);
    }
    
    console.log('✅ Document updated in Render:', docId);
    
    // ✅ Update Firestore
    if (isFirebaseAvailable()) {
      try {
        const docRef = window.fs.doc(window.db, "documents", docId);
        await window.fs.updateDoc(docRef, {
          ...updates,
          lastModified: Date.now()
        });
        console.log("✅ Document updated in Firestore");
      } catch (err) {
        console.warn("⚠️ Firestore update failed:", err);
      }
    }
    
    // ✅ Update local cache
    if (Array.isArray(window.allDocsData)) {
      const idx = window.allDocsData.findIndex(d => d.id === docId);
      if (idx >= 0) {
        Object.assign(window.allDocsData[idx], updates, { lastModified: Date.now() });
      }
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Update error:', error);
    throw error;
  }
}

// ═════════════════ 4. Trash/Restore ═════════════════

async function markDocTrashed(docId, trashed) {
  try {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    const res = await fetch(`${API_BASE}/api/docs/${docId}/trash`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ trashed })
    });
    
    if (!res.ok) {
      throw new Error(`Trash operation failed: ${await res.text()}`);
    }
    
    console.log(`✅ Document ${trashed ? 'trashed' : 'restored'} in Render:`, docId);
    
    // ✅ Update Firestore
    if (isFirebaseAvailable()) {
      try {
        const docRef = window.fs.doc(window.db, "documents", docId);
        await window.fs.updateDoc(docRef, {
          _trashed: !!trashed,
          lastModified: Date.now()
        });
        console.log("✅ Document updated in Firestore");
      } catch (err) {
        console.warn("⚠️ Firestore update failed:", err);
      }
    }
    
    // ✅ Update local cache
    if (Array.isArray(window.allDocsData)) {
      const idx = window.allDocsData.findIndex(d => d.id === docId);
      if (idx >= 0) {
        window.allDocsData[idx]._trashed = !!trashed;
        window.allDocsData[idx].lastModified = Date.now();
      }
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Trash operation error:', error);
    throw error;
  }
}

// ═════════════════ 5. Delete Permanently ═════════════════

async function deleteDocForever(docId) {
  try {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${API_BASE}/api/docs/${docId}`, {
      method: 'DELETE',
      headers
    });
    
    if (!res.ok) {
      throw new Error(`Delete failed: ${await res.text()}`);
    }
    
    console.log('✅ Document permanently deleted from Render:', docId);
    
    // ✅ Delete from Firestore
    if (isFirebaseAvailable()) {
      try {
        const docRef = window.fs.doc(window.db, "documents", docId);
        await window.fs.deleteDoc(docRef);
        console.log("✅ Document deleted from Firestore");
      } catch (err) {
        console.warn("⚠️ Firestore deletion failed:", err);
      }
    }
    
    // ✅ Remove from local cache
    if (Array.isArray(window.allDocsData)) {
      const idx = window.allDocsData.findIndex(d => d.id === docId);
      if (idx >= 0) {
        window.allDocsData.splice(idx, 1);
      }
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error;
  }
}

// ═════════════════ 6. Download ═════════════════

async function downloadDocument(docId, fileName) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/docs/${docId}/download`, { headers });
    
    if (!res.ok) {
      throw new Error('Download failed');
    }
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Document downloaded:', docId);
  } catch (error) {
    console.error('❌ Download error:', error);
    throw error;
  }
}

// ═════════════════ Expose Globally ═════════════════

window.loadDocuments = loadDocuments;
window.uploadDocument = uploadDocument;
window.updateDocument = updateDocument;
window.markDocTrashed = markDocTrashed;
window.deleteDocForever = deleteDocForever;
window.downloadDocument = downloadDocument;

console.log('✅ API Bridge (IMPROVED) loaded - Render + Firestore sync ready!');
