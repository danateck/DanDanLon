// ========================================
// 🔧 api-bridge-patch.js - תיקון מהיר
// ========================================
// טען את הקובץ הזה מיד אחרי api-bridge.js

console.log('🔧 Patching api-bridge.js...');

// שומר את הפונקציה המקורית
const originalLoadDocuments = window.loadDocuments || loadDocuments;

// פונקציה מתוקנת
async function loadDocumentsFixed() {
  const me = getCurrentUser();
  if (!me) {
    console.error('❌ Cannot load documents - not logged in');
    return [];
  }

  console.log("📡 Loading documents from:", API_BASE);

  try {
    const headers = await getAuthHeaders();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
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
    
    const data = await res.json();
    console.log('📦 Response type:', typeof data);
    console.log('📦 Is array?', Array.isArray(data));
    
    // 🔧 תיקון: טיפול בפורמטים שונים
    let list;
    if (Array.isArray(data)) {
      // המקרה הטוב - זה כבר מערך
      list = data;
      console.log('✅ Response is array');
    } else if (data && typeof data === 'object') {
      // זה אובייקט - בדיקת מבנים אפשריים
      if (data.documents && Array.isArray(data.documents)) {
        list = data.documents;
        console.log('✅ Found data.documents array');
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
        console.log('✅ Found data.data array');
      } else {
        // ניסיון אחרון - המרה לערכים
        list = Object.values(data);
        console.log('⚠️ Converted object to array:', list.length, 'items');
      }
    } else {
      console.error('❌ Unexpected response:', data);
      throw new Error('Invalid response format');
    }
    
    // בדיקה שיש לנו מערך
    if (!Array.isArray(list)) {
      console.error('❌ list is not an array:', typeof list);
      throw new Error('Could not extract array from response');
    }
    
    console.log(`✅ Loaded ${list.length} documents from Render`);
    
    // מיפוי המסמכים
    return list.map(d => {
      if (!d || typeof d !== 'object') {
        console.warn('⚠️ Invalid document item:', d);
        return null;
      }
      
      return {
        id: d.id,
        title: d.title || d.file_name || d.fileName || 'ללא שם',
        fileName: d.file_name || d.fileName || 'unknown',
        fileType: d.mime_type || d.mimeType || 'application/octet-stream',
        fileSize: d.file_size || d.fileSize || 0,
        category: d.category || 'אחר',
        subCategory: d.sub_category || d.subCategory || null,
        year: d.year || '',
        org: d.org || '',
        recipient: Array.isArray(d.recipient) ? d.recipient : [],
        sharedWith: d.shared_with || d.sharedWith || [],
        uploadedAt: d.uploaded_at || d.uploadedAt || d.created_at || d.createdAt || new Date().toISOString(),
        lastModified: d.last_modified || d.lastModified || Date.now(),
        lastModifiedBy: d.last_modified_by || d.lastModifiedBy || me,
        owner: d.owner || me,
        _trashed: d.trashed || d._trashed || false,
        deletedAt: d.deleted_at || d.deletedAt || null,
        deletedBy: d.deleted_by || d.deletedBy || null,
        hasFile: true,
        downloadURL: `${API_BASE}/api/docs/${d.id}/download`
      };
    }).filter(Boolean); // מסיר nulls
    
  } catch (error) {
    console.error('❌ Render API failed:', error.message);
    console.log("🔄 Falling back to Firestore...");
    
    // נסיון fallback ל-Firestore
    if (typeof loadFromFirestore === 'function') {
      return await loadFromFirestore(me);
    }
    
    // אם אין Firestore, מחזיר מערך ריק
    console.warn('⚠️ No Firestore fallback available');
    return [];
  }
}

// החלפת הפונקציה
if (typeof loadDocuments !== 'undefined') {
  window.loadDocuments = loadDocumentsFixed;
  loadDocuments = loadDocumentsFixed;
  console.log('✅ loadDocuments patched successfully');
} else {
  console.warn('⚠️ loadDocuments not found, creating new one');
  window.loadDocuments = loadDocumentsFixed;
}

console.log('✅ api-bridge patch applied');