// ===== תיקון מלא לבעיות ניווט ושיוך בתיקיות משותפות =====

console.log("🔧 Loading shared folders navigation fix...");

// ===== פונקציה 1: מעקב אחר תיקייה נוכחית =====
function trackCurrentFolder(folderId) {
  if (folderId) {
    console.log("📌 Tracking current folder:", folderId);
    window.currentFolderId = folderId;
    sessionStorage.setItem('currentFolderId', folderId);
    
    // עדכון URL
    try {
      const url = new URL(window.location);
      url.searchParams.set("sharedFolder", folderId);
      window.history.pushState({}, "", url);
    } catch (e) {
      console.warn("Cannot update URL:", e);
    }
  }
}

// ===== פונקציה 2: קבלת תיקייה נוכחית =====
function getCurrentFolderId() {
  // נסה מכמה מקורות
  if (window.currentFolderId) {
    console.log("📂 Current folder from window:", window.currentFolderId);
    return window.currentFolderId;
  }
  
  try {
    const stored = sessionStorage.getItem('currentFolderId');
    if (stored) {
      console.log("📂 Current folder from session:", stored);
      window.currentFolderId = stored;
      return stored;
    }
  } catch (e) {
    console.warn("Cannot read from sessionStorage:", e);
  }
  
  try {
    const url = new URL(window.location);
    const fromUrl = url.searchParams.get("sharedFolder");
    if (fromUrl) {
      console.log("📂 Current folder from URL:", fromUrl);
      window.currentFolderId = fromUrl;
      return fromUrl;
    }
  } catch (e) {
    console.warn("Cannot read from URL:", e);
  }
  
  console.warn("⚠️ No current folder found");
  return null;
}

// ===== פונקציה 3: פתיחת תיקייה משותפת =====
async function openSharedFolder(folderId) {
  console.log("📂 Opening shared folder:", folderId);
  
  if (!folderId) {
    console.error("❌ No folderId provided");
    return;
  }
  
  // Track את התיקייה
  trackCurrentFolder(folderId);
  
  const docsList = document.getElementById("docs-list");
  const categoryTitle = document.getElementById("category-title");
  
  if (!docsList || !categoryTitle) {
    console.error("❌ Required elements not found");
    return;
  }
  
  // קבל את שם התיקייה
  let folderName = "תיקייה משותפת";
  try {
    if (window.isFirebaseAvailable && window.isFirebaseAvailable()) {
      const folderRef = window.fs.doc(window.db, "sharedFolders", folderId);
      const snap = await window.fs.getDoc(folderRef);
      if (snap.exists()) {
        folderName = snap.data().name || folderName;
      }
    } else if (window.allUsersData && window.userNow) {
      const me = window.allUsersData[window.userNow];
      folderName = me?.sharedFolders?.[folderId]?.name || folderName;
    }
  } catch (e) {
    console.warn("Cannot get folder name:", e);
  }
  
  categoryTitle.textContent = folderName;
  
  // נקה והוסף מצב shared
  docsList.innerHTML = "";
  docsList.classList.add("shared-mode");
  
  // צור את הממשק
  await buildSharedFolderUI(folderId, folderName);
}

// ===== פונקציה 4: בניית ממשק תיקייה משותפת =====
async function buildSharedFolderUI(folderId, folderName) {
  const docsList = document.getElementById("docs-list");
  
  // Container עבור הבלוקים העליונים
  const topBlocksContainer = document.createElement("div");
  topBlocksContainer.className = "shared-top-blocks";
  docsList.appendChild(topBlocksContainer);
  
  // בלוק משתתפים
  const membersBar = document.createElement("div");
  membersBar.className = "cozy-head";
  membersBar.innerHTML = `
    <h3 style="margin:0;">משתתפים</h3>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;width:100%;">
      <input id="detail_inv_email" placeholder="הוסף מייל לשיתוף"
             style="padding:.5rem;border:1px solid #2b3c3c;border-radius:10px;background:#101a1a;color:#e0f0ee;flex:1;min-width:200px;max-width:100%;box-sizing:border-box;">
      <button id="detail_inv_btn" class="btn-cozy" style="white-space:nowrap;">הוסף משתתף</button>
    </div>
  `;
  topBlocksContainer.appendChild(membersBar);
  
  // בלוק רשימת משתתפים
  const membersList = document.createElement("div");
  membersList.className = "pending-wrap";
  membersList.innerHTML = `<div id="members_chips" style="display:flex;flex-wrap:wrap;gap:8px;width:100%;"></div>`;
  topBlocksContainer.appendChild(membersList);
  
  // טען משתתפים
  await loadAndDisplayMembers(folderId, membersList);
  
  // בלוק כפתורים
  const docsHead = document.createElement("div");
  docsHead.className = "cozy-head";
  docsHead.innerHTML = `
    <h3 style="margin:0;">מסמכים משותפים</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap;width:100%;">
      <button id="upload_to_shared_btn" class="btn-cozy">📤 העלה מסמך</button>
      <button id="assign_doc_btn" class="btn-cozy">🔗 שייך מסמך קיים</button>
      <button id="refresh_docs_btn" class="btn-cozy">🔄 רענן רשימה</button>
    </div>
  `;
  topBlocksContainer.appendChild(docsHead);
  
  // Grid המסמכים
  const docsBox = document.createElement("div");
  docsBox.className = "docs-grid";
  docsList.appendChild(docsBox);
  
  // טען מסמכים
  await loadAndDisplaySharedDocs(folderId, docsBox);
  
  // הוסף event listeners
  setupSharedFolderEventListeners(folderId, membersBar, docsHead, docsBox);
}

// ===== פונקציה 5: טעינת והצגת משתתפים =====
async function loadAndDisplayMembers(folderId, membersList) {
  const chips = membersList.querySelector("#members_chips");
  
  const paintMembers = (arr = []) => {
    chips.innerHTML = arr.map(email => 
      `<span class="btn-min" style="cursor:default">${email}</span>`
    ).join("");
  };
  
  try {
    if (window.isFirebaseAvailable && window.isFirebaseAvailable()) {
      const folderRef = window.fs.doc(window.db, "sharedFolders", folderId);
      const folderSnap = await window.fs.getDoc(folderRef);
      
      if (folderSnap.exists()) {
        const members = folderSnap.data().members || [];
        paintMembers(members);
        console.log("✅ Loaded members:", members);
        
        // הוסף מעקב זמן אמת
        if (window._stopMembersWatch) {
          try { window._stopMembersWatch(); } catch(e) {}
        }
        
        window._stopMembersWatch = window.fs.onSnapshot(folderRef, (snap) => {
          if (snap.exists()) {
            const members = snap.data().members || [];
            paintMembers(members);
          }
        }, (err) => console.error("watchMembers error:", err));
      } else {
        console.warn("⚠️ Folder not found");
        paintMembers([]);
      }
    } else {
      // מצב offline
      const me = window.allUsersData?.[window.userNow];
      paintMembers(me?.sharedFolders?.[folderId]?.members || []);
    }
  } catch (err) {
    console.error("❌ Failed to load members:", err);
    paintMembers([]);
  }
}

// ===== פונקציה 6: טעינת והצגת מסמכים =====
async function loadAndDisplaySharedDocs(folderId, docsBox) {
  docsBox.innerHTML = "<div style='opacity:.7;padding:20px;text-align:center'>טוען מסמכים...</div>";
  
  try {
    if (window.isFirebaseAvailable && window.isFirebaseAvailable()) {
      // סנכרון ואז טעינה
      if (typeof window.syncMySharedDocsToFirestore === 'function') {
        await window.syncMySharedDocsToFirestore();
      }
      
      if (typeof window.fetchSharedFolderDocsFromFirestore === 'function') {
        const docs = await window.fetchSharedFolderDocsFromFirestore(folderId);
        displayDocs(docs, docsBox);
        
        // הוסף מעקב זמן אמת
        if (window._stopSharedDocsWatch) {
          try { window._stopSharedDocsWatch(); } catch(e) {}
        }
        
        if (typeof window.watchSharedFolderDocs === 'function') {
          window._stopSharedDocsWatch = window.watchSharedFolderDocs(folderId, (rows) => {
            console.log("🔄 Real-time update:", rows.length, "documents");
            displayDocs(rows, docsBox);
          });
        }
      }
    } else {
      // מצב offline
      if (typeof window.collectSharedFolderDocs === 'function') {
        const docs = window.collectSharedFolderDocs(window.allUsersData, folderId);
        displayDocs(docs, docsBox);
      }
    }
  } catch (err) {
    console.error("❌ Failed to load docs:", err);
    docsBox.innerHTML = "<div style='opacity:.7;padding:20px;text-align:center;color:#ff6b6b'>שגיאה בטעינת מסמכים</div>";
  }
}

// ===== פונקציה עזר: הצגת מסמכים =====
function displayDocs(docs, docsBox) {
  docsBox.innerHTML = "";
  
  if (!docs || docs.length === 0) {
    docsBox.innerHTML = "<div style='opacity:.7;padding:20px;text-align:center'>אין עדיין מסמכים בתיקייה זו</div>";
    return;
  }
  
  // מיון
  const sorted = typeof window.sortDocs === 'function' ? window.sortDocs(docs) : docs;
  
  sorted.forEach(doc => {
    if (typeof window.buildDocCard === 'function') {
      const card = window.buildDocCard(doc, "shared");
      const meta = card.querySelector(".doc-card-meta");
      if (meta) {
        const span = document.createElement("span");
        span.textContent = `הועלה ע"י: ${doc._ownerEmail || "-"}`;
        meta.appendChild(span);
      }
      docsBox.appendChild(card);
    }
  });
}

// ===== פונקציה 7: הוספת event listeners =====
function setupSharedFolderEventListeners(folderId, membersBar, docsHead, docsBox) {
  const myEmail = window.getCurrentUserEmail ? window.getCurrentUserEmail() : "";
  
  // כפתור הזמנת משתתף
  const inviteBtn = membersBar.querySelector("#detail_inv_btn");
  const emailInput = membersBar.querySelector("#detail_inv_email");
  
  if (inviteBtn && emailInput) {
    inviteBtn.addEventListener("click", async () => {
      const targetEmail = (emailInput.value || "").trim().toLowerCase();
      
      if (!targetEmail) {
        if (typeof window.showNotification === 'function') {
          window.showNotification("הקלידי מייל של הנמען", true);
        }
        return;
      }
      
      if (targetEmail === myEmail) {
        if (typeof window.showNotification === 'function') {
          window.showNotification("את כבר חברה בתיקייה הזו", true);
        }
        return;
      }
      
      // בדוק אם המשתמש קיים
      if (typeof window.showLoading === 'function') {
        window.showLoading("בודק אם המשתמש קיים...");
      }
      
      const exists = typeof window.checkUserExistsInFirestore === 'function' 
        ? await window.checkUserExistsInFirestore(targetEmail)
        : true;
        
      if (typeof window.hideLoading === 'function') {
        window.hideLoading();
      }
      
      if (!exists) {
        if (typeof window.showNotification === 'function') {
          window.showNotification("אין משתמש עם המייל הזה במערכת", true);
        }
        return;
      }
      
      // שלח הזמנה
      if (typeof window.showLoading === 'function') {
        window.showLoading("שולח הזמנה...");
      }
      
      const folderName = document.getElementById("category-title")?.textContent || "תיקייה משותפת";
      
      const success = typeof window.sendShareInviteToFirestore === 'function'
        ? await window.sendShareInviteToFirestore(myEmail, targetEmail, folderId, folderName)
        : false;
        
      if (typeof window.hideLoading === 'function') {
        window.hideLoading();
      }
      
      if (success) {
        if (typeof window.showNotification === 'function') {
          window.showNotification("ההזמנה נשלחה בהצלחה! ✉️");
        }
        emailInput.value = "";
      } else {
        if (typeof window.showNotification === 'function') {
          window.showNotification("שגיאה בשליחת ההזמנה, נסי שוב", true);
        }
      }
    });
  }
  
  // כפתור העלאת מסמך
  const uploadBtn = docsHead.querySelector("#upload_to_shared_btn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => handleUploadToShared(folderId, myEmail));
  }
  
  // כפתור שיוך מסמך קיים
  const assignBtn = docsHead.querySelector("#assign_doc_btn");
  if (assignBtn) {
    assignBtn.addEventListener("click", () => handleAssignExistingDoc(folderId));
  }
  
  // כפתור רענון
  const refreshBtn = docsHead.querySelector("#refresh_docs_btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      if (typeof window.showNotification === 'function') {
        window.showNotification("מרענן רשימת מסמכים...");
      }
      await loadAndDisplaySharedDocs(folderId, docsBox);
      if (typeof window.showNotification === 'function') {
        window.showNotification("הרשימה עודכנה ✅");
      }
    });
  }
}

// ===== פונקציה 8: העלאת מסמך לתיקייה =====
async function handleUploadToShared(folderId, myEmail) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "*/*";
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (typeof window.showLoading === 'function') {
      window.showLoading(`מעלה ${file.name}...`);
    }
    
    try {
      const API_BASE = window.API_BASE || 
        (location.hostname === 'localhost' ? 'http://localhost:8787' : 'https://eco-files.onrender.com');
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("sharedFolderId", folderId);
      
      const response = await fetch(`${API_BASE}/api/docs`, {
        method: "POST",
        headers: { "X-Dev-Email": myEmail },
        body: formData
      });
      
      if (!response.ok) throw new Error("Upload failed");
      const uploadedDoc = await response.json();
      console.log("✅ Document uploaded:", uploadedDoc);
      
      // עדכן shared_with עם חברי התיקייה
      if (window.isFirebaseAvailable && window.isFirebaseAvailable()) {
        const folderRef = window.fs.doc(window.db, "sharedFolders", folderId);
        const folderSnap = await window.fs.getDoc(folderRef);
        
        if (folderSnap.exists()) {
          const members = (folderSnap.data().members || [])
            .map(e => e.toLowerCase())
            .filter(e => e !== myEmail.toLowerCase());
          
          if (members.length > 0 && typeof window.updateDocument === 'function') {
            console.log("📤 Updating shared_with:", members);
            await window.updateDocument(uploadedDoc.id, { shared_with: members });
            console.log("✅ shared_with updated!");
          }
        }
      }
      
      // הוסף רשומה ב-sharedDocs
      if (typeof window.upsertSharedDocRecord === 'function') {
        await window.upsertSharedDocRecord({
          id: uploadedDoc.id,
          title: file.name,
          fileName: file.name,
          uploadedAt: Date.now(),
          category: [],
          recipient: [],
          fileUrl: uploadedDoc.fileUrl || uploadedDoc.file_url || uploadedDoc.downloadURL || 
                   `${API_BASE}/api/docs/${uploadedDoc.id}/download`
        }, folderId);
      }
      
      if (typeof window.hideLoading === 'function') {
        window.hideLoading();
      }
      if (typeof window.showNotification === 'function') {
        window.showNotification("המסמך הועלה בהצלחה! ✅");
      }
      
      // רענן תצוגה
      const docsBox = document.querySelector(".docs-grid");
      if (docsBox) {
        await loadAndDisplaySharedDocs(folderId, docsBox);
      }
      
    } catch (err) {
      console.error("Upload error:", err);
      if (typeof window.hideLoading === 'function') {
        window.hideLoading();
      }
      if (typeof window.showNotification === 'function') {
        window.showNotification("שגיאה בהעלאת המסמך", true);
      }
    }
  };
  
  input.click();
}

// ===== פונקציה 9: שיוך מסמך קיים לתיקייה =====
async function handleAssignExistingDoc(folderId) {
  console.log("🔗 Opening document selector for folder:", folderId);
  
  if (typeof window.showLoading === 'function') {
    window.showLoading("טוען רשימת מסמכים...");
  }
  
  try {
    // טען את כל המסמכים של המשתמש
    const API_BASE = window.API_BASE || 
      (location.hostname === 'localhost' ? 'http://localhost:8787' : 'https://eco-files.onrender.com');
    const myEmail = window.getCurrentUserEmail ? window.getCurrentUserEmail() : "";
    
    const response = await fetch(`${API_BASE}/api/docs`, {
      headers: { "X-Dev-Email": myEmail }
    });
    
    if (!response.ok) throw new Error("Failed to load documents");
    const allDocs = await response.json();
    
    // סנן מסמכים שכבר בתיקייה הזו
    let docsInFolder = [];
    if (window.isFirebaseAvailable && window.isFirebaseAvailable()) {
      docsInFolder = await window.fetchSharedFolderDocsFromFirestore(folderId);
    }
    const docsInFolderIds = new Set(docsInFolder.map(d => d.id));
    
    const availableDocs = allDocs.filter(d => !docsInFolderIds.has(d.id) && !d.trashed);
    
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    }
    
    if (availableDocs.length === 0) {
      if (typeof window.showNotification === 'function') {
        window.showNotification("אין מסמכים זמינים לשיוך", true);
      }
      return;
    }
    
    // צור modal לבחירת מסמך
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    `;
    
    const content = document.createElement("div");
    content.style.cssText = `
      background: #0f1919;
      border: 1px solid #2b3c3c;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      color: #e0f0ee;
    `;
    
    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #38c5a8;">בחרי מסמך לשיוך</h3>
      <div id="docs-selector" style="display: flex; flex-direction: column; gap: 8px;"></div>
      <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
        <button id="cancel-assign" class="btn-cozy" style="background: #444;">ביטול</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    const selector = content.querySelector("#docs-selector");
    
    availableDocs.forEach(doc => {
      const item = document.createElement("div");
      item.style.cssText = `
        padding: 12px;
        border: 1px solid #2b3c3c;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        background: #101a1a;
      `;
      
      item.innerHTML = `
        <div style="font-weight: bold;">${doc.title || doc.file_name}</div>
        <div style="font-size: 0.85em; opacity: 0.7; margin-top: 4px;">
          ${doc.category || 'ללא קטגוריה'} • ${doc.year || '-'}
        </div>
      `;
      
      item.onmouseover = () => {
        item.style.background = '#1a2828';
        item.style.borderColor = '#38c5a8';
      };
      
      item.onmouseout = () => {
        item.style.background = '#101a1a';
        item.style.borderColor = '#2b3c3c';
      };
      
      item.onclick = async () => {
        document.body.removeChild(modal);
        await assignDocToFolder(doc.id, folderId);
      };
      
      selector.appendChild(item);
    });
    
    content.querySelector("#cancel-assign").onclick = () => {
      document.body.removeChild(modal);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };
    
  } catch (err) {
    console.error("❌ Failed to load documents:", err);
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    }
    if (typeof window.showNotification === 'function') {
      window.showNotification("שגיאה בטעינת רשימת המסמכים", true);
    }
  }
}

// ===== פונקציה 10: שיוך מסמך ספציפי לתיקייה =====
async function assignDocToFolder(docId, folderId) {
  console.log("🔗 Assigning doc to folder:", { docId, folderId });
  
  if (typeof window.showLoading === 'function') {
    window.showLoading("משייך מסמך...");
  }
  
  try {
    const myEmail = window.getCurrentUserEmail ? window.getCurrentUserEmail() : "";
    
    if (!window.isFirebaseAvailable || !window.isFirebaseAvailable()) {
      throw new Error("Firebase לא זמין");
    }
    
    // קבל פרטי המסמך
    const API_BASE = window.API_BASE || 
      (location.hostname === 'localhost' ? 'http://localhost:8787' : 'https://eco-files.onrender.com');
    
    const response = await fetch(`${API_BASE}/api/docs`, {
      headers: { "X-Dev-Email": myEmail }
    });
    
    if (!response.ok) throw new Error("Failed to load document");
    const allDocs = await response.json();
    const doc = allDocs.find(d => d.id === docId);
    
    if (!doc) throw new Error("מסמך לא נמצא");
    
    // קבל את חברי התיקייה
    const folderRef = window.fs.doc(window.db, "sharedFolders", folderId);
    const folderSnap = await window.fs.getDoc(folderRef);
    
    if (!folderSnap.exists()) throw new Error("תיקייה לא נמצאה");
    
    const members = (folderSnap.data().members || [])
      .map(e => e.toLowerCase())
      .filter(e => e !== myEmail.toLowerCase());
    
    // עדכן את shared_with של המסמך
    if (members.length > 0 && typeof window.updateDocument === 'function') {
      console.log("📤 Updating shared_with:", members);
      await window.updateDocument(docId, { shared_with: members });
    }
    
    // הוסף רשומה ב-sharedDocs
    if (typeof window.upsertSharedDocRecord === 'function') {
      await window.upsertSharedDocRecord({
        id: doc.id,
        title: doc.title || doc.file_name,
        fileName: doc.file_name,
        uploadedAt: doc.uploaded_at || Date.now(),
        category: doc.category ? [doc.category] : [],
        recipient: doc.recipient || [],
        fileUrl: doc.fileUrl || doc.file_url || `${API_BASE}/api/docs/${doc.id}/download`
      }, folderId);
    }
    
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    }
    if (typeof window.showNotification === 'function') {
      window.showNotification("המסמך שויך לתיקייה בהצלחה! ✅");
    }
    
    // רענן תצוגה
    const docsBox = document.querySelector(".docs-grid");
    if (docsBox) {
      await loadAndDisplaySharedDocs(folderId, docsBox);
    }
    
  } catch (err) {
    console.error("❌ Assign error:", err);
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    }
    if (typeof window.showNotification === 'function') {
      window.showNotification("שגיאה בשיוך המסמך: " + err.message, true);
    }
  }
}

// ===== חיבור לwindow =====
window.trackCurrentFolder = trackCurrentFolder;
window.getCurrentFolderId = getCurrentFolderId;
window.openSharedFolder = openSharedFolder;
window.handleAssignExistingDoc = handleAssignExistingDoc;

console.log("✅ Shared folders navigation fix loaded!");
console.log("✅ תיקון 1: ניווט בין תיקיות");
console.log("✅ תיקון 2: שיוך מסמכים קיימים");
console.log("✅ תיקון 3: מעקב אחר תיקייה נוכחית");