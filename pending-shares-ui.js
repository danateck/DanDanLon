// ========================================
// 📋 קומפוננטה להצגת קבצים ממתינים לשיתוף
// ========================================

/**
 * פונקציה לטעינת קבצים ממתינים מהשרת
 */
async function loadPendingShares() {
  try {
    const response = await fetch('YOUR_SERVER_URL/api/pending-shares', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': getCurrentUserEmail() // פונקציה שמחזירה את האימייל של המשתמש המחובר
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load pending shares');
    }

    const data = await response.json();
    return data.pending || [];
  } catch (error) {
    console.error('❌ Error loading pending shares:', error);
    return [];
  }
}

/**
 * פונקציה לקבלת קובץ ממתין
 */
async function acceptPendingShare(pendingId) {
  try {
    const response = await fetch(`YOUR_SERVER_URL/api/accept-pending/${pendingId}`, {
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
    const response = await fetch(`YOUR_SERVER_URL/api/pending-shares/${pendingId}`, {
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
  } catch (error) {
    console.error('❌ Error rejecting pending share:', error);
    throw error;
  }
}

/**
 * פונקציה להצגת הודעה על קבצים ממתינים
 */
async function showPendingSharesNotification() {
  const pending = await loadPendingShares();
  
  if (pending.length === 0) {
    return; // אין קבצים ממתינים
  }

  // יצירת הודעה
  const message = pending.length === 1
    ? `יש לך קובץ אחד הממתין לשיתוף`
    : `יש לך ${pending.length} קבצים הממתינים לשיתוף`;

  // הצגת התראה (ניתן להתאים לפי הספרייה שלך)
  showNotification({
    title: 'קבצים ממתינים',
    message: message + '\nמפאת חוסר מקום, המערכת לא יכולה לקבל את הקבצים. יש לשדרג את המסלול או למחוק קבצים ישנים.',
    type: 'warning',
    action: () => openPendingSharesModal()
  });
}

/**
 * פונקציה לפתיחת חלון עם רשימת הקבצים הממתינים
 */
async function openPendingSharesModal() {
  const pending = await loadPendingShares();
  
  if (pending.length === 0) {
    alert('אין קבצים ממתינים');
    return;
  }

  // יצירת HTML עבור המודל
  const html = `
    <div class="pending-shares-modal" dir="rtl">
      <div class="modal-header">
        <h2>קבצים ממתינים לשיתוף</h2>
        <button onclick="closePendingSharesModal()">✕</button>
      </div>
      
      <div class="modal-body">
        <p class="warning-message">
          ⚠️ הקבצים הבאים ממתינים לשיתוף איתך, אך אין לך מספיק מקום באחסון.
          על מנת לקבל את הקבצים, יש לשדרג את המסלול או למחוק קבצים ישנים.
        </p>
        
        <div class="pending-files-list">
          ${pending.map(item => `
            <div class="pending-file-item" data-pending-id="${item.pendingId}">
              <div class="file-info">
                <div class="file-icon">📄</div>
                <div class="file-details">
                  <div class="file-name">${item.fileName}</div>
                  <div class="file-meta">
                    <span>מאת: ${item.fromUser}</span>
                    <span>גודל: ${formatBytes(item.fileSize)}</span>
                    <span>תאריך: ${formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div class="file-actions">
                <button 
                  class="btn-accept" 
                  onclick="handleAcceptPending(${item.pendingId})"
                  title="קבל קובץ (דורש מקום פנוי)">
                  ✓ קבל
                </button>
                <button 
                  class="btn-reject" 
                  onclick="handleRejectPending(${item.pendingId})"
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
  `;

  // הוספת ה-HTML לדף (ניתן להתאים לפי המערכת שלך)
  document.body.insertAdjacentHTML('beforeend', html);
}

/**
 * פונקציה לטיפול בקבלת קובץ ממתין
 */
async function handleAcceptPending(pendingId) {
  try {
    // בדיקה אם יש מספיק מקום
    const storageInfo = await window.subscriptionManager.getSubscriptionInfo();
    const availableSpace = storageInfo.storage.limit - storageInfo.storage.used;

    if (availableSpace <= 0) {
      alert('אין מספיק מקום באחסון. יש למחוק קבצים או לשדרג את המנוי.');
      return;
    }

    // ניסיון לקבל את הקובץ
    const result = await acceptPendingShare(pendingId);
    
    // הצלחה!
    alert('✅ ' + result.message);
    
    // רענון הרשימה
    await openPendingSharesModal();
    
    // רענון רשימת המסמכים
    await window.documentManager.loadDocuments();
    
  } catch (error) {
    if (error.message.includes('אין מספיק מקום')) {
      alert('⚠️ עדיין אין מספיק מקום באחסון. יש למחוק קבצים נוספים או לשדרג את המנוי.');
    } else {
      alert('❌ שגיאה בקבלת הקובץ: ' + error.message);
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

  try {
    await rejectPendingShare(pendingId);
    alert('✅ הקובץ נדחה');
    
    // רענון הרשימה
    await openPendingSharesModal();
  } catch (error) {
    alert('❌ שגיאה בדחיית הקובץ: ' + error.message);
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

function getCurrentUserEmail() {
  // להחליף בהתאם למערכת ההתחברות שלך
  return window.currentUser?.email || localStorage.getItem('userEmail');
}

function closePendingSharesModal() {
  const modal = document.querySelector('.pending-shares-modal');
  if (modal) {
    modal.remove();
  }
}

function openUpgradeModal() {
  // פונקציה לפתיחת חלון שדרוג מנוי - להוסיף בהתאם למערכת שלך
  console.log('Opening upgrade modal...');
}

function showNotification(options) {
  // פונקציה להצגת התראות - להוסיף בהתאם למערכת שלך
  console.log('Notification:', options);
}

// ========================================
// 🎨 CSS עבור המודל
// ========================================
const styles = `
<style>
.pending-shares-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  z-index: 10000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.modal-header button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
}

.modal-header button:hover {
  color: #e74c3c;
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
}

.file-info {
  display: flex;
  gap: 15px;
  flex: 1;
}

.file-icon {
  font-size: 32px;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.file-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.file-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #6c757d;
}

.file-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.file-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-accept {
  background: #28a745;
  color: white;
}

.btn-accept:hover {
  background: #218838;
}

.btn-reject {
  background: #dc3545;
  color: white;
}

.btn-reject:hover {
  background: #c82333;
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
</style>
`;

// הוספת ה-CSS לדף
document.head.insertAdjacentHTML('beforeend', styles);

// ========================================
// 🚀 אתחול - בדיקה אוטומטית בעת טעינת הדף
// ========================================
window.addEventListener('load', async () => {
  // המתן שהמשתמש יתחבר
  setTimeout(async () => {
    await showPendingSharesNotification();
  }, 2000);
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