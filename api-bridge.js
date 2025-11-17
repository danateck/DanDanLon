// ═══════════════════════════════════════════════════════════════════
//     api-bridge-fixed.js - תיקון מלא לכל הבעיות!
// ═══════════════════════════════════════════════════════════════════

const API_BASE = (location.hostname === 'localhost')
  ? 'http://localhost:8787'
  : 'https://eco-files.onrender.com';

console.log("🔗 API Bridge (COMPLETE FIX) starting...");
console.log("📍 API URL:", API_BASE);

// ═══════════════════════════════════════════════════════════════════
//                         AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════

function getCurrentUser() {
  if (typeof getCurrentUserEmail === "function") {
    const email = getCurrentUserEmail();
    if (email) return email.toLowerCase().trim();
  }
  
  if (window.auth?.currentUser?.email) {
    return window.auth.currentUser.email.toLowerCase().trim();
  }
  
  if (typeof auth !== "undefined" && auth?.currentUser?.email) {
    return auth.currentUser.email.toLowerCase().trim();
  }
  
  console.error("❌ Cannot get user email!");
  return null;
}

async function getAuthHeaders() {
  const headers = {};
  const userEmail = getCurrentUser();
  
  if (!userEmail) {
    console.error("❌ No user email for headers!");
    return headers;
  }
  
  console.log("👤 User for request:", userEmail);
  headers['X-Dev-Email'] = userEmail;
  
  if (window.auth?.currentUser) {
    try {
      const token = await window.auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      console.log("✅ Added Firebase token");
    } catch (err) {
      console.warn('⚠️ Could not get Firebase token:', err.message);
    }
  }
  
  return headers;
}

// ═══════════════════════════════════════════════════════════════════
//                         DOCUMENTS API
// ═══════════════════════════════════════════════════════════════════

async function loadDocuments() {
  const me = getCurrentUser();
  if (!me) {
    console.error('❌ Cannot load documents - not logged in');
    return [];
  }

  console.log("📡 Loading documents from:", API_BASE);

  try {
    const headers = await getAuthHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(`${API_BASE}/api/docs`, { 
      headers,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ API error ${res.status}:`, text);
      throw new Error(`API returned ${res.status}: ${text}`);
    }
    
    const list = await res.json();
    console.log(`✅ Loaded ${list.length} documents from server`);
    
    // Transform to match expected format
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
      sharedFolderId: d.shared_folder_id || null,
      hasFile: true,
      downloadURL: `${API_BASE}/api/docs/${d.id}/download`
    }));
    
    // Update global cache
    window.allDocsData = docs;
    
    // Sync to Firestore in background
    syncDocsToFirestore(docs).catch(err => 
      console.warn("⚠️ Firestore sync failed:", err)
    );
    
    return docs;
    
  } catch (error) {
    console.error('❌ Server API failed:', error.message);
    console.log("🔄 Falling back to Firestore...");
    return await loadFromFirestore(me);
  }
}

async function loadFromFirestore(userEmail) {
  if (!window.db || !window.fs) {
    console.error("❌ Firebase not available");
    return [];
  }
  
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

async function syncDocsToFirestore(docs) {
  if (!window.db || !window.fs) return;
  
  try {
    for (const doc of docs) {
      const docRef = window.fs.doc(window.db, "documents", doc.id);
      await window.fs.setDoc(docRef, doc, { merge: true });
    }
    console.log("✅ Synced", docs.length, "documents to Firestore");
  } catch (err) {
    console.warn("⚠️ Firestore sync failed:", err);
  }
}

async function uploadDocument(file, metadata = {}) {
  const me = getCurrentUser();
  if (!me) {
    throw new Error("Not logged in");
  }

  console.log("📤 Uploading file:", file.name);

  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', metadata.title ?? file.name);
    fd.append('category', metadata.category ?? 'אחר');
    fd.append('year', metadata.year ?? String(new Date().getFullYear()));
    fd.append('org', metadata.org ?? '');
    fd.append('recipient', JSON.stringify(Array.isArray(metadata.recipient) ? metadata.recipient : []));
    fd.append('sharedFolderId', metadata.sharedFolderId || '');
    
    if (metadata.warrantyStart) fd.append('warrantyStart', metadata.warrantyStart);
    if (metadata.warrantyExpiresAt) fd.append('warrantyExpiresAt', metadata.warrantyExpiresAt);
    if (metadata.autoDeleteAfter) fd.append('autoDeleteAfter', metadata.autoDeleteAfter);

    const headers = await getAuthHeaders();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const res = await fetch(`${API_BASE}/api/docs`, { 
      method: 'POST', 
      headers, 
      body: fd,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Upload failed ${res.status}:`, text);
      throw new Error(`Upload failed: ${text}`);
    }
    
    const result = await res.json();
    console.log('✅ Uploaded:', result.id);
    
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
      sharedFolderId: metadata.sharedFolderId || null,
      owner: me,
      uploadedAt: result.uploaded_at || Date.now(),
      lastModified: result.uploaded_at || Date.now(),
      _trashed: false,
      hasFile: true,
      downloadURL: `${API_BASE}/api/docs/${result.id}/download`
    };
    
    // Sync to Firestore
    if (window.db && window.fs) {
      const docRef = window.fs.doc(window.db, "documents", doc.id);
      await window.fs.setDoc(docRef, doc, { merge: true }).catch(err => 
        console.warn("⚠️ Firestore sync failed:", err)
      );
    }
    
    // Update local cache
    if (Array.isArray(window.allDocsData)) {
      window.allDocsData.push(doc);
    }
    
    return doc;
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}

async function updateDocument(docId, updates) {
  const me = getCurrentUser();
  if (!me) throw new Error("Not logged in");
  
  console.log("📝 Updating document:", docId, updates);
  
  try {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(`${API_BASE}/api/docs/${docId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Update failed: ${text}`);
    }
    
    console.log('✅ Updated on server:', docId);
    
    // Update Firestore
    if (window.db && window.fs) {
      const docRef = window.fs.doc(window.db, "documents", docId);
      await window.fs.updateDoc(docRef, {
        ...updates,
        lastModified: Date.now(),
        lastModifiedBy: me
      }).catch(err => console.warn("⚠️ Firestore update failed:", err));
    }
    
    // Update local cache
    if (Array.isArray(window.allDocsData)) {
      const idx = window.allDocsData.findIndex(d => d.id === docId);
      if (idx >= 0) {
        Object.assign(window.allDocsData[idx], updates, { 
          lastModified: Date.now(),
          lastModifiedBy: me
        });
      }
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Update error:', error);
    throw error;
  }
}

async function markDocTrashed(docId, trashed) {
  const me = getCurrentUser();
  if (!me) throw new Error("Not logged in");

  let backendOk = false;

  try {
    const headers = await getAuthHeaders();
    headers["Content-Type"] = "application/json";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${API_BASE}/api/docs/${docId}/trash`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ trashed }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      console.warn("⚠️ Trash failed on backend:", text);
    } else {
      backendOk = true;
      console.log('✅ Trashed on server:', docId);
    }
  } catch (error) {
    console.warn("⚠️ Trash request failed:", error);
  }

  // Always update locally
  if (window.db && window.fs) {
    try {
      const docRef = window.fs.doc(window.db, "documents", docId);
      await window.fs.updateDoc(docRef, {
        _trashed: !!trashed,
        lastModified: Date.now(),
      });
    } catch (err) {
      console.warn("⚠️ Firestore update failed:", err);
    }
  }

  if (Array.isArray(window.allDocsData)) {
    const idx = window.allDocsData.findIndex((d) => d.id === docId);
    if (idx >= 0) {
      window.allDocsData[idx]._trashed = !!trashed;
      window.allDocsData[idx].lastModified = Date.now();
    }
  }

  console.log(`✅ ${trashed ? "Trashed" : "Restored"} locally:`, docId);
  return { backendOk };
}

async function deleteDocForever(docId) {
  const me = getCurrentUser();
  if (!me) throw new Error("Not logged in");

  let backendOk = false;

  try {
    const headers = await getAuthHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${API_BASE}/api/docs/${docId}`, {
      method: "DELETE",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 404) {
      console.warn("⚠️ Doc not found on server, deleting locally");
    } else if (!res.ok) {
      const text = await res.text();
      console.warn("⚠️ Delete failed on backend:", text);
    } else {
      backendOk = true;
      console.log('✅ Deleted on server:', docId);
    }
  } catch (error) {
    console.warn("⚠️ Delete request failed:", error);
  }

  // Always delete locally
  if (window.db && window.fs) {
    try {
      const docRef = window.fs.doc(window.db, "documents", docId);
      await window.fs.deleteDoc(docRef);
    } catch (err) {
      console.warn("⚠️ Firestore delete failed:", err);
    }
  }

  if (Array.isArray(window.allDocsData)) {
    const idx = window.allDocsData.findIndex((d) => d.id === docId);
    if (idx >= 0) {
      window.allDocsData.splice(idx, 1);
    }
  }

  console.log("✅ Deleted locally:", docId);
  return { backendOk };
}

async function downloadDocument(docId, fileName) {
  const me = getCurrentUser();
  if (!me) throw new Error("Not logged in");
  
  console.log("📥 Downloading document:", docId);
  
  try {
    const headers = await getAuthHeaders();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const res = await fetch(`${API_BASE}/api/docs/${docId}/download`, { 
      headers,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.error(`❌ Download failed: ${res.status}`);
      throw new Error(`Download failed: ${res.status}`);
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
    
    console.log('✅ Downloaded:', docId);
  } catch (error) {
    console.error('❌ Download error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
//                    SHARED FOLDERS API
// ═══════════════════════════════════════════════════════════════════

async function loadSharedFolders() {
  const me = getCurrentUser();
  if (!me) {
    console.error('❌ Cannot load folders - not logged in');
    return [];
  }

  console.log("📂 Loading shared folders...");

  try {
    const headers = await getAuthHeaders();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(`${API_BASE}/api/shared-folders`, { 
      headers,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ API error ${res.status}:`, text);
      throw new Error(`API returned ${res.status}`);
    }
    
    const folders = await res.json();
    console.log(`✅ Loaded ${folders.length} shared folders from server`);
    
    // Sync to Firestore
    syncFoldersToFirestore(folders).catch(err => 
      console.warn("⚠️ Firestore folder sync failed:", err)
    );
    
    return folders;
    
  } catch (error) {
    console.error('❌ Server API failed:', error.message);
    console.log("🔄 Falling back to Firestore...");
    return await loadFoldersFromFirestore(me);
  }
}

async function loadFoldersFromFirestore(userEmail) {
  if (!window.db || !window.fs) {
    console.error("❌ Firebase not available");
    return [];
  }
  
  try {
    const col = window.fs.collection(window.db, "sharedFolders");
    const q = window.fs.query(
      col, 
      window.fs.where("members", "array-contains", userEmail)
    );
    
    const snap = await window.fs.getDocs(q);
    const folders = [];
    snap.forEach(doc => {
      folders.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Loaded ${folders.length} folders from Firestore`);
    return folders;
  } catch (err) {
    console.error("❌ Firestore folder load failed:", err);
    return [];
  }
}

async function syncFoldersToFirestore(folders) {
  if (!window.db || !window.fs) return;
  
  try {
    for (const folder of folders) {
      const folderRef = window.fs.doc(window.db, "sharedFolders", folder.id);
      await window.fs.setDoc(folderRef, folder, { merge: true });
    }
    console.log("✅ Synced", folders.length, "folders to Firestore");
  } catch (err) {
    console.warn("⚠️ Firestore folder sync failed:", err);
  }
}

async function createSharedFolder(name, description = '') {
  const me = getCurrentUser();
  if (!me) throw new Error("Not logged in");
  
  console.log("📁 Creating shared folder:", name);
  
  try {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(`${API_BASE}/api/shared-folders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, description }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Create folder failed: ${text}`);
    }
    
    const folder = await res.json();
    console.log('✅ Created folder:', folder.id);
    
    // Sync to Firestore
    if (window.db && window.fs) {
      const folderRef = window.fs.doc(window.db, "sharedFolders", folder.id);
      await window.fs.setDoc(folderRef, folder).catch(err => 
        console.warn("⚠️ Firestore sync failed:", err)
      );
    }
    
    return folder;
    
  } catch (error) {
    console.error('❌ Create folder error:', error);
    throw error;
  }
}

async function updateSharedFolder(folderId, updates) {
  const me = getCurrentUser();
  if (!me) throw new Error("Not logged in");
  
  console.log("📝 Updating folder:", folderId, updates);
  
  try {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(`${API_BASE}/api/shared-folders/${folderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Update folder failed: ${text}`);
    }
    
    console.log('✅ Updated folder on server:', folderId);
    
    // Update Firestore
    if (window.db && window.fs) {
      const folderRef = window.fs.doc(window.db, "sharedFolders", folderId);
      await window.fs.updateDoc(folderRef, updates).catch(err => 
        console.warn("⚠️ Firestore update failed:", err)
      );
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Update folder error:', error);
    throw error;
  }
}

async function deleteSharedFolder(folderId) {
  const me = getCurrentUser();
  if (!me) throw new Error("Not logged in");
  
  console.log("🗑️ Deleting folder:", folderId);
  
  try {
    const headers = await getAuthHeaders();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(`${API_BASE}/api/shared-folders/${folderId}`, {
      method: 'DELETE',
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Delete folder failed: ${text}`);
    }
    
    console.log('✅ Deleted folder on server:', folderId);
    
    // Delete from Firestore
    if (window.db && window.fs) {
      const folderRef = window.fs.doc(window.db, "sharedFolders", folderId);
      await window.fs.deleteDoc(folderRef).catch(err => 
        console.warn("⚠️ Firestore delete failed:", err)
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Delete folder error:', error);
    throw error;
  }
}

async function addMemberToFolder(folderId, email) {
  const me = getCurrentUser();
  if (!me) throw new Error("Not logged in");
  
  console.log("👥 Adding member to folder:", folderId, email);
  
  try {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(`${API_BASE}/api/shared-folders/${folderId}/members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Add member failed: ${text}`);
    }
    
    console.log('✅ Added member on server');
    
    // Update Firestore
    if (window.db && window.fs) {
      const folderRef = window.fs.doc(window.db, "sharedFolders", folderId);
      await window.fs.updateDoc(folderRef, {
        members: window.fs.arrayUnion(email.toLowerCase().trim())
      }).catch(err => console.warn("⚠️ Firestore update failed:", err));
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Add member error:', error);
    throw error;
  }
}

async function removeMemberFromFolder(folderId, email) {
  const me = getCurrentUser();
  if (!me) throw new Error("Not logged in");
  
  console.log("👥 Removing member from folder:", folderId, email);
  
  try {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(`${API_BASE}/api/shared-folders/${folderId}/members`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Remove member failed: ${text}`);
    }
    
    console.log('✅ Removed member on server');
    
    // Update Firestore - need to load, modify, and save since arrayRemove doesn't work well
    if (window.db && window.fs) {
      try {
        const folderRef = window.fs.doc(window.db, "sharedFolders", folderId);
        const folderSnap = await window.fs.getDoc(folderRef);
        if (folderSnap.exists()) {
          const data = folderSnap.data();
          const members = (data.members || []).filter(m => m !== email.toLowerCase().trim());
          await window.fs.updateDoc(folderRef, { members });
        }
      } catch (err) {
        console.warn("⚠️ Firestore update failed:", err);
      }
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Remove member error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
//                    EXPOSE GLOBALLY
// ═══════════════════════════════════════════════════════════════════

// Documents
window.loadDocuments = loadDocuments;
window.uploadDocument = uploadDocument;
window.updateDocument = updateDocument;
window.markDocTrashed = markDocTrashed;
window.deleteDocForever = deleteDocForever;
window.downloadDocument = downloadDocument;

// Shared Folders
window.loadSharedFolders = loadSharedFolders;
window.createSharedFolder = createSharedFolder;
window.updateSharedFolder = updateSharedFolder;
window.deleteSharedFolder = deleteSharedFolder;
window.addMemberToFolder = addMemberToFolder;
window.removeMemberFromFolder = removeMemberFromFolder;

// Debug helper
window.testAuth = async function() {
  console.log("🔍 Testing authentication...");
  const user = getCurrentUser();
  console.log("User:", user);
  const headers = await getAuthHeaders();
  console.log("Headers:", headers);
  return { user, headers };
};

console.log('✅ API Bridge (COMPLETE FIX) loaded!');
console.log('💡 Debug: Run testAuth() to check authentication');
console.log('📂 Shared folders support enabled');
