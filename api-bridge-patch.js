// ========================================
// 🔧 api-bridge-quick-fix.js - תיקון פשוט
// ========================================
// הוסיפי defer לשני הקבצים:
// <script src="api-bridge.js" defer></script>
// <script src="api-bridge-quick-fix.js" defer></script>

console.log('🔧 Quick fix for api-bridge loading...');

// פונקציית עזר לחכות לטעינה
function waitForGlobal(name, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (window[name] || typeof eval(`typeof ${name}`) !== 'undefined') {
        resolve(window[name] || eval(name));
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`${name} not loaded after ${timeout}ms`));
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

// המתן שהכל ייטען
Promise.all([
  waitForGlobal('getCurrentUser'),
  waitForGlobal('getAuthHeaders'),
  waitForGlobal('loadDocuments')
]).then(() => {
  console.log('✅ api-bridge functions loaded');
  
  // שמירת הפונקציה המקורית
  const originalLoadDocuments = window.loadDocuments;
  
  // פונקציה מתוקנת
  window.loadDocuments = async function() {
    try {
      const me = getCurrentUser();
      if (!me) {
        console.error('❌ Cannot load documents - not logged in');
        return [];
      }

      const API_BASE = (location.hostname === 'localhost')
        ? 'http://localhost:8787'
        : 'https://eco-files.onrender.com';

      console.log("📡 Loading documents from:", API_BASE);
      
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
        throw new Error(`API returned ${res.status}`);
      }
      
      const data = await res.json();
      
      // 🔧 תיקון: זיהוי פורמט התגובה
      let list;
      
      if (Array.isArray(data)) {
        list = data;
        console.log('✅ Response is array, length:', list.length);
      } else if (data && typeof data === 'object') {
        // בדיקת שדות אפשריים
        if (Array.isArray(data.documents)) {
          list = data.documents;
          console.log('✅ Found data.documents, length:', list.length);
        } else if (Array.isArray(data.data)) {
          list = data.data;
          console.log('✅ Found data.data, length:', list.length);
        } else if (Array.isArray(data.docs)) {
          list = data.docs;
          console.log('✅ Found data.docs, length:', list.length);
        } else {
          // המרה לערכים
          list = Object.values(data);
          console.log('⚠️ Converted to array, length:', list.length);
        }
      } else {
        throw new Error('Invalid response format');
      }
      
      if (!Array.isArray(list)) {
        throw new Error('Could not extract array from response');
      }
      
      console.log(`✅ Loaded ${list.length} documents from Render`);
      
      // מיפוי
      return list.map(d => ({
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
      })).filter(d => d.id); // רק מסמכים עם ID
      
    } catch (error) {
      console.error('❌ Patched loadDocuments failed:', error.message);
      
      // fallback ל-Firestore
      if (typeof loadFromFirestore === 'function') {
        console.log('🔄 Trying Firestore fallback...');
        return await loadFromFirestore(getCurrentUser());
      }
      
      return [];
    }
  };
  
  console.log('✅ loadDocuments patched');
  
}).catch(error => {
  console.error('❌ Failed to patch api-bridge:', error);
});