// ========================================
// 📋 קומפוננטה להצגת קבצים ממתינים לשיתוף
// ========================================

// 🔧 הגדרות - **עדכני את זה לפי הסביבה שלך**
const API_CONFIG = {
  // אם את עובדת עם Firebase, תשאירי ריק
  // אם יש שרת backend, שימי את ה-URL כאן
  serverUrl: '', // לדוגמה: 'https://your-server.com' או '' אם Firebase בלבד
  
  // האם להשתמש ב-Firestore לניהול pending shares
  useFirestore: true
};

/**
 * פונקציה לטעינת קבצים ממתינים מהשרת
 */
async function loadPendingShares() {
  try {
    // אם משתמשים ב-Firestore
    if (API_CONFIG.useFirestore && window.db && window.firestore) {
      const userEmail = getCurrentUserEmail();
      if (!userEmail) {
        console.warn('⚠️ No user email found');
        return [];
      }

      const pendingRef = window.firestore.collection(window.db, 'pendingShares');
      const q = window.firestore.query(
        pendingRef,
        window.firestore.where('toUser', '==', userEmail.toLowerCase())
      );
      
      const snapshot = await window.firestore.getDocs(q);
      
      const pending = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // טוען פרטי המסמך
        const docRef = window.firestore.doc(window.db, 'documents', data.docId);
        const docSnapshot = await window.firestore.getDoc(docRef);
        
        if (docSnapshot.exists()) {
          const docData = docSnapshot.data();
          pending.push({
            pendingId: docSnap.id,
            docId: data.docId,
            fromUser: data.fromUser,
            fileName: docData.fileName || 'ללא שם',
            fileSize: docData.fileSize || 0,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        }
      }
      
      return pending;
    }
    
    // אם משתמשים בשרת Backend
    if (API_CONFIG.serverUrl) {
      const response = await fetch(`${API_CONFIG.serverUrl}/api/pending-shares`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': getCurrentUserEmail()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load pending shares');
      }

      const data = await response.json();
      return data.pending || [];
    }
    
    // אין הגדרה - מחזיר מערך ריק
    console.warn('⚠️ No API configuration found');
    return [];
    
  } catch (error) {
    console.error('❌ Error loading pending shares:', error);
    return [];
  }
}

/**
 * פונקציה לקבלת קובץ ממתין
 */
async function acceptPendingShare(pendingId, docId) {
  try {
    // בדיקת מקום לפני הכל
    if (window.subscriptionManager) {
      const info = await window.subscriptionManager.getSubscriptionInfo();
      const availableSpace = info.storage.limit - info.storage.used;
      
      if (availableSpace <= 0) {
        throw new Error('אין מספיק מקום באחסון');
      }
    }

    // אם משתמשים ב-Firestore
    if (API_CONFIG.useFirestore && window.db && window.firestore) {
      const userEmail = getCurrentUserEmail();
      if (!userEmail) {
        throw new Error('לא מחובר');
      }

      // 1. טוען את המסמך
      const docRef = window.firestore.doc(window.db, 'documents', docId);
      const docSnapshot = await window.firestore.getDoc(docRef);
      
      if (!docSnapshot.exists()) {
        throw new Error('המסמך לא נמצא');
      }

      const docData = docSnapshot.data();
      const fileSize = Number(docData.fileSize || 0);

      // 2. בדיקה נוספת של מקום
      if (window.subscriptionManager) {
        const check = await window.subscriptionManager.canPerformAction('upload_file', {
          fileSize: fileSize
        });
        
        if (!check.allowed) {
          throw new Error(check.reason || 'אין מספיק מקום');
        }
      }

      // 3. מוסיף את המשתמש ל-sharedWith
      let sharedWith = docData.sharedWith || [];
      if (!Array.isArray(sharedWith)) {
        sharedWith = Object.keys(sharedWith);
      }
      
      if (!sharedWith.includes(userEmail.toLowerCase())) {
        sharedWith.push(userEmail.toLowerCase());
      }

      await window.firestore.updateDoc(docRef, {
        sharedWith: sharedWith
      });

      // 4. מוחק את הרשומה מ-pendingShares
      const pendingDocRef = window.firestore.doc(window.db, 'pendingShares', pendingId);
      await window.firestore.deleteDoc(pendingDocRef);

      // 5. מעדכן את השימוש באחסון
      if (window.subscriptionManager) {
        await window.subscriptionManager.updateStorageUsage(fileSize);
      }

      return {
        success: true,
        docId: docId,
        message: 'הקובץ נוסף בהצלחה'
      };
    }

    // אם משתמשים בשרת Backend
    if (API_CONFIG.serverUrl) {
      const response = await fetch(`${API_CONFIG.serverUrl}/api/accept-pending/${pendingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': getCurrentUserEmail()
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept share');
      }

      const data = await response.json();
      return data;
    }

    throw new Error('אין הגדרת API');
    
  } catch (error) {
    console.error('❌ Error accepting pending share:', error);
    throw error;
  }
}

/**
 * פונקציה לדחיית קובץ ממתין
 */
async function rejectPendingShare(pendingId) {
  try {
    // אם משתמשים ב-Firestore
    if (API_CONFIG.useFirestore && window.db && window.firestore) {
      const pendingDocRef = window.firestore.doc(window.db, 'pendingShares', pendingId);
      await window.firestore.deleteDoc(pendingDocRef);
      
      return {
        success: true,
        message: 'הקובץ נדחה'
      };
    }

    // אם משתמשים בשרת Backend
    if (API_CONFIG.serverUrl) {
      const response = await fetch(`${API_CONFIG.serverUrl}/api/pending-shares/${pendingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': getCurrentUserEmail()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reject share');
      }

      const data = await response.json();
      return data;
    }

    throw new Error('אין הגדרת API');
    
  } catch (error) {
    console.error('❌ Error rejecting pending share:', error);
    throw error;
  }
}

/**
 * פונקציה להצגת הודעה על קבצים ממתינים
 */
async function showPendingSharesNotification() {
  try {
    const pending = await loadPendingShares();
    
    if (pending.length === 0) {
      return; // אין קבצים ממתינים
    }

    // יצירת הודעה
    const message = pending.length === 1
      ? `יש לך קובץ אחד הממתין לשיתוף`
      : `יש לך ${pending.length} קבצים הממתינים לשיתוף`;

    // הצגת התראה
    if (window.showPendingFilesAlert) {
      const totalSize = pending.reduce((sum, item) => sum + (item.fileSize || 0), 0);
      window.showPendingFilesAlert(pending.length, totalSize);
    } else {
      // fallback - alert פשוט
      const result = confirm(message + '\nמפאת חוסר מקום, המערכת לא יכולה לקבל את הקבצים. האם לפתוח את החלון?');
      if (result) {
        await openPendingSharesModal();
      }
    }
  } catch (error) {
    console.error('❌ Error showing notification:', error);
  }
}

/**
 * פונקציה לפתיחת חלון עם רשימת הקבצים הממתינים
 */
async function openPendingSharesModal() {
  try {
    const pending = await loadPendingShares();
    
    if (pending.length === 0) {
      alert('אין קבצים ממתינים');
      return;
    }

    // סגירת מודל קודם אם קיים
    closePendingSharesModal();

    // יצירת HTML עבור המודל
    const modalHtml = `
      <div class="pending-shares-overlay" onclick="if(event.target === this) closePendingSharesModal()">
        <div class="pending-shares-modal" dir="rtl">
          <div class="modal-header">
            <h2>📂 קבצים ממתינים לשיתוף</h2>
            <button onclick="closePendingSharesModal()" class="close-btn">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="warning-message">
              ⚠️ הקבצים הבאים ממתינים לשיתוף איתך, אך אין לך מספיק מקום באחסון.
              על מנת לקבל את הקבצים, יש לשדרג את המסלול או למחוק קבצים ישנים.
            </div>
            
            <div class="pending-files-list">
              ${pending.map(item => `
                <div class="pending-file-item" data-pending-id="${item.pendingId}" data-doc-id="${item.docId}">
                  <div class="file-info">
                    <div class="file-icon">📄</div>
                    <div class="file-details">
                      <div class="file-name">${escapeHtml(item.fileName)}</div>
                      <div class="file-meta">
                        <span>מאת: ${escapeHtml(item.fromUser)}</span>
                        <span>גודל: ${formatBytes(item.fileSize)}</span>
                        <span>תאריך: ${formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="file-actions">
                    <button 
                      class="btn-accept" 
                      onclick="handleAcceptPending('${item.pendingId}', '${item.docId}')"
                      title="קבל קובץ (דורש מקום פנוי)">
                      ✓ קבל
                    </button>
                    <button 
                      class="btn-reject" 
                      onclick="handleRejectPending('${item.pendingId}')"
                      title="דחה קובץ">
                      ✕ דחה
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="modal-footer">
            <button onclick="openUpgradeModal()" class="btn-upgrade">
              🚀 שדרג מנוי
            </button>
            <button onclick="closePendingSharesModal()" class="btn-close">
              סגור
            </button>
          </div>
        </div>
      </div>
    `;

    // הוספת ה-HTML לדף
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error('❌ Error opening modal:', error);
    alert('שגיאה בטעינת קבצים ממתינים: ' + error.message);
  }
}

/**
 * פונקציה לטיפול בקבלת קובץ ממתין
 */
async function handleAcceptPending(pendingId, docId) {
  const button = event?.target;
  if (button) {
    button.disabled = true;
    button.textContent = '⏳ מעבד...';
  }

  try {
    // בדיקה אם יש מספיק מקום
    if (window.subscriptionManager) {
      const storageInfo = await window.subscriptionManager.getSubscriptionInfo();
      const availableSpace = storageInfo.storage.limit - storageInfo.storage.used;

      if (availableSpace <= 0) {
        alert('❌ אין מספיק מקום באחסון. יש למחוק קבצים או לשדרג את המנוי.');
        return;
      }
    }

    // ניסיון לקבל את הקובץ
    const result = await acceptPendingShare(pendingId, docId);
    
    // הצלחה!
    if (window.showSuccessAlert) {
      window.showSuccessAlert(result.message || 'הקובץ נוסף בהצלחה!');
    } else {
      alert('✅ ' + (result.message || 'הקובץ נוסף בהצלחה!'));
    }
    
    // רענון הרשימה
    await openPendingSharesModal();
    
    // רענון רשימת המסמכים אם יש
    if (window.loadDocuments) {
      await window.loadDocuments();
    }
    
  } catch (error) {
    console.error('❌ Error accepting file:', error);
    
    if (error.message.includes('אין מספיק מקום')) {
      alert('⚠️ עדיין אין מספיק מקום באחסון. יש למחוק קבצים נוספים או לשדרג את המנוי.');
    } else {
      alert('❌ שגיאה בקבלת הקובץ: ' + error.message);
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = '✓ קבל';
    }
  }
}

/**
 * פונקציה לטיפול בדחיית קובץ ממתין
 */
async function handleRejectPending(pendingId) {
  if (!confirm('האם אתה בטוח שברצונך לדחות קובץ זה?')) {
    return;
  }

  const button = event?.target;
  if (button) {
    button.disabled = true;
    button.textContent = '⏳ מוחק...';
  }

  try {
    await rejectPendingShare(pendingId);
    
    if (window.showSuccessAlert) {
      window.showSuccessAlert('הקובץ נדחה');
    } else {
      alert('✅ הקובץ נדחה');
    }
    
    // רענון הרשימה
    await openPendingSharesModal();
  } catch (error) {
    console.error('❌ Error rejecting file:', error);
    alert('❌ שגיאה בדחיית הקובץ: ' + error.message);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = '✕ דחה';
    }
  }
}

/**
 * פונקציות עזר
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getCurrentUserEmail() {
  // ניסיון למצוא את האימייל של המשתמש
  if (window.currentUser?.email) return window.currentUser.email;
  if (window.userEmail) return window.userEmail;
  if (localStorage.getItem('userEmail')) return localStorage.getItem('userEmail');
  if (window.auth?.currentUser?.email) return window.auth.currentUser.email;
  
  console.warn('⚠️ Could not find user email');
  return null;
}

function closePendingSharesModal() {
  const overlay = document.querySelector('.pending-shares-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function openUpgradeModal() {
  // פונקציה לפתיחת חלון שדרוג מנוי
  if (window.openSubscriptionModal) {
    window.openSubscriptionModal();
  } else {
    alert('שדרוג מנוי זמין בקרוב!');
  }
}

// ========================================
// 🎨 CSS עבור המודל
// ========================================
const styles = `
<style>
.pending-shares-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.pending-shares-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 20px;
  max-height: calc(80vh - 180px);
  overflow-y: auto;
}

.warning-message {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404;
  line-height: 1.6;
}

.pending-files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pending-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  transition: all 0.2s;
}

.pending-file-item:hover {
  background: #e9ecef;
  border-color: #adb5bd;
  transform: translateX(-2px);
}

.file-info {
  display: flex;
  gap: 15px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.file-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #6c757d;
  flex-wrap: wrap;
}

.file-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.file-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 14px;
  white-space: nowrap;
}

.file-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-accept {
  background: #28a745;
  color: white;
}

.btn-accept:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.btn-reject {
  background: #dc3545;
  color: white;
}

.btn-reject:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.modal-footer button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-upgrade {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-upgrade:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-close {
  background: #6c757d;
  color: white;
}

.btn-close:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .pending-shares-modal {
    width: 95%;
    max-height: 90vh;
  }
  
  .file-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .file-actions {
    width: 100%;
    margin-top: 10px;
  }
  
  .file-actions button {
    flex: 1;
  }
  
  .pending-file-item {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
`;

// הוספת ה-CSS לדף
if (!document.getElementById('pending-shares-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'pending-shares-styles';
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}

// ========================================
// 🚀 אתחול - בדיקה אוטומטית בעת טעינת הדף
// ========================================
window.addEventListener('load', async () => {
  // המתן 3 שניות שהמשתמש יתחבר ו-Firestore יהיה מוכן
  setTimeout(async () => {
    try {
      await showPendingSharesNotification();
    } catch (error) {
      console.error('❌ Error showing pending shares notification:', error);
    }
  }, 3000);
});

// ייצוא לשימוש גלובלי
if (typeof window !== 'undefined') {
  window.pendingSharesManager = {
    loadPendingShares,
    acceptPendingShare,
    rejectPendingShare,
    showPendingSharesNotification,
    openPendingSharesModal
  };
}

console.log('✅ Pending Shares UI loaded successfully');